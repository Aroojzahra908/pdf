import { PDFDocument, degrees, rgb, StandardFonts, PDFPage, PDFFont, PDFImage } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';

export interface PdfPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
}

// Base64 helpers (no external deps)
const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
function base64ToUint8Array(base64: string): Uint8Array {
  let bufferLength = base64.length * 0.75;
  if (base64.endsWith('==')) bufferLength -= 2;
  else if (base64.endsWith('=')) bufferLength -= 1;

  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < base64.length; i += 4) {
    const encoded1 = b64chars.indexOf(base64[i]);
    const encoded2 = b64chars.indexOf(base64[i + 1]);
    const encoded3 = b64chars.indexOf(base64[i + 2]);
    const encoded4 = b64chars.indexOf(base64[i + 3]);

    const chr1 = (encoded1 << 2) | (encoded2 >> 4);
    const chr2 = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    const chr3 = ((encoded3 & 3) << 6) | encoded4;

    bytes[p++] = chr1;
    if (encoded3 !== 64) bytes[p++] = chr2;
    if (encoded4 !== 64) bytes[p++] = chr3;
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let base64 = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const a = bytes[i];
    const b = i + 1 < len ? bytes[i + 1] : 0;
    const c = i + 2 < len ? bytes[i + 2] : 0;

    const triplet = (a << 16) | (b << 8) | c;
    base64 +=
      b64chars[(triplet >> 18) & 63] +
      b64chars[(triplet >> 12) & 63] +
      (i + 1 < len ? b64chars[(triplet >> 6) & 63] : '=') +
      (i + 2 < len ? b64chars[triplet & 63] : '=');
  }
  return base64;
}

/**
 * Load a PDF document from URI
 */
export async function loadPdfDocument(uri: string): Promise<PDFDocument> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64' as any,
  });
  const pdfBytes = base64ToUint8Array(base64);
  return await PDFDocument.load(pdfBytes);
}

/**
 * Save PDF document to file system
 */
export async function savePdfDocument(
  pdfDoc: PDFDocument,
  fileName: string
): Promise<string> {
  const pdfBytes = await pdfDoc.save();
  const base64 = uint8ArrayToBase64(pdfBytes);
  const fileUri = `${(FileSystem as any).documentDirectory}${fileName}`;
  
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: 'base64' as any,
  });
  
  return fileUri;
}

/**
 * Get page information from PDF
 */
export async function getPdfPageInfo(pdfDoc: PDFDocument): Promise<PdfPageInfo[]> {
  const pages = pdfDoc.getPages();
  return pages.map((page, index) => ({
    pageNumber: index + 1,
    width: page.getWidth(),
    height: page.getHeight(),
    rotation: page.getRotation().angle,
  }));
}

/**
 * Rotate a specific page
 */
export async function rotatePage(
  uri: string,
  pageIndex: number,
  rotationDegrees: number
): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);
  const pages = pdfDoc.getPages();
  
  if (pageIndex >= 0 && pageIndex < pages.length) {
    const page = pages[pageIndex];
    page.setRotation(degrees(rotationDegrees));
  }
  
  return await savePdfDocument(pdfDoc, `rotated_${Date.now()}.pdf`);
}

/**
 * Delete specific pages
 */
export async function deletePages(
  uri: string,
  pageIndices: number[]
): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);
  
  // Sort in descending order to avoid index shifting
  const sortedIndices = [...pageIndices].sort((a, b) => b - a);
  
  for (const index of sortedIndices) {
    if (index >= 0 && index < pdfDoc.getPageCount()) {
      pdfDoc.removePage(index);
    }
  }
  
  return await savePdfDocument(pdfDoc, `edited_${Date.now()}.pdf`);
}

/**
 * Merge multiple PDFs
 */
export async function mergePdfs(uris: string[]): Promise<string> {
  const mergedPdf = await PDFDocument.create();
  
  for (const uri of uris) {
    const pdfDoc = await loadPdfDocument(uri);
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  
  return await savePdfDocument(mergedPdf, `merged_${Date.now()}.pdf`);
}

/**
 * Split PDF into separate files
 */
export async function splitPdf(
  uri: string,
  pageRanges: { start: number; end: number }[]
): Promise<string[]> {
  const sourcePdf = await loadPdfDocument(uri);
  const outputUris: string[] = [];
  
  for (let i = 0; i < pageRanges.length; i++) {
    const { start, end } = pageRanges[i];
    const newPdf = await PDFDocument.create();
    
    const pageIndices = Array.from(
      { length: end - start + 1 },
      (_, idx) => start + idx
    );
    
    const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));
    
    const outputUri = await savePdfDocument(newPdf, `split_part${i + 1}_${Date.now()}.pdf`);
    outputUris.push(outputUri);
  }
  
  return outputUris;
}

/**
 * Reorder pages in PDF
 */
export async function reorderPages(
  uri: string,
  newOrder: number[]
): Promise<string> {
  const sourcePdf = await loadPdfDocument(uri);
  const newPdf = await PDFDocument.create();
  
  const copiedPages = await newPdf.copyPages(sourcePdf, newOrder);
  copiedPages.forEach((page) => newPdf.addPage(page));
  
  return await savePdfDocument(newPdf, `reordered_${Date.now()}.pdf`);
}

/**
 * Add text to PDF page
 */
export async function addTextToPdf(
  uri: string,
  pageIndex: number,
  text: string,
  x: number,
  y: number,
  options?: {
    size?: number;
    color?: { r: number; g: number; b: number };
    font?: 'Helvetica' | 'TimesRoman' | 'Courier';
  }
): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);
  const pages = pdfDoc.getPages();
  
  if (pageIndex >= 0 && pageIndex < pages.length) {
    const page = pages[pageIndex];
    const fontSize = options?.size || 12;
    const color = options?.color || { r: 0, g: 0, b: 0 };
    
    let font: PDFFont;
    switch (options?.font) {
      case 'TimesRoman':
        font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        break;
      case 'Courier':
        font = await pdfDoc.embedFont(StandardFonts.Courier);
        break;
      default:
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
    
    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
    });
  }
  
  return await savePdfDocument(pdfDoc, `text_added_${Date.now()}.pdf`);
}

/**
 * Add image to PDF page
 */
export async function addImageToPdf(
  uri: string,
  pageIndex: number,
  imageUri: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);
  const pages = pdfDoc.getPages();
  
  if (pageIndex >= 0 && pageIndex < pages.length) {
    const page = pages[pageIndex];
    
    // Read image file
    const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64' as any,
    });
    const imageBytes = base64ToUint8Array(imageBase64);
    let image: PDFImage;
    if (imageUri.toLowerCase().endsWith('.png')) {
      image = await pdfDoc.embedPng(imageBytes);
    } else {
      image = await pdfDoc.embedJpg(imageBytes);
    }
    
    page.drawImage(image, {
      x,
      y,
      width,
      height,
    });
  }
  
  return await savePdfDocument(pdfDoc, `image_added_${Date.now()}.pdf`);
}

/**
 * Add shape to PDF page
 */
export async function addShapeToPdf(
  uri: string,
  pageIndex: number,
  shape: 'rectangle' | 'circle' | 'line',
  x: number,
  y: number,
  width: number,
  height: number,
  options?: {
    borderColor?: { r: number; g: number; b: number };
    borderWidth?: number;
    fillColor?: { r: number; g: number; b: number };
    opacity?: number;
  }
): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);
  const pages = pdfDoc.getPages();
  
  if (pageIndex >= 0 && pageIndex < pages.length) {
    const page = pages[pageIndex];
    const borderColor = options?.borderColor || { r: 0, g: 0, b: 0 };
    const borderWidth = options?.borderWidth || 2;
    const opacity = options?.opacity || 1;
    
    if (shape === 'rectangle') {
      if (options?.fillColor) {
        page.drawRectangle({
          x,
          y,
          width,
          height,
          borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
          borderWidth,
          color: rgb(options.fillColor.r, options.fillColor.g, options.fillColor.b),
          opacity,
        });
      } else {
        page.drawRectangle({
          x,
          y,
          width,
          height,
          borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
          borderWidth,
          opacity,
        });
      }
    } else if (shape === 'circle') {
      const radius = Math.min(width, height) / 2;
      page.drawCircle({
        x: x + width / 2,
        y: y + height / 2,
        size: radius,
        borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
        borderWidth,
        opacity,
      });
    } else if (shape === 'line') {
      page.drawLine({
        start: { x, y },
        end: { x: x + width, y: y + height },
        thickness: borderWidth,
        color: rgb(borderColor.r, borderColor.g, borderColor.b),
        opacity,
      });
    }
  }
  
  return await savePdfDocument(pdfDoc, `shape_added_${Date.now()}.pdf`);
}

/**
 * Add highlight annotation to text
 */
export async function addHighlightToPdf(
  uri: string,
  pageIndex: number,
  x: number,
  y: number,
  width: number,
  height: number,
  color?: { r: number; g: number; b: number }
): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);
  const pages = pdfDoc.getPages();
  
  if (pageIndex >= 0 && pageIndex < pages.length) {
    const page = pages[pageIndex];
    const highlightColor = color || { r: 1, g: 1, b: 0 }; // Yellow by default
    
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: rgb(highlightColor.r, highlightColor.g, highlightColor.b),
      opacity: 0.3,
    });
  }
  
  return await savePdfDocument(pdfDoc, `highlighted_${Date.now()}.pdf`);
}

/**
 * Add underline to text area
 */
export async function addUnderlineToPdf(
  uri: string,
  pageIndex: number,
  x: number,
  y: number,
  width: number,
  color?: { r: number; g: number; b: number }
): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);
  const pages = pdfDoc.getPages();
  
  if (pageIndex >= 0 && pageIndex < pages.length) {
    const page = pages[pageIndex];
    const lineColor = color || { r: 0, g: 0, b: 0 };
    
    page.drawLine({
      start: { x, y },
      end: { x: x + width, y },
      thickness: 2,
      color: rgb(lineColor.r, lineColor.g, lineColor.b),
    });
  }
  
  return await savePdfDocument(pdfDoc, `underlined_${Date.now()}.pdf`);
}

/**
 * Add strikethrough to text area
 */
export async function addStrikethroughToPdf(
  uri: string,
  pageIndex: number,
  x: number,
  y: number,
  width: number,
  height: number,
  color?: { r: number; g: number; b: number }
): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);
  const pages = pdfDoc.getPages();
  
  if (pageIndex >= 0 && pageIndex < pages.length) {
    const page = pages[pageIndex];
    const lineColor = color || { r: 1, g: 0, b: 0 };
    
    page.drawLine({
      start: { x, y: y + height / 2 },
      end: { x: x + width, y: y + height / 2 },
      thickness: 2,
      color: rgb(lineColor.r, lineColor.g, lineColor.b),
    });
  }
  
  return await savePdfDocument(pdfDoc, `strikethrough_${Date.now()}.pdf`);
}

/**
 * Add watermark to PDF
 */
export async function addWatermarkToPdf(
  uri: string,
  watermarkText: string,
  options?: {
    opacity?: number;
    rotation?: number;
    size?: number;
    color?: { r: number; g: number; b: number };
  }
): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const fontSize = options?.size || 48;
  const opacity = options?.opacity || 0.3;
  const rotation = options?.rotation || -45;
  const color = options?.color || { r: 0.5, g: 0.5, b: 0.5 };
  
  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
    
    page.drawText(watermarkText, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: degrees(rotation),
    });
  });
  
  return await savePdfDocument(pdfDoc, `watermarked_${Date.now()}.pdf`);
}

/**
 * Add drawing/signature to PDF
 */
export async function addDrawingToPdf(
  uri: string,
  pageIndex: number,
  drawingImageUri: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<string> {
  return await addImageToPdf(uri, pageIndex, drawingImageUri, x, y, width, height);
}

/**
 * Extract text from PDF page
 */
export async function extractTextFromPage(
  uri: string,
  pageIndex: number
): Promise<string> {
  // Note: pdf-lib doesn't support text extraction directly
  // This is a placeholder - you'd need a different library like pdf.js for actual text extraction
  return 'Text extraction requires additional library implementation';
}
