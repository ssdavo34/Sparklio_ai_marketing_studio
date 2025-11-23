/**
 * Reviewer Agent Types
 *
 * AdCopy/CampaignStrategy 평가 및 피드백 타입
 * Backend: app/schemas/reviewer.py와 1:1 매칭
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 * @reference docs/B_TEAM_NEXT_STEPS_2025-11-23.md
 */

// ============================================================================
// Input Types
// ============================================================================

export interface AdCopyReviewInputV1 {
  /** 스키마 버전 */
  schema_version: '1.0';

  /** 리뷰 대상 카피 (AdCopySimpleOutputV2 구조) */
  original_copy: {
    headline: string;
    subheadline?: string;
    body: string;
    bullets?: string[];
    cta: string;
    [key: string]: any;
  };

  /** 캠페인 컨텍스트 (선택적) */
  campaign_context?: {
    brand?: string;
    target_audience?: string;
    campaign_objective?: string;
    [key: string]: any;
  };
}

// ============================================================================
// Output Types
// ============================================================================

export interface AdCopyReviewOutputV1 {
  /** 스키마 버전 */
  schema_version: '1.0';

  /** 종합 점수 (0~10) */
  overall_score: number;

  /** 강점 목록 */
  strengths: string[];

  /** 약점 목록 */
  weaknesses: string[];

  /** 개선 제안 */
  improvement_suggestions: string[];

  /** 리스크 플래그 (규제/과장/톤 오류 등) */
  risk_flags: string[];

  /** 톤 일치도 점수 (0~10) */
  tone_match_score: number;

  /** 명확성 점수 (0~10) */
  clarity_score: number;

  /** 설득력 점수 (0~10) */
  persuasiveness_score: number;

  /** 메타데이터 */
  meta?: {
    reviewed_at?: string;
    model?: string;
    agent_version?: string;
    [key: string]: any;
  };
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * AdCopyReviewOutputV1 타입 가드
 */
export function isAdCopyReviewOutputV1(obj: any): obj is AdCopyReviewOutputV1 {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.schema_version === 'string' &&
    typeof obj.overall_score === 'number' &&
    obj.overall_score >= 0 &&
    obj.overall_score <= 10 &&
    Array.isArray(obj.strengths) &&
    obj.strengths.length > 0 &&
    Array.isArray(obj.weaknesses) &&
    obj.weaknesses.length > 0 &&
    Array.isArray(obj.improvement_suggestions) &&
    obj.improvement_suggestions.length > 0 &&
    Array.isArray(obj.risk_flags) &&
    typeof obj.tone_match_score === 'number' &&
    typeof obj.clarity_score === 'number' &&
    typeof obj.persuasiveness_score === 'number'
  );
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * 점수 등급
 */
export type ScoreGrade = 'excellent' | 'good' | 'fair' | 'poor';

/**
 * 점수를 등급으로 변환
 */
export function getScoreGrade(score: number): ScoreGrade {
  if (score >= 8.5) return 'excellent';
  if (score >= 7.0) return 'good';
  if (score >= 5.0) return 'fair';
  return 'poor';
}

/**
 * 등급별 색상
 */
export function getScoreGradeColor(grade: ScoreGrade): string {
  switch (grade) {
    case 'excellent':
      return 'text-green-600 bg-green-50';
    case 'good':
      return 'text-blue-600 bg-blue-50';
    case 'fair':
      return 'text-yellow-600 bg-yellow-50';
    case 'poor':
      return 'text-red-600 bg-red-50';
  }
}

/**
 * 등급별 라벨 (한국어)
 */
export function getScoreGradeLabel(grade: ScoreGrade): string {
  switch (grade) {
    case 'excellent':
      return '우수';
    case 'good':
      return '양호';
    case 'fair':
      return '보통';
    case 'poor':
      return '미흡';
  }
}
