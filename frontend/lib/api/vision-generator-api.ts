/**
 * VisionGeneratorAgent API Client
 *
 * 백엔드 VisionGeneratorAgent와 통신하는 API 클라이언트
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 *
 * Backend API:
 * - POST /api/v1/agents/vision-generator/generate
 * - POST /api/v1/media/generate
 */

import type {
  VisionGeneratorAPIRequest,
  VisionGeneratorAPIResponse,
  VisionGeneratorOutput,
  ImageGenerationRequest,
  ImageProvider,
  GeneratedImage,
  SimpleImageGenerationRequest,
} from './vision-generator-types';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const AGENT_ENDPOINT = '/api/v1/agents/vision-generator/generate';
const MEDIA_ENDPOINT = '/api/v1/media/generate';

/**
 * 인증 토큰 가져오기
 * TODO: 실제 인증 시스템 연동 필요
 */
function getAuthToken(): string | null {
  // 임시: localStorage에서 토큰 가져오기
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

// ============================================================================
// Error Handling
// ============================================================================

export class VisionGeneratorError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'VisionGeneratorError';
  }
}

/**
 * API 에러를 사용자 친화적인 메시지로 변환
 */
export function getVisionGeneratorErrorMessage(error: any): string {
  if (error instanceof VisionGeneratorError) {
    return error.message;
  }

  if (error.response) {
    const status = error.response.status;
    if (status === 401) return '인증이 필요합니다. 다시 로그인해주세요.';
    if (status === 403) return '권한이 없습니다.';
    if (status === 429) return 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
    if (status === 500) return '서버 오류가 발생했습니다.';
    if (status === 503) return '서비스를 일시적으로 사용할 수 없습니다.';
  }

  if (error.message) {
    return error.message;
  }

  return '이미지 생성 중 알 수 없는 오류가 발생했습니다.';
}

// ============================================================================
// API Functions - VisionGeneratorAgent
// ============================================================================

/**
 * VisionGeneratorAgent를 통한 이미지 생성 (배치)
 *
 * @example
 * const output = await generateImagesViaAgent({
 *   prompts: [
 *     { prompt_text: 'A sunset', style: 'realistic' },
 *     { prompt_text: 'A mountain', style: 'realistic' },
 *   ],
 *   provider: 'auto',
 *   batch_mode: true,
 * });
 */
export async function generateImagesViaAgent(
  request: VisionGeneratorAPIRequest
): Promise<VisionGeneratorOutput> {
  const url = `${API_BASE_URL}${AGENT_ENDPOINT}`;

  console.log('[VisionGeneratorAPI] Request:', {
    url,
    prompts: request.prompts.length,
    provider: request.provider || 'auto',
    batch_mode: request.batch_mode,
  });

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 인증 토큰 추가 (있는 경우)
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      throw new VisionGeneratorError(
        errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data: VisionGeneratorAPIResponse = await response.json();

    if (!data.success || !data.data) {
      throw new VisionGeneratorError(
        data.error || '이미지 생성 실패',
        undefined,
        data
      );
    }

    console.log('[VisionGeneratorAPI] Success:', {
      total_generated: data.data.total_generated,
      total_failed: data.data.total_failed,
      total_time: data.data.total_time,
    });

    return data.data;
  } catch (error: any) {
    console.error('[VisionGeneratorAPI] Error:', error);
    throw error instanceof VisionGeneratorError
      ? error
      : new VisionGeneratorError(getVisionGeneratorErrorMessage(error));
  }
}

/**
 * 단일 이미지 생성 (간편 함수)
 */
export async function generateSingleImage(
  request: SimpleImageGenerationRequest,
  provider: ImageProvider = 'auto',
  brandId?: string
): Promise<GeneratedImage> {
  const agentRequest: VisionGeneratorAPIRequest = {
    prompts: [
      {
        prompt_text: request.prompt,
        style: request.style || 'realistic',
        aspect_ratio: request.aspectRatio || '1:1',
        seed: request.seed,
        quality: 'high',
      },
    ],
    provider,
    batch_mode: false,
    brand_id: brandId,
  };

  const output = await generateImagesViaAgent(agentRequest);

  if (output.images.length === 0) {
    throw new VisionGeneratorError('이미지가 생성되지 않았습니다.');
  }

  return output.images[0];
}

/**
 * 배치 이미지 생성 (간편 함수)
 */
export async function generateBatchImages(
  requests: SimpleImageGenerationRequest[],
  provider: ImageProvider = 'auto',
  options?: {
    maxConcurrent?: number;
    brandId?: string;
  }
): Promise<GeneratedImage[]> {
  const agentRequest: VisionGeneratorAPIRequest = {
    prompts: requests.map((req) => ({
      prompt_text: req.prompt,
      style: req.style || 'realistic',
      aspect_ratio: req.aspectRatio || '1:1',
      seed: req.seed,
      quality: 'high',
    })),
    provider,
    batch_mode: true,
    max_concurrent: options?.maxConcurrent || 3,
    brand_id: options?.brandId,
  };

  const output = await generateImagesViaAgent(agentRequest);
  return output.images;
}

/**
 * 이미지 재생성 (Variation)
 */
export async function regenerateImageViaAgent(
  prompt: string,
  style?: 'realistic' | 'illustration' | '3d' | 'anime',
  previousSeed?: number,
  provider: ImageProvider = 'auto'
): Promise<GeneratedImage> {
  const agentRequest: VisionGeneratorAPIRequest = {
    prompts: [
      {
        prompt_text: prompt,
        style: style || 'realistic',
        aspect_ratio: '1:1',
        seed: previousSeed, // 같은 seed를 사용하면 비슷한 결과
        quality: 'high',
      },
    ],
    provider,
    batch_mode: false,
  };

  const output = await generateImagesViaAgent(agentRequest);

  if (output.images.length === 0) {
    throw new VisionGeneratorError('이미지 재생성 실패');
  }

  return output.images[0];
}

// ============================================================================
// API Functions - MediaGateway (Alternative)
// ============================================================================

/**
 * MediaGateway를 통한 이미지 생성 (저수준 API)
 *
 * VisionGeneratorAgent 대신 MediaGateway를 직접 호출할 수도 있습니다.
 * 대부분의 경우 VisionGeneratorAgent 사용을 권장합니다.
 */
export async function generateViaMediaGateway(
  prompt: string,
  options?: {
    width?: number;
    height?: number;
    style?: string;
    negative_prompt?: string;
    seed?: number;
  }
): Promise<{ url: string; base64?: string }> {
  const url = `${API_BASE_URL}${MEDIA_ENDPOINT}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      task: 'product_image',
      media_type: 'image',
      options: {
        width: options?.width || 1024,
        height: options?.height || 1024,
        style: options?.style,
        negative_prompt: options?.negative_prompt,
        seed: options?.seed,
      },
    }),
  });

  if (!response.ok) {
    throw new VisionGeneratorError(`MediaGateway 호출 실패: ${response.status}`);
  }

  const data = await response.json();

  if (!data.outputs || data.outputs.length === 0) {
    throw new VisionGeneratorError('이미지가 생성되지 않았습니다.');
  }

  return {
    url: data.outputs[0].url,
    base64: data.outputs[0].base64,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Provider 가용성 확인
 */
export async function checkProviderAvailability(
  provider: ImageProvider
): Promise<boolean> {
  try {
    const url = `${API_BASE_URL}/api/v1/media/health`;
    const response = await fetch(url);

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.providers?.[provider]?.available || false;
  } catch {
    return false;
  }
}

/**
 * 모든 Provider 상태 확인
 */
export async function getProvidersStatus(): Promise<
  Record<string, { available: boolean; latency?: number }>
> {
  try {
    const url = `${API_BASE_URL}/api/v1/media/health`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('헬스 체크 실패');
    }

    const data = await response.json();
    return data.providers || {};
  } catch (error) {
    console.error('[VisionGeneratorAPI] Health check failed:', error);
    return {};
  }
}
