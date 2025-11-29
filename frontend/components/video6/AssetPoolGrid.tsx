'use client';

import React, { useState, useMemo } from 'react';
import { Check, Image as ImageIcon } from 'lucide-react';
import type { AssetPoolItem } from '@/types/video-pipeline';
import { getAssetPoolThumbUrl } from '@/types/video-pipeline';

interface AssetPoolGridProps {
  assets: AssetPoolItem[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onDeselect: (id: string) => void;
  maxSelection?: number;
  disabled?: boolean;
}

/**
 * Asset Pool Grid
 *
 * 비디오 생성에 사용할 이미지를 선택하는 그리드
 * REUSE/HYBRID 모드에서 사용
 */
export function AssetPoolGrid({
  assets,
  selectedIds,
  onSelect,
  onDeselect,
  maxSelection,
  disabled = false,
}: AssetPoolGridProps) {
  const [filter, setFilter] = useState<string>('all');

  // 소스별로 그룹화
  const groupedAssets = useMemo(() => {
    const groups: Record<string, AssetPoolItem[]> = { all: assets };

    assets.forEach((asset) => {
      if (!groups[asset.source]) {
        groups[asset.source] = [];
      }
      groups[asset.source].push(asset);
    });

    return groups;
  }, [assets]);

  const sourceLabels: Record<string, string> = {
    all: '전체',
    presentation: '프레젠테이션',
    sns: 'SNS',
    detail: '상세페이지',
    generated: 'AI 생성',
  };

  const filteredAssets = filter === 'all' ? assets : groupedAssets[filter] || [];
  const isMaxReached = maxSelection !== undefined && selectedIds.length >= maxSelection;

  const handleClick = (asset: AssetPoolItem) => {
    if (disabled) return;

    const isSelected = selectedIds.includes(asset.id);

    if (isSelected) {
      onDeselect(asset.id);
    } else if (!isMaxReached) {
      onSelect(asset.id);
    }
  };

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">사용 가능한 이미지가 없습니다</p>
        <p className="text-xs mt-1">먼저 프레젠테이션이나 SNS 콘텐츠를 생성해주세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 필터 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Object.keys(groupedAssets).map((source) => {
          const count = groupedAssets[source].length;
          const label = sourceLabels[source] || source;

          return (
            <button
              key={source}
              onClick={() => setFilter(source)}
              className={`
                flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                ${filter === source
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* 선택 상태 */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {selectedIds.length}개 선택됨
          {maxSelection && <span className="text-gray-400"> / 최대 {maxSelection}개</span>}
        </span>
        {selectedIds.length > 0 && (
          <button
            onClick={() => selectedIds.forEach(onDeselect)}
            className="text-purple-600 hover:text-purple-700 text-xs"
          >
            선택 해제
          </button>
        )}
      </div>

      {/* 그리드 */}
      <div className="grid grid-cols-3 gap-2">
        {filteredAssets.map((asset) => {
          const isSelected = selectedIds.includes(asset.id);
          const selectionIndex = selectedIds.indexOf(asset.id);

          return (
            <button
              key={asset.id}
              onClick={() => handleClick(asset)}
              disabled={disabled || (!isSelected && isMaxReached)}
              className={`
                relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                ${isSelected
                  ? 'border-purple-500 ring-2 ring-purple-200'
                  : 'border-transparent hover:border-purple-300'
                }
                ${disabled || (!isSelected && isMaxReached)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer'
                }
              `}
            >
              {/* 이미지 - 3종 URL 헬퍼 사용 */}
              <img
                src={getAssetPoolThumbUrl(asset)}
                alt={`Asset ${asset.id}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* 선택 오버레이 */}
              {isSelected && (
                <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {selectionIndex + 1}
                  </div>
                </div>
              )}

              {/* 소스 뱃지 */}
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 rounded text-[10px] text-white">
                {sourceLabels[asset.source] || asset.source}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default AssetPoolGrid;
