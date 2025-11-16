/**
 * useCanvasEngine Hook
 *
 * Fabric.js 캔버스를 초기화하고 관리하는 커스텀 Hook
 *
 * 주요 기능:
 * - Fabric.js Canvas 인스턴스 생성 및 초기화
 * - 캔버스 크기 설정 (800 × 600px)
 * - 줌/팬 이벤트 연동
 * - 그리드 표시/숨김
 * - 객체 추가/삭제/수정
 *
 * 사용법:
 * ```tsx
 * const { canvasRef, isReady } = useCanvasEngine();
 * ```
 *
 * @author C팀 (Frontend Team)
 * @version 3.0
 */

'use client';

import { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { useCanvasStore } from '../stores';

export interface UseCanvasEngineReturn {
  /** Canvas DOM 요소에 연결할 ref */
  canvasRef: React.RefObject<HTMLCanvasElement>;
  /** Fabric.js Canvas 인스턴스 (초기화 완료 후 사용 가능) */
  fabricCanvas: fabric.Canvas | null;
  /** 캔버스 초기화 완료 여부 */
  isReady: boolean;
  /** 도형 추가 함수 */
  addShape: (shapeType: 'rectangle' | 'circle' | 'triangle' | 'text') => void;
}

export function useCanvasEngine(): UseCanvasEngineReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Zustand Store에서 상태 가져오기
  const zoom = useCanvasStore((state) => state.zoom);
  const showGrid = useCanvasStore((state) => state.showGrid);
  const panX = useCanvasStore((state) => state.panX);
  const panY = useCanvasStore((state) => state.panY);

  // 5️⃣ 도형 추가 함수
  const addShape = (shapeType: 'rectangle' | 'circle' | 'triangle' | 'text') => {
    if (!fabricCanvas) return;

    let shape: fabric.Object;

    switch (shapeType) {
      case 'rectangle':
        // 사각형 생성
        shape = new fabric.Rect({
          left: 300,
          top: 200,
          width: 200,
          height: 150,
          fill: '#3b82f6', // blue-500
          stroke: '#1e40af', // blue-800
          strokeWidth: 2,
        });
        break;

      case 'circle':
        // 원 생성
        shape = new fabric.Circle({
          left: 300,
          top: 200,
          radius: 75,
          fill: '#10b981', // green-500
          stroke: '#047857', // green-800
          strokeWidth: 2,
        });
        break;

      case 'triangle':
        // 삼각형 생성
        shape = new fabric.Triangle({
          left: 300,
          top: 200,
          width: 200,
          height: 150,
          fill: '#f59e0b', // amber-500
          stroke: '#b45309', // amber-800
          strokeWidth: 2,
        });
        break;

      case 'text':
        // 텍스트 생성
        shape = new fabric.IText('Double click to edit', {
          left: 300,
          top: 200,
          fontSize: 24,
          fill: '#1f2937', // neutral-800
          fontFamily: 'Inter, sans-serif',
        });
        break;

      default:
        return;
    }

    // 캔버스에 도형 추가
    fabricCanvas.add(shape);
    fabricCanvas.setActiveObject(shape); // 추가한 도형 선택
    fabricCanvas.requestRenderAll();
  };

  // 1️⃣ Fabric.js Canvas 초기화
  useEffect(() => {
    if (!canvasRef.current) return;

    // Canvas 인스턴스 생성
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      selection: true, // 다중 선택 활성화
      preserveObjectStacking: true, // 객체 순서 유지
    });

    // Store에 Canvas 인스턴스 저장 (나중에 다른 곳에서 사용 가능)
    setFabricCanvas(canvas);
    setIsReady(true);

    // 클린업: 컴포넌트 언마운트 시 Canvas 제거
    return () => {
      canvas.dispose();
      setFabricCanvas(null);
      setIsReady(false);
    };
  }, []);

  // 2️⃣ Zoom 변경 시 Canvas 줌 레벨 업데이트
  useEffect(() => {
    if (!fabricCanvas) return;

    // Fabric.js 줌 레벨 설정 (중심점 기준)
    const center = fabricCanvas.getCenter();
    fabricCanvas.zoomToPoint(
      new fabric.Point(center.left, center.top),
      zoom
    );
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas, zoom]);

  // 3️⃣ Pan (이동) 변경 시 Canvas Viewport 업데이트
  useEffect(() => {
    if (!fabricCanvas || !fabricCanvas.viewportTransform) return;

    fabricCanvas.viewportTransform[4] = panX;
    fabricCanvas.viewportTransform[5] = panY;
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas, panX, panY]);

  // 4️⃣ Grid 표시/숨김
  useEffect(() => {
    if (!fabricCanvas) return;

    // 기존 그리드 제거
    const gridObjects = fabricCanvas.getObjects().filter((obj) => obj.name === 'grid-line');
    gridObjects.forEach((obj) => fabricCanvas.remove(obj));

    // Grid 표시
    if (showGrid) {
      const gridSize = 20; // 20px 간격
      const width = fabricCanvas.getWidth();
      const height = fabricCanvas.getHeight();

      // 세로선 그리기
      for (let i = 0; i <= width / gridSize; i++) {
        const line = new fabric.Line([i * gridSize, 0, i * gridSize, height], {
          stroke: '#e5e7eb', // neutral-200
          strokeWidth: 1,
          selectable: false,
          evented: false,
          name: 'grid-line',
        });
        fabricCanvas.add(line);
        fabricCanvas.sendToBack(line); // 그리드를 맨 뒤로
      }

      // 가로선 그리기
      for (let i = 0; i <= height / gridSize; i++) {
        const line = new fabric.Line([0, i * gridSize, width, i * gridSize], {
          stroke: '#e5e7eb', // neutral-200
          strokeWidth: 1,
          selectable: false,
          evented: false,
          name: 'grid-line',
        });
        fabricCanvas.add(line);
        fabricCanvas.sendToBack(line); // 그리드를 맨 뒤로
      }
    }

    fabricCanvas.requestRenderAll();
  }, [fabricCanvas, showGrid]);

  return {
    canvasRef,
    fabricCanvas,
    isReady,
    addShape,
  };
}
