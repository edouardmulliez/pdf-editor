import React, { useEffect, useRef } from 'react';
import { usePDFStore } from '../../stores/usePDFStore';

export const PDFViewer: React.FC = () => {
  const { document: pdfDoc, currentPage, isLoading, error } = usePDFStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
      // PDF rendering will be implemented with PDF.js
      // For now, just show a placeholder
    }
  }, [pdfDoc, currentPage]);

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

  return (
    <div className="flex-1 overflow-auto bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg">
        <canvas
          ref={canvasRef}
          className="w-full"
        />
        <div className="p-4 text-center text-gray-500">
          PDF Rendering will be implemented with PDF.js
          <br />
          <span className="text-sm">Page {currentPage} of {usePDFStore.getState().totalPages}</span>
        </div>
      </div>
    </div>
  );
};
