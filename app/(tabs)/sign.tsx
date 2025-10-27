import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Text, Card, ActivityIndicator, TextInput } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import SignatureCanvas from 'react-native-signature-canvas';
import { PDFDocument } from 'pdf-lib';

export default function SignPdfScreen() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const signatureRef = useRef<any>(null);

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (res.assets && res.assets[0]) {
        setFileName(res.assets[0].name || 'document.pdf');
        setFileUri(res.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick PDF');
    }
  };

  const handleSignature = (sig: string) => {
    setSignature(sig);
    setShowSignaturePad(false);
  };

  const clearSignature = () => {
    setSignature(null);
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
    }
  };

  const signPdf = async () => {
    if (!fileUri || !signature) {
      Alert.alert('Error', 'Please select a PDF and create a signature');
      return;
    }

    try {
      setLoading(true);

      // Read PDF
      const pdfBytes = await (FileSystem as any).readAsStringAsync(fileUri, {
        encoding: (FileSystem as any).EncodingType.Base64,
      });
      
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Get first page
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      // Convert signature to image
      const signatureImage = signature.replace(/^data:image\/\w+;base64,/, '');
      const signatureBytes = Uint8Array.from(atob(signatureImage), c => c.charCodeAt(0));
      
      let embeddedImage;
      try {
        embeddedImage = await pdfDoc.embedPng(signatureBytes);
      } catch {
        embeddedImage = await pdfDoc.embedJpg(signatureBytes);
      }
      
      // Add signature to bottom right of first page
      const signatureWidth = 150;
      const signatureHeight = 50;
      const { width, height } = firstPage.getSize();
      
      firstPage.drawImage(embeddedImage, {
        x: width - signatureWidth - 50,
        y: 50,
        width: signatureWidth,
        height: signatureHeight,
      });
      
      // Add signer info if provided
      if (signerName) {
        firstPage.drawText(`Signed by: ${signerName}`, {
          x: width - signatureWidth - 50,
          y: 35,
          size: 10,
        });
      }
      
      // Add timestamp
      const timestamp = new Date().toLocaleString();
      firstPage.drawText(`Date: ${timestamp}`, {
        x: width - signatureWidth - 50,
        y: 20,
        size: 8,
      });
      
      // Save signed PDF
      const signedBytes = await pdfDoc.save();
      const outputUri = `${(FileSystem as any).documentDirectory}signed_${Date.now()}.pdf`;
      
      const base64 = btoa(String.fromCharCode(...Array.from(signedBytes)));
      await (FileSystem as any).writeAsStringAsync(outputUri, base64, {
        encoding: (FileSystem as any).EncodingType.Base64,
      });
      
      setFileUri(outputUri);
      setLoading(false);
      Alert.alert('Success', 'PDF signed successfully!');
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to sign PDF');
    }
  };

  const shareFile = async () => {
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
          <Text variant="titleLarge" style={styles.title}>✍️ Sign PDF</Text>
          <Text style={styles.subtitle}>
            Add your electronic signature to PDF documents
          </Text>
        </Card.Content>
      </Card>

      <Button 
        mode="contained" 
        onPress={pickPdf} 
        style={styles.pickButton}
        icon="file-pdf-box"
      >
        Select PDF to Sign
      </Button>

      {fileName && !loading && (
        <>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium">📄 {fileName}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.signerCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Signer Information (Optional)</Text>
              <TextInput
                label="Full Name"
                value={signerName}
                onChangeText={setSignerName}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Email"
                value={signerEmail}
                onChangeText={setSignerEmail}
                mode="outlined"
                keyboardType="email-address"
                style={styles.input}
              />
            </Card.Content>
          </Card>

          <Card style={styles.signatureCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Your Signature</Text>
              
              {!showSignaturePad && !signature && (
                <Button 
                  mode="outlined" 
                  onPress={() => setShowSignaturePad(true)}
                  icon="draw"
                >
                  Create Signature
                </Button>
              )}

              {showSignaturePad && (
                <View style={styles.signaturePadContainer}>
                  <SignatureCanvas
                    ref={signatureRef}
                    onOK={handleSignature}
                    onEmpty={() => Alert.alert('Error', 'Please draw your signature')}
                    descriptionText="Sign above"
                    clearText="Clear"
                    confirmText="Save"
                    webStyle={`.m-signature-pad {box-shadow: none; border: 1px solid #e8e8e8;} .m-signature-pad--body {border: none;} .m-signature-pad--footer {display: none;}`}
                  />
                  <View style={styles.signatureButtons}>
                    <Button onPress={() => signatureRef.current?.clearSignature()}>Clear</Button>
                    <Button mode="contained" onPress={() => signatureRef.current?.readSignature()}>
                      Save Signature
                    </Button>
                  </View>
                </View>
              )}

              {signature && !showSignaturePad && (
                <View>
                  <Text style={styles.signaturePreviewText}>Signature Preview:</Text>
                  <View style={styles.signaturePreview}>
                    <Text>✓ Signature captured</Text>
                  </View>
                  <Button mode="text" onPress={clearSignature}>
                    Clear & Redraw
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>

          <View style={styles.actionButtons}>
            <Button 
              mode="contained" 
              onPress={signPdf}
              icon="pen"
              style={styles.signButton}
              disabled={!signature}
            >
              Sign PDF
            </Button>
            <Button 
              mode="outlined" 
              onPress={shareFile}
              icon="share"
            >
              Share Signed PDF
            </Button>
          </View>
        </>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9c27b0" />
          <Text>Signing PDF...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#f3e5f5', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#9c27b0' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  pickButton: { borderRadius: 12, backgroundColor: '#9c27b0' },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  signerCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  signatureCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  sectionTitle: { marginBottom: 12, fontWeight: '600' },
  input: { marginBottom: 12 },
  signaturePadContainer: { height: 300, marginBottom: 12 },
  signatureButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  signaturePreview: { 
    borderWidth: 1, 
    borderColor: '#e0e0e0', 
    borderRadius: 8, 
    padding: 16, 
    alignItems: 'center',
    marginBottom: 12 
  },
  signaturePreviewText: { marginBottom: 8, fontWeight: '600' },
  actionButtons: { gap: 12 },
  signButton: { backgroundColor: '#9c27b0' },
  loadingContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
});
