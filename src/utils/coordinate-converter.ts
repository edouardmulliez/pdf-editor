export interface PageMetadata {
  pageNumber: number;
  scale: number; // PDF.js fitScale
  viewportWidth: number; // PDF viewport width at scale 1.0 (in points)
  viewportHeight: number; // PDF viewport height at scale 1.0 (in points)
}

export interface Position {
  x: number;
  y: number;
}

/**
 * Converts canvas coordinates (top-left origin, pixels) to PDF coordinates (bottom-left origin, points)
 *
 * @param canvasX - X coordinate from canvas (pixels from left edge)
 * @param canvasY - Y coordinate from canvas (pixels from top edge)
 * @param metadata - Page metadata containing scale and viewport dimensions
 * @returns Position in PDF coordinate system (points from bottom-left)
 */
export function canvasToPDF(
  canvasX: number,
  canvasY: number,
  metadata: PageMetadata
): Position {
  // Convert canvas pixels to PDF points
  const pdfX = canvasX / metadata.scale;
  // Flip Y axis: canvas top-left → PDF bottom-left
  const pdfY = metadata.viewportHeight - canvasY / metadata.scale;
  return { x: pdfX, y: pdfY };
}

/**
 * Converts PDF coordinates (bottom-left origin, points) to canvas coordinates (top-left origin, pixels)
 *
 * @param position - Position in PDF coordinate system (points from bottom-left)
 * @param metadata - Page metadata containing scale and viewport dimensions
 * @returns Position in canvas coordinate system (pixels from top-left)
 */
export function pdfToCanvas(
  position: Position,
  metadata: PageMetadata
): Position {
  // Convert PDF points to canvas pixels
  const canvasX = position.x * metadata.scale;
  // Flip Y axis: PDF bottom-left → canvas top-left
  const canvasY = (metadata.viewportHeight - position.y) * metadata.scale;
  return { x: canvasX, y: canvasY };
}
