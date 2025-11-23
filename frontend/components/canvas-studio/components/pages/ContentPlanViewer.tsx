/**
 * Content Plan Viewer Component
 *
 * ContentPlanPagesSchema를 받아 여러 페이지를 렌더링
 * - 페이지 네비게이션
 * - 편집 모드
 * - Polotno 적용
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 * @reference docs/CONTENT_PLAN_TO_PAGES_SPEC_V2.md
 */

'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Edit, Eye, Download, Share2 } from 'lucide-react';
import type { ContentPlanPagesSchema, Page } from '../../types/content-plan';
import { PageRenderer } from './PageRenderer';
import { LAYOUT_CONFIGS } from '../../types/content-plan';

// ============================================================================
// Props
// ============================================================================

export interface ContentPlanViewerProps {
  /** Content Plan Pages 데이터 */
  contentPlan: ContentPlanPagesSchema;

  /** 편집 가능 여부 */
  editable?: boolean;

  /** 변경 콜백 */
  onChange?: (contentPlan: ContentPlanPagesSchema) => void;

  /** Polotno 적용 콜백 */
  onApplyToPolotno?: (contentPlan: ContentPlanPagesSchema) => void;

  /** 다운로드 콜백 */
  onDownload?: (contentPlan: ContentPlanPagesSchema) => void;

  /** 공유 콜백 */
  onShare?: (contentPlan: ContentPlanPagesSchema) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function ContentPlanViewer({
  contentPlan,
  editable = false,
  onChange,
  onApplyToPolotno,
  onDownload,
  onShare,
}: ContentPlanViewerProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContentPlan, setEditedContentPlan] = useState(contentPlan);

  const currentPage = editedContentPlan.pages[currentPageIndex];
  const totalPages = editedContentPlan.pages.length;

  // Navigation
  const goToNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const goToPage = (index: number) => {
    if (index >= 0 && index < totalPages) {
      setCurrentPageIndex(index);
    }
  };

  // Editing
  const handlePageChange = (updatedPage: Page) => {
    const updatedPages = editedContentPlan.pages.map((p, i) =>
      i === currentPageIndex ? updatedPage : p
    );
    setEditedContentPlan({ ...editedContentPlan, pages: updatedPages });
  };

  const handleSaveEdit = () => {
    onChange?.(editedContentPlan);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContentPlan(contentPlan);
    setIsEditing(false);
  };

  // Keyboard Navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevPage();
      if (e.key === 'ArrowRight') goToNextPage();
      if (e.key === 'Escape') setIsEditing(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, totalPages]);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Title */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {editedContentPlan.campaign_info.title}
            </h2>
            {editedContentPlan.campaign_info.campaign_type && (
              <p className="text-sm text-gray-500">
                {editedContentPlan.campaign_info.campaign_type}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Edit Toggle */}
            {editable && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`p-2 rounded-md transition-colors ${
                  isEditing
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                title={isEditing ? '미리보기 모드' : '편집 모드'}
              >
                {isEditing ? <Eye className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
              </button>
            )}

            {/* Apply to Polotno */}
            {onApplyToPolotno && (
              <button
                onClick={() => onApplyToPolotno(editedContentPlan)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
              >
                Canvas 적용
              </button>
            )}

            {/* Download */}
            {onDownload && (
              <button
                onClick={() => onDownload(editedContentPlan)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                title="다운로드"
              >
                <Download className="w-5 h-5" />
              </button>
            )}

            {/* Share */}
            {onShare && (
              <button
                onClick={() => onShare(editedContentPlan)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                title="공유"
              >
                <Share2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Page Indicator */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {LAYOUT_CONFIGS[currentPage.layout].icon}{' '}
              {LAYOUT_CONFIGS[currentPage.layout].title}
            </span>
            <span className="text-xs text-gray-400">
              ({currentPageIndex + 1} / {totalPages})
            </span>
          </div>

          {/* Dot Navigation */}
          <div className="flex items-center gap-2">
            {editedContentPlan.pages.map((page, index) => (
              <button
                key={page.page_id}
                onClick={() => goToPage(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentPageIndex
                    ? 'w-8 bg-purple-600'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                title={LAYOUT_CONFIGS[page.layout].title}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <PageRenderer
          page={currentPage}
          editable={isEditing}
          onChange={handlePageChange}
        />
      </div>

      {/* Footer Navigation */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Previous Button */}
          <button
            onClick={goToPrevPage}
            disabled={currentPageIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </button>

          {/* Page Count */}
          <div className="text-sm text-gray-600">
            페이지 {currentPageIndex + 1} / {totalPages}
          </div>

          {/* Next Button */}
          <button
            onClick={goToNextPage}
            disabled={currentPageIndex === totalPages - 1}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            다음
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Edit Actions */}
        {isEditing && (
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleCancelEdit}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSaveEdit}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
            >
              저장
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Helper: 프로그레스 바
// ============================================================================

export function PageProgressBar({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const progress = ((currentPage + 1) / totalPages) * 100;

  return (
    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-purple-600 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
