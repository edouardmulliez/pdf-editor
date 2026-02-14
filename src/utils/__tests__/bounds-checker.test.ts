import { describe, it, expect } from 'vitest';
import { constrainToPageBounds, isWithinBounds } from '../bounds-checker';
import type { Position, Size } from '../../types/annotations';
import type { PageMetadata } from '../coordinate-converter';

const createPageMetadata = (width: number, height: number): PageMetadata => ({
  pageNumber: 1,
  scale: 1,
  viewportWidth: width,
  viewportHeight: height,
});

describe('bounds-checker', () => {
  describe('constrainToPageBounds', () => {
    it('should not modify position if already within bounds', () => {
      const position: Position = { x: 100, y: 100 };
      const size: Size = { width: 50, height: 50 };
      const pageMetadata = createPageMetadata(800, 600);

      const result = constrainToPageBounds(position, size, pageMetadata);

      expect(result).toEqual({ x: 100, y: 100 });
    });

    it('should constrain negative x coordinate to 0', () => {
      const position: Position = { x: -10, y: 100 };
      const size: Size = { width: 50, height: 50 };
      const pageMetadata = createPageMetadata(800, 600);

      const result = constrainToPageBounds(position, size, pageMetadata);

      expect(result).toEqual({ x: 0, y: 100 });
    });

    it('should constrain negative y coordinate to 0', () => {
      const position: Position = { x: 100, y: -10 };
      const size: Size = { width: 50, height: 50 };
      const pageMetadata = createPageMetadata(800, 600);

      const result = constrainToPageBounds(position, size, pageMetadata);

      expect(result).toEqual({ x: 100, y: 0 });
    });

    it('should constrain x overflow beyond page width', () => {
      const position: Position = { x: 780, y: 100 };
      const size: Size = { width: 50, height: 50 };
      const pageMetadata = createPageMetadata(800, 600);

      const result = constrainToPageBounds(position, size, pageMetadata);

      expect(result).toEqual({ x: 750, y: 100 }); // 800 - 50 = 750
    });

    it('should constrain y overflow beyond page height', () => {
      const position: Position = { x: 100, y: 580 };
      const size: Size = { width: 50, height: 50 };
      const pageMetadata = createPageMetadata(800, 600);

      const result = constrainToPageBounds(position, size, pageMetadata);

      expect(result).toEqual({ x: 100, y: 550 }); // 600 - 50 = 550
    });

    it('should constrain both coordinates when both overflow', () => {
      const position: Position = { x: 900, y: 700 };
      const size: Size = { width: 50, height: 50 };
      const pageMetadata = createPageMetadata(800, 600);

      const result = constrainToPageBounds(position, size, pageMetadata);

      expect(result).toEqual({ x: 750, y: 550 });
    });

    it('should handle large annotations correctly', () => {
      const position: Position = { x: 400, y: 300 };
      const size: Size = { width: 500, height: 400 };
      const pageMetadata = createPageMetadata(800, 600);

      const result = constrainToPageBounds(position, size, pageMetadata);

      expect(result).toEqual({ x: 300, y: 200 }); // 800-500=300, 600-400=200
    });

    it('should handle edge case where annotation is larger than page', () => {
      const position: Position = { x: 100, y: 100 };
      const size: Size = { width: 1000, height: 800 };
      const pageMetadata = createPageMetadata(800, 600);

      const result = constrainToPageBounds(position, size, pageMetadata);

      // Should constrain to 0,0 (best effort for oversized annotation)
      expect(result).toEqual({ x: 0, y: 0 });
    });
  });

  describe('isWithinBounds', () => {
    it('should return true for position fully within bounds', () => {
      const position: Position = { x: 100, y: 100 };
      const size: Size = { width: 50, height: 50 };
      const pageMetadata = createPageMetadata(800, 600);

      const result = isWithinBounds(position, size, pageMetadata);

      expect(result).toBe(true);
    });

    it('should return false for negative x coordinate', () => {
      const position: Position = { x: -10, y: 100 };
      const size: Size = { width: 50, height: 50 };
      const pageMetadata = createPageMetadata(800, 600);

      const result = isWithinBounds(position, size, pageMetadata);

      expect(result).toBe(false);
    });

    it('should return false for negative y coordinate', () => {
      const position: Position = { x: 100, y: -10 };
      const size: Size = { width: 50, height: 50 };
      const pageMetadata = createPageMetadata(800, 600);

      const result = isWithinBounds(position, size, pageMetadata);

      expect(result).toBe(false);
    });

    it('should return false for x overflow', () => {
      const position: Position = { x: 780, y: 100 };
      const size: Size = { width: 50, height: 50 };
      const pageMetadata = createPageMetadata(800, 600);

      const result = isWithinBounds(position, size, pageMetadata);

      expect(result).toBe(false);
    });

    it('should return false for y overflow', () => {
      const position: Position = { x: 100, y: 580 };
      const size: Size = { width: 50, height: 50 };
      const pageMetadata = createPageMetadata(800, 600);

      const result = isWithinBounds(position, size, pageMetadata);

      expect(result).toBe(false);
    });

    it('should return true for annotation at exact bounds', () => {
      const position: Position = { x: 750, y: 550 };
      const size: Size = { width: 50, height: 50 };
      const pageMetadata = createPageMetadata(800, 600);

      const result = isWithinBounds(position, size, pageMetadata);

      expect(result).toBe(true); // Exactly at 800, 600 (within bounds)
    });

    it('should return false for annotation at origin with size larger than page', () => {
      const position: Position = { x: 0, y: 0 };
      const size: Size = { width: 1000, height: 800 };
      const pageMetadata = createPageMetadata(800, 600);

      const result = isWithinBounds(position, size, pageMetadata);

      expect(result).toBe(false);
    });
  });
});
