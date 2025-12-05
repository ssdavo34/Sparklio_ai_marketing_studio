/**
 * Output Preview Component
 *
 * 생성된 산출물 프리뷰 컴포넌트
 * - 프레젠테이션, 상세페이지, 인스타그램 광고 통합 뷰
 * - 채널별 탭 네비게이션
 * - 이미지 생성 진행 상태 표시
 * - LLM 생성 콘텐츠 렌더링 지원
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-12-05
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Presentation,
  LayoutList,
  Instagram as InstagramIcon,
  Loader2,
  Image as ImageIcon,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { PresentationSlide } from './PresentationTemplates';
import { DetailPageRenderer } from './DetailPageTemplates';
import { InstagramAd } from './InstagramTemplates';
import type {
  PresentationSlideData,
  DetailPageSectionData,
  InstagramAdData,
  ImageSlot,
  BrandStyleVars,
} from '@/types/htmlTemplates';
import type { GeneratedConceptExtended, OutputTargets } from '@/types/conceptGeneration';
import type { GeneratedChannelContent } from '@/lib/llm-gateway-client';
import {
  generateImagesForSlots,
  checkZImageHealth,
  type BatchGenerationProgress,
} from '@/lib/image-generation';
import { createImageSlot, createDefaultBrandStyle } from '@/types/htmlTemplates';

// =============================================================================
// Types
// =============================================================================

type OutputTab = 'presentation' | 'detailPage' | 'instagram';

interface OutputPreviewProps {
  concept: GeneratedConceptExtended;
  targets: OutputTargets;
  /** LLM 생성 콘텐츠 (있으면 이것을 렌더링) */
  generatedContent?: GeneratedChannelContent | null;
  /** 콘텐츠 생성 진행 중 여부 */
  isGeneratingContent?: boolean;
  /** 콘텐츠 생성 함수 */
  onGenerateContent?: () => void;
  onGenerateImages?: () => void;
  onExport?: (tab: OutputTab, format: 'png' | 'pdf') => void;
}

interface ImageGenerationState {
  isGenerating: boolean;
  progress: number;
  currentSlot: string;
  completed: number;
  total: number;
  error: string | null;
}

// =============================================================================
// Tab Button Component
// =============================================================================

interface TabButtonProps {
  tab: OutputTab;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  isEnabled: boolean;
  onClick: () => void;
}

function TabButton({ tab, label, icon, isActive, isEnabled, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={!isEnabled}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
        isActive
          ? 'bg-purple-500 text-white shadow-lg'
          : isEnabled
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// =============================================================================
// Image Generation Status
// =============================================================================

interface ImageStatusProps {
  state: ImageGenerationState;
  onRetry: () => void;
}

function ImageGenerationStatus({ state, onRetry }: ImageStatusProps) {
  if (!state.isGenerating && state.completed === 0 && state.total > 0) {
    return (
      <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-center gap-3">
          <ImageIcon className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">이미지 생성 대기 중</p>
            <p className="text-sm text-yellow-600">{state.total}개의 이미지를 생성할 수 있습니다</p>
          </div>
        </div>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
        >
          <ImageIcon className="w-4 h-4" />
          이미지 생성 시작
        </button>
      </div>
    );
  }

  if (state.isGenerating) {
    return (
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-center gap-3 mb-3">
          <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
          <div>
            <p className="font-medium text-purple-800">이미지 생성 중...</p>
            <p className="text-sm text-purple-600">
              {state.completed} / {state.total} 완료
            </p>
          </div>
        </div>
        <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${state.progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-medium text-red-800">이미지 생성 실패</p>
            <p className="text-sm text-red-600">{state.error}</p>
          </div>
        </div>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          다시 시도
        </button>
      </div>
    );
  }

  if (state.completed === state.total && state.total > 0) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
        <Check className="w-5 h-5 text-green-600" />
        <div>
          <p className="font-medium text-green-800">이미지 생성 완료</p>
          <p className="text-sm text-green-600">{state.total}개의 이미지가 생성되었습니다</p>
        </div>
      </div>
    );
  }

  return null;
}

// =============================================================================
// Content Generation Status
// =============================================================================

interface ContentStatusProps {
  isGenerating: boolean;
  hasContent: boolean;
  onGenerate: () => void;
}

function ContentGenerationStatus({ isGenerating, hasContent, onGenerate }: ContentStatusProps) {
  if (isGenerating) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <div>
            <p className="font-medium text-blue-800">콘텐츠 생성 중...</p>
            <p className="text-sm text-blue-600">LLM이 풍부한 콘텐츠를 생성하고 있습니다</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium text-blue-800">콘텐츠 생성 대기 중</p>
            <p className="text-sm text-blue-600">LLM으로 풍부한 콘텐츠를 생성합니다</p>
          </div>
        </div>
        <button
          onClick={onGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          콘텐츠 생성
        </button>
      </div>
    );
  }

  return null;
}

// =============================================================================
// Converter Functions: LLM Content -> HTML Template Data
// =============================================================================

function convertLLMSlideToTemplateData(
  slide: NonNullable<GeneratedChannelContent['presentation']>['slides'][0],
  totalSlides: number,
  brandStyle: BrandStyleVars
): PresentationSlideData {
  return {
    slideType: slide.slide_type as PresentationSlideData['slideType'],
    slideNumber: slide.slide_number,
    totalSlides,
    headline: slide.headline,
    subheadline: slide.subheadline,
    body: slide.body,
    bullets: slide.bullets,
    stats: slide.stats,
    quote: slide.quote,
    cta: slide.cta ? {
      headline: slide.cta.headline,
      text: slide.cta.button_text,
      buttonText: slide.cta.button_text || '시작하기',
    } : undefined,
    layout: slide.layout as PresentationSlideData['layout'],
    brandStyle,
    images: slide.image_prompt ? [
      createImageSlot(`slide-${slide.slide_number}`, 'hero', 1920, 1080),
    ] : [],
  };
}

function convertLLMSectionToTemplateData(
  section: NonNullable<GeneratedChannelContent['detail_page']>['sections'][0],
  brandStyle: BrandStyleVars
): DetailPageSectionData {
  return {
    sectionType: section.section_type as DetailPageSectionData['sectionType'],
    sectionNumber: section.section_number,
    headline: section.headline,
    subheadline: section.subheadline,
    body: section.body,
    features: section.features,
    benefits: section.benefits,
    steps: section.steps,
    testimonials: section.testimonials,
    cta: section.cta ? {
      headline: section.cta.headline,
      subheadline: '',
      buttonText: section.cta.button_text || '시작하기',
    } : undefined,
    layout: section.layout as DetailPageSectionData['layout'],
    brandStyle,
    images: section.image_prompt ? [
      createImageSlot(`section-${section.section_number}`, 'hero', 1200, 800),
    ] : [],
  };
}

function convertLLMAdToTemplateData(
  ad: NonNullable<GeneratedChannelContent['instagram']>['ads'][0],
  brandStyle: BrandStyleVars
): InstagramAdData {
  return {
    adType: 'single_image',
    format: ad.format as 'feed' | 'story',
    headline: ad.headline,
    subheadline: ad.subheadline,
    cta: ad.cta,
    hashtags: ad.hashtags,
    layout: ad.layout as InstagramAdData['layout'],
    textPosition: 'center',
    textAlignment: 'center',
    brandStyle,
    images: [
      createImageSlot(`ad-${ad.ad_number}`, 'hero', ad.format === 'story' ? 1080 : 1080, ad.format === 'story' ? 1920 : 1080),
    ],
  };
}

// =============================================================================
// Main Component
// =============================================================================

export function OutputPreview({
  concept,
  targets,
  generatedContent,
  isGeneratingContent = false,
  onGenerateContent,
  onExport,
}: OutputPreviewProps) {
  // State
  const [activeTab, setActiveTab] = useState<OutputTab>('presentation');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [imageState, setImageState] = useState<ImageGenerationState>({
    isGenerating: false,
    progress: 0,
    currentSlot: '',
    completed: 0,
    total: 0,
    error: null,
  });
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([]);

  // Brand Style 생성
  const brandStyle: BrandStyleVars = concept.visualWorld?.hex_colors?.length
    ? {
        primaryColor: concept.visualWorld.hex_colors[0] || '#6366f1',
        secondaryColor: concept.visualWorld.hex_colors[1] || '#8b5cf6',
        accentColor: concept.visualWorld.hex_colors[2] || '#f59e0b',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        headingFont: 'Pretendard, sans-serif',
        bodyFont: 'Pretendard, sans-serif',
      }
    : createDefaultBrandStyle();

  // LLM 생성 콘텐츠를 템플릿 데이터로 변환
  const presentationSlides: PresentationSlideData[] | null = generatedContent?.presentation
    ? generatedContent.presentation.slides.map((slide) =>
        convertLLMSlideToTemplateData(slide, generatedContent.presentation!.slides.length, brandStyle)
      )
    : null;

  const detailPageSections: DetailPageSectionData[] | null = generatedContent?.detail_page
    ? generatedContent.detail_page.sections.map((section) =>
        convertLLMSectionToTemplateData(section, brandStyle)
      )
    : null;

  const instagramAds: InstagramAdData[] | null = generatedContent?.instagram
    ? generatedContent.instagram.ads.map((ad) =>
        convertLLMAdToTemplateData(ad, brandStyle)
      )
    : null;

  // 이미지 슬롯 수집
  useEffect(() => {
    const slots: ImageSlot[] = [];

    if (generatedContent?.presentation) {
      generatedContent.presentation.slides.forEach((slide, idx) => {
        if (slide.image_prompt) {
          slots.push({
            id: `slide-${idx + 1}`,
            position: 'hero',
            width: 1920,
            height: 1080,
            prompt: slide.image_prompt,
            status: 'pending',
          });
        }
      });
    }

    if (generatedContent?.detail_page) {
      generatedContent.detail_page.sections.forEach((section, idx) => {
        if (section.image_prompt) {
          slots.push({
            id: `section-${idx + 1}`,
            position: 'hero',
            width: 1200,
            height: 800,
            prompt: section.image_prompt,
            status: 'pending',
          });
        }
      });
    }

    if (generatedContent?.instagram) {
      generatedContent.instagram.ads.forEach((ad, idx) => {
        if (ad.image_prompt) {
          slots.push({
            id: `ad-${idx + 1}`,
            position: 'hero',
            width: ad.format === 'story' ? 1080 : 1080,
            height: ad.format === 'story' ? 1920 : 1080,
            prompt: ad.image_prompt,
            status: 'pending',
          });
        }
      });
    }

    setImageSlots(slots);
    setImageState((prev) => ({
      ...prev,
      total: slots.length,
    }));
  }, [generatedContent]);

  // 첫 번째 활성 탭 선택
  useEffect(() => {
    if (targets.presentation.enabled) {
      setActiveTab('presentation');
    } else if (targets.detailPage.enabled) {
      setActiveTab('detailPage');
    } else if (targets.instagram.enabled) {
      setActiveTab('instagram');
    }
  }, [targets]);

  // 이미지 생성 핸들러
  const handleGenerateImages = useCallback(async () => {
    if (imageSlots.length === 0) return;

    setImageState((prev) => ({
      ...prev,
      isGenerating: true,
      error: null,
      progress: 0,
      completed: 0,
    }));

    // Z-Image 서버 상태 확인
    const isHealthy = await checkZImageHealth();
    if (!isHealthy) {
      setImageState((prev) => ({
        ...prev,
        isGenerating: false,
        error: 'GPU 서버에 연결할 수 없습니다. 네트워크를 확인해주세요.',
      }));
      return;
    }

    // 이미지 생성
    const progressCallback = (progress: BatchGenerationProgress) => {
      setImageState((prev) => ({
        ...prev,
        completed: progress.completed,
        currentSlot: progress.current,
        progress: (progress.completed / progress.total) * 100,
      }));
    };

    try {
      await generateImagesForSlots(imageSlots, progressCallback, true);

      // 상태 업데이트
      setImageSlots([...imageSlots]);

      setImageState((prev) => ({
        ...prev,
        isGenerating: false,
        completed: imageSlots.length,
        progress: 100,
      }));
    } catch (error) {
      setImageState((prev) => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : '이미지 생성 중 오류가 발생했습니다.',
      }));
    }
  }, [imageSlots]);

  // 콘텐츠가 없고 생성 중도 아닌 경우
  const hasContent = !!generatedContent;

  // 렌더링
  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <div className="flex items-center gap-3">
        <TabButton
          tab="presentation"
          label="프레젠테이션"
          icon={<Presentation className="w-4 h-4" />}
          isActive={activeTab === 'presentation'}
          isEnabled={targets.presentation.enabled}
          onClick={() => setActiveTab('presentation')}
        />
        <TabButton
          tab="detailPage"
          label="상세페이지"
          icon={<LayoutList className="w-4 h-4" />}
          isActive={activeTab === 'detailPage'}
          isEnabled={targets.detailPage.enabled}
          onClick={() => setActiveTab('detailPage')}
        />
        <TabButton
          tab="instagram"
          label="인스타그램"
          icon={<InstagramIcon className="w-4 h-4" />}
          isActive={activeTab === 'instagram'}
          isEnabled={targets.instagram.enabled}
          onClick={() => setActiveTab('instagram')}
        />
      </div>

      {/* 콘텐츠 생성 상태 */}
      {onGenerateContent && (
        <ContentGenerationStatus
          isGenerating={isGeneratingContent}
          hasContent={hasContent}
          onGenerate={onGenerateContent}
        />
      )}

      {/* 이미지 생성 상태 */}
      {hasContent && <ImageGenerationStatus state={imageState} onRetry={handleGenerateImages} />}

      {/* 프리뷰 영역 */}
      <div className="bg-gray-50 rounded-xl p-6">
        {/* 콘텐츠 로딩 중 */}
        {isGeneratingContent && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            <p className="text-gray-600">LLM이 풍부한 콘텐츠를 생성하고 있습니다...</p>
          </div>
        )}

        {/* 콘텐츠가 없는 경우 */}
        {!isGeneratingContent && !hasContent && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Sparkles className="w-12 h-12 text-gray-400" />
            <p className="text-gray-500">콘텐츠를 생성해주세요</p>
            {onGenerateContent && (
              <button
                onClick={onGenerateContent}
                className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                콘텐츠 생성하기
              </button>
            )}
          </div>
        )}

        {/* 프레젠테이션 */}
        {!isGeneratingContent && activeTab === 'presentation' && presentationSlides && presentationSlides.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                슬라이드 {currentSlideIndex + 1} / {presentationSlides.length}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                  disabled={currentSlideIndex === 0}
                  className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentSlideIndex(Math.min(presentationSlides.length - 1, currentSlideIndex + 1))}
                  disabled={currentSlideIndex === presentationSlides.length - 1}
                  className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <PresentationSlide data={presentationSlides[currentSlideIndex]} />
            </div>

            {/* 썸네일 */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {presentationSlides.map((slide, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`flex-shrink-0 w-24 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentSlideIndex
                      ? 'border-purple-500 ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-video bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                    {idx + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 상세페이지 */}
        {!isGeneratingContent && activeTab === 'detailPage' && detailPageSections && detailPageSections.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">
              상세페이지 프리뷰 ({detailPageSections.length}개 섹션)
            </h3>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden max-h-[600px] overflow-y-auto">
              <DetailPageRenderer sections={detailPageSections} />
            </div>
          </div>
        )}

        {/* 인스타그램 */}
        {!isGeneratingContent && activeTab === 'instagram' && instagramAds && instagramAds.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                인스타그램 광고 {currentAdIndex + 1} / {instagramAds.length}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentAdIndex(Math.max(0, currentAdIndex - 1))}
                  disabled={currentAdIndex === 0}
                  className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentAdIndex(Math.min(instagramAds.length - 1, currentAdIndex + 1))}
                  disabled={currentAdIndex === instagramAds.length - 1}
                  className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <div className={`${targets.instagram.format === 'story' ? 'max-w-xs' : 'max-w-md'} w-full`}>
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <InstagramAd data={instagramAds[currentAdIndex]} />
                </div>
              </div>
            </div>

            {/* 썸네일 */}
            <div className="flex justify-center gap-3">
              {instagramAds.map((ad, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentAdIndex(idx)}
                  className={`flex-shrink-0 w-16 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentAdIndex
                      ? 'border-purple-500 ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className="bg-gray-100 flex items-center justify-center text-xs text-gray-500"
                    style={{ aspectRatio: targets.instagram.format === 'story' ? '9/16' : '1/1' }}
                  >
                    {idx + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      {hasContent && (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleGenerateImages}
            disabled={imageState.isGenerating || imageSlots.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {imageState.isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
            이미지 생성
          </button>
          <button
            onClick={() => onExport?.(activeTab, 'png')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            내보내기
          </button>
        </div>
      )}
    </div>
  );
}

export default OutputPreview;
