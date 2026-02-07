import { create } from 'zustand';
import { PDFDocument } from '../types';

interface PDFState {
  document: PDFDocument | null;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  setDocument: (document: PDFDocument | null) => void;
  setCurrentPage: (page: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePDFStore = create<PDFState>((set) => ({
  document: null,
  currentPage: 1,
  totalPages: 0,
  isLoading: false,
  error: null,

  setDocument: (document) =>
    set({
      document,
      totalPages: document?.numPages || 0,
      currentPage: 1,
      error: null,
    }),

  setCurrentPage: (page) =>
    set((state) => ({
      currentPage: Math.max(1, Math.min(page, state.totalPages)),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),
}));
