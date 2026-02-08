import { useEffect, useState, useRef } from 'react';
import { usePDFStore } from '../../stores/usePDFStore';
import { useUIStore } from '../../stores/useUIStore';
import { generateThumbnails, type Thumbnail } from '../../utils/thumbnail-generator';

export const Sidebar: React.FC = () => {
  const { document: pdfDoc, currentPage, totalPages } = usePDFStore();
  const { sidebarVisible } = useUIStore();
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const currentThumbnailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pdfDoc) {
      setThumbnails([]);
      return;
    }

    const generate = async () => {
      setIsGenerating(true);
      try {
        const thumbs = await generateThumbnails(
          pdfDoc,
          (current, total) => setProgress({ current, total })
        );
        setThumbnails(thumbs);
      } catch (error) {
        console.error('Error generating thumbnails:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    generate();
  }, [pdfDoc]);

  useEffect(() => {
    if (currentThumbnailRef.current) {
      currentThumbnailRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentPage]);

  const scrollToPage = (pageNumber: number) => {
    const pageElement = document.querySelector(
      `[data-page-number="${pageNumber}"]`
    );

    if (pageElement) {
      pageElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  if (!sidebarVisible) {
    return null;
  }

  return (
    <div className="w-56 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700">Pages</h2>
        {totalPages > 0 && (
          <p className="text-xs text-gray-500 mt-1">{totalPages} pages</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isGenerating ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
            <p className="text-xs text-gray-600">Generating thumbnails...</p>
            <p className="text-xs text-gray-500 mt-1">
              {progress.current} / {progress.total}
            </p>
          </div>
        ) : (
          thumbnails.map((thumb) => (
            <div
              key={thumb.pageNumber}
              ref={thumb.pageNumber === currentPage ? currentThumbnailRef : null}
              onClick={() => scrollToPage(thumb.pageNumber)}
              className={`
                cursor-pointer border-2 transition-all inline-block
                ${
                  thumb.pageNumber === currentPage
                    ? 'border-primary-500 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div
                ref={(el) => {
                  if (el && !el.querySelector('canvas')) {
                    el.appendChild(thumb.canvas);
                  }
                }}
                className="bg-white block"
              />
              <div
                className={`
                  text-center py-1 text-xs font-medium
                  ${
                    thumb.pageNumber === currentPage
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }
                `}
              >
                Page {thumb.pageNumber}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
