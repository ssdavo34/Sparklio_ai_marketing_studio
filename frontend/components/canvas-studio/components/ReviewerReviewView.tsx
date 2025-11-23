/**
 * Reviewer Review View Component
 *
 * AdCopy 리뷰 결과를 시각적으로 표시
 * - 종합 점수 + 세부 점수
 * - 강점/약점/개선 제안
 * - 리스크 플래그
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 * @reference docs/B_TEAM_NEXT_STEPS_2025-11-23.md
 */

'use client';

import React from 'react';
import {
  CheckCircle,
  XCircle,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Target,
  Zap,
} from 'lucide-react';
import type {
  AdCopyReviewOutputV1,
} from '../types/reviewer';
import {
  getScoreGrade,
  getScoreGradeColor,
  getScoreGradeLabel,
} from '../types/reviewer';

// ============================================================================
// Props
// ============================================================================

export interface ReviewerReviewViewProps {
  /** 리뷰 결과 데이터 */
  review: AdCopyReviewOutputV1;

  /** 편집 가능 여부 */
  editable?: boolean;

  /** 액션 핸들러 */
  onAction?: (action: string, data?: any) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function ReviewerReviewView({
  review,
  editable = false,
  onAction,
}: ReviewerReviewViewProps) {
  const overallGrade = getScoreGrade(review.overall_score);

  return (
    <div className="space-y-6">
      {/* 종합 평가 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">종합 평가</h3>
            <p className="text-sm text-gray-600 mt-1">
              AI 리뷰어가 분석한 광고 카피 품질 평가 결과입니다
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-purple-600">
              {review.overall_score.toFixed(1)}
            </div>
            <div className={`text-sm font-medium mt-1 px-3 py-1 rounded-full ${getScoreGradeColor(overallGrade)}`}>
              {getScoreGradeLabel(overallGrade)}
            </div>
          </div>
        </div>
      </div>

      {/* 세부 점수 */}
      <div className="grid grid-cols-3 gap-4">
        <ScoreCard
          icon={Target}
          label="톤 일치도"
          score={review.tone_match_score}
          iconColor="text-blue-600"
        />
        <ScoreCard
          icon={MessageSquare}
          label="명확성"
          score={review.clarity_score}
          iconColor="text-green-600"
        />
        <ScoreCard
          icon={Zap}
          label="설득력"
          score={review.persuasiveness_score}
          iconColor="text-orange-600"
        />
      </div>

      {/* 강점 */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h4 className="font-semibold text-gray-900">강점</h4>
          <span className="text-xs text-gray-500">({review.strengths.length}개)</span>
        </div>
        <ul className="space-y-2">
          {review.strengths.map((strength, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
              <span>{strength}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 약점 */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <XCircle className="w-5 h-5 text-red-600" />
          <h4 className="font-semibold text-gray-900">약점</h4>
          <span className="text-xs text-gray-500">({review.weaknesses.length}개)</span>
        </div>
        <ul className="space-y-2">
          {review.weaknesses.map((weakness, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
              <span>{weakness}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 개선 제안 */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-indigo-600" />
          <h4 className="font-semibold text-gray-900">개선 제안</h4>
          <span className="text-xs text-gray-500">({review.improvement_suggestions.length}개)</span>
        </div>
        <ul className="space-y-3">
          {review.improvement_suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-gray-800">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex-shrink-0 mt-0.5">
                {index + 1}
              </div>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 리스크 플래그 */}
      {review.risk_flags && review.risk_flags.length > 0 && (
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h4 className="font-semibold text-gray-900">주의 사항</h4>
            <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
              {review.risk_flags.length}개 발견
            </span>
          </div>
          <ul className="space-y-2">
            {review.risk_flags.map((flag, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-yellow-900">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-600 mt-1.5 flex-shrink-0" />
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 액션 버튼 (선택적) */}
      {editable && onAction && (
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => onAction('optimize', review)}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>개선 적용</span>
            </div>
          </button>
          <button
            onClick={() => onAction('regenerate')}
            className="px-4 py-2 text-gray-700 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            재생성
          </button>
        </div>
      )}

      {/* 메타 정보 */}
      {review.meta && (
        <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
          {review.meta.reviewed_at && (
            <div>
              리뷰 생성: {new Date(review.meta.reviewed_at).toLocaleString('ko-KR')}
            </div>
          )}
          {review.meta.model && (
            <div className="mt-1">
              모델: {review.meta.model}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface ScoreCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  score: number;
  iconColor: string;
}

function ScoreCard({ icon: Icon, label, score, iconColor }: ScoreCardProps) {
  const grade = getScoreGrade(score);
  const gradeColor = getScoreGradeColor(grade);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold text-gray-900">{score.toFixed(1)}</div>
        <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${gradeColor}`}>
          {getScoreGradeLabel(grade)}
        </div>
      </div>
      {/* 프로그레스 바 */}
      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            grade === 'excellent'
              ? 'bg-green-500'
              : grade === 'good'
              ? 'bg-blue-500'
              : grade === 'fair'
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
    </div>
  );
}
