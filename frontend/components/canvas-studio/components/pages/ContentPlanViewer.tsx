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
import { ChevronLeft, ChevronRight, Edit, Eye, Download, Share2, Target, FileText } from 'lucide-react';
import type { ContentPlanPagesSchema, Page } from '../../types/content-plan';
import type { CampaignStrategyOutputV1 } from '../../types/strategist';
import { PageRenderer } from './PageRenderer';
import { LAYOUT_CONFIGS } from '../../types/content-plan';
import { useCanvasStore } from '../../stores/useCanvasStore';
import { applyContentPlanToPolotno } from '../../adapters/content-plan-to-polotno';
import { FeedbackCollector, type FeedbackData } from '../FeedbackCollector';
import { submitFeedback } from '@/lib/api/feedback-api';
import { StrategistStrategyView } from '../StrategistStrategyView';

// ============================================================================
// Props
// ============================================================================

export interface ContentPlanViewerProps {
  /** Content Plan Pages 데이터 */
  contentPlan: ContentPlanPagesSchema;

  /** Campaign Strategy (선택적) */
  campaignStrategy?: CampaignStrategyOutputV1;

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

  /** 피드백 표시 여부 */
  showFeedback?: boolean;

  /** Content Plan ID (피드백 대상 식별용) */
  planId?: string;

  /** 전략 기반 액션 핸들러 (선택적) */
  onStrategyAction?: (action: string, data?: any) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function ContentPlanViewer({
  contentPlan,
  campaignStrategy,
  editable = false,
  onChange,
  onApplyToPolotno,
  onDownload,
  onShare,
  showFeedback = true,
  planId,
  onStrategyAction,
}: ContentPlanViewerProps) {
  const [currentTab, setCurrentTab] = useState<'pages' | 'strategy'>('pages');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContentPlan, setEditedContentPlan] = useState(contentPlan);
  const [isApplying, setIsApplying] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const polotnoStore = useCanvasStore((state) => state.polotnoStore);

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

  // Apply to Polotno
  const handleApplyToPolotno = async () => {
    if (onApplyToPolotno) {
      // 커스텀 콜백이 제공된 경우 사용
      onApplyToPolotno(editedContentPlan);
      return;
    }

    // 기본 동작: Polotno Store에 직접 적용
    if (!polotnoStore) {
      console.error('[ContentPlanViewer] Polotno Store가 초기화되지 않았습니다.');
      alert('캔버스가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsApplying(true);
    try {
      await applyContentPlanToPolotno(polotnoStore, editedContentPlan, {
        pageWidth: 1200,
        pageHeight: 1600,
        fontFamily: 'Noto Sans KR',
      });
      console.log('[ContentPlanViewer] ✅ Polotno 적용 완료');
      alert('캔버스에 적용되었습니다! 좌측 Canvas Studio 탭을 확인해주세요.');
    } catch (error) {
      console.error('[ContentPlanViewer] Polotno 적용 실패:', error);
      alert('캔버스 적용에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsApplying(false);
    }
  };

  // Feedback
  const handleFeedbackSubmit = async (feedback: FeedbackData) => {
    try {
      await submitFeedback(feedback);
      setShowFeedbackForm(false);
    } catch (error) {
      console.error('[ContentPlanViewer] 피드백 제출 실패:', error);
      throw error;
    }
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
            <button
              onClick={handleApplyToPolotno}
              disabled={isApplying}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApplying ? '적용 중...' : 'Canvas 적용'}
            </button>

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

        {/* Tabs (전략 요약 탭 추가) */}
        {campaignStrategy && (
          <div className="mt-4 flex items-center gap-4 border-b border-gray-200 -mb-px">
            <button
              onClick={() => setCurrentTab('pages')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                currentTab === 'pages'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>콘텐츠 플랜</span>
              </div>
            </button>
            <button
              onClick={() => setCurrentTab('strategy')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                currentTab === 'strategy'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>전략 요약</span>
              </div>
            </button>
          </div>
        )}

        {/* Page Indicator (페이지 탭에서만 표시) */}
        {currentTab === 'pages' && (
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
        )}
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {currentTab === 'pages' ? (
          <PageRenderer
            page={currentPage}
            editable={isEditing}
            onChange={handlePageChange}
          />
        ) : (
          /* 전략 요약 탭 */
          campaignStrategy && (
            <div className="max-w-6xl mx-auto">
              <StrategistStrategyView
                strategy={campaignStrategy}
                editable={false}
                onAction={onStrategyAction}
              />
            </div>
          )
        )}
      </div>

      {/* Footer Navigation (페이지 탭에서만 표시) */}
      {currentTab === 'pages' && (
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

        {/* Feedback Button */}
        {showFeedback && !isEditing && (
          <div className="mt-4 flex items-center justify-center">
            <button
              onClick={() => setShowFeedbackForm(!showFeedbackForm)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              {showFeedbackForm ? '피드백 닫기' : '피드백 제공'}
            </button>
          </div>
        )}
        </div>
      )}

      {/* Feedback Form */}
      {showFeedback && showFeedbackForm && !isEditing && (
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <FeedbackCollector
            targetType="content_plan"
            targetId={planId}
            targetData={editedContentPlan}
            onSubmit={handleFeedbackSubmit}
            onCancel={() => setShowFeedbackForm(false)}
            autoFocus={true}
          />
        </div>
      )}
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
