/**
 * Right Dock
 *
 * 우측 Dock 컨테이너
 * - 기본 너비: 360px (리사이즈 가능, 300px ~ 600px)
 * - 배경: 흰색 (bg-white)
 * - 접기/펼치기 가능 (버튼 클릭 or Ctrl+Shift+B)
 *
 * 5개 탭:
 * 1. Spark Chat: AI 대화
 * 2. Inspector: 속성 편집
 * 3. Layers: 레이어 트리
 * 4. Data: 데이터 소스
 * 5. Brand: 브랜드 킷
 *
 * Phase 1: 탭 구조만 구현
 * Phase 4: 각 탭 컨텐츠 구현
 *
 * @author C팀 (Frontend Team)
 * @version 3.0
 */

'use client';

import { useLayoutStore, useTabsStore } from '../stores';
import type { RightDockTabId } from '../stores';
import { LayersPanel } from '../components';

// 탭 목록
const TABS: Array<{
  id: RightDockTabId;
  label: string;
  icon: string;
}> = [
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'inspector', label: 'Inspector', icon: '🔍' },
  { id: 'layers', label: 'Layers', icon: '📋' },
  { id: 'data', label: 'Data', icon: '📊' },
  { id: 'brand', label: 'Brand', icon: '🎨' },
];

export function RightDock() {
  // Zustand Store 사용 (Phase 2 완료!)
  const isCollapsed = useLayoutStore((state) => state.isRightDockCollapsed);
  const width = useLayoutStore((state) => state.rightDockWidth);
  const toggleRightDock = useLayoutStore((state) => state.toggleRightDock);
  const activeTab = useTabsStore((state) => state.activeRightDockTab);
  const setActiveTab = useTabsStore((state) => state.setActiveRightDockTab);

  // 접혀있으면 렌더링 안함
  if (isCollapsed) {
    return null;
  }

  return (
    <aside
      className="relative flex flex-col border-l border-neutral-200 bg-white"
      style={{ width: `${width}px` }}
    >
      {/* 탭 헤더 */}
      <div className="flex border-b border-neutral-200">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 px-3 py-2 text-xs font-medium
                transition-colors duration-200
                ${
                  isActive
                    ? 'border-b-2 border-blue-500 text-neutral-900'
                    : 'text-neutral-600 hover:text-neutral-900'
                }
              `}
              title={tab.label}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}

        {/* 닫기 버튼 */}
        <button
          onClick={toggleRightDock}
          className="ml-auto px-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
          title="Close Dock (Ctrl+Shift+B)"
          aria-label="Close Dock"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-auto">
        {/* Chat 탭 */}
        {activeTab === 'chat' && (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <div className="mb-3 text-5xl">💬</div>
            <p className="text-sm font-medium text-neutral-700">Spark Chat</p>
            <p className="mt-2 text-xs text-neutral-500">
              AI와 대화하여 콘텐츠를 생성하고 수정하세요
            </p>
            <p className="mt-1 text-xs text-neutral-400">Phase 4에서 구현</p>
          </div>
        )}

        {/* Inspector 탭 */}
        {activeTab === 'inspector' && (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <div className="mb-3 text-5xl">🔍</div>
            <p className="text-sm font-medium text-neutral-700">Inspector</p>
            <p className="mt-2 text-xs text-neutral-500">
              선택한 객체의 속성을 편집하세요
            </p>
            <p className="mt-1 text-xs text-neutral-400">Phase 4에서 구현</p>
          </div>
        )}

        {/* Layers 탭 */}
        {activeTab === 'layers' && <LayersPanel />}

        {/* Data 탭 */}
        {activeTab === 'data' && (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <div className="mb-3 text-5xl">📊</div>
            <p className="text-sm font-medium text-neutral-700">Data</p>
            <p className="mt-2 text-xs text-neutral-500">
              표, 그래프에 사용할 데이터를 관리하세요
            </p>
            <p className="mt-1 text-xs text-neutral-400">Phase 4에서 구현</p>
          </div>
        )}

        {/* Brand 탭 */}
        {activeTab === 'brand' && (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <div className="mb-3 text-5xl">🎨</div>
            <p className="text-sm font-medium text-neutral-700">Brand Kit</p>
            <p className="mt-2 text-xs text-neutral-500">
              브랜드 로고, 색상, 폰트를 사용하세요
            </p>
            <p className="mt-1 text-xs text-neutral-400">Phase 4에서 구현</p>
          </div>
        )}
      </div>

      {/* 리사이즈 핸들 (좌측 경계) */}
      <div
        className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
        onMouseDown={() => {
          // TODO: Phase 7에서 리사이즈 기능 구현
          console.log('Resize handle clicked');
        }}
      />
    </aside>
  );
}
