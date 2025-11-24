/**
 * Workspace Store
 *
 * 워크스페이스 전역 상태 관리
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 1.2.1
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workspace } from '@/types/workspace';

// ============================================================================
// Types
// ============================================================================

interface WorkspaceStore {
  // State
  /** 워크스페이스 목록 */
  workspaces: Workspace[];

  /** 현재 선택된 워크스페이스 */
  currentWorkspace: Workspace | null;

  /** 로딩 상태 */
  isLoading: boolean;

  /** 에러 */
  error: string | null;

  // Actions
  /** 워크스페이스 목록 설정 */
  setWorkspaces: (workspaces: Workspace[]) => void;

  /** 현재 워크스페이스 설정 */
  setCurrentWorkspace: (workspace: Workspace | null) => void;

  /** 워크스페이스 추가 */
  addWorkspace: (workspace: Workspace) => void;

  /** 워크스페이스 업데이트 */
  updateWorkspace: (id: string, data: Partial<Workspace>) => void;

  /** 워크스페이스 삭제 */
  deleteWorkspace: (id: string) => void;

  /** 로딩 상태 설정 */
  setLoading: (isLoading: boolean) => void;

  /** 에러 설정 */
  setError: (error: string | null) => void;

  /** 에러 초기화 */
  clearError: () => void;

  /** 스토어 초기화 */
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,
};

// ============================================================================
// Store
// ============================================================================

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setWorkspaces: (workspaces) => {
        set({ workspaces, error: null });
      },

      setCurrentWorkspace: (workspace) => {
        set({ currentWorkspace: workspace, error: null });
      },

      addWorkspace: (workspace) => {
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
          error: null,
        }));
      },

      updateWorkspace: (id, data) => {
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === id ? { ...ws, ...data, updatedAt: new Date().toISOString() } : ws
          ),
          currentWorkspace:
            state.currentWorkspace?.id === id
              ? { ...state.currentWorkspace, ...data, updatedAt: new Date().toISOString() }
              : state.currentWorkspace,
          error: null,
        }));
      },

      deleteWorkspace: (id) => {
        set((state) => ({
          workspaces: state.workspaces.filter((ws) => ws.id !== id),
          currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace,
          error: null,
        }));
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ error, isLoading: false });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        // currentWorkspace만 persist (목록은 항상 서버에서 가져옴)
        currentWorkspace: state.currentWorkspace,
      }),
    }
  )
);

// ============================================================================
// Selectors (Optional - for better performance)
// ============================================================================

export const selectCurrentWorkspaceId = (state: WorkspaceStore) =>
  state.currentWorkspace?.id;

export const selectWorkspaceById = (id: string) => (state: WorkspaceStore) =>
  state.workspaces.find((ws) => ws.id === id);

export const selectWorkspacesCount = (state: WorkspaceStore) => state.workspaces.length;
