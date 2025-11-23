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

// StudioLayout과 모든 컴포넌트를 dynamic import로 로드 (SSR 방지)
const StudioLayout = dynamic(
  () => import('@/components/canvas-studio/layout/StudioLayout').then((mod) => ({ default: mod.StudioLayout })),
  { ssr: false }
);

const TopToolbar = dynamic(
  () => import('@/components/canvas-studio/layout/TopToolbar').then((mod) => ({ default: mod.TopToolbar })),
  { ssr: false }
);

const ActivityBar = dynamic(
  () => import('@/components/canvas-studio/layout/ActivityBar').then((mod) => ({ default: mod.ActivityBar })),
  { ssr: false }
);

const LeftPanel = dynamic(
  () => import('@/components/canvas-studio/layout/LeftPanel').then((mod) => ({ default: mod.LeftPanel })),
  { ssr: false }
);

const PolotnoWorkspace = dynamic(
  () => import('@/components/canvas-studio/polotno/PolotnoWorkspace').then((mod) => ({ default: mod.PolotnoWorkspace })),
  { ssr: false }
);

const RightDock = dynamic(
  () => import('@/components/canvas-studio/panels/right/RightDock').then((mod) => ({ default: mod.RightDock })),
  { ssr: false }
);

export default function CanvasStudioPage() {
  return (
    <StudioLayout
      topToolbar={<TopToolbar />}
      activityBar={<ActivityBar />}
      leftPanel={<LeftPanel />}
      canvas={<PolotnoWorkspace />}
      rightDock={<RightDock />}
    />
  );
}
