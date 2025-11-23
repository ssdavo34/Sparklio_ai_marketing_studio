/**
 * Page Renderer Component
 *
 * ContentPlanPages의 Page를 렌더링하는 메인 컴포넌트
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 * @reference docs/CONTENT_PLAN_TO_PAGES_SPEC_V2.md
 */

'use client';

import React from 'react';
import type { Page, PageLayoutType, LAYOUT_CONFIGS } from '../../types/content-plan';
import { BlockRenderer } from './BlockRenderer';

// ============================================================================
// Props
// ============================================================================

export interface PageRendererProps {
  page: Page;
  editable?: boolean;
  onChange?: (page: Page) => void;
}

// ============================================================================
// Main PageRenderer Component
// ============================================================================

export function PageRenderer({ page, editable = false, onChange }: PageRendererProps) {
  return (
    <div className={`page-renderer ${getLayoutClassName(page.layout)}`}>
      {/* Page Container */}
      <div className="w-full max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-sm">
        {/* Blocks */}
        <div className="space-y-4">
          {page.blocks.map((block) => (
            <BlockRenderer
              key={block.block_id}
              block={block}
              editable={editable}
              onChange={(updatedBlock) => {
                if (!onChange) return;
                const updatedBlocks = page.blocks.map((b) =>
                  b.block_id === block.block_id ? updatedBlock : b
                );
                onChange({ ...page, blocks: updatedBlocks });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Layout-specific Classes
// ============================================================================

function getLayoutClassName(layout: PageLayoutType): string {
  const classNames: Record<PageLayoutType, string> = {
    cover: 'layout-cover bg-gradient-to-br from-purple-50 to-indigo-50',
    audience: 'layout-audience bg-gradient-to-br from-blue-50 to-cyan-50',
    overview: 'layout-overview bg-gradient-to-br from-green-50 to-emerald-50',
    channels: 'layout-channels bg-gradient-to-br from-orange-50 to-amber-50',
    cta: 'layout-cta bg-gradient-to-br from-pink-50 to-rose-50',
  };
  return classNames[layout] || '';
}

// ============================================================================
// Layout Templates (for Future Customization)
// ============================================================================

/**
 * Cover Layout
 * - 타이틀 중앙 정렬
 * - 목표 리스트
 */
export function CoverLayout({ page, editable, onChange }: PageRendererProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600">
      <div className="text-center text-white max-w-3xl px-8">
        {page.blocks.map((block) => (
          <BlockRenderer
            key={block.block_id}
            block={block}
            editable={editable}
            onChange={(updatedBlock) => {
              if (!onChange) return;
              const updatedBlocks = page.blocks.map((b) =>
                b.block_id === block.block_id ? updatedBlock : b
              );
              onChange({ ...page, blocks: updatedBlocks });
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Audience Layout
 * - 좌측 텍스트, 우측 이미지
 */
export function AudienceLayout({ page, editable, onChange }: PageRendererProps) {
  const textBlocks = page.blocks.filter(
    (b) => b.type === 'subtitle' || b.type === 'paragraph' || b.type === 'list'
  );
  const imageBlocks = page.blocks.filter((b) => b.type === 'image_placeholder');

  return (
    <div className="grid grid-cols-2 gap-8 p-8">
      {/* Left: Text */}
      <div className="space-y-4">
        {textBlocks.map((block) => (
          <BlockRenderer
            key={block.block_id}
            block={block}
            editable={editable}
            onChange={(updatedBlock) => {
              if (!onChange) return;
              const updatedBlocks = page.blocks.map((b) =>
                b.block_id === block.block_id ? updatedBlock : b
              );
              onChange({ ...page, blocks: updatedBlocks });
            }}
          />
        ))}
      </div>

      {/* Right: Image */}
      <div>
        {imageBlocks.map((block) => (
          <BlockRenderer
            key={block.block_id}
            block={block}
            editable={editable}
            onChange={(updatedBlock) => {
              if (!onChange) return;
              const updatedBlocks = page.blocks.map((b) =>
                b.block_id === block.block_id ? updatedBlock : b
              );
              onChange({ ...page, blocks: updatedBlocks });
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Overview Layout
 * - 상단 텍스트, 하단 이미지/비디오
 */
export function OverviewLayout({ page, editable, onChange }: PageRendererProps) {
  const textBlocks = page.blocks.filter(
    (b) => b.type === 'subtitle' || b.type === 'paragraph'
  );
  const mediaBlocks = page.blocks.filter(
    (b) => b.type === 'image_placeholder' || b.type === 'video_placeholder'
  );

  return (
    <div className="p-8 space-y-8">
      {/* Top: Text */}
      <div className="space-y-4">
        {textBlocks.map((block) => (
          <BlockRenderer
            key={block.block_id}
            block={block}
            editable={editable}
            onChange={(updatedBlock) => {
              if (!onChange) return;
              const updatedBlocks = page.blocks.map((b) =>
                b.block_id === block.block_id ? updatedBlock : b
              );
              onChange({ ...page, blocks: updatedBlocks });
            }}
          />
        ))}
      </div>

      {/* Bottom: Media */}
      <div>
        {mediaBlocks.map((block) => (
          <BlockRenderer
            key={block.block_id}
            block={block}
            editable={editable}
            onChange={(updatedBlock) => {
              if (!onChange) return;
              const updatedBlocks = page.blocks.map((b) =>
                b.block_id === block.block_id ? updatedBlock : b
              );
              onChange({ ...page, blocks: updatedBlocks });
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Channels Layout
 * - 아이콘 + 리스트
 */
export function ChannelsLayout({ page, editable, onChange }: PageRendererProps) {
  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {page.blocks.map((block) => (
          <div
            key={block.block_id}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <BlockRenderer
              block={block}
              editable={editable}
              onChange={(updatedBlock) => {
                if (!onChange) return;
                const updatedBlocks = page.blocks.map((b) =>
                  b.block_id === block.block_id ? updatedBlock : b
                );
                onChange({ ...page, blocks: updatedBlocks });
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * CTA Layout
 * - 중앙 큰 버튼 + 하단 리스트
 */
export function CTALayout({ page, editable, onChange }: PageRendererProps) {
  const ctaBlock = page.blocks.find((b) => b.type === 'cta_button');
  const otherBlocks = page.blocks.filter((b) => b.type !== 'cta_button');

  return (
    <div className="p-8 text-center space-y-8">
      {/* Top: Other blocks */}
      <div className="space-y-4 max-w-2xl mx-auto">
        {otherBlocks.map((block) => (
          <BlockRenderer
            key={block.block_id}
            block={block}
            editable={editable}
            onChange={(updatedBlock) => {
              if (!onChange) return;
              const updatedBlocks = page.blocks.map((b) =>
                b.block_id === block.block_id ? updatedBlock : b
              );
              onChange({ ...page, blocks: updatedBlocks });
            }}
          />
        ))}
      </div>

      {/* Center: CTA Button */}
      {ctaBlock && (
        <div className="max-w-md mx-auto">
          <BlockRenderer
            block={ctaBlock}
            editable={editable}
            onChange={(updatedBlock) => {
              if (!onChange) return;
              const updatedBlocks = page.blocks.map((b) =>
                b.block_id === ctaBlock.block_id ? updatedBlock : b
              );
              onChange({ ...page, blocks: updatedBlocks });
            }}
          />
        </div>
      )}
    </div>
  );
}
