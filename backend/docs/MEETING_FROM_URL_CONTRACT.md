# Meeting From URL - API Contract (공통 계약서)

작성일: 2025-11-24
버전: v1.0
대상: A팀 (QA), B팀 (Backend), C팀 (Frontend)

---

## 🔒 절대 변경 금지 사항

이 문서의 내용은 **A/B/C 팀 간 계약**입니다.
변경이 필요하면 **반드시 3팀 모두 합의** 후 수정해야 합니다.

---

## 1. API 엔드포인트 계약

### 1.1 Meeting 생성 (URL 기반)

```http
POST /api/v1/meetings/from-url
Content-Type: application/json
```

**Request Body**:
```json
{
  "url": "https://www.youtube.com/watch?v=xxxxx",  // 필수
  "title": "회의 제목",                              // 선택 (없으면 URL에서 추출)
  "description": "회의 설명",                        // 선택
  "brand_id": "uuid",                               // 선택
  "project_id": "uuid",                             // 선택
  "auto_transcribe": true                           // 선택 (기본값: true)
}
```

**Response (201 Created)**:
```json
{
  "meeting_id": "uuid",
  "status": "created",
  "message": "Meeting created successfully. URL processing will start in background.",
  "transcription_started": false
}
```

### 1.2 Meeting 조회

```http
GET /api/v1/meetings/{meeting_id}
```

**Response (200 OK)**:
```json
{
  "id": "uuid",
  "owner_id": 1,
  "title": "회의 제목",
  "status": "ready",              // ← 핵심: status 필드
  "file_url": "meetings/1/uuid/audio.mp4",
  "created_at": "2025-11-24T10:00:00Z",
  "updated_at": "2025-11-24T10:05:00Z",
  // ... 기타 필드
}
```

### 1.3 Meeting 목록 조회

```http
GET /api/v1/meetings?page=1&page_size=20
```

**Response (200 OK)**:
```json
{
  "items": [
    {
      "id": "uuid",
      "status": "ready",          // ← 각 Meeting의 status
      // ... 기타 필드
    }
  ],
  "total": 10,
  "page": 1,
  "page_size": 20
}
```

---

## 2. Meeting Status 값 (Enum)

### 2.1 상태 목록

| Status | 의미 | 설명 |
|--------|------|------|
| `created` | 생성됨 | Meeting 레코드만 생성된 상태 |
| `downloading` | 다운로드 중 | URL에서 오디오/자막 가져오는 중 |
| `caption_ready` | 자막 준비됨 | Caption transcript 생성 완료 (STT 전) |
| `ready_for_stt` | STT 대기 | 오디오 다운로드 완료, STT 준비됨 |
| `transcribing` | 음성 인식 중 | STT 진행 중 |
| `ready` | 완료 | 최소 1개의 transcript(primary)가 준비됨 |
| `download_failed` | 다운로드 실패 | 오디오 다운로드 실패 |
| `stt_failed` | 음성 인식 실패 | STT 실패 |

### 2.2 상태 전이 흐름

```
created
  ↓
downloading
  ↓
caption_ready (자막이 있는 경우)
  ↓
ready_for_stt
  ↓
transcribing
  ↓
ready
```

**실패 케이스**:
```
downloading → download_failed (오디오 다운로드 실패)
transcribing → stt_failed (STT 실패)
```

---

## 3. meeting_transcripts 스키마 (확정)

### 3.1 필수 필드

| 필드명 | 타입 | 설명 | 예시 값 |
|--------|------|------|---------|
| `id` | UUID | Primary Key | - |
| `meeting_id` | UUID | Foreign Key → meetings | - |
| `source_type` | Enum | `caption` \| `whisper` \| `merged` \| `manual` | `caption` |
| `provider` | Enum | `youtube` \| `upload` \| `zoom` \| ... | `youtube` |
| `backend` | Enum | `faster_whisper` \| `openai` \| `unknown` | `faster_whisper` |
| `model` | String | 사용된 모델 이름 | `large-v3` |
| `transcript_text` | Text | 전체 transcript 텍스트 | "안녕하세요..." |
| `language` | String | 언어 코드 | `ko` |
| `is_primary` | Boolean | Primary transcript 여부 | `true` |
| `quality_score` | Float | 품질 점수 (0-10) | `8.5` |
| `confidence` | Float | 신뢰도 (0-1) | `0.92` |

### 3.2 source_type 별 의미

- **`caption`**: YouTube 자막 등 외부에서 가져온 자막
- **`whisper`**: STT(faster-whisper, OpenAI Whisper 등)로 생성한 transcript
- **`merged`**: Caption과 Whisper를 병합한 transcript (LLM 사용 가능)
- **`manual`**: 사용자가 직접 수정한 transcript

### 3.3 primary transcript 규칙

- **Meeting당 1개의 transcript만 `is_primary=true`**
- Meeting AI (요약/브리프)는 primary transcript만 사용
- Caption과 Whisper가 모두 있으면, `quality_score` 높은 쪽을 primary로 선택

---

## 4. 에러 응답 포맷

### 4.1 표준 에러 응답

```json
{
  "detail": "Error message here",
  "status_code": 500
}
```

### 4.2 에러 코드

| HTTP Status | 상황 | 예시 메시지 |
|-------------|------|-------------|
| 400 | 잘못된 요청 | "Invalid URL format" |
| 404 | Meeting 없음 | "Meeting not found" |
| 500 | 서버 에러 | "Failed to process URL" |

---

## 5. Frontend 폴링 규칙 (권장사항)

### 5.1 폴링 주기

**Meeting 상태가 완료되지 않은 경우**:
- `status ∈ {created, downloading, caption_ready, ready_for_stt, transcribing}` 일 때
- **3초 간격**으로 `GET /api/v1/meetings/{id}` 호출

**Meeting 상태가 완료된 경우**:
- `status ∈ {ready, download_failed, stt_failed}` 일 때
- 폴링 중단

### 5.2 타임아웃

- 최대 5분간 폴링 후에도 `ready`가 되지 않으면 에러 표시
- 사용자에게 "처리 시간이 오래 걸리고 있습니다" 메시지

---

## 6. 테스트 데이터 (개발 환경)

### 6.1 Mock User (자동 생성)

```json
{
  "id": 1,
  "email": "test@sparklio.ai",
  "username": "test_user",
  "full_name": "Test User"
}
```

### 6.2 테스트용 YouTube URL

**자막 있는 영상 (테스트용)**:
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**자막 없는 영상 (실패 시나리오 테스트)**:
```
https://www.youtube.com/watch?v=invalid-test
```

---

## 7. 변경 이력

| 날짜 | 버전 | 변경 내용 | 승인 |
|------|------|-----------|------|
| 2025-11-24 | v1.0 | 초안 작성 | A/B/C 팀 |

---

## 8. 계약 위반 시 처리

이 문서의 내용을 변경하려면:

1. **변경 제안**: 변경 필요성을 문서화
2. **3팀 리뷰**: A/B/C 팀 모두 검토
3. **합의 후 수정**: 3팀 모두 동의 시에만 수정
4. **버전 업데이트**: v1.0 → v1.1 등

**긴급 변경이 필요한 경우**:
- Slack #backend-frontend-sync 채널에 공지
- 임시 문서 작성 후 추후 정식 반영

---

## ✅ 체크리스트

### B팀 (Backend)
- [ ] `POST /api/v1/meetings/from-url` 엔드포인트 구현
- [ ] Meeting.status 필드 추가 (Enum 8개 값)
- [ ] meeting_transcripts 스키마 확인

### C팀 (Frontend)
- [ ] meeting-api.ts에 createFromUrl 함수 추가
- [ ] Meeting 타입에 status 필드 추가
- [ ] Status 별 UI 텍스트 매핑 완료

### A팀 (QA)
- [ ] Status 전이 테스트 시나리오 작성
- [ ] curl 테스트 스크립트 준비
- [ ] 에러 케이스 Golden Set 설계

---

이 문서는 **A/B/C 팀의 공통 기준**입니다.
각 팀별 세부 작업 지침은 별도 문서를 참조하세요:

- [B팀 작업 지침](MEETING_FROM_URL_BACKEND_GUIDE.md)
- [C팀 작업 지침](MEETING_FROM_URL_FRONTEND_GUIDE.md)
- [A팀 작업 지침](MEETING_FROM_URL_QA_GUIDE.md)
