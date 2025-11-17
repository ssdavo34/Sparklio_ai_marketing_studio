# B팀 QA Plan 검토 의견

**문서**: VERTICAL_SLICE_1_QA_PLAN.md v1.0
**검토일**: 2025-11-17
**검토자**: B팀 (Backend)
**상태**: ✅ 승인 (조건부)

---

## 📊 검토 결과 요약

### 1. Backend API 테스트 케이스 13개 검토

**결론**: ✅ **합리적이며 달성 가능**

**세부 의견**:
- ✅ TC-B-M01~M03 (Mock LLM): 달성 가능
- ✅ TC-B-L01~L03 (Live LLM): 달성 가능 (Ollama 연동 완료)
- ✅ TC-B-M04~M06 (Mock Media): 달성 가능
- ✅ TC-B-L04 (Live Media): 조건부 달성 (ComfyUI 연결 필요)
- ✅ TC-B-M07~M10 (Generator API): **오늘 완료** (Phase 2-3)
- ✅ TC-B-M11~M13 (Document API): 이미 구현됨

**추가 제안**:
- ⚠️ TC-B-M07 `/api/v1/generate`의 요청 스키마가 변경되었습니다
  - 기존: `role`, `task` 분리
  - 신규: `kind`, `brandId`, `input` 통합
  - 예시 참고: `app/schemas/generator.py`

---

### 2. 성능 기준 검토

**결론**: ✅ **달성 가능**

| 모드 | 목표 | B팀 검증 결과 | 상태 |
|------|------|--------------|------|
| Mock | < 30초 | 예상 10-15초 | ✅ 달성 가능 |
| Live | < 180초 | 예상 30-60초 | ✅ 여유 있음 |

**근거**:
- Phase 2-3 Orchestrator 테스트 결과:
  - Product Content Workflow (3 steps): **12.35초**
  - Brand Identity Workflow (3 steps): **22.23초**
  - Content Review Workflow (3 steps): **13.04초**
- Mock 모드는 실제 LLM 호출 없이 즉시 응답
- Live 모드는 Ollama (qwen2.5:7b) 기준 step당 5-10초

**추가 의견**:
- ComfyUI 이미지 생성은 30-60초 소요될 수 있음 (GPU 성능에 따라)
- 첫 호출은 모델 로딩으로 느릴 수 있음 (warm-up 필요)

---

### 3. Definition of Done 체크리스트 검토

**결론**: ✅ **적절함**

**수정 제안**:

#### 수정 1: Generator API 스키마 변경 반영

**기존 (VERTICAL_SLICE_1_QA_PLAN.md)**:
```
POST /api/v1/generate
{
  "role": "copywriter",
  "task": "product_detail",
  "input": {...}
}
```

**신규 (실제 구현)**:
```
POST /api/v1/generate
{
  "kind": "product_detail",
  "brandId": "brand_demo",
  "input": {
    "product_name": "무선 이어폰",
    "features": ["노이즈캔슬링", "24시간 배터리"],
    "target_audience": "2030 직장인"
  },
  "options": {
    "tone": "professional",
    "length": "medium"
  }
}
```

**변경 이유**:
- B팀 지침에 따라 프론트가 2개 API만 알면 되도록 통합
- `kind`로 워크플로우 자동 선택 (role/task 분리 제거)
- 브랜드 컨텍스트 명시 (`brandId`)

#### 수정 2: 지원 kind 목록 명시

**현재 지원 (Phase 2-3 완료)**:
- `product_detail`: 제품 상세 콘텐츠 생성
- `sns_set`: SNS 콘텐츠 세트 생성
- `presentation_simple`: 간단한 프레젠테이션 생성
- `brand_identity`: 브랜드 아이덴티티 수립
- `content_review`: 콘텐츠 검토 및 개선

---

## 🎯 B팀 현재 구현 상태

### ✅ 완료된 항목 (2025-11-17 기준)

1. ✅ **Phase 1**: LLM Gateway + Media Gateway
   - Ollama Provider (Live)
   - Mock Provider (Mock)
   - ComfyUI Provider (Live, 연결 대기)

2. ✅ **Phase 2-1**: 6개 Agent 구현
   - Copywriter, Strategist, Designer, Reviewer, Optimizer, Editor

3. ✅ **Phase 2-2**: Agent API 엔드포인트
   - `/api/v1/agents/{agent_name}/execute`
   - `/api/v1/agents/list`
   - `/api/v1/agents/{agent_name}/info`

4. ✅ **Phase 2-3**: Agent 오케스트레이션
   - WorkflowExecutor (순차/병렬 실행)
   - 3개 사전 정의 워크플로우
   - 템플릿 치환 시스템

5. ✅ **P0: Generator 오케스트레이션** (오늘 완료)
   - GeneratorService 구현
   - `/api/v1/generate` v2 엔드포인트
   - 5개 kind 지원

6. ✅ **Document API**
   - `POST /api/v1/documents/{docId}/save`
   - `GET /api/v1/documents/{docId}`
   - `PATCH /api/v1/documents/{docId}`

### ⏸️ 남은 작업

1. ⏸️ GeneratorService 테스트 작성
2. ⏸️ ComfyUI 연결 및 검증
3. ⏸️ Mac Mini 서버 배포

---

## 💬 A팀에게 전달 사항

### 1. 테스트 케이스 업데이트 필요

**TC-B-M07~M10 (Generator API)** 스키마 변경:
```diff
- POST /api/v1/generate
- { "role": "copywriter", "task": "product_detail", ... }

+ POST /api/v1/generate
+ { "kind": "product_detail", "brandId": "brand_demo", "input": {...} }
```

### 2. 프론트엔드 인터페이스 확정

**C팀과 공유할 스키마**:
- Request: `app/schemas/generator.py` - `GenerateRequest`
- Response: `app/schemas/generator.py` - `GenerateResponse`

### 3. Swagger UI 확인 가능

```
http://localhost:8001/docs
```
- **generate** 태그에서 `/api/v1/generate` 엔드포인트 확인
- "Try it out" 기능으로 직접 테스트 가능

---

## ✅ 승인 조건

다음 조건으로 QA Plan v1.0을 **승인**합니다:

1. ✅ Generator API 스키마를 v1.1에 반영
2. ✅ ComfyUI 연결은 선택 사항 (Mock 모드로 우선 진행 가능)
3. ✅ 성능 기준은 현실적이며 달성 가능

---

**검토 완료일**: 2025-11-17
**다음 단계**: A팀이 v1.1 업데이트 후 전체 팀 합의
