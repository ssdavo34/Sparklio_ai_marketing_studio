/**
 * Studio Layout with Resize
 *
 * Canvas Studio v3의 전체 레이아웃 (리사이즈 기능 포함)
 * VSCode 스타일의 4분할 레이아웃:
 * - Top Toolbar (상단 고정, 48px)
 * - Activity Bar (좌측 고정, 56px)
 * - Left Panel (좌측 패널, 280px, 리사이즈/접기/펼치기 가능)
 * - Canvas Viewport (중앙 캔버스, flex-1) - Konva.js 기반
 * - Right Dock (우측 Dock, 360px, 리사이즈/접기/펼치기 가능)
 *
 * @author C팀 (Frontend Team)
 * @version 3.3
 */

'use client';

import { useEffect } from 'react';
import { TopToolbar } from './TopToolbar';
import { ActivityBar } from './ActivityBar';
import { LeftPanel } from './LeftPanel';
import { CanvasViewport } from './CanvasViewport';
import { RightDock } from './RightDock';
import { ResizeHandle } from '../components/ResizeHandle';
import { useLayoutStore } from '../stores';

export function StudioLayout() {
  const {
    toggleLeftPanel,
    toggleRightDock,
    setLeftPanelWidth,
    setRightDockWidth,
    isLeftPanelCollapsed,
    isRightDockCollapsed
  } = useLayoutStore();

  // 키보드 단축키 설정
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+B: 왼쪽 패널 토글
      if (e.ctrlKey && e.key === 'b' && !e.shiftKey) {
        e.preventDefault();
        toggleLeftPanel();
      }
      // Ctrl+Shift+B: 오른쪽 패널 토글
      if (e.ctrlKey && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        toggleRightDock();
      }
      // Ctrl+Z: Undo (추후 구현)
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        // TODO: Undo 기능 구현
        console.log('Undo');
      }
      // Ctrl+Y or Ctrl+Shift+Z: Redo (추후 구현)
      if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        // TODO: Redo 기능 구현
        console.log('Redo');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleLeftPanel, toggleRightDock]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-900">
      {/* 상단 툴바 - 고정 높이 48px */}
      <TopToolbar />

      {/* 메인 컨텐츠 영역 - 나머지 공간 전부 사용 */}
      <main className="flex flex-1 overflow-hidden">
        {/* 좌측 Activity Bar - 고정 너비 56px, 다크 테마 */}
        <ActivityBar />

        {/* 나머지 공간을 3분할: Left Panel + Canvas + Right Dock */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* 좌측 패널 - 280px (리사이즈 가능, 접기/펼치기 가능) */}
          <LeftPanel />

          {/* 좌측 패널 리사이즈 핸들 */}
          {!isLeftPanelCollapsed && (
            <ResizeHandle
              direction="horizontal"
              onResize={(delta) => {
                setLeftPanelWidth(useLayoutStore.getState().leftPanelWidth + delta);
              }}
              className="absolute left-[336px] z-10"
              onResizeStart={() => {
                // 리사이즈 시작 시 포인터 이벤트 비활성화 (캔버스 간섭 방지)
                document.body.style.pointerEvents = 'none';
                document.body.classList.add('select-none');
              }}
              onResizeEnd={() => {
                // 리사이즈 종료 시 포인터 이벤트 활성화
                document.body.style.pointerEvents = '';
                document.body.classList.remove('select-none');
              }}
            />
          )}

          {/* 중앙 캔버스 - 남은 공간 전부 (Konva.js) */}
          <CanvasViewport />

          {/* 우측 도크 리사이즈 핸들 */}
          {!isRightDockCollapsed && (
            <ResizeHandle
              direction="horizontal"
              onResize={(delta) => {
                setRightDockWidth(useLayoutStore.getState().rightDockWidth - delta);
              }}
              className="absolute right-[360px] z-10"
              onResizeStart={() => {
                document.body.style.pointerEvents = 'none';
                document.body.classList.add('select-none');
              }}
              onResizeEnd={() => {
                document.body.style.pointerEvents = '';
                document.body.classList.remove('select-none');
              }}
            />
          )}

          {/* 우측 Dock - 360px (리사이즈 가능, 접기/펼치기 가능) */}
          <RightDock />
        </div>
      </main>
    </div>
  );
}