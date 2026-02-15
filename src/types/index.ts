export type FontStyle = 'bold' | 'italic' | 'underline';

export interface Position {
  x: number;  // Horizontal position in PDF points from left edge
  y: number;  // For TEXT: Y-coordinate of ALPHABETIC BASELINE
              // For IMAGE: Y-coordinate of top-left corner
              // (PDF coordinates: bottom-left origin, Y increases upward)
}

export interface Size {
  width: number;
  height: number;
}

export interface BaseAnnotation {
  id: string;
  pageNumber: number;
  position: Position;
  size: Size;
}

export interface FontMetrics {
  ascent: number;   // Distance from baseline to top (actualBoundingBoxAscent)
  descent: number;  // Distance from baseline to bottom (actualBoundingBoxDescent)
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  fontStyles: FontStyle[];
  fontMetrics: FontMetrics;
}

export interface ImageAnnotation extends BaseAnnotation {
  type: 'image';
  imageData: string; // base64 or path
  imageFormat: 'png' | 'jpeg';
}

export type Annotation = TextAnnotation | ImageAnnotation;

export type Tool = 'select' | 'text' | 'image' | null;

export interface PDFDocument {
  fileName: string;
  numPages: number;
  data: ArrayBuffer | null;
}
