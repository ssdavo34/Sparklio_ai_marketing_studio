'use client';

import { useEditorStore } from '@/store/editor-store';

/**
 * Inspector 컴포넌트
 *
 * 우측 패널의 속성 편집 UI를 담당합니다.
 * - 선택된 오브젝트의 속성 표시
 * - 폰트, 색상, 크기 등 편집
 */
export default function Inspector() {
  const { selectedObjectId, currentDocument } = useEditorStore();

  // 선택된 오브젝트 찾기
  const selectedObject = currentDocument?.pages[0]?.objects.find(
    (obj) => obj.id === selectedObjectId
  );

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Inspector</h2>
        <p className="text-xs text-gray-500">선택된 오브젝트 속성</p>
      </div>

      {/* 속성 패널 */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedObject ? (
          // 오브젝트가 선택된 경우
          <div className="space-y-4">
            {/* 오브젝트 정보 */}
            <div className="pb-4 border-b border-gray-200">
              <p className="text-xs text-gray-500 mb-1">타입</p>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {selectedObject.type}
              </p>
              {selectedObject.role && (
                <>
                  <p className="text-xs text-gray-500 mt-2 mb-1">역할</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedObject.role}
                  </p>
                </>
              )}
            </div>

            {/* 텍스트 속성 (type === 'text'인 경우) */}
            {selectedObject.type === 'text' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    텍스트 내용
                  </label>
                  <textarea
                    value={selectedObject.props.text || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    폰트 크기
                  </label>
                  <input
                    type="number"
                    value={selectedObject.props.fontSize || 16}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    색상
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selectedObject.props.fill || '#000000'}
                      readOnly
                      className="w-12 h-10 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={selectedObject.props.fill || '#000000'}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    폰트 굵기
                  </label>
                  <select
                    value={selectedObject.props.fontWeight || 400}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="400">Regular</option>
                    <option value="500">Medium</option>
                    <option value="600">Semibold</option>
                    <option value="700">Bold</option>
                  </select>
                </div>
              </>
            )}

            {/* 이미지 속성 (type === 'image'인 경우) */}
            {selectedObject.type === 'image' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    이미지 URL
                  </label>
                  <input
                    type="text"
                    value={selectedObject.props.src || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Fit
                  </label>
                  <select
                    value={selectedObject.props.fit || 'cover'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="cover">Cover</option>
                    <option value="contain">Contain</option>
                    <option value="fill">Fill</option>
                  </select>
                </div>
              </>
            )}

            {/* 위치 및 크기 (공통) */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">위치 및 크기</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">X</label>
                  <input
                    type="number"
                    value={selectedObject.bounds.x}
                    readOnly
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Y</label>
                  <input
                    type="number"
                    value={selectedObject.bounds.y}
                    readOnly
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Width</label>
                  <input
                    type="number"
                    value={selectedObject.bounds.width}
                    readOnly
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Height</label>
                  <input
                    type="number"
                    value={selectedObject.bounds.height}
                    readOnly
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // 오브젝트가 선택되지 않은 경우
          <div className="text-center text-gray-400 mt-8">
            <div className="text-4xl mb-2">🔧</div>
            <p className="text-sm">오브젝트를 선택하세요</p>
            <p className="text-xs mt-2">
              텍스트, 이미지, 도형 등의 속성을 편집할 수 있습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
