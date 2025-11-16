/**
 * Tabs Store
 *
 * Right Dock 탭 상태 관리
 *
 * 관리하는 상태:
 * - 활성 Right Dock 탭 (Chat, Inspector, Layers, Data, Brand)
 *
 * 미들웨어:
 * - persist: localStorage에 활성 탭 저장
 * - devtools: Redux DevTools 연동
 *
 * @author C팀 (Frontend Team)
 * @version 3.0
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { RightDockTabId } from './types';

// ============================================================================
// 상태 인터페이스
// ============================================================================

export interface TabsState {
  // Right Dock 활성 탭
  activeRightDockTab: RightDockTabId;

  // Actions
  setActiveRightDockTab: (tab: RightDockTabId) => void;
}

// ============================================================================
// Store 생성
// ============================================================================

export const useTabsStore = create<TabsState>()(
  devtools(
    persist(
      (set) => ({
        // ========================================
        // 초기 상태
        // ========================================
        activeRightDockTab: 'chat',

        // ========================================
        // Actions
        // ========================================

        /**
         * Right Dock 활성 탭 설정
         * - 탭 전환 시 호출
         * - 단축키: Ctrl+1~5
         */
        setActiveRightDockTab: (tab) => {
          set({ activeRightDockTab: tab });
        },
      }),
      {
        name: 'canvas-studio-tabs', // localStorage key
      }
    ),
    {
      name: 'TabsStore', // DevTools 이름
    }
  )
);
