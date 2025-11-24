# Backend Meeting API 확인 요청서

**작성일**: 2025-11-24
**요청자**: C팀 (Frontend)
**대상**: B팀 (Backend)

---

## 1. 문제 상황

Frontend에서 Meeting AI 기능 테스트 중 다음 API 호출 시 **404 Not Found** 에러 발생:

```
GET  http://100.123.51.5:8000/api/v1/meetings -> 404
POST http://100.123.51.5:8000/api/v1/meetings/from-url -> 404
```

### 에러 스크린샷
사용자가 제공한 스크린샷에서:
- Meeting AI 탭에서 URL 입력 후 에러 발생
- Console에 404 에러 표시
- Backend 서버는 정상 동작 중 (Mac mini 100.123.51.5:8000)

---

## 2. Backend 코드 분석 결과

### ✅ 확인된 사항
1. **Meeting API 엔드포인트 구현됨**: `backend/app/api/v1/endpoints/meetings.py`
2. **Router 등록됨**: `backend/app/api/v1/router.py:122`
   ```python
   api_router.include_router(meetings.router, prefix="", tags=["Meetings"])
   ```
3. **Docker 컨테이너 정상 동작**: sparklio-backend, postgres, minio, redis 모두 Up
4. **Health check 통과**: `/health` endpoint 정상

### ⚠️ 의심되는 원인

#### A. 인증 문제 (가장 유력)
**모든 Meeting API 엔드포인트가 인증 필요**:
```python
@router.post("", response_model=MeetingUploadResponse)
async def create_meeting(
    current_user: User = Depends(get_current_user),  # ← 인증 필요
    db: Session = Depends(get_db)
):
```

**Frontend는 현재 인증 토큰 없이 호출 중**:
```typescript
// frontend/lib/api/meeting-api.ts
const response = await fetch(`${API_BASE}/api/v1/meetings`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    // ❌ Authorization 헤더 없음
  },
});
```

**예상 동작**:
- 인증 실패 시 401 Unauthorized 반환이 정상
- 하지만 404 Not Found가 발생하는 이유는?
  - FastAPI의 `get_current_user` 에서 early return?
  - Middleware에서 routing 전에 차단?

#### B. API 경로 문제
**Backend 실제 경로 확인 필요**:
- Frontend 호출: `/api/v1/meetings`
- Backend router prefix: `prefix=""` (line 122)
- Meeting router prefix: `prefix="/meetings"` (meetings.py line 46)
- **최종 경로**: `/api/v1` + `` + `/meetings` = `/api/v1/meetings` ✅ 맞음

하지만 main.py에서 api_router가 어떻게 mount되는지 확인 필요:
```python
# 예상: app.include_router(api_router, prefix="/api/v1")
```

#### C. URL 기반 Meeting 생성 엔드포인트 누락
**Frontend가 호출하는 엔드포인트**:
```typescript
POST /api/v1/meetings/from-url  // ❌ Backend에 없음
```

**Backend에 실제 존재하는 엔드포인트**:
```python
@router.post("", ...)           # POST /api/v1/meetings (파일 업로드용)
@router.get("", ...)            # GET /api/v1/meetings (목록 조회)
@router.post("/{meeting_id}/transcribe", ...)
@router.post("/{meeting_id}/analyze", ...)
@router.post("/{meeting_id}/to-brief", ...)
```

**Backend 코드 검색 결과**:
- `POST /meetings/from-url` 엔드포인트가 **구현되지 않음** ❌
- Frontend는 YouTube URL이나 웹 URL로 Meeting을 생성하려고 시도
- 하지만 Backend는 파일 업로드만 지원

---

## 3. 확인 요청 사항

### 우선순위 1: 인증 방식 확인
1. **Meeting API 엔드포인트는 인증이 필수인가요?**
   - 예 → Frontend에 인증 토큰 발급/설정 방법 필요
   - 아니오 → 개발 환경에서 인증 우회 방법?

2. **현재 Mac mini 서버에서 인증이 활성화되어 있나요?**
   ```bash
   # 테스트 필요
   curl -X GET http://100.123.51.5:8000/api/v1/meetings
   # 예상: 401 Unauthorized 또는 403 Forbidden
   ```

3. **인증 토큰 발급 방법은?**
   - Login API 엔드포인트는?
   - 개발 환경에서 사용할 테스트 계정은?
   - JWT 토큰 format은? (`Bearer <token>`)

### 우선순위 2: URL 기반 Meeting 생성 엔드포인트
1. **`POST /api/v1/meetings/from-url` 엔드포인트가 구현되어 있나요?**
   - ❌ meetings.py에서 찾을 수 없음
   - Frontend는 다음 기능을 기대:
     ```typescript
     // YouTube URL이나 웹페이지 URL로 Meeting 생성
     POST /api/v1/meetings/from-url
     Body: {
       url: string,
       title?: string,
       source_type: 'youtube' | 'other'
     }
     ```

2. **URL 기반 Meeting 생성이 구현 계획에 있나요?**
   - 예 → 구현 예정 일정?
   - 아니오 → Frontend에서 파일 업로드만 지원하도록 수정

### 우선순위 3: API 경로 확인
1. **main.py에서 api_router mount 방식 확인**:
   ```python
   # backend/app/main.py 확인 필요
   app.include_router(api_router, prefix="/api/v1")  # 이렇게 되어 있나요?
   ```

2. **실제 동작하는 Meeting API 엔드포인트 목록**:
   ```bash
   # 다음 명령어로 확인 가능
   curl http://100.123.51.5:8000/docs  # Swagger UI
   curl http://100.123.51.5:8000/openapi.json
   ```

---

## 4. Backend 팀 테스트 요청

### 테스트 1: 인증 없이 호출
```bash
# 1. Meeting 목록 조회 (인증 없음)
curl -X GET http://100.123.51.5:8000/api/v1/meetings \
  -H "Content-Type: application/json"

# 예상 결과: 401 Unauthorized 또는 404 Not Found?
```

### 테스트 2: 인증 포함 호출
```bash
# 2. Meeting 목록 조회 (인증 포함)
curl -X GET http://100.123.51.5:8000/api/v1/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TEST_TOKEN>"

# 예상 결과: 200 OK with empty list []
```

### 테스트 3: URL 기반 Meeting 생성
```bash
# 3. YouTube URL로 Meeting 생성
curl -X POST http://100.123.51.5:8000/api/v1/meetings/from-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TEST_TOKEN>" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Test YouTube Video",
    "source_type": "youtube"
  }'

# 예상 결과: 201 Created 또는 404 Not Found?
```

---

## 5. Frontend 임시 조치

### 현재 상태
- ✅ Meeting API 클라이언트 함수 구현 완료
- ✅ MeetingTab UI 구현 완료
- ❌ 실제 API 호출 시 404 에러

### 임시 조치 옵션
1. **Mock 데이터 사용** (Backend 준비 전까지)
   - `USE_MOCK = true` 플래그로 전환
   - Frontend UI 개발 계속 진행

2. **인증 우회** (개발 환경)
   - Backend에서 개발 환경용 인증 우회 설정 필요
   - 또는 테스트 계정/토큰 제공

3. **URL 기반 기능 비활성화**
   - 파일 업로드만 우선 구현
   - URL 기반 기능은 Backend 구현 후 추가

---

## 6. 요청 사항 정리

### B팀에게 요청
1. ✅ **인증 방식 안내** (가장 우선)
   - 로그인 API 엔드포인트
   - 테스트 계정/토큰
   - 개발 환경 인증 우회 방법

2. ✅ **URL 기반 Meeting 생성 엔드포인트 구현 여부**
   - `POST /api/v1/meetings/from-url`
   - 미구현 시 → Frontend 수정 필요
   - 구현 예정 시 → 일정 공유

3. ✅ **실제 API 경로 확인**
   - `/api/v1/meetings` 정확한지 확인
   - Swagger UI URL 공유

4. ✅ **Backend 로그 확인**
   - Frontend에서 404 에러 발생 시 Backend 로그에 request가 보이는지?
   - 보이지 않으면 → Routing 문제
   - 보이면 → 인증/권한 문제

### C팀 후속 조치
Backend 확인 결과에 따라:
- **인증 토큰 설정** → `meeting-api.ts`에 Authorization 헤더 추가
- **URL 엔드포인트 미구현** → MeetingTab에서 URL 입력 기능 임시 비활성화
- **API 경로 불일치** → Frontend API 경로 수정

---

## 7. 참고 파일

### Backend Files
- `backend/app/api/v1/endpoints/meetings.py` - Meeting API 엔드포인트
- `backend/app/api/v1/router.py:122` - Router 등록
- `backend/app/core/auth.py` - 인증 로직 (예상)
- `backend/app/main.py` - FastAPI app 설정

### Frontend Files
- `frontend/lib/api/meeting-api.ts` - Meeting API 클라이언트
- `frontend/components/canvas-studio/panels/left/tabs/MeetingTab.tsx` - Meeting UI
- `frontend/types/meeting.ts` - Meeting 타입 정의

---

## 8. 연락처

- **Frontend 담당**: C팀
- **Backend 담당**: B팀
- **긴급 문의**: 이 문서에 코멘트 또는 Slack DM

---

**작성 완료**: 2025-11-24
**다음 액션**: B팀 확인 및 피드백 대기
