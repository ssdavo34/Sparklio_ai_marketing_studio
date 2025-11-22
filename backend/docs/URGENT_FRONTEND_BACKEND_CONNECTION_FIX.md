# 🚨 긴급: Frontend-Backend 연결 문제 해결 가이드

**작성일**: 2025-11-22 (v2.0 - API 엔드포인트 수정)
**우선순위**: P0 (즉시 해결 필요)
**상태**: 🔴 API 엔드포인트 불일치 확인 필요

---

## 📊 현재 상황 분석

### 에러 로그 분석

```
POST http://100.123.51.5:8000/api/v1/agents/execute
net::ERR_CONNECTION_REFUSED
```

**문제점**:
1. ❌ Frontend가 `100.123.51.5:8000`로 요청 중
2. ❌ Backend가 해당 주소에서 실행되지 않음
3. ❌ **엔드포인트 형식이 잘못됨** (`/agents/execute` → `/agents/{agent_name}/execute`)
4. ✅ Frontend는 정상 작동 중 (localhost:3000)

---

## 🔧 즉시 해결 방법 (3단계)

### Step 1: Backend 서버 실행 확인

**Backend 터미널에서 실행**:
```bash
cd k:\sparklio_ai_marketing_studio\backend

# 가상환경 활성화 (Windows)
.venv\Scripts\activate

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**확인 사항**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

이 메시지가 보이면 Backend 서버가 실행 중입니다.

---

### Step 2: Frontend 환경 변수 및 API 호출 수정

**문제 1**: Frontend가 `100.123.51.5:8000`로 요청 중
**문제 2**: ❌ **잘못된 엔드포인트** `/agents/execute`

**해결**: Frontend 코드 수정 필요

#### 옵션 A: `.env` 파일 수정 (권장)

**파일**: `frontend/.env.local` 또는 `frontend/.env`

```env
# Before (문제 상황)
NEXT_PUBLIC_API_URL=http://100.123.51.5:8000/api/v1
# or
VITE_API_URL=http://100.123.51.5:8000/api/v1

# After (로컬 개발)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
# or
VITE_API_URL=http://localhost:8000/api/v1
```

**수정 후 Frontend 재시작**:
```bash
# Ctrl + C로 중지 후
npm run dev
# or
yarn dev
```

#### 옵션 B: API 호출 코드 수정 (중요!)

**파일**: `frontend/lib/sparklio-ai-client.ts` (또는 API 클라이언트 파일)

```typescript
// ❌ 잘못된 코드 (Before)
const baseUrl = 'http://100.123.51.5:8000/api/v1';

async function executeAgent(agent: string, task: string, payload: any) {
  // ❌ 잘못된 엔드포인트
  const response = await fetch(`${baseUrl}/agents/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent, task, payload })
  });
  return await response.json();
}

// ✅ 올바른 코드 (After)
const baseUrl = 'http://localhost:8000/api/v1';

async function executeAgent(agentName: string, task: string, payload: any) {
  // ✅ 올바른 엔드포인트 형식
  const response = await fetch(`${baseUrl}/agents/${agentName}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, payload })
  });
  return await response.json();
}
```

**핵심 변경사항**:
1. URL: `100.123.51.5:8000` → `localhost:8000`
2. 엔드포인트: `/agents/execute` → `/agents/{agentName}/execute`
3. Body 구조: `{ agent, task, payload }` → `{ task, payload }`

---

### Step 3: CORS 설정 확인

Backend의 CORS 설정이 올바른지 확인:

**파일**: `backend/app/main.py`

```python
# CORS 설정 확인
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # ✅ 이 줄이 있어야 함
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**만약 수정이 필요하면**:
1. `backend/app/main.py` 파일 수정
2. Backend 서버 재시작 (Ctrl+C 후 다시 `uvicorn` 실행)

---

## ✅ 연결 테스트

### 1. Backend Health Check

**브라우저에서 접속**:
```
http://localhost:8000/api/v1/health
```

**기대 응답**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-11-22T..."
}
```

**또는 터미널에서**:
```bash
curl http://localhost:8000/api/v1/health
```

---

### 2. Agent API 테스트

**브라우저 콘솔에서 실행** (F12 → Console):

```javascript
// ✅ 올바른 Agent 호출 방법
fetch('http://localhost:8000/api/v1/agents/copywriter/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    task: 'generate_ad_copy',
    payload: {
      product_name: '테스트 제품',
      target_audience: '20-30대',
      platform: 'instagram',
      tone: 'friendly'
    }
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Agent 실행 성공:', data);
  console.log('생성된 결과:', data.outputs[0].value);
})
.catch(err => console.error('❌ Agent 실행 실패:', err));
```

**성공 시 출력**:
```
✅ Agent 실행 성공: {
  agent: "copywriter",
  task: "generate_ad_copy",
  outputs: [
    {
      type: "text",
      name: "result",
      value: "생성된 광고 카피 내용...",
      meta: {}
    }
  ],
  usage: { tokens: 150 },
  meta: {},
  timestamp: "2025-11-22T..."
}
```

---

### 3. 다른 Agent 테스트

```javascript
// RAG Agent 테스트
fetch('http://localhost:8000/api/v1/agents/rag/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task: 'search_knowledge',
    payload: {
      query: 'brand guidelines',
      top_k: 5
    }
  })
})
.then(res => res.json())
.then(data => console.log('✅ RAG Agent 성공:', data))
.catch(err => console.error('❌ RAG Agent 실패:', err));

// Trend Collector Agent 테스트
fetch('http://localhost:8000/api/v1/agents/trend_collector/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task: 'collect_trends',
    payload: {
      keywords: ['AI', '마케팅'],
      platform: 'instagram',
      period: '7d'
    }
  })
})
.then(res => res.json())
.then(data => console.log('✅ Trend Collector 성공:', data))
.catch(err => console.error('❌ Trend Collector 실패:', err));
```

---

## 🐛 트러블슈팅

### 문제 1: "net::ERR_CONNECTION_REFUSED"

**원인**: Backend 서버가 실행되지 않거나 잘못된 주소로 요청

**해결**:
1. Backend 터미널 확인
2. `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` 실행
3. `http://localhost:8000/docs` 접속하여 Swagger UI 확인

---

### 문제 2: "CORS policy: No 'Access-Control-Allow-Origin'"

**원인**: CORS 설정 누락

**해결**:
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 추가
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### 문제 3: "404 Not Found" - Agent 이름 오류

**원인**: 잘못된 엔드포인트 경로

**확인**:
```
❌ 잘못된 요청: POST /api/v1/agents/execute
✅ 올바른 요청: POST /api/v1/agents/copywriter/execute
```

**사용 가능한 Agent 목록 (21개)**:
- **Creation**: copywriter, strategist, designer, reviewer, optimizer, editor, meeting_ai, vision_analyzer, scene_planner, template
- **Intelligence**: trend_collector, data_cleaner, embedder, rag, ingestor, performance_analyzer, self_learning
- **System**: pm, qa, error_handler, logger

**Swagger UI에서 확인**:
```
http://localhost:8000/docs
```

모든 API 엔드포인트 목록 확인 가능

---

### 문제 4: "400 Bad Request" - 요청 Body 형식 오류

**원인**: 잘못된 요청 Body 구조

**해결**:
```javascript
// ❌ 잘못된 Body
{
  "agent": "copywriter",  // ❌ 불필요
  "task": "generate_ad_copy",
  "payload": { ... }
}

// ✅ 올바른 Body
{
  "task": "generate_ad_copy",
  "payload": { ... }
}
```

---

### 문제 5: "401 Unauthorized"

**원인**: 인증 토큰 누락 (프로덕션 환경)

**해결** (개발 환경):
```typescript
// 개발 환경에서는 Authorization 헤더 생략 가능
headers: {
  'Content-Type': 'application/json',
  // Authorization 없이 테스트
}

// 프로덕션 환경
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}
```

---

## 📝 체크리스트

**Backend**:
- [ ] Backend 서버 실행 중 (`uvicorn` 프로세스 확인)
- [ ] `http://localhost:8000/docs` 접속 가능
- [ ] `http://localhost:8000/api/v1/health` 응답 확인
- [ ] CORS 설정에 `http://localhost:3000` 포함

**Frontend**:
- [ ] 환경 변수 `API_URL`이 `http://localhost:8000/api/v1`로 설정
- [ ] API 호출이 `/agents/{agent_name}/execute` 형식 사용
- [ ] 요청 Body가 `{ task, payload }` 구조 사용
- [ ] Frontend 서버 재시작 완료
- [ ] 브라우저 콘솔에서 CORS 에러 없음
- [ ] Agent 실행 테스트 성공

**연결 확인**:
- [ ] Health check 성공
- [ ] Agent execute API 호출 성공
- [ ] 브라우저 콘솔에 `net::ERR_CONNECTION_REFUSED` 에러 없음

---

## 🚀 빠른 전체 재시작 가이드

### Backend 재시작
```bash
# 1. Backend 디렉토리로 이동
cd k:\sparklio_ai_marketing_studio\backend

# 2. 가상환경 활성화
.venv\Scripts\activate

# 3. 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 확인: http://localhost:8000/docs 접속 가능해야 함
```

### Frontend 재시작
```bash
# 1. Frontend 디렉토리로 이동
cd k:\sparklio_ai_marketing_studio\frontend

# 2. 환경 변수 확인/수정
# .env.local 파일에서 API_URL 확인

# 3. API 클라이언트 코드 수정
# lib/sparklio-ai-client.ts에서 엔드포인트 형식 수정

# 4. 서버 재시작
npm run dev
# or
yarn dev

# 확인: http://localhost:3000 접속 가능해야 함
```

---

## 📞 추가 지원

**여전히 연결 실패 시 확인할 사항**:

1. **방화벽 확인**:
   ```bash
   # Windows 방화벽에서 8000 포트 허용 확인
   netstat -an | findstr :8000
   ```

2. **포트 사용 중 확인**:
   ```bash
   # 8000 포트 사용 프로세스 확인
   netstat -ano | findstr :8000
   ```

3. **로그 확인**:
   - Backend 터미널의 에러 로그
   - 브라우저 개발자 도구 Network 탭
   - 브라우저 콘솔 에러 메시지

**Slack 문의**:
- 채널: `#backend-support`
- 제공 정보:
  - 에러 메시지 스크린샷
  - Backend 터미널 로그
  - 브라우저 콘솔 로그
  - 요청 URL 및 Body

---

## 🎯 성공 확인 방법

**다음이 모두 성공하면 연결 완료**:

1. ✅ Backend: `http://localhost:8000/docs` 접속 가능
2. ✅ Health Check: `http://localhost:8000/api/v1/health` 응답 확인
3. ✅ Agent API: `/agents/{agent_name}/execute` 형식으로 호출 성공
4. ✅ 콘솔: `net::ERR_CONNECTION_REFUSED` 에러 없음

**성공 시 브라우저 콘솔 출력**:
```
POST http://localhost:8000/api/v1/agents/copywriter/execute 200 OK
✅ Agent 실행 성공: { agent: "copywriter", outputs: [...] }
```

---

## 📚 관련 문서

- [LLM 통합 가이드](./LLM_INTEGRATION_GUIDE.md)
- [C팀 협업 요청서](./C_TEAM_COLLABORATION_REQUEST_2025-11-22.md)
- [Agent 테스트 결과](../tests/test_system_agents.py)
- [Swagger UI](http://localhost:8000/docs)

---

## 🔑 핵심 포인트 요약

1. **URL 변경**: `100.123.51.5:8000` → `localhost:8000`
2. **엔드포인트 형식**: `/agents/execute` → `/agents/{agent_name}/execute`
3. **요청 Body**: `{ agent, task, payload }` → `{ task, payload }`
4. **CORS 설정**: `localhost:3000` 허용 확인
5. **Backend 실행**: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

---

**작성자**: Backend Team
**최종 수정**: 2025-11-22 (v2.0)
**변경사항**: API 엔드포인트를 `/agents/{agent_name}/execute` 형식으로 수정
**문의**: #backend-support
