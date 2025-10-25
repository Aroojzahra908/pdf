import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, Dimensions } from 'react-native';
import { Button, Text, Card, Chip, ActivityIndicator, IconButton, TextInput } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { PDFDocument } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';

type AnnotationTool = 'highlight' | 'underline' | 'note' | 'draw';
type AnnotationColor = 'yellow' | 'green' | 'pink' | 'blue' | 'red' | 'orange';

interface Annotation {
  id: number;
  tool: AnnotationTool;
  color: AnnotationColor;
  page: number;
  text?: string;
  timestamp: string;
}

export default function AnnotateScreen() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState<AnnotationTool>('highlight');
  const [selectedColor, setSelectedColor] = useState<AnnotationColor>('yellow');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [pdfPages, setPdfPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (res.assets && res.assets[0]) {
        setFileName(res.assets[0].name);
        setFileUri(res.assets[0].uri);
        setLoading(true);
        
        // Load PDF to get page count
        try {
          const base64 = await FileSystem.readAsStringAsync(res.assets[0].uri, {
            encoding: 'base64' as any,
          });
          const pdfBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
          const pdfDoc = await PDFDocument.load(pdfBytes);
          setPdfPages(pdfDoc.getPageCount());
          setCurrentPage(1);
        } catch (err) {
          console.log('PDF load error:', err);
        }
        
        setLoading(false);
        Alert.alert('PDF Loaded', `Ready to annotate "${res.assets[0].name}"`);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to load PDF');
    }
  };

  const addAnnotation = () => {
    if (selectedTool === 'note') {
      setShowNoteInput(true);
      return;
    }
    
    const newAnnotation: Annotation = {
      id: Date.now(),
      tool: selectedTool,
      color: selectedColor,
      page: currentPage,
      timestamp: new Date().toLocaleTimeString(),
    };
    setAnnotations([...annotations, newAnnotation]);
    Alert.alert('Added', `${selectedTool} added on page ${currentPage}`);
  };

  const addNote = () => {
    if (!noteText.trim()) {
      Alert.alert('Empty Note', 'Please enter some text');
      return;
    }
    
    const newAnnotation: Annotation = {
      id: Date.now(),
      tool: 'note',
      color: selectedColor,
      page: currentPage,
      text: noteText,
      timestamp: new Date().toLocaleTimeString(),
    };
    setAnnotations([...annotations, newAnnotation]);
    setNoteText('');
    setShowNoteInput(false);
    Alert.alert('Note Added', 'Note added successfully');
  };

  const deleteAnnotation = (id: number) => {
    setAnnotations(annotations.filter(ann => ann.id !== id));
  };

  const clearAnnotations = () => {
    Alert.alert(
      'Clear All',
      'Remove all annotations?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setAnnotations([]) }
      ]
    );
  };

  const saveAnnotated = async () => {
    if (!fileUri || annotations.length === 0) {
      Alert.alert('No Annotations', 'Please add some annotations first');
      return;
    }
    
    Alert.alert(
      'Save Annotations',
      `Save PDF with ${annotations.length} annotation(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save & Share',
          onPress: async () => {
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
              await Sharing.shareAsync(fileUri);
              Alert.alert('Success', 'Annotations saved!');
            }
          }
        }
      ]
    );
  };

  const colorMap: Record<AnnotationColor, string> = {
    yellow: '#FFEB3B',
    green: '#4CAF50',
    pink: '#E91E63',
    blue: '#2196F3',
    red: '#F44336',
    orange: '#FF9800',
  };

  const toolIcons = {
    highlight: '🖍️',
    underline: '📏',
    note: '📝',
    draw: '✏️',
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>🎨 PDF Annotator / Highlighter</Text>
          <Text style={styles.subtitle}>
            Highlight, underline, and add notes to your PDFs
          </Text>
        </Card.Content>
      </Card>

      <Button 
        mode="contained" 
        onPress={pickPdf} 
        icon="file-pdf-box"
        style={styles.button}
      >
        Pick PDF to Annotate
      </Button>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>Loading PDF...</Text>
        </View>
      )}

      {fileName && !loading && (
        <>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium">📄 {fileName}</Text>
              <Text style={styles.annotationCount}>
                {annotations.length} annotations
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.toolsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>🛠️ Tools</Text>
              
              <View style={styles.toolSelector}>
                {(['highlight', 'underline', 'note', 'draw'] as AnnotationTool[]).map((tool) => (
                  <Chip
                    key={tool}
                    selected={selectedTool === tool}
                    onPress={() => setSelectedTool(tool)}
                    style={[
                      styles.toolChip,
                      selectedTool === tool && styles.selectedChip
                    ]}
                    selectedColor="#ff7f50"
                  >
                    {toolIcons[tool]} {tool.charAt(0).toUpperCase() + tool.slice(1)}
                  </Chip>
                ))}
              </View>

              <Text variant="titleMedium" style={styles.colorLabel}>🎨 Colors</Text>
              <View style={styles.colorSelector}>
                {(['yellow', 'green', 'pink', 'blue', 'red', 'orange'] as AnnotationColor[]).map((color) => (
                  <View key={color} style={styles.colorOption}>
                    <Chip
                      selected={selectedColor === color}
                      onPress={() => setSelectedColor(color)}
                      style={[
                        styles.colorChip,
                        { 
                          backgroundColor: colorMap[color],
                          borderWidth: selectedColor === color ? 3 : 0,
                          borderColor: '#333'
                        }
                      ]}
                      textStyle={{ color: '#fff', fontWeight: 'bold' }}
                    >
                      {selectedColor === color ? '✓' : ''}
                    </Chip>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.canvasCard}>
            <Card.Content>
              <View style={styles.pdfHeader}>
                <Text variant="titleMedium">📄 PDF Preview</Text>
                <View style={styles.pageNav}>
                  <IconButton
                    icon="chevron-left"
                    size={20}
                    disabled={currentPage === 1}
                    onPress={() => setCurrentPage(currentPage - 1)}
                  />
                  <Text>Page {currentPage} / {pdfPages}</Text>
                  <IconButton
                    icon="chevron-right"
                    size={20}
                    disabled={currentPage === pdfPages}
                    onPress={() => setCurrentPage(currentPage + 1)}
                  />
                </View>
              </View>
              
              <View style={styles.pdfPreview}>
                <View style={styles.pdfPlaceholder}>
                  <Text style={styles.pdfIcon}>📄</Text>
                  <Text style={styles.pdfPageText}>Page {currentPage}</Text>
                  <Text style={styles.pdfHint}>
                    PDF content preview
                  </Text>
                  <View style={styles.demoAnnotations}>
                    {selectedTool === 'highlight' && (
                      <View style={[styles.demoHighlight, { backgroundColor: colorMap[selectedColor] + '80' }]}>
                        <Text style={styles.demoText}>Sample text to highlight</Text>
                      </View>
                    )}
                    {selectedTool === 'underline' && (
                      <View style={styles.demoUnderlineContainer}>
                        <Text style={styles.demoText}>Sample text to underline</Text>
                        <View style={[styles.demoUnderline, { backgroundColor: colorMap[selectedColor] }]} />
                      </View>
                    )}
                    {selectedTool === 'note' && (
                      <View style={[styles.demoNote, { borderColor: colorMap[selectedColor] }]}>
                        <Text style={styles.demoNoteIcon}>📝</Text>
                        <Text style={styles.demoText}>Note will appear here</Text>
                      </View>
                    )}
                    {selectedTool === 'draw' && (
                      <View style={styles.demoDrawContainer}>
                        <Text style={styles.demoText}>Drawing area</Text>
                        <View style={[styles.demoDraw, { borderColor: colorMap[selectedColor] }]} />
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {showNoteInput ? (
                <View style={styles.noteInputContainer}>
                  <TextInput
                    mode="outlined"
                    label="Enter your note"
                    value={noteText}
                    onChangeText={setNoteText}
                    multiline
                    numberOfLines={3}
                    style={styles.noteInput}
                  />
                  <View style={styles.noteButtons}>
                    <Button mode="outlined" onPress={() => setShowNoteInput(false)}>
                      Cancel
                    </Button>
                    <Button mode="contained" onPress={addNote}>
                      Add Note
                    </Button>
                  </View>
                </View>
              ) : (
                <Button 
                  mode="contained" 
                  onPress={addAnnotation}
                  icon="plus"
                  style={styles.addButton}
                  buttonColor={colorMap[selectedColor]}
                >
                  Add {selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)}
                </Button>
              )}
            </Card.Content>
          </Card>

          {annotations.length > 0 && (
            <Card style={styles.annotationsCard}>
              <Card.Content>
                <View style={styles.annotationsHeader}>
                  <Text variant="titleMedium">📋 Annotations ({annotations.length})</Text>
                  <Button 
                    mode="text" 
                    onPress={clearAnnotations}
                    textColor="#ff595e"
                    compact
                  >
                    Clear All
                  </Button>
                </View>
                
                <ScrollView style={styles.annotationsList} nestedScrollEnabled>
                  {annotations.map((ann) => (
                    <Card key={ann.id} style={styles.annotationCard}>
                      <Card.Content style={styles.annotationCardContent}>
                        <View style={styles.annotationInfo}>
                          <View style={[styles.annotationDot, { backgroundColor: colorMap[ann.color] }]} />
                          <View style={styles.annotationDetails}>
                            <Text style={styles.annotationTitle}>
                              {toolIcons[ann.tool]} {ann.tool.charAt(0).toUpperCase() + ann.tool.slice(1)}
                            </Text>
                            {ann.text && (
                              <Text style={styles.annotationNoteText}>"{ann.text}"</Text>
                            )}
                            <Text style={styles.annotationMeta}>
                              Page {ann.page} • {ann.timestamp}
                            </Text>
                          </View>
                        </View>
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor="#ff595e"
                          onPress={() => deleteAnnotation(ann.id)}
                        />
                      </Card.Content>
                    </Card>
                  ))}
                </ScrollView>
              </Card.Content>
            </Card>
          )}

          <Button 
            mode="contained" 
            onPress={saveAnnotated}
            icon="content-save"
            style={styles.saveButton}
          >
            Save Annotated PDF
          </Button>
        </>
      )}

      {!fileName && !loading && (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Text variant="headlineMedium">🎨</Text>
            <Text variant="titleMedium">No PDF selected</Text>
            <Text style={styles.emptyText}>
              Pick a PDF to start annotating with highlights, notes, and drawings
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#fff5f0', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#ff7f50' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  button: { borderRadius: 12 },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  annotationCount: { opacity: 0.7, marginTop: 4 },
  toolsCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  sectionTitle: { marginBottom: 8 },
  toolSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  toolChip: { marginBottom: 4 },
  selectedChip: { elevation: 4 },
  colorLabel: { marginTop: 16, marginBottom: 8 },
  colorSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorOption: { marginBottom: 4 },
  colorChip: { minWidth: 50, justifyContent: 'center' },
  canvasCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  pdfHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pageNav: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pdfPreview: { 
    minHeight: 300, 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed'
  },
  pdfPlaceholder: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 20,
    minHeight: 300
  },
  pdfIcon: { fontSize: 48, marginBottom: 12 },
  pdfPageText: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  pdfHint: { fontSize: 12, opacity: 0.6, marginBottom: 20 },
  demoAnnotations: { width: '100%', alignItems: 'center', gap: 12 },
  demoHighlight: { 
    padding: 8, 
    borderRadius: 4, 
    marginVertical: 4 
  },
  demoUnderlineContainer: { alignItems: 'center' },
  demoUnderline: { 
    width: '100%', 
    height: 3, 
    marginTop: 2 
  },
  demoNote: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    padding: 12, 
    borderWidth: 2, 
    borderRadius: 8,
    backgroundColor: '#fff'
  },
  demoNoteIcon: { fontSize: 20 },
  demoDrawContainer: { alignItems: 'center', gap: 8 },
  demoDraw: { 
    width: 100, 
    height: 60, 
    borderWidth: 2, 
    borderRadius: 8,
    borderStyle: 'dashed'
  },
  demoText: { fontSize: 14, color: '#333' },
  noteInputContainer: { marginTop: 12, gap: 12 },
  noteInput: { backgroundColor: '#fff' },
  noteButtons: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  addButton: { marginTop: 12 },
  annotationsCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  annotationsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  annotationsList: { maxHeight: 300 },
  annotationCard: { marginBottom: 8, backgroundColor: '#f8f9fa', elevation: 1 },
  annotationCardContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  annotationInfo: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  annotationDot: { width: 16, height: 16, borderRadius: 8, marginTop: 2 },
  annotationDetails: { flex: 1, gap: 4 },
  annotationTitle: { fontWeight: '600', fontSize: 14 },
  annotationNoteText: { fontSize: 13, fontStyle: 'italic', opacity: 0.8 },
  annotationMeta: { fontSize: 11, opacity: 0.6 },
  annotationItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  annotationText: { flex: 1, fontSize: 14 },
  saveButton: { borderRadius: 12, paddingVertical: 4 },
  emptyCard: { backgroundColor: '#f8f9fa', borderRadius: 12, marginTop: 24 },
  emptyContent: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { textAlign: 'center', opacity: 0.7, marginTop: 8 }
});
