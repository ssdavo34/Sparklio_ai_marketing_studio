"""
Meeting From URL 파이프라인

YouTube URL → Caption/Audio → Transcript → Primary 선택

작성일: 2025-11-24
작성자: B팀
참조: MEETING_FROM_URL_CONTRACT.md, MEETING_FROM_URL_BACKEND_GUIDE.md
"""

import logging
import tempfile
from pathlib import Path
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.meeting import Meeting, MeetingTranscript, MeetingStatus, TranscriptSourceType, TranscriptProvider, TranscriptBackend
from app.services.youtube_downloader import get_youtube_downloader
from app.services.storage import get_storage_service
from app.services.transcriber import get_transcriber_service

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
        self.storage = get_storage_service()
        self.transcriber = get_transcriber_service()

    async def process_url(
        self,
        meeting_id: UUID,
        url: str,
        db: Session,
        auto_transcribe: bool = True,
        language: str = "ko"
    ) -> bool:
        """
        URL 처리 (Stage 2: Caption + Audio + STT)

        Args:
            meeting_id: Meeting ID
            url: YouTube URL
            db: DB 세션
            auto_transcribe: 자동 STT 실행 여부
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

            caption_transcript = None
            if caption_segments:
                transcript_text = "\n".join(seg["text"] for seg in caption_segments)

                caption_transcript = MeetingTranscript(
                    meeting_id=meeting_id,
                    source_type=TranscriptSourceType.CAPTION,
                    provider=TranscriptProvider.YOUTUBE,
                    backend=TranscriptBackend.UNKNOWN,
                    model="youtube_caption",
                    transcript_text=transcript_text,
                    segments=caption_segments,
                    language=language,
                    is_primary=False,  # ← Stage 2: 일단 False (Whisper와 비교 후 결정)
                    quality_score=7.0,
                    confidence=0.0
                )

                db.add(caption_transcript)
                db.commit()

                meeting.status = MeetingStatus.CAPTION_READY
                db.commit()
                logger.info(f"Caption ready: {len(caption_segments)} segments")

            # 2. YouTube Audio 다운로드 (Stage 2 추가)
            with tempfile.TemporaryDirectory() as tmpdir:
                audio_path = Path(tmpdir) / "audio.mp4"

                logger.info(f"Downloading audio to {audio_path}")
                success, error_msg = await self.youtube_downloader.download_audio(
                    url, str(audio_path)
                )

                if not success:
                    logger.error(f"Audio download failed for {url}: {error_msg}")
                    meeting.status = MeetingStatus.DOWNLOAD_FAILED
                    meeting.error_message = error_msg  # C팀 요청: 에러 메시지 저장
                    db.commit()
                    return False

                # 3. MinIO 업로드
                file_key = f"meetings/{meeting.owner_id}/{meeting_id}/audio.mp4"

                logger.info(f"Uploading audio to MinIO: {file_key}")
                await self.storage.upload_file_async(
                    file_path=str(audio_path),
                    bucket="meetings",
                    object_key=file_key
                )

                meeting.file_url = file_key
                meeting.status = MeetingStatus.READY_FOR_STT
                db.commit()

            # 4. STT 실행 (auto_transcribe=True인 경우)
            if auto_transcribe:
                logger.info(f"Starting STT for meeting {meeting_id}")

                meeting.status = MeetingStatus.TRANSCRIBING
                db.commit()

                # TranscriberService 호출
                # MinIO에서 오디오 파일 다운로드 필요
                with tempfile.TemporaryDirectory() as tmpdir:
                    local_audio = Path(tmpdir) / "audio.mp4"

                    # MinIO → 로컬 다운로드
                    await self.storage.download_file_async(
                        bucket="meetings",
                        object_key=file_key,
                        file_path=str(local_audio)
                    )

                    # Whisper STT 실행
                    transcription_result = await self.transcriber.transcribe(
                        audio_path=str(local_audio),
                        language=language
                    )

                    # Whisper transcript 저장
                    whisper_transcript = MeetingTranscript(
                        meeting_id=meeting_id,
                        source_type=TranscriptSourceType.WHISPER,
                        provider=TranscriptProvider.UPLOAD,
                        backend=TranscriptBackend(transcription_result.backend),
                        model=transcription_result.model,
                        transcript_text=transcription_result.text,
                        segments=transcription_result.segments,
                        language=transcription_result.language,
                        is_primary=False,  # 일단 False (primary 선택 로직에서 결정)
                        quality_score=0.0,  # 계산 전
                        confidence=transcription_result.confidence,
                        latency_ms=int(transcription_result.elapsed_seconds * 1000)
                    )

                    db.add(whisper_transcript)
                    db.commit()

                    logger.info(f"Whisper STT completed for meeting {meeting_id}")

                # 5. Primary transcript 선택
                await self._select_primary_transcript(meeting_id, db)

                meeting.status = MeetingStatus.READY
                db.commit()

                logger.info(f"MeetingURLPipeline: Processing complete for meeting {meeting_id}")

            return True

        except Exception as e:
            error_msg = str(e)
            logger.exception(f"Failed to process URL: {error_msg}")
            # 실패 시 상태 결정
            if meeting.status == MeetingStatus.TRANSCRIBING:
                meeting.status = MeetingStatus.STT_FAILED
                meeting.error_message = f"STT failed: {error_msg}"
            else:
                meeting.status = MeetingStatus.DOWNLOAD_FAILED
                meeting.error_message = f"Download failed: {error_msg}"
            db.commit()
            return False

    def _calculate_quality_score(self, transcript: MeetingTranscript) -> float:
        """
        Transcript quality score 계산 (0-10)

        Stage 3: 간단한 휴리스틱 기반
        - Caption: 텍스트 길이, 세그먼트 수 기반
        - Whisper: confidence 기반

        Args:
            transcript: MeetingTranscript

        Returns:
            quality_score (0-10)
        """
        if transcript.source_type == TranscriptSourceType.CAPTION:
            # Caption 품질 계산
            # - 기본 점수: 5.0
            # - 세그먼트 수가 많을수록 +점수 (최대 +3.0)
            # - 텍스트 길이가 길수록 +점수 (최대 +2.0)
            base_score = 5.0

            # 세그먼트 수 점수 (100개당 +0.3, 최대 3.0)
            segment_count = len(transcript.segments) if transcript.segments else 0
            segment_score = min(3.0, segment_count / 100 * 0.3)

            # 텍스트 길이 점수 (1000자당 +0.2, 최대 2.0)
            text_length = len(transcript.transcript_text) if transcript.transcript_text else 0
            length_score = min(2.0, text_length / 1000 * 0.2)

            total_score = base_score + segment_score + length_score

            logger.debug(
                f"Caption quality: base={base_score}, "
                f"segments={segment_score:.2f} ({segment_count}), "
                f"length={length_score:.2f} ({text_length}), "
                f"total={total_score:.2f}"
            )

            return round(total_score, 2)

        elif transcript.source_type == TranscriptSourceType.WHISPER:
            # Whisper 품질 계산
            # - confidence 기반 (0-1 → 0-10)
            # - confidence가 높을수록 점수 높음
            confidence = transcript.confidence or 0.0
            score = confidence * 10.0

            logger.debug(
                f"Whisper quality: confidence={confidence:.2f}, "
                f"score={score:.2f}"
            )

            return round(score, 2)

        else:
            # 기타 (merged 등) - 기본값
            return 7.0

    async def _select_primary_transcript(
        self,
        meeting_id: UUID,
        db: Session
    ):
        """
        Primary transcript 선택 (Caption vs Whisper)

        Stage 3: quality_score 비교
        - 각 transcript의 quality_score 계산
        - 가장 높은 quality_score를 가진 transcript를 primary로 선택
        """
        transcripts = db.query(MeetingTranscript).filter(
            MeetingTranscript.meeting_id == meeting_id
        ).all()

        if not transcripts:
            logger.warning(f"No transcripts found for meeting {meeting_id}")
            return

        # Stage 3: quality_score 계산 및 비교
        for t in transcripts:
            # quality_score가 없으면 계산
            if t.quality_score is None or t.quality_score == 0.0:
                t.quality_score = self._calculate_quality_score(t)

        # 가장 높은 quality_score를 가진 transcript 선택
        best_transcript = max(transcripts, key=lambda t: t.quality_score)

        # primary 설정
        for t in transcripts:
            t.is_primary = (t.id == best_transcript.id)

        logger.info(
            f"Selected {best_transcript.source_type} as primary for meeting {meeting_id}, "
            f"quality_score={best_transcript.quality_score:.2f}"
        )

        # 모든 transcript의 quality_score 로깅
        for t in transcripts:
            logger.debug(
                f"  - {t.source_type}: quality_score={t.quality_score:.2f}, "
                f"is_primary={t.is_primary}"
            )

        db.commit()


def get_meeting_url_pipeline() -> MeetingURLPipeline:
    """
    MeetingURLPipeline 인스턴스 반환

    Returns:
        MeetingURLPipeline
    """
    return MeetingURLPipeline()
