/**
 * Strategist API
 *
 * StrategistAgent Backend API 연동
 * - Campaign Strategy 생성
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 * @reference docs/STRATEGIST_INTEGRATION_GUIDE_2025-11-23.md
 */

import type { CampaignStrategyOutputV1 } from '@/components/canvas-studio/types/strategist';

// ============================================================================
// Types
// ============================================================================

export interface GenerateCampaignStrategyRequest {
  /** 브랜드 이름 */
  brand_name: string;

  /** 제품/서비스 카테고리 */
  product_category: string;

  /** 타겟 고객층 */
  target_audience: string;

  /** 캠페인 목표 */
  campaign_objective: string;

  /** 예산 범위 (선택적) */
  budget_range?: string;

  /** 추가 컨텍스트 (선택적) */
  additional_context?: string;
}

export interface GenerateCampaignStrategyResponse {
  /** Agent 응답 상태 */
  status: 'success' | 'partial' | 'failed';

  /** Campaign Strategy 데이터 */
  data: CampaignStrategyOutputV1;

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
 * Campaign Strategy 생성 (Backend StrategistAgent 호출)
 */
export async function generateCampaignStrategy(
  request: GenerateCampaignStrategyRequest
): Promise<CampaignStrategyOutputV1> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const endpoint = `${API_BASE_URL}/api/v1/agents/strategist/execute`;

  console.log('[StrategistAPI] Generating campaign strategy:', request);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: 'campaign_strategy',
        payload: request,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const result: GenerateCampaignStrategyResponse = await response.json();

    console.log('[StrategistAPI] Response:', result);

    if (result.status === 'failed') {
      throw new Error(result.error?.message || 'Campaign strategy generation failed');
    }

    if (result.status === 'partial') {
      console.warn('[StrategistAPI] Partial success - validation issues detected');
    }

    return result.data;
  } catch (error: any) {
    console.error('[StrategistAPI] Error:', error);
    throw new Error(`Failed to generate campaign strategy: ${error.message}`);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 간단한 요청 빌더 (폼 데이터 → API 요청)
 */
export function buildCampaignStrategyRequest(formData: {
  brandName: string;
  productCategory: string;
  targetAudience: string;
  campaignObjective: string;
  budgetRange?: string;
  additionalContext?: string;
}): GenerateCampaignStrategyRequest {
  return {
    brand_name: formData.brandName,
    product_category: formData.productCategory,
    target_audience: formData.targetAudience,
    campaign_objective: formData.campaignObjective,
    budget_range: formData.budgetRange,
    additional_context: formData.additionalContext,
  };
}

/**
 * Mock 데이터 사용 여부 확인
 */
export function shouldUseMock(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_STRATEGIST === 'true';
}

/**
 * Mock 데이터 가져오기 (개발용)
 */
export async function getCampaignStrategyMock(): Promise<CampaignStrategyOutputV1> {
  // Dynamic import to avoid bundling mock data in production
  const { mockCampaignStrategy } = await import(
    '@/components/canvas-studio/mocks/strategist-mock'
  );
  return mockCampaignStrategy;
}

/**
 * generateCampaignStrategy의 Mock 버전 (개발용)
 */
export async function generateCampaignStrategyMock(
  request: GenerateCampaignStrategyRequest
): Promise<CampaignStrategyOutputV1> {
  console.log('[StrategistAPI] Using MOCK data for:', request);

  // 실제 API 호출처럼 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const mockData = await getCampaignStrategyMock();

  // 요청 데이터로 일부 커스터마이징
  return {
    ...mockData,
    core_message: `${request.brand_name}의 ${request.campaign_objective} 캠페인`,
    positioning: `${request.target_audience}를 위한 ${request.product_category} 브랜드`,
    meta: {
      ...mockData.meta,
      generated_at: new Date().toISOString(),
    },
  };
}
