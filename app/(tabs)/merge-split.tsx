import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Text, Card, Chip, ActivityIndicator, TextInput } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { mergePdfs, splitPdf } from '../../src/utils/pdfUtils';

interface PdfFile {
  name: string;
  uri: string;
}

export default function MergeSplitScreen() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'merge' | 'split'>('merge');
  const [splitRanges, setSplitRanges] = useState('1-3, 4-6');

  const pickPdfs = async () => {
    const res = await DocumentPicker.getDocumentAsync({ 
      type: 'application/pdf', 
      multiple: mode === 'merge' 
    });
    
    if (res.assets) {
      const newFiles = res.assets.map(a => ({ name: a.name, uri: a.uri }));
      setFiles(mode === 'merge' ? [...files, ...newFiles] : newFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      Alert.alert('Error', 'Please select at least 2 PDFs to merge');
      return;
    }

    try {
      setLoading(true);
      const uris = files.map(f => f.uri);
      const mergedUri = await mergePdfs(uris);
      setLoading(false);

      Alert.alert('Success', 'PDFs merged successfully!', [
        {
          text: 'Share',
          onPress: async () => {
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) await Sharing.shareAsync(mergedUri);
          }
        },
        { text: 'OK' }
      ]);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to merge PDFs');
    }
  };

  const handleSplit = async () => {
    if (files.length === 0) {
      Alert.alert('Error', 'Please select a PDF to split');
      return;
    }

    try {
      setLoading(true);
      
      // Parse ranges like "1-3, 4-6"
      const ranges = splitRanges.split(',').map(range => {
        const [start, end] = range.trim().split('-').map(n => parseInt(n) - 1);
        return { start, end: end || start };
      });

      const outputUris = await splitPdf(files[0].uri, ranges);
      setLoading(false);

      Alert.alert('Success', `PDF split into ${outputUris.length} files!`, [
        {
          text: 'Share First',
          onPress: async () => {
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) await Sharing.shareAsync(outputUris[0]);
          }
        },
        { text: 'OK' }
      ]);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to split PDF. Check your page ranges.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>🔀 Merge / Split PDFs</Text>
          <Text style={styles.subtitle}>
            Combine multiple PDFs or split into parts
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.modeSelector}>
        <Chip 
          selected={mode === 'merge'} 
          onPress={() => { setMode('merge'); setFiles([]); }}
          style={styles.chip}
        >
          Merge PDFs
        </Chip>
        <Chip 
          selected={mode === 'split'} 
          onPress={() => { setMode('split'); setFiles([]); }}
          style={styles.chip}
        >
          Split PDF
        </Chip>
      </View>

      <Button 
        mode="contained" 
        onPress={pickPdfs} 
        icon="file-pdf-box"
        style={styles.button}
      >
        {mode === 'merge' ? 'Pick PDFs to Merge' : 'Pick PDF to Split'}
      </Button>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>Processing...</Text>
        </View>
      )}

      {files.length > 0 && !loading && (
        <Card style={styles.filesCard}>
          <Card.Content>
            <Text variant="titleMedium">Selected Files ({files.length})</Text>
            {files.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <Text style={styles.fileName}>📄 {file.name}</Text>
                <Button 
                  mode="text" 
                  onPress={() => removeFile(index)}
                  compact
                  textColor="#ff595e"
                >
                  Remove
                </Button>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {mode === 'split' && files.length > 0 && (
        <Card style={styles.splitCard}>
          <Card.Content>
            <Text variant="titleMedium">Split Ranges</Text>
            <Text style={styles.hint}>
              Enter page ranges (e.g., "1-3, 4-6, 7-10")
            </Text>
            <TextInput
              mode="outlined"
              value={splitRanges}
              onChangeText={setSplitRanges}
              placeholder="1-3, 4-6"
              style={styles.input}
            />
          </Card.Content>
        </Card>
      )}

      {files.length > 0 && !loading && (
        <Button 
          mode="contained" 
          onPress={mode === 'merge' ? handleMerge : handleSplit}
          icon={mode === 'merge' ? 'merge' : 'call-split'}
          style={styles.actionButton}
        >
          {mode === 'merge' ? `Merge ${files.length} PDFs` : 'Split PDF'}
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#f0fff0', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#8ac926' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  modeSelector: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1 },
  button: { borderRadius: 12 },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  filesCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  fileItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4
  },
  fileName: { flex: 1 },
  splitCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  hint: { fontSize: 12, opacity: 0.7, marginTop: 4, marginBottom: 8 },
  input: { marginTop: 8 },
  actionButton: { borderRadius: 12, paddingVertical: 4 }
});
