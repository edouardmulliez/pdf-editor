import type { PDFPageProxy } from 'pdfjs-dist';

export interface RenderOptions {
  scale: number;
  canvasContext: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
}

/**
 * Renders a PDF page to a canvas element with retina display support.
 *
 * @param page - The PDF.js page object to render
 * @param options - Rendering options including scale, canvas, and context
 */
export async function renderPageToCanvas(
  page: PDFPageProxy,
  options: RenderOptions
): Promise<void> {
  const { scale, canvasContext, canvas } = options;

  // Get viewport at the desired scale
  const viewport = page.getViewport({ scale });

  // Support retina displays by scaling canvas size
  const outputScale = window.devicePixelRatio || 1;

  // Set canvas dimensions accounting for device pixel ratio
  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);

  // Set CSS dimensions to actual display size
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;

  // Scale the context to match device pixel ratio
  canvasContext.setTransform(outputScale, 0, 0, outputScale, 0, 0);

  // Render the page
  const renderContext = {
    canvasContext,
    viewport,
    canvas,
  };

  await page.render(renderContext).promise;
}

/**
 * Calculates the scale factor needed to fit a page within a container.
 *
 * @param pageWidth - The width of the PDF page in points
 * @param pageHeight - The height of the PDF page in points
 * @param containerWidth - The width of the container in pixels
 * @param containerHeight - The height of the container in pixels
 * @param padding - Optional padding to subtract from container dimensions (default: 32)
 * @returns The scale factor to fit the page in the container
 */
export function calculateFitScale(
  pageWidth: number,
  pageHeight: number,
  containerWidth: number,
  containerHeight: number,
  padding: number = 32
): number {
  const availableWidth = containerWidth - padding * 2;
  const availableHeight = containerHeight - padding * 2;

  const scaleX = availableWidth / pageWidth;
  const scaleY = availableHeight / pageHeight;

  // Use the smaller scale to ensure the page fits in both dimensions
  return Math.min(scaleX, scaleY);
}
