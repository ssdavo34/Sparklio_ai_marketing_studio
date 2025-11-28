/**
 * Polotno Store Singleton
 *
 * Polotno Store를 싱글톤으로 관리하여 뷰 전환 시에도 상태가 유지되도록 함
 *
 * @author C팀 (Frontend Team)
 * @version 1.1
 * @date 2025-11-28
 */

import { createStore } from 'polotno/model/store';
import type { StoreType } from 'polotno/model/store';

// 모듈 레벨 싱글톤 인스턴스
let polotnoStoreInstance: StoreType | null = null;
let isInitialized = false;

/**
 * Polotno Store 싱글톤 가져오기 또는 생성
 */
export function getOrCreatePolotnoStore(apiKey: string): StoreType {
  // 이미 초기화된 경우 재사용
  if (polotnoStoreInstance && isInitialized) {
    console.log('[PolotnoStoreSingleton] Reusing existing store');
    return polotnoStoreInstance;
  }

  // 안전성 검증: apiKey 필수
  if (!apiKey || typeof apiKey !== 'string') {
    console.error('[PolotnoStoreSingleton] Invalid API key provided');
    throw new Error('Polotno API key is required');
  }

  try {
    console.log('[PolotnoStoreSingleton] Creating new store');
    polotnoStoreInstance = createStore({
      key: apiKey,
      showCredit: true, // Free version requirement
    });

    // Store 생성 검증
    if (!polotnoStoreInstance) {
      throw new Error('Failed to create Polotno store');
    }

    // Register custom fonts (Pretendard)
    if (typeof window !== 'undefined' && (window as any).FontFace) {
      // Ensure Pretendard font is available for Polotno
      document.fonts.ready
        .then(() => {
          console.log('[PolotnoStoreSingleton] Fonts loaded and ready');
        })
        .catch((err) => {
          console.warn('[PolotnoStoreSingleton] Font loading warning:', err);
        });
    }

    isInitialized = true;
    console.log('[PolotnoStoreSingleton] Store created successfully');
    return polotnoStoreInstance;
  } catch (error) {
    console.error('[PolotnoStoreSingleton] Failed to create store:', error);
    // 실패 시 상태 리셋
    polotnoStoreInstance = null;
    isInitialized = false;
    throw error;
  }
}

/**
 * 현재 Polotno Store 인스턴스 가져오기 (안전성 검증 포함)
 */
export function getPolotnoStore(): StoreType | null {
  if (!isInitialized || !polotnoStoreInstance) {
    console.warn('[PolotnoStoreSingleton] Store not initialized. Call getOrCreatePolotnoStore() first.');
    return null;
  }
  return polotnoStoreInstance;
}

/**
 * Polotno Store가 초기화되었는지 확인
 */
export function isPolotnoStoreInitialized(): boolean {
  return isInitialized && polotnoStoreInstance !== null;
}

/**
 * Polotno Store 상태를 JSON으로 내보내기 (디버깅/저장용)
 */
export function exportStoreState(): any | null {
  if (!polotnoStoreInstance) {
    console.warn('[PolotnoStoreSingleton] Cannot export: store not initialized');
    return null;
  }

  try {
    const state = polotnoStoreInstance.toJSON();
    console.log('[PolotnoStoreSingleton] State exported successfully');
    return state;
  } catch (error) {
    console.error('[PolotnoStoreSingleton] Failed to export state:', error);
    return null;
  }
}

/**
 * JSON에서 Polotno Store 상태 복원
 */
export function restoreStoreState(json: any): boolean {
  if (!polotnoStoreInstance) {
    console.error('[PolotnoStoreSingleton] Cannot restore: store not initialized');
    return false;
  }

  if (!json) {
    console.warn('[PolotnoStoreSingleton] Cannot restore: no data provided');
    return false;
  }

  try {
    polotnoStoreInstance.loadJSON(json);
    console.log('[PolotnoStoreSingleton] State restored successfully');
    return true;
  } catch (error) {
    console.error('[PolotnoStoreSingleton] Failed to restore state:', error);
    return false;
  }
}

/**
 * Polotno Store 리셋 (새 프로젝트 시작 시)
 */
export function resetPolotnoStore(width: number = 1080, height: number = 1920): boolean {
  if (!polotnoStoreInstance) {
    console.error('[PolotnoStoreSingleton] Cannot reset: store not initialized');
    return false;
  }

  try {
    // 모든 페이지 ID 수집
    const pageIds = polotnoStoreInstance.pages.map((page) => page.id);

    // 페이지 삭제 (Polotno는 deletePages 메서드 사용)
    if (pageIds.length > 0) {
      polotnoStoreInstance.deletePages(pageIds);
    }

    // 새 빈 페이지 추가
    polotnoStoreInstance.addPage({
      width,
      height,
    });

    console.log('[PolotnoStoreSingleton] Store reset with new page');
    return true;
  } catch (error) {
    console.error('[PolotnoStoreSingleton] Failed to reset store:', error);
    return false;
  }
}

/**
 * Polotno Store 강제 재초기화 (에러 복구용)
 */
export function forceReinitializeStore(apiKey: string): StoreType {
  console.warn('[PolotnoStoreSingleton] Force reinitializing store...');

  // 기존 인스턴스 정리
  polotnoStoreInstance = null;
  isInitialized = false;

  // 새로 생성
  return getOrCreatePolotnoStore(apiKey);
}
