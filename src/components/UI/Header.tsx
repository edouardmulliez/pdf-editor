import { useUIStore } from '../../stores/useUIStore';

interface HeaderProps {
  onOpenFile: () => void;
  onExport: () => void;
  hasDocument: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenFile,
  onExport,
  hasDocument,
}) => {
  const { toggleSidebar, sidebarVisible } = useUIStore();

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <svg
            className="w-6 h-6 text-primary-600"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h1 className="text-lg font-semibold text-gray-800">PDF Editor</h1>
        </div>

        {hasDocument && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded hover:bg-gray-100 text-gray-600 transition-colors"
            title={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {sidebarVisible ? (
                <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              ) : (
                <path d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              )}
            </svg>
          </button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenFile}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
        >
          Open PDF
        </button>
        <button
          onClick={onExport}
          disabled={!hasDocument}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export
        </button>
      </div>
    </header>
  );
};
