/**
 * Activity Bar
 *
 * Tool selection sidebar (Canva-style)
 * - Width: 56px (fixed)
 * - Background: Dark
 * - Tool icons for Left Panel switching
 *
 * @author C Team (Frontend Team)
 * @version 3.1
 */

'use client';

import { useLeftPanelStore, type LeftPanelTab } from '../stores';
import { FileText, Upload, Image as ImageIcon, Palette, Settings, FolderOpen, Mic, Sparkles, Video, Presentation, Share2 } from 'lucide-react';

interface Tool {
  id: LeftPanelTab;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

// 1. 입력 소스 / 프로젝트 관리
const PROJECT_TOOLS: Tool[] = [
  { id: 'project', label: 'Project', Icon: FolderOpen },
  { id: 'upload', label: 'Upload', Icon: Upload },
];

// 2. 브랜드 & 전략 허브
const STRATEGY_TOOLS: Tool[] = [
  { id: 'brandkit', label: 'Brand Kit', Icon: Palette },
  { id: 'meeting', label: 'Meeting AI', Icon: Mic },
  { id: 'conceptboard', label: 'ConceptBoard', Icon: Sparkles },
];

// 3. 채널별 산출물
const CHANNEL_TOOLS: Tool[] = [
  { id: 'presentation', label: 'Presentation', Icon: Presentation },
  { id: 'detail', label: '상세페이지', Icon: FileText },
  { id: 'sns', label: 'SNS 광고', Icon: Share2 },
  { id: 'video', label: '영상', Icon: Video },
  { id: 'image', label: '이미지', Icon: ImageIcon },
];

// 4. 에셋 라이브러리
const LIBRARY_TOOLS: Tool[] = [
  { id: 'assets', label: 'Assets', Icon: Sparkles },
];

// 툴 버튼 렌더링 헬퍼
function ToolButton({ tool, isActive, onClick }: { tool: Tool; isActive: boolean; onClick: () => void }) {
  const Icon = tool.Icon;
  return (
    <button
      onClick={onClick}
      className={`
        flex h-12 items-center justify-center
        transition-colors duration-200
        ${isActive
          ? 'bg-neutral-800 text-white border-l-2 border-purple-500'
          : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100 border-l-2 border-transparent'
        }
      `}
      title={tool.label}
      aria-label={tool.label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

export function ActivityBar() {
  const activeTab = useLeftPanelStore((state) => state.activeTab);
  const setActiveTab = useLeftPanelStore((state) => state.setActiveTab);

  return (
    <nav className="flex w-14 flex-col border-r border-neutral-800 bg-neutral-950 text-neutral-100">
      {/* 1. 입력 소스 / 프로젝트 관리 */}
      <div className="flex flex-col">
        {PROJECT_TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool}
            isActive={activeTab === tool.id}
            onClick={() => setActiveTab(tool.id)}
          />
        ))}
      </div>

      {/* 구분선 */}
      <div className="mx-2 my-1 border-t border-neutral-700" />

      {/* 2. 브랜드 & 전략 허브 */}
      <div className="flex flex-col">
        {STRATEGY_TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool}
            isActive={activeTab === tool.id}
            onClick={() => setActiveTab(tool.id)}
          />
        ))}
      </div>

      {/* 구분선 */}
      <div className="mx-2 my-1 border-t border-neutral-700" />

      {/* 3. 채널별 산출물 */}
      <div className="flex flex-col">
        {CHANNEL_TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool}
            isActive={activeTab === tool.id}
            onClick={() => setActiveTab(tool.id)}
          />
        ))}
      </div>

      {/* 구분선 */}
      <div className="mx-2 my-1 border-t border-neutral-700" />

      {/* 4. 에셋 라이브러리 */}
      <div className="flex flex-col">
        {LIBRARY_TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool}
            isActive={activeTab === tool.id}
            onClick={() => setActiveTab(tool.id)}
          />
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* 5. 시스템 (하단 고정) */}
      <div className="flex flex-col">
        <button
          onClick={() => setActiveTab('settings')}
          className={`
            flex h-12 items-center justify-center
            transition-colors duration-200
            ${activeTab === 'settings'
              ? 'bg-neutral-800 text-white border-l-2 border-purple-500'
              : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100 border-l-2 border-transparent'
            }
          `}
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
