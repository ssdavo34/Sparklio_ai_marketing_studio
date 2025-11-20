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

export function LeftPanel() {
  const currentMode = useEditorStore((state) => state.currentMode);

  return (
    <aside className="flex w-[280px] flex-col border-r border-neutral-800 bg-neutral-900">
      {/* 패널 헤더 */}
      <div className="flex h-9 items-center px-4 border-b border-neutral-800">
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
          {currentMode === 'planning' && 'Concept Board'}
          {currentMode === 'editor' && 'Canvas Studio'}
          {currentMode === 'video' && 'Timeline Studio'}
          {currentMode === 'admin' && 'Admin Studio'}
        </span>
      </div>

      {/* 패널 컨텐츠 (스크롤 가능) */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* TODO: 각 모드별 서브 패널 컴포넌트 구현 (Phase 2) */}
        <div className="text-sm text-neutral-500">
          <p className="mb-4">현재 모드: {currentMode}</p>
          <p>여기에 Pages, Assets, Layers 패널이 들어옵니다.</p>
        </div>
      </div>
    </aside>
  );
}