import { useEffect, useRef, useState, useCallback } from 'react';
import { usePDFStore } from '../../stores/usePDFStore';
import { renderPageToCanvas, calculateFitScale } from '../../utils/pdf-renderer';

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
    error
  } = usePDFStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const [renderedPages, setRenderedPages] = useState<RenderedPage[]>([]);
  const [isRendering, setIsRendering] = useState(false);

  // Render all pages on load
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;

    const renderAllPages = async () => {
      try {
        setIsRendering(true);
        const pages: RenderedPage[] = [];

        // Get first page to calculate common scale
        const firstPage = await pdfDoc.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1.0 });
        const container = containerRef.current!;
        const fitScale = calculateFitScale(
          viewport.width,
          viewport.height,
          container.clientWidth,
          container.clientHeight - 100
        );

        // Render each page
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          const page = await pdfDoc.getPage(pageNum);
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (!context) continue;

          await renderPageToCanvas(page, {
            scale: fitScale,
            canvasContext: context,
            canvas,
          });

          pages.push({
            pageNumber: pageNum,
            canvas,
            height: canvas.height / (window.devicePixelRatio || 1),
          });
        }

        setRenderedPages(pages);
      } catch (error) {
        console.error('Error rendering pages:', error);
      } finally {
        setIsRendering(false);
      }
    };

    renderAllPages();
  }, [pdfDoc, totalPages]);

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

  if (isRendering) {
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
    <div ref={containerRef} className="flex-1 flex flex-col bg-gray-100">
      <div ref={pagesContainerRef} className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {renderedPages.map((page) => (
            <div
              key={page.pageNumber}
              className="bg-white shadow-lg rounded-lg overflow-hidden"
              data-page-number={page.pageNumber}
            >
              <div
                ref={(el) => {
                  if (el && !el.querySelector('canvas')) {
                    el.appendChild(page.canvas);
                  }
                }}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
