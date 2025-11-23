/**
 * Content Plan Types
 *
 * ContentPlanOutputV1 → ContentPlanPagesSchema 타입 정의
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 * @reference docs/CONTENT_PLAN_TO_PAGES_SPEC_V2.md
 */

// ============================================================================
// Page Layout Types
// ============================================================================

export type PageLayoutType =
  | 'cover'       // 타이틀 + 목표
  | 'audience'    // 타겟/페르소나
  | 'overview'    // 콘텐츠 소개
  | 'channels'    // 채널별 전략
  | 'cta';        // 행동 유도

// ============================================================================
// Block Types
// ============================================================================

export type BlockType =
  | 'title'               // 제목
  | 'subtitle'            // 소제목
  | 'paragraph'           // 본문 텍스트
  | 'list'                // 불릿/리스트
  | 'image_placeholder'   // 이미지 플레이스홀더
  | 'video_placeholder'   // 비디오 플레이스홀더
  | 'cta_button';         // CTA 버튼

export type BlockContent =
  | { text: string }                         // title, subtitle, paragraph, cta_button
  | { items: string[] }                      // list
  | { description: string; url?: string };   // image_placeholder, video_placeholder

// ============================================================================
// Main Schema
// ============================================================================

export interface Block {
  block_id: string;
  type: BlockType;
  content: BlockContent;
}

export interface Page {
  page_id: string;
  layout: PageLayoutType;
  blocks: Block[];
}

export interface ContentPlanPagesSchema {
  type: 'content_plan_pages';
  campaign_info: {
    title: string;
    campaign_type?: string;
  };
  pages: Page[];
}

// ============================================================================
// Helper Type Guards
// ============================================================================

export function isTextContent(content: BlockContent): content is { text: string } {
  return 'text' in content && typeof content.text === 'string';
}

export function isListContent(content: BlockContent): content is { items: string[] } {
  return 'items' in content && Array.isArray(content.items);
}

export function isMediaContent(
  content: BlockContent
): content is { description: string; url?: string } {
  return 'description' in content;
}

// ============================================================================
// Layout Configuration
// ============================================================================

export interface LayoutConfig {
  title: string;
  description: string;
  icon: string;
  allowedBlocks: BlockType[];
}

export const LAYOUT_CONFIGS: Record<PageLayoutType, LayoutConfig> = {
  cover: {
    title: '커버',
    description: '캠페인 타이틀과 주요 목표',
    icon: '📄',
    allowedBlocks: ['title', 'subtitle', 'list'],
  },
  audience: {
    title: '타겟 오디언스',
    description: '타겟 그룹과 페르소나',
    icon: '👥',
    allowedBlocks: ['subtitle', 'paragraph', 'list', 'image_placeholder'],
  },
  overview: {
    title: '콘텐츠 개요',
    description: '콘텐츠 요소 소개',
    icon: '📊',
    allowedBlocks: ['subtitle', 'paragraph', 'image_placeholder', 'video_placeholder'],
  },
  channels: {
    title: '채널 전략',
    description: '채널별 접근 방법',
    icon: '📱',
    allowedBlocks: ['subtitle', 'list'],
  },
  cta: {
    title: '행동 유도',
    description: '다음 단계 안내',
    icon: '🎯',
    allowedBlocks: ['subtitle', 'paragraph', 'cta_button', 'list'],
  },
};

// ============================================================================
// Block Configuration
// ============================================================================

export interface BlockConfig {
  label: string;
  icon: string;
  description: string;
}

export const BLOCK_CONFIGS: Record<BlockType, BlockConfig> = {
  title: {
    label: '제목',
    icon: '📝',
    description: '페이지 메인 타이틀',
  },
  subtitle: {
    label: '소제목',
    icon: '📄',
    description: '섹션 헤더',
  },
  paragraph: {
    label: '본문',
    icon: '📃',
    description: '상세 설명 텍스트',
  },
  list: {
    label: '리스트',
    icon: '📋',
    description: '불릿 포인트 목록',
  },
  image_placeholder: {
    label: '이미지',
    icon: '🖼️',
    description: '이미지 플레이스홀더',
  },
  video_placeholder: {
    label: '비디오',
    icon: '🎬',
    description: '비디오 플레이스홀더',
  },
  cta_button: {
    label: 'CTA 버튼',
    icon: '🎯',
    description: '행동 유도 버튼',
  },
};
