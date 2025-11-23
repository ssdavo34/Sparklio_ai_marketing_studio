/**
 * Canvas Studio Page - AI-Powered Ad Creation Studio
 *
 * This is the new Canvas Studio with AI chat integration,
 * professional layout system, and automatic image generation.
 *
 * Route: /canvas-studio
 *
 * @author C Team (Frontend Team)
 * @date 2025-11-23
 */

'use client';

import dynamic from 'next/dynamic';

// Polotno를 dynamic import로 로드 (SSR 방지)
const PolotnoWorkspace = dynamic(
  () => import('@/components/canvas-studio/polotno/PolotnoWorkspace').then((mod) => mod.PolotnoWorkspace),
  { ssr: false }
);

const TopToolbar = dynamic(
  () => import('@/components/canvas-studio/layout/TopToolbar').then((mod) => mod.TopToolbar),
  { ssr: false }
);

const LeftPanel = dynamic(
  () => import('@/components/canvas-studio/layout/LeftPanel').then((mod) => mod.LeftPanel),
  { ssr: false }
);

const RightDock = dynamic(
  () => import('@/components/canvas-studio/panels/right/RightDock').then((mod) => mod.RightDock),
  { ssr: false }
);

export default function CanvasStudioPage() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-gray-200 bg-white z-20 flex-shrink-0">
        <TopToolbar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-80 border-r border-gray-200 bg-white flex-shrink-0 overflow-hidden">
          <LeftPanel />
        </div>

        {/* Canvas Area (Polotno Workspace) */}
        <div className="flex-1 bg-gray-100 overflow-hidden">
          <PolotnoWorkspace />
        </div>

        {/* Right Dock (AI Chat) */}
        <div className="w-96 border-l border-gray-200 bg-white flex-shrink-0 overflow-hidden">
          <RightDock />
        </div>
      </div>
    </div>
  );
}
