/**
 * Layout Store
 *
 * UI 레이아웃 상태를 관리합니다.
 * - 좌측 패널 표시 여부
 * - 우측 패널 표시 여부
 */

import { create } from 'zustand';

interface LayoutState {
  /** 좌측 패널 표시 여부 */
  isLeftPanelOpen: boolean;
  /** 우측 패널 표시 여부 */
  isRightPanelOpen: boolean;

  /** 좌측 패널 토글 */
  toggleLeftPanel: () => void;
  /** 우측 패널 토글 */
  toggleRightPanel: () => void;

  /** 좌측 패널 설정 */
  setLeftPanel: (isOpen: boolean) => void;
  /** 우측 패널 설정 */
  setRightPanel: (isOpen: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  // 기본값: 둘 다 열려있음
  isLeftPanelOpen: true,
  isRightPanelOpen: true,

  toggleLeftPanel: () =>
    set((state) => ({ isLeftPanelOpen: !state.isLeftPanelOpen })),

  toggleRightPanel: () =>
    set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),

  setLeftPanel: (isOpen: boolean) => set({ isLeftPanelOpen: isOpen }),

  setRightPanel: (isOpen: boolean) => set({ isRightPanelOpen: isOpen }),
}));
