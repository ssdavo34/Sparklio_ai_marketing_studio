/**
 * Left Panel
 *
 * 좌측 패널 (VSCode의 Explorer와 유사)
 * - 너비: 280px (기본값, 리사이즈 가능)
 * - 배경: 다크 (bg-neutral-900)
 *
 * 역할:
 * - 현재 모드에 맞는 컨텍스트 도구 표시
 * - Pages/Slides 목록 관리
 * - Assets 라이브러리 탐색
 * - Layers 트리 구조 확인
 * - Templates 선택
 *
 * @author C팀 (Frontend Team)
 * @version 3.1
 */

'use client';

import { useEditorStore } from '../stores';
import { BrandKitPanel } from '../panels/BrandKitPanel';
import { PageManager } from './PageManager';

export function LeftPanel() {
  const currentMode = useEditorStore((state) => state.currentMode);

  return (
    <aside className="flex w-[280px] flex-col border-r border-gray-200 bg-white">
      {/* 패널 헤더 */}
      <div className="flex h-9 items-center px-4 border-b border-gray-200">
        <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
          {currentMode === 'planning' && 'Concept Board'}
          {currentMode === 'editor' && 'Canvas Studio'}
          {currentMode === 'video' && 'Timeline Studio'}
          {currentMode === 'admin' && 'Admin Studio'}
        </span>
      </div>

      {/* 패널 컨텐츠 */}
      <div className="flex-1 overflow-hidden">
        {/* Editor 모드일 때만 PageManager 표시 */}
        {activeTab === 'brandkit' && <BrandKitPanel />}
        {activeTab === 'pages' && <PagesTab />}

        {/* 다른 모드의 경우 */}
        {currentMode !== 'editor' && (
          <div className="p-4 text-sm text-gray-500">
            <p className="mb-4">현재 모드: {currentMode}</p>
            <p>여기에 모드별 패널이 들어옵니다.</p>
          </div>
        )}
      </div>
    </aside>
  );
}