/**
 * 실제 생산물 포맷 기반 Polotno 페이지 생성
 * 
 * ❌ 기존: 1080×1080 가상 "컨셉 요약" 페이지
 * ✅ 신규: 실제 포맷(슬라이드, 인스타, 쇼츠)에 맞는 실제 캔버스 페이지
 * 
 * @author Antigravity AI
 * @version 2.0 (Representative Page Architecture)
 * @date 2025-11-27
 */

import type { ConceptData } from '@/types/demo';

// ============================================================================
// Canvas Format Definitions
// ============================================================================

export type CanvasFormat =
  | 'slide_16_9'       // 프레젠테이션 슬라이드 (1920×1080)
  | 'instagram_1_1'    // 인스타그램 피드 (1080×1080)
  | 'instagram_4_5'    // 인스타그램 세로 (1080×1350)
  | 'shorts_9_16'      // 쇼츠/릴스 (1080×1920)
  | 'story_9_16'       // 스토리 (1080×1920)
  | 'youtube_16_9'     // 유튜브 썸네일 (1280×720)
  | 'custom';          // 커스텀 크기

interface FormatSpec {
  width: number;
  height: number;
  name: string;
}

export const FORMAT_SPECS: Record<CanvasFormat, FormatSpec> = {
  slide_16_9: { width: 1920, height: 1080, name: '슬라이드 (16:9)' },
  instagram_1_1: { width: 1080, height: 1080, name: '인스타그램 피드 (1:1)' },
  instagram_4_5: { width: 1080, height: 1350, name: '인스타그램 세로 (4:5)' },
  shorts_9_16: { width: 1080, height: 1920, name: '쇼츠/릴스 (9:16)' },
  story_9_16: { width: 1080, height: 1920, name: '스토리 (9:16)' },
  youtube_16_9: { width: 1280, height: 720, name: '유튜브 썸네일 (16:9)' },
  custom: { width: 1080, height: 1080, name: '커스텀' },
};

// ============================================================================
// Layout Generators (Format-specific)
// ============================================================================

interface LayoutElements {
  headline: { x: number; y: number; width: number; height: number; fontSize: number };
  subheadline: { x: number; y: number; width: number; height: number; fontSize: number };
  body: { x: number; y: number; width: number; height: number; fontSize: number };
  cta: { x: number; y: number; width: number; height: number; fontSize: number };
}

/**
 * 포맷별 레이아웃 계산
 */
function getLayoutForFormat(format: CanvasFormat, width: number, height: number): LayoutElements {
  const padding = Math.min(width, height) * 0.08; // 8% padding

  if (format === 'slide_16_9' || format === 'youtube_16_9') {
    // 가로 레이아웃 (16:9)
    return {
      headline: {
        x: padding,
        y: height * 0.25,
        width: width - padding * 2,
        height: height * 0.15,
        fontSize: Math.min(width / 20, 72),
      },
      subheadline: {
        x: padding,
        y: height * 0.45,
        width: width - padding * 2,
        height: height * 0.1,
        fontSize: Math.min(width / 40, 32),
      },
      body: {
        x: padding,
        y: height * 0.6,
        width: width - padding * 2,
        height: height * 0.2,
        fontSize: Math.min(width / 60, 24),
      },
      cta: {
        x: padding,
        y: height * 0.85,
        width: Math.min(width * 0.3, 400),
        height: 60,
        fontSize: 20,
      },
    };
  } else if (format === 'shorts_9_16' || format === 'story_9_16') {
    // 세로 레이아웃 (9:16)
    return {
      headline: {
        x: padding,
        y: height * 0.15,
        width: width - padding * 2,
        height: height * 0.12,
        fontSize: Math.min(width / 12, 56),
      },
      subheadline: {
        x: padding,
        y: height * 0.3,
        width: width - padding * 2,
        height: height * 0.08,
        fontSize: Math.min(width / 24, 28),
      },
      body: {
        x: padding,
        y: height * 0.42,
        width: width - padding * 2,
        height: height * 0.25,
        fontSize: Math.min(width / 32, 22),
      },
      cta: {
        x: padding,
        y: height * 0.85,
        width: width - padding * 2,
        height: 60,
        fontSize: 20,
      },
    };
  } else {
    // 정사각형 레이아웃 (1:1, 4:5)
    return {
      headline: {
        x: padding,
        y: height * 0.25,
        width: width - padding * 2,
        height: height * 0.15,
        fontSize: Math.min(width / 15, 64),
      },
      subheadline: {
        x: padding,
        y: height * 0.45,
        width: width - padding * 2,
        height: height * 0.1,
        fontSize: Math.min(width / 30, 28),
      },
      body: {
        x: padding,
        y: height * 0.6,
        width: width - padding * 2,
        height: height * 0.2,
        fontSize: Math.min(width / 40, 22),
      },
      cta: {
        x: padding,
        y: height * 0.85,
        width: width - padding * 2,
        height: 60,
        fontSize: 20,
      },
    };
  }
}

// ============================================================================
// Page Creation Functions
// ============================================================================

interface PolotnoStoreType {
  addPage: (page?: any) => any;
  pages: any[];
}

interface PageCreationOptions {
  format?: CanvasFormat;
  backgroundColor?: string;
  isRepresentative?: boolean; // 대표 페이지 여부
}

/**
 * 실제 생산물 포맷으로 Polotno 페이지 생성
 * 
 * @param store - Polotno store
 * @param concept - 컨셉 데이터
 * @param options - 페이지 생성 옵션
 */
export function createProductionPage(
  store: PolotnoStoreType,
  concept: ConceptData,
  options: PageCreationOptions = {}
): any {
  const format = options.format || 'slide_16_9'; // 기본값: 슬라이드
  const spec = FORMAT_SPECS[format];

  // 컨셉별 색상 스킴
  const colorSchemes = [
    { primary: '#8B5CF6', secondary: '#6366F1', accent: '#C7D2FE' }, // 보라색
    { primary: '#EC4899', secondary: '#F472B6', accent: '#FBCFE8' }, // 핑크색
    { primary: '#F59E0B', secondary: '#FBBF24', accent: '#FDE68A' }, // 주황색
  ];

  const colorIndex = parseInt(concept.concept_id?.slice(-1) || '0', 10) % 3;
  const colors = colorSchemes[colorIndex] || colorSchemes[0];

  // 페이지 생성
  const page = store.addPage({
    width: spec.width,
    height: spec.height,
    background: options.backgroundColor || colors.primary,
  });

  // 메타데이터 설정
  page.set({
    custom: {
      conceptId: concept.concept_id,
      conceptName: concept.concept_name || concept.key_message,
      format,
      formatName: spec.name,
      isProductionPage: true, // 실제 생산물 페이지임을 표시
      isRepresentative: options.isRepresentative || false,
      createdAt: new Date().toISOString(),
    },
  });

  // 레이아웃 계산
  const layout = getLayoutForFormat(format, spec.width, spec.height);

  // 1. 배경 (White Clean Style - Concept Board와 일치)
  page.set({ background: '#FFFFFF' });

  // 2. 메인 헤드라인 (Black Text)
  const headline = concept.key_message || concept.concept_name || '새로운 캠페인';
  page.addElement({
    type: 'text',
    x: layout.headline.x,
    y: layout.headline.y,
    width: layout.headline.width,
    height: layout.headline.height,
    fontSize: layout.headline.fontSize,
    fontWeight: 'bold',
    fill: '#111827', // Gray-900
    align: 'left',
    text: headline,
    fontFamily: 'Pretendard',
  });

  // 3. 서브헤드라인 (타겟 오디언스 - Purple Badge Style)
  if (concept.target_audience) {
    // Badge Background
    const badgeWidth = Math.min(layout.subheadline.width, 500);
    const badgeHeight = layout.subheadline.height;

    const badgeSvg = `
      <svg width="${badgeWidth}" height="${badgeHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" rx="12" ry="12" fill="${colors.accent}" fill-opacity="0.2" />
      </svg>
    `;

    page.addElement({
      type: 'svg',
      x: layout.subheadline.x,
      y: layout.subheadline.y,
      width: badgeWidth,
      height: badgeHeight,
      src: `data:image/svg+xml;base64,${btoa(badgeSvg)}`,
    });

    // Badge Text
    page.addElement({
      type: 'text',
      x: layout.subheadline.x + 20,
      y: layout.subheadline.y + (badgeHeight - layout.subheadline.fontSize) / 2,
      width: badgeWidth - 40,
      height: layout.subheadline.fontSize + 10,
      fontSize: layout.subheadline.fontSize,
      fill: colors.primary,
      align: 'left',
      text: `🎯 ${concept.target_audience}`,
      fontFamily: 'Pretendard',
      fontWeight: 'bold',
    });
  }

  // 4. 본문 (Gray Text)
  const bodyText = concept.concept_description || concept.brand_role || '';
  if (bodyText) {
    page.addElement({
      type: 'text',
      x: layout.body.x,
      y: layout.body.y,
      width: layout.body.width,
      height: layout.body.height,
      fontSize: layout.body.fontSize,
      fill: '#4B5563', // Gray-600
      align: 'left',
      text: bodyText,
      fontFamily: 'Pretendard',
      lineHeight: 1.6,
    });
  }

  // 5. CTA 버튼 (Solid Color)
  const ctaText = '자세히 보기';
  const ctaSvg = `
    <svg width="${layout.cta.width}" height="${layout.cta.height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" rx="30" ry="30" fill="${colors.primary}" />
    </svg>
  `;

  page.addElement({
    type: 'svg',
    x: layout.cta.x,
    y: layout.cta.y,
    width: layout.cta.width,
    height: layout.cta.height,
    src: `data:image/svg+xml;base64,${btoa(ctaSvg)}`,
    selectable: false,
  });

  page.addElement({
    type: 'text',
    x: layout.cta.x,
    y: layout.cta.y + (layout.cta.height - layout.cta.fontSize) / 2,
    width: layout.cta.width,
    height: layout.cta.fontSize + 10,
    fontSize: layout.cta.fontSize,
    fontFamily: 'Pretendard',
    text: ctaText,
    fill: 'white',
    fontWeight: 'bold',
    align: 'center',
  });

  return page;
}

/**
 * 컨셉을 위한 다중 포맷 페이지 세트 생성
 * 
 * @param store - Polotno store
 * @param concept - 컨셉 데이터
 * @param formats - 생성할 포맷 배열 (기본: ['slide_16_9', 'instagram_1_1', 'shorts_9_16'])
 */
export function createMultiFormatPages(
  store: PolotnoStoreType,
  concept: ConceptData,
  formats: CanvasFormat[] = ['slide_16_9', 'instagram_1_1', 'shorts_9_16']
): any[] {
  const pages: any[] = [];

  formats.forEach((format, index) => {
    const page = createProductionPage(store, concept, {
      format,
      isRepresentative: index === 0, // 첫 번째 포맷을 대표 페이지로
    });
    pages.push(page);
  });

  return pages;
}

/**
 * 여러 컨셉에 대해 실제 생산물 페이지 생성
 * 
 * @param store - Polotno store
 * @param concepts - 컨셉 배열
 * @param formatPerConcept - 컨셉당 생성할 포맷 (기본: 슬라이드만)
 */
export function createProductionPagesFromConcepts(
  store: PolotnoStoreType,
  concepts: ConceptData[],
  formatPerConcept: CanvasFormat | CanvasFormat[] = 'slide_16_9'
): any[] {
  const allPages: any[] = [];

  concepts.forEach((concept, conceptIndex) => {
    if (Array.isArray(formatPerConcept)) {
      // 각 컨셉마다 여러 포맷 생성
      const pages = createMultiFormatPages(store, concept, formatPerConcept);
      allPages.push(...pages);
    } else {
      // 각 컨셉마다 단일 포맷 생성
      const page = createProductionPage(store, concept, {
        format: formatPerConcept,
        isRepresentative: true, // 단일 포맷인 경우 대표 페이지로
      });
      allPages.push(page);
    }
  });

  return allPages;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 포맷에서 aspect ratio 계산
 */
export function getAspectRatio(format?: CanvasFormat): number {
  if (!format || format === 'custom') return 1;
  const spec = FORMAT_SPECS[format];
  return spec.width / spec.height;
}

/**
 * 포맷 이름 가져오기
 */
export function getFormatName(format?: CanvasFormat): string {
  if (!format || format === 'custom') return '커스텀';
  return FORMAT_SPECS[format].name;
}
