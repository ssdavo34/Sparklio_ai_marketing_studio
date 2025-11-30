/**
 * Left Panel Store
 *
 * Left Panel tab management
 * - ActivityBar 메뉴 선택 (activeTab)
 * - 패널 내부 탭 (panelTab: pages/editor)
 * - 패널 접기/펼치기 (isCollapsed)
 *
 * @author C Team (Frontend Team)
 * @version 4.0
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

// ActivityBar 메뉴 (검정 바)
export type LeftPanelTab =
  // 1. 입력 소스 / 프로젝트 관리
  | 'project'
  | 'upload'
  // 2. 브랜드 & 전략 허브
  | 'brandkit'
  | 'meeting'
  | 'conceptboard'
  // 3. 채널별 산출물
  | 'presentation'
  | 'detail'
  | 'sns'
  | 'video'
  | 'image'
  // 4. 에셋 라이브러리
  | 'assets'
  // 5. 시스템
  | 'settings';

// 패널 내부 탭 (Pages / Editor / ActivityBar 메뉴)
export type PanelInternalTab = 'pages' | 'editor' | LeftPanelTab;

export interface LeftPanelState {
  // ActivityBar에서 선택된 메뉴
  activeTab: LeftPanelTab;
  setActiveTab: (tab: LeftPanelTab) => void;

  // 패널 내부 탭 (Pages / Editor)
  panelTab: PanelInternalTab;
  setPanelTab: (tab: PanelInternalTab) => void;

  // 패널 접기/펼치기
  isCollapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;

  // 패널 너비 (리사이즈)
  panelWidth: number;
  setPanelWidth: (width: number) => void;
  minWidth: number;
  maxWidth: number;
}

// ============================================================================
// Store
// ============================================================================

export const useLeftPanelStore = create<LeftPanelState>()(
  devtools(
    (set) => ({
      activeTab: 'brandkit',
      setActiveTab: (tab) => set({ activeTab: tab }),

      panelTab: 'pages',
      setPanelTab: (tab) => set({ panelTab: tab }),

      isCollapsed: false,
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),

      // 패널 너비 (기본 280px, 최소 200px, 최대 500px)
      panelWidth: 280,
      setPanelWidth: (width) => set({ panelWidth: width }),
      minWidth: 200,
      maxWidth: 500,
    }),
    {
      name: 'LeftPanelStore',
    }
  )
);
