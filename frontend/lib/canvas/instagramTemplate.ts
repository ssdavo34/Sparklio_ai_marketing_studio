/**
 * Instagram Ads Canvas Template
 *
 * Instagram 광고 데이터를 Polotno Canvas로 변환
 * - Single Image / Carousel 광고 지원
 * - Feed (1:1) / Story (9:16) 포맷 지원
 * - CTA, 해시태그 자동 적용
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 */

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
    elements.push({
      type: 'image',
      x: 0,
      y: 0,
      width: pageWidth,
      height: imageHeight,
      src: ad.creative.image_url,
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
