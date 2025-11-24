# Meeting AI Transcriber & Whisper Hybrid Spec

**작성일**: 2025-11-24
**버전**: v2.0 (통합 버전)
**대상 팀**: A팀(QA), B팀(Backend), C팀(Frontend)

---

## 📋 목차

1. [목표 & 스코프](#1-목표--스코프)
2. [전체 아키텍처 개요](#2-전체-아키텍처-개요)
3. [환경 변수 & 모드 정의](#3-환경-변수--모드-정의)
4. [DB 스키마](#4-db-스키마)
5. [TranscriberService 설계](#5-transcriberservice-설계)
6. [API 스펙](#6-api-스펙)
7. [RTX Desktop faster-whisper 서버 스펙](#7-rtx-desktop-faster-whisper-서버-스펙)
8. [QA 테스트 플랜](#8-qa-테스트-플랜)
9. [프론트엔드 연동 가이드](#9-프론트엔드-연동-가이드)
10. [팀별 역할 및 체크리스트](#10-팀별-역할-및-체크리스트)

---

## 1. 목표 & 스코프

### 1.1 목표

Meeting AI에서 사용하는 **음성 → 텍스트(STT) 인프라를 표준화**하고, 다양한 소스를 **하나의 통일된 Transcript Layer**로 만드는 것을 목표로 한다.

**입력**:
- 회의 녹음 파일 (mp3, wav, m4a, mp4…)
- YouTube/URL 등에서 가져온 오디오
- 추후 Zoom/Google Meet/Teams API로 가져온 회의

**처리**:
- 기본 STT 엔진: **RTX Desktop의 faster-whisper(GPU)**
- **whisper.cpp(Mac mini)** & **OpenAI Whisper**는 백업/보조 역할
- 회의 길이·중요도·비용을 고려한 **하이브리드 전략** 적용

**출력**:
- DB `meeting_transcripts`에 통일된 스키마로 저장
- MeetingAgent / Meeting→Brief Agent는 이 레이어만 바라보고 동작

### 1.2 핵심 설계 원칙

1. **입력 독립성**: 입력 소스(파일/URL/YouTube)와 관계없이, 모든 입력은 표준화된 Transcript로 변환
2. **다중 Transcript 지원**: 하나의 Meeting은 여러 Transcript를 가질 수 있음 (caption, whisper, merged 등)
3. **Primary Transcript Pattern**: `is_primary=true`인 Transcript가 MeetingAgent가 사용하는 메인 스크립트
4. **추적성**: `backend`, `model`, `latency_ms` 등으로 어떤 엔진이 사용되었는지 추적 가능

---

## 2. 전체 아키텍처 개요

### 2.1 High-Level Flow

```
[사용자 브라우저 - C팀]
  └─ 회의 생성 / 파일 업로드 / URL 등록
        ↓
[Backend - B팀]
  └─ Meeting 레코드 + Audio Source 저장 (DB/MinIO)
        ↓
[TranscriberService - B팀]
  └─ duration 계산 (ffprobe)
  └─ WHISPER_MODE / 길이 / 중요도에 따라 엔진 선택
       - 우선: RTX Desktop faster-whisper HTTP 서버
       - 실패 or 정책에 따라 OpenAI / whisper.cpp 백업
        ↓
[meeting_transcripts 테이블 - B팀]
  └─ transcript row 생성 (source_type=whisper, backend=faster_whisper 등)
  └─ is_primary = true 지정
        ↓
[MeetingAgent - B팀]
  └─ primary transcript 기반으로 summary / decisions / actions 생성
        ↓
[Meeting→Brief Agent - B팀]
  └─ meeting_summary + Brand Kit → Campaign Brief 생성
        ↓
[프론트 UI - C팀]
  └─ Transcript / Summary / Brief 탭에 결과 표시
```

### 2.2 Whisper 전략 요약 (3-Tier Strategy)

| 순위 | 백엔드 | 환경 | 역할 |
|-----|-------|------|------|
| **P0** | **faster-whisper** | RTX Desktop GPU | **메인 STT**, 모든 트래픽 처리 |
| **P1** | **whisper.cpp** | Mac mini CPU (선택) | Desktop 장애 시 백업 |
| **P2** | **OpenAI Whisper** | Cloud API | 최후 fallback + PoC/테스트 |

---

## 3. 환경 변수 & 모드 정의

### 3.1 .env 설정 (B팀 기준)

```bash
# Whisper 전략 모드
WHISPER_MODE=hybrid_cost             # openai | local | hybrid_cost | hybrid_quality

# 로컬 백엔드 기본값: RTX Desktop faster-whisper
WHISPER_LOCAL_BACKEND=faster_whisper # whisper_cpp | faster_whisper | none

# RTX Desktop faster-whisper 서버
WHISPER_FAST_ENDPOINT=http://100.123.51.6:9000/transcribe

# (옵션) Mac mini whisper.cpp 서버
WHISPER_CPP_ENDPOINT=http://127.0.0.1:8765/transcribe

# OpenAI Whisper
WHISPER_OPENAI_MODEL=whisper-1
WHISPER_OPENAI_MAX_MINUTES=20   # 이 이하의 짧은 회의에서만 OpenAI 사용

# 길이별 모델 프로필 (로컬 엔진 내부에서 사용)
WHISPER_PROFILE_FAST=small          # ≤15분
WHISPER_PROFILE_BALANCED=medium     # 15~60분
WHISPER_PROFILE_ACCURATE=large-v3   # ≥60분

WHISPER_TIMEOUT_SECONDS=600         # 10분
WHISPER_MAX_RETRIES=2
```

### 3.2 모드별 동작 (A팀 QA 검증 대상)

#### Mode 1: `openai` - OpenAI 전용

```
모든 회의 → OpenAI Whisper 사용
실패 → 에러
```

**적용 케이스**: 초기 PoC, 테스트 환경

#### Mode 2: `local` - 로컬 전용

```
모든 회의 → 로컬(기본: faster-whisper) 사용
실패 → (옵션) OpenAI fallback 또는 에러
```

**적용 케이스**: 오프라인 환경, 보안 요구사항

#### Mode 3: `hybrid_cost` (기본값, 권장) - 비용 절감 우선

```
1. duration 계산 (ffprobe)

2. IF duration <= WHISPER_OPENAI_MAX_MINUTES (기본 20분):
   - 짧은 회의 → OpenAI로 빠른 처리 시도
   - 실패 시 → faster-whisper fallback

3. ELSE (긴 회의):
   - faster-whisper 우선 (GPU로 비용 절감)
   - 실패 시 → OpenAI fallback
```

**적용 케이스**: 일반 회의, 일일 스탠드업, 짧은 미팅

#### Mode 4: `hybrid_quality` - 품질 우선

```
1. 길이 상관없이 faster-whisper(large-v3) 우선
2. 실패 → OpenAI Whisper fallback
```

**적용 케이스**: 클라이언트 미팅, 세미나, 중요 회의

---

## 4. DB 스키마

### 4.1 개념

한 회의에 대해 **여러 Transcript 버전 존재 가능**:
- **caption**: YouTube/Zoom 등 플랫폼 자막
- **whisper**: STT 엔진 출력 (faster-whisper, whisper.cpp, OpenAI)
- **merged**: caption + whisper 통합본 (옵션)
- **manual**: 사람이 수정한 최종본

항상 `is_primary = true`인 1건이 MeetingAI의 기준 transcript

### 4.2 PostgreSQL Schema

```sql
-- Enum Types
CREATE TYPE transcript_source_type AS ENUM (
  'caption',
  'whisper',
  'merged',
  'manual'
);

CREATE TYPE transcript_provider AS ENUM (
  'upload',
  'youtube',
  'zoom',
  'gmeet',
  'teams',
  'manual'
);

CREATE TYPE transcript_backend AS ENUM (
  'openai',
  'whisper_cpp',
  'faster_whisper',
  'manual',
  'unknown'
);

-- Table
CREATE TABLE meeting_transcripts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id       UUID NOT NULL REFERENCES meetings (id) ON DELETE CASCADE,

  -- 소스 정보
  source_type      transcript_source_type NOT NULL,  -- caption | whisper | merged | manual
  provider         transcript_provider NOT NULL,     -- upload | youtube | zoom | gmeet | teams | manual
  backend          transcript_backend NOT NULL,      -- openai | whisper_cpp | faster_whisper | manual | unknown
  model            VARCHAR(100),                      -- whisper-1, large-v3, medium 등

  -- Primary 지정
  is_primary       BOOLEAN NOT NULL DEFAULT FALSE,

  -- 품질 및 메트릭
  quality_score    FLOAT,                             -- 0.0 ~ 1.0 (자동 계산)
  confidence       FLOAT,                             -- 0.0 ~ 1.0 (Whisper confidence)
  latency_ms       INTEGER,                           -- STT 처리 시간 (ms)

  -- 트랜스크립트 데이터
  language         VARCHAR(10),                       -- ko, en 등
  transcript_text  TEXT NOT NULL,
  segments         JSONB,                             -- [{"start": 0.0, "end": 3.2, "text": "..."}]

  -- 메타데이터
  whisper_metadata JSONB,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_meeting_transcripts_meeting_id
  ON meeting_transcripts (meeting_id);

CREATE INDEX idx_meeting_transcripts_primary
  ON meeting_transcripts (meeting_id, is_primary);
```

### 4.3 컬럼 설명 (A/B/C팀 공통 이해용)

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| **meeting_id** | UUID | 어떤 회의의 transcript인지 | `a1b2c3...` |
| **source_type** | enum | caption / whisper / merged / manual | `whisper` |
| **provider** | enum | upload / youtube / zoom / gmeet / teams / manual | `upload` |
| **backend** | enum | openai / whisper_cpp / faster_whisper / manual / unknown | `faster_whisper` |
| **model** | varchar | 실제 모델 명 | `large-v3` |
| **is_primary** | boolean | MeetingAgent가 사용하는 대표 transcript | `true` |
| **quality_score** | float | 0.0~1.0, 자동 계산 품질 점수 | `0.85` |
| **confidence** | float | 0.0~1.0, Whisper confidence | `0.92` |
| **latency_ms** | integer | STT 처리 시간 (ms) | `52340` |
| **transcript_text** | text | 전체 트랜스크립트 텍스트 | `"안녕하세요..."` |
| **segments** | jsonb | 타임스탬프 세그먼트 | `[{"start": 0.0, "end": 3.2, "text": "..."}]` |

---

## 5. TranscriberService 설계

### 5.1 공통 결과 스키마 (TranscriptionResult)

```python
# app/schemas/transcriber.py
from pydantic import BaseModel
from typing import List, Optional

class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str

class TranscriptionResult(BaseModel):
    text: str
    segments: List[TranscriptSegment]
    language: str
    duration_seconds: float
    backend: str      # "faster_whisper" | "openai" | "whisper_cpp"
    model: str        # "large-v3" | "whisper-1" ...
    latency_ms: int
    confidence: Optional[float] = None
```

### 5.2 클라이언트 구조

```python
# Base Interface
class BaseWhisperClient(ABC):
    @abstractmethod
    async def transcribe(self, audio_path: str, **kwargs) -> TranscriptionResult:
        ...

# Implementations
class OpenAIWhisperClient(BaseWhisperClient):
    """OpenAI Audio API 호출"""
    ...

class WhisperCppClient(BaseWhisperClient):
    """Mac mini whisper.cpp HTTP 서버 호출"""
    ...

class FasterWhisperClient(BaseWhisperClient):
    """RTX Desktop faster-whisper HTTP 서버 호출"""
    ...
```

### 5.3 TranscriberService 핵심 로직

```python
# app/services/transcriber.py
class TranscriberService:
    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or Settings()
        self.mode = self.settings.WHISPER_MODE
        self.openai_client = OpenAIWhisperClient(self.settings)

        if self.settings.WHISPER_LOCAL_BACKEND == WhisperLocalBackend.whisper_cpp:
            self.local_client = WhisperCppClient(self.settings)
        elif self.settings.WHISPER_LOCAL_BACKEND == WhisperLocalBackend.faster_whisper:
            self.local_client = FasterWhisperClient(self.settings)
        else:
            self.local_client = None

    async def transcribe(
        self,
        audio_path: str,
        duration_seconds: float,
        force_mode: Optional[str] = None
    ) -> TranscriptionResult:
        """
        음성 파일을 텍스트로 변환

        Args:
            audio_path: 오디오 파일 경로
            duration_seconds: 오디오 길이 (초)
            force_mode: 모드 강제 (openai | local | hybrid_cost | hybrid_quality)

        Returns:
            TranscriptionResult
        """
        mode = force_mode or self.mode

        if mode == WhisperMode.openai:
            return await self._openai_only(audio_path)

        if mode == WhisperMode.local:
            return await self._local_only(audio_path)

        if mode == WhisperMode.hybrid_cost:
            return await self._hybrid_cost(audio_path, duration_seconds)

        if mode == WhisperMode.hybrid_quality:
            return await self._hybrid_quality(audio_path, duration_seconds)

        # Default fallback
        return await self._openai_only(audio_path)

    async def _hybrid_cost(
        self,
        audio_path: str,
        duration_seconds: float
    ) -> TranscriptionResult:
        """
        hybrid_cost 모드:
        - 짧은 회의 (≤ WHISPER_OPENAI_MAX_MINUTES): OpenAI 우선 → local fallback
        - 긴 회의: local 우선 → OpenAI fallback
        """
        max_minutes = self.settings.WHISPER_OPENAI_MAX_MINUTES or 20

        if duration_seconds <= max_minutes * 60:
            # 짧은 회의: OpenAI 우선
            try:
                return await self.openai_client.transcribe(audio_path)
            except Exception as e:
                logger.warning(f"OpenAI failed, fallback to local: {e}")
                if self.local_client:
                    return await self.local_client.transcribe(audio_path)
                raise
        else:
            # 긴 회의: local 우선
            if self.local_client:
                try:
                    return await self.local_client.transcribe(audio_path)
                except Exception as e:
                    logger.warning(f"Local failed, fallback to OpenAI: {e}")
                    return await self.openai_client.transcribe(audio_path)
            else:
                return await self.openai_client.transcribe(audio_path)

    async def _hybrid_quality(
        self,
        audio_path: str,
        duration_seconds: float
    ) -> TranscriptionResult:
        """
        hybrid_quality 모드:
        - 무조건 local(large-v3) 우선 → OpenAI fallback
        """
        if self.local_client:
            try:
                return await self.local_client.transcribe(
                    audio_path,
                    model="large-v3"  # 품질 우선
                )
            except Exception as e:
                logger.warning(f"Local failed, fallback to OpenAI: {e}")
                return await self.openai_client.transcribe(audio_path)
        else:
            return await self.openai_client.transcribe(audio_path)

    # ... (기타 메서드 생략)
```

---

## 6. API 스펙

### 6.1 POST /api/v1/meetings/{meeting_id}/transcribe

**목적**: 특정 Meeting에 연결된 오디오 소스를 기반으로 STT 실행 및 transcript 생성

#### Request

```http
POST /api/v1/meetings/123/transcribe
Content-Type: application/json

{
  "force_mode": null,           // "openai" | "local" | "hybrid_cost" | "hybrid_quality" (없으면 .env)
  "reprocess": false,           // true면 기존 primary transcript 무시하고 새로 생성
  "importance": "normal",       // "normal" | "high" (high -> hybrid_quality 강제 등 정책 가능)
  "run_meeting_agent": true     // true면 STT 완료 후 MeetingAgent 실행
}
```

#### Response (성공)

```json
{
  "meeting_id": "uuid-123",
  "transcript_id": "uuid-987",
  "source_type": "whisper",
  "backend": "faster_whisper",
  "model": "large-v3",
  "language": "ko",
  "duration_seconds": 3600.5,
  "latency_ms": 52340,
  "is_primary": true,
  "status": "completed",
  "meeting_agent_triggered": true
}
```

#### Response (에러)

```json
{
  "error": {
    "code": "transcription_failed",
    "message": "All STT engines failed",
    "details": {
      "faster_whisper_error": "Connection timeout",
      "openai_error": "API rate limit exceeded"
    }
  }
}
```

### 6.2 주요 동작 플로우 (B팀 구현)

1. Meeting 존재 확인 (404 처리)
2. `get_meeting_audio_source(meeting)`로 오디오 파일과 duration_seconds 확보
3. TranscriberService 생성
   - `force_mode` 또는 `importance=high`에 따라 mode 임시 override
4. `transcribe(audio_path, duration_seconds)` 호출
5. `reprocess=true`면, 기존 primary transcript의 `is_primary=false`로 갱신
6. 새로운 `meeting_transcripts` row 생성 (`source_type='whisper'`, `is_primary=true`)
7. `run_meeting_agent=true`면 BackgroundTasks로 MeetingAgent 실행
8. Response 반환

---

## 7. RTX Desktop faster-whisper 서버 스펙

### 7.1 엔드포인트

- **Base URL**: `http://100.123.51.6:9000`
- **메인 엔드포인트**: `POST /transcribe`

### 7.2 Request (multipart/form-data)

```http
POST /transcribe HTTP/1.1
Host: 100.123.51.6:9000
Content-Type: multipart/form-data; boundary=----Boundary

------Boundary
Content-Disposition: form-data; name="audio_file"; filename="meeting.wav"
Content-Type: audio/wav

<바이너리 데이터>
------Boundary
Content-Disposition: form-data; name="model"

large-v3
------Boundary
Content-Disposition: form-data; name="language"

auto
------Boundary
Content-Disposition: form-data; name="task"

transcribe
------Boundary
Content-Disposition: form-data; name="temperature"

0.0
------Boundary--
```

**필드**:
- `audio_file` (필수): 오디오 바이너리
- `model` (선택): small | medium | large-v3 등
- `language` (선택): auto 또는 ko, en 등
- `task` (선택): transcribe / translate
- `temperature` (선택): 0.0 ~ 1.0

### 7.3 Response (성공)

```json
{
  "backend": "faster_whisper",
  "model": "large-v3",
  "language": "ko",
  "duration": 3600.52,
  "latency_ms": 52340,
  "text": "전체 transcript 내용...",
  "segments": [
    {
      "id": 0,
      "start": 0.00,
      "end": 3.20,
      "text": "첫 번째 문장입니다."
    },
    {
      "id": 1,
      "start": 3.20,
      "end": 7.80,
      "text": "두 번째 문장입니다."
    }
  ],
  "confidence": 0.92
}
```

### 7.4 Response (에러)

```json
{
  "error": {
    "type": "internal_error",      // internal_error | invalid_audio | model_not_found | timeout
    "message": "Failed to run faster-whisper: CUDA out of memory.",
    "details": null
  }
}
```

---

## 8. QA 테스트 플랜

### 8.1 모드별 동작 (A팀 검증 대상)

| 테스트 케이스 | WHISPER_MODE | 회의 길이 | 예상 동작 | 검증 항목 |
|------------|--------------|----------|---------|---------|
| TC-1 | openai | 10분 | OpenAI만 호출 | backend='openai' |
| TC-2 | local | 60분 | faster-whisper만 호출 | backend='faster_whisper' |
| TC-3 | hybrid_cost | 10분 | OpenAI 우선 → 실패 시 faster-whisper | fallback 로직 |
| TC-4 | hybrid_cost | 90분 | faster-whisper 우선 → 실패 시 OpenAI | fallback 로직 |
| TC-5 | hybrid_quality | 10분 | faster-whisper(large-v3) 우선 | model='large-v3' |

### 8.2 백엔드 종류별

- 동일 오디오 파일에 대해 faster-whisper / whisper.cpp / OpenAI 결과 비교
- `backend`, `model`, `latency_ms`가 기대값과 일치하는지 검증

### 8.3 meeting_transcripts 일관성

- **reprocess=false**: 기존 primary 유지, 새 transcript는 `is_primary=false`
- **reprocess=true**: 기존 primary → `false`, 새 transcript → `true`
- MeetingAgent가 항상 `is_primary=true` transcript만 사용하는지

### 8.4 장애/에러 시나리오

- faster-whisper 서버 다운 / Timeout → OpenAI fallback 확인
- 잘못된 오디오 파일 → 적절한 에러 메시지 반환
- 프론트에서 사용자에게 적절한 메시지 표시

---

## 9. 프론트엔드 연동 가이드

### 9.1 기본 UX 플로우 (C팀)

1. Meeting 상세 페이지에서 "Transcribe" 버튼 클릭
2. `POST /api/v1/meetings/{id}/transcribe` 호출
   - 기본: `{ "importance": "normal", "run_meeting_agent": true }`
   - 중요한 회의: `{ "importance": "high" }` → hybrid_quality 전략
3. 응답이 성공이면:
   - "Transcript 준비 완료" 상태로 표시
   - Transcript/ Summary/ Brief 탭 데이터 재조회
4. 실패 시:
   - 백엔드에서 내려준 에러 메시지 표시
   - 필요 시 재시도 버튼 제공

### 9.2 표시하면 좋은 정보

Transcript 생성 후:
- **STT 엔진**: `backend` (faster_whisper, openai 등)
- **모델**: `model` (large-v3, whisper-1 등)
- **처리 시간**: `latency_ms` (예: 52초)
- **오디오 길이**: `duration_seconds` (예: 60분)

이 정보는 A팀 QA에도 유용한 Debug 정보이므로, 개발자 모드나 간단한 라벨로 노출 권장.

---

## 10. 팀별 역할 및 체크리스트

### 10.1 A팀 (QA)

- [ ] 모드별 동작 검증 (openai, local, hybrid_cost, hybrid_quality)
- [ ] Fallback 시나리오 테스트 (faster-whisper 다운 → OpenAI)
- [ ] Golden Set 작성 (5개 회의 샘플, 다양한 길이/중요도)
- [ ] meeting_transcripts primary 일관성 검증
- [ ] 에러 케이스 테스트 (잘못된 파일, 서버 장애 등)

### 10.2 B팀 (Backend)

- [ ] DB Schema 완성 (source_type, provider, backend, model 등)
- [ ] Alembic Migration 작성
- [ ] TranscriberService 구현 (4-mode strategy)
- [ ] FasterWhisperClient 구현 (RTX Desktop 서버 연동)
- [ ] WhisperCppClient 구현 (optional, Mac mini)
- [ ] OpenAIWhisperClient 구현
- [ ] `/meetings/{id}/transcribe` API 완성
- [ ] reprocess 로직 구현
- [ ] run_meeting_agent BackgroundTask 연동

### 10.3 C팀 (Frontend)

- [ ] Meeting 상세 페이지에 "Transcribe" 버튼 추가
- [ ] `/meetings/{id}/transcribe` API 연동
- [ ] 진행 상태 표시 (Transcribing... → Completed)
- [ ] backend, model, latency_ms 정보 표시 (개발자 모드)
- [ ] 에러 메시지 표시 및 재시도 버튼
- [ ] Transcript/Summary/Brief 탭 구현
- [ ] importance 옵션 UI (normal / high 토글)

---

## 부록

### A. Whisper 모델 비교

| 모델 | 파라미터 | 메모리 (GPU) | 속도 (RTX 3090 기준) | 정확도 |
|-----|---------|------------|-------------------|--------|
| **tiny** | 39M | ~1GB | 10x 실시간 | ★★☆☆☆ |
| **small** | 244M | ~2GB | 5x 실시간 | ★★★☆☆ |
| **medium** | 769M | ~5GB | 2x 실시간 | ★★★★☆ |
| **large-v3** | 1550M | ~10GB | 1x 실시간 | ★★★★★ |

**추천**:
- **기본값**: medium (속도+품질 균형)
- **중요 회의**: large-v3 (최고 품질)
- **빠른 처리**: small (스탠드업, 짧은 미팅)

### B. 환경별 권장 설정

#### 개발 환경 (노트북)
```bash
WHISPER_MODE=openai
WHISPER_OPENAI_MODEL=whisper-1
```

#### 스테이징 환경 (Mac mini + RTX Desktop)
```bash
WHISPER_MODE=hybrid_cost
WHISPER_LOCAL_BACKEND=faster_whisper
WHISPER_FAST_ENDPOINT=http://100.123.51.6:9000/transcribe
WHISPER_OPENAI_MAX_MINUTES=20
```

#### 프로덕션 환경
```bash
WHISPER_MODE=hybrid_cost
WHISPER_LOCAL_BACKEND=faster_whisper
WHISPER_FAST_ENDPOINT=http://100.123.51.6:9000/transcribe
WHISPER_CPP_ENDPOINT=http://127.0.0.1:8765/transcribe  # 백업
WHISPER_OPENAI_MAX_MINUTES=15  # 더 엄격하게
WHISPER_MAX_RETRIES=3
```

---

## 문의 및 기여

- **문서 관리**: B팀 (Backend)
- **업데이트 이력**: `git log docs/MEETING_AI_TRANSCRIBER_SPEC.md`
- **이슈 제보**: GitHub Issues
