/**
 * Quality Score Component
 *
 * AI 생성 카피의 품질 점수를 시각적으로 표시
 * - Golden Set 채점 기준 기반
 * - 필드별 점수 표시
 * - Pass/Fail 판정
 * - 개선 제안 표시
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 * @reference TEAM_TODOS_2025-11-23.md 공통P0-1
 */

'use client';

import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, TrendingUp } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

/**
 * 필드별 점수 상세
 */
export interface FieldScore {
  /** 필드명 */
  field: string;

  /** 점수 (0-10) */
  score: number;

  /** 실제 값 */
  actual?: string | string[];

  /** 기대 값 */
  expected?: string | string[];

  /** 길이 체크 */
  length?: number;
  maxLength?: number;
  lengthOk?: boolean;

  /** 에러 메시지 */
  error?: string;
}

/**
 * 품질 검증 결과
 */
export interface QualityValidationResult {
  /** 전체 점수 (0-10) */
  overall_score: number;

  /** 필드별 점수 */
  field_scores: {
    headline: number;
    subheadline: number;
    body: number;
    bullets: number;
    cta: number;
  };

  /** 상세 정보 */
  details: {
    headline: FieldScore;
    subheadline: FieldScore;
    body: FieldScore;
    bullets: FieldScore;
    cta: FieldScore;
    tone?: {
      expected: string;
      note: string;
    };
  };

  /** 최소 합격 점수 */
  min_score?: number;

  /** 합격 여부 */
  passed?: boolean;

  /** 개선 제안 */
  suggestions?: string[];
}

// ============================================================================
// Component Props
// ============================================================================

export interface QualityScoreProps {
  /** 검증 결과 */
  validationResult: QualityValidationResult;

  /** 컴팩트 모드 (간단한 점수만 표시) */
  compact?: boolean;

  /** 개선 제안 표시 여부 */
  showSuggestions?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export function QualityScore({
  validationResult,
  compact = false,
  showSuggestions = true,
}: QualityScoreProps) {
  const { overall_score, field_scores, details, min_score = 7.0, passed } = validationResult;

  const isPassed = passed !== undefined ? passed : overall_score >= min_score;

  if (compact) {
    return <CompactScoreView score={overall_score} passed={isPassed} minScore={min_score} />;
  }

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
        <div className="flex items-center gap-3">
          {isPassed ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600" />
          )}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">품질 점수</h3>
            <p className="text-xs text-gray-600">
              {isPassed ? '합격 기준 충족' : `최소 ${min_score}점 필요`}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className={`text-3xl font-bold ${getScoreColor(overall_score)}`}>
            {overall_score.toFixed(1)}
          </div>
          <div className="text-xs text-gray-600">/ 10</div>
        </div>
      </div>

      {/* Field Scores */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          필드별 점수
        </h4>

        <div className="space-y-2">
          <ScoreBar label="헤드라인" score={field_scores.headline} weight={0.25} detail={details.headline} />
          <ScoreBar label="서브헤드라인" score={field_scores.subheadline} weight={0.15} detail={details.subheadline} />
          <ScoreBar label="본문" score={field_scores.body} weight={0.25} detail={details.body} />
          <ScoreBar label="주요 특징" score={field_scores.bullets} weight={0.20} detail={details.bullets} />
          <ScoreBar label="행동 유도" score={field_scores.cta} weight={0.15} detail={details.cta} />
        </div>
      </div>

      {/* Suggestions */}
      {showSuggestions && validationResult.suggestions && validationResult.suggestions.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-2">
            <Info className="w-4 h-4" />
            개선 제안
          </h4>
          <ul className="space-y-1 text-xs text-blue-800">
            {validationResult.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Auto-generated Suggestions based on scores */}
      {showSuggestions && !validationResult.suggestions && (
        <AutoSuggestions fieldScores={field_scores} details={details} />
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * 컴팩트 점수 뷰
 */
function CompactScoreView({
  score,
  passed,
  minScore,
}: {
  score: number;
  passed: boolean;
  minScore: number;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border rounded-md">
      {passed ? (
        <CheckCircle className="w-4 h-4 text-green-600" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-orange-600" />
      )}
      <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
        {score.toFixed(1)} / 10
      </span>
      {!passed && (
        <span className="text-xs text-gray-500">(최소 {minScore}점)</span>
      )}
    </div>
  );
}

/**
 * 점수 바
 */
function ScoreBar({
  label,
  score,
  weight,
  detail,
}: {
  label: string;
  score: number;
  weight: number;
  detail?: FieldScore;
}) {
  const percentage = (score / 10) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">{label}</span>
          <span className="text-gray-500">({(weight * 100).toFixed(0)}%)</span>

          {/* Length Warning */}
          {detail && detail.lengthOk === false && (
            <span className="flex items-center gap-1 text-orange-600">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-xs">길이 초과</span>
            </span>
          )}
        </div>

        <span className={`font-semibold ${getScoreColor(score)}`}>
          {score.toFixed(1)}
        </span>
      </div>

      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${getScoreBarColor(score)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Detail Info */}
      {detail && detail.length !== undefined && detail.maxLength !== undefined && (
        <div className="text-xs text-gray-500">
          {detail.length} / {detail.maxLength}자
          {detail.length > detail.maxLength && (
            <span className="text-orange-600 ml-1">
              (+{detail.length - detail.maxLength}자 초과)
            </span>
          )}
        </div>
      )}

      {detail && detail.error && (
        <div className="text-xs text-red-600">
          ⚠️ {detail.error}
        </div>
      )}
    </div>
  );
}

/**
 * 자동 생성 개선 제안
 */
function AutoSuggestions({
  fieldScores,
  details,
}: {
  fieldScores: QualityValidationResult['field_scores'];
  details: QualityValidationResult['details'];
}) {
  const suggestions: string[] = [];

  // 낮은 점수 필드 찾기
  Object.entries(fieldScores).forEach(([field, score]) => {
    if (score < 7.0) {
      const fieldLabel = getFieldLabel(field);
      suggestions.push(`${fieldLabel} 점수가 낮습니다 (${score.toFixed(1)}/10). 더 구체적이고 매력적인 문구를 사용해보세요.`);
    }
  });

  // 길이 초과 체크
  Object.entries(details).forEach(([field, detail]) => {
    if (detail && typeof detail === 'object' && 'lengthOk' in detail && detail.lengthOk === false) {
      const fieldLabel = getFieldLabel(field);
      suggestions.push(`${fieldLabel}이 너무 깁니다. 더 간결하게 작성해주세요.`);
    }
  });

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-2">
        <Info className="w-4 h-4" />
        개선 제안
      </h4>
      <ul className="space-y-1 text-xs text-blue-800">
        {suggestions.map((suggestion, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">•</span>
            <span>{suggestion}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 점수에 따른 색상 클래스
 */
function getScoreColor(score: number): string {
  if (score >= 8.0) return 'text-green-600';
  if (score >= 7.0) return 'text-blue-600';
  if (score >= 5.0) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * 점수 바 색상
 */
function getScoreBarColor(score: number): string {
  if (score >= 8.0) return 'bg-green-500';
  if (score >= 7.0) return 'bg-blue-500';
  if (score >= 5.0) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * 필드 라벨 매핑
 */
function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    headline: '헤드라인',
    subheadline: '서브헤드라인',
    body: '본문',
    bullets: '주요 특징',
    cta: '행동 유도',
  };
  return labels[field] || field;
}
