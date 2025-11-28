/**
 * Nano Banana API Client
 *
 * AI Image Generation API 연동
 * - 텍스트 → 이미지 생성
 * - 이미지 변형
 * - 스타일 적용
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 */

import type {
  NanoBananaGenerateParams,
  NanoBananaGenerateResponse,
  NanoBananaVariationParams,
  NanoBananaConfig,
  GeneratedImage,
} from './nano-banana-types';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<NanoBananaConfig> = {
  apiUrl: process.env.NEXT_PUBLIC_NANO_BANANA_API_URL || 'https://api.nanobanana.ai',
  apiKey: process.env.NEXT_PUBLIC_NANO_BANANA_API_KEY || '',
  defaultStyle: 'realistic',
  defaultSize: '1024x1024',
  timeout: 60000, // 60초
};

let config: Required<NanoBananaConfig> = { ...DEFAULT_CONFIG };

/**
 * Nano Banana API 설정
 */
export function configureNanoBanana(userConfig: Partial<NanoBananaConfig>): void {
  config = {
    ...config,
    ...userConfig,
  };
}

/**
 * 현재 설정 가져오기
 */
export function getNanoBananaConfig(): Required<NanoBananaConfig> {
  return { ...config };
}

// ============================================================================
// HTTP Client
// ============================================================================

class NanoBananaAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'NanoBananaAPIError';
  }
}

async function fetchNanoBanana<T>(
  endpoint: string,
  body: Record<string, any>
): Promise<T> {
  if (!config.apiKey) {
    throw new NanoBananaAPIError('Nano Banana API Key가 설정되지 않았습니다', 401);
  }

  const url = `${config.apiUrl}${endpoint}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new NanoBananaAPIError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof NanoBananaAPIError) {
      throw error;
    }

    if ((error as Error).name === 'AbortError') {
      throw new NanoBananaAPIError('요청 시간 초과', 408);
    }

    // Network error
    throw new NanoBananaAPIError(
      `네트워크 오류: ${(error as Error).message}`,
      0
    );
  }
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * 이미지 생성
 *
 * @example
 * const result = await generateImage({
 *   prompt: 'A beautiful sunset over mountains',
 *   style: 'realistic',
 *   size: '1024x1024'
 * });
 */
export async function generateImage(
  params: NanoBananaGenerateParams
): Promise<NanoBananaGenerateResponse> {
  const requestBody = {
    prompt: params.prompt,
    negative_prompt: params.negative_prompt || '',
    style: params.style || config.defaultStyle,
    size: params.size || config.defaultSize,
    num_images: params.num_images || 1,
    guidance_scale: params.guidance_scale || 7.5,
    num_inference_steps: params.num_inference_steps || 30,
    ...(params.seed !== undefined && { seed: params.seed }),
  };

  return await fetchNanoBanana<NanoBananaGenerateResponse>('/v1/generate', requestBody);
}

/**
 * 이미지 재생성 (같은 프롬프트, 다른 결과)
 *
 * @param prompt - 생성 프롬프트
 * @param previousSeed - 이전 seed (제외하기 위함)
 */
export async function regenerateImage(
  prompt: string,
  style?: NanoBananaGenerateParams['style'],
  previousSeed?: number
): Promise<NanoBananaGenerateResponse> {
  // 이전과 다른 seed 사용 (재현성 방지)
  const seed = previousSeed !== undefined
    ? previousSeed + Math.floor(Math.random() * 1000) + 1
    : undefined;

  return await generateImage({
    prompt,
    style: style || config.defaultStyle,
    seed,
  });
}

/**
 * 이미지 변형
 *
 * @example
 * const result = await variateImage({
 *   image: originalImageUrl,
 *   prompt: 'Make it more colorful',
 *   strength: 0.7
 * });
 */
export async function variateImage(
  params: NanoBananaVariationParams
): Promise<NanoBananaGenerateResponse> {
  const requestBody = {
    image: params.image,
    prompt: params.prompt,
    strength: params.strength || 0.7,
    style: params.style || config.defaultStyle,
    guidance_scale: params.guidance_scale || 7.5,
    num_inference_steps: params.num_inference_steps || 30,
  };

  return await fetchNanoBanana<NanoBananaGenerateResponse>('/v1/variate', requestBody);
}

/**
 * 배치 이미지 생성
 *
 * 여러 프롬프트를 한 번에 처리
 */
export async function generateBatch(
  prompts: string[],
  style?: NanoBananaGenerateParams['style']
): Promise<GeneratedImage[]> {
  const results = await Promise.all(
    prompts.map((prompt) =>
      generateImage({ prompt, style: style || config.defaultStyle })
    )
  );

  return results.flatMap((result, index) =>
    result.images.map((url) => ({
      url,
      prompt: prompts[index],
      style: style || config.defaultStyle,
      createdAt: new Date().toISOString(),
      seed: result.seed,
    }))
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 프롬프트 최적화
 *
 * 간단한 프롬프트를 더 상세하게 변환
 */
export function optimizePrompt(prompt: string, context?: {
  style?: string;
  mood?: string;
  quality?: string;
}): string {
  const parts: string[] = [prompt];

  if (context?.style) {
    parts.push(`${context.style} style`);
  }

  if (context?.mood) {
    parts.push(`${context.mood} atmosphere`);
  }

  if (context?.quality) {
    parts.push(context.quality);
  } else {
    // 기본 품질 키워드
    parts.push('high quality', 'detailed', '8k resolution');
  }

  return parts.join(', ');
}

/**
 * Visual description → 이미지 생성 프롬프트 변환
 *
 * Template에서 사용할 함수
 */
export function visualDescriptionToPrompt(
  description: string,
  brandStyle?: string
): string {
  const basePrompt = description;

  if (brandStyle) {
    return optimizePrompt(basePrompt, {
      style: brandStyle,
      quality: 'professional, marketing quality',
    });
  }

  return optimizePrompt(basePrompt, {
    quality: 'professional, marketing quality, clean composition',
  });
}

/**
 * 에러 메시지 한글화
 */
export function getNanoBananaErrorMessage(error: unknown): string {
  if (error instanceof NanoBananaAPIError) {
    switch (error.status) {
      case 401:
        return 'API 인증 실패: API 키를 확인해주세요';
      case 408:
        return '이미지 생성 시간 초과: 다시 시도해주세요';
      case 429:
        return 'API 사용량 초과: 잠시 후 다시 시도해주세요';
      case 500:
        return '서버 오류: 잠시 후 다시 시도해주세요';
      default:
        return error.message;
    }
  }

  return '알 수 없는 오류가 발생했습니다';
}

// ============================================================================
// Export
// ============================================================================

export {
  NanoBananaAPIError,
};

export default {
  configure: configureNanoBanana,
  getConfig: getNanoBananaConfig,
  generateImage,
  regenerateImage,
  variateImage,
  generateBatch,
  optimizePrompt,
  visualDescriptionToPrompt,
  getNanoBananaErrorMessage,
};
