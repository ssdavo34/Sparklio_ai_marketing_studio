# LLM Gateway 통합 가이드 (C팀용)

> **작성일**: 2025-11-22 (v2.0 - API 엔드포인트 수정)
> **대상**: Sparklio AI Editor 프론트엔드 개발팀 (C팀)
> **목적**: LLM Gateway API를 활용한 AI 기능 구현 가이드

---

## 📋 목차

1. [개요](#개요)
2. [API 엔드포인트](#api-엔드포인트)
3. [인증 방식](#인증-방식)
4. [기본 사용법](#기본-사용법)
5. [Agent 시스템 활용](#agent-시스템-활용)
6. [에러 처리](#에러-처리)
7. [예제 코드](#예제-코드)
8. [FAQ](#faq)

---

## 개요

Sparklio AI Marketing Studio의 LLM Gateway는 다양한 AI 모델(OpenAI, Anthropic, Gemini 등)을 통합하여 제공하는 중앙 관리 시스템입니다.

### 주요 특징

- ✅ **Multi-Provider 지원**: OpenAI, Anthropic Claude, Google Gemini, Ollama
- ✅ **21개 Agent**: Creation (10개), Intelligence (7개), System (4개)
- ✅ **통합 인터페이스**: 모든 Agent를 동일한 API로 호출
- ✅ **에러 핸들링**: 자동 재시도 및 폴백 처리
- ✅ **사용량 추적**: 토큰 사용량 및 비용 모니터링

---

## API 엔드포인트

### Base URL

```
http://localhost:8000/api/v1
```

### 주요 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/agents/{agent_name}/execute` | POST | Agent 실행 (권장) ✅ |
| `/llm/generate` | POST | LLM Gateway 직접 호출 |
| `/llm/chat` | POST | 대화형 생성 |
| `/health` | GET | 서버 상태 확인 |

**중요**: Agent 호출은 **반드시** `/agents/{agent_name}/execute` 형식을 사용하세요.

---

## 인증 방식

### 1. API Key 방식 (개발/테스트)

```typescript
const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': 'your-api-key-here'  // 백엔드 팀에서 발급
};
```

### 2. JWT 토큰 방식 (프로덕션)

```typescript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${userToken}`  // 로그인 후 받은 JWT
};
```

---

## 기본 사용법

### 1. LLM Gateway 직접 호출

```typescript
// API 호출 함수
async function generateText(role: string, task: string, payload: any) {
  const response = await fetch('http://localhost:8000/api/v1/llm/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      role: role,        // Agent 역할 (copywriter, strategist 등)
      task: task,        // 작업 유형 (product_detail, sns 등)
      payload: payload,  // 입력 데이터
      mode: 'json'       // 출력 모드 (json | text)
    })
  });

  const data = await response.json();
  return data;
}

// 사용 예시
const result = await generateText('copywriter', 'product_detail', {
  product_name: '무선 이어폰',
  features: ['노이즈캔슬링', '24시간 배터리'],
  target_audience: '20-30대'
});
```

### 2. Agent 별 실행 (권장 방식) ✅

```typescript
// Copywriter Agent 호출
async function executeCopywriter(task: string, payload: any) {
  const response = await fetch('http://localhost:8000/api/v1/agents/copywriter/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      task: task,
      payload: payload
    })
  });

  return await response.json();
}

// 사용 예시
const result = await executeCopywriter('generate_ad_copy', {
  product_name: '스마트 워치',
  target_audience: '20-30대 직장인',
  platform: 'instagram',
  tone: 'friendly'
});
```

---

## Agent 시스템 활용

### 사용 가능한 Agent 목록 (21개)

#### Creation Agents (10개)
| Agent | 설명 | 엔드포인트 |
|-------|------|-----------|
| `copywriter` | 텍스트 콘텐츠 생성 | `/agents/copywriter/execute` |
| `strategist` | 마케팅 전략 수립 | `/agents/strategist/execute` |
| `designer` | 비주얼 콘텐츠 생성 | `/agents/designer/execute` |
| `reviewer` | 콘텐츠 품질 검토 | `/agents/reviewer/execute` |
| `optimizer` | 콘텐츠 최적화 | `/agents/optimizer/execute` |
| `editor` | 콘텐츠 편집/교정 | `/agents/editor/execute` |
| `meeting_ai` | 회의록 분석 | `/agents/meeting_ai/execute` |
| `vision_analyzer` | 이미지 분석 | `/agents/vision_analyzer/execute` |
| `scene_planner` | 영상 씬 구성 | `/agents/scene_planner/execute` |
| `template` | 템플릿 자동 생성 | `/agents/template/execute` |

#### Intelligence Agents (7개)
| Agent | 설명 | 엔드포인트 |
|-------|------|-----------|
| `trend_collector` | 트렌드 분석 | `/agents/trend_collector/execute` |
| `data_cleaner` | 데이터 정제 | `/agents/data_cleaner/execute` |
| `embedder` | 텍스트/이미지 임베딩 | `/agents/embedder/execute` |
| `rag` | 지식 기반 검색/생성 | `/agents/rag/execute` |
| `ingestor` | 데이터 수집 | `/agents/ingestor/execute` |
| `performance_analyzer` | 성과 분석 | `/agents/performance_analyzer/execute` |
| `self_learning` | 자가 학습 | `/agents/self_learning/execute` |

#### System Agents (4개)
| Agent | 설명 | 엔드포인트 |
|-------|------|-----------|
| `pm` | 워크플로우 조율 | `/agents/pm/execute` |
| `qa` | 품질 검증 | `/agents/qa/execute` |
| `error_handler` | 에러 감지/복구 | `/agents/error_handler/execute` |
| `logger` | 로깅/모니터링 | `/agents/logger/execute` |

### Agent 응답 구조

```typescript
interface AgentOutput {
  type: 'text' | 'json' | 'image' | 'video' | 'audio';
  name: string;       // 출력물 이름 (예: 'result', 'headline')
  value: any;         // 실제 데이터
  meta?: any;         // 메타데이터
}

interface AgentResponse {
  agent: string;      // 실행된 Agent 이름
  task: string;       // 수행된 작업
  outputs: AgentOutput[];  // 생성된 결과물 목록
  usage: {            // 리소스 사용량
    tokens?: number;
    cost?: number;
  };
  meta: any;          // 메타데이터
  timestamp: string;
}
```

### 실전 예제 1: Copywriter Agent

```typescript
// 광고 카피 생성
const response = await fetch('http://localhost:8000/api/v1/agents/copywriter/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    task: 'generate_ad_copy',
    payload: {
      product_name: '프리미엄 핸드크림',
      target_audience: '20-30대 여성',
      platform: 'instagram',
      tone: 'elegant',
      max_length: 150
    }
  })
});

const data: AgentResponse = await response.json();

// 결과 추출
const adCopy = data.outputs[0].value;
console.log(adCopy);
// "당신의 손끝에 피어나는 자연의 향기 ✨..."
```

### 실전 예제 2: RAG Agent (브랜드 가이드 기반 생성)

```typescript
// 1단계: 브랜드 문서 인덱싱
await fetch('http://localhost:8000/api/v1/agents/rag/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    task: 'index_document',
    payload: {
      documents: [
        {
          id: 'brand_guide_001',
          content: '우리 브랜드는 친환경과 지속가능성을 핵심 가치로...',
          metadata: { type: 'brand_guideline', brand_id: 'brand_123' }
        }
      ],
      chunk_size: 500
    }
  })
});

// 2단계: 브랜드 가이드 기반 콘텐츠 생성
const response = await fetch('http://localhost:8000/api/v1/agents/rag/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    task: 'generate_with_context',
    payload: {
      prompt: '신제품 핸드크림 광고 카피를 작성해주세요',
      context_query: 'brand values and tone',
      brand_id: 'brand_123',
      max_context_length: 500
    }
  })
});

const data: AgentResponse = await response.json();
const generatedCopy = data.outputs[0].value.generated_text;
console.log(generatedCopy);
// 브랜드 가이드에 맞는 카피가 생성됨
```

### 실전 예제 3: Reviewer Agent (품질 검수)

```typescript
const response = await fetch('http://localhost:8000/api/v1/agents/reviewer/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    task: 'review_content',
    payload: {
      content: {
        headline: "당신의 손끝에 피어나는 자연의 향기",
        body: "천연 시어버터와 비타민E가..."
      },
      brand_id: 'brand_123',
      criteria: ['brand_consistency', 'grammar', 'tone']
    }
  })
});

const data: AgentResponse = await response.json();
const review = data.outputs[0].value;

console.log(review);
// {
//   "overall_score": 8.5,
//   "brand_consistency": { "score": 9, "feedback": "브랜드 톤앤매너와 잘 맞음" },
//   "grammar": { "score": 10, "feedback": "문법적 오류 없음" },
//   "tone": { "score": 7, "feedback": "좀 더 친근한 어조 권장" },
//   "suggestions": ["~입니다 → ~해요 형태로 변경 권장"]
// }
```

### 실전 예제 4: Trend Collector Agent

```typescript
const response = await fetch('http://localhost:8000/api/v1/agents/trend_collector/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    task: 'collect_trends',
    payload: {
      keywords: ['핸드크림', '스킨케어'],
      platform: 'instagram',
      period: '7d',
      count: 10
    }
  })
});

const data: AgentResponse = await response.json();
const trends = data.outputs[0].value;

console.log(trends);
// {
//   "trends": [
//     { "keyword": "시어버터", "score": 8.5, "growth": "+25%" },
//     { "keyword": "비건뷰티", "score": 9.2, "growth": "+40%" }
//   ]
// }
```

---

## 에러 처리

### 표준 에러 응답 형식

```typescript
interface ErrorResponse {
  detail: string;           // 에러 메시지
  error_code?: string;      // 에러 코드 (선택)
  timestamp?: string;       // 발생 시각
}
```

### 주요 에러 코드

| HTTP Status | Error Code | 설명 | 해결 방법 |
|-------------|------------|------|-----------|
| 400 | `INVALID_REQUEST` | 잘못된 요청 형식 | 요청 페이로드 확인 |
| 401 | `UNAUTHORIZED` | 인증 실패 | 토큰 유효성 확인 |
| 404 | `AGENT_NOT_FOUND` | Agent 이름 오류 | Agent 이름 확인 |
| 429 | `RATE_LIMIT_EXCEEDED` | 요청 제한 초과 | 재시도 대기 |
| 500 | `LLM_ERROR` | LLM Provider 에러 | 재시도 또는 다른 모델 사용 |
| 503 | `SERVICE_UNAVAILABLE` | 서비스 일시 중단 | 잠시 후 재시도 |

### 에러 처리 Best Practice

```typescript
async function safeExecuteAgent(
  agentName: string,
  task: string,
  payload: any
): Promise<AgentResponse | null> {
  try {
    const response = await fetch(
      `http://localhost:8000/api/v1/agents/${agentName}/execute`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ task, payload })
      }
    );

    if (!response.ok) {
      const error: ErrorResponse = await response.json();

      // 에러 타입별 처리
      if (response.status === 429) {
        // Rate limit - 1초 대기 후 재시도
        await new Promise(resolve => setTimeout(resolve, 1000));
        return safeExecuteAgent(agentName, task, payload);
      } else if (response.status === 500) {
        // Server error - 폴백 처리
        console.error('LLM Error:', error.detail);
        return null;
      } else {
        throw new Error(error.detail);
      }
    }

    return await response.json();

  } catch (error) {
    console.error('Agent execution failed:', error);
    return null;
  }
}
```

---

## 예제 코드

### TypeScript SDK (권장)

```typescript
// llm-client.ts
export class SparkLioAIClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string = 'http://localhost:8000/api/v1', token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Request failed');
    }

    return await response.json();
  }

  /**
   * Agent 실행
   */
  async executeAgent(
    agentName: string,
    task: string,
    payload: any
  ): Promise<AgentResponse> {
    return this.request<AgentResponse>(
      `/agents/${agentName}/execute`,
      { task, payload }
    );
  }

  /**
   * LLM Gateway 직접 호출
   */
  async generateWithLLM(
    role: string,
    task: string,
    payload: any
  ): Promise<any> {
    return this.request<any>('/llm/generate', { role, task, payload, mode: 'json' });
  }
}

// 사용 예시
const client = new SparkLioAIClient('http://localhost:8000/api/v1', userToken);

// Copywriter Agent 호출
const response = await client.executeAgent('copywriter', 'generate_ad_copy', {
  product_name: '스마트 워치',
  target_audience: '20-30대'
});

console.log(response.outputs[0].value);
```

### React Hook 예제

```typescript
// hooks/useSparkLioAI.ts
import { useState } from 'react';
import { SparkLioAIClient } from '@/lib/llm-client';

export function useSparkLioAI(token: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = new SparkLioAIClient(
    process.env.NEXT_PUBLIC_API_URL,
    token
  );

  const executeAgent = async (
    agentName: string,
    task: string,
    payload: any
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.executeAgent(agentName, task, payload);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { executeAgent, loading, error };
}

// 사용 예시
function CopywriterComponent() {
  const { executeAgent, loading, error } = useSparkLioAI(userToken);
  const [result, setResult] = useState<string | null>(null);

  const generate = async () => {
    const response = await executeAgent('copywriter', 'generate_ad_copy', {
      product_name: '핸드크림',
      target_audience: '20-30대 여성',
      tone: 'elegant'
    });

    setResult(response.outputs[0].value);
  };

  return (
    <div>
      <button onClick={generate} disabled={loading}>
        {loading ? '생성 중...' : '광고 카피 생성'}
      </button>
      {error && <p style={{ color: 'red' }}>에러: {error}</p>}
      {result && <p>{result}</p>}
    </div>
  );
}
```

---

## FAQ

### Q1. 어떤 Agent를 사용해야 하나요?

**A**: 작업 유형에 따라 선택하세요:

- **텍스트 생성**: `copywriter`
- **마케팅 전략**: `strategist`
- **이미지 제안**: `designer`
- **콘텐츠 검수**: `reviewer`
- **브랜드 가이드 기반 생성**: `rag`
- **트렌드 분석**: `trend_collector`

### Q2. Agent와 LLM Gateway의 차이는?

**A**:
- **Agent** (`/agents/{name}/execute`): 특정 작업에 최적화된 워크플로우
- **LLM Gateway** (`/llm/generate`): 범용 LLM 호출

대부분의 경우 **Agent 사용을 권장**합니다.

### Q3. 토큰 사용량을 어떻게 확인하나요?

**A**: `AgentResponse.usage` 필드에서 확인 가능:
```typescript
const response = await client.executeAgent('copywriter', 'generate_ad_copy', {...});
console.log(`사용 토큰: ${response.usage.tokens}, 비용: $${response.usage.cost}`);
```

### Q4. 여러 브랜드를 관리하는 경우?

**A**: `payload`에 `brand_id`를 포함:
```typescript
await client.executeAgent('copywriter', 'generate_ad_copy', {
  brand_id: 'brand_123',
  product_name: '핸드크림',
  ...
});
```

### Q5. Mock vs Live 모드?

**A**:
- **Mock 모드**: 빠른 테스트용 (5초 이내), 실제 LLM 호출 없음
- **Live 모드**: 실제 LLM API 호출 (환경 변수 `GENERATOR_MODE=live`)

---

## 지원

### 문의처

- **백엔드 API 문제**: Slack #backend-support
- **Agent 동작 이슈**: Slack #ai-agents
- **긴급 장애**: dev-support@sparklio.ai

### 추가 리소스

- [API 문서 (Swagger)](http://localhost:8000/docs)
- [Backend Canvas 스펙](./BACKEND_CANVAS_SPEC_V2.md)
- [C팀 협업 요청서](./C_TEAM_COLLABORATION_REQUEST_2025-11-22.md)

---

**마지막 업데이트**: 2025-11-22 (v2.0)
**문서 버전**: 2.0.0
**변경사항**: API 엔드포인트를 `/agents/{agent_name}/execute` 형식으로 수정
