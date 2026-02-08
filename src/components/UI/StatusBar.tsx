import { usePDFStore } from '../../stores/usePDFStore';
import { useUIStore } from '../../stores/useUIStore';

export const StatusBar: React.FC = () => {
  const { fileName, currentPage, totalPages } = usePDFStore();
  const { zoomLevel } = useUIStore();

  if (!fileName) {
    return (
      <footer className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm text-gray-500">
        <span>No document loaded</span>
        <span>Ready</span>
      </footer>
    );
  }

  return (
    <footer className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center space-x-3 text-gray-700">
        <span data-testid="status-filename" className="font-medium">{fileName}</span>
      </div>

      <div className="flex items-center space-x-2 text-gray-600">
        <span data-testid="status-page-number">
          Page <strong className="font-semibold">{currentPage}</strong> of{' '}
          <strong className="font-semibold">{totalPages}</strong>
        </span>
      </div>

      <div className="text-gray-600">
        <span>{zoomLevel}%</span>
      </div>
    </footer>
  );
};
