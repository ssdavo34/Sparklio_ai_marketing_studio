/**
 * Slides Template
 *
 * Presentation Slides 데이터를 Polotno Canvas로 변환
 * - 각 슬라이드를 별도 페이지로 생성
 * - 제목, 본문, Bullet Points 자동 배치
 * - 일관된 디자인 적용 (Brand Kit 연동)
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-11-30
 */

import { createPlaceholderMetadata } from './image-metadata';
import type { SlideData, SlideLayout } from '@/types/demo';

// ============================================================================
// Types
// ============================================================================

export interface BrandTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  logoUrl?: string;
}

interface CanvasElement {
  type: 'text' | 'svg' | 'image';  // Polotno only supports: text, svg, image
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fill?: string;
  text?: string;
  align?: 'left' | 'center' | 'right';
  src?: string;
  [key: string]: any;
}

/**
 * Helper: 사각형을 SVG로 변환 (Polotno는 rect 타입을 직접 지원하지 않음)
 */
function createRectSvg(
  width: number,
  height: number,
  fill: string,
  cornerRadius: number = 0
): string {
  const rx = cornerRadius > 0 ? `rx="${cornerRadius}" ry="${cornerRadius}"` : '';
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="${fill}" ${rx}/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// ============================================================================
// Template Configuration
// ============================================================================

const DEFAULT_THEME: BrandTheme = {
  primaryColor: '#6366F1',
  secondaryColor: '#8B5CF6',
  accentColor: '#F3F4F6',
  backgroundColor: '#FFFFFF',
  fontFamily: 'Pretendard',
};

const PAGE_CONFIG = {
  width: 1920,
  height: 1080,
  margin: 80,
};

// ============================================================================
// Slide Template Generator
// ============================================================================

/**
 * 단일 슬라이드를 Canvas 요소 배열로 변환
 */
export function createSlideElements(
  slide: SlideData,
  slideNumber: number,
  totalSlides: number,
  theme: BrandTheme = DEFAULT_THEME
): CanvasElement[] {
  const elements: CanvasElement[] = [];
  const { width: pageWidth, height: pageHeight, margin } = PAGE_CONFIG;
  const contentWidth = pageWidth - margin * 2;

  // 테마 적용
  const colors = {
    primary: theme.primaryColor,
    secondary: theme.secondaryColor,
    accent: theme.accentColor || '#F3F4F6',
    background: theme.backgroundColor || '#FFFFFF',
    text: '#1F2937',
    textLight: '#6B7280',
  };
  const fonts = {
    title: theme.fontFamily || 'Pretendard',
    body: theme.fontFamily || 'Pretendard',
  };

  // 1. 배경
  elements.push({
    type: 'svg',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    src: createRectSvg(pageWidth, pageHeight, colors.background),
    selectable: false,
    locked: true,
  });

  // 2. 상단 액센트 바 (그라데이션)
  const gradientBarSvg = `<svg width="${pageWidth}" height="12" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${pageWidth}" height="12" fill="url(#grad)"/>
  </svg>`;
  elements.push({
    type: 'svg',
    x: 0,
    y: 0,
    width: pageWidth,
    height: 12,
    src: `data:image/svg+xml;base64,${btoa(gradientBarSvg)}`,
    selectable: false,
  });

  // 3. 슬라이드 번호
  elements.push({
    type: 'text',
    x: pageWidth - margin - 100,
    y: margin - 20,
    width: 100,
    fontSize: 20,
    fill: colors.textLight,
    text: `${slideNumber} / ${totalSlides}`,
    align: 'right',
    fontFamily: fonts.body,
  });

  // 4. 로고 (있을 경우)
  if (theme.logoUrl) {
    elements.push({
      type: 'image',
      x: margin,
      y: margin - 40,
      width: 120,
      height: 40,
      src: theme.logoUrl,
      keepRatio: true,
    });
  }

  // 5. 레이아웃별 렌더링
  let currentY = margin;
  const layout = slide.layout || getDefaultLayout(slide.slide_type);

  // 제목 렌더링 (공통)
  elements.push({
    type: 'text',
    x: margin,
    y: currentY,
    width: contentWidth - 120,
    fontSize: 72,
    fontWeight: 'bold',
    fill: colors.primary,
    text: slide.title,
    fontFamily: fonts.title,
  });
  currentY += 100;

  // 부제목 (공통)
  if (slide.subtitle) {
    elements.push({
      type: 'text',
      x: margin,
      y: currentY,
      width: contentWidth,
      fontSize: 36,
      fill: colors.textLight,
      text: slide.subtitle,
      fontFamily: fonts.body,
    });
    currentY += 60;
  }

  // 구분선 (공통)
  elements.push({
    type: 'svg',
    x: margin,
    y: currentY,
    width: 120,
    height: 6,
    src: createRectSvg(120, 6, colors.secondary, 3),
  });
  currentY += 60;

  // V2 레이아웃별 콘텐츠 배치 (5종 템플릿)
  if (layout === 'title_center') {
    renderTitleCenterLayout(elements, slide, currentY, contentWidth, margin, colors, fonts);
  } else if (layout === 'two_column') {
    renderTwoColumnLayout(elements, slide, currentY, contentWidth, margin, colors, fonts);
  } else if (layout === 'three_bullets') {
    renderThreeBulletsLayout(elements, slide, currentY, contentWidth, margin, colors, fonts);
  } else if (layout === 'full_image') {
    renderFullImageLayout(elements, slide, currentY, contentWidth, margin, colors, fonts);
  } else if (layout === 'stats') {
    renderStatsLayout(elements, slide, currentY, contentWidth, margin, colors, fonts);
  } else if (layout === 'process') {
    renderProcessLayout(elements, slide, currentY, contentWidth, margin, colors, fonts);
  } else {
    // Standard Layout (Default) - two_column fallback
    renderTwoColumnLayout(elements, slide, currentY, contentWidth, margin, colors, fonts);
  }

  // 하단 푸터
  elements.push({
    type: 'text',
    x: margin,
    y: pageHeight - margin + 20,
    width: contentWidth,
    fontSize: 16,
    fill: colors.textLight,
    text: 'Sparklio AI로 생성됨',
    fontFamily: fonts.body,
    align: 'left',
  });

  return elements;
}

// ============================================================================
// Layout Renderers (V2 - 5종 템플릿)
// ============================================================================

/**
 * V2: title_center - 표지/CTA용 중앙 정렬 레이아웃
 */
function renderTitleCenterLayout(elements: CanvasElement[], slide: SlideData, _startY: number, contentWidth: number, margin: number, colors: any, fonts: any) {
  const centerY = PAGE_CONFIG.height / 2;

  // 중앙 정렬 - 제목은 이미 위에서 렌더링됨, 여기선 추가 콘텐츠만
  if (slide.bullets && slide.bullets.length > 0) {
    slide.bullets.forEach((bullet, idx) => {
      elements.push({
        type: 'text',
        x: margin,
        y: centerY + 50 + idx * 50,
        width: contentWidth,
        fontSize: 28,
        fill: colors.textLight,
        text: bullet,
        fontFamily: fonts.body,
        align: 'center',
      });
    });
  }
}

/**
 * V2: three_bullets - 3개 컬럼 핵심 포인트 레이아웃
 */
function renderThreeBulletsLayout(elements: CanvasElement[], slide: SlideData, startY: number, contentWidth: number, margin: number, colors: any, fonts: any) {
  const colWidth = (contentWidth - 60) / 3;

  if (slide.bullets && slide.bullets.length > 0) {
    slide.bullets.slice(0, 3).forEach((bullet, idx) => {
      const x = margin + (colWidth + 30) * idx;

      // Card Box (SVG)
      elements.push({
        type: 'svg',
        x: x,
        y: startY,
        width: colWidth,
        height: 400,
        src: createRectSvg(colWidth, 400, colors.accent, 16),
      });

      // 아이콘 영역 - 원형 (SVG)
      elements.push({
        type: 'svg',
        x: x + colWidth / 2 - 40,
        y: startY + 40,
        width: 80,
        height: 80,
        src: createRectSvg(80, 80, colors.primary, 40),
      });

      elements.push({
        type: 'text',
        x: x + colWidth / 2,
        y: startY + 60,
        fontSize: 36,
        fontWeight: 'bold',
        fill: '#FFFFFF',
        text: `${idx + 1}`,
        align: 'center',
        fontFamily: fonts.body,
      });

      // 불릿 텍스트
      elements.push({
        type: 'text',
        x: x + 20,
        y: startY + 160,
        width: colWidth - 40,
        fontSize: 24,
        fill: colors.text,
        text: bullet,
        fontFamily: fonts.body,
        align: 'center',
        lineHeight: 1.4,
      });
    });
  }
}

function renderStandardLayout(elements: CanvasElement[], slide: SlideData, startY: number, contentWidth: number, margin: number, colors: any, fonts: any) {
  let currentY = startY;

  // 이미지 확인
  const hasImage = slide.background_image_url || (slide.elements && slide.elements.some(e => e.type === 'image'));
  const textWidth = hasImage ? contentWidth * 0.55 : contentWidth;

  // 본문 텍스트
  if (slide.content && typeof slide.content === 'string') {
    elements.push({
      type: 'text',
      x: margin,
      y: currentY,
      width: textWidth,
      fontSize: 32,
      fill: colors.text,
      text: slide.content,
      fontFamily: fonts.body,
      lineHeight: 1.6,
    });
    currentY += 200;
  }

  // Bullets
  if (slide.bullets && slide.bullets.length > 0) {
    slide.bullets.forEach((bullet) => {
      elements.push({
        type: 'text',
        x: margin + 30,
        y: currentY,
        width: textWidth - 30,
        fontSize: 28,
        fill: colors.text,
        text: `• ${bullet}`,
        fontFamily: fonts.body,
        lineHeight: 1.5,
      });
      currentY += 60;
    });
  }

  // 이미지 (우측 배치)
  if (hasImage) {
    const imageUrl = slide.background_image_url || (slide.elements?.find(e => e.type === 'image')?.url);
    if (imageUrl) {
      elements.push({
        type: 'image',
        x: margin + contentWidth * 0.6,
        y: startY,
        width: contentWidth * 0.4,
        height: 500,
        src: imageUrl,
        custom: createPlaceholderMetadata(slide.title),
      });
    } else {
      // Placeholder (SVG)
      elements.push({
        type: 'svg',
        x: margin + contentWidth * 0.6,
        y: startY,
        width: contentWidth * 0.4,
        height: 500,
        src: createRectSvg(contentWidth * 0.4, 500, colors.accent, 12),
      });
      elements.push({
        type: 'text',
        x: margin + contentWidth * 0.6 + (contentWidth * 0.4) / 2,
        y: startY + 250,
        fontSize: 60,
        text: '🖼️',
        align: 'center',
      });
    }
  }
}

function renderTwoColumnLayout(elements: CanvasElement[], slide: SlideData, startY: number, contentWidth: number, margin: number, colors: any, fonts: any) {
  const colWidth = (contentWidth - 80) / 2;

  // Left Column (Content)
  let leftY = startY;
  if (slide.content && typeof slide.content === 'string') {
    elements.push({
      type: 'text',
      x: margin,
      y: leftY,
      width: colWidth,
      fontSize: 30,
      fill: colors.text,
      text: slide.content,
      fontFamily: fonts.body,
      lineHeight: 1.6,
    });
    leftY += 150;
  }

  if (slide.bullets) {
    slide.bullets.forEach(bullet => {
      elements.push({
        type: 'text',
        x: margin + 20,
        y: leftY,
        width: colWidth - 20,
        fontSize: 26,
        fill: colors.text,
        text: `• ${bullet}`,
        fontFamily: fonts.body,
      });
      leftY += 50;
    });
  }

  // Right Column (Image or Extra Content)
  const imageUrl = slide.background_image_url || (slide.elements?.find(e => e.type === 'image')?.url);
  if (imageUrl) {
    elements.push({
      type: 'image',
      x: margin + colWidth + 80,
      y: startY,
      width: colWidth,
      height: 600,
      src: imageUrl,
      custom: createPlaceholderMetadata(slide.title),
    });
  } else {
    // Placeholder Box (SVG)
    elements.push({
      type: 'svg',
      x: margin + colWidth + 80,
      y: startY,
      width: colWidth,
      height: 600,
      src: createRectSvg(colWidth, 600, colors.accent, 8),
    });
    elements.push({
      type: 'text',
      x: margin + colWidth + 80 + colWidth / 2,
      y: startY + 300,
      fontSize: 40,
      text: '비주얼 / 차트 영역',
      align: 'center',
      fill: colors.textLight,
    });
  }
}

function renderFullImageLayout(elements: CanvasElement[], slide: SlideData, _startY: number, contentWidth: number, _margin: number, colors: any, fonts: any) {
  // 전체 배경 이미지 처리
  const imageUrl = slide.background_image_url;
  if (imageUrl) {
    // 기존 배경 제거하고 이미지로 대체 (맨 앞으로)
    elements[0] = {
      type: 'image',
      x: 0,
      y: 0,
      width: PAGE_CONFIG.width,
      height: PAGE_CONFIG.height,
      src: imageUrl,
      opacity: 0.3, // 텍스트 가독성을 위해 흐리게
    };
  }

  // 중앙 정렬 텍스트
  elements.push({
    type: 'text',
    x: PAGE_CONFIG.width / 2,
    y: PAGE_CONFIG.height / 2 - 100,
    width: contentWidth,
    fontSize: 48,
    fill: colors.text,
    text: typeof slide.content === 'string' ? slide.content : '',
    fontFamily: fonts.body,
    align: 'center',
  });
}

function renderStatsLayout(elements: CanvasElement[], slide: SlideData, startY: number, contentWidth: number, margin: number, colors: any, fonts: any) {
  // 통계/로드맵용 레이아웃 (간단한 카드 형태)
  const cardWidth = (contentWidth - 60) / 3;

  if (slide.bullets) {
    slide.bullets.slice(0, 3).forEach((bullet, idx) => {
      const x = margin + (cardWidth + 30) * idx;

      // Card Box (SVG)
      elements.push({
        type: 'svg',
        x: x,
        y: startY,
        width: cardWidth,
        height: 300,
        src: createRectSvg(cardWidth, 300, colors.accent, 16),
      });

      // Content
      elements.push({
        type: 'text',
        x: x + 20,
        y: startY + 40,
        width: cardWidth - 40,
        fontSize: 24,
        fill: colors.text,
        text: bullet,
        fontFamily: fonts.body,
        align: 'center',
      });
    });
  }
}

function renderProcessLayout(elements: CanvasElement[], slide: SlideData, startY: number, contentWidth: number, margin: number, colors: any, fonts: any) {
  // 프로세스/파이프라인 레이아웃 (화살표 연결 느낌)
  let currentX = margin;
  const stepWidth = (contentWidth - 100) / 4;

  if (slide.bullets) {
    slide.bullets.slice(0, 4).forEach((step, idx) => {
      // Step Box (SVG)
      elements.push({
        type: 'svg',
        x: currentX,
        y: startY + 100,
        width: stepWidth,
        height: 120,
        src: createRectSvg(stepWidth, 120, colors.primary, 10),
      });

      // Step Text
      elements.push({
        type: 'text',
        x: currentX + 10,
        y: startY + 140,
        width: stepWidth - 20,
        fontSize: 20,
        fill: '#FFFFFF',
        text: step,
        align: 'center',
        fontFamily: fonts.body,
      });

      // Arrow (except last)
      if (idx < 3) {
        elements.push({
          type: 'text',
          x: currentX + stepWidth + 5,
          y: startY + 140,
          fontSize: 40,
          text: '→',
          fill: colors.secondary,
        });
      }

      currentX += stepWidth + 30;
    });
  }
}

// ============================================================================
// Helpers
// ============================================================================

function getDefaultLayout(slideType: string): SlideLayout {
  switch (slideType) {
    case 'vision': return 'standard';
    case 'system_architecture': return 'process';
    case 'agents_overview': return 'two_column';
    case 'pipeline': return 'process';
    case 'roadmap': return 'stats';
    case 'business_model': return 'two_column';
    case 'team': return 'two_column';
    case 'cover': return 'full_image';
    default: return 'standard';
  }
}

/**
 * 전체 Presentation을 Canvas 페이지별 요소 배열로 변환
 */
export function createSlidesCanvas(
  slides: SlideData[],
  theme?: BrandTheme
): CanvasElement[][] {
  return slides.map((slide, index) =>
    createSlideElements(slide, index + 1, slides.length, theme)
  );
}

/**
 * Slides를 Polotno Store에 추가
 */
export function addSlidesToCanvas(
  polotnoStore: any,
  slides: SlideData[],
  theme?: BrandTheme
): void {
  console.log('[SlidesTemplate] Starting addSlidesToCanvas with', slides.length, 'slides');

  if (!polotnoStore) {
    console.error('[SlidesTemplate] Polotno store is null/undefined');
    throw new Error('Polotno store is not initialized');
  }

  if (!slides || slides.length === 0) {
    console.error('[SlidesTemplate] No slides provided');
    throw new Error('No slides to add');
  }

  const { width, height } = PAGE_CONFIG;
  console.log('[SlidesTemplate] Page config:', { width, height });

  try {
    const slideElementsList = createSlidesCanvas(slides, theme);
    console.log('[SlidesTemplate] Created element lists for', slideElementsList.length, 'slides');

    slideElementsList.forEach((elements, index) => {
      console.log(`[SlidesTemplate] Adding slide ${index + 1} with ${elements.length} elements`);

      // 새 페이지 추가
      const newPage = polotnoStore.addPage({
        width,
        height,
      });
      console.log(`[SlidesTemplate] Created page ${index + 1}:`, newPage?.id || 'unknown');

      const page = polotnoStore.pages[polotnoStore.pages.length - 1];
      if (!page) {
        console.error(`[SlidesTemplate] Failed to get page ${index + 1}`);
        throw new Error(`Failed to create page ${index + 1}`);
      }

      // 요소 추가
      let addedCount = 0;
      elements.forEach((element, elemIdx) => {
        try {
          page.addElement(element);
          addedCount++;
        } catch (elemError) {
          console.error(`[SlidesTemplate] Failed to add element ${elemIdx} on slide ${index + 1}:`, elemError, element);
        }
      });
      console.log(`[SlidesTemplate] Added ${addedCount}/${elements.length} elements to slide ${index + 1}`);
    });

    // 첫 페이지를 활성화
    if (polotnoStore.pages.length > 0) {
      polotnoStore.selectPage(polotnoStore.pages[0].id);
    }

    console.log(`[SlidesTemplate] ✅ Successfully added ${slides.length} slides to canvas`);
  } catch (error) {
    console.error('[SlidesTemplate] ❌ Error adding slides to canvas:', error);
    throw error;
  }
}
