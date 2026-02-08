import type { Position, Size } from '../types/annotations';

export type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br';

export interface ResizeResult {
  size: Size;
  position: Position;
}

const MIN_WIDTH = 20;
const MIN_HEIGHT = 20;

/**
 * Calculates new size and position when resizing an annotation
 * @param handle - Which corner handle is being dragged
 * @param mouseDelta - Mouse movement delta in PDF coordinates
 * @param originalSize - Original annotation size
 * @param originalPosition - Original annotation position
 * @param minSize - Minimum allowed size (defaults to 20x20)
 * @returns New size and position
 */
export function calculateNewSize(
  handle: ResizeHandle,
  mouseDelta: { x: number; y: number },
  originalSize: Size,
  originalPosition: Position,
  minSize: Size = { width: MIN_WIDTH, height: MIN_HEIGHT }
): ResizeResult {
  let newSize = { ...originalSize };
  let newPosition = { ...originalPosition };

  switch (handle) {
    case 'br': // Bottom-right: only affects size (anchored to top-left)
      newSize.width = Math.max(minSize.width, originalSize.width + mouseDelta.x);
      newSize.height = Math.max(minSize.height, originalSize.height - mouseDelta.y);
      break;

    case 'bl': // Bottom-left: affects width and position.x
      newSize.width = Math.max(minSize.width, originalSize.width - mouseDelta.x);
      newSize.height = Math.max(minSize.height, originalSize.height - mouseDelta.y);
      // If we hit minimum width, don't move position
      if (originalSize.width - mouseDelta.x >= minSize.width) {
        newPosition.x = originalPosition.x + mouseDelta.x;
      }
      break;

    case 'tr': // Top-right: affects height and position.y
      newSize.width = Math.max(minSize.width, originalSize.width + mouseDelta.x);
      newSize.height = Math.max(minSize.height, originalSize.height + mouseDelta.y);
      // If we hit minimum height, don't move position
      if (originalSize.height + mouseDelta.y >= minSize.height) {
        newPosition.y = originalPosition.y + mouseDelta.y;
      }
      break;

    case 'tl': // Top-left: affects both position and size
      newSize.width = Math.max(minSize.width, originalSize.width - mouseDelta.x);
      newSize.height = Math.max(minSize.height, originalSize.height + mouseDelta.y);
      // If we hit minimum width, don't move x position
      if (originalSize.width - mouseDelta.x >= minSize.width) {
        newPosition.x = originalPosition.x + mouseDelta.x;
      }
      // If we hit minimum height, don't move y position
      if (originalSize.height + mouseDelta.y >= minSize.height) {
        newPosition.y = originalPosition.y + mouseDelta.y;
      }
      break;
  }

  return { size: newSize, position: newPosition };
}

/**
 * Adjusts size to maintain aspect ratio
 * @param newSize - The new size to adjust
 * @param aspectRatio - The aspect ratio to maintain (width / height)
 * @param handle - Which handle is being dragged (determines which dimension to prioritize)
 * @returns Size with aspect ratio maintained
 */
export function maintainAspectRatio(
  newSize: Size,
  aspectRatio: number,
  handle: ResizeHandle
): Size {
  // For corner handles, prioritize the dimension that changed more
  // For simplicity, we'll prioritize width for left/right handles
  // and height for top/bottom handles

  if (handle === 'tr' || handle === 'tl') {
    // Top handles: prioritize height change, adjust width
    return {
      width: newSize.height * aspectRatio,
      height: newSize.height,
    };
  } else {
    // Bottom handles: prioritize width change, adjust height
    return {
      width: newSize.width,
      height: newSize.width / aspectRatio,
    };
  }
}

/**
 * Enforces minimum size constraints
 * @param size - The size to constrain
 * @param minWidth - Minimum width
 * @param minHeight - Minimum height
 * @returns Size with minimum constraints enforced
 */
export function enforceMinimumSize(
  size: Size,
  minWidth: number = MIN_WIDTH,
  minHeight: number = MIN_HEIGHT
): Size {
  return {
    width: Math.max(minWidth, size.width),
    height: Math.max(minHeight, size.height),
  };
}
