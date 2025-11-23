/**
 * Content Plan to Polotno Adapter
 *
 * ContentPlanPagesSchema를 Polotno Slides로 변환
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 * @reference docs/CONTENT_PLAN_TO_PAGES_SPEC_V2.md
 */

import type {
  ContentPlanPagesSchema,
  Page,
  Block,
  PageLayoutType,
  BlockType,
} from '../types/content-plan';

// ============================================================================
// Types
// ============================================================================

interface PolotnoStore {
  addPage: (config: any) => any;
  pages: any[];
  width: number;
  height: number;
  activePage: any;
  setPage: (pageId: string) => void;
}

interface ConversionOptions {
  /** 페이지 크기 (기본: A4) */
  pageWidth?: number;
  pageHeight?: number;
  /** 기본 폰트 패밀리 */
  fontFamily?: string;
  /** 기본 색상 테마 */
  colorTheme?: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
  };
}

const DEFAULT_OPTIONS: Required<ConversionOptions> = {
  pageWidth: 1200,
  pageHeight: 1600,
  fontFamily: 'Noto Sans KR',
  colorTheme: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    text: '#1F2937',
    background: '#FFFFFF',
  },
};

// ============================================================================
// Main Conversion Function
// ============================================================================

/**
 * ContentPlanPages를 Polotno Store에 추가
 */
export async function applyContentPlanToPolotno(
  polotnoStore: PolotnoStore,
  contentPlan: ContentPlanPagesSchema,
  options: ConversionOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 기존 페이지 제거 (첫 페이지 제외)
  while (polotnoStore.pages.length > 1) {
    const lastPage = polotnoStore.pages[polotnoStore.pages.length - 1];
    lastPage.delete();
  }

  // 첫 페이지도 비우기
  if (polotnoStore.pages.length > 0) {
    const firstPage = polotnoStore.pages[0];
    firstPage.children.forEach((child: any) => child.delete());
  }

  // ContentPlan Pages를 Polotno Pages로 변환
  for (let i = 0; i < contentPlan.pages.length; i++) {
    const page = contentPlan.pages[i];

    // 첫 페이지는 기존 페이지 사용, 나머지는 새로 추가
    let polotnoPage;
    if (i === 0 && polotnoStore.pages.length > 0) {
      polotnoPage = polotnoStore.pages[0];
    } else {
      polotnoPage = polotnoStore.addPage({
        width: opts.pageWidth,
        height: opts.pageHeight,
      });
    }

    // 레이아웃에 따라 배경 추가
    await applyLayoutBackground(polotnoPage, page.layout, opts);

    // 블록들을 Polotno Elements로 변환
    await convertBlocksToElements(polotnoPage, page.blocks, page.layout, opts);
  }

  console.log(`[applyContentPlanToPolotno] ✅ ${contentPlan.pages.length} pages converted`);
}

// ============================================================================
// Layout Background
// ============================================================================

const LAYOUT_GRADIENTS: Record<PageLayoutType, { from: string; to: string }> = {
  cover: { from: '#6366F1', to: '#4F46E5' },
  audience: { from: '#3B82F6', to: '#06B6D4' },
  overview: { from: '#10B981', to: '#059669' },
  channels: { from: '#F59E0B', to: '#D97706' },
  cta: { from: '#EC4899', to: '#DB2777' },
};

async function applyLayoutBackground(
  page: any,
  layout: PageLayoutType,
  options: Required<ConversionOptions>
): Promise<void> {
  const gradient = LAYOUT_GRADIENTS[layout];

  // SVG 그라데이션 배경 생성
  const svgBackground = `
    <svg width="${options.pageWidth}" height="${options.pageHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradient.from};stop-opacity:0.1" />
          <stop offset="100%" style="stop-color:${gradient.to};stop-opacity:0.15" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg-gradient)" />
    </svg>
  `;

  page.addElement({
    type: 'svg',
    x: 0,
    y: 0,
    width: options.pageWidth,
    height: options.pageHeight,
    src: `data:image/svg+xml;base64,${btoa(svgBackground)}`,
    selectable: false,
    locked: true,
  });
}

// ============================================================================
// Blocks to Elements Conversion
// ============================================================================

async function convertBlocksToElements(
  page: any,
  blocks: Block[],
  layout: PageLayoutType,
  options: Required<ConversionOptions>
): Promise<void> {
  // 레이아웃별 위치 전략
  const layoutStrategy = getLayoutStrategy(layout, options);

  let currentY = layoutStrategy.startY;

  for (const block of blocks) {
    const element = await convertBlockToElement(
      block,
      currentY,
      layoutStrategy.contentWidth,
      layoutStrategy.contentX,
      options
    );

    if (element) {
      page.addElement(element);
      currentY += element.height + layoutStrategy.spacing;
    }
  }
}

// ============================================================================
// Layout Strategies
// ============================================================================

interface LayoutStrategy {
  startY: number;
  contentX: number;
  contentWidth: number;
  spacing: number;
}

function getLayoutStrategy(
  layout: PageLayoutType,
  options: Required<ConversionOptions>
): LayoutStrategy {
  const padding = 80;
  const contentWidth = options.pageWidth - padding * 2;

  const strategies: Record<PageLayoutType, LayoutStrategy> = {
    cover: {
      startY: options.pageHeight / 3, // 중앙 시작
      contentX: padding,
      contentWidth,
      spacing: 40,
    },
    audience: {
      startY: 120,
      contentX: padding,
      contentWidth: contentWidth / 2 - 20, // 2열 레이아웃
      spacing: 30,
    },
    overview: {
      startY: 100,
      contentX: padding,
      contentWidth,
      spacing: 35,
    },
    channels: {
      startY: 100,
      contentX: padding,
      contentWidth,
      spacing: 30,
    },
    cta: {
      startY: options.pageHeight / 4,
      contentX: padding,
      contentWidth,
      spacing: 40,
    },
  };

  return strategies[layout];
}

// ============================================================================
// Block to Element Conversion
// ============================================================================

async function convertBlockToElement(
  block: Block,
  y: number,
  maxWidth: number,
  x: number,
  options: Required<ConversionOptions>
): Promise<any | null> {
  switch (block.type) {
    case 'title':
      return createTitleElement(block, y, maxWidth, x, options);
    case 'subtitle':
      return createSubtitleElement(block, y, maxWidth, x, options);
    case 'paragraph':
      return createParagraphElement(block, y, maxWidth, x, options);
    case 'list':
      return createListElement(block, y, maxWidth, x, options);
    case 'image_placeholder':
      return createImagePlaceholderElement(block, y, maxWidth, x, options);
    case 'video_placeholder':
      return createVideoPlaceholderElement(block, y, maxWidth, x, options);
    case 'cta_button':
      return createCTAButtonElement(block, y, maxWidth, x, options);
    default:
      return null;
  }
}

// ============================================================================
// Element Creators
// ============================================================================

function createTitleElement(
  block: Block,
  y: number,
  maxWidth: number,
  x: number,
  options: Required<ConversionOptions>
): any {
  const content = block.content as { text: string };
  return {
    type: 'text',
    x,
    y,
    width: maxWidth,
    height: 120,
    text: content.text,
    fontSize: 64,
    fontFamily: options.fontFamily,
    fontWeight: 'bold',
    fill: options.colorTheme.text,
    align: 'center',
  };
}

function createSubtitleElement(
  block: Block,
  y: number,
  maxWidth: number,
  x: number,
  options: Required<ConversionOptions>
): any {
  const content = block.content as { text: string };
  return {
    type: 'text',
    x,
    y,
    width: maxWidth,
    height: 80,
    text: content.text,
    fontSize: 36,
    fontFamily: options.fontFamily,
    fontWeight: '600',
    fill: options.colorTheme.text,
    align: 'left',
  };
}

function createParagraphElement(
  block: Block,
  y: number,
  maxWidth: number,
  x: number,
  options: Required<ConversionOptions>
): any {
  const content = block.content as { text: string };
  const estimatedHeight = Math.max(100, Math.ceil(content.text.length / 60) * 40);

  return {
    type: 'text',
    x,
    y,
    width: maxWidth,
    height: estimatedHeight,
    text: content.text,
    fontSize: 20,
    fontFamily: options.fontFamily,
    fill: options.colorTheme.text,
    align: 'left',
    lineHeight: 1.6,
  };
}

function createListElement(
  block: Block,
  y: number,
  maxWidth: number,
  x: number,
  options: Required<ConversionOptions>
): any {
  const content = block.content as { items: string[] };
  const listText = content.items.map((item) => `• ${item}`).join('\n');
  const estimatedHeight = content.items.length * 45;

  return {
    type: 'text',
    x,
    y,
    width: maxWidth,
    height: estimatedHeight,
    text: listText,
    fontSize: 22,
    fontFamily: options.fontFamily,
    fill: options.colorTheme.text,
    align: 'left',
    lineHeight: 1.8,
  };
}

function createImagePlaceholderElement(
  block: Block,
  y: number,
  maxWidth: number,
  x: number,
  options: Required<ConversionOptions>
): any {
  const content = block.content as { description: string; url?: string };

  if (content.url) {
    // 실제 이미지가 있는 경우
    return {
      type: 'image',
      x,
      y,
      width: maxWidth,
      height: (maxWidth * 9) / 16, // 16:9 비율
      src: content.url,
    };
  }

  // 플레이스홀더
  return {
    type: 'svg',
    x,
    y,
    width: maxWidth,
    height: (maxWidth * 9) / 16,
    src: createImagePlaceholderSVG(maxWidth, (maxWidth * 9) / 16, content.description),
  };
}

function createVideoPlaceholderElement(
  block: Block,
  y: number,
  maxWidth: number,
  x: number,
  options: Required<ConversionOptions>
): any {
  const content = block.content as { description: string; url?: string };

  // 비디오 플레이스홀더 (Polotno는 비디오 직접 지원 안 함)
  return {
    type: 'svg',
    x,
    y,
    width: maxWidth,
    height: (maxWidth * 9) / 16,
    src: createVideoPlaceholderSVG(maxWidth, (maxWidth * 9) / 16, content.description),
  };
}

function createCTAButtonElement(
  block: Block,
  y: number,
  maxWidth: number,
  x: number,
  options: Required<ConversionOptions>
): any {
  const content = block.content as { text: string };
  const buttonWidth = 400;
  const buttonHeight = 80;
  const centerX = x + (maxWidth - buttonWidth) / 2;

  // SVG 버튼 생성
  const buttonSVG = `
    <svg width="${buttonWidth}" height="${buttonHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="4" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect width="100%" height="100%" rx="12" fill="${options.colorTheme.primary}" filter="url(#shadow)" />
    </svg>
  `;

  return [
    // 버튼 배경
    {
      type: 'svg',
      x: centerX,
      y,
      width: buttonWidth,
      height: buttonHeight,
      src: `data:image/svg+xml;base64,${btoa(buttonSVG)}`,
    },
    // 버튼 텍스트
    {
      type: 'text',
      x: centerX,
      y: y + (buttonHeight - 40) / 2,
      width: buttonWidth,
      height: 40,
      text: content.text,
      fontSize: 24,
      fontFamily: options.fontFamily,
      fontWeight: 'bold',
      fill: '#FFFFFF',
      align: 'center',
    },
  ].flat();
}

// ============================================================================
// SVG Placeholder Generators
// ============================================================================

function createImagePlaceholderSVG(width: number, height: number, description: string): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#E5E7EB"/>
      <path d="M${width / 2 - 30},${height / 2 - 20} L${width / 2 - 30},${height / 2 + 20} L${width / 2 + 30},${height / 2 + 20} L${width / 2 + 30},${height / 2 - 20} Z" fill="#9CA3AF"/>
      <circle cx="${width / 2 - 15}" cy="${height / 2 - 5}" r="5" fill="#6B7280"/>
      <text x="${width / 2}" y="${height / 2 + 50}" font-family="sans-serif" font-size="16" fill="#6B7280" text-anchor="middle">${description}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function createVideoPlaceholderSVG(width: number, height: number, description: string): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1F2937"/>
      <polygon points="${width / 2 - 20},${height / 2 - 30} ${width / 2 - 20},${height / 2 + 30} ${width / 2 + 30},${height / 2}" fill="#FFFFFF"/>
      <text x="${width / 2}" y="${height / 2 + 60}" font-family="sans-serif" font-size="16" fill="#FFFFFF" text-anchor="middle">${description}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
