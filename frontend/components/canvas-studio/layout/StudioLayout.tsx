/**
 * Studio Layout
 *
 * Canvas Studio v3.3 전체 레이아웃
 * - Top Toolbar (고정, 56px)
 * - Activity Bar (검정 바, 56px, 세로 아이콘 메뉴)
 * - Left Panel (컨텐츠 패널, ActivityBar 메뉴 컨텐츠 + Pages/Editor)
 * - Canvas Area (중앙, Polotno 기반)
 * - Right Dock (가변, 접기/펼치기)
 *
 * @author C팀 (Frontend Team)
 * @version 3.3
 * @date 2025-12-01
 */

'use client';

import { ReactNode, useRef, useCallback } from 'react';
import { useLayoutStore } from '../stores/useLayoutStore';
import { useVideo6ModalStore } from '../stores';
import { Video6Modal } from '@/components/video6';

interface StudioLayoutProps {
  topToolbar: ReactNode;
  activityBar: ReactNode;
  leftPanel: ReactNode;
  canvas: ReactNode;
  rightDock: ReactNode;
}

export function StudioLayout({
  topToolbar,
  activityBar,
  leftPanel,
  canvas,
  rightDock,
}: StudioLayoutProps) {
  // Video6 Modal 상태
  const isVideo6ModalOpen = useVideo6ModalStore((state) => state.isOpen);
  const closeVideo6Modal = useVideo6ModalStore((state) => state.closeModal);

  const {
    rightDockWidth,
    isRightDockCollapsed,
    isViewMode,
    setRightDockWidth,
    rightDockMinWidth,
    rightDockMaxWidth,
  } = useLayoutStore();

  const rightResizeRef = useRef<HTMLDivElement>(null);

  // Right Dock Resize Handler
  const handleRightResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightDockWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.max(
        rightDockMinWidth,
        Math.min(startWidth + delta, rightDockMaxWidth)
      );
      setRightDockWidth(newWidth);
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
  }, [rightDockWidth, rightDockMinWidth, rightDockMaxWidth, setRightDockWidth]);

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-gray-200 bg-white z-20 flex-shrink-0">
        {topToolbar}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar (검정 바) */}
        {!isViewMode && (
          <div className="flex-shrink-0">
            {activityBar}
          </div>
        )}

        {/* Left Panel (컨텐츠 패널) */}
        {!isViewMode && (
          <div className="flex-shrink-0 overflow-hidden">
            {leftPanel}
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-50 overflow-hidden">
          {canvas}
        </div>

        {/* Right Dock - Hidden in View Mode */}
        {!isViewMode && !isRightDockCollapsed && (
          <>
            {/* Right Dock Resize Handle */}
            <div
              ref={rightResizeRef}
              onMouseDown={handleRightResize}
              className="w-1 bg-transparent hover:bg-purple-400 cursor-col-resize flex-shrink-0 transition-colors"
              style={{ marginRight: '-1px' }}
            />
            <div
              className="border-l border-gray-200 bg-white flex-shrink-0 overflow-hidden"
              style={{ width: `${rightDockWidth}px` }}
            >
              {rightDock}
            </div>
          </>
        )}
      </div>

      {/* Video6 Modal (전체 화면 오버레이) */}
      <Video6Modal isOpen={isVideo6ModalOpen} onClose={closeVideo6Modal} />
    </div>
  );
}
