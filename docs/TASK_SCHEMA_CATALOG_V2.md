# Task & Schema Catalog v2
**버전**: v2.0 (A팀 검증 기반)
**작성일**: 2025-11-23
**작성자**: A팀 (QA & Architecture)
**대상**: A팀(설계), B·C팀(구현/UI)

---

## 문서 목적

이 문서는 Sparklio의 **모든 Agent Task와 Input/Output JSON 스키마를 정의**하는 단일 소스입니다.

### 역할 분담
- **A팀**: Task/Schema 추가·변경 시 이 문서를 우선 수정, 품질 기준 설정
- **B팀**: 이 문서 기준으로 Pydantic 모델 정의 및 구현
- **C팀**: Task별 응답 구조 확인 후 UI/렌더링 설계

### 변경 프로세스
1. A팀이 이 문서 수정 (설계)
2. B팀이 코드 반영 (구현)
3. C팀이 UI 업데이트 (렌더링)
4. Golden Set 재검증 (품질 확인)

---

## 표기 규칙

- **Task 이름**: `role.task_name` 형식 (예: `copywriter.ad_copy_simple`)
- **Kind**: Workflow/서비스 단위 (예: `ad_single_page`)
- **Schema Version**: `V1`, `V2` 등으로 버전 관리
- **Priority**: P0 (긴급), P1 (높음), P2 (중간), P3 (낮음)

---

## 1. CopywriterAgent Tasks

### 1.1 Task 목록

| Task 이름 | Kind | Priority | 상태 | 설명 |
|-----------|------|----------|------|------|
| `copywriter.ad_copy_simple` | `ad_single_page` | P0 | 🔴 품질 미달 | 단일 페이지 광고 카피 생성 |
| `copywriter.content_plan` | `ad_campaign_plan` | P1 | ⚠️ 설계 필요 | 캠페인/강의 콘텐츠 플랜 생성 |
| `copywriter.sns_caption_set` | `sns_multi_post` | P2 | 📋 미구현 | SNS 채널별 캡션 세트 생성 |

---

### 1.2 `copywriter.ad_copy_simple`

#### 개요
- **목적**: 단일 페이지 광고용 마케팅 카피 생성
- **Kind**: `ad_single_page`
- **Priority**: P0 (최우선)
- **현재 상태**: 🔴 **품질 미달 (Pass Rate 0%)**

#### Input Schema: `AdCopySimpleInputV2`

```typescript
interface AdCopySimpleInputV2 {
  // 필수 필드
  product_name: string;          // 제품/서비스 이름 (예: "울트라 무선 이어폰 Pro")
  category: string;              // 카테고리 (예: "테크 제품", "뷰티", "식품")
  target_audience: string;       // 타겟 (예: "20-30대 여성", "IT 전문가")
  brand_tone: "professional" | "friendly" | "energetic" | "luxury";  // 브랜드 톤

  // 제품 정보
  usps: string[];                // USP 목록 (최소 2개, 최대 5개)
  features?: string[];           // 주요 기능 (선택)
  price_point?: "budget" | "mid" | "premium" | "luxury";  // 가격대 (선택)

  // 제약 조건
  constraints?: {
    headline_max_chars?: number;     // 기본값: 20
    subheadline_max_chars?: number;  // 기본값: 30
    body_max_chars?: number;         // 기본값: 80
    bullets_count?: number;          // 기본값: 3
    bullets_max_chars?: number;      // 기본값: 20
  };

  // 컨텍스트 (선택)
  campaign_context?: string;     // 캠페인 배경 (예: "신제품 출시", "시즌 세일")
  channel?: "instagram" | "facebook" | "landing_page" | "email";  // 채널
}
```

#### Output Schema: `AdCopySimpleOutputV2`

```typescript
interface AdCopySimpleOutputV2 {
  // 핵심 카피
  headline: string;              // 메인 헤드라인
  subheadline: string;           // 서브 헤드라인
  body: string;                  // 본문
  bullets: string[];             // 불릿 포인트 (3개)
  cta: string;                   // Call-to-Action

  // 메타 정보
  tone_used: string;             // 실제 사용된 톤
  primary_benefit: string;       // 주요 베네핏
}
```

#### 품질 규칙 (Validation Rules)

##### 1. 길이 제약 (Hard Constraints)
| 필드 | 최대 길이 | 초과 시 처리 |
|------|----------|-------------|
| headline | 20자 | Auto-trim + 경고 |
| subheadline | 30자 | Auto-trim + 경고 |
| body | 80자 | Auto-trim + 경고 |
| bullets (각) | 20자 | Auto-trim + 경고 |
| cta | 15자 | Auto-trim + 경고 |

##### 2. 금지 규칙 (Forbidden Patterns)

**Headline 금지**:
- ❌ 제품명 그대로 사용 (예: "울트라 무선 이어폰 Pro")
- ❌ 카테고리명만 사용 (예: "무선 이어폰")
- ✅ 감성적/베네핏 중심 카피 (예: "완벽한 소음 차단의 시작")

**Subheadline 금지**:
- ❌ "제품 설명"
- ❌ "상세 설명"
- ❌ "상품 소개"
- ❌ 일반적 표현
- ✅ 구체적인 베네핏/특징 (예: "프리미엄 ANC 기술로 집중력 극대화")

**Body 금지**:
- ❌ 중국어/일본어/기타 언어 혼입
- ❌ 영어 문장 (브랜드명/고유명사 제외)
- ✅ 한국어 95% 이상 (고유명사 제외)

##### 3. 언어 규칙
- **한국어 우선**: 모든 카피는 한국어로 작성
- **예외**: 브랜드명, 제품명, 기술 용어 (예: ANC, IPX7, rTG)
- **검증**: 한글 비율 ≥ 90% (고유명사 제외)

##### 4. 톤 일관성
- Input의 `brand_tone`과 실제 출력 톤이 일치해야 함
- Professional: 전문적, 신뢰감
- Friendly: 친근함, 편안함
- Energetic: 활기찬, 역동적
- Luxury: 고급스러움, 우아함

#### Prompt Spec 요구사항

**시스템 프롬프트 필수 요소**:
1. 역할 정의: "당신은 전문 마케팅 카피라이터입니다"
2. 출력 형식: JSON 구조 명시
3. 길이 제약: 각 필드별 최대 길이
4. 금지 규칙: 제품명 그대로 사용 금지, "제품 설명" 금지
5. 언어 규칙: "모든 출력은 한국어로만 작성"
6. Few-shot 예시: Golden Set에서 선별한 모범 답안 3~5개

**Few-shot 예시 (Golden Set 기반)**:
```json
{
  "input": {
    "product_name": "울트라 무선 이어폰 Pro",
    "category": "테크 제품",
    "target_audience": "20-40대 직장인",
    "brand_tone": "professional",
    "usps": ["ANC 노이즈캔슬링", "30시간 배터리", "IPX7 방수"]
  },
  "output": {
    "headline": "완벽한 소음 차단의 시작",
    "subheadline": "프리미엄 ANC 기술로 집중력 극대화",
    "body": "울트라 무선 이어폰 Pro는 30시간 배터리와 IPX7 방수로 언제 어디서나 최고의 사운드를 제공합니다.",
    "bullets": [
      "ANC 노이즈캔슬링",
      "30시간 배터리",
      "IPX7 방수"
    ],
    "cta": "지금 바로 체험하기"
  }
}
```

#### Validation & Sanitize Spec

**1단계: Pre-validation (입력 검증)**
```python
def validate_input(input_data: AdCopySimpleInputV2):
    assert len(input_data.product_name) > 0, "product_name required"
    assert len(input_data.usps) >= 2, "At least 2 USPs required"
    assert input_data.brand_tone in ["professional", "friendly", "energetic", "luxury"]
```

**2단계: Output Parsing**
```python
def parse_output(raw_output: str) -> AdCopySimpleOutputV2:
    # JSON 추출 시도
    try:
        data = json.loads(raw_output)
    except:
        # {...} 블록 추출 후 재시도
        data = extract_json_block(raw_output)

    return AdCopySimpleOutputV2(**data)
```

**3단계: Post-validation (출력 검증)**
```python
def validate_output(output: AdCopySimpleOutputV2) -> ValidationResult:
    errors = []
    warnings = []

    # 길이 체크
    if len(output.headline) > 20:
        errors.append("headline exceeds 20 chars")

    # 금지 패턴 체크
    if output.subheadline in ["제품 설명", "상세 설명", "상품 소개"]:
        errors.append("subheadline uses forbidden generic term")

    # 언어 체크
    korean_ratio = calculate_korean_ratio(output.body)
    if korean_ratio < 0.9:
        errors.append(f"Korean ratio too low: {korean_ratio}")

    return ValidationResult(errors=errors, warnings=warnings)
```

**4단계: Auto-fix (Sanitize)**
```python
def sanitize_output(output: AdCopySimpleOutputV2) -> AdCopySimpleOutputV2:
    # 길이 초과 시 트리밍
    output.headline = trim_text(output.headline, max_length=20)
    output.subheadline = trim_text(output.subheadline, max_length=30)
    output.body = trim_text(output.body, max_length=80)
    output.bullets = [trim_text(b, max_length=20) for b in output.bullets]
    output.cta = trim_text(output.cta, max_length=15)

    # "제품 설명" 치환
    if output.subheadline in ["제품 설명", "상세 설명"]:
        output.subheadline = generate_fallback_subheadline(output)

    return output
```

#### Golden Set Requirements

**최소 요구사항**:
- **케이스 수**: 20개 (현재 10개 → 확장 필요)
- **카테고리 분포**:
  - 테크: 4개
  - 뷰티: 3개
  - 패션/스포츠: 3개
  - 헬스케어: 3개
  - 식품: 2개
  - 럭셔리: 2개
  - 기타: 3개

**각 케이스 구성**:
```json
{
  "case_id": "golden_001",
  "scenario": "무선 이어폰 - 테크 제품",
  "input": { /* AdCopySimpleInputV2 */ },
  "expected_output": { /* AdCopySimpleOutputV2 */ },
  "scoring_criteria": {
    "headline_min_score": 7.0,
    "subheadline_min_score": 7.0,
    "body_min_score": 7.0,
    "bullets_min_score": 7.0,
    "cta_min_score": 6.0,
    "overall_min_score": 7.0
  }
}
```

**채점 기준**:
- 각 필드: 0~10점
- 종합 점수: (headline×0.25 + subheadline×0.20 + body×0.25 + bullets×0.20 + cta×0.10)
- Pass 기준: 종합 점수 ≥ 7.0

#### 배포 기준 (Deployment Criteria)

| 지표 | 현재 값 | 목표 값 | 상태 |
|------|---------|---------|------|
| Pass Rate | 0% | ≥ 70% | 🔴 미달 |
| Average Score | 3.3/10 | ≥ 7.0/10 | 🔴 미달 |
| Headline Avg | 1.9/10 | ≥ 6.0/10 | 🔴 미달 |
| Subheadline Avg | 1.0/10 | ≥ 6.0/10 | 🔴 미달 |
| Body Avg | 3.8/10 | ≥ 6.0/10 | 🔴 미달 |
| Bullets Avg | 7.5/10 | ≥ 7.0/10 | ✅ 합격 |
| CTA Avg | 4.1/10 | ≥ 6.0/10 | 🔴 미달 |
| Critical Failures | 2 | 0 | 🔴 미달 |

**Critical Failures 정의**:
- 언어 혼입 (중국어/일본어 등)
- JSON 파싱 실패
- 필수 필드 누락

**배포 가능 조건**: 모든 지표가 목표 값 이상

---

### 1.3 `copywriter.content_plan`

#### 개요
- **목적**: 캠페인/강의 전체 콘텐츠 플랜 생성
- **Kind**: `ad_campaign_plan`
- **Priority**: P1
- **현재 상태**: ⚠️ **설계 단계**

#### Input Schema: `ContentPlanInputV1`

```typescript
interface ContentPlanInputV1 {
  // 기본 정보
  title: string;                // 캠페인/강의 제목
  topic: string;                // 주제
  product_or_service: string;   // 제품/서비스 설명

  // 타겟
  audience: {
    target_group: string;        // 타겟 그룹
    age_range: string;           // 연령대
    interests: string[];         // 관심사
  };

  // 목표
  main_objectives: string[];    // 주요 목표 (2~5개)

  // 채널
  channels: string[];           // 노출 채널 (예: ["페이스북 광고", "인스타그램"])

  // 기타
  duration?: string;            // 기간 (선택)
  budget?: string;              // 예산 (선택)
}
```

#### Output Schema: `ContentPlanOutputV1`

```typescript
interface ContentPlanOutputV1 {
  // 기본 정보
  title: string;
  objectives: string[];

  // 타겟
  audience: {
    target_group: string;
    age_range: string;
    interests: string[];
  };

  // 채널
  channels: string[];

  // 콘텐츠 요소
  content_elements: Array<{
    type: "text" | "image" | "video" | "list";
    elements?: string[];         // type="text" 또는 "list"일 때
    description: string;         // type="image" 또는 "video"일 때
  }>;

  // CTA & 측정
  call_to_action: string;
  measurement_metrics: string[];
}
```

#### Frontend 변환
- B팀이 `ContentPlanOutputV1` → `ContentPlanPagesSchema`로 변환
- 변환 규칙: `docs/CONTENT_PLAN_TO_PAGES_SPEC.md` 참조

#### 품질 규칙 (설계 필요)

**Golden Set 요구사항**:
- 최소 케이스 수: 10개
- 시나리오 다양화:
  - 온라인 강의 (3개)
  - SaaS 제품 (2개)
  - 오프라인 세미나 (2개)
  - 제품 출시 캠페인 (3개)

**배포 기준**:
- Pass Rate ≥ 70%
- Pages 변환 성공률 100%
- 각 페이지 타입이 올바르게 매핑됨

---

## 2. StrategistAgent Tasks (설계 필요)

### 2.1 Task 목록

| Task 이름 | Kind | Priority | 상태 | 설명 |
|-----------|------|----------|------|------|
| `strategist.campaign_strategy` | `ad_campaign_plan` | P1 | 📋 미정의 | 캠페인 전략 구조화 |
| `strategist.brand_dna_extractor` | `brand_analysis` | P2 | 📋 미정의 | URL/자료에서 브랜드 DNA 추출 |
| `strategist.competitor_analysis` | `market_research` | P2 | 📋 미정의 | 경쟁사 분석 |

> **A팀 TODO**: `strategist.campaign_strategy` 스키마 정의 필요 (P1)

---

## 3. DesignerAgent Tasks (설계 필요)

### 3.1 Task 목록

| Task 이름 | Kind | Priority | 상태 | 설명 |
|-----------|------|----------|------|------|
| `designer.ad_layout_variants` | `ad_single_page` | P1 | 📋 미정의 | 광고 레이아웃 후보 생성 |
| `designer.color_palette` | `brand_visual` | P2 | 📋 미정의 | 브랜드 컬러 팔레트 제안 |
| `designer.thumb_set` | `video_thumbnail` | P2 | 📋 미정의 | 썸네일 여러 개 후보 생성 |

> **A팀 TODO**: `designer.ad_layout_variants` 스키마 정의 필요 (P1)

---

## 4. ReviewerAgent Tasks (설계 필요)

### 4.1 Task 목록

| Task 이름 | Kind | Priority | 상태 | 설명 |
|-----------|------|----------|------|------|
| `reviewer.ad_copy_quality_check` | `ad_single_page` | P0 | 📋 미정의 | 카피 품질 점수/피드백 |
| `reviewer.brand_compliance_check` | `brand_analysis` | P1 | 📋 미정의 | 브랜드 가이드라인 준수 확인 |

> **A팀 TODO**: `reviewer.ad_copy_quality_check` 스키마 정의 필요 (P0)

---

## 5. QAAgent Tasks (설계 필요)

### 5.1 Task 목록

| Task 이름 | Kind | Priority | 상태 | 설명 |
|-----------|------|----------|------|------|
| `qa.workflow_health_check` | `system_diagnostics` | P1 | 📋 미정의 | Agent/Gateway 상태 점검 |
| `qa.golden_set_validator` | `quality_assurance` | P0 | 📋 미정의 | Golden Set 기반 품질 검증 |

---

## 6. 유지보수 규칙

### 6.1 새로운 Task 추가 시
1. 이 문서에 Task 정의 추가
2. Input/Output Schema 정의
3. Golden Set 최소 10개 작성
4. Validation 룰 정의
5. B팀에게 구현 요청

### 6.2 Schema 변경 시
1. 기존 Schema는 `V1` 유지
2. 신규 Schema는 `V2`로 추가
3. 마이그레이션 계획 작성
4. B/C팀 영향 범위 명시

### 6.3 Golden Set 관리
- 경로: `backend/tests/golden_sets/{agent_name}/{task_name}_golden_set.json`
- 형식: JSON 배열
- 검증: CI에서 자동 실행

---

## 7. 다음 단계

### 7.1 즉시 작업 (P0)
1. `copywriter.ad_copy_simple` 프롬프트 재작성
2. Golden Set 10개 → 20개 확장
3. `reviewer.ad_copy_quality_check` 스키마 정의

### 7.2 단기 작업 (P1)
1. `copywriter.content_plan` 스키마 확정
2. `strategist.campaign_strategy` 스키마 정의
3. `designer.ad_layout_variants` 스키마 정의

### 7.3 중기 작업 (P2)
1. 전체 21개 Agent에 대한 Task Catalog 완성
2. 모든 Task에 Golden Set 준비
3. CI 통합 자동 검증

---

**작성**: A팀
**최종 수정**: 2025-11-23
**다음 리뷰**: CopywriterAgent 프롬프트 개선 후
