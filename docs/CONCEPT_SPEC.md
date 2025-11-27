# CONCEPT_SPEC.md — Sparklio Concept System v1

**경로**: `docs/CONCEPT_SPEC.md`
**버전**: v1.0
**작성일**: 2025-11-27
**작성 목적**:
Sparklio에서 "컨셉"을 더 이상 `주제 + 톤앤매너` 수준의 얕은 정보가 아니라,
브랜드·캠페인·채널·에이전트 전체가 공유하는 **중심 객체(Concept Object)** 로 정의하기 위한 스펙 문서.

---

## 1. 개요

### 1.1. 컨셉 시스템이 필요한 이유

기존 방식(주제, 톤앤매너만 전달)으로는:

- 쇼츠 / 인스타 광고 / 상세페이지가 **각자 따로 노는 느낌**이 강함
- "컨셉을 하나로 가져가고 싶다"는 유저 요청을 충족하기 어려움
- 컨셉 자체를 버전 관리/실험/재사용하기 어려움

**Sparklio Concept System v1의 목표**:

1. **Concept 객체를 하나의 1급 시민(First-class Object)** 으로 정의
2. 모든 에이전트(Strategist/Copywriter/Designer/Reviewer)가
   **동일한 Concept을 참조**하도록 강제
3. Chat LLM이 유저 입력을 해석할 때,
   **현재 상태(모드/스테이지/프로젝트/컨셉)** 를 반영하도록 명시

---

## 2. 핵심 데이터 모델

### 2.1. ConceptV1 스키마

#### 2.1.1. JSON 스키마(논리 구조)

> 실제 구현 시에는 Pydantic 모델 `ConceptV1` 로 정의하는 것을 권장.

```jsonc
{
  "id": "CONCEPT_789",
  "version": 1,
  "name": "퇴근길 속 편한 단백질 루틴",          // 사람 친화적 컨셉명

  "topic": "단백질 스낵",                       // 제품/서비스 카테고리
  "mode": "launch_campaign",                   // launch_campaign / evergreen / brand_campaign 등

  "audience_insight": "퇴근길에 허기져서 자꾸 편의점 과자를 사게 되는데, 내일 아침이 걱정된다.",
  "core_promise": "배는 차게, 속은 편하게 채워주는 단백질 루틴",
  "brand_role": "나를 챙겨주는 '퇴근 후 루틴' 가이드",

  "reason_to_believe": [
    "당 5g 이하, 단백질 15g 이상",
    "위에 부담을 줄이는 원료 조합"
  ],

  "creative_device": "하루의 '마침표'를 찍는 작은 의식",   // 비유/스토리 장치
  "hook_patterns": [
    "오늘도 무사히 버틴 당신에게",
    "퇴근 후 딱 5분, 내 몸을 위해 쓰자"
  ],

  "visual_world": {
    "color_palette": "밤+네온 (퇴근길 도시 조명)",
    "photo_style": "실내 조명 아래 책상/소파 컷",
    "layout_motifs": ["루틴 체크리스트", "ONE DAY 스토리타임 라벨"],
    "hex_colors": ["#1F2937", "#F59E0B", "#10B981"]
  },

  "channel_strategy": {
    "shorts": "퇴근 → 집 → 간식 → 편안한 표정 15초 내",
    "instagram_news": "하루 루틴을 뉴스처럼 브리핑",
    "product_detail": "루틴 스토리 → 성분/근거 → 후기 순"
  },

  "guardrails": {
    "avoid_claims": ["살 빠진다", "질병 치료 효과"],
    "must_include": ["위에 부담 적음", "퇴근 후 루틴"]
  },

  "target_audience": "20-30 직장인 여성",
  "tone_and_manner": "따뜻하지만 또렷한 톤",
  "keywords": ["퇴근", "루틴", "단백질", "간편식"],

  "meta": {
    "brand_id": "BRAND_456",
    "project_id": "PRJ_123",
    "created_by": "concept_agent",
    "created_at": "2025-11-27T09:00:00+09:00",
    "updated_at": "2025-11-27T09:00:00+09:00",
    "status": "active"                  // draft / active / archived
  }
}
```

#### 2.1.2. 필드 설명 요약

| 필드 | 설명 | 예시 |
|------|------|------|
| **name** | 사람에게 보여줄 컨셉 이름 | "퇴근길 속 편한 단백질 루틴" |
| **topic** | 제품/서비스 카테고리 | "단백질 스낵" |
| **mode** | 캠페인 모드 | launch_campaign / evergreen |
| **audience_insight** | 대상 고객의 심리/상황 인사이트 1줄 | "퇴근길에 허기져서..." |
| **core_promise** | 고객에게 하는 핵심 약속 (Benefit 중심) | "배는 차게, 속은 편하게..." |
| **brand_role** | 브랜드가 고객 삶에서 맡는 역할 | "퇴근 후 루틴 가이드" |
| **reason_to_believe[]** | 약속을 믿게 하는 근거 리스트 | ["당 5g 이하", "위 부담 적음"] |
| **creative_device** | 캠페인 전반을 묶는 비유/장치 | "하루의 마침표를 찍는 의식" |
| **hook_patterns[]** | 반복 사용 가능한 훅 문장 패턴 | ["오늘도 무사히 버틴 당신에게"] |
| **visual_world** | 컬러/사진 스타일/레이아웃 모티프 | { color_palette, photo_style... } |
| **channel_strategy** | 채널별(Shorts/Instagram/Detail) 적용 요약 | { shorts, instagram_news... } |
| **guardrails** | 피해야 할/반드시 포함할 표현 | { avoid_claims, must_include } |
| **target_audience** | 타겟 고객 | "20-30 직장인 여성" |
| **tone_and_manner** | 톤앤매너 | "따뜻하지만 또렷한 톤" |
| **keywords[]** | 연관 키워드 | ["퇴근", "루틴", "단백질"] |
| **meta** | 메타데이터 (brand_id, project_id, status 등) | { brand_id, created_at... } |

---

### 2.2. VisualWorld (비주얼 세계관)

```jsonc
{
  "color_palette": "밤+네온 (퇴근길 도시 조명)",
  "photo_style": "실내 조명 아래 책상/소파 컷",
  "layout_motifs": ["루틴 체크리스트", "ONE DAY 스토리타임 라벨"],
  "hex_colors": ["#1F2937", "#F59E0B", "#10B981"]
}
```

**역할**:
- DesignerAgent가 비주얼 디자인 생성 시 참조
- 색상, 사진 스타일, 레이아웃 모티프를 일관되게 유지

---

### 2.3. ChannelStrategy (채널별 전략)

```jsonc
{
  "shorts": "퇴근 → 집 → 간식 → 편안한 표정 15초 내",
  "instagram_news": "하루 루틴을 뉴스처럼 브리핑",
  "product_detail": "루틴 스토리 → 성분/근거 → 후기 순",
  "presentation": "3페이지 구조 - 인사이트/솔루션/근거"
}
```

**역할**:
- 각 채널에 맞는 콘텐츠 구조/전개 방식 정의
- StrategistAgent가 Outline 생성 시 참조
- CopywriterAgent가 채널별 카피 작성 시 적용

---

### 2.4. Guardrails (가드레일)

```jsonc
{
  "avoid_claims": ["살 빠진다", "질병 치료 효과"],
  "must_include": ["위에 부담 적음", "퇴근 후 루틴"]
}
```

**역할**:
- CopywriterAgent: 카피 작성 시 `avoid_claims` 포함 금지
- ReviewerAgent: `avoid_claims` 발견 시 `needs_revision`, `must_include` 누락 시 감점

---

## 3. ConversationState (대화 상태)

Chat LLM이 **현재 대화가 어디쯤 와 있는지**를 이해하기 위한 상태.

```jsonc
{
  "mode": "concepting",                // discovery / briefing / concepting / asset_making / reviewing
  "stage": "concept_refine_v2",        // concept_new / concept_refine_v2 / asset_batch_v1 등

  "current_project_id": "PRJ_123",
  "current_brand_id": "BRAND_456",
  "active_concept_id": "CONCEPT_789",

  "current_channel_focus": ["shorts", "instagram_news", "product_detail"],

  "last_user_action": "request_new_assets"     // 예: provide_feedback / ask_for_concept / ask_for_revision
}
```

**역할**:
- 같은 문장이라도,
  - `mode = concepting`이면 → "컨셉 생성/수정"
  - `mode = asset_making`이면 → "컨셉 기반 실행물 생성"
    으로 다르게 해석하도록 가이드

---

## 4. ProjectState (Brand / Campaign / Audience)

Concept Builder 및 에이전트 공통 컨텍스트.

```jsonc
{
  "brand_kit": {
    "id": "BRAND_456",
    "name": "작은행복 단백질",
    "tone": "따뜻하지만 또렷한 톤",
    "do_not_use": ["다이어트 보장", "기적", "완벽"],
    "positioning": "바쁜 직장인의 속 편한 단백질 간식"
  },
  "campaign": {
    "id": "CMP_001",
    "name": "10월 퇴근길 루틴 런칭",
    "goal": "10월 내 신규 회원 2,000명",
    "kpi": ["회원가입", "장바구니 추가"],
    "phase": "pre_launch"         // teaser / launch / evergreen 등
  },
  "audience": {
    "primary": "20-30 직장인 여성",
    "insights": [
      "아침을 제대로 못 챙김",
      "당 떨어지면 막과자 대신 '덜 죄책감 드는 것'을 찾음"
    ]
  }
}
```

---

## 5. UIContext (UI 컨텍스트)

같은 발화를 **어떤 화면에서 했는지**에 따라 의미를 달리 해석하기 위한 컨텍스트.

```jsonc
{
  "location": "canvas_studio",         // chat_only / canvas_studio / meeting_ai / deck_studio 등
  "selected_artboards": ["AD_001", "AD_002"],
  "selection_type": "campaign_set",    // single_asset / campaign_set / brand_global 등
  "viewport_info": {
    "channel_hint": ["instagram_news"],
    "size": "1080x1350"
  }
}
```

**예시**:
- `location = chat_only` → 새 캠페인/컨셉 수준의 요청 가능성이 높음
- `location = canvas_studio` + `selection_type = campaign_set` →
  "현재 세트에 대한 로컬 컨셉 수정"일 가능성이 높음

---

## 6. LLM & 에이전트 플로우

### 6.1. 구성 요소

1. **Chat Orchestrator LLM**
   - 유저 발화를 받고
   - ConversationState / ProjectState / UIContext / ConceptV1 여부를 확인한 뒤
   - 이번 턴에서 무엇을 할지 결정

2. **Concept Builder LLM (ConceptAgent)**
   - ConceptV1 객체를 생성/업데이트

3. **에이전트 레이어**
   - StrategistAgent
   - CopywriterAgent
   - DesignerAgent
   - ReviewerAgent

   모두 ConceptV1을 공통 입력으로 사용

---

### 6.2. 상위 시퀀스 다이어그램

```
사용자 입력
    ↓
Chat UI
    ↓
Chat Orchestrator LLM
    ↓ (컨셉 생성 필요?)
Concept Builder LLM (ConceptAgent)
    ↓ ConceptV1 생성
StrategistAgent (ConceptV1 참조)
    ↓
CopywriterAgent (ConceptV1 + Strategy)
    ↓
DesignerAgent (ConceptV1 + Copy)
    ↓
ReviewerAgent (ConceptV1 + 결과물)
    ↓
최종 산출물 + 리뷰 결과
```

---

### 6.3. Orchestrator → Concept Builder 호출 규칙 (의사코드)

```python
def handle_user_message(user_message, conversation_state, project_state, ui_context):
    """
    Chat Orchestrator LLM 앞/뒤에서 동작하는 파이썬 레벨 의사코드
    """

    # 1) LLM에게 '이번 턴의 목적' 먼저 판단하게 함
    intent = llm_classify_intent(
        message=user_message,
        conversation_state=conversation_state,
        project_state=project_state,
        ui_context=ui_context,
    )

    # intent 예시:
    # {
    #   "action": "create_assets",
    #   "needs_new_concept": true,
    #   "requested_assets": ["shorts_script", "instagram_news_ad", "product_detail"]
    # }

    concept = None

    # 2) 컨셉 생성/업데이트 필요 여부 판단
    if intent["needs_new_concept"]:
        concept = concept_builder_generate(
            user_message=user_message,
            project_state=project_state,
            previous_concepts=get_recent_concepts(project_state),
        )
        save_concept(concept)
        conversation_state.active_concept_id = concept.id

    elif conversation_state.active_concept_id:
        concept = load_concept(conversation_state.active_concept_id)

        if intent["action"] == "refine_concept":
            concept = concept_builder_refine(
                concept=concept,
                user_feedback=user_message,
            )
            save_concept(concept)

    # 3) 이후 에이전트 플로우는 concept을 공통 입력으로 활용
    if intent["action"] == "create_assets":
        outputs = run_agent_flow_for_assets(concept, intent["requested_assets"])
        return outputs, concept
```

---

## 7. 에이전트별 Concept 사용 규칙

### 7.1. StrategistAgent

**입력**:
- `ConceptV1`
- `requested_assets` (예: shorts, instagram_news, product_detail)

**출력**:
- 각 산출물별 Outline + Section 전략

**규칙**:
- `audience_insight`, `core_promise`, `channel_strategy`를 반드시 참고
- `creative_device`를 최소 1곳 이상에서 활용하는 섹션 구성
- `reason_to_believe`가 들어갈 섹션을 명시적으로 배치

---

### 7.2. CopywriterAgent

**입력**:
- `ConceptV1`
- StrategistAgent가 만든 Outline

**출력**:
- 섹션별 카피 / 축약본 / 해시태그 등

**규칙**:
- `hook_patterns`를 헤드라인/오프닝 후보로 우선 사용
- `creative_device`가 문장/표현에 드러나도록 프롬프트에서 강조
- `guardrails.avoid_claims` 포함 표현은 사용 금지
- `guardrails.must_include`는 적어도 한 번 이상 자연스럽게 포함

---

### 7.3. DesignerAgent

**입력**:
- `ConceptV1`
- 전략/카피 결과

**출력**:
- Canvas JSON / 레이아웃 메타 (Konva/Polotno 등)

**규칙**:
- `visual_world.color_palette` / `photo_style` / `layout_motifs`를 바탕으로 디자인 가이드 생성
- `channel_strategy`를 반영하여 채널별 규격/구조 차별화
- 가능한 경우, `creative_device`를 UI 모티프로 반영
  - 예: 루틴 → 체크리스트 / 하루 흐름 타임라인 등

---

### 7.4. ReviewerAgent

**입력**:
- `ConceptV1`
- Copy + Layout

**출력**:
- 5점수 (overall, tone_match, clarity, persuasiveness, brand_alignment)
- approval_status (approved / needs_revision / rejected)
- 수정 제안

**규칙**:
- `guardrails.avoid_claims` → 등장 시 `needs_revision` 또는 `rejected`
- `guardrails.must_include` → 누락 시 `needs_revision`
- 컨셉과의 정렬 여부를 점수화:
  - `brand_alignment`: ConceptV1의 tone / brand_role과의 일치 정도
  - `persuasiveness`: core_promise + reason_to_believe가 잘 서술되었는지

---

## 8. UI/제품 레벨 적용 가이드

### 8.1. 컨셉 관리 화면 (향후)

- `/studio/concepts` (예시)
  - 프로젝트/브랜드별 컨셉 리스트
  - 각 컨셉 카드에:
    - name
    - 핵심 훅 1–2개
    - 연결된 실행물 개수 (Ads, Shorts, PDP 등)

- 컨셉 상세 화면:
  - `ConceptV1` 전체 필드 표시
  - "이 컨셉으로 만든 자산 모아보기"

---

### 8.2. Chat UI 레벨 노출

**컨셉이 새로 생성되었을 때**:
- "이번 캠페인을 이렇게 이해했어요." 형태의 요약 문단
- 핵심 필드 표시:
  - 고객 인사이트
  - 핵심 약속
  - 브랜드 역할

**유저가 "컨셉 바꾸자"라고 말하면**:
- 기존 `ConceptV1`과 비교한 변화 포인트를 짧게 설명
  - 예: "이전에는 '퇴근 후 루틴' → 지금은 '아침 리셋' 컨셉입니다."

---

## 9. 버전 관리 및 확장 계획

### 9.1. 버전 필드

- `ConceptV1.version: int`
- 변경 유형:
  - `minor`: hook_patterns만 교체, visual_world 조정 등
  - `major`: audience_insight / core_promise 변경 등

### 9.2. 향후 확장 후보

**A/B 테스트 지원**:
```jsonc
{
  "ab_test_info": {
    "variant": "A",
    "paired_concept_id": "CONCEPT_790"
  }
}
```

**성과 데이터 집계**:
```jsonc
{
  "performance_metrics": {
    "ctr": 3.2,
    "cvr": 1.8,
    "engagement_rate": 5.4
  }
}
```

**다국어 지원**:
```jsonc
{
  "localization": {
    "ko": { "name": "퇴근길 속 편한 단백질 루틴", ... },
    "en": { "name": "Protein Routine After Work", ... }
  }
}
```

---

## 10. 요약

### Sparklio의 "컨셉"은

단순한 **주제+톤앤매너**가 아니라,

**Audience Insight → Promise → Evidence → Creative Device
→ Visual World → Channel Strategy → Guardrails**

까지를 한 번에 담는 **중심 객체(ConceptV1)** 로 정의한다.

### Chat Orchestrator LLM은

매 턴마다 ConversationState / ProjectState / UIContext를 참고하여
**컨셉 생성/수정이 필요한지**, 혹은 **컨셉 기반 자산 생성 단계인지**를 구분한다.

### Strategist/Copywriter/Designer/Reviewer 에이전트는

모두 ConceptV1을 공통 입력으로 사용함으로써,
쇼츠/인스타/상세페이지/프레젠테이션이 **하나의 세계관** 아래서 만들어지도록 한다.

---

**이 문서는 Sparklio 리포지토리의 컨셉 시스템 기준 문서로 사용한다.**

---

**작성일**: 2025-11-27 (목요일)
**작성자**: C팀 (Frontend)
**버전**: v1.0
**참조**: [CONCEPT_AGENT_V2_UPGRADE_PLAN.md](./CONCEPT_AGENT_V2_UPGRADE_PLAN.md)
