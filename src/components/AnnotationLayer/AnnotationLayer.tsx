import React from 'react';
import { useAnnotationStore } from '../../stores/useAnnotationStore';
import { usePDFStore } from '../../stores/usePDFStore';
import { Annotation } from '../../types';

export const AnnotationLayer: React.FC = () => {
  const { currentPage } = usePDFStore();
  const { getAnnotationsByPage, selectedAnnotationId, selectAnnotation } =
    useAnnotationStore();

  const annotations = getAnnotationsByPage(currentPage);

  const handleAnnotationClick = (id: string) => {
    selectAnnotation(id);
  };

  const renderAnnotation = (annotation: Annotation) => {
    const isSelected = annotation.id === selectedAnnotationId;
    const baseClasses = `absolute cursor-pointer transition-all ${
      isSelected ? 'ring-2 ring-primary-500' : ''
    }`;

    const style = {
      left: `${annotation.position.x}px`,
      top: `${annotation.position.y}px`,
      width: `${annotation.size.width}px`,
      height: `${annotation.size.height}px`,
    };

    if (annotation.type === 'text') {
      const fontWeight = annotation.fontStyles.includes('bold') ? 'bold' : 'normal';
      const fontStyle = annotation.fontStyles.includes('italic') ? 'italic' : 'normal';
      const textDecoration = annotation.fontStyles.includes('underline')
        ? 'underline'
        : 'none';

      return (
        <div
          key={annotation.id}
          className={`${baseClasses} flex items-center`}
          style={style}
          onClick={() => handleAnnotationClick(annotation.id)}
        >
          <span
            style={{
              fontFamily: annotation.fontFamily,
              fontSize: `${annotation.fontSize}px`,
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
          onClick={() => handleAnnotationClick(annotation.id)}
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
