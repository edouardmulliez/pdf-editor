import React from 'react';
import { useUIStore } from '../../stores/useUIStore';
import { usePDFStore } from '../../stores/usePDFStore';
import { Tool } from '../../types';

const FONT_FAMILIES = ['Arial', 'Times New Roman', 'Courier New', 'Helvetica', 'Georgia'];
const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

export const Toolbar: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    selectedFontFamily,
    selectedFontSize,
    selectedFontColor,
    selectedFontStyles,
    setSelectedFontFamily,
    setSelectedFontSize,
    setSelectedFontColor,
    toggleFontStyle,
  } = useUIStore();
  const pdfDoc = usePDFStore((state) => state.document);

  const isTextTool = activeTool === 'text';

  const handleToolClick = (tool: Tool) => {
    if (!pdfDoc) return;
    setActiveTool(activeTool === tool ? null : tool);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      {/* Tool Selection */}
      <div className="flex items-center space-x-2 mb-2">
        <button
          onClick={() => handleToolClick('select')}
          disabled={!pdfDoc}
          className={`p-2 rounded transition-colors ${
            !pdfDoc ? 'opacity-50 cursor-not-allowed text-gray-400' :
            activeTool === 'select' ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
          title="Select Tool"
        >
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </button>

        <button
          onClick={() => handleToolClick('text')}
          disabled={!pdfDoc}
          className={`p-2 rounded transition-colors ${
            !pdfDoc ? 'opacity-50 cursor-not-allowed text-gray-400' :
            activeTool === 'text' ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
          title="Text Tool"
        >
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </button>

        <button
          onClick={() => handleToolClick('image')}
          disabled={!pdfDoc}
          className={`p-2 rounded transition-colors ${
            !pdfDoc ? 'opacity-50 cursor-not-allowed text-gray-400' :
            activeTool === 'image' ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
          title="Image Tool"
        >
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <div className="h-6 w-px bg-gray-300 mx-2" />

        <button
          disabled={!pdfDoc}
          className={`p-2 rounded transition-colors ${
            !pdfDoc ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-gray-100'
          }`}
          title="Delete Selected"
        >
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Text Formatting Controls - Only visible when text tool is active */}
      {isTextTool && (
        <div className="flex items-center space-x-3 border-t border-gray-200 pt-2">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Font:</label>
            <select
              value={selectedFontFamily}
              onChange={(e) => setSelectedFontFamily(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Size:</label>
            <select
              value={selectedFontSize}
              onChange={(e) => setSelectedFontSize(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {FONT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}pt
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => toggleFontStyle('bold')}
              className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
                selectedFontStyles.has('bold') ? 'bg-primary-100 text-primary-700' : 'text-gray-700'
              }`}
              title="Bold"
            >
              <span className="font-bold text-sm">B</span>
            </button>

            <button
              onClick={() => toggleFontStyle('italic')}
              className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
                selectedFontStyles.has('italic') ? 'bg-primary-100 text-primary-700' : 'text-gray-700'
              }`}
              title="Italic"
            >
              <span className="italic text-sm">I</span>
            </button>

            <button
              onClick={() => toggleFontStyle('underline')}
              className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
                selectedFontStyles.has('underline') ? 'bg-primary-100 text-primary-700' : 'text-gray-700'
              }`}
              title="Underline"
            >
              <span className="underline text-sm">U</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Color:</label>
            <input
              type="color"
              value={selectedFontColor}
              onChange={(e) => setSelectedFontColor(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
