"""
Transcriber Schemas

TranscriberService 입출력 스키마

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: docs/MEETING_AI_TRANSCRIBER_SPEC.md
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID


class TranscriptSegment(BaseModel):
    """트랜스크립트 세그먼트 (타임스탬프 포함)"""
    start: float
    end: float
    text: str

    class Config:
        json_schema_extra = {
            "example": {
                "start": 0.0,
                "end": 3.2,
                "text": "안녕하세요 오늘 회의를 시작하겠습니다"
            }
        }


class TranscriptionResult(BaseModel):
    """
    STT 엔진 공통 결과 스키마

    모든 Whisper 클라이언트(OpenAI, whisper.cpp, faster-whisper)가
    이 형식으로 결과를 반환
    """
    text: str
    segments: List[TranscriptSegment]
    language: str
    duration_seconds: float
    backend: str      # "faster_whisper" | "openai" | "whisper_cpp"
    model: str        # "large-v3" | "whisper-1" | "medium" 등
    latency_ms: int
    confidence: Optional[float] = None

    class Config:
        json_schema_extra = {
            "example": {
                "text": "안녕하세요 오늘 회의를 시작하겠습니다...",
                "segments": [
                    {"start": 0.0, "end": 3.2, "text": "안녕하세요 오늘 회의를 시작하겠습니다"}
                ],
                "language": "ko",
                "duration_seconds": 3600.5,
                "backend": "faster_whisper",
                "model": "large-v3",
                "latency_ms": 52340,
                "confidence": 0.92
            }
        }


class TranscribeRequest(BaseModel):
    """POST /meetings/{id}/transcribe 요청 스키마"""
    force_mode: Optional[str] = Field(
        None,
        description="강제 모드 지정 (openai | local | hybrid_cost | hybrid_quality)",
        examples=["hybrid_cost"]
    )
    reprocess: bool = Field(
        False,
        description="기존 transcript 무시하고 재처리 여부"
    )
    importance: str = Field(
        "normal",
        description="회의 중요도 (normal | high)",
        examples=["high"]
    )
    run_meeting_agent: bool = Field(
        True,
        description="변환 완료 후 MeetingAgent 자동 실행 여부"
    )


class TranscribeResponse(BaseModel):
    """POST /meetings/{id}/transcribe 응답 스키마"""
    meeting_id: UUID
    transcript_id: UUID
    source_type: str  # "whisper"
    backend: str  # "faster_whisper" | "whisper_cpp" | "openai"
    model: str  # "large-v3" | "medium" | "small" | "whisper-1"
    language: str  # "ko" | "en" | ...
    duration_seconds: float
    latency_ms: int
    is_primary: bool
    status: str  # "completed" | "failed"
    meeting_agent_triggered: bool
