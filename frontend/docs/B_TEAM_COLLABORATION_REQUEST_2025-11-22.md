# B팀 협업 요청서 - LLM Gateway 연동

> **작성일**: 2025-11-22
> **작성자**: C팀 (Frontend Team)
> **우선순위**: 🔴 High
> **담당자**: B팀 Backend 개발팀

---

## 📋 요청 개요

Frontend에서 Backend LLM Gateway와의 Agent 기반 통합을 완료했습니다.
Backend API 연동 테스트 및 CORS/인증 설정이 필요합니다.

---

## ✅ Frontend 작업 완료 사항

### 1. Agent 기반 시스템 구현
- ✅ Provider 선택 → Agent Role/Task 선택 방식으로 전환
- ✅ `/api/v1/agents/execute` 엔드포인트 연동 준비 완료
- ✅ UI에서 다음 정보 전송 가능:
  - Agent Role: `copywriter`, `designer`, `reviewer` 등
  - Task Type: `product_detail`, `sns`, `headline`, `image_generate` 등
  - Cost Mode: `fast`, `balanced`, `quality`

### 2. 구현된 파일
```
frontend/
├── lib/llm-gateway-client.ts          # LLM Gateway 클라이언트 (B팀 SDK 패턴)
├── components/canvas-studio/
│   ├── stores/
│   │   ├── types/llm.ts               # Agent/Task types 정의
│   │   └── useChatStore.ts            # Chat 상태 관리
│   └── panels/right/RightDock.tsx     # Agent/Task 선택 UI
└── docs/
    ├── LLM_INTEGRATION_REDESIGN_2025-11-22.md  # 재설계 보고서
    └── B_TEAM_COLLABORATION_REQUEST_2025-11-22.md  # 이 문서
```

### 3. 참조한 Backend 문서
- ✅ `backend/docs/LLM_INTEGRATION_GUIDE.md` - B팀 통합 가이드
- ✅ `backend/app/services/llm/gateway.py` - Gateway 구현
- ✅ `backend/B_TEAM_PROMPT_ENHANCEMENT_2025-11-22.md` - Agent 프롬프트

---

## 🚨 현재 발생 중인 이슈

### Issue #1: CORS 에러
**스크린샷**: 사용자 제공 이미지 참조 (Failed to fetch)

**에러 메시지**:
```
Sorry, I encountered an error: Failed to fetch
```

**원인 추정**:
1. CORS 설정 미비 (`http://localhost:3000` → `http://100.123.51.5:8000`)
2. Backend API 엔드포인트 미구현 또는 응답 없음

**Frontend 요청 정보**:
```typescript
// Frontend → Backend 요청
POST http://100.123.51.5:8000/api/v1/agents/execute

Headers:
  Content-Type: application/json

Body:
{
  "agent": "copywriter",
  "task": "product_detail",  // 또는 "chat"
  "payload": {
    "user_input": "헨드크림 상세 페이지",
    "messages": [...]  // 대화 히스토리
  }
}
```

---

## 🎯 B팀 요청 사항

### 1. 긴급 요청 (P0 - 즉시)

#### 1.1 CORS 설정
Backend에 다음 CORS 허용 필요:

```python
# backend/main.py 또는 app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://100.123.51.5:3000",  # Frontend URL
        # 프로덕션 도메인 추가
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 1.2 `/api/v1/agents/execute` 엔드포인트 확인
- 현재 정상 동작 여부 확인
- 테스트 요청 예시:
```bash
curl -X POST http://100.123.51.5:8000/api/v1/agents/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "copywriter",
    "task": "chat",
    "payload": {
      "user_input": "안녕하세요"
    }
  }'
```

**기대 응답**:
```json
{
  "agent": "copywriter",
  "task": "chat",
  "outputs": [
    {
      "type": "text",
      "name": "response",
      "value": "안녕하세요! 무엇을 도와드릴까요?"
    }
  ],
  "usage": {
    "tokens": 25,
    "cost": 0.0001
  }
}
```

### 2. 일반 요청 (P1 - 이번 주)

#### 2.1 인증 방식 확인
Frontend에서 JWT 토큰을 어떻게 전달해야 하는지 확인 필요:

**옵션 1: API Key (개발/테스트)**
```typescript
headers: {
  'X-API-Key': 'development-key'
}
```

**옵션 2: JWT Bearer Token (프로덕션)**
```typescript
headers: {
  'Authorization': `Bearer ${userToken}`
}
```

현재 어떤 방식을 사용하는지 알려주세요.

#### 2.2 Agent/Task 매핑 확인
Frontend에서 사용 중인 Agent/Task 조합이 Backend와 일치하는지 확인:

| Frontend Agent | Frontend Task | Backend 지원 여부 |
|---------------|---------------|------------------|
| `copywriter` | `product_detail` | ? |
| `copywriter` | `sns` | ? |
| `copywriter` | `headline` | ? |
| `copywriter` | `chat` | ? |
| `designer` | `image_generate` | ? |
| `reviewer` | `review` | ? |

**요청**: 위 테이블에 지원 여부 체크 부탁드립니다.

#### 2.3 에러 응답 포맷 확인
Frontend는 다음 에러 포맷을 기대합니다:

```typescript
// 에러 시 응답
{
  "detail": "에러 메시지",
  "error_code": "LLM_ERROR",  // 선택
  "timestamp": "2025-11-22T..."  // 선택
}
```

현재 Backend 에러 응답이 이 포맷과 일치하는지 확인 부탁드립니다.

### 3. 추가 요청 (P2 - 다음 주)

#### 3.1 Health Check 엔드포인트
Provider 상태 확인을 위한 엔드포인트:

```bash
GET http://100.123.51.5:8000/api/v1/llm/health

# 기대 응답
{
  "providers": {
    "openai": { "status": "healthy", "model": "gpt-4o-mini" },
    "anthropic": { "status": "healthy", "model": "claude-3-5-haiku" },
    "ollama": { "status": "healthy", "model": "qwen2.5:7b" },
    "gemini": { "status": "unhealthy", "error": "API key invalid" }
  }
}
```

#### 3.2 스트리밍 응답 (선택)
긴 텍스트 생성 시 스트리밍 지원 여부:

```typescript
// Frontend에서 처리 가능
fetch('/api/v1/agents/execute', {
  body: JSON.stringify({
    agent: 'copywriter',
    task: 'product_detail',
    payload: { user_input: '...' },
    stream: true  // 스트리밍 활성화
  })
})
```

---

## 📊 테스트 시나리오

B팀에서 다음 시나리오 테스트 부탁드립니다:

### Scenario 1: 간단한 채팅
```json
POST /api/v1/agents/execute
{
  "agent": "copywriter",
  "task": "chat",
  "payload": {
    "user_input": "안녕하세요"
  }
}
```

### Scenario 2: 제품 설명 생성
```json
POST /api/v1/agents/execute
{
  "agent": "copywriter",
  "task": "product_detail",
  "payload": {
    "user_input": "프리미엄 핸드크림 상세 설명을 작성해주세요"
  }
}
```

### Scenario 3: 대화 히스토리 포함
```json
POST /api/v1/agents/execute
{
  "agent": "copywriter",
  "task": "chat",
  "payload": {
    "user_input": "더 자세히 설명해주세요",
    "messages": [
      { "role": "user", "content": "핸드크림 헤드라인 생성해줘" },
      { "role": "assistant", "content": "당신의 손끝에 피어나는 자연의 향기" }
    ]
  }
}
```

### Scenario 4: 이미지 생성 (Designer Agent)
```json
POST /api/v1/agents/execute
{
  "agent": "designer",
  "task": "image_generate",
  "payload": {
    "prompt": "프리미엄 핸드크림 제품 이미지"
  }
}
```

---

## 🔍 Frontend에서 확인 가능한 정보

### 1. 현재 Frontend 설정
```typescript
// .env.local
NEXT_PUBLIC_API_URL=http://100.123.51.5:8000

// lib/llm-gateway-client.ts
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.123.51.5:8000';
const API_BASE = `${BACKEND_API_URL}/api/v1`;
```

### 2. 실제 요청 코드
```typescript
// lib/llm-gateway-client.ts
export async function sendChatMessage(params: {
  userInput: string;
  messageHistory?: Message[];
  agent?: string;
  task?: string;
}): Promise<{ content: string; usage?: any }> {
  const agent = params.agent || 'copywriter';
  const task = params.task || 'chat';

  const response = await defaultClient.executeAgent({
    agent,
    task,
    payload: {
      user_input: params.userInput,
      messages: params.messageHistory,
    },
  });

  return {
    content: response.outputs[0]?.value || '',
    usage: response.usage,
  };
}
```

### 3. Frontend Role → Backend Agent 매핑
```typescript
// useChatStore.ts
const agentMap: Record<AgentRole, string> = {
  copywriter: 'copywriter',
  strategist: 'copywriter',  // 통합
  brief: 'copywriter',
  reviewer: 'reviewer',
  optimizer: 'copywriter',
  editor: 'copywriter',
  vision: 'designer',
  custom: 'copywriter',
};
```

---

## 📞 연락처 및 회신 방법

### 회신 항목 체크리스트
다음 항목들에 대해 회신 부탁드립니다:

- [ ] **CORS 설정 완료 여부**
  - [ ] `http://localhost:3000` 허용
  - [ ] 테스트 완료

- [ ] **`/api/v1/agents/execute` 엔드포인트 상태**
  - [ ] 정상 동작 확인
  - [ ] 테스트 결과 공유

- [ ] **인증 방식**
  - [ ] API Key 사용 (개발)
  - [ ] JWT Token 사용 (프로덕션)
  - [ ] 현재 미사용

- [ ] **Agent/Task 지원 매핑**
  - 위 테이블 작성

- [ ] **에러 응답 포맷 일치 여부**
  - [ ] 일치함
  - [ ] 수정 필요 (세부사항 기재)

### 커뮤니케이션 채널
- **Slack**: #backend-support 또는 #frontend-backend-sync
- **이메일**: dev-support@sparklio.ai
- **긴급**: 직접 미팅 요청

---

## 📚 참고 자료

### Frontend 문서
1. [LLM_INTEGRATION_REDESIGN_2025-11-22.md](./LLM_INTEGRATION_REDESIGN_2025-11-22.md) - 재설계 상세 보고서
2. [lib/llm-gateway-client.ts](../lib/llm-gateway-client.ts) - Gateway 클라이언트 구현

### Backend 문서 (B팀 제공)
1. `backend/docs/LLM_INTEGRATION_GUIDE.md` - 통합 가이드
2. `backend/app/services/llm/gateway.py` - Gateway 구현
3. `backend/B_TEAM_PROMPT_ENHANCEMENT_2025-11-22.md` - Agent 프롬프트

---

## ⏰ 일정

| 항목 | 희망 완료일 | 우선순위 |
|------|------------|----------|
| CORS 설정 | 2025-11-22 (금일) | P0 🔴 |
| 엔드포인트 테스트 | 2025-11-22 (금일) | P0 🔴 |
| 인증 방식 확인 | 2025-11-25 (월) | P1 🟡 |
| Agent/Task 매핑 | 2025-11-25 (월) | P1 🟡 |
| Health Check | 2025-11-29 (금) | P2 🟢 |
| 스트리밍 지원 | 2025-12-06 (금) | P2 🟢 |

---

## 🙏 감사 인사

B팀에서 작성해주신 `LLM_INTEGRATION_GUIDE.md` 덕분에 Frontend 통합을 성공적으로 완료할 수 있었습니다. 문서가 매우 명확하고 상세했습니다!

앞으로도 잘 부탁드립니다. 🚀

---

**마지막 업데이트**: 2025-11-22
**문서 버전**: 1.0.0
**작성자**: C팀 (Frontend Team)
