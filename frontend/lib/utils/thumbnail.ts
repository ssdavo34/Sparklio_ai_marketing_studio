/**
 * Thumbnail Generation Utilities
 *
 * Polotno 기반 썸네일 자동 생성 유틸리티
 * - AI 출력물 생성 시 자동 호출
 * - 수동 편집 시 debounce 호출
 * - PagesTab lazy loading
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-27
 */

import type { StoreType } from 'polotno/model/store';

console.log('[Thumbnail] Utility v1.1 loaded (Fixes applied)');

export interface ThumbnailOptions {
  mimeType?: 'image/jpeg' | 'image/png';
  quality?: number;  // 0.0 - 1.0
  pixelRatio?: number;  // 0.25 = 25% 크기
}

/**
 * 활성 페이지의 썸네일 생성
 *
 * @param store - Polotno store 인스턴스
 * @param options - 썸네일 생성 옵션
 * @returns 생성된 썸네일 Data URL (없으면 null)
 */
export async function generateThumbnailForActivePage(
  store: StoreType,
  options: ThumbnailOptions = {}
): Promise<string | null> {
  const page = store.activePage;
  if (!page) {
    console.warn('[Thumbnail] No active page');
    return null;
  }

  try {
    const dataUrl = await store.toDataURL({
      mimeType: options.mimeType || 'image/jpeg',
      quality: options.quality || 0.6,
      pixelRatio: options.pixelRatio || 0.25,  // 25% 크기
    });

    // page.custom에 저장 (JSON export 시 포함됨)
    page.set({
      custom: {
        ...page.custom,
        thumbnailDataUrl: dataUrl,
        thumbnailGeneratedAt: new Date().toISOString(),
      },
    });

    console.log(`[Thumbnail] Generated for page: ${page.id}`);
    return dataUrl;
  } catch (error) {
    console.error('[Thumbnail] Generation failed:', error);
    return null;
  }
}

/**
 * 특정 페이지의 썸네일 생성
 *
 * @param store - Polotno store
 * @param pageId - 대상 페이지 ID
 * @param options - 썸네일 옵션
 */
export async function generateThumbnailForPage(
  store: StoreType,
  pageId: string,
  options: ThumbnailOptions = {}
): Promise<string | null> {
  const page = store.pages.find((p: any) => p.id === pageId);
  if (!page) {
    console.warn(`[Thumbnail] Page not found: ${pageId}`);
    return null;
  }

  const originalActivePageId = store.activePage?.id;

  try {
    // 1. 해당 페이지 선택 (store.toDataURL은 activePage를 캡처함)
    store.selectPage(pageId);

    // 2. 렌더링 대기 (폰트/이미지 로딩 및 캔버스 업데이트 확보)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 3. activePage가 올바르게 변경되었는지 확인
    if (store.activePage?.id !== pageId) {
      console.warn(`[Thumbnail] Active page mismatch. Expected ${pageId}, got ${store.activePage?.id}`);
      // 재시도
      store.selectPage(pageId);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // 4. store.toDataURL 호출
    const dataURL = await store.toDataURL({
      mimeType: 'image/jpeg',
      quality: options.quality || 0.7,
      pixelRatio: options.pixelRatio || 0.2,
    });

    // 5. 커스텀 속성에 저장
    page.set({
      custom: {
        ...page.custom,
        thumbnailDataUrl: dataURL,
        thumbnailGeneratedAt: new Date().toISOString(),
      },
    });

    return dataURL;
  } catch (error) {
    console.error(`[Thumbnail] Failed to generate thumbnail for page ${pageId}:`, error);
    return null;
  } finally {
    // 6. 원래 보고 있던 페이지로 복구
    if (originalActivePageId && originalActivePageId !== pageId) {
      store.selectPage(originalActivePageId);
    }
  }
}

/**
 * 모든 페이지의 썸네일 생성 (순차적)
 *
 * @param store - Polotno store
 * @param options - 썸네일 옵션
 * @returns 생성된 썸네일 맵 { pageId: dataUrl }
 */
export async function generateAllThumbnails(
  store: StoreType,
  options: ThumbnailOptions = {}
): Promise<Record<string, string>> {
  const thumbnails: Record<string, string> = {};
  const previousPageId = store.activePage?.id;

  for (const page of store.pages) {
    const thumbnail = await generateThumbnailForPage(store, page.id, options);
    if (thumbnail) {
      thumbnails[page.id] = thumbnail;
    }
  }

  // 원래 페이지로 복귀
  if (previousPageId) {
    store.selectPage(previousPageId);
  }

  console.log(`[Thumbnail] Generated ${Object.keys(thumbnails).length} thumbnails`);
  return thumbnails;
}

/**
 * 썸네일이 없는 페이지만 생성 (Lazy)
 *
 * @param store - Polotno store
 * @param options - 썸네일 옵션
 */
export async function generateMissingThumbnails(
  store: StoreType,
  options: ThumbnailOptions = {}
): Promise<void> {
  const pagesWithoutThumbnail = store.pages.filter(
    (p: any) => !p.custom?.thumbnailDataUrl
  );

  if (pagesWithoutThumbnail.length === 0) {
    console.log('[Thumbnail] All pages have thumbnails');
    return;
  }

  console.log(`[Thumbnail] Generating ${pagesWithoutThumbnail.length} missing thumbnails...`);

  for (const page of pagesWithoutThumbnail) {
    await generateThumbnailForPage(store, page.id, options);
  }
}

/**
 * 특정 페이지(들)의 썸네일 생성 (단일 또는 배열)
 *
 * @param store - Polotno store
 * @param page - Polotno page 객체 또는 배열
 * @param options - 썸네일 옵션
 * @returns 생성된 썸네일 Data URL(들)
 */
export async function generateThumbnailForPages(
  store: StoreType,
  pages: any | any[],
  options: ThumbnailOptions = {}
): Promise<string | string[] | null> {
  const pageArray = Array.isArray(pages) ? pages : [pages];
  const results: string[] = [];

  for (const page of pageArray) {
    if (page && page.id) {
      const thumbnail = await generateThumbnailForPage(store, page.id, options);
      if (thumbnail) {
        results.push(thumbnail);
      }
    }
  }

  return Array.isArray(pages) ? results : (results[0] || null);
}
