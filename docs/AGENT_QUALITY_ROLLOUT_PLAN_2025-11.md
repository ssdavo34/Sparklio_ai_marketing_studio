# Agent Quality System 확장 롤아웃 플랜

**작성일**: 2025-11-23
**작성자**: A팀 (QA & Architecture)
**목표**: Copywriter 품질 시스템을 전 Agent로 단계적 확장

---

## 📊 Executive Summary

### 현재 상태
- ✅ **CopywriterAgent**: 품질 시스템 구축 완료
  - Task/Schema 정의
  - 4단계 Validation 파이프라인
  - Semantic Similarity 기반 Golden Set
  - Pass Rate: 50% (목표 70%)

### 확장 전략
**"모든 에이전트"로 확장하되, 우선순위 롤아웃**

- **P0-P1** (이번~다음 스프린트): 사용자 직접 노출 Agent 5개
- **P1-P2** (1-2개월): 디자인/레이아웃 Agent
- **P2 이후**: 내부 시스템/보조 Agent

---

## 🎯 전 Agent 공통 적용 원칙 (4가지)

### 1. Task & Schema Catalog 등록 ✅ **필수**

**목적**: 팀 간 동일한 언어 사용, 타입 안전성 확보

**적용 방법**:
- `TASK_SCHEMA_CATALOG_V2.md`에 모든 Agent의 Task 정의
- Input/Output Pydantic 스키마 명시
- 예시 포함

**예시**:
```yaml
copywriter.product_detail:
  input: ProductDetailInput (product_name, features, tone)
  output: ProductDetailOutput (headline, subheadline, body, bullets, cta)

strategist.campaign_strategy:
  input: CampaignStrategyInput (brand, goal, audience, budget)
  output: CampaignStrategyOutput (objectives, channels, timeline, kpis)
```

---

### 2. 4단계 Validation 파이프라인 연동 ✅ **필수**

**목적**: 모든 Agent 출력의 최소 품질 보장

**4단계 구조**:
1. **Schema Validation** (Pydantic): 필수 필드, 타입, 길이 제약
2. **Length Validation**: 필드별 최소/최대 길이 체크
3. **Language Validation**: 한국어 비율 (텍스트 Agent만 해당)
4. **Quality Validation**: 금지 패턴, 기본값 폴백 감지, 비즈니스 로직

**재사용 가능한 인프라**:
- `app/services/validation/output_validator.py`
- Agent별 Schema Class만 추가하면 자동 연동

---

### 3. Fallback 제거 & 에러 처리 통일 ✅ **필수**

**Bad Practice** (Before):
```python
# ❌ 나쁜 기본값 폴백
subheadline = content.get("subheadline", "제품 설명")
```

**Good Practice** (After):
```python
# ✅ Validation 실패 → 재시도 or AgentError
if not validation_result.passed:
    if attempt < MAX_RETRIES:
        retry_with_temperature_adjustment()
    else:
        raise AgentValidationError(validation_result.errors)
```

**효과**:
- C팀 `ErrorMessage.tsx` 컴포넌트가 제대로 작동
- 사용자에게 명확한 에러 메시지 전달

---

### 4. Golden Set 구조 & CI 연동 ✅ **권장 (핵심 Agent는 필수)**

**목적**: 회귀 방지, 배포 전 자동 품질 검증

**구조**:
```
tests/golden_sets/
├── copywriter/
│   ├── product_detail_golden_set.json (10-20 cases)
│   ├── sns_golden_set.json
│   └── brand_message_golden_set.json
├── strategist/
│   └── campaign_strategy_golden_set.json
└── reviewer/
    └── ad_copy_quality_check_golden_set.json
```

**CI 통합** (GitHub Actions):
```yaml
- name: Golden Set Validation
  run: |
    python tests/golden_set_validator.py --all --min-pass-rate 70
```

---

## 📅 롤아웃 로드맵

### Phase 1: P0 (이번 주~다음 주) - CopywriterAgent

**목표**: 첫 번째 Agent 완전 정복 → 템플릿 확립

| 작업 | 상태 | 담당 | 마감 |
|------|------|------|------|
| Task/Schema 정의 | ✅ 완료 | A팀 | - |
| 4단계 Validation | ✅ 완료 | B팀 | - |
| Prompt v2 | ✅ 완료 | A팀 | - |
| Golden Set 10개 | ✅ 완료 | A팀 | - |
| Semantic Similarity | ✅ 완료 | B팀 | - |
| **Prompt v3** | ⏳ 진행 중 | A+B팀 | **내일** |
| **Pass Rate 70%** | ⏳ 목표 | - | **내일** |
| Production Ready | ⏳ 대기 | - | 이번 주 |

---

### Phase 2: P0-P1 (다음 주~2주) - Top 5 Agents

**목표**: 사용자 직접 노출 Agent 5개 품질 시스템 구축

#### 우선순위 Agent 5개

| # | Agent | Task(s) | 우선순위 이유 | 예상 난이도 |
|---|-------|---------|--------------|------------|
| 1 | **CopywriterAgent** | product_detail, sns, brand_message | ✅ 완료 (템플릿) | - |
| 2 | **StrategistAgent** | campaign_strategy, content_plan | 캠페인 시작점, 사용자 최초 경험 | 🟡 Medium |
| 3 | **ReviewerAgent** | ad_copy_quality_check, design_review | 품질 피드백 문구, UX 핵심 | 🟡 Medium |
| 4 | **OptimizerAgent** | ad_copy_optimize, image_text_optimize | 기존 콘텐츠 개선, 재생성 핵심 | 🟢 Low |
| 5 | **DesignerAgent** | layout_suggestion, color_palette | 디자인 제안 텍스트/JSON | 🟡 Medium |

---

#### Agent별 적용 계획

##### 2️⃣ StrategistAgent (campaign_strategy, content_plan)

**현재 상태**: 프롬프트 초안 존재, Schema 미정의

**작업 항목**:
1. **Task/Schema 정의** (A팀, 1일)
   ```python
   class CampaignStrategyOutput(BaseModel):
       objectives: List[str] = Field(..., min_items=3, max_items=5)
       target_audience: str = Field(..., min_length=20, max_length=100)
       channels: List[str] = Field(..., min_items=2, max_items=6)
       timeline: str = Field(..., min_length=30, max_length=150)
       kpis: List[str] = Field(..., min_items=3, max_items=5)
   ```

2. **Validation 파이프라인** (B팀, 0.5일)
   - `output_validator.py`에 `CampaignStrategyOutput` 추가
   - Quality 룰: objectives 중복 체크, timeline 논리성

3. **Golden Set 5-10개** (A팀, 1일)
   - 시나리오: B2C 브랜드 런칭, 신제품 프로모션, 리브랜딩 등

4. **Prompt 개선** (A팀, 1일)
   - Few-shot 예시 3-5개
   - 금지 패턴 명시

**예상 Pass Rate 기준**: 60% (7.0/10)

---

##### 3️⃣ ReviewerAgent (ad_copy_quality_check)

**현재 상태**: 컨셉만 존재, 구현 없음

**작업 항목**:
1. **Task/Schema 정의** (A팀, 1일)
   ```python
   class AdCopyQualityCheckOutput(BaseModel):
       overall_score: float = Field(..., ge=0, le=10)
       strengths: List[str] = Field(..., min_items=2, max_items=4)
       issues: List[str] = Field(..., min_items=0, max_items=5)
       suggestions: List[str] = Field(..., min_items=1, max_items=3)
       is_approved: bool
   ```

2. **Validation 파이프라인** (B팀, 0.5일)
   - Schema 검증
   - Quality 룰: strengths/issues 중복 방지, score-approval 일관성

3. **Golden Set 5-10개** (A팀, 1일)
   - 시나리오: 우수 카피, 평범한 카피, 나쁜 카피 (각 2-3개)

4. **Prompt 작성** (A팀, 2일)
   - 평가 기준 명확화 (AIDA, 톤, 문법, 길이)
   - Few-shot 예시 5개

**예상 Pass Rate 기준**: 60% (6.5/10)

---

##### 4️⃣ OptimizerAgent (ad_copy_optimize)

**현재 상태**: 미구현

**작업 항목**:
1. **Task/Schema 정의** (A팀, 0.5일)
   ```python
   class AdCopyOptimizeOutput(BaseModel):
       optimized_headline: str = Field(..., max_length=25)
       optimized_body: str = Field(..., max_length=100)
       optimized_cta: str = Field(..., max_length=20)
       changes_made: List[str] = Field(..., min_items=1, max_items=5)
   ```

2. **Validation 파이프라인** (B팀, 0.5일)
   - CopywriterAgent와 유사한 Validation 재사용

3. **Golden Set 5개** (A팀, 0.5일)
   - Before/After 쌍 (낮은 품질 → 개선된 버전)

4. **Prompt 작성** (A팀, 1일)
   - "개선" 지향 프롬프트 (창작보다 수정 중심)

**예상 Pass Rate 기준**: 65% (CopywriterAgent 베이스라 상대적으로 쉬움)

---

##### 5️⃣ DesignerAgent (layout_suggestion, color_palette)

**현재 상태**: 미구현

**작업 항목**:
1. **Task/Schema 정의** (A팀, 1일)
   ```python
   class LayoutSuggestionOutput(BaseModel):
       layout_type: str = Field(..., pattern="^(grid|hero|sidebar|cards)$")
       sections: List[Section] = Field(..., min_items=2, max_items=5)
       rationale: str = Field(..., min_length=30, max_length=150)

   class ColorPaletteOutput(BaseModel):
       primary: str = Field(..., pattern="^#[0-9A-Fa-f]{6}$")
       secondary: str = Field(..., pattern="^#[0-9A-Fa-f]{6}$")
       accent: str = Field(..., pattern="^#[0-9A-Fa-f]{6}$")
       rationale: str = Field(..., min_length=30, max_length=150)
   ```

2. **Validation 파이프라인** (B팀, 1일)
   - 색상 코드 정규식 체크
   - 레이아웃 타입 Enum 검증
   - Quality: rationale이 "디자인 설명" 같은 기본값 아닌지

3. **Golden Set 5개** (A팀, 1일)
   - 브랜드 타입별 (테크, 럭셔리, 캐주얼 등)

4. **Prompt 작성** (A팀, 1.5일)
   - 디자인 원칙 (hierarchy, contrast, balance)
   - Few-shot 예시 3-5개

**예상 Pass Rate 기준**: 60% (구조 위주라 문장 퀄리티는 덜 엄격)

---

#### Phase 2 타임라인

| 주차 | Agent | 작업 | 담당 | 마감 |
|------|-------|------|------|------|
| Week 1 | Strategist | Schema + Validation + Golden Set | A+B팀 | 금요일 |
| Week 1 | Reviewer | Schema 정의 | A팀 | 수요일 |
| Week 2 | Reviewer | Prompt + Golden Set + Validation | A+B팀 | 금요일 |
| Week 2 | Optimizer | 전체 작업 (재사용 많음) | A+B팀 | 수요일 |
| Week 2 | Designer | Schema + Validation | A+B팀 | 금요일 |
| Week 3 | Designer | Prompt + Golden Set | A팀 | 화요일 |

**총 소요 기간**: 2-3주

---

### Phase 3: P1-P2 (1-2개월) - 디자인/레이아웃 Agent

**대상 Agent**:
- **ImageGeneratorAgent** (DALL-E/Stable Diffusion Prompt)
- **LayoutOptimizer** (Polotno Layout JSON 조정)
- **ContentPlanToPages** (이미 구현, Validation만 추가)

**특징**:
- "문장 퀄리티"보다는 **구조/필드/값 범위** 위주
- Language Validation 비중 낮음 (또는 제외)
- Semantic Similarity 불필요 (SequenceMatcher 또는 Rule-based)

**적용 수준**:
- Schema + Validation (필수)
- Golden Set 5-10개 (권장)
- Prompt Spec (선택, 간소화 버전)

---

### Phase 4: P2 이후 - 내부 시스템/보조 Agent

**대상 Agent**:
- **TrendCollectorAgent** (트렌드 키워드 수집)
- **RAGRetriever** (문서 검색)
- **LoggerAgent** (활동 로그 요약)
- **QASystemAgent** (내부 테스트)

**적용 수준**:
- Schema 일관성 + 에러 처리 중심
- Golden Set "있으면 좋음" (필수 아님)
- Validation은 Schema + 기본 Quality만

---

## 🛠️ 공통 템플릿 & 인프라

### Agent 신규 추가 시 표준 프로세스

모든 새 Agent는 아래 체크리스트를 따름:

#### 1. Schema 정의 (A팀 Lead)
- [ ] `TASK_SCHEMA_CATALOG_V2.md`에 Task 등록
- [ ] Input/Output Pydantic Class 작성
- [ ] 예시 3개 작성

#### 2. Validation 연동 (B팀 Lead)
- [ ] `output_validator.py`에 Schema Class 추가
- [ ] Length Rules 정의
- [ ] Quality Rules 정의 (금지 패턴, 기본값 등)

#### 3. Prompt 작성 (A팀 Lead)
- [ ] 역할 정의
- [ ] 금지 사항 명시
- [ ] Few-shot 예시 3-5개
- [ ] 최종 체크리스트

#### 4. Golden Set 작성 (A팀 Lead)
- [ ] 최소 5개 케이스
- [ ] 다양한 시나리오 커버
- [ ] Expected Output 명시

#### 5. 검증 & 배포 (B팀 Lead)
- [ ] Golden Set Validator 실행
- [ ] Pass Rate ≥ 60% 확인
- [ ] CI 통합
- [ ] Production Ready 마킹

---

## 📊 성공 지표 (KPI)

### Agent별 품질 기준

| Agent 타입 | Min Pass Rate | Min Avg Score | Language Check |
|-----------|---------------|---------------|----------------|
| **Text Generation** (Copywriter, Strategist, Reviewer) | 70% | 7.0/10 | 필수 (30%+) |
| **Text Optimization** (Optimizer) | 65% | 6.5/10 | 필수 (30%+) |
| **Design/Layout** (Designer, Layout) | 60% | 6.5/10 | 선택 |
| **Internal/RAG** (Trend, Retriever) | 50% | 6.0/10 | 제외 |

### 전체 시스템 KPI

| 지표 | 현재 (Q4 2025) | 목표 (Q1 2026) |
|------|----------------|----------------|
| **Agent with Validation** | 1/10 (10%) | 5/10 (50%) |
| **Agent with Golden Set** | 1/10 (10%) | 5/10 (50%) |
| **Average Pass Rate** | 50% (Copywriter만) | 65% (Top 5 평균) |
| **Production Ready Agents** | 0/10 (0%) | 3/10 (30%) |

---

## 🚨 위험 요소 & 대응 방안

### 위험 1: 작업량 과다로 인한 지연

**증상**: Phase 2 Agent 5개를 2주 안에 끝내려다 품질 저하

**대응**:
- Agent별로 1-2일씩 **순차 진행** (병렬 X)
- Golden Set 케이스 수 조정 (10개 → 5개로 축소 가능)
- Prompt는 "Minimum Viable Prompt" 먼저, 개선은 나중에

### 위험 2: Semantic Similarity 모델 비용/속도

**증상**: 모든 Agent에 Semantic Similarity 적용 시 CI 시간 급증

**대응**:
- **Text Generation Agent만** Semantic Similarity 사용
- Design/Layout Agent는 SequenceMatcher 또는 Rule-based로 충분
- CI에서는 "빠른 검증 모드" 제공 (Semantic 모델 Skip)

### 위험 3: Golden Set 유지보수 부담

**증상**: Agent 업데이트 시 Golden Set 모두 깨짐

**대응**:
- Expected Output을 **"정답"이 아닌 "기준선"**으로 인식
- Pass Rate 기준을 **절대 점수(10점)가 아닌 평균(7점)**으로 설정
- 분기별 Golden Set 리뷰 프로세스 도입

---

## 📁 참고 문서

### 기존 문서 (Copywriter 기반)
1. [TASK_SCHEMA_CATALOG_V2.md](TASK_SCHEMA_CATALOG_V2.md) - Task/Schema 정의
2. [COPYWRITER_PROMPT_V3_SPEC.md](COPYWRITER_PROMPT_V3_SPEC.md) - 프롬프트 템플릿
3. [B_TEAM_SEMANTIC_ANALYSIS_2025-11-23.md](B_TEAM_SEMANTIC_ANALYSIS_2025-11-23.md) - 품질 분석 방법론
4. [A_TEAM_TO_B_TEAM_HANDOFF_V3.md](A_TEAM_TO_B_TEAM_HANDOFF_V3.md) - 팀 간 인수인계 프로세스

### 신규 문서 (필요 시 작성)
5. `STRATEGIST_PROMPT_SPEC.md` (Phase 2 시작 시)
6. `REVIEWER_QUALITY_CRITERIA.md` (Phase 2)
7. `AGENT_TEMPLATE.md` (신규 Agent 추가 시 복붙 가능한 템플릿)

---

## 🎬 Next Steps (Immediate Actions)

### 이번 주 (CopywriterAgent 마무리)
1. ✅ B팀: Prompt v3 적용
2. ✅ A팀: Golden Set 재검증 (70% 목표)
3. ✅ 전체: Copywriter Production Ready 마킹

### 다음 주 (Phase 2 시작)
4. ⏳ A팀: StrategistAgent Schema 정의
5. ⏳ A팀: ReviewerAgent Schema 정의
6. ⏳ B팀: Validation 파이프라인 확장 (2개 Agent)

### 2주 후 (Phase 2 본격 진행)
7. ⏳ A팀: Golden Set 작성 (Strategist, Reviewer)
8. ⏳ A팀: Prompt 작성 (Strategist, Reviewer)
9. ⏳ B팀: Golden Set Validator 실행 (2개 Agent)

---

## ✅ 한 줄 요약

> **지금 만든 품질 시스템(Schema + Validation + Golden Set)은
> 장기적으로 "모든 Agent의 기본 틀"이 되어야 하며,
> 사용자 직접 노출 Agent(Top 5)부터 우선순위로 깊게 적용합니다.**

---

**End of Rollout Plan**
