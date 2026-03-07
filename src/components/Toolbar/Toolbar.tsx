import React, { useEffect } from 'react';
import { useUIStore } from '../../stores/useUIStore';
import { usePDFStore } from '../../stores/usePDFStore';
import { useAnnotationStore } from '../../stores/useAnnotationStore';
import { Tool, TextAnnotation, ImageAnnotation } from '../../types';
import { openImageDialog } from '../../utils/image-loader';
import { generateId } from '../../utils/id-generator';

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
    setSelectedFontStyles,
    toggleFontStyle,
    zoomLevel,
    setZoomLevel,
    editingAnnotationId,
  } = useUIStore();
  const { document: pdfDoc, currentPage, getPageMetadata } = usePDFStore();
  const { annotations, updateAnnotation, selectedAnnotationId, addAnnotation, selectAnnotation } = useAnnotationStore();

  const selectedAnnotation = annotations.find((a) => a.id === selectedAnnotationId);
  const selectedTextAnnotation = selectedAnnotation?.type === 'text' ? (selectedAnnotation as TextAnnotation) : null;

  const isTextTool = activeTool === 'text';
  const isTextFormattingVisible = isTextTool || selectedTextAnnotation !== null || editingAnnotationId !== null;

  useEffect(() => {
    const targetId = selectedAnnotationId || editingAnnotationId;
    if (!targetId) return;
    const ann = annotations.find((a) => a.id === targetId);
    if (ann?.type === 'text') {
      setSelectedFontFamily(ann.fontFamily);
      setSelectedFontSize(ann.fontSize);
      setSelectedFontColor(ann.fontColor);
      setSelectedFontStyles(new Set(ann.fontStyles));
    }
  }, [selectedAnnotationId, editingAnnotationId]);

  const applyToSelectedAnnotation = (updates: Partial<TextAnnotation>) => {
    const targetId = selectedAnnotationId || editingAnnotationId;
    if (!targetId) return;
    const ann = annotations.find((a) => a.id === targetId);
    if (ann?.type !== 'text') return;

    if (updates.fontFamily !== undefined || updates.fontSize !== undefined) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const family = updates.fontFamily ?? ann.fontFamily;
      const size = updates.fontSize ?? ann.fontSize;
      ctx.font = `${size}px ${family}`;
      const m = ctx.measureText(ann.content || 'Ag');
      updates.fontMetrics = { ascent: m.actualBoundingBoxAscent, descent: m.actualBoundingBoxDescent };
    }
    updateAnnotation(targetId, updates);
  };

  const handleImageButtonClick = async () => {
    if (!pdfDoc) return;
    const imageData = await openImageDialog();
    if (!imageData) return;
    const metadata = getPageMetadata(currentPage);
    if (!metadata) return;
    const aspectRatio = imageData.naturalHeight / imageData.naturalWidth;
    const defaultWidth = 150;
    const defaultHeight = defaultWidth * aspectRatio;
    const annotation: ImageAnnotation = {
      id: generateId(),
      type: 'image',
      pageNumber: currentPage,
      position: {
        x: metadata.viewportWidth / 2 - defaultWidth / 2,
        y: metadata.viewportHeight / 2 + defaultHeight / 2,
      },
      imageData: imageData.data,
      imageFormat: imageData.format,
      size: { width: defaultWidth, height: defaultHeight },
    };
    addAnnotation(annotation);
    selectAnnotation(annotation.id);
  };

  const handleToolClick = (tool: Tool) => {
    if (!pdfDoc) return;
    setActiveTool(activeTool === tool ? null : tool);
  };

  const handleDebugAnnotations = () => {
    console.group(`📍 Debug Annotations (${annotations.length} total)`);
    annotations.forEach((ann, index) => {
      console.group(`Annotation ${index + 1}: ${ann.type} (ID: ${ann.id})`);
      console.log('Position:', ann.position);
      console.log('Size:', ann.size);
      console.log('Page:', ann.pageNumber);

      if (ann.type === 'text') {
        console.log('Content:', ann.content);
        console.log('Font Family:', ann.fontFamily);
        console.log('Font Size:', ann.fontSize);
        console.log('Font Color:', ann.fontColor);
        console.log('Font Styles:', ann.fontStyles);
        console.log('Font Metrics:', ann.fontMetrics);
      } else if (ann.type === 'image') {
        console.log('Image Format:', ann.imageFormat);
        console.log('Image Data Length:', ann.imageData.length);
      }

      console.groupEnd();
    });
    console.groupEnd();
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
          data-testid="text-tool-button"
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
          data-testid="image-tool-button"
          onClick={handleImageButtonClick}
          disabled={!pdfDoc}
          className={`p-2 rounded transition-colors ${
            !pdfDoc ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-gray-100'
          }`}
          title="Insert Image"
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

        <button
          data-testid="debug-annotations-button"
          disabled={!pdfDoc || annotations.length === 0}
          onClick={handleDebugAnnotations}
          className={`p-2 rounded transition-colors ${
            !pdfDoc || annotations.length === 0
              ? 'opacity-50 cursor-not-allowed text-gray-400'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={`Debug Annotations (${annotations.length})`}
        >
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </button>

        <div className="h-6 w-px bg-gray-300 mx-2" />

        {/* Fit to window */}
        <button
          onClick={() => setZoomLevel(100)}
          disabled={!pdfDoc}
          className={`p-2 rounded transition-colors ${
            !pdfDoc ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-gray-100'
          }`}
          title="Fit to Window (Cmd+0)"
        >
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>

        {/* Zoom out */}
        <button
          onClick={() => setZoomLevel(zoomLevel - 25)}
          disabled={!pdfDoc}
          className={`p-2 rounded transition-colors ${
            !pdfDoc ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-gray-100'
          }`}
          title="Zoom Out (Cmd+-)"
        >
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>

        {/* Zoom level display */}
        <span className="text-sm text-gray-600 min-w-[3.5rem] text-center select-none">
          {zoomLevel}%
        </span>

        {/* Zoom in */}
        <button
          onClick={() => setZoomLevel(zoomLevel + 25)}
          disabled={!pdfDoc}
          className={`p-2 rounded transition-colors ${
            !pdfDoc ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-gray-100'
          }`}
          title="Zoom In (Cmd+=)"
        >
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>
      </div>

      {/* Text Formatting Controls - Visible when text tool active or text annotation selected/editing */}
      {isTextFormattingVisible && (
        <div className="flex items-center space-x-3 border-t border-gray-200 pt-2">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Font:</label>
            <select
              value={selectedFontFamily}
              onChange={(e) => { setSelectedFontFamily(e.target.value); applyToSelectedAnnotation({ fontFamily: e.target.value }); }}
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
              onChange={(e) => { const n = Number(e.target.value); setSelectedFontSize(n); applyToSelectedAnnotation({ fontSize: n }); }}
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
              onClick={() => {
                toggleFontStyle('bold');
                const next = new Set(selectedFontStyles);
                next.has('bold') ? next.delete('bold') : next.add('bold');
                applyToSelectedAnnotation({ fontStyles: [...next] });
              }}
              className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
                selectedFontStyles.has('bold') ? 'bg-primary-100 text-primary-700' : 'text-gray-700'
              }`}
              title="Bold"
            >
              <span className="font-bold text-sm">B</span>
            </button>

            <button
              onClick={() => {
                toggleFontStyle('italic');
                const next = new Set(selectedFontStyles);
                next.has('italic') ? next.delete('italic') : next.add('italic');
                applyToSelectedAnnotation({ fontStyles: [...next] });
              }}
              className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
                selectedFontStyles.has('italic') ? 'bg-primary-100 text-primary-700' : 'text-gray-700'
              }`}
              title="Italic"
            >
              <span className="italic text-sm">I</span>
            </button>

            <button
              onClick={() => {
                toggleFontStyle('underline');
                const next = new Set(selectedFontStyles);
                next.has('underline') ? next.delete('underline') : next.add('underline');
                applyToSelectedAnnotation({ fontStyles: [...next] });
              }}
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
              onChange={(e) => { setSelectedFontColor(e.target.value); applyToSelectedAnnotation({ fontColor: e.target.value }); }}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
