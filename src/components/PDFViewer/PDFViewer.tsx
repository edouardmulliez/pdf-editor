import { useEffect, useRef, useState, useCallback } from 'react';
import { usePDFStore } from '../../stores/usePDFStore';
import { useUIStore } from '../../stores/useUIStore';
import { useAnnotationStore } from '../../stores/useAnnotationStore';
import { renderPageToCanvas, calculateFitScale } from '../../utils/pdf-renderer';
import { canvasToPDF } from '../../utils/coordinate-converter';
import { generateId } from '../../utils/id-generator';
import { openImageDialog } from '../../utils/image-loader';
import { AnnotationLayer } from '../AnnotationLayer/AnnotationLayer';
import type { PageMetadata } from '../../utils/coordinate-converter';
import type { TextAnnotation, ImageAnnotation } from '../../types';

interface RenderedPage {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  height: number;
}

export const PDFViewer: React.FC = () => {
  const {
    document: pdfDoc,
    totalPages,
    setCurrentPage,
    isLoading,
    error,
    setPageMetadata,
    getPageMetadata,
    setMouseCoordinates,
  } = usePDFStore();
  const {
    activeTool,
    selectedFontFamily,
    selectedFontSize,
    selectedFontColor,
    selectedFontStyles,
    setEditingAnnotationId,
    zoomLevel,
    setZoomLevel,
  } = useUIStore();
  const { addAnnotation, selectAnnotation, selectedAnnotationId, deleteAnnotation } = useAnnotationStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const [renderedPages, setRenderedPages] = useState<RenderedPage[]>([]);
  const [isRendering, setIsRendering] = useState(false);

  // Refs for zoom logic
  const fitScaleRef = useRef<number>(0);
  const zoomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zoomLevelRef = useRef<number>(100);

  // Keep zoomLevelRef in sync to avoid stale closures in event handlers
  useEffect(() => { zoomLevelRef.current = zoomLevel; }, [zoomLevel]);

  // Core page rendering function — called on initial load and on zoom changes
  const renderPages = useCallback(async (scale: number, showSpinner = true) => {
    if (!pdfDoc) return;
    try {
      if (showSpinner) setIsRendering(true);
      const pages: RenderedPage[] = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) continue;

        const viewport = page.getViewport({ scale: 1.0 });

        await renderPageToCanvas(page, {
          scale,
          canvasContext: context,
          canvas,
        });

        const metadata: PageMetadata = {
          pageNumber: pageNum,
          scale,
          viewportWidth: viewport.width,
          viewportHeight: viewport.height,
        };
        setPageMetadata(pageNum, metadata);

        pages.push({
          pageNumber: pageNum,
          canvas,
          height: canvas.height / (window.devicePixelRatio || 1),
        });
      }

      setRenderedPages(pages);
    } catch (err) {
      console.error('Error rendering pages:', err);
    } finally {
      if (showSpinner) setIsRendering(false);
    }
  }, [pdfDoc, totalPages, setPageMetadata]);

  // Initial render: calculate fitScale, store it, then render at effective zoom
  useEffect(() => {
    if (!pdfDoc) return;

    fitScaleRef.current = 0; // reset so zoom effect doesn't fire prematurely

    const initRender = async () => {
      // Wait for container to be ready (especially important in tests)
      let container = containerRef.current;
      let retries = 0;
      while (!container && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        container = containerRef.current;
        retries++;
      }

      if (!container) {
        console.warn('Container ref is null after retries');
        return;
      }

      const firstPage = await pdfDoc.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1.0 });

      const fitScale = calculateFitScale(
        viewport.width,
        viewport.height,
        container.clientWidth,
        container.clientHeight - 100
      );

      fitScaleRef.current = fitScale;
      await renderPages(fitScale * (zoomLevelRef.current / 100));
    };

    initRender();
  }, [pdfDoc, totalPages, renderPages]);

  // Zoom re-render: debounced 150ms so rapid pinch/button events don't over-render
  useEffect(() => {
    if (!pdfDoc || fitScaleRef.current === 0) return;

    if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
    zoomTimerRef.current = setTimeout(() => {
      renderPages(fitScaleRef.current * (zoomLevelRef.current / 100), false);
    }, 150);

    return () => {
      if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
    };
  }, [zoomLevel, pdfDoc, renderPages]);

  // Trackpad pinch zoom (ctrlKey + wheel on macOS)
  // Attached to window so the listener is always active regardless of render state.
  // (Attaching to pagesContainerRef fails: the container isn't mounted until after a
  // PDF loads, but this effect only runs once on mount — so el would be null.)
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = -e.deltaY * 0.8;
      setZoomLevel(Math.round(zoomLevelRef.current + delta));
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [setZoomLevel]);

  // Handle mouse move for coordinate tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const canvasX = Math.round(e.clientX - rect.left);
    const canvasY = Math.round(e.clientY - rect.top);

    const metadata = getPageMetadata(pageNumber);
    if (!metadata) return;

    const pdfPosition = canvasToPDF(canvasX, canvasY, metadata);

    const roundedPdfCoords = {
      x: Math.round(pdfPosition.x * 10) / 10,
      y: Math.round(pdfPosition.y * 10) / 10,
    };

    setMouseCoordinates(
      { x: canvasX, y: canvasY },
      roundedPdfCoords,
      pageNumber
    );
  }, [getPageMetadata, setMouseCoordinates]);

  // Handle mouse leave to clear coordinates
  const handleMouseLeave = useCallback(() => {
    setMouseCoordinates(null, null, null);
  }, [setMouseCoordinates]);

  // Handle click on page for annotation placement and deselection
  const handlePageClick = useCallback(async (e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
    // If no active tool and target is the page wrapper, deselect annotation
    if (!activeTool && e.target === e.currentTarget) {
      selectAnnotation(null);
      return;
    }

    if (activeTool === 'text') {
      const rect = e.currentTarget.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      const metadata = getPageMetadata(pageNumber);
      if (!metadata) return;

      const pdfPosition = canvasToPDF(canvasX, canvasY, metadata);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const fontWeight = selectedFontStyles.has('bold') ? 'bold' : 'normal';
      const fontStyle = selectedFontStyles.has('italic') ? 'italic' : 'normal';
      ctx.font = `${fontStyle} ${fontWeight} ${selectedFontSize}px ${selectedFontFamily}`;

      const metrics = ctx.measureText('X');
      const fontMetrics = {
        ascent: metrics.actualBoundingBoxAscent || metrics.fontBoundingBoxAscent,
        descent: metrics.actualBoundingBoxDescent || metrics.fontBoundingBoxDescent,
      };

      const annotation: TextAnnotation = {
        id: generateId(),
        type: 'text',
        pageNumber,
        position: pdfPosition,
        content: '',
        fontFamily: selectedFontFamily,
        fontSize: selectedFontSize,
        fontColor: selectedFontColor,
        fontStyles: Array.from(selectedFontStyles),
        fontMetrics,
        size: { width: 200, height: 30 },
      };

      addAnnotation(annotation);
      setEditingAnnotationId(annotation.id);
    } else if (activeTool === 'image') {
      const rect = e.currentTarget.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      const metadata = getPageMetadata(pageNumber);
      if (!metadata) return;

      const pdfPosition = canvasToPDF(canvasX, canvasY, metadata);

      const imageData = await openImageDialog();
      if (!imageData) return;

      const aspectRatio = imageData.naturalHeight / imageData.naturalWidth;
      const defaultWidth = 150;
      const defaultHeight = defaultWidth * aspectRatio;

      const annotation: ImageAnnotation = {
        id: generateId(),
        type: 'image',
        pageNumber,
        position: pdfPosition,
        imageData: imageData.data,
        imageFormat: imageData.format,
        size: { width: defaultWidth, height: defaultHeight },
      };

      addAnnotation(annotation);
      selectAnnotation(annotation.id);
    }
  }, [activeTool, getPageMetadata, selectedFontFamily, selectedFontSize, selectedFontColor, selectedFontStyles, addAnnotation, setEditingAnnotationId, selectAnnotation]);

  // Track current page on scroll
  const handleScroll = useCallback(() => {
    if (!pagesContainerRef.current) return;

    const container = pagesContainerRef.current;
    const scrollTop = container.scrollTop;
    const pageSpacing = 24;

    let accumulatedHeight = 0;
    let currentVisiblePage = 1;

    for (const page of renderedPages) {
      accumulatedHeight += page.height + pageSpacing;

      if (scrollTop < accumulatedHeight - page.height / 2) {
        currentVisiblePage = page.pageNumber;
        break;
      }
    }

    setCurrentPage(currentVisiblePage);
  }, [renderedPages, setCurrentPage]);

  useEffect(() => {
    const container = pagesContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Keyboard shortcuts: Delete/Backspace for annotations, Cmd+=/−/0 for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId) {
        e.preventDefault();
        deleteAnnotation(selectedAnnotationId);
      }

      const modifier = e.metaKey || e.ctrlKey;
      if (modifier && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoomLevel(zoomLevelRef.current + 25);
      }
      if (modifier && e.key === '-') {
        e.preventDefault();
        setZoomLevel(zoomLevelRef.current - 25);
      }
      if (modifier && e.key === '0') {
        e.preventDefault();
        setZoomLevel(100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotationId, deleteAnnotation, setZoomLevel]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 font-medium mb-2">Error loading PDF</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!pdfDoc) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <svg
            className="w-24 h-24 text-gray-300 mx-auto mb-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 text-lg mb-2">No PDF loaded</p>
          <p className="text-gray-500 text-sm">Click "Open PDF" to get started</p>
        </div>
      </div>
    );
  }

  // Show spinner only on initial load (no pages yet); zoom re-renders happen silently
  if (isRendering && renderedPages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Rendering pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} data-testid="pdf-viewer" className="flex-1 flex flex-col bg-gray-100">
      <div ref={pagesContainerRef} className="flex-1 overflow-auto p-8">
        <div className="flex flex-col items-center space-y-6">
          {renderedPages.map((page) => {
            const metadata = getPageMetadata(page.pageNumber);
            return (
              <div
                key={page.pageNumber}
                className={`bg-white shadow-lg inline-block relative ${activeTool ? 'cursor-crosshair' : ''}`}
                data-page-number={page.pageNumber}
                data-testid={`pdf-page-${page.pageNumber}`}
                onClick={(e) => handlePageClick(e, page.pageNumber)}
                onMouseMove={(e) => handleMouseMove(e, page.pageNumber)}
                onMouseLeave={handleMouseLeave}
              >
                <div
                  ref={(el) => {
                    if (el) {
                      const existing = el.querySelector('canvas');
                      if (existing) el.removeChild(existing);
                      el.appendChild(page.canvas);
                    }
                  }}
                  className="relative"
                />
                {metadata && (
                  <AnnotationLayer
                    pageNumber={page.pageNumber}
                    pageMetadata={metadata}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
