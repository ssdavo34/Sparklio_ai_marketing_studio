/**
 * Project API
 *
 * 프로젝트 CRUD API
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 1.3.4
 */

import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectStatus,
} from '@/types/workspace';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// ============================================================================
// API Functions
// ============================================================================

/**
 * 워크스페이스의 프로젝트 목록 조회
 */
export async function getProjects(workspaceId: string): Promise<Project[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workspaces/${workspaceId}/projects`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.statusText}`);
  }

  const data = await response.json();
  return data.projects || data;
}

/**
 * 프로젝트 단일 조회
 */
export async function getProject(id: string): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch project: ${response.statusText}`);
  }

  const data = await response.json();
  return data.project || data;
}

/**
 * 프로젝트 생성
 */
export async function createProject(request: CreateProjectRequest): Promise<Project> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workspaces/${request.workspaceId}/projects`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create project');
  }

  const data = await response.json();
  return data.project || data;
}

/**
 * 프로젝트 수정
 */
export async function updateProject(
  id: string,
  request: UpdateProjectRequest
): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update project');
  }

  const data = await response.json();
  return data.project || data;
}

/**
 * 프로젝트 상태 변경
 */
export async function updateProjectStatus(
  id: string,
  status: ProjectStatus
): Promise<Project> {
  return updateProject(id, { status });
}

/**
 * 프로젝트 삭제
 */
export async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete project');
  }
}

// ============================================================================
// Mock Functions
// ============================================================================

/**
 * Mock 프로젝트 목록
 */
export function getMockProjects(workspaceId: string): Project[] {
  return [
    {
      id: 'proj-1',
      workspaceId,
      name: '신제품 런칭 캠페인',
      status: 'in_progress',
      description: '2025년 1분기 신제품 런칭을 위한 마케팅 캠페인',
      targetDate: '2025-03-31',
      createdAt: '2025-11-01T00:00:00Z',
      updatedAt: '2025-11-20T00:00:00Z',
    },
    {
      id: 'proj-2',
      workspaceId,
      name: '브랜드 리뉴얼',
      status: 'planning',
      description: '브랜드 아이덴티티 리뉴얼 프로젝트',
      createdAt: '2025-11-15T00:00:00Z',
      updatedAt: '2025-11-15T00:00:00Z',
    },
    {
      id: 'proj-3',
      workspaceId,
      name: '연말 프로모션',
      status: 'idea',
      description: '연말 특별 프로모션 기획',
      createdAt: '2025-11-20T00:00:00Z',
      updatedAt: '2025-11-20T00:00:00Z',
    },
  ];
}

/**
 * Mock 프로젝트 생성
 */
export function createMockProject(request: CreateProjectRequest): Project {
  return {
    id: `proj-${Date.now()}`,
    ...request,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
