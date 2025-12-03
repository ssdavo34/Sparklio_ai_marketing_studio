/**
 * Image Card
 *
 * 생성된 이미지 카드 컴포넌트
 * - 선택 상태 표시
 * - 에셋 저장 상태 표시
 * - 캔버스 추가 상태 표시
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-03
 */

'use client';

import { Check, Download, PlusCircle, Loader2 } from 'lucide-react';
import type { GeneratedImage } from '../../stores/types/imageTab';

interface ImageCardProps {
  image: GeneratedImage;
  isSelected: boolean;
  isSaving: boolean;
  onToggleSelect: () => void;
  onAddToCanvas: () => void;
  onSaveAsAsset: () => void;
}

export function ImageCard({
  image,
  isSelected,
  isSaving,
  onToggleSelect,
  onAddToCanvas,
  onSaveAsAsset,
}: ImageCardProps) {
  return (
    <div
      className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-green-500 ring-2 ring-green-200'
          : 'border-transparent hover:border-neutral-300'
      }`}
      onClick={onToggleSelect}
    >
      {/* 이미지 */}
      <div className="aspect-square bg-neutral-100">
        <img
          src={image.thumbUrl || image.url}
          alt={image.prompt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* 선택 체크마크 */}
      {isSelected && (
        <div className="absolute top-2 left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* 상태 배지들 */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        {image.savedAsAsset && (
          <div className="px-2 py-0.5 bg-blue-500 text-white text-[10px] rounded-full">
            저장됨
          </div>
        )}
        {image.addedToCanvas && (
          <div className="px-2 py-0.5 bg-purple-500 text-white text-[10px] rounded-full">
            캔버스
          </div>
        )}
      </div>

      {/* 호버 시 액션 버튼 */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {/* 캔버스에 추가 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCanvas();
          }}
          disabled={image.addedToCanvas}
          className={`p-2 rounded-full transition-colors ${
            image.addedToCanvas
              ? 'bg-neutral-400 cursor-not-allowed'
              : 'bg-white hover:bg-green-100'
          }`}
          title={image.addedToCanvas ? '이미 추가됨' : '캔버스에 추가'}
        >
          <PlusCircle className={`w-5 h-5 ${image.addedToCanvas ? 'text-neutral-500' : 'text-green-600'}`} />
        </button>

        {/* 에셋으로 저장 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSaveAsAsset();
          }}
          disabled={image.savedAsAsset || isSaving}
          className={`p-2 rounded-full transition-colors ${
            image.savedAsAsset || isSaving
              ? 'bg-neutral-400 cursor-not-allowed'
              : 'bg-white hover:bg-blue-100'
          }`}
          title={image.savedAsAsset ? '이미 저장됨' : '에셋으로 저장'}
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
          ) : (
            <Download className={`w-5 h-5 ${image.savedAsAsset ? 'text-neutral-500' : 'text-blue-600'}`} />
          )}
        </button>
      </div>

      {/* 하단 정보 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <p className="text-[10px] text-white/80 truncate">
          {image.provider} • {image.width}x{image.height}
        </p>
      </div>
    </div>
  );
}
