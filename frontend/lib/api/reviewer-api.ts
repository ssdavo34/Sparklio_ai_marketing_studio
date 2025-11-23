/**
 * Reviewer API
 *
 * ReviewerAgent Backend API 연동
 * - AdCopy 품질 리뷰
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 * @reference docs/B_TEAM_NEXT_STEPS_2025-11-23.md
 */

import type {
  AdCopyReviewInputV1,
  AdCopyReviewOutputV1,
} from '@/components/canvas-studio/types/reviewer';

// ============================================================================
// Types
// ============================================================================

export interface ReviewAdCopyRequest {
  /** 리뷰 대상 카피 */
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

export interface ReviewAdCopyResponse {
  /** Agent 응답 상태 */
  status: 'success' | 'partial' | 'failed';

  /** Review 데이터 */
  data: AdCopyReviewOutputV1;

  /** 메타데이터 */
  meta?: {
    agent_name?: string;
    model?: string;
    execution_time_ms?: number;
    validation_passed?: boolean;
  };

  /** 에러 정보 (실패 시) */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * AdCopy 품질 리뷰 (Backend ReviewerAgent 호출)
 */
export async function reviewAdCopy(
  request: ReviewAdCopyRequest
): Promise<AdCopyReviewOutputV1> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const endpoint = `${API_BASE_URL}/api/v1/agents/reviewer/execute`;

  console.log('[ReviewerAPI] Reviewing ad copy:', request);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: 'ad_copy_quality_check',
        payload: {
          schema_version: '1.0',
          original_copy: request.original_copy,
          campaign_context: request.campaign_context,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const result: ReviewAdCopyResponse = await response.json();

    console.log('[ReviewerAPI] Response:', result);

    if (result.status === 'failed') {
      throw new Error(result.error?.message || 'Ad copy review failed');
    }

    if (result.status === 'partial') {
      console.warn('[ReviewerAPI] Partial success - validation issues detected');
    }

    return result.data;
  } catch (error: any) {
    console.error('[ReviewerAPI] Error:', error);
    throw new Error(`Failed to review ad copy: ${error.message}`);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 간단한 요청 빌더 (폼 데이터 → API 요청)
 */
export function buildReviewAdCopyRequest(formData: {
  adCopy: any;
  campaignContext?: any;
}): ReviewAdCopyRequest {
  return {
    original_copy: formData.adCopy,
    campaign_context: formData.campaignContext,
  };
}

/**
 * Mock 데이터 사용 여부 확인
 */
export function shouldUseMock(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_REVIEWER === 'true';
}

/**
 * Mock 데이터 가져오기 (개발용)
 */
export async function getAdCopyReviewMock(): Promise<AdCopyReviewOutputV1> {
  // Dynamic import to avoid bundling mock data in production
  const { mockAdCopyReview } = await import(
    '@/components/canvas-studio/mocks/reviewer-mock'
  );
  return mockAdCopyReview;
}

/**
 * reviewAdCopy의 Mock 버전 (개발용)
 */
export async function reviewAdCopyMock(
  request: ReviewAdCopyRequest
): Promise<AdCopyReviewOutputV1> {
  console.log('[ReviewerAPI] Using MOCK data for:', request);

  // 실제 API 호출처럼 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const mockData = await getAdCopyReviewMock();

  // 요청 데이터로 일부 커스터마이징
  return {
    ...mockData,
    meta: {
      ...mockData.meta,
      reviewed_at: new Date().toISOString(),
    },
  };
}
