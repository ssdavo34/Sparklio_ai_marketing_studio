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

import { ReactNode } from 'react';
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
  } = useLayoutStore();

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-gray-200 bg-white z-20 flex-shrink-0">
        {topToolbar}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <div
          className="border-r border-gray-200 bg-gray-900 flex-shrink-0"
          style={{ width: `${activityBarWidth}px` }}
        >
          {activityBar}
        </div>

        {/* Left Panel */}
        {!isLeftPanelCollapsed && (
          <div
            className="border-r border-gray-200 bg-white flex-shrink-0 overflow-hidden"
            style={{ width: `${leftPanelWidth}px` }}
          >
            {leftPanel}
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-50 overflow-hidden">
          {canvas}
        </div>

        {/* Right Dock */}
        {!isRightDockCollapsed && (
          <div
            className="border-l border-gray-200 bg-white flex-shrink-0 overflow-hidden"
            style={{ width: `${rightDockWidth}px` }}
          >
            {rightDock}
          </div>
        )}
      </div>
    </div>
  );
}
