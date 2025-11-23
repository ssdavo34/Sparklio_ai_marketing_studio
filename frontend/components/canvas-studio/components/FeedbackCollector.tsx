/**
 * Feedback Collector Component
 *
 * 사용자가 생성된 카피에 대한 피드백을 제공할 수 있는 UI
 * - 별점 평가 (1~5점)
 * - 개선 요청 텍스트 입력
 * - 피드백 데이터 서버 전송
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 * @reference TEAM_TODOS_2025-11-23.md P2-6
 */

'use client';

import React, { useState } from 'react';
import { Star, Send, X, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

/**
 * 피드백 데이터 스키마
 */
export interface FeedbackData {
  /** 별점 (1~5) */
  rating: number;

  /** 개선 요청 텍스트 */
  improvementRequest?: string;

  /** 피드백 대상 타입 */
  targetType: 'ad_copy' | 'content_plan' | 'other';

  /** 피드백 대상 ID */
  targetId?: string;

  /** 피드백 대상 데이터 (전체 카피 내용 등) */
  targetData?: any;

  /** 타임스탬프 */
  timestamp: string;

  /** 세션 ID */
  sessionId?: string;
}

/**
 * 빠른 피드백 옵션
 */
interface QuickFeedbackOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
}

const QUICK_FEEDBACK_OPTIONS: QuickFeedbackOption[] = [
  {
    id: 'too_generic',
    label: '너무 일반적임',
    icon: <ThumbsDown className="w-4 h-4" />,
    value: '카피가 너무 일반적이고 구체성이 부족합니다.',
  },
  {
    id: 'too_long',
    label: '너무 김',
    icon: <MessageSquare className="w-4 h-4" />,
    value: '텍스트가 너무 길어서 간결하게 줄여주세요.',
  },
  {
    id: 'tone_mismatch',
    label: '톤이 안 맞음',
    icon: <ThumbsDown className="w-4 h-4" />,
    value: '브랜드 톤과 맞지 않는 표현이 있습니다.',
  },
  {
    id: 'great',
    label: '아주 좋음',
    icon: <ThumbsUp className="w-4 h-4" />,
    value: '카피가 매우 만족스럽습니다.',
  },
];

// ============================================================================
// Component Props
// ============================================================================

export interface FeedbackCollectorProps {
  /** 피드백 대상 타입 */
  targetType: 'ad_copy' | 'content_plan' | 'other';

  /** 피드백 대상 ID */
  targetId?: string;

  /** 피드백 대상 데이터 */
  targetData?: any;

  /** 피드백 제출 콜백 */
  onSubmit?: (feedback: FeedbackData) => Promise<void>;

  /** 취소 콜백 */
  onCancel?: () => void;

  /** 인라인 모드 (컴팩트한 UI) */
  inline?: boolean;

  /** 자동 포커스 */
  autoFocus?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export function FeedbackCollector({
  targetType,
  targetId,
  targetData,
  onSubmit,
  onCancel,
  inline = false,
  autoFocus = false,
}: FeedbackCollectorProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [improvementRequest, setImprovementRequest] = useState('');
  const [selectedQuickOptions, setSelectedQuickOptions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!inline);

  // 별점 선택
  const handleRatingClick = (value: number) => {
    setRating(value);
    if (inline && !isExpanded) {
      setIsExpanded(true);
    }
  };

  // 빠른 피드백 옵션 토글
  const toggleQuickOption = (optionId: string) => {
    setSelectedQuickOptions((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  };

  // 피드백 제출
  const handleSubmit = async () => {
    if (rating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    // 빠른 피드백 옵션들을 텍스트로 변환
    const quickFeedbackText = selectedQuickOptions
      .map((optionId) => QUICK_FEEDBACK_OPTIONS.find((opt) => opt.id === optionId)?.value)
      .filter(Boolean)
      .join(' ');

    const combinedRequest =
      [quickFeedbackText, improvementRequest].filter(Boolean).join(' ') || undefined;

    const feedback: FeedbackData = {
      rating,
      improvementRequest: combinedRequest,
      targetType,
      targetId,
      targetData,
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
    };

    try {
      await onSubmit?.(feedback);

      // 제출 성공 시 리셋
      setRating(0);
      setImprovementRequest('');
      setSelectedQuickOptions([]);
      setIsExpanded(inline ? false : true);

      alert('피드백이 제출되었습니다. 감사합니다!');
    } catch (error) {
      console.error('[FeedbackCollector] 제출 실패:', error);
      alert('피드백 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 취소
  const handleCancel = () => {
    setRating(0);
    setImprovementRequest('');
    setSelectedQuickOptions([]);
    setIsExpanded(inline ? false : true);
    onCancel?.();
  };

  if (inline && !isExpanded) {
    // 인라인 모드: 별점만 표시
    return (
      <div className="flex items-center gap-2 py-2">
        <span className="text-sm text-gray-600">이 카피가 마음에 드시나요?</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => handleRatingClick(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-5 h-5 ${
                  value <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">피드백 제공</h3>
        {inline && (
          <button
            onClick={handleCancel}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 별점 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          카피 품질 평가 <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => handleRatingClick(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  value <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-600">
              {rating === 1 && '매우 불만족'}
              {rating === 2 && '불만족'}
              {rating === 3 && '보통'}
              {rating === 4 && '만족'}
              {rating === 5 && '매우 만족'}
            </span>
          )}
        </div>
      </div>

      {/* 빠른 피드백 옵션 */}
      {rating > 0 && rating < 4 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">주요 문제점 (선택)</label>
          <div className="flex flex-wrap gap-2">
            {QUICK_FEEDBACK_OPTIONS.filter((opt) => opt.id !== 'great').map((option) => (
              <button
                key={option.id}
                onClick={() => toggleQuickOption(option.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  selectedQuickOptions.includes(option.id)
                    ? 'bg-purple-50 border-purple-300 text-purple-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 개선 요청 텍스트 */}
      <div className="space-y-2">
        <label htmlFor="improvement-request" className="text-sm font-medium text-gray-700">
          개선 요청 (선택)
        </label>
        <textarea
          id="improvement-request"
          value={improvementRequest}
          onChange={(e) => setImprovementRequest(e.target.value)}
          placeholder="어떤 점을 개선하면 좋을까요? 구체적으로 작성해주시면 도움이 됩니다."
          rows={4}
          autoFocus={autoFocus}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-500">
          {improvementRequest.length} / 500자
        </p>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              제출 중...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              피드백 제출
            </>
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSubmitting}
          className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          취소
        </button>
      </div>

      {/* 안내 메시지 */}
      <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
        피드백은 AI 카피라이터 개선에 사용됩니다. 소중한 의견 감사합니다.
      </p>
    </div>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 세션 ID 생성/조회
 * - localStorage에 저장하여 세션 추적
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  const STORAGE_KEY = 'sparklio_session_id';
  let sessionId = localStorage.getItem(STORAGE_KEY);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, sessionId);
  }

  return sessionId;
}

// ============================================================================
// Compact Feedback Button (for inline use)
// ============================================================================

export interface FeedbackButtonProps {
  /** 클릭 시 피드백 창 열기 */
  onClick?: () => void;

  /** 이미 제출한 피드백이 있는지 */
  hasSubmitted?: boolean;
}

/**
 * 컴팩트한 피드백 버튼 (AdCopyOutput 등에서 사용)
 */
export function FeedbackButton({ onClick, hasSubmitted = false }: FeedbackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border transition-colors ${
        hasSubmitted
          ? 'bg-green-50 border-green-300 text-green-700'
          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
      }`}
    >
      {hasSubmitted ? (
        <>
          <ThumbsUp className="w-4 h-4" />
          피드백 제출됨
        </>
      ) : (
        <>
          <MessageSquare className="w-4 h-4" />
          피드백 제공
        </>
      )}
    </button>
  );
}
