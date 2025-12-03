/**
 * Selected Images Action Bar
 *
 * 선택된 이미지들에 대한 일괄 작업 바
 * - 캔버스에 추가
 * - 에셋으로 저장
 * - 선택 해제
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-03
 */

'use client';

import { PlusCircle, Download, X, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SelectedImagesActionBarProps {
  count: number;
  onAddToCanvas: () => Promise<void>;
  onSaveAsAssets: () => Promise<string[]>;
  onClearSelection: () => void;
}

export function SelectedImagesActionBar({
  count,
  onAddToCanvas,
  onSaveAsAssets,
  onClearSelection,
}: SelectedImagesActionBarProps) {
  const [isAddingToCanvas, setIsAddingToCanvas] = useState(false);
  const [isSavingAssets, setIsSavingAssets] = useState(false);

  const handleAddToCanvas = async () => {
    setIsAddingToCanvas(true);
    try {
      await onAddToCanvas();
    } finally {
      setIsAddingToCanvas(false);
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
          {/* 캔버스에 추가 */}
          <button
            onClick={handleAddToCanvas}
            disabled={isAddingToCanvas}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAddingToCanvas ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PlusCircle className="w-4 h-4" />
            )}
            <span>캔버스에 추가</span>
          </button>

          {/* 에셋으로 저장 */}
          <button
            onClick={handleSaveAsAssets}
            disabled={isSavingAssets}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSavingAssets ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>에셋 저장</span>
          </button>
        </div>
      </div>
    </div>
  );
}
