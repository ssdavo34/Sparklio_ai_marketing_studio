# Backend CORS Configuration Fix Request

**작성일**: 2025-11-24
**요청자**: C팀 (Frontend)
**대상**: B팀 (Backend)
**우선순위**: 🔴 CRITICAL

---

## 1. 문제 상황

### 실제 에러 (CORS 차단)
```
Access to fetch at 'http://100.123.51.5:8000/api/v1/meetings' from origin 'http://localhost:3000'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 증상
- Frontend (localhost:3000)에서 Backend API (100.123.51.5:8000) 호출 시 모든 요청이 브라우저에서 차단됨
- Console에 CORS policy error 표시
- Network tab에서 request가 실패 (CORS preflight 또는 차단)

### 영향 범위
- ❌ Meeting AI 기능 완전 차단
- ❌ GET /api/v1/meetings 불가
- ❌ POST /api/v1/meetings/from-url 불가
- ❌ 모든 Meeting API 엔드포인트 사용 불가

---

## 2. 원인 분석

### CORS란?
- **Cross-Origin Resource Sharing**: 브라우저 보안 정책
- 다른 도메인/포트로의 요청을 기본적으로 차단
- Frontend: `http://localhost:3000` (Origin A)
- Backend: `http://100.123.51.5:8000` (Origin B)
- Origin이 다르므로 CORS 설정 필요

### Backend에 필요한 것
Backend가 응답 헤더에 다음을 포함해야 함:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

---

## 3. 해결 방법 (Backend 수정)

### Option 1: FastAPI CORS Middleware 추가 (권장)

**파일**: `backend/app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS 설정 추가 (이 부분을 추가해주세요)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Next.js dev server
        "http://127.0.0.1:3000",      # Alternative localhost
        "http://100.123.51.5:3000",   # Mac mini IP (필요 시)
    ],
    allow_credentials=True,
    allow_methods=["*"],              # GET, POST, PUT, DELETE, OPTIONS 모두 허용
    allow_headers=["*"],              # 모든 헤더 허용
)

# 기존 코드 계속...
```

### Option 2: 개발 환경에서 모든 Origin 허용 (테스트용)

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],              # ⚠️ 개발 환경에서만 사용!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**주의**: Production 환경에서는 `allow_origins=["*"]` 사용 금지!

---

## 4. 적용 방법

### Step 1: Backend 코드 수정
1. `backend/app/main.py` 열기
2. 상단에 import 추가:
   ```python
   from fastapi.middleware.cors import CORSMiddleware
   ```
3. `app = FastAPI()` 직후에 middleware 추가 (위의 코드 참고)

### Step 2: Backend 재시작
```bash
# Docker를 사용하는 경우
docker-compose restart backend

# 또는 Docker container 재시작
docker restart sparklio-backend

# 또는 로컬 실행 중이라면
# Ctrl+C 후 다시 실행: uvicorn app.main:app --reload
```

### Step 3: 확인
```bash
# CORS preflight 확인 (OPTIONS 요청)
curl -X OPTIONS http://100.123.51.5:8000/api/v1/meetings \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v

# 예상 응답 헤더:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
# Access-Control-Allow-Headers: *
```

---

## 5. Frontend 확인 사항

### CORS 수정 후 테스트
Backend CORS 설정 완료 후, Frontend에서 다음 테스트:

```bash
# 1. Dev server 재시작 (이미 실행 중이면 재시작 불필요)
npm run dev

# 2. 브라우저에서 다음 URL 접속
http://localhost:3000/canvas-studio

# 3. Meeting AI 탭에서 YouTube URL 입력
# 예: https://www.youtube.com/watch?v=dQw4w9WgXcQ

# 4. Console 확인
# ✅ CORS 에러가 사라져야 함
# ✅ Network tab에서 200/201 응답 확인
```

---

## 6. 현재 상태 정리

### ✅ Frontend 구현 완료
- [x] Meeting API 클라이언트 함수 (`meeting-api.ts`)
- [x] MeetingTab UI with Status Badges
- [x] Polling logic (3초 간격)
- [x] Progress bars (created=10%, downloading=30%, transcribing=80%, ready=100%)
- [x] Error handling

### ✅ Backend 구현 완료 (B팀 확인)
- [x] POST /api/v1/meetings/from-url (Stage 1: Caption download)
- [x] Background task processing
- [x] Status lifecycle (12 statuses)
- [x] YouTube Caption extraction pipeline

### ❌ 현재 문제
- [ ] **CORS 설정 누락** ← 이것만 해결하면 됩니다!

---

## 7. 예상 소요 시간

- **Backend 코드 수정**: 2분
- **Backend 재시작**: 1분
- **Frontend 테스트**: 2분
- **총 소요 시간**: ~5분

---

## 8. 참고 자료

### FastAPI CORS Documentation
- https://fastapi.tiangolo.com/tutorial/cors/

### MDN CORS Guide
- https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

### FastAPI Middleware 순서 중요!
```python
# ✅ 올바른 순서
app = FastAPI()
app.add_middleware(CORSMiddleware, ...)  # CORS를 먼저
app.include_router(api_router)           # Router는 나중에

# ❌ 잘못된 순서
app = FastAPI()
app.include_router(api_router)           # Router를 먼저 하면
app.add_middleware(CORSMiddleware, ...)  # CORS가 적용 안 될 수 있음
```

---

## 9. 연락처

- **Frontend 담당**: C팀
- **Backend 담당**: B팀
- **긴급 문의**: 이 문서에 코멘트 또는 Slack DM

---

**작성 완료**: 2025-11-24
**다음 액션**: B팀이 CORS middleware 추가 후 확인 요청

---

## 10. Troubleshooting

### CORS 추가 후에도 에러가 나는 경우

#### 1. Preflight 요청 실패
```bash
# OPTIONS 요청 확인
curl -X OPTIONS http://100.123.51.5:8000/api/v1/meetings \
  -H "Origin: http://localhost:3000" \
  -v
```

#### 2. Credentials 에러
```
The value of the 'Access-Control-Allow-Credentials' header in the response is ''
which must be 'true' when the request's credentials mode is 'include'.
```
→ `allow_credentials=True` 설정 확인

#### 3. 여전히 차단되는 경우
- Backend 로그 확인: CORS middleware가 로드되었는지?
- Docker container 재시작 확인되었는지?
- Browser cache 삭제 후 재시도 (Ctrl+Shift+R)

---

**요약**: Backend의 `main.py`에 **5줄의 CORS middleware 코드**만 추가하면 해결됩니다! 🚀
