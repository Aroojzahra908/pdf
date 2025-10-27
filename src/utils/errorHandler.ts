export class PDFToolError extends Error {
  constructor(operation: string, message: string) {
    super(`${operation} failed: ${message}`);
    this.name = 'PDFToolError';
  }
}

export function handlePdfError(error: unknown, operation: string = 'PDF operation'): string {
  if (error instanceof PDFToolError) {
    return error.message;
  }

  if (error instanceof Error) {
    return `${operation} failed: ${error.message}`;
  }

  return `${operation} failed: Unknown error occurred`;
}

export function validatePdfUri(uri: string | null): uri is string {
  if (!uri || typeof uri !== 'string') {
    throw new Error('Invalid PDF file selected');
  }
  return true;
}

export function validateSelection(selectedCount: number): void {
  if (selectedCount === 0) {
    throw new Error('Please select at least one page');
  }
}

export function validatePassword(password: string): void {
  if (!password || password.trim().length === 0) {
    throw new Error('Password cannot be empty');
  }
}

export function validateWatermarkText(text: string): void {
  if (!text || text.trim().length === 0) {
    throw new Error('Watermark text cannot be empty');
  }
}
