import { useEffect } from 'react';
import { usePDFStore } from '../../stores/usePDFStore';
import { useUIStore } from '../../stores/useUIStore';

export const StatusBar: React.FC = () => {
  const { fileName, currentPage, totalPages, error, successMessage, setError, setSuccessMessage, mouseCanvasCoords, mousePdfCoords } = usePDFStore();
  const { zoomLevel } = useUIStore();

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, setSuccessMessage]);

  if (!fileName) {
    return (
      <footer className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm text-gray-500">
        <span>No document loaded</span>
        <span>Ready</span>
      </footer>
    );
  }

  return (
    <footer className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm relative">
      {/* Success Toast */}
      {successMessage && (
        <div className="absolute left-4 bottom-full mb-2 px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg flex items-center">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-3 text-white hover:text-gray-200 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="absolute left-4 bottom-full mb-2 px-4 py-2 bg-red-500 text-white rounded-lg shadow-lg flex items-center">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-3 text-white hover:text-gray-200 font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex items-center space-x-3 text-gray-700">
        <span data-testid="status-filename" className="font-medium">{fileName}</span>
      </div>

      <div className="flex items-center space-x-2 text-gray-600">
        <span data-testid="status-page-number">
          Page <strong className="font-semibold">{currentPage}</strong> of{' '}
          <strong className="font-semibold">{totalPages}</strong>
        </span>
      </div>

      <div className="flex items-center space-x-4 text-gray-600">
        {mouseCanvasCoords && mousePdfCoords && (
          <span data-testid="status-coordinates" className="text-xs">
            Canvas: ({mouseCanvasCoords.x}, {mouseCanvasCoords.y}) px | PDF: ({mousePdfCoords.x}, {mousePdfCoords.y}) pt
          </span>
        )}
        <span>{zoomLevel}%</span>
      </div>
    </footer>
  );
};
