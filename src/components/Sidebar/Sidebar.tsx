import React from 'react';
import { usePDFStore } from '../../stores/usePDFStore';
import { useUIStore } from '../../stores/useUIStore';

export const Sidebar: React.FC = () => {
  const { totalPages, currentPage, setCurrentPage } = usePDFStore();
  const { sidebarVisible } = useUIStore();

  if (!sidebarVisible || totalPages === 0) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <aside className="w-48 bg-gray-50 border-r border-gray-200 overflow-y-auto">
      <div className="p-2">
        <h2 className="text-xs font-semibold text-gray-600 uppercase mb-2 px-2">
          Pages
        </h2>
        <div className="space-y-2">
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-full p-2 rounded text-left transition-colors ${
                currentPage === page
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">Page {page}</span>
              </div>
              {/* Thumbnail placeholder */}
              <div className="mt-1 bg-white border border-gray-200 rounded aspect-[8.5/11] flex items-center justify-center text-gray-400 text-xs">
                {page}
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
