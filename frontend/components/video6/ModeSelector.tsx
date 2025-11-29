'use client';

import React from 'react';
import { VideoGenerationMode, VIDEO_MODE_OPTIONS } from '@/types/video-pipeline';

interface ModeSelectorProps {
  selectedMode?: VideoGenerationMode;
  onSelectMode: (mode: VideoGenerationMode) => void;
  disabled?: boolean;
  availableAssetCount?: number; // Asset Pool에 있는 이미지 수
}

export function ModeSelector({
  selectedMode,
  onSelectMode,
  disabled = false,
  availableAssetCount = 0,
}: ModeSelectorProps) {
  return (
    <div className="space-y-3">
      {/* 안내 메시지 */}
      <p className="text-sm text-gray-600 mb-4">
        영상 제작 방식을 선택해주세요.
        {availableAssetCount > 0 && (
          <span className="text-purple-600 ml-1">
            (사용 가능한 이미지: {availableAssetCount}장)
          </span>
        )}
      </p>

      {/* 모드 버튼들 */}
      <div className="grid grid-cols-1 gap-3">
        {VIDEO_MODE_OPTIONS.map((option) => {
          const isSelected = selectedMode === option.mode;
          const isReuseDisabled = option.mode === 'reuse' && availableAssetCount === 0;

          return (
            <button
              key={option.mode}
              onClick={() => onSelectMode(option.mode)}
              disabled={disabled || isReuseDisabled}
              className={`
                relative p-4 rounded-xl border-2 text-left transition-all
                ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25'
                }
                ${disabled || isReuseDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* 선택 표시 */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              {/* 헤더 */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{option.icon}</span>
                <span className="font-semibold text-gray-800">{option.label}</span>
              </div>

              {/* 설명 */}
              <p className="text-sm text-gray-600 mb-2">{option.description}</p>

              {/* 비용 표시 */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    option.mode === 'reuse'
                      ? 'bg-green-100 text-green-700'
                      : option.mode === 'hybrid'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {option.costLabel}
                </span>

                {/* REUSE 모드에서 이미지가 없으면 경고 */}
                {isReuseDisabled && (
                  <span className="text-xs text-red-500">이미지가 필요합니다</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ModeSelector;
