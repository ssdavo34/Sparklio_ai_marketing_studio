# B팀 검토 보고서: C팀 협업 보고서 리뷰

**문서 버전**: v1.0
**작성일**: 2025-11-26
**작성자**: B팀 (Backend)
**대상 문서**: `DEMO_TEAM_COLLABORATION_REPORT_2025-11-26.md`

---

## 1. 종합 평가

> **C팀 보고서에 전반적으로 동의합니다. 스키마와 기술 스택만 일부 조정이 필요합니다.**

| 항목 | C팀 분석 | B팀 평가 |
|------|---------|---------|
| 기존 코드 재활용률 70% | ✅ 동의 | Meeting API 등 이미 완료 |
| API 신규 개발 필요 | ✅ 동의 | Campaign/Concept/Asset API |
| SSE 스트리밍 핵심 | ✅ 동의 | UX 핵심, P0 |
| B팀 API가 Critical Path | ✅ 동의 | 스키마 먼저 확정 필요 |
| Mock 병렬 개발 전략 | ✅ 동의 | 효율적인 접근 |

---

## 2. 기술 스택 변경 사항 (중요)

### 2.1 LLM: 전체 Gemini로 통일

| 기존 계획 (AGENTS_DEMO_SPEC) | 변경 후 |
|----------------------------|---------|
| GPT-4o (전략/요약) | **Gemini 2.0 Flash** |
| Gemini 2.0 Flash (Concept) | Gemini 2.0 Flash |
| Llama 3.2 (카피) | **Gemini 2.0 Flash** |
| Claude 3.5 Sonnet (Reviewer) | **Gemini 2.0 Flash** |

**이유**: 무료 티어 활용, 단일 API 관리 단순화

**Gemini 무료 한도** (2025-11 기준):
- 15 RPM (분당 요청)
- 100만 토큰/일
- 1,500 요청/일

### 2.2 이미지 생성: Nanobanana

| 기존 계획 | 변경 후 |
|----------|---------|
| ComfyUI (로컬 GPU) | **Nanobanana API** |

**이유**:
- 로컬 GPU 의존성 제거
- API 기반으로 안정성 확보
- 무료 티어 활용

### 2.3 음성(TTS): Edge TTS

| 항목 | 선택 |
|------|------|
| TTS 서비스 | **Edge TTS** (Python: `edge-tts`) |
| 비용 | 무료 (무제한) |
| 한국어 지원 | ✅ (ko-KR-SunHiNeural 등) |

### 2.4 배경음악 (BGM)

| 항목 | 선택 |
|------|------|
| 방식 | 사전 다운로드 BGM 파일 |
| 소스 | Pixabay, FreePD (저작권 무료) |
| 파일 수 | 2-3개 (밝은/활기찬 분위기) |

---

## 3. API 스키마 확정 (B팀 → C팀)

### 3.1 Campaign 생성 API

```
POST /api/v1/demo/meeting-to-campaign
```

**Request**:
```json
{
  "meeting_id": "uuid",
  "brand_id": "uuid",        // Optional
  "num_concepts": 2          // Optional, default: 2
}
```

**Response** (202 Accepted):
```json
{
  "success": true,
  "data": {
    "task_id": "task-uuid",
    "campaign_id": "campaign-uuid",
    "status": "processing",
    "estimated_seconds": 120
  }
}
```

---

### 3.2 SSE 스트리밍 API

```
GET /api/v1/tasks/{task_id}/stream
```

**Event 구조**:
```typescript
interface SSEEvent {
  event: 'progress' | 'completed' | 'error';
  data: {
    step: string;           // 현재 단계 ID
    message: string;        // 사용자 표시 메시지
    progress: number;       // 0-100
    campaign_id?: string;   // 완료 시
    error?: string;         // 에러 시
  };
}
```

**Progress 단계별 예시**:
```
event: progress
data: {"step": "meeting_summary", "message": "회의 내용을 요약하고 있어요...", "progress": 10}

event: progress
data: {"step": "campaign_brief", "message": "캠페인 브리프를 작성 중입니다...", "progress": 20}

event: progress
data: {"step": "concept_generation", "message": "콘셉트를 생성하고 있어요...\n- Concept A: '상큼한 하루 리프레시'\n- Concept B: '아이와 함께하는 비타민 간식'", "progress": 35}

event: progress
data: {"step": "assets_concept_a", "message": "Concept A 기반 산출물 생성 중... (1/4)", "progress": 45}

event: progress
data: {"step": "assets_concept_a", "message": "Concept A 기반 산출물 생성 중... (2/4)", "progress": 55}

event: progress
data: {"step": "assets_concept_b", "message": "Concept B 기반 산출물 생성 중... (1/4)", "progress": 70}

event: progress
data: {"step": "review", "message": "품질 검토 중...", "progress": 90}

event: completed
data: {"step": "completed", "message": "모든 산출물이 준비되었습니다!", "progress": 100, "campaign_id": "campaign-uuid"}
```

---

### 3.3 Concept Board 데이터 API

```
GET /api/v1/demo/concept-board/{campaign_id}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "campaign_id": "campaign-uuid",
    "meeting": {
      "meeting_id": "meeting-uuid",
      "title": "제주 감귤 젤리 신제품 런칭 기획 회의",
      "one_line_summary": "국내산 제주 감귤을 활용한 건강한 젤리 신제품 기획",
      "key_messages": [
        "국내산 제주 감귤 100%",
        "합성 첨가물 무첨가",
        "어린이도 안심하고 먹을 수 있는 비타민 간식"
      ],
      "target_persona": "30-40대 엄마, 자녀 간식에 관심 많은 소비자"
    },
    "brand": {
      "brand_id": "brand-uuid",
      "name": "제주 감귤 브랜드",
      "primary_color": "#FFA500",
      "secondary_color": "#FFD700"
    },
    "brief": {
      "goal": "제주 감귤 젤리 신제품 런칭 및 인지도 확대",
      "target": "30-40대 엄마, 자녀 간식에 관심 많은 소비자",
      "core_message": "국내산 제주 감귤 100%, 합성 첨가물 무첨가",
      "tone": "친근하고 안심되는 톤"
    },
    "concepts": [
      {
        "concept_id": "concept-a-uuid",
        "title": "상큼한 하루 리프레시",
        "subtitle": "제주 감귤의 상큼함으로 하루를 상쾌하게",
        "core_message": "제주 감귤의 상큼함으로 하루를 상쾌하게",
        "tone_keywords": ["밝은", "경쾌한", "활기찬"],
        "color_palette": ["#FFA500", "#FFFFFF", "#FFD700"],
        "sample_headlines": [
          "아침마다 상큼하게, 제주 감귤 젤리",
          "하루를 깨우는 비타민 한 입"
        ],
        "linked_assets": {
          "presentation_id": "pres-uuid-a",
          "product_detail_id": "detail-uuid-a",
          "instagram_ids": ["insta-a-1", "insta-a-2", "insta-a-3"],
          "shorts_script_id": "shorts-uuid-a",
          "shorts_video_url": null
        }
      },
      {
        "concept_id": "concept-b-uuid",
        "title": "아이와 함께하는 비타민 간식",
        "subtitle": "엄마가 안심하고 주는 건강한 간식",
        "core_message": "우리 아이 첫 비타민은 제주 감귤 젤리로",
        "tone_keywords": ["따뜻한", "신뢰", "안심"],
        "color_palette": ["#FF8C00", "#FFFAF0", "#FFE4B5"],
        "sample_headlines": [
          "엄마가 먼저 고른 비타민 간식",
          "우리 아이 첫 젤리, 제주 감귤로"
        ],
        "linked_assets": {
          "presentation_id": "pres-uuid-b",
          "product_detail_id": "detail-uuid-b",
          "instagram_ids": ["insta-b-1", "insta-b-2", "insta-b-3"],
          "shorts_script_id": "shorts-uuid-b",
          "shorts_video_url": null
        }
      }
    ],
    "status": "ready",
    "created_at": "2025-11-26T12:00:00Z"
  }
}
```

---

### 3.4 산출물 상세 조회 API

#### Presentation
```
GET /api/v1/assets/presentations/{presentation_id}
```

```json
{
  "success": true,
  "data": {
    "presentation_id": "pres-uuid-a",
    "concept_id": "concept-a-uuid",
    "title": "상큼한 하루 리프레시",
    "slides": [
      {
        "slide_number": 1,
        "type": "cover",
        "title": "상큼한 하루 리프레시",
        "subtitle": "제주 감귤 젤리",
        "background_color": "#FFA500"
      },
      {
        "slide_number": 2,
        "type": "problem",
        "title": "시중 젤리의 문제점",
        "content": "합성 첨가물이 가득한 간식, 정말 안심하고 먹일 수 있을까요?",
        "background_color": "#FFFFFF"
      },
      {
        "slide_number": 3,
        "type": "solution",
        "title": "제주 감귤 젤리",
        "content": "국내산 제주 감귤 100%로 만든 천연 간식",
        "background_color": "#FFD700"
      },
      {
        "slide_number": 4,
        "type": "benefits",
        "title": "왜 제주 감귤 젤리인가요?",
        "bullets": [
          "국내산 제주 감귤 100%",
          "합성 첨가물 무첨가",
          "비타민 C 풍부",
          "어린이도 안심"
        ],
        "background_color": "#FFFFFF"
      },
      {
        "slide_number": 5,
        "type": "cta",
        "title": "지금 바로 시작하세요",
        "cta_text": "제주 감귤 젤리 구매하기 →",
        "background_color": "#FFA500"
      }
    ]
  }
}
```

#### Product Detail
```
GET /api/v1/assets/product-details/{detail_id}
```

```json
{
  "success": true,
  "data": {
    "detail_id": "detail-uuid-a",
    "concept_id": "concept-a-uuid",
    "title": "제주 감귤 젤리 - 상큼한 하루 리프레시",
    "one_liner": "국내산 제주 감귤 100%로 만든 상큼하고 건강한 젤리",
    "benefits": [
      "국내산 제주 감귤 100% 사용",
      "합성 첨가물 무첨가",
      "비타민 C 풍부 (1일 권장량의 30%)",
      "어린이도 안심하고 먹을 수 있는 천연 간식"
    ],
    "description": "바쁜 아침, 상큼한 제주 감귤 젤리 한 입이면 하루가 상쾌하게 시작됩니다. 제주도의 햇살을 가득 담은 감귤로 만들어 비타민 C가 풍부하고, 합성 첨가물 없이 천연 재료만으로 만들었습니다.",
    "cta": "지금 바로 구매하기 →"
  }
}
```

#### Instagram Ads
```
GET /api/v1/assets/instagram-ads/{concept_id}
```

```json
{
  "success": true,
  "data": {
    "concept_id": "concept-a-uuid",
    "cards": [
      {
        "card_id": "insta-a-1",
        "card_number": 1,
        "headline": "아침마다 상큼하게, 제주 감귤 젤리",
        "subcopy": "국내산 감귤 100%로 만든 건강한 간식",
        "cta": "지금 확인하기 →",
        "image_prompt": "Fresh Jeju tangerines with morning sunlight, bright orange color, clean white background"
      },
      {
        "card_id": "insta-a-2",
        "card_number": 2,
        "headline": "합성 첨가물? NO! 천연 재료 100%",
        "subcopy": "비타민 C가 풍부한 상큼한 제주 감귤",
        "cta": "상품 보러가기 →",
        "image_prompt": "Jelly candies made from tangerines, natural ingredients, vitamin C rich"
      },
      {
        "card_id": "insta-a-3",
        "card_number": 3,
        "headline": "온 가족이 함께 즐기는 건강 간식",
        "subcopy": "어린이도 안심! 제주 감귤 젤리",
        "cta": "구매하기 →",
        "image_prompt": "Happy family enjoying healthy snacks, warm atmosphere, orange color theme"
      }
    ]
  }
}
```

#### Shorts Script
```
GET /api/v1/assets/shorts-scripts/{shorts_id}
```

```json
{
  "success": true,
  "data": {
    "shorts_id": "shorts-uuid-a",
    "concept_id": "concept-a-uuid",
    "title": "상큼한 하루 리프레시 - 쇼츠",
    "duration_seconds": 25,
    "scenes": [
      {
        "scene_number": 1,
        "duration": "0-4초",
        "role": "Hook",
        "visual": "아침 침대에서 일어나며 기지개 펴는 모습",
        "narration": "아침마다 피곤하신가요?",
        "onscreen_text": "피곤한 아침...",
        "image_prompt": "Person waking up tired in morning, bedroom scene"
      },
      {
        "scene_number": 2,
        "duration": "4-8초",
        "role": "Problem",
        "visual": "시중 젤리 제품들, 성분표에 빨간 표시",
        "narration": "시중 젤리는 합성 첨가물이 가득!",
        "onscreen_text": "합성 첨가물 NO!",
        "image_prompt": "Commercial jelly products with warning signs on ingredients"
      },
      {
        "scene_number": 3,
        "duration": "8-12초",
        "role": "Solution",
        "visual": "제주도 감귤 밭, 햇살 가득",
        "narration": "제주 감귤 젤리는 다릅니다",
        "onscreen_text": "제주 감귤 100%",
        "image_prompt": "Jeju tangerine farm with bright sunlight"
      },
      {
        "scene_number": 4,
        "duration": "12-17초",
        "role": "Feature",
        "visual": "젤리 클로즈업, 상큼한 비주얼",
        "narration": "국내산 감귤 100%, 합성 첨가물 제로",
        "onscreen_text": "천연 재료만!",
        "image_prompt": "Close-up of tangerine jelly, fresh and natural look"
      },
      {
        "scene_number": 5,
        "duration": "17-21초",
        "role": "Benefit",
        "visual": "아이가 즐겁게 젤리 먹는 모습",
        "narration": "온 가족이 안심하고 즐기는 건강 간식",
        "onscreen_text": "어린이도 안심!",
        "image_prompt": "Happy child eating jelly snack, healthy and safe"
      },
      {
        "scene_number": 6,
        "duration": "21-25초",
        "role": "CTA",
        "visual": "제품 패키지 + 구매 버튼",
        "narration": "지금 바로 만나보세요!",
        "onscreen_text": "제주 감귤 젤리 구매하기 →",
        "image_prompt": "Product package with call-to-action button"
      }
    ],
    "video_url": null
  }
}
```

---

### 3.5 Chat 응답 구조 (NextActions 포함)

```typescript
interface ChatResponse {
  message: string;
  view?: 'meeting_summary' | 'concept_board' | 'slides_preview' |
         'detail_preview' | 'instagram_preview' | 'shorts_preview';
  next_actions?: NextAction[];
}

interface NextAction {
  id: string;
  label: string;
  action: 'create_campaign' | 'open_concept_board' | 'open_slides' |
          'open_detail' | 'open_instagram' | 'open_shorts' | 'generate_video';
  payload?: {
    meeting_id?: string;
    campaign_id?: string;
    concept_id?: string;
    asset_id?: string;
  };
  variant?: 'primary' | 'secondary' | 'outline';
}
```

**예시 - Meeting 요약 후 응답**:
```json
{
  "message": "회의 요약이 완료되었어요!\n\n**제주 감귤 젤리 신제품 런칭 기획 회의**\n\n핵심 메시지:\n- 국내산 제주 감귤 100%\n- 합성 첨가물 무첨가\n- 어린이도 안심\n\n이 내용으로 캠페인을 만들어볼까요?",
  "view": "meeting_summary",
  "next_actions": [
    {
      "id": "create-campaign",
      "label": "캠페인 만들기",
      "action": "create_campaign",
      "payload": { "meeting_id": "meeting-uuid" },
      "variant": "primary"
    }
  ]
}
```

**예시 - Campaign 생성 완료 후 응답**:
```json
{
  "message": "모든 산출물이 준비되었습니다!\n\n2개의 콘셉트가 생성되었어요:\n- **Concept A**: 상큼한 하루 리프레시\n- **Concept B**: 아이와 함께하는 비타민 간식\n\n아래 버튼을 눌러 확인해보세요.",
  "view": "concept_board",
  "next_actions": [
    {
      "id": "open-board",
      "label": "컨셉보드 열기",
      "action": "open_concept_board",
      "payload": { "campaign_id": "campaign-uuid" },
      "variant": "primary"
    },
    {
      "id": "open-slides-a",
      "label": "Concept A 슬라이드",
      "action": "open_slides",
      "payload": { "concept_id": "concept-a-uuid", "asset_id": "pres-uuid-a" },
      "variant": "secondary"
    },
    {
      "id": "open-slides-b",
      "label": "Concept B 슬라이드",
      "action": "open_slides",
      "payload": { "concept_id": "concept-b-uuid", "asset_id": "pres-uuid-b" },
      "variant": "secondary"
    }
  ]
}
```

---

## 4. 영상 생성 파이프라인 (신규)

### 4.1 전체 플로우

```
ShortsScriptAgent (Gemini 2.0 Flash)
    ↓
VisualPromptAgent (Gemini 2.0 Flash)
    ↓
Nanobanana API (이미지 생성)
    ↓
Edge TTS (내레이션 음성 생성)
    ↓
ffmpeg (이미지 + 음성 + BGM 조립)
    ↓
shorts.mp4
```

### 4.2 Shorts Video 생성 API (선택적)

```
POST /api/v1/demo/generate-shorts-video
```

**Request**:
```json
{
  "shorts_script_id": "shorts-uuid-a",
  "include_narration": true,
  "include_bgm": true
}
```

**Response** (202 Accepted):
```json
{
  "success": true,
  "data": {
    "task_id": "task-video-uuid",
    "estimated_seconds": 180
  }
}
```

**완료 시 shorts_video_url 업데이트**

---

## 5. 일정 조정 제안

### 5.1 B팀 수정된 일정

| Day | 작업 | 세부 내용 |
|-----|------|----------|
| **Day 1** | 스키마 확정 + DB 모델 | Campaign, Concept, Asset 테이블 |
| **Day 2** | Demo API 구현 | meeting-to-campaign, concept-board |
| **Day 3** | SSE 스트리밍 | 실시간 진행상황 전송 |
| **Day 4** | Agent 통합 | Gemini 연동, 파이프라인 |
| **Day 5** | 테스트 + 버그 수정 | C팀 연동 테스트 |

### 5.2 C팀 Mock 데이터 활용 시점

| C팀 작업 | Mock 시작 | API 교체 |
|---------|----------|----------|
| Concept Board UI | Day 1 | Day 4 |
| NextActions 버튼 | Day 1 | Day 3 |
| SSE 연동 | Day 2 | Day 3 |
| 4종 Preview | Day 2 | Day 5 |

---

## 6. C팀에 요청 사항

### 6.1 확인 필요

1. **SSE 라이브러리**: `EventSource` 또는 `fetch` + `ReadableStream` 중 어떤 방식 사용 예정인지?
2. **상태 관리**: SSE 이벤트를 어느 store에 저장할 건지? (useChatStore vs 별도 store)
3. **NextActions 버튼 위치**: Chat 메시지 내부 vs 하단 고정 영역?

### 6.2 Mock 데이터 파일

B팀에서 아래 경로에 Mock JSON 파일 제공 예정:
```
frontend/public/mock-data/
├── concept-board-sample.json
├── presentation-sample.json
├── product-detail-sample.json
├── instagram-ads-sample.json
└── shorts-script-sample.json
```

---

## 7. 결론

### 7.1 합의된 사항

| 항목 | 결정 |
|------|------|
| LLM | Gemini 2.0 Flash (전체) |
| 이미지 | Nanobanana API |
| TTS | Edge TTS (무료) |
| BGM | 사전 다운로드 파일 |
| SSE | 필수 (폴링 fallback 준비) |

### 7.2 다음 스텝

| 팀 | 즉시 해야 할 것 |
|----|----------------|
| **B팀** | DB 모델 생성 + Demo API 엔드포인트 |
| **C팀** | Mock 데이터로 Concept Board UI 시작 |
| **A팀** | 데모 시나리오 스크립트 작성 |

---

**문서 상태**: ✅ 완성
**다음 문서**: B팀 구현 시작
**버전**: v1.0
**최종 수정**: 2025-11-26
