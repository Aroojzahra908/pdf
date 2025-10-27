import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Button, Text, Card, Chip, ActivityIndicator } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { rotatePage, deletePages, getPdfPageInfo, loadPdfDocument, savePdfDocument } from '../../src/utils/pdfUtils';
import { PDFViewer } from '../../src/components/PDFViewer';
import type { PdfPageInfo } from '../../src/utils/pdfUtils';

export default function EditPdfScreen() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [pages, setPages] = useState<PdfPageInfo[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [currentViewPage, setCurrentViewPage] = useState(1);

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (res.assets && res.assets[0]) {
        setLoading(true);
        setFileName(res.assets[0].name);
        setFileUri(res.assets[0].uri);
        
        const pdfDoc = await loadPdfDocument(res.assets[0].uri);
        const pageInfo = await getPdfPageInfo(pdfDoc);
        setPages(pageInfo);
        setSelectedPages(new Set());
        setCurrentViewPage(1);
        setShowPdfViewer(true);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to load PDF. Please try again.');
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
    if (selectedPages.size === pages.length) {
      setSelectedPages(new Set());
    } else {
      const allPages = new Set(pages.map(p => p.pageNumber));
      setSelectedPages(allPages);
    }
  };

  const rotateSelectedPages = async (direction: 'left' | 'right') => {
    if (!fileUri || selectedPages.size === 0) {
      Alert.alert('Select Pages', 'Please select at least one page to rotate');
      return;
    }
    
    try {
      setLoading(true);
      const rotation = direction === 'left' ? -90 : 90;
      let currentPdf = await loadPdfDocument(fileUri);

      for (const pageNum of Array.from(selectedPages).sort()) {
        const pageIndex = pageNum - 1;
        const page = currentPdf.getPage(pageIndex);
        const currentRotation = page.getRotation().angle;
        const newRotation = (currentRotation + rotation) % 360;
        page.setRotation(rotation > 0 ? (rotation / 90 * 90) : (rotation / 90 * 90));
      }

      const newUri = await savePdfDocument(currentPdf, `rotated_${Date.now()}.pdf`);
      setFileUri(newUri);
      
      const updatedPdf = await loadPdfDocument(newUri);
      const updatedPageInfo = await getPdfPageInfo(updatedPdf);
      setPages(updatedPageInfo);
      setSelectedPages(new Set());

      Alert.alert('Success', `Rotated ${selectedPages.size} page(s) ${direction === 'left' ? 'left' : 'right'}`);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to rotate pages');
    }
  };

  const deleteSelectedPages = async () => {
    if (!fileUri || selectedPages.size === 0) {
      Alert.alert('Select Pages', 'Please select at least one page to delete');
      return;
    }
    
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
              const indices = Array.from(selectedPages)
                .map(p => p - 1)
                .sort((a, b) => b - a);
              
              const newUri = await deletePages(fileUri, indices);
              
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
        Alert.alert('Success', 'PDF saved to storage');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share PDF');
    }
  };

  return (
    <View style={styles.container}>
      {!showPdfViewer ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.headerCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.title}>✏️ Edit PDF</Text>
              <Text style={styles.subtitle}>
                Select pages to rotate, delete, or mark
              </Text>
            </Card.Content>
          </Card>

          <Button 
            mode="contained" 
            onPress={pickPdf} 
            style={styles.pickButton}
            icon="file-pdf-box"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Pick PDF to Edit'}
          </Button>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ff6b6b" />
              <Text style={styles.loadingText}>Processing PDF...</Text>
            </View>
          )}

          {fileName && !loading && pages.length > 0 && (
            <>
              <Card style={styles.infoCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.fileName}>📄 {fileName}</Text>
                  <Text style={styles.pageCount}>{pages.length} pages</Text>
                  {selectedPages.size > 0 && (
                    <Chip style={styles.selectionChip} icon="check">
                      {selectedPages.size} page(s) selected
                    </Chip>
                  )}
                </Card.Content>
              </Card>

              <View style={styles.actionSection}>
                <Button 
                  mode="text"
                  onPress={selectAllPages}
                  style={styles.selectAllButton}
                >
                  {selectedPages.size === pages.length ? 'Deselect All' : 'Select All'}
                </Button>
              </View>

              <View style={styles.actionButtons}>
                <Button 
                  mode="outlined" 
                  disabled={selectedPages.size === 0}
                  onPress={() => rotateSelectedPages('left')}
                  icon="rotate-left"
                  style={styles.actionButton}
                >
                  Rotate Left
                </Button>
                <Button 
                  mode="outlined" 
                  disabled={selectedPages.size === 0}
                  onPress={() => rotateSelectedPages('right')}
                  icon="rotate-right"
                  style={styles.actionButton}
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
                  textColor="#ff6b6b"
                  style={styles.actionButton}
                >
                  Delete Pages
                </Button>
                <Button 
                  mode="contained" 
                  onPress={saveAndShare}
                  icon="share"
                  style={styles.actionButton}
                >
                  Save & Share
                </Button>
              </View>

              <Text variant="titleMedium" style={styles.sectionTitle}>
                Pages (Tap to select/mark)
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
                        <Text variant="titleMedium" style={styles.pageNumber}>
                          {selectedPages.has(page.pageNumber) ? '✓' : page.pageNumber}
                        </Text>
                      </Card.Content>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      ) : (
        <Modal 
          visible={showPdfViewer} 
          animationType="slide"
          onRequestClose={() => setShowPdfViewer(false)}
        >
          <PDFViewer 
            uri={fileUri || ''} 
            onClose={() => setShowPdfViewer(false)}
            onPageChange={(page, total) => {
              setCurrentViewPage(page);
            }}
          />
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#1a1a2e' 
  },
  scrollContent: { 
    paddingHorizontal: 16, 
    paddingVertical: 16, 
    paddingBottom: 40 
  },
  headerCard: { 
    backgroundColor: '#2d2d44', 
    borderRadius: 16,
    marginBottom: 16,
    borderLeftColor: '#ff6b6b',
    borderLeftWidth: 4,
  },
  title: { 
    fontWeight: 'bold', 
    color: '#ff6b6b' 
  },
  subtitle: { 
    color: '#e0e0e0', 
    marginTop: 4,
    fontSize: 14,
  },
  pickButton: { 
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#ff6b6b',
  },
  loadingContainer: { 
    alignItems: 'center', 
    gap: 12, 
    paddingVertical: 40 
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 14,
  },
  infoCard: { 
    backgroundColor: '#2d2d44', 
    borderRadius: 12, 
    marginBottom: 16,
    elevation: 2 
  },
  fileName: {
    color: '#ffffff',
    fontWeight: '600',
  },
  pageCount: { 
    color: '#b0b0b0', 
    marginTop: 4,
    fontSize: 14,
  },
  selectionChip: { 
    marginTop: 8, 
    alignSelf: 'flex-start',
    backgroundColor: '#ff6b6b',
  },
  actionSection: {
    marginBottom: 12,
    alignItems: 'center',
  },
  selectAllButton: {
    color: '#ff6b6b',
  },
  actionButtons: { 
    flexDirection: 'row', 
    gap: 8, 
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
  },
  sectionTitle: { 
    marginTop: 20,
    marginBottom: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  pageGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12,
    paddingBottom: 20,
  },
  pageCard: { 
    width: 80, 
    height: 100,
    borderRadius: 12, 
    backgroundColor: '#2d2d44',
    elevation: 2,
    justifyContent: 'center',
  },
  pageCardSelected: { 
    backgroundColor: '#ff6b6b', 
    borderWidth: 2, 
    borderColor: '#ffaa6b' 
  },
  pageCardContent: { 
    alignItems: 'center', 
    justifyContent: 'center',
    height: '100%',
  },
  pageNumber: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
