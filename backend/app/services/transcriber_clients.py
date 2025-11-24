"""
Transcriber Clients

다양한 Whisper 백엔드 클라이언트 구현

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: docs/MEETING_AI_TRANSCRIBER_SPEC.md
"""

import logging
import httpx
from abc import ABC, abstractmethod
from typing import Optional
from pathlib import Path

from app.core.config import settings
from app.schemas.transcriber import TranscriptionResult, TranscriptSegment

logger = logging.getLogger(__name__)


class BaseWhisperClient(ABC):
    """Whisper 클라이언트 기본 인터페이스"""

    @abstractmethod
    async def transcribe(self, audio_path: str, **kwargs) -> TranscriptionResult:
        """
        오디오 파일을 텍스트로 변환

        Args:
            audio_path: 오디오 파일 경로
            **kwargs: 엔진별 추가 옵션

        Returns:
            TranscriptionResult
        """
        pass


class OpenAIWhisperClient(BaseWhisperClient):
    """
    OpenAI Whisper API 클라이언트

    https://platform.openai.com/docs/guides/speech-to-text
    """

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.WHISPER_OPENAI_MODEL or "whisper-1"
        self.timeout = settings.WHISPER_TIMEOUT_SECONDS

        if not self.api_key:
            logger.warning("OpenAI API key not configured")

    async def transcribe(self, audio_path: str, **kwargs) -> TranscriptionResult:
        """
        OpenAI Whisper API로 트랜스크립션

        API Spec:
        - POST https://api.openai.com/v1/audio/transcriptions
        - multipart/form-data
        - file, model, language (optional), temperature (optional)
        """
        if not self.api_key:
            raise ValueError("OpenAI API key not configured")

        import time
        start_time = time.time()

        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.api_key, timeout=self.timeout)

            with open(audio_path, 'rb') as audio_file:
                # verbose_json 형식으로 요청 (segments 포함)
                response = await client.audio.transcriptions.create(
                    model=self.model,
                    file=audio_file,
                    response_format="verbose_json",
                    timestamp_granularities=["segment"]
                )

            latency_ms = int((time.time() - start_time) * 1000)

            # Segments 파싱
            segments = []
            if hasattr(response, 'segments') and response.segments:
                for seg in response.segments:
                    segments.append(TranscriptSegment(
                        start=getattr(seg, 'start', 0.0),
                        end=getattr(seg, 'end', 0.0),
                        text=getattr(seg, 'text', '').strip()
                    ))

            return TranscriptionResult(
                text=response.text.strip(),
                segments=segments,
                language=getattr(response, 'language', 'unknown'),
                duration_seconds=getattr(response, 'duration', 0.0),
                backend="openai",
                model=self.model,
                latency_ms=latency_ms,
                confidence=None  # OpenAI doesn't provide confidence
            )

        except Exception as e:
            logger.error(f"OpenAI Whisper failed: {e}")
            raise


class WhisperCppClient(BaseWhisperClient):
    """
    whisper.cpp HTTP 서버 클라이언트 (Mac mini CPU)

    서버 스펙:
    - POST {endpoint}
    - multipart/form-data
    - file, model (optional), language (optional)
    """

    def __init__(self):
        self.endpoint = settings.WHISPER_CPP_ENDPOINT
        self.timeout = settings.WHISPER_TIMEOUT_SECONDS

    async def transcribe(self, audio_path: str, **kwargs) -> TranscriptionResult:
        """
        whisper.cpp 서버로 트랜스크립션
        """
        import time
        start_time = time.time()

        model_profile = kwargs.get("model_profile", "medium")

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                with open(audio_path, "rb") as f:
                    files = {
                        "file": ("audio.wav", f, "audio/wav"),
                    }
                    data = {
                        "model": model_profile,
                        "language": "auto",
                        "response_format": "verbose_json",
                    }

                    response = await client.post(
                        self.endpoint,
                        files=files,
                        data=data
                    )
                    response.raise_for_status()
                    payload = response.json()

            latency_ms = int((time.time() - start_time) * 1000)

            # Segments 파싱
            segments = [
                TranscriptSegment(
                    start=s.get("start", 0.0),
                    end=s.get("end", 0.0),
                    text=s.get("text", "").strip()
                )
                for s in payload.get("segments", [])
            ]

            return TranscriptionResult(
                text=payload.get("text", ""),
                segments=segments,
                language=payload.get("language", "auto"),
                duration_seconds=float(payload.get("duration", 0.0)),
                backend="whisper_cpp",
                model=payload.get("model", model_profile),
                latency_ms=latency_ms,
                confidence=payload.get("confidence")
            )

        except Exception as e:
            logger.error(f"whisper.cpp failed: {e}")
            raise


class FasterWhisperClient(BaseWhisperClient):
    """
    faster-whisper HTTP 서버 클라이언트 (RTX Desktop GPU)

    서버 스펙 (docs/MEETING_AI_TRANSCRIBER_SPEC.md 참조):
    - POST {endpoint}
    - multipart/form-data
    - audio_file (required), model, language, task, temperature
    """

    def __init__(self):
        self.endpoint = settings.WHISPER_FAST_ENDPOINT
        self.timeout = settings.WHISPER_TIMEOUT_SECONDS

    async def transcribe(self, audio_path: str, **kwargs) -> TranscriptionResult:
        """
        faster-whisper 서버로 트랜스크립션

        Args:
            audio_path: 오디오 파일 경로
            **kwargs:
                - model_profile: small | medium | large-v3 (기본값: large-v3)
                - language: auto | ko | en (기본값: auto)
                - task: transcribe | translate (기본값: transcribe)
                - temperature: 0.0 ~ 1.0 (기본값: 0.0)

        Returns:
            TranscriptionResult
        """
        import time
        start_time = time.time()

        model_profile = kwargs.get("model_profile", "large-v3")
        language = kwargs.get("language", "auto")
        task = kwargs.get("task", "transcribe")
        temperature = kwargs.get("temperature", 0.0)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                with open(audio_path, "rb") as f:
                    # multipart/form-data
                    files = {
                        "audio_file": (Path(audio_path).name, f, "audio/wav"),
                    }
                    data = {
                        "model": model_profile,
                        "language": language,
                        "task": task,
                        "temperature": str(temperature),
                    }

                    logger.info(
                        f"[FasterWhisperClient] POST {self.endpoint} "
                        f"model={model_profile} language={language}"
                    )

                    response = await client.post(
                        self.endpoint,
                        files=files,
                        data=data
                    )
                    response.raise_for_status()
                    payload = response.json()

            latency_ms = payload.get("latency_ms", int((time.time() - start_time) * 1000))

            # Segments 파싱
            segments = [
                TranscriptSegment(
                    start=s.get("start", 0.0),
                    end=s.get("end", 0.0),
                    text=s.get("text", "").strip()
                )
                for s in payload.get("segments", [])
            ]

            logger.info(
                f"[FasterWhisperClient] Success: "
                f"duration={payload.get('duration')}s "
                f"latency={latency_ms}ms "
                f"segments={len(segments)}"
            )

            return TranscriptionResult(
                text=payload.get("text", ""),
                segments=segments,
                language=payload.get("language", language),
                duration_seconds=float(payload.get("duration", 0.0)),
                backend=payload.get("backend", "faster_whisper"),
                model=payload.get("model", model_profile),
                latency_ms=latency_ms,
                confidence=payload.get("confidence")
            )

        except httpx.HTTPStatusError as e:
            logger.error(f"faster-whisper HTTP error: {e.response.status_code} - {e.response.text}")
            raise
        except httpx.TimeoutException as e:
            logger.error(f"faster-whisper timeout: {e}")
            raise
        except Exception as e:
            logger.error(f"faster-whisper failed: {e}")
            raise
