import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button, Text, Card, Chip, ActivityIndicator, Dialog, Portal, TextInput } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import {
  rotatePage,
  deletePages,
  reorderPages,
  getPdfPageInfo,
  loadPdfDocument,
  addTextToPdf,
  addImageToPdf,
  addShapeToPdf,
  addHighlightToPdf,
  addUnderlineToPdf,
  addStrikethroughToPdf,
  addWatermarkToPdf,
  addDrawingToPdf,
} from '../../src/utils/pdfUtils';
import type { PdfPageInfo } from '../../src/utils/pdfUtils';
import PdfEditorCanvas, { EditorTool, EditorData } from '../../src/components/PdfEditorCanvas';
import { processTextWithAI } from '../../src/utils/aiUtils';

export default function EditPdfScreen() {
  const ENABLE_REORDER = false;
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [pages, setPages] = useState<PdfPageInfo[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [editorVisible, setEditorVisible] = useState(false);
  const [currentTool, setCurrentTool] = useState<EditorTool>('text');
  const [watermarkDialogVisible, setWatermarkDialogVisible] = useState(false);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [aiDialogVisible, setAiDialogVisible] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [reorderMode, setReorderMode] = useState(false);
  const [placementMode, setPlacementMode] = useState(false);
  const [pendingTool, setPendingTool] = useState<EditorTool | null>(null);
  const [previewSize, setPreviewSize] = useState<{width: number; height: number}>({ width: 0, height: 0 });
  const [placementPos, setPlacementPos] = useState<{x: number; y: number} | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [placingData, setPlacingData] = useState<EditorData | null>(null);
  const [placingViewPos, setPlacingViewPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingPlace, setIsDraggingPlace] = useState(false);
  const [annotatingTool, setAnnotatingTool] = useState<EditorTool | null>(null);
  const [dragStart, setDragStart] = useState<{x: number; y: number} | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{x: number; y: number} | null>(null);
  const [zoom, setZoom] = useState(1.5);

  const buildPdfHtml = (base64: string, pageNum: number, scale: number) => `<!doctype html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin:0; padding:0; height:100%; overflow:hidden; background:#fff; }
      #wrap { width:100%; height:100%; overflow:auto; }
      #canvas { display:block; margin:0 auto; }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
      window.addEventListener('load', async () => {
        try {
          // Configure worker for pdf.js
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
      setPreviewHtml(buildPdfHtml(base64, pageIdx + 1, zoom));
    } catch (e) {
      setPreviewHtml('');
    }
  };

  // Drag placement handlers
  const handlePlaceGrant = (e: any) => {
    if (!placingData || !placingViewPos) return false;
    const { locationX, locationY } = e.nativeEvent;
    setDragStart({ x: locationX - placingViewPos.x, y: locationY - placingViewPos.y });
    setIsDraggingPlace(true);
    return true;
  };

  const handlePlaceMove = (e: any) => {
    if (!placingData || !isDraggingPlace || !dragStart) return;
    const { locationX, locationY } = e.nativeEvent;
    setPlacingViewPos({ x: locationX - dragStart.x, y: locationY - dragStart.y });
  };

  const handlePlaceRelease = () => {
    setIsDraggingPlace(false);
    setDragStart(null);
  };

  const confirmPlacement = async () => {
    if (!placingData || !placingViewPos) return;
    const { x, y } = placingViewPos;
    const { x: pdfX, y: pdfY } = viewToPdfCoords(x, y);
    const toApply: EditorData = { ...placingData, position: { x: pdfX, y: pdfY } };
    setPlacingData(null);
    await applyEditorData(toApply);
  };

  const cancelPlacement = () => {
    setPlacingData(null);
    setPlacingViewPos(null);
  };

  const viewToPdfCoords = (xView: number, yView: number) => {
    const page = pages[currentPage];
    const scaleX = page.width / (previewSize.width || 1);
    const scaleY = page.height / (previewSize.height || 1);
    const pdfX = xView * scaleX;
    const pdfY = page.height - yView * scaleY; // invert Y
    return { x: pdfX, y: pdfY, scaleX, scaleY };
  };

  const pdfToViewCoords = (xPdf: number, yPdf: number) => {
    const page = pages[currentPage];
    const x = (xPdf / (page.width || 1)) * (previewSize.width || 1);
    const y = (1 - (yPdf / (page.height || 1))) * (previewSize.height || 1);
    return { x, y };
  };

  const pdfSizeToView = (wPdf: number, hPdf: number) => {
    const page = pages[currentPage];
    const scaleX = page.width / (previewSize.width || 1);
    const scaleY = page.height / (previewSize.height || 1);
    return { w: wPdf / (scaleX || 1), h: hPdf / (scaleY || 1) };
  };

  const handleOverlayGrant = (e: any) => {
    if (!annotatingTool) return false;
    const { locationX, locationY } = e.nativeEvent;
    setDragStart({ x: locationX, y: locationY });
    setDragCurrent({ x: locationX, y: locationY });
    return true;
  };

  const handleOverlayMove = (e: any) => {
    if (!annotatingTool || !dragStart) return;
    const { locationX, locationY } = e.nativeEvent;
    setDragCurrent({ x: locationX, y: locationY });
  };

  const handleOverlayRelease = async (e: any) => {
    if (!annotatingTool || !dragStart || !dragCurrent || !fileUri) return;
    const left = Math.min(dragStart.x, dragCurrent.x);
    const top = Math.min(dragStart.y, dragCurrent.y);
    const width = Math.abs(dragCurrent.x - dragStart.x);
    const height = Math.abs(dragCurrent.y - dragStart.y);

    // Map to PDF coordinates
    const { x: pdfX, y: pdfY, scaleX, scaleY } = viewToPdfCoords(left, top + height);
    const pdfWidth = Math.max(1, width * scaleX);
    let pdfHeight = Math.max(1, height * scaleY);

    // Defaults per tool
    let color = { r: 1, g: 1, b: 0 }; // highlight yellow
    if (annotatingTool === 'underline') {
      color = { r: 0, g: 0, b: 0 }; // black
      pdfHeight = Math.max(2, 2 * scaleY); // thin line
    } else if (annotatingTool === 'strikethrough') {
      color = { r: 1, g: 0, b: 0 }; // red
      pdfHeight = Math.max(2, 2 * scaleY);
    }

    await applyEditorData({
      tool: annotatingTool,
      data: { color },
      position: { x: pdfX, y: pdfY - (annotatingTool === 'underline' ? 0 : pdfHeight) },
      size: { width: pdfWidth, height: annotatingTool === 'underline' ? pdfHeight : pdfHeight },
    });

    // reset drag state
    setAnnotatingTool(null);
    setDragStart(null);
    setDragCurrent(null);
  };

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (res.assets && res.assets[0]) {
        setLoading(true);
        const picked = res.assets[0];
        const safeName = picked.name || `picked_${Date.now()}.pdf`;
        const destUri = `${(FileSystem as any).documentDirectory}${safeName}`;
        // Copy into app sandbox to avoid content:// permission issues
        await (FileSystem as any).copyAsync({ from: picked.uri, to: destUri });
        setFileName(safeName);
        setFileUri(destUri);

        // Load PDF and get page info from sandboxed path
        const pdfDoc = await loadPdfDocument(destUri);
        const pageInfo = await getPdfPageInfo(pdfDoc);
        setPages(pageInfo);
        setSelectedPages(new Set());
        setLoading(false);
        await refreshPreview(destUri, 0);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to load PDF');
    }
  };

  const togglePageSelection = (pageNum: number) => {
    const newSelection = new Set(selectedPages);
    if (newSelection.has(pageNum)) {
      newSelection.delete(pageNum);
    } else {
      newSelection.add(pageNum);
    }
    setSelectedPages(newSelection);
  };

  const rotateSelectedPages = async (direction: 'left' | 'right') => {
    if (!fileUri || selectedPages.size === 0) return;

    try {
      setLoading(true);
      const rotation = direction === 'left' ? -90 : 90;
      let newUri = fileUri;

      for (const pageNum of Array.from(selectedPages)) {
        const currentRotation = pages[pageNum - 1].rotation;
        const newRotation = (currentRotation + rotation) % 360;
        newUri = await rotatePage(newUri, pageNum - 1, newRotation);
      }

      const pdfDoc = await loadPdfDocument(newUri);
      const pageInfo = await getPdfPageInfo(pdfDoc);
      setPages(pageInfo);
      setFileUri(newUri);
      setSelectedPages(new Set());
      setLoading(false);
      await refreshPreview(newUri, currentPage);
      Alert.alert('Success', `Rotated ${selectedPages.size} page(s)`);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to rotate pages');
    }
  };

  const deleteSelectedPages = async () => {
    if (!fileUri || selectedPages.size === 0) return;
    
    Alert.alert(
      'Confirm Delete',
      `Delete ${selectedPages.size} page(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const indices = Array.from(selectedPages).map(p => p - 1);
              const newUri = await deletePages(fileUri, indices);
              
              // Reload PDF
              const pdfDoc = await loadPdfDocument(newUri);
              const pageInfo = await getPdfPageInfo(pdfDoc);
              setPages(pageInfo);
              setFileUri(newUri);
              setSelectedPages(new Set());
              setLoading(false);
              await refreshPreview(newUri, 0);
              
              Alert.alert('Success', 'Pages deleted successfully');
            } catch (error) {
              setLoading(false);
              Alert.alert('Error', 'Failed to delete pages');
            }
          }
        }
      ]
    );
  };

  const openEditorTool = (tool: EditorTool) => {
    if (tool === 'highlight' || tool === 'underline' || tool === 'strikethrough') {
      // Drag-to-annotate mode
      setAnnotatingTool(tool);
      setPlacementMode(false);
      setPendingTool(null);
      setDragStart(null);
      setDragCurrent(null);
      return;
    }
    // Tap-to-place for other tools
    setPendingTool(tool);
    setPlacementMode(true);
  };

  const handlePreviewTap = (xView: number, yView: number) => {
    if (!placementMode || !pages[currentPage]) return;
    const page = pages[currentPage];
    const scaleX = page.width / (previewSize.width || 1);
    const scaleY = page.height / (previewSize.height || 1);
    const pdfX = xView * scaleX;
    const pdfY = page.height - yView * scaleY; // invert Y
    setPlacementPos({ x: pdfX, y: pdfY });
    if (pendingTool) {
      setCurrentTool(pendingTool);
      setEditorVisible(true);
    }
    setPlacementMode(false);
  };

  const applyEditorData = async (data: EditorData) => {
    if (!fileUri) return;
    try {
      setLoading(true);
      let newUri = fileUri;

      switch (data.tool) {
        case 'text':
          newUri = await addTextToPdf(
            fileUri,
            currentPage,
            data.data.text,
            data.position.x,
            data.position.y,
            { size: data.data.fontSize, color: data.data.color }
          );
          break;
        case 'image':
          if (data.size) {
            newUri = await addImageToPdf(
              fileUri,
              currentPage,
              data.data,
              data.position.x,
              data.position.y,
              data.size.width,
              data.size.height
            );
          }
          break;
        case 'shape':
          if (data.size) {
            newUri = await addShapeToPdf(
              fileUri,
              currentPage,
              data.data.shape,
              data.position.x,
              data.position.y,
              data.size.width,
              data.size.height,
              { borderColor: data.data.color, borderWidth: 2 }
            );
          }
          break;
        case 'highlight':
          if (data.size) {
            newUri = await addHighlightToPdf(
              fileUri,
              currentPage,
              data.position.x,
              data.position.y,
              data.size.width,
              data.size.height,
              data.data.color
            );
          }
          break;
        case 'underline':
          if (data.size) {
            newUri = await addUnderlineToPdf(
              fileUri,
              currentPage,
              data.position.x,
              data.position.y,
              data.size.width,
              data.data.color
            );
          }
          break;
        case 'strikethrough':
          if (data.size) {
            newUri = await addStrikethroughToPdf(
              fileUri,
              currentPage,
              data.position.x,
              data.position.y,
              data.size.width,
              data.size.height,
              data.data.color
            );
          }
          break;
        case 'signature':
        case 'draw':
          if (data.size) {
            const base64Data = data.data.replace(/^data:image\/\w+;base64,/, '');
            const imgFile = `${(FileSystem as any).documentDirectory}sig_${Date.now()}.png`;
            await FileSystem.writeAsStringAsync(imgFile, base64Data, { encoding: 'base64' as any });
            newUri = await addDrawingToPdf(
              fileUri,
              currentPage,
              imgFile,
              data.position.x,
              data.position.y,
              data.size.width,
              data.size.height
            );
          }
          break;
      }

      const pdfDoc = await loadPdfDocument(newUri);
      const pageInfo = await getPdfPageInfo(pdfDoc);
      setPages(pageInfo);
      setFileUri(newUri);
      setEditorVisible(false);
      setLoading(false);
      await refreshPreview(newUri, currentPage);
      Alert.alert('Success', 'Changes applied successfully');
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to apply changes');
    }
  };


  const beginPlacement = (data: EditorData) => {
    // Stage placement on preview (drag to final position)
    setEditorVisible(false);
    setPlacingData(data);
    // compute initial view coords from provided pdf coords or center
    const initPdfX = data.position?.x ?? (pages[currentPage]?.width || 0) / 2;
    const initPdfY = data.position?.y ?? (pages[currentPage]?.height || 0) / 2;
    const { x, y } = pdfToViewCoords(initPdfX, initPdfY);
    setPlacingViewPos({ x, y });
  };

  const handleAddWatermark = async () => {
    if (!fileUri || !watermarkText.trim()) return;
    try {
      setLoading(true);
      const newUri = await addWatermarkToPdf(fileUri, watermarkText, { opacity: 0.3, rotation: -45, size: 48 });
      const pdfDoc = await loadPdfDocument(newUri);
      const pageInfo = await getPdfPageInfo(pdfDoc);
      setPages(pageInfo);
      setFileUri(newUri);
      setWatermarkDialogVisible(false);
      setLoading(false);
      await refreshPreview(newUri, currentPage);
      Alert.alert('Success', 'Watermark added');
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to add watermark');
    }
  };

  const handleAIProcess = async () => {
    if (!aiText.trim()) return;
    try {
      setLoading(true);
      const result = await processTextWithAI(aiText, { action: 'correct' });
      setAiResult(result);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to process text');
    }
  };

  const handleReorderPages = async (data: PdfPageInfo[]) => {
    if (!fileUri) return;
    try {
      setLoading(true);
      const newOrder = data.map((p) => p.pageNumber - 1);
      const newUri = await reorderPages(fileUri, newOrder);
      const pdfDoc = await loadPdfDocument(newUri);
      const pageInfo = await getPdfPageInfo(pdfDoc);
      setPages(pageInfo);
      setFileUri(newUri);
      setReorderMode(false);
      setLoading(false);
      Alert.alert('Success', 'Pages reordered');
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to reorder pages');
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>✏️ Edit PDF</Text>
          <Text style={styles.subtitle}>
            Edit text, images, shapes, annotate, draw/sign, reorder, rotate, delete, watermark, and AI tools
          </Text>
        </Card.Content>
      </Card>

      <Button 
        mode="contained" 
        onPress={pickPdf} 
        style={styles.pickButton}
        icon="file-pdf-box"
      >
        Pick PDF to Edit
      </Button>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>Processing PDF...</Text>
        </View>
      )}

      {fileName && !loading && (
        <>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium">📄 {fileName}</Text>
              <Text style={styles.pageCount}>{pages.length} pages</Text>
              {selectedPages.size > 0 && (
                <Chip style={styles.selectionChip}>
                  {selectedPages.size} page(s) selected
                </Chip>
              )}
              <View style={styles.actionButtons}>
                <Button mode="outlined" icon="text" onPress={() => { setCurrentPage(0); openEditorTool('text'); }}>Add Text</Button>
                <Button mode="outlined" icon="image" onPress={() => { setCurrentPage(0); openEditorTool('image'); }}>Add Image</Button>
                <Button mode="outlined" icon="shape" onPress={() => { setCurrentPage(0); openEditorTool('shape'); }}>Add Shape</Button>
              </View>
              <View style={styles.actionButtons}>
                <Button mode="outlined" icon="marker" onPress={() => openEditorTool('highlight')}>Highlight</Button>
                <Button mode="outlined" icon="format-underline" onPress={() => openEditorTool('underline')}>Underline</Button>
                <Button mode="outlined" icon="format-strikethrough" onPress={() => openEditorTool('strikethrough')}>Strikethrough</Button>
              </View>
              <View style={styles.actionButtons}>
                <Button mode="outlined" icon="draw" onPress={() => openEditorTool('draw')}>Draw</Button>
                <Button mode="outlined" icon="draw-pen" onPress={() => openEditorTool('signature')}>Signature</Button>
                <Button mode="outlined" icon="water" onPress={() => setWatermarkDialogVisible(true)}>Watermark</Button>
                <Button mode="outlined" icon="robot" onPress={() => setAiDialogVisible(true)}>AI Text</Button>
              </View>
            </Card.Content>
          </Card>

          <View style={styles.actionButtons}>
            <Button 
              mode="outlined" 
              disabled={selectedPages.size === 0}
              onPress={() => rotateSelectedPages('left')}
              icon="rotate-left"
            >
              Rotate Left
            </Button>
            <Button 
              mode="outlined" 
              disabled={selectedPages.size === 0}
              onPress={() => rotateSelectedPages('right')}
              icon="rotate-right"
            >
              Rotate Right
            </Button>
          </View>

          <View style={styles.actionButtons}>
            <Button 
              mode="outlined" 
              disabled={selectedPages.size === 0}
              onPress={deleteSelectedPages}
              icon="delete"
              textColor="#ff595e"
            >
              Delete Pages
            </Button>
            {ENABLE_REORDER && (
              <Button 
                mode="outlined" 
                onPress={() => setReorderMode(!reorderMode)}
                icon="reorder-horizontal"
              >
                {reorderMode ? 'Done' : 'Reorder'}
              </Button>
            )}
            <Button 
              mode="contained" 
              onPress={saveAndShare}
              icon="share"
            >
              Save & Share
            </Button>
          </View>

          <Text variant="titleMedium" style={styles.sectionTitle}>Preview (Tap/Drag on page)</Text>

          <View style={styles.controlBar}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Button mode="outlined" onPress={() => setZoom(Math.max(0.5, parseFloat((zoom - 0.25).toFixed(2))))}>−</Button>
              <Text>Zoom {Math.round(zoom * 100)}%</Text>
              <Button mode="outlined" onPress={() => setZoom(Math.min(3, parseFloat((zoom + 0.25).toFixed(2))))}>+</Button>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button mode="outlined" disabled={currentPage <= 0} onPress={() => setCurrentPage(Math.max(0, currentPage - 1))}>Prev</Button>
              <Button mode="outlined" disabled={currentPage >= pages.length - 1} onPress={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}>Next</Button>
            </View>
          </View>

          {fileUri ? (
            <View
              style={styles.previewContainer}
              onLayout={(e) => setPreviewSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
            >
              <WebView
                originWhitelist={["*"]}
                source={{ html: previewHtml }}
                style={styles.pdf}
                javaScriptEnabled
                domStorageEnabled
              />
              <View
                style={styles.previewOverlay}
                onStartShouldSetResponder={() => true}
                onResponderGrant={(e) => {
                  if (placingData) {
                    handlePlaceGrant(e);
                  } else if (annotatingTool) {
                    handleOverlayGrant(e);
                  }
                }}
                onResponderMove={(e) => {
                  if (placingData) {
                    handlePlaceMove(e);
                  } else if (annotatingTool) {
                    handleOverlayMove(e);
                  }
                }}
                onResponderRelease={(e) => {
                  if (placingData) {
                    handlePlaceRelease();
                  } else if (annotatingTool) {
                    handleOverlayRelease(e);
                  } else {
                    const { locationX, locationY } = e.nativeEvent as any;
                    handlePreviewTap(locationX, locationY);
                  }
                }}
              >
                {placementMode && (
                  <View style={styles.placementBanner}>
                    <Text style={styles.placementBannerText}>Tap on preview to place</Text>
                  </View>
                )}
                {annotatingTool && dragStart && dragCurrent && (
                  <View
                    style={{
                      position: 'absolute',
                      left: Math.min(dragStart.x, dragCurrent.x),
                      top: Math.min(dragStart.y, dragCurrent.y),
                      width: Math.abs(dragCurrent.x - dragStart.x),
                      height: Math.abs(dragCurrent.y - dragStart.y) || 2,
                      borderWidth: 1,
                      borderColor: annotatingTool === 'highlight' ? '#f7d96f' : (annotatingTool === 'underline' ? '#000' : '#ff595e'),
                      backgroundColor: annotatingTool === 'highlight' ? 'rgba(247,217,111,0.35)' : 'transparent',
                    }}
                  />
                )}
                {placingData && placingViewPos && (
                  <>
                    <View
                      style={[
                        styles.placementBox,
                        {
                          left: placingViewPos.x,
                          top: placingViewPos.y,
                          width: placingData.size ? pdfSizeToView(placingData.size.width || 40, placingData.size.height || 20).w : 40,
                          height: placingData.size ? pdfSizeToView(placingData.size.width || 40, placingData.size.height || 20).h : 20,
                        },
                      ]}
                    />
                    <View style={[styles.placementButtons, { left: placingViewPos.x, top: Math.max(0, placingViewPos.y - 40) }]}>
                      <Button mode="contained" compact onPress={confirmPlacement}>Confirm</Button>
                      <Button mode="text" compact onPress={cancelPlacement}>Cancel</Button>
                    </View>
                  </>
                )}
                {placementPos && (
                  <View
                    style={[
                      styles.marker,
                      {
                        left: Math.max(0, Math.min(previewSize.width - 12, (placementPos.x / (pages[currentPage]?.width || 1)) * (previewSize.width || 1))) - 6,
                        top: Math.max(0, Math.min(previewSize.height - 12, (1 - (placementPos.y / (pages[currentPage]?.height || 1))) * (previewSize.height || 1))) - 6,
                      },
                    ]}
                  />
                )}
              </View>
            </View>
          ) : null}

          {ENABLE_REORDER && reorderMode ? (
            <Text>Reorder is temporarily disabled. Update app to enable.</Text>
          ) : (
            <View style={styles.pageGrid}>
              {pages.map((page) => (
                <TouchableOpacity
                  key={page.pageNumber}
                  onPress={() => {
                    togglePageSelection(page.pageNumber);
                    setCurrentPage(page.pageNumber - 1);
                  }}
                >
                  <Card 
                    style={[
                      styles.pageCard,
                      selectedPages.has(page.pageNumber) && styles.pageCardSelected
                    ]}
                  >
                    <Card.Content style={styles.pageCardContent}>
                      <Text variant="headlineSmall">📄</Text>
                      <Text variant="titleMedium">Page {page.pageNumber}</Text>
                      <Text style={styles.pageSize}>
                        {Math.round(page.width)} × {Math.round(page.height)}
                      </Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <PdfEditorCanvas
            visible={editorVisible}
            onClose={() => setEditorVisible(false)}
            onSave={beginPlacement}
            pageWidth={pages[currentPage]?.width || 595}
            pageHeight={pages[currentPage]?.height || 842}
            currentTool={currentTool}
            position={placementPos || undefined}
          />

          <Portal>
            <Dialog visible={watermarkDialogVisible} onDismiss={() => setWatermarkDialogVisible(false)}>
              <Dialog.Title>Add Watermark</Dialog.Title>
              <Dialog.Content>
                <TextInput
                  label="Watermark Text"
                  value={watermarkText}
                  onChangeText={setWatermarkText}
                  mode="outlined"
                />
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setWatermarkDialogVisible(false)}>Cancel</Button>
                <Button onPress={handleAddWatermark}>Add</Button>
              </Dialog.Actions>
            </Dialog>

            <Dialog visible={aiDialogVisible} onDismiss={() => setAiDialogVisible(false)}>
              <Dialog.Title>AI Text Tools</Dialog.Title>
              <Dialog.Content>
                <TextInput
                  label="Enter text to process"
                  value={aiText}
                  onChangeText={setAiText}
                  mode="outlined"
                  multiline
                />
                {aiResult ? (
                  <View style={{ marginTop: 12 }}>
                    <Text variant="labelLarge">Result</Text>
                    <Text>{aiResult}</Text>
                  </View>
                ) : null}
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setAiDialogVisible(false)}>Close</Button>
                <Button onPress={handleAIProcess}>Process</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#f0f9ff', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#0fb5b1' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  pickButton: { borderRadius: 12 },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  pageCount: { opacity: 0.7, marginTop: 4 },
  selectionChip: { marginTop: 8, alignSelf: 'flex-start' },
  actionButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sectionTitle: { marginTop: 8, fontWeight: '600' },
  pageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pageCard: { 
    width: 100, 
    borderRadius: 12, 
    backgroundColor: '#fff',
    elevation: 2
  },
  pageCardSelected: { 
    backgroundColor: '#e0f7f7', 
    borderWidth: 2, 
    borderColor: '#0fb5b1' 
  },
  pageCardContent: { alignItems: 'center', gap: 4 },
  pageSize: { fontSize: 10, opacity: 0.6 },
  draggableItem: { marginVertical: 6 },
  pageCardHorizontal: {
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pageCardHorizontalContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageCardActive: { opacity: 0.8 },
  previewContainer: {
    width: '100%',
    aspectRatio: 595 / 842,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
  },
  pdf: {
    ...StyleSheet.absoluteFillObject as any,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject as any,
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  placementBanner: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(15,181,177,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  placementBannerText: {
    color: '#fff',
    fontWeight: '600',
  },
  placementBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#0fb5b1',
    backgroundColor: 'rgba(15,181,177,0.15)',
  },
  placementButtons: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  marker: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff595e',
    borderWidth: 2,
    borderColor: '#fff',
  },
})
;
