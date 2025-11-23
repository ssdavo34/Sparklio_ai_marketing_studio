/**
 * Response Type Detector
 *
 * AI 응답 타입을 자동으로 감지하여 적절한 뷰어를 선택
 * - ContentPlanPages 감지
 * - AdCopy 감지
 * - 기타 응답 타입 감지
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 * @reference TEAM_TODOS_2025-11-23.md P1
 */

import type { ContentPlanPagesSchema } from '@/components/canvas-studio/types/content-plan';
import type { AdCopySimpleOutputV2 } from '@/components/canvas-studio/components/AdCopyOutput';
import type { CampaignStrategyOutputV1 } from '@/components/canvas-studio/types/strategist';

// ============================================================================
// Types
// ============================================================================

export type ResponseType =
  | 'content_plan_pages'
  | 'ad_copy'
  | 'campaign_strategy'
  | 'error'
  | 'unknown';

export interface DetectionResult {
  type: ResponseType;
  confidence: number; // 0.0 ~ 1.0
  data?: any;
  reason?: string;
}

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * AI 응답 타입 자동 감지
 */
export function detectResponseType(response: any): DetectionResult {
  if (!response || typeof response !== 'object') {
    return {
      type: 'unknown',
      confidence: 0,
      reason: 'Invalid response format',
    };
  }

  // 1. Error 감지
  if (response.error || response.detail) {
    return {
      type: 'error',
      confidence: 1.0,
      data: response,
      reason: 'Error response detected',
    };
  }

  // 2. CampaignStrategy 감지
  const campaignStrategyResult = detectCampaignStrategy(response);
  if (campaignStrategyResult.confidence >= 0.8) {
    return campaignStrategyResult;
  }

  // 3. ContentPlanPages 감지
  const contentPlanResult = detectContentPlanPages(response);
  if (contentPlanResult.confidence >= 0.8) {
    return contentPlanResult;
  }

  // 4. AdCopy 감지
  const adCopyResult = detectAdCopy(response);
  if (adCopyResult.confidence >= 0.8) {
    return adCopyResult;
  }

  // 5. Unknown
  return {
    type: 'unknown',
    confidence: 0,
    data: response,
    reason: 'No matching pattern found',
  };
}

/**
 * CampaignStrategy 타입 감지
 */
export function detectCampaignStrategy(response: any): DetectionResult {
  let confidence = 0;
  const reasons: string[] = [];

  // 필수 필드 체크
  if (response.schema_version === '1.0') {
    confidence += 0.15;
    reasons.push('schema_version 1.0');
  }

  if (typeof response.core_message === 'string' && response.core_message.length > 0) {
    confidence += 0.15;
    reasons.push('core_message exists');
  }

  if (typeof response.positioning === 'string' && response.positioning.length > 0) {
    confidence += 0.1;
    reasons.push('positioning exists');
  }

  if (typeof response.big_idea === 'string' && response.big_idea.length > 0) {
    confidence += 0.15;
    reasons.push('big_idea exists');
  }

  if (Array.isArray(response.target_insights)) {
    confidence += 0.1;
    reasons.push('target_insights array exists');
  }

  if (Array.isArray(response.strategic_pillars)) {
    confidence += 0.1;
    reasons.push('strategic_pillars array exists');
  }

  if (Array.isArray(response.channel_strategy)) {
    confidence += 0.1;
    reasons.push('channel_strategy array exists');
  }

  if (response.funnel_structure && typeof response.funnel_structure === 'object') {
    confidence += 0.1;
    reasons.push('funnel_structure exists');
  }

  if (Array.isArray(response.risk_factors) && Array.isArray(response.success_metrics)) {
    confidence += 0.05;
    reasons.push('risk_factors and success_metrics exist');
  }

  return {
    type: 'campaign_strategy',
    confidence,
    data: confidence >= 0.8 ? (response as CampaignStrategyOutputV1) : undefined,
    reason: reasons.join(', '),
  };
}

/**
 * ContentPlanPages 타입 감지
 */
export function detectContentPlanPages(response: any): DetectionResult {
  let confidence = 0;
  const reasons: string[] = [];

  // 필수 필드 체크
  if (response.schema_version) {
    confidence += 0.3;
    reasons.push('schema_version exists');
  }

  if (response.campaign_info && typeof response.campaign_info === 'object') {
    confidence += 0.2;
    reasons.push('campaign_info exists');
  }

  if (Array.isArray(response.pages)) {
    confidence += 0.3;
    reasons.push('pages array exists');

    // 페이지 구조 체크
    const hasValidPages = response.pages.every((page: any) =>
      page.page_id &&
      page.layout &&
      Array.isArray(page.blocks)
    );

    if (hasValidPages) {
      confidence += 0.2;
      reasons.push('valid page structure');
    }
  }

  return {
    type: 'content_plan_pages',
    confidence,
    data: confidence >= 0.8 ? (response as ContentPlanPagesSchema) : undefined,
    reason: reasons.join(', '),
  };
}

/**
 * AdCopy 타입 감지
 */
export function detectAdCopy(response: any): DetectionResult {
  let confidence = 0;
  const reasons: string[] = [];

  // 필수 필드 체크
  const requiredFields = ['headline', 'subheadline', 'body', 'bullets', 'cta'];
  let foundFields = 0;

  for (const field of requiredFields) {
    if (response[field]) {
      foundFields++;
    }
  }

  confidence = foundFields / requiredFields.length;

  if (foundFields > 0) {
    reasons.push(`${foundFields}/${requiredFields.length} required fields`);
  }

  // bullets가 배열인지 체크
  if (Array.isArray(response.bullets)) {
    confidence += 0.1;
    reasons.push('bullets is array');
  }

  // tone_used나 primary_benefit 같은 추가 필드
  if (response.tone_used || response.primary_benefit) {
    confidence += 0.05;
    reasons.push('optional fields present');
  }

  return {
    type: 'ad_copy',
    confidence: Math.min(confidence, 1.0),
    data: confidence >= 0.8 ? (response as AdCopySimpleOutputV2) : undefined,
    reason: reasons.join(', '),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 응답이 ContentPlanPages 타입인지 확인 (타입 가드)
 */
export function isContentPlanPages(response: any): response is ContentPlanPagesSchema {
  const result = detectContentPlanPages(response);
  return result.confidence >= 0.8;
}

/**
 * 응답이 AdCopy 타입인지 확인 (타입 가드)
 */
export function isAdCopy(response: any): response is AdCopySimpleOutputV2 {
  const result = detectAdCopy(response);
  return result.confidence >= 0.8;
}

/**
 * 응답이 CampaignStrategy 타입인지 확인 (타입 가드)
 */
export function isCampaignStrategy(response: any): response is CampaignStrategyOutputV1 {
  const result = detectCampaignStrategy(response);
  return result.confidence >= 0.8;
}

/**
 * 디버그용: 감지 결과 상세 정보 출력
 */
export function debugDetectionResult(response: any): void {
  const result = detectResponseType(response);

  console.group('[Response Type Detection]');
  console.log('Type:', result.type);
  console.log('Confidence:', `${(result.confidence * 100).toFixed(1)}%`);
  console.log('Reason:', result.reason);
  console.log('Data:', result.data);
  console.groupEnd();
}
