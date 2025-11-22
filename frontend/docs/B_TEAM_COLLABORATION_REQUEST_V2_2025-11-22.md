# B팀 협업 요청서 V2 - 실제 API 구조 확인 후

> **작성일**: 2025-11-22
> **작성자**: C팀 (Frontend Team)
> **우선순위**: 🔴 High
> **담당자**: B팀 Backend 개발팀
> **이전 버전**: B_TEAM_COLLABORATION_REQUEST_2025-11-22.md (폐기)

---

## 📋 요청 배경

### 발견 사항
1. **Backend API 정상 작동 확인** ✅
   - `http://100.123.51.5:8000` 서버 정상 응답
   - `/api/v1/generate` 엔드포인트 완벽히 작동
   - 테스트 제품 생성 성공 (21.5초, 1898 tokens)

2. **문서와 실제 API 불일치 발견** ⚠️
   - B팀 문서: Agent 기반 API (`/api/v1/agents/execute`)
   - 실제 Backend: Generator 기반 API (`/api/v1/generate`)
   - `/api/v1/agents/execute` 엔드포인트 존재하지 않음

---

## ✅ 확인된 Backend API 구조

### 1. Main Endpoint: `/api/v1/generate`

**지원 Kinds** (from `/api/v1/generate/kinds`):
1. `product_detail` - 제품 상세 콘텐츠 생성 (workflow: product_content_pipeline)
2. `sns_set` - SNS 콘텐츠 세트 생성 (workflow: product_content_pipeline)
3. `presentation_simple` - 간단한 프레젠테이션 생성 (workflow: product_content_pipeline)
4. `brand_identity` - 브랜드 아이덴티티 수립 (workflow: brand_identity_pipeline)
5. `content_review` - 콘텐츠 검토 및 개선 (workflow: content_review_pipeline)

**테스트 성공 예시**:
```bash
curl -X POST http://100.123.51.5:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "product_detail",
    "brandId": "test_brand",
    "input": {
      "product_name": "테스트 제품"
    }
  }'
```

**응답 구조**:
```json
{
  "kind": "product_detail",
  "document": {
    "documentId": "doc_7bca51ffd96c",
    "type": "product_detail",
    "canvas_json": { ... }  // 완전한 Polotno JSON
  },
  "text": {
    "headline": "테스트 제품",
    "subheadline": "혁신 기술로 더 나은 생활을 누려보세요",
    "body": "...",
    "bullets": ["..."],
    "cta": "바로 구매하세요!"
  },
  "meta": {
    "workflow": "product_content_pipeline",
    "agents_used": ["copywriter", "reviewer", "optimizer"],
    "elapsed_seconds": 21.54,
    "tokens_used": 1898
  }
}
```

### 2. 기타 엔드포인트 확인
- ✅ `/docs` - Swagger UI
- ✅ `/openapi.json` - OpenAPI spec
- ✅ `/api/v1/brands/` - 브랜드 관리
- ✅ `/api/v1/projects/` - 프로젝트 관리
- ✅ `/api/v1/documents/` - 문서 관리
- ✅ `/api/v1/templates/` - 템플릿 관리
- ✅ `/api/v1/users/` - 사용자 관리

---

## 🚨 B팀 확인 필요 사항

### 1. 문서 불일치 (P0 - 긴급)

**질문**: `backend/docs/LLM_INTEGRATION_GUIDE.md`와 실제 API 불일치

| B팀 문서 | 실제 Backend |
|---------|-------------|
| `/api/v1/agents/execute` | `/api/v1/generate` |
| Agent + Task 파라미터 | Kind + Input 파라미터 |
| 8개 Agent roles | 5개 Generator kinds |
| AgentResponse 형식 | GenerateResponse 형식 |

**요청**:
- [ ] 어느 것이 최신 API인지 확인
- [ ] 문서 업데이트 필요 여부
- [ ] Agent 시스템은 내부적으로만 사용되는지?

### 2. Chat 기능 지원 여부 (P0 - 긴급)

**배경**:
- Frontend에는 AI Chat Assistant 기능이 있음
- 일반 대화(제품 생성 외) 지원 필요
- `/api/v1/generate/kinds`에 `chat` kind가 없음

**질문**:
- [ ] 일반 대화 기능을 어떻게 구현해야 하나요?
- [ ] 별도 Chat API가 있나요?
- [ ] `product_detail` kind를 대화용으로 사용 가능한가요?

**현재 Frontend 요구사항**:
```typescript
// 사용자: "핸드크림 헤드라인 생성해줘"
// AI: "당신의 손끝에 피어나는 자연의 향기"
// 사용자: "더 자세히 설명해줘"
// AI: "이 핸드크림은..."
```

**옵션 제안**:
1. `kind: 'chat'` 추가 요청
2. 별도 `/api/v1/chat` 엔드포인트 제공
3. 기존 kind를 대화형으로 사용 (예: `kind: 'product_detail'`에 대화 히스토리 전달)

### 3. CORS 설정 (P1 - 이번 주)

**요청**:
Frontend에서 Backend API 호출 시 CORS 허용 필요

```python
# backend/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://100.123.51.5:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**확인 필요**:
- [ ] 현재 CORS 설정 상태
- [ ] Frontend URL 허용 여부

### 4. 인증 방식 (P1 - 이번 주)

**질문**:
- [ ] `/api/v1/generate` 호출 시 JWT 토큰 필요한가요?
- [ ] 개발 환경에서는 인증 없이 사용 가능한가요?
- [ ] JWT 토큰 발급 방법은? (`/api/v1/users/login` 사용?)

**Frontend 구현 예정**:
```typescript
// 옵션 1: API Key (개발/테스트)
headers: {
  'X-API-Key': 'development-key'
}

// 옵션 2: JWT Token (프로덕션)
headers: {
  'Authorization': `Bearer ${userToken}`
}

// 옵션 3: 인증 불필요 (개발 환경)
headers: {
  'Content-Type': 'application/json'
}
```

### 5. 응답 시간 최적화 (P2 - 다음 주)

**현황**:
- `product_detail` 생성 소요 시간: **21.5초**
- Tokens 사용: 1898

**질문**:
- [ ] 스트리밍 응답 지원 가능한가요?
- [ ] 응답 시간 단축 방법이 있나요?
- [ ] 캐싱 전략이 있나요?

**Frontend 요구사항**:
```typescript
// 스트리밍 지원 시
fetch('/api/v1/generate', {
  body: JSON.stringify({
    kind: 'product_detail',
    input: { ... },
    stream: true  // 스트리밍 활성화
  })
})
```

### 6. Input Schema 문서화 (P2 - 다음 주)

**요청**:
각 kind별 `input` 파라미터 스키마 문서화

**현재 추측 중**:
```typescript
// product_detail
{
  "input": {
    "product_name": string;        // 필수?
    "features"?: string[];         // 선택?
    "target_audience"?: string;    // 선택?
    "tone"?: string;               // 선택?
  }
}

// sns_set
{
  "input": {
    // ???
  }
}
```

**필요 정보**:
- [ ] 각 kind별 필수/선택 파라미터
- [ ] 파라미터 타입 및 설명
- [ ] 예시 데이터

---

## 📊 Frontend 다음 단계

### P0 - Chat 기능 확인 후
1. ⏳ B팀 답변 대기 (Chat API 지원 방법)
2. ⏳ Frontend를 Generator 패턴으로 재설계
   - `lib/llm-gateway-client.ts` → `lib/generator-client.ts`
   - `types/llm.ts` → `types/generator.ts`
   - Kind 기반 UI로 변경

### P1 - 통합 테스트
1. ⏳ CORS 설정 확인 후 Frontend ↔ Backend 연결 테스트
2. ⏳ 인증 방식 확인 후 구현
3. ⏳ 5가지 kind 모두 테스트

### P2 - 최적화
1. ⏳ 스트리밍 지원 시 구현
2. ⏳ 에러 핸들링 강화
3. ⏳ 사용자 경험 개선

---

## 📞 회신 방법

### 회신 항목 체크리스트

#### 긴급 (P0)
- [ ] **문서 불일치 해결**
  - 최신 API가 `/api/v1/generate`인지 확인
  - Agent 시스템 사용 여부

- [ ] **Chat 기능 지원 방법**
  - `kind: 'chat'` 추가 가능 여부
  - 별도 Chat API 제공 여부
  - 대안 제시

#### 이번 주 (P1)
- [ ] **CORS 설정 상태**
  - 현재 허용된 origins
  - Frontend URL 추가 필요 여부

- [ ] **인증 방식**
  - JWT 필요 여부
  - 개발 환경 인증 불필요 확인

#### 다음 주 (P2)
- [ ] **스트리밍 지원 여부**
- [ ] **각 kind별 input schema**

### 커뮤니케이션 채널
- **Slack**: #backend-support 또는 #frontend-backend-sync
- **이메일**: dev-support@sparklio.ai
- **긴급**: 직접 미팅 요청

---

## 📚 참고 자료

### Frontend 문서
1. [BACKEND_API_DISCOVERY_2025-11-22.md](./BACKEND_API_DISCOVERY_2025-11-22.md) - Backend API 발견 보고서
2. [LLM_INTEGRATION_REDESIGN_2025-11-22.md](./LLM_INTEGRATION_REDESIGN_2025-11-22.md) - 이전 재설계 (폐기 예정)

### Backend 문서
1. `backend/docs/LLM_INTEGRATION_GUIDE.md` - B팀 제공 (문서 불일치 확인 필요)
2. `http://100.123.51.5:8000/docs` - Swagger UI (실제 API)
3. `http://100.123.51.5:8000/openapi.json` - OpenAPI Spec

---

## ✅ 감사 인사

Backend API가 완벽하게 작동하고 있습니다! `/api/v1/generate` 테스트 결과 훌륭한 품질의 콘텐츠가 생성되었습니다.

이제 Frontend를 실제 Backend API에 맞춰 조정하겠습니다. Chat 기능 지원 방법만 확인되면 바로 통합 작업을 진행하겠습니다.

---

**마지막 업데이트**: 2025-11-22
**문서 버전**: 2.0.0
**작성자**: C팀 (Frontend Team)
**대체 문서**: B_TEAM_COLLABORATION_REQUEST_2025-11-22.md (폐기)
