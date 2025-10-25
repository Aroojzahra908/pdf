import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Button, Text, Card, Chip, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import * as Speech from 'expo-speech';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

export default function ReaderScreen() {
  const [reading, setReading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [pitch, setPitch] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [voice, setVoice] = useState<'default' | 'male' | 'female'>('default');

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (res.assets && res.assets[0]) {
        setFileName(res.assets[0].name);
        setLoading(true);
        
        // For demo: simulate text extraction
        // In production, you'd use a PDF text extraction library or API
        const sampleText = `Welcome to Smart PDF Reader! 
        
This is a demonstration of the text-to-speech feature. In a production app, this text would be extracted from your PDF document using OCR or PDF parsing libraries.

You can adjust the voice pitch and reading speed using the controls below. The app supports natural-sounding voices for an enhanced reading experience.

Perfect for listening to study materials, articles, or any PDF content while multitasking!`;
        
        setExtractedText(sampleText);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to load PDF');
    }
  };

  const startReading = async () => {
    if (!extractedText) {
      Alert.alert('No Text', 'Please select a PDF first');
      return;
    }

    setReading(true);
    
    const voiceOptions: any = {
      pitch,
      rate,
      onDone: () => setReading(false),
      onStopped: () => setReading(false),
      onError: () => {
        setReading(false);
        Alert.alert('Error', 'Failed to read text');
      },
    };

    // Note: Voice selection is platform-specific
    // On iOS, you can specify language for different voices
    if (voice === 'female') {
      voiceOptions.language = 'en-US';
    } else if (voice === 'male') {
      voiceOptions.language = 'en-GB';
    }

    Speech.speak(extractedText, voiceOptions);
  };

  const pauseReading = () => {
    if (Platform.OS === 'ios') {
      Speech.pause();
    } else {
      // Android doesn't support pause, so we stop instead
      Speech.stop();
      setReading(false);
    }
  };

  const resumeReading = () => {
    if (Platform.OS === 'ios') {
      Speech.resume();
    } else {
      // Android doesn't support resume, restart reading
      startReading();
    }
  };

  const stopReading = () => {
    Speech.stop();
    setReading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>🗣️ PDF Reader with Voice</Text>
          <Text style={styles.subtitle}>
            Listen to your PDFs with natural text-to-speech
          </Text>
        </Card.Content>
      </Card>

      <Button 
        mode="contained" 
        onPress={pickPdf} 
        icon="file-pdf-box"
        style={styles.button}
      >
        Pick PDF to Read
      </Button>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>Extracting text...</Text>
        </View>
      )}

      {fileName && !loading && (
        <>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium">📖 {fileName}</Text>
              <Text style={styles.textPreview} numberOfLines={5}>
                {extractedText}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.controlsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.controlTitle}>Voice Controls</Text>
              
              <View style={styles.controlGroup}>
                <Text>Voice Type</Text>
                <SegmentedButtons
                  value={voice}
                  onValueChange={(value) => setVoice(value as any)}
                  buttons={[
                    { value: 'default', label: 'Default' },
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                  ]}
                  style={styles.segmented}
                />
              </View>

              <View style={styles.controlGroup}>
                <Text>Pitch: {pitch.toFixed(1)}</Text>
                <View style={styles.controlButtons}>
                  <Button mode="outlined" onPress={() => setPitch(Math.max(0.5, pitch - 0.1))} disabled={reading} compact>-</Button>
                  <Button mode="outlined" onPress={() => setPitch(1.0)} disabled={reading} compact>Reset</Button>
                  <Button mode="outlined" onPress={() => setPitch(Math.min(2.0, pitch + 0.1))} disabled={reading} compact>+</Button>
                </View>
              </View>

              <View style={styles.controlGroup}>
                <Text>Speed: {rate.toFixed(1)}x</Text>
                <View style={styles.controlButtons}>
                  <Button mode="outlined" onPress={() => setRate(Math.max(0.5, rate - 0.1))} disabled={reading} compact>-</Button>
                  <Button mode="outlined" onPress={() => setRate(1.0)} disabled={reading} compact>Reset</Button>
                  <Button mode="outlined" onPress={() => setRate(Math.min(2.0, rate + 0.1))} disabled={reading} compact>+</Button>
                </View>
              </View>
            </Card.Content>
          </Card>

          <View style={styles.playbackButtons}>
            {!reading ? (
              <Button 
                mode="contained" 
                onPress={startReading}
                icon="play"
                style={styles.playButton}
              >
                Start Reading
              </Button>
            ) : (
              <>
                <Button 
                  mode="outlined" 
                  onPress={pauseReading}
                  icon={Platform.OS === 'ios' ? 'pause' : 'stop'}
                >
                  {Platform.OS === 'ios' ? 'Pause' : 'Stop'}
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={resumeReading}
                  icon="play"
                >
                  {Platform.OS === 'ios' ? 'Resume' : 'Restart'}
                </Button>
                <Button 
                  mode="contained" 
                  onPress={stopReading}
                  icon="stop"
                  buttonColor="#ff595e"
                >
                  Stop
                </Button>
              </>
            )}
          </View>

          {reading && (
            <Card style={styles.statusCard}>
              <Card.Content style={styles.statusContent}>
                <ActivityIndicator size="small" />
                <Text>Reading aloud...</Text>
              </Card.Content>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#fff0f5', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#f28482' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  button: { borderRadius: 12 },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  textPreview: { marginTop: 8, opacity: 0.7, lineHeight: 20 },
  controlsCard: { backgroundColor: '#f8f9fa', borderRadius: 12, elevation: 2 },
  controlTitle: { marginBottom: 12, fontWeight: '600' },
  controlGroup: { marginTop: 12, gap: 8 },
  controlButtons: { flexDirection: 'row', gap: 8 },
  segmented: { marginTop: 4 },
  playbackButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  playButton: { flex: 1, borderRadius: 12 },
  statusCard: { backgroundColor: '#e0f7f7', borderRadius: 12 },
  statusContent: { flexDirection: 'row', alignItems: 'center', gap: 12 }
});
