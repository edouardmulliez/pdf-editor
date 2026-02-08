import { describe, it, expect } from 'vitest';
import {
  calculateNewSize,
  maintainAspectRatio,
  enforceMinimumSize,
  type ResizeHandle,
} from '../resize-logic';
import type { Position, Size } from '../../types/annotations';

describe('resize-logic', () => {
  describe('calculateNewSize', () => {
    const originalSize: Size = { width: 100, height: 80 };
    const originalPosition: Position = { x: 50, y: 50 };

    describe('bottom-right handle', () => {
      it('should increase size when dragging outward', () => {
        const result = calculateNewSize(
          'br',
          { x: 20, y: -10 }, // Moving right and down (down is negative in PDF coords)
          originalSize,
          originalPosition
        );

        expect(result.size).toEqual({ width: 120, height: 90 });
        expect(result.position).toEqual(originalPosition); // Position unchanged
      });

      it('should decrease size when dragging inward', () => {
        const result = calculateNewSize(
          'br',
          { x: -20, y: 10 },
          originalSize,
          originalPosition
        );

        expect(result.size).toEqual({ width: 80, height: 70 });
        expect(result.position).toEqual(originalPosition);
      });

      it('should enforce minimum size', () => {
        const result = calculateNewSize(
          'br',
          { x: -90, y: 70 }, // Try to make very small
          originalSize,
          originalPosition
        );

        expect(result.size).toEqual({ width: 20, height: 20 });
        expect(result.position).toEqual(originalPosition);
      });
    });

    describe('bottom-left handle', () => {
      it('should adjust width and x position when dragging left', () => {
        const result = calculateNewSize(
          'bl',
          { x: -20, y: -10 }, // Moving left and down
          originalSize,
          originalPosition
        );

        expect(result.size).toEqual({ width: 120, height: 90 });
        expect(result.position).toEqual({ x: 30, y: 50 }); // x moved left
      });

      it('should adjust width and x position when dragging right', () => {
        const result = calculateNewSize(
          'bl',
          { x: 20, y: 10 },
          originalSize,
          originalPosition
        );

        expect(result.size).toEqual({ width: 80, height: 70 });
        expect(result.position).toEqual({ x: 70, y: 50 }); // x moved right
      });

      it('should not move position when hitting minimum width', () => {
        const result = calculateNewSize(
          'bl',
          { x: 90, y: 0 }, // Try to shrink width below minimum
          originalSize,
          originalPosition
        );

        expect(result.size.width).toBe(20);
        expect(result.position.x).toBe(originalPosition.x); // Position locked
      });
    });

    describe('top-right handle', () => {
      it('should adjust height and y position when dragging up', () => {
        const result = calculateNewSize(
          'tr',
          { x: 20, y: 10 }, // Moving right and up
          originalSize,
          originalPosition
        );

        expect(result.size).toEqual({ width: 120, height: 90 });
        expect(result.position).toEqual({ x: 50, y: 60 }); // y moved up
      });

      it('should adjust height and y position when dragging down', () => {
        const result = calculateNewSize(
          'tr',
          { x: -20, y: -10 },
          originalSize,
          originalPosition
        );

        expect(result.size).toEqual({ width: 80, height: 70 });
        expect(result.position).toEqual({ x: 50, y: 40 }); // y moved down
      });

      it('should not move position when hitting minimum height', () => {
        const result = calculateNewSize(
          'tr',
          { x: 0, y: -70 }, // Try to shrink height below minimum
          originalSize,
          originalPosition
        );

        expect(result.size.height).toBe(20);
        expect(result.position.y).toBe(originalPosition.y); // Position locked
      });
    });

    describe('top-left handle', () => {
      it('should adjust both size and position when dragging', () => {
        const result = calculateNewSize(
          'tl',
          { x: -10, y: 10 }, // Moving left and up
          originalSize,
          originalPosition
        );

        expect(result.size).toEqual({ width: 110, height: 90 });
        expect(result.position).toEqual({ x: 40, y: 60 });
      });

      it('should handle minimum size constraints independently', () => {
        const result = calculateNewSize(
          'tl',
          { x: 90, y: -70 }, // Try to shrink below minimum
          originalSize,
          originalPosition
        );

        expect(result.size).toEqual({ width: 20, height: 20 });
        expect(result.position).toEqual(originalPosition); // Both locked
      });
    });

    describe('custom minimum size', () => {
      it('should respect custom minimum size', () => {
        const customMin: Size = { width: 50, height: 40 };
        const result = calculateNewSize(
          'br',
          { x: -90, y: 70 },
          originalSize,
          originalPosition,
          customMin
        );

        expect(result.size).toEqual({ width: 50, height: 40 });
      });
    });
  });

  describe('maintainAspectRatio', () => {
    it('should adjust width based on height for top handles', () => {
      const newSize: Size = { width: 100, height: 100 };
      const aspectRatio = 2; // width is 2x height

      const result = maintainAspectRatio(newSize, aspectRatio, 'tr');

      expect(result).toEqual({ width: 200, height: 100 });
    });

    it('should adjust width based on height for top-left handle', () => {
      const newSize: Size = { width: 100, height: 100 };
      const aspectRatio = 2;

      const result = maintainAspectRatio(newSize, aspectRatio, 'tl');

      expect(result).toEqual({ width: 200, height: 100 });
    });

    it('should adjust height based on width for bottom handles', () => {
      const newSize: Size = { width: 100, height: 100 };
      const aspectRatio = 2; // width is 2x height

      const result = maintainAspectRatio(newSize, aspectRatio, 'br');

      expect(result).toEqual({ width: 100, height: 50 });
    });

    it('should adjust height based on width for bottom-left handle', () => {
      const newSize: Size = { width: 100, height: 100 };
      const aspectRatio = 2;

      const result = maintainAspectRatio(newSize, aspectRatio, 'bl');

      expect(result).toEqual({ width: 100, height: 50 });
    });

    it('should handle aspect ratio less than 1', () => {
      const newSize: Size = { width: 100, height: 100 };
      const aspectRatio = 0.5; // width is 0.5x height (tall)

      const result = maintainAspectRatio(newSize, aspectRatio, 'br');

      expect(result).toEqual({ width: 100, height: 200 });
    });
  });

  describe('enforceMinimumSize', () => {
    it('should not change size if already above minimum', () => {
      const size: Size = { width: 100, height: 80 };

      const result = enforceMinimumSize(size);

      expect(result).toEqual(size);
    });

    it('should enforce default minimum width', () => {
      const size: Size = { width: 10, height: 80 };

      const result = enforceMinimumSize(size);

      expect(result).toEqual({ width: 20, height: 80 });
    });

    it('should enforce default minimum height', () => {
      const size: Size = { width: 100, height: 10 };

      const result = enforceMinimumSize(size);

      expect(result).toEqual({ width: 100, height: 20 });
    });

    it('should enforce both minimums', () => {
      const size: Size = { width: 5, height: 5 };

      const result = enforceMinimumSize(size);

      expect(result).toEqual({ width: 20, height: 20 });
    });

    it('should respect custom minimums', () => {
      const size: Size = { width: 30, height: 30 };

      const result = enforceMinimumSize(size, 50, 40);

      expect(result).toEqual({ width: 50, height: 40 });
    });
  });
});
