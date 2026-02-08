import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePDFStore } from '../usePDFStore';

describe('usePDFStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => usePDFStore());
    act(() => {
      result.current.clearDocument();
    });
  });

  it('initializes with null document', () => {
    const { result } = renderHook(() => usePDFStore());
    expect(result.current.document).toBeNull();
    expect(result.current.fileName).toBeNull();
    expect(result.current.totalPages).toBe(0);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets document and metadata', () => {
    const { result } = renderHook(() => usePDFStore());
    const mockDoc = {} as any;

    act(() => {
      result.current.setDocument(mockDoc, 'test.pdf', '/path/test.pdf', 5);
    });

    expect(result.current.document).toBe(mockDoc);
    expect(result.current.fileName).toBe('test.pdf');
    expect(result.current.filePath).toBe('/path/test.pdf');
    expect(result.current.totalPages).toBe(5);
    expect(result.current.currentPage).toBe(1);
  });

  it('clears document', () => {
    const { result } = renderHook(() => usePDFStore());

    act(() => {
      result.current.setDocument({} as any, 'test.pdf', '/path', 5);
      result.current.clearDocument();
    });

    expect(result.current.document).toBeNull();
    expect(result.current.fileName).toBeNull();
    expect(result.current.totalPages).toBe(0);
  });

  it('sets current page within bounds', () => {
    const { result } = renderHook(() => usePDFStore());

    act(() => {
      result.current.setDocument({} as any, 'test.pdf', '/path', 5);
    });

    // Set valid page
    act(() => {
      result.current.setCurrentPage(3);
    });
    expect(result.current.currentPage).toBe(3);

    // Clamp to max
    act(() => {
      result.current.setCurrentPage(10);
    });
    expect(result.current.currentPage).toBe(5);

    // Clamp to min
    act(() => {
      result.current.setCurrentPage(-1);
    });
    expect(result.current.currentPage).toBe(1);
  });

  it('sets loading state', () => {
    const { result } = renderHook(() => usePDFStore());

    act(() => {
      result.current.setLoading(true);
    });
    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('sets error state', () => {
    const { result } = renderHook(() => usePDFStore());

    act(() => {
      result.current.setError('Test error');
    });
    expect(result.current.error).toBe('Test error');
    expect(result.current.isLoading).toBe(false);
  });

  it('stores and retrieves page metadata', () => {
    const { result } = renderHook(() => usePDFStore());
    const metadata = {
      pageNumber: 1,
      scale: 2.0,
      viewportWidth: 612,
      viewportHeight: 792,
    };

    act(() => {
      result.current.setPageMetadata(1, metadata);
    });

    const retrieved = result.current.getPageMetadata(1);
    expect(retrieved).toEqual(metadata);
  });
});
