/**
 * Studio Layout
 *
 * Canvas Studio v3의 전체 레이아웃을 구성합니다.
 * VSCode 스타일의 4분할 레이아웃:
 * - Top Toolbar (상단 고정, 48px)
 * - Activity Bar (좌측 고정, 56px)
 * - Left Panel (좌측 패널, 280px, 리사이즈 가능)
 * - Canvas Viewport (중앙 캔버스, flex-1) - Konva.js 기반
 * - Right Dock (우측 Dock, 360px, 리사이즈 가능)
 *
 * Phase 2 완료 상태:
 * - Konva.js 기반 캔버스 렌더링
 * - Zustand 기반 상태 관리
 * - 속성 편집 패널 완성
 *
 * @author C팀 (Frontend Team)
 * @version 3.1
 */

'use client';

import { TopToolbar } from './TopToolbar';
import { ActivityBar } from './ActivityBar';
import { LeftPanel } from './LeftPanel';
import { CanvasViewport } from './CanvasViewport';
import { RightDock } from './RightDock';

export function StudioLayout() {
  return (
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

          {/* 중앙 캔버스 - 남은 공간 전부 (Konva.js) */}
          <CanvasViewport />

          {/* 우측 Dock - 360px (리사이즈 가능) */}
          <RightDock />
        </div>
      </main>
    </div>
  );
}