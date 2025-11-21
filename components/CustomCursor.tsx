import React from 'react';
import { Tool } from '../types';

interface CustomCursorProps {
  x: number;
  y: number;
  size: number;
  color: string;
  tool: Tool;
  isVisible: boolean;
  isPatternMode?: boolean;
}

const CustomCursor: React.FC<CustomCursorProps> = ({ x, y, size, color, tool, isVisible, isPatternMode = false }) => {
  if (!isVisible) return null;

  // Для режима узоров используем фиксированный маленький размер
  const cursorSize = isPatternMode ? 16 : Math.max(size, 8);
  const isEraser = tool === Tool.Eraser;

  return (
    <div
      className="custom-cursor"
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        width: `${cursorSize}px`,
        height: `${cursorSize}px`,
        pointerEvents: 'none',
        zIndex: 9999,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {isPatternMode ? (
        // Простой кружок для режима узоров
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              backgroundColor: color,
              border: '2px solid #fff',
              boxShadow: '0 0 0 1px #000',
            }}
          />
        </>
      ) : (
        // Полный курсор для кисти и ластика
        <>
          {/* Внешний круг - контур */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `2px solid ${isEraser ? '#000' : '#fff'}`,
              boxShadow: `0 0 0 1px ${isEraser ? '#fff' : '#000'}`,
            }}
          />
          
          {/* Внутренний круг - цвет кисти или паттерн ластика */}
          <div
            style={{
              position: 'absolute',
              inset: '4px',
              borderRadius: '50%',
              backgroundColor: isEraser ? 'transparent' : color,
              opacity: isEraser ? 1 : 0.7,
              backgroundImage: isEraser
                ? 'repeating-linear-gradient(45deg, #ccc 0, #ccc 2px, transparent 2px, transparent 4px)'
                : undefined,
            }}
          />
          
          {/* Крестик в центре для точности */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '1px',
              height: '8px',
              backgroundColor: isEraser ? '#000' : '#fff',
              boxShadow: `0 0 2px ${isEraser ? '#fff' : '#000'}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '8px',
              height: '1px',
              backgroundColor: isEraser ? '#000' : '#fff',
              boxShadow: `0 0 2px ${isEraser ? '#fff' : '#000'}`,
            }}
          />
        </>
      )}
    </div>
  );
};

export default CustomCursor;