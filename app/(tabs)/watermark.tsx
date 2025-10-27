import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Text, Card, TextInput, ActivityIndicator } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { addWatermark } from '../../src/utils/pdfUtils';

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
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    
    if (res.assets && res.assets.length > 0) {
      const asset = res.assets[0];
      setFile({
        name: asset.name,
        uri: asset.uri,
      });
    }
  };

  const handleAddWatermark = async () => {
    if (!file) {
      Alert.alert('Error', 'Please select a PDF');
      return;
    }

    if (!watermarkText.trim()) {
      Alert.alert('Error', 'Please enter watermark text');
      return;
    }

    try {
      setLoading(true);
      const resultUri = await addWatermark(file.uri, watermarkText, opacity);
      setLoading(false);

      Alert.alert('Success', 'Watermark added successfully!', [
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
      Alert.alert('Error', 'Failed to add watermark');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>💧 Add Watermark</Text>
          <Text style={styles.subtitle}>
            Add text watermark to all pages
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
          <Text>Adding watermark...</Text>
        </View>
      )}

      {!loading && (
        <>
          <Card style={styles.optionsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.optionTitle}>Watermark Text</Text>
              <TextInput
                mode="outlined"
                value={watermarkText}
                onChangeText={setWatermarkText}
                placeholder="Enter watermark text"
                style={styles.input}
                maxLength={50}
              />
              <Text style={styles.charCount}>{watermarkText.length}/50</Text>
            </Card.Content>
          </Card>

          <Card style={styles.optionsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.optionTitle}>Opacity</Text>
              <View style={styles.sliderContainer}>
                <Text>Light</Text>
                <Slider
                  style={styles.slider}
                  value={opacity}
                  onValueChange={setOpacity}
                  minimumValue={0.1}
                  maximumValue={1}
                  step={0.1}
                  minimumTrackTintColor="#0fb5b1"
                  maximumTrackTintColor="#e0e0e0"
                />
                <Text>Dark</Text>
              </View>
              <Text style={styles.opacityValue}>Opacity: {Math.round(opacity * 100)}%</Text>
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
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#e0f7f6', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#0fb5b1' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  button: { borderRadius: 12 },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  optionsCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  optionTitle: { fontWeight: 'bold', marginBottom: 12 },
  input: { backgroundColor: '#fff' },
  charCount: { fontSize: 12, opacity: 0.6, marginTop: 4, textAlign: 'right' },
  sliderContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  slider: { flex: 1, height: 40 },
  opacityValue: { textAlign: 'center', fontSize: 14, fontWeight: 'bold', color: '#0fb5b1', marginTop: 8 },
  fileCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  fileName: { marginTop: 8, fontWeight: '600' },
  actionButton: { borderRadius: 12, paddingVertical: 4 }
});
