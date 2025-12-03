/**
 * ImageTab Store
 *
 * ImageTab v2 전용 상태 관리
 * - 채팅 메시지 (ImageTab 전용)
 * - Mixboard 레퍼런스 관리
 * - 생성된 이미지 관리
 * - 에셋 저장/캔버스 추가
 *
 * 핵심 설계: ChatPanel에서 sendWithImageGeneration() 호출 시
 * 이 Store가 이미지 생성 전체 플로우를 담당
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-12-03
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  MixRefImage,
  MixRole,
  GeneratedImage,
  ImageTabChatMessage,
  ImageProvider,
  PromptLLM,
  ImageTabSettings,
} from './types/imageTab';
import { ASPECT_RATIO_SIZES } from './types/imageTab';
import { getCanvasStore } from '../polotno/polotnoStoreSingleton';
import { useCanvasStore } from './useCanvasStore';
import { gatewayClient } from '@/lib/llm-gateway-client';
import {
  generateBatchImages as visionGenerateBatch,
  generateSingleImage as visionGenerateSingle,
} from '@/lib/api/vision-generator-api';
import type { GeneratedImage as VisionGeneratedImage } from '@/lib/api/vision-generator-types';
import {
  getGeneratedPreviewUrl,
  getGeneratedThumbUrl,
} from '@/lib/api/vision-generator-types';

// ============================================================================
// Types
// ============================================================================

interface ImageTabState {
  // 채팅 메시지 (ImageTab 전용)
  messages: ImageTabChatMessage[];
  isGenerating: boolean;

  // 설정
  settings: ImageTabSettings;

  // Mixboard
  mixRefs: MixRefImage[];
  isMixboardOpen: boolean;

  // 생성된 이미지
  generatedImages: GeneratedImage[];
  selectedImageIds: string[];

  // 에셋 저장 상태
  savingAssetIds: string[];

  // === Actions ===

  // 메시지
  addMessage: (msg: Omit<ImageTabChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<ImageTabChatMessage>) => void;
  clearMessages: () => void;

  // 이미지 생성 (ChatPanel에서 호출)
  sendWithImageGeneration: (userInput: string) => Promise<void>;

  // 설정
  updateSettings: (updates: Partial<ImageTabSettings>) => void;

  // Mixboard Actions
  addMixRef: (ref: Omit<MixRefImage, 'id' | 'createdAt'>) => void;
  updateMixRef: (id: string, updates: Partial<MixRefImage>) => void;
  removeMixRef: (id: string) => void;
  getMixRefsByGroup: (groupId: string) => MixRefImage[];
  getMixRefsByRole: (role: MixRole) => MixRefImage[];
  clearMixRefs: () => void;
  setMixboardOpen: (open: boolean) => void;
  toggleMixboard: () => void;

  // Image Actions
  addGeneratedImage: (image: GeneratedImage) => void;
  addGeneratedImages: (images: GeneratedImage[]) => void;
  selectImage: (id: string) => void;
  deselectImage: (id: string) => void;
  toggleImageSelection: (id: string) => void;
  clearSelection: () => void;

  // 캔버스 추가
  addToCanvas: (imageId: string) => Promise<void>;
  addSelectedToCanvas: () => Promise<void>;

  // 에셋 저장 (명시적)
  saveAsAsset: (imageId: string) => Promise<string | null>;
  saveSelectedAsAssets: () => Promise<string[]>;

  // 초기화
  clearGenerated: () => void;
  reset: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 한글 프롬프트를 영문 이미지 생성 프롬프트로 변환 (LLM 호출)
 */
async function translatePromptToEnglish(
  koreanPrompt: string,
  llm: PromptLLM
): Promise<string> {
  console.log(`[ImageTabStore] Translating prompt with LLM: ${llm}`);
  console.log(`[ImageTabStore] Original: ${koreanPrompt}`);

  // 한글이 없으면 그대로 반환 (이미 영문)
  const hasKorean = /[가-힣]/.test(koreanPrompt);
  if (!hasKorean) {
    console.log(`[ImageTabStore] No Korean detected, using original prompt`);
    return koreanPrompt;
  }

  try {
    // LLM Gateway를 통해 프롬프트 변환
    const systemPrompt = `You are an expert at creating image generation prompts.
Convert the user's Korean description into a detailed English prompt suitable for AI image generation.
Focus on: composition, lighting, style, colors, atmosphere, and specific details.
Output ONLY the English prompt, nothing else.`;

    const response = await gatewayClient.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: koreanPrompt },
      ],
      {
        model: llm === 'gpt-4o-mini' ? 'gpt-4o-mini' : llm === 'claude' ? 'claude-3-5-sonnet-latest' : 'qwen2.5:14b',
        temperature: 0.7,
        max_tokens: 500,
      }
    );

    const englishPrompt = response.trim();
    console.log(`[ImageTabStore] Translated: ${englishPrompt}`);
    return englishPrompt;
  } catch (error) {
    console.error('[ImageTabStore] Translation failed, using fallback:', error);
    // 실패 시 기본 영문 프롬프트 생성
    const fallbackPrompt = `A high quality professional photograph, ${koreanPrompt}, 8k resolution, detailed, sharp focus`;
    console.log(`[ImageTabStore] Fallback prompt: ${fallbackPrompt}`);
    return fallbackPrompt;
  }
}

/**
 * VisionGenerator API 결과를 ImageTab의 GeneratedImage로 변환
 */
function convertVisionResult(
  result: VisionGeneratedImage,
  prompt: string,
  negativePrompt: string | undefined,
  provider: ImageProvider | 'auto',
  width: number,
  height: number,
  mixRefs: MixRefImage[],
  generationTime: number
): GeneratedImage {
  // URL 추출 (3종 URL 시스템 사용)
  const previewUrl = getGeneratedPreviewUrl(result);
  const thumbUrl = getGeneratedThumbUrl(result);

  return {
    id: generateId(),
    url: previewUrl,
    thumbUrl: thumbUrl || previewUrl,
    prompt,
    negativePrompt,
    provider: provider === 'auto' ? 'zimage' : provider,
    width: result.width || width,
    height: result.height || height,
    seed: result.seed_used,
    mixRefs: mixRefs.length > 0 ? [...mixRefs] : undefined,
    createdAt: Date.now(),
    generationTime,
    savedAsAsset: false,
    addedToCanvas: false,
  };
}

/**
 * 이미지 생성 API 호출
 * VisionGeneratorAgent를 통해 실제 이미지 생성
 */
async function generateImages(
  prompt: string,
  negativePrompt: string | undefined,
  provider: ImageProvider | 'auto',
  width: number,
  height: number,
  batchSize: number,
  mixRefs: MixRefImage[],
  _steps?: number,
  seed?: number
): Promise<GeneratedImage[]> {
  console.log(`[ImageTabStore] Generating ${batchSize} images with ${provider}`);
  console.log(`[ImageTabStore] Prompt: ${prompt}`);
  console.log(`[ImageTabStore] Size: ${width}x${height}`);
  console.log(`[ImageTabStore] MixRefs: ${mixRefs.length}`);

  const startTime = Date.now();

  // aspect ratio 계산 (SimpleImageGenerationRequest에서 지원하는 값만 사용)
  // 지원: '1:1' | '16:9' | '9:16' | '3:4'
  type SupportedAspectRatio = '1:1' | '16:9' | '9:16' | '3:4';
  let aspectRatio: SupportedAspectRatio;

  if (width === height) {
    aspectRatio = '1:1';
  } else if (width > height) {
    // 가로 이미지: 16:9 사용 (4:3도 가로지만 3:4로 매핑 불가)
    aspectRatio = '16:9';
  } else {
    // 세로 이미지
    aspectRatio = height / width > 1.5 ? '9:16' : '3:4';
  }

  // Provider 매핑 (ImageTab의 provider → VisionGenerator의 provider)
  const visionProvider = provider === 'auto' ? 'auto' :
    provider === 'zimage' ? 'comfyui' : // zimage는 comfyui로 매핑
    provider === 'comfyui' ? 'comfyui' :
    provider === 'nanobanana' ? 'nanobanana' : 'auto';

  try {
    if (batchSize === 1) {
      // 단일 이미지 생성
      const result = await visionGenerateSingle(
        {
          prompt,
          aspectRatio,
          seed,
        },
        visionProvider as any
      );

      const generationTime = Date.now() - startTime;
      console.log(`[ImageTabStore] Single image generated in ${generationTime}ms`);

      return [convertVisionResult(
        result,
        prompt,
        negativePrompt,
        provider,
        width,
        height,
        mixRefs,
        generationTime
      )];
    } else {
      // 배치 이미지 생성
      const requests = Array.from({ length: batchSize }, (_, i) => ({
        prompt,
        aspectRatio,
        seed: seed ? seed + i : undefined,
      }));

      const results = await visionGenerateBatch(requests, visionProvider as any);

      const generationTime = Date.now() - startTime;
      console.log(`[ImageTabStore] ${results.length} images generated in ${generationTime}ms`);

      return results.map((result) =>
        convertVisionResult(
          result,
          prompt,
          negativePrompt,
          provider,
          width,
          height,
          mixRefs,
          Math.round(generationTime / batchSize)
        )
      );
    }
  } catch (error) {
    console.error('[ImageTabStore] Image generation failed:', error);

    // API 실패 시 Mock 이미지로 폴백 (개발/테스트용)
    console.log('[ImageTabStore] Falling back to mock images');
    const mockImages: GeneratedImage[] = [];
    const actualProvider: ImageProvider = provider === 'auto' ? 'zimage' : provider;

    for (let i = 0; i < batchSize; i++) {
      const mockSeed = seed ?? Math.floor(Math.random() * 1000000);
      const mockUrl = `https://picsum.photos/seed/${mockSeed + i}/${width}/${height}`;

      mockImages.push({
        id: generateId(),
        url: mockUrl,
        thumbUrl: `https://picsum.photos/seed/${mockSeed + i}/256/256`,
        prompt,
        negativePrompt,
        provider: actualProvider,
        width,
        height,
        seed: mockSeed + i,
        mixRefs: mixRefs.length > 0 ? [...mixRefs] : undefined,
        createdAt: Date.now(),
        generationTime: 1000,
        savedAsAsset: false,
        addedToCanvas: false,
      });
    }

    return mockImages;
  }
}

/**
 * 이미지 URL에서 Blob 데이터 가져오기
 */
async function fetchImageAsBlob(imageUrl: string): Promise<Blob> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  return response.blob();
}

/**
 * 에셋으로 저장 API 호출
 * Backend Asset API를 통해 이미지를 에셋으로 저장
 */
async function saveImageAsAsset(image: GeneratedImage): Promise<string | null> {
  console.log(`[ImageTabStore] Saving image as asset: ${image.id}`);

  try {
    // 1. 이미지 URL에서 Blob 데이터 가져오기
    const imageBlob = await fetchImageAsBlob(image.url);

    // 2. FormData 생성
    const formData = new FormData();

    // 파일 이름 생성 (prompt 일부 + timestamp)
    const fileName = `generated_${Date.now()}.png`;
    formData.append('file', imageBlob, fileName);

    // 메타데이터 추가
    formData.append('asset_type', 'image');
    formData.append('metadata', JSON.stringify({
      prompt: image.prompt,
      negativePrompt: image.negativePrompt,
      provider: image.provider,
      width: image.width,
      height: image.height,
      seed: image.seed,
      generationTime: image.generationTime,
      mixRefs: image.mixRefs,
      source: 'image-tab-generation',
    }));

    // 3. API 호출
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${API_BASE}/api/v1/assets`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ImageTabStore] Asset upload failed: ${response.status}`, errorText);
      throw new Error(`Asset upload failed: ${response.status}`);
    }

    const data = await response.json();
    const assetId = data.asset_id || data.id;

    console.log(`[ImageTabStore] Saved as asset: ${assetId}`);
    return assetId;
  } catch (error) {
    console.error('[ImageTabStore] Failed to save as asset:', error);

    // 실패 시 Mock ID 반환 (개발/테스트용)
    if (process.env.NODE_ENV === 'development') {
      console.log('[ImageTabStore] Falling back to mock asset ID');
      const mockAssetId = `mock-asset-${generateId()}`;
      return mockAssetId;
    }

    return null;
  }
}

// ============================================================================
// Default Settings
// ============================================================================

const defaultSettings: ImageTabSettings = {
  promptLLM: 'gpt-4o-mini',
  imageLLM: 'zimage',
  aspectRatio: '1:1',
  batchSize: 1,
  steps: 8,
  negativePrompt: 'blurry, low quality, distorted, deformed',
};

// ============================================================================
// Store
// ============================================================================

export const useImageTabStore = create<ImageTabState>()(
  devtools(
    (set, get) => ({
      // Initial State
      messages: [],
      isGenerating: false,
      settings: defaultSettings,
      mixRefs: [],
      isMixboardOpen: false,
      generatedImages: [],
      selectedImageIds: [],
      savingAssetIds: [],

      // === Message Actions ===

      addMessage: (msg) => {
        const newMessage: ImageTabChatMessage = {
          ...msg,
          id: generateId(),
          timestamp: Date.now(),
        };
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      },

      updateMessage: (id, updates) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        }));
      },

      clearMessages: () => {
        set({ messages: [] });
      },

      // === Main Image Generation Flow ===

      sendWithImageGeneration: async (userInput: string) => {
        const { settings, mixRefs, addMessage, updateMessage, addGeneratedImages } = get();

        console.log(`[ImageTabStore] sendWithImageGeneration: ${userInput}`);

        // 1. 사용자 메시지 추가
        const userMsgId = generateId();
        addMessage({
          role: 'user',
          content: userInput,
          originalPrompt: userInput,
        });

        // 2. 생성 중 상태 설정
        set({ isGenerating: true });

        // 3. 어시스턴트 메시지 추가 (생성 중)
        const assistantMsgId = generateId();
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: assistantMsgId,
              role: 'assistant' as const,
              content: '이미지를 생성하고 있습니다...',
              timestamp: Date.now(),
              isGenerating: true,
            },
          ],
        }));

        try {
          // 4. 프롬프트 번역 (한글 → 영문)
          const englishPrompt = await translatePromptToEnglish(
            userInput,
            settings.promptLLM
          );

          // 5. 이미지 생성
          const { width, height } = ASPECT_RATIO_SIZES[settings.aspectRatio];
          const generatedImages = await generateImages(
            englishPrompt,
            settings.negativePrompt,
            settings.imageLLM,
            width,
            height,
            settings.batchSize,
            mixRefs,
            settings.steps,
            settings.seed
          );

          // 6. 생성된 이미지 저장
          addGeneratedImages(generatedImages);

          // 7. 어시스턴트 메시지 업데이트
          updateMessage(assistantMsgId, {
            content: `${generatedImages.length}개의 이미지가 생성되었습니다.`,
            isGenerating: false,
            generatedImages,
            translatedPrompt: englishPrompt,
          });

          console.log(`[ImageTabStore] Generation complete: ${generatedImages.length} images`);
        } catch (error) {
          console.error('[ImageTabStore] Generation failed:', error);

          // 에러 메시지 업데이트
          updateMessage(assistantMsgId, {
            content: `이미지 생성에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
            isGenerating: false,
          });
        } finally {
          set({ isGenerating: false });
        }
      },

      // === Settings Actions ===

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      // === Mixboard Actions ===

      addMixRef: (ref) => {
        const newRef: MixRefImage = {
          ...ref,
          id: generateId(),
          createdAt: Date.now(),
        };
        set((state) => ({
          mixRefs: [...state.mixRefs, newRef],
        }));
        console.log(`[ImageTabStore] Added MixRef: ${newRef.id}, role=${newRef.role}`);
      },

      updateMixRef: (id, updates) => {
        set((state) => ({
          mixRefs: state.mixRefs.map((ref) =>
            ref.id === id ? { ...ref, ...updates } : ref
          ),
        }));
      },

      removeMixRef: (id) => {
        set((state) => ({
          mixRefs: state.mixRefs.filter((ref) => ref.id !== id),
        }));
        console.log(`[ImageTabStore] Removed MixRef: ${id}`);
      },

      getMixRefsByGroup: (groupId) => {
        return get().mixRefs.filter((ref) => ref.groupId === groupId);
      },

      getMixRefsByRole: (role) => {
        return get().mixRefs.filter((ref) => ref.role === role);
      },

      clearMixRefs: () => {
        set({ mixRefs: [] });
        console.log('[ImageTabStore] Cleared all MixRefs');
      },

      setMixboardOpen: (open) => {
        set({ isMixboardOpen: open });
      },

      toggleMixboard: () => {
        set((state) => ({ isMixboardOpen: !state.isMixboardOpen }));
      },

      // === Image Actions ===

      addGeneratedImage: (image) => {
        set((state) => ({
          generatedImages: [image, ...state.generatedImages],
        }));
      },

      addGeneratedImages: (images) => {
        set((state) => ({
          generatedImages: [...images, ...state.generatedImages],
        }));
      },

      selectImage: (id) => {
        set((state) => ({
          selectedImageIds: state.selectedImageIds.includes(id)
            ? state.selectedImageIds
            : [...state.selectedImageIds, id],
        }));
      },

      deselectImage: (id) => {
        set((state) => ({
          selectedImageIds: state.selectedImageIds.filter((i) => i !== id),
        }));
      },

      toggleImageSelection: (id) => {
        set((state) => ({
          selectedImageIds: state.selectedImageIds.includes(id)
            ? state.selectedImageIds.filter((i) => i !== id)
            : [...state.selectedImageIds, id],
        }));
      },

      clearSelection: () => {
        set({ selectedImageIds: [] });
      },

      // === Canvas Actions ===

      addToCanvas: async (imageId) => {
        const image = get().generatedImages.find((img) => img.id === imageId);
        if (!image) {
          console.warn(`[ImageTabStore] Image not found: ${imageId}`);
          return;
        }

        console.log(`[ImageTabStore] Adding image to canvas: ${imageId}`);

        // 현재 활성 캔버스 가져오기
        const activeCanvasType = useCanvasStore.getState().activeCanvasType;
        const polotnoStore = getCanvasStore(activeCanvasType);

        if (!polotnoStore) {
          console.warn('[ImageTabStore] Polotno store not available');
          return;
        }

        // 현재 페이지에 이미지 추가
        // activePage는 페이지 ID이므로 find로 찾거나 첫 페이지 사용
        const currentPage = polotnoStore.pages.find((p: any) => p.id === polotnoStore.activePage) || polotnoStore.pages[0];
        if (currentPage) {
          const pageWidth = typeof currentPage.width === 'number' ? currentPage.width : 1080;
          const pageHeight = typeof currentPage.height === 'number' ? currentPage.height : 1920;

          currentPage.addElement({
            type: 'image',
            src: image.url,
            x: 100,
            y: 100,
            width: Math.min(image.width, pageWidth - 200),
            height: Math.min(image.height, pageHeight - 200),
          });

          // 상태 업데이트
          set((state) => ({
            generatedImages: state.generatedImages.map((img) =>
              img.id === imageId ? { ...img, addedToCanvas: true } : img
            ),
          }));

          console.log(`[ImageTabStore] Image added to canvas: ${imageId}`);
        }
      },

      addSelectedToCanvas: async () => {
        const { selectedImageIds, addToCanvas } = get();
        console.log(`[ImageTabStore] Adding ${selectedImageIds.length} selected images to canvas`);

        for (const imageId of selectedImageIds) {
          await addToCanvas(imageId);
        }

        // 선택 해제
        set({ selectedImageIds: [] });
      },

      // === Asset Actions ===

      saveAsAsset: async (imageId) => {
        const image = get().generatedImages.find((img) => img.id === imageId);
        if (!image) {
          console.warn(`[ImageTabStore] Image not found: ${imageId}`);
          return null;
        }

        if (image.savedAsAsset) {
          console.log(`[ImageTabStore] Image already saved as asset: ${imageId}`);
          return image.assetId || null;
        }

        // 저장 중 상태
        set((state) => ({
          savingAssetIds: [...state.savingAssetIds, imageId],
        }));

        try {
          const assetId = await saveImageAsAsset(image);

          if (assetId) {
            // 상태 업데이트
            set((state) => ({
              generatedImages: state.generatedImages.map((img) =>
                img.id === imageId
                  ? { ...img, savedAsAsset: true, assetId }
                  : img
              ),
              savingAssetIds: state.savingAssetIds.filter((id) => id !== imageId),
            }));

            console.log(`[ImageTabStore] Image saved as asset: ${imageId} → ${assetId}`);
            return assetId;
          }

          return null;
        } catch (error) {
          console.error(`[ImageTabStore] Failed to save asset: ${imageId}`, error);

          set((state) => ({
            savingAssetIds: state.savingAssetIds.filter((id) => id !== imageId),
          }));

          return null;
        }
      },

      saveSelectedAsAssets: async () => {
        const { selectedImageIds, saveAsAsset } = get();
        console.log(`[ImageTabStore] Saving ${selectedImageIds.length} selected images as assets`);

        const assetIds: string[] = [];

        for (const imageId of selectedImageIds) {
          const assetId = await saveAsAsset(imageId);
          if (assetId) {
            assetIds.push(assetId);
          }
        }

        // 선택 해제
        set({ selectedImageIds: [] });

        return assetIds;
      },

      // === Reset Actions ===

      clearGenerated: () => {
        set({
          generatedImages: [],
          selectedImageIds: [],
        });
        console.log('[ImageTabStore] Cleared generated images');
      },

      reset: () => {
        set({
          messages: [],
          isGenerating: false,
          settings: defaultSettings,
          mixRefs: [],
          isMixboardOpen: false,
          generatedImages: [],
          selectedImageIds: [],
          savingAssetIds: [],
        });
        console.log('[ImageTabStore] Store reset');
      },
    }),
    {
      name: 'ImageTabStore',
    }
  )
);

// ============================================================================
// Selectors (for performance optimization)
// ============================================================================

export const selectMessages = (state: ImageTabState) => state.messages;
export const selectIsGenerating = (state: ImageTabState) => state.isGenerating;
export const selectSettings = (state: ImageTabState) => state.settings;
export const selectMixRefs = (state: ImageTabState) => state.mixRefs;
export const selectGeneratedImages = (state: ImageTabState) => state.generatedImages;
export const selectSelectedImageIds = (state: ImageTabState) => state.selectedImageIds;
export const selectSelectedImages = (state: ImageTabState) =>
  state.generatedImages.filter((img) => state.selectedImageIds.includes(img.id));
