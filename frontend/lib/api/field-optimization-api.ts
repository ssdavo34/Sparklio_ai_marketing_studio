/**
 * Field Optimization API
 *
 * 개별 필드 최적화를 위한 API
 * - 특정 필드만 선택적으로 개선
 * - Golden Set 검증 기준에 맞춰 재생성
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 * @reference TEAM_TODOS_2025-11-23.md P0.5
 */

// ============================================================================
// Types
// ============================================================================

export interface OptimizeFieldRequest {
  /** 개선할 필드명 */
  field_name: 'headline' | 'subheadline' | 'body' | 'bullets' | 'cta';

  /** 현재 값 */
  current_value: string | string[];

  /** 원본 광고 카피 전체 (컨텍스트) */
  full_copy?: {
    headline: string;
    subheadline: string;
    body: string;
    bullets: string[];
    cta: string;
  };

  /** 제품 정보 (컨텍스트) */
  product_info?: {
    name?: string;
    category?: string;
    target_audience?: string;
  };

  /** 톤 앤 매너 */
  tone?: string;

  /** 목표 점수 */
  target_score?: number;
}

export interface OptimizeFieldResponse {
  /** 개선된 값 */
  optimized_value: string | string[];

  /** 개선 설명 */
  explanation?: string;

  /** 예상 점수 */
  estimated_score?: number;

  /** 처리 시간 (ms) */
  processing_time_ms?: number;
}

// ============================================================================
// API Functions
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://100.123.51.5:8000';

/**
 * 특정 필드를 AI로 최적화
 */
export async function optimizeField(
  request: OptimizeFieldRequest
): Promise<OptimizeFieldResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/agents/copywriter/optimize-field`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      optimized_value: data.optimized_value,
      explanation: data.explanation,
      estimated_score: data.estimated_score,
      processing_time_ms: data.processing_time_ms,
    };
  } catch (error) {
    console.error('[optimizeField] 필드 최적화 실패:', error);
    throw error;
  }
}

/**
 * 여러 필드를 한 번에 최적화 (배치)
 */
export async function optimizeMultipleFields(
  requests: OptimizeFieldRequest[]
): Promise<OptimizeFieldResponse[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/agents/copywriter/optimize-fields-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: requests }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('[optimizeMultipleFields] 배치 최적화 실패:', error);
    throw error;
  }
}

// ============================================================================
// Mock Implementation (for testing without backend)
// ============================================================================

/**
 * 백엔드 없이 테스트용 Mock 함수
 * - 실제 API가 구현될 때까지 사용
 */
export async function optimizeFieldMock(
  request: OptimizeFieldRequest
): Promise<OptimizeFieldResponse> {
  // 시뮬레이션 딜레이
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const { field_name, current_value } = request;

  // Mock 개선 로직
  let optimized_value: string | string[];

  switch (field_name) {
    case 'headline':
      optimized_value = typeof current_value === 'string'
        ? `${current_value.substring(0, 15)}...` // 길이 줄이기
        : current_value;
      break;

    case 'subheadline':
      optimized_value = typeof current_value === 'string'
        ? `더 나은 ${current_value}`
        : current_value;
      break;

    case 'body':
      optimized_value = typeof current_value === 'string'
        ? current_value.replace(/\s+/g, ' ').trim().substring(0, 70) + '...'
        : current_value;
      break;

    case 'bullets':
      optimized_value = Array.isArray(current_value)
        ? current_value.map((b) => `✓ ${b.substring(0, 15)}`)
        : current_value;
      break;

    case 'cta':
      optimized_value = typeof current_value === 'string'
        ? '지금 바로 시작하기'
        : current_value;
      break;

    default:
      optimized_value = current_value;
  }

  return {
    optimized_value,
    explanation: `${field_name} 필드를 Golden Set 기준에 맞게 개선했습니다.`,
    estimated_score: 8.5,
    processing_time_ms: 1500,
  };
}
