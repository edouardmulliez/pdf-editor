import { create } from 'zustand';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface PDFState {
  document: PDFDocumentProxy | null;
  fileName: string | null;
  filePath: string | null;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  setDocument: (
    doc: PDFDocumentProxy,
    fileName: string,
    filePath: string,
    numPages: number
  ) => void;
  clearDocument: () => void;
  setCurrentPage: (page: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePDFStore = create<PDFState>((set) => ({
  document: null,
  fileName: null,
  filePath: null,
  currentPage: 1,
  totalPages: 0,
  isLoading: false,
  error: null,

  setDocument: (document, fileName, filePath, totalPages) =>
    set({
      document,
      fileName,
      filePath,
      totalPages,
      currentPage: 1,
      error: null,
      isLoading: false,
    }),

  clearDocument: () =>
    set({
      document: null,
      fileName: null,
      filePath: null,
      totalPages: 0,
      currentPage: 1,
      error: null,
      isLoading: false,
    }),

  setCurrentPage: (page) =>
    set((state) => ({
      currentPage: Math.max(1, Math.min(page, state.totalPages)),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),
}));
