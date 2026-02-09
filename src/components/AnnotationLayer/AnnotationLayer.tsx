import React, { useState, useCallback, useMemo } from 'react';
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
  // Subscribe to state changes
  const allAnnotations = useAnnotationStore((state) => state.annotations);
  const selectedAnnotationId = useAnnotationStore((state) => state.selectedAnnotationId);

  // Get stable action references (these don't change)
  const selectAnnotation = useAnnotationStore((state) => state.selectAnnotation);
  const updateAnnotation = useAnnotationStore((state) => state.updateAnnotation);
  const deleteAnnotation = useAnnotationStore((state) => state.deleteAnnotation);

  const { editingAnnotationId, setEditingAnnotationId } = useUIStore();

  // Filter annotations for this page
  const annotations = useMemo(
    () => allAnnotations.filter((ann) => ann.pageNumber === pageNumber),
    [allAnnotations, pageNumber]
  );

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
    e.preventDefault(); // Prevent text selection while dragging
    selectAnnotation(annotation.id);

    const newDragState = {
      isDragging: true,
      annotationId: annotation.id,
      startMousePos: { x: e.clientX, y: e.clientY },
      startAnnotationPos: annotation.position,
    };
    setDragState(newDragState);

    // Attach global listeners immediately
    const handleMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - newDragState.startMousePos.x;
      const deltaY = moveEvent.clientY - newDragState.startMousePos.y;

      // Convert delta to PDF units
      const pdfDeltaX = deltaX / pageMetadata.scale;
      const pdfDeltaY = -deltaY / pageMetadata.scale;

      const newPosition = {
        x: newDragState.startAnnotationPos.x + pdfDeltaX,
        y: newDragState.startAnnotationPos.y + pdfDeltaY,
      };

      // Apply bounds checking
      const constrainedPosition = constrainToPageBounds(
        newPosition,
        annotation.size,
        pageMetadata
      );

      updateAnnotation(newDragState.annotationId, { position: constrainedPosition });
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [selectAnnotation, pageMetadata, updateAnnotation]);

  // Resize handle handlers
  const handleResizeMouseDown = useCallback((
    e: React.MouseEvent,
    annotation: Annotation,
    handle: ResizeHandleType
  ) => {
    e.stopPropagation(); // Don't trigger annotation drag
    e.preventDefault(); // Prevent text selection

    const aspectRatio = annotation.type === 'image'
      ? annotation.size.width / annotation.size.height
      : undefined;

    const newResizeState = {
      isResizing: true,
      handle,
      annotationId: annotation.id,
      startMousePos: { x: e.clientX, y: e.clientY },
      startSize: annotation.size,
      startPosition: annotation.position,
      aspectRatio,
    };
    setResizeState(newResizeState);

    // Attach global listeners immediately
    const handleMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - newResizeState.startMousePos.x;
      const deltaY = moveEvent.clientY - newResizeState.startMousePos.y;

      // Convert delta to PDF units
      const pdfDeltaX = deltaX / pageMetadata.scale;
      const pdfDeltaY = -deltaY / pageMetadata.scale;

      // Calculate new size and position
      const result = calculateNewSize(
        newResizeState.handle,
        { x: pdfDeltaX, y: pdfDeltaY },
        newResizeState.startSize,
        newResizeState.startPosition
      );

      let finalSize = result.size;
      let finalPosition = result.position;

      // Maintain aspect ratio for images
      if (newResizeState.aspectRatio) {
        finalSize = maintainAspectRatio(finalSize, newResizeState.aspectRatio, newResizeState.handle);
      }

      // Apply bounds checking
      finalPosition = constrainToPageBounds(finalPosition, finalSize, pageMetadata);

      updateAnnotation(newResizeState.annotationId, {
        size: finalSize,
        position: finalPosition
      });
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      setResizeState(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [pageMetadata, updateAnnotation]);

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
    <div className="absolute inset-0 pointer-events-none">
      <div className="relative w-full h-full pointer-events-auto">
        {annotations.map(renderAnnotation)}
      </div>
    </div>
  );
};
