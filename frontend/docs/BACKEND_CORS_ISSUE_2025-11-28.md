# 🐛 백엔드 CORS 이슈 리포트

**작성일**: 2025-11-28
**작성자**: C팀 (Frontend Team)
**우선순위**: 🔴 High (Blocking)
**담당**: B팀 (Backend Team)

---

## 📋 요약

맥미니 백엔드 서버(`http://100.123.51.5:8000`)에서 CORS 설정이 되어 있지 않아, `localhost:3001`에서 실행되는 프론트엔드가 API를 호출할 수 없습니다.

---

## 🐛 에러 상세

### 증상

```
Access to fetch at 'http://100.123.51.5:8000/api/v1/concepts/from-prompt'
from origin 'http://localhost:3001'
has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 재현 방법

1. 프론트엔드 실행: `http://localhost:3001/studio/v3`
2. Chat 패널에서 메시지 전송: "립스틱 신제품 런칭 포스터"
3. ConceptAgent 호출 시도
4. **CORS 에러 발생**

### 브라우저 Console 에러

```javascript
Failed to load resource: net::ERR_FAILED
100.123.51.5:8000/api/v1/concepts/from-prompt:1

[sendMessage] Error: TypeError: Failed to fetch
    at generateConcepts (llm-gateway-client.ts:326:26)
    at sendMessage (useChatStore.ts:917:61)
```

---

## 🔍 영향 범위

### 영향을 받는 기능

- ✅ **ConceptAgent**: 컨셉 생성 불가
- ✅ **VisionGeneratorAgent**: 이미지 생성 불가 (테스트 불가)
- ✅ **모든 백엔드 API 호출**: CORS로 차단

### 영향을 받는 사용자

- ✅ C팀 (Frontend 개발자)
- ✅ Canvas Studio 사용자 전체
- ✅ 모든 Agent 기능 사용 불가

### 우회 방법

**없음** - CORS는 브라우저 보안 정책이므로 프론트엔드에서 우회 불가

---

## 🔧 권장 수정 사항

### 1. FastAPI CORS 미들웨어 설정

**위치**: `backend/app/main.py`

**추가해야 할 코드**:

```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Sparklio V4 API",
    version="4.0.0",
    description="Sparklio AI Marketing Studio Backend"
)

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        # 프로덕션 도메인 추가
        # "https://sparklio.ai",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, PUT, DELETE 등 모든 메서드 허용
    allow_headers=["*"],  # 모든 헤더 허용
)
```

### 2. 환경 변수로 관리 (권장)

**더 나은 방법**: 환경 변수로 허용할 Origin 관리

`.env`:
```bash
# CORS 허용 Origin (쉼표로 구분)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://sparklio.ai
```

`backend/app/main.py`:
```python
import os

# 환경 변수에서 허용 Origin 읽기
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:3001"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📊 테스트 결과

### 현재 상태 (CORS 미설정)

```bash
# Preflight 요청 실패
curl -X OPTIONS http://100.123.51.5:8000/api/v1/concepts/from-prompt \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: POST" \
  -v

# 응답: No 'Access-Control-Allow-Origin' header
```

### 수정 후 예상 상태

```bash
# Preflight 요청 성공
< HTTP/1.1 200 OK
< Access-Control-Allow-Origin: http://localhost:3001
< Access-Control-Allow-Credentials: true
< Access-Control-Allow-Methods: POST
< Access-Control-Allow-Headers: *
```

---

## 📝 추가 정보

### 현재 백엔드 환경

```
서버: 맥미니 도커
URL: http://100.123.51.5:8000
프레임워크: FastAPI (uvicorn)
```

### 프론트엔드 환경

```
URL: http://localhost:3001
프레임워크: Next.js 14
API 호출: fetch API
```

### CORS란?

**Cross-Origin Resource Sharing (CORS)**는 브라우저 보안 기능으로, 다른 도메인의 리소스 접근을 제한합니다.

- Origin이 다르면 기본적으로 차단
- 예: `localhost:3001` → `100.123.51.5:8000` (서로 다른 Origin)
- 백엔드에서 명시적으로 허용해야 함

---

## ✅ 수정 확인 방법

### 1. 백엔드 수정 후 재시작

```bash
# 맥미니에서
cd backend
# 도커 재시작 또는
docker-compose restart backend
# 또는 uvicorn 재시작
```

### 2. 프론트엔드 테스트

```bash
# 브라우저에서
http://localhost:3001/studio/v3

# Chat에서 메시지 전송
"립스틱 신제품 런칭 포스터"

# 기대 결과:
# ✅ ConceptAgent 정상 호출
# ✅ 컨셉 생성 성공
# ✅ Console에 CORS 에러 없음
```

### 3. Network 탭 확인

```
1. F12 → Network 탭
2. "concepts/from-prompt" 요청 확인
3. Status: 200 OK
4. Response Headers 확인:
   - Access-Control-Allow-Origin: http://localhost:3001
   - Access-Control-Allow-Credentials: true
```

---

## 🎯 기대 효과

### 수정 전

- ❌ 모든 백엔드 API 호출 차단
- ❌ ConceptAgent 사용 불가
- ❌ VisionGeneratorAgent 테스트 불가
- ❌ Canvas Studio 기능 전체 마비

### 수정 후

- ✅ 모든 백엔드 API 정상 호출
- ✅ ConceptAgent 정상 동작
- ✅ VisionGeneratorAgent 테스트 가능
- ✅ Canvas Studio 전체 기능 사용 가능

---

## 🔒 보안 고려사항

### 개발 환경

```python
# 개발 시: localhost 허용
allow_origins=[
    "http://localhost:3000",
    "http://localhost:3001",
]
```

### 프로덕션 환경

```python
# 프로덕션: 특정 도메인만 허용
allow_origins=[
    "https://sparklio.ai",
    "https://app.sparklio.ai",
]
```

### ⚠️ 절대 하지 말아야 할 것

```python
# ❌ 위험: 모든 Origin 허용 (보안 취약)
allow_origins=["*"]
```

---

## 📞 연락처

**보고자**: C팀 (Frontend Team)
**담당자**: B팀 (Backend Team)
**우선순위**: 🔴 High
**예상 수정 시간**: 5분

**관련 문서**:
- [BACKEND_BUG_REPORT_2025-11-28.md](./BACKEND_BUG_REPORT_2025-11-28.md) - Nano Banana Provider 버그
- [BROWSER_TEST_GUIDE_VISION_AGENT.md](./BROWSER_TEST_GUIDE_VISION_AGENT.md) - VisionGeneratorAgent 테스트 가이드

**참고**:
- FastAPI CORS 공식 문서: https://fastapi.tiangolo.com/tutorial/cors/
- MDN CORS 가이드: https://developer.mozilla.org/ko/docs/Web/HTTP/CORS

---

**최종 업데이트**: 2025-11-28 17:00
**상태**: 🔴 Open (수정 대기 중)
**Blocking**: VisionGeneratorAgent 통합 테스트 진행 불가
