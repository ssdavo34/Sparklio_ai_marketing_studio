/**
 * Unsplash API Client
 *
 * Unsplash REST API v1 연동
 * - 이미지 검색
 * - 인기 사진 조회
 * - 다운로드 트리거 (필수 - Unsplash 정책)
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 */

import type {
  UnsplashPhoto,
  UnsplashSearchParams,
  UnsplashSearchResponse,
  UnsplashListPhotosParams,
  SimplePhoto,
  UnsplashConfig,
} from './unsplash-types';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<UnsplashConfig> = {
  accessKey: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '',
  apiUrl: 'https://api.unsplash.com',
  photosPerPage: 30,
  defaultOrientation: 'landscape',
};

let config: Required<UnsplashConfig> = { ...DEFAULT_CONFIG };

/**
 * Unsplash API 설정
 */
export function configureUnsplash(userConfig: Partial<UnsplashConfig>): void {
  config = {
    ...config,
    ...userConfig,
  };
}

/**
 * 현재 설정 가져오기
 */
export function getUnsplashConfig(): Required<UnsplashConfig> {
  return { ...config };
}

// ============================================================================
// HTTP Client
// ============================================================================

class UnsplashAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: string[]
  ) {
    super(message);
    this.name = 'UnsplashAPIError';
  }
}

async function fetchUnsplash<T>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {}
): Promise<T> {
  if (!config.accessKey) {
    throw new UnsplashAPIError('Unsplash Access Key가 설정되지 않았습니다', 401);
  }

  // Build query string
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });

  const url = `${config.apiUrl}${endpoint}?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${config.accessKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new UnsplashAPIError(
        errorData.errors?.[0] || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.errors
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof UnsplashAPIError) {
      throw error;
    }

    // Network error
    throw new UnsplashAPIError(
      `네트워크 오류: ${(error as Error).message}`,
      0
    );
  }
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * 사진 검색
 *
 * @example
 * const result = await searchPhotos({
 *   query: 'business',
 *   orientation: 'landscape',
 *   per_page: 20
 * });
 */
export async function searchPhotos(
  params: UnsplashSearchParams
): Promise<UnsplashSearchResponse> {
  const queryParams: Record<string, string | number | undefined> = {
    query: params.query,
    page: params.page || 1,
    per_page: params.per_page || config.photosPerPage,
    order_by: params.order_by || 'relevant',
    content_filter: params.content_filter || 'low',
  };

  if (params.orientation) {
    queryParams.orientation = params.orientation;
  }

  if (params.color) {
    queryParams.color = params.color;
  }

  if (params.collections) {
    queryParams.collections = params.collections;
  }

  return await fetchUnsplash<UnsplashSearchResponse>('/search/photos', queryParams);
}

/**
 * 인기 사진 목록 조회
 *
 * @example
 * const photos = await listPhotos({ per_page: 20 });
 */
export async function listPhotos(
  params: UnsplashListPhotosParams = {}
): Promise<UnsplashPhoto[]> {
  const queryParams: Record<string, string | number | undefined> = {
    page: params.page || 1,
    per_page: params.per_page || config.photosPerPage,
    order_by: params.order_by || 'popular',
  };

  return await fetchUnsplash<UnsplashPhoto[]>('/photos', queryParams);
}

/**
 * 특정 사진 상세 조회
 */
export async function getPhoto(photoId: string): Promise<UnsplashPhoto> {
  return await fetchUnsplash<UnsplashPhoto>(`/photos/${photoId}`, {});
}

/**
 * 다운로드 트리거 (필수)
 *
 * Unsplash API 정책:
 * - 사용자가 사진을 다운로드하거나 사용할 때 반드시 호출해야 함
 * - 이를 통해 사진 작가에게 크레딧 제공
 *
 * @param downloadLocation - photo.links.download_location
 */
export async function triggerDownload(downloadLocation: string): Promise<void> {
  if (!config.accessKey) {
    console.warn('[Unsplash] Download trigger skipped - no access key');
    return;
  }

  try {
    // download_location은 전체 URL이므로 직접 fetch
    await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${config.accessKey}`,
      },
    });
  } catch (error) {
    console.error('[Unsplash] Download trigger failed:', error);
    // 실패해도 사용자 경험에 영향 없으므로 throw하지 않음
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * UnsplashPhoto → SimplePhoto 변환
 */
export function toSimplePhoto(photo: UnsplashPhoto): SimplePhoto {
  return {
    id: photo.id,
    width: photo.width,
    height: photo.height,
    color: photo.color,
    urls: {
      thumb: photo.urls.thumb,
      small: photo.urls.small,
      regular: photo.urls.regular,
      full: photo.urls.full,
      raw: photo.urls.raw,
    },
    user: {
      name: photo.user.name,
      username: photo.user.username,
      profile_image: photo.user.profile_image.medium,
    },
    alt_description: photo.alt_description,
    download_location: photo.links.download_location,
  };
}

/**
 * 검색 결과 → SimplePhoto[] 변환
 */
export function convertSearchResults(response: UnsplashSearchResponse): SimplePhoto[] {
  return response.results.map(toSimplePhoto);
}

/**
 * Unsplash 사진 attribution 텍스트 생성
 *
 * Unsplash 정책: 반드시 작가 크레딧 표시해야 함
 */
export function getPhotoAttribution(photo: SimplePhoto | UnsplashPhoto): string {
  const user = 'user' in photo ? photo.user : null;
  if (!user) return '';

  const userName = user.name || user.username;
  const userLink = `https://unsplash.com/@${user.username}?utm_source=sparklio&utm_medium=referral`;
  const unsplashLink = `https://unsplash.com/?utm_source=sparklio&utm_medium=referral`;

  return `Photo by ${userName} (${userLink}) on Unsplash (${unsplashLink})`;
}

/**
 * Unsplash 사진 크레딧 HTML 생성
 */
export function getPhotoAttributionHTML(photo: SimplePhoto | UnsplashPhoto): string {
  const user = 'user' in photo ? photo.user : null;
  if (!user) return '';

  const userName = user.name || user.username;
  const userLink = `https://unsplash.com/@${user.username}?utm_source=sparklio&utm_medium=referral`;
  const unsplashLink = `https://unsplash.com/?utm_source=sparklio&utm_medium=referral`;

  return `Photo by <a href="${userLink}" target="_blank" rel="noopener noreferrer">${userName}</a> on <a href="${unsplashLink}" target="_blank" rel="noopener noreferrer">Unsplash</a>`;
}

// ============================================================================
// Export
// ============================================================================

export {
  UnsplashAPIError,
};

export default {
  configure: configureUnsplash,
  getConfig: getUnsplashConfig,
  searchPhotos,
  listPhotos,
  getPhoto,
  triggerDownload,
  toSimplePhoto,
  convertSearchResults,
  getPhotoAttribution,
  getPhotoAttributionHTML,
};
