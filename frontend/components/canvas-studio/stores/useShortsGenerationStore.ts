/**
 * Shorts Generation Store
 *
 * Shorts 비디오 생성 진행 상태를 관리하는 Zustand 스토어
 * - 각 concept별 생성 상태 추적
 * - 2초 간격 polling 관리
 * - 완료/실패 시 콜백 처리
 */

import { create } from 'zustand';
import {
  generateShorts,
  getShortsStatus,
  getStepLabel,
  type ShortsGenerationStep,
  type ShortsStatusResponse,
} from '@/lib/api/shorts-api';

// ============================================
// Types
// ============================================

export interface ShortsGenerationState {
  status: 'idle' | 'processing' | 'completed' | 'failed';
  taskId: string | null;
  currentStep: ShortsGenerationStep | null;
  progress: number;
  message: string;
  videoUrl: string | null;
  downloadUrl: string | null;
  error: string | null;
}

interface ShortsGenerationStore {
  // 각 concept_id별 생성 상태
  generations: Record<string, ShortsGenerationState>;

  // Polling interval refs (conceptId -> intervalId)
  pollingIntervals: Record<string, NodeJS.Timeout>;

  // Actions
  startGeneration: (conceptId: string) => Promise<void>;
  pollStatus: (conceptId: string, taskId: string) => Promise<void>;
  stopPolling: (conceptId: string) => void;
  clearGeneration: (conceptId: string) => void;
  getGenerationState: (conceptId: string) => ShortsGenerationState;
}

// ============================================
// Default State
// ============================================

const defaultState: ShortsGenerationState = {
  status: 'idle',
  taskId: null,
  currentStep: null,
  progress: 0,
  message: '',
  videoUrl: null,
  downloadUrl: null,
  error: null,
};

// ============================================
// Store
// ============================================

export const useShortsGenerationStore = create<ShortsGenerationStore>((set, get) => ({
  generations: {},
  pollingIntervals: {},

  /**
   * Shorts 생성 시작
   */
  startGeneration: async (conceptId: string) => {
    const { pollingIntervals } = get();

    // 이미 진행 중이면 무시
    const currentState = get().generations[conceptId];
    if (currentState?.status === 'processing') {
      console.log(`[ShortsGeneration] Already processing for concept: ${conceptId}`);
      return;
    }

    // 기존 polling 정리
    if (pollingIntervals[conceptId]) {
      clearInterval(pollingIntervals[conceptId]);
    }

    // 상태 초기화 - processing 시작
    set((state) => ({
      generations: {
        ...state.generations,
        [conceptId]: {
          ...defaultState,
          status: 'processing',
          message: 'Shorts 생성을 시작합니다...',
        },
      },
    }));

    try {
      // API 호출 - 생성 시작
      console.log(`[ShortsGeneration] Starting generation for concept: ${conceptId}`);
      const response = await generateShorts(conceptId);

      // task_id 저장 및 polling 시작
      set((state) => ({
        generations: {
          ...state.generations,
          [conceptId]: {
            ...state.generations[conceptId],
            taskId: response.task_id,
            message: response.message,
          },
        },
      }));

      // 2초 간격 polling 시작
      const intervalId = setInterval(() => {
        get().pollStatus(conceptId, response.task_id);
      }, 2000);

      set((state) => ({
        pollingIntervals: {
          ...state.pollingIntervals,
          [conceptId]: intervalId,
        },
      }));

      // 첫 번째 상태 체크
      get().pollStatus(conceptId, response.task_id);

    } catch (error) {
      console.error(`[ShortsGeneration] Failed to start:`, error);
      set((state) => ({
        generations: {
          ...state.generations,
          [conceptId]: {
            ...state.generations[conceptId],
            status: 'failed',
            error: error instanceof Error ? error.message : 'Shorts 생성 시작 실패',
          },
        },
      }));
    }
  },

  /**
   * 상태 polling (내부 함수)
   */
  pollStatus: async (conceptId: string, taskId: string) => {
    try {
      console.log(`[ShortsGeneration] Polling status for task: ${taskId}`);
      const status: ShortsStatusResponse = await getShortsStatus(taskId);

      set((state) => ({
        generations: {
          ...state.generations,
          [conceptId]: {
            ...state.generations[conceptId],
            currentStep: status.current_step,
            progress: status.progress,
            message: getStepLabel(status.current_step),
            status: status.status,
            videoUrl: status.video_url || null,
            downloadUrl: status.download_url || null,
            error: status.error || null,
          },
        },
      }));

      // 완료 또는 실패 시 polling 중지
      if (status.status === 'completed' || status.status === 'failed') {
        console.log(`[ShortsGeneration] Generation ${status.status} for concept: ${conceptId}`);
        get().stopPolling(conceptId);
      }

    } catch (error) {
      console.error(`[ShortsGeneration] Polling error:`, error);
      // 네트워크 에러 시에도 일단 계속 polling (재시도)
    }
  },

  /**
   * Polling 중지
   */
  stopPolling: (conceptId: string) => {
    const { pollingIntervals } = get();
    if (pollingIntervals[conceptId]) {
      clearInterval(pollingIntervals[conceptId]);
      set((state) => {
        const newIntervals = { ...state.pollingIntervals };
        delete newIntervals[conceptId];
        return { pollingIntervals: newIntervals };
      });
    }
  },

  /**
   * 생성 상태 초기화
   */
  clearGeneration: (conceptId: string) => {
    get().stopPolling(conceptId);
    set((state) => {
      const newGenerations = { ...state.generations };
      delete newGenerations[conceptId];
      return { generations: newGenerations };
    });
  },

  /**
   * 특정 concept의 생성 상태 가져오기
   */
  getGenerationState: (conceptId: string): ShortsGenerationState => {
    return get().generations[conceptId] || defaultState;
  },
}));

