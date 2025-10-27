import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Text, Card, ActivityIndicator, SegmentedButtons, Chip } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

type Position = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
type Format = 'number' | 'page-x' | 'page-x-of-y';

export default function PageNumbersScreen() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<Position>('bottom-center');
  const [format, setFormat] = useState<Format>('page-x-of-y');
  const [startPage, setStartPage] = useState(1);

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (res.assets && res.assets[0]) {
        setFileName(res.assets[0].name || 'document.pdf');
        setFileUri(res.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick PDF');
    }
  };

  const addPageNumbers = async () => {
    if (!fileUri) {
      Alert.alert('Error', 'Please select a PDF');
      return;
    }

    try {
      setLoading(true);

      const pdfBytes = await (FileSystem as any).readAsStringAsync(fileUri, {
        encoding: (FileSystem as any).EncodingType.Base64,
      });
      
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const totalPages = pages.length;
      
      pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        const pageNum = index + startPage;
        
        let text = '';
        switch (format) {
          case 'number':
            text = `${pageNum}`;
            break;
          case 'page-x':
            text = `Page ${pageNum}`;
            break;
          case 'page-x-of-y':
            text = `Page ${pageNum} of ${totalPages}`;
            break;
        }
        
        const textWidth = font.widthOfTextAtSize(text, 10);
        let x = 0;
        let y = 0;
        
        // Calculate position
        switch (position) {
          case 'top-left':
            x = 30;
            y = height - 30;
            break;
          case 'top-center':
            x = (width - textWidth) / 2;
            y = height - 30;
            break;
          case 'top-right':
            x = width - textWidth - 30;
            y = height - 30;
            break;
          case 'bottom-left':
            x = 30;
            y = 20;
            break;
          case 'bottom-center':
            x = (width - textWidth) / 2;
            y = 20;
            break;
          case 'bottom-right':
            x = width - textWidth - 30;
            y = 20;
            break;
        }
        
        page.drawText(text, {
          x,
          y,
          size: 10,
          font,
          color: rgb(0, 0, 0),
        });
      });
      
      const numberedBytes = await pdfDoc.save();
      const outputUri = `${(FileSystem as any).documentDirectory}numbered_${Date.now()}.pdf`;
      
      const base64 = btoa(String.fromCharCode(...Array.from(numberedBytes)));
      await (FileSystem as any).writeAsStringAsync(outputUri, base64, {
        encoding: (FileSystem as any).EncodingType.Base64,
      });
      
      setFileUri(outputUri);
      setLoading(false);
      Alert.alert('Success', 'Page numbers added successfully!');
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to add page numbers');
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
          <Text variant="titleLarge" style={styles.title}>🔢 Add Page Numbers</Text>
          <Text style={styles.subtitle}>
            Add page numbers to your PDF document
          </Text>
        </Card.Content>
      </Card>

      <Button 
        mode="contained" 
        onPress={pickPdf} 
        style={styles.pickButton}
        icon="file-pdf-box"
      >
        Select PDF
      </Button>

      {fileName && !loading && (
        <>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium">📄 {fileName}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.settingsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Format</Text>
              <View style={styles.formatChips}>
                <Chip
                  selected={format === 'number'}
                  onPress={() => setFormat('number')}
                >
                  1, 2, 3...
                </Chip>
                <Chip
                  selected={format === 'page-x'}
                  onPress={() => setFormat('page-x')}
                >
                  Page 1, Page 2...
                </Chip>
                <Chip
                  selected={format === 'page-x-of-y'}
                  onPress={() => setFormat('page-x-of-y')}
                >
                  Page 1 of 10
                </Chip>
              </View>

              <Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: 20 }]}>Position</Text>
              <View style={styles.positionGrid}>
                <Button
                  mode={position === 'top-left' ? 'contained' : 'outlined'}
                  onPress={() => setPosition('top-left')}
                  compact
                  style={styles.positionButton}
                >
                  ↖ Top Left
                </Button>
                <Button
                  mode={position === 'top-center' ? 'contained' : 'outlined'}
                  onPress={() => setPosition('top-center')}
                  compact
                  style={styles.positionButton}
                >
                  ↑ Top Center
                </Button>
                <Button
                  mode={position === 'top-right' ? 'contained' : 'outlined'}
                  onPress={() => setPosition('top-right')}
                  compact
                  style={styles.positionButton}
                >
                  ↗ Top Right
                </Button>
                <Button
                  mode={position === 'bottom-left' ? 'contained' : 'outlined'}
                  onPress={() => setPosition('bottom-left')}
                  compact
                  style={styles.positionButton}
                >
                  ↙ Bottom Left
                </Button>
                <Button
                  mode={position === 'bottom-center' ? 'contained' : 'outlined'}
                  onPress={() => setPosition('bottom-center')}
                  compact
                  style={styles.positionButton}
                >
                  ↓ Bottom Center
                </Button>
                <Button
                  mode={position === 'bottom-right' ? 'contained' : 'outlined'}
                  onPress={() => setPosition('bottom-right')}
                  compact
                  style={styles.positionButton}
                >
                  ↘ Bottom Right
                </Button>
              </View>
            </Card.Content>
          </Card>

          <View style={styles.actionButtons}>
            <Button 
              mode="contained" 
              onPress={addPageNumbers}
              icon="numeric"
              style={styles.addButton}
            >
              Add Page Numbers
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
          <ActivityIndicator size="large" color="#673ab7" />
          <Text>Adding page numbers...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#ede7f6', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#673ab7' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  pickButton: { borderRadius: 12, backgroundColor: '#673ab7' },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  settingsCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  sectionTitle: { marginBottom: 12, fontWeight: '600' },
  formatChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  positionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  positionButton: { minWidth: 100 },
  actionButtons: { gap: 12 },
  addButton: { backgroundColor: '#673ab7' },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
});
