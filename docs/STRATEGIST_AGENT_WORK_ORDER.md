# StrategistAgent 작업 지시서

**발행일**: 2025-11-23
**대상**: A팀, B팀, C팀
**우선순위**: 🔴 **P0-P1** (CopywriterAgent 다음 최우선)
**목표**: 2주 내 Pass Rate 70% 달성 및 Production Ready

---

## 📊 작업 개요

### 배경
- ✅ CopywriterAgent Production Ready 달성 (Pass Rate 70%)
- 🎯 다음 Agent: **StrategistAgent** (캠페인 전략 설계)
- 🚀 CopywriterAgent 성공 경험 재사용

### 목표
**2주 내에 `strategist.campaign_strategy` Task를 Production Ready 상태로 만들기**

| 지표 | 목표 | 마감 |
|------|------|------|
| Pass Rate | ≥ 70% | Week 2 금요일 |
| Average Score | ≥ 7.0/10 | Week 2 금요일 |
| Golden Set | 5-10 cases | Week 1 수요일 |
| Documentation | 100% | Week 2 금요일 |

---

## 🔷 A팀 작업 지시서 (QA & Architecture)

**담당자**: A팀 Lead
**기간**: Week 1 (월~금)
**우선순위**: P0

### Task 1: Task/Schema 정의 및 등록

**마감**: Week 1 월요일 오후

#### 작업 내용
1. **TASK_SCHEMA_CATALOG_V2.md 업데이트**
   ```markdown
   ### strategist.campaign_strategy

   **Kind**: `ad_campaign_plan`
   **Description**: 단일 캠페인/강의에 대한 마케팅 전략 요약 생성

   **Input Schema**: `CampaignStrategyInputV1`
   - title: 캠페인 제목
   - product_or_service: 제품/서비스 설명
   - main_objectives: 주요 목표 리스트
   - audience: 타겟 오디언스 정보
   - channels: 마케팅 채널 리스트
   - constraints: 예산/기간/KPI 제약
   - tone: 톤앤매너
   - notes: 추가 참고사항

   **Output Schema**: `CampaignStrategyOutputV1`
   - core_message: 핵심 메시지
   - positioning: 포지셔닝
   - target_insights: 타겟 인사이트 리스트
   - big_idea: Big Idea
   - strategic_pillars: 전략 기둥 리스트
   - channel_strategy: 채널별 전략
   - funnel_structure: 퍼널 구조
   - risk_factors: 위험 요소
   - success_metrics: 성공 지표

   **Example**:
   [입력/출력 예시 포함]
   ```

2. **Pydantic Schema 명세서 작성**
   - 파일: `docs/STRATEGIST_SCHEMAS.md`
   - 모든 필드 타입, 제약조건, 설명 포함
   - B팀에게 전달

#### 산출물
- [ ] TASK_SCHEMA_CATALOG_V2.md 업데이트 완료
- [ ] STRATEGIST_SCHEMAS.md 작성 완료
- [ ] B팀에게 전달 완료

---

### Task 2: Prompt Spec 작성

**마감**: Week 1 수요일

#### 작업 내용
1. **PROMPT_STRATEGIST_CAMPAIGN_V1.md 작성**

   **필수 포함 사항**:
   ```markdown
   ## 1. 역할 정의
   당신은 10년 이상 실무 경험을 가진 마케팅 전략가입니다.
   카피를 직접 쓰기보다, 구조/방향/우선순위를 잡는 것이 역할입니다.

   ## 2. 출력 형식
   반드시 CampaignStrategyOutputV1 JSON 형식으로만 출력하세요.
   한국어로 작성하세요.

   ## 3. 금지 패턴
   ❌ 막연한 슬로건 나열 금지
   ❌ 추상적 단어(혁신적인, 차별화된, 스마트한) 반복 금지
   ❌ Input 문장 그대로 반복 금지
   ❌ core_message와 big_idea가 동일한 문장 금지
   ❌ channel_strategy의 role이 모두 "홍보"로만 나열 금지

   ## 4. 전략적 깊이 요구사항
   - core_message, big_idea: 한 문장이지만 명확하고 임팩트 있어야 함
   - target_insights: 실제 타겟의 pain point/desire 반영
   - strategic_pillars: 실제 회의에서 바로 쓸 수 있을 정도의 구체성
   - channel_strategy: 각 채널의 역할이 명확히 구분되어야 함

   ## 5. Few-shot 예시

   ### 예시 1: AI 자동화 강의 (B2B)
   [Input/Output 전문 포함]

   ### 예시 2: 프리미엄 스킨케어 제품 런칭 (B2C)
   [Input/Output 전문 포함]

   ## 6. 최종 체크리스트
   - [ ] core_message와 big_idea가 서로 다른가?
   - [ ] target_insights가 구체적인가?
   - [ ] channel_strategy의 role이 모두 다른가?
   - [ ] strategic_pillars에 proof_points가 있는가?
   - [ ] 유효한 JSON 형식인가?
   ```

2. **Few-shot 예시 최소 2개 작성**
   - AI 자동화 강의 (B2B)
   - 프리미엄 제품 런칭 (B2C)
   - 각 예시는 완전한 Input/Output 포함

#### 산출물
- [ ] PROMPT_STRATEGIST_CAMPAIGN_V1.md 작성 완료
- [ ] Few-shot 예시 2개 이상 포함
- [ ] B팀에게 전달 완료

---

### Task 3: Golden Set 설계

**마감**: Week 1 금요일

#### 작업 내용
1. **Golden Set 5개 케이스 작성**

   **파일 경로**:
   ```
   backend/tests/golden_sets/strategist/
   ├── campaign_strategy_001_ai_lecture_b2b.json
   ├── campaign_strategy_002_premium_skincare.json
   ├── campaign_strategy_003_mid_price_electronics.json
   ├── campaign_strategy_004_saas_launch.json
   └── campaign_strategy_005_nonprofit_campaign.json
   ```

   **각 케이스 구조**:
   ```json
   {
     "case_id": "strategist_campaign_001",
     "scenario": "AI 자동화 강의 - B2B 타겟",
     "category": "education",
     "input": {
       "title": "...",
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

2. **평가 기준 상세 가이드 작성**
   - 파일: `docs/STRATEGIST_EVALUATION_GUIDE.md`
   - 각 필드별 점수 매기는 방법 명시
   - 예시: "core_message가 60자 이내이면서 핵심을 담고 있으면 8점 이상"

#### 산출물
- [ ] Golden Set 5개 케이스 작성 완료
- [ ] STRATEGIST_EVALUATION_GUIDE.md 작성 완료
- [ ] B팀에게 전달 완료

---

### Task 4: 품질 기준 수립

**마감**: Week 1 금요일

#### 작업 내용
1. **Production Ready 기준 정의**
   ```markdown
   ## StrategistAgent Production Ready 기준

   ### 필수 기준
   - Pass Rate ≥ 70% (CopywriterAgent와 동일)
   - Average Score ≥ 7.0/10
   - Critical Failure = 0 (JSON 깨짐, 완전 엉뚱한 전략)
   - Schema Validation 100% 통과

   ### 권장 기준
   - Min Score ≥ 6.0/10
   - target_insights 구체성 ≥ 80%
   - channel_strategy 역할 구분 명확성 100%
   ```

2. **Validation 룰 정의**
   - Quality Stage에서 체크할 항목 리스트
   - B팀에게 전달

#### 산출물
- [ ] Production Ready 기준 문서화
- [ ] Validation 룰 리스트 작성
- [ ] B팀에게 전달 완료

---

## 🔷 B팀 작업 지시서 (Backend)

**담당자**: B팀 Lead
**기간**: Week 1-2 (월~금)
**우선순위**: P0

### Task 1: Pydantic 모델 구현

**마감**: Week 1 화요일

#### 작업 내용
1. **파일 생성**: `backend/app/schemas/strategist.py`

2. **Input Schema 구현**
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

3. **Output Schema 구현**
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

#### 산출물
- [ ] `app/schemas/strategist.py` 작성 완료
- [ ] Input/Output Schema 테스트 코드 작성
- [ ] A팀에게 리뷰 요청

---

### Task 2: StrategistAgent 구현

**마감**: Week 1 목요일

#### 작업 내용
1. **파일 생성/수정**: `backend/app/services/agents/strategist.py`

2. **Agent 구현**
   ```python
   from app.services.agents.base import BaseAgent, AgentRequest, AgentResponse
   from app.schemas.strategist import CampaignStrategyInputV1, CampaignStrategyOutputV1
   from app.services.llm import get_llm_gateway

   class StrategistAgent(BaseAgent):
       def __init__(self):
           super().__init__()
           self.llm_gateway = get_llm_gateway()

       async def execute(self, request: AgentRequest) -> AgentResponse:
           if request.task == "campaign_strategy":
               return await self._campaign_strategy(request)
           else:
               raise ValueError(f"Unsupported task: {request.task}")

       async def _campaign_strategy(self, request: AgentRequest) -> AgentResponse:
           # Validate input
           input_data = CampaignStrategyInputV1(**request.payload)

           # LLM 호출 (A팀 프롬프트 사용)
           llm_response = await self.llm_gateway.generate(
               role="strategist",
               task="campaign_strategy",
               payload=input_data.dict(),
               mode="json",
               options=request.options
           )

           # Validation (4단계)
           validation_result = self._validate_output(
               llm_response.output.value,
               task="campaign_strategy"
           )

           if not validation_result.passed:
               # Retry logic (Copywriter와 동일)
               ...

           return AgentResponse(...)
   ```

3. **Retry Logic 구현**
   - CopywriterAgent와 동일한 패턴
   - 최대 3회 시도, temperature 점진 증가

#### 산출물
- [ ] `app/services/agents/strategist.py` 구현 완료
- [ ] Retry Logic 동작 확인
- [ ] Unit Test 작성

---

### Task 3: Validation 파이프라인 연동

**마감**: Week 1 금요일

#### 작업 내용
1. **`output_validator.py` 확장**

   ```python
   # SCHEMA_MAP 업데이트
   SCHEMA_MAP = {
       "product_detail": ProductDetailOutput,
       "sns": SNSOutput,
       "brand_message": BrandMessageOutput,
       # 신규 추가
       "campaign_strategy": CampaignStrategyOutputV1,
   }

   # Quality Rules 추가
   def _validate_quality_campaign_strategy(self, output):
       issues = []
       score = 10.0

       # 1. core_message와 big_idea 동일성 체크
       if output.core_message == output.big_idea:
           issues.append("core_message와 big_idea가 동일합니다")
           score -= 2.0

       # 2. channel_strategy role 중복 체크
       roles = [ch.role for ch in output.channel_strategy]
       if len(roles) != len(set(roles)):
           issues.append("channel_strategy의 role이 중복됩니다")
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

       return StageResult(
           stage="quality",
           passed=len(issues) == 0,
           issues=issues,
           score=max(0.0, score)
       )
   ```

2. **Length/Language Rules 추가**
   - core_message: 20-150자
   - big_idea: 10-100자
   - strategic_pillars: 2-4개
   - channel_strategy: 2-5개

#### 산출물
- [ ] `output_validator.py` 업데이트 완료
- [ ] Validation 테스트 통과
- [ ] A팀에게 리뷰 요청

---

### Task 4: Golden Set Validator 작성

**마감**: Week 2 월요일

#### 작업 내용
1. **파일 생성**: `backend/tests/test_strategist_golden_set.py`

2. **Validator 구현**
   ```python
   import pytest
   from app.services.agents import get_strategist_agent
   from pathlib import Path
   import json

   @pytest.mark.asyncio
   async def test_strategist_golden_set():
       agent = get_strategist_agent()
       golden_dir = Path("tests/golden_sets/strategist")

       results = []
       for json_file in golden_dir.glob("campaign_strategy_*.json"):
           with open(json_file) as f:
               case = json.load(f)

           # Agent 실행
           response = await agent.execute(AgentRequest(
               task="campaign_strategy",
               payload=case["input"]
           ))

           # 점수 계산 (Semantic Similarity 사용)
           score = calculate_score(
               response.outputs[0].value,
               case["expected_output"],
               weights=case["evaluation_weights"]
           )

           results.append({
               "case_id": case["case_id"],
               "score": score,
               "passed": score >= case["min_score"]
           })

       # Pass Rate 계산
       pass_rate = sum(r["passed"] for r in results) / len(results)
       avg_score = sum(r["score"] for r in results) / len(results)

       assert pass_rate >= 0.70, f"Pass Rate {pass_rate:.0%} < 70%"
       assert avg_score >= 7.0, f"Avg Score {avg_score:.1f} < 7.0"
   ```

#### 산출물
- [ ] `test_strategist_golden_set.py` 작성 완료
- [ ] Golden Set 실행 및 결과 리포트 생성
- [ ] A팀에게 결과 공유

---

### Task 5: Pass Rate 70% 달성

**마감**: Week 2 수요일

#### 작업 내용
1. **Golden Set 재검증**
   - Pass Rate < 70% 시:
     - A팀과 협의하여 프롬프트 개선
     - Retry Logic 조정
     - Temperature 튜닝

2. **실패 케이스 분석**
   - 실패한 케이스의 공통 패턴 분석
   - A팀에게 피드백

#### 산출물
- [ ] Pass Rate ≥ 70% 달성
- [ ] Average Score ≥ 7.0 달성
- [ ] 결과 리포트 작성

---

## 🔷 C팀 작업 지시서 (Frontend)

**담당자**: C팀 Lead
**기간**: Week 1-2 (월~금)
**우선순위**: P1

### Task 1: TypeScript 타입 정의

**마감**: Week 1 수요일

#### 작업 내용
1. **파일 생성**: `frontend/components/canvas-studio/types/strategist.ts`

2. **타입 정의**
   ```typescript
   export interface AudienceInfo {
     target_group: string;
     age_range?: string;
     interests: string[];
   }

   export interface CampaignConstraints {
     budget_level: 'low' | 'medium' | 'high';
     duration_weeks: number;
     primary_kpi: string;
   }

   export interface CampaignStrategyInput {
     title: string;
     product_or_service: string;
     main_objectives: string[];
     audience: AudienceInfo;
     channels: string[];
     constraints: CampaignConstraints;
     tone: string;
     notes?: string;
   }

   export interface StrategicPillar {
     name: string;
     description: string;
     proof_points: string[];
   }

   export interface ChannelStrategy {
     channel: string;
     role: string;
     message_angle: string;
     kpi: string;
   }

   export interface FunnelStructure {
     awareness: string[];
     consideration: string[];
     conversion: string[];
   }

   export interface CampaignStrategyOutput {
     core_message: string;
     positioning: string;
     target_insights: string[];
     big_idea: string;
     strategic_pillars: StrategicPillar[];
     channel_strategy: ChannelStrategy[];
     funnel_structure: FunnelStructure;
     risk_factors: string[];
     success_metrics: string[];
   }
   ```

#### 산출물
- [ ] `types/strategist.ts` 작성 완료
- [ ] B팀 Schema와 1:1 매칭 확인

---

### Task 2: Strategist 결과 뷰어 UI

**마감**: Week 2 화요일

#### 작업 내용
1. **파일 생성**: `frontend/components/canvas-studio/components/StrategistStrategyView.tsx`

2. **컴포넌트 구현**
   ```tsx
   import React from 'react';
   import type { CampaignStrategyOutput } from '../types/strategist';

   interface Props {
     strategy: CampaignStrategyOutput;
     editable?: boolean;
     onChange?: (strategy: CampaignStrategyOutput) => void;
   }

   export function StrategistStrategyView({ strategy, editable, onChange }: Props) {
     return (
       <div className="space-y-6">
         {/* Core Message & Big Idea */}
         <div className="grid grid-cols-2 gap-4">
           <CoreMessageCard message={strategy.core_message} />
           <BigIdeaCard idea={strategy.big_idea} />
         </div>

         {/* Strategic Pillars */}
         <section>
           <h3 className="text-lg font-semibold mb-3">전략 기둥</h3>
           <div className="grid gap-3">
             {strategy.strategic_pillars.map((pillar, idx) => (
               <PillarCard key={idx} pillar={pillar} />
             ))}
           </div>
         </section>

         {/* Channel Strategy */}
         <section>
           <h3 className="text-lg font-semibold mb-3">채널 전략</h3>
           <ChannelTable strategies={strategy.channel_strategy} />
         </section>

         {/* Funnel Structure */}
         <section>
           <h3 className="text-lg font-semibold mb-3">퍼널 구조</h3>
           <FunnelView funnel={strategy.funnel_structure} />
         </section>

         {/* Risk Factors & Success Metrics */}
         <div className="grid grid-cols-2 gap-4">
           <RiskFactorsCard factors={strategy.risk_factors} />
           <SuccessMetricsCard metrics={strategy.success_metrics} />
         </div>
       </div>
     );
   }
   ```

3. **하위 컴포넌트 구현**
   - `CoreMessageCard`
   - `BigIdeaCard`
   - `PillarCard`
   - `ChannelTable`
   - `FunnelView`
   - `RiskFactorsCard`
   - `SuccessMetricsCard`

#### 산출물
- [ ] `StrategistStrategyView.tsx` 구현 완료
- [ ] 모든 하위 컴포넌트 구현 완료
- [ ] Storybook 스토리 작성 (선택)

---

### Task 3: ContentPlan/Copywriter 연결 UX

**마감**: Week 2 목요일

#### 작업 내용
1. **Chat 결과 탭 구조 업데이트**
   ```tsx
   // ChatResultPanel.tsx
   <Tabs>
     <Tab label="콘텐츠 플랜">
       <ContentPlanViewer contentPlan={...} />
     </Tab>
     <Tab label="전략 요약"> {/* NEW */}
       <StrategistStrategyView strategy={...} />
     </Tab>
     <Tab label="카피">
       <AdCopyOutput output={...} />
     </Tab>
   </Tabs>
   ```

2. **연결 버튼 구현**
   ```tsx
   // StrategistStrategyView.tsx에 버튼 추가
   <div className="flex gap-2 mt-4">
     <button onClick={handleRegenerateContentPlan}>
       이 전략으로 콘텐츠 플랜 재생성
     </button>
     <button onClick={handleGenerateCopies}>
       채널별 카피 생성
     </button>
   </div>
   ```

3. **데이터 플로우 구현**
   - Strategist Output → ContentPlanAgent Input
   - Strategist Output → CopywriterAgent Input (채널별)

#### 산출물
- [ ] Chat 결과 탭 업데이트 완료
- [ ] 연결 버튼 동작 확인
- [ ] 데이터 플로우 테스트 완료

---

### Task 4: 편집 모드 구현

**마감**: Week 2 금요일

#### 작업 내용
1. **Inline 편집 기능**
   ```tsx
   const [isEditing, setIsEditing] = useState(false);
   const [editedStrategy, setEditedStrategy] = useState(strategy);

   const handleEdit = () => setIsEditing(true);
   const handleSave = () => {
     onChange?.(editedStrategy);
     setIsEditing(false);
   };
   const handleCancel = () => {
     setEditedStrategy(strategy);
     setIsEditing(false);
   };
   ```

2. **필드별 편집 UI**
   - core_message, big_idea: `<input>` 또는 `<textarea>`
   - target_insights: 리스트 항목 추가/삭제/수정
   - strategic_pillars: 카드 내 필드 편집
   - channel_strategy: 테이블 셀 편집

#### 산출물
- [ ] 편집 모드 UI 구현 완료
- [ ] 편집 → 저장 → 적용 플로우 테스트

---

## 📅 전체 타임라인

### Week 1 (월~금)

| 요일 | A팀 | B팀 | C팀 |
|------|-----|-----|-----|
| **월** | Task/Schema 정의 | - | - |
| **화** | Prompt Spec 작성 시작 | Pydantic 모델 구현 | - |
| **수** | Prompt Spec 완료 | Agent 구현 시작 | TypeScript 타입 정의 |
| **목** | Golden Set 작성 시작 | Agent 구현 완료 | - |
| **금** | Golden Set 완료 | Validation 연동 | - |

### Week 2 (월~금)

| 요일 | A팀 | B팀 | C팀 |
|------|-----|-----|-----|
| **월** | Golden Set 리뷰 | Validator 작성 | UI 구현 시작 |
| **화** | 평가 기준 문서화 | Golden Set 실행 | UI 구현 계속 |
| **수** | 실패 케이스 분석 | Pass Rate 70% 달성 | 연결 UX 구현 |
| **목** | 최종 리뷰 | 최종 검증 | 연결 UX 완료 |
| **금** | Production Ready 선언 | 배포 준비 | 편집 모드 완료 |

---

## 🚨 위험 요소 & 에스컬레이션

### 위험 1: Pass Rate 70% 미달
**대응**: Week 2 수요일까지 60% 미만 시
- A팀/B팀 긴급 회의
- 프롬프트 v2 작성 또는 Golden Set 기준 재검토

### 위험 2: 팀 간 일정 지연
**대응**: 각 팀 Lead가 매일 오후 5시 진행상황 공유
- Slack 채널: #strategist-agent-dev
- 지연 발생 시 즉시 에스컬레이션

### 위험 3: Copywriter와의 연결 이슈
**대응**: C팀이 Week 2 목요일까지 데이터 플로우 테스트 완료
- 실패 시 B팀과 협의하여 API 조정

---

## ✅ 최종 체크리스트

### Week 2 금요일까지 완료해야 할 항목

#### A팀
- [ ] TASK_SCHEMA_CATALOG_V2 업데이트
- [ ] PROMPT_STRATEGIST_CAMPAIGN_V1.md 작성
- [ ] Golden Set 5개 작성
- [ ] STRATEGIST_EVALUATION_GUIDE.md 작성
- [ ] Production Ready 기준 문서화

#### B팀
- [ ] Pydantic 모델 구현
- [ ] StrategistAgent 구현
- [ ] 4단계 Validation 연동
- [ ] Golden Set Validator 작성
- [ ] **Pass Rate ≥ 70% 달성** ⭐
- [ ] **Average Score ≥ 7.0 달성** ⭐

#### C팀
- [ ] TypeScript 타입 정의
- [ ] StrategistStrategyView 컴포넌트
- [ ] ContentPlan/Copywriter 연결 UX
- [ ] 편집 모드 구현

---

## 📞 연락처 & 커뮤니케이션

### Slack 채널
- **#strategist-agent-dev**: 개발 진행상황 공유
- **#a-team-qa**: A팀 내부 논의
- **#b-team-backend**: B팀 내부 논의
- **#c-team-frontend**: C팀 내부 논의

### 일일 Standup
- **시간**: 매일 오전 10시
- **형식**: 각 팀 Lead가 5분 요약
- **내용**:
  - 어제 완료한 작업
  - 오늘 진행할 작업
  - 블로커/위험 요소

### 주간 Review
- **시간**: 매주 금요일 오후 4시
- **참석**: 전체 팀
- **내용**:
  - 주간 성과 리뷰
  - 다음 주 계획 조정

---

**작업 시작!** 🚀

모두 화이팅입니다! CopywriterAgent에서 증명했듯이, 우리는 2주 내에 70% Pass Rate를 달성할 수 있습니다!

**End of Work Order**
