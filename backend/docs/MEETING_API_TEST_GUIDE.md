# Meeting API 테스트 가이드 (C팀용)

작성일: 2025-11-24
작성자: B팀 (Backend)

## 🎯 핵심 문제 해결 완료

### ✅ 1. 인증 문제 해결
**문제**: Frontend에서 인증 토큰 없이 호출 시 401 에러 발생

**해결**:
- `app/core/auth.py`의 `get_current_user` 함수 수정
- 개발 환경에서는 **토큰 없어도 Mock User 자동 반환**
- Mock User 정보:
  ```json
  {
    "id": 1,
    "email": "test@sparklio.ai",
    "username": "test_user",
    "full_name": "Test User"
  }
  ```

### ✅ 2. `/from-url` 엔드포인트 추가
**경로**: `POST /api/v1/meetings/from-url`

**상태**: Placeholder 구현 완료 (실제 다운로드 기능은 향후 구현)

**동작**:
- Meeting 레코드 생성 (status=PENDING)
- YouTube URL 다운로드 기능은 TODO
- Frontend에서 호출 가능하도록 API는 준비됨

---

## 📡 API 엔드포인트 목록

### 1. 회의 생성 (파일 업로드용)
```http
POST /api/v1/meetings
Content-Type: multipart/form-data

title=회의제목&description=설명&meeting_date=2025-11-24T10:00:00
```

**응답**:
```json
{
  "meeting_id": "uuid",
  "upload_url": "presigned URL",
  "file_key": "meetings/1/uuid/audio.mp4",
  "expires_in": 3600
}
```

### 2. 회의 생성 (URL로부터) ✨ NEW
```http
POST /api/v1/meetings/from-url
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=xxxxx",
  "title": "회의 제목 (옵션)",
  "description": "회의 설명 (옵션)",
  "auto_transcribe": true
}
```

**응답**:
```json
{
  "meeting_id": "uuid",
  "status": "pending",
  "message": "Meeting created successfully. Note: URL download feature is not yet implemented. Please use file upload instead.",
  "transcription_started": false
}
```

### 3. 회의 목록 조회
```http
GET /api/v1/meetings?page=1&page_size=20
```

### 4. 회의 상세 조회
```http
GET /api/v1/meetings/{meeting_id}
```

### 5. 트랜스크립션 실행
```http
POST /api/v1/meetings/{meeting_id}/transcribe
Content-Type: application/json

{
  "language": "ko",
  "reprocess": false,
  "run_meeting_agent": true
}
```

### 6. 트랜스크립트 조회
```http
GET /api/v1/meetings/{meeting_id}/transcript
```

### 7. 회의 요약 생성
```http
POST /api/v1/meetings/{meeting_id}/summary
```

### 8. 회의 → 브리프 변환
```http
POST /api/v1/meetings/{meeting_id}/to-brief
Content-Type: application/json

{
  "additional_context": "추가 컨텍스트 (옵션)"
}
```

---

## 🧪 테스트 방법

### 방법 1: curl 명령어 (Backend 검증용)

#### 1.1. 회의 생성 테스트
```bash
curl -X POST http://localhost:8000/api/v1/meetings/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=test",
    "title": "테스트 회의"
  }'
```

**예상 응답** (200 OK):
```json
{
  "meeting_id": "uuid",
  "status": "pending",
  "message": "Meeting created successfully...",
  "transcription_started": false
}
```

#### 1.2. 회의 목록 조회 테스트
```bash
curl http://localhost:8000/api/v1/meetings
```

**예상 응답** (200 OK):
```json
{
  "items": [...],
  "total": 1,
  "page": 1,
  "page_size": 20
}
```

### 방법 2: Frontend에서 테스트

#### 2.1. meeting-api.ts에서 호출
```typescript
import { meetingApi } from '@/lib/api/meeting-api'

// 테스트 1: URL로부터 회의 생성
const result = await meetingApi.createFromUrl({
  url: 'https://www.youtube.com/watch?v=test',
  title: '테스트 회의'
})

console.log('Meeting created:', result.meeting_id)

// 테스트 2: 회의 목록 조회
const meetings = await meetingApi.list({ page: 1, pageSize: 20 })
console.log('Meetings:', meetings.items)
```

#### 2.2. React 컴포넌트에서 테스트
```tsx
const handleCreateMeeting = async () => {
  try {
    const result = await meetingApi.createFromUrl({
      url: 'https://www.youtube.com/watch?v=test',
      title: '테스트 회의'
    })
    console.log('Success:', result)
  } catch (error) {
    console.error('Error:', error)
  }
}
```

---

## 🔍 문제 해결 가이드

### 문제 1: CORS 에러
**증상**: `Access-Control-Allow-Origin` 에러

**해결**:
- Backend main.py에서 CORS 설정 확인
- Frontend 주소가 allowed origins에 포함되어 있는지 확인

### 문제 2: 401 Unauthorized
**증상**: 인증 에러

**해결**:
- ✅ 이미 해결됨! 토큰 없이도 동작함
- Mock User가 자동으로 생성됨

### 문제 3: 404 Not Found
**증상**: 엔드포인트를 찾을 수 없음

**체크리스트**:
- [ ] Backend 서버가 실행 중인지 확인 (`uvicorn main:app --reload`)
- [ ] URL이 정확한지 확인 (`/api/v1/meetings/from-url`)
- [ ] HTTP 메서드가 맞는지 확인 (POST)

### 문제 4: 500 Internal Server Error
**증상**: 서버 에러

**디버깅**:
1. Backend 로그 확인
   ```bash
   # Backend 터미널에서 에러 로그 확인
   tail -f logs/app.log
   ```

2. 데이터베이스 연결 확인
   - PostgreSQL이 실행 중인지 확인
   - `.env` 파일의 DATABASE_URL 확인

---

## 📝 TODO: 향후 구현 필요

### 1. `/from-url` 실제 다운로드 기능
**현재**: Placeholder (Meeting 레코드만 생성)

**필요한 작업**:
- [ ] yt-dlp 설치 및 통합
- [ ] YouTube URL 다운로드 로직
- [ ] MinIO 업로드
- [ ] 백그라운드 작업 (Celery 또는 FastAPI BackgroundTasks)
- [ ] 진행 상황 추적 (WebSocket or Polling)

**예상 일정**: 2-3일

### 2. 로그인 API 구현
**현재**: Mock User로 우회

**필요한 작업**:
- [ ] JWT 토큰 발급 API (`POST /api/v1/auth/login`)
- [ ] 회원가입 API (`POST /api/v1/auth/register`)
- [ ] 토큰 검증 로직

**예상 일정**: 2-3일

---

## 🎁 테스트용 데이터

### Mock Meeting (자동 생성됨)
```json
{
  "id": 1,
  "owner_id": 1,
  "title": "테스트 회의",
  "status": "pending",
  "created_at": "2025-11-24T10:00:00Z"
}
```

### Mock User (자동 생성됨)
```json
{
  "id": 1,
  "email": "test@sparklio.ai",
  "username": "test_user",
  "full_name": "Test User"
}
```

---

## 📞 문의 및 지원

**Backend 담당**: B팀
**Frontend 담당**: C팀

**문제 발생 시**:
1. Backend 로그 캡처
2. Frontend 네트워크 탭 캡처 (DevTools)
3. 재현 방법 정리
4. B팀에게 전달

---

## ✅ 체크리스트 (C팀)

### API 호출 테스트
- [ ] `POST /api/v1/meetings/from-url` 호출 성공
- [ ] `GET /api/v1/meetings` 목록 조회 성공
- [ ] `GET /api/v1/meetings/{id}` 상세 조회 성공
- [ ] 401 에러 없이 정상 동작

### Frontend 통합
- [ ] meeting-api.ts에서 createFromUrl 호출
- [ ] MeetingTab 컴포넌트에서 회의 목록 표시
- [ ] 에러 처리 (try-catch)
- [ ] 로딩 상태 표시

### 문제 보고
- [ ] 발견된 문제 문서화
- [ ] 재현 방법 정리
- [ ] B팀에게 전달
