import { describe, it, expect } from 'vitest';
import { canvasToPDF, pdfToCanvas, PageMetadata } from '../coordinate-converter';

describe('coordinate-converter', () => {
  const metadata: PageMetadata = {
    pageNumber: 1,
    scale: 2.0,
    viewportWidth: 612,
    viewportHeight: 792
  };

  describe('canvasToPDF', () => {
    it('converts top-left canvas to PDF coordinates', () => {
      const result = canvasToPDF(0, 0, metadata);
      expect(result.x).toBe(0);
      expect(result.y).toBe(792); // Bottom-left is top of page
    });

    it('converts bottom-right canvas to PDF coordinates', () => {
      const canvasWidth = 612 * 2.0;
      const canvasHeight = 792 * 2.0;
      const result = canvasToPDF(canvasWidth, canvasHeight, metadata);
      expect(result.x).toBe(612);
      expect(result.y).toBe(0); // Top-left is bottom of page
    });

    it('converts middle canvas point to PDF coordinates', () => {
      const canvasX = 612; // Middle of width at scale 2.0
      const canvasY = 792; // Middle of height at scale 2.0
      const result = canvasToPDF(canvasX, canvasY, metadata);
      expect(result.x).toBe(306); // Half of viewport width
      expect(result.y).toBe(396); // Half of viewport height
    });

    it('handles different scale factors', () => {
      const metadata1x: PageMetadata = {
        pageNumber: 1,
        scale: 1.0,
        viewportWidth: 612,
        viewportHeight: 792
      };
      const result = canvasToPDF(100, 100, metadata1x);
      expect(result.x).toBe(100);
      expect(result.y).toBe(692); // 792 - 100
    });
  });

  describe('pdfToCanvas', () => {
    it('converts PDF bottom-left to canvas top-left', () => {
      const result = pdfToCanvas({ x: 0, y: 0 }, metadata);
      expect(result.x).toBe(0);
      expect(result.y).toBe(792 * 2.0);
    });

    it('converts PDF top-right to canvas bottom-right', () => {
      const result = pdfToCanvas({ x: 612, y: 792 }, metadata);
      expect(result.x).toBe(612 * 2.0);
      expect(result.y).toBe(0);
    });

    it('converts middle PDF point to canvas coordinates', () => {
      const result = pdfToCanvas({ x: 306, y: 396 }, metadata);
      expect(result.x).toBe(612); // 306 * 2.0
      expect(result.y).toBe(792); // (792 - 396) * 2.0
    });

    it('round-trip conversion is accurate', () => {
      const original = { x: 100, y: 200 };
      const canvas = pdfToCanvas(original, metadata);
      const converted = canvasToPDF(canvas.x, canvas.y, metadata);

      expect(converted.x).toBeCloseTo(original.x, 5);
      expect(converted.y).toBeCloseTo(original.y, 5);
    });

    it('round-trip conversion with different positions', () => {
      const testCases = [
        { x: 0, y: 0 },
        { x: 612, y: 792 },
        { x: 306, y: 396 },
        { x: 123.45, y: 678.90 }
      ];

      testCases.forEach(original => {
        const canvas = pdfToCanvas(original, metadata);
        const converted = canvasToPDF(canvas.x, canvas.y, metadata);

        expect(converted.x).toBeCloseTo(original.x, 5);
        expect(converted.y).toBeCloseTo(original.y, 5);
      });
    });
  });
});
