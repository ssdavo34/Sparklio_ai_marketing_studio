# Meeting From URL - A팀 작업 지침 (QA)

작성일: 2025-11-24
버전: v1.0
대상: A팀 (QA)
참조: [MEETING_FROM_URL_CONTRACT.md](MEETING_FROM_URL_CONTRACT.md)

---

## 📌 필수 선행 작업

1. **API Contract 숙지**
   - `MEETING_FROM_URL_CONTRACT.md` 전체 읽기
   - Meeting status enum 8개 값 및 전이 흐름 확인
   - meeting_transcripts 스키마 확인

2. **테스트 환경 준비**
   - Backend 서버 실행: `http://localhost:8000`
   - PostgreSQL 실행
   - MinIO 실행
   - yt-dlp 설치 확인: `yt-dlp --version`

---

## 🎯 테스트 목표

**최종 목표**: Meeting From URL 파이프라인의 모든 경로와 에러 케이스 검증

**테스트 범위**:
1. API 엔드포인트 기능 테스트
2. Status 전이 흐름 검증
3. Transcript 생성 검증 (Caption, Whisper, Hybrid)
4. 에러 케이스 처리 검증
5. Frontend 통합 테스트

---

## 📋 테스트 시나리오

### Scenario 1: Caption Only (Stage 1)

**목적**: 자막만 가져와서 Transcript 생성

**전제 조건**:
- 자막이 있는 YouTube URL

**테스트 URL**:
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**테스트 절차**:

```bash
# 1. Meeting 생성
curl -X POST http://localhost:8000/api/v1/meetings/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "QA Test - Caption Only",
    "auto_transcribe": false
  }' | jq

# 응답 저장 (meeting_id 확인)
MEETING_ID="<응답에서 받은 meeting_id>"

# 2. 폴링 (3초 간격, 최대 2분)
for i in {1..40}; do
  echo "=== Poll $i ==="
  curl -s http://localhost:8000/api/v1/meetings/$MEETING_ID | jq '.status'
  sleep 3
done

# 3. Transcript 조회
curl http://localhost:8000/api/v1/meetings/$MEETING_ID/transcript | jq
```

**예상 결과**:

| 시간 | Status | 설명 |
|------|--------|------|
| 0초 | `created` | Meeting 생성 완료 |
| 3초 | `downloading` | Caption 다운로드 중 |
| 10초 | `caption_ready` | Caption transcript 생성 완료 |

**검증 항목**:
- [ ] Status가 `created` → `downloading` → `caption_ready` 순서로 전이
- [ ] MeetingTranscript 레코드 생성 (source_type=caption, is_primary=true)
- [ ] transcript_text에 텍스트 저장됨
- [ ] segments에 타임스탬프 포함됨 (start, end, text)

---

### Scenario 2: Audio + STT (Stage 2)

**목적**: 오디오 다운로드 후 Whisper STT 실행

**전제 조건**:
- YouTube URL (자막 유무 무관)

**테스트 URL**:
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**테스트 절차**:

```bash
# 1. Meeting 생성 (auto_transcribe=true)
curl -X POST http://localhost:8000/api/v1/meetings/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "QA Test - Audio + STT",
    "auto_transcribe": true
  }' | jq

MEETING_ID="<meeting_id>"

# 2. 폴링 (3초 간격, 최대 5분)
for i in {1..100}; do
  echo "=== Poll $i ==="
  STATUS=$(curl -s http://localhost:8000/api/v1/meetings/$MEETING_ID | jq -r '.status')
  echo "Status: $STATUS"

  # 완료 상태 확인
  if [[ "$STATUS" == "ready" || "$STATUS" == "download_failed" || "$STATUS" == "stt_failed" ]]; then
    echo "Final status: $STATUS"
    break
  fi

  sleep 3
done

# 3. Transcript 목록 조회
curl http://localhost:8000/api/v1/meetings/$MEETING_ID/transcript | jq
```

**예상 결과**:

| 시간 | Status | 설명 |
|------|--------|------|
| 0초 | `created` | Meeting 생성 완료 |
| 3초 | `downloading` | Caption/Audio 다운로드 중 |
| 15초 | `caption_ready` | Caption transcript 생성 (있는 경우) |
| 30초 | `ready_for_stt` | Audio 다운로드 완료, MinIO 업로드 완료 |
| 35초 | `transcribing` | Whisper STT 진행 중 |
| 2분 | `ready` | Primary transcript 선택 완료 |

**검증 항목**:
- [ ] Status가 올바른 순서로 전이 (created → ... → ready)
- [ ] MeetingTranscript 레코드 2개 생성 (caption + whisper)
- [ ] is_primary=true인 레코드가 정확히 1개
- [ ] Meeting.file_url에 MinIO 경로 저장됨 (`meetings/{owner_id}/{meeting_id}/audio.mp4`)
- [ ] Whisper transcript의 confidence 값이 0-1 범위

---

### Scenario 3: Caption vs Whisper 품질 비교 (Stage 3)

**목적**: Caption과 Whisper 중 품질이 높은 것을 primary로 선택

**전제 조건**:
- 자막이 있는 YouTube URL
- auto_transcribe=true

**테스트 절차**:

```bash
# 1. Meeting 생성
curl -X POST http://localhost:8000/api/v1/meetings/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "QA Test - Hybrid",
    "auto_transcribe": true
  }' | jq

MEETING_ID="<meeting_id>"

# 2. 완료 대기 (폴링)
# ... (Scenario 2와 동일)

# 3. 모든 Transcript 조회
curl http://localhost:8000/api/v1/meetings/$MEETING_ID/transcripts | jq

# 4. Primary transcript 확인
curl http://localhost:8000/api/v1/meetings/$MEETING_ID/transcript | jq
```

**검증 항목**:
- [ ] Caption transcript (source_type=caption)
- [ ] Whisper transcript (source_type=whisper)
- [ ] is_primary=true인 레코드가 정확히 1개
- [ ] quality_score가 높은 쪽이 primary로 선택됨
- [ ] Caption quality_score: 5-10 범위
- [ ] Whisper quality_score: confidence * 10 범위

**Golden Set**:

```json
{
  "transcripts": [
    {
      "id": "uuid1",
      "source_type": "caption",
      "provider": "youtube",
      "is_primary": false,
      "quality_score": 7.5,
      "confidence": 0.0
    },
    {
      "id": "uuid2",
      "source_type": "whisper",
      "provider": "upload",
      "backend": "faster_whisper",
      "model": "large-v3",
      "is_primary": true,
      "quality_score": 8.5,
      "confidence": 0.85
    }
  ]
}
```

---

### Scenario 4: 자막 없는 YouTube URL

**목적**: 자막이 없는 경우 Whisper만 사용

**테스트 URL**:
```
# 자막 없는 테스트용 URL (B팀에게 요청)
https://www.youtube.com/watch?v=<no-caption-video>
```

**예상 결과**:
- Status: `created` → `downloading` → `ready_for_stt` → `transcribing` → `ready`
- Caption transcript 생성 안 됨
- Whisper transcript만 생성 (is_primary=true)

**검증 항목**:
- [ ] `caption_ready` 상태를 건너뜀
- [ ] MeetingTranscript 레코드 1개만 생성 (whisper)

---

### Scenario 5: 잘못된 URL (에러 케이스)

**목적**: 존재하지 않는 YouTube URL 처리

**테스트 URL**:
```
https://www.youtube.com/watch?v=invalid-test-url-123
```

**테스트 절차**:

```bash
# 1. Meeting 생성
curl -X POST http://localhost:8000/api/v1/meetings/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=invalid-test-url-123",
    "title": "QA Test - Invalid URL"
  }' | jq

MEETING_ID="<meeting_id>"

# 2. 폴링
for i in {1..20}; do
  echo "=== Poll $i ==="
  curl -s http://localhost:8000/api/v1/meetings/$MEETING_ID | jq '.status'
  sleep 3
done
```

**예상 결과**:
- Status: `created` → `downloading` → `download_failed`

**검증 항목**:
- [ ] Status가 `download_failed`로 변경
- [ ] MeetingTranscript 레코드 생성 안 됨
- [ ] 에러 메시지가 명확함

---

### Scenario 6: STT 실패 (에러 케이스)

**목적**: STT 중 에러 발생 시 처리

**전제 조건**:
- Whisper 서버가 중단된 상태
- 또는 손상된 오디오 파일

**테스트 절차**:

```bash
# 1. Whisper 서버 중단
# (Faster-Whisper 서버를 종료)

# 2. Meeting 생성
curl -X POST http://localhost:8000/api/v1/meetings/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "QA Test - STT Failed",
    "auto_transcribe": true
  }' | jq

MEETING_ID="<meeting_id>"

# 3. 폴링
# ...
```

**예상 결과**:
- Status: `created` → ... → `ready_for_stt` → `transcribing` → `stt_failed`

**검증 항목**:
- [ ] Status가 `stt_failed`로 변경
- [ ] Caption transcript는 생성됨 (있는 경우)
- [ ] Whisper transcript는 생성 안 됨

---

### Scenario 7: 타임아웃 (5분 이상)

**목적**: 처리 시간이 너무 긴 경우

**테스트 URL**:
```
# 매우 긴 YouTube 동영상 (1시간 이상)
https://www.youtube.com/watch?v=<long-video>
```

**검증 항목**:
- [ ] Frontend에서 5분 후 타임아웃 메시지 표시
- [ ] Backend는 계속 처리 중 (백그라운드)
- [ ] 사용자가 나중에 다시 확인 가능

---

## 🔍 API 응답 Golden Set

### POST /api/v1/meetings/from-url

**Request**:
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": "테스트 회의",
  "auto_transcribe": true
}
```

**Response (201 Created)**:
```json
{
  "meeting_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "created",
  "message": "Meeting created successfully. URL processing will start in background.",
  "transcription_started": false
}
```

### GET /api/v1/meetings/{meeting_id}

**Response (200 OK) - Caption Ready**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "owner_id": 1,
  "title": "테스트 회의",
  "status": "caption_ready",
  "file_url": null,
  "created_at": "2025-11-24T10:00:00Z",
  "updated_at": "2025-11-24T10:00:15Z"
}
```

**Response (200 OK) - Ready**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "owner_id": 1,
  "title": "테스트 회의",
  "status": "ready",
  "file_url": "meetings/1/550e8400-e29b-41d4-a716-446655440000/audio.mp4",
  "created_at": "2025-11-24T10:00:00Z",
  "updated_at": "2025-11-24T10:02:30Z"
}
```

### GET /api/v1/meetings/{meeting_id}/transcript

**Response (200 OK)**:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "meeting_id": "550e8400-e29b-41d4-a716-446655440000",
  "source_type": "whisper",
  "provider": "upload",
  "backend": "faster_whisper",
  "model": "large-v3",
  "transcript_text": "안녕하세요. 오늘은 ...",
  "segments": [
    {
      "start": 0.0,
      "end": 2.5,
      "text": "안녕하세요"
    },
    {
      "start": 2.5,
      "end": 5.0,
      "text": "오늘은 회의를 시작하겠습니다"
    }
  ],
  "language": "ko",
  "is_primary": true,
  "quality_score": 8.5,
  "confidence": 0.85,
  "created_at": "2025-11-24T10:02:30Z"
}
```

---

## 🧪 자동화 테스트 스크립트

### test_meeting_from_url.sh

```bash
#!/bin/bash

# Meeting From URL 자동 테스트 스크립트

API_BASE="http://localhost:8000/api/v1"
TEST_URL="https://www.youtube.com/watch?v=dQw4w9WgXcQ"

echo "=== Meeting From URL Test Suite ==="

# Test 1: Caption Only
echo ""
echo "Test 1: Caption Only (auto_transcribe=false)"
RESPONSE=$(curl -s -X POST "$API_BASE/meetings/from-url" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$TEST_URL\",
    \"title\": \"Test 1 - Caption Only\",
    \"auto_transcribe\": false
  }")

MEETING_ID=$(echo $RESPONSE | jq -r '.meeting_id')
echo "Meeting ID: $MEETING_ID"

# 폴링 (최대 40번, 3초 간격)
for i in {1..40}; do
  STATUS=$(curl -s "$API_BASE/meetings/$MEETING_ID" | jq -r '.status')
  echo "[$i] Status: $STATUS"

  if [[ "$STATUS" == "caption_ready" || "$STATUS" == "download_failed" ]]; then
    echo "Final status: $STATUS"
    break
  fi

  sleep 3
done

# Transcript 확인
echo "Checking transcript..."
curl -s "$API_BASE/meetings/$MEETING_ID/transcript" | jq '.source_type, .is_primary, .segments | length'

# Test 2: Audio + STT
echo ""
echo "Test 2: Audio + STT (auto_transcribe=true)"
RESPONSE=$(curl -s -X POST "$API_BASE/meetings/from-url" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$TEST_URL\",
    \"title\": \"Test 2 - Audio + STT\",
    \"auto_transcribe\": true
  }")

MEETING_ID=$(echo $RESPONSE | jq -r '.meeting_id')
echo "Meeting ID: $MEETING_ID"

# 폴링 (최대 100번, 3초 간격)
for i in {1..100}; do
  STATUS=$(curl -s "$API_BASE/meetings/$MEETING_ID" | jq -r '.status')
  echo "[$i] Status: $STATUS"

  if [[ "$STATUS" == "ready" || "$STATUS" == "download_failed" || "$STATUS" == "stt_failed" ]]; then
    echo "Final status: $STATUS"
    break
  fi

  sleep 3
done

# Transcripts 확인 (복수)
echo "Checking transcripts..."
curl -s "$API_BASE/meetings/$MEETING_ID/transcripts" | jq '.transcripts | length'

echo ""
echo "=== Test Suite Complete ==="
```

**실행 방법**:

```bash
chmod +x test_meeting_from_url.sh
./test_meeting_from_url.sh
```

---

## ✅ 체크리스트

### API 기능 테스트
- [ ] POST /api/v1/meetings/from-url (정상 케이스)
- [ ] POST /api/v1/meetings/from-url (잘못된 URL)
- [ ] GET /api/v1/meetings/{id} (폴링)
- [ ] GET /api/v1/meetings/{id}/transcript (단수)
- [ ] GET /api/v1/meetings/{id}/transcripts (복수)

### Status 전이 테스트
- [ ] created → downloading → caption_ready (Caption만)
- [ ] created → downloading → ready_for_stt → transcribing → ready (Audio + STT)
- [ ] downloading → download_failed (에러)
- [ ] transcribing → stt_failed (에러)

### Transcript 생성 테스트
- [ ] Caption transcript 생성 (source_type=caption)
- [ ] Whisper transcript 생성 (source_type=whisper)
- [ ] Primary 선택 (is_primary=true가 정확히 1개)
- [ ] Quality score 계산 (Caption: 5-10, Whisper: confidence * 10)

### 에러 케이스 테스트
- [ ] 잘못된 YouTube URL
- [ ] 자막 없는 YouTube URL
- [ ] STT 실패 (Whisper 서버 중단)
- [ ] 타임아웃 (5분 이상)

### Frontend 통합 테스트
- [ ] URL 입력 폼 동작
- [ ] Progress bar 진행
- [ ] Status badge 색상/텍스트
- [ ] 에러 메시지 표시
- [ ] 완료 후 자동 페이지 이동

---

## 📞 B팀/C팀 협업

### B팀에게 요청할 사항

1. **테스트용 YouTube URL**
   - 자막 있는 짧은 영상 (30초-1분)
   - 자막 없는 짧은 영상 (30초-1분)
   - 잘못된 URL (404 테스트용)

2. **로그 확인**
   - 에러 발생 시 Backend 로그 캡처
   - 재현 방법 공유

3. **타이밍 정보**
   - Caption 다운로드: 평균 몇 초?
   - Audio 다운로드: 평균 몇 초?
   - STT 처리: 1분 영상 기준 평균 몇 초?

### C팀에게 전달할 정보

1. **UI 테스트 결과**
   - Status별 UI 텍스트 확인
   - Progress bar 동작 확인
   - 에러 메시지 확인

2. **발견된 버그**
   - 재현 방법
   - 스크린샷/화면 녹화
   - 예상 동작 vs 실제 동작

---

## 🔗 참조 문서

- [MEETING_FROM_URL_CONTRACT.md](MEETING_FROM_URL_CONTRACT.md) - API 계약서
- [MEETING_FROM_URL_BACKEND_GUIDE.md](MEETING_FROM_URL_BACKEND_GUIDE.md) - B팀 작업 지침
- [MEETING_FROM_URL_FRONTEND_GUIDE.md](MEETING_FROM_URL_FRONTEND_GUIDE.md) - C팀 작업 지침
- [MEETING_API_TEST_GUIDE.md](MEETING_API_TEST_GUIDE.md) - 기존 Meeting API 테스트 가이드

---

이 문서는 **A팀의 작업 지침**입니다.
A/B/C 팀 간 계약은 [MEETING_FROM_URL_CONTRACT.md](MEETING_FROM_URL_CONTRACT.md)를 참조하세요.
