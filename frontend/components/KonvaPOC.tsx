'use client';

import { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Transformer } from 'react-konva';
import { useKonvaPocStore, Shape } from '@/store/konva-poc-store';
import Konva from 'konva';

// 개별 사각형 컴포넌트
function RectShape({ shape, isSelected, onSelect, onDragEnd }: {
  shape: Shape;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (e: any) => void;
}) {
  const shapeRef = useRef<Konva.Rect>(null);

  return (
    <Rect
      ref={shapeRef}
      x={shape.x}
      y={shape.y}
      width={shape.width || 100}
      height={shape.height || 100}
      fill={shape.fill}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      stroke={isSelected ? '#00aaff' : undefined}
      strokeWidth={isSelected ? 3 : 0}
    />
  );
}

// 개별 원 컴포넌트
function CircleShape({ shape, isSelected, onSelect, onDragEnd }: {
  shape: Shape;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (e: any) => void;
}) {
  return (
    <Circle
      x={shape.x}
      y={shape.y}
      radius={shape.radius || 50}
      fill={shape.fill}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      stroke={isSelected ? '#00aaff' : undefined}
      strokeWidth={isSelected ? 3 : 0}
    />
  );
}

// Transformer (선택된 도형 조작)
function TransformerComponent({ selectedId }: { selectedId: string | null }) {
  const transformerRef = useRef<Konva.Transformer>(null);
  const layerRef = useRef<Konva.Layer>(null);

  useEffect(() => {
    if (!selectedId || !transformerRef.current || !layerRef.current) {
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
      }
      return;
    }

    // 선택된 노드 찾기
    const stage = transformerRef.current.getStage();
    if (!stage) return;

    const selectedNode = stage.findOne(`#shape-${selectedId}`);
    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  return <Transformer ref={transformerRef} />;
}

// 메인 POC 컴포넌트
export default function KonvaPOC() {
  const { shapes, selectedId, setSelectedId, updateShape } = useKonvaPocStore();

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleDragEnd = (id: string, e: any) => {
    const node = e.target;
    updateShape(id, {
      x: node.x(),
      y: node.y(),
    });
  };

  const handleStageClick = (e: any) => {
    // Stage 클릭 시 선택 해제 (빈 곳 클릭)
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Konva + Zustand POC</h1>
        <p className="text-gray-600">
          ✅ 도형 3개 렌더링 | ✅ 클릭 선택 | ✅ 드래그 이동 | ✅ Zustand 상태 연동
        </p>
        <p className="text-sm text-gray-500 mt-2">
          선택된 ID: <span className="font-mono font-bold">{selectedId || 'None'}</span>
        </p>
      </div>

      <div className="border-4 border-gray-300 shadow-2xl bg-white">
        <Stage
          width={800}
          height={600}
          onClick={handleStageClick}
          onTap={handleStageClick}
        >
          <Layer>
            {shapes.map((shape) => {
              const isSelected = shape.id === selectedId;

              if (shape.type === 'rect') {
                return (
                  <RectShape
                    key={shape.id}
                    shape={shape}
                    isSelected={isSelected}
                    onSelect={() => handleSelect(shape.id)}
                    onDragEnd={(e) => handleDragEnd(shape.id, e)}
                  />
                );
              }

              if (shape.type === 'circle') {
                return (
                  <CircleShape
                    key={shape.id}
                    shape={shape}
                    isSelected={isSelected}
                    onSelect={() => handleSelect(shape.id)}
                    onDragEnd={(e) => handleDragEnd(shape.id, e)}
                  />
                );
              }

              return null;
            })}

            <TransformerComponent selectedId={selectedId} />
          </Layer>
        </Stage>
      </div>

      <div className="mt-6 p-4 bg-white rounded shadow max-w-2xl">
        <h3 className="font-bold mb-2">📊 현재 상태 (Zustand Store)</h3>
        <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-64">
          {JSON.stringify({ shapes, selectedId }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
