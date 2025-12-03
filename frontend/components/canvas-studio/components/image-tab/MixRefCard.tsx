/**
 * MixRef Card
 *
 * 개별 레퍼런스 이미지 카드
 * - 썸네일 표시
 * - Role/Tags 표시
 * - Weight 조절
 * - 삭제
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-03
 */

'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useImageTabStore } from '../../stores/useImageTabStore';
import type { MixRefImage } from '../../stores/types/imageTab';
import { MIX_ROLE_LABELS } from '../../stores/types/imageTab';

interface MixRefCardProps {
  mixRef: MixRefImage;
}

export function MixRefCard({ mixRef }: MixRefCardProps) {
  const updateMixRef = useImageTabStore((s) => s.updateMixRef);
  const removeMixRef = useImageTabStore((s) => s.removeMixRef);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-purple-200 overflow-hidden">
      {/* 메인 행 */}
      <div className="flex items-center gap-2 p-2">
        {/* 썸네일 */}
        <div className="w-12 h-12 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
          <img
            src={mixRef.thumbUrl || mixRef.url}
            alt="Reference"
            className="w-full h-full object-cover"
          />
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-xs font-medium text-purple-700">
              {MIX_ROLE_LABELS[mixRef.role]}
            </span>
            {mixRef.groupId && (
              <span className="px-1.5 py-0.5 bg-neutral-100 text-neutral-500 text-[10px] rounded">
                {mixRef.groupId}
              </span>
            )}
          </div>
          {mixRef.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {mixRef.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-1 py-0.5 bg-purple-100 text-purple-600 text-[10px] rounded"
                >
                  {tag}
                </span>
              ))}
              {mixRef.tags.length > 3 && (
                <span className="text-[10px] text-neutral-400">
                  +{mixRef.tags.length - 3}
                </span>
              )}
            </div>
          )}
          {mixRef.note && (
            <p className="text-[10px] text-neutral-500 truncate mt-0.5">
              {mixRef.note}
            </p>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-neutral-100 rounded"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-neutral-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            )}
          </button>
          <button
            onClick={() => removeMixRef(mixRef.id)}
            className="p-1 hover:bg-red-100 rounded"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* 확장 영역 */}
      {isExpanded && (
        <div className="border-t border-purple-100 p-2 space-y-2">
          {/* Weight 슬라이더 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-neutral-500">영향도</label>
              <span className="text-[10px] text-neutral-600">
                {(mixRef.weight * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={mixRef.weight * 100}
              onChange={(e) =>
                updateMixRef(mixRef.id, { weight: Number(e.target.value) / 100 })
              }
              className="w-full h-1.5 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* 전체 태그 표시 */}
          {mixRef.tags.length > 3 && (
            <div>
              <label className="text-[10px] text-neutral-500 block mb-1">전체 태그</label>
              <div className="flex flex-wrap gap-1">
                {mixRef.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
