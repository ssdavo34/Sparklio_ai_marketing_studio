/**
 * Text Presets
 *
 * 에디터에서 사용할 수 있는 텍스트 프리셋 정의
 *
 * @author C Team (Frontend Team)
 * @version 1.0
 */

import type { TextPreset } from './types';

// ============================================================================
// Heading Presets
// ============================================================================

export const HEADING_PRESETS: TextPreset[] = [
  {
    id: 'heading-xl',
    name: 'Heading XL',
    text: 'Add a heading',
    fontSize: 72,
    fontWeight: 'bold',
    fontFamily: 'Pretendard',
    fill: '#111827',
  },
  {
    id: 'heading-lg',
    name: 'Heading Large',
    text: 'Add a heading',
    fontSize: 56,
    fontWeight: 'bold',
    fontFamily: 'Pretendard',
    fill: '#111827',
  },
  {
    id: 'heading-md',
    name: 'Heading Medium',
    text: 'Add a heading',
    fontSize: 40,
    fontWeight: 'bold',
    fontFamily: 'Pretendard',
    fill: '#1F2937',
  },
  {
    id: 'heading-sm',
    name: 'Heading Small',
    text: 'Add a heading',
    fontSize: 32,
    fontWeight: '600',
    fontFamily: 'Pretendard',
    fill: '#1F2937',
  },
];

// ============================================================================
// Subheading Presets
// ============================================================================

export const SUBHEADING_PRESETS: TextPreset[] = [
  {
    id: 'subheading-lg',
    name: 'Subheading Large',
    text: 'Add a subheading',
    fontSize: 28,
    fontWeight: '500',
    fontFamily: 'Pretendard',
    fill: '#374151',
  },
  {
    id: 'subheading-md',
    name: 'Subheading',
    text: 'Add a subheading',
    fontSize: 24,
    fontWeight: '500',
    fontFamily: 'Pretendard',
    fill: '#374151',
  },
  {
    id: 'subheading-sm',
    name: 'Subheading Small',
    text: 'Add a subheading',
    fontSize: 20,
    fontWeight: '500',
    fontFamily: 'Pretendard',
    fill: '#4B5563',
  },
];

// ============================================================================
// Body Text Presets
// ============================================================================

export const BODY_PRESETS: TextPreset[] = [
  {
    id: 'body-lg',
    name: 'Body Large',
    text: 'Add body text',
    fontSize: 18,
    fontWeight: 'normal',
    fontFamily: 'Pretendard',
    fill: '#4B5563',
  },
  {
    id: 'body-md',
    name: 'Body',
    text: 'Add body text',
    fontSize: 16,
    fontWeight: 'normal',
    fontFamily: 'Pretendard',
    fill: '#4B5563',
  },
  {
    id: 'body-sm',
    name: 'Body Small',
    text: 'Add body text',
    fontSize: 14,
    fontWeight: 'normal',
    fontFamily: 'Pretendard',
    fill: '#6B7280',
  },
];

// ============================================================================
// Caption & Label Presets
// ============================================================================

export const CAPTION_PRESETS: TextPreset[] = [
  {
    id: 'caption',
    name: 'Caption',
    text: 'Add a caption',
    fontSize: 12,
    fontWeight: 'normal',
    fontFamily: 'Pretendard',
    fill: '#9CA3AF',
  },
  {
    id: 'label',
    name: 'Label',
    text: 'LABEL',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Pretendard',
    fill: '#6B7280',
  },
  {
    id: 'overline',
    name: 'Overline',
    text: 'OVERLINE',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Pretendard',
    fill: '#9CA3AF',
  },
];

// ============================================================================
// Special Text Presets
// ============================================================================

export const SPECIAL_PRESETS: TextPreset[] = [
  {
    id: 'quote',
    name: 'Quote',
    text: '"Add a quote"',
    fontSize: 24,
    fontWeight: 'normal',
    fontFamily: 'Georgia',
    fill: '#374151',
  },
  {
    id: 'highlight',
    name: 'Highlight Text',
    text: 'Highlighted',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Pretendard',
    fill: '#7C3AED',
  },
  {
    id: 'cta',
    name: 'CTA Text',
    text: 'Click Here',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Pretendard',
    fill: '#2563EB',
  },
];

// ============================================================================
// All Presets Combined
// ============================================================================

export const ALL_TEXT_PRESETS = [
  ...HEADING_PRESETS,
  ...SUBHEADING_PRESETS,
  ...BODY_PRESETS,
  ...CAPTION_PRESETS,
  ...SPECIAL_PRESETS,
];

// ============================================================================
// Preset Groups for UI
// ============================================================================

export const TEXT_PRESET_GROUPS = [
  {
    id: 'headings',
    name: '제목',
    presets: HEADING_PRESETS,
  },
  {
    id: 'subheadings',
    name: '부제목',
    presets: SUBHEADING_PRESETS,
  },
  {
    id: 'body',
    name: '본문',
    presets: BODY_PRESETS,
  },
  {
    id: 'captions',
    name: '캡션/라벨',
    presets: CAPTION_PRESETS,
  },
  {
    id: 'special',
    name: '특수',
    presets: SPECIAL_PRESETS,
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Preset ID로 찾기
 */
export function getTextPresetById(presetId: string): TextPreset | undefined {
  return ALL_TEXT_PRESETS.find((preset) => preset.id === presetId);
}

/**
 * 기본 텍스트 프리셋
 */
export function getDefaultTextPreset(): TextPreset {
  return {
    id: 'default',
    name: 'Text',
    text: 'Text',
    fontSize: 24,
    fontWeight: 'normal',
    fontFamily: 'Pretendard',
    fill: '#000000',
  };
}
