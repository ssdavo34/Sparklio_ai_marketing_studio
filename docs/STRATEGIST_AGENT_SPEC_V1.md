# StrategistAgent Spec v1

**버전**: v1.0
**작성일**: 2025-11-23
**대상**: A팀(설계/품질), B팀(Backend), C팀(Frontend)
**상태**: 📋 **SPEC DRAFT** (구현 대기)

---

## 1. Agent 개요

### 1.1 역할 정의

**StrategistAgent**는 캠페인·강의·상품 런칭 등의 상황에서
전체적인 **마케팅 전략/메시지 구조/채널별 방향성**을 설계해 주는 전략형 에이전트입니다.

**차별점**:
- **CopywriterAgent**: 문장·카피 중심 (Headline, Body, CTA)
- **StrategistAgent**: 구조·방향·우선순위 중심 (전략, 포지셔닝, 채널 믹스)

### 1.2 주요 사용 시나리오

1. **강의/제품 런칭 페이지 기획**
   - 타겟 인사이트 도출
   - 핵심 메시지 구조화
   - 채널별 역할 설정

2. **다채널 캠페인 전략 요약**
   - 페이스북/인스타그램/유튜브 등
   - 각 채널의 역할과 메시지 각도 제안

3. **브랜드/상품의 핵심 메시지 구조**
   - Big Idea 도출
   - Strategic Pillars 정의
   - Funnel Structure 설계

---

## 2. 지원 Task

### 2.1 Task 목록 (v1)

| Task 이름 | Kind | 설명 | 우선순위 |
|-----------|------|------|----------|
| **`strategist.campaign_strategy`** | `ad_campaign_plan` | 단일 캠페인/강의에 대한 전략 요약 | **P0** ⭐ |
| `strategist.channel_mix_plan` | `ad_campaign_plan` | 채널별 역할/메시지/예산 비중 제안 | P1 |
| `strategist.brand_dna_extractor` | `brand_analysis` | URL/텍스트에서 브랜드 DNA 추출 | P2 |

> **v1 집중 Task**: `strategist.campaign_strategy`
> 나머지 Task는 골격만 정의하고 이후 단계에서 확장합니다.

---

## 3. `strategist.campaign_strategy` 상세

### 3.1 목적

- `copywriter.content_plan` 또는 유사한 입력을 받아,
- **"이번 캠페인/강의의 방향성을 한눈에 이해할 수 있는 전략 요약"**을 제공합니다.
- ContentPlanPages(cover/audience/overview/channels/cta)와 자연스럽게 연결되도록 설계합니다.

### 3.2 Input Schema (`CampaignStrategyInputV1`)

#### JSON 예시
```json
{
  "title": "AI 자동화 강의 광고",
  "product_or_service": "AI 자동화 온라인 강의",
  "main_objectives": [
    "AI 기술 이해도 향상",
    "AI 자동화의 중요성과 활용성 인식"
  ],
  "audience": {
    "target_group": "IT 전문가, 비즈니스 관리자, 학생",
    "age_range": "20-45세",
    "interests": ["기술", "학습", "비즈니스 자동화"]
  },
  "channels": ["페이스북 광고", "인스타그램 스토리", "유튜브 광고"],
  "constraints": {
    "budget_level": "medium",
    "duration_weeks": 4,
    "primary_kpi": "리드 수"
  },
  "tone": "실용적이면서도 영감을 주는 톤",
  "notes": "B2B 비즈니스 대상, 교육 플랫폼과 제휴 예정"
}
```

#### Pydantic Schema (B팀 구현 참고)
```python
from pydantic import BaseModel, Field
from typing import List, Optional

class AudienceInfo(BaseModel):
    target_group: str = Field(..., description="타겟 그룹")
    age_range: Optional[str] = Field(None, description="연령대")
    interests: List[str] = Field(default_factory=list)

class CampaignConstraints(BaseModel):
    budget_level: str = Field(..., pattern="^(low|medium|high)$")
    duration_weeks: int = Field(..., ge=1, le=52)
    primary_kpi: str = Field(..., description="주요 KPI")

class CampaignStrategyInputV1(BaseModel):
    title: str = Field(..., min_length=5, max_length=100)
    product_or_service: str = Field(..., min_length=10, max_length=200)
    main_objectives: List[str] = Field(..., min_items=1, max_items=5)
    audience: AudienceInfo
    channels: List[str] = Field(..., min_items=1, max_items=10)
    constraints: CampaignConstraints
    tone: str = Field(..., min_length=10, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)
```

---

### 3.3 Output Schema (`CampaignStrategyOutputV1`)

#### JSON 예시
```json
{
  "core_message": "AI 자동화로 반복 업무를 줄이고 핵심 업무에 집중할 수 있다는 메시지",
  "positioning": "바쁜 실무자를 위한 실전형 AI 자동화 입문 코스",
  "target_insights": [
    "AI를 해야 한다는 건 알지만, 어디서부터 시작해야 할지 막막하다.",
    "실제 업무에 바로 적용 가능한 예제가 중요하다.",
    "짧은 시간에 핵심만 배우고 싶어 한다."
  ],
  "big_idea": "퇴근 시간을 앞당겨 주는 AI 자동화",
  "strategic_pillars": [
    {
      "name": "실전 중심",
      "description": "실제 엑셀/노션/업무 자동화 예제를 통해 바로 따라 할 수 있게 구성",
      "proof_points": [
        "실제 업무 시나리오 기반 예제 10개",
        "수강생 실습 과제 피드백"
      ]
    },
    {
      "name": "시간 절약",
      "description": "반복 업무를 AI가 대신해 주는 경험을 강조",
      "proof_points": [
        "업무 자동화 전/후 비교 사례",
        "평균 절감 시간 데이터"
      ]
    }
  ],
  "channel_strategy": [
    {
      "channel": "페이스북 광고",
      "role": "리드 확보",
      "message_angle": "업무 시간을 줄여 주는 실전형 AI 강의",
      "kpi": "리드 폼 제출 수"
    },
    {
      "channel": "인스타그램 스토리",
      "role": "관심 유도",
      "message_angle": "퇴근 시간을 앞당겨 주는 AI 자동화 한 컷",
      "kpi": "스토리 답장/탭 수"
    }
  ],
  "funnel_structure": {
    "awareness": [
      "AI 자동화의 필요성과 가능성을 보여주는 콘텐츠",
      "짧은 영상/릴스 중심"
    ],
    "consideration": [
      "강의 커리큘럼 소개",
      "실제 예제 일부 공개"
    ],
    "conversion": [
      "한정 할인/보너스 제공",
      "수강생 후기 강조"
    ]
  },
  "risk_factors": [
    "AI 피로감: AI 관련 광고가 너무 많아 차별화 필요",
    "실제 적용 가능성에 대한 불신"
  ],
  "success_metrics": [
    "리드 수 100건 이상",
    "신규 수강생 50명 이상",
    "광고 클릭률 3% 이상"
  ]
}
```

#### Pydantic Schema (B팀 구현 참고)
```python
class StrategicPillar(BaseModel):
    name: str = Field(..., min_length=3, max_length=30)
    description: str = Field(..., min_length=20, max_length=200)
    proof_points: List[str] = Field(..., min_items=1, max_items=5)

class ChannelStrategy(BaseModel):
    channel: str = Field(..., min_length=3, max_length=50)
    role: str = Field(..., min_length=5, max_length=50)
    message_angle: str = Field(..., min_length=10, max_length=100)
    kpi: str = Field(..., min_length=5, max_length=50)

class FunnelStructure(BaseModel):
    awareness: List[str] = Field(..., min_items=1, max_items=5)
    consideration: List[str] = Field(..., min_items=1, max_items=5)
    conversion: List[str] = Field(..., min_items=1, max_items=5)

class CampaignStrategyOutputV1(BaseModel):
    core_message: str = Field(..., min_length=20, max_length=150)
    positioning: str = Field(..., min_length=20, max_length=150)
    target_insights: List[str] = Field(..., min_items=2, max_items=5)
    big_idea: str = Field(..., min_length=10, max_length=100)
    strategic_pillars: List[StrategicPillar] = Field(..., min_items=2, max_items=4)
    channel_strategy: List[ChannelStrategy] = Field(..., min_items=2, max_items=5)
    funnel_structure: FunnelStructure
    risk_factors: List[str] = Field(..., min_items=1, max_items=5)
    success_metrics: List[str] = Field(..., min_items=2, max_items=5)
```

---

## 4. Prompt Spec (A팀 책임)

### 4.1 시스템 프롬프트 v1 요구사항

A팀이 설계해야 하는 내용 (가이드라인):

#### 1. 역할 지정
```
당신은 10년 이상 실무 경험을 가진 마케팅 전략가입니다.
카피를 직접 쓰기보다, 구조/방향/우선순위를 잡는 것이 역할입니다.
```

#### 2. 출력 형식 고정
- 반드시 `CampaignStrategyOutputV1` JSON 형식으로만 출력
- 한국어로 작성
- 각 필드는 위 Output Schema 정의에 맞춰 서술

#### 3. 전략적 깊이
- **core_message**, **big_idea**: "한 문장"이지만 명확하고 임팩트 있어야 함
- **target_insights**, **strategic_pillars**, **channel_strategy**:
  **"실제 회의에서 바로 쓸 수 있을 정도의 구체성"** 요구

#### 4. 금지/주의 규칙
```
❌ 막연한 슬로건 나열 금지
❌ 너무 추상적인 단어(혁신적인, 차별화된, 스마트한 등)만 반복 금지
❌ Input에 있는 문장을 그대로 반복하는 것 금지 (요약/재해석 필수)
❌ core_message와 big_idea가 완전히 동일한 문장 금지
❌ channel_strategy의 role이 모두 "홍보"로만 나열되는 것 금지
```

#### 5. Few-shot 예시
최소 2개 예시 필요:
1. **디지털 강의 캠페인** (B2C/B2B)
2. **실물 제품 런칭 캠페인** (중저가/프리미엄)

**A팀 작업물**: 이 가이드라인을 기반으로
실제 시스템 프롬프트/예시를 `PROMPT_STRATEGIST_CAMPAIGN_V1.md`로 별도 작성

---

## 5. Validation & Sanitize Spec (B팀 + A팀 협업)

### 5.1 Validation 단계

StrategistAgent도 **공통 4단계 Validation Pipeline**을 사용합니다.

#### Stage 1: Schema Validation (Pydantic)
- `CampaignStrategyOutputV1` 검증
- 필수 필드 누락, 타입 불일치 검사

#### Stage 2: Length / 구조 규칙
| 필드 | 제약 | 위반 시 |
|------|------|---------|
| core_message | 20-150자 | Error |
| big_idea | 10-100자 | Error |
| strategic_pillars | 2-4개 | Error |
| channel_strategy | 2-5개 | Error |
| target_insights | 2-5개 | Error |
| funnel_structure.* | 각 1-5개 | Warning |

#### Stage 3: Language & Clarity
- 한국어 기준 (30% 이상)
- 불필요한 영어 문장, 번역체 감지 시 Warning
- Bullet/리스트가 "~등", "여러 가지" 등 모호 표현만으로 끝나지 않도록 체크

#### Stage 4: Quality 룰
```python
# Quality Check Examples
issues = []

# 1. core_message와 big_idea 동일성 체크
if output.core_message == output.big_idea:
    issues.append("core_message와 big_idea가 동일합니다")
    score -= 2.0

# 2. channel_strategy role 중복 체크
roles = [ch.role for ch in output.channel_strategy]
if len(roles) != len(set(roles)):
    issues.append("channel_strategy의 role이 모두 동일합니다")
    score -= 1.5

# 3. risk_factors 비어있음 체크
if len(output.risk_factors) == 0:
    issues.append("risk_factors가 비어 있습니다")
    score -= 1.0

# 4. strategic_pillars proof_points 체크
for pillar in output.strategic_pillars:
    if len(pillar.proof_points) == 0:
        issues.append(f"{pillar.name}: proof_points가 비어 있습니다")
        score -= 0.5
```

### 5.2 Sanitize (후처리)
- 과도한 공백/줄바꿈 정리
- 리스트 항목 끝 마침표 일관화
- core_message, big_idea 끝에 불필요한 따옴표 제거
- JSON 인코딩 이슈 처리

---

## 6. Golden Set & 품질 기준

### 6.1 Golden Set 구성

**파일 경로**:
```
backend/tests/golden_sets/strategist/
├── campaign_strategy_001_ai_lecture.json
├── campaign_strategy_002_b2b_saas.json
├── campaign_strategy_003_premium_product.json
├── campaign_strategy_004_mid_price_product.json
└── campaign_strategy_005_nonprofit_campaign.json
```

**케이스 수 (v1)**: 최소 5개 (목표 10개)

**카테고리 분포**:
- 강의 캠페인 2개 (B2C/B2B)
- 실물 제품 런칭 2개 (중저가/프리미엄)
- SaaS 서비스 1개

#### 각 케이스 구조
```json
{
  "case_id": "strategist_campaign_001",
  "scenario": "AI 자동화 강의 - B2B",
  "input": {
    "title": "AI 자동화 강의 광고",
    "product_or_service": "...",
    ...
  },
  "expected_output": {
    "core_message": "...",
    "positioning": "...",
    ...
  },
  "min_score": 7.0,
  "evaluation_weights": {
    "core_message": 0.20,
    "big_idea": 0.20,
    "structure": 0.25,
    "channel_fit": 0.20,
    "clarity": 0.15
  }
}
```

### 6.2 평가 기준

**Overall Score**: 0~10

| 항목 | 비중 | 설명 |
|------|------|------|
| **core_message** | 20% | 핵심 메시지 명확성 |
| **big_idea** | 20% | Big Idea 임팩트 |
| **structure** | 25% | 전략 골격 (Pillars, Funnel) |
| **channel_fit** | 20% | 채널 전략 적합성 |
| **clarity** | 15% | 전체 명료함 |

**Production Ready 기준 (v1)**:
- ✅ **Pass Rate** ≥ 70% (7/10 이상)
- ✅ **Average Score** ≥ 7.0/10
- ✅ **Critical Failure** = 0 (JSON 깨짐/완전 엉뚱한 전략)

**Golden Set 평가**:
- `tests/strategist_golden_set_validator.py`에서 수행
- CopywriterAgent와 동일한 패턴 사용

---

## 7. Frontend 연동 (C팀 참고)

### 7.1 Strategist Output UI

#### 위치
- **Option 1**: Chat 결과 우측/하단 "전략 요약" 패널
- **Option 2**: ContentPlanViewer 상단 "Strategy" 탭

#### 구성
```
┌─────────────────────────────────────┐
│  📊 캠페인 전략 요약                 │
├─────────────────────────────────────┤
│  Core Message                       │
│  [카드: AI 자동화로 반복 업무 절감] │
│                                     │
│  Big Idea                           │
│  [카드: 퇴근 시간을 앞당겨 주는...]  │
├─────────────────────────────────────┤
│  Strategic Pillars                  │
│  [카드 1] 실전 중심                 │
│    - 설명                           │
│    - 증거 포인트 리스트             │
│  [카드 2] 시간 절약                 │
│    - 설명                           │
│    - 증거 포인트 리스트             │
├─────────────────────────────────────┤
│  Channel Strategy                   │
│  [테이블 또는 카드]                 │
│  - 페이스북: 리드 확보              │
│  - 인스타그램: 관심 유도            │
├─────────────────────────────────────┤
│  Funnel Structure                   │
│  [3단 컬럼]                         │
│  Awareness → Consideration → Conv.  │
└─────────────────────────────────────┘
```

### 7.2 Interaction 아이디어

#### 연결 버튼
1. **"이 전략으로 content_plan 다시 생성"**
   - Strategist Output → ContentPlanAgent Input으로 전달
   - 전략 기반 페이지 구조 재생성

2. **"채널별 카피 생성"**
   - channel_strategy → CopywriterAgent Input
   - 각 채널별 카피 세트 자동 생성

3. **"Reviewer 피드백 요청"**
   - 나중에 ReviewerAgent와 연결
   - 전략 기반 피드백/최적화

#### 편집 모드
- 각 필드 inline 편집 가능
- 수정 후 "적용" 버튼 → 다시 Copywriter 호출 시 반영

---

## 8. 팀별 책임 요약

### 🔷 A팀 (QA & Architecture)
1. ✅ Task/Schema 정의 (TASK_SCHEMA_CATALOG_V2 등록)
2. ✅ Prompt Spec 작성 (PROMPT_STRATEGIST_CAMPAIGN_V1.md)
3. ✅ Golden Set 설계 (최소 5개)
4. ✅ 품질 기준 수립 (Pass Rate 70%, Avg 7.0)

### 🔷 B팀 (Backend)
1. ✅ Pydantic 모델 구현 (Input/Output)
2. ✅ StrategistAgent 구현/확장
3. ✅ Validation 파이프라인 연동 (4단계)
4. ✅ Golden Set Validator 작성
5. ✅ CI 통합 준비

### 🔷 C팀 (Frontend)
1. ✅ TypeScript 타입 정의
2. ✅ Strategist 결과 뷰어 UI
3. ✅ ContentPlan/Copywriter 흐름 연결
4. ✅ 편집 모드 구현

---

## 9. 타임라인

### Week 1 (이번 주)
- **Day 1-2**: A팀 Prompt Spec + Golden Set 설계
- **Day 3-4**: B팀 Pydantic + Agent 구현
- **Day 5**: 통합 테스트 + Golden Set 검증

### Week 2 (다음 주)
- **Day 1-3**: C팀 UI 구현
- **Day 4**: 전체 통합 테스트
- **Day 5**: Pass Rate 70% 목표 달성 확인

**예상 소요 기간**: 2주

---

## 10. 성공 지표 (KPI)

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| **Pass Rate** | ≥ 70% | Golden Set Validator |
| **Average Score** | ≥ 7.0/10 | Golden Set Validator |
| **Critical Failure** | = 0 | Validation Pipeline |
| **Schema Compliance** | 100% | Pydantic Validation |
| **User Satisfaction** | ≥ 8.0/10 | 실사용자 피드백 (2주 후) |

---

## 11. 위험 요소 & 대응

### 위험 1: 전략이 너무 추상적
**증상**: "혁신적인", "차별화된" 같은 단어만 반복

**대응**:
- Prompt에 구체성 요구사항 명시
- Quality Validation에서 추상적 단어 과다 사용 감지
- Few-shot 예시에 구체적 사례 포함

### 위험 2: Copywriter와의 연결 부자연스러움
**증상**: 전략과 카피가 따로 논다

**대응**:
- Strategist Output을 Copywriter Input에 명시적으로 전달하는 플로우 설계
- C팀 UI에서 "전략 기반 카피 생성" 버튼 명확히 표시

### 위험 3: Golden Set 평가 기준 모호
**증상**: "구조", "채널 적합성" 점수 매기기 어려움

**대응**:
- A팀이 평가 기준 상세 가이드 작성
- 초기 5개 케이스에 대해 A/B팀 합의로 점수 기준선 설정

---

## 12. 참고 문서

### 기존 문서
1. [TASK_SCHEMA_CATALOG_V2.md](TASK_SCHEMA_CATALOG_V2.md)
2. [AGENT_QUALITY_ROLLOUT_PLAN_2025-11.md](AGENT_QUALITY_ROLLOUT_PLAN_2025-11.md)
3. [COPYWRITER_PRODUCTION_READY_2025-11-23.md](COPYWRITER_PRODUCTION_READY_2025-11-23.md)

### 신규 문서 (작성 예정)
4. **PROMPT_STRATEGIST_CAMPAIGN_V1.md** (A팀)
5. **STRATEGIST_GOLDEN_SET_GUIDE.md** (A팀)
6. **STRATEGIST_AGENT_HANDOFF.md** (팀 간 인수인계)

---

## ✅ 최종 체크리스트 (배포 전)

### A팀
- [ ] TASK_SCHEMA_CATALOG_V2에 strategist.campaign_strategy 등록
- [ ] PROMPT_STRATEGIST_CAMPAIGN_V1.md 작성 (Few-shot 2개 이상)
- [ ] Golden Set 5개 작성 (다양한 카테고리)
- [ ] 평가 기준 상세 가이드 작성

### B팀
- [ ] Pydantic 모델 구현 (Input/Output)
- [ ] StrategistAgent 구현 (campaign_strategy Task 지원)
- [ ] 4단계 Validation 연동
- [ ] Golden Set Validator 작성
- [ ] Pass Rate ≥ 70% 달성

### C팀
- [ ] TypeScript 타입 정의
- [ ] StrategistStrategyView 컴포넌트 구현
- [ ] ContentPlan/Copywriter 연결 UX
- [ ] 편집 모드 구현

---

**End of Spec Document**
