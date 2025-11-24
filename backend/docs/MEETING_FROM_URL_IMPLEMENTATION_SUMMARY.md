# Meeting From URL - 구현 완료 요약 (B팀 → A팀)

작성일: 2025-11-24
상태: ✅ Stage 1-3 구현 완료
대상: A팀 (QA 테스트 시작 가능)

---

## 🎉 구현 완료 사항

### 3단계 구현 모두 완료

| Stage | 기능 | 커밋 | 상태 |
|-------|------|------|------|
| **Stage 1** | Caption 추출 | 855a689 | ✅ 완료 |
| **Stage 2** | Audio + STT + MinIO | ff7653d | ✅ 완료 |
| **Stage 3** | Quality 기반 선택 | 1055032 | ✅ 완료 |

### 추가 버그 수정 (A팀 발견)

| 문제 | 파일 | 커밋 | 상태 |
|------|------|------|------|
| BeautifulSoup Import | web_crawler.py | 3f95fc1 | ✅ 수정 |
| Meeting Import 경로 | meeting_url_pipeline.py | 2915e83 | ✅ 수정 |
| deps 모듈 Import | generators.py | 7ae92f9 | ✅ 수정 |
| User 모델 Import | auth.py | 73f495b | ✅ 수정 |
| **SQLAlchemy 관계 오류** | sparklio_document.py | ff7653d | ✅ 수정 |

---

## 📋 구현 상세

### Stage 1: Caption 추출 (커밋 855a689)

**기능**:
- YouTube URL에서 자막만 추출
- MeetingTranscript 생성 (source_type=caption, is_primary=true)
- Status: CREATED → DOWNLOADING → CAPTION_READY

**구현 파일**:
- `app/models/meeting.py`: MeetingStatus enum에 8개 상태 추가
- `app/services/youtube_downloader.py`: yt-dlp로 자막 추출
- `app/services/meeting_url_pipeline.py`: Caption 처리 파이프라인
- `app/api/v1/endpoints/meetings.py`: /from-url 엔드포인트 (BackgroundTasks)
- `requirements.txt`: yt-dlp>=2023.10.13 추가

**테스트 방법**:
```bash
curl -X POST http://localhost:8000/api/v1/meetings/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Stage 1 테스트",
    "auto_transcribe": false
  }'
```

**예상 결과**:
- Meeting.status: `created` → `downloading` → `caption_ready`
- MeetingTranscript 1개 생성 (caption, is_primary=true)

---

### Stage 2: Audio + STT (커밋 ff7653d)

**기능**:
- Caption 추출 (선택 사항)
- Audio 다운로드 → MinIO 업로드
- Whisper STT 실행
- Primary transcript 선택 (간단한 룰: Whisper 우선)
- Status: CREATED → ... → READY_FOR_STT → TRANSCRIBING → READY

**구현 파일**:
- `app/services/youtube_downloader.py`: download_audio() 구현
- `app/services/meeting_url_pipeline.py`:
  - Storage service 연동
  - Transcriber service 연동
  - MinIO 업로드/다운로드
  - _select_primary_transcript() 추가

**테스트 방법**:
```bash
curl -X POST http://localhost:8000/api/v1/meetings/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Stage 2 테스트",
    "auto_transcribe": true
  }'

# 폴링 (3초 간격)
for i in {1..100}; do
  curl -s http://localhost:8000/api/v1/meetings/{meeting_id} | jq '.status'
  sleep 3
done
```

**예상 결과**:
- Meeting.status: 전체 흐름 완료 (ready)
- Meeting.file_url: MinIO 경로 저장됨
- MeetingTranscript 2개 생성 (caption + whisper)
- is_primary=true: Whisper transcript

---

### Stage 3: Quality 기반 선택 (커밋 1055032)

**기능**:
- Caption quality_score 계산 (5.0-10.0)
  - 세그먼트 수, 텍스트 길이 기반
- Whisper quality_score 계산 (0-10)
  - confidence 기반
- 가장 높은 quality_score를 가진 transcript를 primary로 선택

**Quality Score 계산**:

**Caption**:
```
score = 5.0 (base)
      + min(3.0, segments/100 * 0.3)  // 세그먼트 보너스
      + min(2.0, length/1000 * 0.2)   // 길이 보너스
```

**Whisper**:
```
score = confidence * 10
```

**예시**:
- Caption (200 segments, 3000자): 5.0 + 0.6 + 0.6 = 6.2점
- Whisper (confidence 0.85): 8.5점
- **결과**: Whisper 선택 (8.5 > 6.2) ✓

**테스트 방법**:
```bash
# Stage 2와 동일하게 테스트
# 로그에서 quality_score 확인

# 백엔드 로그 확인
tail -f logs/app.log | grep "quality"
```

**예상 로그**:
```
Caption quality: base=5.0, segments=0.60 (200), length=0.60 (3000), total=6.20
Whisper quality: confidence=0.85, score=8.50
Selected whisper as primary for meeting xxx, quality_score=8.50
```

---

## 🔧 중요 버그 수정

### SQLAlchemy 관계 오류 (배포 블로커)

**문제**:
- `SparklioDocument.brand`가 `Brand.documents`와 충돌
- Brand.documents는 이미 BrandDocument와 연결됨
- 오류: "One or more mappers failed to initialize"
- 영향: API 서버 모든 요청 500 오류

**해결** (커밋 ff7653d):
```python
# BEFORE
brand = relationship("Brand", back_populates="documents")  # ❌ 충돌

# AFTER
brand = relationship("Brand")  # ✅ 단방향 관계
```

**구조**:
- Brand → BrandDocument (양방향)
- SparklioDocument → Brand (단방향)

---

## 📊 Status 전이 흐름

### 정상 흐름 (Caption + Whisper)

```
CREATED
  ↓
DOWNLOADING (caption + audio)
  ↓
CAPTION_READY (caption transcript 생성)
  ↓
READY_FOR_STT (audio in MinIO)
  ↓
TRANSCRIBING (Whisper STT)
  ↓
READY (primary transcript 선택 완료)
```

### 에러 흐름

```
DOWNLOADING → DOWNLOAD_FAILED
  (audio 다운로드 실패)

TRANSCRIBING → STT_FAILED
  (Whisper STT 실패)
```

---

## 🧪 A팀 테스트 가이드

### 준비 사항

1. **yt-dlp 설치**
```bash
pip install yt-dlp
yt-dlp --version  # 확인
```

2. **Whisper 서버 실행 확인**
```bash
# Faster-Whisper 서버 체크
curl http://localhost:9000/health
```

3. **MinIO 확인**
```bash
# MinIO 접속 확인
mc ls myminio/meetings/
```

### 테스트 시나리오

#### 시나리오 1: Caption Only (Stage 1)

**목적**: 자막만 가져오기
```bash
curl -X POST http://localhost:8000/api/v1/meetings/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Scenario 1 - Caption Only",
    "auto_transcribe": false
  }'
```

**검증**:
- [ ] Status: created → downloading → caption_ready
- [ ] MeetingTranscript 1개 (caption, is_primary=true)
- [ ] segments에 타임스탬프 포함
- [ ] transcript_text에 전체 텍스트

#### 시나리오 2: Caption + Whisper (Stage 2)

**목적**: 전체 파이프라인 테스트
```bash
curl -X POST http://localhost:8000/api/v1/meetings/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Scenario 2 - Full Pipeline",
    "auto_transcribe": true
  }'
```

**검증**:
- [ ] Status: created → ... → ready (전체 흐름)
- [ ] MeetingTranscript 2개 (caption + whisper)
- [ ] is_primary=true 정확히 1개
- [ ] Meeting.file_url에 MinIO 경로

#### 시나리오 3: Quality 비교 (Stage 3)

**목적**: Quality score 계산 확인

**테스트 1 - 고품질 Caption**:
- URL: 뉴스 채널 (완벽한 자막)
- 예상: Caption quality_score 높음 (8-10점)

**테스트 2 - 저품질 Caption**:
- URL: 브이로그 (자동 생성 자막)
- 예상: Whisper가 primary로 선택됨

**검증**:
```bash
# 로그 확인
tail -f logs/app.log | grep "quality_score"

# 예상 로그
# Caption quality: total=7.90
# Whisper quality: score=8.50
# Selected whisper as primary, quality_score=8.50
```

#### 시나리오 4: 에러 케이스

**Test 1 - 잘못된 URL**:
```bash
curl -X POST http://localhost:8000/api/v1/meetings/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=invalid-url-123",
    "title": "Error Test - Invalid URL"
  }'
```

**검증**:
- [ ] Status: created → downloading → download_failed

**Test 2 - Whisper 서버 중단**:
1. Whisper 서버 종료
2. Meeting 생성 (auto_transcribe=true)

**검증**:
- [ ] Status: ... → ready_for_stt → transcribing → stt_failed
- [ ] Caption transcript는 생성됨 (있는 경우)

---

## 📝 테스트 체크리스트

### API 기능

- [ ] POST /api/v1/meetings/from-url (정상)
- [ ] POST /api/v1/meetings/from-url (잘못된 URL)
- [ ] GET /api/v1/meetings/{id} (폴링)
- [ ] GET /api/v1/meetings/{id}/transcript
- [ ] GET /api/v1/meetings/{id}/transcripts (복수)

### Status 전이

- [ ] CREATED → DOWNLOADING → CAPTION_READY
- [ ] CAPTION_READY → READY_FOR_STT
- [ ] READY_FOR_STT → TRANSCRIBING
- [ ] TRANSCRIBING → READY
- [ ] DOWNLOADING → DOWNLOAD_FAILED (에러)
- [ ] TRANSCRIBING → STT_FAILED (에러)

### Transcript 생성

- [ ] Caption transcript (source_type=caption)
- [ ] Whisper transcript (source_type=whisper)
- [ ] is_primary 정확히 1개
- [ ] quality_score 계산됨 (Stage 3)
- [ ] segments 포함
- [ ] transcript_text 포함

### Quality Score

- [ ] Caption: 5.0-10.0 범위
- [ ] Whisper: 0-10 범위 (confidence 기반)
- [ ] 높은 점수가 primary로 선택됨
- [ ] 로그에 quality_score 표시

---

## 🚨 알려진 제한사항

1. **yt-dlp 의존성**
   - yt-dlp가 설치되어 있어야 함
   - PATH에서 찾을 수 있어야 함

2. **Whisper 서버 필요**
   - faster-whisper 또는 whisper.cpp 서버 실행 중이어야 함
   - 서버 중단 시 STT_FAILED

3. **MinIO 필요**
   - MinIO 서버 실행 중이어야 함
   - 'meetings' 버킷 존재해야 함

4. **타임아웃**
   - Caption 다운로드: 60초
   - Audio 다운로드: 300초 (5분)
   - 긴 영상은 타임아웃 가능

---

## 📚 참조 문서

- [MEETING_FROM_URL_CONTRACT.md](MEETING_FROM_URL_CONTRACT.md) - API 계약서
- [MEETING_FROM_URL_BACKEND_GUIDE.md](MEETING_FROM_URL_BACKEND_GUIDE.md) - B팀 작업 지침
- [MEETING_FROM_URL_FRONTEND_GUIDE.md](MEETING_FROM_URL_FRONTEND_GUIDE.md) - C팀 작업 지침
- [MEETING_FROM_URL_QA_GUIDE.md](MEETING_FROM_URL_QA_GUIDE.md) - A팀 작업 지침
- [MEETING_API_TEST_GUIDE.md](MEETING_API_TEST_GUIDE.md) - 기존 Meeting API 가이드

---

## 🎯 다음 단계

### A팀 (QA)

1. ✅ 위 테스트 시나리오 실행
2. ✅ Golden Set 검증
3. ✅ 에러 케이스 테스트
4. ✅ 테스트 결과 보고

### C팀 (Frontend)

1. ⏳ meeting-api.ts 업데이트
2. ⏳ MeetingFromURL 컴포넌트 구현
3. ⏳ Status 폴링 로직 구현
4. ⏳ UI 통합 테스트

### B팀 (Backend)

1. ✅ Stage 1-3 구현 완료
2. ⏳ A팀 피드백 대응
3. ⏳ C팀 통합 지원
4. ⏳ Stage 4 (고급 기능, 선택사항)

---

## 💬 문의

**Backend 이슈**:
- Slack: #backend 채널
- GitHub Issues: backend 레이블

**QA 관련**:
- Slack: #qa 채널
- 테스트 결과 공유: #backend-qa-sync

---

**이 문서는 B팀이 A팀을 위해 작성했습니다.**
**Stage 1-3 구현이 완료되어 QA 테스트를 시작할 수 있습니다!** 🚀
