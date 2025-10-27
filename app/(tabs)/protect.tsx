import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Text, Card, TextInput, ActivityIndicator } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { protectPdf } from '../../src/utils/pdfUtils';

interface PdfFile {
  name: string;
  uri: string;
}

export default function ProtectScreen() {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleProtect = async () => {
    if (!file) {
      Alert.alert('Error', 'Please select a PDF');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters');
      return;
    }

    try {
      setLoading(true);
      const resultUri = await protectPdf(file.uri, password);
      setLoading(false);
      setPassword('');
      setConfirmPassword('');

      Alert.alert('Success', 'PDF protected with password!', [
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
      Alert.alert('Error', 'Failed to protect PDF');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>🔒 Protect PDF</Text>
          <Text style={styles.subtitle}>
            Encrypt PDF with password protection
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.infoText}>
            🔐 Your PDF will be encrypted and password-protected. Only users with the correct password can view, print, or copy content from this PDF.
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
          <Text>Protecting PDF...</Text>
        </View>
      )}

      {!loading && (
        <>
          <Card style={styles.optionsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.optionTitle}>Password Protection</Text>
              
              <Text style={styles.label}>Enter Password</Text>
              <TextInput
                mode="outlined"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                secureTextEntry={!showPassword}
                style={styles.input}
              />

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                mode="outlined"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                secureTextEntry={!showPassword}
                style={styles.input}
              />

              <View style={styles.checkboxContainer}>
                <Button
                  mode={showPassword ? 'contained-tonal' : 'text'}
                  onPress={() => setShowPassword(!showPassword)}
                  compact
                >
                  {showPassword ? 'Hide' : 'Show'} Password
                </Button>
              </View>

              <View style={styles.strengthContainer}>
                <Text style={styles.strengthLabel}>Password Strength:</Text>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: password.length > 0 ? Math.min((password.length / 12) * 100, 100) + '%' : '0%',
                        backgroundColor: 
                          password.length < 6 ? '#ff7f50' : 
                          password.length < 10 ? '#ffc107' : 
                          '#4caf50'
                      }
                    ]}
                  />
                </View>
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
              onPress={handleProtect}
              icon="lock"
              style={styles.actionButton}
              disabled={!password || password !== confirmPassword || password.length < 4}
            >
              Protect PDF
            </Button>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#ffebee', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#ff595e' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  infoCard: { backgroundColor: '#fff3e0', borderRadius: 12 },
  infoText: { fontSize: 13, color: '#666', lineHeight: 20 },
  button: { borderRadius: 12 },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  optionsCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  optionTitle: { fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 12, color: '#666' },
  input: { backgroundColor: '#fff', marginBottom: 8 },
  checkboxContainer: { marginVertical: 12 },
  strengthContainer: { marginTop: 16 },
  strengthLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, color: '#666' },
  strengthBar: { height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, overflow: 'hidden' },
  strengthFill: { height: '100%' },
  fileCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  fileName: { marginTop: 8, fontWeight: '600' },
  actionButton: { borderRadius: 12, paddingVertical: 4 }
});
