/**
 * Canvas Viewport
 *
 * 중앙에 위치한 캔버스 영역
 * - 크기: flex-1 (남은 공간 전부)
 * - 최소 너비: 400px
 * - 배경: 연한 회색 (bg-neutral-100)
 *
 * 기능:
 * - Fabric.js 캔버스 렌더링
 * - 줌/팬 컨트롤
 * - 그리드/가이드라인 표시
 *
 * Phase 1: 빈 캔버스 영역만 구현
 * Phase 3: Canvas Context에서 canvasRef만 받아오기 ✅
 *
 * @author C팀 (Frontend Team)
 * @version 3.0
 */

'use client';

import { useState } from 'react';
import { useCanvasStore, useLayoutStore } from '../stores';
import { useCanvas } from '../context';
import { ContextMenu } from '../components';

export function CanvasViewport() {
  // Phase 3: Canvas Context에서 canvasRef와 isReady 가져오기
  const {
    canvasRef,
    isReady,
    fabricCanvas,
    copySelected,
    pasteSelected,
    duplicateSelected,
    deleteSelected,
    groupSelected,
    ungroupSelected,
  } = useCanvas();

  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // 우클릭 이벤트 핸들러
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // 선택된 객체가 있는지 확인
  const hasSelection = fabricCanvas?.getActiveObject() !== undefined && fabricCanvas?.getActiveObject() !== null;

  // Zustand Store 사용 (Phase 2 완료!)
  const zoom = useCanvasStore((state) => Math.round(state.zoom * 100));
  const zoomIn = useCanvasStore((state) => state.zoomIn);
  const zoomOut = useCanvasStore((state) => state.zoomOut);
  const resetZoom = useCanvasStore((state) => state.resetZoom);
  const zoomToFit = useCanvasStore((state) => state.zoomToFit);
  const toggleGrid = useCanvasStore((state) => state.toggleGrid);
  const showGrid = useCanvasStore((state) => state.showGrid);

  // Layout Store - 패널 토글
  const isLeftPanelCollapsed = useLayoutStore((state) => state.isLeftPanelCollapsed);
  const isRightDockCollapsed = useLayoutStore((state) => state.isRightDockCollapsed);
  const toggleLeftPanel = useLayoutStore((state) => state.toggleLeftPanel);
  const toggleRightDock = useLayoutStore((state) => state.toggleRightDock);

  return (
    <section className="relative flex flex-1 justify-center overflow-auto bg-neutral-100">
      {/* 캔버스 컨테이너 */}
      <div
        className="relative"
        onContextMenu={handleContextMenu}
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'center center',
          transition: 'transform 0.1s ease-out',
        }}
      >
        {/* Phase 3: Fabric.js Canvas 렌더링 */}
        <canvas
          ref={canvasRef}
          className="rounded-lg shadow-2xl"
        />

        {/* 로딩 상태 표시 (초기화 중일 때만) */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white">
            <div className="text-center">
              <div className="mb-4 text-6xl text-neutral-200">🎨</div>
              <p className="text-lg font-medium text-neutral-400">Canvas Studio v3.0</p>
              <p className="mt-2 text-sm text-neutral-400">
                Initializing Fabric.js...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 줌 컨트롤 (우측 상단) - sticky로 스크롤 시에도 고정 */}
      <div className="sticky right-4 top-4 z-50 flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-md self-start ml-auto mr-4 mt-4">
        {/* 줌 아웃 버튼 */}
        <button
          onClick={zoomOut}
          className="rounded p-1 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          title="Zoom Out (Ctrl+-)"
          aria-label="Zoom Out"
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
              d="M20 12H4"
            />
          </svg>
        </button>

        {/* 줌 퍼센트 */}
        <button
          onClick={resetZoom}
          className="min-w-[50px] text-sm font-medium text-neutral-700 hover:text-neutral-900"
          title="Reset Zoom (Ctrl+0)"
        >
          {zoom}%
        </button>

        {/* 줌 인 버튼 */}
        <button
          onClick={zoomIn}
          className="rounded p-1 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          title="Zoom In (Ctrl++)"
          aria-label="Zoom In"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        {/* 구분선 */}
        <div className="mx-1 h-4 w-px bg-neutral-200" />

        {/* Fit 버튼 */}
        <button
          onClick={zoomToFit}
          className="rounded px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          title="Zoom to Fit"
        >
          Fit
        </button>
      </div>

      {/* 좌측 하단 컨트롤 그룹 - sticky로 스크롤 시에도 고정 */}
      <div className="sticky bottom-4 left-4 z-50 flex items-center gap-2 self-end ml-4 mb-4">
        {/* 좌측 패널 토글 (패널이 닫혀있을 때만 표시) */}
        {isLeftPanelCollapsed && (
          <button
            onClick={toggleLeftPanel}
            className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-neutral-600 shadow-md transition-colors hover:bg-neutral-50 hover:text-neutral-900"
            title="Show Left Panel (Ctrl+B)"
          >
            ☰ Pages
          </button>
        )}

        {/* 그리드 토글 */}
        <button
          className={`
            rounded-lg px-3 py-2 text-xs font-medium shadow-md
            transition-colors duration-200
            ${
              showGrid
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }
          `}
          onClick={toggleGrid}
          title="Toggle Grid (Ctrl+G)"
        >
          Grid
        </button>
      </div>

      {/* 우측 하단 컨트롤 그룹 */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        {/* 캔버스 상태 표시 */}
        <div className="rounded-lg bg-white px-3 py-2 text-xs text-neutral-500 shadow-md">
          800 × 600 px
        </div>

        {/* 우측 Dock 토글 (Dock이 닫혀있을 때만 표시) */}
        {isRightDockCollapsed && (
          <button
            onClick={toggleRightDock}
            className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-neutral-600 shadow-md transition-colors hover:bg-neutral-50 hover:text-neutral-900"
            title="Show Right Dock (Ctrl+Shift+B)"
          >
            📋 Dock
          </button>
        )}
      </div>

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onCopy={copySelected}
          onPaste={pasteSelected}
          onDuplicate={duplicateSelected}
          onDelete={deleteSelected}
          onGroup={groupSelected}
          onUngroup={ungroupSelected}
          hasSelection={hasSelection}
        />
      )}
    </section>
  );
}
