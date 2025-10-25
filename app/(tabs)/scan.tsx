import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Button, Text, Card, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { PDFDocument } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [scannedPages, setScannedPages] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    if (!mediaPermission?.granted) {
      requestMediaPermission();
    }
  }, [permission, mediaPermission]);

  const takePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        // Auto-enhance: adjust brightness and contrast
        const enhanced = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        setScannedPages([...scannedPages, enhanced.uri]);
        setShowCamera(false);
        Alert.alert('Success', 'Page captured! Take more or create PDF.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const removePage = (index: number) => {
    setScannedPages(scannedPages.filter((_, i) => i !== index));
  };

  const createPdf = async () => {
    if (scannedPages.length === 0) {
      Alert.alert('No Pages', 'Please scan at least one page');
      return;
    }

    try {
      setLoading(true);
      const pdfDoc = await PDFDocument.create();

      for (const pageUri of scannedPages) {
        const imageBytes = await FileSystem.readAsStringAsync(pageUri, {
          encoding: 'base64' as any,
        });
        
        const imageData = `data:image/jpeg;base64,${imageBytes}`;
        const jpgImage = await pdfDoc.embedJpg(imageData);
        
        const page = pdfDoc.addPage([jpgImage.width, jpgImage.height]);
        page.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width: jpgImage.width,
          height: jpgImage.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const base64 = btoa(String.fromCharCode(...pdfBytes));
      const fileUri = `${(FileSystem as any).documentDirectory}scanned_${Date.now()}.pdf`;
      
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: 'base64' as any,
      });

      setLoading(false);

      Alert.alert('Success', `PDF created with ${scannedPages.length} pages!`, [
        {
          text: 'Share',
          onPress: async () => {
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) await Sharing.shareAsync(fileUri);
          }
        },
        {
          text: 'Save to Gallery',
          onPress: async () => {
            if (mediaPermission?.granted) {
              await MediaLibrary.saveToLibraryAsync(fileUri);
              Alert.alert('Saved', 'PDF saved to gallery');
            }
          }
        },
        { text: 'OK' }
      ]);

      setScannedPages([]);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to create PDF');
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text variant="titleMedium">Camera Permission Required</Text>
        <Button mode="contained" onPress={requestPermission} style={{ marginTop: 16 }}>
          Grant Permission
        </Button>
      </View>
    );
  }

  if (showCamera) {
    return (
      <View style={styles.container}>
        <View style={styles.cameraWrap}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        </View>
        <View style={styles.cameraControls}>
          <Button mode="outlined" onPress={() => setShowCamera(false)} icon="close">
            Cancel
          </Button>
          <Button mode="contained" onPress={takePhoto} icon="camera" style={styles.captureButton}>
            Capture Page
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>📸 PDF Scanner</Text>
          <Text style={styles.subtitle}>
            Scan documents and convert to high-quality PDFs
          </Text>
        </Card.Content>
      </Card>

      <Button 
        mode="contained" 
        onPress={() => setShowCamera(true)} 
        icon="camera"
        style={styles.button}
      >
        Scan New Page
      </Button>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>Creating PDF...</Text>
        </View>
      )}

      {scannedPages.length > 0 && !loading && (
        <>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium">Scanned Pages ({scannedPages.length})</Text>
              <Chip style={styles.chip} icon="file-document">
                Ready to create PDF
              </Chip>
            </Card.Content>
          </Card>

          <View style={styles.pageGrid}>
            {scannedPages.map((uri, index) => (
              <Card key={index} style={styles.pageCard}>
                <Card.Content style={styles.pageCardContent}>
                  <Image source={{ uri }} style={styles.pageImage} />
                  <View style={styles.pageOverlay}>
                    <Text style={styles.pageNumber}>Page {index + 1}</Text>
                    <IconButton
                      icon="delete"
                      iconColor="#fff"
                      containerColor="rgba(255, 89, 94, 0.9)"
                      size={20}
                      onPress={() => removePage(index)}
                    />
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>

          <Button 
            mode="contained" 
            onPress={createPdf}
            icon="file-pdf-box"
            style={styles.createButton}
          >
            Create PDF ({scannedPages.length} pages)
          </Button>
        </>
      )}

      {scannedPages.length === 0 && !loading && (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Text variant="headlineMedium">📄</Text>
            <Text variant="titleMedium">No pages scanned yet</Text>
            <Text style={styles.emptyText}>
              Tap "Scan New Page" to start scanning documents
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#e0f7fa', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#2ec4b6' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  button: { borderRadius: 12 },
  cameraWrap: { flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraControls: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#000' },
  captureButton: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  chip: { marginTop: 8, alignSelf: 'flex-start' },
  pageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pageCard: { width: '48%', borderRadius: 12, elevation: 2 },
  pageCardContent: { padding: 0, position: 'relative' },
  pageImage: { width: '100%', height: 200, borderRadius: 12 },
  pageOverlay: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  pageNumber: { color: '#fff', fontWeight: 'bold' },
  createButton: { borderRadius: 12, paddingVertical: 4 },
  emptyCard: { backgroundColor: '#f8f9fa', borderRadius: 12, marginTop: 24 },
  emptyContent: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { textAlign: 'center', opacity: 0.7, marginTop: 8 }
});
