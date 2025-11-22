/**
 * Canvas Studio v3.1 - Main Page
 *
 * Polotno-based editor with Sparklio custom UI
 *
 * @author C팀 (Frontend Team)
 * @version 3.1
 * @date 2025-11-22
 */

'use client';

import { StudioLayout } from '@/components/canvas-studio/layout/StudioLayout';
import { TopToolbar } from '@/components/canvas-studio/layout/TopToolbar';
import { ActivityBar } from '@/components/canvas-studio/layout/ActivityBar';
import { LeftPanel } from '@/components/canvas-studio/panels/left/LeftPanel';
import { PolotnoWorkspace } from '@/components/canvas-studio/polotno/PolotnoWorkspace';
import { RightDock } from '@/components/canvas-studio/panels/right/RightDock';

const POLOTNO_API_KEY = 'ng2ylHnHO2NscxqyUEWy';

export default function CanvasStudioV3Page() {
  return (
    <StudioLayout
      topToolbar={<TopToolbar />}
      activityBar={<ActivityBar />}
      leftPanel={<LeftPanel />}
      canvas={<PolotnoWorkspace apiKey={POLOTNO_API_KEY} />}
      rightDock={<RightDock />}
    />
  );
}
