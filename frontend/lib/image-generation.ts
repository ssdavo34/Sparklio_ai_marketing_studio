/**
 * Image Generation Service
 *
 * Z-Image API 연동을 통한 이미지 생성
 * - SDXL 기반 고품질 이미지 생성
 * - 배치 생성 지원
 * - 프로그레스 콜백
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-05
 */

import type { ImageSlot } from '@/types/htmlTemplates';

// =============================================================================
// Types
// =============================================================================

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  seed?: number;
  generationTime?: number;
}

export interface BatchGenerationProgress {
  total: number;
  completed: number;
  current: string;
  results: Map<string, ImageGenerationResponse>;
}

export type ProgressCallback = (progress: BatchGenerationProgress) => void;

// =============================================================================
// Configuration
// =============================================================================

const ZIMAGE_BASE_URL = process.env.NEXT_PUBLIC_ZIMAGE_URL || 'http://100.120.180.42:7860';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.123.51.5:8000';

// 종횡비별 해상도 매핑
const ASPECT_RATIO_SIZES: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '4:3': { width: 1152, height: 896 },
  '3:4': { width: 896, height: 1152 },
};

// =============================================================================
// Direct Z-Image API (GPU 서버 직접 호출)
// =============================================================================

/**
 * Z-Image API로 직접 이미지 생성
 */
export async function generateImageDirect(
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
  try {
    const response = await fetch(`${ZIMAGE_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: request.prompt,
        negative_prompt: request.negativePrompt || 'blurry, low quality, distorted, watermark, text',
        width: request.width || 1024,
        height: request.height || 1024,
        steps: request.steps || 8,
        seed: request.seed,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Image generation failed' }));
      return {
        success: false,
        error: error.detail || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      imageUrl: data.image_url || data.url,
      seed: data.seed,
      generationTime: data.generation_time,
    };
  } catch (error) {
    console.error('[generateImageDirect] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// =============================================================================
// Backend Proxy API (MinIO 저장 포함)
// =============================================================================

/**
 * Backend를 통한 이미지 생성 (MinIO 저장 포함)
 *
 * Backend API: POST /api/v1/media/generate
 * - prompt: 생성 프롬프트
 * - task: 작업 유형 (product_image, brand_logo, sns_thumbnail)
 * - media_type: 미디어 타입 (image, video, audio)
 * - options: 추가 옵션 (width, height, steps, negative_prompt 등)
 */
export async function generateImageViaBackend(
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
  try {
    // Backend Media Gateway API 호출 (/api/v1/media/generate)
    const response = await fetch(`${BACKEND_URL}/api/v1/media/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: request.prompt,
        task: 'product_image',  // 기본 작업 유형
        media_type: 'image',
        options: {
          width: request.width || 1024,
          height: request.height || 1024,
          steps: request.steps || 8,
          negative_prompt: request.negativePrompt || 'blurry, low quality, distorted, watermark, text',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Image generation failed' }));
      return {
        success: false,
        error: error.detail || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    // Backend 응답에서 outputs 배열의 첫 번째 이미지 URL 추출
    const imageUrl = data.outputs?.[0]?.url || data.outputs?.[0]?.data;

    if (!imageUrl) {
      return {
        success: false,
        error: 'No image URL in response',
      };
    }

    return {
      success: true,
      imageUrl,
      seed: data.meta?.seed,
    };
  } catch (error) {
    console.error('[generateImageViaBackend] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// =============================================================================
// Batch Generation
// =============================================================================

/**
 * 여러 이미지 슬롯에 대해 배치 생성
 */
export async function generateImagesForSlots(
  slots: ImageSlot[],
  onProgress?: ProgressCallback,
  useBackend: boolean = true
): Promise<Map<string, ImageGenerationResponse>> {
  const results = new Map<string, ImageGenerationResponse>();
  const generateFn = useBackend ? generateImageViaBackend : generateImageDirect;

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];

    // 프로그레스 업데이트
    if (onProgress) {
      onProgress({
        total: slots.length,
        completed: i,
        current: slot.id,
        results,
      });
    }

    // 프롬프트가 없으면 건너뛰기
    if (!slot.prompt) {
      results.set(slot.id, {
        success: false,
        error: 'No prompt provided',
      });
      continue;
    }

    // 이미지 생성
    const result = await generateFn({
      prompt: slot.prompt,
      width: slot.width,
      height: slot.height,
    });

    results.set(slot.id, result);

    // 성공 시 슬롯 업데이트 (참조 업데이트)
    if (result.success && result.imageUrl) {
      slot.generatedUrl = result.imageUrl;
      slot.status = 'completed';
    } else {
      slot.status = 'failed';
    }
  }

  // 최종 프로그레스
  if (onProgress) {
    onProgress({
      total: slots.length,
      completed: slots.length,
      current: '',
      results,
    });
  }

  return results;
}

// =============================================================================
// Aspect Ratio Helpers
// =============================================================================

/**
 * 종횡비에 맞는 해상도 반환
 */
export function getResolutionForAspectRatio(
  aspectRatio: string
): { width: number; height: number } {
  return ASPECT_RATIO_SIZES[aspectRatio] || ASPECT_RATIO_SIZES['1:1'];
}

/**
 * 이미지 슬롯의 종횡비 계산
 */
export function calculateAspectRatio(width: number, height: number): string {
  const ratio = width / height;

  if (Math.abs(ratio - 1) < 0.1) return '1:1';
  if (Math.abs(ratio - 16 / 9) < 0.1) return '16:9';
  if (Math.abs(ratio - 9 / 16) < 0.1) return '9:16';
  if (Math.abs(ratio - 4 / 3) < 0.1) return '4:3';
  if (Math.abs(ratio - 3 / 4) < 0.1) return '3:4';

  return width > height ? '16:9' : '9:16';
}

// =============================================================================
// Health Check
// =============================================================================

/**
 * Z-Image 서버 상태 확인
 */
export async function checkZImageHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${ZIMAGE_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// =============================================================================
// Image Slot Update Helpers
// =============================================================================

/**
 * 이미지 슬롯 상태 업데이트
 */
export function updateSlotStatus(
  slots: ImageSlot[],
  slotId: string,
  status: ImageSlot['status'],
  generatedUrl?: string
): ImageSlot[] {
  return slots.map(slot => {
    if (slot.id === slotId) {
      return {
        ...slot,
        status,
        generatedUrl: generatedUrl || slot.generatedUrl,
      };
    }
    return slot;
  });
}

/**
 * 모든 이미지 슬롯의 생성 상태 확인
 */
export function areAllImagesGenerated(slots: ImageSlot[]): boolean {
  return slots.every(slot => slot.status === 'completed');
}

/**
 * 실패한 이미지 슬롯 필터링
 */
export function getFailedSlots(slots: ImageSlot[]): ImageSlot[] {
  return slots.filter(slot => slot.status === 'failed');
}

/**
 * 대기 중인 이미지 슬롯 필터링
 */
export function getPendingSlots(slots: ImageSlot[]): ImageSlot[] {
  return slots.filter(slot => slot.status === 'pending');
}

export default {
  generateImageDirect,
  generateImageViaBackend,
  generateImagesForSlots,
  checkZImageHealth,
  getResolutionForAspectRatio,
};
