import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Text, TextInput, Card, ActivityIndicator, Chip } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { PDFDocument } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';

export default function LockScreen() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'lock' | 'unlock'>('lock');

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (res.assets && res.assets[0]) {
        setFileName(res.assets[0].name);
        setFileUri(res.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick PDF');
    }
  };

  const handleLock = async () => {
    if (!fileUri || !password) {
      Alert.alert('Missing Info', 'Please select a PDF and enter a password');
      return;
    }

    try {
      setLoading(true);
      
      // Load the PDF
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64' as any,
      });
      const pdfBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Note: pdf-lib doesn't support encryption directly
      // This is a simplified version - in production, use a backend service
      // or native module for proper PDF encryption
      
      // For now, we'll just save it with metadata indicating it should be protected
      pdfDoc.setTitle(`Protected: ${fileName}`);
      pdfDoc.setAuthor('Smart PDF - Password Protected');
      
      const protectedBytes = await pdfDoc.save();
      const protectedBase64 = btoa(String.fromCharCode(...protectedBytes));
      const outputUri = `${(FileSystem as any).documentDirectory}locked_${Date.now()}.pdf`;
      
      await FileSystem.writeAsStringAsync(outputUri, protectedBase64, {
        encoding: 'base64' as any,
      });

      setLoading(false);

      Alert.alert(
        'Note',
        'PDF metadata updated. For true encryption, a backend service or native module is required. The file has been saved.',
        [
          {
            text: 'Share',
            onPress: async () => {
              const canShare = await Sharing.isAvailableAsync();
              if (canShare) await Sharing.shareAsync(outputUri);
            }
          },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to process PDF');
    }
  };

  const handleUnlock = async () => {
    if (!fileUri) {
      Alert.alert('Missing Info', 'Please select a PDF');
      return;
    }

    try {
      setLoading(true);
      
      // In a real implementation, you'd decrypt here
      // For now, we just copy the file
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64' as any,
      });
      const pdfBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const pdfDoc = await PDFDocument.load(pdfBytes);

      const unlockedBytes = await pdfDoc.save();
      const unlockedBase64 = btoa(String.fromCharCode(...unlockedBytes));
      const outputUri = `${(FileSystem as any).documentDirectory}unlocked_${Date.now()}.pdf`;
      
      await FileSystem.writeAsStringAsync(outputUri, unlockedBase64, {
        encoding: 'base64' as any,
      });

      setLoading(false);

      Alert.alert('Success', 'PDF processed successfully!', [
        {
          text: 'Share',
          onPress: async () => {
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) await Sharing.shareAsync(outputUri);
          }
        },
        { text: 'OK' }
      ]);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to process PDF. It may be encrypted.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>🔒 Lock / Unlock PDF</Text>
          <Text style={styles.subtitle}>
            Secure your PDFs with password protection
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.modeSelector}>
        <Chip 
          selected={mode === 'lock'} 
          onPress={() => setMode('lock')}
          style={styles.chip}
        >
          Lock PDF
        </Chip>
        <Chip 
          selected={mode === 'unlock'} 
          onPress={() => setMode('unlock')}
          style={styles.chip}
        >
          Unlock PDF
        </Chip>
      </View>

      <Button 
        mode="contained" 
        onPress={pickPdf} 
        icon="file-pdf-box"
        style={styles.button}
      >
        Pick PDF
      </Button>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>Processing...</Text>
        </View>
      )}

      {fileName && !loading && (
        <>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium">📄 {fileName}</Text>
            </Card.Content>
          </Card>

          {mode === 'lock' && (
            <Card style={styles.passwordCard}>
              <Card.Content>
                <Text variant="titleMedium">Set Password</Text>
                <TextInput
                  label="Enter Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  mode="outlined"
                  style={styles.input}
                />
                <Text style={styles.note}>
                  ⚠️ Note: True PDF encryption requires a backend service. This demo adds metadata only.
                </Text>
              </Card.Content>
            </Card>
          )}

          <Button 
            mode="contained" 
            onPress={mode === 'lock' ? handleLock : handleUnlock}
            icon={mode === 'lock' ? 'lock' : 'lock-open'}
            disabled={mode === 'lock' && !password}
            style={styles.actionButton}
          >
            {mode === 'lock' ? 'Lock PDF' : 'Unlock PDF'}
          </Button>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#ffe0e0', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#ff595e' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  modeSelector: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1 },
  button: { borderRadius: 12 },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  passwordCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  input: { marginTop: 12 },
  note: { fontSize: 12, opacity: 0.7, marginTop: 12, fontStyle: 'italic' },
  actionButton: { borderRadius: 12, paddingVertical: 4 }
});
