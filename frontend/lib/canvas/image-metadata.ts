/**
 * Canvas Image Metadata
 *
 * Polotno Canvas에 저장되는 이미지 메타데이터
 * - 이미지 소스 추적
 * - 재생성/편집 가능하도록 원본 정보 보존
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 */

// ============================================================================
// Types
// ============================================================================

/**
 * 이미지 소스 타입
 */
export type ImageSource =
  | 'nano_banana'    // AI 생성 (Nano Banana)
  | 'unsplash'       // Unsplash 검색
  | 'upload'         // 사용자 업로드
  | 'url'            // 외부 URL
  | 'placeholder';   // 플레이스홀더

/**
 * 이미지 메타데이터
 *
 * Polotno element의 customData에 저장됨
 */
export interface ImageMetadata {
  /** 이미지 소스 타입 */
  source: ImageSource;

  /** 원본 프롬프트 (AI 생성 시) */
  originalPrompt?: string;

  /** 생성 스타일 (AI 생성 시) */
  style?: string;

  /** Seed (AI 재생성용) */
  seed?: number;

  /** Unsplash 사진 ID */
  unsplashPhotoId?: string;

  /** Unsplash 작가 정보 */
  unsplashAttribution?: {
    photographerName: string;
    photographerUsername: string;
    downloadLocation: string;
  };

  /** 생성/추가 시간 */
  createdAt: string;

  /** 마지막 수정 시간 */
  updatedAt?: string;

  /** 재생성 횟수 */
  regenerationCount?: number;

  /** 사용자 커스텀 메타데이터 */
  custom?: Record<string, any>;
}

/**
 * Polotno Image Element with Metadata
 *
 * 실제 Polotno store의 이미지 요소 타입
 */
export interface PolotnoImageElement {
  id: string;
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;

  /** 이미지 메타데이터 (여기에 저장) */
  custom?: ImageMetadata;

  // Polotno 기본 속성들
  rotation?: number;
  opacity?: number;
  locked?: boolean;
  [key: string]: any;
}

// ============================================================================
// Metadata Builders
// ============================================================================

/**
 * Nano Banana 이미지 메타데이터 생성
 */
export function createNanoBananaMetadata(
  prompt: string,
  style: string = 'realistic',
  seed?: number
): ImageMetadata {
  return {
    source: 'nano_banana',
    originalPrompt: prompt,
    style,
    seed,
    createdAt: new Date().toISOString(),
    regenerationCount: 0,
  };
}

/**
 * Unsplash 이미지 메타데이터 생성
 */
export function createUnsplashMetadata(
  photoId: string,
  photographerName: string,
  photographerUsername: string,
  downloadLocation: string
): ImageMetadata {
  return {
    source: 'unsplash',
    unsplashPhotoId: photoId,
    unsplashAttribution: {
      photographerName,
      photographerUsername,
      downloadLocation,
    },
    createdAt: new Date().toISOString(),
  };
}

/**
 * 업로드 이미지 메타데이터 생성
 */
export function createUploadMetadata(
  fileName?: string
): ImageMetadata {
  return {
    source: 'upload',
    createdAt: new Date().toISOString(),
    custom: fileName ? { fileName } : undefined,
  };
}

/**
 * 플레이스홀더 메타데이터 생성
 */
export function createPlaceholderMetadata(
  description?: string
): ImageMetadata {
  return {
    source: 'placeholder',
    originalPrompt: description,
    createdAt: new Date().toISOString(),
  };
}

// ============================================================================
// Metadata Utilities
// ============================================================================

/**
 * 메타데이터 업데이트
 */
export function updateMetadata(
  existing: ImageMetadata,
  updates: Partial<ImageMetadata>
): ImageMetadata {
  return {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 재생성 카운트 증가
 */
export function incrementRegenerationCount(metadata: ImageMetadata): ImageMetadata {
  return {
    ...metadata,
    regenerationCount: (metadata.regenerationCount || 0) + 1,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 이미지 소스 확인
 */
export function isNanoBananaImage(metadata?: ImageMetadata): boolean {
  return metadata?.source === 'nano_banana';
}

export function isUnsplashImage(metadata?: ImageMetadata): boolean {
  return metadata?.source === 'unsplash';
}

export function isUploadedImage(metadata?: ImageMetadata): boolean {
  return metadata?.source === 'upload';
}

export function isPlaceholder(metadata?: ImageMetadata): boolean {
  return metadata?.source === 'placeholder';
}

/**
 * 재생성 가능 여부 확인
 */
export function canRegenerate(metadata?: ImageMetadata): boolean {
  return isNanoBananaImage(metadata) && !!metadata?.originalPrompt;
}

/**
 * Unsplash 크레딧 가져오기
 */
export function getUnsplashCredit(metadata?: ImageMetadata): string | null {
  if (!isUnsplashImage(metadata) || !metadata?.unsplashAttribution) {
    return null;
  }

  const { photographerName, photographerUsername } = metadata.unsplashAttribution;
  return `Photo by ${photographerName} (@${photographerUsername}) on Unsplash`;
}

// ============================================================================
// Polotno Integration Helpers
// ============================================================================

/**
 * Polotno 이미지 요소에 메타데이터 설정
 */
export function setImageMetadata(
  element: any,
  metadata: ImageMetadata
): void {
  if (element.type !== 'image') {
    console.warn('[ImageMetadata] Element is not an image');
    return;
  }

  element.set({ custom: metadata });
}

/**
 * Polotno 이미지 요소에서 메타데이터 가져오기
 */
export function getImageMetadata(element: any): ImageMetadata | undefined {
  if (element.type !== 'image') {
    return undefined;
  }

  return element.custom as ImageMetadata | undefined;
}

/**
 * 이미지 소스 변경 (URL + 메타데이터 동시 업데이트)
 */
export function updateImageSource(
  element: any,
  newSrc: string,
  newMetadata: ImageMetadata
): void {
  if (element.type !== 'image') {
    console.warn('[ImageMetadata] Element is not an image');
    return;
  }

  element.set({
    src: newSrc,
    custom: newMetadata,
  });
}
