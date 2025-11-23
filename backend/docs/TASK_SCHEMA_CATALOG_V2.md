# Task & Schema Catalog v2

**작성일**: 2025-11-23
**작성자**: B팀 (Backend) + A팀 (QA)
**버전**: 2.0
**목적**: 모든 Agent의 Task 정의 및 Input/Output 스키마 표준화

---

## 📋 목차

1. [개요](#개요)
2. [CopywriterAgent Tasks](#copywriteragent-tasks)
3. [StrategistAgent Tasks](#strategistagent-tasks)
4. [ReviewerAgent Tasks](#revieweragent-tasks)
5. [DesignerAgent Tasks](#designeragent-tasks)
6. [OptimizerAgent Tasks](#optimizeragent-tasks)
7. [Validation Pipeline](#validation-pipeline)
8. [Golden Set 경로 규칙](#golden-set-경로-규칙)

---

## 개요

### 스키마 표준화 목적

1. **타입 안전성**: TypeScript 인터페이스로 프론트엔드/백엔드 타입 일치
2. **자동 검증**: Pydantic 모델로 런타임 검증
3. **문서화**: 모든 Agent Task의 Input/Output 명세 중앙 관리
4. **Golden Set**: 각 Task별 기대 출력 샘플 정의

### 표기 규칙

- **Input Schema**: Agent 실행 시 필요한 입력 데이터
- **Output Schema**: Agent가 반환하는 출력 데이터
- **TypeScript Interface**: 프론트엔드용 타입 정의
- **Pydantic Model**: 백엔드용 검증 모델
- **Validation Rules**: 4단계 검증 파이프라인 규칙

---

## CopywriterAgent Tasks

### Task 1: `product_detail`

#### 설명
제품의 상세 설명 텍스트 생성 (headline, subheadline, body, bullets, cta)

#### Input Schema

**TypeScript Interface**:
```typescript
interface ProductDetailInput {
  product_name: string;           // 제품명
  features: string[];              // 주요 특징 (최대 5개)
  target_audience: string;         // 타겟 오디언스
  category?: string;               // 카테고리 (optional)
  brand_voice?: string;            // 브랜드 톤 (optional)
}
```

**Pydantic Model**:
```python
from pydantic import BaseModel, Field

class ProductDetailInput(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=100)
    features: list[str] = Field(..., min_items=1, max_items=5)
    target_audience: str = Field(..., min_length=1, max_length=100)
    category: str | None = None
    brand_voice: str | None = None
```

#### Output Schema

**TypeScript Interface**:
```typescript
interface ProductDetailOutput {
  headline: string;                // 5-20자
  subheadline: string;             // 10-30자
  body: string;                    // 20-80자
  bullets: string[];               // 3개, 각 20자 이내
  cta: string;                     // 4-15자
}
```

**Pydantic Model**:
```python
from pydantic import BaseModel, Field, validator

class ProductDetailOutput(BaseModel):
    headline: str = Field(..., min_length=5, max_length=20)
    subheadline: str = Field(..., min_length=10, max_length=30)
    body: str = Field(..., min_length=20, max_length=80)
    bullets: list[str] = Field(..., min_items=3, max_items=3)
    cta: str = Field(..., min_length=4, max_length=15)

    @validator("bullets")
    def validate_bullets(cls, v):
        for bullet in v:
            if len(bullet) > 20:
                raise ValueError(f"Bullet exceeds 20 chars: {bullet}")
        return v

    @validator("headline", "subheadline", "body", "cta")
    def check_korean(cls, v):
        korean_chars = sum(1 for c in v if '\uac00' <= c <= '\ud7a3')
        total_chars = len(v.replace(" ", ""))
        if total_chars > 0 and korean_chars / total_chars < 0.5:
            raise ValueError(f"Korean ratio < 50%: {v}")
        return v
```

#### Validation Rules

| Stage | 규칙 | 통과 조건 |
|-------|------|-----------|
| **1. Schema** | Pydantic 모델 검증 | 모든 필드 타입/길이 일치 |
| **2. Length** | 각 필드 길이 제약 | headline ≤20, subheadline 10-30, body 20-80, bullets ≤20, cta 4-15 |
| **3. Language** | 한국어 비율 검증 | 각 필드 한국어 비율 ≥50% |
| **4. Quality** | 기본값 폴백 감지 | subheadline != "제품 설명" |

#### Golden Set 경로
```
tests/golden_sets/copywriter_product_detail_golden_set.json
```

#### 예시

**Input**:
```json
{
  "product_name": "울트라 무선 이어폰 Pro",
  "features": ["ANC 노이즈캔슬링", "30시간 배터리", "IPX7 방수"],
  "target_audience": "2030 직장인",
  "category": "전자제품"
}
```

**Output**:
```json
{
  "headline": "완벽한 소음 차단의 시작",
  "subheadline": "프리미엄 ANC 기술로 집중력 극대화",
  "body": "울트라 무선 이어폰 Pro는 30시간 배터리와 IPX7 방수로 언제 어디서나 최고의 사운드를 제공합니다.",
  "bullets": ["ANC 노이즈캔슬링", "30시간 배터리", "IPX7 방수"],
  "cta": "지금 바로 체험하기"
}
```

---

### Task 2: `sns`

#### 설명
SNS 플랫폼용 짧은 콘텐츠 생성 (post, hashtags, cta)

#### Input Schema

**TypeScript Interface**:
```typescript
interface SNSInput {
  topic: string;                   // 주제
  platform?: 'instagram' | 'facebook' | 'twitter' | 'linkedin'; // 플랫폼
  tone?: 'casual' | 'professional' | 'friendly'; // 톤
  target_audience?: string;        // 타겟
}
```

**Pydantic Model**:
```python
from pydantic import BaseModel, Field
from typing import Literal

class SNSInput(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)
    platform: Literal['instagram', 'facebook', 'twitter', 'linkedin'] | None = None
    tone: Literal['casual', 'professional', 'friendly'] | None = None
    target_audience: str | None = None
```

#### Output Schema

**TypeScript Interface**:
```typescript
interface SNSOutput {
  post: string;                    // 80-120자
  hashtags: string[];              // 5-10개
  cta?: string;                    // 선택적 CTA
}
```

**Pydantic Model**:
```python
class SNSOutput(BaseModel):
    post: str = Field(..., min_length=80, max_length=120)
    hashtags: list[str] = Field(..., min_items=5, max_items=10)
    cta: str | None = Field(None, max_length=20)

    @validator("hashtags")
    def validate_hashtags(cls, v):
        for tag in v:
            if not tag.startswith("#"):
                raise ValueError(f"Hashtag must start with #: {tag}")
            if len(tag) > 20:
                raise ValueError(f"Hashtag too long: {tag}")
        return v
```

#### Validation Rules

| Stage | 규칙 | 통과 조건 |
|-------|------|-----------|
| **1. Schema** | Pydantic 모델 검증 | 모든 필드 타입 일치 |
| **2. Length** | post 80-120자, hashtags 5-10개 | 길이 범위 준수 |
| **3. Language** | 한국어 비율 ≥50% (post만) | hashtags는 영문 허용 |
| **4. Quality** | hashtags가 #으로 시작 | 모든 hashtags # 포함 |

#### Golden Set 경로
```
tests/golden_sets/copywriter_sns_golden_set.json
```

---

### Task 3: `brand_message`

#### 설명
브랜드의 핵심 메시지 및 가치 표현 (tagline, message, values)

#### Input Schema

**TypeScript Interface**:
```typescript
interface BrandMessageInput {
  brand_name: string;
  industry: string;
  target_market: string;
  core_values?: string[];
}
```

**Pydantic Model**:
```python
class BrandMessageInput(BaseModel):
    brand_name: str = Field(..., min_length=1, max_length=50)
    industry: str = Field(..., min_length=1, max_length=100)
    target_market: str = Field(..., min_length=1, max_length=100)
    core_values: list[str] | None = None
```

#### Output Schema

**TypeScript Interface**:
```typescript
interface BrandMessageOutput {
  tagline: string;                 // 10자 이내
  message: string;                 // 50-100자
  values: string[];                // 3개 핵심 가치
  promise?: string;                // 브랜드 약속 (선택)
}
```

**Pydantic Model**:
```python
class BrandMessageOutput(BaseModel):
    tagline: str = Field(..., min_length=3, max_length=10)
    message: str = Field(..., min_length=50, max_length=100)
    values: list[str] = Field(..., min_items=3, max_items=3)
    promise: str | None = Field(None, max_length=50)

    @validator("values")
    def validate_values(cls, v):
        for value in v:
            if len(value) > 15:
                raise ValueError(f"Value too long: {value}")
        return v
```

#### Validation Rules

| Stage | 규칙 | 통과 조건 |
|-------|------|-----------|
| **1. Schema** | Pydantic 모델 검증 | 모든 필드 타입/길이 일치 |
| **2. Length** | tagline ≤10, message 50-100, values 3개 각 ≤15 | 길이 준수 |
| **3. Language** | 한국어 비율 ≥90% | 브랜드 메시지는 순한국어 |
| **4. Quality** | 중복 가치 없음 | values에 중복 없음 |

#### Golden Set 경로
```
tests/golden_sets/copywriter_brand_message_golden_set.json
```

---

## StrategistAgent Tasks

### Task 1: `brand_kit`

#### 설명
브랜드 아이덴티티 전체 정의 (positioning, persona, messages, tone)

#### Input Schema

**TypeScript Interface**:
```typescript
interface BrandKitInput {
  brand_name: string;
  industry: string;
  target_market: string;
  competitors?: string[];
  unique_value?: string;
}
```

**Pydantic Model**:
```python
class BrandKitInput(BaseModel):
    brand_name: str = Field(..., min_length=1, max_length=50)
    industry: str = Field(..., min_length=1, max_length=100)
    target_market: str = Field(..., min_length=1, max_length=100)
    competitors: list[str] | None = None
    unique_value: str | None = None
```

#### Output Schema

**TypeScript Interface**:
```typescript
interface BrandKitOutput {
  brand_positioning: string;       // 브랜드 포지셔닝 (100-200자)
  target_persona: {
    demographics: string;           // 인구통계
    psychographics: string;         // 심리통계
    pain_points: string[];          // 페인포인트 3개
    goals: string[];                // 목표 3개
  };
  key_messages: string[];          // 핵심 메시지 3-5개
  tone_guidelines: {
    do: string[];                   // 권장 톤 3개
    dont: string[];                 // 금지 톤 3개
  };
  differentiation: string;         // 차별점 (50-100자)
}
```

**Pydantic Model**:
```python
class TargetPersona(BaseModel):
    demographics: str = Field(..., max_length=200)
    psychographics: str = Field(..., max_length=200)
    pain_points: list[str] = Field(..., min_items=3, max_items=3)
    goals: list[str] = Field(..., min_items=3, max_items=3)

class ToneGuidelines(BaseModel):
    do: list[str] = Field(..., min_items=3, max_items=3)
    dont: list[str] = Field(..., min_items=3, max_items=3)

class BrandKitOutput(BaseModel):
    brand_positioning: str = Field(..., min_length=100, max_length=200)
    target_persona: TargetPersona
    key_messages: list[str] = Field(..., min_items=3, max_items=5)
    tone_guidelines: ToneGuidelines
    differentiation: str = Field(..., min_length=50, max_length=100)
```

#### Validation Rules

| Stage | 규칙 | 통과 조건 |
|-------|------|-----------|
| **1. Schema** | Pydantic 모델 검증 | 중첩 구조 포함 모든 필드 검증 |
| **2. Length** | 각 필드 길이 제약 | positioning 100-200, differentiation 50-100 |
| **3. Language** | 한국어 비율 ≥90% | 전략 문서는 순한국어 |
| **4. Quality** | persona, tone 일관성 | pain_points와 goals가 논리적 연결 |

#### Golden Set 경로
```
tests/golden_sets/strategist_brand_kit_golden_set.json
```

---

## ReviewerAgent Tasks

### Task 1: `content_review`

#### 설명
콘텐츠 품질 검토 및 개선 제안 (scores, strengths, weaknesses, improvements)

#### Input Schema

**TypeScript Interface**:
```typescript
interface ContentReviewInput {
  content: {
    headline?: string;
    subheadline?: string;
    body: string;                  // 필수
    bullets?: string[];
    cta?: string;
  };
  context?: {
    product_name?: string;
    target_audience?: string;
    tone?: string;
  };
}
```

**Pydantic Model**:
```python
class ContentToReview(BaseModel):
    headline: str | None = None
    subheadline: str | None = None
    body: str = Field(..., min_length=1)  # 필수
    bullets: list[str] | None = None
    cta: str | None = None

class ReviewContext(BaseModel):
    product_name: str | None = None
    target_audience: str | None = None
    tone: str | None = None

class ContentReviewInput(BaseModel):
    content: ContentToReview
    context: ReviewContext | None = None
```

#### Output Schema

**TypeScript Interface**:
```typescript
interface ContentReviewOutput {
  overall_score: number;           // 1-10
  dimension_scores: {
    clarity: number;               // 1-10
    persuasiveness: number;        // 1-10
    tone_match: number;            // 1-10
    grammar: number;               // 1-10
  };
  strengths: string[];             // 3개 강점
  weaknesses: string[];            // 3개 약점
  improvements: string[];          // 3-5개 구체적 개선안
  recommendation: 'approve' | 'revise_minor' | 'revise_major' | 'reject';
}
```

**Pydantic Model**:
```python
from pydantic import validator
from typing import Literal

class DimensionScores(BaseModel):
    clarity: int = Field(..., ge=1, le=10)
    persuasiveness: int = Field(..., ge=1, le=10)
    tone_match: int = Field(..., ge=1, le=10)
    grammar: int = Field(..., ge=1, le=10)

class ContentReviewOutput(BaseModel):
    overall_score: int = Field(..., ge=1, le=10)
    dimension_scores: DimensionScores
    strengths: list[str] = Field(..., min_items=3, max_items=3)
    weaknesses: list[str] = Field(..., min_items=3, max_items=3)
    improvements: list[str] = Field(..., min_items=3, max_items=5)
    recommendation: Literal['approve', 'revise_minor', 'revise_major', 'reject']

    @validator("overall_score")
    def validate_overall_score(cls, v, values):
        # overall_score는 dimension_scores의 평균과 유사해야 함
        if "dimension_scores" in values:
            dim_scores = values["dimension_scores"]
            avg = (dim_scores.clarity + dim_scores.persuasiveness +
                   dim_scores.tone_match + dim_scores.grammar) / 4
            if abs(v - avg) > 2:
                raise ValueError(f"overall_score ({v}) too far from dimension average ({avg:.1f})")
        return v
```

#### Validation Rules

| Stage | 규칙 | 통과 조건 |
|-------|------|-----------|
| **1. Schema** | Pydantic 모델 검증 | 모든 점수 1-10 범위 |
| **2. Length** | strengths/weaknesses 각 3개, improvements 3-5개 | 개수 준수 |
| **3. Language** | 한국어 비율 ≥95% | 리뷰는 순한국어 |
| **4. Quality** | overall_score와 dimension_scores 일관성 | 평균 차이 ≤2 |

#### Golden Set 경로
```
tests/golden_sets/reviewer_content_review_golden_set.json
```

---

## DesignerAgent Tasks

### Task 1: `product_image`

#### 설명
제품 이미지 생성 (ComfyUI 또는 NanoBanana 사용)

#### Input Schema

**TypeScript Interface**:
```typescript
interface ProductImageInput {
  product_name: string;
  style?: 'professional' | 'lifestyle' | 'minimalist' | 'vibrant';
  background?: 'white' | 'gradient' | 'scene' | 'transparent';
  width?: number;                  // 기본 600
  height?: number;                 // 기본 400
}
```

**Pydantic Model**:
```python
from typing import Literal

class ProductImageInput(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=100)
    style: Literal['professional', 'lifestyle', 'minimalist', 'vibrant'] | None = None
    background: Literal['white', 'gradient', 'scene', 'transparent'] | None = None
    width: int = Field(600, ge=100, le=2000)
    height: int = Field(400, ge=100, le=2000)
```

#### Output Schema

**TypeScript Interface**:
```typescript
interface ProductImageOutput {
  type: 'base64' | 'url';
  data: string;                    // base64 string or URL
  format: 'png' | 'jpg' | 'webp';
  dimensions: {
    width: number;
    height: number;
  };
  english_prompt: string;          // 생성에 사용된 영문 프롬프트
  negative_prompt?: string;
  provider: 'comfyui' | 'nanobanana' | 'mock';
}
```

**Pydantic Model**:
```python
class ImageDimensions(BaseModel):
    width: int = Field(..., ge=100)
    height: int = Field(..., ge=100)

class ProductImageOutput(BaseModel):
    type: Literal['base64', 'url']
    data: str = Field(..., min_length=1)
    format: Literal['png', 'jpg', 'webp']
    dimensions: ImageDimensions
    english_prompt: str = Field(..., min_length=10)
    negative_prompt: str | None = None
    provider: Literal['comfyui', 'nanobanana', 'mock']
```

#### Validation Rules

| Stage | 규칙 | 통과 조건 |
|-------|------|-----------|
| **1. Schema** | Pydantic 모델 검증 | 모든 필드 타입 일치 |
| **2. Length** | english_prompt ≥10자 | 프롬프트 최소 길이 |
| **3. Image** | base64/URL 형식 검증 | 이미지 데이터 유효성 |
| **4. Quality** | dimensions 실제 이미지와 일치 | 메타데이터 정확성 |

#### Golden Set 경로
```
tests/golden_sets/designer_product_image_golden_set.json
```

---

## OptimizerAgent Tasks

### Task 1: `conversion_optimize`

#### 설명
콘텐츠를 전환율 최적화 관점에서 개선

#### Input Schema

**TypeScript Interface**:
```typescript
interface ConversionOptimizeInput {
  content: {
    headline: string;
    body: string;
    cta?: string;
  };
  review_feedback?: {
    weaknesses: string[];
    improvements: string[];
  };
}
```

**Pydantic Model**:
```python
class ContentToOptimize(BaseModel):
    headline: str = Field(..., min_length=1)
    body: str = Field(..., min_length=1)
    cta: str | None = None

class ReviewFeedback(BaseModel):
    weaknesses: list[str]
    improvements: list[str]

class ConversionOptimizeInput(BaseModel):
    content: ContentToOptimize
    review_feedback: ReviewFeedback | None = None
```

#### Output Schema

**TypeScript Interface**:
```typescript
interface ConversionOptimizeOutput {
  optimized_content: {
    headline: string;
    body: string;
    cta: string;
  };
  improvements: string[];          // 적용한 개선 사항 3-5개
  before_after: {
    headline: { before: string; after: string; reason: string; };
    body: { before: string; after: string; reason: string; };
    cta?: { before: string; after: string; reason: string; };
  };
  expected_impact: string;         // 예상 효과 (50-100자)
}
```

**Pydantic Model**:
```python
class OptimizedContent(BaseModel):
    headline: str = Field(..., min_length=5, max_length=20)
    body: str = Field(..., min_length=20, max_length=80)
    cta: str = Field(..., min_length=4, max_length=15)

class BeforeAfter(BaseModel):
    before: str
    after: str
    reason: str = Field(..., min_length=10, max_length=100)

class BeforeAfterComparison(BaseModel):
    headline: BeforeAfter
    body: BeforeAfter
    cta: BeforeAfter | None = None

class ConversionOptimizeOutput(BaseModel):
    optimized_content: OptimizedContent
    improvements: list[str] = Field(..., min_items=3, max_items=5)
    before_after: BeforeAfterComparison
    expected_impact: str = Field(..., min_length=50, max_length=100)
```

#### Validation Rules

| Stage | 규칙 | 통과 조건 |
|-------|------|-----------|
| **1. Schema** | Pydantic 모델 검증 | 모든 필드 타입/길이 일치 |
| **2. Length** | optimized_content 길이 제약 | headline 5-20, body 20-80, cta 4-15 |
| **3. Language** | 한국어 비율 ≥90% | reason과 expected_impact 한국어 |
| **4. Quality** | before vs after 비교 | after가 before와 다름, reason 논리적 |

#### Golden Set 경로
```
tests/golden_sets/optimizer_conversion_optimize_golden_set.json
```

---

## Validation Pipeline

### 4단계 검증 프로세스

모든 Agent 출력은 다음 4단계 검증을 거칩니다:

#### Stage 1: Schema Validation (Pydantic)
- Pydantic 모델로 타입 및 필드 존재 검증
- 길이 제약 (min_length, max_length) 검증
- Enum 값 검증 (Literal 타입)
- 중첩 구조 검증

**구현**:
```python
def validate_schema(output: dict, task: str) -> StageResult:
    schema_class = get_schema_for_task(task)
    try:
        schema_class(**output)
        return StageResult(stage="schema", passed=True, issues=[])
    except ValidationError as e:
        return StageResult(stage="schema", passed=False, issues=e.errors())
```

#### Stage 2: Length Validation
- 각 필드의 실제 길이가 기대 범위 내인지 검증
- 배열 필드의 항목 개수 검증
- 중첩 필드의 길이 검증

**구현**:
```python
def validate_length(output: dict, task: str) -> StageResult:
    rules = get_length_rules(task)
    issues = []

    for field, rule in rules.items():
        value = output.get(field)
        if "max_length" in rule and len(str(value)) > rule["max_length"]:
            issues.append(f"{field} exceeds {rule['max_length']} chars")

    return StageResult(stage="length", passed=len(issues) == 0, issues=issues)
```

#### Stage 3: Language Validation (한국어 체크)
- 한글 비율 계산 (한글 문자 수 / 전체 문자 수)
- 영어 출력 방지 (한글 비율 < 50% 시 실패)
- 예외: hashtags, english_prompt 등은 영어 허용

**구현**:
```python
import re

def validate_language(output: dict) -> StageResult:
    issues = []

    for field, value in output.items():
        if field in ["hashtags", "english_prompt", "negative_prompt"]:
            continue  # 영어 허용 필드

        if isinstance(value, str):
            korean_ratio = calculate_korean_ratio(value)
            if korean_ratio < 0.5:
                issues.append(f"{field}: 한글 비율 {korean_ratio:.0%} (< 50%)")

    return StageResult(stage="language", passed=len(issues) == 0, issues=issues)

def calculate_korean_ratio(text: str) -> float:
    korean_chars = len(re.findall(r'[가-힣]', text))
    total_chars = len(re.sub(r'\s', '', text))
    return korean_chars / total_chars if total_chars > 0 else 0.0
```

#### Stage 4: Quality Validation
- 기본값 폴백 감지 (예: subheadline = "제품 설명")
- 논리적 일관성 검증 (예: overall_score vs dimension_scores)
- 중복 제거 (예: values에 중복 없음)
- 톤앤매너 일치 (tone 파라미터와 출력 일치)

**구현**:
```python
def validate_quality(output: dict, task: str, input_data: dict) -> StageResult:
    issues = []

    # 기본값 폴백 감지
    if task == "product_detail":
        if output.get("subheadline") == "제품 설명":
            issues.append("subheadline is default fallback value")

    # 논리적 일관성 (ReviewerAgent)
    if task == "content_review":
        overall = output.get("overall_score", 0)
        dim_scores = output.get("dimension_scores", {})
        avg = sum(dim_scores.values()) / len(dim_scores) if dim_scores else 0
        if abs(overall - avg) > 2:
            issues.append(f"overall_score ({overall}) inconsistent with dimension avg ({avg:.1f})")

    # 중복 제거
    if "values" in output:
        values = output["values"]
        if len(values) != len(set(values)):
            issues.append("Duplicate values detected")

    return StageResult(stage="quality", passed=len(issues) == 0, issues=issues)
```

---

## Golden Set 경로 규칙

### 네이밍 규칙
```
tests/golden_sets/{agent}_{task}_golden_set.json
```

### 예시
- `copywriter_product_detail_golden_set.json`
- `copywriter_sns_golden_set.json`
- `copywriter_brand_message_golden_set.json`
- `strategist_brand_kit_golden_set.json`
- `reviewer_content_review_golden_set.json`
- `designer_product_image_golden_set.json`
- `optimizer_conversion_optimize_golden_set.json`

### Golden Set 구조
```json
{
  "meta": {
    "agent": "copywriter",
    "task": "product_detail",
    "version": "1.0",
    "created_at": "2025-11-23",
    "created_by": "B팀 (Backend)",
    "description": "CopywriterAgent product_detail 골든 세트"
  },
  "golden_cases": [
    {
      "id": "golden_001",
      "scenario": "무선 이어폰 - 테크 제품",
      "input": { ... },
      "expected_output": { ... },
      "quality_metrics": {
        "min_score": 7.0,
        "tone": "professional"
      }
    }
  ],
  "validation_criteria": {
    "similarity_threshold": 0.7,
    "quality_score_threshold": 7.0
  }
}
```

---

## 📚 참고 문서

- [A팀 품질 검증 보고서](A_TEAM_QUALITY_VALIDATION_REPORT_2025-11-23.md)
- [Agent Specifications](AGENT_SPECIFICATIONS.md)
- [Prompt Engineering Guidelines](PROMPT_ENGINEERING_GUIDELINES.md)
- [Golden Set README](../tests/golden_sets/README.md)

---

**작성자**: B팀 (Backend) + A팀 (QA)
**검토자**: A팀 (QA), C팀 (Frontend)
**승인 날짜**: 2025-11-23 (승인 대기중)

**Status**: 🟢 **READY FOR IMPLEMENTATION**
