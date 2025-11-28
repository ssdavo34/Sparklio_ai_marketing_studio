/**
 * useImageGeneration Hook
 *
 * Canvas 이미지를 Nano Banana AI로 자동 생성하는 React Hook
 * - 여러 이미지를 배치로 생성
 * - 진행 상태 추적
 * - 에러 처리 및 재시도
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 */

'use client';

import { useState, useCallback } from 'react';
import { generateBatch, getNanoBananaErrorMessage } from '@/lib/api/nano-banana-api';
import { createNanoBananaMetadata, updateImageSource } from '@/lib/canvas/image-metadata';
import type { NanoBananaGenerateParams } from '@/lib/api/nano-banana-types';
import type { GeneratedImage } from '@/lib/api/nano-banana-types';

export interface ImageGenerationRequest {
  prompt: string;
  style?: NanoBananaGenerateParams['style'];
  element?: any; // Polotno element to update
  elementId?: string; // Alternative: element ID
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  prompt: string;
  error?: string;
}

export interface UseImageGenerationReturn {
  isGenerating: boolean;
  progress: number; // 0-100
  results: ImageGenerationResult[];
  error: string | null;
  generateImages: (requests: ImageGenerationRequest[]) => Promise<void>;
  generateSingleImage: (request: ImageGenerationRequest) => Promise<ImageGenerationResult>;
  reset: () => void;
}

/**
 * 이미지 생성 Hook
 *
 * @example
 * const { isGenerating, progress, generateImages } = useImageGeneration();
 *
 * await generateImages([
 *   { prompt: 'A sunset', element: imageElement1 },
 *   { prompt: 'A mountain', element: imageElement2 },
 * ]);
 */
export function useImageGeneration(): UseImageGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImageGenerationResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsGenerating(false);
    setProgress(0);
    setResults([]);
    setError(null);
  }, []);

  /**
   * 단일 이미지 생성
   */
  const generateSingleImage = useCallback(
    async (request: ImageGenerationRequest): Promise<ImageGenerationResult> => {
      try {
        const response = await generateBatch(
          [request.prompt],
          request.style || 'realistic'
        );

        if (response.length === 0) {
          throw new Error('이미지 생성 실패');
        }

        const generatedImage = response[0];

        // Element 업데이트 (있는 경우)
        if (request.element) {
          const metadata = createNanoBananaMetadata(
            request.prompt,
            request.style || 'realistic',
            generatedImage.seed
          );

          updateImageSource(request.element, generatedImage.url, metadata);
        }

        return {
          success: true,
          imageUrl: generatedImage.url,
          prompt: request.prompt,
        };
      } catch (err: any) {
        const errorMessage = getNanoBananaErrorMessage(err);
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
    async (requests: ImageGenerationRequest[]) => {
      if (requests.length === 0) {
        console.warn('[useImageGeneration] No requests provided');
        return;
      }

      setIsGenerating(true);
      setProgress(0);
      setResults([]);
      setError(null);

      const newResults: ImageGenerationResult[] = [];
      const totalRequests = requests.length;

      try {
        // 순차적으로 생성 (API rate limit 고려)
        for (let i = 0; i < requests.length; i++) {
          const request = requests[i];

          console.log(
            `[useImageGeneration] Generating ${i + 1}/${totalRequests}: "${request.prompt}"`
          );

          const result = await generateSingleImage(request);
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

        // 모든 생성 완료
        const failedCount = newResults.filter((r) => !r.success).length;
        if (failedCount > 0) {
          setError(
            `${failedCount}/${totalRequests}개 이미지 생성 실패. 개별 편집에서 재시도하세요.`
          );
        }

        console.log(
          `[useImageGeneration] Batch complete: ${totalRequests - failedCount}/${totalRequests} succeeded`
        );
      } catch (err: any) {
        const errorMessage = getNanoBananaErrorMessage(err);
        setError(`배치 생성 실패: ${errorMessage}`);
        console.error('[useImageGeneration] Batch generation failed:', err);
      } finally {
        setIsGenerating(false);
      }
    },
    [generateSingleImage]
  );

  return {
    isGenerating,
    progress,
    results,
    error,
    generateImages,
    generateSingleImage,
    reset,
  };
}
