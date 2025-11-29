/**
 * useImageGeneration Hook
 *
 * VisionGeneratorAgent를 통한 AI 이미지 생성 Hook
 * - 백엔드 Agent 통합
 * - 여러 Provider 지원 (Nano Banana, ComfyUI, DALL-E)
 * - 자동 Provider 선택 또는 수동 선택
 * - 배치 처리 및 진행 상태 추적
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-11-28
 */

'use client';

import { useState, useCallback } from 'react';
import {
  generateBatchImages,
  generateSingleImage as generateSingleViaAgent,
  getVisionGeneratorErrorMessage,
} from '@/lib/api/vision-generator-api';
import type {
  ImageProvider,
  SimpleImageGenerationRequest,
  GeneratedImage,
} from '@/lib/api/vision-generator-types';
import type { ImageLLMProvider } from '@/components/canvas-studio/stores/types/llm';
import { createNanoBananaMetadata, updateImageSource } from '@/lib/canvas/image-metadata';

// ============================================================================
// Types
// ============================================================================

export interface ImageGenerationRequest {
  prompt: string;
  style?: 'realistic' | 'illustration' | '3d' | 'anime';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '3:4';
  seed?: number;
  element?: any; // Polotno element to update
  elementId?: string; // Alternative: element ID
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string; // Legacy: preview_url 사용 권장
  prompt: string;
  seed?: number;
  error?: string;
  generationTime?: number;
  // 3종 URL (2025-11-30 추가)
  assetId?: string;
  originalUrl?: string;
  previewUrl?: string;
  thumbUrl?: string;
}

export interface UseImageGenerationOptions {
  provider?: ImageLLMProvider; // UI LLM Provider (auto, nanobanana, comfyui, dalle, etc.)
  brandId?: string;
  maxConcurrent?: number;
}

export interface UseImageGenerationReturn {
  isGenerating: boolean;
  progress: number; // 0-100
  results: ImageGenerationResult[];
  error: string | null;
  currentProvider: ImageProvider | null; // 실제 사용된 Provider
  generateImages: (
    requests: ImageGenerationRequest[],
    options?: UseImageGenerationOptions
  ) => Promise<void>;
  generateSingleImage: (
    request: ImageGenerationRequest,
    options?: UseImageGenerationOptions
  ) => Promise<ImageGenerationResult>;
  reset: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * UI LLM Provider를 Agent Provider로 변환
 */
function mapUIProviderToAgent(uiProvider?: ImageLLMProvider): ImageProvider {
  if (!uiProvider || uiProvider === 'auto') return 'auto';

  const mapping: Record<string, ImageProvider> = {
    nanobanana: 'nanobanana',
    'nano-banana': 'nanobanana',
    comfyui: 'comfyui',
    'comfy-ui': 'comfyui',
    dalle: 'dalle',
    'dall-e': 'dalle',
    auto: 'auto',
  };

  return mapping[uiProvider] || 'auto';
}

/**
 * GeneratedImage를 ImageGenerationResult로 변환
 *
 * 3종 URL 우선순위:
 * - 캔버스 표시: preview_url (1080px) 권장
 * - 다운로드/원본: original_url
 * - 썸네일/그리드: thumb_url (200px)
 * - Legacy fallback: image_url
 */
function convertToResult(
  generatedImage: GeneratedImage,
  request: ImageGenerationRequest
): ImageGenerationResult {
  // 3종 URL 또는 legacy image_url 확인
  const hasValidUrl =
    generatedImage.preview_url ||
    generatedImage.original_url ||
    generatedImage.image_url;

  if (generatedImage.status === 'completed' && hasValidUrl) {
    // 캔버스 표시용 URL 결정 (preview_url 우선)
    const displayUrl =
      generatedImage.preview_url ||
      generatedImage.original_url ||
      generatedImage.image_url ||
      '';

    // Element 업데이트 (있는 경우)
    if (request.element) {
      const metadata = createNanoBananaMetadata(
        request.prompt,
        request.style || 'realistic',
        generatedImage.seed_used
      );

      updateImageSource(request.element, displayUrl, metadata);
    }

    return {
      success: true,
      imageUrl: displayUrl, // Legacy 호환
      prompt: request.prompt,
      seed: generatedImage.seed_used,
      generationTime: generatedImage.generation_time,
      // 3종 URL
      assetId: generatedImage.asset_id,
      originalUrl: generatedImage.original_url,
      previewUrl: generatedImage.preview_url,
      thumbUrl: generatedImage.thumb_url,
    };
  } else {
    return {
      success: false,
      prompt: request.prompt,
      error: generatedImage.error || '이미지 생성 실패',
    };
  }
}

// ============================================================================
// Hook
// ============================================================================

/**
 * 이미지 생성 Hook
 *
 * @example
 * // 자동 Provider 선택
 * const { isGenerating, progress, generateImages } = useImageGeneration();
 * await generateImages([
 *   { prompt: 'A sunset', style: 'realistic' },
 *   { prompt: 'A mountain', style: 'realistic' },
 * ], { provider: 'auto' });
 *
 * @example
 * // 특정 Provider 지정
 * await generateImages([...], { provider: 'nanobanana' });
 *
 * @example
 * // Canvas element와 함께 사용
 * await generateImages([
 *   { prompt: 'A sunset', element: imageElement1 },
 * ]);
 */
export function useImageGeneration(): UseImageGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImageGenerationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<ImageProvider | null>(null);

  const reset = useCallback(() => {
    setIsGenerating(false);
    setProgress(0);
    setResults([]);
    setError(null);
    setCurrentProvider(null);
  }, []);

  /**
   * 단일 이미지 생성
   */
  const generateSingleImage = useCallback(
    async (
      request: ImageGenerationRequest,
      options?: UseImageGenerationOptions
    ): Promise<ImageGenerationResult> => {
      const provider = mapUIProviderToAgent(options?.provider);
      setCurrentProvider(provider);

      try {
        console.log('[useImageGeneration] Generating single image:', {
          prompt: request.prompt.substring(0, 50) + '...',
          style: request.style,
          provider,
        });

        const simpleRequest: SimpleImageGenerationRequest = {
          prompt: request.prompt,
          style: request.style || 'realistic',
          aspectRatio: request.aspectRatio || '1:1',
          seed: request.seed,
        };

        const generatedImage = await generateSingleViaAgent(
          simpleRequest,
          provider,
          options?.brandId
        );

        return convertToResult(generatedImage, request);
      } catch (err: any) {
        const errorMessage = getVisionGeneratorErrorMessage(err);
        console.error('[useImageGeneration] Single generation failed:', err);

        return {
          success: false,
          prompt: request.prompt,
          error: errorMessage,
        };
      }
    },
    []
  );

  /**
   * 여러 이미지 배치 생성
   */
  const generateImages = useCallback(
    async (
      requests: ImageGenerationRequest[],
      options?: UseImageGenerationOptions
    ) => {
      if (requests.length === 0) {
        console.warn('[useImageGeneration] No requests provided');
        return;
      }

      const provider = mapUIProviderToAgent(options?.provider);

      setIsGenerating(true);
      setProgress(0);
      setResults([]);
      setError(null);
      setCurrentProvider(provider);

      const totalRequests = requests.length;

      console.log('[useImageGeneration] Starting batch generation:', {
        count: totalRequests,
        provider,
        brandId: options?.brandId,
      });

      try {
        // VisionGeneratorAgent 배치 요청 생성
        const simpleRequests: SimpleImageGenerationRequest[] = requests.map((req) => ({
          prompt: req.prompt,
          style: req.style || 'realistic',
          aspectRatio: req.aspectRatio || '1:1',
          seed: req.seed,
        }));

        // 배치 생성 시작
        const generatedImages = await generateBatchImages(simpleRequests, provider, {
          maxConcurrent: options?.maxConcurrent || 3,
          brandId: options?.brandId,
        });

        // 결과 변환
        const newResults: ImageGenerationResult[] = generatedImages.map((generatedImage, index) => {
          const request = requests[index];
          return convertToResult(generatedImage, request);
        });

        setResults(newResults);
        setProgress(100);

        // 실패 집계
        const failedCount = newResults.filter((r) => !r.success).length;
        const successCount = totalRequests - failedCount;

        if (failedCount > 0) {
          setError(
            `${failedCount}/${totalRequests}개 이미지 생성 실패. 개별 편집에서 재시도하세요.`
          );
        }

        console.log('[useImageGeneration] Batch complete:', {
          total: totalRequests,
          success: successCount,
          failed: failedCount,
          provider: currentProvider,
        });
      } catch (err: any) {
        const errorMessage = getVisionGeneratorErrorMessage(err);
        setError(`배치 생성 실패: ${errorMessage}`);
        console.error('[useImageGeneration] Batch generation failed:', err);

        // 부분 실패 처리: 순차적으로 재시도
        console.log('[useImageGeneration] Falling back to sequential generation...');

        const newResults: ImageGenerationResult[] = [];

        for (let i = 0; i < requests.length; i++) {
          const request = requests[i];

          console.log(
            `[useImageGeneration] Generating ${i + 1}/${totalRequests}: "${request.prompt.substring(0, 30)}..."`
          );

          const result = await generateSingleImage(request, options);
          newResults.push(result);

          // 진행률 업데이트
          const currentProgress = Math.round(((i + 1) / totalRequests) * 100);
          setProgress(currentProgress);
          setResults([...newResults]);

          // 실패한 경우에도 계속 진행 (부분 성공 허용)
          if (!result.success) {
            console.warn(
              `[useImageGeneration] Failed to generate image ${i + 1}: ${result.error}`
            );
          }
        }

        // 최종 실패 집계
        const failedCount = newResults.filter((r) => !r.success).length;
        if (failedCount > 0) {
          setError(
            `${failedCount}/${totalRequests}개 이미지 생성 실패. 개별 편집에서 재시도하세요.`
          );
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [generateSingleImage, currentProvider]
  );

  return {
    isGenerating,
    progress,
    results,
    error,
    currentProvider,
    generateImages,
    generateSingleImage,
    reset,
  };
}
