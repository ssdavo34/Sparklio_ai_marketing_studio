"""
Whisper STT Service

음성 인식 서비스 (faster-whisper 서버 연동)

작성일: 2025-12-06
원본: sparklio_ai_marketing_studio/backend/app/services/transcriber.py

GPU 서버: 100.120.180.42:9000
"""

import logging
import httpx
from typing import Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class TranscriptionResult:
    """음성 인식 결과"""
    text: str
    segments: list
    language: str
    duration_sec: float
    backend: str
    model: str
    latency_ms: int


class WhisperService:
    """
    Whisper STT 서비스

    faster-whisper 서버를 통해 음성을 텍스트로 변환
    """

    def __init__(
        self,
        endpoint: str = "http://100.120.180.42:9000/transcribe",
        timeout: int = 300
    ):
        self.endpoint = endpoint
        self.timeout = timeout

    async def transcribe(
        self,
        audio_path: str,
        language: str = "ko",
        model_profile: str = "medium"
    ) -> TranscriptionResult:
        """
        오디오 파일을 텍스트로 변환

        Args:
            audio_path: 오디오 파일 경로
            language: 언어 코드 (ko, en 등)
            model_profile: 모델 프로파일 (small, medium, large-v3)

        Returns:
            TranscriptionResult
        """
        logger.info(f"[Whisper] Transcribing: {audio_path}")

        start_time = datetime.utcnow()

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                with open(audio_path, "rb") as f:
                    files = {"file": (audio_path, f, "audio/mpeg")}
                    data = {
                        "language": language,
                        "model": model_profile
                    }

                    response = await client.post(
                        self.endpoint,
                        files=files,
                        data=data
                    )

                    if response.status_code != 200:
                        raise Exception(f"Whisper API error: {response.text}")

                    result = response.json()

            elapsed_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

            return TranscriptionResult(
                text=result.get("text", ""),
                segments=result.get("segments", []),
                language=result.get("language", language),
                duration_sec=result.get("duration", 0),
                backend="faster-whisper",
                model=model_profile,
                latency_ms=elapsed_ms
            )

        except Exception as e:
            logger.error(f"[Whisper] Transcription failed: {e}")
            raise

    async def health_check(self) -> bool:
        """헬스 체크"""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    self.endpoint.replace("/transcribe", "/health")
                )
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"[Whisper] Health check failed: {e}")
            return False


# Singleton
_whisper_service: Optional[WhisperService] = None


def get_whisper_service(endpoint: Optional[str] = None) -> WhisperService:
    """WhisperService 인스턴스 반환"""
    global _whisper_service

    if _whisper_service is None:
        if not endpoint:
            from app.core.config import settings
            endpoint = settings.whisper_endpoint

        _whisper_service = WhisperService(endpoint=endpoint)

    return _whisper_service
