import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Button, Text, Card, ActivityIndicator, Chip } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { PDFDocument, degrees } from 'pdf-lib';

export default function RotatePdfScreen() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rotationAngle, setRotationAngle] = useState(90);

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
        setPageCount(pdfDoc.getPageCount());
        setSelectedPages(new Set());
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick PDF');
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

  const selectAllPages = () => {
    const allPages = new Set<number>();
    for (let i = 1; i <= pageCount; i++) {
      allPages.add(i);
    }
    setSelectedPages(allPages);
  };

  const rotatePdf = async () => {
    if (!fileUri || selectedPages.size === 0) {
      Alert.alert('Error', 'Please select pages to rotate');
      return;
    }

    try {
      setLoading(true);

      const pdfBytes = await (FileSystem as any).readAsStringAsync(fileUri, {
        encoding: (FileSystem as any).EncodingType.Base64,
      });
      
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      
      // Rotate selected pages
      selectedPages.forEach(pageNum => {
        const page = pages[pageNum - 1];
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees(currentRotation + rotationAngle));
      });
      
      const rotatedBytes = await pdfDoc.save();
      const outputUri = `${(FileSystem as any).documentDirectory}rotated_${Date.now()}.pdf`;
      
      const base64 = btoa(String.fromCharCode(...Array.from(rotatedBytes)));
      await (FileSystem as any).writeAsStringAsync(outputUri, base64, {
        encoding: (FileSystem as any).EncodingType.Base64,
      });
      
      setFileUri(outputUri);
      setSelectedPages(new Set());
      setLoading(false);
      Alert.alert('Success', `Rotated ${selectedPages.size} page(s) successfully!`);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to rotate PDF');
    }
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>🔄 Rotate PDF</Text>
          <Text style={styles.subtitle}>
            Rotate pages in your PDF document
          </Text>
        </Card.Content>
      </Card>

      <Button 
        mode="contained" 
        onPress={pickPdf} 
        style={styles.pickButton}
        icon="file-pdf-box"
      >
        Select PDF to Rotate
      </Button>

      {fileName && !loading && (
        <>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium">📄 {fileName}</Text>
              <Text style={styles.pageCountText}>{pageCount} pages</Text>
              {selectedPages.size > 0 && (
                <Chip style={styles.selectionChip}>
                  {selectedPages.size} page(s) selected
                </Chip>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.rotationCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Rotation Angle</Text>
              <View style={styles.rotationButtons}>
                <Chip
                  selected={rotationAngle === 90}
                  onPress={() => setRotationAngle(90)}
                  icon="rotate-right"
                >
                  90° Right
                </Chip>
                <Chip
                  selected={rotationAngle === 180}
                  onPress={() => setRotationAngle(180)}
                  icon="rotate-180"
                >
                  180°
                </Chip>
                <Chip
                  selected={rotationAngle === 270}
                  onPress={() => setRotationAngle(270)}
                  icon="rotate-left"
                >
                  90° Left
                </Chip>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.pagesCard}>
            <Card.Content>
              <View style={styles.pageHeader}>
                <Text variant="titleMedium">Select Pages</Text>
                <Button mode="text" onPress={selectAllPages}>
                  Select All
                </Button>
              </View>
              <View style={styles.pageGrid}>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map(pageNum => (
                  <TouchableOpacity
                    key={pageNum}
                    onPress={() => togglePageSelection(pageNum)}
                  >
                    <Card 
                      style={[
                        styles.pageCard,
                        selectedPages.has(pageNum) && styles.pageCardSelected
                      ]}
                    >
                      <Card.Content style={styles.pageCardContent}>
                        <Text variant="headlineSmall">📄</Text>
                        <Text variant="titleSmall">{pageNum}</Text>
                      </Card.Content>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            </Card.Content>
          </Card>

          <View style={styles.actionButtons}>
            <Button 
              mode="contained" 
              onPress={rotatePdf}
              icon="rotate-right"
              style={styles.rotateButton}
              disabled={selectedPages.size === 0}
            >
              Rotate Selected Pages
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
          <ActivityIndicator size="large" color="#ff9800" />
          <Text>Rotating pages...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#fff3e0', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#ff9800' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  pickButton: { borderRadius: 12, backgroundColor: '#ff9800' },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  pageCountText: { marginTop: 4, opacity: 0.7 },
  selectionChip: { marginTop: 8, alignSelf: 'flex-start' },
  rotationCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  sectionTitle: { marginBottom: 12, fontWeight: '600' },
  rotationButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pagesCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pageCard: { 
    width: 70, 
    borderRadius: 8, 
    backgroundColor: '#f5f5f5',
    elevation: 1
  },
  pageCardSelected: { 
    backgroundColor: '#ffe0b2', 
    borderWidth: 2, 
    borderColor: '#ff9800' 
  },
  pageCardContent: { alignItems: 'center', gap: 4, padding: 8 },
  actionButtons: { gap: 12 },
  rotateButton: { backgroundColor: '#ff9800' },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
});
