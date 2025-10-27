import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { compressPdf } from '../../src/utils/pdfUtils';
import * as FileSystem from 'expo-file-system/legacy';

interface PdfFile {
  name: string;
  uri: string;
  size: number;
}

export default function CompressScreen() {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [compressedUri, setCompressedUri] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);

  const pickPdf = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    
    if (res.assets && res.assets.length > 0) {
      const asset = res.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);
      setFile({
        name: asset.name,
        uri: asset.uri,
        size: fileInfo.size || 0,
      });
      setOriginalSize(fileInfo.size || 0);
      setCompressedUri(null);
      setCompressedSize(0);
    }
  };

  const handleCompress = async () => {
    if (!file) {
      Alert.alert('Error', 'Please select a PDF to compress');
      return;
    }

    try {
      setLoading(true);
      const resultUri = await compressPdf(file.uri);
      const fileInfo = await FileSystem.getInfoAsync(resultUri);
      
      setCompressedUri(resultUri);
      setCompressedSize(fileInfo.size || 0);
      setLoading(false);

      const reduction = Math.round(((originalSize - (fileInfo.size || 0)) / originalSize) * 100);
      Alert.alert('Success', `PDF compressed successfully!\n\nSize reduction: ${reduction}%`, [
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
      Alert.alert('Error', 'Failed to compress PDF');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>📦 Compress PDF</Text>
          <Text style={styles.subtitle}>
            Reduce file size while maintaining quality
          </Text>
        </Card.Content>
      </Card>

      <Button 
        mode="contained" 
        onPress={pickPdf} 
        icon="file-pdf-box"
        style={styles.button}
      >
        {file ? 'Change PDF' : 'Select PDF to Compress'}
      </Button>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>Compressing PDF...</Text>
        </View>
      )}

      {file && !loading && (
        <Card style={styles.filesCard}>
          <Card.Content>
            <Text variant="titleMedium">Selected File</Text>
            <View style={styles.fileItem}>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>📄 {file.name}</Text>
                <Text style={styles.fileSize}>Original size: {formatBytes(file.size)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {compressedSize > 0 && (
        <Card style={styles.resultCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.successText}>✓ Compression Complete</Text>
            <View style={styles.sizeComparison}>
              <View style={styles.sizeItem}>
                <Text style={styles.sizeLabel}>Original</Text>
                <Text style={styles.sizeValue}>{formatBytes(originalSize)}</Text>
              </View>
              <View style={styles.arrowContainer}>
                <Text style={styles.arrow}>→</Text>
              </View>
              <View style={styles.sizeItem}>
                <Text style={styles.sizeLabel}>Compressed</Text>
                <Text style={styles.sizeValue}>{formatBytes(compressedSize)}</Text>
              </View>
            </View>
            <Text style={styles.reductionText}>
              {Math.round(((originalSize - compressedSize) / originalSize) * 100)}% size reduction
            </Text>
          </Card.Content>
        </Card>
      )}

      {file && !loading && (
        <Button 
          mode="contained" 
          onPress={handleCompress}
          icon="compress"
          style={styles.actionButton}
        >
          Compress PDF
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#fff3e0', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#ff7f50' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  button: { borderRadius: 12 },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  filesCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  fileItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginTop: 8,
    paddingVertical: 4
  },
  fileInfo: { flex: 1 },
  fileName: { flex: 1, fontWeight: '600' },
  fileSize: { fontSize: 12, opacity: 0.6, marginTop: 4 },
  resultCard: { backgroundColor: '#f0fff0', borderRadius: 12, elevation: 2 },
  successText: { color: '#4caf50', fontWeight: 'bold', marginBottom: 12 },
  sizeComparison: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  sizeItem: { flex: 1, alignItems: 'center' },
  sizeLabel: { fontSize: 12, opacity: 0.7 },
  sizeValue: { fontSize: 16, fontWeight: 'bold', color: '#0fb5b1', marginTop: 4 },
  arrowContainer: { alignItems: 'center', marginHorizontal: 8 },
  arrow: { fontSize: 20, fontWeight: 'bold', color: '#0fb5b1' },
  reductionText: { textAlign: 'center', fontSize: 14, color: '#4caf50', fontWeight: 'bold' },
  actionButton: { borderRadius: 12, paddingVertical: 4 }
});
