import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Share } from 'react-native';
import { Button, Text, Card, ActivityIndicator, TextInput } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';

export default function ExtractScreen() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<string>('');

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (res.assets && res.assets[0]) {
        setFileName(res.assets[0].name);
        setLoading(true);
        
        // Simulate text extraction
        // In production, use a PDF parsing library or OCR service
        setTimeout(() => {
          const sampleText = `Sample Extracted Text from ${res.assets![0].name}

This is a demonstration of PDF text extraction. In a production environment, you would use:

1. **PDF.js** - For web-based text extraction
2. **Tesseract.js** - For OCR (Optical Character Recognition)
3. **Google Vision API** - For cloud-based OCR
4. **Backend Service** - For server-side PDF parsing

The extracted text can be:
- Copied to clipboard
- Edited and saved as notes
- Shared with other apps
- Converted to different formats

This feature is perfect for students who want to:
✓ Copy text from PDFs without retyping
✓ Create study notes from textbooks
✓ Extract important information quickly
✓ Convert PDF content to editable format`;

          setExtractedText(sampleText);
          setNotes(sampleText);
          setLoading(false);
        }, 1500);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to load PDF');
    }
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(extractedText);
    Alert.alert('Copied!', 'Text copied to clipboard');
  };

  const shareText = async () => {
    try {
      await Share.share({
        message: extractedText,
        title: `Extracted from ${fileName}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share text');
    }
  };

  const saveNotes = () => {
    Alert.alert('Notes Saved', 'Your notes have been saved locally');
    // In production, save to AsyncStorage or a database
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>📝 PDF to Text / Notes</Text>
          <Text style={styles.subtitle}>
            Extract text from PDFs and create editable notes
          </Text>
        </Card.Content>
      </Card>

      <Button 
        mode="contained" 
        onPress={pickPdf} 
        icon="file-pdf-box"
        style={styles.button}
      >
        Pick PDF to Extract
      </Button>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>Extracting text...</Text>
          <Text style={styles.loadingHint}>Using OCR technology</Text>
        </View>
      )}

      {fileName && !loading && extractedText && (
        <>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium">📄 {fileName}</Text>
              <Text style={styles.charCount}>
                {extractedText.length} characters extracted
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.textCard}>
            <Card.Content>
              <Text variant="titleMedium">Extracted Text</Text>
              <ScrollView style={styles.textScroll} nestedScrollEnabled>
                <Text style={styles.extractedText}>{extractedText}</Text>
              </ScrollView>
            </Card.Content>
          </Card>

          <View style={styles.actionButtons}>
            <Button 
              mode="outlined" 
              onPress={copyToClipboard}
              icon="content-copy"
              style={styles.actionButton}
            >
              Copy
            </Button>
            <Button 
              mode="outlined" 
              onPress={shareText}
              icon="share"
              style={styles.actionButton}
            >
              Share
            </Button>
          </View>

          <Card style={styles.notesCard}>
            <Card.Content>
              <Text variant="titleMedium">✍️ Edit Notes</Text>
              <TextInput
                mode="outlined"
                multiline
                numberOfLines={8}
                value={notes}
                onChangeText={setNotes}
                placeholder="Edit your notes here..."
                style={styles.notesInput}
              />
              <Button 
                mode="contained" 
                onPress={saveNotes}
                icon="content-save"
                style={styles.saveButton}
              >
                Save Notes
              </Button>
            </Card.Content>
          </Card>
        </>
      )}

      {!fileName && !loading && (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Text variant="headlineMedium">📄</Text>
            <Text variant="titleMedium">No PDF selected</Text>
            <Text style={styles.emptyText}>
              Pick a PDF to extract text and create notes
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#f0f0ff', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#5e60ce' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  button: { borderRadius: 12 },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  loadingHint: { fontSize: 12, opacity: 0.7 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  charCount: { opacity: 0.7, marginTop: 4 },
  textCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  textScroll: { maxHeight: 200, marginTop: 12 },
  extractedText: { lineHeight: 22, opacity: 0.8 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, borderRadius: 12 },
  notesCard: { backgroundColor: '#fffef0', borderRadius: 12, elevation: 2 },
  notesInput: { marginTop: 12, minHeight: 150 },
  saveButton: { marginTop: 12, borderRadius: 12 },
  emptyCard: { backgroundColor: '#f8f9fa', borderRadius: 12, marginTop: 24 },
  emptyContent: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { textAlign: 'center', opacity: 0.7, marginTop: 8 }
});
