'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useCenterViewStore } from '../stores/useCenterViewStore';
import { ConceptBoardView } from './ConceptBoardView';

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

export function CenterViewSwitch({ polotnoApiKey }: CenterViewSwitchProps) {
  const { currentView } = useCenterViewStore();

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

    case 'canvas':
    default:
      return <PolotnoWorkspace apiKey={polotnoApiKey} />;
  }
}

export default CenterViewSwitch;
