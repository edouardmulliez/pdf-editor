import type { Position, Size } from '../types';
import type { PageMetadata } from './coordinate-converter';

/**
 * Constrains a position to keep the annotation within page bounds
 * @param position - The desired position in PDF coordinates
 * @param size - The size of the annotation in PDF units
 * @param pageMetadata - Metadata about the page dimensions
 * @param annotationType - Optional: 'text' or 'image' for type-specific bounds
 * @param fontMetrics - Optional: font metrics for text annotations (baseline positioning)
 * @returns Constrained position that keeps annotation within bounds
 */
export function constrainToPageBounds(
  position: Position,
  size: Size,
  pageMetadata: PageMetadata,
  annotationType?: 'text' | 'image',
  fontMetrics?: { ascent: number; descent: number }
): Position {
  const pageWidth = pageMetadata.viewportWidth;
  const pageHeight = pageMetadata.viewportHeight;

  // Ensure annotation stays within page bounds
  // PDF coordinates: bottom-left origin
  const minX = 0;
  const maxX = pageWidth - size.width;

  let minY = 0;
  let maxY = pageHeight - size.height;

  // For text: position.y is baseline, text extends [baseline-ascent, baseline+descent]
  if (annotationType === 'text' && fontMetrics) {
    minY = fontMetrics.ascent;  // Baseline can't be less than ascent from bottom
    maxY = pageHeight - fontMetrics.descent;  // Must leave room for descent
  }

  // For image: position.y is top-left corner in PDF space (Y increases upward)
  // Top edge must be <= pageHeight; bottom edge (position.y - height) must be >= 0
  if (annotationType === 'image') {
    minY = size.height;  // bottom edge: position.y - height >= 0
    maxY = pageHeight;   // top edge: position.y <= pageHeight
  }

  return {
    x: Math.max(minX, Math.min(maxX, position.x)),
    y: Math.max(minY, Math.min(maxY, position.y)),
  };
}

/**
 * Checks if a position with given size is within page bounds
 * @param position - The position to check in PDF coordinates
 * @param size - The size of the annotation in PDF units
 * @param pageMetadata - Metadata about the page dimensions
 * @returns true if annotation is fully within bounds
 */
export function isWithinBounds(
  position: Position,
  size: Size,
  pageMetadata: PageMetadata,
  annotationType?: 'text' | 'image'
): boolean {
  const pageWidth = pageMetadata.viewportWidth;
  const pageHeight = pageMetadata.viewportHeight;

  if (annotationType === 'image') {
    return (
      position.x >= 0 &&
      position.x + size.width <= pageWidth &&
      position.y - size.height >= 0 &&
      position.y <= pageHeight
    );
  }

  return (
    position.x >= 0 &&
    position.y >= 0 &&
    position.x + size.width <= pageWidth &&
    position.y + size.height <= pageHeight
  );
}
