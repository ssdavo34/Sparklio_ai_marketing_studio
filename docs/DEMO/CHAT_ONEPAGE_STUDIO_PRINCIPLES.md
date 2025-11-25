# Chat 기반 원페이지 스튜디오 원칙

**문서 버전**: v1.0
**작성일**: 2025-11-25
**작성자**: A팀 (백엔드/문서 총괄)
**목적**: Sparklio Demo V1의 "챗 기반 원페이지 스튜디오" UX 원칙 정의

**상위 문서**: [SPARKLIO_DEMO_V1_PRD.md](./SPARKLIO_DEMO_V1_PRD.md)
**구현 상세**: [FRONTEND_DEMO_FLOW.md](./FRONTEND_DEMO_FLOW.md), [BACKEND_DEMO_APIS.md](./BACKEND_DEMO_APIS.md), [AGENTS_DEMO_SPEC.md](./AGENTS_DEMO_SPEC.md)

---

## 1. 목적

이 문서는 Sparklio AI Marketing Studio 데모 V1에서
**"챗 기반 원페이지 스튜디오"** UX를 일관되게 구현하기 위한 공통 원칙을 정의합니다.

### 1.1 왜 이 원칙이 필요한가?

1. 데모 V1의 모든 UX/플로우가 **단일 화면(one-page)** 과 **챗 기반 오케스트레이션**이라는 철학 위에서 움직이도록 합니다.
2. 프론트엔드/백엔드/에이전트/QA가 같은 기준으로
   - 레이아웃
   - 상태 전이
   - 챗 메시지 ↔ 시스템 행동

   을 이해하게 합니다.
3. 이후 실서비스 확장 시에도 그대로 재사용 가능한 "원칙 레퍼런스" 역할을 합니다.

---

## 2. 핵심 철학: "모든 것은 하나의 화면 안에서"

### 2.1 원페이지 스튜디오 (One-Page Studio)

**정의**:
> 사용자의 모든 작업이 **하나의 라우트** (`/studio/demo`) 안에서 완결되어야 한다.

**원칙**:
- ❌ 페이지 전환 (예: `/meeting` → `/campaign` → `/concept-board`) 금지
- ✅ 중앙 뷰 전환으로 해결 (예: Meeting Summary → Concept Board → Slides Preview)
- ✅ 좌/중/우 패널 구조는 항상 유지

**장점**:
- 사용자가 컨텍스트를 잃지 않음
- Chat 히스토리가 계속 유지됨
- 발표 시 화면 전환이 자연스러움
- 로딩 시간 최소화

---

## 3. 레이아웃 원칙

### 3.1 기본 구조

**라우트**: `/studio/demo` (또는 `/studio`의 데모 모드)

**레이아웃**:
```
┌─────────────────────────────────────────────────────────┐
│  좌측 패널 (20%)  │   중앙 영역 (50-60%)   │  우측 패널 (20-30%)  │
├──────────────────┼────────────────────────┼─────────────────────┤
│                  │                        │                     │
│ - 브랜드 선택     │ - Meeting Summary      │ - Chat              │
│ - Meeting 리스트  │ - Concept Board        │   (Sparklio         │
│ - 프로젝트 정보   │ - Slides Preview       │    Assistant)       │
│                  │ - Detail Preview       │                     │
│                  │ - Instagram Preview    │ - Inspector         │
│                  │ - Shorts Preview       │                     │
│                  │                        │ - Suggested Actions │
│                  │                        │                     │
└──────────────────┴────────────────────────┴─────────────────────┘
```

### 3.2 좌/중/우 패널 역할

#### 좌측 패널 (Left Panel, 20% 내외)

**역할**: "컨텍스트 선택"

**구성**:
- 브랜드 선택 (드롭다운)
- Meeting 목록 / 최근 Meeting 리스트
- (옵션) 프로젝트 선택/생성

**특징**:
- 이 패널에서 선택된 컨텍스트가 **중앙·우측에 공통으로 적용**됩니다.
- 예: 브랜드 선택 → 우측 Chat이 해당 브랜드의 Brand Kit 기반으로 동작

#### 중앙 영역 (Center View, 50-60%)

**역할**: "결과물을 보여주는 메인 캔버스"

**기본 상태**:
- Meeting 요약 OR 캠페인 Overview OR Concept Board

**뷰 타입**:
- `meeting_summary`: Meeting 요약
- `concept_board`: Concept Board (기본 뷰)
- `slides_preview`: Presentation 미리보기
- `detail_preview`: Product Detail 미리보기
- `instagram_preview`: Instagram Ad 미리보기
- `shorts_preview`: Shorts Script & Preview

**원칙**:
- **뷰는 바뀌어도 "프로젝트/컨셉" 컨텍스트는 유지**됩니다.
- 뷰 전환은 Chat의 버튼 클릭 또는 좌측 패널의 선택으로만 발생합니다.

#### 우측 패널 (Right Panel, 20-30%)

**역할**: "챗 오케스트레이터 + 세부 설정"

**기본 구성**:
- 상단 (80%): **Chat 대화창**
- 하단 (20%): Inspector (옵션, 파라미터 슬라이더, 토글 등)

**원칙**:
- 유저의 모든 주요 행동은 **"우측 챗에서 시작"**하는 것을 기본으로 합니다.
- 버튼/토글은 챗의 보조 수단입니다.

---

## 4. Chat = 오케스트레이터 원칙

### 4.1 역할 정의

**핵심 컨셉**:
> Chat은 단순 Q&A가 아니라, **전체 워크플로우를 움직이는 컨트롤 타워**입니다.

**Chat이 하는 일**:
1. 사용자의 자연어 입력을 **의도(Intent)로 파싱**
2. 적절한 **에이전트/파이프라인 호출**
3. 현재 **상태를 자연어로 설명** (Narration)
4. 다음 **행동 버튼/옵션 제안** (Next Actions)

**예시**:
```
유저: "이 회의로 캠페인 만들어줘. https://www.youtube.com/watch?v=XXXXX"

챗: "알겠습니다. 회의 내용을 불러와서 요약하고, 캠페인 브리프를 만들게요."
    [내부: POST /api/v1/meetings/from-url 호출]

챗: "회의 요약이 준비됐어요.
     - 핵심 타깃: 30-40대 엄마
     - 주요 문제: 시중 젤리는 합성 첨가물 과다
     - 제안할 솔루션: 천연 재료 젤리

     이 내용으로 브랜드 {제주 감귤 브랜드} 기반 캠페인을 만들어볼까요?"

     [캠페인 만들기] 버튼
```

### 4.2 Chat 메시지 구조

**모든 Chat 응답은 다음 3요소를 포함**합니다:

#### 1) Narration (상태 설명)
- 지금 무슨 일을 하고 있는지
- 얼마나 걸릴지
- 무엇을 했는지 설명

**예시**:
- "회의 내용을 분석해서 캠페인 콘셉트 3가지를 뽑고 있어요."
- "Concept A 기준으로 슬라이드/상세/인스타 카피를 생성했습니다."

#### 2) 결과 요약 (핵심 포인트)
- 방금 생성된 산출물의 핵심만 2-5줄로 요약

**예시**:
- "Concept A는 'Z세대 타깃'에 맞춰 밝고 경쾌한 톤으로 구성했어요."

#### 3) Next Actions (행동 버튼/명령 제안)
- 유저가 바로 클릭할 수 있는 2-4개의 행동

**예시**:
- `[컨셉보드 열기] [슬라이드 보기] [상세페이지 보기] [인스타 카드 보기]`
- `[Concept A로 쇼츠 스크립트 생성] [Concept B도 비교해줘]`

### 4.3 Chat 응답 JSON 포맷

```typescript
interface ChatResponse {
  message: string; // Narration + 결과 요약
  nextActions?: NextAction[]; // 버튼 리스트
  view?: ViewType; // 전환할 뷰 (optional)
  progress?: number; // 진행률 (0-100, optional)
}

interface NextAction {
  label: string; // 버튼 텍스트
  action: string; // 액션 타입
  payload?: Record<string, any>; // 액션 파라미터
}
```

**예시**:
```json
{
  "message": "모든 산출물이 준비됐어요. 아래에서 결과를 확인하세요.",
  "nextActions": [
    {
      "label": "컨셉보드 열기",
      "action": "open_concept_board",
      "payload": { "project_id": "..." }
    },
    {
      "label": "Concept A 슬라이드 보기",
      "action": "open_slides",
      "payload": { "concept_id": "concept-a", "presentation_id": "..." }
    },
    {
      "label": "Concept B 쇼츠 프리뷰",
      "action": "open_shorts_preview",
      "payload": { "concept_id": "concept-b", "shorts_id": "..." }
    }
  ],
  "view": "concept_board"
}
```

---

## 5. 상태 흐름 & 뷰 전환 규칙

### 5.1 핵심 상태

데모 V1에서 Chat이 관리하는 주요 상태:

#### 1) `meeting_loaded`
- Meeting From URL 성공
- Meeting 요약/핵심 키메시지/타깃 정보 확보

#### 2) `campaign_generated`
- 컨셉 세트(Concept A/B/…) 생성
- 각 컨셉별 슬라이드/상세/인스타 초안 생성

#### 3) `concept_board_ready`
- 컨셉보드에 각 컨셉 카드와 샘플 산출물 연결 완료

#### 4) `shorts_ready` (선택)
- 특정 컨셉 기준 쇼츠 스크립트/스토리보드 생성 완료
- (이미지/영상까지 연결 시 `shorts_visual_ready` 등으로 확장 가능)

### 5.2 상태 → 중앙 뷰 전환

#### `meeting_loaded` 직후:
- **기본 중앙 뷰**: Meeting 요약 카드 or 캠페인 개요
- **Chat**: "요약 완료" + `[캠페인 아이디어 뽑기]` 버튼 제안

#### `campaign_generated` 직후:
- **기본 중앙 뷰**: **Concept Board** (최소 2개 이상의 Concept Card)
- **Chat**: "캠페인 콘셉트 생성 완료" +
  `[컨셉보드 열기] [Concept A 슬라이드 보기] [Concept A 상세 보기]` 등

#### `concept_board_ready` 상태에서:
- **컨셉 카드 클릭 시**:
  - 중앙 뷰를 해당 컨셉의 산출물 탭으로 전환
  - 우측 Chat에 "지금 Concept A를 보고 있습니다" 라는 컨텍스트 표시

#### `shorts_ready` 상태에서:
- **한 컨셉 기준 쇼츠 생성 후**:
  - 중앙: Shorts Preview/스토리보드 뷰
  - Chat: "쇼츠 스크립트를 만들었습니다" +
    `[쇼츠 프리뷰 보기] [스크립트 수정 요청]` 버튼

---

## 6. Chat 메시지 ↔ 백엔드 액션 매핑 패턴

### 6.1 매핑 개념

```
유저 입력 → LLM Router → Intent/Command 파싱 →
백엔드 서비스/에이전트 호출 → 결과 → Chat 응답 + 뷰 전환
```

### 6.2 대표 시나리오 패턴

#### 시나리오 1: 회의 URL 입력

**유저**:
> "이 유튜브 회의 영상으로 캠페인 만들어줘: {URL}"

**시스템**:
- Intent: `create_campaign_from_url`
- API: `POST /api/v1/meetings/from-url`
- 처리: Meeting 요약/키메시지/타깃 추출

**Chat 응답**:
- Narration: "회의 내용을 분석해서 요약을 만들고 있어요…"
- 완료 후 Next Actions:
  - `[요약 보기] [캠페인 아이디어 뽑기]`

#### 시나리오 2: 캠페인/콘셉트 생성

**유저**:
> "이 회의 기준으로 2~3개의 광고 콘셉트로 캠페인을 구성해줘"

**시스템**:
- Intent: `generate_campaign_concepts`
- Agents: StrategistAgent, ConceptAgent, CopywriterAgent
- 처리: Campaign Brief → Concept 2-3개 → 각 4종 산출물

**Chat 응답**:
- Narration: "콘셉트 3가지를 만들었어요."
- Next Actions:
  - `[컨셉보드 열기] [Concept A 슬라이드 보기] [Concept B 상세 보기]`

#### 시나리오 3: 쇼츠/영상 요청

**유저**:
> "Concept A 기준으로 20초짜리 쇼츠도 만들어줘"

**시스템**:
- Intent: `generate_shorts`
- Agents: ShortsScriptAgent → VisualPromptAgent → VideoBuilder
- 처리: Shorts Script → 키프레임 이미지 → 영상 조립

**Chat 응답**:
- Narration: "Concept A 기반 쇼츠 스크립트를 만들었어요."
- Next Actions:
  - `[쇼츠 프리뷰 보기] [스크립트 다시 다듬기]`

### 6.3 매핑 테이블

| Chat 입력 | Intent | Backend API | 내부 에이전트 | 뷰 전환 |
|----------|--------|-------------|-------------|--------|
| "이 회의로 캠페인 만들어줘" | `create_campaign_from_url` | `POST /api/v1/meetings/from-url` | MeetingFromUrlAgent, MeetingSummaryAgent | `meeting_summary` |
| "캠페인 만들기" (버튼) | `generate_campaign` | `POST /api/v1/demo/meeting-to-campaign` | StrategistAgent, ConceptAgent | `concept_board` |
| "Concept A로 쇼츠 만들어줘" | `generate_shorts` | `POST /api/v1/demo/campaign-to-shorts` | ShortsScriptAgent, VisualPromptAgent, VideoBuilder | `shorts_preview` |
| "컨셉보드 열기" (버튼) | `open_concept_board` | `GET /api/v1/demo/concept-board/{id}` | 데이터 조회만 | `concept_board` |

---

## 7. 멀티 아웃풋 & 컨셉보드 원칙

### 7.1 모든 산출물은 "콘셉트 단위"로 묶인다

**구조**:
```
Campaign
├── Concept A: "상큼한 하루 리프레시"
│   ├── Presentation (5 슬라이드)
│   ├── Product Detail Page
│   ├── Instagram News Ad (카드 3종)
│   └── Shorts Script (25초, 씬 6개)
│
└── Concept B: "아이와 함께하는 비타민 간식"
    ├── Presentation (5 슬라이드)
    ├── Product Detail Page
    ├── Instagram News Ad (카드 3종)
    └── Shorts Script (30초, 씬 7개)
```

### 7.2 컨셉보드는 "콘셉트별 미니 대시보드" 역할

**각 Concept Card 구성**:
- 콘셉트 이름 + 한 줄 설명
- 대표 비주얼 or 대표 카피
- "자세히 보기" 버튼 (해당 탭으로 전환)

**예시**:
```
┌────────────────────────────────────┐
│ Concept A                          │
│ "상큼한 하루 리프레시"             │
│────────────────────────────────────│
│ 핵심 메시지:                       │
│ "제주 감귤의 상큼함으로            │
│  하루를 상쾌하게"                  │
│────────────────────────────────────│
│ 톤앤매너: 밝은, 경쾌한, 활기찬      │
│────────────────────────────────────│
│ 대표 헤드라인:                     │
│ "아침마다 상큼하게,                │
│  제주 감귤 젤리"                   │
│────────────────────────────────────│
│ [슬라이드 보기] [상세 보기]        │
│ [인스타 보기] [쇼츠 보기]          │
└────────────────────────────────────┘
```

### 7.3 Chat은 항상 현재 보고 있는 콘셉트/뷰를 인식

**컨텍스트 표시 예시**:
- "지금은 Concept B의 인스타 카드 뷰를 보고 있어요."
- "Concept A 기준으로 쇼츠를 만들까요?"

---

## 8. 쇼츠/영상 플로우에서의 원칙

### 8.1 쇼츠 생성도 Chat 기반 스텝을 따른다

**원칙**:
- "어떤 콘셉트 기준인지"를 명확히
- 길이/톤/타깃을 Chat에서 설정할 수 있게

**예시**:
```
유저: "Concept A로 20초짜리 쇼츠 만들어줘"

챗: "Concept A 기준으로 20초 쇼츠를 만들게요.
     타깃: Z세대·젊은층
     톤: 밝고 경쾌한

     진행할까요?"

유저: "응, 진행해"

챗: "쇼츠 스크립트를 만들고 있어요..."
```

### 8.2 쇼츠 스크립트/스토리보드 구조

**씬 단위 리스트**:
- 각 씬: 역할(Hook/Problem/Solution/Feature/Benefit/CTA), 화면, 내레이션, 자막, 시간

**예시**:
```json
{
  "scenes": [
    {
      "number": 1,
      "duration": "0-4초",
      "role": "Hook",
      "visual": "아침 침대에서 일어나는 모습",
      "narration": "아침마다 피곤하신가요?",
      "subtitle": "피곤한 아침..."
    },
    // ...
  ]
}
```

### 8.3 이미지 생성

**VisualPromptAgent**:
- ComfyUI에 보낼 프롬프트 고도화
- "브랜드 톤/콘셉트"와 맞도록 텍스트 생성

**예시**:
```
Prompt: "Bright morning scene, person waking up in bed, sunlight through window, warm colors, cinematic lighting, high quality"
Negative Prompt: "dark, gloomy, low quality, blurry"
```

### 8.4 ffmpeg 기반 영상 조립

**VideoBuilder**:
- ShortsStoryboard 구조를 그대로 따라가되
- 데모에서는 **최소 스토리보드/키프레임 프리뷰까지만** 필수로 함

**처리 순서**:
1. 각 씬별 이미지 로드
2. duration에 맞춰 이미지 표시 시간 설정
3. 자막 오버레이 (burn-in)
4. 씬 전환 효과 (fade/crossfade)
5. 최종 mp4 출력

---

## 9. 데모 V1에서의 최소 구현 기준

데모 V1에서는 아래 항목을 "챗 기반 원페이지 스튜디오" 구현의 **최소 기준**으로 봅니다.

### 9.1 필수 구현 (Must Have)

- ✅ `/studio/demo` 한 화면에서
  - Meeting URL 입력
  - 요약 확인
  - 캠페인/콘셉트 생성
  - 컨셉보드 확인
  - 최소 1개 컨셉 기준 멀티 아웃풋(슬라이드/상세/인스타) 확인

- ✅ 우측 Chat이 위 플로우를 모두 오케스트레이션

- ✅ 컨셉보드 ↔ 각 뷰 전환이 직관적으로 연결

### 9.2 선택 구현 (Nice to Have)

- 🔲 특정 콘셉트 기준 쇼츠 스크립트 생성
- 🔲 키프레임 이미지 생성 (ComfyUI)
- 🔲 영상 조립 (ffmpeg)

---

## 10. 구현 체크리스트

### 10.1 프론트엔드

- [ ] 좌/중/우 패널 레이아웃 구현
- [ ] Chat 컴포넌트 (메시지, Next Actions, 입력창)
- [ ] 중앙 뷰 6종 구현 (Meeting Summary, Concept Board, Slides, Detail, Instagram, Shorts)
- [ ] Concept Card 클릭 → 뷰 전환 로직
- [ ] Chat 버튼 클릭 → 뷰 전환 로직
- [ ] 실시간 상태 Narration 표시 (SSE 연동)
- [ ] 진행률 UI (0% → 100%)

### 10.2 백엔드

- [ ] OrchestratorAgent (Chat 입력 → Intent 파싱)
- [ ] 각 Intent별 파이프라인 함수 구현
- [ ] Chat 응답 JSON 포맷 통일
- [ ] SSE 엔드포인트 (`/api/v1/tasks/{id}/stream`)
- [ ] Next Actions 데이터 생성 로직

### 10.3 에이전트

- [ ] MeetingSummaryAgent
- [ ] StrategistAgent
- [ ] ConceptAgent
- [ ] CopywriterAgent (4종: Presentation, Detail, Instagram, Shorts)
- [ ] DesignerAgent (레이아웃 정보)
- [ ] ReviewerAgent (광고 규제 검토)
- [ ] (선택) ShortsScriptAgent
- [ ] (선택) VisualPromptAgent
- [ ] (선택) VideoBuilder

### 10.4 QA

- [ ] Meeting From URL → 요약 플로우 테스트
- [ ] 캠페인 생성 → 컨셉보드 플로우 테스트
- [ ] Concept Card 클릭 → 산출물 뷰 전환 테스트
- [ ] Chat Next Actions 버튼 클릭 테스트
- [ ] 진행률 Narration 실시간 표시 테스트
- [ ] 브랜드 선택 → Chat 컨텍스트 반영 테스트

---

## 11. 주요 원칙 요약 (한 페이지 치트시트)

### 레이아웃
- **좌**: 브랜드/Meeting 선택 (컨텍스트)
- **중**: 결과물 표시 (6종 뷰)
- **우**: Chat (오케스트레이터) + Inspector

### Chat 역할
1. 유저 입력 → Intent 파싱
2. 에이전트/파이프라인 호출
3. 상태 Narration
4. Next Actions 제안

### Chat 메시지 구조
1. Narration (상태 설명)
2. 결과 요약 (핵심 포인트)
3. Next Actions (버튼)

### 상태 → 뷰 전환
- `meeting_loaded` → `meeting_summary`
- `campaign_generated` → `concept_board`
- `shorts_ready` → `shorts_preview`

### 컨셉보드 원칙
- 모든 산출물은 **콘셉트 단위**로 묶임
- 컨셉 카드 = 미니 대시보드
- Chat이 현재 보는 콘셉트 인식

### 쇼츠 플로우
- Chat에서 콘셉트/길이/톤 설정
- 씬 단위 스크립트 → 이미지 → 영상 조립
- 데모는 **스크립트 + 키프레임 프리뷰**까지 필수

---

## 12. 참고 문서

- [SPARKLIO_DEMO_V1_PRD.md](./SPARKLIO_DEMO_V1_PRD.md) - 전체 PRD
- [FRONTEND_DEMO_FLOW.md](./FRONTEND_DEMO_FLOW.md) - 프론트엔드 구현 상세
- [BACKEND_DEMO_APIS.md](./BACKEND_DEMO_APIS.md) - API 명세
- [AGENTS_DEMO_SPEC.md](./AGENTS_DEMO_SPEC.md) - 에이전트 스펙
- [CONCEPT_BOARD_SPEC.md](./CONCEPT_BOARD_SPEC.md) - 컨셉보드 상세

---

**문서 상태**: ✅ 완성
**다음 문서**: [BACKEND_DEMO_APIS.md](./BACKEND_DEMO_APIS.md)
**버전**: v1.0
**최종 수정**: 2025-11-25
