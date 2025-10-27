import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Text, Card, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { PDFDocument } from 'pdf-lib';

type CompressionLevel = 'low' | 'medium' | 'high';

export default function CompressPdfScreen() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('medium');

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (res.assets && res.assets[0]) {
        const picked = res.assets[0];
        setFileName(picked.name || 'document.pdf');
        setFileUri(picked.uri);
        
        // Get file size
        const info = await (FileSystem as any).getInfoAsync(picked.uri);
        setOriginalSize(info.size || 0);
        setCompressedSize(0);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick PDF');
    }
  };

  const compressPdf = async () => {
    if (!fileUri) return;

    try {
      setLoading(true);
      
      // Read PDF
      const pdfBytes = await (FileSystem as any).readAsStringAsync(fileUri, {
        encoding: (FileSystem as any).EncodingType.Base64,
      });
      
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Compression strategy: remove metadata, optimize objects
      // Note: pdf-lib has limited compression. For production, use a backend service
      
      // Remove metadata
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');
      
      // Save with compression
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
      
      // Save compressed PDF
      const outputUri = `${(FileSystem as any).documentDirectory}compressed_${Date.now()}.pdf`;
      const base64 = btoa(String.fromCharCode(...Array.from(compressedBytes)));
      await (FileSystem as any).writeAsStringAsync(
        outputUri,
        base64,
        { encoding: (FileSystem as any).EncodingType.Base64 }
      );
      
      // Get compressed size
      const info = await (FileSystem as any).getInfoAsync(outputUri);
      setCompressedSize(info.size || 0);
      setFileUri(outputUri);
      
      setLoading(false);
      Alert.alert('Success', 'PDF compressed successfully!');
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to compress PDF. For better compression, use a cloud service.');
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

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getSavingsPercent = () => {
    if (originalSize === 0 || compressedSize === 0) return 0;
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>🗜️ Compress PDF</Text>
          <Text style={styles.subtitle}>
            Reduce PDF file size while maintaining quality
          </Text>
        </Card.Content>
      </Card>

      <Button 
        mode="contained" 
        onPress={pickPdf} 
        style={styles.pickButton}
        icon="file-pdf-box"
      >
        Select PDF to Compress
      </Button>

      {fileName && !loading && (
        <>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium">📄 {fileName}</Text>
              <Text style={styles.sizeText}>Original Size: {formatSize(originalSize)}</Text>
              {compressedSize > 0 && (
                <>
                  <Text style={styles.sizeText}>Compressed Size: {formatSize(compressedSize)}</Text>
                  <Text style={[styles.savingsText, { color: '#4caf50' }]}>
                    ✓ Saved {getSavingsPercent()}% ({formatSize(originalSize - compressedSize)})
                  </Text>
                </>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.optionsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Compression Level</Text>
              <SegmentedButtons
                value={compressionLevel}
                onValueChange={(value) => setCompressionLevel(value as CompressionLevel)}
                buttons={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
                style={styles.segmented}
              />
              <Text style={styles.note}>
                Note: On-device compression is limited. For better results, use cloud services.
              </Text>
            </Card.Content>
          </Card>

          <View style={styles.actionButtons}>
            <Button 
              mode="contained" 
              onPress={compressPdf}
              icon="compress"
              style={styles.compressButton}
            >
              Compress PDF
            </Button>
            {compressedSize > 0 && (
              <Button 
                mode="outlined" 
                onPress={shareFile}
                icon="share"
              >
                Share Compressed PDF
              </Button>
            )}
          </View>
        </>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b6b" />
          <Text>Compressing PDF...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#fff5f5', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#ff6b6b' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  pickButton: { borderRadius: 12, backgroundColor: '#ff6b6b' },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  optionsCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  sectionTitle: { marginBottom: 12, fontWeight: '600' },
  segmented: { marginBottom: 12 },
  note: { fontSize: 12, opacity: 0.6, fontStyle: 'italic' },
  sizeText: { marginTop: 8, fontSize: 14 },
  savingsText: { marginTop: 8, fontSize: 14, fontWeight: 'bold' },
  actionButtons: { gap: 12 },
  compressButton: { backgroundColor: '#ff6b6b' },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
});
