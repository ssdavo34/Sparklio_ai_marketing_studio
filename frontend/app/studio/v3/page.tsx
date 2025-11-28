/**
 * Canvas Studio v3.2 - Main Page (DEMO Day)
 *
 * Polotno-based editor with Sparklio custom UI
 * One-page application for all work (brief, generation, editing)
 *
 * DEMO Day: CenterViewSwitch로 다양한 뷰 지원
 * - canvas (기본 Polotno)
 * - concept_board (Concept Board)
 * - slides_preview, detail_preview, instagram_preview, shorts_preview
 *
 * @author C팀 (Frontend Team)
 * @version 3.2
 * @date 2025-11-26
 */

'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { StudioLayout } from '@/components/canvas-studio/layout/StudioLayout';
import { TopToolbar } from '@/components/canvas-studio/layout/TopToolbar';
import { ActivityBar } from '@/components/canvas-studio/layout/ActivityBar';
import { LeftPanel } from '@/components/canvas-studio/panels/left/LeftPanel';
import { RightDock } from '@/components/canvas-studio/panels/right/RightDock';
import { CenterViewSwitch } from '@/components/canvas-studio/views/CenterViewSwitch';
import { ToastContainer } from '@/components/ui/Toast';
import {
  useWorkspaceStore,
  useProjectStore,
  useBriefStore,
  useBrandStore,
  useEditorStore,
} from '@/components/canvas-studio/stores';
import { getMockProjects } from '@/lib/api/project-api';
import { getMockBrief } from '@/lib/api/brief-api';
import { getMockBrandKit } from '@/lib/api/brand-api';
import { getMockWorkspaces } from '@/lib/api/workspace-api';

const POLOTNO_API_KEY = 'ng2ylHnHO2NscxqyUEWy';

export default function CanvasStudioV3Page() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const documentId = searchParams.get('documentId');

  const { setCurrentWorkspace } = useWorkspaceStore();
  const { setCurrentProject } = useProjectStore();
  const { setBrief } = useBriefStore();
  const { setBrandKit } = useBrandStore();
  const { setRouteInfo } = useEditorStore();

  // Set route info (URL 기반 documentId)
  useEffect(() => {
    setRouteInfo(projectId, documentId);
  }, [projectId, documentId, setRouteInfo]);

  // Load project context when projectId is provided
  useEffect(() => {
    if (projectId) {
      loadProjectContext(projectId);
    }
  }, [projectId]);

  async function loadProjectContext(projectId: string) {
    try {
      // Find project and workspace
      const workspaces = getMockWorkspaces();

      for (const workspace of workspaces) {
        const projects = getMockProjects(workspace.id);
        const project = projects.find((p) => p.id === projectId);

        if (project) {
          // Set workspace and project context
          setCurrentWorkspace(workspace);
          setCurrentProject(project);

          // Load brief
          const briefData = getMockBrief(projectId);
          setBrief(briefData);

          // Load brand kit
          const brandKitData = getMockBrandKit(workspace.id);
          setBrandKit(brandKitData);

          console.log('✅ Project context loaded:', {
            workspace: workspace.name,
            project: project.name,
            hasBrief: !!briefData,
            hasBrandKit: !!brandKitData,
          });

          break;
        }
      }
    } catch (error) {
      console.error('Failed to load project context:', error);
    }
  }

  return (
    <>
      <StudioLayout
        topToolbar={<TopToolbar />}
        activityBar={<ActivityBar />}
        leftPanel={<LeftPanel />}
        canvas={<CenterViewSwitch polotnoApiKey={POLOTNO_API_KEY} />}
        rightDock={<RightDock />}
      />
      <ToastContainer />
    </>
  );
}
