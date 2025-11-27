# ConceptAgent v2.0 업그레이드 계획

**작성일**: 2025-11-27 (목요일)
**작성팀**: C팀 (Frontend) + B팀 협조 필요
**참조 문서**:
- [CONCEPT_SPEC.md](../CONCEPT_SPEC.md) - 새 컨셉 시스템 스펙
- [concept.py](../backend/app/services/agents/concept.py) - 현재 ConceptAgent v1.0

---

## 📊 현재 vs 목표 비교

### 현재 ConceptAgent v1.0 (기본형)

```python
class ConceptOutput(BaseModel):
    concept_name: str              # ✅
    concept_description: str       # ✅
    target_audience: str           # ✅
    key_message: str               # ✅
    tone_and_manner: str           # ✅
    visual_style: str              # ✅
    color_palette: List[str]       # ✅
    keywords: List[str]            # ✅
```

**강점**:
- ✅ 기본적인 마케팅 컨셉 요소 포함
- ✅ 타겟, 메시지, 톤, 비주얼, 색상 제공
- ✅ Gemini 2.0 Flash 사용 (빠름)

**한계**:
- ❌ **전략적 깊이 부족** - "왜 이 컨셉인가?" 근거 약함
- ❌ **채널 전략 없음** - Shorts/Instagram/Detail 각각 어떻게 적용할지 모름
- ❌ **가드레일 없음** - 피해야 할 표현/반드시 포함할 메시지 누락
- ❌ **크리에이티브 장치 없음** - 캠페인을 묶는 비유/스토리 장치 부재
- ❌ **근거 부족** - Reason to Believe (RTB) 없음

---

### 목표 ConceptV1 (CONCEPT_SPEC.md 기준)

```python
class ConceptV1(BaseModel):
    # 기본 정보
    id: str
    version: int
    name: str                          # concept_name과 동일
    topic: str                         # 🆕 제품/서비스 카테고리
    mode: str                          # 🆕 launch_campaign / evergreen 등

    # 전략 핵심 (🆕 추가 필요)
    audience_insight: str              # 🆕 고객의 심리/상황 인사이트
    core_promise: str                  # key_message와 유사하지만 더 구체적
    brand_role: str                    # 🆕 브랜드가 고객 삶에서 맡는 역할

    # 근거 (🆕 추가 필요)
    reason_to_believe: List[str]       # 🆕 약속을 믿게 하는 근거

    # 크리에이티브 (🆕 추가 필요)
    creative_device: str               # 🆕 캠페인 전반을 묶는 비유/장치
    hook_patterns: List[str]           # 🆕 반복 사용 가능한 훅 문장

    # 비주얼 (기존 + 확장)
    visual_world: VisualWorld          # visual_style + color_palette + 레이아웃 모티프

    # 채널 전략 (🆕 추가 필요)
    channel_strategy: ChannelStrategy  # 🆕 채널별 적용 요약

    # 가드레일 (🆕 추가 필요)
    guardrails: Guardrails             # 🆕 피해야 할/반드시 포함할 표현

    # 기존 필드
    target_audience: str               # ✅ 유지
    tone_and_manner: str               # ✅ 유지
    keywords: List[str]                # ✅ 유지

    # 메타데이터 (🆕)
    meta: ConceptMeta                  # 🆕 brand_id, project_id, status 등
```

---

## 🎯 업그레이드 계획

### Phase 1: 핵심 필드 추가 (P0 - 즉시 적용)

**목표**: CONCEPT_SPEC.md의 핵심 전략 필드를 ConceptAgent에 추가

#### 1.1. 새 스키마 정의

**파일**: `backend/app/services/agents/concept.py`

```python
# =============================================================================
# ConceptV1 Schema (CONCEPT_SPEC.md 기준)
# =============================================================================

class VisualWorld(BaseModel):
    """비주얼 세계관"""
    color_palette: str = Field(..., description="색상 설명 (예: 밤+네온)")
    photo_style: str = Field(..., description="사진 스타일")
    layout_motifs: List[str] = Field(default_factory=list, description="레이아웃 모티프")
    hex_colors: List[str] = Field(default_factory=list, description="HEX 코드 3-5개")


class ChannelStrategy(BaseModel):
    """채널별 전략"""
    shorts: Optional[str] = Field(None, description="Shorts 적용 전략 (15-60초)")
    instagram_news: Optional[str] = Field(None, description="Instagram 뉴스 광고 전략")
    product_detail: Optional[str] = Field(None, description="상품 상세 페이지 전략")
    presentation: Optional[str] = Field(None, description="프레젠테이션 전략")


class Guardrails(BaseModel):
    """가드레일 (필수 준수 사항)"""
    avoid_claims: List[str] = Field(default_factory=list, description="피해야 할 표현")
    must_include: List[str] = Field(default_factory=list, description="반드시 포함할 메시지")


class ConceptMeta(BaseModel):
    """메타데이터"""
    brand_id: Optional[str] = None
    project_id: Optional[str] = None
    created_by: str = "concept_agent"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    status: str = "active"  # draft / active / archived


class ConceptV1(BaseModel):
    """
    ConceptV1 - CONCEPT_SPEC.md 기준 완전 구현

    Sparklio의 "컨셉"은 단순한 주제+톤이 아니라,
    Audience Insight → Promise → Evidence → Creative Device
    → Visual World → Channel Strategy → Guardrails
    까지를 포함하는 중심 객체
    """
    # 기본 정보
    id: str = Field(default_factory=lambda: f"CONCEPT_{uuid.uuid4().hex[:8]}")
    version: int = Field(default=1)
    name: str = Field(..., description="컨셉 이름 (5-15자)")
    topic: str = Field(..., description="제품/서비스 카테고리")
    mode: str = Field(default="launch_campaign", description="캠페인 모드")

    # 전략 핵심 (🆕)
    audience_insight: str = Field(..., description="고객의 심리/상황 인사이트 1줄")
    core_promise: str = Field(..., description="고객에게 하는 핵심 약속")
    brand_role: str = Field(..., description="브랜드가 고객 삶에서 맡는 역할")

    # 근거 (🆕)
    reason_to_believe: List[str] = Field(
        default_factory=list,
        description="약속을 믿게 하는 근거 (스펙/데이터/증거)"
    )

    # 크리에이티브 (🆕)
    creative_device: str = Field(..., description="캠페인을 묶는 비유/스토리 장치")
    hook_patterns: List[str] = Field(
        default_factory=list,
        description="헤드라인/오프닝에서 반복 사용할 훅 문장 패턴"
    )

    # 비주얼
    visual_world: VisualWorld = Field(..., description="비주얼 세계관")

    # 채널 전략 (🆕)
    channel_strategy: ChannelStrategy = Field(..., description="채널별 적용 전략")

    # 가드레일 (🆕)
    guardrails: Guardrails = Field(default_factory=Guardrails, description="필수 준수사항")

    # 기존 호환 필드
    target_audience: str = Field(..., description="타겟 고객")
    tone_and_manner: str = Field(..., description="톤앤매너")
    keywords: List[str] = Field(default_factory=list, description="연관 키워드")

    # 메타데이터
    meta: ConceptMeta = Field(default_factory=ConceptMeta)


class ConceptV1Output(BaseModel):
    """ConceptAgent v2.0 출력"""
    concepts: List[ConceptV1] = Field(..., description="생성된 컨셉 목록 (ConceptV1)")
    reasoning: str = Field(..., description="컨셉 도출 근거")
```

#### 1.2. 프롬프트 업그레이드

**현재 프롬프트 (v1.0)**:
```
당신은 마케팅 전문가입니다. 아래 정보를 바탕으로 3개의 마케팅 컨셉을 생성하세요.

## 요구사항
1. 각 컨셉은 서로 다른 접근 방식을 가져야 합니다
2. 타겟 고객이 공감할 수 있는 핵심 메시지를 만드세요
3. 비주얼 스타일은 구체적으로 설명하세요
4. 색상 팔레트는 HEX 코드 3-5개를 제안하세요
```

**새 프롬프트 (v2.0)**:
```python
def _build_prompt_v2(self, input_data: ConceptInput) -> str:
    """
    ConceptV1 생성을 위한 고도화된 프롬프트

    CONCEPT_SPEC.md 기준:
    - Audience Insight 도출
    - Core Promise (핵심 약속)
    - Reason to Believe (근거)
    - Creative Device (비유/장치)
    - Hook Patterns (반복 사용 훅)
    - Channel Strategy (채널별 전략)
    - Guardrails (가드레일)
    """

    prompt = f"""당신은 Sparklio AI의 수석 전략가입니다.
아래 정보를 바탕으로 {input_data.concept_count}개의 **전략적 마케팅 컨셉(ConceptV1)** 을 생성하세요.

{meeting_text}
{brief_text}
{brand_text}

---

## ConceptV1 생성 가이드

각 컨셉은 다음 구조를 **반드시** 포함해야 합니다:

### 1. 전략 핵심
- **audience_insight**: 고객의 심리/상황 인사이트 1줄
  - 예: "퇴근길에 허기져서 자꾸 편의점 과자를 사게 되는데, 내일 아침이 걱정된다."

- **core_promise**: 고객에게 하는 핵심 약속 (Benefit 중심)
  - 예: "배는 차게, 속은 편하게 채워주는 단백질 루틴"

- **brand_role**: 이 브랜드가 고객 삶에서 맡는 역할
  - 예: "나를 챙겨주는 '퇴근 후 루틴' 가이드"

### 2. 근거
- **reason_to_believe**: 약속을 믿게 하는 근거 2-4개
  - 예: ["당 5g 이하, 단백질 15g 이상", "위에 부담을 줄이는 원료 조합"]

### 3. 크리에이티브
- **creative_device**: 캠페인 전반을 묶는 비유/스토리 장치
  - 예: "하루의 '마침표'를 찍는 작은 의식"

- **hook_patterns**: 헤드라인/오프닝에서 반복 사용할 훅 문장 2-3개
  - 예: ["오늘도 무사히 버틴 당신에게", "퇴근 후 딱 5분, 내 몸을 위해 쓰자"]

### 4. 비주얼 세계관
- **visual_world**:
  - color_palette: 색상 설명 (예: "밤+네온 (퇴근길 도시 조명)")
  - photo_style: 사진 스타일 (예: "실내 조명 아래 책상/소파 컷")
  - layout_motifs: 레이아웃 모티프 리스트 (예: ["루틴 체크리스트", "ONE DAY 타임라인"])
  - hex_colors: HEX 코드 3-5개 (예: ["#1F2937", "#F59E0B", "#10B981"])

### 5. 채널 전략
- **channel_strategy**: 채널별 적용 요약
  - shorts: Shorts 전략 (15-60초)
  - instagram_news: Instagram 뉴스 광고 전략
  - product_detail: 상품 상세 페이지 전략

### 6. 가드레일
- **guardrails**:
  - avoid_claims: 피해야 할 표현 리스트 (예: ["살 빠진다", "질병 치료"])
  - must_include: 반드시 포함할 메시지 리스트 (예: ["위에 부담 적음"])

---

## 요구사항

1. **전략적 다양성**: 각 컨셉은 서로 다른 접근 방식을 가져야 합니다
   - 컨셉 1: 감성적 / 라이프스타일 강조
   - 컨셉 2: 이성적 / 효과/근거 강조
   - 컨셉 3: 혁신적 / 차별화 강조

2. **깊이**: 단순히 "주제 + 톤"이 아니라, 고객 인사이트부터 채널 전략까지 완결된 컨셉

3. **실행 가능성**: channel_strategy는 실제로 Shorts/Instagram/Detail에 바로 적용 가능해야 함

4. **일관성**: 같은 컨셉 내에서 audience_insight → promise → creative_device → hook_patterns가 자연스럽게 연결되어야 함

---

## 출력 형식 (JSON)

{{
  "concepts": [
    {{
      "name": "컨셉명 (5-15자)",
      "topic": "제품/서비스 카테고리",
      "mode": "launch_campaign",

      "audience_insight": "고객 심리/상황 인사이트 1줄",
      "core_promise": "핵심 약속",
      "brand_role": "브랜드 역할",

      "reason_to_believe": ["근거1", "근거2", "근거3"],

      "creative_device": "비유/스토리 장치",
      "hook_patterns": ["훅1", "훅2", "훅3"],

      "visual_world": {{
        "color_palette": "색상 설명",
        "photo_style": "사진 스타일",
        "layout_motifs": ["모티프1", "모티프2"],
        "hex_colors": ["#HEX1", "#HEX2", "#HEX3"]
      }},

      "channel_strategy": {{
        "shorts": "Shorts 전략",
        "instagram_news": "Instagram 전략",
        "product_detail": "상세 페이지 전략"
      }},

      "guardrails": {{
        "avoid_claims": ["피할 표현1", "피할 표현2"],
        "must_include": ["필수 메시지1", "필수 메시지2"]
      }},

      "target_audience": "타겟 고객",
      "tone_and_manner": "톤앤매너",
      "keywords": ["키워드1", "키워드2", "키워드3"]
    }}
  ],
  "reasoning": "컨셉 도출 근거 설명"
}}

{input_data.concept_count}개의 컨셉을 생성하세요. 한국어로 작성하세요.
"""
    return prompt
```

#### 1.3. 파싱 로직 업그레이드

```python
def _parse_output_v2(self, llm_output: Any, expected_count: int) -> ConceptV1Output:
    """
    ConceptV1 파싱

    LLM이 반환한 JSON을 ConceptV1 스키마로 변환
    """
    # 기존 파싱 로직과 유사하지만 ConceptV1로 변환

    if isinstance(llm_output, dict):
        data = llm_output
    elif isinstance(llm_output, str):
        try:
            data = json.loads(llm_output)
        except json.JSONDecodeError:
            import re
            json_match = re.search(r'\{[\s\S]*\}', llm_output)
            if json_match:
                data = json.loads(json_match.group())
            else:
                raise ValueError("Cannot parse LLM output as JSON")
    else:
        raise ValueError(f"Unexpected output type: {type(llm_output)}")

    if "concepts" not in data:
        raise ValueError("Missing 'concepts' field in output")

    concepts = []
    for i, concept_data in enumerate(data["concepts"]):
        try:
            # ConceptV1로 파싱
            concept = ConceptV1(
                name=concept_data.get("name", f"컨셉 {i+1}"),
                topic=concept_data.get("topic", ""),
                mode=concept_data.get("mode", "launch_campaign"),

                # 전략 핵심
                audience_insight=concept_data.get("audience_insight", ""),
                core_promise=concept_data.get("core_promise", ""),
                brand_role=concept_data.get("brand_role", ""),

                # 근거
                reason_to_believe=concept_data.get("reason_to_believe", []),

                # 크리에이티브
                creative_device=concept_data.get("creative_device", ""),
                hook_patterns=concept_data.get("hook_patterns", []),

                # 비주얼
                visual_world=VisualWorld(**concept_data.get("visual_world", {})),

                # 채널 전략
                channel_strategy=ChannelStrategy(**concept_data.get("channel_strategy", {})),

                # 가드레일
                guardrails=Guardrails(**concept_data.get("guardrails", {})),

                # 기존 필드
                target_audience=concept_data.get("target_audience", ""),
                tone_and_manner=concept_data.get("tone_and_manner", ""),
                keywords=concept_data.get("keywords", []),
            )
            concepts.append(concept)
        except Exception as e:
            logger.warning(f"Failed to parse concept {i}: {e}")
            continue

    if len(concepts) == 0:
        raise ValueError("No valid concepts parsed")

    return ConceptV1Output(
        concepts=concepts,
        reasoning=data.get("reasoning", "")
    )
```

---

### Phase 2: DB 모델 업데이트 (P1 - 다음 단계)

**파일**: `backend/app/models/campaign.py` (또는 새로 `concept.py` 생성)

```python
from sqlalchemy import Column, String, Integer, Text, JSONB, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

class Concept(Base):
    """
    Concept 테이블

    ConceptV1 스키마를 DB에 저장
    """
    __tablename__ = "concepts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version = Column(Integer, default=1)
    name = Column(String(50), nullable=False)
    topic = Column(String(100))
    mode = Column(String(50), default="launch_campaign")

    # JSON 필드로 저장 (유연성)
    concept_data = Column(JSONB, nullable=False)  # ConceptV1 전체를 JSON으로

    # 메타데이터
    brand_id = Column(UUID(as_uuid=True), nullable=True)
    project_id = Column(UUID(as_uuid=True), nullable=True)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(String(20), default="active")  # draft / active / archived

    # 인덱스
    __table_args__ = (
        Index('idx_concept_brand', 'brand_id'),
        Index('idx_concept_project', 'project_id'),
        Index('idx_concept_status', 'status'),
    )
```

---

### Phase 3: Frontend 연동 (P1 - C팀 작업)

**파일**: `frontend/types/concept.ts`

```typescript
/**
 * ConceptV1 타입 정의 (CONCEPT_SPEC.md 기준)
 */

export interface VisualWorld {
  color_palette: string;
  photo_style: string;
  layout_motifs: string[];
  hex_colors: string[];
}

export interface ChannelStrategy {
  shorts?: string;
  instagram_news?: string;
  product_detail?: string;
  presentation?: string;
}

export interface Guardrails {
  avoid_claims: string[];
  must_include: string[];
}

export interface ConceptMeta {
  brand_id?: string;
  project_id?: string;
  created_by: string;
  created_at: string;
  status: 'draft' | 'active' | 'archived';
}

export interface ConceptV1 {
  // 기본
  id: string;
  version: number;
  name: string;
  topic: string;
  mode: string;

  // 전략 핵심
  audience_insight: string;
  core_promise: string;
  brand_role: string;

  // 근거
  reason_to_believe: string[];

  // 크리에이티브
  creative_device: string;
  hook_patterns: string[];

  // 비주얼
  visual_world: VisualWorld;

  // 채널 전략
  channel_strategy: ChannelStrategy;

  // 가드레일
  guardrails: Guardrails;

  // 기존
  target_audience: string;
  tone_and_manner: string;
  keywords: string[];

  // 메타
  meta: ConceptMeta;
}

export interface ConceptV1Response {
  concepts: ConceptV1[];
  reasoning: string;
}
```

**파일**: `frontend/components/canvas-studio/views/ConceptBoardView.tsx` 업데이트

```typescript
// ConceptV1 카드에 추가 표시
<div className="concept-card-extended">
  {/* 기존 필드 */}
  <h3>{concept.name}</h3>
  <p>{concept.core_promise}</p>

  {/* 🆕 새 필드 표시 */}
  <div className="audience-insight">
    <strong>고객 인사이트:</strong>
    <p>"{concept.audience_insight}"</p>
  </div>

  <div className="brand-role">
    <strong>브랜드 역할:</strong>
    <span>{concept.brand_role}</span>
  </div>

  <div className="reason-to-believe">
    <strong>믿을 수 있는 이유:</strong>
    <ul>
      {concept.reason_to_believe.map((rtb, i) => (
        <li key={i}>{rtb}</li>
      ))}
    </ul>
  </div>

  <div className="creative-device">
    <strong>크리에이티브 장치:</strong>
    <p>{concept.creative_device}</p>
  </div>

  <div className="hook-patterns">
    <strong>훅 패턴:</strong>
    {concept.hook_patterns.map((hook, i) => (
      <span key={i} className="hook-badge">"{hook}"</span>
    ))}
  </div>

  {/* 채널 전략 */}
  <div className="channel-strategy">
    <h4>채널별 전략</h4>
    {concept.channel_strategy.shorts && (
      <div><strong>Shorts:</strong> {concept.channel_strategy.shorts}</div>
    )}
    {concept.channel_strategy.instagram_news && (
      <div><strong>Instagram:</strong> {concept.channel_strategy.instagram_news}</div>
    )}
    {concept.channel_strategy.product_detail && (
      <div><strong>상세페이지:</strong> {concept.channel_strategy.product_detail}</div>
    )}
  </div>

  {/* 가드레일 */}
  {concept.guardrails.avoid_claims.length > 0 && (
    <div className="guardrails-avoid">
      <strong>❌ 피해야 할 표현:</strong>
      {concept.guardrails.avoid_claims.map((claim, i) => (
        <span key={i} className="avoid-badge">{claim}</span>
      ))}
    </div>
  )}

  {concept.guardrails.must_include.length > 0 && (
    <div className="guardrails-must">
      <strong>✅ 반드시 포함:</strong>
      {concept.guardrails.must_include.map((msg, i) => (
        <span key={i} className="must-badge">{msg}</span>
      ))}
    </div>
  )}
</div>
```

---

## 📋 작업 체크리스트

### B팀 작업 (Backend)

**Phase 1: 핵심 스키마 & 프롬프트 (P0)**
- [ ] `ConceptV1`, `VisualWorld`, `ChannelStrategy`, `Guardrails` 스키마 정의
- [ ] `_build_prompt_v2()` 프롬프트 업그레이드
- [ ] `_parse_output_v2()` 파싱 로직 업그레이드
- [ ] `POST /api/v1/concepts/from-prompt` 엔드포인트 수정 (ConceptV1 반환)
- [ ] 기존 Demo Day 파이프라인과 호환성 확인
- [ ] Mac mini 배포 및 테스트

**Phase 2: DB 모델 (P1)**
- [ ] `Concept` 테이블 생성 (Alembic migration)
- [ ] ConceptV1 CRUD API 추가 (`GET/POST/PATCH /api/v1/concepts/{id}`)
- [ ] 프로젝트/브랜드와 연결

### C팀 작업 (Frontend)

**Phase 1: 타입 & UI (P0)**
- [ ] `types/concept.ts`에 ConceptV1 타입 정의
- [ ] `useConceptGenerate()` hook 업데이트 (ConceptV1 반환)
- [ ] ConceptBoardView 카드 UI 확장 (새 필드 표시)
- [ ] Guardrails 시각화 (피할/필수 표현 배지)

**Phase 2: 에디터 연동 (P1)**
- [ ] ConceptV1 → CopywriterAgent 연동 확인
- [ ] Hook Patterns를 ChatPanel에서 제안
- [ ] Channel Strategy를 Asset 생성 시 활용

---

## ⏰ 예상 작업 시간

| Phase | 팀 | 작업 | 시간 |
|-------|----|----- |------|
| **Phase 1** | B팀 | 스키마 + 프롬프트 + 엔드포인트 | 3-4시간 |
| **Phase 1** | C팀 | 타입 + UI 확장 | 2-3시간 |
| **Phase 2** | B팀 | DB 모델 + CRUD API | 2-3시간 |
| **Phase 2** | C팀 | 에디터 연동 | 2시간 |
| **총계** | | | **9-12시간** |

---

## 🎯 기대 효과

### Before (ConceptAgent v1.0)
```
컨셉 1: "시간 절약 강조"
- 타겟: 중소기업 마케터
- 메시지: "하루 3시간, AI가 대신합니다"
- 톤: 효율성, 신뢰감
- 비주얼: 모던 오피스
- 색상: #4F46E5, #10B981

❌ "왜 이 컨셉인가?" 근거 약함
❌ 채널별로 어떻게 적용할지 모름
❌ 피해야 할/필수 표현 없음
```

### After (ConceptAgent v2.0 - ConceptV1)
```
컨셉 1: "퇴근길 속 편한 단백질 루틴"

✅ 고객 인사이트: "퇴근길에 허기져서 자꾸 편의점 과자를 사게 되는데..."
✅ 핵심 약속: "배는 차게, 속은 편하게 채워주는 단백질 루틴"
✅ 브랜드 역할: "나를 챙겨주는 '퇴근 후 루틴' 가이드"

✅ 근거:
   - 당 5g 이하, 단백질 15g 이상
   - 위에 부담을 줄이는 원료 조합

✅ 크리에이티브 장치: "하루의 '마침표'를 찍는 작은 의식"

✅ 훅 패턴:
   - "오늘도 무사히 버틴 당신에게"
   - "퇴근 후 딱 5분, 내 몸을 위해 쓰자"

✅ 채널 전략:
   - Shorts: 퇴근 → 집 → 간식 → 편안한 표정 15초 내
   - Instagram: 하루 루틴을 뉴스처럼 브리핑
   - 상세페이지: 루틴 스토리 → 성분/근거 → 후기 순

✅ 가드레일:
   - 피할 표현: ["살 빠진다", "질병 치료"]
   - 필수 메시지: ["위에 부담 적음", "퇴근 후 루틴"]
```

---

## 📞 연락처

**작성자**: C팀 Claude
**협조 요청**: B팀 (Backend Agent 고도화)
**우선순위**: P0 (긴급)
**참조 문서**:
- [CONCEPT_SPEC.md](../CONCEPT_SPEC.md)
- [C_TEAM_CONCEPT_QUALITY_ANALYSIS_2025-11-27.md](./C_TEAM_CONCEPT_QUALITY_ANALYSIS_2025-11-27.md)

---

**작성 완료**: 2025-11-27 (목요일)
**다음 단계**: B팀 검토 및 Phase 1 착수
