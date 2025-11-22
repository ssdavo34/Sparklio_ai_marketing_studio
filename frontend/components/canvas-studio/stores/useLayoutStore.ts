/**
 * Layout Store
 *
 * 레이아웃 상태 관리 (패널 너비, 접기/펼치기)
 *
 * 관리하는 상태:
 * - Left Panel: 너비, 접기/펼치기, 최소/최대 크기
 * - Right Dock: 너비, 접기/펼치기, 최소/최대 크기
 * - Activity Bar: 고정 너비 (56px)
 *
 * 미들웨어:
 * - persist: localStorage에 패널 너비 저장
 * - devtools: Redux DevTools 연동
 *
 * @author C팀 (Frontend Team)
 * @version 3.0
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================================================
// 상태 인터페이스
// ============================================================================

export interface LayoutState {
  // Left Panel
  leftPanelWidth: number;
  isLeftPanelCollapsed: boolean;
  leftPanelMinWidth: number;
  leftPanelMaxWidth: number;

  // Right Dock
  rightDockWidth: number;
  isRightDockCollapsed: boolean;
  rightDockMinWidth: number;
  rightDockMaxWidth: number;

  // Activity Bar (고정)
  activityBarWidth: number;

  // View Mode
  isViewMode: boolean;

  // Actions
  setLeftPanelWidth: (width: number) => void;
  toggleLeftPanel: () => void;
  setRightDockWidth: (width: number) => void;
  toggleRightDock: () => void;
  toggleViewMode: () => void;
  resetLayout: () => void;
}

// ============================================================================
// 기본값 상수
// ============================================================================

const DEFAULT_LEFT_PANEL_WIDTH = 280;
const DEFAULT_RIGHT_DOCK_WIDTH = 360;
const LEFT_PANEL_MIN_WIDTH = 200;
const LEFT_PANEL_MAX_WIDTH = 500;
const RIGHT_DOCK_MIN_WIDTH = 300;
const RIGHT_DOCK_MAX_WIDTH = 600;
const ACTIVITY_BAR_WIDTH = 56;

// ============================================================================
// Store 생성
// ============================================================================

export const useLayoutStore = create<LayoutState>()(
  devtools(
    persist(
      (set, get) => ({
        // ========================================
        // 초기 상태
        // ========================================
        leftPanelWidth: DEFAULT_LEFT_PANEL_WIDTH,
        isLeftPanelCollapsed: false,
        leftPanelMinWidth: LEFT_PANEL_MIN_WIDTH,
        leftPanelMaxWidth: LEFT_PANEL_MAX_WIDTH,

        rightDockWidth: DEFAULT_RIGHT_DOCK_WIDTH,
        isRightDockCollapsed: false,
        rightDockMinWidth: RIGHT_DOCK_MIN_WIDTH,
        rightDockMaxWidth: RIGHT_DOCK_MAX_WIDTH,

        activityBarWidth: ACTIVITY_BAR_WIDTH,

        isViewMode: false,

        // ========================================
        // Actions
        // ========================================

        /**
         * Left Panel 너비 설정
         * - 최소/최대 크기 제한 적용
         */
        setLeftPanelWidth: (width) => {
          const { leftPanelMinWidth, leftPanelMaxWidth } = get();
          const clampedWidth = Math.max(
            leftPanelMinWidth,
            Math.min(width, leftPanelMaxWidth)
          );
          set({ leftPanelWidth: clampedWidth });
        },

        /**
         * Left Panel 접기/펼치기 토글
         * - 단축키: Ctrl+B
         */
        toggleLeftPanel: () => {
          set((state) => ({
            isLeftPanelCollapsed: !state.isLeftPanelCollapsed,
          }));
        },

        /**
         * Right Dock 너비 설정
         * - 최소/최대 크기 제한 적용
         */
        setRightDockWidth: (width) => {
          const { rightDockMinWidth, rightDockMaxWidth } = get();
          const clampedWidth = Math.max(
            rightDockMinWidth,
            Math.min(width, rightDockMaxWidth)
          );
          set({ rightDockWidth: clampedWidth });
        },

        /**
         * Right Dock 접기/펼치기 토글
         * - 단축키: Ctrl+Shift+B
         */
        toggleRightDock: () => {
          set((state) => ({
            isRightDockCollapsed: !state.isRightDockCollapsed,
          }));
        },

        /**
         * View Mode 토글
         * - View Mode: 편집 도구 숨김, 읽기 전용
         */
        toggleViewMode: () => {
          set((state) => ({
            isViewMode: !state.isViewMode,
          }));
        },

        /**
         * 레이아웃 초기화
         * - 모든 패널을 기본 크기로 복원
         */
        resetLayout: () => {
          set({
            leftPanelWidth: DEFAULT_LEFT_PANEL_WIDTH,
            isLeftPanelCollapsed: false,
            rightDockWidth: DEFAULT_RIGHT_DOCK_WIDTH,
            isRightDockCollapsed: false,
            isViewMode: false,
          });
        },
      }),
      {
        name: 'canvas-studio-layout', // localStorage key
        // 패널 너비와 접기 상태 저장
        partialize: (state) => ({
          leftPanelWidth: state.leftPanelWidth,
          rightDockWidth: state.rightDockWidth,
          isLeftPanelCollapsed: state.isLeftPanelCollapsed,
          isRightDockCollapsed: state.isRightDockCollapsed,
          isViewMode: state.isViewMode,
        }),
      }
    ),
    {
      name: 'LayoutStore', // DevTools 이름
    }
  )
);
