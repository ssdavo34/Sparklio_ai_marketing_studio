/**
 * Canvas Templates for Various SNS Platforms
 *
 * 다양한 SNS 플랫폼의 캔버스 크기 템플릿
 * - Instagram, Facebook, Twitter, LinkedIn 등 지원
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 */

// ============================================================================
// Template Types
// ============================================================================

export type PlatformType =
  | 'instagram-post'
  | 'instagram-story'
  | 'facebook-post'
  | 'twitter-post'
  | 'linkedin-post'
  | 'youtube-thumbnail'
  | 'custom';

export interface CanvasTemplate {
  /** 템플릿 ID */
  id: PlatformType;

  /** 템플릿 이름 (한글) */
  name: string;

  /** 템플릿 설명 */
  description: string;

  /** 캔버스 너비 (px) */
  width: number;

  /** 캔버스 높이 (px) */
  height: number;

  /** 종횡비 (예: "1:1", "9:16") */
  aspectRatio: string;

  /** 플랫폼 아이콘 (emoji) */
  icon: string;

  /** 추천 여부 */
  recommended?: boolean;
}

// ============================================================================
// Template Definitions
// ============================================================================

export const CANVAS_TEMPLATES: Record<PlatformType, CanvasTemplate> = {
  'instagram-post': {
    id: 'instagram-post',
    name: 'Instagram 포스트',
    description: '인스타그램 피드용 정사각형 이미지',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    icon: '📷',
    recommended: true,
  },
  'instagram-story': {
    id: 'instagram-story',
    name: 'Instagram 스토리',
    description: '인스타그램 스토리용 세로형 이미지',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    icon: '📱',
    recommended: true,
  },
  'facebook-post': {
    id: 'facebook-post',
    name: 'Facebook 포스트',
    description: '페이스북 피드용 가로형 이미지',
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1',
    icon: '👥',
  },
  'twitter-post': {
    id: 'twitter-post',
    name: 'Twitter 포스트',
    description: '트위터 피드용 가로형 이미지',
    width: 1200,
    height: 675,
    aspectRatio: '16:9',
    icon: '🐦',
  },
  'linkedin-post': {
    id: 'linkedin-post',
    name: 'LinkedIn 포스트',
    description: '링크드인 피드용 가로형 이미지',
    width: 1200,
    height: 627,
    aspectRatio: '1.91:1',
    icon: '💼',
  },
  'youtube-thumbnail': {
    id: 'youtube-thumbnail',
    name: 'YouTube 썸네일',
    description: '유튜브 동영상 썸네일',
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    icon: '🎥',
  },
  'custom': {
    id: 'custom',
    name: '사용자 정의',
    description: '직접 크기를 지정합니다',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    icon: '⚙️',
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 템플릿 목록 가져오기 (추천 템플릿 우선)
 */
export function getTemplateList(): CanvasTemplate[] {
  const templates = Object.values(CANVAS_TEMPLATES);

  // 추천 템플릿을 먼저, 나머지는 이름 순으로 정렬
  return templates.sort((a, b) => {
    if (a.recommended && !b.recommended) return -1;
    if (!a.recommended && b.recommended) return 1;
    return a.name.localeCompare(b.name, 'ko');
  });
}

/**
 * 템플릿 ID로 템플릿 가져오기
 */
export function getTemplateById(id: PlatformType): CanvasTemplate {
  return CANVAS_TEMPLATES[id];
}

/**
 * 기본 템플릿 가져오기 (Instagram Post)
 */
export function getDefaultTemplate(): CanvasTemplate {
  return CANVAS_TEMPLATES['instagram-post'];
}

/**
 * 커스텀 템플릿 생성
 */
export function createCustomTemplate(width: number, height: number): CanvasTemplate {
  // 종횡비 계산 (간단하게)
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const aspectRatio = `${width / divisor}:${height / divisor}`;

  return {
    id: 'custom',
    name: '사용자 정의',
    description: `${width}x${height}px`,
    width,
    height,
    aspectRatio,
    icon: '⚙️',
  };
}
