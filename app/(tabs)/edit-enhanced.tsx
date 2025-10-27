import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Button, Text, Card, ActivityIndicator, IconButton, SegmentedButtons } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import {
  loadPdfDocument,
  getPdfPageInfo,
  addTextToPdf,
} from '../../src/utils/pdfUtils';
import type { PdfPageInfo } from '../../src/utils/pdfUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type EditorMode = 'annotate' | 'edit';
type TextAlign = 'left' | 'center' | 'right';

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: TextAlign;
  color: string;
}

export default function EditPdfEnhancedScreen() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [pages, setPages] = useState<PdfPageInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  
  // Text editing state
  const [selectedFont, setSelectedFont] = useState('TimesNewRomanBold');
  const [fontSize, setFontSize] = useState(13.56);
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<TextAlign>('left');
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const buildPdfHtml = (base64: string, pageNum: number, scale: number) => `<!doctype html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin:0; padding:0; height:100%; overflow:hidden; background:#525659; }
      #wrap { width:100%; height:100%; overflow:auto; display:flex; align-items:center; justify-content:center; }
      #canvas { display:block; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
      window.addEventListener('load', async () => {
        try {
          if (window['pdfjsLib'] && window['pdfjsLib'].GlobalWorkerOptions) {
            window['pdfjsLib'].GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          }
          const pdfData = atob('${base64}');
          const uint8Array = new Uint8Array(pdfData.length);
          for (let i = 0; i < pdfData.length; i++) uint8Array[i] = pdfData.charCodeAt(i);
          const pdf = await window['pdfjsLib'].getDocument({ data: uint8Array }).promise;
          const page = await pdf.getPage(${pageNum});
          const viewport = page.getViewport({ scale: ${scale} });
          const canvas = document.getElementById('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width; canvas.height = viewport.height;
          await page.render({ canvasContext: context, viewport }).promise;
        } catch (e) { console.error(e); }
      });
    </script>
  </head>
  <body>
    <div id="wrap"><canvas id="canvas"></canvas></div>
  </body>
  </html>`;

  const refreshPreview = async (uri: string, pageIdx: number) => {
    try {
      const base64 = await (FileSystem as any).readAsStringAsync(uri, { encoding: 'base64' });
      setPreviewHtml(buildPdfHtml(base64, pageIdx + 1, zoom * 0.4));
    } catch (e) {
      setPreviewHtml('');
    }
  };

  useEffect(() => {
    if (fileUri) {
      refreshPreview(fileUri, currentPage);
    }
  }, [fileUri, currentPage, zoom]);

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (res.assets && res.assets[0]) {
        setLoading(true);
        const picked = res.assets[0];
        const safeName = picked.name || `picked_${Date.now()}.pdf`;
        const destUri = `${(FileSystem as any).documentDirectory}${safeName}`;
        await (FileSystem as any).copyAsync({ from: picked.uri, to: destUri });
        setFileName(safeName);
        setFileUri(destUri);

        const pdfDoc = await loadPdfDocument(destUri);
        const pageInfo = await getPdfPageInfo(pdfDoc);
        setPages(pageInfo);
        setLoading(false);
        await refreshPreview(destUri, 0);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to load PDF');
    }
  };

  const saveAndShare = async () => {
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

  const fontOptions = [
    { label: 'Times New Roman', value: 'TimesNewRomanBold' },
    { label: 'Arial', value: 'Arial' },
    { label: 'Helvetica', value: 'Helvetica' },
    { label: 'Courier', value: 'Courier' },
  ];

  const renderTopToolbar = () => (
    <View style={styles.topToolbar}>
      <View style={styles.toolbarLeft}>
        <TouchableOpacity 
          style={[styles.toolbarTab, editorMode === 'annotate' && styles.toolbarTabActive]}
          onPress={() => setEditorMode('annotate')}
        >
          <Text style={[styles.toolbarTabText, editorMode === 'annotate' && styles.toolbarTabTextActive]}>
            ✏️ Annotate
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toolbarTab, editorMode === 'edit' && styles.toolbarTabActive]}
          onPress={() => setEditorMode('edit')}
        >
          <Text style={[styles.toolbarTabText, editorMode === 'edit' && styles.toolbarTabTextActive]}>
            📝 Edit
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.toolbarRight}>
        <IconButton icon="hand-back-left" size={20} />
        <IconButton icon="cursor-default" size={20} />
        <IconButton icon="image" size={20} />
        <IconButton icon="draw" size={20} />
        <IconButton icon="comment" size={20} />
      </View>
    </View>
  );

  const renderTextFormattingToolbar = () => (
    <View style={styles.formattingToolbar}>
      <View style={styles.formattingRow}>
        {/* Font Family Dropdown */}
        <View style={styles.fontDropdown}>
          <Text style={styles.dropdownText}>{selectedFont}</Text>
          <IconButton icon="chevron-down" size={16} />
        </View>

        {/* Font Size */}
        <View style={styles.fontSizeControl}>
          <Text style={styles.fontSizeText}>{fontSize.toFixed(2)}</Text>
          <IconButton icon="chevron-down" size={16} />
        </View>

        {/* Text Formatting Buttons */}
        <IconButton 
          icon="format-bold" 
          size={20} 
          selected={textBold}
          onPress={() => setTextBold(!textBold)}
          style={textBold ? styles.formatButtonActive : {}}
        />
        <IconButton 
          icon="format-italic" 
          size={20}
          selected={textItalic}
          onPress={() => setTextItalic(!textItalic)}
          style={textItalic ? styles.formatButtonActive : {}}
        />
        <IconButton 
          icon="format-underline" 
          size={20}
          selected={textUnderline}
          onPress={() => setTextUnderline(!textUnderline)}
          style={textUnderline ? styles.formatButtonActive : {}}
        />

        {/* Alignment */}
        <IconButton 
          icon="format-align-left" 
          size={20}
          selected={textAlign === 'left'}
          onPress={() => setTextAlign('left')}
          style={textAlign === 'left' ? styles.formatButtonActive : {}}
        />
        <IconButton 
          icon="format-align-center" 
          size={20}
          selected={textAlign === 'center'}
          onPress={() => setTextAlign('center')}
          style={textAlign === 'center' ? styles.formatButtonActive : {}}
        />
        <IconButton 
          icon="format-align-right" 
          size={20}
          selected={textAlign === 'right'}
          onPress={() => setTextAlign('right')}
          style={textAlign === 'right' ? styles.formatButtonActive : {}}
        />

        {/* Color Picker */}
        <IconButton icon="palette" size={20} />

        {/* Delete */}
        <IconButton icon="delete" size={20} iconColor="#ff595e" />
      </View>
    </View>
  );

  const renderPageThumbnails = () => (
    <View style={styles.thumbnailSidebar}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {pages.map((page, index) => (
          <TouchableOpacity
            key={page.pageNumber}
            onPress={() => setCurrentPage(index)}
            style={[
              styles.thumbnailCard,
              currentPage === index && styles.thumbnailCardActive
            ]}
          >
            <View style={styles.thumbnailPreview}>
              <Text style={styles.thumbnailIcon}>📄</Text>
            </View>
            <Text style={styles.thumbnailNumber}>{page.pageNumber}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderBottomControls = () => (
    <View style={styles.bottomControls}>
      <View style={styles.bottomLeft}>
        <IconButton icon="chevron-up" size={20} />
        <IconButton icon="chevron-down" size={20} />
      </View>
      
      <View style={styles.bottomCenter}>
        <IconButton 
          icon="minus" 
          size={20} 
          onPress={() => setZoom(Math.max(0.5, zoom - 0.1))}
        />
        <IconButton 
          icon="plus" 
          size={20}
          onPress={() => setZoom(Math.min(3, zoom + 0.1))}
        />
        <Text style={styles.pageIndicator}>
          {currentPage + 1} / {pages.length}
        </Text>
        <Text style={styles.zoomIndicator}>{Math.round(zoom * 100)}%</Text>
      </View>

      <View style={styles.bottomRight}>
        <IconButton icon="fit-to-page" size={20} />
        <IconButton icon="download" size={20} />
      </View>
    </View>
  );

  const renderHelpSidebar = () => (
    <View style={styles.helpSidebar}>
      <Card style={styles.helpCard}>
        <Card.Content>
          <Text style={styles.helpTitle}>Edit PDF</Text>
          <Text style={styles.helpText}>
            Use the toolbar to modify or add text, upload images, and annotate with ease.
          </Text>
        </Card.Content>
      </Card>
    </View>
  );

  if (!fileUri) {
    return (
      <View style={styles.emptyContainer}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>✏️ Edit PDF</Text>
            <Text style={styles.subtitle}>
              Professional PDF editing with text formatting, annotations, and more
            </Text>
          </Card.Content>
        </Card>

        <Button 
          mode="contained" 
          onPress={pickPdf} 
          style={styles.pickButton}
          icon="file-pdf-box"
        >
          Upload PDF to Edit
        </Button>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0fb5b1" />
            <Text>Loading PDF...</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* Top Toolbar */}
      {renderTopToolbar()}

      {/* Text Formatting Toolbar */}
      {editorMode === 'edit' && renderTextFormattingToolbar()}

      {/* Main Content Area */}
      <View style={styles.contentArea}>
        {/* Left Sidebar - Page Thumbnails */}
        {renderPageThumbnails()}

        {/* Center - PDF Viewer */}
        <View style={styles.pdfViewerContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0fb5b1" />
              <Text>Processing PDF...</Text>
            </View>
          ) : (
            <View style={styles.pdfViewer}>
              <WebView
                originWhitelist={["*"]}
                source={{ html: previewHtml }}
                style={styles.webview}
                javaScriptEnabled
                domStorageEnabled
              />
            </View>
          )}
        </View>

        {/* Right Sidebar - Help */}
        {renderHelpSidebar()}
      </View>

      {/* Bottom Controls */}
      {renderBottomControls()}

      {/* Action Button */}
      <TouchableOpacity style={styles.editPdfButton} onPress={saveAndShare}>
        <Text style={styles.editPdfButtonText}>Edit PDF</Text>
        <IconButton icon="close" size={20} iconColor="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    padding: 16,
    gap: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
  },
  headerCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#0fb5b1',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 8,
  },
  pickButton: {
    borderRadius: 12,
    marginTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  topToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  toolbarLeft: {
    flexDirection: 'row',
    gap: 4,
  },
  toolbarTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toolbarTabActive: {
    backgroundColor: '#f0f0f0',
  },
  toolbarTabText: {
    fontSize: 14,
    color: '#666',
  },
  toolbarTabTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  toolbarRight: {
    flexDirection: 'row',
    gap: 4,
  },
  formattingToolbar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  formattingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fontDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dropdownText: {
    fontSize: 13,
    color: '#333',
  },
  fontSizeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  fontSizeText: {
    fontSize: 13,
    color: '#333',
    minWidth: 40,
    textAlign: 'center',
  },
  formatButtonActive: {
    backgroundColor: '#e3f2fd',
  },
  contentArea: {
    flex: 1,
    flexDirection: 'row',
  },
  thumbnailSidebar: {
    width: 120,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  thumbnailCard: {
    marginBottom: 12,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailCardActive: {
    borderColor: '#0fb5b1',
    backgroundColor: '#f0f9ff',
  },
  thumbnailPreview: {
    width: 80,
    height: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  thumbnailIcon: {
    fontSize: 32,
  },
  thumbnailNumber: {
    fontSize: 12,
    color: '#666',
  },
  pdfViewerContainer: {
    flex: 1,
    backgroundColor: '#525659',
    padding: 16,
  },
  pdfViewer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  helpSidebar: {
    width: 280,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    padding: 16,
  },
  helpCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0fb5b1',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bottomLeft: {
    flexDirection: 'row',
  },
  bottomCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomRight: {
    flexDirection: 'row',
  },
  pageIndicator: {
    color: '#fff',
    fontSize: 14,
    marginHorizontal: 8,
  },
  zoomIndicator: {
    color: '#fff',
    fontSize: 14,
    marginHorizontal: 8,
  },
  editPdfButton: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    backgroundColor: '#ff6b6b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  editPdfButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
