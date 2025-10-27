import { PDFDocument, degrees, rgb, PDFPage } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';

export interface PdfPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
}

export async function loadPdfDocument(uri: string): Promise<PDFDocument> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64' as any,
    });
    const pdfBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    return await PDFDocument.load(pdfBytes);
  } catch (error) {
    throw new Error(`Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function savePdfDocument(
  pdfDoc: PDFDocument,
  fileName: string
): Promise<string> {
  try {
    const pdfBytes = await pdfDoc.save();
    const base64 = btoa(String.fromCharCode(...pdfBytes));
    const fileUri = `${(FileSystem as any).documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: 'base64' as any,
    });

    return fileUri;
  } catch (error) {
    throw new Error(`Failed to save PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getPdfPageInfo(pdfDoc: PDFDocument): Promise<PdfPageInfo[]> {
  try {
    const pages = pdfDoc.getPages();
    return pages.map((page, index) => ({
      pageNumber: index + 1,
      width: page.getWidth(),
      height: page.getHeight(),
      rotation: page.getRotation().angle,
    }));
  } catch (error) {
    throw new Error(`Failed to get page info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function rotatePage(
  uri: string,
  pageIndex: number,
  rotationDegrees: number
): Promise<string> {
  try {
    const pdfDoc = await loadPdfDocument(uri);
    const pages = pdfDoc.getPages();

    if (pageIndex >= 0 && pageIndex < pages.length) {
      const page = pages[pageIndex];
      page.setRotation(degrees(rotationDegrees));
    }

    return await savePdfDocument(pdfDoc, `rotated_${Date.now()}.pdf`);
  } catch (error) {
    throw new Error(`Failed to rotate page: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deletePages(
  uri: string,
  pageIndices: number[]
): Promise<string> {
  try {
    if (!pageIndices || pageIndices.length === 0) {
      throw new Error('No pages selected for deletion');
    }

    const pdfDoc = await loadPdfDocument(uri);
    const sortedIndices = [...pageIndices].sort((a, b) => b - a);

    for (const index of sortedIndices) {
      if (index >= 0 && index < pdfDoc.getPageCount()) {
        pdfDoc.removePage(index);
      }
    }

    if (pdfDoc.getPageCount() === 0) {
      throw new Error('Cannot delete all pages - PDF would be empty');
    }

    return await savePdfDocument(pdfDoc, `edited_${Date.now()}.pdf`);
  } catch (error) {
    throw new Error(`Failed to delete pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function mergePdfs(uris: string[]): Promise<string> {
  try {
    if (!uris || uris.length === 0) {
      throw new Error('No PDFs selected for merging');
    }

    const mergedPdf = await PDFDocument.create();

    for (const uri of uris) {
      const pdfDoc = await loadPdfDocument(uri);
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    return await savePdfDocument(mergedPdf, `merged_${Date.now()}.pdf`);
  } catch (error) {
    throw new Error(`Failed to merge PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function splitPdf(
  uri: string,
  pageRanges: { start: number; end: number }[]
): Promise<string[]> {
  try {
    if (!pageRanges || pageRanges.length === 0) {
      throw new Error('No page ranges specified for splitting');
    }

    const sourcePdf = await loadPdfDocument(uri);
    const totalPages = sourcePdf.getPageCount();
    const outputUris: string[] = [];

    for (let i = 0; i < pageRanges.length; i++) {
      const { start, end } = pageRanges[i];

      if (start < 1 || end > totalPages || start > end) {
        throw new Error(`Invalid page range: ${start}-${end}. PDF has ${totalPages} pages.`);
      }

      const newPdf = await PDFDocument.create();
      const pageIndices = Array.from(
        { length: end - start + 1 },
        (_, idx) => (start - 1) + idx
      );

      const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const outputUri = await savePdfDocument(newPdf, `split_part${i + 1}_${Date.now()}.pdf`);
      outputUris.push(outputUri);
    }

    return outputUris;
  } catch (error) {
    throw new Error(`Failed to split PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function reorderPages(
  uri: string,
  newOrder: number[]
): Promise<string> {
  try {
    if (!newOrder || newOrder.length === 0) {
      throw new Error('No page order specified');
    }

    const sourcePdf = await loadPdfDocument(uri);
    const totalPages = sourcePdf.getPageCount();

    const validIndices = newOrder.map(pageNum => pageNum - 1).filter(i => i >= 0 && i < totalPages);

    if (validIndices.length === 0) {
      throw new Error('No valid pages in reorder list');
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(sourcePdf, validIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    return await savePdfDocument(newPdf, `reordered_${Date.now()}.pdf`);
  } catch (error) {
    throw new Error(`Failed to reorder pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function compressPdf(uri: string): Promise<string> {
  try {
    const pdfDoc = await loadPdfDocument(uri);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { x, y, width, height } = page.getMediaBox();
      page.setMediaBox(x, y, width, height);
    }

    return await savePdfDocument(pdfDoc, `compressed_${Date.now()}.pdf`);
  } catch (error) {
    throw new Error(`Failed to compress PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function addWatermark(
  uri: string,
  watermarkText: string,
  opacity: number = 0.3
): Promise<string> {
  try {
    if (!watermarkText || watermarkText.trim().length === 0) {
      throw new Error('Watermark text cannot be empty');
    }

    const pdfDoc = await loadPdfDocument(uri);
    const pages = pdfDoc.getPages();
    const watermarkColor = rgb(0.8, 0.8, 0.8);

    pages.forEach((page) => {
      const { width, height } = page.getSize();

      page.drawText(watermarkText, {
        x: width / 2 - (watermarkText.length * 20),
        y: height / 2,
        size: 50,
        color: watermarkColor,
        opacity: Math.min(Math.max(opacity, 0), 1),
        rotate: degrees(-45),
      });
    });

    return await savePdfDocument(pdfDoc, `watermarked_${Date.now()}.pdf`);
  } catch (error) {
    throw new Error(`Failed to add watermark: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function addPageNumbers(
  uri: string,
  position: 'bottom-center' | 'bottom-left' | 'bottom-right' = 'bottom-center',
  startNumber: number = 1
): Promise<string> {
  try {
    const pdfDoc = await loadPdfDocument(uri);
    const pages = pdfDoc.getPages();

    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      const pageNumber = startNumber + index;
      const pageText = `${pageNumber}`;

      let x = width / 2;
      let y = 30;

      if (position === 'bottom-left') {
        x = 30;
      } else if (position === 'bottom-right') {
        x = width - 30;
      }

      page.drawText(pageText, {
        x,
        y,
        size: 10,
        color: rgb(0, 0, 0),
        align: position === 'bottom-center' ? 'center' : position === 'bottom-left' ? 'left' : 'right',
      });
    });

    return await savePdfDocument(pdfDoc, `page_numbers_${Date.now()}.pdf`);
  } catch (error) {
    throw new Error(`Failed to add page numbers: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function protectPdf(
  uri: string,
  password: string
): Promise<string> {
  try {
    if (!password || password.length === 0) {
      throw new Error('Password cannot be empty');
    }

    const pdfDoc = await loadPdfDocument(uri);

    await pdfDoc.encrypt({
      userPassword: password,
      ownerPassword: password,
    });

    return await savePdfDocument(pdfDoc, `protected_${Date.now()}.pdf`);
  } catch (error) {
    throw new Error(`Failed to protect PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function extractPages(
  uri: string,
  pageIndices: number[]
): Promise<string> {
  try {
    if (!pageIndices || pageIndices.length === 0) {
      throw new Error('No pages selected for extraction');
    }

    const sourcePdf = await loadPdfDocument(uri);
    const newPdf = await PDFDocument.create();

    const validIndices = pageIndices
      .map(pageNum => pageNum - 1)
      .filter(i => i >= 0 && i < sourcePdf.getPageCount());

    if (validIndices.length === 0) {
      throw new Error('No valid pages to extract');
    }

    const copiedPages = await newPdf.copyPages(sourcePdf, validIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    return await savePdfDocument(newPdf, `extracted_${Date.now()}.pdf`);
  } catch (error) {
    throw new Error(`Failed to extract pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function rotateAllPages(
  uri: string,
  rotationDegrees: number
): Promise<string> {
  try {
    const pdfDoc = await loadPdfDocument(uri);
    const pages = pdfDoc.getPages();

    if (pages.length === 0) {
      throw new Error('PDF has no pages');
    }

    pages.forEach((page) => {
      page.setRotation(degrees(rotationDegrees));
    });

    return await savePdfDocument(pdfDoc, `rotated_all_${Date.now()}.pdf`);
  } catch (error) {
    throw new Error(`Failed to rotate pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
