import { PDFDocument, degrees } from 'pdf-lib';
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
