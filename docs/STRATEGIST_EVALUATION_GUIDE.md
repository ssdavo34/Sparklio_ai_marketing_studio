# StrategistAgent Evaluation Guide

**Task**: `strategist.campaign_strategy`
**버전**: v1.0
**작성일**: 2025-11-23
**작성자**: A팀 (QA & Architecture)
**대상**: B팀 (Validation 구현), A팀 (Golden Set 평가)

---

## 문서 목적

이 문서는 `strategist.campaign_strategy` Task의 출력 품질을 평가하는 **구체적인 기준과 방법**을 정의합니다.

### 사용 시나리오
1. **Golden Set Validation**: Golden Set 5개 케이스의 점수 산정
2. **Manual Review**: 실패 케이스의 상세 분석
3. **Prompt Tuning**: 프롬프트 개선 후 품질 변화 측정

---

## 평가 프레임워크

### 4단계 Validation Pipeline

```
1단계: Schema Validation (Pass/Fail) → Pydantic 통과 여부
2단계: Length Validation (Pass/Fail) → 필드별 길이 기준
3단계: Language Validation (Pass/Fail) → 한국어 비율 ≥ 30%
4단계: Quality Validation (0-10점) → 5가지 기준 가중 평가
```

**최종 Pass 기준**:
- 1-3단계: 모두 Pass
- 4단계: ≥ 7.0/10 (일반 제품), ≥ 7.5/10 (럭셔리 제품)

---

## 1단계: Schema Validation

### 검증 항목

**필수 필드 존재 여부**:
- `core_message` (string)
- `positioning` (string)
- `target_insights` (array)
- `big_idea` (string)
- `strategic_pillars` (array of objects)
- `channel_strategy` (array of objects)
- `funnel_structure` (object)
- `risk_factors` (array)
- `success_metrics` (array)

**Nested 객체 검증**:
- `strategic_pillars[]`: `title`, `description`, `key_actions[]` 필수
- `channel_strategy[]`: `channel`, `objective`, `content_types[]`, `kpi` 필수
- `funnel_structure`: `awareness[]`, `consideration[]`, `conversion[]`, `retention[]` 필수

### Pass 기준
- ✅ 모든 필수 필드 존재
- ✅ 타입 일치 (string, array, object)
- ✅ Pydantic 모델 통과

### Fail 예시
```json
{
  "error": "Schema validation failed",
  "missing_fields": ["big_idea", "funnel_structure"],
  "score": 0
}
```

---

## 2단계: Length Validation

### 필드별 길이 기준

| 필드 | 최소 | 최대 | 설명 |
|------|------|------|------|
| `core_message` | 20자 | 150자 | 핵심 메시지 |
| `positioning` | 20자 | 150자 | 포지셔닝 |
| `big_idea` | 10자 | 100자 | 빅 아이디어 |
| `target_insights[]` | 2개 | 5개 | 타겟 인사이트 개수 |
| `target_insights[i]` | 20자 | 80자 | 각 인사이트 길이 |
| `strategic_pillars[]` | 2개 | 4개 | 전략 축 개수 |
| `strategic_pillars[i].title` | 10자 | 30자 | 축 제목 |
| `strategic_pillars[i].description` | 30자 | 100자 | 축 설명 |
| `strategic_pillars[i].key_actions[]` | 2개 | 5개 | 핵심 액션 개수 |
| `channel_strategy[]` | 2개 | 5개 | 채널 전략 개수 |
| `channel_strategy[i].objective` | 20자 | 50자 | 채널 목표 |
| `channel_strategy[i].content_types[]` | 2개 | 5개 | 콘텐츠 유형 개수 |
| `funnel_structure.awareness[]` | 2개 | 4개 | 인지 단계 콘텐츠 |
| `funnel_structure.consideration[]` | 2개 | 4개 | 고려 단계 콘텐츠 |
| `funnel_structure.conversion[]` | 2개 | 4개 | 전환 단계 콘텐츠 |
| `funnel_structure.retention[]` | 2개 | 4개 | 유지 단계 콘텐츠 |
| `risk_factors[]` | 1개 | 5개 | 리스크 요인 개수 |
| `risk_factors[i]` | 20자 | 60자 | 각 리스크 길이 |
| `success_metrics[]` | 2개 | 5개 | 성공 지표 개수 |
| `success_metrics[i]` | 20자 | 60자 | 각 지표 길이 |

### Pass 기준
- ✅ 모든 필드가 최소-최대 범위 내
- ✅ 배열 개수가 기준 충족

### Fail 예시
```json
{
  "error": "Length validation failed",
  "violations": [
    "core_message too short (15 chars, min 20)",
    "strategic_pillars count too low (1, min 2)"
  ],
  "score": 0
}
```

---

## 3단계: Language Validation

### 검증 기준

**한국어 비율**: ≥ 30% (전문 용어 허용)
- 영어/한글 혼용 허용 (예: "SNS 마케팅", "KPI 달성")
- 마케팅 전문 용어는 영어 사용 가능

### 측정 방법
```python
def calculate_korean_ratio(text: str) -> float:
    korean_chars = sum(1 for char in text if '\uAC00' <= char <= '\uD7A3')
    total_chars = len(text.replace(' ', ''))
    return korean_chars / total_chars if total_chars > 0 else 0
```

### Pass 기준
- ✅ 전체 텍스트의 한국어 비율 ≥ 30%
- ✅ 주요 필드 (core_message, positioning, big_idea) 한국어 중심

### Fail 예시
```json
{
  "error": "Language validation failed",
  "korean_ratio": 0.25,
  "min_required": 0.30,
  "score": 0
}
```

---

## 4단계: Quality Validation

### 평가 기준 (가중치)

#### 1. Core Message 명확성 (20%)

**평가 요소**:
- 브랜드 정체성이 명확히 드러나는가?
- 제품 베네핏이 구체적으로 전달되는가?
- 감성적 공감과 이성적 신뢰가 균형 잡혀 있는가?

**점수 기준**:
- **9-10점**: 브랜드 가치 + 제품 베네핏 + 감성/이성 조화가 완벽
- **7-8점**: 브랜드 정체성과 베네핏이 명확하나 감성/이성 중 하나 미흡
- **5-6점**: 베네핏은 있으나 브랜드 정체성이 불명확
- **3-4점**: 일반적이고 뻔한 표현 ("최고의 제품", "완벽한 솔루션")
- **1-2점**: 의미 불명확하거나 제품과 무관

**Good Example**:
> "과학이 만든 시간의 기적, 피부 본연의 빛을 되찾다"
- ✅ 브랜드 가치 (과학적 접근)
- ✅ 제품 베네핏 (피부 노화 개선)
- ✅ 감성 (시간의 기적, 본연의 빛)

**Bad Example**:
> "프리미엄 스킨케어의 새로운 기준"
- ❌ 뻔한 표현
- ❌ 구체적 베네핏 없음

---

#### 2. Big Idea 창의성 (20%)

**평가 요소**:
- 기억하기 쉽고 캐치한가?
- 모든 채널에서 확장 가능한가?
- 타겟의 공감을 이끌어내는가?

**점수 기준**:
- **9-10점**: 독창적이고 기억하기 쉬우며, 모든 채널에서 확장 가능
- **7-8점**: 창의적이고 기억하기 쉬우나 확장성이 다소 제한적
- **5-6점**: 평범하지만 이해하기 쉬움
- **3-4점**: 추상적이고 실행 불가능한 컨셉
- **1-2점**: 브랜드와 무관하거나 의미 불명

**Good Example**:
> "5초 아침: 뜯어서 먹으면 하루가 시작된다"
- ✅ 기억하기 쉬움 (5초)
- ✅ 확장 가능 (#5초아침챌린지)
- ✅ 타겟 공감 (바쁜 아침)

**Bad Example**:
> "건강한 삶의 시작"
- ❌ 추상적
- ❌ 범용적
- ❌ 기억하기 어려움

---

#### 3. Strategic Pillars 구조 (25%)

**평가 요소**:
- 전략 축이 논리적으로 연결되어 있는가?
- 각 축의 액션이 실행 가능한가?
- 전체 캠페인 목표와 정렬되어 있는가?

**점수 기준**:
- **9-10점**: 2-4개 축이 논리적으로 연결, 모든 액션 실행 가능, 목표와 정렬
- **7-8점**: 축이 명확하고 대부분의 액션이 실행 가능하나 일부 연결성 부족
- **5-6점**: 축은 있으나 논리적 연결성 부족, 액션이 모호
- **3-4점**: 축이 산만하거나 액션이 실행 불가능
- **1-2점**: 축이 캠페인 목표와 무관

**Good Example**:
```json
{
  "title": "과학적 신뢰 구축",
  "description": "임상 데이터와 피부과 전문의 추천으로 제품의 효능을 객관적으로 입증",
  "key_actions": [
    "Before/After 임상 결과 인포그래픽",
    "피부과 전문의 인터뷰 콘텐츠",
    "주요 성분의 과학적 근거 설명"
  ]
}
```
- ✅ 목표와 정렬 (신뢰 구축 → 럭셔리 브랜드)
- ✅ 실행 가능한 액션

**Bad Example**:
```json
{
  "title": "브랜드 홍보",
  "description": "다양한 채널에서 브랜드 인지도 향상",
  "key_actions": ["마케팅", "광고"]
}
```
- ❌ 모호한 설명
- ❌ 실행 불가능한 액션

---

#### 4. Channel Fit (20%)

**평가 요소**:
- 채널이 타겟 오디언스와 적합한가?
- 채널별 콘텐츠 유형이 차별화되어 있는가?
- KPI가 구체적이고 측정 가능한가?

**점수 기준**:
- **9-10점**: 모든 채널이 타겟과 적합, 콘텐츠 유형 차별화, KPI 측정 가능
- **7-8점**: 대부분의 채널이 적합하나 일부 KPI 모호
- **5-6점**: 채널 선택은 적절하나 콘텐츠 유형 차별화 부족
- **3-4점**: 타겟과 맞지 않는 채널, KPI 측정 불가능
- **1-2점**: 채널 전략이 캠페인 목표와 무관

**Good KPI Example**:
> "팔로워 증가율 30%, 릴스 조회수 10만+, 저장률 8%"
- ✅ 구체적 숫자
- ✅ 측정 가능

**Bad KPI Example**:
> "브랜드 이미지 향상"
- ❌ 측정 불가능
- ❌ 구체성 부족

---

#### 5. Clarity & Actionability (15%)

**평가 요소**:
- 전략이 명확하고 이해하기 쉬운가?
- 즉시 실행에 옮길 수 있는가?
- 전체 흐름이 논리적인가?

**점수 기준**:
- **9-10점**: 모든 요소가 명확하고, 즉시 실행 가능하며, 논리적 흐름
- **7-8점**: 대부분 명확하나 일부 요소가 모호
- **5-6점**: 이해는 가능하나 실행 방법이 불명확
- **3-4점**: 추상적이고 실행 불가능
- **1-2점**: 의미 불명확

---

### 최종 점수 계산

```python
def calculate_quality_score(output):
    score = (
        core_message_clarity * 0.20 +
        big_idea_creativity * 0.20 +
        strategic_pillars_structure * 0.25 +
        channel_fit * 0.20 +
        clarity_actionability * 0.15
    )
    return round(score, 1)
```

**예시**:
```
Core Message: 8.0
Big Idea: 7.5
Strategic Pillars: 9.0
Channel Fit: 7.0
Clarity: 8.0

최종 점수 = 8.0*0.20 + 7.5*0.20 + 9.0*0.25 + 7.0*0.20 + 8.0*0.15
          = 1.6 + 1.5 + 2.25 + 1.4 + 1.2
          = 7.95/10 ✅ Pass
```

---

## Golden Set 평가 기준

### Pass/Fail 기준

| 제품 카테고리 | Min Score | 설명 |
|--------------|-----------|------|
| 일반 제품 | 7.0/10 | 대부분의 B2C, B2B 제품 |
| 럭셔리 제품 | 7.5/10 | 프리미엄 브랜드, 고가 제품 |
| 복잡한 B2B | 7.0/10 | SaaS, 기술 제품 |

### Golden Set 5개 케이스 분포

| Case ID | 카테고리 | Difficulty | Min Score | 설명 |
|---------|----------|------------|-----------|------|
| strategist_001 | Luxury | Medium | 7.5 | 프리미엄 스킨케어 |
| strategist_002 | Professional | Hard | 7.0 | 테크 워크스테이션 |
| strategist_003 | Friendly | Easy | 7.0 | 건강 간식 |
| strategist_004 | Casual | Medium | 7.0 | 친환경 패션 |
| strategist_005 | Professional | Hard | 7.0 | B2B SaaS |

### Pass Rate 목표

- **목표**: ≥ 70% (5개 중 3.5개 = 4개 이상)
- **Conservative**: 60% (5개 중 3개)
- **Stretch Goal**: 80% (5개 중 4개)

---

## Semantic Similarity (선택)

### 사용 시나리오
- 프롬프트 변경 후 동일한 의미를 유지하는지 확인
- 리트라이 로직 검증

### 모델
- `paraphrase-multilingual-mpnet-base-v2`

### Threshold
- ≥ 0.85: 의미 유사
- 0.70-0.84: 부분 유사
- < 0.70: 의미 변경

---

## Troubleshooting

### Case 1: Schema Validation 실패
**증상**: Pydantic 모델 통과 실패
**원인**:
- 필수 필드 누락
- 타입 불일치 (string vs array)
**해결**:
- 프롬프트에 Output Format 명확히 명시
- Few-shot 예시에서 JSON 구조 정확히 제공

### Case 2: Length Validation 실패
**증상**: 필드 길이 기준 미달/초과
**원인**:
- 프롬프트에 길이 제약 명시 부족
- LLM이 길이 제약 무시
**해결**:
- 프롬프트에 "20-150자" 명시
- Few-shot 예시에서 적절한 길이 보여주기
- Retry Logic에서 길이 조정

### Case 3: Quality Score 낮음
**증상**: 4단계 통과했으나 7.0/10 미만
**원인**:
- Core Message가 뻔한 표현
- Big Idea가 추상적
- Strategic Pillars가 논리적 연결성 부족
**해결**:
- 프롬프트에 금지 패턴 명시
- Few-shot 예시 품질 향상
- Temperature 조정 (0.4 → 0.6)

---

## 평가 워크플로우

### Step 1: Golden Set Validator 실행
```bash
cd backend
python tests/golden_set_validator.py \
  --agent strategist \
  --report json \
  --output tests/golden_set_report_STRATEGIST_V1.json
```

### Step 2: 결과 분석
```json
{
  "pass_rate": 0.60,
  "avg_score": 6.8,
  "failed_cases": ["strategist_002", "strategist_005"]
}
```

### Step 3: 실패 케이스 Deep Dive
- 각 케이스의 5가지 평가 기준별 점수 확인
- 어느 기준에서 실패했는지 파악
- 프롬프트 또는 Few-shot 예시 개선

### Step 4: 프롬프트 튜닝
- 금지 패턴 추가
- Few-shot 예시 개선
- 작업 지침 명확화

### Step 5: 재검증
- Golden Set 재실행
- Pass Rate ≥ 70% 달성 확인

---

## 체크리스트

### Golden Set 평가 전
- [ ] 5개 케이스 모두 준비 완료
- [ ] Pydantic 모델 정의 완료
- [ ] Validation Pipeline 구현 완료
- [ ] Semantic Similarity 모델 로드 완료

### Golden Set 평가 중
- [ ] 1-3단계 Pass/Fail 확인
- [ ] 4단계 5가지 기준별 점수 산정
- [ ] 최종 점수 계산 (가중 평균)
- [ ] Pass Rate 계산

### Golden Set 평가 후
- [ ] Pass Rate ≥ 70% 확인
- [ ] Average Score ≥ 7.0 확인
- [ ] 실패 케이스 Deep Dive
- [ ] 프롬프트 개선 계획 수립

---

**작성**: A팀 (QA & Architecture)
**다음 업데이트**: B팀 Validation 구현 완료 후
**버전 히스토리**: v1.0 (2025-11-23) - 초기 버전
