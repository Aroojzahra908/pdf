import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Text, Card, ActivityIndicator, TextInput, SegmentedButtons } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { PDFDocument, rgb, degrees } from 'pdf-lib';

type WatermarkType = 'text' | 'image';

export default function WatermarkScreen() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [watermarkType, setWatermarkType] = useState<WatermarkType>('text');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(-45);
  const [fontSize, setFontSize] = useState(48);

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

  const addWatermark = async () => {
    if (!fileUri || !watermarkText.trim()) {
      Alert.alert('Error', 'Please select a PDF and enter watermark text');
      return;
    }

    try {
      setLoading(true);

      const pdfBytes = await (FileSystem as any).readAsStringAsync(fileUri, {
        encoding: (FileSystem as any).EncodingType.Base64,
      });
      
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      
      // Add watermark to all pages
      for (const page of pages) {
        const { width, height } = page.getSize();
        
        // Draw text watermark
        page.drawText(watermarkText, {
          x: width / 2 - (watermarkText.length * fontSize) / 4,
          y: height / 2,
          size: fontSize,
          color: rgb(0.5, 0.5, 0.5),
          opacity: opacity,
          rotate: degrees(rotation),
        });
      }
      
      const watermarkedBytes = await pdfDoc.save();
      const outputUri = `${(FileSystem as any).documentDirectory}watermarked_${Date.now()}.pdf`;
      
      const base64 = btoa(String.fromCharCode(...Array.from(watermarkedBytes)));
      await (FileSystem as any).writeAsStringAsync(outputUri, base64, {
        encoding: (FileSystem as any).EncodingType.Base64,
      });
      
      setFileUri(outputUri);
      setLoading(false);
      Alert.alert('Success', 'Watermark added successfully!');
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to add watermark');
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
          <Text variant="titleLarge" style={styles.title}>💧 Watermark PDF</Text>
          <Text style={styles.subtitle}>
            Add text or image watermark to your PDF
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
              <Text variant="titleMedium" style={styles.sectionTitle}>Watermark Settings</Text>
              
              <TextInput
                label="Watermark Text"
                value={watermarkText}
                onChangeText={setWatermarkText}
                mode="outlined"
                style={styles.input}
              />

              <Text style={styles.sliderLabel}>Font Size: {fontSize}px</Text>
              <Slider
                value={fontSize}
                onValueChange={setFontSize}
                minimumValue={20}
                maximumValue={100}
                step={1}
                minimumTrackTintColor="#00bcd4"
                maximumTrackTintColor="#e0e0e0"
              />

              <Text style={styles.sliderLabel}>Opacity: {Math.round(opacity * 100)}%</Text>
              <Slider
                value={opacity}
                onValueChange={setOpacity}
                minimumValue={0.1}
                maximumValue={1}
                step={0.05}
                minimumTrackTintColor="#00bcd4"
                maximumTrackTintColor="#e0e0e0"
              />

              <Text style={styles.sliderLabel}>Rotation: {rotation}°</Text>
              <Slider
                value={rotation}
                onValueChange={setRotation}
                minimumValue={-90}
                maximumValue={90}
                step={5}
                minimumTrackTintColor="#00bcd4"
                maximumTrackTintColor="#e0e0e0"
              />

              <View style={styles.presetButtons}>
                <Button 
                  mode="outlined" 
                  onPress={() => {
                    setWatermarkText('CONFIDENTIAL');
                    setOpacity(0.3);
                    setRotation(-45);
                    setFontSize(48);
                  }}
                  compact
                >
                  Confidential
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={() => {
                    setWatermarkText('DRAFT');
                    setOpacity(0.4);
                    setRotation(-45);
                    setFontSize(60);
                  }}
                  compact
                >
                  Draft
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={() => {
                    setWatermarkText('COPY');
                    setOpacity(0.25);
                    setRotation(-45);
                    setFontSize(52);
                  }}
                  compact
                >
                  Copy
                </Button>
              </View>
            </Card.Content>
          </Card>

          <View style={styles.actionButtons}>
            <Button 
              mode="contained" 
              onPress={addWatermark}
              icon="water"
              style={styles.watermarkButton}
            >
              Add Watermark
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
          <ActivityIndicator size="large" color="#00bcd4" />
          <Text>Adding watermark...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#e0f7fa', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#00bcd4' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  pickButton: { borderRadius: 12, backgroundColor: '#00bcd4' },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  settingsCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  sectionTitle: { marginBottom: 12, fontWeight: '600' },
  input: { marginBottom: 16 },
  sliderLabel: { marginTop: 12, marginBottom: 4, fontWeight: '500' },
  presetButtons: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  actionButtons: { gap: 12 },
  watermarkButton: { backgroundColor: '#00bcd4' },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
});
