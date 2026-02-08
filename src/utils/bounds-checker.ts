import type { Position, Size } from '../types/annotations';
import type { PageMetadata } from './coordinate-converter';

/**
 * Constrains a position to keep the annotation within page bounds
 * @param position - The desired position in PDF coordinates
 * @param size - The size of the annotation in PDF units
 * @param pageMetadata - Metadata about the page dimensions
 * @returns Constrained position that keeps annotation within bounds
 */
export function constrainToPageBounds(
  position: Position,
  size: Size,
  pageMetadata: PageMetadata
): Position {
  const { width: pageWidth, height: pageHeight } = pageMetadata.viewport;

  // Ensure annotation stays within page bounds
  // PDF coordinates: bottom-left origin
  const minX = 0;
  const minY = 0;
  const maxX = pageWidth - size.width;
  const maxY = pageHeight - size.height;

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
  pageMetadata: PageMetadata
): boolean {
  const { width: pageWidth, height: pageHeight } = pageMetadata.viewport;

  return (
    position.x >= 0 &&
    position.y >= 0 &&
    position.x + size.width <= pageWidth &&
    position.y + size.height <= pageHeight
  );
}
