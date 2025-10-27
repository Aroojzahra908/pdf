import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Button, Text, Card, ActivityIndicator, SegmentedButtons, Chip } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { PDFDocument, rgb } from 'pdf-lib';

type ConversionMode = 'pdf-to-image' | 'image-to-pdf' | 'pdf-to-office' | 'office-to-pdf';

export default function ConvertScreen() {
  const [mode, setMode] = useState<ConversionMode>('image-to-pdf');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [outputUri, setOutputUri] = useState<string | null>(null);

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        const uris = result.assets.map(asset => asset.uri);
        const names = result.assets.map((asset, i) => asset.fileName || `image_${i + 1}.jpg`);
        setSelectedFiles(uris);
        setFileNames(names);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (res.assets && res.assets[0]) {
        setSelectedFiles([res.assets[0].uri]);
        setFileNames([res.assets[0].name || 'document.pdf']);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick PDF');
    }
  };

  const pickOfficeDoc = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document',
               'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
               'application/vnd.openxmlformats-officedocument.presentationml.presentation',
               'application/msword',
               'application/vnd.ms-excel',
               'application/vnd.ms-powerpoint']
      });
      if (res.assets && res.assets[0]) {
        setSelectedFiles([res.assets[0].uri]);
        setFileNames([res.assets[0].name || 'document']);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const convertImagesToPdf = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setLoading(true);
      const pdfDoc = await PDFDocument.create();

      for (const imageUri of selectedFiles) {
        // Read image as base64
        const imageBase64 = await (FileSystem as any).readAsStringAsync(imageUri, {
          encoding: (FileSystem as any).EncodingType.Base64,
        });

        let image;
        try {
          if (imageUri.toLowerCase().endsWith('.png')) {
            image = await pdfDoc.embedPng(imageBase64);
          } else {
            image = await pdfDoc.embedJpg(imageBase64);
          }
        } catch {
          // Try the other format if first fails
          try {
            image = await pdfDoc.embedJpg(imageBase64);
          } catch {
            image = await pdfDoc.embedPng(imageBase64);
          }
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const outputPath = `${(FileSystem as any).documentDirectory}converted_${Date.now()}.pdf`;
      
      // Convert Uint8Array to base64
      const base64 = btoa(String.fromCharCode(...Array.from(pdfBytes)));
      await (FileSystem as any).writeAsStringAsync(outputPath, base64, {
        encoding: (FileSystem as any).EncodingType.Base64,
      });

      setOutputUri(outputPath);
      setLoading(false);
      Alert.alert('Success', 'Images converted to PDF!');
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to convert images to PDF');
    }
  };

  const convertPdfToImages = async () => {
    Alert.alert(
      'Feature Unavailable',
      'PDF to Image conversion requires a backend service or native module. Consider using:\n\n• CloudConvert API\n• PDF.co API\n• iLovePDF API\n\nWould you like to continue with a cloud service?',
      [{ text: 'OK' }]
    );
  };

  const convertPdfToOffice = async () => {
    Alert.alert(
      'Feature Unavailable',
      'PDF to Office conversion requires a cloud service:\n\n• CloudConvert\n• Adobe PDF Services\n• iLovePDF API\n• Zamzar\n\nThese services provide high-quality conversion with proper formatting.',
      [{ text: 'OK' }]
    );
  };

  const convertOfficeToPdf = async () => {
    Alert.alert(
      'Feature Unavailable',
      'Office to PDF conversion requires:\n\n• LibreOffice (server-side)\n• Microsoft Office API\n• CloudConvert\n• Gotenberg\n\nConsider integrating one of these services for production use.',
      [{ text: 'OK' }]
    );
  };

  const handleConvert = () => {
    switch (mode) {
      case 'image-to-pdf':
        convertImagesToPdf();
        break;
      case 'pdf-to-image':
        convertPdfToImages();
        break;
      case 'pdf-to-office':
        convertPdfToOffice();
        break;
      case 'office-to-pdf':
        convertOfficeToPdf();
        break;
    }
  };

  const handlePickFile = () => {
    switch (mode) {
      case 'image-to-pdf':
        pickImages();
        break;
      case 'pdf-to-image':
      case 'pdf-to-office':
        pickPdf();
        break;
      case 'office-to-pdf':
        pickOfficeDoc();
        break;
    }
  };

  const shareFile = async () => {
    if (!outputUri) return;
    
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(outputUri);
      } else {
        Alert.alert('Success', `File saved to: ${outputUri}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share file');
    }
  };

  const getPickButtonText = () => {
    switch (mode) {
      case 'image-to-pdf': return 'Select Images';
      case 'pdf-to-image': return 'Select PDF';
      case 'pdf-to-office': return 'Select PDF';
      case 'office-to-pdf': return 'Select Office Document';
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>🔄 Convert Files</Text>
          <Text style={styles.subtitle}>
            Convert between PDF, images, and Office formats
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.modeCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Conversion Mode</Text>
          <View style={styles.modeButtons}>
            <Chip
              selected={mode === 'image-to-pdf'}
              onPress={() => { setMode('image-to-pdf'); setSelectedFiles([]); setFileNames([]); setOutputUri(null); }}
              style={styles.chip}
            >
              📸 Image → PDF
            </Chip>
            <Chip
              selected={mode === 'pdf-to-image'}
              onPress={() => { setMode('pdf-to-image'); setSelectedFiles([]); setFileNames([]); setOutputUri(null); }}
              style={styles.chip}
            >
              📄 PDF → Image
            </Chip>
          </View>
          <View style={styles.modeButtons}>
            <Chip
              selected={mode === 'pdf-to-office'}
              onPress={() => { setMode('pdf-to-office'); setSelectedFiles([]); setFileNames([]); setOutputUri(null); }}
              style={styles.chip}
            >
              📄 PDF → Word
            </Chip>
            <Chip
              selected={mode === 'office-to-pdf'}
              onPress={() => { setMode('office-to-pdf'); setSelectedFiles([]); setFileNames([]); setOutputUri(null); }}
              style={styles.chip}
            >
              📝 Office → PDF
            </Chip>
          </View>
        </Card.Content>
      </Card>

      <Button 
        mode="contained" 
        onPress={handlePickFile} 
        style={styles.pickButton}
        icon="file-upload"
      >
        {getPickButtonText()}
      </Button>

      {selectedFiles.length > 0 && !loading && (
        <>
          <Card style={styles.filesCard}>
            <Card.Content>
              <Text variant="titleMedium">Selected Files ({selectedFiles.length})</Text>
              {fileNames.map((name, index) => (
                <Text key={index} style={styles.fileName}>• {name}</Text>
              ))}
            </Card.Content>
          </Card>

          <Button 
            mode="contained" 
            onPress={handleConvert}
            icon="sync"
            style={styles.convertButton}
          >
            Convert Now
          </Button>

          {outputUri && (
            <Button 
              mode="outlined" 
              onPress={shareFile}
              icon="share"
            >
              Share Converted File
            </Button>
          )}
        </>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text>Converting files...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#e3f2fd', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#4a90e2' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  modeCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  sectionTitle: { marginBottom: 12, fontWeight: '600' },
  modeButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  chip: { marginBottom: 4 },
  pickButton: { borderRadius: 12, backgroundColor: '#4a90e2' },
  filesCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  fileName: { marginTop: 4, fontSize: 14 },
  convertButton: { backgroundColor: '#4a90e2' },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
});
