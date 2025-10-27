import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList } from 'react-native';
import { Button, Text, Card, TextInput, ActivityIndicator, Chip } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { extractPages, loadPdfDocument } from '../../src/utils/pdfUtils';

interface PdfFile {
  name: string;
  uri: string;
}

export default function ExtractPagesScreen() {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pageInput, setPageInput] = useState('');
  const [loading, setLoading] = useState(false);

  const pickPdf = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    
    if (res.assets && res.assets.length > 0) {
      const asset = res.assets[0];
      setFile({
        name: asset.name,
        uri: asset.uri,
      });
      
      try {
        const pdfDoc = await loadPdfDocument(asset.uri);
        setTotalPages(pdfDoc.getPageCount());
      } catch (error) {
        Alert.alert('Error', 'Failed to read PDF');
      }
      
      setSelectedPages([]);
      setPageInput('');
    }
  };

  const togglePage = (page: number) => {
    if (selectedPages.includes(page)) {
      setSelectedPages(selectedPages.filter(p => p !== page));
    } else {
      setSelectedPages([...selectedPages, page].sort((a, b) => a - b));
    }
  };

  const parsePageInput = () => {
    const input = pageInput.trim();
    if (!input) return;

    const pages: number[] = [];
    const parts = input.split(',');

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.trim().split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end && i <= totalPages; i++) {
            if (!pages.includes(i)) pages.push(i);
          }
        }
      } else {
        const page = parseInt(part.trim());
        if (!isNaN(page) && page > 0 && page <= totalPages && !pages.includes(page)) {
          pages.push(page);
        }
      }
    }

    setSelectedPages(pages.sort((a, b) => a - b));
    setPageInput('');
  };

  const handleExtract = async () => {
    if (!file) {
      Alert.alert('Error', 'Please select a PDF');
      return;
    }

    if (selectedPages.length === 0) {
      Alert.alert('Error', 'Please select pages to extract');
      return;
    }

    try {
      setLoading(true);
      const pageIndices = selectedPages.map(p => p - 1);
      const resultUri = await extractPages(file.uri, pageIndices);
      setLoading(false);

      Alert.alert('Success', `Extracted ${selectedPages.length} page(s) successfully!`, [
        {
          text: 'Share',
          onPress: async () => {
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) await Sharing.shareAsync(resultUri);
          }
        },
        { text: 'OK' }
      ]);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to extract pages');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>📖 Extract Pages</Text>
          <Text style={styles.subtitle}>
            Select and extract specific pages from your PDF
          </Text>
        </Card.Content>
      </Card>

      <Button 
        mode="contained" 
        onPress={pickPdf} 
        icon="file-pdf-box"
        style={styles.button}
      >
        {file ? 'Change PDF' : 'Select PDF'}
      </Button>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>Extracting pages...</Text>
        </View>
      )}

      {!loading && file && totalPages > 0 && (
        <>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium">Total Pages: {totalPages}</Text>
              <Text style={styles.selectedInfo}>Selected: {selectedPages.length}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.optionsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.optionTitle}>Quick Select</Text>
              <View style={styles.buttonGroup}>
                <Button
                  mode="outlined"
                  onPress={() => setSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1))}
                  style={styles.quickButton}
                >
                  All
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setSelectedPages([])}
                  style={styles.quickButton}
                >
                  None
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    const odds = Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p % 2 === 1);
                    setSelectedPages(odds);
                  }}
                  style={styles.quickButton}
                >
                  Odd
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    const evens = Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p % 2 === 0);
                    setSelectedPages(evens);
                  }}
                  style={styles.quickButton}
                >
                  Even
                </Button>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.inputCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.optionTitle}>Enter Pages</Text>
              <Text style={styles.hint}>
                Examples: 1,3,5 or 1-5 or 1,3-5,7
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  mode="outlined"
                  value={pageInput}
                  onChangeText={setPageInput}
                  placeholder="e.g., 1,3,5-10"
                  style={styles.input}
                />
                <Button
                  mode="tonal"
                  onPress={parsePageInput}
                  style={styles.parseButton}
                >
                  Add
                </Button>
              </View>
            </Card.Content>
          </Card>

          {selectedPages.length > 0 && (
            <Card style={styles.selectedCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.selectedTitle}>Selected Pages</Text>
                <View style={styles.chipsContainer}>
                  {selectedPages.map((page) => (
                    <Chip
                      key={page}
                      onClose={() => togglePage(page)}
                      style={styles.chip}
                    >
                      {page}
                    </Chip>
                  ))}
                </View>
              </Card.Content>
            </Card>
          )}

          {totalPages > 0 && (
            <Card style={styles.pagesCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.optionTitle}>All Pages</Text>
                <View style={styles.pagesGrid}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      mode={selectedPages.includes(page) ? 'contained' : 'outlined'}
                      onPress={() => togglePage(page)}
                      style={styles.pageButton}
                      labelStyle={styles.pageButtonLabel}
                    >
                      {page}
                    </Button>
                  ))}
                </View>
              </Card.Content>
            </Card>
          )}

          {selectedPages.length > 0 && (
            <Button 
              mode="contained" 
              onPress={handleExtract}
              icon="content-cut"
              style={styles.actionButton}
            >
              Extract {selectedPages.length} Page{selectedPages.length > 1 ? 's' : ''}
            </Button>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#e8f5e9', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#4caf50' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  button: { borderRadius: 12 },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  selectedInfo: { marginTop: 8, fontSize: 14, color: '#0fb5b1', fontWeight: 'bold' },
  optionsCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  optionTitle: { fontWeight: 'bold', marginBottom: 12 },
  buttonGroup: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  quickButton: { flex: 1, minWidth: 70 },
  inputCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  hint: { fontSize: 12, opacity: 0.6, marginBottom: 12 },
  inputContainer: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, backgroundColor: '#fff' },
  parseButton: { marginTop: 8 },
  selectedCard: { backgroundColor: '#f0fff0', borderRadius: 12, elevation: 2 },
  selectedTitle: { fontWeight: 'bold', marginBottom: 12 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { marginBottom: 4 },
  pagesCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  pagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pageButton: { width: '23%', marginBottom: 8 },
  pageButtonLabel: { fontSize: 12 },
  actionButton: { borderRadius: 12, paddingVertical: 4 }
});
