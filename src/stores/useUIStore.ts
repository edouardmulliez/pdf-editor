import { create } from 'zustand';
import { Tool } from '../types';

interface UIState {
  activeTool: Tool;
  sidebarVisible: boolean;
  zoomLevel: number;

  // Text formatting state
  selectedFontFamily: string;
  selectedFontSize: number;
  selectedFontColor: string;
  selectedFontStyles: Set<'bold' | 'italic' | 'underline'>;

  // Actions
  setActiveTool: (tool: Tool) => void;
  setSidebarVisible: (visible: boolean) => void;
  toggleSidebar: () => void;
  setZoomLevel: (zoom: number) => void;
  setSelectedFontFamily: (family: string) => void;
  setSelectedFontSize: (size: number) => void;
  setSelectedFontColor: (color: string) => void;
  toggleFontStyle: (style: 'bold' | 'italic' | 'underline') => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTool: null,
  sidebarVisible: true,
  zoomLevel: 100,

  // Default text formatting
  selectedFontFamily: 'Arial',
  selectedFontSize: 14,
  selectedFontColor: '#000000',
  selectedFontStyles: new Set(),

  setActiveTool: (tool) => set({ activeTool: tool }),

  setSidebarVisible: (visible) => set({ sidebarVisible: visible }),

  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),

  setZoomLevel: (zoom) => set({ zoomLevel: Math.max(25, Math.min(zoom, 300)) }),

  setSelectedFontFamily: (family) => set({ selectedFontFamily: family }),

  setSelectedFontSize: (size) =>
    set({ selectedFontSize: Math.max(8, Math.min(size, 72)) }),

  setSelectedFontColor: (color) => set({ selectedFontColor: color }),

  toggleFontStyle: (style) =>
    set((state) => {
      const newStyles = new Set(state.selectedFontStyles);
      if (newStyles.has(style)) {
        newStyles.delete(style);
      } else {
        newStyles.add(style);
      }
      return { selectedFontStyles: newStyles };
    }),
}));
