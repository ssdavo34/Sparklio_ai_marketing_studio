/**
 * Generated Assets Store
 *
 * Chat AI에서 생성된 마케팅 에셋을 저장하고 관리
 * - 슬라이드 데이터
 * - 인스타그램 광고 데이터
 * - 상세페이지 데이터
 * - 쇼츠 스크립트 데이터
 * - 컨셉보드 데이터
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-26
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

// 슬라이드 데이터
export interface GeneratedSlide {
  id: string;
  title: string;
  content: string;
  bullets?: string[];
  speakerNotes?: string;
  imagePrompt?: string;
  imageUrl?: string;
}

export interface GeneratedSlidesData {
  id: string;
  title: string;
  slides: GeneratedSlide[];
  createdAt: Date;
  sourceMessage?: string;
}

// 인스타그램 광고 데이터
export interface GeneratedInstagramAd {
  ad_id: string;
  ad_type: 'single_image' | 'carousel';
  format: 'feed' | 'story';
  aspect_ratio: string;
  creative: {
    headline: string;
    primary_text: string;
    cta_text: string;
    image_url?: string;
    image_prompt?: string;
    cards?: {
      card_number: number;
      title: string;
      description: string;
      image_prompt?: string;
    }[];
  };
}

export interface GeneratedInstagramData {
  id: string;
  title: string;
  ads: GeneratedInstagramAd[];
  hashtags: string[];
  createdAt: Date;
  sourceMessage?: string;
}

// 상세페이지 데이터
export interface GeneratedDetailSection {
  section_type: 'hero' | 'problem' | 'solution' | 'demo' | 'benefits' | 'testimonials' | 'pricing' | 'cta';
  order: number;
  content: any;
}

export interface GeneratedDetailData {
  id: string;
  title: string;
  sections: GeneratedDetailSection[];
  createdAt: Date;
  sourceMessage?: string;
}

// 쇼츠 스크립트 데이터
export interface GeneratedShortsScene {
  scene_number: number;
  duration: string;
  visual: string;
  narration: string;
  text_overlay?: string;
  transition?: string;
}

export interface GeneratedShortsData {
  id: string;
  title: string;
  hook: string;
  scenes: GeneratedShortsScene[];
  cta: string;
  music_suggestion?: string;
  total_duration?: string;
  createdAt: Date;
  sourceMessage?: string;
}

// 컨셉 데이터
export interface GeneratedConcept {
  concept_id: string;
  concept_name: string;
  description: string;
  headline: string;
  subheadline?: string;
  cta?: string;
  color_scheme?: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  target_audience?: string;
  tone?: string;
}

export interface GeneratedConceptBoardData {
  id: string;
  campaign_name: string;
  concepts: GeneratedConcept[];
  createdAt: Date;
  sourceMessage?: string;
}

// ============================================================================
// Store State
// ============================================================================

export interface GeneratedAssetsState {
  // 생성된 에셋 데이터
  slidesData: GeneratedSlidesData | null;
  instagramData: GeneratedInstagramData | null;
  detailData: GeneratedDetailData | null;
  shortsData: GeneratedShortsData | null;
  conceptBoardData: GeneratedConceptBoardData | null;

  // 마지막 업데이트 시간
  lastUpdated: Date | null;

  // 데이터 유무 체크
  hasSlides: boolean;
  hasInstagram: boolean;
  hasDetail: boolean;
  hasShorts: boolean;
  hasConceptBoard: boolean;

  // Actions
  setSlidesData: (data: GeneratedSlidesData | null) => void;
  setInstagramData: (data: GeneratedInstagramData | null) => void;
  setDetailData: (data: GeneratedDetailData | null) => void;
  setShortsData: (data: GeneratedShortsData | null) => void;
  setConceptBoardData: (data: GeneratedConceptBoardData | null) => void;

  // AI 응답에서 에셋 파싱 및 저장
  parseAndStoreFromAIResponse: (response: string, userMessage: string) => void;

  // 전체 초기화
  clearAll: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * AI 응답에서 슬라이드 데이터 추출
 */
function extractSlidesData(parsed: any, userMessage: string): GeneratedSlidesData | null {
  // 슬라이드 관련 키워드 체크
  if (parsed.slides && Array.isArray(parsed.slides)) {
    return {
      id: generateId(),
      title: parsed.title || parsed.presentation_title || '생성된 슬라이드',
      slides: parsed.slides.map((slide: any, idx: number) => ({
        id: `slide-${idx + 1}`,
        title: slide.title || slide.headline || `슬라이드 ${idx + 1}`,
        content: slide.content || slide.body || slide.text || '',
        bullets: slide.bullets || slide.points || [],
        speakerNotes: slide.speaker_notes || slide.notes || '',
        imagePrompt: slide.image_prompt || slide.visual_prompt || '',
      })),
      createdAt: new Date(),
      sourceMessage: userMessage,
    };
  }
  return null;
}

/**
 * AI 응답에서 인스타그램 광고 데이터 추출
 */
function extractInstagramData(parsed: any, userMessage: string): GeneratedInstagramData | null {
  // 인스타그램 관련 데이터 체크
  if (parsed.ads && Array.isArray(parsed.ads)) {
    return {
      id: generateId(),
      title: parsed.title || '생성된 인스타그램 광고',
      ads: parsed.ads.map((ad: any, idx: number) => ({
        ad_id: ad.ad_id || `ad-${idx + 1}`,
        ad_type: ad.ad_type || 'single_image',
        format: ad.format || 'feed',
        aspect_ratio: ad.aspect_ratio || '1:1',
        creative: {
          headline: ad.creative?.headline || ad.headline || '',
          primary_text: ad.creative?.primary_text || ad.text || ad.body || '',
          cta_text: ad.creative?.cta_text || ad.cta || '자세히 알아보기',
          image_prompt: ad.creative?.image_prompt || ad.image_prompt || '',
          cards: ad.creative?.cards || ad.cards,
        },
      })),
      hashtags: parsed.hashtags || [],
      createdAt: new Date(),
      sourceMessage: userMessage,
    };
  }

  // social_media_content에서 인스타그램 추출
  if (parsed.social_media_content && Array.isArray(parsed.social_media_content)) {
    const instagramPosts = parsed.social_media_content.filter(
      (item: any) => item.platform === '인스타그램' || item.platform?.toLowerCase() === 'instagram'
    );

    if (instagramPosts.length > 0) {
      const hashtags: string[] = [];
      const ads = instagramPosts.map((post: any, idx: number) => {
        // 해시태그 추출
        const hashtagMatch = post.content?.match(/#\S+/g);
        if (hashtagMatch) {
          hashtags.push(...hashtagMatch);
        }

        return {
          ad_id: `ig-${idx + 1}`,
          ad_type: 'single_image' as const,
          format: 'feed' as const,
          aspect_ratio: '1:1',
          creative: {
            headline: parsed.optimized_product_title || post.title || '',
            primary_text: post.content || '',
            cta_text: '자세히 알아보기',
          },
        };
      });

      return {
        id: generateId(),
        title: '생성된 인스타그램 콘텐츠',
        ads,
        hashtags: [...new Set(hashtags)], // 중복 제거
        createdAt: new Date(),
        sourceMessage: userMessage,
      };
    }
  }

  return null;
}

/**
 * AI 응답에서 상세페이지 데이터 추출
 */
function extractDetailData(parsed: any, userMessage: string): GeneratedDetailData | null {
  if (parsed.sections && Array.isArray(parsed.sections)) {
    return {
      id: generateId(),
      title: parsed.title || '생성된 상세페이지',
      sections: parsed.sections.map((section: any, idx: number) => ({
        section_type: section.section_type || section.type || 'hero',
        order: section.order || idx + 1,
        content: section.content || section,
      })),
      createdAt: new Date(),
      sourceMessage: userMessage,
    };
  }

  // marketing_brief에서 상세페이지 생성
  if (parsed.marketing_brief) {
    const brief = parsed.marketing_brief;
    const sections: GeneratedDetailSection[] = [];

    // Hero section
    sections.push({
      section_type: 'hero',
      order: 1,
      content: {
        headline: parsed.optimized_product_title || parsed.headline || '',
        subheadline: brief.summary || '',
        cta_text: '무료 체험 시작',
      },
    });

    // Solution/Features section
    if (parsed.unique_selling_points && parsed.unique_selling_points.length > 0) {
      sections.push({
        section_type: 'solution',
        order: 2,
        content: {
          title: '주요 특장점',
          features: parsed.unique_selling_points.map((point: string, idx: number) => ({
            icon: 'sparkles',
            title: point,
            description: '',
          })),
        },
      });
    }

    // CTA section
    sections.push({
      section_type: 'cta',
      order: sections.length + 1,
      content: {
        title: '지금 바로 시작하세요',
        subtitle: brief.summary || '',
        primary_cta: { text: '무료 체험', url: '/signup' },
        secondary_cta: { text: '데모 예약', url: '/demo' },
      },
    });

    if (sections.length > 0) {
      return {
        id: generateId(),
        title: '생성된 상세페이지',
        sections,
        createdAt: new Date(),
        sourceMessage: userMessage,
      };
    }
  }

  return null;
}

/**
 * AI 응답에서 쇼츠 스크립트 데이터 추출
 */
function extractShortsData(parsed: any, userMessage: string): GeneratedShortsData | null {
  if (parsed.scenes && Array.isArray(parsed.scenes)) {
    return {
      id: generateId(),
      title: parsed.title || '생성된 쇼츠 스크립트',
      hook: parsed.hook || parsed.intro || '',
      scenes: parsed.scenes.map((scene: any, idx: number) => ({
        scene_number: scene.scene_number || idx + 1,
        duration: scene.duration || '3초',
        visual: scene.visual || scene.description || '',
        narration: scene.narration || scene.script || '',
        text_overlay: scene.text_overlay || scene.overlay || '',
        transition: scene.transition || 'cut',
      })),
      cta: parsed.cta || parsed.outro || '',
      music_suggestion: parsed.music_suggestion || parsed.music || '',
      total_duration: parsed.total_duration || '',
      createdAt: new Date(),
      sourceMessage: userMessage,
    };
  }
  return null;
}

/**
 * AI 응답에서 컨셉보드 데이터 추출
 */
function extractConceptBoardData(parsed: any, userMessage: string): GeneratedConceptBoardData | null {
  if (parsed.concepts && Array.isArray(parsed.concepts)) {
    return {
      id: generateId(),
      campaign_name: parsed.campaign_name || parsed.title || '생성된 캠페인',
      concepts: parsed.concepts.map((concept: any, idx: number) => ({
        concept_id: concept.concept_id || `concept-${idx + 1}`,
        concept_name: concept.concept_name || concept.name || `컨셉 ${idx + 1}`,
        description: concept.description || '',
        headline: concept.headline || '',
        subheadline: concept.subheadline || '',
        cta: concept.cta || '',
        color_scheme: concept.color_scheme || concept.colors,
        target_audience: concept.target_audience || '',
        tone: concept.tone || '',
      })),
      createdAt: new Date(),
      sourceMessage: userMessage,
    };
  }

  // 단일 컨셉 데이터에서 컨셉보드 생성
  if (parsed.optimized_product_title || parsed.headline) {
    return {
      id: generateId(),
      campaign_name: '생성된 캠페인',
      concepts: [{
        concept_id: 'concept-1',
        concept_name: parsed.optimized_product_title || parsed.headline || '메인 컨셉',
        description: parsed.product_description || parsed.marketing_brief?.summary || '',
        headline: parsed.optimized_product_title || parsed.headline || '',
        subheadline: parsed.unique_selling_points?.[0] || '',
        cta: '자세히 알아보기',
        target_audience: parsed.marketing_brief?.target_audience || '',
        tone: parsed.marketing_brief?.tone || '',
      }],
      createdAt: new Date(),
      sourceMessage: userMessage,
    };
  }

  return null;
}

// ============================================================================
// Store
// ============================================================================

export const useGeneratedAssetsStore = create<GeneratedAssetsState>()(
  devtools(
    persist(
      (set, get) => ({
        // 초기 상태
        slidesData: null,
        instagramData: null,
        detailData: null,
        shortsData: null,
        conceptBoardData: null,
        lastUpdated: null,

        // Computed
        get hasSlides() {
          return get().slidesData !== null;
        },
        get hasInstagram() {
          return get().instagramData !== null;
        },
        get hasDetail() {
          return get().detailData !== null;
        },
        get hasShorts() {
          return get().shortsData !== null;
        },
        get hasConceptBoard() {
          return get().conceptBoardData !== null;
        },

        // Actions
        setSlidesData: (data) => set({ slidesData: data, lastUpdated: new Date() }),
        setInstagramData: (data) => set({ instagramData: data, lastUpdated: new Date() }),
        setDetailData: (data) => set({ detailData: data, lastUpdated: new Date() }),
        setShortsData: (data) => set({ shortsData: data, lastUpdated: new Date() }),
        setConceptBoardData: (data) => set({ conceptBoardData: data, lastUpdated: new Date() }),

        /**
         * AI 응답에서 모든 에셋 타입 파싱 및 저장
         */
        parseAndStoreFromAIResponse: (response: string, userMessage: string) => {
          console.log('[useGeneratedAssetsStore] Parsing AI response...');

          try {
            // JSON 추출
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              console.log('[useGeneratedAssetsStore] No JSON found in response');
              return;
            }

            const parsed = JSON.parse(jsonMatch[0]);
            console.log('[useGeneratedAssetsStore] Parsed JSON:', Object.keys(parsed));

            const updates: Partial<GeneratedAssetsState> = {
              lastUpdated: new Date(),
            };

            // 각 에셋 타입 추출 시도
            const slidesData = extractSlidesData(parsed, userMessage);
            if (slidesData) {
              console.log('[useGeneratedAssetsStore] Found slides data:', slidesData.slides.length, 'slides');
              updates.slidesData = slidesData;
            }

            const instagramData = extractInstagramData(parsed, userMessage);
            if (instagramData) {
              console.log('[useGeneratedAssetsStore] Found instagram data:', instagramData.ads.length, 'ads');
              updates.instagramData = instagramData;
            }

            const detailData = extractDetailData(parsed, userMessage);
            if (detailData) {
              console.log('[useGeneratedAssetsStore] Found detail data:', detailData.sections.length, 'sections');
              updates.detailData = detailData;
            }

            const shortsData = extractShortsData(parsed, userMessage);
            if (shortsData) {
              console.log('[useGeneratedAssetsStore] Found shorts data:', shortsData.scenes.length, 'scenes');
              updates.shortsData = shortsData;
            }

            const conceptBoardData = extractConceptBoardData(parsed, userMessage);
            if (conceptBoardData) {
              console.log('[useGeneratedAssetsStore] Found concept board data:', conceptBoardData.concepts.length, 'concepts');
              updates.conceptBoardData = conceptBoardData;
            }

            // 상태 업데이트
            set(updates);
            console.log('[useGeneratedAssetsStore] Assets stored successfully');

          } catch (error) {
            console.error('[useGeneratedAssetsStore] Failed to parse AI response:', error);
          }
        },

        clearAll: () => set({
          slidesData: null,
          instagramData: null,
          detailData: null,
          shortsData: null,
          conceptBoardData: null,
          lastUpdated: null,
        }),
      }),
      {
        name: 'generated-assets-store',
        partialize: (state) => ({
          slidesData: state.slidesData,
          instagramData: state.instagramData,
          detailData: state.detailData,
          shortsData: state.shortsData,
          conceptBoardData: state.conceptBoardData,
          lastUpdated: state.lastUpdated,
        }),
      }
    ),
    { name: 'GeneratedAssetsStore' }
  )
);
