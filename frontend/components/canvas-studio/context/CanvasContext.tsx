/**
 * Canvas Context
 *
 * Fabric.js Canvas 인스턴스와 관련 함수를 전역으로 공유
 *
 * 사용 목적:
 * - TopToolbar에서 도형 추가 버튼 클릭 시 Canvas에 도형 추가
 * - 여러 컴포넌트에서 Canvas 인스턴스 접근 필요
 * - Props drilling 방지
 *
 * 규칙:
 * - useCanvasEngine은 StudioLayout에서만 호출
 * - CanvasViewport는 canvasRef만 props로 받음 (hook 사용 금지)
 * - 다른 컴포넌트는 useCanvas()로 접근
 *
 * @author C팀 (Frontend Team)
 * @version 3.0
 */

'use client';

import React, { createContext, useContext, type ReactNode } from 'react';
import type { fabric } from 'fabric';

interface CanvasContextValue {
  /** Fabric.js Canvas 인스턴스 */
  fabricCanvas: fabric.Canvas | null;
  /** 캔버스 초기화 완료 여부 */
  isReady: boolean;
  /** Canvas DOM ref */
  canvasRef: React.RefObject<HTMLCanvasElement>;
  /** 도형 추가 함수 */
  addShape: (shapeType: 'rectangle' | 'circle' | 'triangle' | 'text') => void;
  /** Copy 함수 */
  copySelected: () => void;
  /** Paste 함수 */
  pasteSelected: () => void;
  /** 복제 함수 */
  duplicateSelected: () => void;
  /** 삭제 함수 */
  deleteSelected: () => void;
  /** 그룹 함수 */
  groupSelected: () => void;
  /** 언그룹 함수 */
  ungroupSelected: () => void;
  /** Undo 함수 */
  undo: () => void;
  /** Redo 함수 */
  redo: () => void;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

export interface CanvasProviderProps {
  children: ReactNode;
  value: CanvasContextValue;
}

export function CanvasProvider({ children, value }: CanvasProviderProps) {
  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
}

/**
 * Canvas Context Hook
 *
 * TopToolbar, Inspector 등에서 Canvas 인스턴스에 접근할 때 사용
 *
 * @example
 * ```tsx
 * function TopToolbar() {
 *   const { addShape } = useCanvas();
 *   return <button onClick={() => addShape('rectangle')}>Add Rect</button>;
 * }
 * ```
 */
export function useCanvas() {
  const context = useContext(CanvasContext);

  if (!context) {
    throw new Error('useCanvas must be used within CanvasProvider');
  }

  return context;
}
