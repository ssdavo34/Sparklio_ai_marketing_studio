# 🤝 C팀 협업 요청서

**작성일**: 2025-11-22 (v2.0 - API 엔드포인트 수정)
**요청팀**: Backend Team
**대상팀**: C팀 (Frontend Team)
**우선순위**: P0 (즉시) + P1 (이번 주)

---

## 📌 요약

Backend에서 LLM Gateway 및 Agent System API가 준비 완료되었습니다.
Frontend에서 이를 연동하기 위한 협업 요청드립니다.

**주요 변경사항**:
- ✅ 9개 Agent 테스트 39개 모두 통과 (100%)
- ✅ LLM Gateway 멀티 프로바이더 지원 (OpenAI, Anthropic, Gemini, Ollama)
- ✅ 21개 Agent 실행 API 안정화 완료
- ✅ 통합 가이드 문서 작성 완료

**중요**: API 엔드포인트가 `/agents/{agent_name}/execute` 형식입니다!

---

## 🚨 긴급 요청 (P0 - 즉시 확인)

### 1. CORS 설정 확인

**현재 상태 확인 필요**:
```bash
# Backend CORS 설정 (main.py)
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://sparklio.ai"
]
```

**테스트 요청**:
```javascript
// Frontend에서 다음 요청이 가능한지 확인
fetch('http://localhost:8000/api/v1/health', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log('Backend 연결 성공:', data))
.catch(err => console.error('Backend 연결 실패:', err));
```

**회신 체크리스트**:
- [ ] Frontend 포트 번호 확인 (3000? 5173? 기타?)
- [ ] CORS 에러 발생 여부 확인
- [ ] `/api/v1/health` 엔드포인트 호출 성공 여부

---

### 2. Agent 실행 엔드포인트 테스트

**⚠️ 중요**: 엔드포인트 형식이 `/agents/{agent_name}/execute` 입니다!

**올바른 테스트 요청 예시**:
```javascript
// 1. Copywriter Agent 실행 테스트
const testCopywriterAgent = async () => {
  const response = await fetch('http://localhost:8000/api/v1/agents/copywriter/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': 'Bearer YOUR_TOKEN' // 인증 방식 확인 필요
    },
    body: JSON.stringify({
      task: 'generate_ad_copy',
      payload: {
        product_name: '스마트 워치',
        target_audience: '20-30대 직장인',
        platform: 'instagram',
        tone: 'friendly'
      }
    })
  });

  const data = await response.json();
  console.log('Agent 실행 결과:', data);

  // 기대 응답 구조:
  // {
  //   agent: "copywriter",
  //   task: "generate_ad_copy",
  //   outputs: [
  //     {
  //       type: "text",
  //       name: "result",
  //       value: "생성된 광고 카피 내용...",
  //       meta: {}
  //     }
  //   ],
  //   usage: { tokens: 150, cost: 0.0023 },
  //   meta: { ... },
  //   timestamp: "2025-11-22T..."
  // }
};

testCopywriterAgent();
```

**회신 체크리스트**:
- [ ] 엔드포인트 호출 성공 여부
- [ ] 응답 구조가 예상과 일치하는지 확인
- [ ] 에러 발생 시 에러 메시지 공유

---

## 📋 일반 요청 (P1 - 이번 주 내)

### 3. 인증 방식 확인

**현재 지원 가능한 방식**:
1. **JWT Token** (권장)
   ```javascript
   headers: {
     'Authorization': `Bearer ${userToken}`
   }
   ```

2. **API Key** (개발/테스트용)
   ```javascript
   headers: {
     'X-API-Key': 'your-api-key'
   }
   ```

**질문**:
- C팀에서 선호하는 인증 방식은 무엇인가요?
- 현재 사용자 로그인 토큰이 있나요?

**회신 체크리스트**:
- [ ] 선호하는 인증 방식 선택
- [ ] 현재 사용 중인 인증 토큰 형식 공유
- [ ] 토큰 갱신 로직 필요 여부 확인

---

### 4. Agent/Task 매핑 테이블 확인

**사용 가능한 Agent 목록 (21개)**:

#### Creation Agents (10개)
| Agent 이름 | 엔드포인트 | 주요 기능 |
|-----------|-----------|---------|
| `copywriter` | `/agents/copywriter/execute` | 광고 카피 생성 |
| `strategist` | `/agents/strategist/execute` | 마케팅 전략 수립 |
| `designer` | `/agents/designer/execute` | 비주얼 콘텐츠 생성 |
| `reviewer` | `/agents/reviewer/execute` | 콘텐츠 품질 검토 |
| `optimizer` | `/agents/optimizer/execute` | 콘텐츠 최적화 |
| `editor` | `/agents/editor/execute` | 콘텐츠 편집/교정 |
| `meeting_ai` | `/agents/meeting_ai/execute` | 회의록 분석 |
| `vision_analyzer` | `/agents/vision_analyzer/execute` | 이미지 분석 |
| `scene_planner` | `/agents/scene_planner/execute` | 영상 씬 구성 |
| `template` | `/agents/template/execute` | 템플릿 자동 생성 |

#### Intelligence Agents (7개)
| Agent 이름 | 엔드포인트 | 주요 기능 |
|-----------|-----------|---------|
| `trend_collector` | `/agents/trend_collector/execute` | 트렌드 분석 |
| `data_cleaner` | `/agents/data_cleaner/execute` | 데이터 정제 |
| `embedder` | `/agents/embedder/execute` | 임베딩 생성 |
| `rag` | `/agents/rag/execute` | 지식 기반 검색/생성 |
| `ingestor` | `/agents/ingestor/execute` | 데이터 수집 |
| `performance_analyzer` | `/agents/performance_analyzer/execute` | 성과 분석 |
| `self_learning` | `/agents/self_learning/execute` | 자가 학습 |

#### System Agents (4개)
| Agent 이름 | 엔드포인트 | 주요 기능 |
|-----------|-----------|---------|
| `pm` | `/agents/pm/execute` | 워크플로우 조율 |
| `qa` | `/agents/qa/execute` | 품질 검증 |
| `error_handler` | `/agents/error_handler/execute` | 에러 감지/복구 |
| `logger` | `/agents/logger/execute` | 로깅/모니터링 |

**전체 매핑표**: [LLM_INTEGRATION_GUIDE.md](./LLM_INTEGRATION_GUIDE.md#agent-시스템-활용) 참조

**회신 체크리스트**:
- [ ] 우선적으로 필요한 Agent 3개 선택
- [ ] 각 Agent별 필수 payload 필드 확인 요청
- [ ] 추가 필요한 Agent 기능 제안

---

### 5. 에러 응답 포맷 확인

**표준 응답 구조**:
```javascript
// 성공 케이스
{
  agent: "copywriter",
  task: "generate_ad_copy",
  outputs: [
    {
      type: "text",
      name: "result",
      value: "생성된 카피...",
      meta: {}
    }
  ],
  usage: { tokens: 150, cost: 0.0023 },
  meta: {},
  timestamp: "2025-11-22T..."
}

// 에러 케이스 (HTTP 200이지만 outputs에 error)
{
  agent: "copywriter",
  task: "generate_ad_copy",
  outputs: [
    {
      type: "json",
      name: "error",
      value: {
        error: "입력 데이터 검증 실패: ..."
      },
      meta: {}
    }
  ],
  usage: {},
  meta: {},
  timestamp: "..."
}

// HTTP 에러 케이스 (400, 401, 500 등)
{
  detail: "에러 메시지",
  error_code: "INVALID_REQUEST",
  timestamp: "..."
}
```

**HTTP 상태 코드**:
- `200`: 성공 또는 처리 실패 (outputs에 결과/에러 포함)
- `400`: 잘못된 요청
- `401`: 인증 실패
- `404`: Agent 이름 오류
- `500`: 서버 에러

**회신 체크리스트**:
- [ ] 에러 처리 로직 구현 계획 확인
- [ ] 사용자에게 보여줄 에러 메시지 형식 논의
- [ ] Retry 로직 필요 여부 확인

---

## 🧪 테스트 시나리오

### 시나리오 1: Copywriter Agent로 광고 카피 생성

```javascript
const response = await fetch('http://localhost:8000/api/v1/agents/copywriter/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    task: 'generate_ad_copy',
    payload: {
      product_name: '프리미엄 무선 이어폰',
      features: ['노이즈 캔슬링', '24시간 배터리', 'IPX7 방수'],
      target_audience: '20-30대 직장인',
      platform: 'instagram',
      tone: 'professional'
    }
  })
});

const data = await response.json();
console.log('생성된 카피:', data.outputs[0].value);
```

**기대 결과**:
```json
{
  "agent": "copywriter",
  "task": "generate_ad_copy",
  "outputs": [
    {
      "type": "text",
      "name": "result",
      "value": "업무 중에도 몰입을 방해받지 않는 하루, 프리미엄 무선 이어폰과 함께...",
      "meta": {}
    }
  ],
  "usage": { "tokens": 180, "cost": 0.0027 },
  "meta": { "model": "gpt-4", "temperature": 0.7 },
  "timestamp": "2025-11-22T..."
}
```

---

### 시나리오 2: RAG Agent로 브랜드 가이드 기반 생성

```javascript
// 1단계: 브랜드 문서 인덱싱
await fetch('http://localhost:8000/api/v1/agents/rag/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
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
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    task: 'generate_with_context',
    payload: {
      prompt: '신제품 런칭 광고 카피를 작성해주세요',
      context_query: 'brand values',
      brand_id: 'brand_123',
      max_context_length: 500
    }
  })
});

const data = await response.json();
console.log('생성된 카피:', data.outputs[0].value.generated_text);
```

---

### 시나리오 3: Reviewer Agent로 콘텐츠 검수

```javascript
const response = await fetch('http://localhost:8000/api/v1/agents/reviewer/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    task: 'review_content',
    payload: {
      content: {
        headline: "친환경 라이프스타일의 시작",
        body: "우리의 제품은 100% 재활용 소재로..."
      },
      brand_id: 'brand_123',
      criteria: ['brand_consistency', 'grammar', 'tone']
    }
  })
});

const data = await response.json();
console.log('검수 결과:', data.outputs[0].value);
```

---

### 시나리오 4: Trend Collector Agent로 트렌드 분석

```javascript
const response = await fetch('http://localhost:8000/api/v1/agents/trend_collector/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    task: 'collect_trends',
    payload: {
      keywords: ['무선 이어폰', '노이즈 캔슬링'],
      platform: 'instagram',
      period: '7d',
      count: 10
    }
  })
});

const data = await response.json();
console.log('트렌드 분석 결과:', data.outputs[0].value);
```

---

## 📚 참고 문서

### 1. 통합 가이드 (필독)
- **파일**: `backend/docs/LLM_INTEGRATION_GUIDE.md`
- **내용**:
  - API 엔드포인트 전체 목록
  - 인증 방법 상세 설명
  - Agent 시스템 사용 가이드
  - TypeScript SDK 예시 코드
  - React 컴포넌트 예시
  - 에러 처리 Best Practices
  - FAQ

### 2. TypeScript SDK 템플릿

```typescript
// lib/sparklio-ai-client.ts
export class SparkLioAIClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string = 'http://localhost:8000/api/v1', token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async executeAgent(
    agentName: string,
    task: string,
    payload: any
  ): Promise<AgentResponse> {
    const response = await fetch(`${this.baseUrl}/agents/${agentName}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ task, payload })
    });

    if (!response.ok) {
      throw new Error(`Agent execution failed: ${response.statusText}`);
    }

    return await response.json();
  }
}
```

### 3. React Hooks 예시

```typescript
// hooks/useSparkLioAI.ts
import { useState } from 'react';
import { SparkLioAIClient } from '@/lib/sparklio-ai-client';

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
```

---

## ✅ 회신 요청 사항 요약

**P0 (즉시)**:
- [ ] CORS 설정 확인 - Frontend 포트 번호 공유
- [ ] `/api/v1/health` 엔드포인트 호출 테스트 결과
- [ ] `/api/v1/agents/{agent_name}/execute` 테스트 결과 (Copywriter Agent)

**P1 (이번 주)**:
- [ ] 선호하는 인증 방식 결정
- [ ] 우선 연동할 Agent 3개 선택
- [ ] 에러 처리 로직 구현 계획 공유
- [ ] 테스트 시나리오 4개 실행 결과

**선택 사항**:
- [ ] TypeScript 타입 정의 파일 필요 여부
- [ ] SDK 커스터마이징 요청 사항
- [ ] 추가 문서화 필요 항목

---

## 📞 연락처

**질문 및 지원**:
- Slack: `#backend-support` 채널
- Email: backend-team@sparklio.ai
- 담당자: Backend Team

**응급 상황**:
- Backend API 다운 시 즉시 Slack 알림
- 30분 이내 응답 보장

---

## 🎯 다음 단계

1. **P0 항목** 즉시 확인 후 회신
2. **통합 가이드** 문서 검토 (`LLM_INTEGRATION_GUIDE.md`)
3. **TypeScript SDK** 템플릿 복사 및 커스터마이징
4. **테스트 시나리오** 4개 실행
5. **P1 항목** 이번 주 내 회신
6. **킥오프 미팅** 스케줄 조율 (필요시)

---

**감사합니다!** 🙏

원활한 협업을 위해 최선을 다하겠습니다.
문서 검토 후 궁금한 점이 있으시면 언제든 연락 주세요!

**마지막 업데이트**: 2025-11-22 (v2.0)
**변경사항**: API 엔드포인트를 `/agents/{agent_name}/execute` 형식으로 수정
