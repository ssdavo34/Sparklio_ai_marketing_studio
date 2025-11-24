# B팀 Meeting AI Transcriber 구현 가이드

**작성일**: 2025-11-24 (일요일)
**작성자**: A팀 (QA & Testing)
**대상**: B팀 (Backend)
**참조 문서**:
- [backend/docs/MEETING_AI_TRANSCRIBER_SPEC.md](./MEETING_AI_TRANSCRIBER_SPEC.md)
- [docs/MEETING_AI_ARCHITECTURE.md](../../docs/MEETING_AI_ARCHITECTURE.md)

---

## 📋 목차

1. [구현 현황 정리](#1-구현-현황-정리)
2. [Step 1: FasterWhisperClient 구현](#2-step-1-fasterwhisperclient-구현)
3. [Step 2: TranscriberService 4-Mode 구현](#3-step-2-transcriberservice-4-mode-구현)
4. [Step 3: API 엔드포인트 업데이트](#4-step-3-api-엔드포인트-업데이트)
5. [A/C팀 협업 가이드](#5-ac팀-협업-가이드)
6. [다음 단계 체크리스트](#6-다음-단계-체크리스트)

---

## 1. 구현 현황 정리

### 1-1. 현재 상태 (2025-11-24 기준)

✅ **완료된 작업**:
- 아키텍처 문서: `MEETING_AI_ARCHITECTURE.md` 작성 완료
- 상세 스펙: `MEETING_AI_TRANSCRIBER_SPEC.md` 작성 완료
- DB 스키마 설계: `meeting_transcripts` 테이블 정의 완료
- 환경변수 정의: `WHISPER_MODE`, `WHISPER_LOCAL_BACKEND` 등 정의 완료

🔧 **구현 필요 컴포넌트**:
1. `backend/app/services/transcriber_clients.py` - Whisper 클라이언트 구현
2. `backend/app/services/transcriber.py` - TranscriberService 4-Mode 구현
3. `backend/app/api/routes/meetings.py` - POST `/meetings/{id}/transcribe` 엔드포인트
4. `backend/app/schemas/transcriber.py` - Request/Response 스키마 (일부 존재 시 업데이트)
5. `backend/app/services/meeting_audio.py` - 오디오 소스 처리 (존재 시 검토)
6. `backend/app/services/meeting_agent.py` - MeetingAgent 트리거 (존재 시 검토)

### 1-2. 구현 우선순위

```
우선순위 1: FasterWhisperClient (RTX Desktop 연동)
우선순위 2: TranscriberService 4-Mode 로직
우선순위 3: API 엔드포인트 `/meetings/{id}/transcribe`
우선순위 4: A/C팀 연동 테스트
```

---

## 2. Step 1: FasterWhisperClient 구현

### 2-1. 파일 위치
**경로**: `backend/app/services/transcriber_clients.py`

### 2-2. 구현 내용

#### BaseWhisperClient (추상 클래스)

```python
# app/services/transcriber_clients.py
"""
Whisper 클라이언트 구현

다양한 Whisper 백엔드를 추상화하여 통일된 인터페이스 제공:
- OpenAI Whisper API
- whisper.cpp 서버
- faster-whisper 서버 (RTX Desktop)

작성일: 2025-11-24
작성자: B팀 (Backend)
"""

import httpx
import logging
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any

from app.core.settings import Settings
from app.schemas.transcriber import TranscriptionResult, TranscriptSegment

logger = logging.getLogger(__name__)


class BaseWhisperClient(ABC):
    """
    Whisper 클라이언트 추상 기본 클래스

    모든 Whisper 백엔드는 이 인터페이스를 구현해야 함
    """

    @abstractmethod
    async def transcribe(self, audio_path: str, **kwargs) -> TranscriptionResult:
        """
        음성을 텍스트로 변환

        Args:
            audio_path: 오디오 파일 경로 (로컬 파일 시스템)
            **kwargs: 백엔드별 추가 옵션
                - model_profile: str (예: "small", "medium", "large-v3")
                - language: str (예: "ko", "en", "auto")
                - task: str (예: "transcribe", "translate")

        Returns:
            TranscriptionResult: 변환된 텍스트 + 세그먼트 + 메타데이터
        """
        pass


class OpenAIWhisperClient(BaseWhisperClient):
    """
    OpenAI Whisper API 클라이언트

    - API 호출: openai.Audio.transcribe()
    - 비용: $0.006/분 (2025년 기준)
    - 모델: whisper-1 (large-v2 기반)
    """

    def __init__(self, settings: Settings):
        self.settings = settings
        self.api_key = settings.OPENAI_API_KEY

        # TODO: OpenAI 클라이언트 초기화
        # import openai
        # openai.api_key = self.api_key

    async def transcribe(self, audio_path: str, **kwargs) -> TranscriptionResult:
        """
        OpenAI Whisper API로 음성 변환

        TODO: 실제 OpenAI API 호출 구현
        - openai.Audio.transcribe() 사용
        - response_format="verbose_json" 설정 (세그먼트 포함)
        - language 지정 (auto 감지는 미지정)
        """
        logger.info(f"[OpenAI] Transcribing: {audio_path}")

        # TODO: 구현 필요
        raise NotImplementedError("OpenAI Whisper API 연동 구현 필요")


class WhisperCppClient(BaseWhisperClient):
    """
    whisper.cpp 서버 클라이언트

    - 서버: HTTP API (C++ 기반 whisper.cpp)
    - 용도: CPU 환경에서의 로컬 STT
    - 엔드포인트: settings.WHISPER_CPP_ENDPOINT
    """

    def __init__(self, settings: Settings):
        self.settings = settings
        self.endpoint = settings.WHISPER_CPP_ENDPOINT  # 예: http://localhost:8080/inference
        self.timeout = settings.WHISPER_TIMEOUT_SECONDS

    async def transcribe(self, audio_path: str, **kwargs) -> TranscriptionResult:
        """
        whisper.cpp 서버로 음성 변환

        TODO: whisper.cpp 서버 스펙에 맞춰 구현
        - HTTP POST multipart/form-data
        - 응답 형식을 TranscriptionResult로 매핑
        """
        logger.info(f"[whisper.cpp] Transcribing: {audio_path}")

        # TODO: 구현 필요
        raise NotImplementedError("whisper.cpp 서버 연동 구현 필요")


class FasterWhisperClient(BaseWhisperClient):
    """
    faster-whisper 서버 클라이언트 (RTX Desktop)

    - 서버: RTX Desktop (IP: 100.120.180.42, Port: 9000)
    - GPU: NVIDIA RTX 4060 Ti (VRAM 16GB)
    - 엔진: faster-whisper (CTranslate2 기반)
    - 속도: ~15x realtime (large-v3 모델 기준)

    요청 형식:
        POST http://100.120.180.42:9000/transcribe
        Content-Type: multipart/form-data

        - audio_file: binary (audio/wav, audio/mp3 등)
        - model: str (예: "large-v3", "medium", "small")
        - language: str (예: "ko", "en", "auto")
        - task: str ("transcribe" 또는 "translate")
        - temperature: float (기본: 0.0)

    응답 형식:
        {
          "text": "전체 변환 텍스트",
          "segments": [
            {
              "start": 0.0,
              "end": 2.5,
              "text": "첫 번째 세그먼트"
            },
            ...
          ],
          "language": "ko",
          "duration": 120.5,
          "backend": "faster_whisper",
          "model": "large-v3",
          "latency_ms": 8234,
          "confidence": 0.92
        }
    """

    def __init__(self, settings: Settings):
        self.settings = settings
        self.endpoint = settings.WHISPER_FAST_ENDPOINT  # http://100.120.180.42:9000/transcribe
        self.timeout = settings.WHISPER_TIMEOUT_SECONDS  # 기본: 300초 (5분)

    async def transcribe(self, audio_path: str, **kwargs) -> TranscriptionResult:
        """
        faster-whisper 서버로 음성 변환

        Args:
            audio_path: 오디오 파일 경로
            **kwargs:
                - model_profile: str (기본: "large-v3")
                - language: str (기본: "auto")
                - task: str (기본: "transcribe")

        Returns:
            TranscriptionResult: 변환 결과

        Raises:
            httpx.HTTPError: 서버 연결 실패 또는 HTTP 에러
            TimeoutException: 타임아웃 초과
        """
        model_profile: str = kwargs.get("model_profile") or "large-v3"
        language: str = kwargs.get("language") or "auto"
        task: str = kwargs.get("task") or "transcribe"

        logger.info(
            f"[faster-whisper] Transcribing: {audio_path} "
            f"(model={model_profile}, language={language})"
        )

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # multipart/form-data 요청 구성
                with open(audio_path, "rb") as f:
                    files = {
                        "audio_file": ("audio.wav", f, "audio/wav"),
                    }
                    data = {
                        "model": model_profile,
                        "language": language,
                        "task": task,
                        "temperature": "0.0",
                    }

                    # HTTP POST 요청
                    resp = await client.post(self.endpoint, files=files, data=data)
                    resp.raise_for_status()
                    payload = resp.json()

            # 응답 파싱: segments 변환
            segments = [
                TranscriptSegment(
                    start=float(s["start"]),
                    end=float(s["end"]),
                    text=s["text"],
                )
                for s in payload.get("segments", [])
            ]

            # TranscriptionResult 생성
            return TranscriptionResult(
                text=payload["text"],
                segments=segments,
                language=payload.get("language", language),
                duration_seconds=float(payload.get("duration", 0.0)),
                backend=payload.get("backend", "faster_whisper"),
                model=payload.get("model", model_profile),
                latency_ms=int(payload.get("latency_ms", 0)),
                confidence=payload.get("confidence"),
            )

        except httpx.HTTPStatusError as e:
            logger.error(f"[faster-whisper] HTTP error: {e.response.status_code} - {e.response.text}")
            raise
        except httpx.TimeoutException as e:
            logger.error(f"[faster-whisper] Timeout after {self.timeout}s")
            raise
        except Exception as e:
            logger.exception(f"[faster-whisper] Unexpected error: {e}")
            raise
```

### 2-3. 구현 체크리스트

- [ ] `BaseWhisperClient` 추상 클래스 작성
- [ ] `OpenAIWhisperClient` 구현 (TODO 채우기)
- [ ] `WhisperCppClient` 구현 (TODO 채우기)
- [ ] `FasterWhisperClient` 완성 (RTX Desktop 연동)
- [ ] `app/schemas/transcriber.py`에 `TranscriptionResult`, `TranscriptSegment` 정의 확인
- [ ] RTX Desktop 서버 Health Check 테스트 (`curl http://100.120.180.42:9000/health`)
- [ ] 실제 오디오 파일로 `FasterWhisperClient.transcribe()` 단위 테스트

---

## 3. Step 2: TranscriberService 4-Mode 구현

### 3-1. 파일 위치
**경로**: `backend/app/services/transcriber.py`

### 3-2. 구현 내용

```python
# app/services/transcriber.py
"""
TranscriberService: Meeting AI Transcriber 핵심 비즈니스 로직

4가지 Whisper 모드를 지원하며, 길이/중요도에 따라 최적의 STT 엔진 선택:
1. openai: OpenAI Whisper API 전용
2. local: 로컬 서버 전용 (faster-whisper 또는 whisper.cpp)
3. hybrid_cost: 비용/속도 균형 (짧은 회의는 OpenAI, 긴 회의는 로컬)
4. hybrid_quality: 품질 우선 (로컬 large-v3 모델 우선, 실패 시 OpenAI)

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: MEETING_AI_TRANSCRIBER_SPEC.md
"""

import logging
from typing import Optional

from app.core.settings import Settings, WhisperMode, WhisperLocalBackend
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
    Meeting 음성을 텍스트로 변환하는 서비스

    주요 기능:
    - 4가지 Whisper 모드 지원
    - Graceful Degradation (로컬 실패 시 OpenAI fallback)
    - 회의 길이 기반 모델 프로필 자동 선택
    - Retry 로직 (최대 3회)

    환경변수:
    - WHISPER_MODE: openai | local | hybrid_cost | hybrid_quality
    - WHISPER_LOCAL_BACKEND: faster_whisper | whisper_cpp
    - WHISPER_OPENAI_MAX_MINUTES: hybrid_cost 모드에서 OpenAI 사용 임계값 (분)
    - WHISPER_MAX_RETRIES: 재시도 횟수 (기본: 3)
    - WHISPER_PROFILE_FAST: 짧은 회의용 모델 (기본: "small")
    - WHISPER_PROFILE_BALANCED: 중간 길이 회의용 모델 (기본: "medium")
    - WHISPER_PROFILE_ACCURATE: 긴 회의용 모델 (기본: "large-v3")
    """

    def __init__(self, settings: Optional[Settings] = None):
        """
        TranscriberService 초기화

        Args:
            settings: Settings 인스턴스 (None이면 기본 설정 사용)
        """
        self.settings = settings or Settings()
        self.mode: WhisperMode = self.settings.WHISPER_MODE

        # OpenAI 클라이언트 (항상 초기화 - fallback용)
        self.openai_client = OpenAIWhisperClient(self.settings)

        # 로컬 클라이언트 선택 (faster-whisper 또는 whisper.cpp)
        if self.settings.WHISPER_LOCAL_BACKEND == WhisperLocalBackend.whisper_cpp:
            self.local_client: Optional[BaseWhisperClient] = WhisperCppClient(self.settings)
            logger.info("[Transcriber] Local backend: whisper.cpp")
        elif self.settings.WHISPER_LOCAL_BACKEND == WhisperLocalBackend.faster_whisper:
            self.local_client = FasterWhisperClient(self.settings)
            logger.info("[Transcriber] Local backend: faster-whisper")
        else:
            self.local_client = None
            logger.warning("[Transcriber] No local backend configured")

    async def transcribe(
        self,
        audio_path: str,
        duration_seconds: float,
        importance: str = "normal"
    ) -> TranscriptionResult:
        """
        음성을 텍스트로 변환 (메인 진입점)

        Args:
            audio_path: 오디오 파일 경로 (로컬 파일 시스템)
            duration_seconds: 오디오 길이(초) - ffprobe로 미리 계산
            importance: 회의 중요도 ("normal" | "high")
                - "high": hybrid_quality 모드 강제 적용 가능

        Returns:
            TranscriptionResult: 변환 결과

        Raises:
            Exception: 모든 시도 실패 시
        """
        logger.info(
            f"[Transcriber] Start - mode={self.mode}, duration={duration_seconds:.1f}s, importance={importance}"
        )

        # 모드별 분기
        if self.mode == WhisperMode.openai:
            return await self._openai_only(audio_path)

        if self.mode == WhisperMode.local:
            return await self._local_only(audio_path)

        if self.mode == WhisperMode.hybrid_cost:
            return await self._hybrid_cost(audio_path, duration_seconds)

        if self.mode == WhisperMode.hybrid_quality:
            return await self._hybrid_quality(audio_path, duration_seconds)

        # fallback (알 수 없는 모드)
        logger.warning(f"[Transcriber] Unknown WHISPER_MODE={self.mode}, using openai")
        return await self._openai_only(audio_path)

    # ============================================================================
    # 내부 전략 구현 (4가지 모드)
    # ============================================================================

    async def _openai_only(self, audio_path: str) -> TranscriptionResult:
        """
        모드 1: OpenAI Whisper API만 사용

        - 용도: 빠른 프로토타이핑, 로컬 서버 불가 환경
        - 비용: $0.006/분
        """
        logger.info("[Transcriber] Mode: openai_only")
        return await self.openai_client.transcribe(audio_path)

    async def _local_only(self, audio_path: str) -> TranscriptionResult:
        """
        모드 2: 로컬 서버만 사용 (faster-whisper 또는 whisper.cpp)

        - 용도: 비용 절감, 데이터 프라이버시
        - Fallback: 로컬 실패 시 OpenAI로 전환 (선택적)
        """
        logger.info(
            f"[Transcriber] Mode: local_only (backend={self.settings.WHISPER_LOCAL_BACKEND})"
        )

        if not self.local_client:
            logger.warning("[Transcriber] No local_client, fallback to openai")
            return await self._openai_only(audio_path)

        return await self._with_retries(
            self.local_client,
            audio_path,
            fallback_openai=True,  # 로컬 실패 시 OpenAI fallback
        )

    async def _hybrid_cost(
        self,
        audio_path: str,
        duration_seconds: float
    ) -> TranscriptionResult:
        """
        모드 3: 비용/속도 균형 (Hybrid - Cost Optimized)

        전략:
        1. 짧은 회의 (<= WHISPER_OPENAI_MAX_MINUTES):
           - OpenAI 우선 (빠른 응답)
           - 실패 시 로컬 fallback

        2. 긴 회의 (> WHISPER_OPENAI_MAX_MINUTES):
           - 로컬 우선 (비용 절감)
           - 실패 시 OpenAI fallback

        예시:
        - WHISPER_OPENAI_MAX_MINUTES=20 설정 시
        - 15분 회의: OpenAI 사용 ($0.09)
        - 60분 회의: 로컬 사용 (무료)
        """
        max_minutes = self.settings.WHISPER_OPENAI_MAX_MINUTES
        duration_minutes = duration_seconds / 60

        # 1) 짧은 회의 → OpenAI 우선
        if duration_seconds <= max_minutes * 60:
            logger.info(
                f"[Transcriber] hybrid_cost: short meeting ({duration_minutes:.1f}min) → openai first"
            )
            try:
                return await self.openai_client.transcribe(audio_path)
            except Exception as e:
                logger.exception(
                    f"[Transcriber] openai failed in hybrid_cost, try local: {e}"
                )
                if self.local_client:
                    return await self._with_retries(
                        self.local_client,
                        audio_path,
                        fallback_openai=False,  # 이미 OpenAI 시도했으므로 fallback 없음
                    )
                raise

        # 2) 긴 회의 → 로컬 우선
        logger.info(
            f"[Transcriber] hybrid_cost: long meeting ({duration_minutes:.1f}min) → "
            f"local first (backend={self.settings.WHISPER_LOCAL_BACKEND})"
        )
        if self.local_client:
            return await self._with_retries(
                self.local_client,
                audio_path,
                fallback_openai=True,  # 로컬 실패 시 OpenAI fallback
            )

        logger.warning("[Transcriber] hybrid_cost: no local_client, fallback to openai")
        return await self._openai_only(audio_path)

    async def _hybrid_quality(
        self,
        audio_path: str,
        duration_seconds: float
    ) -> TranscriptionResult:
        """
        모드 4: 품질 우선 (Hybrid - Quality Optimized)

        전략:
        - 길이에 상관없이 로컬 large-v3 모델 우선
        - 로컬 실패 시 OpenAI fallback
        - 길이에 따라 모델 프로필 자동 선택:
          - ≤15분: FAST (small)
          - 15~60분: BALANCED (medium)
          - ≥60분: ACCURATE (large-v3)

        용도:
        - 중요 회의 (경영진, 고객 미팅 등)
        - 정확도가 비용보다 중요한 경우
        """
        logger.info("[Transcriber] Mode: hybrid_quality (prefer local large model)")

        if self.local_client:
            try:
                # 길이 기반 모델 프로필 선택
                model_profile = self._choose_model_profile(duration_seconds)
                logger.info(f"[Transcriber] Selected model profile: {model_profile}")

                return await self._with_retries(
                    self.local_client,
                    audio_path,
                    fallback_openai=True,
                    model_profile=model_profile,
                )
            except Exception as e:
                logger.exception(
                    f"[Transcriber] local failed in hybrid_quality, fallback to openai: {e}"
                )
                return await self._openai_only(audio_path)

        logger.warning("[Transcriber] hybrid_quality: no local_client, using openai")
        return await self._openai_only(audio_path)

    # ============================================================================
    # 헬퍼 메서드
    # ============================================================================

    async def _with_retries(
        self,
        client: BaseWhisperClient,
        audio_path: str,
        fallback_openai: bool = False,
        **kwargs,
    ) -> TranscriptionResult:
        """
        Retry 로직 with Graceful Degradation

        Args:
            client: Whisper 클라이언트 (local 또는 openai)
            audio_path: 오디오 파일 경로
            fallback_openai: 모든 재시도 실패 시 OpenAI fallback 여부
            **kwargs: 클라이언트에 전달할 추가 파라미터
                - model_profile: str
                - language: str

        Returns:
            TranscriptionResult: 변환 결과

        Raises:
            Exception: fallback_openai=False이고 모든 시도 실패 시
        """
        last_exc: Optional[Exception] = None
        max_retries = self.settings.WHISPER_MAX_RETRIES

        for attempt in range(max_retries):
            try:
                logger.info(
                    f"[Transcriber] Attempt {attempt + 1}/{max_retries} "
                    f"with {client.__class__.__name__}"
                )
                return await client.transcribe(audio_path, **kwargs)

            except Exception as e:
                last_exc = e
                logger.warning(
                    f"[Transcriber] Attempt {attempt + 1}/{max_retries} failed: {e}"
                )

        # 모든 재시도 실패
        if fallback_openai:
            logger.info("[Transcriber] All local attempts failed, fallback to openai")
            return await self._openai_only(audio_path)

        # fallback 없이 실패
        raise last_exc or RuntimeError("Transcriber: all attempts failed without fallback")

    def _choose_model_profile(self, duration_seconds: float) -> str:
        """
        회의 길이에 따라 최적의 모델 프로필 선택

        전략:
        - ≤15분: FAST (small) - 빠른 응답 우선
        - 15~60분: BALANCED (medium) - 속도/정확도 균형
        - ≥60분: ACCURATE (large-v3) - 정확도 우선

        Args:
            duration_seconds: 오디오 길이(초)

        Returns:
            model_profile: "small" | "medium" | "large-v3"
        """
        duration_minutes = duration_seconds / 60

        if duration_seconds <= 15 * 60:
            profile = self.settings.WHISPER_PROFILE_FAST  # "small"
            logger.info(f"[Transcriber] Short meeting ({duration_minutes:.1f}min) → {profile}")
            return profile

        if duration_seconds <= 60 * 60:
            profile = self.settings.WHISPER_PROFILE_BALANCED  # "medium"
            logger.info(f"[Transcriber] Medium meeting ({duration_minutes:.1f}min) → {profile}")
            return profile

        profile = self.settings.WHISPER_PROFILE_ACCURATE  # "large-v3"
        logger.info(f"[Transcriber] Long meeting ({duration_minutes:.1f}min) → {profile}")
        return profile
```

### 3-3. 구현 체크리스트

- [ ] `TranscriberService` 클래스 작성
- [ ] 4가지 모드 구현 (`_openai_only`, `_local_only`, `_hybrid_cost`, `_hybrid_quality`)
- [ ] Retry 로직 구현 (`_with_retries`)
- [ ] 모델 프로필 자동 선택 로직 구현 (`_choose_model_profile`)
- [ ] 환경변수 확인: `WHISPER_MODE`, `WHISPER_LOCAL_BACKEND`, `WHISPER_OPENAI_MAX_MINUTES`
- [ ] 단위 테스트: 모드별 동작 검증
- [ ] 통합 테스트: 실제 오디오 파일로 엔드투엔드 테스트

---

## 4. Step 3: API 엔드포인트 업데이트

### 4-1. 파일 위치
**경로**: `backend/app/api/routes/meetings.py`

### 4-2. Request/Response 스키마

```python
# app/schemas/transcriber.py (일부)
from pydantic import BaseModel, Field
from typing import Optional, List

class TranscribeRequest(BaseModel):
    """
    POST /meetings/{id}/transcribe 요청 스키마
    """
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
    """
    POST /meetings/{id}/transcribe 응답 스키마
    """
    meeting_id: int
    transcript_id: int
    source_type: str  # "whisper"
    backend: str  # "faster_whisper" | "whisper_cpp" | "openai"
    model: str  # "large-v3" | "medium" | "small" | "whisper-1"
    language: str  # "ko" | "en" | ...
    duration_seconds: float
    latency_ms: int
    is_primary: bool
    status: str  # "completed" | "failed"
    meeting_agent_triggered: bool
```

### 4-3. API 엔드포인트 구현

```python
# app/api/routes/meetings.py
"""
Meeting 관련 API 엔드포인트

작성일: 2025-11-24
작성자: B팀 (Backend)
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.meeting import Meeting
from app.models.meeting_transcript import MeetingTranscript
from app.schemas.transcriber import (
    TranscribeRequest,
    TranscribeResponse,
    TranscriptionResult,
)
from app.services.transcriber import TranscriberService
from app.services.meeting_audio import get_meeting_audio_source
from app.services.meeting_agent import run_meeting_agent_for_meeting
from app.core.settings import WhisperMode

router = APIRouter()


@router.post("/meetings/{meeting_id}/transcribe", response_model=TranscribeResponse)
async def transcribe_meeting(
    meeting_id: int,
    body: TranscribeRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Meeting 음성을 텍스트로 변환

    Flow:
    1. Meeting 존재 확인
    2. 오디오 소스 확보 (경로 + duration)
    3. TranscriberService로 STT 실행
    4. meeting_transcripts 테이블에 저장
    5. (옵션) MeetingAgent 비동기 실행

    Args:
        meeting_id: Meeting ID
        body: TranscribeRequest
        background_tasks: FastAPI BackgroundTasks
        db: DB 세션

    Returns:
        TranscribeResponse: 변환 결과 메타데이터

    Raises:
        404: Meeting not found
        400: No audio source
        500: Transcription failed
    """
    # 1. Meeting 존재 확인
    meeting = await Meeting.get_by_id(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # 2. 오디오 소스 확보
    # TODO: get_meeting_audio_source 구현 필요
    # - YouTube URL → yt-dlp로 다운로드 → 로컬 경로 반환
    # - 업로드 파일 → MinIO에서 다운로드 → 로컬 경로 반환
    # - ffprobe로 duration 계산
    audio_path, duration_seconds = await get_meeting_audio_source(db, meeting)
    if not audio_path:
        raise HTTPException(status_code=400, detail="No audio source for this meeting")

    # 3. TranscriberService 준비
    transcriber = TranscriberService()
    original_mode = transcriber.mode

    # force_mode 또는 importance로 모드 오버라이드
    if body.force_mode:
        try:
            transcriber.mode = WhisperMode(body.force_mode)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid force_mode: {body.force_mode}. "
                       "Must be one of: openai, local, hybrid_cost, hybrid_quality"
            )
    elif body.importance == "high":
        # 중요 회의는 품질 우선 모드 강제
        transcriber.mode = WhisperMode.hybrid_quality

    # 4. STT 실행
    try:
        result: TranscriptionResult = await transcriber.transcribe(
            audio_path=audio_path,
            duration_seconds=duration_seconds,
            importance=body.importance,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {str(e)}"
        )
    finally:
        # 모드 복원
        transcriber.mode = original_mode

    # 5. 기존 primary transcript 처리
    if body.reprocess:
        # 재처리 모드: 기존 primary 플래그 제거
        await MeetingTranscript.clear_primary_for_meeting(db, meeting_id)

    # 6. meeting_transcripts 테이블에 저장
    transcript = MeetingTranscript(
        meeting_id=meeting_id,
        source_type="whisper",
        provider=meeting.provider or "upload",  # "youtube" | "zoom" | "upload"
        backend=result.backend,  # "faster_whisper" | "openai" | ...
        model=result.model,  # "large-v3" | "whisper-1" | ...
        language=result.language,  # "ko" | "en" | ...
        text=result.text,  # 전체 텍스트
        segments_json=[s.dict() for s in result.segments],  # 세그먼트 배열
        duration_seconds=result.duration_seconds,
        latency_ms=result.latency_ms,
        confidence=result.confidence,
        quality_score=None,  # TODO: 품질 점수 계산 (추후)
        is_primary=True,  # 새로 생성한 transcript를 primary로 설정
    )
    db.add(transcript)
    await db.commit()
    await db.refresh(transcript)

    # 7. MeetingAgent 비동기 실행 (Background Task)
    meeting_agent_triggered = False
    if body.run_meeting_agent:
        # TODO: run_meeting_agent_for_meeting 구현 필요
        # - transcript.text를 MeetingAgent에 전달
        # - 요약, 액션 아이템, 주요 내용 추출
        # - meeting_summaries 테이블에 저장
        background_tasks.add_task(
            run_meeting_agent_for_meeting,
            meeting_id=meeting_id
        )
        meeting_agent_triggered = True

    # 8. 응답 생성
    return TranscribeResponse(
        meeting_id=meeting_id,
        transcript_id=transcript.id,
        source_type=transcript.source_type,
        backend=transcript.backend,
        model=transcript.model,
        language=transcript.language,
        duration_seconds=float(transcript.duration_seconds),
        latency_ms=transcript.latency_ms,
        is_primary=transcript.is_primary,
        status="completed",
        meeting_agent_triggered=meeting_agent_triggered,
    )
```

### 4-4. 구현 체크리스트

- [ ] `TranscribeRequest`, `TranscribeResponse` 스키마 정의
- [ ] `POST /meetings/{id}/transcribe` 엔드포인트 구현
- [ ] `get_meeting_audio_source` 헬퍼 함수 구현 (YouTube/업로드 파일 처리)
- [ ] `MeetingTranscript.clear_primary_for_meeting` 메서드 구현
- [ ] `run_meeting_agent_for_meeting` Background Task 구현 (또는 기존 코드 활용)
- [ ] API 테스트: Postman/curl로 요청 → 응답 검증
- [ ] 에러 핸들링: 404, 400, 500 케이스 테스트

---

## 5. A/C팀 협업 가이드

### 5-1. A팀 (QA) - Golden Set 설계 포인트

A팀이 테스트해야 할 핵심 시나리오:

#### 테스트 카테고리 1: 모드별 동작 검증

| 테스트 케이스 | 입력 | 기대 결과 |
|------------|------|---------|
| `test_openai_mode` | `WHISPER_MODE=openai`, 15분 오디오 | `backend="openai"`, `model="whisper-1"` |
| `test_local_mode` | `WHISPER_MODE=local`, 15분 오디오 | `backend="faster_whisper"`, `model="large-v3"` |
| `test_hybrid_cost_short` | `WHISPER_MODE=hybrid_cost`, 10분 오디오 | OpenAI 우선 사용 |
| `test_hybrid_cost_long` | `WHISPER_MODE=hybrid_cost`, 90분 오디오 | 로컬 우선 사용 |
| `test_hybrid_quality` | `WHISPER_MODE=hybrid_quality`, 60분 오디오 | 로컬 large-v3 사용 |

#### 테스트 카테고리 2: Fallback & Retry 검증

| 테스트 케이스 | 입력 | 기대 결과 |
|------------|------|---------|
| `test_local_failure_fallback` | 로컬 서버 다운 + `hybrid_cost` | OpenAI fallback 성공 |
| `test_retry_3_times` | 로컬 Timeout 3회 | 3회 재시도 후 OpenAI fallback |
| `test_no_fallback_mode` | `WHISPER_MODE=local`, 로컬 다운, fallback 비활성화 | 에러 발생 |

#### 테스트 카테고리 3: DB 저장 검증

| 테스트 케이스 | 검증 항목 |
|------------|---------|
| `test_transcript_saved` | `meeting_transcripts` 테이블에 레코드 생성 |
| `test_primary_flag` | `is_primary=True` 설정 |
| `test_reprocess_clears_primary` | `reprocess=true` 시 기존 primary 플래그 제거 |
| `test_segments_json_format` | `segments_json` 필드 형식 검증 |

#### 테스트 카테고리 4: API 계약 검증

```python
# tests/test_transcribe_api.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_transcribe_api_success(client: AsyncClient):
    """성공 케이스: 15분 YouTube 회의 변환"""
    response = await client.post(
        "/api/v1/meetings/123/transcribe",
        json={
            "force_mode": "hybrid_cost",
            "reprocess": False,
            "importance": "normal",
            "run_meeting_agent": True
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["meeting_id"] == 123
    assert data["backend"] in ["faster_whisper", "openai"]
    assert data["status"] == "completed"
    assert data["meeting_agent_triggered"] is True

@pytest.mark.asyncio
async def test_transcribe_api_invalid_mode(client: AsyncClient):
    """에러 케이스: 잘못된 force_mode"""
    response = await client.post(
        "/api/v1/meetings/123/transcribe",
        json={"force_mode": "invalid_mode"}
    )
    assert response.status_code == 400
    assert "Invalid force_mode" in response.json()["detail"]
```

### 5-2. C팀 (Frontend) - API 연동 가이드

#### TypeScript 타입 정의

```typescript
// types/transcriber.ts
export interface TranscribeRequest {
  force_mode?: 'openai' | 'local' | 'hybrid_cost' | 'hybrid_quality';
  reprocess?: boolean;
  importance?: 'normal' | 'high';
  run_meeting_agent?: boolean;
}

export interface TranscribeResponse {
  meeting_id: number;
  transcript_id: number;
  source_type: string;
  backend: string;  // "faster_whisper" | "openai" | ...
  model: string;  // "large-v3" | "whisper-1" | ...
  language: string;
  duration_seconds: number;
  latency_ms: number;
  is_primary: boolean;
  status: 'completed' | 'failed';
  meeting_agent_triggered: boolean;
}
```

#### API 호출 예시 (React)

```typescript
// hooks/useTranscribeMeeting.ts
import { useMutation } from '@tanstack/react-query';
import { TranscribeRequest, TranscribeResponse } from '@/types/transcriber';

export function useTranscribeMeeting(meetingId: number) {
  return useMutation<TranscribeResponse, Error, TranscribeRequest>({
    mutationFn: async (request: TranscribeRequest) => {
      const response = await fetch(
        `/api/v1/meetings/${meetingId}/transcribe`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Transcription failed');
      }

      return response.json();
    },
  });
}

// 컴포넌트에서 사용
function MeetingDetailPage({ meetingId }: { meetingId: number }) {
  const { mutate: transcribe, isLoading, isError, error, data } =
    useTranscribeMeeting(meetingId);

  const handleTranscribe = () => {
    transcribe({
      force_mode: 'hybrid_cost',
      importance: 'high',
      run_meeting_agent: true,
    });
  };

  return (
    <div>
      <button onClick={handleTranscribe} disabled={isLoading}>
        {isLoading ? 'Transcribing...' : 'Start Transcription'}
      </button>

      {isError && <div className="error">{error.message}</div>}

      {data && (
        <div className="result">
          <p>Backend: {data.backend}</p>
          <p>Model: {data.model}</p>
          <p>Duration: {data.duration_seconds}s</p>
          <p>Latency: {data.latency_ms}ms</p>
        </div>
      )}
    </div>
  );
}
```

#### UI 컴포넌트 가이드

C팀이 구현할 UI 요소:

1. **Transcribe 버튼** (Meeting 상세 페이지)
   - 위치: Meeting 상세 페이지 상단
   - 상태: 로딩/완료/에러
   - 옵션: 중요도 선택 (normal/high)

2. **Transcript 뷰어** (변환 완료 후)
   - 전체 텍스트 표시
   - 세그먼트별 타임스탬프 표시
   - 메타데이터 (backend, model, duration, latency)

3. **디버그 패널** (개발자용)
   - 사용된 백엔드 표시
   - 모델 프로필 표시
   - 변환 소요 시간 (latency_ms)

---

## 6. 다음 단계 체크리스트

### 6-1. B팀 구현 순서

```
Phase 1: 기본 구현 (2-3일)
├── [x] 스펙 문서 작성 완료 (MEETING_AI_TRANSCRIBER_SPEC.md)
├── [ ] transcriber_clients.py 구현 (FasterWhisperClient 우선)
├── [ ] transcriber.py 구현 (4-Mode 로직)
└── [ ] meetings.py 엔드포인트 업데이트

Phase 2: 통합 테스트 (1-2일)
├── [ ] RTX Desktop 서버 연동 테스트
├── [ ] 실제 YouTube 회의 변환 테스트
├── [ ] 모드별 동작 검증
└── [ ] Fallback/Retry 시나리오 테스트

Phase 3: A/C팀 연동 (1일)
├── [ ] A팀: Golden Set 기반 회귀 테스트
├── [ ] C팀: Meeting 상세 페이지 UI 연동
└── [ ] E2E 테스트 (프론트 → 백엔드 → RTX Desktop)

Phase 4: Mac mini 배포 (1일)
├── [ ] Mac mini 서버에 코드 동기화
├── [ ] 환경변수 설정 (`WHISPER_MODE=hybrid_cost`)
├── [ ] Docker Compose 재시작
└── [ ] Health Check 및 Smoke Test
```

### 6-2. 필수 TODO 항목

#### 우선순위 1 (블로킹)

- [ ] **RTX Desktop faster-whisper 서버 구동 확인**
  - 명령어: `curl http://100.120.180.42:9000/health`
  - 기대 결과: `{"status": "ok"}`

- [ ] **환경변수 설정 (backend/.env)**
  ```bash
  WHISPER_MODE=hybrid_cost
  WHISPER_LOCAL_BACKEND=faster_whisper
  WHISPER_FAST_ENDPOINT=http://100.120.180.42:9000/transcribe
  WHISPER_OPENAI_MAX_MINUTES=20
  WHISPER_MAX_RETRIES=3
  WHISPER_TIMEOUT_SECONDS=300
  WHISPER_PROFILE_FAST=small
  WHISPER_PROFILE_BALANCED=medium
  WHISPER_PROFILE_ACCURATE=large-v3
  ```

- [ ] **FasterWhisperClient 단위 테스트**
  ```bash
  cd backend
  pytest tests/test_transcriber_clients.py::test_faster_whisper_client -v
  ```

#### 우선순위 2 (중요)

- [ ] **TranscriberService 모드별 테스트**
  ```bash
  pytest tests/test_transcriber_service.py -v
  ```

- [ ] **API 엔드포인트 통합 테스트**
  ```bash
  pytest tests/test_transcribe_api.py -v
  ```

- [ ] **실제 YouTube 회의로 E2E 테스트**
  - 테스트 URL: [짧은 회의 예시](https://www.youtube.com/watch?v=dQw4w9WgXcQ)
  - 예상 소요 시간: 10-20초

#### 우선순위 3 (선택)

- [ ] **OpenAI Whisper API 연동 구현** (OpenAIWhisperClient)
- [ ] **whisper.cpp 서버 연동 구현** (WhisperCppClient)
- [ ] **MeetingAgent 자동 실행** (background task)
- [ ] **품질 점수 계산 로직** (confidence → quality_score)

### 6-3. 배포 전 확인사항

#### Mac mini 서버 체크리스트

- [ ] Docker Compose 서비스 정상 작동
  ```bash
  ssh woosun@100.123.51.5
  cd ~/sparklio_ai_marketing_studio/docker/mac-mini
  docker compose ps
  ```

- [ ] 환경변수 동기화 확인
  ```bash
  docker compose exec backend env | grep WHISPER
  ```

- [ ] Backend Health Check
  ```bash
  curl http://100.123.51.5:8000/health
  ```

- [ ] RTX Desktop 네트워크 연결 확인
  ```bash
  curl http://100.120.180.42:9000/health
  ```

- [ ] PostgreSQL `meeting_transcripts` 테이블 확인
  ```sql
  SELECT * FROM meeting_transcripts ORDER BY created_at DESC LIMIT 5;
  ```

---

## 7. 참고 자료

### 7-1. 관련 문서

- [MEETING_AI_TRANSCRIBER_SPEC.md](./MEETING_AI_TRANSCRIBER_SPEC.md) - 상세 스펙
- [MEETING_AI_ARCHITECTURE.md](../../docs/MEETING_AI_ARCHITECTURE.md) - 전체 아키텍처
- [MAC_MINI_SERVER_GUIDELINES.md](../../docs/MAC_MINI_SERVER_GUIDELINES.md) - 서버 운영 가이드
- [B_TEAM_HANDOVER_GUIDE_2025-11-23.md](./B_TEAM_HANDOVER_GUIDE_2025-11-23.md) - B팀 인수인계

### 7-2. 외부 리소스

- [faster-whisper GitHub](https://github.com/guillaumekln/faster-whisper)
- [OpenAI Whisper API 문서](https://platform.openai.com/docs/guides/speech-to-text)
- [whisper.cpp GitHub](https://github.com/ggerganov/whisper.cpp)

### 7-3. 연락처

- **B팀 리드**: Backend 담당자
- **A팀 QA**: QA 담당자
- **RTX Desktop 관리자**: 인프라 담당자

---

**작성 완료**: 2025-11-24 (일요일)
**다음 업데이트**: 구현 진행 상황에 따라 수시 업데이트
