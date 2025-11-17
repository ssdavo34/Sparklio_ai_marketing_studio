# Vertical Slice #1 QA Plan v1.1

**문서 버전**: v1.1 (B팀 피드백 반영)
**작성일**: 2025-11-17
**최종 수정**: 2025-11-17 15:30
**작성자**: A팀 (QA & PMO)
**승인 상태**:
- ✅ A팀 확정
- ✅ B팀 승인 (조건부, 11-17 15:00)
- ⏳ C팀 검토 대기

**변경 이력**:
- v1.0 → v1.1: Generator API 스키마 변경 반영 (`kind` 기반 통합 API)

---

## 📋 문서 목적

본 문서는 **Vertical Slice #1: "상품 상세 페이지 E2E"**의 QA 전략, 테스트 범위, 성공 기준을 정의합니다.

**이 문서가 확정되면**:
- B팀은 이 기준으로 Backend API를 구현
- C팀은 이 기준으로 Frontend UI를 구현
- A팀은 이 기준으로 최종 검증을 수행

---

## 🎯 Vertical Slice #1 개요

### 목표
**"사용자가 상품 정보를 입력하면, AI가 완성된 1페이지 마케팅 자료를 생성하고, 사용자가 Canvas에서 수정 후 저장/로드할 수 있다"**

### 범위
이것은 **Sparklio의 첫 번째 End-to-End 플로우**이며, 이후 모든 기능의 기준이 됩니다.

### 사용자 플로우 (7단계)
```
1. 사용자가 "상품 이름: 무선 이어폰" 입력
2. "특징: 노이즈캔슬링, 24시간 배터리, IPX7 방수" 입력
3. "타겟: 2030 직장인" 입력
4. "생성" 버튼 클릭
   → Backend: POST /api/v1/generate
      {
        "kind": "product_detail",
        "brandId": "brand_demo",
        "input": {
          "product_name": "무선 이어폰",
          "features": ["노이즈캔슬링", "24시간 배터리", "IPX7 방수"],
          "target_audience": "2030 직장인"
        }
      }
   → Generator Pipeline 실행 (Brief → Brand → ... → Designer)
   → Response: {document: {...}, text: {...}, meta: {...}}
   → Canvas에 텍스트/이미지 배치
5. 사용자가 Canvas에서 텍스트 일부 수정 ("24시간" → "30시간")
6. "저장" 버튼 클릭
   → Backend: POST /api/v1/documents
7. 페이지 새로고침 후 "불러오기"
   → Backend: GET /api/v1/documents/{id}
   → Canvas에 동일하게 복원 (수정 내용 포함)
```

---

## 📊 테스트 전략

### 1. 테스트 레벨

| 레벨 | 담당 | 도구 | 목적 |
|------|------|------|------|
| **Unit Tests** | B팀 + C팀 | pytest, Jest | 개별 함수/컴포넌트 검증 |
| **Integration Tests** | B팀 + C팀 | pytest, React Testing Library | 모듈 간 연동 검증 |
| **API Tests** | A팀 | Playwright / pytest | Backend API 엔드포인트 검증 |
| **E2E Tests** | A팀 | Playwright | 전체 사용자 플로우 검증 |
| **Performance Tests** | A팀 | Artillery | 응답 시간 및 부하 검증 |

### 2. 테스트 모드

#### Mock 모드
- **목적**: 빠른 개발 및 테스트
- **범위**: LLM/Media Gateway는 Mock 응답 반환
- **목표 응답 시간**: 전체 플로우 < 30초

#### Live 모드
- **목적**: 실제 환경 검증
- **범위**: 실제 Ollama/ComfyUI 호출
- **목표 응답 시간**: 전체 플로우 < 3분

---

## 🧪 테스트 범위 상세

### A. Backend API 테스트

#### A-1. Mock 모드 API 테스트

**목적**: Backend API가 문서 스펙대로 동작하는지 검증 (실제 LLM/Media 연결 없이)

**테스트 케이스**:

| TC ID | 엔드포인트 | 메서드 | 요청 | 예상 응답 | 성공 기준 |
|-------|----------|--------|------|----------|---------|
| **TC-B-M01** | `/api/v1/llm/generate` | POST | `role=copywriter, task=product_detail` | `provider=mock, output=JSON` | HTTP 200, 응답 시간 < 5초 |
| **TC-B-M02** | `/api/v1/llm/generate` | POST | `role=strategist, task=brand_kit` | `provider=mock, output=JSON` | HTTP 200, 응답 시간 < 5초 |
| **TC-B-M03** | `/api/v1/llm/health` | GET | - | `gateway=healthy, mode=mock` | HTTP 200 |

**구현 위치**: `tests/backend/test_api_mock_mode.py`

---

#### A-2. Live 모드 API 테스트

**목적**: 실제 Ollama/ComfyUI 연동 검증

**전제 조건**:
- ✅ Phase 1 Live 모드 검증 완료
- ✅ Desktop Ollama 서버 실행 중 (`100.120.180.42:11434`)
- ✅ Desktop ComfyUI 서버 실행 중 (`100.120.180.42:8188`)

**테스트 케이스**:

| TC ID | 엔드포인트 | 메서드 | 요청 | 예상 응답 | 성공 기준 |
|-------|----------|--------|------|----------|---------|
| **TC-B-L01** | `/api/v1/llm/generate` | POST | `role=copywriter, task=product_detail` | `provider=ollama, model=qwen2.5:7b` | HTTP 200, 응답 시간 < 10초, 실제 텍스트 생성 |
| **TC-B-L02** | `/api/v1/media/image/generate` | POST | `provider=comfyui, kind=product_shot` | `provider=comfyui, image_url 존재` | HTTP 200, 응답 시간 < 30초, 이미지 URL 유효 |
| **TC-B-L03** | `/api/v1/debug/ollama` | GET | - | `success=true, models 리스트 존재` | HTTP 200, Ollama 연결 성공 |

**구현 위치**: `tests/backend/test_api_live_mode.py`

---

#### A-3. Generator Pipeline 테스트 (Phase 2-2 완료 후)

**목적**: `/api/v1/generate` 통합 API 검증

**지원 kind 값**:
- `product_detail`: 상품 상세 페이지
- `sns_set`: SNS 콘텐츠 세트 (향후)
- `presentation_simple`: 간단한 프레젠테이션 (향후)
- `brand_identity`: 브랜드 아이덴티티 (향후)
- `content_review`: 콘텐츠 리뷰 (향후)

**테스트 케이스**:

| TC ID | 엔드포인트 | 메서드 | 요청 예시 | 예상 응답 | 성공 기준 |
|-------|----------|--------|---------|----------|---------|
| **TC-B-G01** | `/api/v1/generate` | POST | `{"kind":"product_detail", "brandId":"brand_demo", "input":{"product_name":"무선 이어폰", "features":["노이즈캔슬링","24시간 배터리"], "target_audience":"2030 직장인"}}` | `{"kind":"product_detail", "document":{...}, "text":{...}, "meta":{...}}` | HTTP 200, Mock < 30초, Live < 180초, document.canvas_json 존재 |
| **TC-B-G02** | `/api/v1/generate` | POST | `{"kind":"invalid_kind", ...}` | `{"error":"validation_error", "detail":"..."}` | HTTP 400 |
| **TC-B-G03** | `/api/v1/generate` | POST | `{"kind":"product_detail", "brandId":"brand_demo", "input":{}}` | `{"error":"validation_error", "detail":"..."}` | HTTP 400 |

**스키마 참조**: `backend/app/schemas/generator.py` - `GenerateRequest`, `GenerateResponse`

**구현 위치**: `tests/backend/test_generator_pipeline.py`

---

#### A-4. Document API 테스트 (Phase 2-2 완료 후)

**목적**: 문서 생성/조회/수정 API 검증

**테스트 케이스**:

| TC ID | 엔드포인트 | 메서드 | 요청 | 예상 응답 | 성공 기준 |
|-------|----------|--------|------|----------|---------|
| **TC-B-D01** | `/api/v1/documents` | POST | `title, canvas_data, metadata` | `document_id, created_at` | HTTP 201, DB 저장 확인 |
| **TC-B-D02** | `/api/v1/documents/{id}` | GET | - | `document_id, title, canvas_data` | HTTP 200, 데이터 일치 |
| **TC-B-D03** | `/api/v1/documents/{id}` | PATCH | `canvas_data 수정` | `document_id, updated_at` | HTTP 200, DB 업데이트 확인 |
| **TC-B-D04** | `/api/v1/documents/nonexistent` | GET | - | `error=not_found` | HTTP 404 |

**구현 위치**: `tests/backend/test_document_api.py`

---

### B. Frontend E2E 테스트

#### B-1. E2E 시나리오 (Playwright)

**목적**: 실제 사용자 플로우 전체 검증

**시나리오 1: 상품 상세 페이지 생성 및 저장**

```typescript
// tests/frontend/e2e/test_vertical_slice_1.spec.ts

test('E2E-01: 상품 상세 페이지 전체 플로우', async ({ page }) => {
  // Step 1: 페이지 접속
  await page.goto('http://localhost:3000/studio');
  await expect(page).toHaveTitle(/Sparklio/);

  // Step 2: 상품 정보 입력
  await page.fill('#product-name', '무선 이어폰');
  await page.fill('#product-features', '노이즈캔슬링, 24시간 배터리, IPX7 방수');
  await page.fill('#target-audience', '2030 직장인');

  // Step 3: 생성 버튼 클릭
  await page.click('button:has-text("생성")');

  // Step 4: 로딩 대기 (Mock: 30초, Live: 180초)
  await page.waitForSelector('.canvas-loaded', { timeout: 180000 });

  // Step 5: Canvas에 텍스트 존재 확인
  const canvasText = await page.textContent('.canvas-viewport');
  expect(canvasText).toContain('무선 이어폰');
  expect(canvasText).toContain('24시간 배터리');

  // Step 6: 텍스트 수정 ("24시간" → "30시간")
  await page.dblclick('text=24시간 배터리');
  await page.keyboard.type('30시간 배터리');
  await page.keyboard.press('Enter');

  // Step 7: 저장 버튼 클릭
  await page.click('button:has-text("저장")');
  await expect(page.locator('.toast-success')).toContainText('저장 완료');

  // Step 8: Document ID 추출
  const url = page.url();
  const documentId = url.match(/\/documents\/(\w+)/)?.[1];
  expect(documentId).toBeTruthy();

  // Step 9: 페이지 새로고침
  await page.reload();

  // Step 10: Canvas 복원 확인 (수정 내용 포함)
  await page.waitForSelector('.canvas-loaded');
  const reloadedText = await page.textContent('.canvas-viewport');
  expect(reloadedText).toContain('30시간 배터리'); // 수정된 내용
  expect(reloadedText).not.toContain('24시간 배터리'); // 원본 내용 없음
});
```

**성공 기준**:
- ✅ 모든 단계 오류 없이 완주
- ✅ Mock 모드: 전체 플로우 < 30초
- ✅ Live 모드: 전체 플로우 < 180초
- ✅ 수정 내용("30시간")이 저장 후 로드 시 동일하게 표시

---

#### B-2. 에러 케이스 시나리오

**시나리오 2: 빈 입력 값 검증**

```typescript
test('E2E-02: 빈 상품명 입력 시 에러 표시', async ({ page }) => {
  await page.goto('http://localhost:3000/studio');

  // 상품명 비워두고 생성 시도
  await page.fill('#product-name', '');
  await page.click('button:has-text("생성")');

  // 에러 메시지 표시 확인
  await expect(page.locator('.error-message')).toContainText('상품명을 입력하세요');
});
```

**시나리오 3: Backend 연결 실패 시**

```typescript
test('E2E-03: Backend 오류 시 사용자 친화적 에러 표시', async ({ page }) => {
  // Backend 서버 중지 상태에서 테스트
  await page.goto('http://localhost:3000/studio');
  await page.fill('#product-name', '무선 이어폰');
  await page.click('button:has-text("생성")');

  // 적절한 에러 메시지 표시
  await expect(page.locator('.error-toast')).toContainText('서버 연결 실패');
});
```

---

### C. 성능 테스트

#### C-1. 응답 시간 검증

**도구**: Artillery

**시나리오**:
```yaml
# tests/performance/vertical_slice_1.yml
config:
  target: 'http://localhost:8001'
  phases:
    - duration: 60
      arrivalRate: 5 # 1분간 5명/초

scenarios:
  - name: "상품 상세 페이지 생성"
    flow:
      - post:
          url: "/api/v1/generate"
          json:
            kind: "product_detail"
            brandId: "brand_demo"
            input:
              product_name: "무선 이어폰"
              features: ["노이즈캔슬링", "24시간 배터리"]
              target_audience: "2030 직장인"
            options:
              tone: "professional"
              length: "medium"
```

**성공 기준**:
- Mock 모드: p95 < 30초
- Live 모드: p95 < 180초
- 에러율 < 1%

---

## ✅ Definition of Done (상세)

**이 섹션은 별도 문서 [DEFINITION_OF_DONE_VERTICAL_SLICE_1.md](./DEFINITION_OF_DONE_VERTICAL_SLICE_1.md)에 정의**

간략 요약:
- [ ] 모든 Backend API 테스트 (TC-B-*) 통과
- [ ] 모든 Frontend E2E 시나리오 통과
- [ ] 성능 기준 충족 (Mock < 30초, Live < 180초)
- [ ] 저장/로드 후 데이터 일치
- [ ] A/B/C팀 합의된 성공 기준 모두 충족

---

## 📅 테스트 일정

| 날짜 | 담당 | 작업 | 산출물 |
|------|------|------|--------|
| **11-17 (일)** | A팀 | QA 플랜 v1.0 확정 | 본 문서 ✅ |
| **11-18 (월)** | A팀 | Backend API Mock 테스트 작성 | `test_api_mock_mode.py` |
| **11-19 (화)** | B팀 | Generator Pipeline 구현 시작 | - |
| **11-20 (수)** | A팀 | Backend API Live 테스트 작성 | `test_api_live_mode.py` |
| **11-22 (금)** | B팀 | Generator Pipeline 완료 | API 배포 |
| **11-25 (월)** | A팀 | Generator Pipeline 테스트 실행 | 테스트 결과 리포트 |
| **11-26 (화)** | A팀 | Frontend E2E 시나리오 실행 | E2E 결과 리포트 |
| **11-27 (수)** | 전체 | 버그 수정 및 재테스트 | - |
| **11-28 (목)** | A팀 | 최종 QA 및 DoD 확인 | 최종 검증 리포트 |
| **11-29 (금)** | 전체 | Vertical Slice #1 완료 선언 | ✅ |

---

## 🚨 테스트 블로커 및 전제 조건

### 전제 조건

**Backend (B팀)**:
- [x] Phase 1 완료 (LLM/Media Gateway)
- [x] Phase 2-1 완료 (Agent Client)
- [ ] Phase 2-2 완료 (Generator Pipeline) - **11-22 예정**
- [ ] Document API 구현 - **11-25 예정**

**Frontend (C팀)**:
- [x] Canvas Studio v3 Phase 1~3 완료
- [ ] Backend API Client 작성 - **11-21 예정**
- [ ] Chat → Canvas 연동 - **11-22~24 예정**
- [ ] 문서 저장/로드 UI - **11-26~27 예정**

**Infrastructure**:
- [ ] 맥미니 Backend API 정상 배포
- [ ] Desktop Ollama 서버 실행 중
- [ ] Desktop ComfyUI 서버 실행 중
- [ ] Tailscale VPN 연결 안정

### 블로커

- ~~Windows 환경변수 캐싱~~ ✅ 해결 완료 (11-17)
- 맥미니 동기화 지연 (EOD 프로세스 확립 필요)

---

## 📋 체크리스트 (A팀 실행)

### 준비 단계
- [x] QA 플랜 v1.0 작성 (본 문서)
- [ ] Definition of Done v1.0 작성
- [ ] B/C팀 검토 및 합의

### 테스트 작성 단계
- [ ] Backend API Mock 테스트 작성 (11-18)
- [ ] Backend API Live 테스트 작성 (11-20)
- [ ] Generator Pipeline 테스트 작성 (11-22~25)
- [ ] Document API 테스트 작성 (11-22~25)
- [ ] Frontend E2E 시나리오 작성 (11-25~26)

### 실행 단계
- [ ] Mock 모드 전체 테스트 실행
- [ ] Live 모드 전체 테스트 실행
- [ ] E2E 시나리오 전체 실행
- [ ] 성능 테스트 실행

### 검증 단계
- [ ] 모든 테스트 통과 확인
- [ ] Definition of Done 체크리스트 확인
- [ ] 최종 검증 리포트 작성
- [ ] Vertical Slice #1 완료 선언

---

## 📚 관련 문서

- [DEFINITION_OF_DONE_VERTICAL_SLICE_1.md](./DEFINITION_OF_DONE_VERTICAL_SLICE_1.md) - 성공 기준 상세
- [CURRENT_PHASE.md](../plans/CURRENT_PHASE.md) - 현재 Phase 상태
- [종합 공정 보고서](../A_TEAM_COMPREHENSIVE_PROGRESS_REPORT_2025_11_17.md)
- [ARCH-001: System Overview](../architecture/001_SYSTEM_OVERVIEW.md)
- [ARCH-002: Gateway Pattern](../architecture/002_GATEWAY_PATTERN.md)

---

**문서 버전**: v1.1
**최종 업데이트**: 2025-11-17 16:00
**변경 사항**: Generator API 스키마 변경 반영 (`kind` 기반 통합 API)
**다음 업데이트**: C팀 검토 후 필요 시
**문의**: A팀 QA & PMO
