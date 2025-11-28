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
import { usePolotnoAutoSave } from '@/hooks/usePolotnoAutoSave';
import { useCanvasStore } from '@/components/canvas-studio/stores/useCanvasStore';
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
import { toast } from '@/components/ui/Toast';

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

  // Polotno Store 가져오기
  const polotnoStore = useCanvasStore((state) => state.polotnoStore);

  // Auto-save 설정 (documentId가 있을 때만 활성화)
  const { saveState } = usePolotnoAutoSave({
    polotnoStore: polotnoStore || undefined as any,
    documentId: documentId || `doc-${Date.now()}`,
    metadata: {
      title: 'Canvas Studio Document',
      description: 'Auto-saved document',
    },
    debounceDelay: 2000,
    enabled: !!polotnoStore && !!documentId,
    onSave: (success, error) => {
      if (success) {
        console.log('[Auto-save] ✅ Document saved successfully');
        // toast.success('문서가 저장되었습니다'); // 너무 빈번하므로 주석 처리
      } else {
        console.error('[Auto-save] ❌ Save failed:', error);
        toast.error('문서 저장 실패: ' + (error?.message || '알 수 없는 오류'));
      }
    },
  });

  // saveState를 EditorStore와 동기화 (TopToolbar의 SaveStatusIndicator가 사용)
  useEffect(() => {
    const editorStore = useEditorStore.getState();

    // saveState.status를 EditorStore의 saveStatus로 변환
    const statusMap: Record<string, 'idle' | 'saving' | 'saved' | 'error'> = {
      'idle': 'idle',
      'pending': 'idle', // pending은 UI에서 idle로 표시
      'saving': 'saving',
      'saved': 'saved',
      'error': 'error',
    };

    editorStore.setSaveStatus(statusMap[saveState.status] || 'idle');

    if (saveState.lastSaved) {
      editorStore.setLastSaved(saveState.lastSaved);
    }

    if (saveState.status === 'error' && saveState.lastError) {
      editorStore.setLastError(saveState.lastError);
    } else if (saveState.status !== 'error') {
      editorStore.setLastError(null);
    }

    // isDirty 상태 업데이트
    editorStore.setDirty(saveState.pendingChanges);
  }, [saveState]);

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
