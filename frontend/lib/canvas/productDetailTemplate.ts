/**
 * Product Detail Page Canvas Template
 *
 * 제품 상세페이지 데이터를 Polotno Canvas로 변환
 * - Hero, Problem, Solution, Demo, Benefits, Testimonials 등 섹션 지원
 * - 세로 스크롤 형식의 긴 페이지 레이아웃
 * - Layout API 연동 지원 (v1.2)
 *
 * @author C팀 (Frontend Team)
 * @version 1.2
 * @date 2025-12-04
 */

import { createPlaceholderMetadata } from './image-metadata';
import { layoutApi, type DocumentLayout, type LayoutElement, type PageLayout } from '@/lib/api/layout-api';

// ============================================================================
// Types
// ============================================================================

export interface DetailSection {
  section_type: 'hero' | 'problem' | 'solution' | 'demo' | 'benefits' | 'testimonials' | 'cta';
  order: number;
  content: any;
}

export interface ProductDetail {
  id: string;
  title: string;
  sections: DetailSection[];
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
  pageWidth: 1080,
  sectionHeight: 800, // 각 섹션의 기본 높이
  margin: 60,
  colors: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    text: '#1F2937',
    textLight: '#6B7280',
    background: '#FFFFFF',
    hero: ['#A855F7', '#3B82F6'],
    problem: '#FEE2E2',
    solution: '#D1FAE5',
    benefits: '#DBEAFE',
    gradient: ['#A855F7', '#EC4899'],
  },
  fonts: {
    title: 'Pretendard',
    body: 'Pretendard',
  },
};

// ============================================================================
// Section Generators
// ============================================================================

/**
 * Hero 섹션 생성
 */
function createHeroSection(content: any, width: number, startY: number): CanvasElement[] {
  const elements: CanvasElement[] = [];
  const margin = TEMPLATE_CONFIG.margin;

  // Hero 이미지 배경 (상단 절반)
  // TODO: Nano Banana로 생성된 이미지로 교체
  const heroImageHeight = TEMPLATE_CONFIG.sectionHeight * 0.5;

  if (content?.image_url) {
    // 실제 이미지가 있으면 표시
    elements.push({
      type: 'image',
      x: 0,
      y: startY,
      width: width,
      height: heroImageHeight,
      src: content.image_url,
      custom: createPlaceholderMetadata(content?.headline || 'Hero Image'),
    });
  } else {
    // 이미지가 없으면 그라디언트 플레이스홀더
    elements.push({
      type: 'rect',
      x: 0,
      y: startY,
      width: width,
      height: heroImageHeight,
      fill: `linear-gradient(135deg, ${TEMPLATE_CONFIG.colors.hero[0]}, ${TEMPLATE_CONFIG.colors.hero[1]})`,
    });
  }

  // 하단 텍스트 영역 배경
  elements.push({
    type: 'rect',
    x: 0,
    y: startY + heroImageHeight,
    width: width,
    height: TEMPLATE_CONFIG.sectionHeight - heroImageHeight,
    fill: '#FFFFFF',
  });

  // 헤드라인 (텍스트 영역 중앙)
  const textAreaY = startY + heroImageHeight;
  elements.push({
    type: 'text',
    x: width / 2,
    y: textAreaY + 80,
    width: width - margin * 2,
    fontSize: 64,
    fontWeight: 'bold',
    fill: TEMPLATE_CONFIG.colors.text,
    text: content?.headline || 'Hero Title',
    align: 'center',
    fontFamily: TEMPLATE_CONFIG.fonts.title,
  });

  // 서브헤드라인
  if (content?.subheadline) {
    elements.push({
      type: 'text',
      x: width / 2,
      y: textAreaY + 180,
      width: width - margin * 2,
      fontSize: 32,
      fill: TEMPLATE_CONFIG.colors.textLight,
      text: content.subheadline,
      align: 'center',
      fontFamily: TEMPLATE_CONFIG.fonts.body,
    });
  }

  // CTA 버튼
  if (content?.cta_text) {
    const ctaWidth = 300;
    elements.push({
      type: 'rect',
      x: (width - ctaWidth) / 2,
      y: textAreaY + 280,
      width: ctaWidth,
      height: 80,
      fill: TEMPLATE_CONFIG.colors.primary,
      cornerRadius: 12,
    });

    elements.push({
      type: 'text',
      x: width / 2,
      y: textAreaY + 320,
      fontSize: 28,
      fontWeight: 'bold',
      fill: '#FFFFFF',
      text: content.cta_text,
      align: 'center',
    });
  }

  return elements;
}

/**
 * Problem 섹션 생성
 */
function createProblemSection(content: any, width: number, startY: number): CanvasElement[] {
  const elements: CanvasElement[] = [];
  const margin = TEMPLATE_CONFIG.margin;

  // 배경
  elements.push({
    type: 'rect',
    x: 0,
    y: startY,
    width: width,
    height: TEMPLATE_CONFIG.sectionHeight,
    fill: TEMPLATE_CONFIG.colors.problem,
  });

  // 제목
  elements.push({
    type: 'text',
    x: margin,
    y: startY + margin,
    width: width - margin * 2,
    fontSize: 48,
    fontWeight: 'bold',
    fill: '#991B1B',
    text: content?.title || 'Problems',
    fontFamily: TEMPLATE_CONFIG.fonts.title,
  });

  // 문제점들
  let itemY = startY + 150;
  if (content?.problems) {
    content.problems.slice(0, 3).forEach((problem: any) => {
      // 문제 카드 배경
      elements.push({
        type: 'rect',
        x: margin,
        y: itemY,
        width: width - margin * 2,
        height: 120,
        fill: '#FFFFFF',
        cornerRadius: 8,
      });

      // 이모지
      elements.push({
        type: 'text',
        x: margin + 30,
        y: itemY + 60,
        fontSize: 40,
        text: '😰',
      });

      // 제목
      elements.push({
        type: 'text',
        x: margin + 100,
        y: itemY + 40,
        width: width - margin * 2 - 120,
        fontSize: 24,
        fontWeight: 'bold',
        fill: TEMPLATE_CONFIG.colors.text,
        text: problem.title || problem,
      });

      // 설명
      if (problem.description) {
        elements.push({
          type: 'text',
          x: margin + 100,
          y: itemY + 75,
          width: width - margin * 2 - 120,
          fontSize: 18,
          fill: TEMPLATE_CONFIG.colors.textLight,
          text: problem.description,
        });
      }

      itemY += 140;
    });
  }

  return elements;
}

/**
 * Solution 섹션 생성
 */
function createSolutionSection(content: any, width: number, startY: number): CanvasElement[] {
  const elements: CanvasElement[] = [];
  const margin = TEMPLATE_CONFIG.margin;

  // 배경
  elements.push({
    type: 'rect',
    x: 0,
    y: startY,
    width: width,
    height: TEMPLATE_CONFIG.sectionHeight,
    fill: TEMPLATE_CONFIG.colors.solution,
  });

  // 제목
  elements.push({
    type: 'text',
    x: margin,
    y: startY + margin,
    width: width - margin * 2,
    fontSize: 48,
    fontWeight: 'bold',
    fill: '#065F46',
    text: content?.title || 'Solution',
    fontFamily: TEMPLATE_CONFIG.fonts.title,
  });

  // 설명
  if (content?.description) {
    elements.push({
      type: 'text',
      x: margin,
      y: startY + 130,
      width: width - margin * 2,
      fontSize: 24,
      fill: '#047857',
      text: content.description,
    });
  }

  // 기능들
  let itemY = startY + 220;
  if (content?.features) {
    content.features.slice(0, 3).forEach((feature: any) => {
      // 기능 카드 배경
      elements.push({
        type: 'rect',
        x: margin,
        y: itemY,
        width: width - margin * 2,
        height: 120,
        fill: '#FFFFFF',
        cornerRadius: 8,
      });

      // 이모지
      elements.push({
        type: 'text',
        x: margin + 30,
        y: itemY + 60,
        fontSize: 40,
        text: '✨',
      });

      // 제목
      elements.push({
        type: 'text',
        x: margin + 100,
        y: itemY + 40,
        width: width - margin * 2 - 120,
        fontSize: 24,
        fontWeight: 'bold',
        fill: TEMPLATE_CONFIG.colors.text,
        text: feature.title || feature,
      });

      // 설명
      if (feature.description) {
        elements.push({
          type: 'text',
          x: margin + 100,
          y: itemY + 75,
          width: width - margin * 2 - 120,
          fontSize: 18,
          fill: TEMPLATE_CONFIG.colors.textLight,
          text: feature.description,
        });
      }

      itemY += 140;
    });
  }

  return elements;
}

/**
 * Benefits 섹션 생성
 */
function createBenefitsSection(content: any, width: number, startY: number): CanvasElement[] {
  const elements: CanvasElement[] = [];
  const margin = TEMPLATE_CONFIG.margin;

  // 배경
  elements.push({
    type: 'rect',
    x: 0,
    y: startY,
    width: width,
    height: TEMPLATE_CONFIG.sectionHeight,
    fill: TEMPLATE_CONFIG.colors.benefits,
  });

  // 제목
  elements.push({
    type: 'text',
    x: margin,
    y: startY + margin,
    width: width - margin * 2,
    fontSize: 48,
    fontWeight: 'bold',
    fill: '#1E40AF',
    text: '📈 ' + (content?.title || 'Benefits'),
    fontFamily: TEMPLATE_CONFIG.fonts.title,
  });

  // 메트릭들 (3열 그리드)
  if (content?.metrics) {
    const cardWidth = (width - margin * 2 - 40) / 3;
    const cardHeight = 200;
    const cardY = startY + 150;

    content.metrics.slice(0, 3).forEach((metric: any, index: number) => {
      const cardX = margin + (cardWidth + 20) * index;

      // 카드 배경
      elements.push({
        type: 'rect',
        x: cardX,
        y: cardY,
        width: cardWidth,
        height: cardHeight,
        fill: '#FFFFFF',
        cornerRadius: 12,
      });

      // 값
      elements.push({
        type: 'text',
        x: cardX + cardWidth / 2,
        y: cardY + 60,
        fontSize: 48,
        fontWeight: 'bold',
        fill: '#2563EB',
        text: metric.value || metric,
        align: 'center',
      });

      // 레이블
      elements.push({
        type: 'text',
        x: cardX + cardWidth / 2,
        y: cardY + 110,
        width: cardWidth - 20,
        fontSize: 20,
        fontWeight: 'bold',
        fill: TEMPLATE_CONFIG.colors.text,
        text: metric.label || '',
        align: 'center',
      });

      // 설명
      if (metric.description) {
        elements.push({
          type: 'text',
          x: cardX + cardWidth / 2,
          y: cardY + 150,
          width: cardWidth - 20,
          fontSize: 14,
          fill: TEMPLATE_CONFIG.colors.textLight,
          text: metric.description,
          align: 'center',
        });
      }
    });
  }

  return elements;
}

// ============================================================================
// Main Canvas Generator
// ============================================================================

/**
 * Product Detail 전체를 Canvas 요소로 변환
 * 각 섹션을 별도 페이지로 생성
 */
export function createProductDetailCanvas(detail: ProductDetail): CanvasElement[][] {
  const sectionElementsList: CanvasElement[][] = [];

  detail.sections.forEach((section) => {
    let elements: CanvasElement[] = [];

    switch (section.section_type) {
      case 'hero':
        elements = createHeroSection(section.content, TEMPLATE_CONFIG.pageWidth, 0);
        break;
      case 'problem':
        elements = createProblemSection(section.content, TEMPLATE_CONFIG.pageWidth, 0);
        break;
      case 'solution':
        elements = createSolutionSection(section.content, TEMPLATE_CONFIG.pageWidth, 0);
        break;
      case 'benefits':
        elements = createBenefitsSection(section.content, TEMPLATE_CONFIG.pageWidth, 0);
        break;
      default:
        // 기본 섹션
        elements = [{
          type: 'text',
          x: TEMPLATE_CONFIG.margin,
          y: 100,
          width: TEMPLATE_CONFIG.pageWidth - TEMPLATE_CONFIG.margin * 2,
          fontSize: 32,
          fill: TEMPLATE_CONFIG.colors.text,
          text: `Section: ${section.section_type}`,
        }];
    }

    if (elements.length > 0) {
      sectionElementsList.push(elements);
    }
  });

  return sectionElementsList;
}

/**
 * Product Detail을 Polotno Store에 추가
 */
export function addProductDetailToCanvas(polotnoStore: any, detail: ProductDetail): void {
  if (!polotnoStore) {
    throw new Error('Polotno store is not initialized');
  }

  const sectionElementsList = createProductDetailCanvas(detail);

  sectionElementsList.forEach((elements, index) => {
    // 새 페이지 추가
    polotnoStore.addPage({
      width: TEMPLATE_CONFIG.pageWidth,
      height: TEMPLATE_CONFIG.sectionHeight,
    });

    const page = polotnoStore.pages[polotnoStore.pages.length - 1];

    if (!page) {
      throw new Error(`Failed to create page for section ${index}`);
    }

    // 요소 추가
    elements.forEach((element) => {
      page.addElement(element);
    });
  });

  console.log(`[ProductDetailTemplate] Added ${detail.sections.length} sections to canvas`);
}

// ============================================================================
// Layout API Integration
// ============================================================================

/**
 * Layout API를 사용하여 상세페이지를 생성하고 Canvas에 추가
 *
 * @param polotnoStore Polotno Store
 * @param productData 상품 데이터
 */
export async function addProductDetailWithLayoutAPI(
  polotnoStore: any,
  productData: {
    product_name: string;
    tagline?: string;
    description: string;
    features?: Array<{
      title: string;
      description: string;
      icon?: string;
    }>;
    specifications?: Record<string, string>;
    price?: string;
    images?: string[];
    cta_text?: string;
  },
  options?: {
    pageWidth?: number;
    pageHeight?: number;
    style?: 'modern' | 'classic' | 'minimal';
  }
): Promise<void> {
  if (!polotnoStore) {
    throw new Error('Polotno store is not initialized');
  }

  try {
    // Layout API 호출
    const response = await layoutApi.generateProductLayout({
      product_name: productData.product_name,
      tagline: productData.tagline,
      description: productData.description,
      features: productData.features,
      specifications: productData.specifications,
      price: productData.price,
      images: productData.images,
      cta_text: productData.cta_text,
      options: {
        page_width: options?.pageWidth || TEMPLATE_CONFIG.pageWidth,
        page_height: options?.pageHeight || TEMPLATE_CONFIG.sectionHeight,
        style: options?.style || 'modern',
      },
    });

    const layout = response.layout;

    // 캔버스에 렌더링
    renderLayoutToCanvas(polotnoStore, layout);

    console.log(`[ProductDetailTemplate] Added ${layout.total_pages} pages via Layout API`);
  } catch (error) {
    console.error('[ProductDetailTemplate] Layout API failed:', error);
    throw error;
  }
}

/**
 * DocumentLayout을 Polotno Canvas에 렌더링
 */
function renderLayoutToCanvas(polotnoStore: any, layout: DocumentLayout): void {
  const pageWidth = layout.page_width;
  const pageHeight = layout.page_height;

  layout.pages.forEach((pageLayout: PageLayout, pageIndex: number) => {
    // 새 페이지 추가
    polotnoStore.addPage({
      width: pageWidth,
      height: pageHeight,
    });

    const page = polotnoStore.pages[polotnoStore.pages.length - 1];

    // 각 요소를 페이지에 추가
    pageLayout.elements.forEach((element: LayoutElement) => {
      addLayoutElementToPage(page, element);
    });

    // Footer
    page.addElement({
      type: 'text',
      x: 60,
      y: pageHeight - 45,
      width: pageWidth - 120,
      fontSize: 10,
      fill: '#9CA3AF',
      text: `Page ${pageIndex + 1} of ${layout.total_pages} • Product Detail • ${new Date().toLocaleDateString('ko-KR')}`,
      align: 'center',
    });
  });
}

/**
 * LayoutElement를 Polotno 요소로 변환하여 페이지에 추가
 */
function addLayoutElementToPage(page: any, element: LayoutElement): void {
  const props = element.properties || {};

  switch (element.type) {
    case 'heading':
    case 'text':
    case 'paragraph':
      page.addElement({
        type: 'text',
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        text: element.content || '',
        fontSize: props.fontSize || 24,
        fontWeight: props.fontWeight || 'normal',
        fill: props.color || '#000000',
        align: props.textAlign || 'left',
      });
      break;

    case 'list':
      const items = props.items || [];
      const listStyle = props.listStyle || 'bullet';
      const prefix = listStyle === 'bullet' ? '• ' : listStyle === 'check' ? '✓ ' : '';
      const listText = items
        .map((item: string, i: number) =>
          listStyle === 'number' ? `${i + 1}. ${item}` : `${prefix}${item}`
        )
        .join('\n');

      page.addElement({
        type: 'text',
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        text: listText,
        fontSize: props.fontSize || 14,
        fill: props.color || '#333333',
        lineHeight: 1.6,
      });
      break;

    case 'card':
      page.addElement({
        type: 'rect',
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        fill: props.backgroundColor || '#ffffff',
        cornerRadius: props.borderRadius || 8,
        stroke: props.borderColor || '#e0e0e0',
        strokeWidth: 1,
      });

      if (element.content) {
        page.addElement({
          type: 'text',
          x: element.x + (props.padding || 16),
          y: element.y + (props.padding || 16),
          width: element.width - (props.padding || 16) * 2,
          text: element.content,
          fontSize: props.fontSize || 14,
          fill: props.color || '#333333',
        });
      }
      break;

    case 'image':
      page.addElement({
        type: 'image',
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        src: element.content || props.placeholder || 'https://via.placeholder.com/400x300',
      });
      break;

    case 'cta_button':
      page.addElement({
        type: 'rect',
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        fill: props.backgroundColor || '#3b82f6',
        cornerRadius: props.borderRadius || 8,
      });

      page.addElement({
        type: 'text',
        x: element.x,
        y: element.y + (element.height - (props.fontSize || 16)) / 2,
        width: element.width,
        text: element.content || 'Click Here',
        fontSize: props.fontSize || 16,
        fill: props.color || '#ffffff',
        fontWeight: 'bold',
        align: 'center',
      });
      break;

    default:
      if (element.content) {
        page.addElement({
          type: 'text',
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          text: element.content,
          fontSize: props.fontSize || 14,
          fill: props.color || '#000000',
        });
      }
  }
}
