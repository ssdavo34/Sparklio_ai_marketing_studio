/**
 * Polotno Store Multi-Canvas Manager
 *
 * 캔버스 타입별 Polotno Store를 관리
 * - 8개의 독립 캔버스 지원
 * - 각 탭이 자신의 캔버스만 사용
 * - 하위 호환성: 기존 싱글톤 API 유지
 *
 * @author C팀 (Frontend Team)
 * @version 4.0 (2025-12-01 멀티캔버스)
 */

import { createStore } from 'polotno/model/store';
import type { StoreType } from 'polotno/model/store';
import { type CanvasType, CANVAS_CONFIGS } from '../stores/types';

// ============================================================================
// 멀티 캔버스 저장소
// ============================================================================

/** 캔버스 타입별 Store 인스턴스 */
const canvasStores = new Map<CanvasType, StoreType>();

/** API Key 저장 (재초기화 시 사용) */
let savedApiKey: string | null = null;

// ============================================================================
// 멀티 캔버스 API (v4.0)
// ============================================================================

/**
 * 특정 타입의 캔버스 Store 가져오기 또는 생성
 * @param type 캔버스 타입
 * @param apiKey Polotno API Key
 */
export function getOrCreateCanvasStore(type: CanvasType, apiKey: string): StoreType {
  // API Key 저장
  if (apiKey && !savedApiKey) {
    savedApiKey = apiKey;
  }

  // 이미 존재하면 재사용
  const existingStore = canvasStores.get(type);
  if (existingStore) {
    console.log(`[PolotnoMultiCanvas] Reusing existing store for: ${type}`);
    return existingStore;
  }

  // 새로 생성
  const config = CANVAS_CONFIGS[type];
  if (!config) {
    console.error(`[PolotnoMultiCanvas] Unknown canvas type: ${type}`);
    throw new Error(`Unknown canvas type: ${type}`);
  }

  try {
    console.log(`[PolotnoMultiCanvas] Creating new store for: ${type} (${config.width}x${config.height})`);

    const store = createStore({
      key: apiKey,
      showCredit: true, // Free version requirement
    });

    if (!store) {
      throw new Error(`Failed to create Polotno store for: ${type}`);
    }

    // 초기 페이지 추가 (해당 캔버스 크기로)
    store.addPage({
      width: config.width,
      height: config.height,
    });

    // 저장
    canvasStores.set(type, store);
    console.log(`[PolotnoMultiCanvas] Store created for: ${type}`);

    return store;
  } catch (error) {
    console.error(`[PolotnoMultiCanvas] Failed to create store for ${type}:`, error);
    throw error;
  }
}

/**
 * 특정 타입의 캔버스 Store 가져오기 (존재하는 경우만)
 */
export function getCanvasStore(type: CanvasType): StoreType | null {
  return canvasStores.get(type) || null;
}

/**
 * 특정 타입의 캔버스가 초기화되었는지 확인
 */
export function isCanvasInitialized(type: CanvasType): boolean {
  return canvasStores.has(type);
}

/**
 * 특정 타입의 캔버스 리셋
 */
export function resetCanvasStore(type: CanvasType): boolean {
  const store = canvasStores.get(type);
  if (!store) {
    console.warn(`[PolotnoMultiCanvas] Cannot reset: store ${type} not initialized`);
    return false;
  }

  const config = CANVAS_CONFIGS[type];

  try {
    // 모든 페이지 삭제
    const pageIds = store.pages.map((page) => page.id);
    if (pageIds.length > 0) {
      store.deletePages(pageIds);
    }

    // 새 페이지 추가
    store.addPage({
      width: config.width,
      height: config.height,
    });

    console.log(`[PolotnoMultiCanvas] Store ${type} reset`);
    return true;
  } catch (error) {
    console.error(`[PolotnoMultiCanvas] Failed to reset store ${type}:`, error);
    return false;
  }
}

/**
 * 특정 타입의 캔버스 상태를 JSON으로 내보내기
 */
export function exportCanvasState(type: CanvasType): any | null {
  const store = canvasStores.get(type);
  if (!store) {
    console.warn(`[PolotnoMultiCanvas] Cannot export: store ${type} not initialized`);
    return null;
  }

  try {
    return store.toJSON();
  } catch (error) {
    console.error(`[PolotnoMultiCanvas] Failed to export store ${type}:`, error);
    return null;
  }
}

/**
 * 특정 타입의 캔버스 상태 복원
 */
export function restoreCanvasState(type: CanvasType, json: any): boolean {
  const store = canvasStores.get(type);
  if (!store) {
    console.error(`[PolotnoMultiCanvas] Cannot restore: store ${type} not initialized`);
    return false;
  }

  if (!json) {
    console.warn(`[PolotnoMultiCanvas] Cannot restore: no data provided`);
    return false;
  }

  try {
    store.loadJSON(json);
    console.log(`[PolotnoMultiCanvas] Store ${type} restored`);
    return true;
  } catch (error) {
    console.error(`[PolotnoMultiCanvas] Failed to restore store ${type}:`, error);
    return false;
  }
}

/**
 * 모든 캔버스 Store 목록 가져오기
 */
export function getAllCanvasStores(): Map<CanvasType, StoreType> {
  return new Map(canvasStores);
}

/**
 * 초기화된 캔버스 타입 목록
 */
export function getInitializedCanvasTypes(): CanvasType[] {
  return Array.from(canvasStores.keys());
}

// ============================================================================
// 하위 호환성 API (deprecated)
// ============================================================================

/** 기본 캔버스 타입 (하위 호환용) */
const DEFAULT_CANVAS_TYPE: CanvasType = 'brand-dna';

/**
 * @deprecated getOrCreateCanvasStore(type, apiKey) 사용 권장
 * 하위 호환: 싱글톤처럼 동작 (기본 캔버스 반환)
 */
export function getOrCreatePolotnoStore(apiKey: string): StoreType {
  console.warn('[PolotnoMultiCanvas] getOrCreatePolotnoStore is deprecated. Use getOrCreateCanvasStore(type, apiKey)');
  return getOrCreateCanvasStore(DEFAULT_CANVAS_TYPE, apiKey);
}

/**
 * @deprecated getCanvasStore(type) 사용 권장
 * 하위 호환: 기본 캔버스 반환
 */
export function getPolotnoStore(): StoreType | null {
  console.warn('[PolotnoMultiCanvas] getPolotnoStore is deprecated. Use getCanvasStore(type)');
  return canvasStores.get(DEFAULT_CANVAS_TYPE) || null;
}

/**
 * @deprecated isCanvasInitialized(type) 사용 권장
 */
export function isPolotnoStoreInitialized(): boolean {
  return canvasStores.has(DEFAULT_CANVAS_TYPE);
}

/**
 * @deprecated exportCanvasState(type) 사용 권장
 */
export function exportStoreState(): any | null {
  return exportCanvasState(DEFAULT_CANVAS_TYPE);
}

/**
 * @deprecated restoreCanvasState(type, json) 사용 권장
 */
export function restoreStoreState(json: any): boolean {
  return restoreCanvasState(DEFAULT_CANVAS_TYPE, json);
}

/**
 * @deprecated resetCanvasStore(type) 사용 권장
 */
export function resetPolotnoStore(width: number = 1080, height: number = 1920): boolean {
  const store = canvasStores.get(DEFAULT_CANVAS_TYPE);
  if (!store) {
    console.error('[PolotnoMultiCanvas] Cannot reset: default store not initialized');
    return false;
  }

  try {
    const pageIds = store.pages.map((page) => page.id);
    if (pageIds.length > 0) {
      store.deletePages(pageIds);
    }

    store.addPage({ width, height });
    console.log('[PolotnoMultiCanvas] Default store reset');
    return true;
  } catch (error) {
    console.error('[PolotnoMultiCanvas] Failed to reset default store:', error);
    return false;
  }
}

/**
 * @deprecated 사용 금지
 */
export function forceReinitializeStore(apiKey: string): StoreType {
  console.warn('[PolotnoMultiCanvas] forceReinitializeStore is deprecated');
  canvasStores.delete(DEFAULT_CANVAS_TYPE);
  return getOrCreateCanvasStore(DEFAULT_CANVAS_TYPE, apiKey);
}
