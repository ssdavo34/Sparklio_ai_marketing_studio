# Meeting AI Architecture

**작성일**: 2025-11-24
**작성자**: B팀 (Backend)
**버전**: v2.0 (Transcript Layer 표준화)

---

## 📋 목차

1. [전체 개요](#전체-개요)
2. [핵심 설계 원칙](#핵심-설계-원칙)
3. [Transcript Layer 표준화](#transcript-layer-표준화)
4. [Whisper STT 전략](#whisper-stt-전략)
5. [입력 소스별 플로우](#입력-소스별-플로우)
6. [하이브리드 전략](#하이브리드-전략)
7. [API 구조](#api-구조)
8. [운영 가이드](#운영-가이드)

---

## 전체 개요

### Meeting AI의 목표

**입력**: 다양한 형태의 회의 녹음/영상
**출력**: 통일된 회의 분석 결과 (요약, 안건, 결정사항, 액션아이템, 캠페인 아이디어)

### 지원 입력 소스

| 소스 타입 | 설명 | 예시 |
|---------|------|------|
| **파일 업로드** | 직접 업로드한 음성/영상 파일 | mp4, mp3, m4a, wav |
| **YouTube URL** | YouTube 동영상 URL | `https://youtube.com/watch?v=...` |
| **기타 URL** | 동영상/오디오 URL | Vimeo, 직접 호스팅 등 |
| **(미래) 실시간 녹음** | WebRTC 실시간 녹음 | 브라우저 녹음 |
| **(미래) Zoom/Teams** | 회의 플랫폼 API 연동 | Zoom API, Teams API |

### 처리 플로우 (High-Level)

```
[사용자 입력]
  ↓
[Audio/Caption Extraction Layer]
  - Caption Fetcher (YouTube, Zoom, ...)
  - Audio Extractor (ffmpeg)
  ↓
[Transcript Layer] ⭐️ 핵심 표준화 레이어
  - Caption Transcript (source_type='caption')
  - Whisper Transcript (source_type='whisper')
  - Merged Transcript (source_type='merged')
  ※ 이 중 하나가 is_primary = true
  ↓
[Meeting Agent]
  - MeetingAgent: 요약/안건/결정/액션/캠페인 아이디어
  ↓
[Meeting → Brief Agent]
  - Brand Kit + Meeting Summary → Campaign Brief
  ↓
[Frontend]
  - Transcript 탭
  - Summary 탭
  - Brief 탭
```

---

## 핵심 설계 원칙

### 1. **입력 독립성 (Input Agnostic)**

**원칙**: 입력 소스(파일/URL/YouTube)와 관계없이, 모든 입력은 **표준화된 Transcript**로 변환됨

**이점**:
- 새로운 입력 소스 추가 시 Transcript Layer만 연결하면 됨
- MeetingAgent는 입력 소스를 몰라도 됨
- 소스별 특수 처리 로직이 격리됨

### 2. **다중 Transcript 지원 (Multiple Transcripts)**

**원칙**: 하나의 Meeting은 **여러 Transcript**를 가질 수 있음

**이점**:
- Caption과 Whisper를 둘 다 저장하여 품질 비교 가능
- 나중에 더 좋은 Transcript가 생성되면 primary 교체 가능
- 사용자가 수동으로 편집한 Transcript도 추가 가능

### 3. **Primary Transcript Pattern**

**원칙**: `is_primary=true`인 Transcript가 **MeetingAgent가 사용하는 메인 스크립트**

**이점**:
- MeetingAgent는 항상 "primary transcript"만 조회하면 됨
- Primary를 동적으로 교체하여 품질 개선 가능
- A/B 테스트 및 품질 실험 용이

### 4. **품질 기반 선택 (Quality-Based Selection)**

**원칙**: `quality_score`를 자동 계산하여 **가장 좋은 Transcript를 primary로 선택**

**품질 계산 기준**:
- 텍스트 길이 vs 영상 길이 비율
- 공백/특수문자 비율
- 언어 감지 일치도
- Whisper confidence 점수

---

## Transcript Layer 표준화

### DB 스키마: `meeting_transcripts`

```sql
CREATE TABLE meeting_transcripts (
    id UUID PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,

    -- 소스 정보
    source_type VARCHAR NOT NULL,  -- 'caption' | 'whisper' | 'merged'
    provider VARCHAR NOT NULL,      -- 'upload' | 'youtube' | 'zoom' | 'gmeet' | 'teams' | 'manual'

    -- Primary 지정
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    quality_score FLOAT,            -- 0.0 ~ 1.0

    -- 트랜스크립트 데이터
    transcript_text TEXT NOT NULL,
    language VARCHAR(10),
    segments JSONB,                 -- [{start, end, text, speaker}]

    -- 메타데이터
    whisper_metadata JSONB,

    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX ix_meeting_transcripts_is_primary
    ON meeting_transcripts (meeting_id, is_primary);
```

### Transcript Source Type

| source_type | 설명 | 생성 방법 |
|------------|------|----------|
| **caption** | 자막 기반 Transcript | YouTube API, Zoom API, VTT 파일 파싱 |
| **whisper** | Whisper STT 기반 | faster-whisper 서버, OpenAI Whisper API |
| **merged** | Caption + Whisper 병합 | LLM 기반 병합 또는 Align 알고리즘 |

### Transcript Provider

| provider | 설명 | source_type 조합 |
|---------|------|-----------------|
| **upload** | 직접 업로드 | whisper (파일 업로드 → STT) |
| **youtube** | YouTube | caption (자막 우선), whisper (자막 없을 때) |
| **zoom** | Zoom | caption (Zoom 자막), whisper (보조) |
| **gmeet** | Google Meet | caption (자동 자막), whisper (보조) |
| **teams** | Microsoft Teams | caption (Teams 자막), whisper (보조) |
| **manual** | 수동 입력 | caption (사용자가 직접 입력) |

### Primary Transcript 선택 로직

```python
def select_primary_transcript(meeting_id: UUID) -> MeetingTranscript:
    """
    Meeting의 여러 transcript 중 primary를 선택

    우선순위:
    1. 사용자가 수동으로 지정한 primary (is_primary=true)
    2. quality_score가 가장 높은 transcript
    3. source_type 우선순위 (merged > whisper > caption)
    4. 가장 최근에 생성된 transcript
    """
    transcripts = db.query(MeetingTranscript).filter(
        MeetingTranscript.meeting_id == meeting_id
    ).order_by(
        MeetingTranscript.is_primary.desc(),      # 수동 지정 우선
        MeetingTranscript.quality_score.desc(),   # 품질 높은 것 우선
        MeetingTranscript.created_at.desc()       # 최신 것 우선
    ).all()

    if not transcripts:
        return None

    # 첫 번째가 primary
    primary = transcripts[0]

    # primary 플래그 업데이트
    for t in transcripts:
        t.is_primary = (t.id == primary.id)

    db.commit()
    return primary
```

---

## Whisper STT 전략

### 운영 기준 (3-Tier Strategy)

| 순위 | 백엔드 | 환경 | 역할 |
|-----|-------|------|------|
| **P0** | **faster-whisper** | RTX Desktop GPU | **메인 STT**, 모든 트래픽 처리 |
| **P1** | **whisper.cpp** | Mac mini CPU (선택) | Desktop 장애 시 백업 |
| **P2** | **OpenAI Whisper** | Cloud API | 최후 fallback + PoC/테스트 |

### Whisper 모드별 동작

#### 1. `hybrid_cost` (기본값) - 비용 절감 우선

```python
# .env
WHISPER_MODE=hybrid_cost
```

**동작 로직**:
```
1. 회의 길이 계산 (ffprobe)

2. IF duration <= WHISPER_OPENAI_MAX_MINUTES (기본 20분):
   - OpenAI Whisper 시도 (짧은 미팅은 빠르고 저렴)
   - 실패 → faster-whisper fallback

3. ELSE (긴 미팅):
   - faster-whisper 우선 (GPU로 비용 절감)
   - 실패 → OpenAI Whisper fallback
```

**적용 케이스**: 일반 회의, 일일 스탠드업, 짧은 미팅

#### 2. `hybrid_quality` - 품질 우선

```python
# .env
WHISPER_MODE=hybrid_quality
```

**동작 로직**:
```
1. 길이 상관없이 faster-whisper(large-v3) 우선
2. 실패 → OpenAI Whisper fallback
```

**적용 케이스**: 클라이언트 미팅, 세미나, 중요 회의

#### 3. `local` - 로컬 전용

```python
# .env
WHISPER_MODE=local
```

**동작 로직**:
```
1. faster-whisper 우선
2. 실패 → whisper.cpp fallback
3. 모두 실패 → 에러 (OpenAI 사용 안 함)
```

**적용 케이스**: 오프라인 환경, 보안 요구사항

#### 4. `openai` - OpenAI 전용

```python
# .env
WHISPER_MODE=openai
```

**동작 로직**:
```
1. OpenAI Whisper만 사용
2. 실패 → 에러
```

**적용 케이스**: 초기 PoC, 테스트 환경

### 환경별 설정

#### RTX Desktop (faster-whisper 서버)

```yaml
# docker-compose.yml
version: "3.8"
services:
  faster-whisper:
    image: faster-whisper-server:latest
    ports:
      - "9000:9000"
    environment:
      - WHISPER_MODEL=large-v3
      - WHISPER_DEVICE=cuda
      - WHISPER_COMPUTE_TYPE=float16
    volumes:
      - D:/models/whisper:/models
    restart: unless-stopped
```

**Endpoint**: `http://100.123.51.6:9000/transcribe`

**API 스펙**:
```http
POST /transcribe
Content-Type: multipart/form-data

file: <audio_file>
language: ko (optional)
model: large-v3 (optional)

Response:
{
  "text": "전체 트랜스크립트...",
  "segments": [
    {"start": 0.0, "end": 5.2, "text": "안녕하세요..."}
  ],
  "language": "ko",
  "duration": 120.5
}
```

#### Mac mini Backend (.env)

```bash
# Whisper 전략
WHISPER_MODE=hybrid_cost

# faster-whisper 서버 (RTX Desktop Tailscale IP)
WHISPER_LOCAL_BACKEND=faster_whisper
WHISPER_FAST_ENDPOINT=http://100.123.51.6:9000/transcribe

# whisper.cpp (선택, Mac mini 로컬)
WHISPER_CPP_ENDPOINT=http://127.0.0.1:8765/transcribe

# OpenAI (fallback)
WHISPER_OPENAI_MODEL=whisper-1
WHISPER_OPENAI_MAX_MINUTES=20  # 20분 이하만 OpenAI 사용 허용

# 모델 프로필
WHISPER_PROFILE_FAST=small
WHISPER_PROFILE_BALANCED=medium
WHISPER_PROFILE_ACCURATE=large-v3

WHISPER_TIMEOUT_SECONDS=600
WHISPER_MAX_RETRIES=2
```

---

## 입력 소스별 플로우

### 1. 파일 업로드 (Upload)

```
[사용자] 파일 업로드 (mp4/mp3/...)
   ↓
[Backend] Meeting 생성 + MinIO presigned URL 반환
   ↓
[사용자] presigned URL로 파일 업로드
   ↓
[Background Job] Whisper STT 실행
   1) MinIO에서 파일 다운로드
   2) TranscriberService.transcribe()
      - hybrid_cost 모드 적용
      - faster-whisper 우선 → OpenAI fallback
   3) meeting_transcripts 저장
      - source_type='whisper'
      - provider='upload'
      - is_primary=true
      - quality_score 자동 계산
   ↓
[MeetingAgent] primary transcript로 요약 생성
```

### 2. YouTube URL

```
[사용자] YouTube URL 입력
   ↓
[Backend] Meeting 생성
   ↓
[Background Job] YouTube 처리 파이프라인
   1) 메타데이터 조회 (제목, 길이 등)

   2) 자막 시도 (Caption Fetcher)
      - YouTube API로 자막 리스트 조회
      - 선호 언어 (ko → en → auto) 순으로 선택
      - 자막 있으면:
        * transcript_text + segments 추출
        * meeting_transcripts 저장
          - source_type='caption'
          - provider='youtube'
          - quality_score 계산
        * 품질 좋으면 is_primary=true

   3) Whisper STT (선택적, 옵션에 따라)
      - also_run_whisper=true일 때:
        * ffmpeg로 audio 추출
        * TranscriberService.transcribe()
        * meeting_transcripts 저장
          - source_type='whisper'
          - provider='youtube'
          - quality_score 계산
        * caption보다 품질 좋으면 primary 교체

   4) Primary 선택
      - select_primary_transcript(meeting_id)
      - caption vs whisper 중 quality_score 높은 것 선택
   ↓
[MeetingAgent] primary transcript로 요약 생성
```

### 3. 기타 URL

```
[사용자] 동영상/오디오 URL 입력
   ↓
[Backend] Meeting 생성
   ↓
[Background Job] URL 처리 파이프라인
   1) yt-dlp로 메타데이터 조회

   2) 자막 시도
      - yt-dlp로 자막 다운로드 시도
      - VTT/SRT 파일 파싱
      - 있으면 caption transcript 저장

   3) Audio 다운로드 + Whisper STT
      - yt-dlp로 audio 추출
      - TranscriberService.transcribe()
      - whisper transcript 저장

   4) Primary 선택
   ↓
[MeetingAgent] primary transcript로 요약 생성
```

---

## 하이브리드 전략

### Caption vs Whisper 품질 비교

#### 품질 점수 계산 (`quality_score`)

```python
def calculate_quality_score(
    transcript: MeetingTranscript,
    meeting_duration: float
) -> float:
    """
    Transcript 품질 점수 계산 (0.0 ~ 1.0)
    """
    score = 0.0

    # 1. 길이 비율 (0 ~ 0.3)
    #    - 영상 길이 대비 transcript 길이가 적절한지
    #    - 기준: 1분당 150~200 글자 (한글 기준)
    expected_length = meeting_duration * 60 * 175  # 175자/분
    actual_length = len(transcript.transcript_text)
    length_ratio = min(actual_length / expected_length, 1.0)
    score += length_ratio * 0.3

    # 2. 공백/특수문자 비율 (0 ~ 0.2)
    #    - 너무 많은 공백이나 잡음 문자는 품질 저하
    text = transcript.transcript_text
    clean_ratio = len(text.strip()) / max(len(text), 1)
    special_char_ratio = len([c for c in text if not c.isalnum() and not c.isspace()]) / max(len(text), 1)
    score += (clean_ratio * 0.1) + ((1 - special_char_ratio) * 0.1)

    # 3. 언어 일치도 (0 ~ 0.2)
    #    - 감지된 언어가 예상 언어와 일치하는지
    if transcript.language:
        # 한글 비율 계산 (한국어 회의인 경우)
        korean_chars = len([c for c in text if '가' <= c <= '힣'])
        korean_ratio = korean_chars / max(len(text), 1)
        score += min(korean_ratio, 0.2)

    # 4. Segments 품질 (0 ~ 0.3)
    #    - 타임스탬프가 연속적이고 누락이 없는지
    if transcript.segments:
        segments = transcript.segments
        # 시간 커버리지 (영상 전체를 커버하는지)
        last_segment_time = segments[-1].get('end', 0) if segments else 0
        coverage_ratio = min(last_segment_time / meeting_duration, 1.0)
        score += coverage_ratio * 0.3

    return min(score, 1.0)
```

#### Caption vs Whisper 선택 로직

```python
async def process_youtube_url(
    meeting_id: UUID,
    youtube_url: str,
    options: Dict[str, Any]
) -> MeetingTranscript:
    """
    YouTube URL 처리 → primary transcript 선택
    """
    meeting = get_meeting(meeting_id)

    # 1. Caption 시도
    caption_transcript = None
    try:
        caption_data = await fetch_youtube_caption(youtube_url)
        if caption_data:
            caption_transcript = MeetingTranscript(
                meeting_id=meeting_id,
                source_type=TranscriptSourceType.CAPTION,
                provider=TranscriptProvider.YOUTUBE,
                transcript_text=caption_data['text'],
                segments=caption_data['segments'],
                language=caption_data['language'],
                quality_score=calculate_quality_score(caption_data, meeting.duration)
            )
            db.add(caption_transcript)
            db.commit()
    except Exception as e:
        logger.warning(f"Caption fetch failed: {e}")

    # 2. Whisper STT (옵션 또는 caption 실패 시)
    whisper_transcript = None
    should_run_whisper = (
        options.get('also_run_whisper', False) or  # 명시적 옵션
        caption_transcript is None or               # Caption 없음
        caption_transcript.quality_score < 0.5      # Caption 품질 낮음
    )

    if should_run_whisper:
        try:
            audio_path = await download_youtube_audio(youtube_url)
            whisper_data = await transcriber.transcribe_async(audio_path)

            whisper_transcript = MeetingTranscript(
                meeting_id=meeting_id,
                source_type=TranscriptSourceType.WHISPER,
                provider=TranscriptProvider.YOUTUBE,
                transcript_text=whisper_data['transcript_text'],
                segments=whisper_data['segments'],
                language=whisper_data['language'],
                whisper_metadata=whisper_data['whisper_metadata'],
                quality_score=calculate_quality_score(whisper_data, meeting.duration)
            )
            db.add(whisper_transcript)
            db.commit()
        except Exception as e:
            logger.error(f"Whisper STT failed: {e}")

    # 3. Primary 선택
    return select_primary_transcript(meeting_id)
```

### Merged Transcript (고급 전략)

Caption과 Whisper를 LLM으로 병합하여 최고 품질의 transcript 생성:

```python
async def create_merged_transcript(
    meeting_id: UUID,
    caption_transcript: MeetingTranscript,
    whisper_transcript: MeetingTranscript
) -> MeetingTranscript:
    """
    Caption + Whisper를 LLM으로 병합
    """
    # LLM으로 두 transcript를 통합
    merge_request = AgentRequest(
        task="merge_transcripts",
        payload={
            "caption_text": caption_transcript.transcript_text,
            "whisper_text": whisper_transcript.transcript_text,
            "caption_segments": caption_transcript.segments,
            "whisper_segments": whisper_transcript.segments,
            "_instructions": (
                "두 개의 transcript를 비교하여 가장 정확하고 자연스러운 "
                "최종 transcript를 생성하세요. "
                "Caption은 구조가 좋지만 누락이 있을 수 있고, "
                "Whisper는 완전하지만 표현이 부정확할 수 있습니다."
            )
        }
    )

    agent = get_meeting_ai_agent()
    response = await agent.execute(merge_request)

    merged_data = response.outputs[0].value

    # Merged transcript 저장
    merged_transcript = MeetingTranscript(
        meeting_id=meeting_id,
        source_type=TranscriptSourceType.MERGED,
        provider=caption_transcript.provider,
        transcript_text=merged_data['text'],
        segments=merged_data['segments'],
        language=caption_transcript.language,
        quality_score=1.0,  # Merged는 최고 품질로 간주
        is_primary=True     # 바로 primary로 지정
    )

    # 기존 transcript들의 primary 플래그 해제
    caption_transcript.is_primary = False
    whisper_transcript.is_primary = False

    db.add(merged_transcript)
    db.commit()

    return merged_transcript
```

---

## API 구조

### Meeting Import API

```http
POST /api/v1/meetings/import-from-url
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=xxxx",
  "source_type": "youtube",
  "title": "회의 제목 (optional)",
  "brand_id": "uuid (optional)",
  "project_id": "uuid (optional)",
  "options": {
    "use_caption_first": true,
    "also_run_whisper": true,
    "whisper_mode": "hybrid_quality",
    "preferred_language": "ko"
  }
}

Response:
{
  "meeting_id": "uuid",
  "status": "processing",
  "estimated_time_seconds": 120
}
```

### Transcript 조회 API

```http
GET /api/v1/meetings/{meeting_id}/transcripts

Response:
{
  "transcripts": [
    {
      "id": "uuid",
      "source_type": "caption",
      "provider": "youtube",
      "is_primary": false,
      "quality_score": 0.7,
      "language": "ko",
      "created_at": "2025-11-24T10:00:00Z"
    },
    {
      "id": "uuid",
      "source_type": "whisper",
      "provider": "youtube",
      "is_primary": true,
      "quality_score": 0.85,
      "language": "ko",
      "created_at": "2025-11-24T10:05:00Z"
    }
  ],
  "primary_transcript_id": "uuid"
}
```

### Primary Transcript 변경 API

```http
PATCH /api/v1/meetings/{meeting_id}/transcripts/{transcript_id}/set-primary

Response:
{
  "message": "Primary transcript updated",
  "transcript_id": "uuid",
  "meeting_id": "uuid"
}
```

---

## 운영 가이드

### 우선순위별 구현 로드맵

#### ✅ Phase 1: 기본 구조 (완료)
- [x] DB Schema (meetings, meeting_transcripts)
- [x] Alembic Migration
- [x] OpenAI Whisper 통합
- [x] MeetingAgent (meeting_summary task)
- [x] API Endpoints

#### 🔄 Phase 2: Transcript Layer 표준화 (진행 중)
- [x] source_type, provider, is_primary 추가
- [x] quality_score 계산 로직
- [ ] select_primary_transcript() 구현
- [ ] Transcript 관리 API

#### ⏳ Phase 3: Whisper 듀얼 모드
- [ ] faster-whisper 서버 설정 (RTX Desktop)
- [ ] TranscriberService 확장 (hybrid_cost, hybrid_quality)
- [ ] whisper.cpp 백업 (optional)

#### ⏳ Phase 4: YouTube Caption
- [ ] YouTube Caption Fetcher
- [ ] Caption vs Whisper 품질 비교
- [ ] also_run_whisper 옵션

#### ⏳ Phase 5: 하이브리드 전략
- [ ] Merged Transcript 생성 (LLM 기반)
- [ ] A/B 테스트 프레임워크

### 모니터링 지표

| 지표 | 설명 | 목표 |
|-----|------|------|
| **Transcript 생성 성공률** | 전체 요청 대비 성공 비율 | ≥ 95% |
| **Primary Transcript 품질** | primary transcript의 평균 quality_score | ≥ 0.75 |
| **Whisper 응답 시간** | faster-whisper 서버 평균 응답 시간 | ≤ 60초 (10분 회의 기준) |
| **Caption 활용률** | YouTube 입력 중 caption 사용 비율 | ≥ 60% |
| **Fallback 발생률** | OpenAI Whisper fallback 비율 | ≤ 10% |

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
- **업데이트 이력**: `git log docs/MEETING_AI_ARCHITECTURE.md`
- **이슈 제보**: GitHub Issues
