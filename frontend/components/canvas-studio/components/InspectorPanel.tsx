/**
 * Inspector Panel
 *
 * 선택된 객체의 속성을 편집하는 패널
 * - 위치 (X, Y)
 * - 크기 (Width, Height)
 * - 회전 (Rotation)
 * - 색상 (Fill, Stroke)
 * - 투명도 (Opacity)
 *
 * @author C팀 (Frontend Team)
 * @version 3.0
 */

'use client';

import { useEffect, useState } from 'react';
import { useCanvas } from '../context';
import type { fabric } from 'fabric';

export function InspectorPanel() {
  const { fabricCanvas } = useCanvas();
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);

  // 속성 상태
  const [left, setLeft] = useState<number>(0);
  const [top, setTop] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [angle, setAngle] = useState<number>(0);
  const [fill, setFill] = useState<string>('#3b82f6');
  const [stroke, setStroke] = useState<string>('#1e40af');
  const [opacity, setOpacity] = useState<number>(1);

  // 선택 변경 감지
  useEffect(() => {
    if (!fabricCanvas) return;

    const updateSelection = () => {
      const active = fabricCanvas.getActiveObject();
      setSelectedObject(active || null);

      if (active) {
        // 속성 값 업데이트
        setLeft(Math.round(active.left || 0));
        setTop(Math.round(active.top || 0));
        setWidth(Math.round((active.width || 0) * (active.scaleX || 1)));
        setHeight(Math.round((active.height || 0) * (active.scaleY || 1)));
        setAngle(Math.round(active.angle || 0));
        setFill((active.fill as string) || '#3b82f6');
        setStroke((active.stroke as string) || '#1e40af');
        setOpacity(active.opacity || 1);
      }
    };

    updateSelection();

    fabricCanvas.on('selection:created', updateSelection);
    fabricCanvas.on('selection:updated', updateSelection);
    fabricCanvas.on('selection:cleared', updateSelection);
    fabricCanvas.on('object:modified', updateSelection);

    return () => {
      fabricCanvas.off('selection:created', updateSelection);
      fabricCanvas.off('selection:updated', updateSelection);
      fabricCanvas.off('selection:cleared', updateSelection);
      fabricCanvas.off('object:modified', updateSelection);
    };
  }, [fabricCanvas]);

  // 속성 변경 핸들러
  const handlePropertyChange = (property: string, value: number | string) => {
    if (!selectedObject || !fabricCanvas) return;

    switch (property) {
      case 'left':
        selectedObject.set({ left: Number(value) });
        setLeft(Number(value));
        break;
      case 'top':
        selectedObject.set({ top: Number(value) });
        setTop(Number(value));
        break;
      case 'width':
        const newScaleX = Number(value) / (selectedObject.width || 1);
        selectedObject.set({ scaleX: newScaleX });
        setWidth(Number(value));
        break;
      case 'height':
        const newScaleY = Number(value) / (selectedObject.height || 1);
        selectedObject.set({ scaleY: newScaleY });
        setHeight(Number(value));
        break;
      case 'angle':
        selectedObject.set({ angle: Number(value) });
        setAngle(Number(value));
        break;
      case 'fill':
        selectedObject.set({ fill: String(value) });
        setFill(String(value));
        break;
      case 'stroke':
        selectedObject.set({ stroke: String(value) });
        setStroke(String(value));
        break;
      case 'opacity':
        selectedObject.set({ opacity: Number(value) });
        setOpacity(Number(value));
        break;
    }

    selectedObject.setCoords();
    fabricCanvas.requestRenderAll();
  };

  // 선택된 객체가 없을 때
  if (!selectedObject) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
        <div className="mb-3 text-5xl">🔍</div>
        <p className="text-sm font-medium text-neutral-700">No selection</p>
        <p className="mt-2 text-xs text-neutral-500">
          Select an object to edit its properties
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-auto p-4">
      {/* 헤더 */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-neutral-900">Properties</h3>
        <p className="mt-1 text-xs text-neutral-500">
          {selectedObject.type === 'rect' && 'Rectangle'}
          {selectedObject.type === 'circle' && 'Circle'}
          {selectedObject.type === 'triangle' && 'Triangle'}
          {(selectedObject.type === 'i-text' || selectedObject.type === 'text') && 'Text'}
        </p>
      </div>

      {/* Position */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-neutral-700">Position</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-neutral-500">X</label>
            <input
              type="number"
              value={left}
              onChange={(e) => handlePropertyChange('left', e.target.value)}
              className="w-full rounded border border-neutral-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Y</label>
            <input
              type="number"
              value={top}
              onChange={(e) => handlePropertyChange('top', e.target.value)}
              className="w-full rounded border border-neutral-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Size */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-neutral-700">Size</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Width</label>
            <input
              type="number"
              value={width}
              onChange={(e) => handlePropertyChange('width', e.target.value)}
              className="w-full rounded border border-neutral-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Height</label>
            <input
              type="number"
              value={height}
              onChange={(e) => handlePropertyChange('height', e.target.value)}
              className="w-full rounded border border-neutral-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-neutral-700">Rotation</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="360"
            value={angle}
            onChange={(e) => handlePropertyChange('angle', e.target.value)}
            className="flex-1"
          />
          <input
            type="number"
            value={angle}
            onChange={(e) => handlePropertyChange('angle', e.target.value)}
            className="w-16 rounded border border-neutral-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
          <span className="text-xs text-neutral-500">°</span>
        </div>
      </div>

      {/* Colors - 텍스트가 아닐 때만 표시 */}
      {selectedObject.type !== 'i-text' && selectedObject.type !== 'text' && (
        <>
          {/* Fill Color */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-neutral-700">Fill Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fill}
                onChange={(e) => handlePropertyChange('fill', e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border border-neutral-300"
              />
              <input
                type="text"
                value={fill}
                onChange={(e) => handlePropertyChange('fill', e.target.value)}
                className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Stroke Color */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-neutral-700">Stroke Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={stroke}
                onChange={(e) => handlePropertyChange('stroke', e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border border-neutral-300"
              />
              <input
                type="text"
                value={stroke}
                onChange={(e) => handlePropertyChange('stroke', e.target.value)}
                className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </>
      )}

      {/* Opacity */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-neutral-700">Opacity</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={opacity}
            onChange={(e) => handlePropertyChange('opacity', e.target.value)}
            className="flex-1"
          />
          <span className="w-12 text-sm text-neutral-700">{Math.round(opacity * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
