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
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
        {file ? 'Change PDF' : 'Select PDF'}
      </Button>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b6b" />
          <Text style={styles.loadingText}>Compressing...</Text>
        </View>
      )}

      {file && !loading && (
        <Card style={styles.filesCard}>
          <Card.Content>
            <Text variant="labelLarge">Selected File</Text>
            <View style={styles.fileItem}>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>📄 {file.name}</Text>
                <Text style={styles.fileSize}>Size: {formatBytes(file.size)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {compressedSize > 0 && (
        <Card style={styles.resultCard}>
          <Card.Content>
            <Text variant="labelLarge" style={styles.successText}>✓ Complete</Text>
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
              {Math.round(((originalSize - compressedSize) / originalSize) * 100)}% smaller
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
          Compress Now
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 14, paddingVertical: 12, paddingBottom: 20, backgroundColor: '#1a1a2e' },
  headerCard: { backgroundColor: '#2d2d44', borderRadius: 14, marginBottom: 14, borderLeftColor: '#ff6b6b', borderLeftWidth: 3 },
  title: { fontWeight: '700', color: '#ff6b6b' },
  subtitle: { color: '#b0b0b0', marginTop: 4, fontSize: 13 },
  button: { borderRadius: 10, marginBottom: 12, backgroundColor: '#ff6b6b' },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 32 },
  loadingText: { color: '#ffffff', fontSize: 13 },
  filesCard: { backgroundColor: '#2d2d44', borderRadius: 10, elevation: 2, marginBottom: 12 },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
    paddingVertical: 4
  },
  fileInfo: { flex: 1 },
  fileName: { flex: 1, fontWeight: '600', color: '#ffffff' },
  fileSize: { fontSize: 12, color: '#b0b0b0', marginTop: 4 },
  resultCard: { backgroundColor: '#2d2d44', borderRadius: 10, elevation: 2, marginBottom: 12 },
  successText: { color: '#90EE90', fontWeight: 'bold', marginBottom: 12 },
  sizeComparison: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  sizeItem: { flex: 1, alignItems: 'center' },
  sizeLabel: { fontSize: 12, color: '#b0b0b0' },
  sizeValue: { fontSize: 16, fontWeight: 'bold', color: '#90EE90', marginTop: 4 },
  arrowContainer: { alignItems: 'center', marginHorizontal: 8 },
  arrow: { fontSize: 20, fontWeight: 'bold', color: '#ff6b6b' },
  reductionText: { textAlign: 'center', fontSize: 13, color: '#90EE90', fontWeight: '600' },
  actionButton: { borderRadius: 10, backgroundColor: '#ff6b6b' }
});
