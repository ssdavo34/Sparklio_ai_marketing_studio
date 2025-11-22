/**
 * Generator API Client
 *
 * 제품 콘텐츠 및 이미지 생성 API 클라이언트
 * - 백엔드 완성 전에도 타입 안전성 확보
 * - Base64 → URL 전환 시에도 코드 변경 최소화
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-22
 */

import type {
  ProductContentRequest,
  ProductContentResponse,
  SocialMediaPostResponse,
} from '@/types/generator';

// ============================================================================
// Configuration
// ============================================================================

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.123.51.5:8000';
const API_BASE = `${BACKEND_API_URL}/api/v1`;

// ============================================================================
// API Client
// ============================================================================

/**
 * 제품 콘텐츠 생성 API
 *
 * @param request - 생성 요청 파라미터
 * @returns 생성된 콘텐츠 (텍스트 + 이미지)
 *
 * @example
 * ```ts
 * const response = await generateProductContent({
 *   role: 'copywriter',
 *   task: 'product_detail',
 *   payload: {
 *     product_name: '프리미엄 무선 이어폰',
 *     features: ['노이즈캔슬링', '24시간 재생'],
 *     include_image: true,
 *   },
 * });
 * ```
 */
export async function generateProductContent(
  request: ProductContentRequest
): Promise<ProductContentResponse> {
  // TODO: 백엔드 API 연동 (현재는 타입 시그니처만 고정)
  // const response = await fetch(`${API_BASE}/generate`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify(request),
  // });
  //
  // if (!response.ok) {
  //   throw new Error(`Failed to generate content: ${response.statusText}`);
  // }
  //
  // return await response.json();

  // 임시: 목업 데이터 반환 (백엔드 완성 전)
  return createMockProductContent(request);
}

/**
 * SNS 포스트 생성 API
 *
 * @param request - 생성 요청 파라미터
 * @returns 생성된 SNS 포스트 (텍스트 + 이미지)
 */
export async function generateSocialMediaPost(
  request: ProductContentRequest
): Promise<SocialMediaPostResponse> {
  // TODO: 백엔드 API 연동
  return createMockSocialMediaPost(request);
}

// ============================================================================
// Mock Data (백엔드 완성 전 테스트용)
// ============================================================================

/**
 * 목업 제품 콘텐츠 생성
 * 백엔드 API 완성 전까지 사용
 */
function createMockProductContent(
  request: ProductContentRequest
): ProductContentResponse {
  const { payload } = request;

  // 목업 응답 생성
  const response: ProductContentResponse = {
    headline: `${payload.product_name}, 새로운 경험의 시작`,
    subheadline: payload.target_audience
      ? `${payload.target_audience}을 위한 특별한 제안`
      : undefined,
    body: `${payload.product_name}은(는) ${payload.features?.join(', ') || '혁신적인 기술'}을(를) 통해 일상을 더 편리하게 만듭니다.`,
    bullets: payload.features || ['프리미엄 품질', '합리적인 가격', '빠른 배송'],
    cta: '지금 바로 만나보기',
    usage: {
      tokens: 150,
      cost: 0.003,
    },
    meta: {
      agent: request.role,
      task: request.task,
      timestamp: new Date().toISOString(),
    },
  };

  // include_image가 true이고 백엔드가 이미지를 생성했다면, image 필드 추가
  if (payload.include_image) {
    // 임시: 목업 Base64 이미지 (실제로는 백엔드에서 생성)
    response.image = {
      type: 'base64',
      format: 'png',
      // 작은 1x1 투명 PNG (실제로는 ComfyUI 생성 이미지)
      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    };
  }

  return response;
}

/**
 * 목업 SNS 포스트 생성
 * 백엔드 API 완성 전까지 사용
 */
function createMockSocialMediaPost(
  request: ProductContentRequest
): SocialMediaPostResponse {
  const { payload } = request;

  const response: SocialMediaPostResponse = {
    post: `🎉 ${payload.product_name} 출시!\n\n${payload.features?.slice(0, 2).join(', ') || '혁신적인 기능'}으로 당신의 일상을 더 특별하게 만들어 드립니다.`,
    hashtags: [
      payload.product_name.replace(/\s/g, ''),
      '신제품',
      '특별한',
      '프리미엄',
    ],
    cta: '자세히 보기',
    usage: {
      tokens: 120,
      cost: 0.002,
    },
  };

  if (payload.include_image) {
    response.image = {
      type: 'base64',
      format: 'png',
      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    };
  }

  return response;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 생성 중 로그 (개발 모드에서만)
 */
export function logGenerationRequest(
  request: ProductContentRequest,
  message?: string
) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Generator API]', message || 'Request:', {
      role: request.role,
      task: request.task,
      payload: {
        ...request.payload,
        // 민감한 정보는 로깅에서 제외
        brand_id: request.payload.brand_id ? '***' : undefined,
      },
    });
  }
}

/**
 * 에러 처리 헬퍼
 */
export class GeneratorAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'GeneratorAPIError';
  }
}
