/**
 * Layers Panel
 *
 * 캔버스의 모든 객체를 목록으로 표시
 * - Fabric.js Canvas 인스턴스에서 객체 목록 가져오기
 * - 객체 선택/삭제/순서 변경 기능
 *
 * @author C팀 (Frontend Team)
 * @version 3.0
 */

'use client';

import { useEffect, useState } from 'react';
import { useCanvas } from '../context';
import type * as fabric from 'fabric';

export function LayersPanel() {
  const { fabricCanvas } = useCanvas();
  const [objects, setObjects] = useState<fabric.Object[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // updateObjects 함수 먼저 정의
  const updateObjects = () => {
    if (!fabricCanvas) return;
    const allObjects = fabricCanvas.getObjects().filter(
      (obj) => obj.name !== 'grid-line'
    );
    // 순서를 반대로 (가장 위 레이어가 먼저 표시되도록)
    const reversedObjects = [...allObjects].reverse();
    console.log('Layers updated:', reversedObjects.length);
    setObjects(reversedObjects);
  };

  // Canvas 객체 목록 업데이트
  useEffect(() => {
    if (!fabricCanvas) return;

    // 초기 로드
    updateObjects();

    // Canvas 이벤트 리스너
    fabricCanvas.on('object:added', updateObjects);
    fabricCanvas.on('object:removed', updateObjects);
    fabricCanvas.on('object:modified', updateObjects);
    fabricCanvas.on('selection:created', updateObjects);
    fabricCanvas.on('selection:updated', updateObjects);
    fabricCanvas.on('selection:cleared', updateObjects);

    // 클린업
    return () => {
      fabricCanvas.off('object:added', updateObjects);
      fabricCanvas.off('object:removed', updateObjects);
      fabricCanvas.off('object:modified', updateObjects);
      fabricCanvas.off('selection:created', updateObjects);
      fabricCanvas.off('selection:updated', updateObjects);
      fabricCanvas.off('selection:cleared', updateObjects);
    };
  }, [fabricCanvas]);

  // 객체 타입에 따른 아이콘 반환
  const getObjectIcon = (obj: fabric.Object) => {
    if (obj.type === 'rect') return '▭';
    if (obj.type === 'circle') return '●';
    if (obj.type === 'triangle') return '▲';
    if (obj.type === 'i-text' || obj.type === 'text') return 'T';
    return '◆';
  };

  // 객체 타입에 따른 이름 반환
  const getObjectName = (obj: fabric.Object, index: number) => {
    // 커스텀 이름이 있으면 사용
    // Fabric.js 6.x: data 속성 대신 커스텀 속성 직접 사용
    const customName = (obj as any).customName;
    if (customName && typeof customName === 'string') {
      return customName;
    }

    // 역순 배열이므로 실제 순서는 (총 개수 - 현재 인덱스)
    const actualIndex = objects.length - index;
    if (obj.type === 'rect') return `Rectangle ${actualIndex}`;
    if (obj.type === 'circle') return `Circle ${actualIndex}`;
    if (obj.type === 'triangle') return `Triangle ${actualIndex}`;
    if (obj.type === 'i-text' || obj.type === 'text') {
      const text = (obj as any).text;
      if (text && text.length > 20) {
        return `${text.substring(0, 20)}...`;
      }
      return text || `Text ${actualIndex}`;
    }
    return `Object ${actualIndex}`;
  };

  // 더블클릭 핸들러 - 이름 편집 모드 진입
  const handleDoubleClick = (obj: fabric.Object, index: number) => {
    setEditingIndex(index);
    setEditingName(getObjectName(obj, index));
  };

  // 이름 변경 저장
  const saveRename = (obj: fabric.Object, index: number) => {
    if (!fabricCanvas || editingName.trim() === '') {
      setEditingIndex(null);
      return;
    }

    // Fabric.js 6.x: 커스텀 속성 직접 설정
    obj.set('customName' as any, editingName.trim());
    fabricCanvas.requestRenderAll();

    setEditingIndex(null);
    setEditingName('');
    updateObjects();
    console.log('Layer renamed to:', editingName.trim());
  };

  // 이름 변경 취소
  const cancelRename = () => {
    setEditingIndex(null);
    setEditingName('');
  };

  // Enter/Escape 키 핸들러
  const handleKeyDown = (e: React.KeyboardEvent, obj: fabric.Object, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveRename(obj, index);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRename();
    }
  };

  // 객체 선택
  const selectObject = (obj: fabric.Object) => {
    if (!fabricCanvas) return;
    console.log('Selecting object:', obj.type);
    fabricCanvas.setActiveObject(obj);
    fabricCanvas.requestRenderAll();
  };

  // 객체 삭제
  const deleteObject = (obj: fabric.Object, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fabricCanvas) return;
    console.log('Deleting object:', obj.type);
    fabricCanvas.remove(obj);
    fabricCanvas.requestRenderAll();
  };

  // 레이어 순서 변경 (위로)
  const moveUp = (obj: fabric.Object, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fabricCanvas) return;
    console.log('Moving up:', obj.type);
    fabricCanvas.bringForward(obj);
    fabricCanvas.requestRenderAll();
    updateObjects();
  };

  // 레이어 순서 변경 (아래로)
  const moveDown = (obj: fabric.Object, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fabricCanvas) return;
    console.log('Moving down:', obj.type);
    fabricCanvas.sendBackwards(obj);
    fabricCanvas.requestRenderAll();
    updateObjects();
  };

  // 드래그 시작
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // Firefox 호환성
  };

  // 드래그 오버
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  // 드래그 종료 (다른 항목 위에서)
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!fabricCanvas || draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // 역순 배열이므로 실제 인덱스 계산
    const allObjects = fabricCanvas.getObjects().filter((obj) => obj.name !== 'grid-line');
    const draggedActualIndex = allObjects.length - 1 - draggedIndex;
    const dropActualIndex = allObjects.length - 1 - dropIndex;

    const draggedObj = allObjects[draggedActualIndex];

    console.log('Reordering layers:', draggedIndex, '->', dropIndex);

    // 객체를 새 위치로 이동
    fabricCanvas.remove(draggedObj);

    // 올바른 인덱스에 다시 삽입
    // Fabric.js 6.x: insertAt(index, ...objects) 시그니처로 변경됨
    if (dropActualIndex > draggedActualIndex) {
      fabricCanvas.insertAt(dropActualIndex, draggedObj);
    } else {
      fabricCanvas.insertAt(dropActualIndex, draggedObj);
    }

    fabricCanvas.requestRenderAll();
    updateObjects();

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 빈 상태
  if (objects.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
        <div className="mb-3 text-4xl text-neutral-300">📋</div>
        <p className="text-sm font-medium text-neutral-600">No layers yet</p>
        <p className="mt-2 text-xs text-neutral-400">
          Add shapes to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="border-b border-neutral-200 px-3 py-2">
        <p className="text-xs font-medium text-neutral-600">
          {objects.length} {objects.length === 1 ? 'Layer' : 'Layers'}
        </p>
      </div>

      {/* 레이어 목록 */}
      <div className="flex-1 overflow-auto">
        {objects.map((obj, index) => {
          const isSelected = fabricCanvas?.getActiveObject() === obj;
          const isEditing = editingIndex === index;
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;

          return (
            <div
              key={index}
              draggable={!isEditing}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                group flex w-full items-center gap-2 border-b border-neutral-100 px-3 py-2
                cursor-pointer transition-colors duration-150
                ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }
                ${isDragging ? 'opacity-50' : ''}
                ${isDragOver && !isDragging ? 'border-t-2 border-t-blue-500' : ''}
              `}
              onClick={() => !isEditing && selectObject(obj)}
              onDoubleClick={() => handleDoubleClick(obj, index)}
            >
              {/* 아이콘 */}
              <span className="text-lg">{getObjectIcon(obj)}</span>

              {/* 이름 (편집 모드일 때는 input, 아닐 때는 span) */}
              {isEditing ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => saveRename(obj, index)}
                  onKeyDown={(e) => handleKeyDown(e, obj, index)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 rounded border border-blue-300 px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <span className="flex-1 truncate text-sm font-medium">
                  {getObjectName(obj, index)}
                </span>
              )}

              {/* 컨트롤 버튼 그룹 (편집 모드일 때는 숨김) */}
              {!isEditing && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* 위로 이동 */}
                <div
                  onClick={(e) => moveUp(obj, e)}
                  className="rounded p-1 hover:bg-neutral-200 cursor-pointer"
                  title="Move Up"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </div>

                {/* 아래로 이동 */}
                <div
                  onClick={(e) => moveDown(obj, e)}
                  className="rounded p-1 hover:bg-neutral-200 cursor-pointer"
                  title="Move Down"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* 삭제 버튼 */}
                <div
                  onClick={(e) => deleteObject(obj, e)}
                  className="rounded p-1 hover:bg-red-100 hover:text-red-600 cursor-pointer"
                  title="Delete"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
              </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
