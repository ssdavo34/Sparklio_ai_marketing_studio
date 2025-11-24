/**
 * Asset Card
 *
 * 에셋 카드 컴포넌트
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 6.2
 */

'use client';

import { Download, Trash2, Eye, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import type { Asset } from '@/types/asset';

// ============================================================================
// Types
// ============================================================================

export interface AssetCardProps {
  /** 에셋 데이터 */
  asset: Asset;

  /** 미리보기 핸들러 */
  onPreview?: (asset: Asset) => void;

  /** 다운로드 핸들러 */
  onDownload?: (asset: Asset) => void;

  /** 삭제 핸들러 */
  onDelete?: (asset: Asset) => void;

  /** 클릭 핸들러 (선택, 캔버스에 삽입 등) */
  onClick?: (asset: Asset) => void;

  /** 클래스명 (선택) */
  className?: string;

  /** 선택 모드 여부 */
  selectable?: boolean;

  /** 선택 여부 */
  selected?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function AssetCard({
  asset,
  onPreview,
  onDownload,
  onDelete,
  onClick,
  className = '',
  selectable = false,
  selected = false,
}: AssetCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleCardClick = () => {
    if (onClick) {
      onClick(asset);
    }
  };

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border-2 overflow-hidden
        ${selected ? 'border-purple-600' : 'border-gray-200'}
        ${onClick || selectable ? 'cursor-pointer hover:shadow-md' : ''}
        transition-all ${className}
      `}
      onClick={handleCardClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden group">
        {asset.thumbnailUrl ? (
          <img
            src={asset.thumbnailUrl}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <FileIcon type={asset.type} className="w-16 h-16" />
          </div>
        )}

        {/* Selection Indicator */}
        {selectable && selected && (
          <div className="absolute top-2 left-2">
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 12 12">
                <path
                  d="M10 3L4.5 8.5L2 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          {onPreview && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview(asset);
              }}
              className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
              title="미리보기"
            >
              <Eye className="w-4 h-4 text-gray-700" />
            </button>
          )}
          {onDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(asset);
              }}
              className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
              title="다운로드"
            >
              <Download className="w-4 h-4 text-gray-700" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{asset.name}</h3>
            <p className="text-xs text-gray-500">
              {(asset.fileSize / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  {onPreview && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreview(asset);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      미리보기
                    </button>
                  )}
                  {onDownload && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(asset);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      다운로드
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(asset);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        {asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {asset.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                +{asset.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {new Date(asset.createdAt).toLocaleDateString('ko-KR')}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Component
// ============================================================================

function FileIcon({ type, className }: { type: string; className?: string }) {
  // Simple file icon based on type
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  );
}
