import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, SafeAreaView } from 'react-native';
import { Button, Text, Card, Chip, ActivityIndicator } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { rotatePage, deletePages, getPdfPageInfo, loadPdfDocument, savePdfDocument } from '../../src/utils/pdfUtils';
import { PDFViewer } from '../../src/components/PDFViewer';
import { handlePdfError, validateSelection } from '../../src/utils/errorHandler';
import type { PdfPageInfo } from '../../src/utils/pdfUtils';

export default function EditPdfScreen() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [pages, setPages] = useState<PdfPageInfo[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

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

  const selectAllPages = () => {
    if (selectedPages.size === pages.length) {
      setSelectedPages(new Set());
    } else {
      const allPages = new Set(pages.map((p) => p.pageNumber));
      setSelectedPages(allPages);
    }
  };

  const rotateSelectedPages = async (direction: 'left' | 'right') => {
    if (!fileUri || selectedPages.size === 0) {
      Alert.alert('Select Pages', 'Please select at least one page');
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
        page.setRotation((newRotation / 90) as any);
      }

      const newUri = await savePdfDocument(currentPdf, `rotated_${Date.now()}.pdf`);
      setFileUri(newUri);

      const updatedPdf = await loadPdfDocument(newUri);
      const updatedPageInfo = await getPdfPageInfo(updatedPdf);
      setPages(updatedPageInfo);
      const size = selectedPages.size;
      setSelectedPages(new Set());

      Alert.alert('Success', `Rotated ${size} page(s) ${direction === 'left' ? 'left' : 'right'}`);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Rotation error:', error);
      Alert.alert('Error', `Failed to rotate pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const deleteSelectedPages = async () => {
    try {
      validateSelection(selectedPages.size);

      if (!fileUri) {
        Alert.alert('Error', 'PDF file not found');
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
                  .map((p) => p - 1)
                  .sort((a, b) => b - a);

                const newUri = await deletePages(fileUri, indices);

                const pdfDoc = await loadPdfDocument(newUri);
                const pageInfo = await getPdfPageInfo(pdfDoc);
                setPages(pageInfo);
                setFileUri(newUri);
                const deletedCount = selectedPages.size;
                setSelectedPages(new Set());
                setLoading(false);

                Alert.alert('Success', `Deleted ${deletedCount} page(s)`);
              } catch (error) {
                setLoading(false);
                const errorMsg = handlePdfError(error, 'Deleting pages');
                Alert.alert('Error', errorMsg);
              }
            },
          },
        ]
      );
    } catch (error) {
      const errorMsg = handlePdfError(error, 'Delete pages');
      Alert.alert('Error', errorMsg);
    }
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
    <SafeAreaView style={styles.container}>
      {!showPdfViewer ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Card style={styles.headerCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.title}>✏️ Edit PDF</Text>
              <Text style={styles.subtitle}>Select pages to rotate, delete or share</Text>
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={pickPdf}
            style={styles.pickButton}
            icon="file-pdf-box"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Select PDF'}
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
                  <Text variant="labelLarge" style={styles.fileName}>
                    📄 {fileName}
                  </Text>
                  <Text style={styles.pageCount}>{pages.length} pages</Text>
                  {selectedPages.size > 0 && (
                    <Chip style={styles.selectionChip} icon="check">
                      {selectedPages.size} selected
                    </Chip>
                  )}
                </Card.Content>
              </Card>

              <View style={styles.actionSection}>
                <Button
                  mode="text"
                  onPress={selectAllPages}
                  style={styles.selectAllButton}
                  labelStyle={styles.selectAllLabel}
                >
                  {selectedPages.size === pages.length ? '✓ Deselect All' : 'Select All'}
                </Button>
              </View>

              <View style={styles.actionButtons}>
                <Button
                  mode="outlined"
                  disabled={selectedPages.size === 0}
                  onPress={() => rotateSelectedPages('left')}
                  icon="rotate-left"
                  style={styles.actionButton}
                  compact
                >
                  Rotate
                </Button>
                <Button
                  mode="outlined"
                  disabled={selectedPages.size === 0}
                  onPress={deleteSelectedPages}
                  icon="delete"
                  textColor="#ff6b6b"
                  style={styles.actionButton}
                  compact
                >
                  Delete
                </Button>
              </View>

              <View style={styles.actionButtons}>
                <Button
                  mode="contained"
                  onPress={() => setShowPdfViewer(true)}
                  icon="eye"
                  style={styles.actionButton}
                  compact
                >
                  View
                </Button>
                <Button
                  mode="contained"
                  onPress={saveAndShare}
                  icon="share"
                  style={styles.actionButton}
                  compact
                >
                  Save
                </Button>
              </View>

              <Text variant="titleSmall" style={styles.sectionTitle}>
                Pages
              </Text>

              <View style={styles.pageGrid}>
                {pages.map((page) => (
                  <TouchableOpacity key={page.pageNumber} onPress={() => togglePageSelection(page.pageNumber)}>
                    <Card
                      style={[
                        styles.pageCard,
                        selectedPages.has(page.pageNumber) && styles.pageCardSelected,
                      ]}
                    >
                      <Card.Content style={styles.pageCardContent}>
                        <Text style={styles.pageNumber}>
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
        <Modal visible={showPdfViewer} animationType="fade" onRequestClose={() => setShowPdfViewer(false)}>
          <PDFViewer uri={fileUri || ''} onClose={() => setShowPdfViewer(false)} />
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  headerCard: {
    backgroundColor: '#2d2d44',
    borderRadius: 14,
    marginBottom: 14,
    borderLeftColor: '#ff6b6b',
    borderLeftWidth: 3,
  },
  title: {
    fontWeight: '700',
    color: '#ff6b6b',
  },
  subtitle: {
    color: '#b0b0b0',
    marginTop: 4,
    fontSize: 13,
  },
  pickButton: {
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#ff6b6b',
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 13,
  },
  infoCard: {
    backgroundColor: '#2d2d44',
    borderRadius: 10,
    marginBottom: 12,
  },
  fileName: {
    color: '#ffffff',
  },
  pageCount: {
    color: '#b0b0b0',
    marginTop: 4,
    fontSize: 12,
  },
  selectionChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#ff6b6b',
  },
  actionSection: {
    marginBottom: 10,
    alignItems: 'center',
  },
  selectAllButton: {
    minWidth: 120,
  },
  selectAllLabel: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
  },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  pageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 10,
  },
  pageCard: {
    width: 70,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#2d2d44',
    justifyContent: 'center',
  },
  pageCardSelected: {
    backgroundColor: '#ff6b6b',
  },
  pageCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  pageNumber: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
