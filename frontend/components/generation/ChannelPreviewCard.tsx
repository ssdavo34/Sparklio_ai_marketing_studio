/**
 * Channel Preview Card
 *
 * 채널별 생성 결과 미리보기 카드
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 4.3
 */

'use client';

import { Edit, Download, Eye, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import type { ChannelType } from '@/types/brief';

// ============================================================================
// Types
// ============================================================================

export interface ChannelPreviewCardProps {
  /** 채널 타입 */
  channel: ChannelType;

  /** 미리보기 이미지 URL */
  thumbnailUrl: string;

  /** 제목 */
  title: string;

  /** 설명 (선택) */
  description?: string;

  /** 생성 일시 */
  createdAt: string;

  /** 편집 핸들러 */
  onEdit?: () => void;

  /** 미리보기 핸들러 */
  onPreview?: () => void;

  /** 다운로드 핸들러 */
  onDownload?: () => void;

  /** 클래스명 (선택) */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const CHANNEL_CONFIG: Record<ChannelType, { label: string; color: string }> = {
  product_detail: { label: '상세 페이지', color: 'bg-blue-100 text-blue-700' },
  sns: { label: 'SNS', color: 'bg-pink-100 text-pink-700' },
  banner: { label: '배너', color: 'bg-yellow-100 text-yellow-700' },
  deck: { label: '발표 자료', color: 'bg-green-100 text-green-700' },
  video: { label: '영상', color: 'bg-purple-100 text-purple-700' },
};

// ============================================================================
// Component
// ============================================================================

export function ChannelPreviewCard({
  channel,
  thumbnailUrl,
  title,
  description,
  createdAt,
  onEdit,
  onPreview,
  onDownload,
  className = '',
}: ChannelPreviewCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const config = CHANNEL_CONFIG[channel];

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${className}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden group">
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          {onPreview && (
            <button
              onClick={onPreview}
              className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
              title="미리보기"
            >
              <Eye className="w-5 h-5 text-gray-700" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
              title="편집"
            >
              <Edit className="w-5 h-5 text-gray-700" />
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
              title="다운로드"
            >
              <Download className="w-5 h-5 text-gray-700" />
            </button>
          )}
        </div>

        {/* Channel Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
            {description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{description}</p>
            )}
          </div>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />

                {/* Menu */}
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  {onPreview && (
                    <button
                      onClick={() => {
                        onPreview();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      미리보기
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      편집
                    </button>
                  )}
                  {onDownload && (
                    <button
                      onClick={() => {
                        onDownload();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      다운로드
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-xs text-gray-500">
            {new Date(createdAt).toLocaleDateString('ko-KR')}
          </span>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            {onPreview && (
              <button
                onClick={onPreview}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="미리보기"
              >
                <Eye className="w-4 h-4 text-gray-500" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="편집"
              >
                <Edit className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
