"""
TranscriberService

Meeting AI용 Whisper 백엔드 통합 서비스
4가지 모드 전략 구현 (openai, local, hybrid_cost, hybrid_quality)

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: docs/MEETING_AI_TRANSCRIBER_SPEC.md
"""

import logging
from typing import Optional
from pathlib import Path

from app.core.config import settings
from app.schemas.transcriber import TranscriptionResult
from app.services.transcriber_clients import (
    BaseWhisperClient,
    OpenAIWhisperClient,
    WhisperCppClient,
    FasterWhisperClient,
)

logger = logging.getLogger(__name__)


class TranscriberService:
    """
    Whisper 백엔드 통합 서비스

    4가지 모드:
    - openai: OpenAI만 사용
    - local: 로컬 (faster-whisper 또는 whisper.cpp)만 사용
    - hybrid_cost: 비용 최적화 (짧은 회의는 OpenAI, 긴 회의는 로컬)
    - hybrid_quality: 품질 우선 (로컬 large-v3 우선, 실패 시 OpenAI)
    """

    def __init__(self):
        self.mode = settings.WHISPER_MODE
        self.local_backend = settings.WHISPER_LOCAL_BACKEND
        self.openai_max_minutes = settings.WHISPER_OPENAI_MAX_MINUTES
        self.max_retries = settings.WHISPER_MAX_RETRIES

        # 클라이언트 초기화
        self.openai_client = OpenAIWhisperClient()
        self.faster_whisper_client = FasterWhisperClient()
        self.whisper_cpp_client = WhisperCppClient()

        logger.info(
            f"[TranscriberService] Initialized: mode={self.mode}, "
            f"local_backend={self.local_backend}, "
            f"openai_max_minutes={self.openai_max_minutes}"
        )

    async def transcribe(
        self,
        audio_path: str,
        duration_seconds: Optional[float] = None,
        force_mode: Optional[str] = None,
        importance: str = "normal",
        **kwargs
    ) -> TranscriptionResult:
        """
        오디오 파일을 텍스트로 변환

        Args:
            audio_path: 오디오 파일 경로
            duration_seconds: 회의 길이 (초) - hybrid_cost 모드에서 사용
            force_mode: 강제 모드 지정 (openai | local | hybrid_cost | hybrid_quality)
            importance: 중요도 (normal | high) - high면 품질 우선
            **kwargs: 엔진별 추가 옵션

        Returns:
            TranscriptionResult
        """
        mode = force_mode or self.mode

        logger.info(
            f"[TranscriberService] transcribe() called: "
            f"audio_path={audio_path}, duration={duration_seconds}s, "
            f"mode={mode}, importance={importance}"
        )

        try:
            if mode == "openai":
                return await self._openai_only(audio_path, duration_seconds, **kwargs)
            elif mode == "local":
                return await self._local_only(audio_path, duration_seconds, **kwargs)
            elif mode == "hybrid_cost":
                return await self._hybrid_cost(audio_path, duration_seconds, **kwargs)
            elif mode == "hybrid_quality":
                return await self._hybrid_quality(audio_path, duration_seconds, **kwargs)
            else:
                logger.warning(f"Unknown mode '{mode}', falling back to hybrid_cost")
                return await self._hybrid_cost(audio_path, duration_seconds, **kwargs)

        except Exception as e:
            logger.error(f"[TranscriberService] transcribe() failed: {e}")
            raise

    async def _openai_only(
        self,
        audio_path: str,
        duration_seconds: Optional[float] = None,
        **kwargs
    ) -> TranscriptionResult:
        """
        OpenAI 전용 모드

        OpenAI Whisper API만 사용
        """
        logger.info(f"[TranscriberService] _openai_only: {audio_path}")

        return await self._with_retries(
            self.openai_client,
            audio_path,
            duration_seconds,
            fallback_client=None,  # OpenAI 전용, fallback 없음
            **kwargs
        )

    async def _local_only(
        self,
        audio_path: str,
        duration_seconds: Optional[float] = None,
        **kwargs
    ) -> TranscriptionResult:
        """
        로컬 전용 모드

        로컬 백엔드 (faster-whisper 또는 whisper.cpp)만 사용
        fallback_openai 설정에 따라 OpenAI fallback 가능
        """
        logger.info(
            f"[TranscriberService] _local_only: {audio_path}, "
            f"local_backend={self.local_backend}"
        )

        # 로컬 백엔드 선택
        if self.local_backend == "faster_whisper":
            local_client = self.faster_whisper_client
        elif self.local_backend == "whisper_cpp":
            local_client = self.whisper_cpp_client
        else:
            logger.warning(
                f"Unknown local_backend '{self.local_backend}', using faster_whisper"
            )
            local_client = self.faster_whisper_client

        # Model profile 선택
        model_profile = self._choose_model_profile(duration_seconds)
        kwargs.setdefault("model_profile", model_profile)

        # OpenAI fallback 여부
        fallback_openai = kwargs.pop("fallback_openai", True)
        fallback_client = self.openai_client if fallback_openai else None

        return await self._with_retries(
            local_client,
            audio_path,
            duration_seconds,
            fallback_client=fallback_client,
            **kwargs
        )

    async def _hybrid_cost(
        self,
        audio_path: str,
        duration_seconds: Optional[float] = None,
        **kwargs
    ) -> TranscriptionResult:
        """
        비용 최적화 하이브리드 모드 (기본값)

        전략:
        - 짧은 회의 (≤ openai_max_minutes): OpenAI 우선
        - 긴 회의 (> openai_max_minutes): 로컬 우선, OpenAI fallback
        """
        logger.info(
            f"[TranscriberService] _hybrid_cost: {audio_path}, "
            f"duration={duration_seconds}s"
        )

        # Duration 기반 라우팅
        if duration_seconds is None:
            logger.warning("duration_seconds not provided, using local backend")
            use_openai = False
        else:
            duration_minutes = duration_seconds / 60
            use_openai = duration_minutes <= self.openai_max_minutes

        if use_openai:
            logger.info(
                f"[TranscriberService] _hybrid_cost: Short meeting "
                f"({duration_seconds}s), using OpenAI"
            )
            return await self._with_retries(
                self.openai_client,
                audio_path,
                duration_seconds,
                fallback_client=None,  # OpenAI는 fallback 없음
                **kwargs
            )
        else:
            logger.info(
                f"[TranscriberService] _hybrid_cost: Long meeting "
                f"({duration_seconds}s), using local with OpenAI fallback"
            )

            # 로컬 백엔드 선택
            if self.local_backend == "faster_whisper":
                local_client = self.faster_whisper_client
            elif self.local_backend == "whisper_cpp":
                local_client = self.whisper_cpp_client
            else:
                local_client = self.faster_whisper_client

            # Model profile 선택 (긴 회의는 작은 모델 사용)
            model_profile = self._choose_model_profile(duration_seconds)
            kwargs.setdefault("model_profile", model_profile)

            return await self._with_retries(
                local_client,
                audio_path,
                duration_seconds,
                fallback_client=self.openai_client,
                **kwargs
            )

    async def _hybrid_quality(
        self,
        audio_path: str,
        duration_seconds: Optional[float] = None,
        **kwargs
    ) -> TranscriptionResult:
        """
        품질 우선 하이브리드 모드

        전략:
        - 항상 로컬 large-v3 모델 우선
        - 실패 시 OpenAI fallback
        """
        logger.info(
            f"[TranscriberService] _hybrid_quality: {audio_path}, "
            f"always using local large-v3"
        )

        # 로컬 백엔드 선택
        if self.local_backend == "faster_whisper":
            local_client = self.faster_whisper_client
        elif self.local_backend == "whisper_cpp":
            local_client = self.whisper_cpp_client
        else:
            local_client = self.faster_whisper_client

        # 항상 large-v3 (최고 품질)
        kwargs["model_profile"] = settings.WHISPER_PROFILE_ACCURATE

        return await self._with_retries(
            local_client,
            audio_path,
            duration_seconds,
            fallback_client=self.openai_client,
            **kwargs
        )

    async def _with_retries(
        self,
        client: BaseWhisperClient,
        audio_path: str,
        duration_seconds: Optional[float],
        fallback_client: Optional[BaseWhisperClient] = None,
        **kwargs
    ) -> TranscriptionResult:
        """
        Retry 로직 with fallback

        Args:
            client: Primary 클라이언트
            audio_path: 오디오 파일 경로
            duration_seconds: 회의 길이
            fallback_client: Fallback 클라이언트 (옵션)
            **kwargs: 엔진별 추가 옵션

        Returns:
            TranscriptionResult
        """
        last_error = None

        # Primary 클라이언트 시도
        for attempt in range(self.max_retries):
            try:
                logger.info(
                    f"[TranscriberService] Attempt {attempt + 1}/{self.max_retries} "
                    f"with {client.__class__.__name__}"
                )
                result = await client.transcribe(audio_path, **kwargs)
                logger.info(
                    f"[TranscriberService] Success with {client.__class__.__name__}: "
                    f"backend={result.backend}, model={result.model}, "
                    f"latency={result.latency_ms}ms"
                )
                return result

            except Exception as e:
                last_error = e
                logger.warning(
                    f"[TranscriberService] Attempt {attempt + 1} failed "
                    f"with {client.__class__.__name__}: {e}"
                )

        # Primary 실패 → Fallback 시도
        if fallback_client:
            logger.info(
                f"[TranscriberService] Primary client failed, "
                f"trying fallback {fallback_client.__class__.__name__}"
            )

            try:
                # Fallback은 1회만 시도
                result = await fallback_client.transcribe(audio_path, **kwargs)
                logger.info(
                    f"[TranscriberService] Fallback success: "
                    f"backend={result.backend}, model={result.model}"
                )
                return result

            except Exception as fallback_error:
                logger.error(
                    f"[TranscriberService] Fallback also failed: {fallback_error}"
                )
                raise fallback_error

        # Fallback도 없거나 실패
        logger.error(
            f"[TranscriberService] All retries exhausted, no fallback available"
        )
        raise last_error

    def _choose_model_profile(self, duration_seconds: Optional[float]) -> str:
        """
        회의 길이에 따라 최적 모델 프로파일 선택

        전략:
        - 짧은 회의 (< 10분): small (빠르고 저렴)
        - 중간 회의 (10-30분): medium (균형)
        - 긴 회의 (> 30분): large-v3 (정확도 우선)

        Args:
            duration_seconds: 회의 길이 (초)

        Returns:
            model_profile: "small" | "medium" | "large-v3"
        """
        if duration_seconds is None:
            logger.warning("duration_seconds not provided, using balanced profile")
            return settings.WHISPER_PROFILE_BALANCED

        duration_minutes = duration_seconds / 60

        if duration_minutes < 10:
            profile = settings.WHISPER_PROFILE_FAST
            logger.info(f"Short meeting ({duration_minutes:.1f}min), using {profile}")
        elif duration_minutes < 30:
            profile = settings.WHISPER_PROFILE_BALANCED
            logger.info(f"Medium meeting ({duration_minutes:.1f}min), using {profile}")
        else:
            profile = settings.WHISPER_PROFILE_ACCURATE
            logger.info(f"Long meeting ({duration_minutes:.1f}min), using {profile}")

        return profile


# Singleton instance
_transcriber_service: Optional[TranscriberService] = None


def get_transcriber_service() -> TranscriberService:
    """
    TranscriberService 싱글톤 인스턴스 반환

    FastAPI dependency injection에서 사용
    """
    global _transcriber_service
    if _transcriber_service is None:
        _transcriber_service = TranscriberService()
    return _transcriber_service
