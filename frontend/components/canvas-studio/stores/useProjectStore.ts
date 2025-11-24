/**
 * Project Store
 *
 * 프로젝트 상태 관리
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 1.2.3
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, ProjectStatus } from '@/types/workspace';

// ============================================================================
// Types
// ============================================================================

interface ProjectStore {
  // State
  /** 프로젝트 목록 (현재 워크스페이스) */
  projects: Project[];

  /** 현재 선택된 프로젝트 */
  currentProject: Project | null;

  /** 로딩 상태 */
  isLoading: boolean;

  /** 에러 */
  error: string | null;

  // Actions
  /** 프로젝트 목록 설정 */
  setProjects: (projects: Project[]) => void;

  /** 현재 프로젝트 설정 */
  setCurrentProject: (project: Project | null) => void;

  /** 프로젝트 추가 */
  addProject: (project: Project) => void;

  /** 프로젝트 업데이트 */
  updateProject: (id: string, data: Partial<Project>) => void;

  /** 프로젝트 상태 변경 */
  updateProjectStatus: (id: string, status: ProjectStatus) => void;

  /** 프로젝트 삭제 */
  deleteProject: (id: string) => void;

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
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
};

// ============================================================================
// Store
// ============================================================================

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setProjects: (projects) => {
        set({ projects, error: null });
      },

      setCurrentProject: (project) => {
        set({ currentProject: project, error: null });
      },

      addProject: (project) => {
        set((state) => ({
          projects: [...state.projects, project],
          error: null,
        }));
      },

      updateProject: (id, data) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
          currentProject:
            state.currentProject?.id === id
              ? { ...state.currentProject, ...data, updatedAt: new Date().toISOString() }
              : state.currentProject,
          error: null,
        }));
      },

      updateProjectStatus: (id, status) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
          ),
          currentProject:
            state.currentProject?.id === id
              ? { ...state.currentProject, status, updatedAt: new Date().toISOString() }
              : state.currentProject,
          error: null,
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
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
      name: 'project-storage',
      partialize: (state) => ({
        // currentProject만 persist
        currentProject: state.currentProject,
      }),
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectCurrentProjectId = (state: ProjectStore) => state.currentProject?.id;

export const selectProjectById = (id: string) => (state: ProjectStore) =>
  state.projects.find((p) => p.id === id);

export const selectProjectsByStatus =
  (status: ProjectStatus) => (state: ProjectStore) =>
    state.projects.filter((p) => p.status === status);

export const selectActiveProjects = (state: ProjectStore) =>
  state.projects.filter((p) => p.status === 'in_progress' || p.status === 'planning');

export const selectProjectsCount = (state: ProjectStore) => state.projects.length;
