import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { CenterViewType, ConceptBoardData, ConceptData } from '@/types/demo';

interface CenterViewState {
  // 현재 뷰
  currentView: CenterViewType;

  // 선택된 항목들
  selectedCampaignId: string | null;
  selectedConceptId: string | null;
  selectedAssetId: string | null;

  // 캐시된 데이터
  conceptBoardData: ConceptBoardData | null;
  selectedConcept: ConceptData | null;

  // 로딩 상태
  isLoading: boolean;

  // 액션
  setView: (view: CenterViewType) => void;
  setCampaignId: (campaignId: string) => void;
  setConceptId: (conceptId: string) => void;
  setAssetId: (assetId: string) => void;
  setConceptBoardData: (data: ConceptBoardData) => void;
  setSelectedConcept: (concept: ConceptData) => void;
  setLoading: (loading: boolean) => void;

  // 뷰 전환 헬퍼
  openConceptBoard: (campaignId?: string) => void;
  openSlidesPreview: (conceptId: string, assetId: string) => void;
  openDetailPreview: (conceptId: string, assetId: string) => void;
  openInstagramPreview: (conceptId: string, assetId: string) => void;
  openShortsPreview: (conceptId: string, assetId: string) => void;
  backToConceptBoard: () => void;
  backToCanvas: () => void;

  // 리셋
  resetView: () => void;
}

export const useCenterViewStore = create<CenterViewState>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      currentView: 'canvas',
      selectedCampaignId: null,
      selectedConceptId: null,
      selectedAssetId: null,
      conceptBoardData: null,
      selectedConcept: null,
      isLoading: false,

      // 기본 액션
      setView: (view) => set({ currentView: view }),
      setCampaignId: (campaignId) => set({ selectedCampaignId: campaignId }),
      setConceptId: (conceptId) => set({ selectedConceptId: conceptId }),
      setAssetId: (assetId) => set({ selectedAssetId: assetId }),
      setConceptBoardData: (data) => set({ conceptBoardData: data }),
      setSelectedConcept: (concept) => set({ selectedConcept: concept }),
      setLoading: (loading) => set({ isLoading: loading }),

      // 뷰 전환 헬퍼
      openConceptBoard: (campaignId) => {
        set({
          currentView: 'concept_board',
          selectedCampaignId: campaignId || get().selectedCampaignId,
          selectedAssetId: null,
        });
      },

      openSlidesPreview: (conceptId, assetId) => {
        const { conceptBoardData } = get();
        const concept = conceptBoardData?.concepts.find(c => c.concept_id === conceptId);

        set({
          currentView: 'slides_preview',
          selectedConceptId: conceptId,
          selectedAssetId: assetId,
          selectedConcept: concept || null,
        });
      },

      openDetailPreview: (conceptId, assetId) => {
        const { conceptBoardData } = get();
        const concept = conceptBoardData?.concepts.find(c => c.concept_id === conceptId);

        set({
          currentView: 'detail_preview',
          selectedConceptId: conceptId,
          selectedAssetId: assetId,
          selectedConcept: concept || null,
        });
      },

      openInstagramPreview: (conceptId, assetId) => {
        const { conceptBoardData } = get();
        const concept = conceptBoardData?.concepts.find(c => c.concept_id === conceptId);

        set({
          currentView: 'instagram_preview',
          selectedConceptId: conceptId,
          selectedAssetId: assetId,
          selectedConcept: concept || null,
        });
      },

      openShortsPreview: (conceptId, assetId) => {
        const { conceptBoardData } = get();
        const concept = conceptBoardData?.concepts.find(c => c.concept_id === conceptId);

        set({
          currentView: 'shorts_preview',
          selectedConceptId: conceptId,
          selectedAssetId: assetId,
          selectedConcept: concept || null,
        });
      },

      backToConceptBoard: () => {
        set({
          currentView: 'concept_board',
          selectedAssetId: null,
        });
      },

      backToCanvas: () => {
        set({
          currentView: 'canvas',
          selectedConceptId: null,
          selectedAssetId: null,
        });
      },

      // 리셋
      resetView: () => set({
        currentView: 'canvas',
        selectedCampaignId: null,
        selectedConceptId: null,
        selectedAssetId: null,
        conceptBoardData: null,
        selectedConcept: null,
        isLoading: false,
      }),
    }),
    { name: 'center-view-store' }
  )
);
