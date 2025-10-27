import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Text, Card, RadioButton, TextInput, ActivityIndicator } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { addPageNumbers } from '../../src/utils/pdfUtils';

interface PdfFile {
  name: string;
  uri: string;
}

type Position = 'bottom-center' | 'bottom-left' | 'bottom-right';

export default function PageNumbersScreen() {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [position, setPosition] = useState<Position>('bottom-center');
  const [startNumber, setStartNumber] = useState('1');
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

  const handleAddPageNumbers = async () => {
    if (!file) {
      Alert.alert('Error', 'Please select a PDF');
      return;
    }

    const startNum = parseInt(startNumber) || 1;
    if (startNum < 1) {
      Alert.alert('Error', 'Start number must be at least 1');
      return;
    }

    try {
      setLoading(true);
      const resultUri = await addPageNumbers(file.uri, position, startNum);
      setLoading(false);

      Alert.alert('Success', 'Page numbers added successfully!', [
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
      Alert.alert('Error', 'Failed to add page numbers');
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
        icon="file-pdf-box"
        style={styles.button}
      >
        {file ? 'Change PDF' : 'Select PDF'}
      </Button>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>Adding page numbers...</Text>
        </View>
      )}

      {!loading && (
        <>
          <Card style={styles.optionsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.optionTitle}>Position</Text>
              <View style={styles.radioGroup}>
                <View style={styles.radioItem}>
                  <RadioButton
                    value="bottom-left"
                    status={position === 'bottom-left' ? 'checked' : 'unchecked'}
                    onPress={() => setPosition('bottom-left')}
                  />
                  <Text onPress={() => setPosition('bottom-left')} style={styles.radioLabel}>
                    Bottom Left
                  </Text>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton
                    value="bottom-center"
                    status={position === 'bottom-center' ? 'checked' : 'unchecked'}
                    onPress={() => setPosition('bottom-center')}
                  />
                  <Text onPress={() => setPosition('bottom-center')} style={styles.radioLabel}>
                    Bottom Center
                  </Text>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton
                    value="bottom-right"
                    status={position === 'bottom-right' ? 'checked' : 'unchecked'}
                    onPress={() => setPosition('bottom-right')}
                  />
                  <Text onPress={() => setPosition('bottom-right')} style={styles.radioLabel}>
                    Bottom Right
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.optionsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.optionTitle}>Start Number</Text>
              <TextInput
                mode="outlined"
                value={startNumber}
                onChangeText={setStartNumber}
                placeholder="1"
                keyboardType="number-pad"
                style={styles.input}
              />
              <Text style={styles.hint}>The first page will be numbered with this number</Text>
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
              onPress={handleAddPageNumbers}
              icon="plus-circle"
              style={styles.actionButton}
            >
              Add Page Numbers
            </Button>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#f3e5f5', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#9c27b0' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  button: { borderRadius: 12 },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  optionsCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  optionTitle: { fontWeight: 'bold', marginBottom: 12 },
  radioGroup: { gap: 12 },
  radioItem: { flexDirection: 'row', alignItems: 'center' },
  radioLabel: { marginLeft: 8, fontSize: 14 },
  input: { backgroundColor: '#fff', marginVertical: 8 },
  hint: { fontSize: 12, opacity: 0.6, marginTop: 4 },
  fileCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  fileName: { marginTop: 8, fontWeight: '600' },
  actionButton: { borderRadius: 12, paddingVertical: 4 }
});
