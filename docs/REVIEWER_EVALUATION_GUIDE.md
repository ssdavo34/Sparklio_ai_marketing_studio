# ReviewerAgent 품질 평가 가이드

**Agent**: ReviewerAgent
**Task**: `reviewer.ad_copy_quality_check`
**Version**: v1.0
**Last Updated**: 2025-11-23
**목적**: ReviewerAgent 출력 품질을 일관되게 평가하기 위한 가이드

---

## 1. 개요

### 1.1 ReviewerAgent의 역할

ReviewerAgent는 **Quality Filter/Advisor** 역할을 수행합니다:

- ✅ **하는 일**: 기존 광고 카피를 평가하고 개선 방향 제안
- ❌ **하지 않는 일**: 새로운 카피 생성, 전면 재작성

### 1.2 평가 목표

| 목표 | 기준 |
|------|------|
| **Pass Rate** | ≥70% (Golden Set 5개 중 3.5개 이상 통과) |
| **Average Score** | ≥7.0/10 (Golden Set 전체 평균) |
| **Consistency** | Score variance ≤1.5 (일관성) |

### 1.3 평가 차원 (4가지)

1. **Score Consistency** (30%): 점수 일관성
2. **Comment Specificity** (25%): 피드백 구체성
3. **Improvement Practicality** (25%): 개선 제안 실행 가능성
4. **Risk Detection Accuracy** (20%): 규제 리스크 정확한 탐지

---

## 2. 평가 기준 상세

### 2.1 Score Consistency (30%)

**정의**: overall_score와 5개 세부 점수가 논리적으로 일치하는가?

#### 평가 방법

```python
# 1. 세부 점수 평균 계산
sub_scores = [tone_match, clarity, persuasiveness, creativity, compliance]
avg_sub_score = sum(sub_scores) / 5

# 2. Overall Score와 비교
score_diff = abs(overall_score - avg_sub_score)

# 3. 점수 부여
if score_diff <= 0.5:
    consistency_score = 10.0  # 완벽한 일관성
elif score_diff <= 1.0:
    consistency_score = 8.0   # 양호
elif score_diff <= 1.5:
    consistency_score = 6.0   # 보통
else:
    consistency_score = 3.0   # 불일치
```

#### Good Example ✅

```json
{
  "overall_score": 8.5,
  "tone_match_score": 9.0,
  "clarity_score": 8.5,
  "persuasiveness_score": 8.0,
  "creativity_score": 8.0,
  "compliance_score": 9.0
}
// 평균: (9.0 + 8.5 + 8.0 + 8.0 + 9.0) / 5 = 8.5
// 차이: |8.5 - 8.5| = 0.0 ✅
```

#### Bad Example ❌

```json
{
  "overall_score": 8.5,
  "tone_match_score": 5.0,
  "clarity_score": 6.0,
  "persuasiveness_score": 5.5,
  "creativity_score": 6.0,
  "compliance_score": 5.5
}
// 평균: (5.0 + 6.0 + 5.5 + 6.0 + 5.5) / 5 = 5.6
// 차이: |8.5 - 5.6| = 2.9 ❌ (심각한 불일치)
```

#### Compliance Score 특수 규칙

```python
# Critical risk_flags가 있으면 compliance_score는 낮아야 함
if critical_risk_flags >= 2:
    assert compliance_score <= 3.0
elif critical_risk_flags == 1:
    assert compliance_score <= 5.0
elif warning_risk_flags >= 2:
    assert compliance_score <= 7.0
else:
    assert compliance_score >= 7.0
```

**Good Example ✅**:
```json
{
  "compliance_score": 1.0,
  "risk_flags": [
    {"severity": "critical", "comment": "업계 최고 - 과대광고"},
    {"severity": "critical", "comment": "당뇨병 예방 - 의료 효능 표방"},
    {"severity": "critical", "comment": "삼성 제품보다 - 비교광고 위반"}
  ]
}
// Critical 3개 → compliance_score 1.0 ✅
```

**Bad Example ❌**:
```json
{
  "compliance_score": 8.5,
  "risk_flags": [
    {"severity": "critical", "comment": "업계 최고 - 과대광고"},
    {"severity": "critical", "comment": "질병 치료 - 의료 효능 표방"}
  ]
}
// Critical 2개인데 compliance_score 8.5 ❌ (불일치)
```

---

### 2.2 Comment Specificity (25%)

**정의**: strengths/weaknesses가 구체적인 예시를 포함하고 모호하지 않은가?

#### 평가 방법

각 comment를 3등급으로 분류:
- **Specific (10점)**: 구체적 필드/문구 언급 + 이유 설명
- **Moderate (6점)**: 일부 구체적이나 예시 부족
- **Vague (2점)**: 모호하고 일반적인 표현

#### Forbidden Patterns (즉시 감점)

❌ "전반적으로 좋습니다"
❌ "더 나은 표현이 필요합니다"
❌ "개선이 필요합니다"
❌ "완성도가 높습니다"
❌ "적절합니다"

#### Good Examples ✅

| Comment Type | Example |
|--------------|---------|
| **Specific Strength** | "헤드라인이 구체적인 수치(10분, 2배)로 베네핏을 명확히 전달하여 즉각적인 이해를 돕습니다" |
| **Specific Weakness** | "CTA가 '알아보기'로 모호하여 구체적 행동 유도력이 부족합니다. 인센티브나 즉시성 추가 필요" |
| **Specific Strength** | "바디 카피의 '출퇴근길, 카페, 사무실' 등 사용 시나리오를 구체적으로 제시하여 타겟의 공감대 형성" |

#### Bad Examples ❌

| Comment Type | Example | Why Bad |
|--------------|---------|---------|
| **Vague Strength** | "카피가 전반적으로 좋습니다" | 어떤 부분이 왜 좋은지 불명확 |
| **Vague Weakness** | "개선이 필요합니다" | 무엇을 어떻게 개선할지 불명확 |
| **Generic Comment** | "적절한 표현입니다" | 구체적 근거 없음 |

#### 점수 계산

```python
def calculate_specificity_score(comments):
    scores = []
    for comment in comments:
        if has_specific_field_mention(comment) and has_reason(comment):
            scores.append(10.0)  # Specific
        elif has_some_details(comment):
            scores.append(6.0)   # Moderate
        else:
            scores.append(2.0)   # Vague

    return sum(scores) / len(scores)
```

---

### 2.3 Improvement Practicality (25%)

**정의**: improvement_suggestions가 실행 가능하고 구체적인 예시를 포함하는가?

#### Required Fields

```typescript
interface ImprovementSuggestion {
  field: "headline" | "subheadline" | "body" | "bullets" | "cta";
  current_issue: string;    // 현재 문제점 (20-60자)
  suggestion: string;       // 개선 방향 (30-100자)
  example?: string;         // 구체적 개선 예시 (권장)
}
```

#### Good Example ✅

```json
{
  "field": "headline",
  "current_issue": "'집중력 2배' 표현이 측정 기준 없이 모호함",
  "suggestion": "구체적인 맥락이나 비교 기준 추가하여 신뢰도 향상",
  "example": "하루 10분, 업무 집중도 2배 향상"
}
```

**왜 Good?**:
- ✅ 문제점 명확: "측정 기준 없이 모호함"
- ✅ 개선 방향 구체적: "맥락/비교 기준 추가"
- ✅ 실행 가능한 예시: "업무 집중도 2배"

#### Bad Example ❌

```json
{
  "field": "headline",
  "current_issue": "헤드라인이 별로",
  "suggestion": "더 좋게 만드세요"
}
```

**왜 Bad?**:
- ❌ 문제점 모호: "별로"가 뭐가 문제인지 불명확
- ❌ 개선 방향 없음: "더 좋게"는 실행 불가능
- ❌ 예시 없음

#### 점수 계산

```python
def calculate_practicality_score(suggestions):
    total_score = 0
    for sug in suggestions:
        score = 0

        # 1. 문제점이 구체적인가? (4점)
        if is_specific_issue(sug.current_issue):
            score += 4

        # 2. 개선 방향이 실행 가능한가? (4점)
        if is_actionable_suggestion(sug.suggestion):
            score += 4

        # 3. 예시가 제공되는가? (2점)
        if sug.example:
            score += 2

        total_score += score

    return (total_score / (len(suggestions) * 10)) * 10
```

---

### 2.4 Risk Detection Accuracy (20%)

**정의**: 과대광고, 의료 효능 표방, 비교광고 등 규제 리스크를 정확히 탐지하는가?

#### Critical Risk Patterns (반드시 탐지)

| Pattern | Example | Law | Severity |
|---------|---------|-----|----------|
| **최상급 표현 (근거 없음)** | "업계 1위", "최고", "세계 최초" | 공정거래법 | critical |
| **의료 효능 표방** | "질병 치료", "당뇨 예방", "피부 재생" | 약사법, 의료기기법 | critical |
| **경쟁사 직접 비교** | "삼성보다 2배", "OO사 대비 우수" | 비교광고법 | critical |
| **절대적 효과 표현** | "100% 효과", "완벽한 해결" | 표시광고법 | critical |

#### Warning Risk Patterns (탐지 권장)

| Pattern | Example | Severity |
|---------|---------|----------|
| **모호한 최상급** | "최고 수준", "프리미엄 품질" | warning |
| **타사 암시 비교** | "타 제품과 달리" | warning |
| **수치 근거 미제시** | "효과 2배", "만족도 향상" | warning |

#### 점수 계산

```python
def calculate_risk_detection_score(expected_risks, detected_risks):
    # 1. Recall: 실제 리스크 중 몇 개를 탐지했나?
    true_positives = count_detected(expected_risks, detected_risks)
    recall = true_positives / len(expected_risks)

    # 2. Precision: 탐지한 것 중 실제 리스크는 몇 개인가?
    false_positives = count_false_detections(detected_risks, expected_risks)
    precision = true_positives / (true_positives + false_positives)

    # 3. F1 Score
    if recall + precision == 0:
        return 0.0

    f1_score = 2 * (precision * recall) / (precision + recall)
    return f1_score * 10
```

#### Good Example ✅ (Case: reviewer_003)

**Expected Risks**:
- "업계 최고 성능" → critical
- "당뇨병, 고혈압 예방" → critical
- "질병이 사라집니다" → critical
- "삼성 갤럭시워치보다 2배" → critical
- "평생 무상 AS" → warning

**Detected Risks**:
```json
{
  "risk_flags": [
    {
      "field": "headline",
      "comment": "'업계 최고', '100% 만족 보장' - 공정거래위원회 과대광고 가이드라인 위반",
      "severity": "critical"
    },
    {
      "field": "subheadline",
      "comment": "'삼성 갤럭시워치보다 2배 빠른' - 비교광고법 위반 가능성",
      "severity": "critical"
    },
    {
      "field": "body",
      "comment": "'당뇨병, 고혈압 예방', '질병이 사라집니다' - 약사법/의료기기법 위반",
      "severity": "critical"
    },
    {
      "field": "bullets",
      "comment": "'평생 무상 AS' - 표시광고법 위반 가능성",
      "severity": "warning"
    }
  ]
}
```

**평가**:
- ✅ 4개 critical 패턴 모두 탐지
- ✅ 1개 warning 패턴 탐지
- ✅ Severity 정확히 분류
- ✅ 법 조항 명시
- **Score**: 10.0/10

#### Bad Example ❌

**Expected Risks**: 동일

**Detected Risks**:
```json
{
  "risk_flags": [
    {
      "field": "body",
      "comment": "표현이 좀 과한 것 같아요",
      "severity": "info"
    }
  ]
}
```

**평가**:
- ❌ Critical 리스크 4개 중 0개 탐지
- ❌ 모호한 표현 ("좀 과한 것 같아요")
- ❌ Severity 과소평가 (info)
- ❌ 법 조항 미언급
- **Score**: 1.0/10

---

## 3. 종합 점수 계산

### 3.1 Formula

```python
def calculate_final_score(output, golden_case):
    # 1. Score Consistency (30%)
    consistency = evaluate_score_consistency(output)

    # 2. Comment Specificity (25%)
    specificity = evaluate_comment_specificity(
        output.strengths + output.weaknesses
    )

    # 3. Improvement Practicality (25%)
    practicality = evaluate_improvement_practicality(
        output.improvement_suggestions
    )

    # 4. Risk Detection Accuracy (20%)
    risk_accuracy = evaluate_risk_detection(
        expected=golden_case.expected_risks,
        detected=output.risk_flags
    )

    # Weighted Sum
    final_score = (
        consistency * 0.30 +
        specificity * 0.25 +
        practicality * 0.25 +
        risk_accuracy * 0.20
    )

    return final_score
```

### 3.2 Pass/Fail Criteria

| Case Type | Min Score | Key Criteria |
|-----------|-----------|--------------|
| **Excellent Copy** | 7.5/10 | overall_score 8-9, risk_flags 0-1, 구체적 피드백 |
| **Compliance Risk** | 7.0/10 | Critical risks 모두 탐지, compliance_score ≤3, 심각성 정확히 평가 |
| **Tone Mismatch** | 7.0/10 | tone_match_score ≤2, 톤 불일치 명확히 지적, 구체적 개선안 |
| **Needs Improvement** | 7.0/10 | 균형잡힌 점수 (4-6점), 실행 가능한 개선 제안 4개 이상 |

---

## 4. Golden Set 케이스별 평가 가이드

### Case 1: reviewer_001 (Excellent Copy - 프리미엄 이어폰)

**평가 포인트**:
1. ✅ Overall score 8.0-9.0 범위
2. ✅ Strengths 4개: "구체적 수치", "베네핏", "사용 시나리오", "인센티브" 키워드 포함
3. ✅ Weaknesses 2개: "2배 모호함", "bullet 베네핏 부족" 지적
4. ✅ Risk flags 0개 (규제 위반 없음)
5. ✅ Summary에 "우수", "professional" 포함

**Fail Scenarios**:
- ❌ Overall score < 7.5 (과소평가)
- ❌ Risk flags에 critical 항목 추가 (과다 탐지)
- ❌ Strengths가 모호한 표현 ("전반적으로 좋음")

### Case 2: reviewer_002 (Excellent Copy - 럭셔리 스킨케어)

**평가 포인트**:
1. ✅ Overall score 8.5-9.5 (높은 평가)
2. ✅ Tone match score 9.0-10.0 (luxury 톤 완벽)
3. ✅ Creativity score 8.5-9.5 ("시간이 새긴 아름다움" 높이 평가)
4. ✅ Weaknesses: "CTA 일반적" 지적
5. ✅ Summary에 "luxury", "완벽", "고급스러운" 포함

**Fail Scenarios**:
- ❌ Tone match score < 8.5 (luxury 톤 인식 실패)
- ❌ Creativity score < 8.0 (감각적 표현 과소평가)
- ❌ "30일 후 달라집니다"를 과대광고로 잘못 flag

### Case 3: reviewer_003 (Compliance Risk - 스마트워치)

**평가 포인트** (가장 중요):
1. ✅ Overall score 2.0-4.5 (낮은 평가)
2. ✅ Compliance score 0.0-2.0 (매우 낮음)
3. ✅ Risk flags ≥3개, critical severity
4. ✅ 다음 리스크 반드시 탐지:
   - "업계 최고" → critical
   - "당뇨병, 고혈압 예방" → critical
   - "질병이 사라집니다" → critical
   - "삼성 갤럭시워치보다" → critical
5. ✅ Summary에 "심각", "전면 재작성", "규제 위반" 포함

**Fail Scenarios** (즉시 Fail):
- ❌ Compliance score > 3.0 (심각성 인식 실패)
- ❌ Critical risk 2개 이상 미탐지
- ❌ "당뇨병, 고혈압 예방"을 warning으로 분류 (critical이어야 함)
- ❌ Overall score > 5.0 (과대평가)

### Case 4: reviewer_004 (Tone Mismatch - B2B Professional)

**평가 포인트**:
1. ✅ Overall score 2.0-3.5 (낮은 평가)
2. ✅ Tone match score 0.0-2.0 (매우 낮음)
3. ✅ Weaknesses: "professional vs casual", "slang", "B2B 부적합", "초성" 언급
4. ✅ Improvement suggestions ≥4개 (각 필드별 톤 수정 제안)
5. ✅ Summary에 "전면 재작성", "professional", "B2B" 포함

**Fail Scenarios**:
- ❌ Tone match score > 3.0 (톤 불일치 인식 실패)
- ❌ "ㅎㄷㄷ", "ㄷㄷ", "ㄱㄱ" 초성 표현을 지적하지 않음
- ❌ LinkedIn B2B 채널 부적합성을 언급하지 않음

### Case 5: reviewer_005 (Needs Improvement - Friendly 톤 제품)

**평가 포인트**:
1. ✅ Overall score 4.0-6.0 (중간 평가)
2. ✅ Tone match score 3.0-5.0 (friendly 톤 부족 지적)
3. ✅ Weaknesses: "평범", "일반적", "차별성", "감정 부족" 언급
4. ✅ Improvement suggestions ≥4개 (구체적 개선 방향)
5. ✅ Summary에 "개선", "차별성", "감정" 포함

**Fail Scenarios**:
- ❌ Overall score > 7.0 (과대평가)
- ❌ Overall score < 3.0 (과소평가)
- ❌ Improvement suggestions < 3개 (피드백 부족)
- ❌ "반려동물 건강 관리" 헤드라인의 평범함을 지적하지 않음

---

## 5. 자주 발생하는 오류 패턴

### 5.1 Score Consistency 오류

#### ❌ Pattern 1: "모든 좋은데 낮은 점수"
```json
{
  "overall_score": 4.5,
  "strengths": [
    "헤드라인이 완벽합니다",
    "바디 카피가 훌륭합니다",
    "CTA가 최고입니다"
  ],
  "weaknesses": []
}
```
**문제**: 모든 strengths인데 4.5점? 논리적 불일치

#### ❌ Pattern 2: "Critical Risk인데 높은 점수"
```json
{
  "overall_score": 8.0,
  "compliance_score": 8.5,
  "risk_flags": [
    {"severity": "critical", "comment": "질병 치료 효능 표방"}
  ]
}
```
**문제**: Critical risk가 있는데 compliance_score 8.5? 모순

### 5.2 Comment Specificity 오류

#### ❌ Pattern 3: "모호한 피드백"
```json
{
  "strengths": [
    "전반적으로 좋습니다",
    "적절한 표현입니다"
  ],
  "weaknesses": [
    "개선이 필요합니다"
  ]
}
```
**문제**: 어떤 부분이 왜 좋은지/나쁜지 불명확

#### ✅ Fix:
```json
{
  "strengths": [
    "헤드라인 '하루 10분, 집중력 2배'가 구체적 수치로 베네핏을 명확히 전달"
  ],
  "weaknesses": [
    "CTA '알아보기'가 모호하여 구체적 행동 유도력 부족, 인센티브 추가 필요"
  ]
}
```

### 5.3 Improvement Practicality 오류

#### ❌ Pattern 4: "실행 불가능한 제안"
```json
{
  "field": "headline",
  "current_issue": "별로",
  "suggestion": "더 창의적으로"
}
```
**문제**: "별로"가 뭐가 문제? "더 창의적으로"를 어떻게 실행?

#### ✅ Fix:
```json
{
  "field": "headline",
  "current_issue": "'반려동물 건강 관리'가 제품 카테고리만 나열하여 차별성 부족",
  "suggestion": "타겟의 감정(사랑, 행복)과 베네핏(건강한 내일)을 연결한 표현 사용",
  "example": "우리 아이의 건강한 내일을 위한 맛있는 선택"
}
```

### 5.4 Risk Detection 오류

#### ❌ Pattern 5: "과다 탐지"
정상적인 표현을 리스크로 과도하게 flag:
```json
{
  "risk_flags": [
    {
      "field": "headline",
      "comment": "'프리미엄'이라는 표현이 과대광고 가능성",
      "severity": "critical"
    }
  ]
}
```
**문제**: "프리미엄"은 일반적인 포지셔닝 표현이지 과대광고 아님

#### ❌ Pattern 6: "미탐지"
명백한 리스크를 놓침:
```json
{
  "ad_copy": {
    "body": "당뇨병 완치! 질병이 사라집니다!"
  },
  "risk_flags": []
}
```
**문제**: "당뇨병 완치", "질병 사라짐"은 명백한 의료 효능 표방인데 미탐지

---

## 6. Troubleshooting

### Q1: Overall Score가 계속 예상 범위를 벗어납니다

**원인**:
- 세부 점수들과 overall_score의 평균 차이가 큼
- Strengths/weaknesses와 점수가 불일치

**해결**:
1. 5개 세부 점수 평균을 계산
2. Overall_score를 평균 ±1.0 이내로 조정
3. Compliance score는 risk_flags에 맞춰 조정

### Q2: Risk Detection이 너무 민감하거나 둔감합니다

**원인**:
- Critical pattern list가 불명확
- Severity 분류 기준 모호

**해결**:
1. [PROMPT_REVIEWER_AD_COPY_V1.md](PROMPT_REVIEWER_AD_COPY_V1.md) Section 5 확인
2. Critical patterns 명확히 숙지:
   - "업계 1위", "최고", "세계 최초" (근거 없음)
   - "질병 치료", "질병 예방", "피부 재생"
   - "OO사보다 2배" (경쟁사 직접 비교)
   - "100% 효과", "완벽한 해결"
3. 정상적인 표현과 구분:
   - ✅ "프리미엄 품질", "고급 소재" → OK
   - ❌ "업계 최고 품질" → Critical

### Q3: Comment가 너무 모호하다는 피드백을 받습니다

**원인**:
- Forbidden patterns 사용
- 구체적 예시 부족

**해결**:
1. 각 comment에 다음 포함:
   - **어떤 필드의**
   - **어떤 문구가**
   - **왜 문제/좋은지**
   - **구체적 예시**
2. Forbidden patterns 절대 사용 금지:
   - "전반적으로 좋습니다"
   - "개선이 필요합니다"
   - "적절합니다"

### Q4: Improvement Suggestions가 실행 불가능하다고 평가됩니다

**원인**:
- Example 필드 누락
- 추상적인 제안 ("더 창의적으로", "더 좋게")

**해결**:
1. 모든 suggestion에 example 추가
2. "더 ~하게" 형태 금지
3. 구체적 변경 방향 제시:
   ```json
   {
     "current_issue": "'알아보기'가 행동 유도력 부족",
     "suggestion": "구체적 베네핏과 인센티브를 CTA에 포함",
     "example": "지금 시작하고 20% 할인받기"
   }
   ```

---

## 7. 체크리스트

### 출력 전 최종 확인

#### Schema & Structure
- [ ] overall_score와 5개 세부 점수 모두 0-10 범위, 소수점 1자리
- [ ] strengths 2-5개, 각 20-80자
- [ ] weaknesses 1-5개, 각 20-80자
- [ ] improvement_suggestions 2-5개, 각 field/current_issue/suggestion 포함
- [ ] risk_flags 0-3개, 각 field/comment/severity 포함
- [ ] summary 50-150자

#### Score Consistency
- [ ] overall_score ≈ 세부 점수 평균 (±1.0 이내)
- [ ] critical risk_flags ≥2개 → compliance_score ≤3.0
- [ ] critical risk_flags = 1개 → compliance_score ≤5.0
- [ ] risk_flags = 0개 → compliance_score ≥7.0
- [ ] overall_score ≥8.0 → strengths ≥3개, weaknesses ≤2개
- [ ] overall_score ≤4.0 → strengths ≤2개, weaknesses ≥3개

#### Comment Specificity
- [ ] 모든 strengths/weaknesses에 구체적 필드 또는 문구 언급
- [ ] Forbidden patterns 미사용 확인
- [ ] 각 comment에 이유 설명 포함

#### Improvement Practicality
- [ ] 모든 improvement_suggestions에 example 제공
- [ ] "더 ~하게" 형태 미사용
- [ ] 실제 실행 가능한 구체적 제안

#### Risk Detection
- [ ] Critical patterns 모두 탐지 (의료 효능, 과대광고, 비교광고)
- [ ] Severity 정확히 분류 (critical vs warning)
- [ ] 법 조항 또는 규제 가이드라인 언급
- [ ] 정상적인 표현을 과도하게 flag하지 않음

---

## 8. 참고 자료

### 8.1 관련 문서
- [PROMPT_REVIEWER_AD_COPY_V1.md](PROMPT_REVIEWER_AD_COPY_V1.md) - 프롬프트 전문
- [TASK_SCHEMA_CATALOG_V2.md](TASK_SCHEMA_CATALOG_V2.md) - Section 3: ReviewerAgent
- [reviewer_ad_copy_quality_check_v1.json](../backend/tests/golden_set/reviewer_ad_copy_quality_check_v1.json) - Golden Set

### 8.2 법규 참고
- **공정거래법**: 과대광고, 허위광고 규제
- **약사법**: 의약품이 아닌 제품의 질병 치료 효능 표방 금지
- **의료기기법**: 의료기기가 아닌 제품의 의료 효과 표방 금지
- **비교광고법**: 경쟁사 직접 비교 시 객관적 근거 필수
- **표시광고법**: 검증 불가능한 과장 표현 금지

### 8.3 Golden Set Pass Rate 계산

```python
# 5개 케이스 평가 후
total_cases = 5
passed_cases = sum(1 for score in case_scores if score >= min_score)
pass_rate = passed_cases / total_cases

# 목표
assert pass_rate >= 0.70  # 70% 이상
assert avg(case_scores) >= 7.0  # 평균 7.0 이상
```

---

**가이드 버전**: v1.0
**최종 업데이트**: 2025-11-23
**다음 업데이트 예정**: B팀 구현 후 실제 Pass Rate 측정 결과 반영
