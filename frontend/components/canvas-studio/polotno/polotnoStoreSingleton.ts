/**
 * Polotno Store Singleton
 *
 * Polotno Store를 싱글톤으로 관리하여 뷰 전환 시에도 상태가 유지되도록 함
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-26
 */

import { createStore } from 'polotno/model/store';

// 모듈 레벨 싱글톤 인스턴스
let polotnoStoreInstance: any = null;
let isInitialized = false;

/**
 * Polotno Store 싱글톤 가져오기 또는 생성
 */
export function getOrCreatePolotnoStore(apiKey: string): any {
  if (polotnoStoreInstance && isInitialized) {
    console.log('[PolotnoStoreSingleton] Reusing existing store');
    return polotnoStoreInstance;
  }

  console.log('[PolotnoStoreSingleton] Creating new store');
  polotnoStoreInstance = createStore({
    key: apiKey,
    showCredit: true, // Free version requirement
  });

  isInitialized = true;
  return polotnoStoreInstance;
}

/**
 * 현재 Polotno Store 인스턴스 가져오기
 */
export function getPolotnoStore(): any | null {
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
  if (!polotnoStoreInstance) return null;
  return polotnoStoreInstance.toJSON();
}

/**
 * JSON에서 Polotno Store 상태 복원
 */
export function restoreStoreState(json: any): void {
  if (!polotnoStoreInstance || !json) return;
  polotnoStoreInstance.loadJSON(json);
}

/**
 * Polotno Store 리셋 (새 프로젝트 시작 시)
 */
export function resetPolotnoStore(width: number = 1080, height: number = 1920): void {
  if (!polotnoStoreInstance) return;

  // 모든 페이지 삭제
  while (polotnoStoreInstance.pages.length > 0) {
    polotnoStoreInstance.pages[0].remove();
  }

  // 새 빈 페이지 추가
  polotnoStoreInstance.addPage({
    width,
    height,
  });

  console.log('[PolotnoStoreSingleton] Store reset with new page');
}
