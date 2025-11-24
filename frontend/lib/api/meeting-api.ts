/**
 * Meeting API Client
 *
 * B팀 Meeting AI 모듈 API 연동
 * - POST /api/v1/meetings - 회의 생성 및 업로드
 * - POST /api/v1/meetings/{id}/transcribe - 트랜스크립션
 * - POST /api/v1/meetings/{id}/analyze - 회의 분석
 * - POST /api/v1/meetings/{id}/to-brief - 브리프 생성
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 */

import type { Meeting, MeetingAnalysisResult } from '@/types/meeting';

// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://100.123.51.5:8000';

// ============================================================================
// Types
// ============================================================================

export interface CreateMeetingFromFileRequest {
  file: File;
  title?: string;
  source_type?: 'upload';
}

export interface CreateMeetingFromUrlRequest {
  url: string;
  title?: string;
  source_type: 'youtube' | 'other';
}

export interface TranscribeRequest {
  mode?: 'openai' | 'local' | 'hybrid_cost' | 'hybrid_quality';
  language?: string;
}

export interface TranscribeResponse {
  meeting_id: string;
  transcript_id: string;
  transcript_text: string;
  duration_seconds: number;
  language: string;
  backend: string;
  model: string;
  latency_ms: number;
}

export interface AnalyzeResponse {
  meeting_id: string;
  analysis: MeetingAnalysisResult;
}

export interface ToBriefResponse {
  meeting_id: string;
  brief: {
    campaign_type: string;
    objective: string;
    target_audience: string[];
    key_messages: string[];
    deliverables: string[];
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * 파일 업로드로 Meeting 생성
 */
export async function createMeetingFromFile(
  request: CreateMeetingFromFileRequest
): Promise<Meeting> {
  const formData = new FormData();
  formData.append('file', request.file);
  if (request.title) {
    formData.append('title', request.title);
  }
  if (request.source_type) {
    formData.append('source_type', request.source_type);
  }

  const response = await fetch(`${API_BASE}/api/v1/meetings`, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type header - browser will set it with boundary for FormData
  });

  if (!response.ok) {
    throw new Error(`Failed to create meeting: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * URL로 Meeting 생성
 */
export async function createMeetingFromUrl(
  request: CreateMeetingFromUrlRequest
): Promise<Meeting> {
  const response = await fetch(`${API_BASE}/api/v1/meetings/from-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: request.url,
      title: request.title,
      source_type: request.source_type,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create meeting from URL: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Meeting 트랜스크립션
 */
export async function transcribeMeeting(
  meetingId: string,
  request?: TranscribeRequest
): Promise<TranscribeResponse> {
  const response = await fetch(`${API_BASE}/api/v1/meetings/${meetingId}/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request || {}),
  });

  if (!response.ok) {
    throw new Error(`Failed to transcribe meeting: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Meeting 분석
 */
export async function analyzeMeeting(meetingId: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE}/api/v1/meetings/${meetingId}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Failed to analyze meeting: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Meeting → Brief 변환
 */
export async function meetingToBrief(meetingId: string): Promise<ToBriefResponse> {
  const response = await fetch(`${API_BASE}/api/v1/meetings/${meetingId}/to-brief`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Failed to convert meeting to brief: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Meeting 목록 조회
 */
export async function listMeetings(): Promise<Meeting[]> {
  const response = await fetch(`${API_BASE}/api/v1/meetings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list meetings: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Meeting 상세 조회
 */
export async function getMeeting(meetingId: string): Promise<Meeting> {
  const response = await fetch(`${API_BASE}/api/v1/meetings/${meetingId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get meeting: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Meeting 삭제
 */
export async function deleteMeeting(meetingId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete meeting: ${response.statusText}`);
  }
}
