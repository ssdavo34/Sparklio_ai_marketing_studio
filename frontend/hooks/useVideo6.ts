/**
 * Video Pipeline V2 Hook
 *
 * B팀 백엔드 Video Pipeline V2 API와 연동하여
 * 비디오 생성 전체 플로우를 관리하는 Hook
 *
 * 플로우:
 * 1. selectMode() - 모드 선택 (REUSE/HYBRID/CREATIVE)
 * 2. fetchAssets() - Asset Pool 조회 (REUSE/HYBRID)
 * 3. selectAsset() - 사용할 에셋 선택
 * 4. createProject() - 프로젝트 생성
 * 5. executePlan() - PLAN 모드 실행 (LLM)
 * 6. updateScene() - 유저가 플랜 수정
 * 7. startRender() - RENDER 모드 실행 (영상 생성)
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-11-29
 */

import { useState, useCallback, useRef } from 'react';
import type {
  VideoGenerationMode,
  VideoProjectStatus,
  VideoPlanDraftV1,
  SceneDraft,
  AssetPoolItem,
  RenderProgressState,
} from '@/types/video-pipeline';
import {
  createVideoProject,
  executePlanMode,
  savePlanDraft,
  executeRenderMode,
  getProjectStatus,
  getAssetPool,
  pollUntilComplete,
  getVideoPipelineErrorMessage,
  type ProjectStatusResponse,
} from '@/lib/api/video-pipeline-api';

// ============================================================================
// Types
// ============================================================================

interface UseVideo6State {
  // 프로젝트 정보
  projectId: string | null;
  projectStatus: VideoProjectStatus;
  mode: VideoGenerationMode | null;
  topic: string;

  // Asset Pool
  availableAssets: AssetPoolItem[];
  selectedAssetIds: string[];
  isLoadingAssets: boolean;

  // Plan
  planDraft: VideoPlanDraftV1 | null;
  isPlanDirty: boolean; // 유저가 수정했는지

  // Render
  renderProgress: RenderProgressState;
  videoUrl: string | null;
  thumbnailUrl: string | null;

  // UI 상태
  isLoading: boolean;
  error: string | null;
}

interface UseVideo6Actions {
  // 주제 설정
  setTopic: (topic: string) => void;

  // 모드 선택
  selectMode: (mode: VideoGenerationMode) => void;

  // Asset Pool
  fetchAssets: () => Promise<void>;
  selectAsset: (assetId: string) => void;
  deselectAsset: (assetId: string) => void;
  clearSelectedAssets: () => void;

  // 프로젝트 생성 (topic 직접 전달 가능)
  createProject: (overrideTopic?: string) => Promise<string | null>;

  // Plan
  executePlan: () => Promise<void>;
  updateScene: (sceneIndex: number, updates: Partial<SceneDraft>) => void;
  deleteScene: (sceneIndex: number) => void;
  reorderScenes: (fromIndex: number, toIndex: number) => void;
  savePlan: () => Promise<void>;
  regeneratePlan: () => Promise<void>;

  // Render
  startRender: () => Promise<void>;

  // 상태 조회
  refreshStatus: () => Promise<void>;

  // 리셋
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: UseVideo6State = {
  projectId: null,
  projectStatus: 'not_started',
  mode: null,
  topic: '',
  availableAssets: [],
  selectedAssetIds: [],
  isLoadingAssets: false,
  planDraft: null,
  isPlanDirty: false,
  renderProgress: {
    status: 'not_started',
    progress: 0,
  },
  videoUrl: null,
  thumbnailUrl: null,
  isLoading: false,
  error: null,
};

// ============================================================================
// Hook
// ============================================================================

export function useVideo6(): [UseVideo6State, UseVideo6Actions] {
  const [state, setState] = useState<UseVideo6State>(initialState);
  const pollingRef = useRef<boolean>(false);

  // ============================================================================
  // 주제 설정
  // ============================================================================

  const setTopic = useCallback((topic: string) => {
    setState((prev) => ({
      ...prev,
      topic,
      error: null,
    }));
  }, []);

  // ============================================================================
  // 모드 선택
  // ============================================================================

  const selectMode = useCallback((mode: VideoGenerationMode) => {
    setState((prev) => ({
      ...prev,
      mode,
      error: null,
      // 모드 변경 시 선택된 에셋 초기화
      selectedAssetIds: mode === 'creative' ? [] : prev.selectedAssetIds,
    }));
  }, []);

  // ============================================================================
  // Asset Pool
  // ============================================================================

  const fetchAssets = useCallback(async () => {
    if (!state.projectId) {
      // 프로젝트 없이 Asset 조회 - 임시 프로젝트 생성 필요
      console.warn('[useVideo6] No project ID for asset fetch');
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoadingAssets: true,
      error: null,
    }));

    try {
      const response = await getAssetPool(state.projectId);

      setState((prev) => ({
        ...prev,
        availableAssets: response.assets,
        isLoadingAssets: false,
      }));
    } catch (error) {
      console.error('[useVideo6] Asset fetch failed:', error);
      setState((prev) => ({
        ...prev,
        isLoadingAssets: false,
        error: getVideoPipelineErrorMessage(error),
      }));
    }
  }, [state.projectId]);

  const selectAsset = useCallback((assetId: string) => {
    setState((prev) => ({
      ...prev,
      selectedAssetIds: prev.selectedAssetIds.includes(assetId)
        ? prev.selectedAssetIds
        : [...prev.selectedAssetIds, assetId],
    }));
  }, []);

  const deselectAsset = useCallback((assetId: string) => {
    setState((prev) => ({
      ...prev,
      selectedAssetIds: prev.selectedAssetIds.filter((id) => id !== assetId),
    }));
  }, []);

  const clearSelectedAssets = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedAssetIds: [],
    }));
  }, []);

  // ============================================================================
  // 프로젝트 생성
  // ============================================================================

  const createProject = useCallback(async (overrideTopic?: string): Promise<string | null> => {
    const topic = overrideTopic || state.topic;

    if (!state.mode || !topic.trim()) {
      setState((prev) => ({
        ...prev,
        error: '모드와 주제를 입력해주세요.',
      }));
      return null;
    }

    // overrideTopic이 주어지면 state도 업데이트
    if (overrideTopic) {
      setState((prev) => ({ ...prev, topic: overrideTopic }));
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await createVideoProject({
        topic: topic,
        mode: state.mode,
        selected_asset_ids:
          state.mode !== 'creative' ? state.selectedAssetIds : undefined,
      });

      setState((prev) => ({
        ...prev,
        projectId: response.project_id,
        projectStatus: response.status,
        isLoading: false,
      }));

      console.log('[useVideo6] Project created:', response.project_id);
      return response.project_id;
    } catch (error) {
      console.error('[useVideo6] Project creation failed:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: getVideoPipelineErrorMessage(error),
      }));
      return null;
    }
  }, [state.mode, state.topic, state.selectedAssetIds]);

  // ============================================================================
  // Plan 관련
  // ============================================================================

  const executePlan = useCallback(async () => {
    if (!state.projectId) {
      setState((prev) => ({
        ...prev,
        error: '프로젝트가 생성되지 않았습니다.',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      renderProgress: { status: 'planning', progress: 0 },
    }));

    try {
      const response = await executePlanMode(state.projectId);

      setState((prev) => ({
        ...prev,
        planDraft: response.plan,
        projectStatus: response.status,
        isPlanDirty: false,
        isLoading: false,
        renderProgress: { status: 'not_started', progress: 0 },
      }));

      console.log('[useVideo6] Plan created:', response.plan.scenes.length, 'scenes');
    } catch (error) {
      console.error('[useVideo6] Plan execution failed:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: getVideoPipelineErrorMessage(error),
        renderProgress: { status: 'error', progress: 0 },
      }));
    }
  }, [state.projectId]);

  const updateScene = useCallback(
    (sceneIndex: number, updates: Partial<SceneDraft>) => {
      setState((prev) => {
        if (!prev.planDraft) return prev;

        const updatedScenes = prev.planDraft.scenes.map((scene) =>
          scene.scene_index === sceneIndex ? { ...scene, ...updates } : scene
        );

        return {
          ...prev,
          planDraft: {
            ...prev.planDraft,
            scenes: updatedScenes,
            script_status: 'user_edited',
          },
          isPlanDirty: true,
        };
      });
    },
    []
  );

  const deleteScene = useCallback((sceneIndex: number) => {
    setState((prev) => {
      if (!prev.planDraft) return prev;

      const filteredScenes = prev.planDraft.scenes
        .filter((scene) => scene.scene_index !== sceneIndex)
        .map((scene, idx) => ({
          ...scene,
          scene_index: idx + 1,
        }));

      return {
        ...prev,
        planDraft: {
          ...prev.planDraft,
          scenes: filteredScenes,
          script_status: 'user_edited',
        },
        isPlanDirty: true,
      };
    });
  }, []);

  const reorderScenes = useCallback((fromIndex: number, toIndex: number) => {
    setState((prev) => {
      if (!prev.planDraft) return prev;

      const scenes = [...prev.planDraft.scenes];
      const [removed] = scenes.splice(fromIndex, 1);
      scenes.splice(toIndex, 0, removed);

      // scene_index 재정렬
      const reindexedScenes = scenes.map((scene, idx) => ({
        ...scene,
        scene_index: idx + 1,
      }));

      return {
        ...prev,
        planDraft: {
          ...prev.planDraft,
          scenes: reindexedScenes,
          script_status: 'user_edited',
        },
        isPlanDirty: true,
      };
    });
  }, []);

  const savePlan = useCallback(async () => {
    if (!state.projectId || !state.planDraft) {
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await savePlanDraft(state.projectId, state.planDraft);

      setState((prev) => ({
        ...prev,
        planDraft: response.plan,
        projectStatus: response.status,
        isPlanDirty: false,
        isLoading: false,
      }));

      console.log('[useVideo6] Plan saved');
    } catch (error) {
      console.error('[useVideo6] Plan save failed:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: getVideoPipelineErrorMessage(error),
      }));
    }
  }, [state.projectId, state.planDraft]);

  const regeneratePlan = useCallback(async () => {
    // 기존 플랜 초기화 후 다시 생성
    setState((prev) => ({
      ...prev,
      planDraft: null,
      isPlanDirty: false,
    }));

    await executePlan();
  }, [executePlan]);

  // ============================================================================
  // Render 관련
  // ============================================================================

  const startRender = useCallback(async () => {
    if (!state.projectId) {
      setState((prev) => ({
        ...prev,
        error: '프로젝트가 생성되지 않았습니다.',
      }));
      return;
    }

    // 수정된 플랜이 있으면 먼저 저장
    if (state.isPlanDirty && state.planDraft) {
      await savePlan();
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      renderProgress: { status: 'rendering', progress: 0 },
    }));

    try {
      // RENDER 모드 시작
      await executeRenderMode(state.projectId);

      // 폴링으로 상태 확인
      pollingRef.current = true;

      const finalStatus = await pollUntilComplete(state.projectId, {
        interval: 2000,
        timeout: 600000, // 10분
        onProgress: (status) => {
          if (!pollingRef.current) return;

          setState((prev) => ({
            ...prev,
            projectStatus: status.status,
            renderProgress: {
              status: status.status === 'failed' ? 'error' : 'rendering',
              progress: status.progress || 0,
              currentStep: status.current_step,
            },
          }));
        },
      });

      pollingRef.current = false;

      if (finalStatus.status === 'completed') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          projectStatus: 'completed',
          renderProgress: { status: 'completed', progress: 100 },
          videoUrl: finalStatus.video_url || null,
        }));

        console.log('[useVideo6] Render completed:', finalStatus.video_url);
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          projectStatus: 'failed',
          renderProgress: { status: 'error', progress: 0 },
          error: finalStatus.error || '렌더링 실패',
        }));
      }
    } catch (error) {
      pollingRef.current = false;
      console.error('[useVideo6] Render failed:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: getVideoPipelineErrorMessage(error),
        renderProgress: { status: 'error', progress: 0 },
      }));
    }
  }, [state.projectId, state.isPlanDirty, state.planDraft, savePlan]);

  // ============================================================================
  // 상태 조회
  // ============================================================================

  const refreshStatus = useCallback(async () => {
    if (!state.projectId) return;

    try {
      const status = await getProjectStatus(state.projectId);

      setState((prev) => ({
        ...prev,
        projectStatus: status.status,
        planDraft: status.plan || prev.planDraft,
        videoUrl: status.video_url || prev.videoUrl,
        renderProgress: {
          status:
            status.status === 'completed'
              ? 'completed'
              : status.status === 'failed'
              ? 'error'
              : status.status === 'rendering'
              ? 'rendering'
              : 'not_started',
          progress: status.progress || 0,
          currentStep: status.current_step,
        },
        error: status.error || null,
      }));
    } catch (error) {
      console.error('[useVideo6] Status refresh failed:', error);
    }
  }, [state.projectId]);

  // ============================================================================
  // 리셋
  // ============================================================================

  const reset = useCallback(() => {
    pollingRef.current = false;
    setState(initialState);
  }, []);

  // ============================================================================
  // Return
  // ============================================================================

  const actions: UseVideo6Actions = {
    setTopic,
    selectMode,
    fetchAssets,
    selectAsset,
    deselectAsset,
    clearSelectedAssets,
    createProject,
    executePlan,
    updateScene,
    deleteScene,
    reorderScenes,
    savePlan,
    regeneratePlan,
    startRender,
    refreshStatus,
    reset,
  };

  return [state, actions];
}

export default useVideo6;
