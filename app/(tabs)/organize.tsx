import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Text, Card, ActivityIndicator, IconButton } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { PDFDocument } from 'pdf-lib';

interface PageItem {
  id: string;
  pageNumber: number;
  label: string;
}

export default function OrganizePdfScreen() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<PageItem[]>([]);

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (res.assets && res.assets[0]) {
        setFileName(res.assets[0].name || 'document.pdf');
        setFileUri(res.assets[0].uri);
        
        // Get page count
        const pdfBytes = await (FileSystem as any).readAsStringAsync(res.assets[0].uri, {
          encoding: (FileSystem as any).EncodingType.Base64,
        });
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pageCount = pdfDoc.getPageCount();
        
        const pageItems: PageItem[] = Array.from({ length: pageCount }, (_, i) => ({
          id: `page-${i}`,
          pageNumber: i,
          label: `Page ${i + 1}`,
        }));
        
        setPages(pageItems);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick PDF');
    }
  };

  const organizePdf = async () => {
    if (!fileUri || pages.length === 0) return;

    try {
      setLoading(true);

      const pdfBytes = await (FileSystem as any).readAsStringAsync(fileUri, {
        encoding: (FileSystem as any).EncodingType.Base64,
      });
      
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const newPdfDoc = await PDFDocument.create();
      
      // Copy pages in new order
      for (const pageItem of pages) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageItem.pageNumber]);
        newPdfDoc.addPage(copiedPage);
      }
      
      const organizedBytes = await newPdfDoc.save();
      const outputUri = `${(FileSystem as any).documentDirectory}organized_${Date.now()}.pdf`;
      
      const base64 = btoa(String.fromCharCode(...Array.from(organizedBytes)));
      await (FileSystem as any).writeAsStringAsync(outputUri, base64, {
        encoding: (FileSystem as any).EncodingType.Base64,
      });
      
      setFileUri(outputUri);
      setLoading(false);
      Alert.alert('Success', 'PDF organized successfully!');
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to organize PDF');
    }
  };

  const deletePage = (id: string) => {
    Alert.alert(
      'Delete Page',
      'Are you sure you want to delete this page?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setPages(pages.filter(p => p.id !== id))
        }
      ]
    );
  };

  const movePageUp = (index: number) => {
    if (index === 0) return;
    const newPages = [...pages];
    [newPages[index - 1], newPages[index]] = [newPages[index], newPages[index - 1]];
    setPages(newPages);
  };

  const movePageDown = (index: number) => {
    if (index === pages.length - 1) return;
    const newPages = [...pages];
    [newPages[index], newPages[index + 1]] = [newPages[index + 1], newPages[index]];
    setPages(newPages);
  };

  const shareFile = async () => {
    if (!fileUri) return;
    
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', `PDF saved to: ${fileUri}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share PDF');
    }
  };

  const renderItem = (item: PageItem, index: number) => {
    return (
      <Card key={item.id} style={styles.pageCard}>
        <Card.Content style={styles.pageCardContent}>
          <View style={styles.pageInfo}>
            <Text variant="headlineSmall">📄</Text>
            <Text variant="titleMedium">{item.label}</Text>
          </View>
          <View style={styles.pageActions}>
            <IconButton
              icon="arrow-up"
              size={20}
              disabled={index === 0}
              onPress={() => movePageUp(index)}
            />
            <IconButton
              icon="arrow-down"
              size={20}
              disabled={index === pages.length - 1}
              onPress={() => movePageDown(index)}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor="#ff595e"
              onPress={() => deletePage(item.id)}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>📑 Organize PDF</Text>
          <Text style={styles.subtitle}>
            Reorder and delete pages in your PDF
          </Text>
        </Card.Content>
      </Card>

      <Button 
        mode="contained" 
        onPress={pickPdf} 
        style={styles.pickButton}
        icon="file-pdf-box"
      >
        Select PDF to Organize
      </Button>

      {fileName && !loading && pages.length > 0 && (
        <>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium">📄 {fileName}</Text>
              <Text style={styles.pageCountText}>{pages.length} pages</Text>
              <Text style={styles.instructionText}>
                Use arrow buttons to reorder pages
              </Text>
            </Card.Content>
          </Card>

          <View style={styles.pagesContainer}>
            {pages.map((item, index) => renderItem(item, index))}
          </View>

          <View style={styles.actionButtons}>
            <Button 
              mode="contained" 
              onPress={organizePdf}
              icon="check"
              style={styles.organizeButton}
            >
              Save Organization
            </Button>
            <Button 
              mode="outlined" 
              onPress={shareFile}
              icon="share"
            >
              Share PDF
            </Button>
          </View>
        </>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3f51b5" />
          <Text>Organizing PDF...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#e8eaf6', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#3f51b5' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  pickButton: { borderRadius: 12, backgroundColor: '#3f51b5' },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  pageCountText: { marginTop: 4, opacity: 0.7 },
  instructionText: { marginTop: 8, fontSize: 12, fontStyle: 'italic', color: '#666' },
  pagesContainer: { minHeight: 200 },
  pageCard: { 
    marginBottom: 12, 
    borderRadius: 12, 
    backgroundColor: '#fff',
    elevation: 2
  },
  pageCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pageActions: { flexDirection: 'row', alignItems: 'center' },
  actionButtons: { gap: 12 },
  organizeButton: { backgroundColor: '#3f51b5' },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
});
