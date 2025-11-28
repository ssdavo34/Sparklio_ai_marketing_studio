/**
 * Product Detail Page Canvas Template
 *
 * 제품 상세페이지 데이터를 Polotno Canvas로 변환
 * - Hero, Problem, Solution, Demo, Benefits, Testimonials 등 섹션 지원
 * - 세로 스크롤 형식의 긴 페이지 레이아웃
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 */

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
  type: 'text' | 'rect' | 'svg';
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

  // 배경 그라디언트
  elements.push({
    type: 'rect',
    x: 0,
    y: startY,
    width: width,
    height: TEMPLATE_CONFIG.sectionHeight,
    fill: `linear-gradient(135deg, ${TEMPLATE_CONFIG.colors.hero[0]}, ${TEMPLATE_CONFIG.colors.hero[1]})`,
  });

  // 헤드라인
  elements.push({
    type: 'text',
    x: width / 2,
    y: startY + 250,
    width: width - margin * 2,
    fontSize: 64,
    fontWeight: 'bold',
    fill: '#FFFFFF',
    text: content?.headline || 'Hero Title',
    align: 'center',
    fontFamily: TEMPLATE_CONFIG.fonts.title,
  });

  // 서브헤드라인
  if (content?.subheadline) {
    elements.push({
      type: 'text',
      x: width / 2,
      y: startY + 350,
      width: width - margin * 2,
      fontSize: 32,
      fill: 'rgba(255, 255, 255, 0.9)',
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
      y: startY + 500,
      width: ctaWidth,
      height: 80,
      fill: '#FFFFFF',
      cornerRadius: 12,
    });

    elements.push({
      type: 'text',
      x: width / 2,
      y: startY + 540,
      fontSize: 28,
      fontWeight: 'bold',
      fill: TEMPLATE_CONFIG.colors.primary,
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
