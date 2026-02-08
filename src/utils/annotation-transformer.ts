/**
 * Annotation Transformer
 *
 * Transforms frontend annotations to Rust-compatible format for PDF export.
 * Handles conversion of:
 * - Page numbers (1-indexed → 0-indexed)
 * - Colors (hex strings → RGB objects)
 * - Fonts (UI font families + styles → Standard 14 PDF fonts)
 * - Images (data URLs → base64 strings)
 */

import type { Annotation, TextAnnotation, ImageAnnotation } from '../types';

// ============================================================================
// Type Definitions (matching Rust backend)
// ============================================================================

interface RustColor {
  r: number;
  g: number;
  b: number;
}

interface RustPosition {
  x: number;
  y: number;
}

interface RustAnnotation {
  page: number; // 0-indexed
  position: RustPosition;
  type: 'text' | 'image';
  // Text fields
  content?: string;
  font_family?: string;
  font_size?: number;
  color?: RustColor;
  // Image fields
  image_data?: string;
  format?: 'jpeg' | 'png';
  width?: number;
  height?: number;
}

// ============================================================================
// Font Mapping Tables
// ============================================================================

/**
 * Maps UI font families to PDF Standard 14 base fonts
 */
const FONT_MAPPING: Record<string, string> = {
  'Arial': 'Helvetica',
  'Times New Roman': 'Times-Roman',
  'Courier New': 'Courier',
  'Helvetica': 'Helvetica',
  'Georgia': 'Times-Roman',
};

/**
 * Maps font styles to Standard 14 font variants
 */
const FONT_VARIANT_MAPPING: Record<string, Record<string, string>> = {
  'Helvetica': {
    'normal': 'Helvetica',
    'bold': 'Helvetica-Bold',
    'italic': 'Helvetica-Oblique',
    'bold-italic': 'Helvetica-BoldOblique',
  },
  'Times-Roman': {
    'normal': 'Times-Roman',
    'bold': 'Times-Bold',
    'italic': 'Times-Italic',
    'bold-italic': 'Times-BoldItalic',
  },
  'Courier': {
    'normal': 'Courier',
    'bold': 'Courier-Bold',
    'italic': 'Courier-Oblique',
    'bold-italic': 'Courier-BoldOblique',
  },
};

// ============================================================================
// Transformation Functions
// ============================================================================

/**
 * Converts hex color string to RGB object
 * @param hex - Color in hex format (e.g., "#FF0000" or "#F00")
 * @returns RGB color object with values 0-255
 */
export function hexToRgb(hex: string): RustColor {
  // Remove # prefix if present
  const cleanHex = hex.replace(/^#/, '');

  // Handle 3-digit hex codes (e.g., #F00)
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;

  // Parse RGB components
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);

  // Validate and clamp values
  return {
    r: Math.max(0, Math.min(255, isNaN(r) ? 0 : r)),
    g: Math.max(0, Math.min(255, isNaN(g) ? 0 : g)),
    b: Math.max(0, Math.min(255, isNaN(b) ? 0 : b)),
  };
}

/**
 * Maps UI font family and styles to Standard 14 PDF font
 * @param fontFamily - UI font family (e.g., "Arial", "Times New Roman")
 * @param fontStyles - Array of styles (e.g., ['bold', 'italic'])
 * @returns Standard 14 PDF font name (e.g., "Helvetica-Bold")
 */
export function mapFontToStandard14(
  fontFamily: string,
  fontStyles: string[]
): string {
  // Map UI font to base PDF font
  const baseFont = FONT_MAPPING[fontFamily] || 'Helvetica';

  // Determine variant based on styles
  // Note: underline is NOT supported by PDF Standard 14 fonts
  const hasBold = fontStyles.includes('bold');
  const hasItalic = fontStyles.includes('italic');

  let variant: string;
  if (hasBold && hasItalic) {
    variant = 'bold-italic';
  } else if (hasBold) {
    variant = 'bold';
  } else if (hasItalic) {
    variant = 'italic';
  } else {
    variant = 'normal';
  }

  // Get the Standard 14 font variant
  const variantMap = FONT_VARIANT_MAPPING[baseFont];
  return variantMap?.[variant] || baseFont;
}

/**
 * Strips data URL prefix from base64 image data
 * @param dataUrl - Image data URL (e.g., "data:image/jpeg;base64,ABC...")
 * @returns Base64 string without prefix (e.g., "ABC...")
 */
export function stripDataUrlPrefix(dataUrl: string): string {
  // Match data URL format: data:[<mediatype>][;base64],<data>
  const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
  if (match) {
    return match[1];
  }

  // If no data URL prefix, assume it's already base64
  return dataUrl;
}

/**
 * Transforms a single text annotation
 */
function transformTextAnnotation(annotation: TextAnnotation): RustAnnotation {
  return {
    page: annotation.pageNumber - 1, // Convert to 0-indexed
    position: {
      x: annotation.position.x,
      y: annotation.position.y,
    },
    type: 'text',
    content: annotation.content,
    font_family: mapFontToStandard14(annotation.fontFamily, annotation.fontStyles),
    font_size: annotation.fontSize,
    color: hexToRgb(annotation.fontColor),
  };
}

/**
 * Transforms a single image annotation
 */
function transformImageAnnotation(annotation: ImageAnnotation): RustAnnotation {
  return {
    page: annotation.pageNumber - 1, // Convert to 0-indexed
    position: {
      x: annotation.position.x,
      y: annotation.position.y,
    },
    type: 'image',
    image_data: stripDataUrlPrefix(annotation.imageData),
    format: annotation.imageFormat,
    width: annotation.size.width,
    height: annotation.size.height,
  };
}

/**
 * Transforms an array of frontend annotations to Rust format
 * @param annotations - Frontend annotations array
 * @returns Array of Rust-compatible annotations ready for export
 */
export function transformAnnotationsForRust(
  annotations: Annotation[]
): RustAnnotation[] {
  return annotations.map(annotation => {
    if (annotation.type === 'text') {
      return transformTextAnnotation(annotation);
    } else {
      return transformImageAnnotation(annotation);
    }
  });
}
