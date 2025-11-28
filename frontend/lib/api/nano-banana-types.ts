/**
 * Nano Banana API Types
 *
 * AI Image Generation API 타입 정의
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 */

// ============================================================================
// Image Generation Types
// ============================================================================

/**
 * 이미지 생성 요청 파라미터
 */
export interface NanoBananaGenerateParams {
  /** 이미지 생성 프롬프트 */
  prompt: string;

  /** 네거티브 프롬프트 (생성하지 않을 요소) */
  negative_prompt?: string;

  /** 이미지 스타일 */
  style?: 'realistic' | 'artistic' | 'anime' | 'sketch' | 'digital_art' | 'photographic';

  /** 이미지 크기 */
  size?: '512x512' | '768x768' | '1024x1024' | '1024x768' | '768x1024';

  /** 생성할 이미지 개수 (1-4) */
  num_images?: number;

  /** Seed (재현성을 위한 값, 선택적) */
  seed?: number;

  /** Guidance scale (프롬프트 충실도, 1-20) */
  guidance_scale?: number;

  /** Inference steps (품질, 20-50) */
  num_inference_steps?: number;
}

/**
 * 이미지 생성 응답
 */
export interface NanoBananaGenerateResponse {
  /** 성공 여부 */
  success: boolean;

  /** 생성된 이미지 URL 배열 */
  images: string[];

  /** 사용된 Seed */
  seed?: number;

  /** 생성 시간 (초) */
  generation_time?: number;

  /** 에러 메시지 */
  error?: string;
}

/**
 * 이미지 변형 요청 파라미터
 */
export interface NanoBananaVariationParams {
  /** 원본 이미지 URL 또는 Base64 */
  image: string;

  /** 변형 프롬프트 */
  prompt: string;

  /** 변형 강도 (0.0-1.0) */
  strength?: number;

  /** 기타 생성 파라미터 */
  style?: NanoBananaGenerateParams['style'];
  guidance_scale?: number;
  num_inference_steps?: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Nano Banana API 설정
 */
export interface NanoBananaConfig {
  /** API 엔드포인트 */
  apiUrl?: string;

  /** API 키 */
  apiKey?: string;

  /** 기본 스타일 */
  defaultStyle?: NanoBananaGenerateParams['style'];

  /** 기본 이미지 크기 */
  defaultSize?: NanoBananaGenerateParams['size'];

  /** 타임아웃 (ms) */
  timeout?: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * 간소화된 생성 이미지 정보
 */
export interface GeneratedImage {
  /** 이미지 URL */
  url: string;

  /** 생성 프롬프트 */
  prompt: string;

  /** 사용된 스타일 */
  style: string;

  /** 생성 시간 */
  createdAt: string;

  /** Seed (재생성용) */
  seed?: number;
}
