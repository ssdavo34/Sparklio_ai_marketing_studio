/**
 * Ad Layout Templates
 *
 * Professional layout templates for AI-generated ads
 * - Responsive positioning based on canvas size
 * - Visual hierarchy and design principles
 * - Multiple layout styles (Hero, Split, Minimal, etc.)
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 */

export type AdLayoutType = 'hero' | 'split' | 'minimal' | 'classic' | 'modern';

export interface LayoutConfig {
  canvasWidth: number;
  canvasHeight: number;
  layoutType: AdLayoutType;
}

export interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AdLayoutTemplate {
  background: {
    hasGradient: boolean;
    hasShapes: boolean;
  };
  image?: ElementPosition;
  headline: ElementPosition & {
    fontSize: number;
    fontWeight: string;
    align: 'left' | 'center' | 'right';
  };
  subheadline: ElementPosition & {
    fontSize: number;
    align: 'left' | 'center' | 'right';
  };
  body?: ElementPosition & {
    fontSize: number;
    align: 'left' | 'center' | 'right';
  };
  bullets?: ElementPosition & {
    fontSize: number;
    align: 'left' | 'center' | 'right';
  };
  cta: ElementPosition & {
    fontSize: number;
    buttonStyle: 'rounded' | 'square' | 'pill';
  };
  decorativeShapes: Array<{
    type: 'circle' | 'square' | 'line';
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    opacity: number;
  }>;
}

/**
 * Hero Layout - 이미지 상단, 텍스트 하단 중앙 정렬
 */
function createHeroLayout(config: LayoutConfig): AdLayoutTemplate {
  const { canvasWidth, canvasHeight } = config;
  const padding = canvasWidth * 0.08; // 8% padding
  const contentWidth = canvasWidth - padding * 2;

  return {
    background: {
      hasGradient: true,
      hasShapes: true,
    },
    image: {
      x: padding,
      y: padding,
      width: contentWidth,
      height: canvasHeight * 0.45,
    },
    headline: {
      x: padding,
      y: canvasHeight * 0.52,
      width: contentWidth,
      height: canvasHeight * 0.12,
      fontSize: Math.min(canvasWidth * 0.06, 64),
      fontWeight: 'bold',
      align: 'center',
    },
    subheadline: {
      x: padding,
      y: canvasHeight * 0.66,
      width: contentWidth,
      height: canvasHeight * 0.08,
      fontSize: Math.min(canvasWidth * 0.03, 32),
      align: 'center',
    },
    cta: {
      x: canvasWidth * 0.25,
      y: canvasHeight * 0.82,
      width: canvasWidth * 0.5,
      height: canvasHeight * 0.08,
      fontSize: Math.min(canvasWidth * 0.035, 36),
      buttonStyle: 'pill',
    },
    decorativeShapes: [
      {
        type: 'circle',
        x: -padding,
        y: canvasHeight * 0.7,
        width: padding * 3,
        height: padding * 3,
        color: '#FFFFFF',
        opacity: 0.1,
      },
      {
        type: 'circle',
        x: canvasWidth - padding * 2,
        y: canvasHeight * 0.3,
        width: padding * 2,
        height: padding * 2,
        color: '#FFFFFF',
        opacity: 0.15,
      },
    ],
  };
}

/**
 * Split Layout - 좌측 텍스트, 우측 이미지 (또는 반대)
 */
function createSplitLayout(config: LayoutConfig): AdLayoutTemplate {
  const { canvasWidth, canvasHeight } = config;
  const padding = canvasWidth * 0.06;
  const halfWidth = (canvasWidth - padding * 3) / 2;

  return {
    background: {
      hasGradient: true,
      hasShapes: false,
    },
    image: {
      x: canvasWidth * 0.52,
      y: padding * 2,
      width: halfWidth,
      height: canvasHeight * 0.6,
    },
    headline: {
      x: padding,
      y: canvasHeight * 0.2,
      width: halfWidth,
      height: canvasHeight * 0.15,
      fontSize: Math.min(canvasWidth * 0.05, 54),
      fontWeight: 'bold',
      align: 'left',
    },
    subheadline: {
      x: padding,
      y: canvasHeight * 0.38,
      width: halfWidth,
      height: canvasHeight * 0.12,
      fontSize: Math.min(canvasWidth * 0.025, 28),
      align: 'left',
    },
    body: {
      x: padding,
      y: canvasHeight * 0.52,
      width: halfWidth,
      height: canvasHeight * 0.2,
      fontSize: Math.min(canvasWidth * 0.02, 20),
      align: 'left',
    },
    cta: {
      x: padding,
      y: canvasHeight * 0.78,
      width: halfWidth * 0.7,
      height: canvasHeight * 0.08,
      fontSize: Math.min(canvasWidth * 0.03, 32),
      buttonStyle: 'rounded',
    },
    decorativeShapes: [
      {
        type: 'line',
        x: padding,
        y: canvasHeight * 0.35,
        width: halfWidth * 0.3,
        height: 4,
        color: '#FFFFFF',
        opacity: 0.8,
      },
    ],
  };
}

/**
 * Minimal Layout - 깔끔하고 미니멀한 레이아웃
 */
function createMinimalLayout(config: LayoutConfig): AdLayoutTemplate {
  const { canvasWidth, canvasHeight } = config;
  const padding = canvasWidth * 0.1; // 10% padding for breathing room
  const contentWidth = canvasWidth - padding * 2;

  return {
    background: {
      hasGradient: false, // Solid color
      hasShapes: false,
    },
    headline: {
      x: padding,
      y: canvasHeight * 0.35,
      width: contentWidth,
      height: canvasHeight * 0.18,
      fontSize: Math.min(canvasWidth * 0.07, 72),
      fontWeight: 'bold',
      align: 'center',
    },
    subheadline: {
      x: padding,
      y: canvasHeight * 0.55,
      width: contentWidth,
      height: canvasHeight * 0.1,
      fontSize: Math.min(canvasWidth * 0.03, 30),
      align: 'center',
    },
    cta: {
      x: canvasWidth * 0.3,
      y: canvasHeight * 0.72,
      width: canvasWidth * 0.4,
      height: canvasHeight * 0.07,
      fontSize: Math.min(canvasWidth * 0.03, 28),
      buttonStyle: 'square',
    },
    decorativeShapes: [],
  };
}

/**
 * Classic Layout - 전통적인 광고 레이아웃 (상단 헤드라인, 중앙 이미지, 하단 CTA)
 */
function createClassicLayout(config: LayoutConfig): AdLayoutTemplate {
  const { canvasWidth, canvasHeight } = config;
  const padding = canvasWidth * 0.07;
  const contentWidth = canvasWidth - padding * 2;

  return {
    background: {
      hasGradient: true,
      hasShapes: true,
    },
    headline: {
      x: padding,
      y: canvasHeight * 0.08,
      width: contentWidth,
      height: canvasHeight * 0.12,
      fontSize: Math.min(canvasWidth * 0.055, 58),
      fontWeight: 'bold',
      align: 'center',
    },
    subheadline: {
      x: padding,
      y: canvasHeight * 0.22,
      width: contentWidth,
      height: canvasHeight * 0.08,
      fontSize: Math.min(canvasWidth * 0.028, 30),
      align: 'center',
    },
    image: {
      x: padding * 1.5,
      y: canvasHeight * 0.32,
      width: contentWidth - padding,
      height: canvasHeight * 0.35,
    },
    body: {
      x: padding,
      y: canvasHeight * 0.69,
      width: contentWidth,
      height: canvasHeight * 0.1,
      fontSize: Math.min(canvasWidth * 0.022, 24),
      align: 'center',
    },
    cta: {
      x: canvasWidth * 0.25,
      y: canvasHeight * 0.84,
      width: canvasWidth * 0.5,
      height: canvasHeight * 0.08,
      fontSize: Math.min(canvasWidth * 0.032, 34),
      buttonStyle: 'pill',
    },
    decorativeShapes: [
      {
        type: 'square',
        x: padding * 0.3,
        y: canvasHeight * 0.05,
        width: padding * 0.8,
        height: padding * 0.8,
        color: '#FFFFFF',
        opacity: 0.2,
      },
      {
        type: 'square',
        x: canvasWidth - padding * 1.3,
        y: canvasHeight * 0.75,
        width: padding * 1.2,
        height: padding * 1.2,
        color: '#FFFFFF',
        opacity: 0.15,
      },
    ],
  };
}

/**
 * Modern Layout - 현대적이고 대담한 레이아웃
 */
function createModernLayout(config: LayoutConfig): AdLayoutTemplate {
  const { canvasWidth, canvasHeight } = config;
  const padding = canvasWidth * 0.08;
  const contentWidth = canvasWidth - padding * 2;

  return {
    background: {
      hasGradient: true,
      hasShapes: true,
    },
    image: {
      x: canvasWidth * 0.5,
      y: 0,
      width: canvasWidth * 0.5,
      height: canvasHeight,
    },
    headline: {
      x: padding,
      y: canvasHeight * 0.25,
      width: canvasWidth * 0.4,
      height: canvasHeight * 0.2,
      fontSize: Math.min(canvasWidth * 0.065, 68),
      fontWeight: 'bold',
      align: 'left',
    },
    subheadline: {
      x: padding,
      y: canvasHeight * 0.48,
      width: canvasWidth * 0.38,
      height: canvasHeight * 0.12,
      fontSize: Math.min(canvasWidth * 0.026, 28),
      align: 'left',
    },
    bullets: {
      x: padding,
      y: canvasHeight * 0.62,
      width: canvasWidth * 0.38,
      height: canvasHeight * 0.15,
      fontSize: Math.min(canvasWidth * 0.02, 20),
      align: 'left',
    },
    cta: {
      x: padding,
      y: canvasHeight * 0.82,
      width: canvasWidth * 0.32,
      height: canvasHeight * 0.08,
      fontSize: Math.min(canvasWidth * 0.03, 30),
      buttonStyle: 'rounded',
    },
    decorativeShapes: [
      {
        type: 'circle',
        x: canvasWidth * 0.35,
        y: -padding,
        width: padding * 2.5,
        height: padding * 2.5,
        color: '#FFFFFF',
        opacity: 0.12,
      },
      {
        type: 'line',
        x: padding,
        y: canvasHeight * 0.6,
        width: canvasWidth * 0.25,
        height: 3,
        color: '#FFFFFF',
        opacity: 0.6,
      },
    ],
  };
}

/**
 * Get layout template based on type
 */
export function getAdLayout(config: LayoutConfig): AdLayoutTemplate {
  switch (config.layoutType) {
    case 'hero':
      return createHeroLayout(config);
    case 'split':
      return createSplitLayout(config);
    case 'minimal':
      return createMinimalLayout(config);
    case 'classic':
      return createClassicLayout(config);
    case 'modern':
      return createModernLayout(config);
    default:
      return createHeroLayout(config);
  }
}

/**
 * Auto-select best layout based on content type
 */
export function selectBestLayout(content: {
  hasImage?: boolean;
  hasBullets?: boolean;
  textLength?: number;
}): AdLayoutType {
  // Long text with bullets → Modern layout
  if (content.hasBullets && content.textLength && content.textLength > 100) {
    return 'modern';
  }

  // Has image + moderate text → Split layout
  if (content.hasImage && content.textLength && content.textLength > 50) {
    return 'split';
  }

  // Has image + short text → Hero layout
  if (content.hasImage) {
    return 'hero';
  }

  // Short text only → Minimal layout
  if (content.textLength && content.textLength < 50) {
    return 'minimal';
  }

  // Default → Classic layout
  return 'classic';
}
