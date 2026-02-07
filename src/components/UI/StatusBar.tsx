import React from 'react';
import { usePDFStore } from '../../stores/usePDFStore';
import { useUIStore } from '../../stores/useUIStore';

export const StatusBar: React.FC = () => {
  const { currentPage, totalPages } = usePDFStore();
  const { zoomLevel } = useUIStore();

  if (totalPages === 0) {
    return null;
  }

  return (
    <footer className="h-10 bg-gray-100 border-t border-gray-200 flex items-center justify-between px-4 text-sm text-gray-600">
      <div>
        Page {currentPage} of {totalPages}
      </div>
      <div>{zoomLevel}%</div>
    </footer>
  );
};
