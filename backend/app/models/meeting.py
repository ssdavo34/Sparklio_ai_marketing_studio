"""
Meeting 모델

회의 음성/영상 녹음 및 트랜스크립트 관리

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: SPARKLIO_MVP_MASTER_TRACKER.md - P0-2 Meeting AI Module
"""

import uuid
from sqlalchemy import Column, String, Text, Integer, ForeignKey, TIMESTAMP, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class MeetingStatus(str, enum.Enum):
    """회의 상태"""
    UPLOADED = "uploaded"  # 파일 업로드 완료
    TRANSCRIBING = "transcribing"  # 트랜스크립션 진행 중
    TRANSCRIBED = "transcribed"  # 트랜스크립션 완료
    ANALYZED = "analyzed"  # MeetingAgent 분석 완료
    FAILED = "failed"  # 실패


class Meeting(Base):
    """
    회의 모델

    회의 음성/영상 파일 및 분석 결과 저장
    """
    __tablename__ = "meetings"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    brand_id = Column(UUID(as_uuid=True), ForeignKey('brands.id'), nullable=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=True)

    # 회의 정보
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    meeting_date = Column(TIMESTAMP, nullable=True)

    # 파일 정보
    file_url = Column(Text, nullable=True)  # S3/로컬 파일 경로 (음성/영상)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    duration_seconds = Column(Integer, nullable=True)  # 회의 길이 (초)

    # 상태
    status = Column(SQLEnum(MeetingStatus), default=MeetingStatus.UPLOADED, nullable=False)

    # MeetingAgent 분석 결과 (JSON)
    analysis_result = Column(JSONB, nullable=True)
    # {
    #   "summary": "회의 요약",
    #   "agenda": ["안건1", "안건2"],
    #   "decisions": ["결정사항1", "결정사항2"],
    #   "action_items": ["액션아이템1", "액션아이템2"],
    #   "campaign_ideas": ["캠페인 아이디어1", "캠페인 아이디어2"],
    #   "analyzed_at": "2025-11-24T14:30:00Z",
    #   "analyzer_version": "v1.0"
    # }

    # 메타데이터
    meeting_metadata = Column(JSONB, nullable=True)
    # {
    #   "participants": ["참석자1", "참석자2"],
    #   "location": "회의실명",
    #   "platform": "Zoom/Google Meet/Offline",
    #   "original_filename": "meeting_recording.mp4"
    # }

    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(TIMESTAMP, nullable=True)

    # Relationships
    transcripts = relationship("MeetingTranscript", back_populates="meeting", cascade="all, delete-orphan")


class MeetingTranscript(Base):
    """
    회의 트랜스크립트 모델

    Whisper API로 생성된 회의 스크립트 (타임스탬프 포함)
    """
    __tablename__ = "meeting_transcripts"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys
    meeting_id = Column(UUID(as_uuid=True), ForeignKey('meetings.id', ondelete='CASCADE'), nullable=False)

    # 트랜스크립트 정보
    transcript_text = Column(Text, nullable=False)  # 전체 트랜스크립트 텍스트
    language = Column(String(10), nullable=True)  # 언어 코드 (ko, en 등)

    # 타임스탬프 세그먼트 (JSON)
    segments = Column(JSONB, nullable=True)
    # [
    #   {
    #     "start": 0.0,
    #     "end": 5.2,
    #     "text": "안녕하세요 오늘 회의를 시작하겠습니다",
    #     "speaker": "Speaker 1"  # optional
    #   },
    #   ...
    # ]

    # Whisper 메타데이터
    whisper_metadata = Column(JSONB, nullable=True)
    # {
    #   "model": "whisper-1",
    #   "duration": 120.5,
    #   "language_detected": "ko",
    #   "confidence": 0.95
    # }

    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    meeting = relationship("Meeting", back_populates="transcripts")
