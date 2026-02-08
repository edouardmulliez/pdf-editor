import { create } from 'zustand';
import { Annotation } from '../types';

interface AnnotationState {
  annotations: Annotation[];
  selectedAnnotationId: string | null;

  // Actions
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
  clearAnnotations: () => void;
  getAnnotationsByPage: (pageNumber: number) => Annotation[];
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  annotations: [],
  selectedAnnotationId: null,

  addAnnotation: (annotation) =>
    set((state) => ({
      annotations: [...state.annotations, annotation],
      selectedAnnotationId: annotation.id,
    })),

  updateAnnotation: (id, updates) =>
    set((state) => ({
      annotations: state.annotations.map((ann) =>
        ann.id === id ? { ...ann, ...updates } as Annotation : ann
      ),
    })),

  deleteAnnotation: (id) =>
    set((state) => ({
      annotations: state.annotations.filter((ann) => ann.id !== id),
      selectedAnnotationId:
        state.selectedAnnotationId === id ? null : state.selectedAnnotationId,
    })),

  selectAnnotation: (id) => set({ selectedAnnotationId: id }),

  clearAnnotations: () => set({ annotations: [], selectedAnnotationId: null }),

  getAnnotationsByPage: (pageNumber) => {
    return get().annotations.filter((ann) => ann.pageNumber === pageNumber);
  },
}));
