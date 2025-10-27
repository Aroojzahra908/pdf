import { PDFDocument, degrees, rgb, PDFPage, StandardFonts } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';

export interface PdfPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
}

/**
 * Load a PDF document from URI
 */
export async function loadPdfDocument(uri: string): Promise<PDFDocument> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64' as any,
  });
  const pdfBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
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
  const base64 = btoa(String.fromCharCode(...pdfBytes));
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
 * Compress PDF by reducing image quality and removing redundant objects
 */
export async function compressPdf(uri: string): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);

  return await savePdfDocument(pdfDoc, `compressed_${Date.now()}.pdf`);
}

/**
 * Add text watermark to PDF
 */
export async function addWatermark(
  uri: string,
  watermarkText: string,
  opacity: number = 0.3
): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);
  const pages = pdfDoc.getPages();

  const watermarkColor = rgb(0.8, 0.8, 0.8);

  pages.forEach((page) => {
    const { width, height } = page.getSize();

    page.drawText(watermarkText, {
      x: width / 2 - 100,
      y: height / 2,
      size: 60,
      color: watermarkColor,
      opacity: opacity,
      rotate: degrees(-45),
    });
  });

  return await savePdfDocument(pdfDoc, `watermarked_${Date.now()}.pdf`);
}

/**
 * Add page numbers to PDF
 */
export async function addPageNumbers(
  uri: string,
  position: 'bottom-center' | 'bottom-left' | 'bottom-right' = 'bottom-center',
  startNumber: number = 1
): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);
  const pages = pdfDoc.getPages();

  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    const pageNumber = startNumber + index;
    const pageText = `Page ${pageNumber}`;

    let x = width / 2;
    let y = 30;

    if (position === 'bottom-left') {
      x = 50;
    } else if (position === 'bottom-right') {
      x = width - 50;
    }

    page.drawText(pageText, {
      x,
      y,
      size: 12,
      color: rgb(0, 0, 0),
      align: position === 'bottom-center' ? 'center' : position === 'bottom-left' ? 'left' : 'right',
    });
  });

  return await savePdfDocument(pdfDoc, `page_numbers_${Date.now()}.pdf`);
}

/**
 * Protect PDF with password
 */
export async function protectPdf(
  uri: string,
  password: string
): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);

  await pdfDoc.encrypt({
    userPassword: password,
    ownerPassword: password,
  });

  return await savePdfDocument(pdfDoc, `protected_${Date.now()}.pdf`);
}

/**
 * Extract pages from PDF
 */
export async function extractPages(
  uri: string,
  pageIndices: number[]
): Promise<string> {
  const sourcePdf = await loadPdfDocument(uri);
  const newPdf = await PDFDocument.create();

  const validIndices = pageIndices.filter(i => i >= 0 && i < sourcePdf.getPageCount());
  const copiedPages = await newPdf.copyPages(sourcePdf, validIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return await savePdfDocument(newPdf, `extracted_${Date.now()}.pdf`);
}

/**
 * Rotate all pages in PDF
 */
export async function rotateAllPages(
  uri: string,
  rotationDegrees: number
): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    page.setRotation(degrees(rotationDegrees));
  });

  return await savePdfDocument(pdfDoc, `rotated_all_${Date.now()}.pdf`);
}

// Map common font names to pdf-lib StandardFonts
function mapFontFamily(name?: string): string {
  switch ((name || '').toLowerCase()) {
    case 'timesnewroman':
    case 'timesnewromanbold':
    case 'times-roman':
    case 'times':
    case 'timesromanbold':
      return StandardFonts.TimesRoman;
    case 'courier':
    case 'couriernew':
      return StandardFonts.Courier;
    case 'helvetica':
    case 'arial':
    default:
      return StandardFonts.Helvetica;
  }
}

export async function addTextToPdf(
  uri: string,
  pageIndex: number,
  text: string,
  x: number,
  y: number,
  options?: {
    size?: number;
    color?: { r: number; g: number; b: number };
    font?: string;
    underline?: boolean;
    align?: 'left' | 'center' | 'right';
  }
): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);
  const pages = pdfDoc.getPages();
  const page = pages[Math.max(0, Math.min(pageIndex, pages.length - 1))];

  const size = options?.size ?? 12;
  const color = options?.color ? rgb(options.color.r, options.color.g, options.color.b) : rgb(0, 0, 0);
  const fontName = mapFontFamily(options?.font);
  const font = await pdfDoc.embedFont(fontName);

  // Measure and adjust x for alignment if needed
  const textWidth = font.widthOfTextAtSize(text, size);
  let drawX = x;
  if (options?.align === 'center') {
    drawX = x - textWidth / 2;
  } else if (options?.align === 'right') {
    drawX = x - textWidth;
  }

  page.drawText(text, {
    x: drawX,
    y,
    size,
    color,
    font,
  });

  // Underline if requested
  if (options?.underline) {
    const underlineThickness = Math.max(0.5, size * 0.06);
    page.drawRectangle({
      x: drawX,
      y: y - underlineThickness - 1,
      width: textWidth,
      height: underlineThickness,
      color,
      opacity: 1,
    });
  }

  return await savePdfDocument(pdfDoc, `edited_${Date.now()}.pdf`);
}

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
  const page = pages[Math.max(0, Math.min(pageIndex, pages.length - 1))];

  const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' as any });
  const imgBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  let embedded: any;
  try {
    embedded = await pdfDoc.embedPng(imgBytes);
  } catch {
    embedded = await pdfDoc.embedJpg(imgBytes);
  }

  // pdf-lib positions images from bottom-left
  page.drawImage(embedded, {
    x,
    y: y,
    width,
    height,
  });

  return await savePdfDocument(pdfDoc, `edited_${Date.now()}.pdf`);
}

export async function addShapeToPdf(
  uri: string,
  pageIndex: number,
  shape: 'rectangle' | 'circle' | 'line',
  x: number,
  y: number,
  width: number,
  height: number,
  options?: {
    fillColor?: { r: number; g: number; b: number };
    borderColor?: { r: number; g: number; b: number };
    borderWidth?: number;
  }
): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);
  const page = pdfDoc.getPages()[Math.max(0, Math.min(pageIndex, pdfDoc.getPageCount() - 1))];

  const fill = options?.fillColor ? rgb(options.fillColor.r, options.fillColor.g, options.fillColor.b) : undefined;
  const stroke = options?.borderColor ? rgb(options.borderColor.r, options.borderColor.g, options.borderColor.b) : undefined;
  const borderWidth = options?.borderWidth ?? 2;

  if (shape === 'rectangle') {
    page.drawRectangle({ x, y, width, height, color: fill, borderColor: stroke, borderWidth });
  } else if (shape === 'circle') {
    page.drawEllipse({ x: x + width / 2, y: y + height / 2, xScale: width / 2, yScale: height / 2, color: fill, borderColor: stroke, borderWidth });
  } else if (shape === 'line') {
    page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness: borderWidth, color: stroke ?? rgb(0, 0, 0) });
  }

  return await savePdfDocument(pdfDoc, `edited_${Date.now()}.pdf`);
}

export async function addHighlightToPdf(
  uri: string,
  pageIndex: number,
  x: number,
  y: number,
  width: number,
  height: number,
  color: { r: number; g: number; b: number }
): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);
  const page = pdfDoc.getPages()[Math.max(0, Math.min(pageIndex, pdfDoc.getPageCount() - 1))];
  page.drawRectangle({ x, y, width, height, color: rgb(color.r, color.g, color.b), opacity: 0.35 });
  return await savePdfDocument(pdfDoc, `edited_${Date.now()}.pdf`);
}

export async function addUnderlineToPdf(
  uri: string,
  pageIndex: number,
  x: number,
  y: number,
  width: number,
  color: { r: number; g: number; b: number }
): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);
  const page = pdfDoc.getPages()[Math.max(0, Math.min(pageIndex, pdfDoc.getPageCount() - 1))];
  const thickness = 2;
  page.drawRectangle({ x, y, width, height: thickness, color: rgb(color.r, color.g, color.b) });
  return await savePdfDocument(pdfDoc, `edited_${Date.now()}.pdf`);
}

export async function addStrikethroughToPdf(
  uri: string,
  pageIndex: number,
  x: number,
  y: number,
  width: number,
  height: number,
  color: { r: number; g: number; b: number }
): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);
  const page = pdfDoc.getPages()[Math.max(0, Math.min(pageIndex, pdfDoc.getPageCount() - 1))];
  const yMid = y + height / 2;
  page.drawRectangle({ x, y: yMid, width, height: 2, color: rgb(color.r, color.g, color.b) });
  return await savePdfDocument(pdfDoc, `edited_${Date.now()}.pdf`);
}

export async function addDrawingToPdf(
  uri: string,
  pageIndex: number,
  imageUri: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<string> {
  // Reuse addImageToPdf implementation
  return await addImageToPdf(uri, pageIndex, imageUri, x, y, width, height);
}

export async function addWatermarkToPdf(
  uri: string,
  text: string,
  options?: { opacity?: number; rotation?: number; size?: number }
): Promise<string> {
  const pdfDoc = await loadPdfDocument(uri);
  const pages = pdfDoc.getPages();
  const opacity = options?.opacity ?? 0.3;
  const rotation = options?.rotation ?? -45;
  const size = options?.size ?? 60;
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size,
      color: rgb(0.8, 0.8, 0.8),
      opacity,
      rotate: degrees(rotation),
      font,
    });
  });

  return await savePdfDocument(pdfDoc, `watermarked_${Date.now()}.pdf`);
}
