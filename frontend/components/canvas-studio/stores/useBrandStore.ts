/**
 * Brand Store
 *
 * 브랜드 키트 및 DNA 상태 관리
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 1.2.2
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BrandKit, BrandDNA } from '@/types/brand';

// ============================================================================
// Types
// ============================================================================

interface BrandStore {
  // State
  /** 현재 브랜드 키트 */
  brandKit: BrandKit | null;

  /** 현재 브랜드 DNA (BrandAnalyzer 결과) */
  brandDNA: BrandDNA | null;

  /** 로딩 상태 */
  isLoading: boolean;

  /** 에러 */
  error: string | null;

  // Actions
  /** 브랜드 키트 설정 */
  setBrandKit: (kit: BrandKit | null) => void;

  /** 브랜드 DNA 설정 */
  setBrandDNA: (dna: BrandDNA | null) => void;

  /** 브랜드 키트 필드 업데이트 */
  updateBrandKitField: <K extends keyof BrandKit>(field: K, value: BrandKit[K]) => void;

  /** 로딩 상태 설정 */
  setLoading: (isLoading: boolean) => void;

  /** 에러 설정 */
  setError: (error: string | null) => void;

  /** 에러 초기화 */
  clearError: () => void;

  /** 스토어 초기화 */
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  brandKit: null,
  brandDNA: null,
  isLoading: false,
  error: null,
};

// ============================================================================
// Store
// ============================================================================

export const useBrandStore = create<BrandStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setBrandKit: (kit) => {
        set({ brandKit: kit, error: null });
      },

      setBrandDNA: (dna) => {
        set({ brandDNA: dna, error: null });
      },

      updateBrandKitField: (field, value) => {
        set((state) => {
          if (!state.brandKit) return state;

          return {
            brandKit: {
              ...state.brandKit,
              [field]: value,
              updatedAt: new Date().toISOString(),
            },
            error: null,
          };
        });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ error, isLoading: false });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'brand-storage',
      partialize: (state) => ({
        // brandKit과 brandDNA를 persist
        brandKit: state.brandKit,
        brandDNA: state.brandDNA,
      }),
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectBrandColors = (state: BrandStore) => {
  if (!state.brandKit) return null;

  return {
    primary: state.brandKit.primaryColor,
    secondary: state.brandKit.secondaryColor,
    accent: state.brandKit.accentColor,
  };
};

export const selectBrandTone = (state: BrandStore) => {
  if (state.brandDNA) {
    return state.brandDNA.tone;
  }
  if (state.brandKit) {
    return state.brandKit.toneKeywords.join(', ');
  }
  return null;
};

export const selectBrandKeyMessages = (state: BrandStore) => {
  if (state.brandDNA) {
    return state.brandDNA.key_messages;
  }
  if (state.brandKit) {
    return state.brandKit.keyMessages;
  }
  return [];
};
