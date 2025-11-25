# Backend Demo APIs

**문서 버전**: v1.0
**작성일**: 2025-11-25
**작성자**: A팀 (백엔드/문서 총괄)
**목적**: 데모 V1에 필요한 Backend API 스펙 정의

**상위 문서**: [SPARKLIO_DEMO_V1_PRD.md](./SPARKLIO_DEMO_V1_PRD.md)
**관련 문서**: [FRONTEND_DEMO_FLOW.md](./FRONTEND_DEMO_FLOW.md), [AGENTS_DEMO_SPEC.md](./AGENTS_DEMO_SPEC.md)

---

## 1. 공통 사항

### 1.1 Base URL

- **로컬 개발**: `http://localhost:8000`
- **Mac mini 서버**: `http://100.123.51.5:8000`

### 1.2 인증

**데모 V1에서는 인증 생략** (MVP 단계)

추후 확장 시:
- JWT Bearer Token
- Header: `Authorization: Bearer {token}`

### 1.3 공통 응답 형식

#### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-11-25T10:00:00Z"
}
```

#### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Meeting ID is required",
    "details": { ... }
  },
  "timestamp": "2025-11-25T10:00:00Z"
}
```

#### 에러 코드
| 코드 | HTTP Status | 설명 |
|-----|-------------|------|
| `INVALID_REQUEST` | 400 | 잘못된 요청 파라미터 |
| `NOT_FOUND` | 404 | 리소스를 찾을 수 없음 |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |
| `AGENT_ERROR` | 500 | AI 에이전트 실행 오류 |
| `TIMEOUT` | 504 | 요청 타임아웃 |

---

## 2. API 목록

### 2.1 Meeting APIs

#### 1) Meeting From URL
**Endpoint**: `POST /api/v1/meetings/from-url`

**목적**: YouTube/Zoom URL에서 회의 텍스트 추출

**Request**:
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": "제주 감귤 젤리 런칭 회의",  // Optional
  "language": "ko"  // Optional, default: "ko"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "meeting_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "제주 감귤 젤리 런칭 회의",
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "status": "processing",  // processing | ready_for_summary | summary_ready
    "created_at": "2025-11-25T10:00:00Z"
  }
}
```

**처리 과정**:
1. yt-dlp로 자막 다운로드 (또는 Audio 추출)
2. Whisper STT로 텍스트 변환 (자막 없을 경우)
3. DB에 Meeting 레코드 생성
4. 상태: `processing` → `ready_for_summary`

**에러 케이스**:
- 400: 잘못된 URL 형식
- 404: YouTube 영상을 찾을 수 없음
- 429: YouTube Rate Limiting (Soft-fail: 자막 실패해도 계속 진행)

---

#### 2) Get Meeting
**Endpoint**: `GET /api/v1/meetings/{meeting_id}`

**목적**: Meeting 정보 및 요약 조회

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "meeting_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "제주 감귤 젤리 신제품 런칭 기획 회의",
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "status": "summary_ready",
    "transcript": {
      "text": "안녕하세요. 오늘은 제주 감귤을 활용한 신제품 젤리 런칭에 대해 논의하겠습니다...",
      "source": "caption",  // caption | whisper_stt
      "language": "ko"
    },
    "summary": {
      "title": "제주 감귤 젤리 신제품 런칭 기획 회의",
      "one_line_summary": "국내산 제주 감귤을 활용한 건강한 젤리 신제품 기획",
      "key_messages": [
        "국내산 제주 감귤 100%",
        "합성 첨가물 무첨가",
        "어린이도 안심하고 먹을 수 있는 비타민 간식"
      ],
      "target_persona": "30-40대 엄마, 자녀 간식에 관심 많은 소비자",
      "problem": "시중 젤리는 합성 첨가물 과다",
      "solution": "천연 재료로 만든 건강한 젤리"
    },
    "created_at": "2025-11-25T10:00:00Z",
    "updated_at": "2025-11-25T10:05:00Z"
  }
}
```

**에러 케이스**:
- 404: Meeting ID를 찾을 수 없음

---

#### 3) List Meetings
**Endpoint**: `GET /api/v1/meetings`

**목적**: Meeting 리스트 조회

**Query Parameters**:
- `limit`: 최대 개수 (default: 20)
- `offset`: 오프셋 (default: 0)
- `status`: 상태 필터 (optional)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "meetings": [
      {
        "meeting_id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "제주 감귤 젤리 신제품 런칭 기획 회의",
        "status": "summary_ready",
        "created_at": "2025-11-25T10:00:00Z"
      },
      // ...
    ],
    "total": 15,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 2.2 Demo Pipeline APIs

#### 4) Meeting to Campaign
**Endpoint**: `POST /api/v1/demo/meeting-to-campaign`

**목적**: Meeting 기반 캠페인 생성 (Strategist + Concept + Multi-Output)

**Request**:
```json
{
  "meeting_id": "550e8400-e29b-41d4-a716-446655440000",
  "brand_id": "brand-123",  // Optional
  "num_concepts": 2,  // Optional, default: 2
  "concept_types": ["youthful", "family"]  // Optional
}
```

**Response** (202 Accepted):
```json
{
  "success": true,
  "data": {
    "task_id": "task-abc-123",
    "campaign_id": "campaign-xyz-456",
    "status": "processing",  // processing | completed | failed
    "estimated_time": 120,  // seconds
    "progress_url": "/api/v1/tasks/task-abc-123/stream"
  }
}
```

**처리 과정**:
1. StrategistAgent → Campaign Brief 생성
2. ConceptAgent → Concept 2-3개 생성
3. 각 Concept별 병렬 실행:
   - PresentationAgent → 3-5 슬라이드
   - ProductDetailAgent → 상세페이지 텍스트
   - InstagramNewsAdAgent → 카드 3종
   - ShortsScriptAgent → 씬 단위 스크립트
4. ReviewerAgent → 광고 규제 검토

**Progress Events** (SSE):
```json
// Event 1
{
  "event": "progress",
  "data": {
    "step": "strategist",
    "message": "캠페인 브리프를 작성 중입니다...",
    "progress": 10
  }
}

// Event 2
{
  "event": "progress",
  "data": {
    "step": "concept_generation",
    "message": "콘셉트를 생성하고 있어요...\n- Concept A: \"상큼한 하루 리프레시\"\n- Concept B: \"아이와 함께하는 비타민 간식\"",
    "progress": 30
  }
}

// Event 3
{
  "event": "progress",
  "data": {
    "step": "multi_output",
    "message": "Concept A 기반 산출물 생성 중... (1/4)",
    "progress": 40
  }
}

// ... (중간 진행률)

// Event Final
{
  "event": "completed",
  "data": {
    "step": "completed",
    "message": "모든 산출물이 준비되었습니다!",
    "progress": 100,
    "campaign_id": "campaign-xyz-456"
  }
}
```

---

#### 5) Get Campaign
**Endpoint**: `GET /api/v1/demo/campaigns/{campaign_id}`

**목적**: Campaign 및 Concept 데이터 조회

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "campaign_id": "campaign-xyz-456",
    "meeting_id": "550e8400-e29b-41d4-a716-446655440000",
    "brand_id": "brand-123",
    "brief": {
      "goal": "제주 감귤 젤리 신제품 런칭 및 인지도 확대",
      "target": "30-40대 엄마, 자녀 간식에 관심 많은 소비자",
      "core_message": "국내산 제주 감귤 100%, 합성 첨가물 무첨가, 건강한 비타민 간식",
      "tone": "친근하고 안심되는 톤"
    },
    "concepts": [
      {
        "concept_id": "concept-a",
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
          "presentation_id": "presentation-001",
          "product_detail_id": "detail-001",
          "instagram_ids": ["insta-001", "insta-002", "insta-003"],
          "shorts_script_id": "shorts-001"
        }
      },
      {
        "concept_id": "concept-b",
        "title": "아이와 함께하는 비타민 간식",
        "subtitle": "엄마의 마음으로 만든 건강한 젤리",
        "core_message": "엄마의 마음으로 만든 건강한 젤리",
        "tone_keywords": ["따뜻한", "안심", "케어링"],
        "color_palette": ["#FFB6C1", "#FFFFFF", "#FFD700"],
        "sample_headlines": [
          "우리 아이 간식, 제주 감귤로 건강하게",
          "엄마가 선택한 천연 젤리"
        ],
        "linked_assets": {
          "presentation_id": "presentation-002",
          "product_detail_id": "detail-002",
          "instagram_ids": ["insta-004", "insta-005", "insta-006"],
          "shorts_script_id": "shorts-002"
        }
      }
    ],
    "status": "completed",
    "created_at": "2025-11-25T10:05:00Z",
    "completed_at": "2025-11-25T10:07:30Z"
  }
}
```

---

#### 6) Get Concept Board
**Endpoint**: `GET /api/v1/demo/concept-board/{campaign_id}`

**목적**: Concept Board용 데이터 패키지 조회

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "meeting": {
      "meeting_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "제주 감귤 젤리 신제품 런칭 기획 회의",
      "key_messages": [
        "국내산 제주 감귤 100%",
        "합성 첨가물 무첨가",
        "어린이도 안심"
      ],
      "target": "30-40대 엄마"
    },
    "brand": {
      "brand_id": "brand-123",
      "name": "제주 감귤 브랜드",
      "colors": ["#FFA500", "#FFD700"],
      "logo_url": "https://..."
    },
    "concepts": [
      {
        "concept_id": "concept-a",
        "title": "상큼한 하루 리프레시",
        "core_message": "제주 감귤의 상큼함으로 하루를 상쾌하게",
        "tone_keywords": ["밝은", "경쾌한", "활기찬"],
        "sample_headlines": [
          "아침마다 상큼하게, 제주 감귤 젤리"
        ],
        "linked_assets": {
          "presentation_id": "presentation-001",
          "product_detail_id": "detail-001",
          "instagram_ids": ["insta-001", "insta-002", "insta-003"],
          "shorts_script_id": "shorts-001"
        }
      },
      // Concept B...
    ]
  }
}
```

---

### 2.3 Asset APIs

#### 7) Get Presentation
**Endpoint**: `GET /api/v1/assets/presentations/{presentation_id}`

**목적**: Presentation (슬라이드) 데이터 조회

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "presentation_id": "presentation-001",
    "concept_id": "concept-a",
    "title": "상큼한 하루 리프레시",
    "slides": [
      {
        "slide_number": 1,
        "type": "cover",
        "title": "상큼한 하루 리프레시",
        "subtitle": "제주 감귤 젤리",
        "background_color": "#FFA500",
        "polotno_json": { /* Polotno JSON 구조 */ }
      },
      {
        "slide_number": 2,
        "type": "content",
        "title": "문제 정의",
        "content": "시중 젤리는 합성 첨가물이 과다합니다.",
        "polotno_json": { /* ... */ }
      },
      // ... 총 5장
    ],
    "created_at": "2025-11-25T10:06:00Z"
  }
}
```

---

#### 8) Get Product Detail
**Endpoint**: `GET /api/v1/assets/product-details/{detail_id}`

**목적**: Product Detail Page 데이터 조회

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "detail_id": "detail-001",
    "concept_id": "concept-a",
    "title": "제주 감귤 젤리 - 상큼한 하루 리프레시",
    "one_liner": "국내산 제주 감귤 100%로 만든 상큼하고 건강한 젤리",
    "benefits": [
      "국내산 제주 감귤 100% 사용",
      "합성 첨가물 무첨가",
      "비타민 C 풍부 (1일 권장량의 30%)",
      "어린이도 안심하고 먹을 수 있는 천연 간식"
    ],
    "description": "바쁜 아침, 상큼한 제주 감귤 젤리 한 입이면 하루가 상쾌하게 시작됩니다...",
    "cta": "지금 바로 구매하기 →",
    "created_at": "2025-11-25T10:06:30Z"
  }
}
```

---

#### 9) Get Instagram Ads
**Endpoint**: `GET /api/v1/assets/instagram-ads/{concept_id}`

**목적**: Instagram News Ad 카드 데이터 조회

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "concept_id": "concept-a",
    "cards": [
      {
        "card_id": "insta-001",
        "card_number": 1,
        "headline": "아침마다 상큼하게, 제주 감귤 젤리",
        "subcopy": "국내산 감귤 100%로 만든 건강한 간식",
        "cta": "지금 확인하기 →",
        "image_area": {
          "description": "제주 감귤 비주얼",
          "aspect_ratio": "1:1"
        }
      },
      {
        "card_id": "insta-002",
        "card_number": 2,
        "headline": "합성 첨가물? NO! 천연 재료 100%",
        "subcopy": "비타민 C가 풍부한 상큼한 제주 감귤",
        "cta": "상품 보러가기 →",
        "image_area": {
          "description": "젤리 컷 이미지",
          "aspect_ratio": "1:1"
        }
      },
      {
        "card_id": "insta-003",
        "card_number": 3,
        "headline": "온 가족이 함께 즐기는 건강 간식",
        "subcopy": "어린이도 안심! 제주 감귤 젤리",
        "cta": "구매하기 →",
        "image_area": {
          "description": "가족 이미지",
          "aspect_ratio": "1:1"
        }
      }
    ],
    "created_at": "2025-11-25T10:07:00Z"
  }
}
```

---

#### 10) Get Shorts Script
**Endpoint**: `GET /api/v1/assets/shorts-scripts/{shorts_id}`

**목적**: Shorts Script 데이터 조회

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "shorts_id": "shorts-001",
    "concept_id": "concept-a",
    "title": "상큼한 하루 리프레시 - 쇼츠",
    "duration": 25,  // seconds
    "scenes": [
      {
        "scene_number": 1,
        "duration": "0-4초",
        "role": "Hook",
        "visual": "아침 침대에서 일어나는 모습",
        "narration": "아침마다 피곤하신가요?",
        "onscreen_text": "피곤한 아침..."
      },
      {
        "scene_number": 2,
        "duration": "4-8초",
        "role": "Problem",
        "visual": "시중 젤리 제품들 (합성 첨가물 표시)",
        "narration": "시중 젤리는 합성 첨가물이 가득!",
        "onscreen_text": "합성 첨가물 NO!"
      },
      // ... 총 6개 씬
    ],
    "created_at": "2025-11-25T10:07:15Z"
  }
}
```

---

### 2.4 Shorts Video Pipeline APIs (선택적)

#### 11) Campaign to Shorts
**Endpoint**: `POST /api/v1/demo/campaign-to-shorts`

**목적**: 특정 Concept 기반 쇼츠 영상 생성 (Script → 이미지 → 영상)

**Request**:
```json
{
  "concept_id": "concept-a",
  "duration": 25,  // seconds, optional
  "include_visuals": true,  // 키프레임 이미지 생성 여부, optional
  "include_video": true  // 영상 조립 여부, optional
}
```

**Response** (202 Accepted):
```json
{
  "success": true,
  "data": {
    "task_id": "task-shorts-123",
    "shorts_id": "shorts-001",
    "status": "processing",
    "estimated_time": 180,  // seconds
    "progress_url": "/api/v1/tasks/task-shorts-123/stream"
  }
}
```

**Progress Events** (SSE):
```json
// Event 1
{
  "event": "progress",
  "data": {
    "step": "script_generation",
    "message": "Concept A 기준으로 쇼츠 스크립트를 만들고 있어요...",
    "progress": 20
  }
}

// Event 2
{
  "event": "progress",
  "data": {
    "step": "visual_prompts",
    "message": "키프레임 이미지를 생성하고 있어요... (1/6)",
    "progress": 40
  }
}

// ... (2/6, 3/6, ..., 6/6)

// Event Final
{
  "event": "completed",
  "data": {
    "step": "video_assembly",
    "message": "쇼츠 영상이 완성되었습니다!",
    "progress": 100,
    "shorts_id": "shorts-001",
    "video_url": "https://minio.../shorts-001.mp4",
    "keyframes": [
      "https://minio.../keyframe-1.png",
      "https://minio.../keyframe-2.png",
      // ...
    ]
  }
}
```

---

### 2.5 Task & Progress APIs

#### 12) Get Task Status
**Endpoint**: `GET /api/v1/tasks/{task_id}`

**목적**: 백그라운드 작업 상태 조회

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "task_id": "task-abc-123",
    "type": "meeting_to_campaign",  // meeting_to_campaign | campaign_to_shorts
    "status": "processing",  // queued | processing | completed | failed
    "progress": 65,  // 0-100
    "current_step": "multi_output",
    "message": "Concept B 기반 산출물 생성 중... (3/4)",
    "result": null,  // 완료 시 결과 데이터
    "created_at": "2025-11-25T10:05:00Z",
    "started_at": "2025-11-25T10:05:05Z",
    "completed_at": null
  }
}
```

---

#### 13) Stream Task Progress (SSE)
**Endpoint**: `GET /api/v1/tasks/{task_id}/stream`

**목적**: 실시간 진행 상황 스트리밍

**Response** (SSE Stream):
```
event: progress
data: {"step": "strategist", "message": "캠페인 브리프를 작성 중입니다...", "progress": 10}

event: progress
data: {"step": "concept_generation", "message": "콘셉트를 생성하고 있어요...", "progress": 30}

event: progress
data: {"step": "multi_output", "message": "Concept A 기반 산출물 생성 중... (1/4)", "progress": 40}

event: completed
data: {"step": "completed", "message": "모든 산출물이 준비되었습니다!", "progress": 100, "campaign_id": "campaign-xyz-456"}
```

---

## 3. 데이터 모델

### 3.1 Meeting
```typescript
interface Meeting {
  meeting_id: string;
  title: string;
  url: string;
  status: 'processing' | 'ready_for_summary' | 'summary_ready';
  transcript?: Transcript;
  summary?: MeetingSummary;
  created_at: string;
  updated_at: string;
}

interface Transcript {
  text: string;
  source: 'caption' | 'whisper_stt';
  language: string;
}

interface MeetingSummary {
  title: string;
  one_line_summary: string;
  key_messages: string[];
  target_persona: string;
  problem: string;
  solution: string;
}
```

### 3.2 Campaign
```typescript
interface Campaign {
  campaign_id: string;
  meeting_id: string;
  brand_id?: string;
  brief: CampaignBrief;
  concepts: Concept[];
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

interface CampaignBrief {
  goal: string;
  target: string;
  core_message: string;
  tone: string;
}

interface Concept {
  concept_id: string;
  title: string;
  subtitle: string;
  core_message: string;
  tone_keywords: string[];
  color_palette: string[];
  sample_headlines: string[];
  linked_assets: LinkedAssets;
}

interface LinkedAssets {
  presentation_id: string;
  product_detail_id: string;
  instagram_ids: string[];
  shorts_script_id: string;
}
```

### 3.3 Presentation
```typescript
interface Presentation {
  presentation_id: string;
  concept_id: string;
  title: string;
  slides: Slide[];
  created_at: string;
}

interface Slide {
  slide_number: number;
  type: 'cover' | 'content' | 'cta';
  title: string;
  subtitle?: string;
  content?: string;
  background_color?: string;
  polotno_json: object;  // Polotno JSON 구조
}
```

### 3.4 Product Detail
```typescript
interface ProductDetail {
  detail_id: string;
  concept_id: string;
  title: string;
  one_liner: string;
  benefits: string[];
  description: string;
  cta: string;
  created_at: string;
}
```

### 3.5 Instagram Ad
```typescript
interface InstagramAd {
  concept_id: string;
  cards: InstagramCard[];
  created_at: string;
}

interface InstagramCard {
  card_id: string;
  card_number: number;
  headline: string;
  subcopy: string;
  cta: string;
  image_area: {
    description: string;
    aspect_ratio: string;
  };
}
```

### 3.6 Shorts Script
```typescript
interface ShortsScript {
  shorts_id: string;
  concept_id: string;
  title: string;
  duration: number;  // seconds
  scenes: ShortsScene[];
  created_at: string;
}

interface ShortsScene {
  scene_number: number;
  duration: string;  // "0-4초"
  role: 'Hook' | 'Problem' | 'Solution' | 'Feature' | 'Benefit' | 'CTA';
  visual: string;
  narration: string;
  onscreen_text: string;
}
```

---

## 4. 시퀀스 다이어그램

### 4.1 Meeting From URL → Campaign 생성 플로우

```
User                Frontend            Backend API         Agents              Database
 │                     │                     │                 │                     │
 │  "회의로 캠페인      │                     │                 │                     │
 │   만들어줘 + URL"   │                     │                 │                     │
 ├──────────────────>│                     │                 │                     │
 │                     │                     │                 │                     │
 │                     │ POST /meetings/from-url                 │                     │
 │                     ├──────────────────>│                 │                     │
 │                     │                     │  MeetingFromUrlAgent                │
 │                     │                     ├──────────────>│                     │
 │                     │                     │                 │  Save Meeting      │
 │                     │                     │                 ├─────────────────>│
 │                     │                     │                 │                     │
 │                     │  201 Created        │                 │                     │
 │                     │  { meeting_id }     │                 │                     │
 │                     │<──────────────────┤                 │                     │
 │                     │                     │                 │                     │
 │  Meeting 요약 표시  │                     │                 │                     │
 │<────────────────────┤                     │                 │                     │
 │                     │                     │                 │                     │
 │  [캠페인 만들기]    │                     │                 │                     │
 │   버튼 클릭         │                     │                 │                     │
 ├──────────────────>│                     │                 │                     │
 │                     │                     │                 │                     │
 │                     │ POST /demo/meeting-to-campaign            │                     │
 │                     ├──────────────────>│                 │                     │
 │                     │                     │  StrategistAgent                    │
 │                     │                     ├──────────────>│                     │
 │                     │                     │  ConceptAgent                       │
 │                     │                     ├──────────────>│                     │
 │                     │                     │  Multi-Output Agents                │
 │                     │                     ├──────────────>│                     │
 │                     │                     │                 │  Save Campaign     │
 │                     │                     │                 ├─────────────────>│
 │                     │                     │                 │                     │
 │                     │  202 Accepted       │                 │                     │
 │                     │  { task_id,         │                 │                     │
 │                     │    campaign_id }    │                 │                     │
 │                     │<──────────────────┤                 │                     │
 │                     │                     │                 │                     │
 │  진행률 표시        │                     │                 │                     │
 │<────────────────────┤                     │                 │                     │
 │                     │                     │                 │                     │
 │                     │ GET /tasks/{task_id}/stream (SSE)       │                     │
 │                     ├──────────────────>│                 │                     │
 │                     │<──────────────────┤ Progress Events │                     │
 │  실시간 Narration   │<──────────────────┤                 │                     │
 │<────────────────────┤                     │                 │                     │
 │                     │                     │                 │                     │
 │  완료 후            │                     │                 │                     │
 │  Concept Board 표시 │                     │                 │                     │
 │<────────────────────┤                     │                 │                     │
```

---

## 5. 에러 처리 가이드

### 5.1 타임아웃 처리
- Meeting From URL: 최대 2분
- Campaign 생성: 최대 5분
- Shorts 생성: 최대 10분

타임아웃 발생 시:
- HTTP 504 Gateway Timeout
- 진행 중이던 작업은 백그라운드에서 계속 실행
- 사용자는 Task ID로 나중에 결과 확인 가능

### 5.2 에이전트 실행 오류
- LLM API 에러 → 최대 3회 재시도
- 재시도 실패 시 → HTTP 500, `AGENT_ERROR` 코드 반환

### 5.3 YouTube Rate Limiting
- 429 에러 발생 시 → Soft-fail 처리
- 자막 다운로드 실패해도 계속 진행 (Audio + STT 사용)

---

## 6. 성능 최적화

### 6.1 캐싱
- Meeting Summary: Redis 캐시 (1시간)
- Campaign Brief: Redis 캐시 (30분)
- Concept Board 데이터: Redis 캐시 (10분)

### 6.2 병렬 처리
- 각 Concept별 산출물 생성: 병렬 실행
- 키프레임 이미지 생성: 병렬 실행 (최대 6개 동시)

### 6.3 데이터 압축
- JSON 응답: gzip 압축
- 이미지: WebP 포맷, 최적화

---

**문서 상태**: ✅ 완성
**다음 문서**: [AGENTS_DEMO_SPEC.md](./AGENTS_DEMO_SPEC.md)
**버전**: v1.0
**최종 수정**: 2025-11-25
