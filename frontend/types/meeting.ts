/**
 * Meeting AI Types
 *
 * Meeting, Transcript, MeetingAgent 관련 타입 정의
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 */

// Meeting Status
export type MeetingStatus = 'uploaded' | 'transcribing' | 'transcribed' | 'analyzed' | 'failed';

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
  source_type: MeetingSourceType;
  source_url?: string | null;
  source_metadata?: Record<string, any> | null;
  file_path?: string | null;
  file_size_bytes?: number | null;
  duration_seconds?: number | null;
  status: MeetingStatus;
  created_at: string;
  updated_at: string;
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
