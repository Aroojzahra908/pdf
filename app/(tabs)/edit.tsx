import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button, Text, Card, Chip, ActivityIndicator } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { rotatePage, deletePages, reorderPages, getPdfPageInfo, loadPdfDocument } from '../../src/utils/pdfUtils';
import type { PdfPageInfo } from '../../src/utils/pdfUtils';

export default function EditPdfScreen() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [pages, setPages] = useState<PdfPageInfo[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (res.assets && res.assets[0]) {
        setLoading(true);
        setFileName(res.assets[0].name);
        setFileUri(res.assets[0].uri);
        
        // Load PDF and get page info
        const pdfDoc = await loadPdfDocument(res.assets[0].uri);
        const pageInfo = await getPdfPageInfo(pdfDoc);
        setPages(pageInfo);
        setSelectedPages(new Set());
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to load PDF');
    }
  };

  const togglePageSelection = (pageNum: number) => {
    const newSelection = new Set(selectedPages);
    if (newSelection.has(pageNum)) {
      newSelection.delete(pageNum);
    } else {
      newSelection.add(pageNum);
    }
    setSelectedPages(newSelection);
  };

  const rotateSelectedPages = async (direction: 'left' | 'right') => {
    if (!fileUri || selectedPages.size === 0) return;
    
    try {
      setLoading(true);
      const rotation = direction === 'left' ? -90 : 90;
      
      for (const pageNum of selectedPages) {
        const currentRotation = pages[pageNum - 1].rotation;
        const newRotation = (currentRotation + rotation) % 360;
        await rotatePage(fileUri, pageNum - 1, newRotation);
      }
      
      Alert.alert('Success', `Rotated ${selectedPages.size} page(s)`);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to rotate pages');
    }
  };

  const deleteSelectedPages = async () => {
    if (!fileUri || selectedPages.size === 0) return;
    
    Alert.alert(
      'Confirm Delete',
      `Delete ${selectedPages.size} page(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const indices = Array.from(selectedPages).map(p => p - 1);
              const newUri = await deletePages(fileUri, indices);
              
              // Reload PDF
              const pdfDoc = await loadPdfDocument(newUri);
              const pageInfo = await getPdfPageInfo(pdfDoc);
              setPages(pageInfo);
              setFileUri(newUri);
              setSelectedPages(new Set());
              setLoading(false);
              
              Alert.alert('Success', 'Pages deleted successfully');
            } catch (error) {
              setLoading(false);
              Alert.alert('Error', 'Failed to delete pages');
            }
          }
        }
      ]
    );
  };

  const saveAndShare = async () => {
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>✏️ Edit PDF</Text>
          <Text style={styles.subtitle}>
            Rotate, delete, and reorder pages with ease
          </Text>
        </Card.Content>
      </Card>

      <Button 
        mode="contained" 
        onPress={pickPdf} 
        style={styles.pickButton}
        icon="file-pdf-box"
      >
        Pick PDF to Edit
      </Button>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>Processing PDF...</Text>
        </View>
      )}

      {fileName && !loading && (
        <>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium">📄 {fileName}</Text>
              <Text style={styles.pageCount}>{pages.length} pages</Text>
              {selectedPages.size > 0 && (
                <Chip style={styles.selectionChip}>
                  {selectedPages.size} page(s) selected
                </Chip>
              )}
            </Card.Content>
          </Card>

          <View style={styles.actionButtons}>
            <Button 
              mode="outlined" 
              disabled={selectedPages.size === 0}
              onPress={() => rotateSelectedPages('left')}
              icon="rotate-left"
            >
              Rotate Left
            </Button>
            <Button 
              mode="outlined" 
              disabled={selectedPages.size === 0}
              onPress={() => rotateSelectedPages('right')}
              icon="rotate-right"
            >
              Rotate Right
            </Button>
          </View>

          <View style={styles.actionButtons}>
            <Button 
              mode="outlined" 
              disabled={selectedPages.size === 0}
              onPress={deleteSelectedPages}
              icon="delete"
              textColor="#ff595e"
            >
              Delete Pages
            </Button>
            <Button 
              mode="contained" 
              onPress={saveAndShare}
              icon="share"
            >
              Save & Share
            </Button>
          </View>

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Pages (Tap to select)
          </Text>

          <View style={styles.pageGrid}>
            {pages.map((page) => (
              <TouchableOpacity
                key={page.pageNumber}
                onPress={() => togglePageSelection(page.pageNumber)}
              >
                <Card 
                  style={[
                    styles.pageCard,
                    selectedPages.has(page.pageNumber) && styles.pageCardSelected
                  ]}
                >
                  <Card.Content style={styles.pageCardContent}>
                    <Text variant="headlineSmall">📄</Text>
                    <Text variant="titleMedium">Page {page.pageNumber}</Text>
                    <Text style={styles.pageSize}>
                      {Math.round(page.width)} × {Math.round(page.height)}
                    </Text>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#f0f9ff', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#0fb5b1' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  pickButton: { borderRadius: 12 },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  pageCount: { opacity: 0.7, marginTop: 4 },
  selectionChip: { marginTop: 8, alignSelf: 'flex-start' },
  actionButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sectionTitle: { marginTop: 8, fontWeight: '600' },
  pageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pageCard: { 
    width: 100, 
    borderRadius: 12, 
    backgroundColor: '#fff',
    elevation: 2
  },
  pageCardSelected: { 
    backgroundColor: '#e0f7f7', 
    borderWidth: 2, 
    borderColor: '#0fb5b1' 
  },
  pageCardContent: { alignItems: 'center', gap: 4 },
  pageSize: { fontSize: 10, opacity: 0.6 }
});
