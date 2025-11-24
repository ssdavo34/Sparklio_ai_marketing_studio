"""
Meeting From URL 파이프라인

YouTube URL → Caption/Audio → Transcript → Primary 선택

작성일: 2025-11-24
작성자: B팀
참조: MEETING_FROM_URL_CONTRACT.md, MEETING_FROM_URL_BACKEND_GUIDE.md
"""

import logging
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.db.models import Meeting, MeetingTranscript
from app.models.meeting import MeetingStatus, TranscriptSourceType, TranscriptProvider, TranscriptBackend
from app.services.youtube_downloader import get_youtube_downloader

logger = logging.getLogger(__name__)


class MeetingURLPipeline:
    """
    Meeting From URL 파이프라인

    Stage 1: Caption-only
    Stage 2: Audio + STT
    Stage 3: Hybrid (Caption + Whisper)
    """

    def __init__(self):
        self.youtube_downloader = get_youtube_downloader()

    async def process_url(
        self,
        meeting_id: UUID,
        url: str,
        db: Session,
        auto_transcribe: bool = True,
        language: str = "ko"
    ) -> bool:
        """
        URL 처리 (Stage 1: Caption만)

        Args:
            meeting_id: Meeting ID
            url: YouTube URL
            db: DB 세션
            auto_transcribe: 자동 STT 실행 여부 (Stage 2에서 사용)
            language: 언어 코드

        Returns:
            성공 여부
        """
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            logger.error(f"Meeting {meeting_id} not found")
            return False

        logger.info(f"MeetingURLPipeline: Processing {url} for meeting {meeting_id}")

        try:
            # 상태 변경: created → downloading
            meeting.status = MeetingStatus.DOWNLOADING
            db.commit()

            # 1. YouTube Caption 가져오기
            caption_segments = await self.youtube_downloader.get_captions(url, language)

            if not caption_segments:
                logger.warning(f"No captions found for {url}")
                meeting.status = MeetingStatus.DOWNLOAD_FAILED
                db.commit()
                return False

            # 2. Caption → MeetingTranscript 저장
            transcript_text = "\n".join(seg["text"] for seg in caption_segments)

            transcript = MeetingTranscript(
                meeting_id=meeting_id,
                source_type=TranscriptSourceType.CAPTION,
                provider=TranscriptProvider.YOUTUBE,
                backend=TranscriptBackend.UNKNOWN,  # Caption은 YouTube에서 제공
                model="youtube_caption",
                transcript_text=transcript_text,
                segments=caption_segments,  # JSON 필드에 저장
                language=language,
                is_primary=True,  # Stage 1에서는 Caption이 유일한 transcript
                quality_score=7.0,  # 기본값 (LLM 평가 전)
                confidence=0.0  # Caption은 confidence 없음
            )

            db.add(transcript)

            # 3. 상태 변경: downloading → caption_ready
            meeting.status = MeetingStatus.CAPTION_READY
            db.commit()

            logger.info(
                f"MeetingURLPipeline: Caption ready for meeting {meeting_id}, "
                f"{len(caption_segments)} segments"
            )

            # Stage 1에서는 여기서 종료 (STT 없음)
            # Stage 2에서 auto_transcribe=True이면 STT 실행

            return True

        except Exception as e:
            logger.exception(f"Failed to process URL: {e}")
            meeting.status = MeetingStatus.DOWNLOAD_FAILED
            db.commit()
            return False


def get_meeting_url_pipeline() -> MeetingURLPipeline:
    """
    MeetingURLPipeline 인스턴스 반환

    Returns:
        MeetingURLPipeline
    """
    return MeetingURLPipeline()
