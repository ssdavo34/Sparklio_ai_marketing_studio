/**
 * Template Data Generator
 *
 * 컨셉 데이터를 HTML 템플릿 데이터로 변환
 * - 프레젠테이션, 상세페이지, 인스타그램 광고
 * - 이미지 프롬프트 자동 생성
 * - 브랜드 스타일 매핑
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-05
 */

import type { GeneratedConceptExtended, OutputTargets } from '@/types/conceptGeneration';
import type {
  BrandStyleVars,
  ImageSlot,
  PresentationSlideData,
  PresentationSlideType,
  DetailPageSectionData,
  DetailPageSectionType,
  InstagramAdData,
  InstagramAdLayout,
  GeneratedImagePrompt,
  ImagePromptContext,
} from '@/types/htmlTemplates';
// Note: createImageSlot and createDefaultBrandStyle are available from htmlTemplates if needed

// =============================================================================
// Brand Style Extraction
// =============================================================================

/**
 * 컨셉에서 브랜드 스타일 추출
 */
export function extractBrandStyle(concept: GeneratedConceptExtended): BrandStyleVars {
  const visualWorld = concept.visualWorld;

  // hex_colors에서 추출 또는 기본값
  const colors = visualWorld?.hex_colors || [];
  const primaryColor = colors[0] || '#6366f1';
  const secondaryColor = colors[1] || '#8b5cf6';
  const accentColor = colors[2] || '#f59e0b';

  return {
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    headingFont: 'Pretendard, sans-serif',
    bodyFont: 'Pretendard, sans-serif',
  };
}

// =============================================================================
// Image Prompt Generation
// =============================================================================

/**
 * 이미지 프롬프트 생성
 */
export function generateImagePrompt(context: ImagePromptContext): GeneratedImagePrompt {
  const { conceptName, headline, targetAudience, tone, colorPalette, photoStyle, mood, slotPosition, aspectRatio, channel, channelContext } = context;

  // 채널별 스타일 가이드
  const channelStyles: Record<string, string> = {
    presentation: 'professional, corporate, clean, business presentation',
    detail_page: 'e-commerce, product showcase, lifestyle, high quality',
    instagram: 'social media, trendy, eye-catching, instagram aesthetic',
  };

  // 포지션별 스타일
  const positionStyles: Record<string, string> = {
    hero: 'hero shot, dramatic lighting, impactful, wide angle',
    background: 'subtle background, gradient, abstract, atmospheric',
    inline: 'supporting image, illustrative, contextual',
    product: 'product photography, studio lighting, clean background, detailed',
    lifestyle: 'lifestyle photography, natural lighting, authentic, aspirational',
  };

  // 기본 프롬프트 구성
  const promptParts = [
    conceptName,
    headline,
    photoStyle || 'professional photography',
    mood || 'modern',
    positionStyles[slotPosition] || '',
    channelStyles[channel] || '',
    channelContext ? `for ${channelContext}` : '',
    colorPalette.length > 0 ? `color scheme: ${colorPalette.slice(0, 3).join(', ')}` : '',
    'high quality, 4k, detailed',
  ].filter(Boolean);

  // 네거티브 프롬프트
  const negativePrompt = [
    'blurry',
    'low quality',
    'distorted',
    'watermark',
    'text',
    'logo',
    'signature',
    'ugly',
    'deformed',
    'noisy',
    'grainy',
  ].join(', ');

  // 스타일 결정
  let style: GeneratedImagePrompt['style'] = 'photorealistic';
  if (photoStyle?.includes('illust')) style = 'illustration';
  else if (photoStyle?.includes('minimal')) style = 'minimal';
  else if (slotPosition === 'product') style = 'product';
  else if (slotPosition === 'lifestyle') style = 'lifestyle';

  return {
    slotId: `${channel}-${slotPosition}-${Date.now()}`,
    prompt: promptParts.join(', '),
    negativePrompt,
    style,
    aspectRatio: aspectRatio as GeneratedImagePrompt['aspectRatio'],
  };
}

/**
 * 이미지 슬롯에 프롬프트 생성 및 할당
 */
export function generateImageSlotWithPrompt(
  concept: GeneratedConceptExtended,
  position: ImageSlot['position'],
  width: number,
  height: number,
  channel: 'presentation' | 'detail_page' | 'instagram',
  channelContext?: string
): ImageSlot {
  const visualWorld = concept.visualWorld;

  const context: ImagePromptContext = {
    conceptName: concept.conceptName,
    headline: concept.headline,
    targetAudience: concept.targetAudience,
    tone: concept.tone,
    colorPalette: visualWorld?.hex_colors || [],
    photoStyle: visualWorld?.photo_style || '',
    mood: visualWorld?.color_palette || '',
    slotPosition: position,
    aspectRatio: width === height ? '1:1' : width > height ? '16:9' : '9:16',
    channel,
    channelContext,
  };

  const promptData = generateImagePrompt(context);

  return {
    id: promptData.slotId,
    position,
    width,
    height,
    prompt: promptData.prompt,
    status: 'pending',
  };
}

// =============================================================================
// Presentation Generator
// =============================================================================

/**
 * 프레젠테이션 슬라이드 데이터 생성
 */
export function generatePresentationSlides(
  concept: GeneratedConceptExtended,
  pageCount: number = 10
): PresentationSlideData[] {
  const brandStyle = extractBrandStyle(concept);
  const slides: PresentationSlideData[] = [];

  // 슬라이드 구성 결정
  const allSlideTypes: PresentationSlideType[] = [
    'cover',
    'agenda',
    'section_title',
    'content_image',
    'content_bullets',
    'stats',
    'content_image',
    'quote',
    'cta',
    'thank_you',
  ];
  const slideStructure = allSlideTypes.slice(0, pageCount);

  // 컨셉에서 콘텐츠 추출
  const taglines = concept.taglines || [];
  const features = taglines.slice(0, 3);
  const benefits = taglines.slice(3, 6);

  slideStructure.forEach((slideType, idx) => {
    const slideData: PresentationSlideData = {
      slideType,
      slideNumber: idx + 1,
      totalSlides: pageCount,
      brandStyle,
      images: [],
      layout: 'left_image',
    };

    switch (slideType) {
      case 'cover':
        slideData.headline = concept.headline;
        slideData.subheadline = concept.subheadline || concept.description;
        slideData.images = [
          generateImageSlotWithPrompt(concept, 'hero', 1920, 1080, 'presentation', '표지 슬라이드'),
        ];
        break;

      case 'agenda':
        slideData.headline = '목차';
        slideData.agendaItems = [
          '문제 인식',
          '솔루션 소개',
          '주요 기능',
          '기대 효과',
        ].slice(0, Math.min(4, pageCount - 4));
        break;

      case 'section_title':
        slideData.headline = features[0] || '왜 필요한가요?';
        slideData.subheadline = concept.targetAudience;
        break;

      case 'content_image':
        const contentIdx = slides.filter(s => s.slideType === 'content_image').length;
        slideData.headline = features[contentIdx] || `핵심 가치 ${contentIdx + 1}`;
        slideData.body = concept.description;
        slideData.bullets = benefits.slice(0, 3);
        slideData.layout = contentIdx % 2 === 0 ? 'left_image' : 'right_image';
        slideData.images = [
          generateImageSlotWithPrompt(concept, 'inline', 960, 1080, 'presentation', `${contentIdx + 1}번째 콘텐츠 슬라이드`),
        ];
        break;

      case 'content_bullets':
        slideData.headline = '주요 특징';
        slideData.bullets = taglines.slice(0, 5);
        break;

      case 'stats':
        slideData.headline = '숫자로 보는 효과';
        slideData.stats = [
          { value: '3X', label: '효율성 향상' },
          { value: '50%', label: '시간 절약' },
          { value: '99%', label: '고객 만족도' },
        ];
        break;

      case 'quote':
        slideData.quote = {
          text: concept.headline,
          author: concept.targetAudience,
        };
        break;

      case 'cta':
        slideData.headline = '지금 시작하세요';
        slideData.subheadline = concept.subheadline;
        slideData.cta = {
          headline: '지금 시작하세요',
          text: concept.description,
          buttonText: concept.cta || '시작하기',
        };
        slideData.images = [
          generateImageSlotWithPrompt(concept, 'background', 1920, 1080, 'presentation', 'CTA 슬라이드 배경'),
        ];
        break;

      case 'thank_you':
        slideData.headline = '감사합니다';
        slideData.subheadline = concept.cta || '문의: contact@brand.com';
        break;
    }

    slides.push(slideData);
  });

  return slides;
}

// =============================================================================
// Detail Page Generator
// =============================================================================

/**
 * 상세페이지 섹션 데이터 생성
 */
export function generateDetailPageSections(
  concept: GeneratedConceptExtended,
  sectionCount: number = 6
): DetailPageSectionData[] {
  const brandStyle = extractBrandStyle(concept);
  const sections: DetailPageSectionData[] = [];

  // 섹션 구성 결정
  const allSectionTypes: DetailPageSectionType[] = [
    'hero',
    'problem',
    'solution',
    'features',
    'benefits',
    'how_it_works',
    'testimonial',
    'cta',
  ];
  const sectionStructure = allSectionTypes.slice(0, sectionCount);

  const taglines = concept.taglines || [];

  sectionStructure.forEach((sectionType, idx) => {
    const sectionData: DetailPageSectionData = {
      sectionType,
      sectionNumber: idx + 1,
      brandStyle,
      images: [],
      layout: 'center',
    };

    switch (sectionType) {
      case 'hero':
        sectionData.headline = concept.headline;
        sectionData.subheadline = concept.subheadline || concept.description;
        sectionData.cta = {
          headline: concept.headline,
          buttonText: concept.cta || '자세히 보기',
        };
        sectionData.images = [
          generateImageSlotWithPrompt(concept, 'hero', 1920, 1080, 'detail_page', '히어로 섹션'),
        ];
        break;

      case 'problem':
        sectionData.headline = '이런 문제, 겪어보셨나요?';
        sectionData.subheadline = `${concept.targetAudience}를 위한 솔루션`;
        sectionData.benefits = [
          { title: '복잡한 프로세스', description: '기존 방식은 너무 복잡하고 시간이 오래 걸립니다.' },
          { title: '높은 비용', description: '불필요한 비용이 계속 발생합니다.' },
          { title: '낮은 효율성', description: '원하는 결과를 얻기 어렵습니다.' },
        ];
        break;

      case 'solution':
        sectionData.headline = concept.conceptName;
        sectionData.subheadline = concept.headline;
        sectionData.body = concept.description;
        sectionData.layout = 'left';
        sectionData.images = [
          generateImageSlotWithPrompt(concept, 'product', 800, 800, 'detail_page', '솔루션 소개'),
        ];
        break;

      case 'features':
        sectionData.headline = '주요 기능';
        sectionData.subheadline = '이런 것들이 가능해집니다';
        sectionData.features = taglines.slice(0, 6).map((tagline, i) => ({
          icon: ['✨', '🚀', '💡', '🎯', '⚡', '🔥'][i] || '✦',
          title: tagline,
          description: `${concept.conceptName}만의 특별한 기능입니다.`,
        }));
        break;

      case 'benefits':
        sectionData.headline = '이런 효과를 얻을 수 있어요';
        sectionData.benefits = [
          { title: '시간 절약', description: '기존 대비 50% 이상의 시간을 절약할 수 있습니다.' },
          { title: '비용 절감', description: '불필요한 비용 지출을 줄일 수 있습니다.' },
          { title: '품질 향상', description: '더 나은 결과물을 얻을 수 있습니다.' },
        ];
        sectionData.images = [
          generateImageSlotWithPrompt(concept, 'lifestyle', 800, 450, 'detail_page', '혜택 섹션 1'),
          generateImageSlotWithPrompt(concept, 'lifestyle', 800, 450, 'detail_page', '혜택 섹션 2'),
          generateImageSlotWithPrompt(concept, 'lifestyle', 800, 450, 'detail_page', '혜택 섹션 3'),
        ];
        break;

      case 'how_it_works':
        sectionData.headline = '이용 방법';
        sectionData.steps = [
          { number: 1, title: '회원가입', description: '간단한 정보 입력으로 시작하세요.' },
          { number: 2, title: '설정', description: '원하는 옵션을 선택하세요.' },
          { number: 3, title: '완료', description: '바로 결과를 확인하세요.' },
        ];
        break;

      case 'testimonial':
        sectionData.headline = '고객 후기';
        sectionData.testimonials = [
          { quote: `${concept.headline} 덕분에 업무 효율이 크게 향상되었습니다.`, author: '김OO', role: '마케팅 팀장' },
          { quote: '정말 사용하기 쉽고 결과물 품질이 뛰어납니다.', author: '이OO', role: '스타트업 대표' },
          { quote: '비용 대비 효과가 매우 좋습니다. 적극 추천합니다.', author: '박OO', role: '프리랜서' },
        ];
        break;

      case 'cta':
        sectionData.headline = '지금 바로 시작하세요';
        sectionData.cta = {
          headline: concept.headline,
          subheadline: concept.subheadline,
          buttonText: concept.cta || '무료로 시작하기',
        };
        sectionData.images = [
          generateImageSlotWithPrompt(concept, 'background', 1920, 600, 'detail_page', 'CTA 섹션 배경'),
        ];
        break;
    }

    sections.push(sectionData);
  });

  return sections;
}

// =============================================================================
// Instagram Ad Generator
// =============================================================================

/**
 * 인스타그램 광고 데이터 생성
 */
export function generateInstagramAds(
  concept: GeneratedConceptExtended,
  adCount: number = 3,
  format: 'feed' | 'story' = 'feed'
): InstagramAdData[] {
  const brandStyle = extractBrandStyle(concept);
  const ads: InstagramAdData[] = [];

  // 레이아웃 종류
  const layouts: InstagramAdLayout[] = ['text_overlay', 'text_bottom', 'bold', 'minimal', 'text_top'];

  // 카피 변형
  const headlines = [
    concept.headline,
    concept.subheadline || concept.headline,
    ...(concept.taglines || []).slice(0, 3),
  ];

  const ctas = [
    concept.cta || '자세히 보기',
    '지금 확인하기',
    '더 알아보기',
    '무료로 시작',
    '바로가기',
  ];

  for (let i = 0; i < adCount; i++) {
    const layout = layouts[i % layouts.length];
    const dimensions = format === 'feed' ? { w: 1080, h: 1080 } : { w: 1080, h: 1920 };

    const adData: InstagramAdData = {
      adType: 'single_image',
      format,
      headline: headlines[i % headlines.length],
      subheadline: i === 0 ? concept.description?.substring(0, 80) : undefined,
      cta: ctas[i % ctas.length],
      brandStyle,
      images: [
        generateImageSlotWithPrompt(
          concept,
          i % 2 === 0 ? 'hero' : 'lifestyle',
          dimensions.w,
          dimensions.h,
          'instagram',
          `인스타그램 광고 ${i + 1}`
        ),
      ],
      layout,
      textPosition: layout === 'text_bottom' ? 'bottom' : layout === 'text_top' ? 'top' : 'center',
      textAlignment: 'center',
    };

    ads.push(adData);
  }

  return ads;
}

// =============================================================================
// Combined Generator
// =============================================================================

export interface GeneratedOutputs {
  presentation?: PresentationSlideData[];
  detailPage?: DetailPageSectionData[];
  instagram?: InstagramAdData[];
  allImageSlots: ImageSlot[];
}

/**
 * 모든 산출물 데이터 생성
 */
export function generateAllOutputs(
  concept: GeneratedConceptExtended,
  targets: OutputTargets
): GeneratedOutputs {
  const outputs: GeneratedOutputs = {
    allImageSlots: [],
  };

  if (targets.presentation.enabled) {
    outputs.presentation = generatePresentationSlides(concept, targets.presentation.pageCount);
    outputs.presentation.forEach(slide => {
      outputs.allImageSlots.push(...slide.images);
    });
  }

  if (targets.detailPage.enabled) {
    outputs.detailPage = generateDetailPageSections(concept, targets.detailPage.sectionCount);
    outputs.detailPage.forEach(section => {
      outputs.allImageSlots.push(...section.images);
    });
  }

  if (targets.instagram.enabled) {
    outputs.instagram = generateInstagramAds(
      concept,
      targets.instagram.adCount,
      targets.instagram.format === 'story' ? 'story' : 'feed'
    );
    outputs.instagram.forEach(ad => {
      outputs.allImageSlots.push(...ad.images);
    });
  }

  return outputs;
}

export default generateAllOutputs;
