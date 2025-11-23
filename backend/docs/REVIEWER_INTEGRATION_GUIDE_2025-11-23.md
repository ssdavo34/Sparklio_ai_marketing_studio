# ReviewerAgent Frontend↔Backend 통합 가이드

**작성일**: 2025-11-23
**작성자**: B팀 (Backend)
**대상**: C팀 (Frontend), 다음 세션 개발자

---

## 📋 빠른 시작

### ✅ 완료 상태

**Backend (B팀)**:
- ✅ Pydantic 스키마 정의 (`AdCopyReviewInputV1`, `AdCopyReviewOutputV1`)
- ✅ ReviewerAgent 구현 (Retry Logic, Validation Pipeline)
- ✅ Golden Set Validator 연동
- ✅ API 엔드포인트 (`POST /api/v1/agents/reviewer/execute`)

**Frontend (C팀)**:
- ⏳ TypeScript 타입 정의 (`reviewer.ts`)
- ⏳ 뷰어 컴포넌트 (`ReviewerReviewView.tsx`)
- ⏳ 타입 감지 (`detectAdCopyReview()`)
- ⏳ 렌더링 통합 (`AIResponseRenderer.tsx`)

---

## 🚀 API 연동 방법

### 1. API 엔드포인트

```
POST /api/v1/agents/reviewer/execute
```

### 2. 요청 형식

```typescript
// Request Body
{
  "task": "ad_copy_quality_check",
  "payload": {
    "original_copy": {
      "headline": "소음은 지우고, 음악만 남기다",
      "subheadline": "24시간 배터리, ANC 노이즈캔슬링",
      "body": "프리미엄 무선 이어폰의 새로운 기준",
      "bullets": ["ANC 노이즈캔슬링", "24시간 배터리", "IPX7 방수"],
      "cta": "지금 체험하기"
    },
    "campaign_context": {  // optional
      "brand_name": "SoundPro",
      "target_audience": "2030 직장인",
      "tone": "professional",
      "campaign_objective": "신제품 런칭"
    },
    "review_criteria": ["tone", "clarity", "persuasiveness"],  // optional
    "strict_mode": false  // optional, 기본값 false (true면 9.0 이상 필요)
  },
  "options": {
    "temperature": 0.2  // optional, 기본값 0.2 (일관성 중시)
  }
}
```

### 3. 응답 형식

```typescript
// Response: AgentResponse
{
  "agent": "reviewer",
  "task": "ad_copy_quality_check",
  "outputs": [
    {
      "type": "json",
      "name": "ad_copy_quality_check",
      "value": {
        // 점수 (0-10)
        "overall_score": 8.5,
        "tone_match_score": 9.0,
        "clarity_score": 8.5,
        "persuasiveness_score": 8.5,
        "brand_alignment_score": 9.0,

        // 정성 평가
        "strengths": [
          "Headline이 임팩트 있고 제품 핵심 가치를 명확히 전달함",
          "Subheadline이 감성적이면서도 기술적 우위를 잘 표현함",
          "Body가 사용자 경험 스토리를 효과적으로 전달함"
        ],
        "weaknesses": [
          "Bullets가 기능 나열에 치우쳐 차별점 강조 부족"
        ],
        "improvement_suggestions": [
          "Bullets 중 하나를 차별화 요소로 교체 (예: '음향 전문가 추천' 또는 '독자적 음향 알고리즘')"
        ],

        // 리스크 플래그
        "risk_flags": [],

        // 승인 판정
        "approval_status": "approved",  // approved | needs_revision | rejected
        "revision_priority": "low",  // low | medium | high | critical
        "approval_reason": "전반적인 품질이 우수하며 즉시 사용 가능, 소폭 개선 시 더욱 효과적일 것으로 예상"
      },
      "meta": {
        "format": "review_analysis",
        "task": "ad_copy_quality_check"
      }
    }
  ],
  "usage": {
    "llm_tokens": 1234,
    "total_tokens": 1234,
    "elapsed_seconds": 3.45
  },
  "meta": {
    "llm_provider": "ollama",
    "llm_model": "qwen2.5:7b",
    "task": "ad_copy_quality_check",
    "validation_score": 8.5,
    "attempt": 1
  }
}
```

---

## 🎨 Frontend 통합

### 1. API 호출 예시

```typescript
// api/reviewer.ts
export async function reviewAdCopy(input: {
  original_copy: {
    headline: string;
    subheadline: string;
    body: string;
    bullets: string[];
    cta: string;
  };
  campaign_context?: {
    brand_name?: string;
    target_audience?: string;
    tone?: string;
    campaign_objective?: string;
  };
  review_criteria?: string[];
  strict_mode?: boolean;
}) {
  const response = await fetch('/api/v1/agents/reviewer/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({
      task: 'ad_copy_quality_check',
      payload: input,
      options: {
        temperature: 0.2
      }
    })
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.outputs[0].value as AdCopyReviewOutputV1;
}
```

### 2. TypeScript 타입 정의 (참조)

```typescript
// types/agent-responses/reviewer.ts
export interface AdCopyReviewInputV1 {
  original_copy: {
    headline: string;
    subheadline: string;
    body: string;
    bullets: string[];
    cta: string;
  };
  campaign_context?: {
    brand_name?: string;
    target_audience?: string;
    tone?: string;
    campaign_objective?: string;
  };
  review_criteria?: string[];
  strict_mode?: boolean;
}

export interface AdCopyReviewOutputV1 {
  // Scores (0-10)
  overall_score: number;
  tone_match_score: number;
  clarity_score: number;
  persuasiveness_score: number;
  brand_alignment_score: number;

  // Qualitative assessment
  strengths: string[];
  weaknesses: string[];
  improvement_suggestions: string[];

  // Risk flags
  risk_flags: string[];

  // Final verdict
  approval_status: 'approved' | 'needs_revision' | 'rejected';
  revision_priority: 'low' | 'medium' | 'high' | 'critical';
  approval_reason: string | null;
}
```

### 3. 뷰어 컴포넌트 예시 (ReviewerReviewView.tsx)

```typescript
import React from 'react';
import { AdCopyReviewOutputV1 } from '@/types/agent-responses/reviewer';

interface ReviewerReviewViewProps {
  review: AdCopyReviewOutputV1;
}

export function ReviewerReviewView({ review }: ReviewerReviewViewProps) {
  // 승인 상태별 색상
  const statusColors = {
    approved: 'text-green-600',
    needs_revision: 'text-yellow-600',
    rejected: 'text-red-600'
  };

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-6">
      {/* 종합 점수 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">종합 점수</h3>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold">{review.overall_score.toFixed(1)}</div>
          <div className="text-gray-500">/ 10.0</div>
        </div>
      </div>

      {/* 세부 점수 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">세부 점수</h3>
        <div className="space-y-3">
          <ScoreBar label="톤앤매너 일치도" score={review.tone_match_score} />
          <ScoreBar label="명확성" score={review.clarity_score} />
          <ScoreBar label="설득력" score={review.persuasiveness_score} />
          <ScoreBar label="브랜드 정렬도" score={review.brand_alignment_score} />
        </div>
      </div>

      {/* 강점 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">✅ 강점</h3>
        <ul className="list-disc pl-5 space-y-2">
          {review.strengths.map((strength, i) => (
            <li key={i} className="text-gray-700">{strength}</li>
          ))}
        </ul>
      </div>

      {/* 약점 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">⚠️ 약점</h3>
        <ul className="list-disc pl-5 space-y-2">
          {review.weaknesses.map((weakness, i) => (
            <li key={i} className="text-gray-700">{weakness}</li>
          ))}
        </ul>
      </div>

      {/* 개선 제안 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">💡 개선 제안</h3>
        <ul className="list-decimal pl-5 space-y-2">
          {review.improvement_suggestions.map((suggestion, i) => (
            <li key={i} className="text-gray-700">{suggestion}</li>
          ))}
        </ul>
      </div>

      {/* 리스크 플래그 */}
      {review.risk_flags.length > 0 && (
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <h3 className="text-lg font-bold mb-4 text-red-800">🚨 리스크 플래그</h3>
          <ul className="list-disc pl-5 space-y-2">
            {review.risk_flags.map((flag, i) => (
              <li key={i} className="text-red-700">{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 승인 판정 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">최종 판정</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="font-medium">승인 상태:</span>
            <span className={`font-bold ${statusColors[review.approval_status]}`}>
              {review.approval_status === 'approved' && '✅ 승인'}
              {review.approval_status === 'needs_revision' && '📝 수정 필요'}
              {review.approval_status === 'rejected' && '❌ 재작성 필요'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium">수정 우선순위:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[review.revision_priority]}`}>
              {review.revision_priority.toUpperCase()}
            </span>
          </div>
          {review.approval_reason && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <p className="text-gray-700">{review.approval_reason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const percentage = (score / 10) * 100;
  const color = score >= 7 ? 'bg-green-500' : score >= 5 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold">{score.toFixed(1)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
```

### 4. 자동 렌더링 통합

```typescript
// utils/response-type-detector.ts 확장
export function detectAdCopyReview(data: any): boolean {
  return (
    typeof data === 'object' &&
    'overall_score' in data &&
    'tone_match_score' in data &&
    'strengths' in data &&
    'weaknesses' in data &&
    'approval_status' in data
  );
}

// AIResponseRenderer.tsx 확장
if (detectAdCopyReview(output.value)) {
  return <ReviewerReviewView review={output.value as AdCopyReviewOutputV1} />;
}
```

---

## 🧪 테스트 방법

### 1. Backend 로컬 테스트

#### Option A: cURL

```bash
curl -X POST http://localhost:8000/api/v1/agents/reviewer/execute \
  -H "Content-Type: application/json" \
  -d '{
    "task": "ad_copy_quality_check",
    "payload": {
      "original_copy": {
        "headline": "소음은 지우고, 음악만 남기다",
        "subheadline": "24시간 배터리, ANC 노이즈캔슬링",
        "body": "프리미엄 무선 이어폰의 새로운 기준",
        "bullets": ["ANC 노이즈캔슬링", "24시간 배터리", "IPX7 방수"],
        "cta": "지금 체험하기"
      },
      "campaign_context": {
        "brand_name": "SoundPro",
        "target_audience": "2030 직장인",
        "tone": "professional"
      }
    }
  }'
```

#### Option B: Python (직접 Agent 호출)

```python
import asyncio
from app.services.agents import get_reviewer_agent, AgentRequest

async def test_reviewer():
    agent = get_reviewer_agent()

    request = AgentRequest(
        task="ad_copy_quality_check",
        payload={
            "original_copy": {
                "headline": "소음은 지우고, 음악만 남기다",
                "subheadline": "24시간 배터리, ANC 노이즈캔슬링",
                "body": "프리미엄 무선 이어폰의 새로운 기준",
                "bullets": ["ANC 노이즈캔슬링", "24시간 배터리", "IPX7 방수"],
                "cta": "지금 체험하기"
            },
            "campaign_context": {
                "brand_name": "SoundPro",
                "target_audience": "2030 직장인",
                "tone": "professional"
            }
        }
    )

    response = await agent.execute(request)
    print(f"✅ Success: {response.outputs[0].value}")

asyncio.run(test_reviewer())
```

#### Option C: Golden Set Validator

```bash
# Golden Set 검증 (5개 케이스 자동 테스트)
python tests/golden_set_validator.py --agent reviewer

# CI 모드 (Pass Rate 70% 이상 필요)
python tests/golden_set_validator.py --agent reviewer --ci --min-pass-rate 70 --min-score 7.0
```

### 2. Frontend 테스트

Mock 데이터로 UI 테스트:

```typescript
import { mockAdCopyReview } from '@/mock-data/reviewer-mock';

// UI 테스트
<ReviewerReviewView review={mockAdCopyReview} />
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
   - `strengths`: 1-5개, 각 10-150자
   - `weaknesses`: 1-5개, 각 10-150자
   - `improvement_suggestions`: 1-5개, 각 10-200자
   - `risk_flags`: 0-10개, 각 10-100자
   - `approval_reason`: 10-200자

3. **Stage 3: Language Validation**
   - 한국어 비율: 90% 이상 (리뷰는 한국어로 작성)

4. **Stage 4: Quality Validation**
   - 승인 로직 검증 (overall_score < 7.0이면 approved 불가)
   - 자동으로 품질 점수 계산
   - 7.0/10 이하면 자동 재시도 (최대 3회)

### Retry Logic

- 최대 3회 시도
- Temperature: 0.2 → 0.3 → 0.4 (재시도마다 증가, 일관성 중시)
- Validation 실패 시 자동 재시도
- 구조화된 품질 로그 자동 생성

---

## 🔍 모니터링

### 구조화된 로그

Backend는 자동으로 품질 메트릭을 로깅합니다:

```json
{
  "message": "quality_metrics",
  "agent": "reviewer",
  "task": "ad_copy_quality_check",
  "overall_score": 8.5,
  "field_scores": {
    "schema_validation": 10.0,
    "length_validation": 9.0,
    "language_validation": 9.5,
    "quality_validation": 8.0
  },
  "validation_passed": true,
  "validation_errors": [],
  "validation_warnings": [],
  "attempt": 1,
  "max_retries": 3,
  "temperature": 0.2,
  "review_overall_score": 8.5,
  "approval_status": "approved"
}
```

이 로그는 Prometheus/StatsD/Elasticsearch로 전송 가능합니다.

---

## ⚠️ 주의사항

### 1. 필수 필드

최소한 `original_copy`는 **반드시** 제공해야 합니다:
- `headline`
- `subheadline`
- `body`
- `bullets`
- `cta`

### 2. Strict Mode

- `strict_mode: false` (기본): 7.0 이상이면 approved 또는 needs_revision 가능
- `strict_mode: true`: 9.0 이상만 approved 가능

### 3. Timeout

- 평균 응답 시간: 3-5초
- 최대 3회 재시도 시: 10-15초 (극히 드묾)
- Frontend에서 Timeout 설정: 최소 20초 권장

### 4. 에러 처리

```typescript
try {
  const review = await reviewAdCopy(input);
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
| `app/services/agents/reviewer.py` | ReviewerAgent 구현 |
| `app/schemas/reviewer.py` | Pydantic 스키마 정의 |
| `app/services/validation/output_validator.py` | Validation Pipeline |
| `app/api/v1/endpoints/agents_new.py` | API 엔드포인트 |
| `tests/golden_set/reviewer_ad_copy_quality_check_v1.json` | Golden Set (5개 케이스) |
| `tests/golden_set_validator.py` | Golden Set Validator |

### Frontend (C팀 작업)

| 파일 | 역할 |
|------|------|
| `types/agent-responses/reviewer.ts` | TypeScript 타입 |
| `components/agent-responses/reviewer/ReviewerReviewView.tsx` | 뷰어 컴포넌트 |
| `utils/response-type-detector.ts` | 타입 감지 |
| `components/agent-responses/AIResponseRenderer.tsx` | 자동 렌더링 |
| `mock-data/reviewer-mock.ts` | Mock 데이터 |

---

## 🎯 다음 단계

### Frontend (C팀)

1. **API 연동 구현**
   ```typescript
   // Example: CopyReviewForm.tsx
   const handleSubmit = async (copy) => {
     const review = await reviewAdCopy({
       original_copy: copy
     });
     setReview(review);
   };
   ```

2. **Copywriter 출력 통합**
   - Copywriter가 카피 생성 → 자동으로 Reviewer 호출
   - 리뷰 결과를 같이 표시 (탭 또는 사이드바)

3. **에러 처리 UI**
   - Loading state (3-5초 대기)
   - Timeout 메시지 (20초 이상)
   - Validation 실패 시 재시도 버튼

### Backend (B팀)

1. **Golden Set 확대** (선택)
   - 현재 5개 → 10개로 확장
   - 다양한 산업/톤/시나리오 커버

2. **성능 최적화** (선택)
   - LLM Response Caching (Redis)
   - Parallel Workflow 구현

---

## 📞 문의

- Backend 이슈: GitHub Issues
- API 문서: `/docs` (FastAPI Swagger UI)
- Golden Set 결과: `python tests/golden_set_validator.py --agent reviewer`

---

**작성자**: B팀 (Backend) - Claude (2025-11-23 세션)
**문서 버전**: 1.0
**최종 업데이트**: 2025-11-23

**상태**: 🟢 **READY FOR FRONTEND INTEGRATION**
