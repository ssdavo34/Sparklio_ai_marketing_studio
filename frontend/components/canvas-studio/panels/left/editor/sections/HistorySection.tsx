/**
 * History Section
 *
 * Undo/Redo 컨트롤 섹션
 *
 * @author C Team (Frontend Team)
 * @version 1.0
 */

'use client';

import { ChevronDown, ChevronRight, Undo2, Redo2, History } from 'lucide-react';

interface HistorySectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function HistorySection({ isExpanded, onToggle, onUndo, onRedo, canUndo, canRedo }: HistorySectionProps) {
  return (
    <div className="border-b border-gray-200">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-sm font-medium text-gray-800">실행 취소</span>
        </div>
        <History className="w-4 h-4 text-gray-400" />
      </button>

      {/* Section Content */}
      {isExpanded && (
        <div className="px-3 pb-3">
          <div className="flex gap-2">
            {/* Undo Button */}
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all
                ${canUndo
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'}
              `}
              title="실행 취소 (Ctrl+Z)"
            >
              <Undo2 className="w-5 h-5" />
              <span className="text-sm font-medium">실행 취소</span>
            </button>

            {/* Redo Button */}
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all
                ${canRedo
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'}
              `}
              title="다시 실행 (Ctrl+Y)"
            >
              <Redo2 className="w-5 h-5" />
              <span className="text-sm font-medium">다시 실행</span>
            </button>
          </div>

          {/* Keyboard Shortcuts Info */}
          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">키보드 단축키</p>
            <div className="flex justify-between text-xs text-gray-400">
              <span>실행 취소: <kbd className="px-1 py-0.5 bg-white rounded border border-gray-200 text-gray-600">Ctrl+Z</kbd></span>
              <span>다시 실행: <kbd className="px-1 py-0.5 bg-white rounded border border-gray-200 text-gray-600">Ctrl+Y</kbd></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistorySection;
