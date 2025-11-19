/**
 * Canvas Viewport
 *
 * 중앙 캔버스 영역
 * - 역할: 실제 디자인 작업이 이루어지는 무한 캔버스 공간
 * - 렌더링 엔진: Konva.js (Phase 1) -> Fabric.js (Phase 3 고려)
 * - 기능: 줌, 팬, 객체 선택/조작
 *
 * @author C팀 (Frontend Team)
 * @version 3.1
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import { useEditorStore } from '../stores';
import type { KonvaEventObject } from 'konva/lib/Node';
import { CanvasObjectRenderer } from '../canvas/CanvasObjectRenderer';

export function CanvasViewport() {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentMode = useEditorStore((state) => state.currentMode);
  const document = useEditorStore((state) => state.document);
  const selectedObjectIds = useEditorStore((state) => state.selectedObjectIds);
  const selectObjects = useEditorStore((state) => state.selectObjects);

  // 캔버스 크기 상태
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // 현재 페이지 (첫 번째 페이지 사용)
  const currentPage = document?.pages?.[0];

  // 리사이즈 핸들러
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
        // 초기 중앙 정렬 (임시)
        setPosition({
          x: containerRef.current.offsetWidth / 2 - 400,
          y: containerRef.current.offsetHeight / 2 - 300,
        });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // 휠 줌 핸들러
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // 줌 제한
    if (newScale < 0.1) newScale = 0.1;
    if (newScale > 5) newScale = 5;

    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // Stage 클릭 시 선택 해제
  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    // Stage 자체를 클릭한 경우에만 선택 해제
    if (e.target === e.target.getStage()) {
      selectObjects([]);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 relative bg-[#1e1e1e] overflow-hidden"
    >
      {/* Konva Stage */}
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onWheel={handleWheel}
        onClick={handleStageClick}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable
      >
        <Layer>
          {/* 배경 (임시 A4 사이즈) */}
          <Rect
            x={0}
            y={0}
            width={800}
            height={600}
            fill="white"
            shadowBlur={10}
            shadowOpacity={0.1}
          />

          {/* 객체 렌더링 */}
          {currentPage?.objects.map((obj) => (
            <CanvasObjectRenderer
              key={obj.id}
              object={obj}
              isSelected={selectedObjectIds.includes(obj.id)}
              onSelect={() => selectObjects([obj.id])}
            />
          ))}
        </Layer>
      </Stage>

      {/* 줌/팬 컨트롤 (우측 하단 플로팅) */}
      <div className="absolute bottom-4 right-4 flex gap-2 bg-neutral-800 p-1 rounded shadow-lg border border-neutral-700">
        <button
          className="w-8 h-8 flex items-center justify-center text-neutral-300 hover:bg-neutral-700 rounded"
          onClick={() => setScale(s => Math.max(0.1, s / 1.1))}
        >
          -
        </button>
        <span className="flex items-center justify-center w-12 text-xs text-neutral-300">
          {Math.round(scale * 100)}%
        </span>
        <button
          className="w-8 h-8 flex items-center justify-center text-neutral-300 hover:bg-neutral-700 rounded"
          onClick={() => setScale(s => Math.min(5, s * 1.1))}
        >
          +
        </button>
      </div>
    </div>
  );
}
