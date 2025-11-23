# StrategistAgent Frontend↔Backend 통합 가이드

**작성일**: 2025-11-23
**작성자**: B팀 (Backend)
**대상**: C팀 (Frontend), 다음 세션 개발자

---

## 📋 빠른 시작

### ✅ 완료 상태

**Backend (B팀)**:
- ✅ Pydantic 스키마 정의 (`CampaignStrategyInputV1`, `CampaignStrategyOutputV1`)
- ✅ StrategistAgent 구현 (Retry Logic, Validation Pipeline)
- ✅ Golden Set Validator 연동
- ✅ API 엔드포인트 (`POST /api/v1/agents/strategist/execute`)

**Frontend (C팀)**:
- ✅ TypeScript 타입 정의 (`strategist.ts`)
- ✅ 뷰어 컴포넌트 (`StrategistStrategyView.tsx`)
- ✅ 타입 감지 (`detectCampaignStrategy()`)
- ✅ 렌더링 통합 (`AIResponseRenderer.tsx`)
- ✅ Mock 데이터

---

## 🚀 API 연동 방법

### 1. API 엔드포인트

```
POST /api/v1/agents/strategist/execute
```

### 2. 요청 형식

```typescript
// Request Body
{
  "task": "campaign_strategy",
  "payload": {
    "brand_name": "루나 스킨케어",
    "product_category": "프리미엄 안티에이징 세럼",
    "target_audience": "25-35세 직장인 여성, 피부 노화 고민",
    "campaign_objective": "신제품 런칭, 첫 달 매출 5000만원",
    "budget_range": "1억원",
    "tone": "luxury",  // luxury | professional | friendly | casual
    "brand_values": ["과학적 접근", "지속가능성", "우아함"],
    "key_messages": ["7일 만에 효과", "피부과 전문의 추천"],
    "competitor_info": "설화수, 후 등 경쟁",  // optional
    "channel_preferences": ["인스타그램", "네이버 블로그", "유튜브"]  // optional
  },
  "options": {
    "temperature": 0.4  // optional, 기본값 0.4
  }
}
```

### 3. 응답 형식

```typescript
// Response: AgentResponse
{
  "agent": "strategist",
  "task": "campaign_strategy",
  "outputs": [
    {
      "type": "json",
      "name": "campaign_strategy",
      "value": {
        "core_message": "과학이 만든 시간의 기적, 피부 본연의 빛을 되찾다",
        "positioning": "의학 연구 기반의 안티에이징 솔루션",
        "target_insights": [
          "직장인 여성은 피부 관리 시간이 부족하지만 효과는 확실히 보고 싶어 함",
          "화학 성분보다 임상 데이터를 신뢰하는 경향",
          "환경을 생각하는 소비를 가치 있게 여김"
        ],
        "big_idea": "타임 리버스: 피부 시계를 되돌리는 7일의 기적",
        "strategic_pillars": [
          {
            "title": "과학적 신뢰 구축",
            "description": "임상 데이터와 피부과 전문의 추천으로 제품의 효능을 객관적으로 입증",
            "key_actions": [
              "Before/After 임상 결과 인포그래픽",
              "피부과 전문의 인터뷰 콘텐츠",
              "주요 성분의 과학적 근거 설명"
            ]
          }
        ],
        "channel_strategy": [
          {
            "channel": "인스타그램",
            "objective": "브랜드 인지도 확산 및 제품 체험 유도",
            "content_types": ["릴스 (Before/After 타임랩스)", "피드 (임상 데이터 인포그래픽)"],
            "kpi": "팔로워 증가율 30%, 릴스 조회수 10만+, 저장률 8%"
          }
        ],
        "funnel_structure": {
          "awareness": ["인스타그램 릴스 광고 (Before/After)"],
          "consideration": ["블로그 성분 분석 포스팅"],
          "conversion": ["인스타그램 스토리 체험단 모집"],
          "retention": ["이메일 뉴스레터 (피부 관리 팁)"]
        },
        "risk_factors": [
          "고가 제품으로 인한 진입 장벽 (체험단/샘플 전략으로 대응)"
        ],
        "success_metrics": [
          "런칭 첫 달 매출 5000만원 달성",
          "인스타그램 도달률 50만+",
          "재구매율 25% (3개월 내)"
        ]
      },
      "meta": {
        "format": "strategic_analysis",
        "task": "campaign_strategy"
      }
    }
  ],
  "usage": {
    "llm_tokens": 1234,
    "total_tokens": 1234,
    "elapsed_seconds": 5.67
  },
  "meta": {
    "llm_provider": "ollama",
    "llm_model": "qwen2.5:7b",
    "task": "campaign_strategy",
    "tone": "luxury"
  }
}
```

---

## 🎨 Frontend 통합

### 1. API 호출 예시

```typescript
// api/strategist.ts
export async function generateCampaignStrategy(input: {
  brand_name: string;
  product_category: string;
  target_audience: string;
  campaign_objective: string;
  budget_range: string;
  tone?: 'luxury' | 'professional' | 'friendly' | 'casual';
  brand_values?: string[];
  key_messages?: string[];
  competitor_info?: string;
  channel_preferences?: string[];
}) {
  const response = await fetch('/api/v1/agents/strategist/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({
      task: 'campaign_strategy',
      payload: input,
      options: {
        temperature: 0.4
      }
    })
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.outputs[0].value as CampaignStrategyOutputV1;
}
```

### 2. 자동 렌더링

Frontend의 `AIResponseRenderer`가 자동으로 감지하고 렌더링:

```typescript
// C팀이 이미 구현 완료
<AIResponseRenderer response={agentResponse} />
// → 자동으로 StrategistStrategyView 렌더링
```

### 3. 수동 렌더링

```typescript
import { StrategistStrategyView } from '@/components/agent-responses/strategist/StrategistStrategyView';
import { CampaignStrategyOutputV1 } from '@/types/agent-responses/strategist';

// API 호출 결과를 직접 렌더링
const strategy = await generateCampaignStrategy({ ... });

<StrategistStrategyView strategy={strategy} />
```

---

## 🧪 테스트 방법

### 1. Backend 로컬 테스트

#### Option A: cURL

```bash
curl -X POST http://localhost:8000/api/v1/agents/strategist/execute \
  -H "Content-Type: application/json" \
  -d '{
    "task": "campaign_strategy",
    "payload": {
      "brand_name": "테스트 브랜드",
      "product_category": "프리미엄 제품",
      "target_audience": "2030 직장인",
      "campaign_objective": "신제품 런칭",
      "budget_range": "5000만원",
      "tone": "professional"
    }
  }'
```

#### Option B: Python (직접 Agent 호출)

```python
import asyncio
from app.services.agents import get_strategist_agent, AgentRequest

async def test_strategist():
    agent = get_strategist_agent()

    request = AgentRequest(
        task="campaign_strategy",
        payload={
            "brand_name": "테스트 브랜드",
            "product_category": "프리미엄 제품",
            "target_audience": "2030 직장인",
            "campaign_objective": "신제품 런칭",
            "budget_range": "5000만원",
            "tone": "professional"
        }
    )

    response = await agent.execute(request)
    print(f"✅ Success: {response.outputs[0].value}")

asyncio.run(test_strategist())
```

#### Option C: Golden Set Validator

```bash
# Golden Set 검증 (5개 케이스 자동 테스트)
python tests/golden_set_validator.py --agent strategist

# CI 모드 (Pass Rate 70% 이상 필요)
python tests/golden_set_validator.py --agent strategist --ci --min-pass-rate 70 --min-score 7.0
```

### 2. Frontend 테스트

Mock 데이터로 UI 테스트:

```typescript
import { mockCampaignStrategy } from '@/mock-data/strategist-mock';

// UI 테스트
<StrategistStrategyView strategy={mockCampaignStrategy} />
```

---

## 📊 품질 검증

### Validation Pipeline (자동 실행)

Backend에서 자동으로 4단계 검증:

1. **Stage 1: Schema Validation** (Pydantic)
   - 필수 필드 존재 여부
   - 데이터 타입 검증
   - 길이 제약 검증

2. **Stage 2: Length Validation**
   - `core_message`: 20-100자
   - `positioning`: 20-150자
   - `big_idea`: 15-100자
   - `target_insights`: 3-5개
   - `strategic_pillars`: 2-3개
   - `channel_strategy`: 2-5개

3. **Stage 3: Language Validation**
   - 한국어 비율: 40% 이상 (마케팅 전문 용어 허용)

4. **Stage 4: Quality Validation**
   - 자동으로 품질 점수 계산
   - 7.0/10 이하면 자동 재시도 (최대 3회)

### Retry Logic

- 최대 3회 시도
- Temperature: 0.4 → 0.5 → 0.6 (재시도마다 증가)
- Validation 실패 시 자동 재시도
- 구조화된 품질 로그 자동 생성

---

## 🔍 모니터링

### 구조화된 로그

Backend는 자동으로 품질 메트릭을 로깅합니다:

```json
{
  "message": "quality_metrics",
  "agent": "strategist",
  "task": "campaign_strategy",
  "overall_score": 8.5,
  "field_scores": {
    "schema_validation": 10.0,
    "length_validation": 9.0,
    "language_validation": 8.0,
    "quality_validation": 8.0
  },
  "validation_passed": true,
  "validation_errors": [],
  "validation_warnings": [],
  "attempt": 1,
  "max_retries": 3,
  "temperature": 0.4
}
```

이 로그는 Prometheus/StatsD/Elasticsearch로 전송 가능합니다.

---

## ⚠️ 주의사항

### 1. 필수 필드

다음 5개 필드는 **반드시** 제공해야 합니다:
- `brand_name`
- `product_category`
- `target_audience`
- `campaign_objective`
- `budget_range`

### 2. 톤앤매너 (tone)

허용값: `luxury`, `professional`, `friendly`, `casual`, `energetic`

### 3. Timeout

- 평균 응답 시간: 5-10초
- 최대 3회 재시도 시: 15-30초 (극히 드묾)
- Frontend에서 Timeout 설정: 최소 30초 권장

### 4. 에러 처리

```typescript
try {
  const strategy = await generateCampaignStrategy(input);
} catch (error) {
  if (error.response?.status === 500) {
    // Validation 실패 (3회 모두 실패)
    const details = error.response.data.detail;
    console.error('Validation failed:', details);
    // → UI에 "잠시 후 다시 시도해주세요" 표시
  } else if (error.response?.status === 400) {
    // 필수 필드 누락
    console.error('Missing required fields');
    // → UI에 누락된 필드 표시
  }
}
```

---

## 📦 파일 위치

### Backend

| 파일 | 역할 |
|------|------|
| `app/services/agents/strategist.py` | StrategistAgent 구현 |
| `app/schemas/strategist.py` | Pydantic 스키마 정의 |
| `app/services/validation/output_validator.py` | Validation Pipeline |
| `app/api/v1/endpoints/agents_new.py` | API 엔드포인트 |
| `tests/golden_set/strategist_campaign_strategy_v1.json` | Golden Set (5개 케이스) |
| `tests/golden_set_validator.py` | Golden Set Validator |

### Frontend (C팀 작업)

| 파일 | 역할 |
|------|------|
| `types/agent-responses/strategist.ts` | TypeScript 타입 |
| `components/agent-responses/strategist/StrategistStrategyView.tsx` | 뷰어 컴포넌트 |
| `utils/response-type-detector.ts` | 타입 감지 |
| `components/agent-responses/AIResponseRenderer.tsx` | 자동 렌더링 |
| `mock-data/strategist-mock.ts` | Mock 데이터 |

---

## 🎯 다음 단계

### Frontend (C팀)

1. **API 연동 구현**
   ```typescript
   // Example: CampaignForm.tsx
   const handleSubmit = async (formData) => {
     const strategy = await generateCampaignStrategy(formData);
     setStrategy(strategy);
   };
   ```

2. **ContentPlan 통합** (C_TEAM_NEXT_STEPS 참조)
   - ContentPlanViewer에 "전략 요약" 탭 추가
   - Strategist → ContentPlan 연동 플로우

3. **에러 처리 UI**
   - Loading state (5-10초 대기)
   - Timeout 메시지 (30초 이상)
   - Validation 실패 시 재시도 버튼

### Backend (B팀)

1. **Golden Set 확대** (선택)
   - 현재 5개 → 10개로 확장
   - 다양한 산업/톤 커버

2. **성능 최적화** (선택)
   - LLM Response Caching (Redis)
   - Parallel Workflow 구현

---

## 📞 문의

- Backend 이슈: GitHub Issues
- API 문서: `/docs` (FastAPI Swagger UI)
- Golden Set 결과: `tests/golden_set_validator.py --agent strategist`

---

**작성자**: B팀 (Backend) - Claude (2025-11-23 세션)
**문서 버전**: 1.0
**최종 업데이트**: 2025-11-23

**상태**: 🟢 **READY FOR FRONTEND INTEGRATION**
