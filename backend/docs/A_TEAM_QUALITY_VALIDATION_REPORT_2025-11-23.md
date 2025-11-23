# A팀 품질 검증 보고서

**작성일**: 2025-11-23
**작성자**: B팀 (Backend) - Claude
**검증 대상**: CopywriterAgent (product_detail task)
**검증 방법**: Golden Set 자동 검증 (10개 시나리오)

---

## 📋 Executive Summary

### 🚨 배포 불가 판정

**CopywriterAgent의 현재 품질 수준은 프로덕션 배포 기준을 충족하지 못합니다.**

| 지표 | 목표 | 실제 | 상태 |
|------|------|------|------|
| **Pass Rate** | ≥ 80% | **0%** | 🔴 CRITICAL |
| **평균 점수** | ≥ 7.0/10 | **3.5/10** | 🔴 CRITICAL |
| **통과 케이스** | ≥ 8/10 | **0/10** | 🔴 CRITICAL |

### 긴급 조치 필요

1. ✅ **P0-1**: Validation Pipeline 구현 (4단계 검증)
2. ✅ **P0-2**: JSON Mode 강화 (출력 품질 보장)
3. ✅ **P0-3**: 프롬프트 재작성 (A팀 협업)

---

## 🧪 검증 환경

### 검증 도구
- **Golden Set Validator**: `tests/golden_set_validator.py`
- **Golden Set**: `tests/golden_sets/copywriter_golden_set.json` (10개 시나리오)
- **Agent**: CopywriterAgent v1.0
- **LLM Provider**: Ollama (qwen2.5:7b)

### 검증 기준
```json
{
  "headline": { "max_length": 20, "min_length": 5 },
  "subheadline": { "max_length": 30, "min_length": 10 },
  "body": { "max_length": 80, "min_length": 20 },
  "bullets": { "count": 3, "max_item_length": 20 },
  "cta": { "max_length": 15, "min_length": 4 },
  "similarity_threshold": 0.7,
  "quality_score_threshold": 7.0
}
```

---

## 📊 검증 결과

### 전체 요약

```
============================================================
Agent: copywriter
Total Cases: 10
Passed: 0
Failed: 10
Pass Rate: 0.0%
Average Score: 3.5/10
Score Range: 2.4-5.3
============================================================
```

### 케이스별 점수

| ID | 시나리오 | 점수 | 목표 | 상태 |
|-----|---------|------|------|------|
| golden_001 | 무선 이어폰 - 테크 제품 | 2.8/10 | ≥7.0 | ❌ FAIL |
| golden_002 | 스킨케어 제품 - 뷰티 | 2.4/10 | ≥7.0 | ❌ FAIL |
| golden_003 | 러닝화 - 패션/스포츠 | 4.4/10 | ≥7.0 | ❌ FAIL |
| golden_004 | 건강기능식품 - 헬스케어 | 3.7/10 | ≥7.5 | ❌ FAIL |
| golden_005 | 스마트워치 - 웨어러블 | 2.8/10 | ≥7.0 | ❌ FAIL |
| golden_006 | 노트북 - 전자제품 | 2.7/10 | ≥7.0 | ❌ FAIL |
| golden_007 | 커피 원두 - 식품 | 3.8/10 | ≥7.5 | ❌ FAIL |
| golden_008 | 요가 매트 - 피트니스 | 5.3/10 | ≥7.0 | ❌ FAIL |
| golden_009 | 향수 - 럭셔리 | 4.3/10 | ≥8.0 | ❌ FAIL |
| golden_010 | 보조배터리 - 액세서리 | 2.8/10 | ≥7.0 | ❌ FAIL |

---

## 🔍 상세 문제 분석

### 샘플 케이스 분석 (golden_001: 무선 이어폰)

#### 입력
```json
{
  "product_name": "울트라 무선 이어폰 Pro",
  "features": ["ANC 노이즈캔슬링", "30시간 배터리", "IPX7 방수"],
  "target_audience": "2030 직장인",
  "category": "전자제품"
}
```

#### 출력 비교

| 필드 | 기대값 | 실제값 | 문제 |
|------|--------|--------|------|
| **headline** | "완벽한 소음 차단**의 시작**" (12자) | "완벽한 소음 차단" (9자) | ⚠️ 길이 부족, 맥락 손실 |
| **subheadline** | "프리미엄 ANC 기술로 집중력 극대화" (20자) | "**제품 설명**" (5자) | 🔴 **심각**: 기본값 폴백 |
| **body** | "...언제 어디서나 최고의 사운드를 제공합니다." (48자) | "...집중력을 높이는 최고의 선택입니다." (74자) | ⚠️ 내용 상이 |
| **bullets** | ✅ 동일 | ✅ 동일 | ✅ PASS |
| **cta** | "지금 **바로** 체험하기" (10자) | "지금 체험해보세요" (9자) | ⚠️ 표현 상이 |

---

## 🐛 발견된 주요 문제

### 🔴 Critical (즉시 수정 필요)

#### 1. subheadline 기본값 폴백 (심각)
**문제**: LLM이 `subheadline` 필드를 생성하지 않아 "제품 설명" 기본값 사용

**원인**:
- `copywriter.py:238`: `content.get("subheadline") or ... or "제품 설명"`
- LLM 프롬프트에 `subheadline` 명시 부족
- JSON 스키마 강제가 약함

**영향**:
- 모든 케이스에서 동일한 문제 발생 추정
- 사용자 경험 심각하게 저하

**해결책**:
```python
# app/services/llm/gateway.py - product_detail 프롬프트
"## Output Format (JSON)\n"
"{\n"
"  \"headline\": \"...\",\n"
"  \"subheadline\": \"...\",  // ⬅️ 명시 필요\n"
"  \"body\": \"...\",\n"
"  \"bullets\": [...],\n"
"  \"cta\": \"...\"\n"
"}\n"
```

#### 2. 출력 품질 변동성 (중요)
**문제**: 동일 입력에 대한 출력이 기대값과 일관성 없음

**원인**:
- LLM 프롬프트가 너무 일반적
- Chain-of-Thought는 추가되었으나 출력 예시 부족
- 톤앤매너 가이드가 막연함

**해결책**:
- Few-shot Learning 추가 (2-3개 예시)
- 출력 스키마 명확화
- 제약 조건 강화

#### 3. 길이 제약 미준수
**문제**: `headline`, `subheadline`, `body` 길이가 기대값과 상이

**원인**:
- 프롬프트에 "10자 이내", "100-200자" 등 명시했으나 LLM이 무시
- Validation Pipeline 부재로 사후 검증 없음

**해결책**:
- Validation Pipeline 구현 (4단계)
- 길이 초과 시 자동 재생성 또는 트림

---

### 🟡 Warning (개선 권장)

#### 4. 톤앤매너 불일치
**문제**: `tone: "professional"` 요청했으나 출력이 톤 기준 불명확

**해결책**:
- 톤별 구체적 예시 제공
- Reviewer Agent로 사후 검증

#### 5. CTA 표현 다양성 부족
**문제**: "지금 체험해보세요" vs "지금 바로 체험하기" - 미묘한 차이

**해결책**:
- CTA 패턴 라이브러리 구축
- 사용자 선호도 학습

---

## 📝 긴급 조치 사항 (P0)

### 1. Validation Pipeline 구현 (B팀)

**목표**: CopywriterAgent 출력 품질 4단계 검증

#### 4단계 Validation Pipeline

```python
class OutputValidator:
    """출력 검증 파이프라인"""

    def validate(self, output: dict, task: str) -> ValidationResult:
        """
        4단계 검증 파이프라인

        Stage 1: Schema Validation (Pydantic)
        Stage 2: Length Validation
        Stage 3: Language Validation (한국어 체크)
        Stage 4: Quality Validation (tone, completeness)
        """
        results = []

        # Stage 1: Schema Validation
        results.append(self._validate_schema(output, task))

        # Stage 2: Length Validation
        results.append(self._validate_length(output, task))

        # Stage 3: Language Validation
        results.append(self._validate_language(output))

        # Stage 4: Quality Validation
        results.append(self._validate_quality(output, task))

        return ValidationResult(
            passed=all(r.passed for r in results),
            stage_results=results,
            overall_score=self._calculate_score(results)
        )
```

#### Stage 1: Schema Validation (Pydantic)
```python
from pydantic import BaseModel, Field, validator

class ProductDetailOutput(BaseModel):
    """product_detail 출력 스키마"""
    headline: str = Field(..., min_length=5, max_length=20)
    subheadline: str = Field(..., min_length=10, max_length=30)
    body: str = Field(..., min_length=20, max_length=80)
    bullets: list[str] = Field(..., min_items=3, max_items=3)
    cta: str = Field(..., min_length=4, max_length=15)

    @validator("bullets")
    def validate_bullets(cls, v):
        for bullet in v:
            if len(bullet) > 20:
                raise ValueError(f"Bullet too long: {bullet}")
        return v
```

#### Stage 2: Length Validation
```python
def _validate_length(self, output: dict, task: str) -> StageResult:
    """길이 검증"""
    issues = []

    if task == "product_detail":
        if len(output.get("headline", "")) > 20:
            issues.append("headline exceeds 20 chars")
        if len(output.get("subheadline", "")) > 30:
            issues.append("subheadline exceeds 30 chars")
        if len(output.get("body", "")) > 80:
            issues.append("body exceeds 80 chars")

    return StageResult(
        stage="length",
        passed=len(issues) == 0,
        issues=issues
    )
```

#### Stage 3: Language Validation (한국어 체크)
```python
import re

def _validate_language(self, output: dict) -> StageResult:
    """한국어 출력 검증 (영어 출력 방지)"""
    issues = []

    # 한글 비율 계산
    for field, value in output.items():
        if isinstance(value, str):
            korean_ratio = self._calculate_korean_ratio(value)
            if korean_ratio < 0.5:  # 한글 비율 50% 미만
                issues.append(f"{field}: 한글 비율 {korean_ratio:.0%} (< 50%)")

    return StageResult(
        stage="language",
        passed=len(issues) == 0,
        issues=issues
    )

def _calculate_korean_ratio(self, text: str) -> float:
    """한글 비율 계산"""
    korean_chars = len(re.findall(r'[가-힣]', text))
    total_chars = len(re.sub(r'\s', '', text))  # 공백 제외
    return korean_chars / total_chars if total_chars > 0 else 0.0
```

#### Stage 4: Quality Validation
```python
def _validate_quality(self, output: dict, task: str) -> StageResult:
    """품질 검증 (tone, completeness)"""
    issues = []

    # 필수 필드 존재 확인
    required_fields = ["headline", "subheadline", "body", "bullets", "cta"]
    for field in required_fields:
        if field not in output or not output[field]:
            issues.append(f"Missing or empty field: {field}")

    # 기본값 폴백 감지
    if output.get("subheadline") == "제품 설명":
        issues.append("subheadline is default fallback value")

    return StageResult(
        stage="quality",
        passed=len(issues) == 0,
        issues=issues
    )
```

**구현 위치**: `app/services/validation/output_validator.py` (NEW)

**통합 방식**:
```python
# copywriter.py
async def execute(self, request: AgentRequest) -> AgentResponse:
    # ... (기존 코드)

    # ✅ Validation 추가
    from app.services.validation import OutputValidator

    validator = OutputValidator()
    validation_result = validator.validate(outputs[0].value, request.task)

    if not validation_result.passed:
        logger.warning(f"Validation failed: {validation_result.issues}")
        # 재생성 또는 에러 반환

    return response
```

---

### 2. JSON Mode 강화 (B팀)

**목표**: LLM이 항상 올바른 JSON 구조를 반환하도록 보장

#### 현재 문제
- `app/services/llm/gateway.py`에서 `mode="json"` 전달
- 하지만 Ollama Provider가 스키마 강제하지 않음

#### 해결책

```python
# app/services/llm/providers/ollama.py

async def generate(self, prompt: str, mode: str = "text", options: dict = None):
    # ... (기존 코드)

    if mode == "json":
        # ✅ JSON 스키마 강제
        payload["format"] = "json"

        # ✅ 프롬프트에 JSON 스키마 명시
        prompt = self._enforce_json_schema(prompt, task)

    # ...

def _enforce_json_schema(self, prompt: str, task: str) -> str:
    """JSON 스키마 강제"""

    schema = self._get_json_schema(task)

    enhanced_prompt = f"""{prompt}

## ⚠️ CRITICAL: JSON Output Requirements

You MUST output ONLY a valid JSON object with this EXACT structure:

```json
{schema}
```

DO NOT include:
- Markdown code fences (```json)
- Explanatory text before or after JSON
- Comments inside JSON

ONLY output the raw JSON object.
"""
    return enhanced_prompt

def _get_json_schema(self, task: str) -> str:
    """작업별 JSON 스키마 반환"""

    if task == "product_detail":
        return """{
  "headline": "string (5-20 chars)",
  "subheadline": "string (10-30 chars)",
  "body": "string (20-80 chars)",
  "bullets": ["string (≤20 chars)", "string (≤20 chars)", "string (≤20 chars)"],
  "cta": "string (4-15 chars)"
}"""
    # ... 다른 태스크
```

---

### 3. 프롬프트 재작성 (A팀 + B팀 협업)

**목표**: CopywriterAgent `product_detail` 프롬프트 품질 향상

#### 현재 프롬프트 문제점
- `subheadline` 필드 설명 부족
- Few-shot 예시 없음
- 출력 제약 조건이 막연함

#### 개선된 프롬프트 (안)

```python
# app/services/llm/gateway.py - _get_system_prompt()

PRODUCT_DETAIL_PROMPT_V2 = """당신은 10년 경력의 전문 카피라이터입니다.

## 🎯 작업: 제품 상세 설명 작성

사용자가 제공한 제품 정보를 바탕으로 **구매 전환율을 높이는** 제품 설명을 작성하세요.

## 📋 출력 구조

다음 5개 필드를 **반드시** 포함하세요:

1. **headline** (5-20자)
   - 제품의 핵심 가치를 한 문장으로 표현
   - 임팩트 있고 기억에 남는 표현
   - 예: "완벽한 소음 차단의 시작"

2. **subheadline** (10-30자)
   - headline을 보완하는 설명
   - 제품의 차별점이나 주요 기능 강조
   - 예: "프리미엄 ANC 기술로 집중력 극대화"

3. **body** (20-80자)
   - 제품의 전체적인 가치 제안
   - features를 자연스럽게 녹여내기
   - 예: "울트라 무선 이어폰 Pro는 30시간 배터리와 IPX7 방수로 언제 어디서나 최고의 사운드를 제공합니다."

4. **bullets** (3개, 각 20자 이내)
   - features를 그대로 사용하거나 살짝 풀어서 표현
   - 예: ["ANC 노이즈캔슬링", "30시간 배터리", "IPX7 방수"]

5. **cta** (4-15자)
   - 행동 유도 문구
   - 예: "지금 바로 체험하기"

## 🧠 작성 프로세스 (Chain-of-Thought)

Step 1. 제품 분석
- 핵심 가치는? 차별점은?

Step 2. 타겟 이해
- 타겟 오디언스의 니즈는?

Step 3. 메시지 구성
- headline: 임팩트 있는 한 문장
- subheadline: headline 보완
- body: 전체 가치 제안
- bullets: features 정리
- cta: 행동 유도

Step 4. 길이 확인
- headline ≤ 20자
- subheadline 10-30자
- body 20-80자
- bullets 각 ≤ 20자
- cta ≤ 15자

Step 5. 최종 검증
- 모든 필드 존재하는가?
- 한국어로만 작성했는가?
- 톤앤매너가 일치하는가?

## 📚 Few-shot 예시

### 예시 1: 무선 이어폰 (professional tone)

**Input**:
```json
{
  "product_name": "울트라 무선 이어폰 Pro",
  "features": ["ANC 노이즈캔슬링", "30시간 배터리", "IPX7 방수"],
  "target_audience": "2030 직장인"
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

### 예시 2: 스킨케어 (friendly tone)

**Input**:
```json
{
  "product_name": "히알루론산 세럼",
  "features": ["72시간 보습", "피부 장벽 강화", "순한 성분"],
  "target_audience": "20-30대 여성"
}
```

**Output**:
```json
{
  "headline": "72시간 촉촉함의 비밀",
  "subheadline": "히알루론산의 강력한 보습력",
  "body": "순한 성분으로 피부 장벽을 강화하고, 72시간 동안 깊은 보습을 선사합니다.",
  "bullets": ["72시간 보습", "피부 장벽 강화", "순한 성분"],
  "cta": "지금 만나보세요"
}
```

## ⚠️ 중요 제약사항

1. **한국어만 사용**: 모든 출력은 한국어로 작성
2. **JSON 형식**: 반드시 위 5개 필드를 포함한 JSON 출력
3. **길이 준수**: 각 필드의 최대 길이 엄수
4. **톤앤매너**: 사용자가 지정한 tone에 맞춰 작성
   - professional: 전문적이고 신뢰감 있는 톤
   - friendly: 친근하고 따뜻한 톤
   - luxury: 프리미엄하고 세련된 톤
   - casual: 편안하고 자연스러운 톤
   - energetic: 활기차고 역동적인 톤

## 📤 출력 형식

반드시 다음 JSON 형식으로만 출력하세요. 코드 펜스나 추가 설명 없이 순수 JSON만 출력하세요.

```json
{
  "headline": "...",
  "subheadline": "...",
  "body": "...",
  "bullets": ["...", "...", "..."],
  "cta": "..."
}
```
"""
```

#### A팀 검토 요청사항
1. Few-shot 예시가 충분한가?
2. 톤앤매너 가이드가 명확한가?
3. 출력 제약 조건이 적절한가?
4. 추가 예시가 필요한가? (luxury, energetic 등)

---

## 📈 개선 로드맵

### Week 1 (11-23 ~ 11-29) - P0 긴급 조치

**목표**: Pass Rate 0% → 70% 달성

| 작업 | 담당 | 완료 기한 | 우선순위 |
|------|------|-----------|----------|
| Validation Pipeline 구현 | B팀 | 11-24 | P0 |
| JSON Mode 강화 | B팀 | 11-24 | P0 |
| 프롬프트 재작성 (product_detail) | A팀 + B팀 | 11-25 | P0 |
| Golden Set 확장 (10개 → 20개) | A팀 | 11-26 | P0 |
| 통합 테스트 및 검증 | B팀 | 11-27 | P0 |

### Week 2 (11-30 ~ 12-06) - P1 품질 향상

**목표**: Pass Rate 70% → 90%, 평균 점수 8.0/10

| 작업 | 담당 | 완료 기한 | 우선순위 |
|------|------|-----------|----------|
| Self-Consistency 구현 | B팀 | 12-02 | P1 |
| Reviewer Agent 연동 | B팀 | 12-03 | P1 |
| 톤별 Few-shot 예시 확대 | A팀 | 12-04 | P1 |
| A/B 테스트 프레임워크 | B팀 | 12-05 | P1 |

### Week 3 (12-07 ~ 12-13) - P2 고도화

**목표**: 프로덕션 배포 준비 완료

| 작업 | 담당 | 완료 기한 | 우선순위 |
|------|------|-----------|----------|
| Prompt Version Control | B팀 | 12-09 | P2 |
| CI/CD 통합 | B팀 | 12-10 | P2 |
| 성능 벤치마크 | B팀 | 12-11 | P2 |
| 최종 배포 승인 | A팀 | 12-13 | P2 |

---

## 🎯 성공 기준

### 배포 가능 기준 (Deployment Criteria)

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| **Pass Rate** | ≥ 90% | Golden Set 자동 검증 |
| **평균 점수** | ≥ 8.0/10 | 유사도 + 품질 점수 |
| **Validation 통과율** | 100% | 4단계 Pipeline 통과 |
| **한국어 비율** | ≥ 95% | Language Validator |
| **응답 시간** | ≤ 5초 | 95th percentile |

### 품질 게이트 (Quality Gate)

- 🚫 **배포 불가**: Pass Rate < 80%
- ⚠️ **조건부 배포**: 80% ≤ Pass Rate < 90%
- ✅ **배포 가능**: Pass Rate ≥ 90% AND 평균 점수 ≥ 8.0

---

## 📞 팀 간 협업 요청

### A팀 (QA)에게
1. ✅ 프롬프트 재작성 검토 및 승인
2. ✅ Golden Set 확장 (10개 → 20개)
3. ✅ 배포 승인 기준 최종 검토

### B팀 (Backend)에게
1. ✅ Validation Pipeline 구현 (우선순위 최상)
2. ✅ JSON Mode 강화
3. ✅ 프롬프트 적용 및 테스트

### C팀 (Frontend)에게
1. ℹ️ CopywriterAgent 품질 개선 중 (배포 지연 예상)
2. ℹ️ 11-27 재검증 예정
3. ℹ️ 통합 테스트 협조 요청 (11-28)

---

## 📚 참고 문서

- [Golden Set 검증 결과](../tests/golden_sets/README.md)
- [CopywriterAgent 스펙](../app/services/agents/copywriter.py)
- [LLM Gateway 프롬프트](../app/services/llm/gateway.py)
- [Context Engineering 완료 보고서](CONTEXT_ENGINEERING_COMPLETION_REPORT_2025-11-23.md)

---

**작성자**: B팀 (Backend) - Claude
**검토자**: A팀 (QA)
**승인 날짜**: 2025-11-23 (승인 대기중)

**Status**: 🔴 **CRITICAL - 긴급 조치 필요**
