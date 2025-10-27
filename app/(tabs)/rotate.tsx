import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Text, Card, RadioButton, ActivityIndicator } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { rotateAllPages } from '../../src/utils/pdfUtils';

interface PdfFile {
  name: string;
  uri: string;
}

export default function RotateScreen() {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [rotation, setRotation] = useState<number>(90);
  const [loading, setLoading] = useState(false);

  const pickPdf = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    
    if (res.assets && res.assets.length > 0) {
      const asset = res.assets[0];
      setFile({
        name: asset.name,
        uri: asset.uri,
      });
    }
  };

  const handleRotate = async () => {
    if (!file) {
      Alert.alert('Error', 'Please select a PDF');
      return;
    }

    try {
      setLoading(true);
      const resultUri = await rotateAllPages(file.uri, rotation);
      setLoading(false);

      Alert.alert('Success', `PDF rotated ${rotation}° successfully!`, [
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
      Alert.alert('Error', 'Failed to rotate PDF');
    }
  };

  const getRotationPreview = () => {
    switch (rotation) {
      case 90:
        return '↻ 90°';
      case 180:
        return '↻ 180°';
      case 270:
        return '↻ 270° (or ↺ 90°)';
      default:
        return '';
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>↻ Rotate PDF</Text>
          <Text style={styles.subtitle}>
            Rotate all pages in your PDF
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
          <Text>Rotating PDF...</Text>
        </View>
      )}

      {!loading && (
        <>
          <Card style={styles.optionsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.optionTitle}>Rotation Angle</Text>
              <View style={styles.radioGroup}>
                <View style={styles.radioItem}>
                  <RadioButton
                    value="90"
                    status={rotation === 90 ? 'checked' : 'unchecked'}
                    onPress={() => setRotation(90)}
                  />
                  <Text onPress={() => setRotation(90)} style={styles.radioLabel}>
                    90° Clockwise
                  </Text>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton
                    value="180"
                    status={rotation === 180 ? 'checked' : 'unchecked'}
                    onPress={() => setRotation(180)}
                  />
                  <Text onPress={() => setRotation(180)} style={styles.radioLabel}>
                    180° (Flip Upside Down)
                  </Text>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton
                    value="270"
                    status={rotation === 270 ? 'checked' : 'unchecked'}
                    onPress={() => setRotation(270)}
                  />
                  <Text onPress={() => setRotation(270)} style={styles.radioLabel}>
                    270° Clockwise
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.previewCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.previewTitle}>Preview</Text>
              <View style={styles.previewBox}>
                <Text style={styles.previewText}>{getRotationPreview()}</Text>
              </View>
            </Card.Content>
          </Card>

          {file && (
            <Card style={styles.fileCard}>
              <Card.Content>
                <Text variant="titleMedium">Selected File</Text>
                <Text style={styles.fileName}>📄 {file.name}</Text>
              </Card.Content>
            </Card>
          )}

          {file && (
            <Button 
              mode="contained" 
              onPress={handleRotate}
              icon="rotate-right"
              style={styles.actionButton}
            >
              Rotate PDF
            </Button>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#e3f2fd', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#2196f3' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  button: { borderRadius: 12 },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  optionsCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  optionTitle: { fontWeight: 'bold', marginBottom: 12 },
  radioGroup: { gap: 12 },
  radioItem: { flexDirection: 'row', alignItems: 'center' },
  radioLabel: { marginLeft: 8, fontSize: 14 },
  previewCard: { backgroundColor: '#f5f5f5', borderRadius: 12, elevation: 1 },
  previewTitle: { fontWeight: 'bold', marginBottom: 12 },
  previewBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, backgroundColor: '#fff', borderRadius: 8 },
  previewText: { fontSize: 36, fontWeight: 'bold', color: '#2196f3' },
  fileCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  fileName: { marginTop: 8, fontWeight: '600' },
  actionButton: { borderRadius: 12, paddingVertical: 4 }
});
