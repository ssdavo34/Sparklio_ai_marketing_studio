# Backend API Discovery Report

> **작성일**: 2025-11-22
> **작성자**: C팀 (Frontend Team)
> **목적**: 실제 Backend API 구조 파악 및 Frontend 통합 방향 수립

---

## 🚨 중대 발견사항

### Backend API 아키텍처 불일치

**문제점**:
- B팀 문서 (`backend/docs/LLM_INTEGRATION_GUIDE.md`)에는 **Agent 기반 API**로 설명됨
- 실제 Backend는 **Generator 기반 API** 사용
- `/api/v1/agents/execute` 엔드포인트 존재하지 않음 ❌
- `/api/v1/health` 엔드포인트 존재하지 않음 ❌

**실제 Backend**:
- Main endpoint: `/api/v1/generate` ✅
- Pattern: `kind` 파라미터로 생성 유형 지정
- 내부적으로는 Agent 사용 (copywriter, reviewer, optimizer)

---

## 📋 실제 Backend API 구조

### OpenAPI Spec 확인
```bash
curl http://100.123.51.5:8000/openapi.json
```

### 주요 엔드포인트

#### 1. Content Generation (Main LLM API)
```
POST /api/v1/generate
```

**지원하는 kind (P0)**:
- `product_detail`: 제품 상세 콘텐츠 생성
- `sns_set`: SNS 콘텐츠 세트 생성
- `presentation_simple`: 간단한 프레젠테이션 생성
- `brand_identity`: 브랜드 아이덴티티 수립
- `content_review`: 콘텐츠 검토 및 개선

**요청 형식**:
```json
{
  "kind": "product_detail",
  "brandId": "brand_demo",
  "input": {
    "product_name": "딥그린 진정 토너",
    "features": ["저자극", "지성피부"],
    "target_audience": "2030 직장인"
  },
  "options": {
    "tone": "professional",
    "length": "medium"
  }
}
```

**응답 형식**:
```json
{
  "kind": "product_detail",
  "document": {
    "documentId": "doc_abc123",
    "type": "product_detail",
    "canvas_json": {
      "id": "doc_product_detail_f0f7be05",
      "kind": "product_detail",
      "brand": { ... },
      "pages": [ ... ],
      "metadata": { ... },
      "bindings": { ... }
    }
  },
  "text": {
    "headline": "테스트 제품",
    "subheadline": "혁신 기술로 더 나은 생활을 누려보세요",
    "body": "테스트 제품은 최첨단 기술을 적용하여...",
    "bullets": ["효율성과 안정성을 제공"],
    "cta": "바로 구매하세요!"
  },
  "meta": {
    "workflow": "product_content_pipeline",
    "agents_used": ["copywriter", "reviewer", "optimizer"],
    "elapsed_seconds": 21.54,
    "tokens_used": 1898,
    "steps_completed": 3,
    "total_steps": 3
  }
}
```

#### 2. 기타 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/v1/generate/kinds` | GET | 사용 가능한 kind 목록 조회 |
| `/api/v1/assets/` | POST/GET | 에셋 업로드 및 조회 |
| `/api/v1/brands/` | POST/GET | 브랜드 생성 및 조회 |
| `/api/v1/projects/` | POST/GET | 프로젝트 관리 |
| `/api/v1/documents/{docId}` | GET/PATCH/DELETE | 문서 관리 |
| `/api/v1/templates/` | GET/POST | 템플릿 조회 및 생성 |
| `/api/v1/editor/action` | POST | Editor Action 적용 |
| `/api/v1/users/register` | POST | 사용자 등록 |
| `/api/v1/users/login` | POST | 로그인 (JWT 발급) |
| `/api/v1/users/me` | GET/PATCH | 현재 사용자 정보 |

---

## ✅ 테스트 결과

### Test 1: Root Endpoint
```bash
curl http://100.123.51.5:8000/
```
**결과**: ✅ 성공
```json
{
  "service": "Sparklio V4 API",
  "version": "4.0.0"
}
```

### Test 2: OpenAPI Docs
```bash
curl http://100.123.51.5:8000/docs
```
**결과**: ✅ 성공 (Swagger UI 제공)

### Test 3: Generate API
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
**결과**: ✅ 성공 (21.5초 소요)
- 완전한 canvas JSON 생성
- Text outputs 생성 (headline, subheadline, body, bullets, cta)
- 내부적으로 3개 Agent 사용 (copywriter, reviewer, optimizer)
- 1898 tokens 사용

---

## 🎯 Frontend 수정 방향

### 1. Generator 기반으로 재설계 필요

#### 변경 사항 요약
| 이전 (Agent 패턴) | 현재 (Generator 패턴) |
|------------------|---------------------|
| `/api/v1/agents/execute` | `/api/v1/generate` |
| `agent` + `task` 파라미터 | `kind` + `input` 파라미터 |
| Role/Task 선택 UI | Kind 선택 UI |
| AgentRole, TaskType types | GeneratorKind type |

### 2. 수정 필요 파일

#### `lib/llm-gateway-client.ts`
- ❌ `executeAgent()` 메서드 → ✅ `generate()` 메서드
- ❌ Agent/Task 기반 → ✅ Kind 기반

**새로운 구조**:
```typescript
export async function generateContent(params: {
  kind: GeneratorKind;
  brandId: string;
  input: any;
  options?: any;
}): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return await response.json();
}
```

#### `components/canvas-studio/stores/types/llm.ts`
- ❌ AgentRole, TaskType → ✅ GeneratorKind
- 새로운 types:
```typescript
export type GeneratorKind =
  | 'product_detail'
  | 'sns_set'
  | 'presentation_simple'
  | 'brand_identity'
  | 'content_review';
```

#### `components/canvas-studio/stores/useChatStore.ts`
- Chat 기능은 Generator와 별도로 구현 필요
- 단순 대화는 `kind: 'chat'` 또는 별도 API 필요 (확인 필요)

#### `components/canvas-studio/panels/right/RightDock.tsx`
- UI 변경: Agent Role/Task 선택 → Kind 선택
- Kind별 input form 제공

### 3. 추가 확인 필요 사항

#### ❓ Chat 기능 지원 여부
- `/api/v1/generate`가 일반 대화(`kind: 'chat'`)를 지원하는지?
- 별도 Chat 전용 API가 있는지?

**테스트 필요**:
```bash
curl -X POST http://100.123.51.5:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "chat",
    "brandId": "test",
    "input": {
      "user_input": "안녕하세요"
    }
  }'
```

#### ❓ 지원 Kind 전체 목록
```bash
curl http://100.123.51.5:8000/api/v1/generate/kinds
```

#### ❓ 인증 방식
- JWT Bearer token 필요한지?
- 개발 환경에서는 인증 불필요한지?

---

## 🔄 B팀 문서와의 차이점

| B팀 문서 | 실제 Backend |
|---------|-------------|
| Agent 기반 아키텍처 | Generator 기반 아키텍처 |
| `/api/v1/agents/execute` | `/api/v1/generate` |
| `agent` + `task` 파라미터 | `kind` + `input` 파라미터 |
| 8개 Agent roles | 5개 Generator kinds (P0) |
| 13개 Task types | - |
| AgentResponse 형식 | GenerateResponse 형식 |

**추정 원인**:
1. B팀 문서가 계획서였고, 실제 구현은 다르게 진행됨
2. 또는 Agent 시스템이 내부적으로만 사용되고, 외부 API는 Generator로 추상화됨

---

## 📊 다음 단계

### P0 (즉시)
1. ✅ Backend API 구조 파악 완료
2. ⏳ Frontend를 Generator 패턴으로 재설계
   - `lib/llm-gateway-client.ts` 재작성
   - `types/llm.ts` 재작성
   - `useChatStore.ts` 재작성
   - `RightDock.tsx` UI 재작성

### P1 (이번 주)
1. ⏳ Chat 기능 지원 여부 확인
2. ⏳ 전체 Kind 목록 확인 (`/api/v1/generate/kinds`)
3. ⏳ 인증 방식 확인 (JWT 필요 여부)
4. ⏳ End-to-end 테스트

### P2 (다음 주)
1. ⏳ B팀에게 문서 업데이트 요청
2. ⏳ Frontend 문서 재작성

---

## 📞 B팀 확인 필요 사항

### 질문 1: 문서 불일치
**질문**: `backend/docs/LLM_INTEGRATION_GUIDE.md`에는 Agent 기반 API(`/api/v1/agents/execute`)로 설명되어 있으나, 실제 Backend는 Generator 기반(`/api/v1/generate`)입니다. 어느 것이 최신인가요?

### 질문 2: Chat 기능
**질문**: 일반 대화 기능을 지원하나요? `/api/v1/generate`에서 `kind: 'chat'` 지원하나요? 아니면 별도 API가 있나요?

### 질문 3: 지원 Kind 목록
**질문**: `/api/v1/generate/kinds`가 반환하는 전체 kind 목록을 공유해주세요.

### 질문 4: 인증
**질문**: 개발 환경에서 JWT 토큰 없이 `/api/v1/generate` 호출 가능한가요?

---

## ✅ 핵심 결론

1. **Backend는 정상 작동** - `/api/v1/generate` 완벽히 동작
2. **Frontend 아키텍처 재설계 필요** - Agent 패턴 → Generator 패턴
3. **B팀 문서 업데이트 필요** - 실제 API와 문서 불일치
4. **통합 테스트 성공** - 테스트 제품 생성 성공 (21.5초, 1898 tokens)

---

**마지막 업데이트**: 2025-11-22
**문서 버전**: 1.0.0
**작성자**: C팀 (Frontend Team)
