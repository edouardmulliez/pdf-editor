import React from 'react';
import { useAnnotationStore } from '../../stores/useAnnotationStore';
import { useUIStore } from '../../stores/useUIStore';
import { pdfToCanvas } from '../../utils/coordinate-converter';
import type { PageMetadata } from '../../utils/coordinate-converter';
import type { Annotation } from '../../types';

interface AnnotationLayerProps {
  pageNumber: number;
  pageMetadata: PageMetadata;
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({ pageNumber, pageMetadata }) => {
  const { getAnnotationsByPage, selectedAnnotationId, selectAnnotation, updateAnnotation, deleteAnnotation } =
    useAnnotationStore();
  const { editingAnnotationId, setEditingAnnotationId } = useUIStore();

  const annotations = getAnnotationsByPage(pageNumber);

  const handleAnnotationClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent page click handler
    selectAnnotation(id);
  };

  const renderAnnotation = (annotation: Annotation) => {
    const isSelected = annotation.id === selectedAnnotationId;
    const baseClasses = `absolute cursor-pointer transition-all ${
      isSelected ? 'ring-2 ring-primary-500' : ''
    }`;

    // Convert PDF coordinates to canvas coordinates
    const canvasPos = pdfToCanvas(annotation.position, pageMetadata);
    const canvasSize = {
      width: annotation.size.width * pageMetadata.scale,
      height: annotation.size.height * pageMetadata.scale,
    };

    const style = {
      left: `${canvasPos.x}px`,
      top: `${canvasPos.y}px`,
      width: `${canvasSize.width}px`,
      height: `${canvasSize.height}px`,
    };

    if (annotation.type === 'text') {
      const fontWeight = annotation.fontStyles.includes('bold') ? 'bold' : 'normal';
      const fontStyle = annotation.fontStyles.includes('italic') ? 'italic' : 'normal';
      const textDecoration = annotation.fontStyles.includes('underline')
        ? 'underline'
        : 'none';

      // Inline editing mode
      if (editingAnnotationId === annotation.id) {
        return (
          <input
            key={annotation.id}
            autoFocus
            value={annotation.content}
            onChange={(e) => updateAnnotation(annotation.id, { content: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setEditingAnnotationId(null);
                if (!annotation.content.trim()) {
                  deleteAnnotation(annotation.id);
                }
              } else if (e.key === 'Escape') {
                deleteAnnotation(annotation.id);
                setEditingAnnotationId(null);
              }
            }}
            onBlur={() => {
              setEditingAnnotationId(null);
              if (!annotation.content.trim()) {
                deleteAnnotation(annotation.id);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              left: `${canvasPos.x}px`,
              top: `${canvasPos.y}px`,
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`,
              fontFamily: annotation.fontFamily,
              fontSize: `${annotation.fontSize * pageMetadata.scale}px`,
              color: annotation.fontColor,
              fontWeight,
              fontStyle,
              textDecoration,
              border: '2px solid #3b82f6',
              outline: 'none',
              background: 'rgba(255, 255, 255, 0.9)',
              padding: '2px 4px',
              boxSizing: 'border-box',
            }}
          />
        );
      }

      // Normal text rendering
      return (
        <div
          key={annotation.id}
          className={`${baseClasses} flex items-center`}
          style={style}
          onClick={(e) => handleAnnotationClick(e, annotation.id)}
        >
          <span
            style={{
              fontFamily: annotation.fontFamily,
              fontSize: `${annotation.fontSize * pageMetadata.scale}px`,
              color: annotation.fontColor,
              fontWeight,
              fontStyle,
              textDecoration,
            }}
          >
            {annotation.content || 'Text'}
          </span>
        </div>
      );
    }

    if (annotation.type === 'image') {
      return (
        <div
          key={annotation.id}
          className={baseClasses}
          style={style}
          onClick={(e) => handleAnnotationClick(e, annotation.id)}
        >
          <img
            src={annotation.imageData}
            alt="annotation"
            className="w-full h-full object-contain"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="relative w-full h-full pointer-events-auto">
        {annotations.map(renderAnnotation)}
      </div>
    </div>
  );
};
