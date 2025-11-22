/**
 * Color Themes for Canvas
 *
 * 캔버스 배경 색상 테마 정의
 * - 다양한 그라디언트 및 단색 테마 지원
 * - 브랜드 컬러와 조화롭게 디자인
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 */

// ============================================================================
// Theme Types
// ============================================================================

export type ThemeType =
  | 'purple-gradient'
  | 'blue-gradient'
  | 'pink-gradient'
  | 'orange-gradient'
  | 'green-gradient'
  | 'dark-gradient'
  | 'white'
  | 'black'
  | 'custom';

export type GradientDirection = 'diagonal' | 'vertical' | 'horizontal' | 'radial';

export interface ColorTheme {
  /** 테마 ID */
  id: ThemeType;

  /** 테마 이름 (한글) */
  name: string;

  /** 테마 설명 */
  description: string;

  /** 테마 타입 */
  type: 'gradient' | 'solid';

  /** 그라디언트 시작 색상 (gradient일 때) */
  startColor?: string;

  /** 그라디언트 끝 색상 (gradient일 때) */
  endColor?: string;

  /** 단색 배경 색상 (solid일 때) */
  solidColor?: string;

  /** 그라디언트 방향 */
  direction?: GradientDirection;

  /** 추천 텍스트 색상 */
  textColor: string;

  /** 미리보기 색상 (UI에 표시) */
  previewColors: string[];

  /** 추천 여부 */
  recommended?: boolean;
}

// ============================================================================
// Theme Definitions
// ============================================================================

export const COLOR_THEMES: Record<ThemeType, ColorTheme> = {
  'purple-gradient': {
    id: 'purple-gradient',
    name: '보라색 그라디언트',
    description: '기본 브랜드 컬러',
    type: 'gradient',
    startColor: '#8B5CF6',
    endColor: '#6366F1',
    direction: 'diagonal',
    textColor: '#FFFFFF',
    previewColors: ['#8B5CF6', '#6366F1'],
    recommended: true,
  },
  'blue-gradient': {
    id: 'blue-gradient',
    name: '파란색 그라디언트',
    description: '시원한 느낌의 블루 톤',
    type: 'gradient',
    startColor: '#3B82F6',
    endColor: '#06B6D4',
    direction: 'diagonal',
    textColor: '#FFFFFF',
    previewColors: ['#3B82F6', '#06B6D4'],
  },
  'pink-gradient': {
    id: 'pink-gradient',
    name: '핑크색 그라디언트',
    description: '부드럽고 감성적인 핑크 톤',
    type: 'gradient',
    startColor: '#EC4899',
    endColor: '#F97316',
    direction: 'diagonal',
    textColor: '#FFFFFF',
    previewColors: ['#EC4899', '#F97316'],
  },
  'orange-gradient': {
    id: 'orange-gradient',
    name: '오렌지 그라디언트',
    description: '활기찬 오렌지 톤',
    type: 'gradient',
    startColor: '#F59E0B',
    endColor: '#EF4444',
    direction: 'diagonal',
    textColor: '#FFFFFF',
    previewColors: ['#F59E0B', '#EF4444'],
  },
  'green-gradient': {
    id: 'green-gradient',
    name: '그린 그라디언트',
    description: '자연스러운 그린 톤',
    type: 'gradient',
    startColor: '#10B981',
    endColor: '#14B8A6',
    direction: 'diagonal',
    textColor: '#FFFFFF',
    previewColors: ['#10B981', '#14B8A6'],
  },
  'dark-gradient': {
    id: 'dark-gradient',
    name: '다크 그라디언트',
    description: '고급스러운 다크 톤',
    type: 'gradient',
    startColor: '#1F2937',
    endColor: '#111827',
    direction: 'diagonal',
    textColor: '#FFFFFF',
    previewColors: ['#1F2937', '#111827'],
    recommended: true,
  },
  'white': {
    id: 'white',
    name: '화이트',
    description: '깔끔한 화이트 배경',
    type: 'solid',
    solidColor: '#FFFFFF',
    textColor: '#000000',
    previewColors: ['#FFFFFF'],
    recommended: true,
  },
  'black': {
    id: 'black',
    name: '블랙',
    description: '강렬한 블랙 배경',
    type: 'solid',
    solidColor: '#000000',
    textColor: '#FFFFFF',
    previewColors: ['#000000'],
  },
  'custom': {
    id: 'custom',
    name: '사용자 정의',
    description: '직접 색상을 선택합니다',
    type: 'solid',
    solidColor: '#FFFFFF',
    textColor: '#000000',
    previewColors: ['#FFFFFF'],
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 테마 목록 가져오기 (추천 테마 우선)
 */
export function getThemeList(): ColorTheme[] {
  const themes = Object.values(COLOR_THEMES);

  // 추천 테마를 먼저, 나머지는 이름 순으로 정렬
  return themes.sort((a, b) => {
    if (a.recommended && !b.recommended) return -1;
    if (!a.recommended && b.recommended) return 1;
    return a.name.localeCompare(b.name, 'ko');
  });
}

/**
 * 테마 ID로 테마 가져오기
 */
export function getThemeById(id: ThemeType): ColorTheme {
  return COLOR_THEMES[id];
}

/**
 * 기본 테마 가져오기 (Purple Gradient)
 */
export function getDefaultTheme(): ColorTheme {
  return COLOR_THEMES['purple-gradient'];
}

/**
 * SVG 그라디언트 생성
 */
export function generateGradientSVG(
  theme: ColorTheme,
  width: number,
  height: number
): string {
  if (theme.type === 'solid') {
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${theme.solidColor}"/>
      </svg>
    `;
  }

  // 그라디언트 방향 설정
  let gradientAttrs = '';
  switch (theme.direction) {
    case 'vertical':
      gradientAttrs = 'x1="0%" y1="0%" x2="0%" y2="100%"';
      break;
    case 'horizontal':
      gradientAttrs = 'x1="0%" y1="0%" x2="100%" y2="0%"';
      break;
    case 'diagonal':
    default:
      gradientAttrs = 'x1="0%" y1="0%" x2="100%" y2="100%"';
      break;
  }

  if (theme.direction === 'radial') {
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="grad1">
            <stop offset="0%" style="stop-color:${theme.startColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${theme.endColor};stop-opacity:1" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad1)"/>
      </svg>
    `;
  }

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" ${gradientAttrs}>
          <stop offset="0%" style="stop-color:${theme.startColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${theme.endColor};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad1)"/>
    </svg>
  `;
}

/**
 * 커스텀 테마 생성
 */
export function createCustomTheme(
  type: 'gradient' | 'solid',
  colors: { start?: string; end?: string; solid?: string }
): ColorTheme {
  if (type === 'solid' && colors.solid) {
    // 밝기 계산하여 텍스트 색상 자동 선택
    const rgb = parseInt(colors.solid.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const textColor = brightness > 128 ? '#000000' : '#FFFFFF';

    return {
      id: 'custom',
      name: '사용자 정의',
      description: '직접 선택한 색상',
      type: 'solid',
      solidColor: colors.solid,
      textColor,
      previewColors: [colors.solid],
    };
  }

  if (type === 'gradient' && colors.start && colors.end) {
    return {
      id: 'custom',
      name: '사용자 정의',
      description: '직접 선택한 그라디언트',
      type: 'gradient',
      startColor: colors.start,
      endColor: colors.end,
      direction: 'diagonal',
      textColor: '#FFFFFF',
      previewColors: [colors.start, colors.end],
    };
  }

  return getDefaultTheme();
}
