export type FontStyle = 'bold' | 'italic' | 'underline';

export interface Position {
  x: number;
  y: number;
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

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  fontStyles: FontStyle[];
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
