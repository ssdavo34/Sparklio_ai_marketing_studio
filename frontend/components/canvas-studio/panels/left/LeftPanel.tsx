/**
 * Left Panel
 *
 * ActivityBar 옆의 컨텐츠 패널
 * - 상단: Pages / Editor / Menu(ActivityBar 선택) 탭
 * - 하단: 선택된 탭의 컨텐츠 (전체 영역)
 * - 세 가지 중 하나만 표시 (세로로 쌓이지 않음)
 * - 패널 전체 접기/펼치기 가능
 *
 * @author C Team (Frontend Team)
 * @version 9.0
 */

'use client';

import { useCallback, useRef } from 'react';
import {
  Layers,
  PencilRuler,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';
import { useLeftPanelStore, type LeftPanelTab } from '../../stores/useLeftPanelStore';

// Tab Content Components
import { CollapsiblePagesPanel } from './CollapsiblePagesPanel';
import { EditorPanel } from './editor';

// Menu Tab Components
import { ProjectTab } from './tabs/ProjectTab';
import { UploadTab } from './tabs/UploadTab';
import { BrandKitTab } from './tabs/BrandKitTab';
import { BriefTab } from './tabs/BriefTab';
import { MeetingTab } from './tabs/MeetingTab';
import { ConceptBoardTab } from './tabs/ConceptBoardTab';
import { PresentationTab } from './tabs/PresentationTab';
import { DetailTab } from './tabs/DetailTab';
import { SNSTab } from './tabs/SNSTab';
import { VideoTab } from './tabs/VideoTab';
import { ImageTab } from './tabs/ImageTab';
import { GeneratedAssetsTab } from './tabs/GeneratedAssetsTab';
import { SettingsTab } from './tabs/SettingsTab';

// ActivityBar 메뉴별 라벨
const MENU_LABELS: Record<LeftPanelTab, string> = {
  project: 'Project',
  upload: 'Upload',
  brandkit: 'Brand Kit',
  brief: 'Brief',
  meeting: 'Meeting AI',
  conceptboard: 'ConceptBoard',
  presentation: 'Presentation',
  detail: '상세페이지',
  sns: 'SNS 광고',
  video: '영상',
  image: '이미지',
  assets: 'Assets',
  settings: 'Settings',
};

export function LeftPanel() {
  const {
    panelTab,
    setPanelTab,
    isCollapsed,
    toggleCollapsed,
    panelWidth,
    setPanelWidth,
    minWidth,
    maxWidth,
  } = useLeftPanelStore();

  const resizeRef = useRef<HTMLDivElement>(null);

  // 리사이즈 핸들러
  const handleResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = panelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(minWidth, Math.min(startWidth + delta, maxWidth));
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [panelWidth, minWidth, maxWidth, setPanelWidth]);

  // 현재 뷰 컨텐츠 렌더링 (panelTab 기반)
  const renderContent = () => {
    switch (panelTab) {
      case 'pages':
        return <CollapsiblePagesPanel isCollapsed={false} />;
      case 'editor':
        return <EditorPanel isCollapsed={false} />;
      case 'project':
        return <ProjectTab />;
      case 'upload':
        return <UploadTab />;
      case 'brandkit':
        return <BrandKitTab />;
      case 'brief':
        return <BriefTab />;
      case 'meeting':
        return <MeetingTab />;
      case 'conceptboard':
        return <ConceptBoardTab />;
      case 'presentation':
        return <PresentationTab />;
      case 'detail':
        return <DetailTab />;
      case 'sns':
        return <SNSTab />;
      case 'video':
        return <VideoTab />;
      case 'image':
        return <ImageTab />;
      case 'assets':
        return <GeneratedAssetsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return null;
    }
  };

  // 헤더 타이틀 결정
  const getHeaderTitle = () => {
    if (panelTab === 'pages') return 'Pages';
    if (panelTab === 'editor') return 'Editor';
    // panelTab이 LeftPanelTab 타입일 때
    return MENU_LABELS[panelTab as LeftPanelTab] || 'Panel';
  };

  // 접힌 상태
  if (isCollapsed) {
    return (
      <div className="flex flex-col h-full w-10 bg-white border-r border-gray-200">
        <button
          onClick={toggleCollapsed}
          className="p-2 hover:bg-gray-100 transition-colors"
          title="패널 펼치기"
        >
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* 패널 본체 */}
      <div
        className="flex flex-col h-full bg-white"
        style={{ width: `${panelWidth}px` }}
      >
        {/* 헤더: 탭 버튼들 + 접기 버튼 */}
        <div className="flex items-center justify-between px-2 py-1 border-b border-gray-200 bg-gray-50">
          {/* 탭 버튼들 */}
          <div className="flex gap-1">
            {/* Pages 탭 */}
            <button
              onClick={() => setPanelTab('pages')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                panelTab === 'pages'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Pages</span>
            </button>

            {/* Editor 탭 */}
            <button
              onClick={() => setPanelTab('editor')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                panelTab === 'editor'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <PencilRuler className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>

            {/* ActivityBar 선택 메뉴 표시 (pages/editor가 아닐 때만 활성) */}
            {panelTab !== 'pages' && panelTab !== 'editor' && (
              <div className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium bg-purple-600 text-white">
                <MoreHorizontal className="w-3.5 h-3.5" />
                <span>{MENU_LABELS[panelTab as LeftPanelTab]}</span>
              </div>
            )}
          </div>

          {/* 접기 버튼 */}
          <button
            onClick={toggleCollapsed}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="패널 접기"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* 컨텐츠 영역 (전체 높이) */}
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </div>

      {/* 리사이즈 핸들 (우측 경계) */}
      <div
        ref={resizeRef}
        onMouseDown={handleResize}
        className="w-1 bg-gray-200 hover:bg-purple-400 cursor-col-resize flex-shrink-0 transition-colors"
      />
    </div>
  );
}

export default LeftPanel;
