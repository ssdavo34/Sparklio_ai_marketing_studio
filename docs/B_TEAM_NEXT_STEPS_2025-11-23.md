# B_TEAM_NEXT_STEPS_2025-11-23.md

**버전:** v1.0
**작성일:** 2025-11-23
**대상:** B팀 (Backend)
**범위:** Copywriter/Strategist 라인 이후, ReviewerAgent 중심 확장

---

## 1. 현재 B팀 완료 상태 요약

### 이미 끝난 것 (재사용 템플릿으로 활용)

#### 1.1 Copywriter 라인 ✅

- **4단계 Validation Pipeline** (`output_validator.py`)
  - Stage 1: Schema Validation (Pydantic)
  - Stage 2: Length/Structure Rules
  - Stage 3: Language Detection (한국어 비율 ≥ 90%)
  - Stage 4: Quality Checks (Semantic Similarity)

- **Retry Logic + Temperature 튜닝**
  - Max 3회 재시도
  - Temperature 점진적 상승 (0.7 → 0.8 → 0.9)
  - 실패 시 AgentError로 노출

- **Semantic Similarity 기반 Golden Set 평가**
  - sentence-transformers 활용
  - 벡터 유사도 기반 품질 측정

- **Golden Set CI 연동** (회귀 방지선)
  - `.github/workflows/golden-set-validation.yml`
  - Pass Rate ≥ 70%, Critical Failure = 0

- **품질 로깅 구조 확보**
  - Prometheus/StatsD/Elasticsearch 연동 가능
  - 구조화된 로그 포맷

#### 1.2 Strategist 라인 ✅

- **`app/schemas/strategist.py`**
  - Pydantic 스키마 (TypeScript와 1:1 매칭)
  - CampaignStrategyOutputV1 (9개 세부 타입)

- **`app/services/agents/strategist.py`**
  - Retry + Validation 통합
  - JSON Mode 구현
  - Temperature: 0.5~0.7

- **`tests/golden_set_validator.py`**
  - Multi-agent Golden Set 검증
  - `--agent strategist` 옵션 지원

- **API 엔드포인트**
  - `POST /api/v1/agents/strategist/execute`
  - Task: `campaign_strategy`

- **통합 가이드 문서**
  - `STRATEGIST_INTEGRATION_GUIDE_2025-11-23.md`
  - API 연동 방법 (cURL, Python, TypeScript)
  - Validation Pipeline 설명
  - 에러 처리 가이드

#### 1.3 C팀과의 연동 준비 ✅

**C팀 (Frontend):**
- `StrategistStrategyView.tsx` (전략 요약 뷰어)
- Strategist ↔ ContentPlan 탭 연동
- `strategist-api.ts` (`generateCampaignStrategy()`)
- 자동 타입 감지 및 렌더링

**B팀 (Backend):**
- JSON 스키마 / 응답 구조 / Validation 완료
- Frontend와 타입 완전 호환

---

**👉 결론:**

**Copywriter / Strategist = Production Ready + 품질 시스템까지 세팅 완료.**

이제 같은 패턴을 **Reviewer → Optimizer → Designer** 순으로 "복제·변형"하는 단계로 진입.

---

## 2. 이번 스프린트 B팀 최우선 목표

### 🎯 목표 한 줄 요약

> **ReviewerAgent v1을 Copywriter/Strategist와 동일한 품질 시스템으로 세우기.**
>
> (스키마 → Validation → Retry → Golden Set → CI까지 한 번에 세트로)

### ReviewerAgent의 역할

- Copywriter/Strategist가 생성한 결과를 **"평가·진단·코멘트"** 제공
- 텍스트를 "생성"하는 주도 Agent라기보다 **품질 Filter/Advisor** 역할
- 출력: 점수 + 장점/단점 + 개선 제안 + 리스크 플래그

---

## 3. P0 – ReviewerAgent 스키마 & 핵심 역할 정의

> A팀이 설계한 스펙 문서(예: `REVIEWER_AGENT_SPEC_V1.md`)를 기준으로 코드화

### P0-1. Pydantic 스키마 정의

**파일:**
- `app/schemas/reviewer.py`

**모델 구조:**

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class AdCopyReviewInputV1(BaseModel):
    """AdCopy 리뷰 요청"""
    schema_version: str = Field("1.0", description="스키마 버전")

    # 리뷰 대상 카피
    original_copy: dict  # AdCopySimpleOutputV2 구조

    # 캠페인 컨텍스트 (선택적)
    campaign_context: Optional[dict] = Field(
        None,
        description="브랜드/타겟/목표 등 추가 정보"
    )

class AdCopyReviewOutputV1(BaseModel):
    """AdCopy 리뷰 결과"""
    schema_version: str = Field("1.0", description="스키마 버전")

    # 종합 평가
    overall_score: float = Field(..., ge=0, le=10, description="종합 점수 (0~10)")

    # 장점/단점
    strengths: List[str] = Field(..., min_items=1, description="강점 목록")
    weaknesses: List[str] = Field(..., min_items=1, description="약점 목록")

    # 개선 제안
    improvement_suggestions: List[str] = Field(
        ..., min_items=1, description="구체적 개선 제안"
    )

    # 리스크 플래그
    risk_flags: List[str] = Field(
        default_factory=list,
        description="규제/과장/톤 오류 등 위험 요소"
    )

    # 세부 점수
    tone_match_score: float = Field(..., ge=0, le=10, description="요청 톤 일치도")
    clarity_score: float = Field(..., ge=0, le=10, description="명확성 점수")
    persuasiveness_score: float = Field(..., ge=0, le=10, description="설득력 점수")

    # 메타데이터
    meta: Optional[dict] = Field(
        None,
        description="리뷰 생성 메타정보 (모델, 시간 등)"
    )
```

**설계 기준:**
"사람 마케터가 카피를 보고 줄 법한 리뷰를 구조화해서 표현"

---

### P0-2. Task/Agent 구조 정리

**Task 이름:**
- `reviewer.ad_copy_quality_check`

**위치:**
- `app/services/agents/reviewer.py`

**역할:**
- **입력:** `AdCopyReviewInputV1`
- **출력:** `AdCopyReviewOutputV1`
- **시스템 프롬프트:**
  - Copywriter/Strategist 결과를 평가
  - 점수 + 구체적 코멘트 + 리스크 플래그 생성
  - 한국어 마케팅 전문가 페르소나
- **모드:** JSON Mode (Copywriter/Strategist와 동일)
- **Temperature:** 0.2~0.4 (리뷰는 일관성이 중요)

---

## 4. P1 – ReviewerAgent 구현 & Validation/Retry 적용

### P1-1. ReviewerAgent 클래스 구현

**파일:**
- `app/services/agents/reviewer.py`

**구현 패턴:**

```python
"""
ReviewerAgent

AdCopy/CampaignStrategy 결과를 평가하고 피드백을 제공하는 Agent
"""

from app.services.agents.base import BaseAgent
from app.schemas.reviewer import AdCopyReviewInputV1, AdCopyReviewOutputV1
from app.services.validation.output_validator import OutputValidator

class ReviewerAgent(BaseAgent):
    """
    리뷰/평가 전문 Agent
    """

    def __init__(self, llm_provider=None):
        super().__init__(llm_provider)
        self.validator = OutputValidator()

    async def execute(self, task: str, payload: dict) -> dict:
        """
        Task 실행

        Args:
            task: "ad_copy_quality_check" 등
            payload: AdCopyReviewInputV1 형태

        Returns:
            AgentResponse with AdCopyReviewOutputV1
        """

        if task == "ad_copy_quality_check":
            return await self._review_ad_copy(payload)
        else:
            raise ValueError(f"Unknown task: {task}")

    async def _review_ad_copy(
        self,
        payload: dict,
        max_retries: int = 3
    ) -> dict:
        """
        AdCopy 품질 리뷰

        Args:
            payload: AdCopyReviewInputV1
            max_retries: 최대 재시도 횟수

        Returns:
            AgentResponse
        """

        # 입력 검증
        input_data = AdCopyReviewInputV1(**payload)

        # 시스템 프롬프트
        system_prompt = self._build_system_prompt()

        # 사용자 프롬프트
        user_prompt = self._build_user_prompt(input_data)

        # Retry Loop
        for attempt in range(max_retries):
            try:
                # LLM 호출
                temperature = 0.2 + (attempt * 0.1)  # 0.2 → 0.3 → 0.4

                raw_output = await self.llm_provider.generate(
                    system=system_prompt,
                    user=user_prompt,
                    temperature=temperature,
                    response_format="json_object"
                )

                # Pydantic 파싱
                review_output = AdCopyReviewOutputV1(**raw_output)

                # Validation Pipeline
                validation_result = self.validator.validate(
                    output=review_output.dict(),
                    schema_type="ad_copy_review_v1"
                )

                if validation_result.is_valid:
                    return {
                        "status": "success",
                        "data": review_output.dict(),
                        "meta": {
                            "attempts": attempt + 1,
                            "validation": validation_result.dict()
                        }
                    }

                # Validation 실패
                if attempt < max_retries - 1:
                    self._log_retry(attempt, validation_result)
                    continue

            except Exception as e:
                if attempt < max_retries - 1:
                    self._log_error(attempt, e)
                    continue
                raise

        # 모든 재시도 실패
        raise AgentError(
            code="REVIEWER_VALIDATION_FAILED",
            message="Failed to generate valid review after retries"
        )

    def _build_system_prompt(self) -> str:
        """시스템 프롬프트 생성"""
        return """
당신은 한국 마케팅 전문가이자 카피 품질 평가자입니다.

역할:
- 광고 카피를 객관적으로 평가
- 강점과 약점을 구체적으로 제시
- 실행 가능한 개선 제안 제공
- 규제/과장/톤 문제 등 리스크 플래그

평가 기준:
1. 명확성 (메시지가 명확한가?)
2. 설득력 (행동을 유도하는가?)
3. 톤 일치도 (요청된 톤과 맞는가?)
4. 문법/표현 (자연스러운가?)
5. 규제 준수 (과장/허위 없는가?)

출력 형식: JSON (AdCopyReviewOutputV1 스키마)
"""

    def _build_user_prompt(self, input_data: AdCopyReviewInputV1) -> str:
        """사용자 프롬프트 생성"""
        return f"""
다음 광고 카피를 평가해주세요:

{json.dumps(input_data.original_copy, ensure_ascii=False, indent=2)}

캠페인 컨텍스트:
{json.dumps(input_data.campaign_context or {}, ensure_ascii=False, indent=2)}

다음 항목을 JSON 형식으로 제공해주세요:
- overall_score: 종합 점수 (0~10)
- strengths: 강점 목록 (최소 1개)
- weaknesses: 약점 목록 (최소 1개)
- improvement_suggestions: 개선 제안 (최소 1개, 구체적으로)
- risk_flags: 위험 요소 (있다면)
- tone_match_score: 톤 일치도 (0~10)
- clarity_score: 명확성 (0~10)
- persuasiveness_score: 설득력 (0~10)
"""
```

---

### P1-2. Validation Pipeline 적용

**`OutputValidator`에 Reviewer용 룰 추가:**

```python
# app/services/validation/output_validator.py

def validate(self, output: dict, schema_type: str) -> ValidationResult:
    """
    출력 검증

    Args:
        output: Agent 출력 데이터
        schema_type: "ad_copy_v2" | "campaign_strategy_v1" | "ad_copy_review_v1"
    """

    if schema_type == "ad_copy_review_v1":
        return self._validate_ad_copy_review(output)
    # ... 기존 로직
```

**Validation 단계:**

1. **Stage 1 – Schema Validation**
   - `AdCopyReviewOutputV1`로 Pydantic 검증
   - 필수 필드 존재 여부
   - 타입 일치 여부

2. **Stage 2 – Length/Structure Rules**
   - `strengths`: 1~5개, 각 10~200자
   - `weaknesses`: 1~5개, 각 10~200자
   - `improvement_suggestions`: 1~5개, 각 20~300자
   - `risk_flags`: 0~10개, 각 10~200자

3. **Stage 3 – Language Detection**
   - 한국어 비율 ≥ 90% (Copywriter 기준과 동일)
   - strengths/weaknesses/suggestions 각각 체크

4. **Stage 4 – Quality Checks**
   - 점수 범위 검증:
     - `overall_score`: 0~10
     - `tone_match_score`: 0~10
     - `clarity_score`: 0~10
     - `persuasiveness_score`: 0~10
   - 중복/동어반복 체크:
     - strengths와 weaknesses가 완전히 같은 문장 없는지
   - 최소 의미 있는 내용:
     - "좋습니다", "나쁩니다" 같은 1단어 코멘트 거부

**결과 처리:**

- **Validation 실패:**
  - Retry Logic 적용 (max 2~3회)
  - Temperature 소폭 조정 (0.2 → 0.3 → 0.4)
  - 그래도 실패 → `AgentError`로 노출

- **Validation 성공:**
  - `status: "success"`
  - C팀 `AIResponseRenderer`가 자동 렌더링

---

## 5. P2 – ReviewerAgent Golden Set & CI 통합

### P2-1. Golden Set 파일 구성

**디렉토리:**
```
backend/tests/golden_set/
├── copywriter/
│   └── copywriter_ad_copy_simple_v2.json
├── strategist/
│   └── strategist_campaign_strategy_v1.json
└── reviewer/                              # 신규
    ├── reviewer_ad_copy_review_v1.json
    └── test_cases/
        ├── case_001_wireless_earbuds.json
        ├── case_002_skincare.json
        ├── case_003_yoga_mat.json
        ├── case_004_perfume.json
        ├── case_005_saas.json
        ├── case_006_education.json
        ├── case_007_fitness_app.json
        ├── case_008_coffee.json
        ├── case_009_furniture.json
        └── case_010_travel.json
```

**케이스 구조 예시 (10개 목표):**

각 케이스는 기존 Copywriter Golden Set 결과와 **페어링**:

```json
{
  "case_id": "reviewer_001_wireless_earbuds",
  "description": "무선 이어폰 광고 카피 리뷰",

  "input": {
    "schema_version": "1.0",
    "original_copy": {
      // Copywriter Golden Set case_001의 결과 재사용
      "headline": "당신의 음악, 새로운 차원으로",
      "subheadline": "프리미엄 노이즈 캔슬링, 24시간 배터리",
      "body": "...",
      "bullets": ["...", "...", "..."],
      "cta": "지금 바로 만나보세요"
    },
    "campaign_context": {
      "brand": "SoundPro",
      "target_audience": "20-30대 음악 애호가",
      "campaign_objective": "신제품 런칭"
    }
  },

  "expected": {
    "overall_score_range": [7.0, 9.0],  // 완전 일치 X, 범위로 평가

    "must_include_keywords": {
      "strengths": ["명확", "간결", "프리미엄"],
      "weaknesses": ["구체", "차별"],
      "improvement_suggestions": ["USP", "경쟁사"]
    },

    "risk_flags_expected": [],  // 규제 이슈 없음

    "tone_match_score_range": [6.0, 9.0],
    "clarity_score_range": [7.0, 10.0],
    "persuasiveness_score_range": [6.0, 9.0]
  },

  "validation_criteria": {
    "score_tolerance": 0.5,
    "keyword_match_threshold": 0.6
  }
}
```

**10개 케이스 목표:**
1. 무선 이어폰 (기존 Copywriter case_001)
2. 스킨케어 (기존 Copywriter case_002)
3. 요가 매트 (기존 Copywriter case_003)
4. 향수 (신규)
5. SaaS (신규)
6. 교육 (신규)
7. 피트니스 앱 (신규)
8. 커피 (신규)
9. 가구 (신규)
10. 여행 (신규)

---

### P2-2. Golden Set Validator 확장

**파일:**
- `tests/golden_set_validator.py`

**확장 내용:**

```python
# tests/golden_set_validator.py

def validate_reviewer_case(case: dict, agent: ReviewerAgent) -> dict:
    """
    Reviewer Golden Set 케이스 검증

    Args:
        case: Golden Set 케이스 데이터
        agent: ReviewerAgent 인스턴스

    Returns:
        검증 결과 dict
    """

    result = {
        "case_id": case["case_id"],
        "passed": True,
        "score": 0.0,
        "errors": []
    }

    # 1. Agent 실행
    try:
        response = await agent.execute(
            task="ad_copy_quality_check",
            payload=case["input"]
        )

        if response["status"] != "success":
            result["passed"] = False
            result["errors"].append("Agent execution failed")
            return result

        review_output = response["data"]
        expected = case["expected"]

    except Exception as e:
        result["passed"] = False
        result["errors"].append(f"Execution error: {str(e)}")
        return result

    # 2. 점수 범위 검증
    score_checks = [
        ("overall_score", expected["overall_score_range"]),
        ("tone_match_score", expected["tone_match_score_range"]),
        ("clarity_score", expected["clarity_score_range"]),
        ("persuasiveness_score", expected["persuasiveness_score_range"])
    ]

    score_points = 0
    for field, (min_val, max_val) in score_checks:
        actual = review_output.get(field, 0)
        if min_val <= actual <= max_val:
            score_points += 0.25
        else:
            result["errors"].append(
                f"{field} out of range: {actual} not in [{min_val}, {max_val}]"
            )

    # 3. 키워드 포함 여부 검증
    keyword_sections = ["strengths", "weaknesses", "improvement_suggestions"]
    keyword_points = 0

    for section in keyword_sections:
        expected_keywords = expected["must_include_keywords"].get(section, [])
        actual_text = " ".join(review_output.get(section, [])).lower()

        matched = sum(1 for kw in expected_keywords if kw.lower() in actual_text)
        match_rate = matched / len(expected_keywords) if expected_keywords else 1.0

        threshold = case["validation_criteria"]["keyword_match_threshold"]
        if match_rate >= threshold:
            keyword_points += 0.33
        else:
            result["errors"].append(
                f"{section} keyword match rate: {match_rate:.2f} < {threshold}"
            )

    # 4. 최종 점수 계산
    result["score"] = (score_points + keyword_points) / 2 * 100  # 0~100점

    # 5. Pass 판정
    if result["score"] < 70:
        result["passed"] = False

    return result


# CLI 확장
if __name__ == "__main__":
    parser.add_argument("--agent", choices=["copywriter", "strategist", "reviewer"])

    # ...

    if args.agent == "reviewer":
        results = validate_reviewer_golden_set()
```

**평가 기준 (v1):**

- **Pass Rate ≥ 70%**
  - 10개 중 7개 이상 Pass

- **Critical Failure = 0**
  - Agent 실행 자체 실패 없어야 함

- **Avg Score**
  - 내부 평가용 (너무 빡세지 않게)
  - 참고 지표로 활용

---

### P2-3. CI 연동

**파일:**
- `.github/workflows/golden-set-validation.yml`

**수정 내용:**

```yaml
name: Golden Set Validation

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  validate-golden-sets:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        agent: [copywriter, strategist, reviewer]  # reviewer 추가

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt

      - name: Validate ${{ matrix.agent }} Golden Set
        run: |
          python tests/golden_set_validator.py --agent ${{ matrix.agent }}
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.agent }}-validation-results
          path: tests/results/${{ matrix.agent }}_*.json
```

**CI 동작:**
1. Copywriter, Strategist, Reviewer 병렬 실행
2. 각 Agent별 Pass Rate 확인
3. 하나라도 실패 시 CI fail 또는 strong warning
4. 결과 아티팩트 저장

---

## 6. P3 – Optimizer/Designer 확장 준비 (옵션)

Reviewer까지 끝나면 B팀은 **"품질 시스템 템플릿의 주인"**이 됩니다.

다음 후보:

### 6.1 OptimizerAgent

**Task:** `optimizer.ad_copy_optimize`

**역할:**
- Reviewer 결과 + Copywriter 결과 기반
- 특정 필드(Headline/CTA 등) 재생성
- Before/After 품질 비교

**입력:**
```python
class AdCopyOptimizeInputV1(BaseModel):
    original_copy: dict  # AdCopySimpleOutputV2
    review_result: dict  # AdCopyReviewOutputV1
    fields_to_optimize: List[str]  # ["headline", "cta"]
```

**출력:**
```python
class AdCopyOptimizeOutputV1(BaseModel):
    optimized_copy: dict  # AdCopySimpleOutputV2
    changes_summary: List[dict]  # 변경 내역
    improvement_metrics: dict  # Before/After 점수
```

---

### 6.2 DesignerAgent

**Task:** `designer.layout_suggestion`

**역할:**
- Strategist + Copywriter + ContentPlan + Canvas 연결
- 레이아웃 JSON 생성 및 Validation

**입력:**
```python
class LayoutSuggestionInputV1(BaseModel):
    campaign_strategy: dict  # CampaignStrategyOutputV1
    ad_copy: dict  # AdCopySimpleOutputV2
    canvas_constraints: dict  # 크기, 비율 등
```

**출력:**
```python
class LayoutSuggestionOutputV1(BaseModel):
    layout_json: dict  # Polotno/Fabric.js 호환
    design_rationale: str
    visual_hierarchy: List[str]
```

---

**이번 문서에서는 "착수 선언"까지만:**
- Optimizer/Designer 스키마 구조 설계
- Task 이름 및 역할 정의
- 실제 구현은 다음 스프린트

---

## 7. 이번 스프린트 B팀 실행 체크리스트

### Week 1 (P0 + P1 시작)

- [ ] `app/schemas/reviewer.py` 생성
  - [ ] `AdCopyReviewInputV1` 정의
  - [ ] `AdCopyReviewOutputV1` 정의
  - [ ] 타입 가드 함수

- [ ] `app/services/agents/reviewer.py` 생성
  - [ ] `ReviewerAgent` 클래스 구현
  - [ ] `_review_ad_copy()` 메서드
  - [ ] 시스템/사용자 프롬프트 작성

- [ ] `OutputValidator` 확장
  - [ ] `_validate_ad_copy_review()` 메서드
  - [ ] 4단계 Validation 룰 추가

### Week 2 (P1 완료 + P2 시작)

- [ ] Retry Logic 테스트
  - [ ] Max 3회 재시도 동작 확인
  - [ ] Temperature 조정 검증

- [ ] Golden Set 케이스 작성
  - [ ] 기존 Copywriter 케이스 5개 재사용
  - [ ] 신규 케이스 5개 추가
  - [ ] 총 10개 완성

- [ ] `golden_set_validator.py` 확장
  - [ ] `--agent reviewer` 옵션 추가
  - [ ] `validate_reviewer_case()` 구현

### Week 3 (P2 완료 + CI 연동)

- [ ] Golden Set 검증
  - [ ] Pass Rate ≥ 70% 달성
  - [ ] Critical Failure = 0 확인

- [ ] CI 연동
  - [ ] `.github/workflows/golden-set-validation.yml` 수정
  - [ ] 3개 Agent 병렬 실행 확인

- [ ] 문서 작성
  - [ ] `REVIEWER_INTEGRATION_GUIDE.md`
  - [ ] API 사용 예시 (cURL, Python)

---

## 8. 완료 조건

### 최소 조건 (Must Have)

✅ ReviewerAgent 실행 성공
✅ Validation Pipeline 통과
✅ Golden Set Pass Rate ≥ 70%
✅ CI에서 자동 검증 통과

### 이상적 조건 (Nice to Have)

✅ Golden Set Pass Rate ≥ 85%
✅ Avg Score ≥ 80점
✅ Optimizer/Designer 스키마 설계 착수
✅ C팀과 연동 테스트 (ReviewerAgent 결과 UI 렌더링)

---

## 9. 참고 문서

- `STRATEGIST_INTEGRATION_GUIDE_2025-11-23.md` - Strategist 구현 패턴
- `C_TEAM_NEXT_STEPS_2025-11-23.md` - Frontend 연동 현황
- `app/services/agents/copywriter.py` - Copywriter 구현 참고
- `app/services/validation/output_validator.py` - Validation 로직 참고
- `tests/golden_set_validator.py` - Golden Set 검증 로직

---

## 10. 팀 간 커뮤니케이션

### B팀 → A팀
- [ ] Reviewer 스키마 리뷰 요청
- [ ] 평가 기준/점수 범위 확정

### B팀 → C팀
- [ ] Reviewer 응답 구조 공유
- [ ] UI 렌더링 필요 사항 확인 (리뷰 결과 표시 방법)

### B팀 내부
- [ ] Golden Set 케이스 분담 (10개)
- [ ] Validation 룰 코드 리뷰
- [ ] CI 통합 테스트

---

**이 문서대로 진행하면:**

1. **Copywriter / Strategist / Reviewer**
   3개 텍스트 Agent가 모두 **"품질 보증된 상태"**

2. **품질 시스템 템플릿 완성**
   Optimizer/Designer를 쌓을 수 있는 기반 완전 구축

3. **Frontend ↔ Backend 자동 통합**
   C팀의 자동 타입 감지/렌더링 시스템과 완벽 호환

---

**버전 이력:**
- v1.0 (2025-11-23): 초안 작성
