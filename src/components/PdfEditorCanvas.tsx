import React, { useRef, useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Button, Text, IconButton, SegmentedButtons, TextInput } from 'react-native-paper';
import SignatureCanvas from 'react-native-signature-canvas';
import * as ImagePicker from 'expo-image-picker';

interface PdfEditorCanvasProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: EditorData) => void;
  pageWidth: number;
  pageHeight: number;
  currentTool: EditorTool;
  position?: { x: number; y: number };
}

export type EditorTool = 
  | 'text' 
  | 'image' 
  | 'shape' 
  | 'highlight' 
  | 'underline' 
  | 'strikethrough' 
  | 'draw' 
  | 'signature';

export interface EditorData {
  tool: EditorTool;
  data: any;
  position: { x: number; y: number };
  size?: { width: number; height: number };
}

export default function PdfEditorCanvas({
  visible,
  onClose,
  onSave,
  pageWidth,
  pageHeight,
  currentTool,
  position,
}: PdfEditorCanvasProps) {
  const signatureRef = useRef<any>(null);
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState('12');
  const [selectedFont, setSelectedFont] = useState<'Helvetica' | 'TimesRoman' | 'Courier'>('Helvetica');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedShape, setSelectedShape] = useState<'rectangle' | 'circle' | 'line'>('rectangle');
  const [width, setWidth] = useState('200');
  const [height, setHeight] = useState('100');

  const handleSaveSignature = (signature: string) => {
    onSave({
      tool: 'signature',
      data: signature,
      position: position || { x: 50, y: pageHeight - 100 },
      size: { width: parseInt(width) || 200, height: parseInt(height) || 100 },
    });
    onClose();
  };

  const handleAddText = () => {
    if (text.trim()) {
      onSave({
        tool: 'text',
        data: {
          text: text.trim(),
          fontSize: parseInt(fontSize) || 12,
          color: hexToRgb(selectedColor),
          fontFamily: selectedFont,
        },
        position: position || { x: 50, y: pageHeight - 100 },
      });
      setText('');
      onClose();
    }
  };

  const handleAddImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      onSave({
        tool: 'image',
        data: result.assets[0].uri,
        position: position || { x: 50, y: pageHeight - 200 },
        size: { width: parseInt(width) || 200, height: parseInt(height) || 200 },
      });
      onClose();
    }
  };

  const handleAddShape = () => {
    onSave({
      tool: 'shape',
      data: {
        shape: selectedShape,
        color: hexToRgb(selectedColor),
      },
      position: position || { x: 50, y: pageHeight - 150 },
      size: { width: parseInt(width) || 150, height: parseInt(height) || 100 },
    });
    onClose();
  };

  const handleAddAnnotation = (type: 'highlight' | 'underline' | 'strikethrough') => {
    onSave({
      tool: type,
      data: {
        color: hexToRgb(selectedColor),
      },
      position: position || { x: 50, y: pageHeight - 100 },
      size: { width: parseInt(width) || 200, height: parseInt(height) || 20 },
    });
    onClose();
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        }
      : { r: 0, g: 0, b: 0 };
  };

  const renderToolContent = () => {
    switch (currentTool) {
      case 'text':
        return (
          <View style={styles.toolContent}>
            <Text variant="titleMedium" style={styles.toolTitle}>Add Text</Text>
            <TextInput
              label="Enter text"
              value={text}
              onChangeText={setText}
              mode="outlined"
              multiline
              style={styles.textInput}
            />
            <TextInput
              label="Font size"
              value={fontSize}
              onChangeText={setFontSize}
              mode="outlined"
              keyboardType="numeric"
              style={styles.fontSizeInput}
            />
            <View style={{ gap: 8 }}>
              <Text>Font:</Text>
              <SegmentedButtons
                value={selectedFont}
                onValueChange={(v) => setSelectedFont(v as any)}
                buttons={[
                  { value: 'Helvetica', label: 'Helvetica' },
                  { value: 'TimesRoman', label: 'Times' },
                  { value: 'Courier', label: 'Courier' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>
            <View style={styles.colorPicker}>
              <Text>Color:</Text>
              <View style={styles.colorOptions}>
                {['#000000', '#FF0000', '#0000FF', '#00FF00', '#FFFF00'].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>
            </View>
            <Button mode="contained" onPress={handleAddText} style={styles.actionButton}>
              Add Text
            </Button>
          </View>
        );

      case 'image':
        return (
          <View style={styles.toolContent}>
            <Text variant="titleMedium" style={styles.toolTitle}>Add Image</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TextInput
                label="Width"
                value={width}
                onChangeText={setWidth}
                mode="outlined"
                keyboardType="numeric"
                style={{ width: 110 }}
              />
              <TextInput
                label="Height"
                value={height}
                onChangeText={setHeight}
                mode="outlined"
                keyboardType="numeric"
                style={{ width: 110 }}
              />
            </View>
            <Button mode="contained" onPress={handleAddImage} icon="image" style={styles.actionButton}>
              Choose Image from Gallery
            </Button>
          </View>
        );

      case 'shape':
        return (
          <View style={styles.toolContent}>
            <Text variant="titleMedium" style={styles.toolTitle}>Add Shape</Text>
            <SegmentedButtons
              value={selectedShape}
              onValueChange={(value) => setSelectedShape(value as any)}
              buttons={[
                { value: 'rectangle', label: 'Rectangle' },
                { value: 'circle', label: 'Circle' },
                { value: 'line', label: 'Line' },
              ]}
              style={styles.segmentedButtons}
            />
            <View style={styles.colorPicker}>
              <Text>Color:</Text>
              <View style={styles.colorOptions}>
                {['#000000', '#FF0000', '#0000FF', '#00FF00', '#FFFF00'].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TextInput
                label="Width"
                value={width}
                onChangeText={setWidth}
                mode="outlined"
                keyboardType="numeric"
                style={{ width: 110 }}
              />
              <TextInput
                label="Height"
                value={height}
                onChangeText={setHeight}
                mode="outlined"
                keyboardType="numeric"
                style={{ width: 110 }}
              />
            </View>
            <Button mode="contained" onPress={handleAddShape} style={styles.actionButton}>
              Add Shape
            </Button>
          </View>
        );

      case 'highlight':
      case 'underline':
      case 'strikethrough':
        return (
          <View style={styles.toolContent}>
            <Text variant="titleMedium" style={styles.toolTitle}>
              Add {currentTool.charAt(0).toUpperCase() + currentTool.slice(1)}
            </Text>
            <View style={styles.colorPicker}>
              <Text>Color:</Text>
              <View style={styles.colorOptions}>
                {['#FFFF00', '#FF0000', '#00FF00', '#0000FF', '#FF00FF'].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TextInput
                label="Width"
                value={width}
                onChangeText={setWidth}
                mode="outlined"
                keyboardType="numeric"
                style={{ width: 110 }}
              />
              <TextInput
                label="Height"
                value={height}
                onChangeText={setHeight}
                mode="outlined"
                keyboardType="numeric"
                style={{ width: 110 }}
              />
            </View>
            <Button
              mode="contained"
              onPress={() => handleAddAnnotation(currentTool)}
              style={styles.actionButton}
            >
              Add {currentTool.charAt(0).toUpperCase() + currentTool.slice(1)}
            </Button>
          </View>
        );

      case 'draw':
      case 'signature':
        return (
          <View style={styles.toolContent}>
            <Text variant="titleMedium" style={styles.toolTitle}>
              {currentTool === 'draw' ? 'Draw' : 'Add Signature'}
            </Text>
            <View style={styles.signatureContainer}>
              <SignatureCanvas
                ref={signatureRef}
                onOK={handleSaveSignature}
                descriptionText={currentTool === 'draw' ? 'Draw here' : 'Sign here'}
                clearText="Clear"
                confirmText="Save"
                webStyle={`.m-signature-pad {box-shadow: none; border: 1px solid #e8e8e8;} 
                          .m-signature-pad--body {border: none;}
                          .m-signature-pad--footer {display: none; margin: 0px;}`}
              />
            </View>
            <View style={styles.signatureButtons}>
              <Button
                mode="outlined"
                onPress={() => signatureRef.current?.clearSignature()}
                style={styles.signatureButton}
              >
                Clear
              </Button>
              <Button
                mode="contained"
                onPress={() => signatureRef.current?.readSignature()}
                style={styles.signatureButton}
              >
                Save
              </Button>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text variant="headlineSmall">Edit PDF</Text>
            <IconButton icon="close" onPress={onClose} />
          </View>
          {renderToolContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toolContent: {
    gap: 16,
  },
  toolTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    minHeight: 100,
  },
  fontSizeInput: {
    width: 120,
  },
  colorPicker: {
    gap: 8,
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  colorOptionSelected: {
    borderColor: '#0fb5b1',
    borderWidth: 3,
  },
  segmentedButtons: {
    marginVertical: 8,
  },
  actionButton: {
    marginTop: 8,
  },
  signatureContainer: {
    height: 300,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 8,
    overflow: 'hidden',
  },
  signatureButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  signatureButton: {
    flex: 1,
  },
});
