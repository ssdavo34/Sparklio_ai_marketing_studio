# Backend ↔ Frontend API 스키마 정렬 문서

**작성일**: 2025-11-17
**작성자**: B팀 (Backend)
**목적**: Frontend 연결 테스트 전 API 스키마 차이점 정리 및 정렬

---

## 🔍 현재 상황

C팀에서 작성한 [`frontend/docs/BACKEND_CONNECTION_TEST_REQUEST.md`](../../frontend/docs/BACKEND_CONNECTION_TEST_REQUEST.md)와 B팀에서 구현한 실제 Backend API 간 **스키마 차이**가 있습니다.

---

## 📊 스키마 비교

### 1. 서버 포트

| 항목 | Frontend 예상 | Backend 실제 | 상태 |
|------|--------------|-------------|------|
| Port | `8000` | `8001` | ⚠️ 불일치 |

**해결 방법**:
- Frontend `.env.local` 수정 필요:
  ```env
  NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
  ```

---

### 2. Request 스키마

#### Frontend 예상 (C팀)
```json
{
  "kind": "product_detail",
  "brandId": null,
  "locale": "ko-KR",
  "input": {
    "prompt": "고급 스킨케어 제품 상세 페이지를 만들어줘"
  },
  "context": {}
}
```

#### Backend 실제 (B팀)
```json
{
  "kind": "product_detail",
  "brandId": "brand_demo",
  "input": {
    "product_name": "제품명",
    "features": ["특징1", "특징2"],
    "target_audience": "타겟 고객"
  },
  "options": {
    "tone": "professional",
    "length": "medium"
  }
}
```

#### 차이점

| 필드 | Frontend | Backend | 비고 |
|------|----------|---------|------|
| `locale` | ✅ 있음 | ❌ 없음 | Backend에서 미지원 |
| `context` | ✅ 있음 | ❌ 없음 | Backend에서 미지원 |
| `input.prompt` | ✅ 자유 텍스트 | ❌ 구조화된 데이터 | **중요한 차이** |
| `options` | ❌ 없음 | ✅ 있음 | Backend 선택 필드 |

**핵심 차이**:
- **Frontend**: 자유 형식 프롬프트 (`input.prompt`)
- **Backend**: 구조화된 입력 (`input.product_name`, `input.features` 등)

---

### 3. Response 스키마

#### Frontend 예상 (C팀)
```json
{
  "taskId": "task_123456",
  "kind": "product_detail",
  "textBlocks": {
    "headline": "...",
    "description": "..."
  },
  "editorDocument": {
    "documentId": "doc_123456",
    "type": "product_detail",
    "canvas_json": {
      "version": "5.3.0",
      "objects": [...],
      "background": "#ffffff"
    },
    "pages": []
  },
  "meta": {
    "templates_used": ["..."],
    "agents_trace": [...],
    "llm_cost": {}
  }
}
```

#### Backend 실제 (B팀)
```json
{
  "kind": "product_detail",
  "document": {
    "documentId": "doc_a1b2c3d4e5f6",
    "type": "product_detail",
    "canvas_json": {
      "version": "5.3.0",
      "objects": []
    }
  },
  "text": {
    "headline": "...",
    "subheadline": "...",
    "body": "...",
    "bullets": ["...", "..."]
  },
  "meta": {
    "workflow": "product_content_pipeline",
    "agents_used": ["copywriter", "reviewer", "optimizer"],
    "elapsed_seconds": 12.35,
    "tokens_used": 1500,
    "steps_completed": 3,
    "total_steps": 3
  }
}
```

#### 차이점

| 필드 | Frontend | Backend | 상태 |
|------|----------|---------|------|
| `taskId` | ✅ 최상위 | ❌ 없음 | Backend 미지원 |
| `textBlocks` | ✅ 있음 | ❌ `text`로 명명 | ⚠️ 필드명 다름 |
| `editorDocument` | ✅ 있음 | ❌ `document`로 명명 | ⚠️ 필드명 다름 |
| `document.pages` | ✅ 있음 | ❌ 없음 | Backend 미지원 |
| `text.subheadline` | ❌ 없음 | ✅ 있음 | Backend 추가 필드 |
| `text.bullets` | ❌ 없음 | ✅ 있음 | Backend 추가 필드 |
| `meta.templates_used` | ✅ 있음 | ❌ 없음 | Backend 미지원 |
| `meta.agents_trace` | ✅ 있음 | ❌ `agents_used`로 단순화 | ⚠️ 구조 다름 |
| `meta.llm_cost` | ✅ 있음 | ❌ 없음 | Backend 미지원 |
| `meta.workflow` | ❌ 없음 | ✅ 있음 | Backend 추가 필드 |
| `meta.elapsed_seconds` | ❌ 없음 | ✅ 있음 | Backend 추가 필드 |
| `meta.tokens_used` | ❌ 없음 | ✅ 있음 | Backend 추가 필드 |

---

## 🎯 해결 방안

### Option 1: Frontend가 Backend 스키마에 맞춤 (권장)

**이유**:
- Backend는 이미 P0 작업 완료 및 테스트 검증됨
- A팀 QA Plan에 Backend 스키마가 반영됨
- Backend 변경 시 Agent 오케스트레이션 전체 수정 필요

**Frontend 수정 사항**:

#### 1. Request 변경
```typescript
// frontend/lib/api/types.ts 수정
export interface GenerateRequest {
  kind: string;
  brandId: string; // null 허용하지만 문자열로
  input: {
    // 자유 프롬프트가 아닌 구조화된 데이터
    product_name?: string;
    features?: string[];
    target_audience?: string;
    // kind에 따라 다른 필드
  };
  options?: {
    tone?: string;
    length?: string;
  };
  // locale, context 제거
}
```

#### 2. Response 변경
```typescript
// frontend/lib/api/types.ts 수정
export interface GenerateResponse {
  kind: string;
  document: {  // editorDocument → document
    documentId: string;
    type: string;
    canvas_json: {
      version: string;
      objects: any[];
      background?: string;
    };
    // pages 제거
  };
  text: {  // textBlocks → text
    headline?: string;
    subheadline?: string;  // 추가
    body?: string;
    bullets?: string[];    // 추가
  };
  meta: {
    workflow: string;
    agents_used: string[];  // agents_trace 대신
    elapsed_seconds: number;
    tokens_used: number;
    steps_completed: number;
    total_steps: number;
    // templates_used, llm_cost 제거
  };
  // taskId 제거
}
```

#### 3. ChatPanel 수정
```typescript
// frontend/components/canvas-studio/components/ChatPanel.tsx
// 프롬프트를 구조화된 데이터로 변환하는 로직 추가

const handleSubmit = () => {
  // 기존: { prompt: userInput }
  // 변경:
  const input = {
    product_name: extractProductName(userInput),
    features: extractFeatures(userInput),
    target_audience: extractAudience(userInput)
  };

  generate({ kind, brandId: 'brand_demo', input });
};
```

#### 4. Adapter 수정
```typescript
// frontend/components/canvas-studio/adapters/response-to-fabric.ts
export function convertResponseToFabric(response: GenerateResponse) {
  // editorDocument → document
  // textBlocks → text
  return response.document.canvas_json;
}
```

---

### Option 2: Backend가 Frontend 스키마에 맞춤 (비권장)

**이유**:
- P0 작업 완료된 Backend 전체 수정 필요
- Agent 오케스트레이션 로직 변경 필요
- QA Plan 전체 재작성 필요

**변경 범위**:
- `app/schemas/generator.py` 전체 수정
- `app/services/generator/service.py` 응답 변환 로직 수정
- `test_generator_service.py` 전체 재작성
- A팀 QA Plan v1.1 작성

---

### Option 3: 절충안 - Backend에 Adapter 추가

**방법**:
- Backend에 `/api/v1/generate/v2` 엔드포인트 추가
- Frontend 예상 스키마를 Backend 실제 스키마로 변환하는 Adapter
- 기존 `/api/v1/generate`는 유지 (A팀 QA용)

**장점**:
- 기존 Backend 코드 유지
- Frontend 수정 최소화

**단점**:
- Backend 엔드포인트 2개 유지 필요
- 복잡도 증가

---

## ✅ 권장 사항

**Option 1 (Frontend 수정)** 을 권장합니다.

**이유**:
1. Backend는 이미 완전히 구현되고 테스트됨
2. Frontend는 Mock 데이터로만 테스트되어 변경 영향도 낮음
3. 구조화된 입력이 더 명확하고 검증 가능
4. A팀 QA Plan과 일치

---

## 📋 Frontend 수정 체크리스트

C팀에서 다음 파일을 수정해야 합니다:

- [ ] `.env.local`: `NEXT_PUBLIC_API_BASE_URL=http://localhost:8001`
- [ ] `lib/api/types.ts`: Request/Response 타입 정의 변경
- [ ] `components/canvas-studio/hooks/useGenerate.ts`: `USE_MOCK` 조건 변경
- [ ] `components/canvas-studio/components/ChatPanel.tsx`: 프롬프트 → 구조화 데이터 변환
- [ ] `components/canvas-studio/adapters/response-to-fabric.ts`: 필드명 변경 (`editorDocument` → `document`, `textBlocks` → `text`)

---

## 🧪 Backend 현재 상태 (참고용)

### 실행 중인 서버
```
http://localhost:8001
```

### 테스트 가능한 엔드포인트
```bash
# 1. Kind 목록 조회
curl http://localhost:8001/api/v1/generate/kinds

# 2. Product Detail 생성
curl -X POST http://localhost:8001/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "product_detail",
    "brandId": "brand_demo",
    "input": {
      "product_name": "고급 스킨케어",
      "features": ["히알루론산", "비타민C"],
      "target_audience": "3040 여성"
    }
  }'
```

### CORS 설정
```python
# app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 origin 허용 (개발 환경)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Frontend `localhost:3001` 접근 가능합니다.

---

## 📞 다음 단계

1. **C팀 결정 필요**: Option 1, 2, 3 중 선택
2. **B팀 대기**: C팀 결정에 따라 지원
3. **연결 테스트**: 스키마 정렬 후 E2E 테스트

---

**문서 버전**: v1.0
**작성일**: 2025-11-17
**다음 업데이트**: C팀 결정 후
