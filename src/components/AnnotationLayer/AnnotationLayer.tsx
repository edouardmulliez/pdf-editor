import React, { useState, useCallback } from 'react';
import { useAnnotationStore } from '../../stores/useAnnotationStore';
import { useUIStore } from '../../stores/useUIStore';
import { pdfToCanvas, canvasToPDF } from '../../utils/coordinate-converter';
import { constrainToPageBounds } from '../../utils/bounds-checker';
import { calculateNewSize, maintainAspectRatio, type ResizeHandle as ResizeHandleType } from '../../utils/resize-logic';
import { ResizeHandle } from './ResizeHandle';
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

  // Drag state
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    annotationId: string;
    startMousePos: { x: number; y: number };
    startAnnotationPos: { x: number; y: number };
  } | null>(null);

  // Resize state
  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    handle: ResizeHandleType;
    annotationId: string;
    startMousePos: { x: number; y: number };
    startSize: { width: number; height: number };
    startPosition: { x: number; y: number };
    aspectRatio?: number;
  } | null>(null);

  const handleAnnotationClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent page click handler
    selectAnnotation(id);
  };

  const handleAnnotationDoubleClick = (e: React.MouseEvent, annotation: Annotation) => {
    e.stopPropagation();
    if (annotation.type === 'text') {
      setEditingAnnotationId(annotation.id);
    }
  };

  // Drag handlers
  const handleAnnotationMouseDown = useCallback((e: React.MouseEvent, annotation: Annotation) => {
    e.stopPropagation();
    selectAnnotation(annotation.id);

    setDragState({
      isDragging: true,
      annotationId: annotation.id,
      startMousePos: { x: e.clientX, y: e.clientY },
      startAnnotationPos: annotation.position,
    });
  }, [selectAnnotation]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Handle drag
    if (dragState?.isDragging) {
      const deltaX = e.clientX - dragState.startMousePos.x;
      const deltaY = e.clientY - dragState.startMousePos.y;

      // Convert delta to PDF units (divide by scale)
      const pdfDeltaX = deltaX / pageMetadata.scale;
      const pdfDeltaY = -deltaY / pageMetadata.scale; // Flip Y for PDF coords

      const annotation = annotations.find(a => a.id === dragState.annotationId);
      if (!annotation) return;

      const newPosition = {
        x: dragState.startAnnotationPos.x + pdfDeltaX,
        y: dragState.startAnnotationPos.y + pdfDeltaY,
      };

      // Apply bounds checking
      const constrainedPosition = constrainToPageBounds(
        newPosition,
        annotation.size,
        pageMetadata
      );

      updateAnnotation(dragState.annotationId, { position: constrainedPosition });
    }

    // Handle resize
    if (resizeState?.isResizing) {
      const deltaX = e.clientX - resizeState.startMousePos.x;
      const deltaY = e.clientY - resizeState.startMousePos.y;

      // Convert delta to PDF units
      const pdfDeltaX = deltaX / pageMetadata.scale;
      const pdfDeltaY = -deltaY / pageMetadata.scale; // Flip Y for PDF coords

      const annotation = annotations.find(a => a.id === resizeState.annotationId);
      if (!annotation) return;

      // Calculate new size and position
      const result = calculateNewSize(
        resizeState.handle,
        { x: pdfDeltaX, y: pdfDeltaY },
        resizeState.startSize,
        resizeState.startPosition
      );

      let finalSize = result.size;
      let finalPosition = result.position;

      // Maintain aspect ratio for images
      if (resizeState.aspectRatio) {
        finalSize = maintainAspectRatio(finalSize, resizeState.aspectRatio, resizeState.handle);
      }

      // Apply bounds checking
      finalPosition = constrainToPageBounds(finalPosition, finalSize, pageMetadata);

      updateAnnotation(resizeState.annotationId, {
        size: finalSize,
        position: finalPosition
      });
    }
  }, [dragState, resizeState, annotations, pageMetadata, updateAnnotation]);

  const handleMouseUp = useCallback(() => {
    setDragState(null);
    setResizeState(null);
  }, []);

  // Resize handle handlers
  const handleResizeMouseDown = useCallback((
    e: React.MouseEvent,
    annotation: Annotation,
    handle: ResizeHandleType
  ) => {
    e.stopPropagation(); // Don't trigger annotation drag

    const aspectRatio = annotation.type === 'image'
      ? annotation.size.width / annotation.size.height
      : undefined;

    setResizeState({
      isResizing: true,
      handle,
      annotationId: annotation.id,
      startMousePos: { x: e.clientX, y: e.clientY },
      startSize: annotation.size,
      startPosition: annotation.position,
      aspectRatio,
    });
  }, []);

  const renderAnnotation = (annotation: Annotation) => {
    const isSelected = annotation.id === selectedAnnotationId;
    const isEditing = editingAnnotationId === annotation.id;
    const isTextAnnotation = annotation.type === 'text';

    // Cursor styles
    const cursorStyle = isTextAnnotation && !isEditing ? 'cursor-text' : 'cursor-move';
    const baseClasses = `absolute ${cursorStyle} transition-all ${
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
            data-testid="annotation-text-input"
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
          data-testid={`text-annotation-${annotation.id}`}
          className={`${baseClasses} flex items-center`}
          style={style}
          onClick={(e) => handleAnnotationClick(e, annotation.id)}
          onDoubleClick={(e) => handleAnnotationDoubleClick(e, annotation)}
          onMouseDown={(e) => handleAnnotationMouseDown(e, annotation)}
        >
          <span
            style={{
              fontFamily: annotation.fontFamily,
              fontSize: `${annotation.fontSize * pageMetadata.scale}px`,
              color: annotation.fontColor,
              fontWeight,
              fontStyle,
              textDecoration,
              pointerEvents: 'none', // Let parent handle events
            }}
          >
            {annotation.content || 'Text'}
          </span>
          {isSelected && (
            <>
              <ResizeHandle position="tl" onMouseDown={(e, handle) => handleResizeMouseDown(e, annotation, handle)} />
              <ResizeHandle position="tr" onMouseDown={(e, handle) => handleResizeMouseDown(e, annotation, handle)} />
              <ResizeHandle position="bl" onMouseDown={(e, handle) => handleResizeMouseDown(e, annotation, handle)} />
              <ResizeHandle position="br" onMouseDown={(e, handle) => handleResizeMouseDown(e, annotation, handle)} />
            </>
          )}
        </div>
      );
    }

    if (annotation.type === 'image') {
      return (
        <div
          key={annotation.id}
          data-testid={`image-annotation-${annotation.id}`}
          className={baseClasses}
          style={style}
          onClick={(e) => handleAnnotationClick(e, annotation.id)}
          onMouseDown={(e) => handleAnnotationMouseDown(e, annotation)}
        >
          <img
            src={annotation.imageData}
            alt="annotation"
            className="w-full h-full object-contain"
            style={{ pointerEvents: 'none' }} // Let parent handle events
          />
          {isSelected && (
            <>
              <ResizeHandle position="tl" onMouseDown={(e, handle) => handleResizeMouseDown(e, annotation, handle)} />
              <ResizeHandle position="tr" onMouseDown={(e, handle) => handleResizeMouseDown(e, annotation, handle)} />
              <ResizeHandle position="bl" onMouseDown={(e, handle) => handleResizeMouseDown(e, annotation, handle)} />
              <ResizeHandle position="br" onMouseDown={(e, handle) => handleResizeMouseDown(e, annotation, handle)} />
            </>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="relative w-full h-full pointer-events-auto">
        {annotations.map(renderAnnotation)}
      </div>
    </div>
  );
};
