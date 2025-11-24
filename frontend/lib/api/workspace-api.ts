/**
 * Workspace API
 *
 * 워크스페이스 CRUD API
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 1.3.1
 */

import type {
  Workspace,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
} from '@/types/workspace';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// ============================================================================
// API Functions
// ============================================================================

/**
 * 워크스페이스 목록 조회
 */
export async function getWorkspaces(): Promise<Workspace[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workspaces`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workspaces: ${response.statusText}`);
  }

  const data = await response.json();
  return data.workspaces || data;
}

/**
 * 워크스페이스 단일 조회
 */
export async function getWorkspace(id: string): Promise<Workspace> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workspaces/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workspace: ${response.statusText}`);
  }

  const data = await response.json();
  return data.workspace || data;
}

/**
 * 워크스페이스 생성
 */
export async function createWorkspace(
  request: CreateWorkspaceRequest
): Promise<Workspace> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workspaces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create workspace');
  }

  const data = await response.json();
  return data.workspace || data;
}

/**
 * 워크스페이스 수정
 */
export async function updateWorkspace(
  id: string,
  request: UpdateWorkspaceRequest
): Promise<Workspace> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workspaces/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update workspace');
  }

  const data = await response.json();
  return data.workspace || data;
}

/**
 * 워크스페이스 삭제
 */
export async function deleteWorkspace(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workspaces/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete workspace');
  }
}

// ============================================================================
// Mock Functions (Development용)
// ============================================================================

/**
 * Mock 워크스페이스 목록 (Backend 없을 때 사용)
 */
export function getMockWorkspaces(): Workspace[] {
  return [
    {
      id: 'ws-1',
      name: '스타트업 A',
      industry: 'IT/소프트웨어',
      websiteUrl: 'https://example.com',
      description: '혁신적인 스타트업',
      createdAt: '2025-11-01T00:00:00Z',
      updatedAt: '2025-11-01T00:00:00Z',
    },
    {
      id: 'ws-2',
      name: '패션 브랜드 B',
      industry: '패션/뷰티',
      websiteUrl: 'https://fashion.example.com',
      createdAt: '2025-11-10T00:00:00Z',
      updatedAt: '2025-11-10T00:00:00Z',
    },
  ];
}

/**
 * Mock 워크스페이스 생성
 */
export function createMockWorkspace(request: CreateWorkspaceRequest): Workspace {
  return {
    id: `ws-${Date.now()}`,
    ...request,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
