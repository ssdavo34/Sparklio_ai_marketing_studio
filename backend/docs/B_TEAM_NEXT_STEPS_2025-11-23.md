# B팀 다음 스프린트 가이드

**작성일**: 2025-11-23
**작성자**: B팀 (Backend)
**대상**: 다음 세션 B팀 개발자
**범위**: Copywriter/Strategist 완료 → ReviewerAgent 중심 확장

---

## 📊 현재 B팀 완료 상태 요약

### ✅ 이미 완료된 것 (재사용 템플릿으로 활용)

#### 1. Copywriter 라인 (Production Ready)
- ✅ 4단계 Validation Pipeline (`output_validator.py`)
- ✅ Retry Logic + temperature 튜닝 (0.4→0.5→0.6)
- ✅ Semantic Similarity 기반 Golden Set 평가
- ✅ Golden Set CI 연동 (회귀 방지선)
- ✅ 품질 로깅 구조 확보 (Prometheus/StatsD 연동 가능)

#### 2. Strategist 라인 (Production Ready)
- ✅ `app/schemas/strategist.py` – Pydantic 스키마 (TS와 1:1 매칭)
- ✅ `app/services/agents/strategist.py` – Retry + Validation 통합
- ✅ `tests/golden_set_validator.py` – Multi-agent Golden Set 검증
- ✅ `POST /api/v1/agents/strategist/execute` – API 엔드포인트
- ✅ `STRATEGIST_INTEGRATION_GUIDE_2025-11-23.md` – 통합 가이드

#### 3. Frontend 연동 준비 완료
**C팀 작업 (완료)**:
- ✅ StrategistStrategyView.tsx
- ✅ Strategist ↔ ContentPlan 탭 연동
- ✅ strategist-api.ts (generateCampaignStrategy)

**B팀 작업 (완료)**:
- ✅ JSON 스키마 / 응답 구조 / Validation 완전 매칭

---

## 🎯 이번 스프린트 최우선 목표

### 한 줄 요약
> **ReviewerAgent v1을 Copywriter/Strategist와 동일한 품질 시스템으로 세우기.**
> (스키마 → Validation → Retry → Golden Set → CI까지 한 번에 세트로)

### ReviewerAgent 역할
- Copywriter/Strategist가 생성한 결과를 **평가·진단·코멘트**
- 텍스트 "생성" Agent가 아닌 **품질 Filter/Advisor** 역할
- 사람 마케터가 카피를 보고 줄 법한 리뷰를 구조화

---

## 📋 P0: ReviewerAgent 스키마 & 핵심 역할 정의

### P0-1. Pydantic 스키마 정의

**파일**: `app/schemas/reviewer.py`

**모델 제안**:

#### AdCopyReviewInputV1
```python
class AdCopyReviewInputV1(BaseModel):
    """광고 카피 리뷰 입력"""
    original_copy: Dict[str, Any]  # AdCopySimpleOutputV2 또는 ProductDetailOutput
    campaign_context: Optional[Dict[str, Any]] = None  # 브랜드/타겟/목표 등
    review_criteria: Optional[List[str]] = None  # 특정 기준 강조 (tone, clarity 등)
```

#### AdCopyReviewOutputV1
```python
class AdCopyReviewOutputV1(BaseModel):
    """광고 카피 리뷰 출력"""
    overall_score: float = Field(..., ge=0.0, le=10.0, description="전체 품질 점수 (0-10)")

    # 점수 세부사항
    tone_match_score: float = Field(..., ge=0.0, le=10.0)
    clarity_score: float = Field(..., ge=0.0, le=10.0)
    persuasiveness_score: float = Field(..., ge=0.0, le=10.0)
    brand_alignment_score: float = Field(..., ge=0.0, le=10.0)

    # 정성 평가
    strengths: List[str] = Field(..., min_items=1, max_items=5, description="강점 (1-5개)")
    weaknesses: List[str] = Field(..., min_items=1, max_items=5, description="약점 (1-5개)")
    improvement_suggestions: List[str] = Field(..., min_items=1, max_items=5, description="개선 제안")

    # 리스크 플래그
    risk_flags: List[str] = Field(default=[], description="리스크 요인 (규제/과장/톤 오류)")

    # 종합 판정
    approval_status: str = Field(..., description="approved | needs_revision | rejected")
    revision_priority: str = Field(..., description="low | medium | high | critical")
```

### P0-2. Task/Agent 구조 정의

**Task 이름**: `ad_copy_quality_check`

**위치**: `app/services/agents/reviewer.py`

**역할**:
- 입력: `AdCopyReviewInputV1`
- 출력: `AdCopyReviewOutputV1`
- 시스템 프롬프트:
  - Copywriter/Strategist 결과 평가
  - 점수 + 구체적 코멘트 + 리스크 플래그 생성
- 모드: JSON Mode (Copywriter/Strategist와 동일)

---

## 🔧 P1: ReviewerAgent 구현 & Validation/Retry 적용

### P1-1. ReviewerAgent 클래스 구현

**파일**: `app/services/agents/reviewer.py`

**구현 패턴**:
```python
class ReviewerAgent(AgentBase):
    """
    Reviewer Agent

    콘텐츠 품질 검토 전문 Agent

    주요 작업:
    1. ad_copy_quality_check: 광고 카피 품질 검토
    2. content_review: 일반 콘텐츠 검토
    3. brand_compliance: 브랜드 가이드라인 준수 여부
    """

    @property
    def name(self) -> str:
        return "reviewer"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        # Copywriter/Strategist와 동일한 패턴
        # 1. 요청 검증
        # 2. LLM 프롬프트 구성
        # 3. Retry Logic (max 3회, temperature 0.2→0.3→0.4)
        # 4. Validation Pipeline
        # 5. 구조화된 품질 로그
        pass
```

**LLM 설정**:
- Temperature: 0.2~0.4 (리뷰는 일관성이 중요 → 낮게)
- Max Retries: 3회
- JSON Mode: 필수

### P1-2. Validation Pipeline 적용

**파일**: `app/services/validation/output_validator.py`

**추가할 Reviewer 검증 룰**:

```python
# SCHEMA_MAP에 추가
SCHEMA_MAP = {
    "product_detail": ProductDetailOutput,
    "sns": SNSOutput,
    "brand_message": BrandMessageOutput,
    "campaign_strategy": CampaignStrategyOutputV1,
    "ad_copy_quality_check": AdCopyReviewOutputV1  # NEW
}

# Length Rules
def _get_length_rules(self, task: str):
    if task == "ad_copy_quality_check":
        return {
            "overall_score": {"min": 0.0, "max": 10.0},
            "strengths": {"min_items": 1, "max_items": 5, "max_item_length": 150},
            "weaknesses": {"min_items": 1, "max_items": 5, "max_item_length": 150},
            "improvement_suggestions": {"min_items": 1, "max_items": 5, "max_item_length": 200},
            "risk_flags": {"max_items": 10, "max_item_length": 100}
        }

# Korean Threshold
def _get_korean_threshold(self, task: str):
    if task == "ad_copy_quality_check":
        return 0.9  # 리뷰는 한국어 90% 이상
```

**Validation Stages**:
1. **Stage 1 – Schema**: `AdCopyReviewOutputV1` Pydantic 검증
2. **Stage 2 – Length**: strengths/weaknesses/suggestions 최소 1~5개
3. **Stage 3 – Language**: 한국어 비율 ≥ 90%
4. **Stage 4 – Quality**:
   - 점수 범위 0~10 여부
   - strengths/weaknesses 중복/동어반복 체크

**Retry Logic**:
- Validation 실패 → max 3회 재시도
- 그래도 실패 → `AgentError`로 노출

---

## 🧪 P2: ReviewerAgent Golden Set & CI 통합

### P2-1. Golden Set 파일 구성

**디렉토리**: `backend/tests/golden_set/`

**파일명**: `reviewer_ad_copy_quality_check_v1.json`

**케이스 구성 (10개 목표)**:

Copywriter/Strategist Golden Set과 **페어링**:
1. 무선 이어폰 (Copywriter 결과 → Reviewer 평가)
2. 프리미엄 스킨케어 (Strategist 결과 → Reviewer 평가)
3. 요가 매트
4. 향수 (Luxury)
5. SaaS 플랫폼
6. 온라인 교육
7. 피트니스 앱
8. 친환경 생활용품
9. 펫 케어 제품
10. 차량용품 (Premium)

**각 케이스 구조**:
```json
{
  "case_id": "reviewer_001",
  "name": "무선 이어폰 광고 카피 리뷰",
  "difficulty": "medium",
  "input": {
    "original_copy": {
      "headline": "소음은 지우고, 음악만 남기다",
      "subheadline": "24시간 배터리, ANC 노이즈캔슬링",
      "body": "...",
      "bullets": ["...", "...", "..."],
      "cta": "지금 체험하기"
    },
    "campaign_context": {
      "brand_name": "SoundPro",
      "target_audience": "2030 직장인",
      "tone": "professional"
    }
  },
  "expected_output": {
    "overall_score_range": [7.0, 9.0],
    "must_include_strengths": ["headline", "cta"],
    "must_include_weaknesses": ["subheadline"],
    "approval_status": "approved"
  },
  "min_score": 7.0
}
```

### P2-2. Golden Set Validator 확장

**파일**: `tests/golden_set_validator.py`

**추가 작업**:
```python
# Agent factory에 reviewer 추가
AGENTS = {
    "copywriter": get_copywriter_agent,
    "strategist": get_strategist_agent,
    "reviewer": get_reviewer_agent  # NEW
}

# Reviewer 전용 평가 로직
def _validate_reviewer_output(self, actual, expected):
    """
    Reviewer 출력 검증

    - 점수 범위 체크
    - strengths/weaknesses 키워드 포함 여부
    - approval_status 일치 여부
    """
    score = 10.0

    # 점수 범위 체크
    if not (expected["overall_score_range"][0] <= actual["overall_score"] <= expected["overall_score_range"][1]):
        score -= 2.0

    # 키워드 포함 여부
    strengths_text = " ".join(actual["strengths"])
    for keyword in expected.get("must_include_strengths", []):
        if keyword not in strengths_text:
            score -= 1.0

    # approval_status 체크
    if actual["approval_status"] != expected["approval_status"]:
        score -= 2.0

    return max(0.0, score)
```

**Pass 기준**:
- Pass Rate ≥ 70%
- Avg Score ≥ 7.0
- Critical Failure = 0

### P2-3. CI 연동

**파일**: `.github/workflows/golden-set-validation.yml`

**추가**:
```yaml
jobs:
  validate-all-agents:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        agent: [copywriter, strategist, reviewer]  # reviewer 추가

    steps:
      - name: Run ${{ matrix.agent }} Golden Set Validation
        run: |
          python tests/golden_set_validator.py \
            --agent ${{ matrix.agent }} \
            --ci \
            --min-pass-rate 70 \
            --min-score 7.0
```

---

## 🚀 P3: Optimizer/Designer 확장 준비 (옵션)

Reviewer까지 끝나면 **품질 시스템 템플릿의 주인**이 됩니다.

### 다음 후보 Agent

#### 1. OptimizerAgent (`optimizer.ad_copy_optimize`)
- **역할**: Reviewer 결과 + Copywriter 결과 기반 최적화
- **입력**:
  - `original_copy` (Copywriter 결과)
  - `review_feedback` (Reviewer 결과)
- **출력**:
  - `optimized_copy` (개선된 카피)
  - `changes_made` (변경 사항 목록)
  - `improvement_score` (개선도)

#### 2. DesignerAgent (`designer.layout_suggestion`)
- **역할**: Strategist + Copywriter + ContentPlan → 레이아웃 JSON 생성
- **입력**:
  - `campaign_strategy` (Strategist 결과)
  - `copy_content` (Copywriter 결과)
  - `canvas_constraints` (크기, 비율 등)
- **출력**:
  - `layout_json` (Canvas Builder v2 호환)
  - `design_rationale` (디자인 근거)

**이번 문서에서는 "착수 선언"까지만**, 실제 구현은 다음 스프린트에서.

---

## ✅ 이번 스프린트 체크리스트

### Week 1: 설계 & 스키마
- [ ] `app/schemas/reviewer.py` 작성
  - [ ] `AdCopyReviewInputV1`
  - [ ] `AdCopyReviewOutputV1`
  - [ ] Field validators
- [ ] `app/schemas/__init__.py`에 export 추가
- [ ] Task 구조 확정 (`ad_copy_quality_check`)

### Week 2: 구현 & Validation
- [ ] `app/services/agents/reviewer.py` 구현
  - [ ] `ReviewerAgent` 클래스
  - [ ] Retry Logic (max 3회, temperature 0.2→0.3→0.4)
  - [ ] `_enhance_payload()` 메서드
- [ ] `output_validator.py`에 Reviewer 룰 추가
  - [ ] `SCHEMA_MAP`에 등록
  - [ ] Length rules
  - [ ] Korean threshold (90%)
  - [ ] Quality rules

### Week 3: Golden Set & CI
- [ ] Golden Set 작성 (`reviewer_ad_copy_quality_check_v1.json`)
  - [ ] 10개 케이스 (Copywriter/Strategist와 페어링)
  - [ ] Expected output 정의
- [ ] `golden_set_validator.py` 확장
  - [ ] Reviewer 평가 로직 추가
  - [ ] Multi-agent factory 업데이트
- [ ] CI 연동
  - [ ] `.github/workflows/golden-set-validation.yml` 업데이트
  - [ ] Reviewer 검증 추가

### Week 4: 테스트 & 문서
- [ ] E2E 테스트
  - [ ] Copywriter → Reviewer 플로우
  - [ ] Strategist → Reviewer 플로우
- [ ] 통합 가이드 작성
  - [ ] `REVIEWER_INTEGRATION_GUIDE_2025-11.md`
  - [ ] API 연동 방법
  - [ ] Frontend 통합 예시

---

## 📦 템플릿 재사용 체크리스트

Reviewer 구현 시 **Copywriter/Strategist 패턴 재사용**:

### ✅ 재사용 가능한 것
- [ ] `AgentBase` 상속 구조
- [ ] Retry Logic (max_retries=3, temperature 조정)
- [ ] Validation Pipeline (4단계)
- [ ] 구조화된 품질 로그 (quality_metrics)
- [ ] Golden Set Validator 구조
- [ ] CI/CD 워크플로우

### ⚠️ Reviewer에 맞게 조정할 것
- [ ] Temperature 범위 (0.2~0.4, Copywriter보다 낮음)
- [ ] Korean threshold (90%, Strategist보다 높음)
- [ ] Validation rules (점수 범위, 키워드 체크)
- [ ] Golden Set 평가 로직 (키워드 매칭 vs Semantic Similarity)

---

## 📚 참고 문서

1. **Copywriter 구현 참고**:
   - `app/services/agents/copywriter.py:75-185` (Retry Logic)
   - `app/services/agents/copywriter.py:155-173` (Quality Logging)

2. **Strategist 구현 참고**:
   - `app/schemas/strategist.py` (Pydantic 스키마 구조)
   - `app/services/agents/strategist.py:74-185` (Validation 통합)

3. **Golden Set 참고**:
   - `tests/golden_set/strategist_campaign_strategy_v1.json` (구조)
   - `tests/golden_set_validator.py:85-111` (Multi-agent factory)

4. **CI 참고**:
   - `.github/workflows/golden-set-validation.yml`

---

## 🎯 성공 기준

이번 스프린트가 끝나면:

1. **ReviewerAgent Production Ready**
   - ✅ Pydantic 스키마 정의
   - ✅ Retry Logic + Validation 통합
   - ✅ Golden Set 10개 + CI 연동
   - ✅ API 엔드포인트 (`POST /api/v1/agents/reviewer/execute`)

2. **품질 시스템 완성**
   - ✅ Copywriter + Strategist + Reviewer = 3개 Agent
   - ✅ 모두 동일한 품질 보증 수준
   - ✅ CI/CD 자동 품질 게이트

3. **확장 준비 완료**
   - ✅ Optimizer/Designer에 동일 패턴 적용 가능
   - ✅ 템플릿 문서화 완료
   - ✅ B팀 = "품질 시스템 전문가"

---

**작성자**: B팀 (Backend) - Claude (2025-11-23 세션)
**다음 작업자**: B팀 (Backend) - Claude (다음 세션)
**문서 버전**: 1.0
**최종 업데이트**: 2025-11-23

**상태**: 🟢 **READY FOR REVIEWER IMPLEMENTATION**
