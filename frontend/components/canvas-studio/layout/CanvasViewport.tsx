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
 * Phase 3: Fabric.js 초기화 및 기본 기능
 *
 * @author C팀 (Frontend Team)
 * @version 3.0
 */

'use client';

import { useState } from 'react';

export function CanvasViewport() {
  // TODO: Phase 2에서 useCanvasStore로 변경
  const [zoom, setZoom] = useState(100);

  return (
    <section className="relative flex flex-1 items-center justify-center bg-neutral-100">
      {/* 캔버스 컨테이너 */}
      <div className="relative">
        {/* Phase 1: 임시 캔버스 영역 (흰색 박스) */}
        <div className="flex h-[600px] w-[800px] items-center justify-center rounded-lg bg-white shadow-2xl">
          <div className="text-center">
            <div className="mb-4 text-6xl text-neutral-200">🎨</div>
            <p className="text-lg font-medium text-neutral-400">Canvas Studio v3.0</p>
            <p className="mt-2 text-sm text-neutral-400">
              Fabric.js canvas will be initialized here
            </p>
            <p className="mt-1 text-xs text-neutral-300">
              Phase 3: Canvas Implementation
            </p>
          </div>
        </div>

        {/* TODO: Phase 3에서 추가
        <canvas
          ref={canvasRef}
          className="shadow-2xl"
        />
        */}
      </div>

      {/* 줌 컨트롤 (우측 상단) */}
      <div className="absolute right-4 top-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-md">
        {/* 줌 아웃 버튼 */}
        <button
          onClick={() => setZoom(Math.max(25, zoom - 10))}
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
          onClick={() => setZoom(100)}
          className="min-w-[50px] text-sm font-medium text-neutral-700 hover:text-neutral-900"
          title="Reset Zoom (Ctrl+0)"
        >
          {zoom}%
        </button>

        {/* 줌 인 버튼 */}
        <button
          onClick={() => setZoom(Math.min(400, zoom + 10))}
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
          onClick={() => {
            // TODO: Phase 3에서 zoomToFit 구현
            console.log('Zoom to fit');
          }}
          className="rounded px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          title="Zoom to Fit"
        >
          Fit
        </button>
      </div>

      {/* 그리드 토글 (좌측 하단) */}
      <div className="absolute bottom-4 left-4">
        <button
          className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-neutral-600 shadow-md hover:bg-neutral-50 hover:text-neutral-900"
          onClick={() => {
            // TODO: Phase 3에서 그리드 토글 구현
            console.log('Toggle grid');
          }}
          title="Toggle Grid (Ctrl+G)"
        >
          Grid
        </button>
      </div>

      {/* 캔버스 상태 표시 (우측 하단) */}
      <div className="absolute bottom-4 right-4 rounded-lg bg-white px-3 py-2 text-xs text-neutral-500 shadow-md">
        800 × 600 px
      </div>
    </section>
  );
}
