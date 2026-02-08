import { pdfjsLib } from './pdfjs-config';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface LoadedPDF {
  document: PDFDocumentProxy;
  numPages: number;
  fileName: string;
  filePath: string;
}

/**
 * Loads a PDF document from raw bytes.
 *
 * @param data - The PDF file data as a Uint8Array
 * @param fileName - The name of the PDF file
 * @param filePath - The full path to the PDF file
 * @returns A promise that resolves to the loaded PDF document and metadata
 * @throws Error if the PDF cannot be loaded
 */
export async function loadPdfFromBytes(
  data: Uint8Array,
  fileName: string,
  filePath: string
): Promise<LoadedPDF> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data });
    const document = await loadingTask.promise;

    return {
      document,
      numPages: document.numPages,
      fileName,
      filePath,
    };
  } catch (error) {
    throw new Error(
      `Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
