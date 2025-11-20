/**
 * Resize Handle Component
 *
 * 패널 크기 조절을 위한 드래그 핸들 컴포넌트
 * VSCode 스타일의 리사이즈 기능 제공
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 */

'use client';

import { useRef, useEffect, useState } from 'react';

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  className?: string;
}

export function ResizeHandle({
  direction,
  onResize,
  onResizeStart,
  onResizeEnd,
  className = '',
}: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef(0);
  const accumulatedDeltaRef = useRef(0);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();

      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;

      // 최소 이동량 (3px) 이상일 때만 리사이즈
      if (Math.abs(delta - accumulatedDeltaRef.current) >= 3) {
        onResize(delta - accumulatedDeltaRef.current);
        accumulatedDeltaRef.current = delta;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      accumulatedDeltaRef.current = 0;
      onResizeEnd?.();
      document.body.style.cursor = '';

      // 선택 방지 해제
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, direction, onResize, onResizeEnd]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
    accumulatedDeltaRef.current = 0;
    onResizeStart?.();

    // 드래그 중 텍스트 선택 방지
    document.body.style.userSelect = 'none';
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
  };

  const baseClasses = direction === 'horizontal'
    ? 'w-1 h-full cursor-col-resize hover:bg-blue-500/20 active:bg-blue-500/30'
    : 'h-1 w-full cursor-row-resize hover:bg-blue-500/20 active:bg-blue-500/30';

  return (
    <div
      className={`${baseClasses} transition-colors group ${isDragging ? 'bg-blue-500/30' : ''} ${className}`}
      onMouseDown={handleMouseDown}
    >
      {/* 드래그 영역 확장을 위한 투명 영역 */}
      <div
        className={
          direction === 'horizontal'
            ? 'w-3 h-full -ml-1 group-hover:bg-blue-500/10'
            : 'h-3 w-full -mt-1 group-hover:bg-blue-500/10'
        }
      />
    </div>
  );
}