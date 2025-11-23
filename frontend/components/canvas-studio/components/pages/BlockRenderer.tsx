/**
 * Block Renderer Component
 *
 * ContentPlanPages의 Block을 렌더링하는 컴포넌트들
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 * @reference docs/CONTENT_PLAN_TO_PAGES_SPEC_V2.md
 */

'use client';

import React from 'react';
import { Image, Video, ArrowRight } from 'lucide-react';
import type {
  Block,
  BlockType,
  BlockContent,
} from '../../types/content-plan';

// ============================================================================
// Props
// ============================================================================

export interface BlockRendererProps {
  block: Block;
  editable?: boolean;
  onChange?: (block: Block) => void;
}

// ============================================================================
// Main BlockRenderer Component
// ============================================================================

export function BlockRenderer({ block, editable = false, onChange }: BlockRendererProps) {
  switch (block.type) {
    case 'title':
      return <TitleBlock block={block} editable={editable} onChange={onChange} />;
    case 'subtitle':
      return <SubtitleBlock block={block} editable={editable} onChange={onChange} />;
    case 'paragraph':
      return <ParagraphBlock block={block} editable={editable} onChange={onChange} />;
    case 'list':
      return <ListBlock block={block} editable={editable} onChange={onChange} />;
    case 'image_placeholder':
      return <ImagePlaceholderBlock block={block} editable={editable} onChange={onChange} />;
    case 'video_placeholder':
      return <VideoPlaceholderBlock block={block} editable={editable} onChange={onChange} />;
    case 'cta_button':
      return <CTAButtonBlock block={block} editable={editable} onChange={onChange} />;
    default:
      return null;
  }
}

// ============================================================================
// Title Block
// ============================================================================

function TitleBlock({ block, editable, onChange }: BlockRendererProps) {
  const content = block.content as { text: string };

  return (
    <div className="mb-6">
      {editable ? (
        <input
          type="text"
          value={content.text}
          onChange={(e) =>
            onChange?.({ ...block, content: { text: e.target.value } })
          }
          className="w-full text-4xl font-bold text-gray-900 bg-transparent border-b-2 border-gray-300 focus:border-purple-600 focus:outline-none"
        />
      ) : (
        <h1 className="text-4xl font-bold text-gray-900">{content.text}</h1>
      )}
    </div>
  );
}

// ============================================================================
// Subtitle Block
// ============================================================================

function SubtitleBlock({ block, editable, onChange }: BlockRendererProps) {
  const content = block.content as { text: string };

  return (
    <div className="mb-4">
      {editable ? (
        <input
          type="text"
          value={content.text}
          onChange={(e) =>
            onChange?.({ ...block, content: { text: e.target.value } })
          }
          className="w-full text-2xl font-semibold text-gray-800 bg-transparent border-b border-gray-300 focus:border-purple-600 focus:outline-none"
        />
      ) : (
        <h2 className="text-2xl font-semibold text-gray-800">{content.text}</h2>
      )}
    </div>
  );
}

// ============================================================================
// Paragraph Block
// ============================================================================

function ParagraphBlock({ block, editable, onChange }: BlockRendererProps) {
  const content = block.content as { text: string };

  return (
    <div className="mb-4">
      {editable ? (
        <textarea
          value={content.text}
          onChange={(e) =>
            onChange?.({ ...block, content: { text: e.target.value } })
          }
          className="w-full text-base text-gray-700 leading-relaxed bg-transparent border border-gray-300 rounded-md p-2 focus:border-purple-600 focus:outline-none"
          rows={4}
        />
      ) : (
        <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
          {content.text}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// List Block
// ============================================================================

function ListBlock({ block, editable, onChange }: BlockRendererProps) {
  const content = block.content as { items: string[] };

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...content.items];
    newItems[index] = value;
    onChange?.({ ...block, content: { items: newItems } });
  };

  const handleAddItem = () => {
    onChange?.({ ...block, content: { items: [...content.items, ''] } });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = content.items.filter((_, i) => i !== index);
    onChange?.({ ...block, content: { items: newItems } });
  };

  return (
    <div className="mb-4">
      <ul className="space-y-2">
        {content.items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            {editable ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  className="flex-1 text-base text-gray-700 bg-transparent border-b border-gray-300 focus:border-purple-600 focus:outline-none"
                />
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  삭제
                </button>
              </div>
            ) : (
              <span className="flex-1 text-base text-gray-700">{item}</span>
            )}
          </li>
        ))}
      </ul>
      {editable && (
        <button
          onClick={handleAddItem}
          className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          + 항목 추가
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Image Placeholder Block
// ============================================================================

function ImagePlaceholderBlock({ block, editable, onChange }: BlockRendererProps) {
  const content = block.content as { description: string; url?: string };

  return (
    <div className="mb-4">
      {content.url ? (
        <div className="relative rounded-lg overflow-hidden">
          <img
            src={content.url}
            alt={content.description}
            className="w-full h-auto"
          />
          {editable && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <button className="px-4 py-2 bg-white text-gray-900 rounded-md text-sm font-medium">
                이미지 변경
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
          <Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-2">{content.description}</p>
          {editable && (
            <button className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors">
              이미지 업로드
            </button>
          )}
        </div>
      )}
      {editable && (
        <input
          type="text"
          value={content.description}
          onChange={(e) =>
            onChange?.({
              ...block,
              content: { ...content, description: e.target.value },
            })
          }
          placeholder="이미지 설명"
          className="w-full mt-2 text-sm text-gray-600 bg-transparent border-b border-gray-300 focus:border-purple-600 focus:outline-none"
        />
      )}
    </div>
  );
}

// ============================================================================
// Video Placeholder Block
// ============================================================================

function VideoPlaceholderBlock({ block, editable, onChange }: BlockRendererProps) {
  const content = block.content as { description: string; url?: string };

  return (
    <div className="mb-4">
      {content.url ? (
        <div className="relative rounded-lg overflow-hidden aspect-video">
          <video
            src={content.url}
            controls
            className="w-full h-full"
          />
          {editable && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
              <button className="px-4 py-2 bg-white text-gray-900 rounded-md text-sm font-medium pointer-events-auto">
                비디오 변경
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 aspect-video flex flex-col items-center justify-center">
          <Video className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-600 mb-2">{content.description}</p>
          {editable && (
            <button className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors">
              비디오 업로드
            </button>
          )}
        </div>
      )}
      {editable && (
        <input
          type="text"
          value={content.description}
          onChange={(e) =>
            onChange?.({
              ...block,
              content: { ...content, description: e.target.value },
            })
          }
          placeholder="비디오 설명"
          className="w-full mt-2 text-sm text-gray-600 bg-transparent border-b border-gray-300 focus:border-purple-600 focus:outline-none"
        />
      )}
    </div>
  );
}

// ============================================================================
// CTA Button Block
// ============================================================================

function CTAButtonBlock({ block, editable, onChange }: BlockRendererProps) {
  const content = block.content as { text: string };

  return (
    <div className="mb-4">
      {editable ? (
        <input
          type="text"
          value={content.text}
          onChange={(e) =>
            onChange?.({ ...block, content: { text: e.target.value } })
          }
          placeholder="CTA 버튼 텍스트"
          className="w-full px-6 py-3 text-center text-base font-medium bg-purple-600 text-white rounded-lg border-2 border-purple-600 focus:outline-none focus:border-purple-800"
        />
      ) : (
        <button className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2">
          {content.text}
          <ArrowRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
