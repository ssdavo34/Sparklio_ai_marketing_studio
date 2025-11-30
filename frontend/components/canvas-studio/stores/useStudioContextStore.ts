/**
 * Studio Context Store
 *
 * 전역 스튜디오 컨텍스트 관리
 * - Chat이 Canvas 상태를 알 수 있도록
 * - Chat이 좌측 패널 상태를 알 수 있도록
 * - 모든 컴포넌트 간 상태 동기화
 *
 * @author C Team (Frontend Team)
 * @version 1.0
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { StoreType } from 'polotno/model/store';
import type { BrandDNA } from '@/lib/api/brand-api';

// ============================================================================
// Types
// ============================================================================

/** 선택된 Canvas 요소 정보 */
export interface SelectedElement {
  id: string;
  type: 'text' | 'image' | 'svg' | 'video' | 'line' | 'figure';
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  // Text specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  // Image specific
  src?: string;
}

/** 현재 페이지 정보 */
export interface CurrentPageInfo {
  id: string;
  index: number;
  width: number;
  height: number;
  elementsCount: number;
}

/** 대화 상태 (소스 수집 흐름용) */
export type ConversationPhase = 'idle' | 'gathering' | 'confirming' | 'generating';

/** 수집된 컨텍스트 정보 */
export interface CollectedContext {
  brandUrl?: string;
  brandName?: string;
  targetAudience?: string;
  purpose?: string;
  tone?: string;
  files?: Array<{ name: string; type: string; dataUrl?: string }>;
  additionalInfo?: string;
}

/** Chat에서 필요한 정보 목록 */
export type MissingInfo = 'brand' | 'target' | 'purpose' | 'tone' | 'files';

// ============================================================================
// Store Interface
// ============================================================================

export interface StudioContextState {
  // ========================================
  // Canvas Context
  // ========================================
  /** 현재 선택된 요소들 */
  selectedElements: SelectedElement[];
  /** 현재 활성 페이지 정보 */
  currentPage: CurrentPageInfo | null;
  /** 전체 페이지 수 */
  totalPages: number;
  /** Canvas가 로드되었는지 */
  isCanvasReady: boolean;

  // ========================================
  // Brand Context
  // ========================================
  /** 현재 활성 Brand DNA */
  activeBrandDNA: BrandDNA | null;
  /** 현재 Brand ID */
  activeBrandId: string | null;

  // ========================================
  // Conversation Context (소스 수집 흐름)
  // ========================================
  /** 대화 상태 */
  conversationPhase: ConversationPhase;
  /** 수집된 컨텍스트 */
  collectedContext: CollectedContext;
  /** 아직 수집되지 않은 정보 */
  missingInfo: MissingInfo[];
  /** 현재 진행 중인 작업 유형 */
  pendingTaskType: string | null;

  // ========================================
  // Actions - Canvas
  // ========================================
  setSelectedElements: (elements: SelectedElement[]) => void;
  setCurrentPage: (page: CurrentPageInfo | null) => void;
  setTotalPages: (count: number) => void;
  setCanvasReady: (ready: boolean) => void;

  // ========================================
  // Actions - Brand
  // ========================================
  setActiveBrandDNA: (dna: BrandDNA | null) => void;
  setActiveBrandId: (id: string | null) => void;

  // ========================================
  // Actions - Conversation
  // ========================================
  setConversationPhase: (phase: ConversationPhase) => void;
  updateCollectedContext: (context: Partial<CollectedContext>) => void;
  setMissingInfo: (info: MissingInfo[]) => void;
  setPendingTaskType: (taskType: string | null) => void;
  resetConversationContext: () => void;

  // ========================================
  // Sync Actions
  // ========================================
  /** Polotno Store에서 상태 동기화 */
  syncFromPolotnoStore: (store: StoreType) => void;

  // ========================================
  // Helper Getters
  // ========================================
  /** Chat에서 사용할 컨텍스트 요약 */
  getChatContext: () => string;
  /** 선택된 요소가 있는지 */
  hasSelection: () => boolean;
  /** 이미지 요소가 선택되었는지 */
  hasImageSelected: () => boolean;
  /** 텍스트 요소가 선택되었는지 */
  hasTextSelected: () => boolean;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useStudioContextStore = create<StudioContextState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // ========================================
      // Initial State - Canvas
      // ========================================
      selectedElements: [],
      currentPage: null,
      totalPages: 0,
      isCanvasReady: false,

      // ========================================
      // Initial State - Brand
      // ========================================
      activeBrandDNA: null,
      activeBrandId: null,

      // ========================================
      // Initial State - Conversation
      // ========================================
      conversationPhase: 'idle',
      collectedContext: {},
      missingInfo: [],
      pendingTaskType: null,

      // ========================================
      // Actions - Canvas
      // ========================================
      setSelectedElements: (elements) => set({ selectedElements: elements }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setTotalPages: (count) => set({ totalPages: count }),
      setCanvasReady: (ready) => set({ isCanvasReady: ready }),

      // ========================================
      // Actions - Brand
      // ========================================
      setActiveBrandDNA: (dna) => set({ activeBrandDNA: dna }),
      setActiveBrandId: (id) => set({ activeBrandId: id }),

      // ========================================
      // Actions - Conversation
      // ========================================
      setConversationPhase: (phase) => set({ conversationPhase: phase }),

      updateCollectedContext: (context) =>
        set((state) => ({
          collectedContext: { ...state.collectedContext, ...context },
        })),

      setMissingInfo: (info) => set({ missingInfo: info }),
      setPendingTaskType: (taskType) => set({ pendingTaskType: taskType }),

      resetConversationContext: () =>
        set({
          conversationPhase: 'idle',
          collectedContext: {},
          missingInfo: [],
          pendingTaskType: null,
        }),

      // ========================================
      // Sync Actions
      // ========================================
      syncFromPolotnoStore: (store) => {
        if (!store) return;

        try {
          // 선택된 요소 동기화
          const selectedIds = store.selectedElementsIds || [];
          const activePage = store.activePage;

          if (activePage && selectedIds.length > 0) {
            const elements: SelectedElement[] = [];

            for (const id of selectedIds) {
              const element = activePage.children?.find((el: any) => el.id === id);
              if (element) {
                elements.push({
                  id: element.id,
                  type: element.type,
                  name: element.name,
                  x: element.x,
                  y: element.y,
                  width: element.width,
                  height: element.height,
                  text: element.text,
                  fontSize: element.fontSize,
                  fontFamily: element.fontFamily,
                  fill: element.fill,
                  src: element.src,
                });
              }
            }

            set({ selectedElements: elements });
          } else {
            set({ selectedElements: [] });
          }

          // 현재 페이지 정보 동기화
          if (activePage) {
            const pageIndex = store.pages?.findIndex((p: any) => p.id === activePage.id) ?? 0;
            set({
              currentPage: {
                id: activePage.id,
                index: pageIndex,
                width: typeof activePage.width === 'number' ? activePage.width : 1080,
                height: typeof activePage.height === 'number' ? activePage.height : 1080,
                elementsCount: activePage.children?.length ?? 0,
              },
            });
          }

          // 전체 페이지 수 동기화
          set({ totalPages: store.pages?.length ?? 0 });
        } catch (error) {
          console.error('[useStudioContextStore] Error syncing from Polotno:', error);
        }
      },

      // ========================================
      // Helper Getters
      // ========================================
      getChatContext: () => {
        const state = get();
        const parts: string[] = [];

        // Canvas 컨텍스트
        if (state.isCanvasReady && state.currentPage) {
          parts.push(
            `[Canvas] ${state.currentPage.width}x${state.currentPage.height}, ` +
              `페이지 ${state.currentPage.index + 1}/${state.totalPages}, ` +
              `요소 ${state.currentPage.elementsCount}개`
          );
        }

        // 선택 컨텍스트
        if (state.selectedElements.length > 0) {
          const types = state.selectedElements.map((e) => e.type).join(', ');
          parts.push(`[선택됨] ${state.selectedElements.length}개 요소 (${types})`);
        }

        // Brand 컨텍스트
        if (state.activeBrandDNA) {
          parts.push(`[브랜드] ${state.activeBrandId || '활성'}`);
        }

        // 대화 컨텍스트
        if (state.conversationPhase !== 'idle') {
          parts.push(`[대화] ${state.conversationPhase}`);
        }

        return parts.join(' | ');
      },

      hasSelection: () => get().selectedElements.length > 0,

      hasImageSelected: () => get().selectedElements.some((e) => e.type === 'image'),

      hasTextSelected: () => get().selectedElements.some((e) => e.type === 'text'),
    })),
    { name: 'StudioContextStore' }
  )
);

// ============================================================================
// Exports
// ============================================================================

export default useStudioContextStore;
