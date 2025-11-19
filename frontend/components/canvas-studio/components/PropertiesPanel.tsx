/**
 * Properties Panel
 *
 * 선택된 객체의 속성을 편집하는 패널
 * - 텍스트: 폰트, 크기, 색상, 정렬
 * - 도형: fill, stroke, cornerRadius
 *
 * @author C팀 (Frontend Team)
 * @version 3.1
 */

'use client';

import { useEditorStore } from '../stores';
import type { CanvasObject, TextObject, ShapeObject } from '../stores/types';

export function PropertiesPanel() {
  const document = useEditorStore((state) => state.document);
  const selectedObjectIds = useEditorStore((state) => state.selectedObjectIds);
  const updateObject = useEditorStore((state) => state.updateObject);

  // 선택된 객체 가져오기
  const selectedObjects: CanvasObject[] = [];
  if (document) {
    for (const page of document.pages) {
      for (const obj of page.objects) {
        if (selectedObjectIds.includes(obj.id)) {
          selectedObjects.push(obj);
        }
      }
    }
  }

  // 선택된 객체가 없으면 안내 메시지
  if (selectedObjects.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-neutral-500">
        <svg className="w-16 h-16 mb-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
        <p className="text-sm font-medium">선택된 객체가 없습니다</p>
        <p className="text-xs mt-1 text-neutral-600">캔버스에서 객체를 선택하세요</p>
      </div>
    );
  }

  // 여러 객체 선택 시
  if (selectedObjects.length > 1) {
    return (
      <div className="space-y-4">
        <div className="pb-3 border-b border-neutral-800">
          <h3 className="text-sm font-semibold text-white">다중 선택</h3>
          <p className="text-xs text-neutral-400 mt-1">{selectedObjects.length}개 객체 선택됨</p>
        </div>
        {/* TODO: 다중 선택 시 공통 속성 편집 (Phase 2.5) */}
        <div className="text-xs text-neutral-500">
          다중 선택 편집 기능은 곧 추가됩니다.
        </div>
      </div>
    );
  }

  // 단일 객체 선택
  const obj = selectedObjects[0];

  return (
    <div className="space-y-4">
      {/* 객체 정보 헤더 */}
      <div className="pb-3 border-b border-neutral-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            {obj.type === 'text' && '텍스트'}
            {obj.type === 'shape' && '도형'}
            {obj.type === 'image' && '이미지'}
          </h3>
          <span className="text-xs text-neutral-500">#{obj.id.slice(-6)}</span>
        </div>
      </div>

      {/* 공통 속성: 위치 및 크기 */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">위치 & 크기</h4>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">X</label>
            <input
              type="number"
              value={Math.round(obj.x)}
              onChange={(e) => updateObject(obj.id, { x: Number(e.target.value) })}
              className="w-full px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">Y</label>
            <input
              type="number"
              value={Math.round(obj.y)}
              onChange={(e) => updateObject(obj.id, { y: Number(e.target.value) })}
              className="w-full px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {obj.width !== undefined && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Width</label>
              <input
                type="number"
                value={Math.round(obj.width)}
                onChange={(e) => updateObject(obj.id, { width: Number(e.target.value) })}
                className="w-full px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            {obj.height !== undefined && (
              <div>
                <label className="text-xs text-neutral-400 mb-1 block">Height</label>
                <input
                  type="number"
                  value={Math.round(obj.height)}
                  onChange={(e) => updateObject(obj.id, { height: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>
        )}

        {obj.rotation !== undefined && (
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">Rotation (°)</label>
            <input
              type="number"
              value={Math.round(obj.rotation)}
              onChange={(e) => updateObject(obj.id, { rotation: Number(e.target.value) })}
              className="w-full px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* 텍스트 객체 속성 */}
      {obj.type === 'text' && <TextProperties object={obj} updateObject={updateObject} />}

      {/* 도형 객체 속성 */}
      {obj.type === 'shape' && <ShapeProperties object={obj} updateObject={updateObject} />}
    </div>
  );
}

/**
 * 텍스트 객체 속성 편집
 */
function TextProperties({ object, updateObject }: { object: TextObject; updateObject: (id: string, updates: Partial<CanvasObject>) => void }) {
  return (
    <div className="space-y-3 pt-3 border-t border-neutral-800">
      <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">텍스트</h4>

      {/* 텍스트 내용 */}
      <div>
        <label className="text-xs text-neutral-400 mb-1 block">Content</label>
        <textarea
          value={object.text}
          onChange={(e) => updateObject(object.id, { text: e.target.value })}
          rows={3}
          className="w-full px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* 폰트 패밀리 */}
      <div>
        <label className="text-xs text-neutral-400 mb-1 block">Font Family</label>
        <select
          value={object.fontFamily || 'Arial'}
          onChange={(e) => updateObject(object.id, { fontFamily: e.target.value })}
          className="w-full px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-blue-500"
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
        </select>
      </div>

      {/* 폰트 크기 & 굵기 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-neutral-400 mb-1 block">Font Size</label>
          <input
            type="number"
            value={object.fontSize || 16}
            onChange={(e) => updateObject(object.id, { fontSize: Number(e.target.value) })}
            min="8"
            max="144"
            className="w-full px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1 block">Font Weight</label>
          <select
            value={object.fontWeight || 'normal'}
            onChange={(e) => updateObject(object.id, { fontWeight: e.target.value })}
            className="w-full px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-blue-500"
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
            <option value="lighter">Light</option>
          </select>
        </div>
      </div>

      {/* 텍스트 색상 */}
      <div>
        <label className="text-xs text-neutral-400 mb-1 block">Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={object.fill || '#000000'}
            onChange={(e) => updateObject(object.id, { fill: e.target.value })}
            className="w-12 h-8 bg-neutral-800 border border-neutral-700 rounded cursor-pointer"
          />
          <input
            type="text"
            value={object.fill || '#000000'}
            onChange={(e) => updateObject(object.id, { fill: e.target.value })}
            className="flex-1 px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 정렬 */}
      <div>
        <label className="text-xs text-neutral-400 mb-1 block">Align</label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => updateObject(object.id, { align })}
              className={`flex-1 px-2 py-1.5 text-xs rounded ${
                object.align === align
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {align === 'left' && 'Left'}
              {align === 'center' && 'Center'}
              {align === 'right' && 'Right'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 도형 객체 속성 편집
 */
function ShapeProperties({ object, updateObject }: { object: ShapeObject; updateObject: (id: string, updates: Partial<CanvasObject>) => void }) {
  return (
    <div className="space-y-3 pt-3 border-t border-neutral-800">
      <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">스타일</h4>

      {/* Fill Color */}
      <div>
        <label className="text-xs text-neutral-400 mb-1 block">Fill Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={object.fill || '#3b82f6'}
            onChange={(e) => updateObject(object.id, { fill: e.target.value })}
            className="w-12 h-8 bg-neutral-800 border border-neutral-700 rounded cursor-pointer"
          />
          <input
            type="text"
            value={object.fill || '#3b82f6'}
            onChange={(e) => updateObject(object.id, { fill: e.target.value })}
            className="flex-1 px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Stroke Color */}
      <div>
        <label className="text-xs text-neutral-400 mb-1 block">Stroke Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={object.stroke || '#000000'}
            onChange={(e) => updateObject(object.id, { stroke: e.target.value })}
            className="w-12 h-8 bg-neutral-800 border border-neutral-700 rounded cursor-pointer"
          />
          <input
            type="text"
            value={object.stroke || '#000000'}
            onChange={(e) => updateObject(object.id, { stroke: e.target.value })}
            className="flex-1 px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Stroke Width */}
      <div>
        <label className="text-xs text-neutral-400 mb-1 block">Stroke Width</label>
        <input
          type="number"
          value={object.strokeWidth || 0}
          onChange={(e) => updateObject(object.id, { strokeWidth: Number(e.target.value) })}
          min="0"
          max="20"
          className="w-full px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Corner Radius (rect만) */}
      {object.shapeType === 'rect' && (
        <div>
          <label className="text-xs text-neutral-400 mb-1 block">Corner Radius</label>
          <input
            type="number"
            value={object.cornerRadius || 0}
            onChange={(e) => updateObject(object.id, { cornerRadius: Number(e.target.value) })}
            min="0"
            max="100"
            className="w-full px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Radius (circle만) */}
      {object.shapeType === 'circle' && (
        <div>
          <label className="text-xs text-neutral-400 mb-1 block">Radius</label>
          <input
            type="number"
            value={object.radius || 50}
            onChange={(e) => updateObject(object.id, { radius: Number(e.target.value) })}
            min="1"
            max="500"
            className="w-full px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      )}
    </div>
  );
}
