/**
 * Left Panel
 *
 * 좌측 패널 컨테이너
 * - 기본 너비: 280px (리사이즈 가능, 200px ~ 500px)
 * - 배경: 연한 회색 (bg-neutral-50)
 * - 접기/펼치기 가능 (버튼 클릭 or Ctrl+B)
 *
 * 모드별 컨텐츠:
 * - Concept Board: 레이어/그룹 리스트
 * - Pitch Deck: 슬라이드 썸네일 리스트
 * - Product Story: 섹션 썸네일 리스트
 *
 * Phase 1: 빈 컨테이너만 구현
 * Phase 6: 페이지 관리 기능 추가
 *
 * @author C팀 (Frontend Team)
 * @version 3.0
 */

'use client';

import { useLayoutStore } from '../stores';

export function LeftPanel() {
  // Zustand Store 사용 (Phase 2 완료!)
  const isCollapsed = useLayoutStore((state) => state.isLeftPanelCollapsed);
  const width = useLayoutStore((state) => state.leftPanelWidth);
  const toggleLeftPanel = useLayoutStore((state) => state.toggleLeftPanel);

  // 접혀있으면 렌더링 안함
  if (isCollapsed) {
    return null;
  }

  return (
    <aside
      className="flex flex-col border-r border-neutral-200 bg-neutral-50"
      style={{ width: `${width}px` }}
    >
      {/* 패널 헤더 */}
      <div className="flex h-10 items-center justify-between border-b border-neutral-200 px-3">
        <h2 className="text-sm font-medium text-neutral-700">Pages</h2>

        {/* 닫기 버튼 */}
        <button
          onClick={toggleLeftPanel}
          className="rounded p-1 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
          title="Close Panel (Ctrl+B)"
          aria-label="Close Panel"
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

      {/* 패널 컨텐츠 */}
      <div className="flex-1 overflow-auto p-2">
        {/* Phase 1: 빈 상태 메시지 */}
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="mb-2 text-4xl text-neutral-300">📄</div>
          <p className="text-sm text-neutral-500">No pages yet</p>
          <p className="mt-1 text-xs text-neutral-400">
            Create a new page to get started
          </p>
        </div>

        {/* TODO: Phase 6에서 추가
        - PageThumbnail 컴포넌트
        - ThumbnailList 컴포넌트
        - 드래그 & 드롭 순서 변경
        */}
      </div>

      {/* 리사이즈 핸들 (우측 경계) */}
      <div
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
        onMouseDown={(e) => {
          // TODO: Phase 7에서 리사이즈 기능 구현
          console.log('Resize handle clicked');
        }}
      />
    </aside>
  );
}
