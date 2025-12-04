/**
 * Instagram Ads Canvas Template
 *
 * Instagram 광고 데이터를 Polotno Canvas로 변환
 * - Single Image / Carousel 광고 지원
 * - Feed (1:1) / Story (9:16) 포맷 지원
 * - CTA, 해시태그 자동 적용
 * - Layout API 연동 지원 (v1.2)
 *
 * @author C팀 (Frontend Team)
 * @version 1.2
 * @date 2025-12-04
 */

import { createPlaceholderMetadata, type ImageMetadata } from './image-metadata';
import { layoutApi, type DocumentLayout, type LayoutElement, type PageLayout } from '@/lib/api/layout-api';

// ============================================================================
// Types
// ============================================================================

export interface InstagramAd {
  ad_id: string;
  ad_type: 'single_image' | 'carousel';
  format: 'feed' | 'story';
  aspect_ratio: string;
  creative: {
    headline: string;
    primary_text: string;
    cta_text: string;
    image_url?: string;
    cards?: {
      card_number: number;
      title: string;
      description: string;
    }[];
  };
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
  feed: {
    width: 1080,
    height: 1080,
  },
  story: {
    width: 1080,
    height: 1920,
  },
  margin: 60,
  colors: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    text: '#1F2937',
    textLight: '#6B7280',
    background: '#FFFFFF',
    gradient: ['#A855F7', '#EC4899'],
  },
  fonts: {
    headline: 'Pretendard',
    body: 'Pretendard',
  },
};

// ============================================================================
// Instagram Ad Canvas Generator
// ============================================================================

/**
 * Instagram 광고를 Canvas 요소로 변환
 */
export function createInstagramAdElements(
  ad: InstagramAd,
  pageWidth: number,
  pageHeight: number
): CanvasElement[] {
  const elements: CanvasElement[] = [];
  const margin = TEMPLATE_CONFIG.margin;
  const contentWidth = pageWidth - margin * 2;

  // 배경 그라디언트
  elements.push({
    type: 'rect',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    fill: `linear-gradient(135deg, ${TEMPLATE_CONFIG.colors.gradient[0]}, ${TEMPLATE_CONFIG.colors.gradient[1]})`,
  });

  // 이미지 영역 (상단 60%)
  const imageHeight = pageHeight * 0.6;

  if (ad.creative.image_url) {
    // 실제 이미지가 있으면 표시
    // TODO: Nano Banana로 생성된 이미지면 메타데이터 포함
    elements.push({
      type: 'image',
      x: 0,
      y: 0,
      width: pageWidth,
      height: imageHeight,
      src: ad.creative.image_url,
      // 이미지 메타데이터 저장 (재생성/편집용)
      custom: createPlaceholderMetadata(
        ad.creative.headline || ad.creative.primary_text
      ),
    });
  } else {
    // 이미지가 없으면 플레이스홀더
    elements.push({
      type: 'rect',
      x: 0,
      y: 0,
      width: pageWidth,
      height: imageHeight,
      fill: `linear-gradient(135deg, ${TEMPLATE_CONFIG.colors.gradient[0]}CC, ${TEMPLATE_CONFIG.colors.gradient[1]}CC)`,
    });

    // 플레이스홀더 아이콘
    elements.push({
      type: 'text',
      x: pageWidth / 2,
      y: imageHeight / 2,
      fontSize: 120,
      text: ad.ad_type === 'carousel' ? '🎠' : '📷',
      align: 'center',
    });
  }

  // 포맷 배지 (좌상단)
  const formatLabel = ad.ad_type === 'carousel' ? '캐러셀' : ad.format === 'story' ? '스토리' : '피드';
  elements.push({
    type: 'rect',
    x: margin,
    y: margin,
    width: 120,
    height: 40,
    fill: 'rgba(0, 0, 0, 0.5)',
    cornerRadius: 8,
  });
  elements.push({
    type: 'text',
    x: margin + 60,
    y: margin + 20,
    fontSize: 18,
    fill: '#FFFFFF',
    text: formatLabel,
    align: 'center',
    fontWeight: 'bold',
  });

  // 캐러셀 카드 수 표시 (우상단)
  if (ad.ad_type === 'carousel' && ad.creative.cards) {
    elements.push({
      type: 'rect',
      x: pageWidth - margin - 80,
      y: margin,
      width: 80,
      height: 40,
      fill: 'rgba(0, 0, 0, 0.5)',
      cornerRadius: 8,
    });
    elements.push({
      type: 'text',
      x: pageWidth - margin - 40,
      y: margin + 20,
      fontSize: 18,
      fill: '#FFFFFF',
      text: `1/${ad.creative.cards.length}`,
      align: 'center',
      fontWeight: 'bold',
    });
  }

  // 텍스트 영역 (하단 40%)
  const textY = imageHeight + margin;

  // 헤드라인
  elements.push({
    type: 'text',
    x: margin,
    y: textY,
    width: contentWidth,
    fontSize: 48,
    fontWeight: 'bold',
    fill: TEMPLATE_CONFIG.colors.text,
    text: ad.creative.headline,
    fontFamily: TEMPLATE_CONFIG.fonts.headline,
  });

  // Primary Text
  elements.push({
    type: 'text',
    x: margin,
    y: textY + 80,
    width: contentWidth,
    fontSize: 32,
    fill: TEMPLATE_CONFIG.colors.textLight,
    text: ad.creative.primary_text,
    fontFamily: TEMPLATE_CONFIG.fonts.body,
  });

  // CTA 버튼
  const ctaY = pageHeight - margin - 80;
  const ctaWidth = 300;

  elements.push({
    type: 'rect',
    x: margin,
    y: ctaY,
    width: ctaWidth,
    height: 70,
    fill: TEMPLATE_CONFIG.colors.primary,
    cornerRadius: 12,
  });

  elements.push({
    type: 'text',
    x: margin + ctaWidth / 2,
    y: ctaY + 35,
    fontSize: 28,
    fontWeight: 'bold',
    fill: '#FFFFFF',
    text: ad.creative.cta_text,
    align: 'center',
  });

  // 캐러셀 카드 수 표시 (우하단)
  if (ad.ad_type === 'carousel' && ad.creative.cards) {
    elements.push({
      type: 'text',
      x: pageWidth - margin,
      y: ctaY + 35,
      fontSize: 24,
      fill: TEMPLATE_CONFIG.colors.textLight,
      text: `${ad.creative.cards.length}장`,
      align: 'right',
    });
  }

  return elements;
}

/**
 * 모든 Instagram 광고를 Canvas 페이지로 변환
 */
export function createInstagramAdsCanvas(ads: InstagramAd[]): CanvasElement[][] {
  return ads.map((ad) => {
    const config = ad.format === 'story' ? TEMPLATE_CONFIG.story : TEMPLATE_CONFIG.feed;
    return createInstagramAdElements(ad, config.width, config.height);
  });
}

/**
 * Instagram 광고를 Polotno Store에 추가
 */
export function addInstagramAdsToCanvas(polotnoStore: any, ads: InstagramAd[]): void {
  if (!polotnoStore) {
    throw new Error('Polotno store is not initialized');
  }

  const adElementsList = createInstagramAdsCanvas(ads);

  adElementsList.forEach((elements, index) => {
    const ad = ads[index];
    const config = ad.format === 'story' ? TEMPLATE_CONFIG.story : TEMPLATE_CONFIG.feed;

    // 새 페이지 추가
    polotnoStore.addPage({
      width: config.width,
      height: config.height,
    });

    const page = polotnoStore.pages[polotnoStore.pages.length - 1];

    if (!page) {
      throw new Error(`Failed to create page for ad ${ad.ad_id}`);
    }

    // 요소 추가
    elements.forEach((element) => {
      page.addElement(element);
    });
  });

  console.log(`[InstagramTemplate] Added ${ads.length} Instagram ads to canvas`);
}

// ============================================================================
// Layout API Integration
// ============================================================================

/**
 * Layout API를 사용하여 Instagram 광고를 생성하고 Canvas에 추가
 *
 * @param polotnoStore Polotno Store
 * @param adData 광고 데이터
 * @param platform 플랫폼 (instagram_feed, instagram_story 등)
 */
export async function addInstagramAdWithLayoutAPI(
  polotnoStore: any,
  adData: {
    headline: string;
    body_text?: string;
    cta_text?: string;
    brand_name?: string;
    product_name?: string;
    hashtags?: string[];
    image_url?: string;
  },
  platform: 'instagram_feed' | 'instagram_story' | 'instagram_reel' = 'instagram_feed'
): Promise<void> {
  if (!polotnoStore) {
    throw new Error('Polotno store is not initialized');
  }

  try {
    // Layout API 호출
    const response = await layoutApi.generateSNSLayout({
      platform,
      headline: adData.headline,
      body_text: adData.body_text,
      cta_text: adData.cta_text,
      brand_name: adData.brand_name,
      product_name: adData.product_name,
      hashtags: adData.hashtags,
      image_url: adData.image_url,
      options: {
        style: 'modern',
      },
    });

    const layout = response.layout;

    // 캔버스에 렌더링
    renderLayoutToCanvas(polotnoStore, layout);

    console.log(`[InstagramTemplate] Added ${layout.total_pages} pages via Layout API`);
  } catch (error) {
    console.error('[InstagramTemplate] Layout API failed:', error);
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
      // 버튼 배경
      page.addElement({
        type: 'rect',
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        fill: props.backgroundColor || '#3b82f6',
        cornerRadius: props.borderRadius || 8,
      });

      // 버튼 텍스트
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

    case 'badge':
      const variantColors: Record<string, string> = {
        primary: '#3b82f6',
        secondary: '#6b7280',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      };
      const badgeColor = variantColors[props.variant || 'primary'] || '#3b82f6';

      page.addElement({
        type: 'rect',
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        fill: badgeColor,
        cornerRadius: props.borderRadius || 12,
      });

      page.addElement({
        type: 'text',
        x: element.x,
        y: element.y + (element.height - (props.fontSize || 12)) / 2,
        width: element.width,
        text: element.content || '',
        fontSize: props.fontSize || 12,
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'center',
      });
      break;

    default:
      // 기본: 텍스트로 처리
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
