/**
 * Left Panel Store
 *
 * Left Panel tab management
 * - ActivityBar 메뉴 선택 (activeTab)
 * - 패널 내부 탭 (panelTab: pages/editor)
 * - 패널 접기/펼치기 (isCollapsed)
 * - 캔버스 타입 자동 전환 (v4.0)
 *
 * @author C Team (Frontend Team)
 * @version 4.0 (2025-12-01 멀티캔버스)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { CanvasType } from './types';
import { useCanvasStore } from './useCanvasStore';
import { useCenterViewStore } from './useCenterViewStore';

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
  | 'brief'  // 캠페인 브리프 입력
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
// Tab → Canvas Type 매핑
// ============================================================================

/**
 * LeftPanelTab → CanvasType 매핑
 * 캔버스를 사용하는 탭만 매핑됨
 */
const TAB_TO_CANVAS_MAP: Partial<Record<LeftPanelTab, CanvasType>> = {
  'brandkit': 'brand-dna',
  'brief': 'brief',
  'meeting': 'meeting',
  'conceptboard': 'concept',
  'presentation': 'presentation',
  'detail': 'detail',
  'sns': 'sns',
  'video': 'video',
  'image': 'image',
};

/**
 * 탭에 해당하는 캔버스 타입 반환 (캔버스가 없는 탭은 null)
 */
export function getCanvasTypeForTab(tab: LeftPanelTab): CanvasType | null {
  return TAB_TO_CANVAS_MAP[tab] || null;
}

/**
 * 탭이 캔버스를 사용하는지 확인
 */
export function tabUsesCanvas(tab: LeftPanelTab): boolean {
  return tab in TAB_TO_CANVAS_MAP;
}

// ============================================================================
// Store
// ============================================================================

export const useLeftPanelStore = create<LeftPanelState>()(
  devtools(
    (set) => ({
      activeTab: 'brandkit',
      setActiveTab: (tab) => {
        console.log(`[LeftPanelStore] ⭐ setActiveTab called: ${tab}`);
        set({ activeTab: tab });

        // 캔버스 타입 자동 전환 (v4.0)
        const canvasType = getCanvasTypeForTab(tab);
        console.log(`[LeftPanelStore] 매핑된 canvasType: ${canvasType || 'none'}`);

        if (canvasType) {
          console.log(`[LeftPanelStore] ✅ Switching canvas: ${tab} → ${canvasType}`);
          useCanvasStore.getState().setActiveCanvas(canvasType);

          // ⭐ CenterView도 canvas로 전환 (캔버스가 표시되도록)
          const centerViewStore = useCenterViewStore.getState();
          if (centerViewStore.currentView !== 'canvas') {
            console.log(`[LeftPanelStore] 🔄 CenterView를 canvas로 전환`);
            centerViewStore.setView('canvas');
          }

          // 디버깅: 실제로 변경되었는지 확인
          setTimeout(() => {
            const currentType = useCanvasStore.getState().activeCanvasType;
            const currentView = useCenterViewStore.getState().currentView;
            console.log(`[LeftPanelStore] 🔍 Verification: activeCanvasType=${currentType}, currentView=${currentView}`);
          }, 100);
        } else {
          console.log(`[LeftPanelStore] ⚠️ No canvas mapping for tab: ${tab}`);
        }
      },

      panelTab: 'pages',
      setPanelTab: (tab) => set({ panelTab: tab }),

      isCollapsed: false,
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),

      // 패널 너비 (기본 390px, 최소 200px, 최대 500px)
      panelWidth: 390,
      setPanelWidth: (width) => set({ panelWidth: width }),
      minWidth: 200,
      maxWidth: 500,
    }),
    {
      name: 'LeftPanelStore',
    }
  )
);
