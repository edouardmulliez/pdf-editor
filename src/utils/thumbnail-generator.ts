import type { PDFDocumentProxy } from 'pdfjs-dist';
import { renderPageToCanvas } from './pdf-renderer';

export interface Thumbnail {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

const THUMBNAIL_WIDTH = 120;

/**
 * Generates thumbnails for all pages in a PDF document.
 *
 * @param pdfDoc - The PDF.js document proxy
 * @param onProgress - Optional callback for progress updates (current, total)
 * @returns Array of thumbnail objects with canvas elements
 */
export async function generateThumbnails(
  pdfDoc: PDFDocumentProxy,
  onProgress?: (current: number, total: number) => void
): Promise<Thumbnail[]> {
  const numPages = pdfDoc.numPages;
  const thumbnails: Thumbnail[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const scale = THUMBNAIL_WIDTH / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) continue;

    await renderPageToCanvas(page, {
      scale,
      canvasContext: context,
      canvas,
    });

    thumbnails.push({
      pageNumber: pageNum,
      canvas,
      width: scaledViewport.width,
      height: scaledViewport.height,
    });

    if (onProgress) {
      onProgress(pageNum, numPages);
    }
  }

  return thumbnails;
}
