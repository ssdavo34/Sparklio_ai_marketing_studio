/**
 * Left Panel Store
 *
 * Left Panel tab management
 * - Active tab state
 * - Tab switching
 *
 * @author C Team (Frontend Team)
 * @version 3.1
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

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
  | 'settings'
  // Legacy (향후 제거 예정 - 에디터 도구로 분리)
  | 'pages'
  | 'elements'
  | 'text'
  | 'photos';

export interface LeftPanelState {
  activeTab: LeftPanelTab;
  setActiveTab: (tab: LeftPanelTab) => void;
}

// ============================================================================
// Store
// ============================================================================

export const useLeftPanelStore = create<LeftPanelState>()(
  devtools(
    (set) => ({
      activeTab: 'pages',
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'LeftPanelStore',
    }
  )
);
