# LLM 통합 시스템 재설계 보고서

> **작성일**: 2025-11-22
> **작성자**: C팀 (Frontend Team)
> **목적**: Backend Gateway 기반 LLM 통합으로 전환

---

## 📋 Executive Summary

이전 세션에서 구현된 Multi-LLM 시스템은 **Sparklio의 실제 아키텍처와 불일치**하는 문제가 있었습니다.

### 문제점
1. **Provider 직접 선택 UI** - Frontend에서 OpenAI/Anthropic/Gemini를 직접 선택
2. **Frontend API Routes** - `/api/chat`, `/api/chat/image` 등 독립적인 frontend routes
3. **Backend Gateway 미활용** - Backend의 Agent 시스템과 Smart Router 미사용

### 해결책
B팀의 LLM Integration Guide(`backend/docs/LLM_INTEGRATION_GUIDE.md`)를 기반으로 **Agent 기반 시스템**으로 전환:
- Agent Role + Task 선택 방식 (예: Copywriter + generate_headline)
- Backend의 `/api/v1/agents/execute` 엔드포인트 활용
- Smart Router가 자동으로 최적의 Provider/Model 선택

---

## 🏗️ 아키텍처 변경

### 이전 (INCORRECT)
```
User → UI (Provider 선택) → Frontend /api/chat → LLM Providers
```

**문제점**:
- Frontend가 Provider 선택 책임
- Backend Gateway 우회
- Smart Router 미사용

### 현재 (CORRECT)
```
User → UI (Role/Task 선택) → Backend /api/v1/agents/execute → Smart Router → LLM Providers
```

**장점**:
- Frontend는 Role/Task만 지정
- Backend Gateway가 모든 LLM 요청 처리
- Smart Router가 최적 Provider/Model 자동 선택
- 일관된 에러 처리 및 재시도

---

## 📂 변경된 파일

### 1. 삭제된 파일

| 파일 | 사유 |
|------|------|
| `app/api/chat/route.ts` | Frontend에서 LLM 직접 호출 - Backend Gateway 사용으로 대체 |
| `app/api/chat/image/route.ts` | Frontend 이미지 생성 API - Designer Agent로 대체 |

### 2. 완전히 재작성된 파일

#### `lib/llm-gateway-client.ts` (v4.1)
**변경 내용**:
- Agent 기반 API (`/agents/execute`) 사용
- LLMClient 클래스 구현 (B팀 SDK 패턴)
- Convenience functions 추가:
  - `generateHeadline()` - Copywriter Agent
  - `generateBodyCopy()` - Copywriter Agent
  - `reviewContent()` - Reviewer Agent
  - `generateWithContext()` - RAG Agent
  - `generateImage()` - Designer Agent

**참조**: `backend/docs/LLM_INTEGRATION_GUIDE.md`

#### `components/canvas-studio/stores/types/llm.ts` (v4.0)
**변경 내용**:
- Provider types 삭제 (TextLLMProvider, ImageLLMProvider)
- Agent Role types 추가:
  ```typescript
  export type AgentRole =
    | 'brief'
    | 'strategist'
    | 'copywriter'
    | 'reviewer'
    | 'optimizer'
    | 'editor'
    | 'vision'
    | 'custom';
  ```
- Task types 추가:
  ```typescript
  export type TaskType =
    | 'marketing_brief'
    | 'product_detail'
    | 'sns'
    | 'brand_message'
    | 'content_plan'
    | 'headline'
    | 'ad_copy'
    | 'review'
    | 'optimize'
    | 'proofread'
    | 'image_generate'
    | 'image_analyze'
    | 'custom';
  ```
- Cost Mode 추가: `'fast' | 'balanced' | 'quality'`
- Agent/Task metadata 추가 (AGENT_INFO, TASK_INFO)

#### `components/canvas-studio/stores/useChatStore.ts` (v4.1)
**변경 내용**:
- Provider 선택 제거
- Agent 기반 통신으로 변경:
  ```typescript
  // Frontend Role → Backend Agent 매핑
  const agentMap: Record<AgentRole, string> = {
    copywriter: 'copywriter',
    strategist: 'copywriter',
    brief: 'copywriter',
    reviewer: 'reviewer',
    optimizer: 'copywriter',
    editor: 'copywriter',
    vision: 'designer',
    custom: 'copywriter',
  };
  ```
- Message에 agent/task/usage 정보 추가:
  ```typescript
  export interface Message {
    agentUsed?: string;
    taskUsed?: string;
    usage?: { tokens?: number; cost?: number };
  }
  ```

### 3. UI 변경 (TODO - RightDock.tsx)

**예정된 변경 사항**:
```tsx
// 이전 (Provider 선택)
<select value={provider} onChange={...}>
  <option value="openai">OpenAI GPT-4</option>
  <option value="anthropic">Anthropic Claude</option>
  <option value="gemini">Google Gemini</option>
</select>

// 현재 (Role + Task 선택)
<select value={role} onChange={...}>
  <option value="copywriter">Copywriter - 10-year expert</option>
  <option value="strategist">Strategist - 20-year consultant</option>
  <option value="reviewer">Reviewer - Content quality</option>
</select>

<select value={task} onChange={...}>
  <option value="product_detail">Product Description</option>
  <option value="sns">Social Media</option>
  <option value="headline">Headline</option>
</select>

<div className="cost-mode">
  <button>⚡ Fast</button>
  <button>⚖️ Balanced</button>
  <button>✨ Quality</button>
</div>
```

---

## 🔄 Before & After 비교

### 채팅 메시지 전송

#### Before (INCORRECT)
```typescript
// useChatStore.ts
sendMessage: async (content: string) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages: [...],
      provider: textLLMConfig.provider,  // ❌ Frontend가 provider 선택
      config: textLLMConfig,
    }),
  });
};
```

#### After (CORRECT)
```typescript
// useChatStore.ts
sendMessage: async (content: string) => {
  const response = await sendChatMessage({
    userInput: content,
    messageHistory: [...],
    agent: 'copywriter',        // ✅ Agent 지정
    task: 'product_detail',     // ✅ Task 지정
  });
  // Backend Router가 자동으로 최적 provider/model 선택
};
```

### 이미지 생성

#### Before (INCORRECT)
```typescript
generateImage: async (prompt: string) => {
  const response = await fetch('/api/chat/image', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      provider: imageLLMConfig.provider,  // ❌ Provider 직접 선택
      config: imageLLMConfig,
    }),
  });
};
```

#### After (CORRECT)
```typescript
generateImageFromPrompt: async (prompt: string) => {
  const imageUrl = await generateImage({
    prompt,
    // ✅ Designer Agent가 자동으로 처리
    // Backend Router가 DALL-E, Nanobanana, ComfyUI 중 선택
  });
};
```

---

## 🎯 Backend Integration

### API Endpoint
```
POST http://100.123.51.5:8000/api/v1/agents/execute
```

### Request Format
```typescript
{
  "agent": "copywriter",        // Agent 이름
  "task": "generate_headline",  // Task 이름
  "payload": {                  // Task별 입력
    "product_name": "핸드크림",
    "target_audience": "20-30대 여성",
    "tone": "elegant",
    "count": 5
  }
}
```

### Response Format
```typescript
{
  "agent": "copywriter",
  "task": "generate_headline",
  "outputs": [
    {
      "type": "text",
      "name": "headline_1",
      "value": "당신의 손끝에 피어나는 자연의 향기"
    },
    // ... more outputs
  ],
  "usage": {
    "tokens": 245,
    "cost": 0.0012
  },
  "timestamp": "2025-11-22T..."
}
```

---

## 🧪 사용 가능한 Agents (from B팀)

| Agent | 설명 | 주요 Task |
|-------|------|----------|
| `copywriter` | 광고 카피 생성 | `generate_headline`, `generate_body` |
| `designer` | 디자인 제안 | `suggest_layout`, `generate_image` |
| `reviewer` | 콘텐츠 검수 | `review_content`, `check_brand_fit` |
| `rag` | 지식 기반 검색 | `search_knowledge`, `generate_with_context` |
| `trend_collector` | 트렌드 분석 | `collect_trends`, `analyze_market` |

---

## 🚀 다음 단계

### 필수 작업
1. ✅ `lib/llm-gateway-client.ts` - Agent API 클라이언트 구현
2. ✅ `components/canvas-studio/stores/types/llm.ts` - Role/Task types 정의
3. ✅ `components/canvas-studio/stores/useChatStore.ts` - Agent 통합
4. ⏳ `components/canvas-studio/panels/right/RightDock.tsx` - UI 업데이트
5. ⏳ End-to-end 테스트 with real backend

### UI 개선 (선택)
- 각 Agent별 아이콘 추가
- Task 설명 tooltip
- Provider/Model 정보 표시 (agent/model used)
- Token usage 표시

### 문서화
- [x] 이 문서 작성
- [ ] README.md 업데이트
- [ ] API 사용 예제 추가

---

## 📊 영향 받는 기능

### 정상 작동
- ✅ Canvas editor (Polotno 통합)
- ✅ Element inspector
- ✅ Layers 관리
- ✅ 기본 UI/UX

### 업데이트 필요
- 🔄 Chat AI Assistant (Backend Agent 통합)
- 🔄 Image generation (Designer Agent)

### 테스트 필요
- ⏳ Real backend 연결 테스트
- ⏳ Agent/Task 조합별 테스트
- ⏳ 에러 처리 테스트 (rate limit, timeout, etc.)

---

## 🔗 참고 문서

### Backend 문서
- `backend/docs/LLM_INTEGRATION_GUIDE.md` - B팀 통합 가이드 ⭐
- `backend/B_TEAM_PROMPT_ENHANCEMENT_2025-11-22.md` - Agent Prompt 개선
- `backend/LLM_CONNECTION_STATUS_2025-11-20.md` - Provider 상태
- `backend/B_TEAM_LLM_ROUTER_FIX_REPORT_2025-11-20.md` - Router 버그 수정
- `docs/requests/BACKEND_LLM_GATEWAY_WORK_ORDER.md` - Gateway 아키텍처

### Frontend 문서
- 이 문서: `frontend/docs/LLM_INTEGRATION_REDESIGN_2025-11-22.md`

---

## 💡 핵심 교훈

### 1. 항상 Backend 아키텍처 우선 확인
이전 구현은 Backend Gateway가 존재하는지 확인하지 않고 Frontend에서 독립적으로 LLM을 구현했습니다. **반드시 Backend 팀의 아키텍처를 먼저 확인**해야 합니다.

### 2. Provider 선택은 Backend의 책임
Frontend는 "무엇을(What)"만 요청하고, "어떻게(How)"는 Backend Router가 결정합니다.
- Frontend: "카피라이팅(Copywriter) + 헤드라인 생성(headline)"
- Backend: "이 작업엔 GPT-4-turbo가 최적" → 자동 라우팅

### 3. Agent 시스템의 장점
- **일관성**: 모든 LLM 호출이 동일한 패턴
- **유지보수**: Provider 추가/제거가 Frontend에 영향 없음
- **최적화**: Backend가 비용/성능 기준으로 최적 모델 선택

---

**마지막 업데이트**: 2025-11-22
**문서 버전**: 1.0.0
