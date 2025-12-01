/**
 * Video Pipeline V2 - 4단계 확인 플로우 Hook
 *
 * B팀 요청서(B_TEAM_REQUEST_VIDEO_PIPELINE_V2_2025-12-01.md) 기반
 *
 * 주요 기능:
 * - 4단계 플로우 상태 관리
 * - API 호출 및 에러 처리
 * - 폴링 기반 진행률 업데이트
 * - Cost Guard 에러 처리
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-01
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  VideoProjectStatusV2,
  RenderMode,
  VideoPlanDraftV2,
  SceneDraftV2,
  VideoRenderResponse,
  ImageApprovalStatus,
  CostGuardError,
} from '@/types/video-pipeline-v2';
import {
  getFlowStepFromStatus,
  getCompletedSteps,
  isStepReady,
  isStepGenerating,
} from '@/types/video-pipeline-v2';
import * as api from '@/lib/api/video-pipeline-api-v2';

// ============================================================================
// Types
// ============================================================================

export interface UseVideo6V2Options {
  projectId?: string;
  onStatusChange?: (status: VideoProjectStatusV2) => void;
  onError?: (error: Error) => void;
  onComplete?: (videoUrl: string) => void;
  pollInterval?: number;
}

export interface Video6V2State {
  // 프로젝트 상태
  projectId: string | null;
  status: VideoProjectStatusV2;
  progress: number;
  currentStep: number;
  completedSteps: number[];

  // 플랜 데이터
  planDraft: VideoPlanDraftV2 | null;

  // 렌더링 결과
  videoUrl: string | null;
  costEstimate: VideoRenderResponse | null;

  // 로딩/에러 상태
  isLoading: boolean;
  isPolling: boolean;
  error: Error | null;
  costLimitError: CostGuardError | null;
}

export interface Video6V2Actions {
  // Step 1: Script
  approveScript: (planDraftOrScenes: VideoPlanDraftV2 | SceneDraftV2[]) => Promise<void>;

  // Step 2: Images
  generateImages: () => Promise<void>;
  regenerateImages: (sceneIndices: number[], reason?: string) => Promise<void>;
  approveImages: () => Promise<void>;
  updateImageApproval: (sceneIndex: number, status: ImageApprovalStatus) => void;

  // Step 3: Motion
  generateMotion: () => Promise<void>;
  regenerateMotion: (sceneIndices: number[], reason?: string) => Promise<void>;
  approveMotion: () => Promise<void>;
  updateMotionPrompt: (sceneIndex: number, prompt: string, promptKo?: string) => void;
  toggleAiVideo: (sceneIndex: number, enabled: boolean) => void;

  // Step 4: Render
  getCostEstimate: (renderMode: RenderMode) => Promise<VideoRenderResponse>;
  startRender: (renderMode: RenderMode) => Promise<void>;

  // 유틸리티
  setProjectId: (id: string) => void;
  refreshStatus: () => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: Video6V2State = {
  projectId: null,
  status: 'not_started',
  progress: 0,
  currentStep: 1,
  completedSteps: [],
  planDraft: null,
  videoUrl: null,
  costEstimate: null,
  isLoading: false,
  isPolling: false,
  error: null,
  costLimitError: null,
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useVideo6V2(options: UseVideo6V2Options = {}): [Video6V2State, Video6V2Actions] {
  const {
    projectId: initialProjectId,
    onStatusChange,
    onError,
    onComplete,
    pollInterval = 2000,
  } = options;

  const [state, setState] = useState<Video6V2State>({
    ...initialState,
    projectId: initialProjectId || null,
  });

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const updateState = useCallback((updates: Partial<Video6V2State>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleError = useCallback(
    (error: any) => {
      console.error('[useVideo6V2] Error:', error);

      // Cost limit 에러 특별 처리
      if (api.isCostLimitError(error)) {
        updateState({
          isLoading: false,
          error: error,
          costLimitError: error.details as CostGuardError,
        });
      } else {
        updateState({
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }

      if (onError) {
        onError(error);
      }
    },
    [updateState, onError]
  );

  const updateFromStatus = useCallback(
    (response: api.ProjectStatusV2Response) => {
      const prevStatus = state.status;
      const newStatus = response.status;

      updateState({
        status: newStatus,
        progress: response.progress || 0,
        currentStep: getFlowStepFromStatus(newStatus),
        completedSteps: getCompletedSteps(newStatus),
        planDraft: response.plan || state.planDraft,
        videoUrl: response.video_url || state.videoUrl,
        error: response.error ? new Error(response.error) : null,
      });

      // 상태 변경 콜백
      if (prevStatus !== newStatus && onStatusChange) {
        onStatusChange(newStatus);
      }

      // 완료 콜백
      if (newStatus === 'completed' && response.video_url && onComplete) {
        onComplete(response.video_url);
      }
    },
    [state.status, state.planDraft, state.videoUrl, updateState, onStatusChange, onComplete]
  );

  // ============================================================================
  // Polling
  // ============================================================================

  const startPolling = useCallback(
    (targetStatuses: VideoProjectStatusV2[]) => {
      if (!state.projectId) return;

      // 기존 폴링 중지
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }

      updateState({ isPolling: true });

      pollRef.current = setInterval(async () => {
        try {
          const response = await api.getProjectStatusV2(state.projectId!);
          updateFromStatus(response);

          // 목표 상태 도달 시 폴링 중지
          if (targetStatuses.includes(response.status) || response.status === 'failed') {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            updateState({ isPolling: false, isLoading: false });
          }
        } catch (error) {
          handleError(error);
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          updateState({ isPolling: false });
        }
      }, pollInterval);
    },
    [state.projectId, pollInterval, updateState, updateFromStatus, handleError]
  );

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    updateState({ isPolling: false });
  }, [updateState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [stopPolling]);

  // ============================================================================
  // Actions
  // ============================================================================

  const setProjectId = useCallback(
    (id: string) => {
      updateState({ projectId: id });
    },
    [updateState]
  );

  const refreshStatus = useCallback(async () => {
    if (!state.projectId) return;

    try {
      updateState({ isLoading: true });
      const response = await api.getProjectStatusV2(state.projectId);
      updateFromStatus(response);
      updateState({ isLoading: false });
    } catch (error) {
      handleError(error);
    }
  }, [state.projectId, updateState, updateFromStatus, handleError]);

  const reset = useCallback(() => {
    stopPolling();
    setState(initialState);
  }, [stopPolling]);

  const clearError = useCallback(() => {
    updateState({ error: null, costLimitError: null });
  }, [updateState]);

  // ============================================================================
  // Step 1: Script Actions
  // ============================================================================

  const approveScript = useCallback(
    async (planDraftOrScenes: VideoPlanDraftV2 | SceneDraftV2[]) => {
      if (!state.projectId) {
        handleError(new Error('Project ID is required'));
        return;
      }

      try {
        updateState({ isLoading: true, error: null });

        // 백엔드는 plan_draft 전체를 요구함
        let planDraftToSend: VideoPlanDraftV2;

        if (Array.isArray(planDraftOrScenes)) {
          // scenes 배열이 전달된 경우 (기존 호환성)
          planDraftToSend = state.planDraft
            ? { ...state.planDraft, scenes: planDraftOrScenes }
            : { scenes: planDraftOrScenes } as VideoPlanDraftV2;
        } else {
          // 전체 planDraft가 전달된 경우
          planDraftToSend = planDraftOrScenes;
        }

        const response = await api.approveScript(state.projectId, {
          plan_draft: planDraftToSend,
        });

        updateState({
          isLoading: false,
          status: response.status,
          planDraft: response.plan || planDraftToSend,
          currentStep: getFlowStepFromStatus(response.status),
          completedSteps: getCompletedSteps(response.status),
        });
      } catch (error) {
        handleError(error);
      }
    },
    [state.projectId, state.planDraft, updateState, handleError]
  );

  // ============================================================================
  // Step 2: Image Actions
  // ============================================================================

  const generateImages = useCallback(async () => {
    if (!state.projectId) {
      handleError(new Error('Project ID is required'));
      return;
    }

    try {
      updateState({ isLoading: true, error: null });

      await api.generateImages(state.projectId);

      // 이미지 생성 완료까지 폴링
      startPolling(['images_ready', 'failed']);
    } catch (error) {
      handleError(error);
    }
  }, [state.projectId, updateState, handleError, startPolling]);

  const regenerateImages = useCallback(
    async (sceneIndices: number[], reason?: string) => {
      if (!state.projectId) {
        handleError(new Error('Project ID is required'));
        return;
      }

      try {
        updateState({ isLoading: true, error: null });

        await api.regenerateImages(state.projectId, {
          scene_indices: sceneIndices,
          reason,
        });

        // 이미지 재생성 완료까지 폴링
        startPolling(['images_ready', 'failed']);
      } catch (error) {
        handleError(error);
      }
    },
    [state.projectId, updateState, handleError, startPolling]
  );

  const approveImages = useCallback(async () => {
    if (!state.projectId) {
      handleError(new Error('Project ID is required'));
      return;
    }

    try {
      updateState({ isLoading: true, error: null });

      const response = await api.approveImages(state.projectId);

      updateState({
        isLoading: false,
        status: response.status,
        planDraft: response.plan || state.planDraft,
        currentStep: getFlowStepFromStatus(response.status),
        completedSteps: getCompletedSteps(response.status),
      });
    } catch (error) {
      handleError(error);
    }
  }, [state.projectId, state.planDraft, updateState, handleError]);

  const updateImageApproval = useCallback(
    (sceneIndex: number, status: ImageApprovalStatus) => {
      if (!state.planDraft) return;

      const updatedScenes = [...state.planDraft.scenes];
      if (updatedScenes[sceneIndex]) {
        updatedScenes[sceneIndex] = {
          ...updatedScenes[sceneIndex],
          image_approval_status: status,
        };

        updateState({
          planDraft: {
            ...state.planDraft,
            scenes: updatedScenes,
          },
        });
      }
    },
    [state.planDraft, updateState]
  );

  // ============================================================================
  // Step 3: Motion Actions
  // ============================================================================

  const generateMotion = useCallback(async () => {
    if (!state.projectId) {
      handleError(new Error('Project ID is required'));
      return;
    }

    try {
      updateState({ isLoading: true, error: null });

      await api.generateMotion(state.projectId);

      // 모션 생성 완료까지 폴링
      startPolling(['motion_ready', 'failed']);
    } catch (error) {
      handleError(error);
    }
  }, [state.projectId, updateState, handleError, startPolling]);

  const regenerateMotion = useCallback(
    async (sceneIndices: number[], reason?: string) => {
      if (!state.projectId) {
        handleError(new Error('Project ID is required'));
        return;
      }

      try {
        updateState({ isLoading: true, error: null });

        await api.regenerateMotion(state.projectId, {
          scene_indices: sceneIndices,
          reason,
        });

        // 모션 재생성 완료까지 폴링
        startPolling(['motion_ready', 'failed']);
      } catch (error) {
        handleError(error);
      }
    },
    [state.projectId, updateState, handleError, startPolling]
  );

  const approveMotion = useCallback(async () => {
    if (!state.projectId) {
      handleError(new Error('Project ID is required'));
      return;
    }

    try {
      updateState({ isLoading: true, error: null });

      const response = await api.approveMotion(state.projectId);

      updateState({
        isLoading: false,
        status: response.status,
        planDraft: response.plan || state.planDraft,
        currentStep: getFlowStepFromStatus(response.status),
        completedSteps: getCompletedSteps(response.status),
      });
    } catch (error) {
      handleError(error);
    }
  }, [state.projectId, state.planDraft, updateState, handleError]);

  const updateMotionPrompt = useCallback(
    (sceneIndex: number, prompt: string, promptKo?: string) => {
      if (!state.planDraft) return;

      const updatedScenes = [...state.planDraft.scenes];
      if (updatedScenes[sceneIndex]) {
        updatedScenes[sceneIndex] = {
          ...updatedScenes[sceneIndex],
          motion_prompt: prompt,
          motion_prompt_ko: promptKo || updatedScenes[sceneIndex].motion_prompt_ko,
        };

        updateState({
          planDraft: {
            ...state.planDraft,
            scenes: updatedScenes,
          },
        });
      }
    },
    [state.planDraft, updateState]
  );

  const toggleAiVideo = useCallback(
    (sceneIndex: number, enabled: boolean) => {
      if (!state.planDraft) return;

      const updatedScenes = [...state.planDraft.scenes];
      if (updatedScenes[sceneIndex]) {
        updatedScenes[sceneIndex] = {
          ...updatedScenes[sceneIndex],
          use_ai_video: enabled,
        };

        updateState({
          planDraft: {
            ...state.planDraft,
            scenes: updatedScenes,
          },
        });
      }
    },
    [state.planDraft, updateState]
  );

  // ============================================================================
  // Step 4: Render Actions
  // ============================================================================

  const getCostEstimate = useCallback(
    async (renderMode: RenderMode): Promise<VideoRenderResponse> => {
      if (!state.projectId) {
        throw new Error('Project ID is required');
      }

      try {
        updateState({ isLoading: true, error: null, costLimitError: null });

        const estimate = await api.getCostEstimate(state.projectId, renderMode);

        updateState({
          isLoading: false,
          costEstimate: estimate,
        });

        return estimate;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [state.projectId, updateState, handleError]
  );

  const startRender = useCallback(
    async (renderMode: RenderMode) => {
      if (!state.projectId) {
        handleError(new Error('Project ID is required'));
        return;
      }

      try {
        updateState({ isLoading: true, error: null, costLimitError: null });

        await api.startRender(state.projectId, renderMode, state.planDraft || undefined);

        // 렌더링 완료까지 폴링
        startPolling(['completed', 'failed']);
      } catch (error) {
        handleError(error);
      }
    },
    [state.projectId, state.planDraft, updateState, handleError, startPolling]
  );

  // ============================================================================
  // Return
  // ============================================================================

  const actions: Video6V2Actions = {
    // Step 1
    approveScript,
    // Step 2
    generateImages,
    regenerateImages,
    approveImages,
    updateImageApproval,
    // Step 3
    generateMotion,
    regenerateMotion,
    approveMotion,
    updateMotionPrompt,
    toggleAiVideo,
    // Step 4
    getCostEstimate,
    startRender,
    // Utility
    setProjectId,
    refreshStatus,
    reset,
    clearError,
  };

  return [state, actions];
}

export default useVideo6V2;
