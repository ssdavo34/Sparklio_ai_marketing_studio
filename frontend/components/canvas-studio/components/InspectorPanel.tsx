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

  // 객체 속성 상태
  const [left, setLeft] = useState<number>(0);
  const [top, setTop] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [scale, setScale] = useState<number>(100); // Scale percentage (50% ~ 200%)
  const [angle, setAngle] = useState<number>(0);
  const [fill, setFill] = useState<string>('#3b82f6');
  const [stroke, setStroke] = useState<string>('#1e40af');
  const [opacity, setOpacity] = useState<number>(1);

  // 텍스트 전용 속성 상태
  const [fontFamily, setFontFamily] = useState<string>('Arial');
  const [fontSize, setFontSize] = useState<number>(24);
  const [fontColor, setFontColor] = useState<string>('#000000');
  const [fontWeight, setFontWeight] = useState<string>('normal'); // 'normal' | 'bold'
  const [fontStyle, setFontStyle] = useState<string>('normal'); // 'normal' | 'italic'
  const [underline, setUnderline] = useState<boolean>(false);
  const [textBackgroundColor, setTextBackgroundColor] = useState<string>(''); // 텍스트 자체 배경
  const [textBoxBackgroundColor, setTextBoxBackgroundColor] = useState<string>(''); // 텍스트 박스 배경

  // 캔버스 크기 상태
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);

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
        // Scale percentage (scaleX와 scaleY의 평균)
        const avgScale = ((active.scaleX || 1) + (active.scaleY || 1)) / 2;
        setScale(Math.round(avgScale * 100));
        setAngle(Math.round(active.angle || 0));
        setFill((active.fill as string) || '#3b82f6');
        setStroke((active.stroke as string) || '#1e40af');
        setOpacity(active.opacity || 1);

        // 텍스트 객체인 경우 텍스트 전용 속성도 업데이트
        if (active.type === 'i-text' || active.type === 'text') {
          const textObj = active as any; // fabric.IText or fabric.Text
          setFontFamily(textObj.fontFamily || 'Arial');
          setFontSize(textObj.fontSize || 24);
          setFontColor(textObj.fill || '#000000');
          setFontWeight(textObj.fontWeight || 'normal');
          setFontStyle(textObj.fontStyle || 'normal');
          setUnderline(textObj.underline || false);
          setTextBackgroundColor(textObj.textBackgroundColor || '');
          setTextBoxBackgroundColor(textObj.backgroundColor || '');
        }
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
  const handlePropertyChange = (property: string, value: number | string | boolean) => {
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
      case 'scale':
        // Scale: 비율 유지하며 크기 조절 (50% ~ 200%)
        const scaleValue = Number(value) / 100;
        selectedObject.set({ scaleX: scaleValue, scaleY: scaleValue });
        setScale(Number(value));
        // Width/Height도 업데이트
        setWidth(Math.round((selectedObject.width || 0) * scaleValue));
        setHeight(Math.round((selectedObject.height || 0) * scaleValue));
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
      // 텍스트 전용 속성
      case 'fontFamily':
        selectedObject.set({ fontFamily: String(value) } as any);
        setFontFamily(String(value));
        break;
      case 'fontSize':
        selectedObject.set({ fontSize: Number(value) } as any);
        setFontSize(Number(value));
        break;
      case 'fontColor':
        selectedObject.set({ fill: String(value) } as any);
        setFontColor(String(value));
        setFill(String(value)); // fill도 업데이트
        break;
      case 'fontWeight':
        selectedObject.set({ fontWeight: String(value) } as any);
        setFontWeight(String(value));
        break;
      case 'fontStyle':
        selectedObject.set({ fontStyle: String(value) } as any);
        setFontStyle(String(value));
        break;
      case 'underline':
        selectedObject.set({ underline: Boolean(value) } as any);
        setUnderline(Boolean(value));
        break;
      case 'textBackgroundColor':
        selectedObject.set({ textBackgroundColor: String(value) } as any);
        setTextBackgroundColor(String(value));
        break;
      case 'textBoxBackgroundColor':
        selectedObject.set({ backgroundColor: String(value) } as any);
        setTextBoxBackgroundColor(String(value));
        break;
    }

    selectedObject.setCoords();
    fabricCanvas.requestRenderAll();
  };

  // 캔버스 크기 초기화
  useEffect(() => {
    if (fabricCanvas) {
      setCanvasWidth(fabricCanvas.getWidth());
      setCanvasHeight(fabricCanvas.getHeight());
    }
  }, [fabricCanvas]);

  // 캔버스 크기 변경 핸들러
  const handleCanvasSizeChange = (dimension: 'width' | 'height', value: number) => {
    if (!fabricCanvas) return;

    if (dimension === 'width') {
      fabricCanvas.setWidth(value);
      setCanvasWidth(value);
    } else {
      fabricCanvas.setHeight(value);
      setCanvasHeight(value);
    }
    fabricCanvas.requestRenderAll();
  };

  // 선택된 객체가 없을 때 → 캔버스 속성 표시
  if (!selectedObject) {

    return (
      <div className="flex h-full flex-col overflow-auto p-4">
        {/* 헤더 */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-neutral-900">Canvas Settings</h3>
          <p className="mt-1 text-xs text-neutral-500">
            Configure canvas properties
          </p>
        </div>

        {/* Canvas Size */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-neutral-700">Canvas Size</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-neutral-500">Width</label>
              <input
                type="number"
                value={canvasWidth}
                onChange={(e) => handleCanvasSizeChange('width', Number(e.target.value))}
                className="w-full rounded border border-neutral-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                min="400"
                max="3000"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-500">Height</label>
              <input
                type="number"
                value={canvasHeight}
                onChange={(e) => handleCanvasSizeChange('height', Number(e.target.value))}
                className="w-full rounded border border-neutral-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                min="400"
                max="3000"
              />
            </div>
          </div>
        </div>

        {/* Common Presets */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-neutral-700">Presets</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                handleCanvasSizeChange('width', 1080);
                handleCanvasSizeChange('height', 1080);
              }}
              className="rounded border border-neutral-300 px-3 py-2 text-xs hover:bg-neutral-50"
            >
              Instagram<br/>1080×1080
            </button>
            <button
              onClick={() => {
                handleCanvasSizeChange('width', 1920);
                handleCanvasSizeChange('height', 1080);
              }}
              className="rounded border border-neutral-300 px-3 py-2 text-xs hover:bg-neutral-50"
            >
              YouTube<br/>1920×1080
            </button>
            <button
              onClick={() => {
                handleCanvasSizeChange('width', 1200);
                handleCanvasSizeChange('height', 630);
              }}
              className="rounded border border-neutral-300 px-3 py-2 text-xs hover:bg-neutral-50"
            >
              Facebook<br/>1200×630
            </button>
            <button
              onClick={() => {
                handleCanvasSizeChange('width', 800);
                handleCanvasSizeChange('height', 600);
              }}
              className="rounded border border-neutral-300 px-3 py-2 text-xs hover:bg-neutral-50"
            >
              Default<br/>800×600
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-blue-800">
            💡 <strong>Tip:</strong> Select an object to edit its properties
          </p>
        </div>
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

      {/* Scale (비율 유지 크기 조절) - 텍스트가 아닐 때만 표시 */}
      {selectedObject.type !== 'i-text' && selectedObject.type !== 'text' && (
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-neutral-700">Scale</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="10"
              max="300"
              value={scale}
              onChange={(e) => handlePropertyChange('scale', e.target.value)}
              className="flex-1"
            />
            <input
              type="number"
              value={scale}
              onChange={(e) => handlePropertyChange('scale', e.target.value)}
              className="w-16 rounded border border-neutral-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
              min="10"
              max="300"
            />
            <span className="text-xs text-neutral-500">%</span>
          </div>
        </div>
      )}

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

      {/* 텍스트 전용 속성 - 텍스트일 때만 표시 */}
      {(selectedObject.type === 'i-text' || selectedObject.type === 'text') && (
        <>
          {/* Font Family */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-neutral-700">Font Family</label>
            <select
              value={fontFamily}
              onChange={(e) => handlePropertyChange('fontFamily', e.target.value)}
              className="w-full rounded border border-neutral-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
              <option value="Impact">Impact</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-neutral-700">Font Size</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="8"
                max="120"
                value={fontSize}
                onChange={(e) => handlePropertyChange('fontSize', e.target.value)}
                className="flex-1"
              />
              <input
                type="number"
                value={fontSize}
                onChange={(e) => handlePropertyChange('fontSize', e.target.value)}
                className="w-16 rounded border border-neutral-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                min="8"
                max="120"
              />
              <span className="text-xs text-neutral-500">px</span>
            </div>
          </div>

          {/* Font Color */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-neutral-700">Font Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fontColor}
                onChange={(e) => handlePropertyChange('fontColor', e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border border-neutral-300"
              />
              <input
                type="text"
                value={fontColor}
                onChange={(e) => handlePropertyChange('fontColor', e.target.value)}
                className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Text Style - Bold, Italic, Underline */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-neutral-700">Text Style</label>
            <div className="flex items-center gap-2">
              {/* Bold */}
              <button
                onClick={() => handlePropertyChange('fontWeight', fontWeight === 'bold' ? 'normal' : 'bold')}
                className={`flex-1 rounded border px-3 py-2 text-sm font-bold transition-colors ${
                  fontWeight === 'bold'
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
                title="Bold"
              >
                B
              </button>

              {/* Italic */}
              <button
                onClick={() => handlePropertyChange('fontStyle', fontStyle === 'italic' ? 'normal' : 'italic')}
                className={`flex-1 rounded border px-3 py-2 text-sm italic transition-colors ${
                  fontStyle === 'italic'
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
                title="Italic"
              >
                I
              </button>

              {/* Underline */}
              <button
                onClick={() => handlePropertyChange('underline', !underline)}
                className={`flex-1 rounded border px-3 py-2 text-sm underline transition-colors ${
                  underline
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
                title="Underline"
              >
                U
              </button>
            </div>
          </div>

          {/* Text Background Color */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-neutral-700">Text Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textBackgroundColor || '#ffffff'}
                onChange={(e) => handlePropertyChange('textBackgroundColor', e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border border-neutral-300"
              />
              <input
                type="text"
                value={textBackgroundColor}
                onChange={(e) => handlePropertyChange('textBackgroundColor', e.target.value)}
                className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="transparent"
              />
              {textBackgroundColor && (
                <button
                  onClick={() => handlePropertyChange('textBackgroundColor', '')}
                  className="rounded bg-neutral-200 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-300"
                  title="Clear background"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Text Box Background Color */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-neutral-700">Text Box Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textBoxBackgroundColor || '#ffffff'}
                onChange={(e) => handlePropertyChange('textBoxBackgroundColor', e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border border-neutral-300"
              />
              <input
                type="text"
                value={textBoxBackgroundColor}
                onChange={(e) => handlePropertyChange('textBoxBackgroundColor', e.target.value)}
                className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="transparent"
              />
              {textBoxBackgroundColor && (
                <button
                  onClick={() => handlePropertyChange('textBoxBackgroundColor', '')}
                  className="rounded bg-neutral-200 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-300"
                  title="Clear background"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Stroke for text */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-neutral-700">Text Outline</label>
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
                placeholder="transparent"
              />
            </div>
          </div>
        </>
      )}

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
