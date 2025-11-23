# A/B/C팀 작업 TODO
**작성일**: 2025-11-23
**기준 문서**: v2 설계 문서 (TASK_SCHEMA_CATALOG_V2, CONTENT_PLAN_TO_PAGES_SPEC_V2, A_TEAM_QUALITY_VALIDATION_REPORT)

---

## A팀 TODO (QA & Architecture)

### P0 - 긴급 작업 (이번 주 완료 필수)

#### 1. CopywriterAgent 프롬프트 재작성
**현재 문제**: Pass Rate 0%, 평균 점수 3.3/10
**목표**: Pass Rate ≥ 70%, 평균 점수 ≥ 7.0/10

**작업 항목**:
- [ ] **시스템 프롬프트 재작성**
  - [ ] "제품명을 그대로 사용하지 마라" 명시
  - [ ] "subheadline에 '제품 설명' 금지" 명시
  - [ ] "모든 출력은 한국어로만 작성" 명시
  - [ ] 각 필드별 길이 제약 명시 (headline 20자, subheadline 30자, body 80자 등)

- [ ] **Few-shot 예시 추가** (Golden Set에서 선별)
  - [ ] 테크 제품 예시 2개
  - [ ] 뷰티 제품 예시 1개
  - [ ] 패션/스포츠 예시 1개
  - [ ] 식품/헬스케어 예시 1개
  - [ ] 최소 5개 모범 답안 포함

- [ ] **금지 규칙 명문화**
  - [ ] Headline 금지: 제품명 그대로, 카테고리명만
  - [ ] Subheadline 금지: "제품 설명", "상세 설명", "상품 소개"
  - [ ] Body 금지: 중국어/일본어/영어 문장 혼입

**완료 기준**:
- Golden Set 10개 케이스 중 7개 이상 Pass (≥ 7.0/10 점수)
- Critical Failures 0건 (언어 혼입, JSON 파싱 실패 없음)

**담당**: A팀
**기한**: 2025-11-25
**파일**: `backend/app/agents/copywriter_agent.py` (시스템 프롬프트 부분)

---

#### 2. Golden Set 확장 (10개 → 20개)
**현재 상태**: 10개 케이스 (카테고리 편중)
**목표**: 20개 케이스 (균형 잡힌 카테고리 분포)

**작업 항목**:
- [ ] **카테고리별 케이스 추가**
  - [ ] 테크: 3개 → 4개 (스마트워치 추가)
  - [ ] 뷰티: 1개 → 3개 (립스틱, 클렌저 추가)
  - [ ] 패션/스포츠: 2개 → 3개 (운동화 추가)
  - [ ] 헬스케어: 1개 → 3개 (비타민, 단백질 보충제 추가)
  - [ ] 식품: 1개 → 2개 (스낵 추가)
  - [ ] 럭셔리: 1개 → 2개 (시계 추가)
  - [ ] 기타: 1개 → 3개 (가전, 반려동물용품 추가)

- [ ] **Edge Case 추가**
  - [ ] 제품명이 긴 경우 (30자 이상)
  - [ ] USP가 5개인 경우
  - [ ] 브랜드 톤이 luxury인 경우
  - [ ] 가격대가 budget인 경우

**완료 기준**:
- 총 20개 케이스 작성 완료
- 각 케이스마다 expected_output과 scoring_criteria 정의
- 카테고리별 최소 2개씩 확보

**담당**: A팀
**기한**: 2025-11-26
**파일**: `backend/tests/golden_sets/copywriter/ad_copy_simple_golden_set.json`

---

#### 3. Validation & Sanitize 규칙 정의
**현재 문제**: 길이 초과, 금지어 사용, 언어 혼입을 체크하지 못함
**목표**: 4단계 Validation Pipeline 완전 정의

**작업 항목**:
- [ ] **Pre-validation 규칙 작성**
  - [ ] product_name 필수 체크
  - [ ] usps 최소 2개 체크
  - [ ] brand_tone enum 값 체크

- [ ] **Post-validation 규칙 작성**
  - [ ] 길이 초과 체크 (각 필드별)
  - [ ] 금지 패턴 체크 (headline, subheadline)
  - [ ] 한국어 비율 체크 (body ≥ 90%)
  - [ ] JSON 파싱 성공 여부 체크

- [ ] **Auto-fix (Sanitize) 규칙 작성**
  - [ ] 길이 초과 시 trim 전략
  - [ ] "제품 설명" 발견 시 fallback 생성 로직
  - [ ] 언어 혼입 발견 시 재생성 요청

**완료 기준**:
- TASK_SCHEMA_CATALOG_V2.md의 Validation 섹션 완전 구현 가능 수준
- B팀에게 전달 가능한 상세 스펙

**담당**: A팀
**기한**: 2025-11-27
**문서**: `docs/TASK_SCHEMA_CATALOG_V2.md` (섹션 1.2 참조)

---

### P1 - 단기 작업 (다음 주)

#### 4. copywriter.content_plan 스키마 확정
**현재 상태**: 초안 완성, Golden Set 미작성
**목표**: B팀 구현 가능한 수준의 스펙 확정

**작업 항목**:
- [ ] **Input Schema 검토**
  - [ ] campaign_type 필드 추가 여부 결정
  - [ ] duration, budget 필드 필수/선택 결정
  - [ ] audience 필드 세부 정의

- [ ] **Output Schema 검토**
  - [ ] content_elements.type 값을 영어로 통일 (text, image, video, list)
  - [ ] measurement_metrics 사용처 확정
  - [ ] campaign_type 기본값 전략 수립

- [ ] **Golden Set 작성** (최소 10개)
  - [ ] 온라인 강의: 3개
  - [ ] SaaS 제품: 2개
  - [ ] 오프라인 세미나: 2개
  - [ ] 제품 출시 캠페인: 3개

**완료 기준**:
- Golden Set 10개 작성 완료
- B팀이 변환 로직 구현 가능한 수준

**담당**: A팀
**기한**: 2025-11-29
**파일**: `backend/tests/golden_sets/copywriter/content_plan_golden_set.json`

---

#### 5. reviewer.ad_copy_quality_check 스키마 정의
**현재 상태**: 미정의
**목표**: CopywriterAgent 출력을 자동 검증하는 Reviewer 설계

**작업 항목**:
- [ ] **Input Schema 정의**
  - [ ] AdCopySimpleOutputV2를 그대로 받음
  - [ ] 추가로 원본 Input도 받아야 하는지 결정

- [ ] **Output Schema 정의**
  - [ ] 필드별 점수 (headline_score, subheadline_score 등)
  - [ ] 종합 점수 (overall_score)
  - [ ] 개선 제안 (suggestions)
  - [ ] 금지어 위반 목록 (violations)

- [ ] **Validation 규칙 정의**
  - [ ] Golden Set 채점 기준과 동일한 로직 적용
  - [ ] Pass/Fail 판정 기준 (≥ 7.0/10)

**완료 기준**:
- TASK_SCHEMA_CATALOG_V2.md에 섹션 추가
- B팀에게 전달 가능한 스펙

**담당**: A팀
**기한**: 2025-11-30
**문서**: `docs/TASK_SCHEMA_CATALOG_V2.md` (섹션 4.1 참조)

---

#### 6. strategist.campaign_strategy 스키마 정의
**현재 상태**: 미정의
**목표**: 캠페인 전략 구조화 Agent 설계

**작업 항목**:
- [ ] **Input Schema 정의**
  - [ ] 브랜드 정보, 제품 정보, 타겟 정보
  - [ ] 캠페인 목표, 예산, 기간

- [ ] **Output Schema 정의**
  - [ ] 캠페인 목표 구조화
  - [ ] 타겟 페르소나 정의
  - [ ] 채널 전략
  - [ ] 메시지 프레임워크

- [ ] **Golden Set 초안** (최소 5개)
  - [ ] 신제품 출시: 2개
  - [ ] 브랜드 리뉴얼: 1개
  - [ ] 시즌 세일: 1개
  - [ ] 서비스 론칭: 1개

**완료 기준**:
- TASK_SCHEMA_CATALOG_V2.md에 섹션 추가
- Golden Set 5개 작성

**담당**: A팀
**기한**: 2025-12-01
**문서**: `docs/TASK_SCHEMA_CATALOG_V2.md` (섹션 2.1 참조)

---

### P2 - 중기 작업 (2주 내)

#### 7. designer.ad_layout_variants 스키마 정의
**현재 상태**: 미정의
**목표**: 광고 레이아웃 후보 생성 Agent 설계

**작업 항목**:
- [ ] Input Schema 정의
- [ ] Output Schema 정의 (레이아웃 JSON)
- [ ] Golden Set 5개 작성

**담당**: A팀
**기한**: 2025-12-06

---

#### 8. 전체 Agent Task Catalog 완성
**현재 상태**: Copywriter만 상세 정의됨
**목표**: 21개 Agent 전체 Task 정의

**작업 항목**:
- [ ] Strategist Agent 3개 Task 정의
- [ ] Designer Agent 3개 Task 정의
- [ ] Reviewer Agent 2개 Task 정의
- [ ] QA Agent 2개 Task 정의
- [ ] 나머지 11개 Agent Task 목록 정리

**담당**: A팀
**기한**: 2025-12-13

---

## B팀 TODO (Backend)

### P0 - 긴급 작업 (이번 주 완료 필수)

#### 1. CopywriterAgent 4단계 Validation Pipeline 구현
**현재 문제**: Validation 로직이 없거나 미흡함
**목표**: Golden Set Pass Rate ≥ 70% 달성

**작업 항목**:
- [ ] **1단계: Pre-validation 구현**
  - [ ] `validate_input()` 함수 작성
  - [ ] Input 필수 필드 체크
  - [ ] 파일 위치: `backend/app/agents/copywriter_agent.py`

- [ ] **2단계: Output Parsing 강화**
  - [ ] JSON 추출 로직 개선 (```json ... ``` 블록 처리)
  - [ ] 파싱 실패 시 3회 재시도
  - [ ] Fallback 응답 준비

- [ ] **3단계: Post-validation 구현**
  - [ ] `validate_output()` 함수 작성
  - [ ] 길이 체크, 금지어 체크, 언어 체크
  - [ ] ValidationResult 객체 반환

- [ ] **4단계: Auto-fix (Sanitize) 구현**
  - [ ] `sanitize_output()` 함수 작성
  - [ ] 길이 초과 시 trim
  - [ ] "제품 설명" 발견 시 `generate_fallback_subheadline()` 호출
  - [ ] 언어 혼입 발견 시 재생성 요청

**완료 기준**:
- Golden Set 10개 케이스 중 7개 이상 Pass
- Critical Failures 0건

**담당**: B팀
**기한**: 2025-11-26
**파일**: `backend/app/agents/copywriter_agent.py`, `backend/app/core/validation.py`

**참고 문서**: [TASK_SCHEMA_CATALOG_V2.md](docs/TASK_SCHEMA_CATALOG_V2.md) 섹션 1.2

---

#### 2. LLM Gateway JSON Mode 강제
**현재 문제**: JSON 파싱 실패 1/10 케이스
**목표**: JSON 파싱 성공률 100%

**작업 항목**:
- [ ] **LLM Gateway에 JSON mode 옵션 추가**
  - [ ] OpenAI: `response_format={"type": "json_object"}` 설정
  - [ ] Claude: `prefill` 기법 적용 (응답 시작을 `{`로 강제)

- [ ] **파싱 실패 시 재시도 로직**
  - [ ] 최대 3회 재시도
  - [ ] 재시도마다 "You must respond in valid JSON format" 프롬프트 추가

- [ ] **Fallback 응답 준비**
  - [ ] 3회 재시도 후에도 실패 시 기본 응답 반환
  - [ ] 기본 응답 예시: `{"headline": "제품을 만나보세요", ...}`

**완료 기준**:
- Golden Set 10개 케이스 모두 JSON 파싱 100% 성공

**담당**: B팀
**기한**: 2025-11-25
**파일**: `backend/app/core/llm_gateway.py`

---

#### 3. 한국어 비율 체크 함수 구현
**현재 문제**: 중국어 혼입 1/10 케이스
**목표**: 언어 혼입 0건

**작업 항목**:
- [ ] **`calculate_korean_ratio()` 함수 구현**
  - [ ] 한글 문자 개수 / 전체 문자 개수 계산
  - [ ] 고유명사(영어 브랜드명, 기술 용어) 제외
  - [ ] 예: "ANC 노이즈캔슬링 기술" → 한글 비율 = 8/(8+3) = 72.7%

- [ ] **Validation에 통합**
  - [ ] Body 필드 한국어 비율 ≥ 90% 체크
  - [ ] 미달 시 에러 반환 또는 재생성 요청

- [ ] **언어 혼입 감지**
  - [ ] 중국어/일본어 문자 범위 체크 (Unicode 범위)
  - [ ] 영어 문장 감지 (5단어 이상 연속)

**완료 기준**:
- Golden Set 10개 케이스 중 언어 혼입 0건

**담당**: B팀
**기한**: 2025-11-25
**파일**: `backend/app/core/validation.py`

---

### P1 - 단기 작업 (다음 주)

#### 4. content_plan_to_pages 변환 함수 구현
**현재 상태**: 미구현
**목표**: ContentPlanOutputV1 → ContentPlanPagesSchema 변환 100% 성공

**작업 항목**:
- [ ] **변환 함수 구현**
  - [ ] `convert_content_plan_to_pages(content_plan: ContentPlanOutputV1) -> ContentPlanPagesSchema`
  - [ ] 페이지 수 결정 로직 (`determine_pages()`)
  - [ ] 각 페이지별 블록 생성 로직

- [ ] **헬퍼 함수 구현**
  - [ ] `generate_audience_description(audience: Audience) -> str`
  - [ ] `determine_overview_title(campaign_type: str) -> str`
  - [ ] `merge_text_elements(content_elements: List) -> str`
  - [ ] `generate_cta_title(call_to_action: str, campaign_type: Optional[str]) -> str`
  - [ ] `extract_button_text(call_to_action: str) -> str`

- [ ] **Unit Test 작성** (최소 5개 시나리오)
  - [ ] 최소 구성 (3 pages: cover, overview, cta)
  - [ ] 표준 구성 (5 pages: cover, audience, overview, channels, cta)
  - [ ] Channels 1개일 때 (channels 페이지 생략)
  - [ ] Objectives 3개 초과일 때 (상위 3개만 사용)
  - [ ] campaign_type이 없을 때 (기본값 처리)

**완료 기준**:
- Unit Test 5개 모두 Pass
- A팀 Golden Set으로 변환 테스트 성공

**담당**: B팀
**기한**: 2025-11-29
**파일**: `backend/app/services/content_plan_to_pages.py`

**참고 문서**: [CONTENT_PLAN_TO_PAGES_SPEC_V2.md](docs/CONTENT_PLAN_TO_PAGES_SPEC_V2.md)

---

#### 5. Pydantic 모델 정의 (copywriter 관련)
**현재 상태**: 일부만 정의됨
**목표**: TASK_SCHEMA_CATALOG_V2 기준 모든 모델 정의

**작업 항목**:
- [ ] **AdCopySimpleInputV2** Pydantic 모델 작성
  - [ ] 필수/선택 필드 명확히
  - [ ] constraints 기본값 설정 (20/30/80/3/20)
  - [ ] brand_tone enum 정의

- [ ] **AdCopySimpleOutputV2** Pydantic 모델 작성
  - [ ] 모든 필드 정의
  - [ ] tone_used, primary_benefit 추가

- [ ] **ContentPlanInputV1** Pydantic 모델 작성
  - [ ] audience 중첩 객체 정의
  - [ ] campaign_type enum 정의 (선택)

- [ ] **ContentPlanOutputV1** Pydantic 모델 작성
  - [ ] content_elements 배열 타입 정의
  - [ ] type enum 값을 영어로 통일

- [ ] **ContentPlanPagesSchema** Pydantic 모델 작성
  - [ ] Page, Block, BlockContent 모델 정의
  - [ ] PageLayoutType, BlockType enum 정의

**완료 기준**:
- 모든 모델 정의 완료
- Type hint 100% 적용
- Validation 로직 포함

**담당**: B팀
**기한**: 2025-11-30
**파일**: `backend/app/schemas/copywriter.py`, `backend/app/schemas/pages.py`

---

#### 6. Golden Set Validator CI 통합
**현재 상태**: 수동 실행
**목표**: CI에서 자동 검증

**작업 항목**:
- [ ] **pytest 통합**
  - [ ] `test_golden_set_copywriter.py` 작성
  - [ ] Golden Set 10개 케이스를 pytest 파라미터화

- [ ] **GitHub Actions 워크플로우 추가**
  - [ ] PR 생성 시 Golden Set 자동 실행
  - [ ] Pass Rate < 70% 시 PR 실패

- [ ] **배포 가능 기준 체크**
  - [ ] Pass Rate ≥ 70%
  - [ ] Average Score ≥ 7.0/10
  - [ ] Critical Failures = 0

**완료 기준**:
- CI에서 Golden Set 자동 검증
- 배포 가능/불가 판정 자동화

**담당**: B팀
**기한**: 2025-12-01
**파일**: `.github/workflows/golden_set_validation.yml`, `backend/tests/test_golden_set_copywriter.py`

---

### P2 - 중기 작업 (2주 내)

#### 7. Reviewer Agent 구현
**현재 상태**: 미구현
**목표**: CopywriterAgent 출력 자동 검증

**작업 항목**:
- [ ] ReviewerAgent 클래스 작성
- [ ] ad_copy_quality_check Task 구현
- [ ] Golden Set 채점 로직 재사용

**담당**: B팀
**기한**: 2025-12-06

---

#### 8. Strategist Agent 구현
**현재 상태**: 미구현
**목표**: 캠페인 전략 구조화

**작업 항목**:
- [ ] StrategistAgent 클래스 작성
- [ ] campaign_strategy Task 구현
- [ ] Golden Set 5개로 검증

**담당**: B팀
**기한**: 2025-12-13

---

## C팀 TODO (Frontend)

### P0 - 긴급 작업 (이번 주 완료 필수)

#### 1. AdCopySimpleOutputV2 렌더링 개선
**현재 문제**: 필드명이 영어로만 표시되거나 레이아웃 미흡
**목표**: 사용자 친화적인 UI

**작업 항목**:
- [ ] **필드 레이블 한글화**
  - [ ] headline → "헤드라인"
  - [ ] subheadline → "서브헤드라인"
  - [ ] body → "본문"
  - [ ] bullets → "주요 특징"
  - [ ] cta → "행동 유도 문구"

- [ ] **카드 레이아웃 개선**
  - [ ] 각 필드를 카드 형태로 표시
  - [ ] 글자 수 표시 (예: "헤드라인 (18/20자)")
  - [ ] 길이 초과 시 빨간색 경고

- [ ] **미리보기 기능**
  - [ ] 실제 광고 형태로 미리보기
  - [ ] 데스크톱/모바일 뷰 전환

**완료 기준**:
- 사용자가 각 필드의 의미를 명확히 이해
- 길이 제약을 시각적으로 확인 가능

**담당**: C팀
**기한**: 2025-11-26
**파일**: `frontend/src/components/AdCopySimpleOutput.tsx`

---

#### 2. 에러 메시지 표시 개선
**현재 문제**: 에러 발생 시 사용자가 이해하기 어려운 메시지
**목표**: 사용자 친화적인 에러 처리

**작업 항목**:
- [ ] **에러 타입별 메시지 정의**
  - [ ] JSON 파싱 실패: "카피 생성 중 오류가 발생했습니다. 다시 시도해주세요."
  - [ ] 길이 초과: "헤드라인이 너무 깁니다 (25/20자). 자동으로 줄였습니다."
  - [ ] 언어 혼입: "부적절한 언어가 감지되었습니다. 다시 생성합니다."
  - [ ] 금지어 사용: "일반적인 표현이 사용되었습니다. 더 구체적인 카피로 수정했습니다."

- [ ] **재시도 버튼 제공**
  - [ ] 에러 발생 시 "다시 생성하기" 버튼
  - [ ] 로딩 상태 표시

- [ ] **에러 로그 수집**
  - [ ] 에러 발생 시 Sentry/LogRocket 등에 전송
  - [ ] 에러 빈도 분석

**완료 기준**:
- 모든 에러 케이스에 대해 사용자 친화적 메시지
- 재시도 기능 100% 작동

**담당**: C팀
**기한**: 2025-11-25
**파일**: `frontend/src/components/ErrorMessage.tsx`

---

### P1 - 단기 작업 (다음 주)

#### 3. ContentPlanPages 렌더러 구현
**현재 상태**: 미구현
**목표**: multi-page document UI

**작업 항목**:
- [ ] **Page 컴포넌트 구현**
  - [ ] `PageRenderer.tsx`: pages 배열을 받아서 렌더링
  - [ ] 페이지 네비게이션 UI (이전/다음 버튼, 페이지 인디케이터)

- [ ] **Layout 타입별 템플릿 구현**
  - [ ] `CoverLayout.tsx`: title + list 블록
  - [ ] `AudienceLayout.tsx`: subtitle + paragraph + list 블록
  - [ ] `OverviewLayout.tsx`: subtitle + paragraph + image_placeholder 블록
  - [ ] `ChannelsLayout.tsx`: subtitle + list 블록
  - [ ] `CTALayout.tsx`: subtitle + paragraph + cta_button + list 블록

- [ ] **Block 타입별 컴포넌트 구현**
  - [ ] `TitleBlock.tsx`: 큰 제목
  - [ ] `SubtitleBlock.tsx`: 소제목
  - [ ] `ParagraphBlock.tsx`: 본문 텍스트
  - [ ] `ListBlock.tsx`: 불릿 리스트
  - [ ] `ImagePlaceholderBlock.tsx`: 이미지 플레이스홀더 (업로드 기능)
  - [ ] `VideoPlaceholderBlock.tsx`: 비디오 플레이스홀더
  - [ ] `CTAButtonBlock.tsx`: 행동 유도 버튼

**완료 기준**:
- 모든 Layout과 Block 타입 렌더링 가능
- 페이지 네비게이션 작동

**담당**: C팀
**기한**: 2025-11-30
**파일**: `frontend/src/components/pages/`

**참고 문서**: [CONTENT_PLAN_TO_PAGES_SPEC_V2.md](docs/CONTENT_PLAN_TO_PAGES_SPEC_V2.md)

---

#### 4. 페이지 네비게이션 UI 구현
**현재 상태**: 미구현
**목표**: 사용자가 페이지를 쉽게 이동

**작업 항목**:
- [ ] **페이지 인디케이터**
  - [ ] 현재 페이지 / 전체 페이지 표시 (예: "2 / 5")
  - [ ] 점(dot) 형태 인디케이터

- [ ] **이전/다음 버튼**
  - [ ] 좌우 화살표 버튼
  - [ ] 첫 페이지에서는 이전 버튼 비활성화
  - [ ] 마지막 페이지에서는 다음 버튼 비활성화

- [ ] **키보드 단축키**
  - [ ] 좌/우 화살표로 페이지 이동
  - [ ] ESC로 페이지 뷰 닫기

- [ ] **진행도 표시**
  - [ ] 상단에 프로그레스 바 (20% → 40% → 60% → 80% → 100%)

**완료 기준**:
- 사용자가 직관적으로 페이지 이동 가능
- 키보드 단축키 작동

**담당**: C팀
**기한**: 2025-12-01
**파일**: `frontend/src/components/pages/PageNavigation.tsx`

---

#### 5. Polotno Editor 통합 (ContentPlan Pages)
**현재 상태**: 단일 페이지 편집만 가능
**목표**: multi-page document를 Polotno로 편집

**작업 항목**:
- [ ] **Pages → Polotno Slides 변환**
  - [ ] 각 Page를 Polotno의 Slide로 변환
  - [ ] Block을 Polotno의 요소(텍스트, 이미지 등)로 변환

- [ ] **Layout 템플릿 적용**
  - [ ] cover 레이아웃: 중앙 정렬 타이틀 + 하단 리스트
  - [ ] audience 레이아웃: 좌측 텍스트 + 우측 이미지
  - [ ] overview 레이아웃: 상단 텍스트 + 하단 이미지
  - [ ] channels 레이아웃: 아이콘 + 리스트
  - [ ] cta 레이아웃: 중앙 큰 버튼 + 하단 리스트

- [ ] **편집 기능**
  - [ ] 각 요소 드래그 앤 드롭
  - [ ] 텍스트 수정
  - [ ] 이미지 업로드/교체
  - [ ] 폰트, 색상 변경

**완료 기준**:
- ContentPlanPages를 Polotno로 불러오기 성공
- 모든 편집 기능 작동

**담당**: C팀
**기한**: 2025-12-06
**파일**: `frontend/src/components/editor/PolotnoContentPlanEditor.tsx`

---

### P2 - 중기 작업 (2주 내)

#### 6. 사용자 피드백 수집 UI
**현재 상태**: 미구현
**목표**: 생성된 카피에 대한 사용자 평가 수집

**작업 항목**:
- [ ] 카피 품질 평가 (1~5점 별점)
- [ ] 개선 요청 텍스트 입력
- [ ] 피드백 데이터 서버 전송

**담당**: C팀
**기한**: 2025-12-13

---

## 공통 TODO (A/B/C팀 협업)

### P0 - 긴급 작업

#### 1. CopywriterAgent 품질 개선 협업
**목표**: Golden Set Pass Rate ≥ 70% 달성

**작업 순서**:
1. **A팀**: 프롬프트 재작성 (11-25)
2. **B팀**: Validation Pipeline 구현 (11-26)
3. **A팀**: Golden Set 재검증 (11-27)
4. **B팀**: 피드백 반영 및 재구현 (11-28)
5. **C팀**: UI에 품질 점수 표시 (11-29)

**완료 기준**:
- Pass Rate ≥ 70%
- Critical Failures = 0

**기한**: 2025-11-29

---

### P1 - 단기 작업

#### 2. content_plan → pages 변환 전체 플로우 구축
**목표**: End-to-end 동작 확인

**작업 순서**:
1. **A팀**: Golden Set 10개 작성 (11-29)
2. **B팀**: 변환 함수 구현 (11-30)
3. **C팀**: Pages 렌더러 구현 (12-01)
4. **전체**: 통합 테스트 (12-02)

**완료 기준**:
- A팀 Golden Set으로 전체 플로우 테스트 성공
- 사용자가 content_plan 생성부터 Pages 렌더링까지 확인 가능

**기한**: 2025-12-02

---

#### 3. 문서 동기화 회의
**목표**: v2 설계 문서 최종 확정

**작업 항목**:
- [ ] TASK_SCHEMA_CATALOG_V2 리뷰
- [ ] CONTENT_PLAN_TO_PAGES_SPEC_V2 리뷰
- [ ] Golden Set 채점 기준 합의
- [ ] 배포 가능 기준 합의

**참석**: A/B/C팀 전체
**일정**: 2025-11-27 (수) 오후 2시
**형식**: 온라인 회의 (1시간)

---

## 진척도 측정 기준

### A팀 진척도
- [ ] CopywriterAgent Pass Rate: 0% → 70%
- [ ] Golden Set 확장: 10개 → 20개
- [ ] Task 정의: 1개 → 5개 (copywriter 2, reviewer 1, strategist 1, designer 1)

### B팀 진척도
- [ ] Validation Pipeline: 0단계 → 4단계 완성
- [ ] Pydantic 모델: 0개 → 5개 정의
- [ ] Unit Test: 0개 → 10개 작성

### C팀 진척도
- [ ] Layout 타입: 0개 → 5개 구현
- [ ] Block 타입: 0개 → 7개 구현
- [ ] 페이지 네비게이션: 미구현 → 완성

---

**작성**: A팀
**최종 수정**: 2025-11-23
**다음 리뷰**: 2025-11-27 (전체 회의)
