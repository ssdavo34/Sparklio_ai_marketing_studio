/**
 * Template Card
 *
 * 템플릿 카드 컴포넌트
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 6.3
 */

'use client';

import { Eye, Copy, Star } from 'lucide-react';
import type { Template } from '@/types/asset';

// ============================================================================
// Types
// ============================================================================

export interface TemplateCardProps {
  /** 템플릿 데이터 */
  template: Template;

  /** 미리보기 핸들러 */
  onPreview?: (template: Template) => void;

  /** 사용 핸들러 (캔버스에 적용) */
  onUse?: (template: Template) => void;

  /** 클릭 핸들러 */
  onClick?: (template: Template) => void;

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

export function TemplateCard({
  template,
  onPreview,
  onUse,
  onClick,
  className = '',
  selectable = false,
  selected = false,
}: TemplateCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick(template);
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
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden group">
        <img
          src={template.thumbnailUrl}
          alt={template.name}
          className="w-full h-full object-cover"
        />

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
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          {onPreview && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview(template);
              }}
              className="px-4 py-2 bg-white rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4 text-gray-700" />
              <span className="text-sm font-medium text-gray-700">미리보기</span>
            </button>
          )}
          {onUse && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUse(template);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              <span className="text-sm font-medium">사용하기</span>
            </button>
          )}
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
            {getCategoryLabel(template.category)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
          {template.name}
        </h3>

        {/* Description */}
        {template.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">
            {template.description}
          </p>
        )}

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                +{template.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          {/* Size */}
          {template.size && (
            <span className="text-xs text-gray-500">
              {template.size.width} × {template.size.height}
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onUse && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUse(template);
                }}
                className="text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors"
              >
                사용하기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    sns_post: 'SNS 포스트',
    sns_story: 'SNS 스토리',
    banner_web: '웹 배너',
    banner_mobile: '모바일 배너',
    thumbnail: '썸네일',
    presentation: '프레젠테이션',
    product_detail: '상세 페이지',
    email: '이메일',
    other: '기타',
  };

  return labels[category] || category;
}
