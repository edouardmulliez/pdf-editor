import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUIStore } from '../useUIStore';

describe('useUIStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useUIStore());
    act(() => {
      result.current.setActiveTool(null);
      result.current.setSidebarVisible(true);
      result.current.setZoomLevel(100);
      result.current.setEditingAnnotationId(null);
      result.current.setSelectedFontFamily('Arial');
      result.current.setSelectedFontSize(14);
      result.current.setSelectedFontColor('#000000');
    });
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useUIStore());
    expect(result.current.activeTool).toBeNull();
    expect(result.current.sidebarVisible).toBe(true);
    expect(result.current.zoomLevel).toBe(100);
    expect(result.current.editingAnnotationId).toBeNull();
    expect(result.current.selectedFontFamily).toBe('Arial');
    expect(result.current.selectedFontSize).toBe(14);
    expect(result.current.selectedFontColor).toBe('#000000');
  });

  it('sets active tool', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.setActiveTool('text');
    });
    expect(result.current.activeTool).toBe('text');

    act(() => {
      result.current.setActiveTool('image');
    });
    expect(result.current.activeTool).toBe('image');
  });

  it('toggles sidebar visibility', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.toggleSidebar();
    });
    expect(result.current.sidebarVisible).toBe(false);

    act(() => {
      result.current.toggleSidebar();
    });
    expect(result.current.sidebarVisible).toBe(true);
  });

  it('sets zoom level within bounds', () => {
    const { result } = renderHook(() => useUIStore());

    // Valid zoom
    act(() => {
      result.current.setZoomLevel(150);
    });
    expect(result.current.zoomLevel).toBe(150);

    // Clamp to max
    act(() => {
      result.current.setZoomLevel(500);
    });
    expect(result.current.zoomLevel).toBe(300);

    // Clamp to min
    act(() => {
      result.current.setZoomLevel(10);
    });
    expect(result.current.zoomLevel).toBe(25);
  });

  it('sets editing annotation ID', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.setEditingAnnotationId('annotation-123');
    });
    expect(result.current.editingAnnotationId).toBe('annotation-123');

    act(() => {
      result.current.setEditingAnnotationId(null);
    });
    expect(result.current.editingAnnotationId).toBeNull();
  });

  it('sets font family', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.setSelectedFontFamily('Times New Roman');
    });
    expect(result.current.selectedFontFamily).toBe('Times New Roman');
  });

  it('sets font size within bounds', () => {
    const { result } = renderHook(() => useUIStore());

    // Valid size
    act(() => {
      result.current.setSelectedFontSize(24);
    });
    expect(result.current.selectedFontSize).toBe(24);

    // Clamp to max
    act(() => {
      result.current.setSelectedFontSize(100);
    });
    expect(result.current.selectedFontSize).toBe(72);

    // Clamp to min
    act(() => {
      result.current.setSelectedFontSize(4);
    });
    expect(result.current.selectedFontSize).toBe(8);
  });

  it('sets font color', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.setSelectedFontColor('#FF0000');
    });
    expect(result.current.selectedFontColor).toBe('#FF0000');
  });

  it('toggles font styles', () => {
    const { result } = renderHook(() => useUIStore());

    // Add bold
    act(() => {
      result.current.toggleFontStyle('bold');
    });
    expect(result.current.selectedFontStyles.has('bold')).toBe(true);

    // Add italic
    act(() => {
      result.current.toggleFontStyle('italic');
    });
    expect(result.current.selectedFontStyles.has('italic')).toBe(true);
    expect(result.current.selectedFontStyles.has('bold')).toBe(true);

    // Remove bold
    act(() => {
      result.current.toggleFontStyle('bold');
    });
    expect(result.current.selectedFontStyles.has('bold')).toBe(false);
    expect(result.current.selectedFontStyles.has('italic')).toBe(true);
  });
});
