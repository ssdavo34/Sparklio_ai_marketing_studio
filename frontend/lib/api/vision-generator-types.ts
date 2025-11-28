/**
 * VisionGeneratorAgent API Type Definitions
 *
 * 백엔드 VisionGeneratorAgent 연동을 위한 타입 정의
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 *
 * Backend Reference:
 * - backend/app/services/agents/vision_generator.py
 * - backend/app/api/v1/endpoints/media_gateway.py
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * 이미지 생성 요청 (단일)
 */
export interface ImageGenerationRequest {
  prompt_text: string;
  negative_prompt?: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '3:4' | '4:3' | '2:3' | '3:2';
  style?: 'realistic' | 'illustration' | '3d' | 'anime';
  seed?: number;
  quality?: 'draft' | 'standard' | 'high';
}

/**
 * 이미지 생성 Provider
 */
export type ImageProvider = 'nanobanana' | 'comfyui' | 'dalle' | 'auto';

/**
 * VisionGeneratorAgent 입력
 */
export interface VisionGeneratorInput {
  prompts: ImageGenerationRequest[];
  provider?: ImageProvider;
  batch_mode?: boolean;
  max_concurrent?: number;
  brand_id?: string;
}

/**
 * 생성된 이미지 결과
 */
export interface GeneratedImage {
  image_id: string;
  prompt_text: string;
  image_url?: string;
  image_base64?: string;
  width: number;
  height: number;
  seed_used?: number;
  generation_time: number;
  status: 'completed' | 'failed' | 'pending';
  error?: string;
}

/**
 * VisionGeneratorAgent 출력
 */
export interface VisionGeneratorOutput {
  images: GeneratedImage[];
  total_requested: number;
  total_generated: number;
  total_failed: number;
  total_time: number;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * API 요청 페이로드
 */
export interface VisionGeneratorAPIRequest {
  prompts: ImageGenerationRequest[];
  provider?: ImageProvider;
  batch_mode?: boolean;
  max_concurrent?: number;
  brand_id?: string;
}

/**
 * API 응답 페이로드
 */
export interface VisionGeneratorAPIResponse {
  success: boolean;
  data: VisionGeneratorOutput;
  error?: string;
  metadata?: {
    processing_time: number;
    tokens_used?: number;
    cost?: number;
    agent_version?: string;
  };
}

/**
 * 에러 응답
 */
export interface VisionGeneratorErrorResponse {
  success: false;
  error: string;
  details?: Record<string, any>;
}

// ============================================================================
// Frontend-Specific Types
// ============================================================================

/**
 * 프론트엔드용 간소화된 요청
 */
export interface SimpleImageGenerationRequest {
  prompt: string;
  style?: 'realistic' | 'illustration' | '3d' | 'anime';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '3:4';
  seed?: number;
}

/**
 * Canvas 이미지 요소와 함께 전달되는 요청
 */
export interface CanvasImageGenerationRequest extends SimpleImageGenerationRequest {
  element?: any; // Polotno element
  elementId?: string;
}

/**
 * 프론트엔드용 생성 결과
 */
export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  prompt: string;
  seed?: number;
  error?: string;
  generationTime?: number;
}

/**
 * Provider 선택 옵션
 */
export interface ProviderConfig {
  provider: ImageProvider;
  fallbackProvider?: ImageProvider;
  maxRetries?: number;
}

// ============================================================================
// LLM Integration Types (Canvas Studio UI 연동)
// ============================================================================

/**
 * LLM Provider 매핑 (Canvas Studio UI와 Agent 연동)
 */
export type LLMProviderMapping = {
  'nano-banana': 'nanobanana';
  'comfy-ui': 'comfyui';
  'dall-e': 'dalle';
  'auto': 'auto';
};

/**
 * Canvas Studio의 ImageLLMProvider를 Agent Provider로 변환
 */
export function mapLLMProviderToAgent(
  llmProvider: 'nano-banana' | 'comfy-ui' | 'dall-e' | 'auto'
): ImageProvider {
  const mapping: Record<string, ImageProvider> = {
    'nano-banana': 'nanobanana',
    'comfy-ui': 'comfyui',
    'dall-e': 'dalle',
    'auto': 'auto',
  };
  return mapping[llmProvider] || 'auto';
}

/**
 * Agent Provider를 Canvas Studio UI 형식으로 변환
 */
export function mapAgentProviderToLLM(
  agentProvider: ImageProvider
): 'nano-banana' | 'comfy-ui' | 'dall-e' | 'auto' {
  const mapping: Record<ImageProvider, 'nano-banana' | 'comfy-ui' | 'dall-e' | 'auto'> = {
    nanobanana: 'nano-banana',
    comfyui: 'comfy-ui',
    dalle: 'dall-e',
    auto: 'auto',
  };
  return mapping[agentProvider] || 'auto';
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Aspect Ratio 변환 유틸리티
 */
export interface AspectRatioConfig {
  ratio: '1:1' | '16:9' | '9:16' | '3:4' | '4:3' | '2:3' | '3:2';
  width: number;
  height: number;
  description: string;
}

export const ASPECT_RATIOS: Record<string, AspectRatioConfig> = {
  '1:1': { ratio: '1:1', width: 1024, height: 1024, description: '정사각형' },
  '16:9': { ratio: '16:9', width: 1280, height: 720, description: '가로 (YouTube)' },
  '9:16': { ratio: '9:16', width: 720, height: 1280, description: '세로 (Shorts)' },
  '3:4': { ratio: '3:4', width: 768, height: 1024, description: '세로 (Instagram)' },
  '4:3': { ratio: '4:3', width: 1024, height: 768, description: '가로' },
  '2:3': { ratio: '2:3', width: 683, height: 1024, description: '세로 (포스터)' },
  '3:2': { ratio: '3:2', width: 1024, height: 683, description: '가로' },
};

/**
 * Image Style 정보
 */
export interface ImageStyleConfig {
  style: 'realistic' | 'illustration' | '3d' | 'anime';
  description: string;
  negativePrompt: string;
}

export const IMAGE_STYLES: Record<string, ImageStyleConfig> = {
  realistic: {
    style: 'realistic',
    description: '사실적인 사진 스타일',
    negativePrompt: 'illustration, cartoon, painting, anime, drawing',
  },
  illustration: {
    style: 'illustration',
    description: '일러스트레이션',
    negativePrompt: 'photo, realistic, 3d render',
  },
  '3d': {
    style: '3d',
    description: '3D 렌더링',
    negativePrompt: 'photo, realistic, flat, 2d',
  },
  anime: {
    style: 'anime',
    description: '애니메이션 스타일',
    negativePrompt: 'photo, realistic, western cartoon',
  },
};
