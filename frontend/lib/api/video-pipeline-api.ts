/**
 * Video Pipeline V2 API Client
 *
 * B팀 백엔드 Video Pipeline V2 API와 통신하는 클라이언트
 *
 * Backend API:
 * - POST /api/v1/video6/projects - 프로젝트 생성
 * - POST /api/v1/video6/{project_id}/plan - PLAN 모드 실행
 * - PUT /api/v1/video6/{project_id}/plan - 유저 수정본 저장
 * - POST /api/v1/video6/{project_id}/render - RENDER 모드 실행
 * - GET /api/v1/video6/{project_id}/status - 상태 조회
 * - GET /api/v1/video6/{project_id}/assets - Asset Pool 조회
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-29
 */

import type {
  VideoGenerationMode,
  VideoPlanDraftV1,
  SceneDraft,
  VideoProjectStatus,
  AssetPoolItem,
} from '@/types/video-pipeline';

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

export class VideoPipelineError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'VideoPipelineError';
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

    throw new VideoPipelineError(
      errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * 프로젝트 생성 요청
 *
 * NOTE: B팀 백엔드 API는 brand_id를 필수로 요구합니다.
 * topic/mode는 /plan 엔드포인트에서 전달합니다.
 */
export interface CreateProjectRequest {
  topic: string;
  mode: VideoGenerationMode;
  selected_asset_ids?: string[]; // REUSE/HYBRID 모드에서 선택한 에셋
  user_preferences?: {
    target_duration?: number; // 초
    music_mood?: string;
    language?: string;
  };
  // 백엔드 필수 필드 (임시 해결)
  brand_id?: string;
  name?: string;
}

/**
 * 프로젝트 생성 응답
 *
 * NOTE: 백엔드는 video_project_id를 반환하지만, 프론트엔드는 project_id로 사용
 */
export interface CreateProjectResponse {
  project_id: string;  // 프론트엔드 사용
  video_project_id?: string;  // 백엔드 응답 (project_id로 매핑됨)
  status: VideoProjectStatus;
  created_at: string;
}

/**
 * PLAN 모드 응답
 *
 * NOTE: 백엔드는 plan_draft를 반환하지만, 프론트엔드는 plan으로 사용
 */
export interface PlanResponse {
  project_id: string;
  plan: VideoPlanDraftV1;
  status: VideoProjectStatus;
}

// 백엔드 실제 응답 형식
interface BackendPlanResponse {
  project_id: string;
  plan_draft: VideoPlanDraftV1;
  estimated_render_cost?: number;
  estimated_render_time_sec?: number;
}

/**
 * RENDER 모드 응답
 */
export interface RenderResponse {
  project_id: string;
  status: VideoProjectStatus;
  video_url?: string;
  error?: string;
}

/**
 * 프로젝트 상태 응답
 */
export interface ProjectStatusResponse {
  project_id: string;
  status: VideoProjectStatus;
  progress?: number; // 0-100
  current_step?: string;
  plan?: VideoPlanDraftV1;
  video_url?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Asset Pool 응답
 */
export interface AssetPoolResponse {
  assets: AssetPoolItem[];
  total: number;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * 비디오 프로젝트 생성
 *
 * @example
 * const project = await createVideoProject({
 *   topic: '핸드크림 광고',
 *   mode: 'hybrid',
 *   selected_asset_ids: ['asset-1', 'asset-2'],
 * });
 */
export async function createVideoProject(
  request: CreateProjectRequest
): Promise<CreateProjectResponse> {
  const url = `${API_BASE_URL}${VIDEO_PIPELINE_BASE}/projects`;

  console.log('[VideoPipelineAPI] Creating project:', {
    topic: request.topic,
    mode: request.mode,
    assetCount: request.selected_asset_ids?.length || 0,
  });

  // 백엔드 API 형식에 맞게 변환
  // NOTE: B팀 API는 brand_id를 필수로 요구함 (topic, mode는 /plan에서 전달)
  // 테스트용 brand_id 사용 (B팀이 DB에 추가함)
  const TEST_BRAND_ID = '00000000-0000-0000-0000-000000000001';

  const backendRequest = {
    brand_id: request.brand_id || TEST_BRAND_ID,
    name: request.name || request.topic, // topic을 name으로 사용
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(backendRequest),
  });

  const data = await handleResponse<any>(response);

  // 백엔드 응답 형식을 프론트엔드 형식으로 변환
  return {
    project_id: data.video_project_id || data.project_id,
    status: data.status,
    created_at: data.created_at,
  };
}

/**
 * PLAN 모드 실행 (LLM으로 플랜 생성)
 *
 * @example
 * const planResult = await executePlanMode('project-123');
 * // 유저가 planResult.plan을 수정 후 savePlanDraft 호출
 */
/**
 * PLAN 모드 실행 요청
 */
export interface ExecutePlanRequest {
  mode?: VideoGenerationMode;
  concept_board_id?: string;
  available_assets?: string[];
  total_duration_sec?: number;
  music_mood?: string;
  override_story?: string;
}

export async function executePlanMode(
  projectId: string,
  options?: ExecutePlanRequest
): Promise<PlanResponse> {
  const url = `${API_BASE_URL}${VIDEO_PIPELINE_BASE}/${projectId}/plan`;

  // 백엔드는 VideoPlanRequest body를 필수로 요구함
  // null/undefined 값을 제외하고 기본값 적용
  const requestBody: ExecutePlanRequest = {
    mode: options?.mode ?? 'creative',
    total_duration_sec: options?.total_duration_sec ?? 15.0,
    music_mood: options?.music_mood ?? 'warm_lofi',
    concept_board_id: options?.concept_board_id,
    available_assets: options?.available_assets,
    override_story: options?.override_story,
  };

  console.log('[VideoPipelineAPI] Executing PLAN mode:', { projectId, ...requestBody });

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(requestBody),
  });

  const data = await handleResponse<BackendPlanResponse>(response);

  // 백엔드 응답 형식(plan_draft)을 프론트엔드 형식(plan)으로 변환
  return {
    project_id: data.project_id,
    plan: data.plan_draft,
    status: 'plan_ready' as VideoProjectStatus,
  };
}

/**
 * 유저 수정 플랜 저장
 *
 * @example
 * await savePlanDraft('project-123', modifiedPlan);
 */
export async function savePlanDraft(
  projectId: string,
  plan: VideoPlanDraftV1
): Promise<PlanResponse> {
  const url = `${API_BASE_URL}${VIDEO_PIPELINE_BASE}/${projectId}/plan`;

  console.log('[VideoPipelineAPI] Saving plan draft:', {
    projectId,
    sceneCount: plan.scenes.length,
  });

  const response = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ plan }),
  });

  return handleResponse<PlanResponse>(response);
}

/**
 * RENDER 모드 실행 (영상 생성)
 *
 * @example
 * const renderResult = await executeRenderMode('project-123');
 * // 폴링으로 상태 확인 또는 WebSocket으로 진행률 받기
 */
export async function executeRenderMode(
  projectId: string
): Promise<RenderResponse> {
  const url = `${API_BASE_URL}${VIDEO_PIPELINE_BASE}/${projectId}/render`;

  console.log('[VideoPipelineAPI] Executing RENDER mode:', { projectId });

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
  });

  return handleResponse<RenderResponse>(response);
}

/**
 * 프로젝트 상태 조회
 *
 * @example
 * const status = await getProjectStatus('project-123');
 * if (status.status === 'completed') {
 *   console.log('Video URL:', status.video_url);
 * }
 */
export async function getProjectStatus(
  projectId: string
): Promise<ProjectStatusResponse> {
  const url = `${API_BASE_URL}${VIDEO_PIPELINE_BASE}/${projectId}/status`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  return handleResponse<ProjectStatusResponse>(response);
}

/**
 * Asset Pool 조회 (REUSE/HYBRID 모드용)
 *
 * @example
 * const assets = await getAssetPool('project-123');
 * // 유저가 assets 중에서 선택
 */
export async function getAssetPool(
  projectId: string
): Promise<AssetPoolResponse> {
  const url = `${API_BASE_URL}${VIDEO_PIPELINE_BASE}/${projectId}/assets`;

  console.log('[VideoPipelineAPI] Getting asset pool:', { projectId });

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  return handleResponse<AssetPoolResponse>(response);
}

// ============================================================================
// Polling Utilities
// ============================================================================

export interface PollOptions {
  interval?: number; // 폴링 간격 (ms), 기본 2000
  timeout?: number; // 최대 대기 시간 (ms), 기본 300000 (5분)
  onProgress?: (status: ProjectStatusResponse) => void;
}

/**
 * 렌더링 완료까지 폴링
 *
 * @example
 * const result = await pollUntilComplete('project-123', {
 *   interval: 3000,
 *   onProgress: (status) => console.log(`${status.progress}%`),
 * });
 */
export async function pollUntilComplete(
  projectId: string,
  options: PollOptions = {}
): Promise<ProjectStatusResponse> {
  const { interval = 2000, timeout = 300000, onProgress } = options;
  const startTime = Date.now();

  while (true) {
    const status = await getProjectStatus(projectId);

    // 진행률 콜백
    if (onProgress) {
      onProgress(status);
    }

    // 완료 또는 실패 시 반환
    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }

    // 타임아웃 체크
    if (Date.now() - startTime > timeout) {
      throw new VideoPipelineError(
        `렌더링 타임아웃: ${timeout / 1000}초 초과`,
        undefined,
        { projectId, lastStatus: status }
      );
    }

    // 대기
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

// ============================================================================
// Error Message Utilities
// ============================================================================

/**
 * 에러 메시지 사용자 친화적으로 변환
 */
export function getVideoPipelineErrorMessage(error: any): string {
  if (error instanceof VideoPipelineError) {
    if (error.statusCode === 401) return '인증이 필요합니다. 다시 로그인해주세요.';
    if (error.statusCode === 403) return '권한이 없습니다.';
    if (error.statusCode === 404) return '프로젝트를 찾을 수 없습니다.';
    if (error.statusCode === 429) return 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
    if (error.statusCode === 500) return '서버 오류가 발생했습니다.';
    if (error.statusCode === 503) return '서비스를 일시적으로 사용할 수 없습니다.';
    return error.message;
  }

  if (error.message) {
    return error.message;
  }

  return '비디오 생성 중 알 수 없는 오류가 발생했습니다.';
}
