/**
 * Video Pipeline V2 - 4단계 확인 플로우 API Client
 *
 * B팀 요청서(B_TEAM_REQUEST_VIDEO_PIPELINE_V2_2025-12-01.md) 기반
 *
 * 추가 엔드포인트:
 * - POST /api/v1/video6/{id}/script/approve - Step 1 승인
 * - POST /api/v1/video6/{id}/images/generate - Step 2 실행
 * - POST /api/v1/video6/{id}/images/approve - Step 2 승인
 * - POST /api/v1/video6/{id}/images/regenerate - 이미지 재생성
 * - POST /api/v1/video6/{id}/motion/generate - Step 3 실행
 * - POST /api/v1/video6/{id}/motion/approve - Step 3 승인
 * - POST /api/v1/video6/{id}/motion/regenerate - 모션 재생성
 * - POST /api/v1/video6/{id}/render (render_mode, dry_run) - Step 4 실행
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-01
 */

import type {
  VideoProjectStatusV2,
  RenderMode,
  VideoPlanDraftV2,
  VideoRenderResponse,
  ScriptApproveRequest,
  ImagesRegenerateRequest,
  ImagesApproveRequest,
  MotionApproveRequest,
  MotionRegenerateRequest,
  CostGuardError,
} from '@/types/video-pipeline-v2';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const VIDEO_PIPELINE_BASE = '/api/v1/video6';

/**
 * 인증 토큰 가져오기
 */
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

/**
 * API 헤더 생성
 */
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// ============================================================================
// Error Handling
// ============================================================================

export class VideoPipelineV2Error extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string,
    public details?: CostGuardError | any
  ) {
    super(message);
    this.name = 'VideoPipelineV2Error';
  }
}

/**
 * API 응답 처리
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorData: any = {};
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }

    // cost_limit_exceeded 에러 특별 처리
    if (errorData.error_code === 'cost_limit_exceeded') {
      throw new VideoPipelineV2Error(
        errorData.message || '일일 비용 한도를 초과했습니다.',
        response.status,
        errorData.error_code,
        {
          error_code: errorData.error_code,
          message: errorData.message,
          daily_cost_used: errorData.daily_cost_used,
          daily_cost_limit: errorData.daily_cost_limit,
        } as CostGuardError
      );
    }

    throw new VideoPipelineV2Error(
      errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData.error_code,
      errorData
    );
  }

  return response.json();
}

// ============================================================================
// Response Types
// ============================================================================

export interface StepResponse {
  status: VideoProjectStatusV2;
  plan?: VideoPlanDraftV2;
}

export interface ProjectStatusV2Response {
  project_id: string;
  status: VideoProjectStatusV2;
  progress?: number;
  current_step?: string;
  plan?: VideoPlanDraftV2;
  video_url?: string;
  error?: string;
  error_code?: string;
  daily_cost_used?: number;
  daily_cost_limit?: number;
}

// ============================================================================
// Step 1: Script APIs
// ============================================================================

/**
 * Step 1: 스크립트 승인
 * POST /api/v1/video6/{id}/script/approve
 */
export async function approveScript(
  projectId: string,
  request: ScriptApproveRequest
): Promise<StepResponse> {
  const url = `${API_BASE_URL}${VIDEO_PIPELINE_BASE}/${projectId}/script/approve`;

  console.log('[VideoPipelineAPI V2] Approving script:', { projectId });

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  return handleResponse(response);
}

// ============================================================================
// Step 2: Images APIs
// ============================================================================

/**
 * Step 2: 이미지 생성
 * POST /api/v1/video6/{id}/images/generate
 */
export async function generateImages(
  projectId: string
): Promise<StepResponse> {
  const url = `${API_BASE_URL}${VIDEO_PIPELINE_BASE}/${projectId}/images/generate`;

  console.log('[VideoPipelineAPI V2] Generating images:', { projectId });

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
  });

  return handleResponse(response);
}

/**
 * Step 2: 이미지 재생성
 * POST /api/v1/video6/{id}/images/regenerate
 */
export async function regenerateImages(
  projectId: string,
  request: ImagesRegenerateRequest
): Promise<StepResponse> {
  const url = `${API_BASE_URL}${VIDEO_PIPELINE_BASE}/${projectId}/images/regenerate`;

  console.log('[VideoPipelineAPI V2] Regenerating images:', {
    projectId,
    sceneCount: request.scene_indices.length,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  return handleResponse(response);
}

/**
 * Step 2: 이미지 승인
 * POST /api/v1/video6/{id}/images/approve
 */
export async function approveImages(
  projectId: string,
  request?: ImagesApproveRequest
): Promise<StepResponse> {
  const url = `${API_BASE_URL}${VIDEO_PIPELINE_BASE}/${projectId}/images/approve`;

  console.log('[VideoPipelineAPI V2] Approving images:', { projectId });

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: request ? JSON.stringify(request) : undefined,
  });

  return handleResponse(response);
}

// ============================================================================
// Step 3: Motion APIs
// ============================================================================

/**
 * Step 3: 모션 프롬프트 생성
 * POST /api/v1/video6/{id}/motion/generate
 */
export async function generateMotion(
  projectId: string
): Promise<StepResponse> {
  const url = `${API_BASE_URL}${VIDEO_PIPELINE_BASE}/${projectId}/motion/generate`;

  console.log('[VideoPipelineAPI V2] Generating motion:', { projectId });

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
  });

  return handleResponse(response);
}

/**
 * Step 3: 모션 프롬프트 재생성
 * POST /api/v1/video6/{id}/motion/regenerate
 */
export async function regenerateMotion(
  projectId: string,
  request: MotionRegenerateRequest
): Promise<StepResponse> {
  const url = `${API_BASE_URL}${VIDEO_PIPELINE_BASE}/${projectId}/motion/regenerate`;

  console.log('[VideoPipelineAPI V2] Regenerating motion:', {
    projectId,
    sceneCount: request.scene_indices.length,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  return handleResponse(response);
}

/**
 * Step 3: 모션 프롬프트 승인
 * POST /api/v1/video6/{id}/motion/approve
 */
export async function approveMotion(
  projectId: string,
  request?: MotionApproveRequest
): Promise<StepResponse> {
  const url = `${API_BASE_URL}${VIDEO_PIPELINE_BASE}/${projectId}/motion/approve`;

  console.log('[VideoPipelineAPI V2] Approving motion:', { projectId });

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: request ? JSON.stringify(request) : undefined,
  });

  return handleResponse(response);
}

// ============================================================================
// Step 4: Render APIs
// ============================================================================

/**
 * Step 4: 렌더 비용 확인 (dry_run=true)
 * POST /api/v1/video6/{id}/render
 */
export async function getCostEstimate(
  projectId: string,
  renderMode: RenderMode
): Promise<VideoRenderResponse> {
  const url = `${API_BASE_URL}${VIDEO_PIPELINE_BASE}/${projectId}/render`;

  console.log('[VideoPipelineAPI V2] Getting cost estimate:', {
    projectId,
    renderMode,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      render_mode: renderMode,
      dry_run: true,
    }),
  });

  return handleResponse(response);
}

/**
 * Step 4: 렌더 실행 (dry_run=false)
 * POST /api/v1/video6/{id}/render
 */
export async function startRender(
  projectId: string,
  renderMode: RenderMode,
  planDraft?: VideoPlanDraftV2
): Promise<VideoRenderResponse> {
  const url = `${API_BASE_URL}${VIDEO_PIPELINE_BASE}/${projectId}/render`;

  console.log('[VideoPipelineAPI V2] Starting render:', {
    projectId,
    renderMode,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      render_mode: renderMode,
      dry_run: false,
      plan_draft: planDraft,
    }),
  });

  return handleResponse(response);
}

// ============================================================================
// Status API
// ============================================================================

/**
 * 4단계 플로우 상태 조회
 * GET /api/v1/video6/{id}/status
 */
export async function getProjectStatusV2(
  projectId: string
): Promise<ProjectStatusV2Response> {
  const url = `${API_BASE_URL}${VIDEO_PIPELINE_BASE}/${projectId}/status`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  return handleResponse(response);
}

// ============================================================================
// Polling Utilities
// ============================================================================

export interface PollOptionsV2 {
  interval?: number;
  timeout?: number;
  onProgress?: (status: ProjectStatusV2Response) => void;
  stopOnStatus?: VideoProjectStatusV2[];
}

/**
 * 특정 상태까지 폴링
 */
export async function pollUntilStatus(
  projectId: string,
  targetStatuses: VideoProjectStatusV2[],
  options: PollOptionsV2 = {}
): Promise<ProjectStatusV2Response> {
  const { interval = 2000, timeout = 300000, onProgress } = options;
  const startTime = Date.now();

  while (true) {
    const status = await getProjectStatusV2(projectId);

    if (onProgress) {
      onProgress(status);
    }

    // 목표 상태 도달
    if (targetStatuses.includes(status.status)) {
      return status;
    }

    // 실패 시 즉시 반환
    if (status.status === 'failed') {
      return status;
    }

    // 타임아웃
    if (Date.now() - startTime > timeout) {
      throw new VideoPipelineV2Error(
        `타임아웃: ${timeout / 1000}초 초과`,
        undefined,
        'timeout',
        { projectId, lastStatus: status }
      );
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * V2 에러 메시지 변환
 */
export function getV2ErrorMessage(error: any): string {
  if (error instanceof VideoPipelineV2Error) {
    if (error.errorCode === 'cost_limit_exceeded') {
      const details = error.details as CostGuardError;
      return `일일 비용 한도를 초과했습니다. (사용: $${details.daily_cost_used?.toFixed(2)} / 한도: $${details.daily_cost_limit?.toFixed(2)})`;
    }
    if (error.errorCode === 'image_safety_blocked') return '이미지가 안전 정책에 의해 차단되었습니다.';
    if (error.errorCode === 'video_provider_timeout') return '영상 생성 서비스 응답 시간이 초과되었습니다.';
    if (error.errorCode === 'provider_rate_limited') return 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
    if (error.statusCode === 401) return '인증이 필요합니다.';
    if (error.statusCode === 403) return '권한이 없습니다.';
    if (error.statusCode === 404) return '프로젝트를 찾을 수 없습니다.';
    return error.message;
  }

  return error?.message || '알 수 없는 오류가 발생했습니다.';
}

/**
 * CostGuardError 여부 확인
 */
export function isCostLimitError(error: any): error is VideoPipelineV2Error {
  return error instanceof VideoPipelineV2Error && error.errorCode === 'cost_limit_exceeded';
}
