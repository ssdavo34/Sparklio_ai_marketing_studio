/**
 * Slides Template
 *
 * Presentation Slides 데이터를 Polotno Canvas로 변환
 * - 각 슬라이드를 별도 페이지로 생성
 * - 제목, 본문, Bullet Points 자동 배치
 * - 일관된 디자인 적용
 *
 * @author C팀 (Frontend Team)
 * @version 1.1
 * @date 2025-11-28
 */

import { createPlaceholderMetadata } from './image-metadata';

// ============================================================================
// Types
// ============================================================================

export interface Slide {
  id: string;
  title: string;
  content: string | any[];
  bullets?: string[];
  speakerNotes?: string;
  subtitle?: string;
  image_url?: string;
  visual_description?: string;
}

interface CanvasElement {
  type: 'text' | 'rect' | 'svg' | 'image';
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

// ============================================================================
// Template Configuration
// ============================================================================

const TEMPLATE_CONFIG = {
  pageWidth: 1920,
  pageHeight: 1080,
  margin: 80,
  colors: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    text: '#1F2937',
    textLight: '#6B7280',
    background: '#FFFFFF',
    accent: '#F3F4F6',
  },
  fonts: {
    title: 'Pretendard',
    body: 'Pretendard',
  },
};

// ============================================================================
// Slide Template Generator
// ============================================================================

/**
 * 단일 슬라이드를 Canvas 요소 배열로 변환
 */
export function createSlideElements(
  slide: Slide,
  slideNumber: number,
  totalSlides: number
): CanvasElement[] {
  const elements: CanvasElement[] = [];
  const { pageWidth, pageHeight, margin, colors, fonts } = TEMPLATE_CONFIG;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // 배경
  elements.push({
    type: 'rect',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    fill: colors.background,
  });

  // 상단 액센트 바
  elements.push({
    type: 'rect',
    x: 0,
    y: 0,
    width: pageWidth,
    height: 8,
    fill: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
  });

  // 슬라이드 번호 (우측 상단)
  elements.push({
    type: 'text',
    x: pageWidth - margin - 100,
    y: margin - 20,
    width: 100,
    fontSize: 16,
    fill: colors.textLight,
    text: `${slideNumber} / ${totalSlides}`,
    align: 'right',
    fontFamily: fonts.body,
  });

  // 제목
  elements.push({
    type: 'text',
    x: margin,
    y: currentY,
    width: contentWidth - 120, // 슬라이드 번호 공간 확보
    fontSize: 64,
    fontWeight: 'bold',
    fill: colors.primary,
    text: slide.title,
    fontFamily: fonts.title,
  });
  currentY += 120;

  // 부제목 (있을 경우)
  if (slide.subtitle) {
    elements.push({
      type: 'text',
      x: margin,
      y: currentY,
      width: contentWidth,
      fontSize: 32,
      fill: colors.textLight,
      text: slide.subtitle,
      fontFamily: fonts.body,
    });
    currentY += 60;
  }

  // 구분선
  elements.push({
    type: 'rect',
    x: margin,
    y: currentY,
    width: 120,
    height: 4,
    fill: colors.secondary,
    cornerRadius: 2,
  });
  currentY += 40;

  // 이미지가 있으면 2열 레이아웃 (좌: 텍스트, 우: 이미지)
  const hasImage = slide.image_url || slide.visual_description;
  const textColumnWidth = hasImage ? contentWidth * 0.5 - 20 : contentWidth;
  const imageColumnX = hasImage ? margin + contentWidth * 0.5 + 20 : 0;
  const imageWidth = hasImage ? contentWidth * 0.5 - 20 : 0;

  // 이미지 추가 (우측)
  if (hasImage) {
    const imageHeight = 500;

    if (slide.image_url) {
      // 실제 이미지
      elements.push({
        type: 'image',
        x: imageColumnX,
        y: currentY,
        width: imageWidth,
        height: imageHeight,
        src: slide.image_url,
        custom: createPlaceholderMetadata(
          slide.visual_description || slide.title
        ),
      });
    } else {
      // 플레이스홀더
      elements.push({
        type: 'rect',
        x: imageColumnX,
        y: currentY,
        width: imageWidth,
        height: imageHeight,
        fill: colors.accent,
        cornerRadius: 12,
      });

      elements.push({
        type: 'text',
        x: imageColumnX + imageWidth / 2,
        y: currentY + imageHeight / 2,
        fontSize: 80,
        text: '🖼️',
        align: 'center',
      });
    }
  }

  // 본문 컨텐츠 (좌측 또는 전체 너비)
  if (slide.content && typeof slide.content === 'string') {
    elements.push({
      type: 'text',
      x: margin,
      y: currentY,
      width: textColumnWidth,
      fontSize: 28,
      fill: colors.text,
      text: slide.content,
      fontFamily: fonts.body,
      lineHeight: 1.6,
    });
    currentY += 200;
  }

  // Bullet Points (있을 경우)
  if (slide.bullets && slide.bullets.length > 0) {
    slide.bullets.forEach((bullet, index) => {
      // Bullet 아이콘
      elements.push({
        type: 'rect',
        x: margin,
        y: currentY + 10,
        width: 12,
        height: 12,
        fill: colors.secondary,
        cornerRadius: 6,
      });

      // Bullet 텍스트
      elements.push({
        type: 'text',
        x: margin + 30,
        y: currentY,
        width: contentWidth - 30,
        fontSize: 24,
        fill: colors.text,
        text: bullet,
        fontFamily: fonts.body,
        lineHeight: 1.5,
      });

      currentY += 50;
    });
  }

  // 하단 로고/브랜딩 영역 (선택)
  elements.push({
    type: 'text',
    x: margin,
    y: pageHeight - margin + 20,
    width: contentWidth,
    fontSize: 14,
    fill: colors.textLight,
    text: 'Created with Sparklio AI',
    fontFamily: fonts.body,
  });

  return elements;
}

/**
 * 전체 Presentation을 Canvas 페이지별 요소 배열로 변환
 */
export function createSlidesCanvas(slides: Slide[]): CanvasElement[][] {
  return slides.map((slide, index) =>
    createSlideElements(slide, index + 1, slides.length)
  );
}

/**
 * Slides를 Polotno Store에 추가
 */
export function addSlidesToCanvas(polotnoStore: any, slides: Slide[]): void {
  if (!polotnoStore) {
    throw new Error('Polotno store is not initialized');
  }

  const { pageWidth, pageHeight } = TEMPLATE_CONFIG;
  const slideElementsList = createSlidesCanvas(slides);

  slideElementsList.forEach((elements, index) => {
    // 새 페이지 추가
    polotnoStore.addPage({
      width: pageWidth,
      height: pageHeight,
    });

    const page = polotnoStore.pages[polotnoStore.pages.length - 1];
    if (!page) {
      throw new Error(`Failed to create page ${index + 1}`);
    }

    // 요소 추가
    elements.forEach((element) => {
      page.addElement(element);
    });
  });

  console.log(`[SlidesTemplate] Added ${slides.length} slides to canvas`);
}
