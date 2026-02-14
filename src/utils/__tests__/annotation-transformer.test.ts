import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  mapFontToStandard14,
  stripDataUrlPrefix,
  transformAnnotationsForRust,
} from '../annotation-transformer';
import type { TextAnnotation, ImageAnnotation } from '../../types';

describe('hexToRgb', () => {
  it('converts 6-digit hex to RGB', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('converts 3-digit hex to RGB', () => {
    expect(hexToRgb('#F00')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#0F0')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('#00F')).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('handles hex without # prefix', () => {
    expect(hexToRgb('FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('F00')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('handles lowercase hex', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#abc123')).toEqual({ r: 171, g: 193, b: 35 });
  });

  it('handles invalid hex gracefully', () => {
    expect(hexToRgb('#GGGGGG')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('')).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe('mapFontToStandard14', () => {
  describe('Arial mapping', () => {
    it('maps Arial to Helvetica variants', () => {
      expect(mapFontToStandard14('Arial', [])).toBe('Helvetica');
      expect(mapFontToStandard14('Arial', ['bold'])).toBe('Helvetica-Bold');
      expect(mapFontToStandard14('Arial', ['italic'])).toBe('Helvetica-Oblique');
      expect(mapFontToStandard14('Arial', ['bold', 'italic'])).toBe('Helvetica-BoldOblique');
    });
  });

  describe('Times New Roman mapping', () => {
    it('maps Times New Roman to Times-Roman variants', () => {
      expect(mapFontToStandard14('Times New Roman', [])).toBe('Times-Roman');
      expect(mapFontToStandard14('Times New Roman', ['bold'])).toBe('Times-Bold');
      expect(mapFontToStandard14('Times New Roman', ['italic'])).toBe('Times-Italic');
      expect(mapFontToStandard14('Times New Roman', ['bold', 'italic'])).toBe('Times-BoldItalic');
    });
  });

  describe('Courier New mapping', () => {
    it('maps Courier New to Courier variants', () => {
      expect(mapFontToStandard14('Courier New', [])).toBe('Courier');
      expect(mapFontToStandard14('Courier New', ['bold'])).toBe('Courier-Bold');
      expect(mapFontToStandard14('Courier New', ['italic'])).toBe('Courier-Oblique');
      expect(mapFontToStandard14('Courier New', ['bold', 'italic'])).toBe('Courier-BoldOblique');
    });
  });

  describe('Helvetica mapping', () => {
    it('maps Helvetica to Helvetica variants', () => {
      expect(mapFontToStandard14('Helvetica', [])).toBe('Helvetica');
      expect(mapFontToStandard14('Helvetica', ['bold'])).toBe('Helvetica-Bold');
      expect(mapFontToStandard14('Helvetica', ['italic'])).toBe('Helvetica-Oblique');
      expect(mapFontToStandard14('Helvetica', ['bold', 'italic'])).toBe('Helvetica-BoldOblique');
    });
  });

  describe('Georgia mapping', () => {
    it('maps Georgia to Times-Roman variants', () => {
      expect(mapFontToStandard14('Georgia', [])).toBe('Times-Roman');
      expect(mapFontToStandard14('Georgia', ['bold'])).toBe('Times-Bold');
      expect(mapFontToStandard14('Georgia', ['italic'])).toBe('Times-Italic');
      expect(mapFontToStandard14('Georgia', ['bold', 'italic'])).toBe('Times-BoldItalic');
    });
  });

  describe('Underline handling', () => {
    it('ignores underline style (not supported by Standard 14 fonts)', () => {
      expect(mapFontToStandard14('Arial', ['underline'])).toBe('Helvetica');
      expect(mapFontToStandard14('Arial', ['bold', 'underline'])).toBe('Helvetica-Bold');
      expect(mapFontToStandard14('Arial', ['italic', 'underline'])).toBe('Helvetica-Oblique');
      expect(mapFontToStandard14('Arial', ['bold', 'italic', 'underline'])).toBe('Helvetica-BoldOblique');
    });
  });

  describe('Unknown fonts', () => {
    it('defaults to Helvetica for unknown fonts', () => {
      expect(mapFontToStandard14('Comic Sans', [])).toBe('Helvetica');
      expect(mapFontToStandard14('Unknown Font', ['bold'])).toBe('Helvetica-Bold');
    });
  });

  describe('Style order independence', () => {
    it('handles styles in any order', () => {
      expect(mapFontToStandard14('Arial', ['italic', 'bold'])).toBe('Helvetica-BoldOblique');
      expect(mapFontToStandard14('Arial', ['bold', 'italic'])).toBe('Helvetica-BoldOblique');
    });
  });
});

describe('stripDataUrlPrefix', () => {
  it('strips JPEG data URL prefix', () => {
    const result = stripDataUrlPrefix('data:image/jpeg;base64,ABC123');
    expect(result).toBe('ABC123');
  });

  it('strips PNG data URL prefix', () => {
    const result = stripDataUrlPrefix('data:image/png;base64,XYZ789');
    expect(result).toBe('XYZ789');
  });

  it('handles already-stripped base64', () => {
    const result = stripDataUrlPrefix('ABC123');
    expect(result).toBe('ABC123');
  });

  it('handles complex base64 strings', () => {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = stripDataUrlPrefix(`data:image/png;base64,${base64}`);
    expect(result).toBe(base64);
  });
});

describe('transformAnnotationsForRust', () => {
  describe('Text annotations', () => {
    it('transforms basic text annotation', () => {
      const annotation: TextAnnotation = {
        id: 'text-1',
        type: 'text',
        pageNumber: 1,
        position: { x: 100, y: 200 },
        size: { width: 150, height: 30 },
        content: 'Hello World',
        fontFamily: 'Arial',
        fontSize: 16,
        fontColor: '#000000',
        fontStyles: [],
        fontMetrics: { ascent: 10, descent: 3 },
      };

      const result = transformAnnotationsForRust([annotation]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        page: 0, // 1-indexed → 0-indexed
        position: { x: 100, y: 200 },
        type: 'text',
        content: 'Hello World',
        font_family: 'Helvetica',
        font_size: 16,
        color: { r: 0, g: 0, b: 0 },
        font_metrics: { ascent: 10, descent: 3 },
      });
    });

    it('transforms text with bold style', () => {
      const annotation: TextAnnotation = {
        id: 'text-2',
        type: 'text',
        pageNumber: 2,
        position: { x: 50, y: 150 },
        size: { width: 200, height: 40 },
        content: 'Bold Text',
        fontFamily: 'Times New Roman',
        fontSize: 18,
        fontColor: '#FF0000',
        fontStyles: ['bold'],
        fontMetrics: { ascent: 10, descent: 3 },
      };

      const result = transformAnnotationsForRust([annotation]);

      expect(result[0]).toMatchObject({
        page: 1,
        font_family: 'Times-Bold',
        color: { r: 255, g: 0, b: 0 },
      });
    });

    it('transforms text with italic style', () => {
      const annotation: TextAnnotation = {
        id: 'text-3',
        type: 'text',
        pageNumber: 1,
        position: { x: 75, y: 100 },
        size: { width: 180, height: 35 },
        content: 'Italic Text',
        fontFamily: 'Courier New',
        fontSize: 14,
        fontColor: '#0000FF',
        fontStyles: ['italic'],
        fontMetrics: { ascent: 10, descent: 3 },
      };

      const result = transformAnnotationsForRust([annotation]);

      expect(result[0]).toMatchObject({
        font_family: 'Courier-Oblique',
        color: { r: 0, g: 0, b: 255 },
      });
    });

    it('transforms text with bold and italic styles', () => {
      const annotation: TextAnnotation = {
        id: 'text-4',
        type: 'text',
        pageNumber: 3,
        position: { x: 120, y: 250 },
        size: { width: 220, height: 45 },
        content: 'Bold Italic',
        fontFamily: 'Arial',
        fontSize: 20,
        fontColor: '#00FF00',
        fontStyles: ['bold', 'italic'],
        fontMetrics: { ascent: 10, descent: 3 },
      };

      const result = transformAnnotationsForRust([annotation]);

      expect(result[0]).toMatchObject({
        page: 2,
        font_family: 'Helvetica-BoldOblique',
        color: { r: 0, g: 255, b: 0 },
      });
    });

    it('ignores underline style', () => {
      const annotation: TextAnnotation = {
        id: 'text-5',
        type: 'text',
        pageNumber: 1,
        position: { x: 100, y: 200 },
        size: { width: 150, height: 30 },
        content: 'Underlined',
        fontFamily: 'Arial',
        fontSize: 16,
        fontColor: '#000000',
        fontStyles: ['underline'],
        fontMetrics: { ascent: 10, descent: 3 },
      };

      const result = transformAnnotationsForRust([annotation]);

      // Underline should be ignored, resulting in normal Helvetica
      expect(result[0].font_family).toBe('Helvetica');
    });

    it('transforms text with custom color', () => {
      const annotation: TextAnnotation = {
        id: 'text-6',
        type: 'text',
        pageNumber: 1,
        position: { x: 100, y: 200 },
        size: { width: 150, height: 30 },
        content: 'Custom Color',
        fontFamily: 'Arial',
        fontSize: 16,
        fontColor: '#AB12CD',
        fontStyles: [],
        fontMetrics: { ascent: 10, descent: 3 },
      };

      const result = transformAnnotationsForRust([annotation]);

      expect(result[0].color).toEqual({ r: 171, g: 18, b: 205 });
    });
  });

  describe('Image annotations', () => {
    it('transforms JPEG image annotation', () => {
      const annotation: ImageAnnotation = {
        id: 'img-1',
        type: 'image',
        pageNumber: 1,
        position: { x: 50, y: 100 },
        size: { width: 200, height: 150 },
        imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        imageFormat: 'jpeg',
      };

      const result = transformAnnotationsForRust([annotation]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        page: 0,
        position: { x: 50, y: 100 },
        type: 'image',
        image_data: '/9j/4AAQSkZJRg==',
        format: 'jpeg',
        width: 200,
        height: 150,
      });
    });

    it('transforms PNG image annotation', () => {
      const annotation: ImageAnnotation = {
        id: 'img-2',
        type: 'image',
        pageNumber: 2,
        position: { x: 100, y: 200 },
        size: { width: 300, height: 250 },
        imageData: 'data:image/png;base64,iVBORw0KGgo=',
        imageFormat: 'png',
      };

      const result = transformAnnotationsForRust([annotation]);

      expect(result[0]).toEqual({
        page: 1,
        position: { x: 100, y: 200 },
        type: 'image',
        image_data: 'iVBORw0KGgo=',
        format: 'png',
        width: 300,
        height: 250,
      });
    });

    it('handles image data without data URL prefix', () => {
      const annotation: ImageAnnotation = {
        id: 'img-3',
        type: 'image',
        pageNumber: 1,
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        imageData: 'ABC123DEF456',
        imageFormat: 'jpeg',
      };

      const result = transformAnnotationsForRust([annotation]);

      expect(result[0].image_data).toBe('ABC123DEF456');
    });
  });

  describe('Mixed annotations', () => {
    it('transforms array with both text and image annotations', () => {
      const textAnnotation: TextAnnotation = {
        id: 'text-1',
        type: 'text',
        pageNumber: 1,
        position: { x: 100, y: 200 },
        size: { width: 150, height: 30 },
        content: 'Title',
        fontFamily: 'Arial',
        fontSize: 18,
        fontColor: '#000000',
        fontStyles: ['bold'],
        fontMetrics: { ascent: 10, descent: 3 },
      };

      const imageAnnotation: ImageAnnotation = {
        id: 'img-1',
        type: 'image',
        pageNumber: 2,
        position: { x: 50, y: 100 },
        size: { width: 200, height: 150 },
        imageData: 'data:image/jpeg;base64,ABC123',
        imageFormat: 'jpeg',
      };

      const result = transformAnnotationsForRust([textAnnotation, imageAnnotation]);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('text');
      expect(result[1].type).toBe('image');
      expect(result[0].page).toBe(0);
      expect(result[1].page).toBe(1);
    });

    it('preserves annotation order', () => {
      const annotations: TextAnnotation[] = [
        {
          id: 'text-1',
          type: 'text',
          pageNumber: 1,
          position: { x: 0, y: 0 },
          size: { width: 100, height: 20 },
          content: 'First',
          fontFamily: 'Arial',
          fontSize: 12,
          fontColor: '#000000',
          fontStyles: [],
        fontMetrics: { ascent: 10, descent: 3 },
        },
        {
          id: 'text-2',
          type: 'text',
          pageNumber: 1,
          position: { x: 0, y: 30 },
          size: { width: 100, height: 20 },
          content: 'Second',
          fontFamily: 'Arial',
          fontSize: 12,
          fontColor: '#000000',
          fontStyles: [],
        fontMetrics: { ascent: 10, descent: 3 },
        },
        {
          id: 'text-3',
          type: 'text',
          pageNumber: 1,
          position: { x: 0, y: 60 },
          size: { width: 100, height: 20 },
          content: 'Third',
          fontFamily: 'Arial',
          fontSize: 12,
          fontColor: '#000000',
          fontStyles: [],
        fontMetrics: { ascent: 10, descent: 3 },
        },
      ];

      const result = transformAnnotationsForRust(annotations);

      expect(result[0].content).toBe('First');
      expect(result[1].content).toBe('Second');
      expect(result[2].content).toBe('Third');
    });
  });

  describe('Empty and edge cases', () => {
    it('handles empty annotations array', () => {
      const result = transformAnnotationsForRust([]);
      expect(result).toEqual([]);
    });

    it('handles multi-page annotations', () => {
      const annotations: TextAnnotation[] = [
        {
          id: 'text-1',
          type: 'text',
          pageNumber: 1,
          position: { x: 100, y: 100 },
          size: { width: 100, height: 20 },
          content: 'Page 1',
          fontFamily: 'Arial',
          fontSize: 12,
          fontColor: '#000000',
          fontStyles: [],
        fontMetrics: { ascent: 10, descent: 3 },
        },
        {
          id: 'text-2',
          type: 'text',
          pageNumber: 5,
          position: { x: 100, y: 100 },
          size: { width: 100, height: 20 },
          content: 'Page 5',
          fontFamily: 'Arial',
          fontSize: 12,
          fontColor: '#000000',
          fontStyles: [],
        fontMetrics: { ascent: 10, descent: 3 },
        },
        {
          id: 'text-3',
          type: 'text',
          pageNumber: 10,
          position: { x: 100, y: 100 },
          size: { width: 100, height: 20 },
          content: 'Page 10',
          fontFamily: 'Arial',
          fontSize: 12,
          fontColor: '#000000',
          fontStyles: [],
        fontMetrics: { ascent: 10, descent: 3 },
        },
      ];

      const result = transformAnnotationsForRust(annotations);

      expect(result[0].page).toBe(0);
      expect(result[1].page).toBe(4);
      expect(result[2].page).toBe(9);
    });
  });
});
