/**
 * ImageTab Types
 *
 * ImageTab v2 전용 타입 정의
 * - MixRefImage: 유연한 분류 시스템 (tags, groupId, note)
 * - GeneratedImage: 생성된 이미지 + 에셋 저장 상태
 * - ImageTabChatMessage: ImageTab 전용 채팅 메시지
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-12-03
 */

// ============================================================================
// Mixboard Types
// ============================================================================

/**
 * MixRole - 큰 버킷 카테고리 (6+1개)
 *
 * 상세 분류는 tags[]로 처리
 * 예: role='product', tags=['cosmetics', 'lipstick', 'red', 'matte']
 */
export type MixRole =
  | 'character'    // 인물/모델
  | 'outfit'       // 의상 (상의, 하의, 원피스 등)
  | 'accessory'    // 액세서리 (가방, 신발, 모자, 안경 등)
  | 'product'      // 제품 (화장품, 주얼리, 전자기기 등)
  | 'background'   // 배경/장면
  | 'style'        // 스타일 레퍼런스
  | 'other';       // 기타

/**
 * MixRefImage - Mixboard 레퍼런스 이미지
 *
 * 유연한 분류 시스템:
 * - role: 큰 버킷 (7종류)
 * - tags: 상세 태그 배열 (무제한)
 * - note: 사용자 메모
 * - groupId: 그룹 연결 (다중 인물 시나리오)
 *
 * @example
 * {
 *   id: 'ref-1',
 *   url: '/assets/model-a.jpg',
 *   role: 'character',
 *   tags: ['female', 'asian', 'model', '20s'],
 *   note: '메인 모델 A - 밝은 표정',
 *   weight: 1.0,
 *   groupId: 'model_A'
 * }
 */
export interface MixRefImage {
  id: string;
  url: string;                    // 원본 URL
  thumbUrl?: string;              // 썸네일 URL
  role: MixRole;                  // 큰 버킷 분류
  tags: string[];                 // 상세 태그 ['cosmetics', 'lipstick', 'red']
  note?: string;                  // 사용자 메모 "메인 모델 A의 립스틱"
  weight: number;                 // 영향도 0.0-1.0
  groupId?: string;               // 그룹 ID 'model_A', 'model_B'
  createdAt: number;              // 타임스탬프
}

/**
 * MixRole 한글 레이블
 */
export const MIX_ROLE_LABELS: Record<MixRole, string> = {
  character: '인물/모델',
  outfit: '의상',
  accessory: '액세서리',
  product: '제품',
  background: '배경',
  style: '스타일',
  other: '기타',
};

/**
 * MixRole 기본 태그 제안
 */
export const MIX_ROLE_SUGGESTED_TAGS: Record<MixRole, string[]> = {
  character: ['male', 'female', 'asian', 'western', 'model', 'child', 'elderly'],
  outfit: ['top', 'bottom', 'dress', 'jacket', 'coat', 'casual', 'formal'],
  accessory: ['bag', 'shoes', 'hat', 'glasses', 'watch', 'scarf', 'belt'],
  product: ['cosmetics', 'jewelry', 'electronics', 'food', 'drink', 'furniture'],
  background: ['indoor', 'outdoor', 'studio', 'nature', 'urban', 'minimal'],
  style: ['modern', 'vintage', 'luxury', 'casual', 'minimalist', 'colorful'],
  other: [],
};

// ============================================================================
// Generated Image Types
// ============================================================================

/**
 * 이미지 생성 Provider
 */
export type ImageProvider = 'zimage' | 'comfyui' | 'nanobanana';

/**
 * 프롬프트 생성 LLM
 */
export type PromptLLM = 'claude' | 'gpt-4o-mini' | 'qwen';

/**
 * 이미지 비율
 */
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

/**
 * 비율별 실제 픽셀 크기
 */
export const ASPECT_RATIO_SIZES: Record<AspectRatio, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1280, height: 720 },
  '9:16': { width: 720, height: 1280 },
  '4:3': { width: 1024, height: 768 },
  '3:4': { width: 768, height: 1024 },
};

/**
 * GeneratedImage - 생성된 이미지
 */
export interface GeneratedImage {
  id: string;
  url: string;                    // 원본 URL
  thumbUrl?: string;              // 썸네일 URL
  previewUrl?: string;            // 프리뷰 URL

  // 생성 정보
  prompt: string;                 // 사용된 프롬프트
  negativePrompt?: string;        // 네거티브 프롬프트
  provider: ImageProvider;        // 사용된 Provider
  width: number;
  height: number;
  seed?: number;
  steps?: number;

  // Mixboard 연결
  mixRefs?: MixRefImage[];        // 사용된 레퍼런스

  // 메타데이터
  createdAt: number;
  generationTime?: number;        // 생성 소요 시간 (ms)

  // 에셋 저장 상태
  savedAsAsset: boolean;          // 에셋으로 저장 여부
  assetId?: string;               // 저장된 에셋 ID
  addedToCanvas: boolean;         // 캔버스에 추가 여부
}

// ============================================================================
// Chat Message Types
// ============================================================================

/**
 * ImageTabChatMessage - ImageTab 전용 채팅 메시지
 *
 * 기존 ChatPanel과 독립적으로 관리
 */
export interface ImageTabChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;

  // 이미지 생성 결과 (assistant 메시지에서 사용)
  generatedImages?: GeneratedImage[];

  // 생성 중 상태
  isGenerating?: boolean;

  // 프롬프트 정보 (user 메시지에서 사용)
  originalPrompt?: string;        // 원본 한글 프롬프트
  translatedPrompt?: string;      // 번역된 영문 프롬프트
}

// ============================================================================
// Settings Types
// ============================================================================

/**
 * ImageTab 설정
 */
export interface ImageTabSettings {
  promptLLM: PromptLLM;
  imageLLM: ImageProvider | 'auto';
  aspectRatio: AspectRatio;
  batchSize: 1 | 2 | 4;

  // 고급 설정
  steps?: number;                 // 생성 스텝 수
  seed?: number;                  // 시드 (재현성)
  negativePrompt?: string;        // 기본 네거티브 프롬프트
}

/**
 * 기본 설정값
 */
export const DEFAULT_IMAGE_TAB_SETTINGS: ImageTabSettings = {
  promptLLM: 'gpt-4o-mini',
  imageLLM: 'zimage',
  aspectRatio: '1:1',
  batchSize: 1,
  steps: 8,
  negativePrompt: 'blurry, low quality, distorted, deformed',
};

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * 이미지 생성 요청
 */
export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  batchSize: number;
  provider: ImageProvider | 'auto';
  mixRefs?: MixRefImage[];
  seed?: number;
  steps?: number;
}

/**
 * 이미지 생성 응답
 */
export interface ImageGenerationResponse {
  success: boolean;
  images: Array<{
    url: string;
    thumbUrl?: string;
    seed?: number;
    generationTime?: number;
  }>;
  provider: ImageProvider;
  error?: string;
}

/**
 * 에셋 저장 요청
 */
export interface SaveAsAssetRequest {
  imageUrl: string;
  prompt: string;
  provider: ImageProvider;
  metadata?: {
    mixRefs?: MixRefImage[];
    width: number;
    height: number;
  };
}

/**
 * 에셋 저장 응답
 */
export interface SaveAsAssetResponse {
  success: boolean;
  assetId: string;
  assetUrl: string;
  thumbUrl?: string;
  error?: string;
}
