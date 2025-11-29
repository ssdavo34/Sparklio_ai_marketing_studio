/**
 * Video Pipeline V2 타입 정의
 *
 * B팀 설계서(VIDEO_PIPELINE_DESIGN_V2.md) 기반
 * 작성일: 2025-11-29
 * 작성자: C팀 (Frontend)
 */

// ============================================================================
// Enums - B팀 스키마와 동일하게 유지
// ============================================================================

export type VideoGenerationMode = 'reuse' | 'hybrid' | 'creative';

export type SceneType = 'image' | 'title_card' | 'blank';

export type MotionType = 'none' | 'kenburns';

export type TransitionType = 'cut' | 'crossfade' | 'slide_left' | 'slide_up' | 'zoom_out';

export type FitMode = 'cover' | 'contain' | 'blur_bg';

export type TextRole = 'subtitle' | 'title' | 'cta';

export type TextPosition = 'top_center' | 'center' | 'bottom_center';

export type AnimationType = 'none' | 'fade' | 'slide_up';

export type EasingType = 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out';

export type BGMMode = 'auto' | 'library' | 'generated';

export type ScriptStatus = 'draft' | 'user_edited' | 'approved';

export type VideoStatus = 'not_started' | 'planning' | 'rendering' | 'completed' | 'error';

// ============================================================================
// Config Types
// ============================================================================

export interface CanvasConfig {
  width: number;
  height: number;
  fps: number;
}

export interface GlobalConfig {
  total_duration_sec: number;
  bg_color: string;
  music_mood?: string;
}

export interface AudioConfig {
  bgm_mode: BGMMode;
  bgm_url?: string;
  bgm_generated_id?: string;
}

// ============================================================================
// Scene Components
// ============================================================================

export interface ImageConfig {
  source_type: 'asset' | 'generated';
  url: string;
  fit_mode: FitMode;
}

export interface MotionConfig {
  type: MotionType;
  pan_start: [number, number];
  pan_end: [number, number];
  zoom_start: number;
  zoom_end: number;
  easing: EasingType;
}

export interface TransitionConfig {
  type: TransitionType;
  duration_sec: number;
}

export interface TextAnimationConfig {
  in_type: AnimationType;
  out_type: AnimationType;
  in_duration_sec: number;
  out_duration_sec: number;
}

export interface TextLayer {
  role: TextRole;
  text: string;
  start_sec: number;
  end_sec: number;
  position: TextPosition;
  animation: TextAnimationConfig;
}

export interface SceneConfig {
  scene_index: number;
  start_sec: number;
  end_sec: number;
  type: SceneType;
  image?: ImageConfig;
  motion: MotionConfig;
  transition_out: TransitionConfig;
  texts: TextLayer[];
}

// ============================================================================
// Main Schemas
// ============================================================================

/**
 * VideoTimelinePlanV1 - VideoBuilder의 입력 타입
 * 렌더링에 필요한 모든 정보를 포함
 */
export interface VideoTimelinePlanV1 {
  version: string;
  canvas: CanvasConfig;
  global_config: GlobalConfig;
  audio: AudioConfig;
  scenes: SceneConfig[];
}

/**
 * SceneDraft - 유저가 수정하기 쉬운 단순화된 씬 구조
 */
export interface SceneDraft {
  scene_index: number;
  image_id?: string;
  image_url?: string; // Legacy: thumb_url 사용 권장
  caption: string;
  duration_sec: number;
  generate_new_image: boolean;
  image_prompt?: string;
  // 3종 URL (2025-11-30 추가)
  original_url?: string;
  preview_url?: string;
  thumb_url?: string;
}

/**
 * SceneDraft에서 썸네일 URL 추출
 */
export function getSceneThumbUrl(scene: SceneDraft | null | undefined): string {
  if (!scene) return '';
  return scene.thumb_url || scene.preview_url || scene.image_url || '';
}

/**
 * SceneDraft에서 프리뷰 URL 추출
 */
export function getScenePreviewUrl(scene: SceneDraft | null | undefined): string {
  if (!scene) return '';
  return scene.preview_url || scene.original_url || scene.image_url || '';
}

/**
 * VideoPlanDraftV1 - PLAN 단계 결과물, 유저 수정 가능
 */
export interface VideoPlanDraftV1 {
  version: string;
  project_id: string;
  mode: VideoGenerationMode;
  total_duration_sec: number;
  music_mood: string;
  scenes: SceneDraft[];
  script_status: ScriptStatus;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * POST /api/v1/video6/projects 요청
 */
export interface CreateVideoProjectRequest {
  concept_board_id: string;
  mode: VideoGenerationMode;
  available_assets?: string[];
  total_duration_sec?: number;
  music_mood?: string;
}

/**
 * POST /api/v1/video6/{id}/plan 요청
 */
export interface CreatePlanRequest {
  mode: VideoGenerationMode;
  concept_board_id: string;
  available_assets?: string[];
  total_duration_sec?: number;
  music_mood?: string;
}

/**
 * POST /api/v1/video6/{id}/plan 응답
 */
export interface CreatePlanResponse {
  project_id: string;
  plan_draft: VideoPlanDraftV1;
}

/**
 * POST /api/v1/video6/{id}/render 요청
 */
export interface RenderRequest {
  plan_draft: VideoPlanDraftV1;
}

/**
 * POST /api/v1/video6/{id}/render 응답
 */
export interface RenderResponse {
  job_id: string;
  status: VideoStatus;
  estimated_time_sec?: number;
}

/**
 * GET /api/v1/video6/{id}/status 응답
 */
export interface VideoStatusResponse {
  project_id: string;
  status: VideoStatus;
  progress?: number; // 0-100
  video_url?: string;
  thumbnail_url?: string;
  error_message?: string;
}

/**
 * GET /api/v1/video6/{id}/assets 응답
 */
export interface AssetPoolResponse {
  assets: AssetPoolItem[];
}

export interface AssetPoolItem {
  id: string;
  url: string; // Legacy: original_url 사용 권장
  thumb_url?: string; // 썸네일 (200px)
  preview_url?: string; // 프리뷰 (1080px)
  original_url?: string; // 원본
  source: string; // 'presentation', 'sns', 'detail', etc.
  created_at: string;
}

/**
 * AssetPoolItem에서 썸네일 URL 추출
 */
export function getAssetPoolThumbUrl(asset: AssetPoolItem | null | undefined): string {
  if (!asset) return '';
  return asset.thumb_url || asset.preview_url || asset.url || '';
}

// ============================================================================
// UI State Types (Frontend Only)
// ============================================================================

/**
 * 모드 선택 UI에서 사용
 */
export interface VideoModeOption {
  mode: VideoGenerationMode;
  label: string;
  description: string;
  costLabel: string;
  icon: string;
}

/**
 * 렌더링 진행 상태
 */
export interface RenderProgressState {
  status: VideoStatus;
  progress: number;
  estimatedTimeRemaining?: string;
  startedAt?: Date;
}

/**
 * 모드 선택 옵션 상수
 */
export const VIDEO_MODE_OPTIONS: VideoModeOption[] = [
  {
    mode: 'reuse',
    label: '기존 이미지 활용',
    description: '프레젠테이션, SNS에서 만든 이미지 재사용',
    costLabel: '🆓 무료',
    icon: '📦',
  },
  {
    mode: 'hybrid',
    label: '하이브리드',
    description: '핵심 이미지는 재사용하고 일부만 새로',
    costLabel: '💰 일부 비용',
    icon: '⚖️',
  },
  {
    mode: 'creative',
    label: '새로 제작',
    description: '영상 스토리에 맞는 이미지를 처음부터 생성',
    costLabel: '💎 비용 ↑',
    icon: '✨',
  },
];
