/**
 * Workspace & Project Types
 *
 * 워크스페이스와 프로젝트 관련 TypeScript 타입 정의
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 1.1.1
 */

// ============================================================================
// Workspace Types
// ============================================================================

/**
 * 워크스페이스 (브랜드 단위)
 */
export interface Workspace {
  /** 워크스페이스 고유 ID */
  id: string;

  /** 브랜드/회사 이름 */
  name: string;

  /** 업종/산업 */
  industry: string;

  /** 웹사이트 URL (선택) */
  websiteUrl?: string;

  /** 설명 (선택) */
  description?: string;

  /** 생성일시 */
  createdAt: string;

  /** 수정일시 */
  updatedAt: string;
}

/**
 * 워크스페이스 생성 요청
 */
export type CreateWorkspaceRequest = Omit<
  Workspace,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * 워크스페이스 수정 요청
 */
export type UpdateWorkspaceRequest = Partial<
  Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>
>;

// ============================================================================
// Project Types
// ============================================================================

/**
 * 프로젝트 상태
 */
export type ProjectStatus = 'idea' | 'planning' | 'in_progress' | 'completed' | 'archived';

/**
 * 프로젝트 (캠페인 단위)
 */
export interface Project {
  /** 프로젝트 고유 ID */
  id: string;

  /** 소속 워크스페이스 ID */
  workspaceId: string;

  /** 프로젝트 이름 */
  name: string;

  /** 프로젝트 상태 */
  status: ProjectStatus;

  /** 설명 (선택) */
  description?: string;

  /** 목표 날짜 (선택) */
  targetDate?: string;

  /** 생성일시 */
  createdAt: string;

  /** 수정일시 */
  updatedAt: string;
}

/**
 * 프로젝트 생성 요청
 */
export type CreateProjectRequest = Omit<
  Project,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * 프로젝트 수정 요청
 */
export type UpdateProjectRequest = Partial<
  Omit<Project, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'>
>;

// ============================================================================
// Helper Types
// ============================================================================

/**
 * 프로젝트 상태 라벨 (한글)
 */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  idea: '아이디어',
  planning: '기획 중',
  in_progress: '진행 중',
  completed: '완료',
  archived: '보관',
};

/**
 * 프로젝트 상태 색상
 */
export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  idea: 'bg-gray-100 text-gray-700',
  planning: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-500',
};
