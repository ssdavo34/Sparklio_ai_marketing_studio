/**
 * Studio Layout
 *
 * Canvas Studio v3.1 전체 레이아웃
 * VSCode-style 레이아웃 구조
 * - Top Toolbar (고정, 56px)
 * - Activity Bar (56px, 고정)
 * - Left Panel (가변, 접기/펼치기)
 * - Canvas Area (중앙, Polotno 기반)
 * - Right Dock (가변, 접기/펼치기)
 *
 * @author C팀 (Frontend Team)
 * @version 3.1
 * @date 2025-11-22
 */

'use client';

import { ReactNode, useRef, useCallback } from 'react';
import { useLayoutStore } from '../stores/useLayoutStore';

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
  const {
    leftPanelWidth,
    isLeftPanelCollapsed,
    rightDockWidth,
    isRightDockCollapsed,
    activityBarWidth,
    isViewMode,
    setLeftPanelWidth,
    setRightDockWidth,
    leftPanelMinWidth,
    leftPanelMaxWidth,
    rightDockMinWidth,
    rightDockMaxWidth,
  } = useLayoutStore();

  const leftResizeRef = useRef<HTMLDivElement>(null);
  const rightResizeRef = useRef<HTMLDivElement>(null);

  // Left Panel Resize Handler
  const handleLeftResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftPanelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(
        leftPanelMinWidth,
        Math.min(startWidth + delta, leftPanelMaxWidth)
      );
      setLeftPanelWidth(newWidth);
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
  }, [leftPanelWidth, leftPanelMinWidth, leftPanelMaxWidth, setLeftPanelWidth]);

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
        {/* Activity Bar - Hidden in View Mode */}
        {!isViewMode && (
          <div
            className="border-r border-gray-200 bg-gray-900 flex-shrink-0"
            style={{ width: `${activityBarWidth}px` }}
          >
            {activityBar}
          </div>
        )}

        {/* Left Panel - Hidden in View Mode */}
        {!isViewMode && !isLeftPanelCollapsed && (
          <>
            <div
              className="border-r border-gray-200 bg-white flex-shrink-0 overflow-hidden"
              style={{ width: `${leftPanelWidth}px` }}
            >
              {leftPanel}
            </div>
            {/* Left Panel Resize Handle */}
            <div
              ref={leftResizeRef}
              onMouseDown={handleLeftResize}
              className="w-1 bg-transparent hover:bg-purple-400 cursor-col-resize flex-shrink-0 transition-colors"
              style={{ marginLeft: '-1px' }}
            />
          </>
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
    </div>
  );
}
