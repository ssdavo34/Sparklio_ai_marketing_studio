/**
 * Meeting AI Types
 *
 * Meeting, Transcript, MeetingAgent 관련 타입 정의
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 */

// Meeting Status (Backend 계약서 기준)
export type MeetingStatus =
  | 'created'           // Meeting 레코드만 생성됨
  | 'downloading'       // YouTube에서 다운로드 중
  | 'caption_ready'     // Caption만 준비됨 (STT 불필요)
  | 'ready_for_stt'     // Audio 다운로드 완료, STT 대기
  | 'transcribing'      // STT 진행 중
  | 'ready'             // Transcript 완료, 사용 가능
  | 'download_failed'   // 다운로드 실패
  | 'stt_failed'        // STT 실패
  | 'uploaded'          // 파일 업로드 (기존 호환)
  | 'transcribed'       // (기존 호환)
  | 'analyzed'          // Analysis 완료
  | 'failed';           // 기타 실패

// Transcript Source Type
export type TranscriptSourceType = 'caption' | 'whisper' | 'merged' | 'manual';

// Transcript Provider
export type TranscriptProvider = 'upload' | 'youtube' | 'zoom' | 'gmeet' | 'teams' | 'internal' | 'other' | 'manual';

// Transcript Backend
export type TranscriptBackend = 'openai' | 'whisper_cpp' | 'faster_whisper' | 'manual' | 'unknown';

// Meeting Source Type
export type MeetingSourceType = 'upload' | 'youtube' | 'zoom' | 'gmeet' | 'teams' | 'internal' | 'other';

// Meeting Interface
export interface Meeting {
  id: string;
  title: string;
  description?: string | null;
  source_type?: MeetingSourceType;
  source_url?: string | null;
  source_metadata?: Record<string, any> | null;
  meeting_metadata?: Record<string, any> | null;
  file_path?: string | null;
  file_url?: string | null;
  file_size?: number | null;
  file_size_bytes?: number | null;
  mime_type?: string | null;
  duration_seconds?: number | null;
  status: MeetingStatus;
  error_message?: string | null;
  analysis_result?: MeetingAnalysisResult | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

// Transcript Segment
export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

// Meeting Transcript Interface
export interface MeetingTranscript {
  id: string;
  meeting_id: string;
  source_type: TranscriptSourceType;
  provider: TranscriptProvider;
  backend: TranscriptBackend;
  model: string;
  language: string;
  transcript_text: string;
  segments: TranscriptSegment[];
  duration_seconds: number;
  latency_ms: number;
  confidence?: number | null;
  quality_score?: number | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// Meeting Analysis Result (MeetingAgent 출력)
export interface MeetingAnalysisResult {
  summary: string;
  agenda: string[];
  decisions: string[];
  action_items: string[];
  campaign_ideas: string[];
  analyzed_at?: string;
  analyzer_version?: string;
}

// POST /meetings/{id}/transcribe
export interface TranscribeRequest {
  force_mode?: 'openai' | 'local' | 'hybrid_cost' | 'hybrid_quality';
  reprocess?: boolean;
  importance?: 'normal' | 'high';
  run_meeting_agent?: boolean;
}

export interface TranscribeResponse {
  meeting_id: string;
  transcript_id: string;
  source_type: string;
  backend: string;
  model: string;
  language: string;
  duration_seconds: number;
  latency_ms: number;
  is_primary: boolean;
  status: string;
  meeting_agent_triggered: boolean;
}

// Simplified Meeting AI Response (for UploadTab)
export interface MeetingAIResult {
  transcript: string;
  summary: string;
  agenda: string[];
  decisions: string[];
  action_items: string[];
  campaign_ideas: string[];
  backend: string;
  model: string;
  latency_ms: number;
}
