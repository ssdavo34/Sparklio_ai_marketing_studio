# Definition of Done - Vertical Slice #1 v1.1

**문서 버전**: v1.1 (B팀 피드백 반영)
**작성일**: 2025-11-17
**최종 수정**: 2025-11-17 16:00
**작성자**: A팀 (QA & PMO)
**승인 상태**:
- ✅ A팀 확정
- ✅ B팀 승인 (조건부, 11-17 15:00)
- ⏳ C팀 검토 대기

**변경 이력**:
- v1.0 → v1.1: Generator API 스키마 변경 반영 (`kind` 기반 통합 API)

---

## 📋 문서 목적

본 문서는 **Vertical Slice #1: "상품 상세 페이지 E2E"**의 **완료 기준(Definition of Done)**을 정의합니다.

**모든 항목이 ✅ 상태가 되어야 Vertical Slice #1이 완료된 것으로 간주합니다.**

---

## 🎯 Vertical Slice #1 목표 (재확인)

**"사용자가 상품 정보를 입력하면, AI가 완성된 1페이지 마케팅 자료를 생성하고, 사용자가 Canvas에서 수정 후 저장/로드할 수 있다"**

**사용자 플로우 7단계**:
1. 상품 정보 입력 (이름, 특징, 타겟)
2. "생성" 버튼 클릭
3. Backend에서 Generator Pipeline 실행
4. Canvas에 완성된 페이지 표시
5. Canvas에서 텍스트 수정
6. "저장" 버튼 클릭
7. 새로고침 후 "불러오기" → 수정 내용 그대로 표시

---

## ✅ Definition of Done 체크리스트

### 1. Backend API (B팀 책임)

#### 1.1 Mock 모드 API
- [ ] **TC-B-M01**: `POST /api/v1/llm/generate` (copywriter, product_detail) - HTTP 200, 응답 < 5초
- [ ] **TC-B-M02**: `POST /api/v1/llm/generate` (strategist, brand_kit) - HTTP 200, 응답 < 5초
- [ ] **TC-B-M03**: `GET /api/v1/llm/health` - HTTP 200, gateway=healthy

**완료 조건**: 위 3개 테스트 **모두 통과** (100% Pass Rate)

---

#### 1.2 Live 모드 API
- [ ] **TC-B-L01**: `POST /api/v1/llm/generate` (copywriter) - HTTP 200, 응답 < 10초, provider=ollama
- [ ] **TC-B-L02**: `POST /api/v1/media/image/generate` (comfyui) - HTTP 200, 응답 < 30초, 이미지 URL 유효
- [ ] **TC-B-L03**: `GET /api/v1/debug/ollama` - HTTP 200, success=true

**완료 조건**: 위 3개 테스트 **모두 통과** (100% Pass Rate)

---

#### 1.3 Generator Pipeline API (Phase 2-2)
- [ ] **TC-B-G01**: `POST /api/v1/generate` (kind=product_detail) - HTTP 200
  - 요청 구조:
    ```json
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
  - 응답 구조 (`backend/app/schemas/generator.py` 참조):
    ```json
    {
      "kind": "product_detail",
      "document": {
        "documentId": "UUID",
        "type": "product_detail",
        "canvas_json": {
          "version": "5.3.0",
          "objects": [...]
        }
      },
      "text": {
        "headline": "string",
        "subheadline": "string",
        "body": "string",
        "bullets": ["string", ...],
        "cta": "string"
      },
      "meta": {
        "workflow": "product_content_pipeline",
        "agents_used": ["copywriter", "reviewer"],
        "elapsed_seconds": 12.35,
        "tokens_used": 350
      }
    }
    ```
  - Mock 모드: 응답 < 30초
  - Live 모드: 응답 < 180초
- [ ] **TC-B-G02**: 잘못된 `kind` 값 → HTTP 400, errorCode="INVALID_REQUEST"
- [ ] **TC-B-G03**: 빈 `input` → HTTP 400, errorCode="VALIDATION_ERROR"

**완료 조건**: 위 3개 테스트 **모두 통과**

---

#### 1.4 Document API (Phase 2-2)
- [ ] **TC-B-D01**: `POST /api/v1/documents` - HTTP 201
  - 요청:
    ```json
    {
      "title": "string",
      "canvas_data": {...},
      "metadata": {...}
    }
    ```
  - 응답:
    ```json
    {
      "document_id": "UUID",
      "created_at": "timestamp"
    }
    ```
  - DB 저장 확인: PostgreSQL에 레코드 존재

- [ ] **TC-B-D02**: `GET /api/v1/documents/{id}` - HTTP 200
  - 응답에 `document_id`, `title`, `canvas_data` 모두 포함
  - `canvas_data`가 저장 시 데이터와 **100% 동일**

- [ ] **TC-B-D03**: `PATCH /api/v1/documents/{id}` - HTTP 200
  - `canvas_data` 수정 후 DB 업데이트 확인
  - `updated_at` 타임스탬프 갱신 확인

- [ ] **TC-B-D04**: `GET /api/v1/documents/nonexistent` - HTTP 404
  - errorCode="NOT_FOUND"

**완료 조건**: 위 4개 테스트 **모두 통과**

---

### 2. Frontend UI (C팀 책임)

#### 2.1 E2E 시나리오 (Playwright)

**E2E-01: 상품 상세 페이지 전체 플로우**
- [ ] Step 1: `/studio` 페이지 접속 → 페이지 로드 < 3초
- [ ] Step 2: 상품 정보 입력 필드 정상 동작
  - 상품명 입력 가능
  - 특징 입력 가능 (최대 500자)
  - 타겟 입력 가능
- [ ] Step 3: "생성" 버튼 클릭 → 로딩 인디케이터 표시
- [ ] Step 4: Canvas에 완성된 페이지 표시
  - 입력한 상품명 포함
  - 입력한 특징 포함
  - 텍스트/이미지 모두 렌더링됨
- [ ] Step 5: Canvas에서 텍스트 수정 가능
  - 더블클릭으로 편집 모드 진입
  - 텍스트 변경 후 Enter로 확정
  - 변경 내용 Canvas에 즉시 반영
- [ ] Step 6: "저장" 버튼 클릭 → 성공 토스트 메시지 표시
- [ ] Step 7: 새로고침 후 "불러오기" → Canvas 복원
  - 수정한 텍스트 그대로 표시
  - 수정 전 원본 텍스트는 표시되지 않음

**완료 조건**: 위 모든 단계 **오류 없이 완주** (3회 연속 성공)

---

**E2E-02: 빈 입력 값 검증**
- [ ] 상품명 비워두고 "생성" 클릭 → 에러 메시지 "상품명을 입력하세요" 표시
- [ ] 특징 비워두고 "생성" 클릭 → 에러 메시지 표시
- [ ] 에러 메시지는 사용자 친화적 (한글, 명확한 안내)

**완료 조건**: 위 모든 에러 케이스 **정상 동작**

---

**E2E-03: Backend 연결 실패 시**
- [ ] Backend 서버 중지 상태에서 "생성" 클릭 → "서버 연결 실패" 토스트 표시
- [ ] 재시도 버튼 또는 안내 표시

**완료 조건**: 적절한 에러 핸들링

---

#### 2.2 UI/UX 기준
- [ ] **접근성**: 키보드 내비게이션 가능 (Tab, Enter, Esc)
- [ ] **반응성**: 모바일/태블릿에서도 정상 동작 (최소 1024px 이상)
- [ ] **성능**: Canvas 렌더링 < 2초
- [ ] **일관성**: Sparklio 디자인 시스템 준수 (색상, 폰트, 간격)

---

### 3. 성능 기준 (A팀 검증)

#### 3.1 응답 시간

| 항목 | Mock 모드 | Live 모드 | 측정 방법 |
|------|----------|----------|---------|
| **LLM Gateway 호출** | < 5초 | < 10초 | Playwright `waitForResponse()` |
| **Media Gateway 호출** | < 5초 | < 30초 | Playwright `waitForResponse()` |
| **Generator Pipeline 전체** | < 30초 | < 180초 | Playwright E2E |
| **Document 저장** | < 2초 | < 2초 | Playwright `waitForResponse()` |
| **Document 로드** | < 2초 | < 2초 | Playwright `waitForResponse()` |
| **Canvas 렌더링** | < 2초 | < 2초 | Playwright `waitForSelector()` |

**완료 조건**: 모든 항목 **기준 시간 내 응답** (p95 기준)

---

#### 3.2 부하 테스트 (Artillery)
- [ ] **동시 접속**: 5명/초 × 1분 → 에러율 < 1%
- [ ] **메모리 누수**: 10회 연속 실행 → 메모리 증가율 < 10%
- [ ] **DB 연결**: 100회 Document 저장 → 모두 성공

**완료 조건**: 위 모든 기준 충족

---

### 4. 데이터 무결성 (A/B/C팀 공동 검증)

#### 4.1 Canvas 데이터 일치성
- [ ] **저장 전 vs 저장 후**: `canvas_data` JSON 100% 동일
- [ ] **로드 후 복원**: Canvas에 표시된 내용이 저장 시점과 동일
  - 텍스트 내용 일치
  - 텍스트 위치(x, y) 일치
  - 텍스트 스타일(폰트, 크기, 색상) 일치
  - 이미지 URL 동일
  - 레이어 순서 동일

**검증 방법**:
```javascript
// 저장 전
const beforeSave = JSON.stringify(canvas.toJSON());

// 저장 API 호출
await saveDocument();

// 로드 API 호출
const loaded = await loadDocument(documentId);

// 비교
expect(loaded.canvas_data).toEqual(JSON.parse(beforeSave));
```

**완료 조건**: 3회 연속 테스트에서 **100% 일치**

---

#### 4.2 수정 내용 영속성
- [ ] **시나리오**:
  1. 텍스트 "A" → "B"로 수정
  2. 저장
  3. 브라우저 종료
  4. 다음 날 접속 후 로드
  5. 텍스트 여전히 "B"로 표시

**완료 조건**: 24시간 후에도 데이터 유지

---

### 5. 에러 처리 (A/B/C팀 공동 검증)

#### 5.1 Backend 에러 처리
- [ ] **Validation Error**: HTTP 400, 명확한 errorCode 및 message
- [ ] **Not Found**: HTTP 404, "문서를 찾을 수 없습니다" 메시지
- [ ] **Server Error**: HTTP 500, "일시적인 오류입니다. 잠시 후 다시 시도하세요" 메시지
- [ ] **Timeout**: 180초 초과 시 → 적절한 타임아웃 에러

**완료 조건**: 모든 에러 케이스에 **사용자 친화적 메시지** 표시

---

#### 5.2 Frontend 에러 처리
- [ ] **네트워크 오류**: "인터넷 연결을 확인하세요" 메시지
- [ ] **Canvas 렌더링 실패**: "일부 요소를 표시할 수 없습니다" 경고
- [ ] **저장 실패**: "저장 실패. 다시 시도하시겠습니까?" + 재시도 버튼

**완료 조건**: 모든 에러에 **복구 방안** 제시

---

### 6. 문서화 (A팀 책임)

#### 6.1 필수 문서
- [x] **QA Plan v1.0** - `VERTICAL_SLICE_1_QA_PLAN.md`
- [x] **Definition of Done v1.0** - 본 문서
- [ ] **테스트 결과 리포트** - `VERTICAL_SLICE_1_TEST_REPORT.md` (11-28 작성)
- [ ] **최종 검증 리포트** - `VERTICAL_SLICE_1_FINAL_VERIFICATION.md` (11-29 작성)

---

#### 6.2 코드 문서화
- [ ] Backend API 엔드포인트: OpenAPI 3.0 스펙 작성
- [ ] Frontend 컴포넌트: JSDoc 또는 TypeScript 타입 정의
- [ ] 테스트 코드: 각 테스트 케이스에 명확한 주석

---

### 7. 팀 간 합의 (A/B/C팀 공동)

#### 7.1 B팀 승인
- [ ] **Phase 2-2 완료 선언**: Generator Pipeline API 배포
- [ ] **Document API 완료 선언**: CRUD API 정상 동작
- [ ] **B팀 리뷰**: 본 DoD 검토 및 서명

**담당자**: B팀 Team Lead
**예정일**: 2025-11-22

---

#### 7.2 C팀 승인
- [ ] **Frontend 연동 완료 선언**: Backend API 연동 완료
- [ ] **Canvas 저장/로드 구현 완료**: UI 정상 동작
- [ ] **C팀 리뷰**: 본 DoD 검토 및 서명

**담당자**: C팀 Team Lead
**예정일**: 2025-11-24

---

#### 7.3 A팀 최종 검증
- [ ] **모든 테스트 케이스 실행** (Mock + Live 모드)
- [ ] **E2E 시나리오 3회 연속 성공**
- [ ] **성능 기준 충족 확인**
- [ ] **최종 검증 리포트 작성**

**담당자**: A팀 QA Lead
**예정일**: 2025-11-28

---

## 📊 완료 기준 요약 (한눈에 보기)

### ✅ 필수 조건 (하나라도 실패 시 미완료)

| 카테고리 | 항목 | 기준 |
|---------|------|------|
| **Backend API** | Mock 모드 테스트 | 100% Pass (3/3) |
| **Backend API** | Live 모드 테스트 | 100% Pass (3/3) |
| **Backend API** | Generator Pipeline | 100% Pass (3/3) |
| **Backend API** | Document API | 100% Pass (4/4) |
| **Frontend E2E** | 전체 플로우 | 3회 연속 성공 |
| **Frontend E2E** | 에러 케이스 | 모두 정상 동작 |
| **성능** | Mock 모드 | < 30초 (p95) |
| **성능** | Live 모드 | < 180초 (p95) |
| **데이터 무결성** | Canvas 데이터 일치 | 100% 일치 |
| **에러 처리** | 사용자 친화적 메시지 | 모든 에러 케이스 |
| **문서화** | QA Plan, DoD, 리포트 | 모두 작성 완료 |
| **팀 합의** | B/C/A팀 서명 | 3개 팀 모두 승인 |

---

## 🎯 최종 완료 조건

**Vertical Slice #1이 완료되었다고 선언하려면**:

1. ✅ 위 체크리스트 **모든 항목 체크**
2. ✅ B팀 Team Lead 서명
3. ✅ C팀 Team Lead 서명
4. ✅ A팀 QA Lead 최종 검증 및 서명
5. ✅ **최종 검증 리포트** 작성 및 공유

**완료 선언 예정일**: **2025-11-29 (금) 17:00**

---

## 📋 서명란

### B팀 (Backend) 승인
- [ ] **서명자**: B팀 Team Lead
- [ ] **승인일**: 2025-11-__ __:__
- [ ] **의견**:

---

### C팀 (Frontend) 승인
- [ ] **서명자**: C팀 Team Lead
- [ ] **승인일**: 2025-11-__ __:__
- [ ] **의견**:

---

### A팀 (QA) 최종 검증
- [ ] **검증자**: A팀 QA Lead
- [ ] **검증일**: 2025-11-__ __:__
- [ ] **최종 판정**: ⬜ 완료 / ⬜ 미완료
- [ ] **의견**:

---

## 📚 관련 문서

- [VERTICAL_SLICE_1_QA_PLAN.md](./VERTICAL_SLICE_1_QA_PLAN.md) - QA 전략 및 테스트 범위
- [CURRENT_PHASE.md](../plans/CURRENT_PHASE.md) - 현재 Phase 상태
- [종합 공정 보고서](../A_TEAM_COMPREHENSIVE_PROGRESS_REPORT_2025_11_17.md)

---

**문서 버전**: v1.1
**최종 업데이트**: 2025-11-17 16:00
**변경 사항**: Generator API 스키마 변경 반영 (`kind` 기반 통합 API)
**다음 업데이트**: C팀 검토 후 필요 시
**문의**: A팀 QA & PMO
