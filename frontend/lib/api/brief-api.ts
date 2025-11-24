/**
 * Brief API
 *
 * 캠페인 브리프 CRUD API
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 1.3.3
 */

import type {
  Brief,
  CreateBriefRequest,
  UpdateBriefRequest,
  OptimizeBriefFieldRequest,
  OptimizeBriefFieldResponse,
  CreateBriefFromMeetingRequest,
} from '@/types/brief';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// ============================================================================
// API Functions
// ============================================================================

/**
 * 프로젝트의 브리프 조회
 */
export async function getBrief(projectId: string): Promise<Brief | null> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/projects/${projectId}/brief`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (response.status === 404) {
    return null; // 브리프가 없음
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch brief: ${response.statusText}`);
  }

  const data = await response.json();
  return data.brief || data;
}

/**
 * 브리프 생성
 */
export async function createBrief(request: CreateBriefRequest): Promise<Brief> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/projects/${request.projectId}/brief`,
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
    throw new Error(error.message || 'Failed to create brief');
  }

  const data = await response.json();
  return data.brief || data;
}

/**
 * 브리프 수정
 */
export async function updateBrief(
  id: string,
  request: UpdateBriefRequest
): Promise<Brief> {
  const response = await fetch(`${API_BASE_URL}/api/v1/briefs/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update brief');
  }

  const data = await response.json();
  return data.brief || data;
}

/**
 * 브리프 삭제
 */
export async function deleteBrief(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/briefs/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete brief');
  }
}

/**
 * 브리프 필드 최적화 (Strategist 연동)
 */
export async function optimizeBriefField(
  request: OptimizeBriefFieldRequest
): Promise<OptimizeBriefFieldResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/briefs/${request.briefId}/optimize-field`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        field: request.field,
        currentValue: request.currentValue,
        brandContext: request.brandContext,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    return {
      status: 'failed',
      error: {
        message: error.message || 'Failed to optimize brief field',
        details: error,
      },
    };
  }

  const data = await response.json();
  return data;
}

/**
 * Meeting에서 브리프 생성
 */
export async function createBriefFromMeeting(
  request: CreateBriefFromMeetingRequest
): Promise<Brief> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/meetings/${request.meetingId}/create-brief`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: request.projectId,
        additionalContext: request.additionalContext,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create brief from meeting');
  }

  const data = await response.json();
  return data.brief || data;
}

// ============================================================================
// Mock Functions
// ============================================================================

/**
 * Mock 브리프 조회
 */
export function getMockBrief(projectId: string): Brief {
  return {
    id: `brief-${projectId}`,
    projectId,
    goal: '신제품 런칭을 성공적으로 알리고 초기 사용자 1,000명 확보',
    target: '20-30대 IT 얼리어답터, 혁신적인 제품에 관심이 많은 사용자',
    insight: '타겟 사용자들은 제품의 기능보다 "어떻게 내 삶을 바꿀 수 있는지"에 더 관심이 많음',
    keyMessages: [
      '당신의 일상을 더 스마트하게',
      '복잡함은 빼고, 편리함만 더했습니다',
      '지금 바로 시작하세요',
    ],
    channels: ['product_detail', 'sns', 'banner'],
    budget: 50000000,
    startDate: '2025-12-01',
    endDate: '2026-02-28',
    kpis: [
      '런칭 1개월 내 사용자 1,000명 확보',
      'SNS 도달 100만 회',
      '제품 페이지 방문자 10만 명',
    ],
    notes: '경쟁사 대비 차별화 포인트를 강조할 것',
    createdAt: '2025-11-01T00:00:00Z',
    updatedAt: '2025-11-20T00:00:00Z',
  };
}

/**
 * Mock 브리프 생성
 */
export function createMockBrief(request: CreateBriefRequest): Brief {
  return {
    id: `brief-${Date.now()}`,
    ...request,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Mock 브리프 필드 최적화
 */
export async function optimizeMockBriefField(
  request: OptimizeBriefFieldRequest
): Promise<OptimizeBriefFieldResponse> {
  // 간단한 Mock 응답
  await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 딜레이

  const suggestions: Record<string, any> = {
    goal: '신제품 런칭을 통해 초기 사용자 1,000명을 확보하고, 브랜드 인지도를 20% 향상시킵니다',
    target: '20-30대 IT 얼리어답터, 특히 업무 효율성을 중시하는 직장인',
    insight:
      '타겟 사용자들은 단순히 새로운 기능보다는 "시간 절약"과 "스트레스 감소"라는 실질적 가치에 더 큰 관심을 보입니다',
  };

  return {
    status: 'success',
    suggestedValue: suggestions[request.field] || request.currentValue,
    reason: '브랜드 톤과 타겟 오디언스에 맞게 최적화했습니다',
    alternatives: [],
  };
}
