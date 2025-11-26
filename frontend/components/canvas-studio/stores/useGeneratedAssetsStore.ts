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
import { sendChatMessage } from '@/lib/llm-gateway-client';

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

  // 컨셉 기반 컨텐츠 생성 함수들
  generateSlidesFromConcept: (concept: GeneratedConcept) => Promise<void>;
  generateDetailFromConcept: (concept: GeneratedConcept) => Promise<void>;
  generateInstagramFromConcept: (concept: GeneratedConcept) => Promise<void>;
  generateShortsFromConcept: (concept: GeneratedConcept) => Promise<void>;

  // 생성 로딩 상태
  isGeneratingSlides: boolean;
  isGeneratingDetail: boolean;
  isGeneratingInstagram: boolean;
  isGeneratingShorts: boolean;

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

  // product_features 또는 product_benefits에서 3개 컨셉 생성 (최대 3개로 제한)
  if (parsed.product_features && Array.isArray(parsed.product_features) && parsed.product_features.length > 0) {
    const campaignName = parsed.product_title || parsed.optimized_product_title || userMessage || '생성된 캠페인';
    const productDescription = parsed.product_description || parsed.optimized_description || '';
    const targetAudience = parsed.marketing_brief?.target_audience || parsed.target_audience || '전체 고객';
    const tone = parsed.marketing_brief?.tone || parsed.tone || '친근하고 전문적인';

    // features와 benefits 합치기 (문자열 배열 또는 객체 배열 둘 다 지원)
    const allItems: string[] = [];

    // product_features 처리 (문자열 배열 또는 객체 배열)
    parsed.product_features.forEach((item: any) => {
      if (typeof item === 'string') {
        allItems.push(item);
      } else if (item.feature_title || item.title || item.name) {
        allItems.push(item.feature_title || item.title || item.name);
      }
    });

    // product_benefits 처리
    if (parsed.product_benefits && Array.isArray(parsed.product_benefits)) {
      parsed.product_benefits.forEach((item: any) => {
        if (typeof item === 'string') {
          allItems.push(item);
        } else if (item.benefit_title || item.title || item.name) {
          allItems.push(item.benefit_title || item.title || item.name);
        }
      });
    }

    // 최대 3개 컨셉만 생성
    const concepts: GeneratedConcept[] = allItems.slice(0, 3).map((itemTitle: string, idx: number) => ({
      concept_id: `concept-${idx + 1}-${generateId()}`,
      concept_name: itemTitle,
      description: productDescription,
      headline: itemTitle,
      subheadline: campaignName,
      cta: idx === 0 ? '자세히 알아보기' : idx === 1 ? '지금 시작하기' : '경험하기',
      target_audience: targetAudience,
      tone: tone,
    }));

    return {
      id: generateId(),
      campaign_name: campaignName,
      concepts,
      createdAt: new Date(),
      sourceMessage: userMessage,
    };
  }

  // 단일 컨셉 데이터에서 3가지 컨셉 변형 생성
  if (parsed.optimized_product_title || parsed.headline || parsed.product_title) {
    const productTitle = parsed.product_title || parsed.optimized_product_title || parsed.headline || '메인 컨셉';
    const productDescription = parsed.product_description || parsed.optimized_description || parsed.marketing_brief?.summary || '';
    const usps = parsed.unique_selling_points || [];
    const targetAudience = parsed.marketing_brief?.target_audience || parsed.target_audience || '';
    const tone = parsed.marketing_brief?.tone || parsed.tone || '';

    // content_optimization에서 키워드 추출
    const keywords: string[] = parsed.content_optimization?.keywords || [];
    const contentStrategy = parsed.content_optimization?.content_strategy || '';

    // social_media_headline 활용
    const socialHeadline = parsed.social_media_headline || '';

    const concepts: GeneratedConcept[] = [
      // 컨셉 1: 메인 (제품 특징 강조)
      {
        concept_id: `concept-main-${generateId()}`,
        concept_name: '성능 강조',
        description: productDescription,
        headline: productTitle,
        subheadline: targetAudience ? `${targetAudience}를 위한 최적의 선택` : '당신을 위한 최적의 선택',
        cta: '자세히 알아보기',
        target_audience: targetAudience,
        tone: tone,
      },
      // 컨셉 2: SNS/마케팅 (소셜 미디어용)
      {
        concept_id: `concept-social-${generateId()}`,
        concept_name: 'SNS 마케팅',
        description: contentStrategy || `${productDescription}\n\n지금 바로 경험해보세요.`,
        headline: socialHeadline || (keywords.length > 0 ? keywords.slice(0, 3).join(' | ') : `${productTitle} - 특별한 경험`),
        subheadline: keywords.length > 0 ? `#${keywords.slice(0, 3).join(' #')}` : productTitle,
        cta: '지금 시작하기',
        target_audience: targetAudience,
        tone: tone,
      },
      // 컨셉 3: 감성적 접근 (USP 강조)
      {
        concept_id: `concept-emotional-${generateId()}`,
        concept_name: '감성 마케팅',
        description: usps.length > 0 ? usps.join('\n• ') : productDescription,
        headline: usps.length > 0 ? usps[0] : `${tone || '특별한'} ${productTitle}`,
        subheadline: targetAudience ? `${targetAudience}의 선택` : '당신의 선택',
        cta: '경험하기',
        target_audience: targetAudience,
        tone: tone,
      },
    ];

    return {
      id: generateId(),
      campaign_name: productTitle,
      concepts,
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

        // 생성 로딩 상태
        isGeneratingSlides: false,
        isGeneratingDetail: false,
        isGeneratingInstagram: false,
        isGeneratingShorts: false,

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

        /**
         * 컨셉 기반 슬라이드 생성
         */
        generateSlidesFromConcept: async (concept: GeneratedConcept) => {
          set({ isGeneratingSlides: true });
          console.log('[useGeneratedAssetsStore] Generating slides for concept:', concept.concept_name);

          try {
            const prompt = `다음 마케팅 컨셉을 기반으로 프레젠테이션 슬라이드를 생성해주세요:

컨셉명: ${concept.concept_name}
설명: ${concept.description}
헤드라인: ${concept.headline}
서브헤드라인: ${concept.subheadline || ''}
타겟 고객: ${concept.target_audience || '전체 고객'}
톤앤매너: ${concept.tone || '전문적'}

총 5개의 슬라이드를 JSON 형식으로 생성해주세요:
{
  "slides": [
    { "title": "제목", "content": "내용", "bullets": ["포인트1", "포인트2"], "speaker_notes": "발표자 노트" }
  ]
}`;

            const response = await sendChatMessage({
              userInput: prompt,
              agent: 'copywriter',
              task: 'generate_slides',
              language: 'ko',
            });

            if (response.content) {
              const jsonMatch = response.content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.slides && Array.isArray(parsed.slides)) {
                  const slidesData: GeneratedSlidesData = {
                    id: generateId(),
                    title: concept.concept_name,
                    slides: parsed.slides.map((slide: any, idx: number) => ({
                      id: `slide-${idx + 1}`,
                      title: slide.title || `슬라이드 ${idx + 1}`,
                      content: slide.content || '',
                      bullets: slide.bullets || [],
                      speakerNotes: slide.speaker_notes || '',
                    })),
                    createdAt: new Date(),
                    sourceMessage: concept.concept_name,
                  };
                  set({ slidesData, lastUpdated: new Date() });
                  console.log('[useGeneratedAssetsStore] Slides generated:', slidesData.slides.length);
                }
              }
            }
          } catch (error) {
            console.error('[useGeneratedAssetsStore] Failed to generate slides:', error);
          } finally {
            set({ isGeneratingSlides: false });
          }
        },

        /**
         * 컨셉 기반 상세페이지 생성
         */
        generateDetailFromConcept: async (concept: GeneratedConcept) => {
          set({ isGeneratingDetail: true });
          console.log('[useGeneratedAssetsStore] Generating detail page for concept:', concept.concept_name);

          try {
            const prompt = `다음 마케팅 컨셉을 기반으로 제품 상세페이지 섹션을 생성해주세요:

컨셉명: ${concept.concept_name}
설명: ${concept.description}
헤드라인: ${concept.headline}
타겟 고객: ${concept.target_audience || '전체 고객'}

다음 JSON 형식으로 생성해주세요:
{
  "sections": [
    { "section_type": "hero", "order": 1, "content": { "headline": "", "subheadline": "", "cta": "" } },
    { "section_type": "benefits", "order": 2, "content": { "title": "", "items": [] } },
    { "section_type": "features", "order": 3, "content": { "title": "", "features": [] } },
    { "section_type": "cta", "order": 4, "content": { "headline": "", "button_text": "" } }
  ]
}`;

            const response = await sendChatMessage({
              userInput: prompt,
              agent: 'copywriter',
              task: 'generate_detail',
              language: 'ko',
            });

            if (response.content) {
              const jsonMatch = response.content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.sections && Array.isArray(parsed.sections)) {
                  const detailData: GeneratedDetailData = {
                    id: generateId(),
                    title: concept.concept_name,
                    sections: parsed.sections.map((section: any, idx: number) => ({
                      section_type: section.section_type || 'hero',
                      order: section.order || idx + 1,
                      content: section.content || {},
                    })),
                    createdAt: new Date(),
                    sourceMessage: concept.concept_name,
                  };
                  set({ detailData, lastUpdated: new Date() });
                  console.log('[useGeneratedAssetsStore] Detail page generated:', detailData.sections.length);
                }
              }
            }
          } catch (error) {
            console.error('[useGeneratedAssetsStore] Failed to generate detail page:', error);
          } finally {
            set({ isGeneratingDetail: false });
          }
        },

        /**
         * 컨셉 기반 인스타그램 광고 생성
         */
        generateInstagramFromConcept: async (concept: GeneratedConcept) => {
          set({ isGeneratingInstagram: true });
          console.log('[useGeneratedAssetsStore] Generating Instagram ads for concept:', concept.concept_name);

          try {
            const prompt = `다음 마케팅 컨셉을 기반으로 인스타그램 광고를 생성해주세요:

컨셉명: ${concept.concept_name}
설명: ${concept.description}
헤드라인: ${concept.headline}
타겟 고객: ${concept.target_audience || '전체 고객'}
톤앤매너: ${concept.tone || '친근한'}

다음 JSON 형식으로 3개의 광고와 해시태그를 생성해주세요:
{
  "ads": [
    {
      "ad_type": "single_image",
      "format": "feed",
      "creative": {
        "headline": "광고 헤드라인",
        "primary_text": "광고 본문 텍스트",
        "cta_text": "CTA 버튼 텍스트",
        "image_prompt": "이미지 생성을 위한 프롬프트"
      }
    }
  ],
  "hashtags": ["#해시태그1", "#해시태그2"]
}`;

            const response = await sendChatMessage({
              userInput: prompt,
              agent: 'copywriter',
              task: 'generate_instagram',
              language: 'ko',
            });

            if (response.content) {
              const jsonMatch = response.content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.ads && Array.isArray(parsed.ads)) {
                  const instagramData: GeneratedInstagramData = {
                    id: generateId(),
                    title: concept.concept_name,
                    ads: parsed.ads.map((ad: any, idx: number) => ({
                      ad_id: `ig-${idx + 1}`,
                      ad_type: ad.ad_type || 'single_image',
                      format: ad.format || 'feed',
                      aspect_ratio: '1:1',
                      creative: {
                        headline: ad.creative?.headline || '',
                        primary_text: ad.creative?.primary_text || '',
                        cta_text: ad.creative?.cta_text || '자세히 알아보기',
                        image_prompt: ad.creative?.image_prompt || '',
                      },
                    })),
                    hashtags: parsed.hashtags || [],
                    createdAt: new Date(),
                    sourceMessage: concept.concept_name,
                  };
                  set({ instagramData, lastUpdated: new Date() });
                  console.log('[useGeneratedAssetsStore] Instagram ads generated:', instagramData.ads.length);
                }
              }
            }
          } catch (error) {
            console.error('[useGeneratedAssetsStore] Failed to generate Instagram ads:', error);
          } finally {
            set({ isGeneratingInstagram: false });
          }
        },

        /**
         * 컨셉 기반 쇼츠 스크립트 생성
         */
        generateShortsFromConcept: async (concept: GeneratedConcept) => {
          set({ isGeneratingShorts: true });
          console.log('[useGeneratedAssetsStore] Generating Shorts script for concept:', concept.concept_name);

          try {
            const prompt = `다음 마케팅 컨셉을 기반으로 30초 쇼츠 영상 스크립트를 생성해주세요:

컨셉명: ${concept.concept_name}
설명: ${concept.description}
헤드라인: ${concept.headline}
타겟 고객: ${concept.target_audience || '전체 고객'}
톤앤매너: ${concept.tone || '역동적'}

다음 JSON 형식으로 생성해주세요:
{
  "hook": "시작 후킹 멘트",
  "scenes": [
    {
      "scene_number": 1,
      "duration": "5초",
      "visual": "화면 설명",
      "narration": "나레이션",
      "text_overlay": "화면 텍스트"
    }
  ],
  "cta": "마지막 CTA",
  "music_suggestion": "배경음악 스타일"
}`;

            const response = await sendChatMessage({
              userInput: prompt,
              agent: 'copywriter',
              task: 'generate_shorts',
              language: 'ko',
            });

            if (response.content) {
              const jsonMatch = response.content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.scenes && Array.isArray(parsed.scenes)) {
                  const shortsData: GeneratedShortsData = {
                    id: generateId(),
                    title: concept.concept_name,
                    hook: parsed.hook || '',
                    scenes: parsed.scenes.map((scene: any, idx: number) => ({
                      scene_number: scene.scene_number || idx + 1,
                      duration: scene.duration || '5초',
                      visual: scene.visual || '',
                      narration: scene.narration || '',
                      text_overlay: scene.text_overlay || '',
                      transition: scene.transition,
                    })),
                    cta: parsed.cta || '',
                    music_suggestion: parsed.music_suggestion,
                    total_duration: '30초',
                    createdAt: new Date(),
                    sourceMessage: concept.concept_name,
                  };
                  set({ shortsData, lastUpdated: new Date() });
                  console.log('[useGeneratedAssetsStore] Shorts script generated:', shortsData.scenes.length);
                }
              }
            }
          } catch (error) {
            console.error('[useGeneratedAssetsStore] Failed to generate Shorts script:', error);
          } finally {
            set({ isGeneratingShorts: false });
          }
        },

        clearAll: () => set({
          slidesData: null,
          instagramData: null,
          detailData: null,
          shortsData: null,
          conceptBoardData: null,
          lastUpdated: null,
          isGeneratingSlides: false,
          isGeneratingDetail: false,
          isGeneratingInstagram: false,
          isGeneratingShorts: false,
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
