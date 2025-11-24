"""
Meeting Transcriber Service

OpenAI Whisper API를 사용하여 음성/영상 파일을 텍스트로 변환

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: SPARKLIO_MVP_MASTER_TRACKER.md - P0-2 Meeting AI Module
"""

import logging
from typing import Dict, Any, Optional, List
from pathlib import Path
import httpx
from openai import OpenAI, AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


class TranscriberError(Exception):
    """트랜스크립션 에러"""
    pass


class MeetingTranscriber:
    """
    회의 음성/영상 트랜스크립션 서비스

    OpenAI Whisper API를 사용하여 오디오 파일을 텍스트로 변환합니다.

    Features:
    - 음성/영상 → 텍스트 변환
    - 타임스탬프 포함 세그먼트 생성
    - 언어 자동 감지 (또는 수동 지정)
    - 긴 오디오 처리 (청크 분할)

    Supported formats:
    - mp3, mp4, mpeg, mpga, m4a, wav, webm
    - Max file size: 25MB (Whisper API 제한)
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Args:
            api_key: OpenAI API 키 (optional, settings에서 가져옴)
        """
        self.api_key = api_key or settings.OPENAI_API_KEY
        if not self.api_key:
            raise ValueError("OpenAI API key is required for transcription")

        self.client = OpenAI(api_key=self.api_key)
        self.async_client = AsyncOpenAI(api_key=self.api_key)

        # Whisper API 지원 포맷
        self.supported_formats = {
            '.mp3', '.mp4', '.mpeg', '.mpga',
            '.m4a', '.wav', '.webm'
        }

        # Whisper API 파일 크기 제한 (25MB)
        self.max_file_size = 25 * 1024 * 1024

    def transcribe(
        self,
        file_path: str,
        language: Optional[str] = None,
        prompt: Optional[str] = None,
        temperature: float = 0.0
    ) -> Dict[str, Any]:
        """
        음성/영상 파일을 텍스트로 변환 (동기)

        Args:
            file_path: 오디오 파일 경로
            language: 언어 코드 (ISO-639-1, 예: 'ko', 'en'), None이면 자동 감지
            prompt: Whisper에게 주는 힌트 텍스트 (선택)
            temperature: 샘플링 온도 (0.0 = 결정론적, 1.0 = 랜덤)

        Returns:
            Dict with:
                - transcript_text: 전체 트랜스크립트 텍스트
                - language: 감지된 언어 코드
                - segments: 타임스탬프 포함 세그먼트 리스트
                - duration: 오디오 길이 (초)
                - whisper_metadata: Whisper 메타데이터

        Raises:
            TranscriberError: 트랜스크립션 실패 시
        """
        try:
            # 파일 검증
            self._validate_file(file_path)

            # Whisper API 호출
            with open(file_path, 'rb') as audio_file:
                # verbose_json 형식으로 세그먼트 포함 결과 요청
                transcript = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language,
                    prompt=prompt,
                    temperature=temperature,
                    response_format="verbose_json",  # 세그먼트 포함
                    timestamp_granularities=["segment"]
                )

            # 세그먼트 파싱
            segments = self._parse_segments(transcript)

            # 메타데이터 생성
            whisper_metadata = {
                "model": "whisper-1",
                "duration": transcript.duration if hasattr(transcript, 'duration') else None,
                "language_detected": transcript.language if hasattr(transcript, 'language') else language,
                "temperature": temperature,
                "prompt": prompt
            }

            logger.info(
                f"Successfully transcribed audio: {file_path}, "
                f"duration: {whisper_metadata.get('duration')}s, "
                f"language: {whisper_metadata.get('language_detected')}, "
                f"segments: {len(segments)}"
            )

            return {
                "transcript_text": transcript.text.strip(),
                "language": whisper_metadata["language_detected"],
                "segments": segments,
                "duration": whisper_metadata["duration"],
                "whisper_metadata": whisper_metadata
            }

        except Exception as e:
            logger.error(f"Error transcribing audio {file_path}: {str(e)}")
            raise TranscriberError(f"Transcription failed: {str(e)}")

    async def transcribe_async(
        self,
        file_path: str,
        language: Optional[str] = None,
        prompt: Optional[str] = None,
        temperature: float = 0.0
    ) -> Dict[str, Any]:
        """
        음성/영상 파일을 텍스트로 변환 (비동기)

        Args:
            file_path: 오디오 파일 경로
            language: 언어 코드 (ISO-639-1, 예: 'ko', 'en'), None이면 자동 감지
            prompt: Whisper에게 주는 힌트 텍스트 (선택)
            temperature: 샘플링 온도 (0.0 = 결정론적, 1.0 = 랜덤)

        Returns:
            Dict with:
                - transcript_text: 전체 트랜스크립트 텍스트
                - language: 감지된 언어 코드
                - segments: 타임스탬프 포함 세그먼트 리스트
                - duration: 오디오 길이 (초)
                - whisper_metadata: Whisper 메타데이터

        Raises:
            TranscriberError: 트랜스크립션 실패 시
        """
        try:
            # 파일 검증
            self._validate_file(file_path)

            # Whisper API 호출 (비동기)
            with open(file_path, 'rb') as audio_file:
                transcript = await self.async_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language,
                    prompt=prompt,
                    temperature=temperature,
                    response_format="verbose_json",
                    timestamp_granularities=["segment"]
                )

            # 세그먼트 파싱
            segments = self._parse_segments(transcript)

            # 메타데이터 생성
            whisper_metadata = {
                "model": "whisper-1",
                "duration": transcript.duration if hasattr(transcript, 'duration') else None,
                "language_detected": transcript.language if hasattr(transcript, 'language') else language,
                "temperature": temperature,
                "prompt": prompt
            }

            logger.info(
                f"Successfully transcribed audio (async): {file_path}, "
                f"duration: {whisper_metadata.get('duration')}s, "
                f"language: {whisper_metadata.get('language_detected')}, "
                f"segments: {len(segments)}"
            )

            return {
                "transcript_text": transcript.text.strip(),
                "language": whisper_metadata["language_detected"],
                "segments": segments,
                "duration": whisper_metadata["duration"],
                "whisper_metadata": whisper_metadata
            }

        except Exception as e:
            logger.error(f"Error transcribing audio (async) {file_path}: {str(e)}")
            raise TranscriberError(f"Transcription failed: {str(e)}")

    def _validate_file(self, file_path: str) -> None:
        """파일 검증"""
        path = Path(file_path)

        # 파일 존재 확인
        if not path.exists():
            raise TranscriberError(f"File not found: {file_path}")

        # 파일 포맷 확인
        if path.suffix.lower() not in self.supported_formats:
            raise TranscriberError(
                f"Unsupported audio format: {path.suffix}. "
                f"Supported: {self.supported_formats}"
            )

        # 파일 크기 확인
        file_size = path.stat().st_size
        if file_size > self.max_file_size:
            raise TranscriberError(
                f"File too large: {file_size / 1024 / 1024:.1f}MB. "
                f"Max size: {self.max_file_size / 1024 / 1024:.0f}MB"
            )

    def _parse_segments(self, transcript: Any) -> List[Dict[str, Any]]:
        """
        Whisper API 응답에서 세그먼트 파싱

        Returns:
            List of segments:
            [
                {
                    "start": 0.0,
                    "end": 5.2,
                    "text": "안녕하세요 오늘 회의를 시작하겠습니다"
                },
                ...
            ]
        """
        segments = []

        if hasattr(transcript, 'segments') and transcript.segments:
            for seg in transcript.segments:
                segments.append({
                    "start": seg.get('start', 0.0) if isinstance(seg, dict) else getattr(seg, 'start', 0.0),
                    "end": seg.get('end', 0.0) if isinstance(seg, dict) else getattr(seg, 'end', 0.0),
                    "text": seg.get('text', '').strip() if isinstance(seg, dict) else getattr(seg, 'text', '').strip()
                })

        return segments


# Singleton instance
_transcriber_instance: Optional[MeetingTranscriber] = None


def get_transcriber(api_key: Optional[str] = None) -> MeetingTranscriber:
    """
    MeetingTranscriber 싱글톤 인스턴스 반환

    Args:
        api_key: OpenAI API 키 (optional)

    Returns:
        MeetingTranscriber 인스턴스
    """
    global _transcriber_instance
    if _transcriber_instance is None:
        _transcriber_instance = MeetingTranscriber(api_key=api_key)
    return _transcriber_instance
