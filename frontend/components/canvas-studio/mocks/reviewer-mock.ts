/**
 * Reviewer Mock Data
 *
 * ReviewerAgent 개발/테스트용 Mock 데이터
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 */

import type { AdCopyReviewOutputV1 } from '../types/reviewer';

export const mockAdCopyReview: AdCopyReviewOutputV1 = {
  schema_version: '1.0',

  // 종합 점수
  overall_score: 7.8,

  // 강점
  strengths: [
    '헤드라인이 명확하고 간결하며, 제품의 핵심 가치를 잘 전달하고 있습니다',
    '서브헤드라인이 구체적인 제품 특징(노이즈 캔슬링, 24시간 배터리)을 언급하여 설득력을 높입니다',
    'CTA가 직접적이고 행동을 유도하는 문구로 적절합니다',
    '전반적인 톤이 프리미엄하면서도 친근하여 타겟 고객층에게 잘 맞습니다',
  ],

  // 약점
  weaknesses: [
    '경쟁사 제품과의 차별화 포인트가 명확하게 드러나지 않습니다',
    '제품의 구체적인 USP(고유 판매 제안)가 부족합니다',
    '타겟 고객의 페인 포인트(불편함)를 직접적으로 언급하지 않습니다',
  ],

  // 개선 제안
  improvement_suggestions: [
    '헤드라인에 "업계 최고"나 "특허받은" 같은 차별화 요소를 추가하여 경쟁 우위를 강조하세요',
    '타겟 고객(20-30대 음악 애호가)의 구체적인 니즈를 반영한 문구를 추가하세요 (예: "출퇴근길 완벽한 몰입")',
    'CTA를 더 긴급감 있게 수정하는 것을 고려하세요 (예: "한정 수량 특가 중")',
    '제품의 기술적 우수성을 뒷받침하는 구체적인 수치나 인증을 추가하세요',
  ],

  // 리스크 플래그
  risk_flags: [],

  // 세부 점수
  tone_match_score: 8.2,
  clarity_score: 8.5,
  persuasiveness_score: 6.8,

  // 메타데이터
  meta: {
    reviewed_at: '2025-11-23T10:00:00Z',
    model: 'gpt-4-turbo',
    agent_version: '1.0',
  },
};

/**
 * 낮은 점수 Mock (개선이 많이 필요한 경우)
 */
export const mockAdCopyReviewLowScore: AdCopyReviewOutputV1 = {
  schema_version: '1.0',
  overall_score: 4.2,

  strengths: [
    'CTA가 존재합니다',
    '헤드라인이 짧고 읽기 쉽습니다',
  ],

  weaknesses: [
    '헤드라인이 너무 일반적이고 차별화되지 않습니다',
    '제품의 구체적인 이점이 명확하지 않습니다',
    '타겟 고객층을 고려하지 않은 메시지입니다',
    '감정적 연결고리가 부족합니다',
    'CTA가 행동을 유도하기에 약합니다',
  ],

  improvement_suggestions: [
    '제품의 고유한 가치 제안(UVP)을 명확히 정의하고 헤드라인에 반영하세요',
    '타겟 고객의 페인 포인트를 구체적으로 언급하여 공감대를 형성하세요',
    '감정적 트리거를 활용하여 고객의 마음을 움직이세요',
    'CTA에 긴급성이나 혜택을 추가하여 즉각적인 행동을 유도하세요',
    '사회적 증거(리뷰, 평점)를 추가하여 신뢰도를 높이세요',
  ],

  risk_flags: [
    '메시지가 너무 일반적이어서 광고 효과가 낮을 수 있습니다',
    '경쟁 광고와 구별이 어려워 브랜드 인지도 향상에 도움이 되지 않을 수 있습니다',
  ],

  tone_match_score: 5.0,
  clarity_score: 4.5,
  persuasiveness_score: 3.2,

  meta: {
    reviewed_at: '2025-11-23T10:00:00Z',
    model: 'gpt-4-turbo',
    agent_version: '1.0',
  },
};

/**
 * 높은 점수 Mock (우수한 카피)
 */
export const mockAdCopyReviewHighScore: AdCopyReviewOutputV1 = {
  schema_version: '1.0',
  overall_score: 9.2,

  strengths: [
    '헤드라인이 강렬하고 독특하며, 브랜드 정체성을 명확하게 전달합니다',
    '타겟 고객의 니즈와 페인 포인트를 정확히 파악한 메시지입니다',
    '감정적 연결고리와 이성적 설득이 균형있게 배치되어 있습니다',
    'CTA가 강력하고 즉각적인 행동을 유도합니다',
    '차별화 포인트가 명확하며, 경쟁사 대비 우위가 잘 드러납니다',
    '전체적인 톤이 일관되고 브랜드 이미지와 완벽하게 일치합니다',
  ],

  weaknesses: [
    '일부 표현이 약간 과장되어 보일 수 있습니다 (검토 필요)',
  ],

  improvement_suggestions: [
    '과장되어 보일 수 있는 표현을 좀 더 구체적인 데이터나 사실로 뒷받침하세요',
    '고객 후기나 사회적 증거를 추가하여 신뢰도를 더욱 높일 수 있습니다',
  ],

  risk_flags: [],

  tone_match_score: 9.5,
  clarity_score: 9.0,
  persuasiveness_score: 9.2,

  meta: {
    reviewed_at: '2025-11-23T10:00:00Z',
    model: 'gpt-4-turbo',
    agent_version: '1.0',
  },
};
