import React from 'react';
import type { ResizeHandle as ResizeHandleType } from '../../utils/resize-logic';

interface ResizeHandleProps {
  position: ResizeHandleType;
  onMouseDown: (e: React.MouseEvent, position: ResizeHandleType) => void;
}

const cursorMap: Record<ResizeHandleType, string> = {
  tl: 'nw-resize',
  tr: 'ne-resize',
  bl: 'sw-resize',
  br: 'se-resize',
};

const positionMap: Record<ResizeHandleType, React.CSSProperties> = {
  tl: { top: '-4px', left: '-4px' },
  tr: { top: '-4px', right: '-4px' },
  bl: { bottom: '-4px', left: '-4px' },
  br: { bottom: '-4px', right: '-4px' },
};

export const ResizeHandle: React.FC<ResizeHandleProps> = React.memo(({ position, onMouseDown }) => {
  return (
    <div
      className="absolute w-2 h-2 bg-primary-500 border-2 border-white rounded-full hover:scale-150 transition-transform"
      style={{
        ...positionMap[position],
        cursor: cursorMap[position],
        zIndex: 10,
        pointerEvents: 'auto', // Override parent's pointer-events-none
      }}
      onMouseDown={(e) => onMouseDown(e, position)}
    />
  );
});

ResizeHandle.displayName = 'ResizeHandle';
