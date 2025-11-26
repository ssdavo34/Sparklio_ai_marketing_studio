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
  | 'project'
  | 'pages'
  | 'elements'
  | 'text'
  | 'upload'
  | 'meeting'
  | 'photos'
  | 'brandkit'
  | 'assets';

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
