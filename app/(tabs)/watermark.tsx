import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, SafeAreaView } from 'react-native';
import { Button, Text, Card, TextInput, ActivityIndicator } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { addWatermark } from '../../src/utils/pdfUtils';
import { handlePdfError, validateWatermarkText } from '../../src/utils/errorHandler';

interface PdfFile {
  name: string;
  uri: string;
}

export default function WatermarkScreen() {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.3);
  const [loading, setLoading] = useState(false);

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });

      if (res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setFile({
          name: asset.name,
          uri: asset.uri,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select PDF');
    }
  };

  const handleAddWatermark = async () => {
    if (!file) {
      Alert.alert('Error', 'Please select a PDF');
      return;
    }

    try {
      validateWatermarkText(watermarkText);

      setLoading(true);
      const resultUri = await addWatermark(file.uri, watermarkText, opacity);
      setLoading(false);

      Alert.alert('Success', 'Watermark added!', [
        {
          text: 'Share',
          onPress: async () => {
            try {
              const canShare = await Sharing.isAvailableAsync();
              if (canShare) {
                await Sharing.shareAsync(resultUri);
              } else {
                Alert.alert('Success', 'PDF saved to storage');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to share PDF');
            }
          },
        },
        { text: 'OK' },
      ]);
    } catch (error) {
      setLoading(false);
      const errorMsg = handlePdfError(error, 'Adding watermark');
      Alert.alert('Error', errorMsg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.title}>💧 Add Watermark</Text>
            <Text style={styles.subtitle}>Add text watermark to all pages</Text>
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
            <Text style={styles.loadingText}>Adding watermark...</Text>
          </View>
        )}

        {!loading && (
          <>
            <Card style={styles.optionsCard}>
              <Card.Content>
                <Text variant="labelLarge" style={styles.optionTitle}>
                  Watermark Text
                </Text>
                <TextInput
                  mode="outlined"
                  value={watermarkText}
                  onChangeText={setWatermarkText}
                  placeholder="Enter watermark text"
                  style={styles.input}
                  maxLength={50}
                  placeholderTextColor="#666"
                />
                <Text style={styles.charCount}>{watermarkText.length}/50</Text>
              </Card.Content>
            </Card>

            <Card style={styles.optionsCard}>
              <Card.Content>
                <Text variant="labelLarge" style={styles.optionTitle}>
                  Opacity: {Math.round(opacity * 100)}%
                </Text>
                <Slider
                  style={styles.slider}
                  value={opacity}
                  onValueChange={setOpacity}
                  minimumValue={0.1}
                  maximumValue={1}
                  step={0.1}
                  minimumTrackTintColor="#ff6b6b"
                  maximumTrackTintColor="#666"
                />
              </Card.Content>
            </Card>

            {file && (
              <Card style={styles.fileCard}>
                <Card.Content>
                  <Text variant="labelLarge">Selected File</Text>
                  <Text style={styles.fileName}>📄 {file.name}</Text>
                </Card.Content>
              </Card>
            )}

            {file && (
              <Button
                mode="contained"
                onPress={handleAddWatermark}
                icon="water-check"
                style={styles.actionButton}
              >
                Add Watermark
              </Button>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scrollContent: { paddingHorizontal: 14, paddingVertical: 12, paddingBottom: 20 },
  headerCard: { backgroundColor: '#2d2d44', borderRadius: 14, marginBottom: 14, borderLeftColor: '#87CEEB', borderLeftWidth: 3 },
  title: { fontWeight: '700', color: '#87CEEB' },
  subtitle: { color: '#b0b0b0', marginTop: 4, fontSize: 13 },
  button: { borderRadius: 10, marginBottom: 12, backgroundColor: '#ff6b6b' },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 32 },
  loadingText: { color: '#ffffff', fontSize: 13 },
  optionsCard: { backgroundColor: '#2d2d44', borderRadius: 10, elevation: 2, marginBottom: 12 },
  optionTitle: { fontWeight: '600', marginBottom: 12, color: '#ffffff' },
  input: { backgroundColor: '#1a1a2e', color: '#ffffff' },
  charCount: { fontSize: 12, color: '#b0b0b0', marginTop: 4, textAlign: 'right' },
  slider: { width: '100%', height: 40 },
  fileCard: { backgroundColor: '#2d2d44', borderRadius: 10, elevation: 2, marginBottom: 12 },
  fileName: { marginTop: 8, fontWeight: '600', color: '#ffffff' },
  actionButton: { borderRadius: 10, backgroundColor: '#ff6b6b' },
});
