# LLM Gateway 통합 가이드 (C팀용)

> **작성일**: 2025-11-22
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
- ✅ **통합 인터페이스**: 모든 모델을 동일한 API로 호출
- ✅ **자동 라우팅**: 작업 유형에 따라 최적의 모델 자동 선택
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
| `/llm/generate` | POST | 텍스트 생성 (통합) |
| `/llm/chat` | POST | 대화형 생성 |
| `/llm/providers` | GET | 사용 가능한 Provider 목록 |
| `/llm/models` | GET | 사용 가능한 모델 목록 |
| `/agents/execute` | POST | Agent 실행 (추천) |

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

### 1. 간단한 텍스트 생성

```typescript
// API 호출 함수
async function generateText(prompt: string) {
  const response = await fetch('http://localhost:8000/api/v1/llm/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      prompt: prompt,
      model: 'gpt-4',  // 선택사항: 생략 시 자동 선택
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  const data = await response.json();
  return data.content;  // 생성된 텍스트
}

// 사용 예시
const result = await generateText('마케팅 캠페인 아이디어를 3가지 제안해주세요');
console.log(result);
```

### 2. 대화형 채팅 (컨텍스트 유지)

```typescript
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

async function chat(messages: Message[]) {
  const response = await fetch('http://localhost:8000/api/v1/llm/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      messages: messages,
      model: 'gpt-4-turbo',
      stream: false  // true로 설정 시 스트리밍 응답
    })
  });

  const data = await response.json();
  return data.content;
}

// 사용 예시
const conversation: Message[] = [
  { role: 'system', content: '당신은 마케팅 전문가입니다.' },
  { role: 'user', content: '신제품 런칭 전략을 세워주세요' },
  { role: 'assistant', content: '네, 다음 3단계 전략을 제안드립니다...' },
  { role: 'user', content: '1단계를 더 자세히 설명해주세요' }
];

const reply = await chat(conversation);
```

### 3. 스트리밍 응답 (실시간 출력)

```typescript
async function streamGenerate(prompt: string) {
  const response = await fetch('http://localhost:8000/api/v1/llm/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      prompt: prompt,
      stream: true
    })
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim() !== '');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        console.log(data.content);  // 실시간으로 출력
      }
    }
  }
}
```

---

## Agent 시스템 활용

Agent는 특정 작업(카피라이팅, 디자인, 검수 등)에 최적화된 AI 워크플로우입니다.

### 사용 가능한 Agent 목록

| Agent | 설명 | 주요 Task |
|-------|------|----------|
| `copywriter` | 광고 카피 생성 | `generate_headline`, `generate_body` |
| `designer` | 디자인 제안 | `suggest_layout`, `generate_image` |
| `reviewer` | 콘텐츠 검수 | `review_content`, `check_brand_fit` |
| `rag` | 지식 기반 검색 | `search_knowledge`, `generate_with_context` |
| `trend_collector` | 트렌드 분석 | `collect_trends`, `analyze_market` |

### Agent 호출 방법

```typescript
interface AgentRequest {
  agent: string;      // Agent 이름
  task: string;       // 수행할 작업
  payload: any;       // 작업별 입력 데이터
}

interface AgentOutput {
  type: 'text' | 'json' | 'image' | 'video' | 'audio';
  name: string;       // 출력물 이름 (예: 'headline', 'body')
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

// API 호출
async function executeAgent(request: AgentRequest): Promise<AgentResponse> {
  const response = await fetch('http://localhost:8000/api/v1/agents/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify(request)
  });

  return await response.json();
}
```

### 실전 예제: 카피라이팅 Agent

```typescript
// 1. 헤드라인 생성
const headlineRequest: AgentRequest = {
  agent: 'copywriter',
  task: 'generate_headline',
  payload: {
    product_name: '프리미엄 핸드크림',
    target_audience: '20-30대 여성',
    tone: 'elegant',
    count: 5  // 5개의 옵션 생성
  }
};

const headlineResponse = await executeAgent(headlineRequest);

// 결과 추출
const headlines = headlineResponse.outputs
  .filter(output => output.type === 'text')
  .map(output => output.value);

console.log(headlines);
// [
//   "당신의 손끝에 피어나는 자연의 향기",
//   "하루를 마무리하는 작은 사치",
//   "건조함 없는 매일, 촉촉함의 시작",
//   ...
// ]

// 2. 본문 생성
const bodyRequest: AgentRequest = {
  agent: 'copywriter',
  task: 'generate_body',
  payload: {
    headline: headlines[0],  // 선택한 헤드라인
    product_description: '천연 시어버터와 비타민E가 함유된...',
    max_length: 200
  }
};

const bodyResponse = await executeAgent(bodyRequest);
const bodyText = bodyResponse.outputs[0].value;
```

### 실전 예제: RAG Agent (브랜드 가이드 기반)

```typescript
// 브랜드 가이드라인을 참고한 카피 생성
const ragRequest: AgentRequest = {
  agent: 'rag',
  task: 'generate_with_context',
  payload: {
    prompt: '신제품 핸드크림 광고 카피를 작성해주세요',
    context_query: 'brand voice and tone guidelines',
    brand_id: 'brand_123',  // 브랜드 ID
    max_context_length: 500
  }
};

const ragResponse = await executeAgent(ragRequest);

// 브랜드 가이드에 맞는 카피가 생성됨
console.log(ragResponse.outputs[0].value);
```

### 실전 예제: Reviewer Agent (품질 검수)

```typescript
// 생성된 카피 검수
const reviewRequest: AgentRequest = {
  agent: 'reviewer',
  task: 'review_content',
  payload: {
    content: {
      headline: "당신의 손끝에 피어나는 자연의 향기",
      body: "천연 시어버터와 비타민E가..."
    },
    brand_id: 'brand_123',
    criteria: ['brand_consistency', 'grammar', 'tone']
  }
};

const reviewResponse = await executeAgent(reviewRequest);

// 검수 결과
const review = reviewResponse.outputs[0].value;
console.log(review);
// {
//   "overall_score": 8.5,
//   "brand_consistency": { "score": 9, "feedback": "브랜드 톤앤매너와 잘 맞음" },
//   "grammar": { "score": 10, "feedback": "문법적 오류 없음" },
//   "tone": { "score": 7, "feedback": "좀 더 친근한 어조 권장" },
//   "suggestions": ["~입니다 → ~해요 형태로 변경 권장"]
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
| 429 | `RATE_LIMIT_EXCEEDED` | 요청 제한 초과 | 재시도 대기 |
| 500 | `LLM_ERROR` | LLM Provider 에러 | 재시도 또는 다른 모델 사용 |
| 503 | `SERVICE_UNAVAILABLE` | 서비스 일시 중단 | 잠시 후 재시도 |

### 에러 처리 Best Practice

```typescript
async function safeExecuteAgent(request: AgentRequest): Promise<AgentResponse | null> {
  try {
    const response = await fetch('http://localhost:8000/api/v1/agents/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json();

      // 에러 타입별 처리
      if (response.status === 429) {
        // Rate limit - 1초 대기 후 재시도
        await new Promise(resolve => setTimeout(resolve, 1000));
        return safeExecuteAgent(request);
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

### React 컴포넌트 예제

```typescript
import React, { useState } from 'react';

interface CopywriterProps {
  brandId: string;
  userToken: string;
}

export const CopywriterComponent: React.FC<CopywriterProps> = ({ brandId, userToken }) => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateCopy = async () => {
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/agents/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          agent: 'copywriter',
          task: 'generate_headline',
          payload: {
            prompt: prompt,
            brand_id: brandId,
            count: 3
          }
        })
      });

      const data = await response.json();

      // 첫 번째 결과 사용
      if (data.outputs && data.outputs.length > 0) {
        setResult(data.outputs[0].value);
      }

    } catch (error) {
      console.error('Error generating copy:', error);
      alert('카피 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="제품 설명을 입력하세요..."
        rows={5}
        style={{ width: '100%' }}
      />

      <button onClick={generateCopy} disabled={loading}>
        {loading ? '생성 중...' : '카피 생성'}
      </button>

      {result && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h3>생성된 카피:</h3>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
};
```

### TypeScript SDK (권장)

```typescript
// llm-client.ts
export class LLMClient {
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

  async executeAgent(request: AgentRequest): Promise<AgentResponse> {
    return this.request<AgentResponse>('/agents/execute', request);
  }

  async generateText(prompt: string, options?: any): Promise<string> {
    const result = await this.request<any>('/llm/generate', {
      prompt,
      ...options
    });
    return result.content;
  }

  async chat(messages: Message[]): Promise<string> {
    const result = await this.request<any>('/llm/chat', { messages });
    return result.content;
  }
}

// 사용 예시
const client = new LLMClient('http://localhost:8000/api/v1', userToken);

const response = await client.executeAgent({
  agent: 'copywriter',
  task: 'generate_headline',
  payload: { product_name: '핸드크림' }
});
```

---

## FAQ

### Q1. 어떤 모델을 사용해야 하나요?

**A**: 대부분의 경우 `model` 파라미터를 생략하면 시스템이 자동으로 최적의 모델을 선택합니다. 특정 모델이 필요한 경우:

- **텍스트 생성**: `gpt-4-turbo` (고품질) 또는 `gpt-3.5-turbo` (빠른 응답)
- **대화**: `claude-3-opus` (긴 컨텍스트) 또는 `gpt-4`
- **코드 생성**: `gpt-4` 또는 `claude-3-sonnet`

### Q2. Agent vs LLM 직접 호출, 무엇을 사용해야 하나요?

**A**:
- **Agent 사용 권장**: 카피라이팅, 디자인 제안, 콘텐츠 검수 등 정형화된 작업
- **LLM 직접 호출**: 자유로운 텍스트 생성, 커스텀 프롬프트

### Q3. 스트리밍은 언제 사용하나요?

**A**: 긴 텍스트 생성 시 사용자 경험 향상을 위해 사용합니다. 예: 블로그 포스트, 긴 설명문

### Q4. 토큰 사용량을 어떻게 확인하나요?

**A**: `AgentResponse.usage` 필드에서 확인 가능:
```typescript
const response = await client.executeAgent(request);
console.log(`사용 토큰: ${response.usage.tokens}, 비용: $${response.usage.cost}`);
```

### Q5. 여러 브랜드를 관리하는 경우?

**A**: `payload`에 `brand_id`를 포함하여 브랜드별 가이드라인 적용:
```typescript
{
  agent: 'copywriter',
  task: 'generate_headline',
  payload: {
    brand_id: 'brand_123',  // 브랜드 ID
    ...
  }
}
```

---

## 지원

### 문의처

- **백엔드 API 문제**: Slack #backend-support
- **Agent 동작 이슈**: Slack #ai-agents
- **긴급 장애**: [이메일] dev-support@sparklio.ai

### 추가 리소스

- [API 문서 (Swagger)](http://localhost:8000/docs)
- [Agent 전체 목록](http://localhost:8000/api/v1/agents/list)
- [모델 성능 비교표](../docs/MODEL_COMPARISON.md)

---

**마지막 업데이트**: 2025-11-22
**문서 버전**: 1.0.0
