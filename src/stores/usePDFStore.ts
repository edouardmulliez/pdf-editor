import { create } from 'zustand';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PageMetadata } from '../utils/coordinate-converter';

interface PDFState {
  document: PDFDocumentProxy | null;
  fileName: string | null;
  filePath: string | null;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  pageMetadata: Map<number, PageMetadata>;

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
  setPageMetadata: (pageNumber: number, metadata: PageMetadata) => void;
  getPageMetadata: (pageNumber: number) => PageMetadata | undefined;
}

export const usePDFStore = create<PDFState>((set, get) => ({
  document: null,
  fileName: null,
  filePath: null,
  currentPage: 1,
  totalPages: 0,
  isLoading: false,
  error: null,
  pageMetadata: new Map(),

  setDocument: (document, fileName, filePath, totalPages) =>
    set({
      document,
      fileName,
      filePath,
      totalPages,
      currentPage: 1,
      error: null,
      isLoading: false,
      pageMetadata: new Map(),
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
      pageMetadata: new Map(),
    }),

  setCurrentPage: (page) =>
    set((state) => ({
      currentPage: Math.max(1, Math.min(page, state.totalPages)),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  setPageMetadata: (pageNumber, metadata) =>
    set((state) => {
      const newMap = new Map(state.pageMetadata);
      newMap.set(pageNumber, metadata);
      return { pageMetadata: newMap };
    }),

  getPageMetadata: (pageNumber) => {
    return get().pageMetadata.get(pageNumber);
  },
}));
