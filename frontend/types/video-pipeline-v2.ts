/**
 * Video Pipeline V2 - 4단계 확인 플로우 타입 정의
 *
 * B팀 요청서(B_TEAM_REQUEST_VIDEO_PIPELINE_V2_2025-12-01.md) 기반
 * 작성일: 2025-12-01
 * 작성자: C팀 (Frontend)
 *
 * 기존 video-pipeline.ts의 타입을 확장하여 4단계 플로우를 지원합니다.
 */

import type { VideoPlanDraftV1, VideoGenerationMode, ScriptStatus } from './video-pipeline';

// ============================================================================
// 4단계 확인 플로우 상태 타입 (신규)
// ============================================================================

/**
 * VideoProjectStatus - B팀 4단계 확인 플로우 지원
 *
 * 플로우:
 * Step 1: 스크립트 → 유저 확인/수정 → 승인
 * Step 2: 이미지 생성 → 유저 확인/수정/재생성 → 승인
 * Step 3: 모션 프롬프트 → 유저 확인/수정 → 승인
 * Step 4: 렌더링 (비용 발생)
 */
export type VideoProjectStatusV2 =
  | 'not_started'
  | 'planning'
  | 'script_ready'        // Step 1 완료: 스크립트 확인 대기
  | 'script_approved'     // Step 1 승인: 이미지 생성 가능
  | 'generating_images'
  | 'images_ready'        // Step 2 완료: 이미지 확인 대기
  | 'images_approved'     // Step 2 승인: 모션 생성 가능
  | 'generating_motion'
  | 'motion_ready'        // Step 3 완료: 모션 확인 대기
  | 'motion_approved'     // Step 3 승인: 렌더 가능
  | 'render_queued'       // Step 4 대기
  | 'rendering'           // Step 4 진행
  | 'completed'
  | 'failed';

/**
 * RenderMode - Mock vs Real 렌더링
 */
export type RenderMode = 'mock' | 'real';

/**
 * VideoRenderError - 에러 코드
 */
export type VideoRenderError =
  | 'image_safety_blocked'
  | 'video_provider_timeout'
  | 'cost_limit_exceeded'
  | 'credit_insufficient'
  | 'provider_rate_limited'
  | 'provider_unavailable'
  | 'invalid_motion_prompt'
  | 'missing_images'
  | 'missing_motion_prompt'
  | 'internal_error';

/**
 * ImageApprovalStatus - 이미지 승인 상태
 */
export type ImageApprovalStatus = 'pending' | 'generated' | 'approved' | 'rejected' | 'regenerating';

// ============================================================================
// SceneDraft 확장 (4단계 플로우 지원)
// ============================================================================

/**
 * SceneDraftV2 - 4단계 플로우 필드 포함
 */
export interface SceneDraftV2 {
  scene_index: number;
  image_id?: string;
  image_url?: string;
  caption: string;
  script?: string;  // Step 1: 씬별 스크립트
  duration_sec: number;
  generate_new_image: boolean;
  image_prompt?: string;
  // Step 2: 이미지 승인 관련
  image_approval_status: ImageApprovalStatus;
  regenerate_reason?: string;
  generation_attempts: number;
  // Step 3: 모션 프롬프트
  motion_prompt?: string;
  motion_prompt_ko?: string;
  use_ai_video: boolean;
  // URL
  original_url?: string;
  preview_url?: string;
  thumb_url?: string;
}

/**
 * VideoPlanDraftV2 - 4단계 플로우 지원
 */
export interface VideoPlanDraftV2 {
  version: string;
  project_id: string;
  mode: VideoGenerationMode;
  total_duration_sec: number;
  music_mood: string;
  scenes: SceneDraftV2[];
  script_status: ScriptStatus;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * POST /api/v1/video6/{id}/render 요청
 */
export interface VideoRenderRequest {
  plan_draft: VideoPlanDraftV2;
  render_mode: RenderMode;
  dry_run: boolean;
}

/**
 * POST /api/v1/video6/{id}/render 응답
 */
export interface VideoRenderResponse {
  job_id: string;
  status: VideoProjectStatusV2;
  render_mode: RenderMode;
  estimated_time_sec?: number;
  estimated_cost?: number;
  dry_run: boolean;
  cost_breakdown?: Record<string, number>;
  daily_cost_used?: number;
  daily_cost_limit?: number;
}

/**
 * Step 1: 스크립트 승인 요청
 * POST /api/v1/video6/{id}/script/approve
 */
export interface ScriptApproveRequest {
  plan_draft: VideoPlanDraftV2;
}

/**
 * Step 2: 이미지 재생성 요청
 * POST /api/v1/video6/{id}/images/regenerate
 */
export interface ImagesRegenerateRequest {
  scene_indices: number[];
  reasons?: Record<number, string>;
}

/**
 * Step 2: 이미지 승인 요청
 * POST /api/v1/video6/{id}/images/approve
 */
export interface ImagesApproveRequest {
  approved_scene_indices: number[];
}

/**
 * Step 3: 모션 승인 요청
 * POST /api/v1/video6/{id}/motion/approve
 */
export interface MotionApproveRequest {
  plan_draft: VideoPlanDraftV2;
}

/**
 * Step 3: 모션 재생성 요청
 * POST /api/v1/video6/{id}/motion/regenerate
 */
export interface MotionRegenerateRequest {
  scene_indices: number[];
}

// ============================================================================
// Cost Guard 에러 타입
// ============================================================================

/**
 * 비용 한도 초과 에러
 */
export interface CostGuardError {
  error_code: VideoRenderError;
  message: string;
  daily_cost_used: number;
  daily_cost_limit: number;
}

/**
 * 에러 코드별 사용자 메시지
 */
export const VIDEO_RENDER_ERROR_MESSAGES: Record<VideoRenderError, string> = {
  image_safety_blocked: '이미지가 안전 정책에 의해 차단되었습니다.',
  video_provider_timeout: '영상 생성 서비스 응답 시간이 초과되었습니다.',
  cost_limit_exceeded: '일일 비용 한도를 초과했습니다.',
  credit_insufficient: '크레딧이 부족합니다.',
  provider_rate_limited: 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
  provider_unavailable: '영상 생성 서비스를 일시적으로 사용할 수 없습니다.',
  invalid_motion_prompt: '모션 프롬프트가 유효하지 않습니다.',
  missing_images: '이미지가 누락되었습니다.',
  missing_motion_prompt: '모션 프롬프트가 누락되었습니다.',
  internal_error: '내부 오류가 발생했습니다.',
};

// ============================================================================
// UI State Types
// ============================================================================

/**
 * 4단계 플로우 단계 정의
 */
export type VideoFlowStep = 'script' | 'images' | 'motion' | 'render';

/**
 * 4단계 플로우 UI 상태
 */
export interface VideoFlowState {
  currentStep: VideoFlowStep;
  completedSteps: VideoFlowStep[];
  status: VideoProjectStatusV2;
}

/**
 * 렌더링 진행 상태
 */
export interface RenderProgressStateV2 {
  status: VideoProjectStatusV2;
  progress: number;
  estimatedTimeRemaining?: string;
  currentStep?: string;
  startedAt?: Date;
}

/**
 * 4단계 플로우 스텝 정보
 */
export const VIDEO_FLOW_STEPS: Array<{
  step: VideoFlowStep;
  label: string;
  description: string;
}> = [
  { step: 'script', label: '스크립트', description: '씬별 스크립트 확인 및 수정' },
  { step: 'images', label: '이미지', description: '생성된 이미지 확인 및 재생성' },
  { step: 'motion', label: '모션', description: '모션 프롬프트 확인 및 수정' },
  { step: 'render', label: '렌더', description: '비용 확인 후 영상 생성' },
];

/**
 * VideoProjectStatusV2 → VideoFlowStep 매핑
 */
export function getFlowStepFromStatus(status: VideoProjectStatusV2): VideoFlowStep {
  switch (status) {
    case 'not_started':
    case 'planning':
    case 'script_ready':
    case 'script_approved':
      return 'script';
    case 'generating_images':
    case 'images_ready':
    case 'images_approved':
      return 'images';
    case 'generating_motion':
    case 'motion_ready':
    case 'motion_approved':
      return 'motion';
    case 'render_queued':
    case 'rendering':
    case 'completed':
    case 'failed':
      return 'render';
    default:
      return 'script';
  }
}

/**
 * 완료된 단계 목록 반환
 */
export function getCompletedSteps(status: VideoProjectStatusV2): VideoFlowStep[] {
  const completed: VideoFlowStep[] = [];

  if (['script_approved', 'generating_images', 'images_ready', 'images_approved',
       'generating_motion', 'motion_ready', 'motion_approved',
       'render_queued', 'rendering', 'completed'].includes(status)) {
    completed.push('script');
  }

  if (['images_approved', 'generating_motion', 'motion_ready', 'motion_approved',
       'render_queued', 'rendering', 'completed'].includes(status)) {
    completed.push('images');
  }

  if (['motion_approved', 'render_queued', 'rendering', 'completed'].includes(status)) {
    completed.push('motion');
  }

  if (status === 'completed') {
    completed.push('render');
  }

  return completed;
}

/**
 * 현재 단계가 대기중(ready)인지 확인
 */
export function isStepReady(status: VideoProjectStatusV2): boolean {
  return ['script_ready', 'images_ready', 'motion_ready'].includes(status);
}

/**
 * 현재 단계가 생성중인지 확인
 */
export function isStepGenerating(status: VideoProjectStatusV2): boolean {
  return ['planning', 'generating_images', 'generating_motion', 'rendering'].includes(status);
}
