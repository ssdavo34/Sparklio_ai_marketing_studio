/**
 * Brief Store
 *
 * 캠페인 브리프 상태 관리
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 1.2.4
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Brief, BriefValidation, ChannelType } from '@/types/brief';
import { validateBrief } from '@/types/brief';

// ============================================================================
// Types
// ============================================================================

interface BriefStore {
  // State
  /** 현재 브리프 */
  brief: Brief | null;

  /** 브리프 유효성 검사 결과 */
  validation: BriefValidation | null;

  /** 편집 모드 */
  isEditing: boolean;

  /** 로딩 상태 */
  isLoading: boolean;

  /** 에러 */
  error: string | null;

  // Actions
  /** 브리프 설정 */
  setBrief: (brief: Brief | null) => void;

  /** 브리프 필드 업데이트 */
  updateBriefField: <K extends keyof Brief>(field: K, value: Brief[K]) => void;

  /** 주요 메시지 추가 */
  addKeyMessage: (message: string) => void;

  /** 주요 메시지 제거 */
  removeKeyMessage: (index: number) => void;

  /** 채널 토글 */
  toggleChannel: (channel: ChannelType) => void;

  /** KPI 추가 */
  addKPI: (kpi: string) => void;

  /** KPI 제거 */
  removeKPI: (index: number) => void;

  /** 브리프 유효성 검사 */
  validate: () => void;

  /** 편집 모드 토글 */
  setIsEditing: (isEditing: boolean) => void;

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
  brief: null,
  validation: null,
  isEditing: false,
  isLoading: false,
  error: null,
};

// ============================================================================
// Store
// ============================================================================

export const useBriefStore = create<BriefStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setBrief: (brief) => {
        set({ brief, error: null });
        if (brief) {
          get().validate();
        } else {
          set({ validation: null });
        }
      },

      updateBriefField: (field, value) => {
        set((state) => {
          if (!state.brief) return state;

          const updatedBrief = {
            ...state.brief,
            [field]: value,
            updatedAt: new Date().toISOString(),
          };

          return {
            brief: updatedBrief,
            error: null,
          };
        });
        get().validate();
      },

      addKeyMessage: (message) => {
        set((state) => {
          if (!state.brief) return state;

          const updatedBrief = {
            ...state.brief,
            keyMessages: [...state.brief.keyMessages, message],
            updatedAt: new Date().toISOString(),
          };

          return { brief: updatedBrief, error: null };
        });
        get().validate();
      },

      removeKeyMessage: (index) => {
        set((state) => {
          if (!state.brief) return state;

          const updatedBrief = {
            ...state.brief,
            keyMessages: state.brief.keyMessages.filter((_, i) => i !== index),
            updatedAt: new Date().toISOString(),
          };

          return { brief: updatedBrief, error: null };
        });
        get().validate();
      },

      toggleChannel: (channel) => {
        set((state) => {
          if (!state.brief) return state;

          const channels = state.brief.channels.includes(channel)
            ? state.brief.channels.filter((c) => c !== channel)
            : [...state.brief.channels, channel];

          const updatedBrief = {
            ...state.brief,
            channels,
            updatedAt: new Date().toISOString(),
          };

          return { brief: updatedBrief, error: null };
        });
        get().validate();
      },

      addKPI: (kpi) => {
        set((state) => {
          if (!state.brief) return state;

          const updatedBrief = {
            ...state.brief,
            kpis: [...state.brief.kpis, kpi],
            updatedAt: new Date().toISOString(),
          };

          return { brief: updatedBrief, error: null };
        });
        get().validate();
      },

      removeKPI: (index) => {
        set((state) => {
          if (!state.brief) return state;

          const updatedBrief = {
            ...state.brief,
            kpis: state.brief.kpis.filter((_, i) => i !== index),
            updatedAt: new Date().toISOString(),
          };

          return { brief: updatedBrief, error: null };
        });
        get().validate();
      },

      validate: () => {
        const { brief } = get();
        if (!brief) {
          set({ validation: null });
          return;
        }

        const validation = validateBrief(brief);
        set({ validation });
      },

      setIsEditing: (isEditing) => {
        set({ isEditing });
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
      name: 'brief-storage',
      partialize: (state) => ({
        // brief만 persist
        brief: state.brief,
      }),
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectBriefCompleteness = (state: BriefStore) =>
  state.validation?.completeness || 0;

export const selectBriefIsValid = (state: BriefStore) =>
  state.validation?.isValid || false;

export const selectBriefMissingFields = (state: BriefStore) => ({
  required: state.validation?.missingRequired || [],
  recommended: state.validation?.missingRecommended || [],
});

export const selectBriefChannels = (state: BriefStore) =>
  state.brief?.channels || [];

export const selectBriefHasChannel =
  (channel: ChannelType) => (state: BriefStore) =>
    state.brief?.channels.includes(channel) || false;
