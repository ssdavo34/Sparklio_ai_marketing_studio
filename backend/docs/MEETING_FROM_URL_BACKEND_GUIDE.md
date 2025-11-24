# Meeting From URL - B팀 작업 지침 (Backend)

작성일: 2025-11-24
버전: v1.0
대상: B팀 (Backend)
참조: [MEETING_FROM_URL_CONTRACT.md](MEETING_FROM_URL_CONTRACT.md)

---

## 📌 필수 선행 작업

1. **API Contract 숙지**
   - `MEETING_FROM_URL_CONTRACT.md` 전체 읽기
   - Meeting status enum 8개 값 확인
   - meeting_transcripts 스키마 확인

2. **기존 코드 파악**
   - `app/api/v1/endpoints/meetings.py` - 현재 placeholder 구현 확인
   - `app/services/transcriber.py` - 기존 STT 로직 파악
   - `app/db/models.py` - Meeting, MeetingTranscript 모델 확인

---

## 🎯 구현 목표

**최종 목표**: YouTube URL → Caption/Audio 다운로드 → STT → Primary Transcript 선택

**단계별 구현 (4단계)**:
1. **Stage 1**: Caption-only (자막만 가져오기) - 1일
2. **Stage 2**: Audio + STT (오디오 다운로드 + Whisper) - 2일
3. **Stage 3**: Hybrid Mode (Caption + Whisper 비교) - 1일
4. **Stage 4**: Advanced (에러 처리, 재시도, 모니터링) - 1일

---

## 📁 파일 구조

### 새로 만들 파일

```
backend/
├── app/
│   ├── services/
│   │   ├── meeting_url_pipeline.py          # ← 핵심 파이프라인 로직
│   │   └── youtube_downloader.py            # ← YouTube 다운로드 (yt-dlp)
│   ├── schemas/
│   │   └── meeting.py                        # ← MeetingStatus enum 추가 (4개)
│   └── api/v1/endpoints/
│       └── meetings.py                       # ← /from-url 엔드포인트 완성
└── requirements.txt                          # ← yt-dlp 추가
```

### 수정할 파일

```
backend/
├── app/
│   ├── db/
│   │   └── models.py                         # ← Meeting.status 필드 확인
│   └── services/
│       └── transcriber.py                    # ← 연동 확인
```

---

## 🚀 Stage 1: Caption-only (1일)

### 목표
YouTube URL에서 자막만 가져와서 transcript 생성

### 1.1. MeetingStatus Enum 추가

**파일**: `app/schemas/meeting.py`

```python
class MeetingStatus(str, Enum):
    """
    Meeting 상태

    계약서 참조: MEETING_FROM_URL_CONTRACT.md - Section 2
    """
    # 기존 상태
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

    # 새로운 상태 (Meeting From URL 전용)
    CREATED = "created"              # Meeting 레코드 생성됨
    DOWNLOADING = "downloading"      # URL에서 다운로드 중
    CAPTION_READY = "caption_ready"  # Caption transcript 준비됨
    READY_FOR_STT = "ready_for_stt"  # 오디오 다운로드 완료, STT 대기
    TRANSCRIBING = "transcribing"    # STT 진행 중
    READY = "ready"                  # Primary transcript 준비됨
    DOWNLOAD_FAILED = "download_failed"  # 다운로드 실패
    STT_FAILED = "stt_failed"        # STT 실패
```

**중요**: 기존 PENDING/PROCESSING/COMPLETED는 유지 (파일 업로드 방식용)

### 1.2. YouTube Downloader 작성

**파일**: `app/services/youtube_downloader.py`

```python
"""
YouTube 다운로드 서비스 (yt-dlp 사용)

Stage 1: Caption만 다운로드
Stage 2: Audio도 다운로드

작성일: 2025-11-24
작성자: B팀
참조: MEETING_FROM_URL_CONTRACT.md
"""

import logging
import subprocess
import json
import tempfile
from pathlib import Path
from typing import Optional, Dict, Any, List
from uuid import UUID

logger = logging.getLogger(__name__)


class YouTubeDownloader:
    """
    YouTube URL에서 자막/오디오 다운로드

    yt-dlp 래퍼 클래스
    """

    def __init__(self):
        self.yt_dlp_path = "yt-dlp"  # PATH에서 찾기

    async def get_captions(
        self,
        url: str,
        language: str = "ko"
    ) -> Optional[List[Dict[str, Any]]]:
        """
        YouTube 자막 가져오기 (Stage 1)

        Args:
            url: YouTube URL
            language: 언어 코드 (ko, en 등)

        Returns:
            자막 데이터 (segments 리스트) 또는 None

            예시:
            [
                {
                    "start": 0.0,
                    "end": 2.5,
                    "text": "안녕하세요"
                },
                ...
            ]

        Raises:
            Exception: yt-dlp 실행 실패
        """
        logger.info(f"YouTubeDownloader: Getting captions from {url}, lang={language}")

        try:
            # yt-dlp로 자막 다운로드
            cmd = [
                self.yt_dlp_path,
                "--skip-download",           # 동영상은 다운로드 안 함
                "--write-auto-sub",          # 자동 생성 자막도 포함
                "--sub-lang", language,      # 언어 지정
                "--sub-format", "json3",     # JSON 포맷 (타임스탬프 포함)
                "--output", "%(id)s.%(ext)s",  # 파일명 포맷
                url
            ]

            with tempfile.TemporaryDirectory() as tmpdir:
                result = subprocess.run(
                    cmd,
                    cwd=tmpdir,
                    capture_output=True,
                    text=True,
                    timeout=60
                )

                if result.returncode != 0:
                    logger.error(f"yt-dlp failed: {result.stderr}")
                    return None

                # JSON 자막 파일 찾기
                subtitle_files = list(Path(tmpdir).glob("*.json3"))

                if not subtitle_files:
                    logger.warning(f"No captions found for {url}")
                    return None

                # JSON 파싱
                with open(subtitle_files[0], "r", encoding="utf-8") as f:
                    caption_data = json.load(f)

                # segments 추출
                events = caption_data.get("events", [])
                segments = []

                for event in events:
                    if "segs" not in event:
                        continue

                    start_time = event.get("tStartMs", 0) / 1000.0
                    duration = event.get("dDurationMs", 0) / 1000.0
                    end_time = start_time + duration

                    text = "".join(seg.get("utf8", "") for seg in event["segs"])
                    text = text.strip()

                    if text:
                        segments.append({
                            "start": start_time,
                            "end": end_time,
                            "text": text
                        })

                logger.info(f"YouTubeDownloader: Got {len(segments)} caption segments")
                return segments

        except subprocess.TimeoutExpired:
            logger.error(f"yt-dlp timeout for {url}")
            return None
        except Exception as e:
            logger.exception(f"Failed to get captions: {e}")
            return None

    async def download_audio(
        self,
        url: str,
        output_path: str
    ) -> bool:
        """
        YouTube 오디오 다운로드 (Stage 2에서 구현)

        Args:
            url: YouTube URL
            output_path: 저장할 파일 경로 (예: /tmp/audio.mp4)

        Returns:
            성공 여부
        """
        # TODO: Stage 2에서 구현
        logger.warning("download_audio not implemented yet (Stage 2)")
        return False


def get_youtube_downloader() -> YouTubeDownloader:
    """
    YouTubeDownloader 인스턴스 반환

    Returns:
        YouTubeDownloader
    """
    return YouTubeDownloader()
```

### 1.3. Meeting URL Pipeline 작성

**파일**: `app/services/meeting_url_pipeline.py`

```python
"""
Meeting From URL 파이프라인

YouTube URL → Caption/Audio → Transcript → Primary 선택

작성일: 2025-11-24
작성자: B팀
참조: MEETING_FROM_URL_CONTRACT.md
"""

import logging
from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session

from app.db.models import Meeting, MeetingTranscript
from app.schemas.meeting import MeetingStatus
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

            if not caption_segments:
                logger.warning(f"No captions found for {url}")
                meeting.status = MeetingStatus.DOWNLOAD_FAILED
                db.commit()
                return False

            # 2. Caption → MeetingTranscript 저장
            transcript_text = "\n".join(seg["text"] for seg in caption_segments)

            transcript = MeetingTranscript(
                meeting_id=meeting_id,
                source_type="caption",
                provider="youtube",
                backend="unknown",  # Caption은 YouTube에서 제공
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
```

### 1.4. API 엔드포인트 완성

**파일**: `app/api/v1/endpoints/meetings.py`

**수정 부분**:

```python
# 기존 imports에 추가
from app.services.meeting_url_pipeline import get_meeting_url_pipeline
from fastapi import BackgroundTasks

# /from-url 엔드포인트 수정 (lines 123-190)
@router.post("/from-url", response_model=MeetingFromURLResponse, status_code=status.HTTP_201_CREATED)
async def create_meeting_from_url(
    request: MeetingFromURLRequest,
    background_tasks: BackgroundTasks,  # ← 추가
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    URL로부터 회의 생성 (YouTube, 웹 URL 등)

    Stage 1: Caption만 가져오기
    """
    logger.info(f"Creating meeting from URL: {request.url}")

    # 1. Meeting 레코드 생성
    title = request.title or f"Meeting from {request.url[:50]}"

    meeting = Meeting(
        owner_id=current_user.id,
        brand_id=request.brand_id,
        project_id=request.project_id,
        title=title,
        description=request.description or f"Imported from: {request.url}",
        status=MeetingStatus.CREATED,  # ← PENDING → CREATED 변경
        meeting_metadata={"source_url": request.url}
    )

    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    # 2. 백그라운드에서 URL 처리 시작
    pipeline = get_meeting_url_pipeline()

    background_tasks.add_task(
        pipeline.process_url,
        meeting_id=meeting.id,
        url=request.url,
        db=db,
        auto_transcribe=request.auto_transcribe
    )

    logger.info(
        f"Meeting {meeting.id} created, background processing started"
    )

    return MeetingFromURLResponse(
        meeting_id=meeting.id,
        status=meeting.status,
        message="Meeting created successfully. URL processing will start in background.",
        transcription_started=False  # Stage 1에서는 STT 없음
    )
```

### 1.5. requirements.txt 업데이트

**파일**: `requirements.txt`

```
# 기존 내용 유지
...

# Meeting From URL
yt-dlp>=2023.10.13
```

### 1.6. Stage 1 테스트

#### curl 테스트

```bash
# 1. Meeting 생성
curl -X POST http://localhost:8000/api/v1/meetings/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Stage 1 테스트"
  }'

# 응답 예시
{
  "meeting_id": "uuid",
  "status": "created",
  "message": "Meeting created successfully...",
  "transcription_started": false
}

# 2. 3초 대기 후 상태 확인 (폴링)
curl http://localhost:8000/api/v1/meetings/{meeting_id}

# 예상 응답 (성공)
{
  "id": "uuid",
  "status": "caption_ready",  # ← 자막 준비 완료
  ...
}

# 3. Transcript 조회
curl http://localhost:8000/api/v1/meetings/{meeting_id}/transcript

# 예상 응답
{
  "segments": [
    {
      "start": 0.0,
      "end": 2.5,
      "text": "안녕하세요"
    },
    ...
  ],
  "source_type": "caption",
  "provider": "youtube"
}
```

#### 확인 사항

- [ ] Meeting.status가 `created` → `downloading` → `caption_ready`로 변경
- [ ] MeetingTranscript 레코드 생성됨 (source_type=caption, is_primary=true)
- [ ] transcript_text에 전체 텍스트 저장됨
- [ ] segments에 타임스탬프 포함됨

---

## 🚀 Stage 2: Audio + STT (2일)

### 목표
오디오 다운로드 → MinIO 업로드 → Whisper STT

### 2.1. YouTubeDownloader.download_audio 구현

**파일**: `app/services/youtube_downloader.py`

```python
async def download_audio(
    self,
    url: str,
    output_path: str
) -> bool:
    """
    YouTube 오디오 다운로드

    Args:
        url: YouTube URL
        output_path: 저장할 파일 경로 (예: /tmp/audio.mp4)

    Returns:
        성공 여부
    """
    logger.info(f"YouTubeDownloader: Downloading audio from {url}")

    try:
        cmd = [
            self.yt_dlp_path,
            "--format", "bestaudio",  # 오디오만
            "--output", output_path,
            url
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5분 타임아웃
        )

        if result.returncode != 0:
            logger.error(f"yt-dlp audio download failed: {result.stderr}")
            return False

        if not Path(output_path).exists():
            logger.error(f"Audio file not created: {output_path}")
            return False

        logger.info(f"YouTubeDownloader: Audio downloaded to {output_path}")
        return True

    except subprocess.TimeoutExpired:
        logger.error(f"yt-dlp audio download timeout for {url}")
        return False
    except Exception as e:
        logger.exception(f"Failed to download audio: {e}")
        return False
```

### 2.2. Pipeline에 STT 통합

**파일**: `app/services/meeting_url_pipeline.py`

```python
# imports 추가
from app.services.transcriber import get_transcriber_service
from app.core.minio_client import get_minio_client
import tempfile
from pathlib import Path

class MeetingURLPipeline:
    def __init__(self):
        self.youtube_downloader = get_youtube_downloader()
        self.transcriber = get_transcriber_service()  # ← 추가
        self.minio_client = get_minio_client()  # ← 추가

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

            # 1. YouTube Caption 가져오기 (Stage 1과 동일)
            caption_segments = await self.youtube_downloader.get_captions(url, language)

            caption_transcript = None
            if caption_segments:
                transcript_text = "\n".join(seg["text"] for seg in caption_segments)

                caption_transcript = MeetingTranscript(
                    meeting_id=meeting_id,
                    source_type="caption",
                    provider="youtube",
                    backend="unknown",
                    model="youtube_caption",
                    transcript_text=transcript_text,
                    segments=caption_segments,
                    language=language,
                    is_primary=False,  # ← Stage 2에서는 일단 False (Whisper와 비교 후 결정)
                    quality_score=7.0,
                    confidence=0.0
                )

                db.add(caption_transcript)
                db.commit()

                meeting.status = MeetingStatus.CAPTION_READY
                db.commit()

            # 2. YouTube Audio 다운로드 (Stage 2 추가)
            with tempfile.TemporaryDirectory() as tmpdir:
                audio_path = Path(tmpdir) / "audio.mp4"

                logger.info(f"Downloading audio to {audio_path}")
                success = await self.youtube_downloader.download_audio(url, str(audio_path))

                if not success:
                    logger.error(f"Audio download failed for {url}")
                    meeting.status = MeetingStatus.DOWNLOAD_FAILED
                    db.commit()
                    return False

                # 3. MinIO 업로드
                file_key = f"meetings/{meeting.owner_id}/{meeting_id}/audio.mp4"

                logger.info(f"Uploading audio to MinIO: {file_key}")
                await self.minio_client.upload_file(
                    file_path=str(audio_path),
                    object_name=file_key
                )

                meeting.file_url = file_key
                meeting.status = MeetingStatus.READY_FOR_STT
                db.commit()

            # 4. STT 실행 (auto_transcribe=True인 경우)
            if auto_transcribe:
                logger.info(f"Starting STT for meeting {meeting_id}")

                meeting.status = MeetingStatus.TRANSCRIBING
                db.commit()

                # TranscriberService 호출 (기존 코드 재사용)
                result = await self.transcriber.transcribe(
                    meeting_id=meeting_id,
                    language=language,
                    db=db
                )

                if result.get("status") == "completed":
                    # Whisper transcript가 생성됨
                    # is_primary 선택: Caption vs Whisper 비교
                    await self._select_primary_transcript(meeting_id, db)

                    meeting.status = MeetingStatus.READY
                    db.commit()

                    logger.info(f"MeetingURLPipeline: STT completed for meeting {meeting_id}")
                else:
                    logger.error(f"STT failed for meeting {meeting_id}")
                    meeting.status = MeetingStatus.STT_FAILED
                    db.commit()
                    return False

            return True

        except Exception as e:
            logger.exception(f"Failed to process URL: {e}")
            meeting.status = MeetingStatus.DOWNLOAD_FAILED
            db.commit()
            return False

    async def _select_primary_transcript(
        self,
        meeting_id: UUID,
        db: Session
    ):
        """
        Primary transcript 선택 (Caption vs Whisper)

        Stage 2: 간단한 룰 (Whisper 우선)
        Stage 3: quality_score 비교
        """
        transcripts = db.query(MeetingTranscript).filter(
            MeetingTranscript.meeting_id == meeting_id
        ).all()

        # Stage 2: 간단한 룰 - Whisper가 있으면 Whisper를 primary로
        whisper_transcript = None
        caption_transcript = None

        for t in transcripts:
            if t.source_type == "whisper":
                whisper_transcript = t
            elif t.source_type == "caption":
                caption_transcript = t

        if whisper_transcript:
            # Whisper를 primary로
            for t in transcripts:
                t.is_primary = (t.id == whisper_transcript.id)

            logger.info(f"Selected Whisper as primary for meeting {meeting_id}")
        elif caption_transcript:
            # Caption만 있으면 Caption을 primary로
            caption_transcript.is_primary = True
            logger.info(f"Selected Caption as primary for meeting {meeting_id}")

        db.commit()
```

### 2.3. Stage 2 테스트

```bash
# 1. Meeting 생성 (auto_transcribe=true)
curl -X POST http://localhost:8000/api/v1/meetings/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Stage 2 테스트",
    "auto_transcribe": true
  }'

# 2. 폴링 (3초 간격)
curl http://localhost:8000/api/v1/meetings/{meeting_id}

# 예상 상태 전이:
# created → downloading → caption_ready → ready_for_stt → transcribing → ready
```

#### 확인 사항

- [ ] Caption transcript 생성됨 (is_primary=false)
- [ ] Whisper transcript 생성됨 (is_primary=true)
- [ ] Meeting.file_url에 MinIO 경로 저장됨
- [ ] Meeting.status = `ready`

---

## 🚀 Stage 3: Hybrid Mode (1일)

### 목표
Caption과 Whisper의 quality_score를 비교하여 더 좋은 것을 primary로 선택

### 3.1. Quality Score 계산

**파일**: `app/services/meeting_url_pipeline.py`

```python
async def _select_primary_transcript(
    self,
    meeting_id: UUID,
    db: Session
):
    """
    Primary transcript 선택 (Caption vs Whisper)

    Stage 3: quality_score 비교
    """
    transcripts = db.query(MeetingTranscript).filter(
        MeetingTranscript.meeting_id == meeting_id
    ).all()

    if not transcripts:
        logger.warning(f"No transcripts found for meeting {meeting_id}")
        return

    # Quality score 계산 (간단한 휴리스틱)
    for t in transcripts:
        if t.source_type == "caption":
            # Caption: 텍스트 길이, 세그먼트 수 기반
            t.quality_score = min(10.0, 5.0 + len(t.segments) / 100)

        elif t.source_type == "whisper":
            # Whisper: confidence 기반
            t.quality_score = t.confidence * 10.0

    # 가장 높은 quality_score를 가진 transcript를 primary로
    best_transcript = max(transcripts, key=lambda t: t.quality_score)

    for t in transcripts:
        t.is_primary = (t.id == best_transcript.id)

    logger.info(
        f"Selected {best_transcript.source_type} as primary for meeting {meeting_id}, "
        f"quality_score={best_transcript.quality_score:.2f}"
    )

    db.commit()
```

### 3.2. Stage 3 테스트

**시나리오 1**: Caption이 더 좋은 경우
- 자막이 완벽한 한국어 영상
- Caption quality_score > Whisper quality_score

**시나리오 2**: Whisper가 더 좋은 경우
- 자막이 부정확하거나 자동 생성된 경우
- Whisper quality_score > Caption quality_score

---

## 🚀 Stage 4: Advanced (1일)

### 목표
- 에러 처리 강화
- 재시도 로직
- 모니터링

### 4.1. 에러 처리

```python
# 타임아웃, 네트워크 에러 처리
# 재시도 로직 (최대 3회)
# 에러 로깅
```

### 4.2. 모니터링

```python
# 처리 시간 측정
# 성공/실패 비율
# 알림 (Slack, 이메일 등)
```

---

## ✅ 체크리스트

### Stage 1 (Caption-only)
- [ ] MeetingStatus enum에 8개 상태 추가
- [ ] YouTubeDownloader.get_captions 구현
- [ ] MeetingURLPipeline.process_url 구현 (Caption만)
- [ ] /from-url 엔드포인트에 BackgroundTasks 추가
- [ ] yt-dlp 설치 (`pip install yt-dlp`)
- [ ] curl 테스트: Caption 가져오기 성공

### Stage 2 (Audio + STT)
- [ ] YouTubeDownloader.download_audio 구현
- [ ] MinIO 업로드 연동
- [ ] TranscriberService 연동
- [ ] _select_primary_transcript 구현 (간단한 룰)
- [ ] curl 테스트: STT까지 완료

### Stage 3 (Hybrid)
- [ ] quality_score 계산 로직 구현
- [ ] Caption vs Whisper 비교 테스트
- [ ] 두 가지 시나리오 테스트

### Stage 4 (Advanced)
- [ ] 에러 처리 강화
- [ ] 재시도 로직
- [ ] 모니터링 추가

---

## 📞 C팀/A팀 협업

### C팀에게 전달할 정보

1. **폴링 시작 시점**
   - `/from-url` 호출 직후 폴링 시작
   - 3초 간격으로 `GET /api/v1/meetings/{id}` 호출

2. **Status 표시 텍스트**
   - `created`: "생성됨"
   - `downloading`: "다운로드 중..."
   - `caption_ready`: "자막 준비됨"
   - `ready_for_stt`: "음성 인식 대기"
   - `transcribing`: "음성 인식 중..."
   - `ready`: "완료"
   - `download_failed`: "다운로드 실패"
   - `stt_failed`: "음성 인식 실패"

3. **에러 케이스 처리**
   - `download_failed`: "URL을 확인하거나 다시 시도해주세요"
   - `stt_failed`: "음성 인식 실패. 관리자에게 문의하세요"

### A팀에게 전달할 정보

1. **테스트 시나리오**
   - 자막 있는 YouTube URL
   - 자막 없는 YouTube URL
   - 잘못된 URL (404)
   - 긴 영상 (10분 이상)

2. **Golden Set**
   - 각 status 별 예상 응답
   - 에러 케이스 별 응답

---

## 🔗 참조 문서

- [MEETING_FROM_URL_CONTRACT.md](MEETING_FROM_URL_CONTRACT.md) - API 계약서
- [MEETING_API_TEST_GUIDE.md](MEETING_API_TEST_GUIDE.md) - 기존 테스트 가이드
- [MEETING_FROM_URL_FRONTEND_GUIDE.md](MEETING_FROM_URL_FRONTEND_GUIDE.md) - C팀 작업 지침 (향후)
- [MEETING_FROM_URL_QA_GUIDE.md](MEETING_FROM_URL_QA_GUIDE.md) - A팀 작업 지침 (향후)

---

이 문서는 **B팀의 작업 지침**입니다.
A/B/C 팀 간 계약은 [MEETING_FROM_URL_CONTRACT.md](MEETING_FROM_URL_CONTRACT.md)를 참조하세요.
