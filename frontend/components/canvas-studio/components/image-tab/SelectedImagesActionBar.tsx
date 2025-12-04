/**
 * Selected Images Action Bar
 *
 * 선택된 이미지들에 대한 일괄 작업 바
 * - 캔버스에 추가 (현재 페이지)
 * - 새 페이지로 추가
 * - 에셋으로 저장
 * - 선택 삭제
 * - 선택 해제
 *
 * @author C팀 (Frontend Team)
 * @version 1.1
 * @date 2025-12-03
 */

'use client';

import { PlusCircle, FilePlus, Download, Trash2, X, Loader2, Layers } from 'lucide-react';
import { useState } from 'react';

interface SelectedImagesActionBarProps {
  count: number;
  onAddToCanvas: () => Promise<void>;
  onAddToCanvasAsNewPages: () => Promise<void>;
  onAddToMixboard: () => void;
  onSaveAsAssets: () => Promise<string[]>;
  onDelete: () => void;
  onClearSelection: () => void;
}

export function SelectedImagesActionBar({
  count,
  onAddToCanvas,
  onAddToCanvasAsNewPages,
  onAddToMixboard,
  onSaveAsAssets,
  onDelete,
  onClearSelection,
}: SelectedImagesActionBarProps) {
  const [isAddingToCanvas, setIsAddingToCanvas] = useState(false);
  const [isAddingAsNewPages, setIsAddingAsNewPages] = useState(false);
  const [isSavingAssets, setIsSavingAssets] = useState(false);

  const handleAddToCanvas = async () => {
    setIsAddingToCanvas(true);
    try {
      await onAddToCanvas();
    } finally {
      setIsAddingToCanvas(false);
    }
  };

  const handleAddToCanvasAsNewPages = async () => {
    setIsAddingAsNewPages(true);
    try {
      await onAddToCanvasAsNewPages();
    } finally {
      setIsAddingAsNewPages(false);
    }
  };

  const handleSaveAsAssets = async () => {
    setIsSavingAssets(true);
    try {
      await onSaveAsAssets();
    } finally {
      setIsSavingAssets(false);
    }
  };

  return (
    <div className="border-t border-neutral-200 bg-green-50 p-3">
      <div className="flex items-center justify-between">
        {/* 선택 정보 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-green-700">
            {count}개 선택됨
          </span>
          <button
            onClick={onClearSelection}
            className="p-1 rounded hover:bg-green-100 transition-colors"
            title="선택 해제"
          >
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-2">
          {/* 캔버스에 추가 (현재 페이지) */}
          <button
            onClick={handleAddToCanvas}
            disabled={isAddingToCanvas}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="현재 페이지에 추가"
          >
            {isAddingToCanvas ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PlusCircle className="w-4 h-4" />
            )}
            <span>캔버스에 추가</span>
          </button>

          {/* 새 페이지로 추가 */}
          <button
            onClick={handleAddToCanvasAsNewPages}
            disabled={isAddingAsNewPages}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 text-white text-xs font-medium rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="새 페이지로 추가"
          >
            {isAddingAsNewPages ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FilePlus className="w-4 h-4" />
            )}
            <span>새 페이지</span>
          </button>

          {/* Mixboard에 추가 */}
          <button
            onClick={onAddToMixboard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors"
            title="Mixboard에 레퍼런스로 추가"
          >
            <Layers className="w-4 h-4" />
            <span>Mixboard</span>
          </button>

          {/* 에셋으로 저장 */}
          <button
            onClick={handleSaveAsAssets}
            disabled={isSavingAssets}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="에셋으로 저장"
          >
            {isSavingAssets ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>에셋 저장</span>
          </button>

          {/* 삭제 */}
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
            title="선택된 이미지 삭제"
          >
            <Trash2 className="w-4 h-4" />
            <span>삭제</span>
          </button>
        </div>
      </div>
    </div>
  );
}
