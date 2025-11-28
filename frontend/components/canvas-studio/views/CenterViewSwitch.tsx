'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useCenterViewStore } from '../stores/useCenterViewStore';
import { ConceptBoardView } from './ConceptBoardView';
import { ImageGenerationPanel } from '../components/ImageGenerationPanel';

// Polotno는 SSR 비활성화 필요
const PolotnoWorkspace = dynamic(
  () => import('../polotno/PolotnoWorkspace').then((mod) => mod.PolotnoWorkspace),
  { ssr: false }
);

// 다른 Preview 뷰들 (추후 구현)
const SlidesPreviewView = dynamic(() => import('./SlidesPreviewView'), { ssr: false });
const DetailPreviewView = dynamic(() => import('./DetailPreviewView'), { ssr: false });
const InstagramPreviewView = dynamic(() => import('./InstagramPreviewView'), { ssr: false });
const ShortsPreviewView = dynamic(() => import('./ShortsPreviewView'), { ssr: false });

interface CenterViewSwitchProps {
  polotnoApiKey: string;
}

/**
 * CenterViewSwitch
 *
 * 중앙 뷰 전환 컴포넌트
 * - Canvas(PolotnoWorkspace)는 항상 렌더링하되 hidden 처리
 * - 다른 뷰 전환 시에도 Canvas 상태 유지
 *
 * @version 2.0 - Canvas 상태 유지를 위해 hidden 방식으로 변경
 */
export function CenterViewSwitch({ polotnoApiKey }: CenterViewSwitchProps) {
  const { currentView } = useCenterViewStore();

  // Canvas가 아닌 다른 뷰를 렌더링
  const renderOtherView = () => {
    switch (currentView) {
      case 'concept_board':
        return <ConceptBoardView />;

      case 'slides_preview':
        return <SlidesPreviewView />;

      case 'detail_preview':
        return <DetailPreviewView />;

      case 'instagram_preview':
        return <InstagramPreviewView />;

      case 'shorts_preview':
        return <ShortsPreviewView />;

      case 'meeting_summary':
        // Meeting Summary는 MeetingTab에서 이미 처리하므로
        // 여기서는 ConceptBoard로 리다이렉트
        return <ConceptBoardView />;

      default:
        return null;
    }
  };

  const isCanvasView = currentView === 'canvas';

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* Canvas는 항상 렌더링, hidden으로 상태 유지 */}
      <div
        className={`flex-1 relative ${isCanvasView ? 'block' : 'hidden'}`}
        style={{ zIndex: isCanvasView ? 1 : 0 }}
      >
        <div className="absolute inset-0">
          <PolotnoWorkspace apiKey={polotnoApiKey} />
        </div>
      </div>

      {/* 다른 뷰들은 조건부 렌더링 */}
      {!isCanvasView && (
        <div className="flex-1 relative" style={{ zIndex: 1 }}>
          {renderOtherView()}
        </div>
      )}

      {/* Image Generation Panel (Canvas 뷰에서만 표시) */}
      {isCanvasView && <ImageGenerationPanel />}
    </div>
  );
}

export default CenterViewSwitch;
