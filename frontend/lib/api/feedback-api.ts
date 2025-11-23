/**
 * Feedback API
 *
 * 사용자 피드백 제출 및 조회 API
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 * @reference TEAM_TODOS_2025-11-23.md P2-6
 */

import type { FeedbackData } from '@/components/canvas-studio/components/FeedbackCollector';

// ============================================================================
// Types
// ============================================================================

export interface FeedbackSubmitRequest {
  rating: number;
  improvement_request?: string;
  target_type: 'ad_copy' | 'content_plan' | 'other';
  target_id?: string;
  target_data?: any;
  session_id?: string;
}

export interface FeedbackSubmitResponse {
  success: boolean;
  feedback_id?: string;
  message?: string;
}

export interface FeedbackStatsResponse {
  total_count: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  common_issues: Array<{
    issue: string;
    count: number;
  }>;
}

// ============================================================================
// API Functions
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://100.123.51.5:8000';

/**
 * 피드백 제출
 */
export async function submitFeedback(feedback: FeedbackData): Promise<FeedbackSubmitResponse> {
  const request: FeedbackSubmitRequest = {
    rating: feedback.rating,
    improvement_request: feedback.improvementRequest,
    target_type: feedback.targetType,
    target_id: feedback.targetId,
    target_data: feedback.targetData,
    session_id: feedback.sessionId,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      feedback_id: data.feedback_id,
      message: data.message,
    };
  } catch (error) {
    console.error('[submitFeedback] 피드백 제출 실패:', error);

    // 로컬 스토리지에 임시 저장 (나중에 재시도)
    saveFeedbackLocally(feedback);

    throw error;
  }
}

/**
 * 피드백 통계 조회
 */
export async function getFeedbackStats(
  targetType?: 'ad_copy' | 'content_plan' | 'other'
): Promise<FeedbackStatsResponse> {
  try {
    const params = new URLSearchParams();
    if (targetType) {
      params.append('target_type', targetType);
    }

    const url = `${API_BASE_URL}/api/v1/feedback/stats${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[getFeedbackStats] 통계 조회 실패:', error);
    throw error;
  }
}

/**
 * 특정 대상에 대한 피드백 목록 조회
 */
export async function getFeedbackByTarget(
  targetType: string,
  targetId: string
): Promise<FeedbackData[]> {
  try {
    const url = `${API_BASE_URL}/api/v1/feedback/${targetType}/${targetId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.feedbacks || [];
  } catch (error) {
    console.error('[getFeedbackByTarget] 피드백 조회 실패:', error);
    throw error;
  }
}

// ============================================================================
// Local Storage Helpers
// ============================================================================

const STORAGE_KEY = 'sparklio_pending_feedback';

/**
 * 로컬 스토리지에 피드백 임시 저장
 * - 네트워크 오류 시 나중에 재시도하기 위함
 */
function saveFeedbackLocally(feedback: FeedbackData): void {
  if (typeof window === 'undefined') return;

  try {
    const pending = getPendingFeedback();
    pending.push(feedback);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
    console.log('[saveFeedbackLocally] 피드백을 로컬에 저장했습니다.');
  } catch (error) {
    console.error('[saveFeedbackLocally] 로컬 저장 실패:', error);
  }
}

/**
 * 로컬 스토리지에서 대기 중인 피드백 조회
 */
export function getPendingFeedback(): FeedbackData[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[getPendingFeedback] 조회 실패:', error);
    return [];
  }
}

/**
 * 로컬 스토리지의 대기 중인 피드백 전송 시도
 */
export async function retryPendingFeedback(): Promise<void> {
  const pending = getPendingFeedback();

  if (pending.length === 0) {
    return;
  }

  console.log(`[retryPendingFeedback] ${pending.length}개 피드백 재전송 시도...`);

  const succeeded: number[] = [];

  for (let i = 0; i < pending.length; i++) {
    try {
      await submitFeedback(pending[i]);
      succeeded.push(i);
      console.log(`[retryPendingFeedback] 피드백 ${i + 1} 전송 성공`);
    } catch (error) {
      console.error(`[retryPendingFeedback] 피드백 ${i + 1} 전송 실패:`, error);
    }
  }

  // 성공한 피드백 제거
  if (succeeded.length > 0) {
    const remaining = pending.filter((_, index) => !succeeded.includes(index));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    console.log(`[retryPendingFeedback] ${succeeded.length}개 전송 완료, ${remaining.length}개 남음`);
  }
}

// ============================================================================
// Auto-retry on Page Load
// ============================================================================

/**
 * 페이지 로드 시 자동으로 대기 중인 피드백 재전송 시도
 */
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // 1초 후 재시도 (페이지 로드 완료 후)
    setTimeout(() => {
      retryPendingFeedback().catch((error) => {
        console.error('[Auto-retry] 실패:', error);
      });
    }, 1000);
  });
}
