import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnnotationStore } from '../useAnnotationStore';
import { Annotation } from '../../types';

describe('useAnnotationStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useAnnotationStore());
    act(() => {
      result.current.clearAnnotations();
    });
  });

  it('initializes with empty annotations', () => {
    const { result } = renderHook(() => useAnnotationStore());
    expect(result.current.annotations).toEqual([]);
    expect(result.current.selectedAnnotationId).toBeNull();
  });

  it('adds annotation', () => {
    const { result } = renderHook(() => useAnnotationStore());
    const annotation: Annotation = {
      id: 'test-1',
      type: 'text',
      pageNumber: 1,
      position: { x: 100, y: 100 },
      content: 'Test',
      fontFamily: 'Arial',
      fontSize: 14,
      fontColor: '#000000',
      fontStyles: [],
      size: { width: 100, height: 30 },
    };

    act(() => {
      result.current.addAnnotation(annotation);
    });

    expect(result.current.annotations).toHaveLength(1);
    expect(result.current.annotations[0]).toEqual(annotation);
    expect(result.current.selectedAnnotationId).toBe('test-1');
  });

  it('updates annotation', () => {
    const { result } = renderHook(() => useAnnotationStore());
    const annotation: Annotation = {
      id: 'test-1',
      type: 'text',
      pageNumber: 1,
      position: { x: 100, y: 100 },
      content: 'Original',
      fontFamily: 'Arial',
      fontSize: 14,
      fontColor: '#000000',
      fontStyles: [],
      size: { width: 100, height: 30 },
    };

    act(() => {
      result.current.addAnnotation(annotation);
      result.current.updateAnnotation('test-1', { content: 'Updated' });
    });

    expect((result.current.annotations[0] as any).content).toBe('Updated');
  });

  it('deletes annotation', () => {
    const { result } = renderHook(() => useAnnotationStore());
    const annotation: Annotation = {
      id: 'test-1',
      type: 'text',
      pageNumber: 1,
      position: { x: 100, y: 100 },
      content: 'Test',
      fontFamily: 'Arial',
      fontSize: 14,
      fontColor: '#000000',
      fontStyles: [],
      size: { width: 100, height: 30 },
    };

    act(() => {
      result.current.addAnnotation(annotation);
      result.current.deleteAnnotation('test-1');
    });

    expect(result.current.annotations).toHaveLength(0);
    expect(result.current.selectedAnnotationId).toBeNull();
  });

  it('selects annotation', () => {
    const { result } = renderHook(() => useAnnotationStore());

    act(() => {
      result.current.selectAnnotation('test-1');
    });

    expect(result.current.selectedAnnotationId).toBe('test-1');

    act(() => {
      result.current.selectAnnotation(null);
    });

    expect(result.current.selectedAnnotationId).toBeNull();
  });

  it('clears all annotations', () => {
    const { result } = renderHook(() => useAnnotationStore());
    const annotation1: Annotation = {
      id: 'test-1',
      type: 'text',
      pageNumber: 1,
      position: { x: 100, y: 100 },
      content: 'Test 1',
      fontFamily: 'Arial',
      fontSize: 14,
      fontColor: '#000000',
      fontStyles: [],
      size: { width: 100, height: 30 },
    };
    const annotation2: Annotation = {
      id: 'test-2',
      type: 'text',
      pageNumber: 2,
      position: { x: 200, y: 200 },
      content: 'Test 2',
      fontFamily: 'Arial',
      fontSize: 14,
      fontColor: '#000000',
      fontStyles: [],
      size: { width: 100, height: 30 },
    };

    act(() => {
      result.current.addAnnotation(annotation1);
      result.current.addAnnotation(annotation2);
      result.current.clearAnnotations();
    });

    expect(result.current.annotations).toHaveLength(0);
    expect(result.current.selectedAnnotationId).toBeNull();
  });

  it('gets annotations by page', () => {
    const { result } = renderHook(() => useAnnotationStore());
    const annotation1: Annotation = {
      id: 'test-1',
      type: 'text',
      pageNumber: 1,
      position: { x: 100, y: 100 },
      content: 'Page 1',
      fontFamily: 'Arial',
      fontSize: 14,
      fontColor: '#000000',
      fontStyles: [],
      size: { width: 100, height: 30 },
    };
    const annotation2: Annotation = {
      id: 'test-2',
      type: 'text',
      pageNumber: 2,
      position: { x: 200, y: 200 },
      content: 'Page 2',
      fontFamily: 'Arial',
      fontSize: 14,
      fontColor: '#000000',
      fontStyles: [],
      size: { width: 100, height: 30 },
    };
    const annotation3: Annotation = {
      id: 'test-3',
      type: 'text',
      pageNumber: 1,
      position: { x: 150, y: 150 },
      content: 'Page 1 again',
      fontFamily: 'Arial',
      fontSize: 14,
      fontColor: '#000000',
      fontStyles: [],
      size: { width: 100, height: 30 },
    };

    act(() => {
      result.current.addAnnotation(annotation1);
      result.current.addAnnotation(annotation2);
      result.current.addAnnotation(annotation3);
    });

    const page1Annotations = result.current.getAnnotationsByPage(1);
    const page2Annotations = result.current.getAnnotationsByPage(2);

    expect(page1Annotations).toHaveLength(2);
    expect(page2Annotations).toHaveLength(1);
    expect((page1Annotations[0] as any).content).toBe('Page 1');
    expect((page1Annotations[1] as any).content).toBe('Page 1 again');
  });
});
