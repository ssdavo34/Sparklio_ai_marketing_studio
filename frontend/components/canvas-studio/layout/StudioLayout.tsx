/**
 * Studio Layout
 *
 * Canvas Studio의 전체 레이아웃을 구성합니다.
 * VSCode 스타일의 4분할 레이아웃:
 * - Top Toolbar (상단 고정, 48px)
 * - Activity Bar (좌측 고정, 56px)
 * - Left Panel (좌측 패널, 280px, 리사이즈 가능)
 * - Canvas Viewport (중앙 캔버스, flex-1)
 * - Right Dock (우측 Dock, 360px, 리사이즈 가능)
 *
 * Phase 3: Fabric.js Canvas 통합 ✅
 * - useCanvasEngine을 여기서만 호출
 * - CanvasProvider로 전체 레이아웃 감싸기
 * - TopToolbar는 useCanvas()로 addShape 접근
 * - CanvasViewport는 canvasRef만 props로 전달
 *
 * @author C팀 (Frontend Team)
 * @version 3.0
 */

'use client';

import { TopToolbar } from './TopToolbar';
import { ActivityBar } from './ActivityBar';
import { LeftPanel } from './LeftPanel';
import { CanvasViewport } from './CanvasViewport';
import { RightDock } from './RightDock';
import { useCanvasEngine } from '../hooks';
import { CanvasProvider } from '../context';

export function StudioLayout() {
  // Phase 3: Fabric.js 캔버스 엔진 초기화 (여기서만 호출!)
  const canvasEngine = useCanvasEngine();

  return (
    <CanvasProvider value={canvasEngine}>
      <div className="flex h-screen flex-col overflow-hidden bg-neutral-900">
        {/* 상단 툴바 - 고정 높이 48px */}
        <TopToolbar />

        {/* 메인 컨텐츠 영역 - 나머지 공간 전부 사용 */}
        <main className="flex flex-1 overflow-hidden">
          {/* 좌측 Activity Bar - 고정 너비 56px, 다크 테마 */}
          <ActivityBar />

          {/* 나머지 공간을 3분할: Left Panel + Canvas + Right Dock */}
          <div className="flex flex-1 overflow-hidden">
            {/* 좌측 패널 - 280px (리사이즈 가능) */}
            <LeftPanel />

            {/* 중앙 캔버스 - 남은 공간 전부 */}
            <CanvasViewport />

            {/* 우측 Dock - 360px (리사이즈 가능) */}
            <RightDock />
          </div>
        </main>
      </div>
    </CanvasProvider>
  );
}
