/**
 * Shorts Video Generation API Client
 *
 * B팀 API 스펙:
 * - POST /api/v1/demo/generate-shorts/{concept_id}: Shorts 생성 시작
 * - GET /api/v1/demo/shorts-status/{task_id}: 진행 상태 조회
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// ============================================
// Types
// ============================================

export type ShortsGenerationStep =
  | 'script_generation'    // 0-20%
  | 'prompt_generation'    // 20-30%
  | 'image_generation'     // 30-60%
  | 'tts_generation'       // 60-80%
  | 'video_assembly';      // 80-100%

export interface GenerateShortsResponse {
  task_id: string;
  concept_id: string;
  status: 'processing';
  message: string;
}

export interface ShortsStatusResponse {
  task_id: string;
  concept_id: string;
  status: 'processing' | 'completed' | 'failed';
  current_step: ShortsGenerationStep;
  progress: number;  // 0-100
  message: string;
  video_url?: string;      // completed일 때만
  download_url?: string;   // completed일 때만
  error?: string;          // failed일 때만
}

// ============================================
// API Functions
// ============================================

/**
 * Shorts 생성 시작
 *
 * POST /api/v1/demo/generate-shorts/{concept_id}
 */
export async function generateShorts(conceptId: string): Promise<GenerateShortsResponse> {
  const url = `${API_BASE_URL}/api/v1/demo/generate-shorts/${conceptId}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shorts 생성 요청 실패: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Shorts 생성 상태 조회
 *
 * GET /api/v1/demo/shorts-status/{task_id}
 */
export async function getShortsStatus(taskId: string): Promise<ShortsStatusResponse> {
  const url = `${API_BASE_URL}/api/v1/demo/shorts-status/${taskId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shorts 상태 조회 실패: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// ============================================
// Helper Functions
// ============================================

/**
 * 현재 스텝에 대한 한글 라벨 반환
 */
export function getStepLabel(step: ShortsGenerationStep): string {
  const labels: Record<ShortsGenerationStep, string> = {
    script_generation: '스크립트 생성 중...',
    prompt_generation: '프롬프트 생성 중...',
    image_generation: '이미지 생성 중...',
    tts_generation: 'TTS 음성 생성 중...',
    video_assembly: '비디오 조립 중...',
  };
  return labels[step] || '처리 중...';
}

/**
 * 스텝별 진행률 범위
 */
export function getStepProgressRange(step: ShortsGenerationStep): { min: number; max: number } {
  const ranges: Record<ShortsGenerationStep, { min: number; max: number }> = {
    script_generation: { min: 0, max: 20 },
    prompt_generation: { min: 20, max: 30 },
    image_generation: { min: 30, max: 60 },
    tts_generation: { min: 60, max: 80 },
    video_assembly: { min: 80, max: 100 },
  };
  return ranges[step] || { min: 0, max: 100 };
}
