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
        pageMetadata,
        annotation.type,
        annotation.type === 'text' ? annotation.fontMetrics : undefined
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
      finalPosition = constrainToPageBounds(
        finalPosition,
        finalSize,
        pageMetadata,
        annotation.type,
        annotation.type === 'text' ? annotation.fontMetrics : undefined
      );

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

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Single SVG canvas for all text annotations */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      >
        {annotations.map((annotation) => {
          if (annotation.type !== 'text' || annotation.id === editingAnnotationId) {
            return null; // Skip images and text being edited
          }

          const canvasPos = pdfToCanvas(annotation.position, pageMetadata);
          const fontSize = annotation.fontSize * pageMetadata.scale;
          const fontWeight = annotation.fontStyles.includes('bold') ? 'bold' : 'normal';
          const fontStyle = annotation.fontStyles.includes('italic') ? 'italic' : 'normal';
          const textDecoration = annotation.fontStyles.includes('underline') ? 'underline' : 'none';

          return (
            <text
              key={annotation.id}
              data-testid={`text-annotation-${annotation.id}`}
              x={canvasPos.x}
              y={canvasPos.y}
              fontFamily={annotation.fontFamily}
              fontSize={fontSize}
              fill={annotation.fontColor}
              fontWeight={fontWeight}
              fontStyle={fontStyle}
              textDecoration={textDecoration}
              dominantBaseline="alphabetic"
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                selectAnnotation(annotation.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingAnnotationId(annotation.id);
              }}
              onMouseDown={(e) => handleAnnotationMouseDown(e as any, annotation)}
            >
              {annotation.content || 'Text'}
            </text>
          );
        })}
      </svg>

      {/* Selection indicators and resize handles (HTML overlays) */}
      {annotations.map((annotation) => {
        if (annotation.id !== selectedAnnotationId || annotation.id === editingAnnotationId) {
          return null;
        }

        const canvasPos = pdfToCanvas(annotation.position, pageMetadata);
        const canvasSize = {
          width: annotation.size.width * pageMetadata.scale,
          height: annotation.size.height * pageMetadata.scale,
        };

        // For text, calculate bounding box top-left (baseline - ascent)
        let boxTop = canvasPos.y;
        let boxLeft = canvasPos.x;
        if (annotation.type === 'text') {
          boxTop = canvasPos.y - (annotation.fontMetrics.ascent * pageMetadata.scale);
        }

        return (
          <div
            key={`selection-${annotation.id}`}
            className="absolute pointer-events-none ring-2 ring-primary-500"
            style={{
              left: `${boxLeft}px`,
              top: `${boxTop}px`,
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`,
            }}
          >
            <ResizeHandle position="tl" onMouseDown={(e, handle) => handleResizeMouseDown(e, annotation, handle)} />
            <ResizeHandle position="tr" onMouseDown={(e, handle) => handleResizeMouseDown(e, annotation, handle)} />
            <ResizeHandle position="bl" onMouseDown={(e, handle) => handleResizeMouseDown(e, annotation, handle)} />
            <ResizeHandle position="br" onMouseDown={(e, handle) => handleResizeMouseDown(e, annotation, handle)} />
          </div>
        );
      })}

      {/* Image annotations (keep as <img> elements) */}
      {annotations.map((annotation) => {
        if (annotation.type !== 'image') return null;

        const isSelected = annotation.id === selectedAnnotationId;
        const canvasPos = pdfToCanvas(annotation.position, pageMetadata);
        const canvasSize = {
          width: annotation.size.width * pageMetadata.scale,
          height: annotation.size.height * pageMetadata.scale,
        };

        return (
          <div
            key={annotation.id}
            data-testid={`image-annotation-${annotation.id}`}
            className={`absolute cursor-move transition-all ${
              isSelected ? 'ring-2 ring-primary-500' : ''
            }`}
            style={{
              left: `${canvasPos.x}px`,
              top: `${canvasPos.y}px`,
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`,
              pointerEvents: 'auto',
            }}
            onClick={(e) => handleAnnotationClick(e, annotation.id)}
            onMouseDown={(e) => handleAnnotationMouseDown(e, annotation)}
          >
            <img
              src={annotation.imageData}
              alt="annotation"
              className="w-full h-full object-contain"
              style={{ pointerEvents: 'none' }}
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
      })}

      {/* Edit input overlay (for text being edited) */}
      {editingAnnotationId && (() => {
        const annotation = annotations.find(a => a.id === editingAnnotationId);
        if (!annotation || annotation.type !== 'text') return null;

        // Position.y is baseline, calculate top for input (baseline - ascent)
        const canvasBaselinePos = pdfToCanvas(annotation.position, pageMetadata);
        const inputTopPos = {
          x: canvasBaselinePos.x,
          y: canvasBaselinePos.y - (annotation.fontMetrics.ascent * pageMetadata.scale)
        };

        const canvasSize = {
          width: annotation.size.width * pageMetadata.scale,
          height: annotation.size.height * pageMetadata.scale,
        };

        const fontWeight = annotation.fontStyles.includes('bold') ? 'bold' : 'normal';
        const fontStyle = annotation.fontStyles.includes('italic') ? 'italic' : 'normal';
        const textDecoration = annotation.fontStyles.includes('underline') ? 'underline' : 'none';

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
              left: `${inputTopPos.x}px`,
              top: `${inputTopPos.y}px`,
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
              pointerEvents: 'auto',
            }}
          />
        );
      })()}
    </div>
  );
};
