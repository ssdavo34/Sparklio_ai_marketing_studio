/**
 * Video6 Modal Store
 *
 * Video6 모달 열기/닫기 상태 관리
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-29
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface Video6ModalState {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  toggleModal: () => void;
}

// ============================================================================
// Store
// ============================================================================

export const useVideo6ModalStore = create<Video6ModalState>()(
  devtools(
    (set) => ({
      isOpen: false,

      openModal: () => set({ isOpen: true }),

      closeModal: () => set({ isOpen: false }),

      toggleModal: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'Video6ModalStore',
    }
  )
);
