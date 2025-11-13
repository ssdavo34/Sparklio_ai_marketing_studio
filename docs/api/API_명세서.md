# 🔌 Sparklio AI 마케팅 스튜디오 - API 명세서

## 목차

1. [개요](#개요)
2. [인증 및 권한](#인증-및-권한)
3. [공통 응답 형식](#공통-응답-형식)
4. [에러 코드](#에러-코드)
5. [API 엔드포인트](#api-엔드포인트)
   - [인증](#인증)
   - [브랜드 분석](#브랜드-분석)
   - [마케팅 브리프](#마케팅-브리프)
   - [상품 상세/브로셔](#상품-상세브로셔)
   - [SNS 마케팅](#sns-마케팅)
   - [프레젠테이션](#프레젠테이션)
   - [광고 영상/쇼츠](#광고-영상쇼츠)
   - [발행 관리](#발행-관리)
6. [WebSocket API](#websocket-api)
7. [Rate Limiting](#rate-limiting)

---

## 개요

### 기본 정보

- **Base URL**: `https://api.sparklio.ai/v1`
- **프로토콜**: HTTPS
- **인코딩**: UTF-8
- **요청 형식**: JSON
- **응답 형식**: JSON

### API 버전

현재 버전: **v1.0.0**

새로운 기능이 추가되거나 변경사항이 있을 경우, 기존 API는 최소 6개월간 유지됩니다.

---

## 인증 및 권한

### JWT 기반 인증

모든 API 요청은 JWT (JSON Web Token)를 사용하여 인증합니다.

#### 인증 헤더

```http
Authorization: Bearer <access_token>
```

#### 토큰 갱신

Access Token은 30분 후 만료되며, Refresh Token을 사용하여 갱신할 수 있습니다.

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "your_refresh_token"
}
```

---

## 공통 응답 형식

### 성공 응답

```json
{
  "success": true,
  "data": {
    // 응답 데이터
  },
  "message": "요청이 성공적으로 처리되었습니다.",
  "timestamp": "2025-11-13T10:30:00Z"
}
```

### 실패 응답

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "입력 데이터가 유효하지 않습니다.",
    "details": {
      "field": "email",
      "reason": "올바른 이메일 형식이 아닙니다."
    }
  },
  "timestamp": "2025-11-13T10:30:00Z"
}
```

---

## 에러 코드

| 코드 | HTTP 상태 | 설명 |
|------|-----------|------|
| `SUCCESS` | 200 | 요청 성공 |
| `CREATED` | 201 | 리소스 생성 성공 |
| `BAD_REQUEST` | 400 | 잘못된 요청 |
| `UNAUTHORIZED` | 401 | 인증 실패 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스를 찾을 수 없음 |
| `CONFLICT` | 409 | 리소스 충돌 |
| `RATE_LIMIT_EXCEEDED` | 429 | 요청 한도 초과 |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 내부 오류 |
| `SERVICE_UNAVAILABLE` | 503 | 서비스 일시 중단 |

---

## API 엔드포인트

## 인증

### 회원가입

사용자 계정을 생성합니다.

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123!",
  "name": "홍길동",
  "company": "스파클리오",
  "phone": "010-1234-5678"
}
```

**응답:**

```json
{
  "success": true,
  "data": {
    "user_id": "usr_abc123",
    "email": "user@example.com",
    "name": "홍길동",
    "created_at": "2025-11-13T10:30:00Z"
  },
  "message": "회원가입이 완료되었습니다."
}
```

### 로그인

사용자 인증 후 액세스 토큰을 발급합니다.

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

**응답:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 1800,
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "홍길동"
    }
  },
  "message": "로그인 성공"
}
```

---

## 브랜드 분석

### 브랜드 자동 분석

로고, 웹사이트, PDF 등을 업로드하여 브랜드 키트를 자동 생성합니다.

```http
POST /brand/analyze
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "logo_url": "https://example.com/logo.png",
  "website_url": "https://example.com",
  "additional_files": [
    "https://example.com/brand_guideline.pdf"
  ],
  "industry": "IT/소프트웨어",
  "target_market": "B2B"
}
```

**응답:**

```json
{
  "success": true,
  "data": {
    "brand_kit_id": "bk_xyz789",
    "colors": {
      "primary": "#FF5733",
      "secondary": "#C70039",
      "accent": "#900C3F",
      "palette": ["#FF5733", "#C70039", "#900C3F", "#581845"]
    },
    "fonts": {
      "primary": "Pretendard",
      "secondary": "Noto Sans KR",
      "heading": "Montserrat"
    },
    "tone_and_manner": {
      "tone": "전문적이면서도 친근한",
      "style": "간결하고 명확한 표현",
      "personality": ["혁신적", "신뢰할 수 있는", "사용자 중심"]
    },
    "key_messages": [
      "AI로 마케팅을 혁신합니다",
      "모든 브랜드 콘텐츠를 하나의 플랫폼에서",
      "전문가 수준의 결과물을 자동으로"
    ],
    "target_audience": {
      "primary": "중소기업 마케팅 담당자",
      "secondary": ["스타트업 창업자", "프리랜서 디자이너"],
      "demographics": {
        "age_range": "25-45세",
        "occupation": "마케팅, 디자인, 경영"
      }
    },
    "created_at": "2025-11-13T10:30:00Z",
    "status": "completed"
  },
  "message": "브랜드 분석이 완료되었습니다."
}
```

### 브랜드 키트 조회

```http
GET /brand/{brand_kit_id}
Authorization: Bearer <access_token>
```

**응답:** 위의 브랜드 분석 응답과 동일

### 브랜드 키트 수정

```http
PATCH /brand/{brand_kit_id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "colors": {
    "primary": "#1E90FF"
  },
  "tone_and_manner": {
    "tone": "더욱 친근하고 캐주얼한"
  }
}
```

---

## 마케팅 브리프

### 브리프 생성 (챗 기반)

챗봇과의 대화를 통해 마케팅 브리프를 생성합니다.

```http
POST /brief/create
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "brand_kit_id": "bk_xyz789",
  "initial_input": "신제품 런칭 캠페인을 진행하려고 합니다."
}
```

**응답:**

```json
{
  "success": true,
  "data": {
    "brief_id": "brief_123abc",
    "status": "in_progress",
    "conversation_id": "conv_456def",
    "next_question": {
      "question": "어떤 제품인지 간단히 설명해주시겠어요? 제품의 주요 특징이나 혁신적인 점을 알려주세요.",
      "type": "text",
      "suggestions": [
        "B2B SaaS 제품입니다",
        "소비자용 앱입니다",
        "하드웨어 제품입니다"
      ]
    }
  },
  "message": "브리프 생성이 시작되었습니다."
}
```

### 브리프 대화 계속하기

```http
POST /brief/{brief_id}/respond
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "response": "B2B SaaS 제품으로, AI 기반 마케팅 자동화 도구입니다.",
  "conversation_id": "conv_456def"
}
```

**응답:**

```json
{
  "success": true,
  "data": {
    "brief_id": "brief_123abc",
    "status": "in_progress",
    "progress": 20,
    "next_question": {
      "question": "주요 타깃 고객은 누구인가요? 업종, 기업 규모, 담당자 직군 등을 알려주세요.",
      "type": "text"
    }
  }
}
```

### 브리프 완성 및 초안 생성

모든 질문에 답변하면 AI가 브리프 초안을 생성합니다.

**응답:**

```json
{
  "success": true,
  "data": {
    "brief_id": "brief_123abc",
    "status": "draft_ready",
    "draft": {
      "campaign_name": "AI 마케팅 혁신 2025",
      "objective": "신제품 인지도 향상 및 리드 1000건 확보",
      "target_audience": {
        "primary": "중소기업 마케팅 담당자 (직원 50-200명)",
        "secondary": "스타트업 창업자"
      },
      "key_messages": [
        "AI가 마케팅 업무를 80% 줄여줍니다",
        "전문가 없이도 프로 수준의 콘텐츠 제작",
        "월 100만원으로 마케팅팀 효과"
      ],
      "channels": ["LinkedIn", "YouTube", "네이버 블로그", "구글 검색광고"],
      "budget": {
        "total": 5000000,
        "breakdown": {
          "ad_spend": 3000000,
          "content_production": 1500000,
          "tools": 500000
        }
      },
      "timeline": {
        "start_date": "2025-12-01",
        "end_date": "2026-02-28",
        "key_milestones": [
          {
            "date": "2025-12-15",
            "milestone": "티저 캠페인 시작"
          },
          {
            "date": "2026-01-10",
            "milestone": "정식 출시"
          }
        ]
      },
      "kpis": [
        {
          "metric": "웹사이트 방문자",
          "target": 10000,
          "unit": "명"
        },
        {
          "metric": "리드 확보",
          "target": 1000,
          "unit": "건"
        },
        {
          "metric": "전환율",
          "target": 10,
          "unit": "%"
        }
      ]
    },
    "review_buffer": {
      "message": "초안이 생성되었습니다. 내용을 검토하시고 수정할 부분이 있다면 수정 후 [생성] 버튼을 눌러주세요.",
      "editable": true
    }
  },
  "message": "브리프 초안이 준비되었습니다."
}
```

### 브리프 확정

```http
POST /brief/{brief_id}/confirm
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "draft": {
    // 수정된 초안 (선택사항)
  }
}
```

**응답:**

```json
{
  "success": true,
  "data": {
    "brief_id": "brief_123abc",
    "status": "confirmed",
    "confirmed_at": "2025-11-13T11:00:00Z"
  },
  "message": "마케팅 브리프가 확정되었습니다."
}
```

---

## 상품 상세/브로셔

### 상품 상세 페이지 생성

```http
POST /product/detail
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "brand_kit_id": "bk_xyz789",
  "brief_id": "brief_123abc",
  "product": {
    "name": "Sparklio AI Studio",
    "category": "B2B SaaS",
    "description": "AI 기반 마케팅 자동화 플랫폼",
    "features": [
      "멀티 에이전트 시스템",
      "통합 에디터",
      "16개 LLM 모델 지원"
    ],
    "pricing": {
      "basic": 49000,
      "pro": 99000,
      "enterprise": "문의"
    },
    "images": [
      "https://example.com/product1.jpg",
      "https://example.com/product2.jpg"
    ]
  },
  "layout": "modern_grid",
  "tone": "professional"
}
```

**응답:**

```json
{
  "success": true,
  "data": {
    "detail_page_id": "pd_abc123",
    "status": "draft",
    "content": {
      "hero_section": {
        "headline": "AI가 만드는 마케팅의 미래",
        "subheadline": "전문가 없이도 프로 수준의 콘텐츠를 자동으로 생성하세요",
        "cta_text": "무료로 시작하기",
        "background_image": "https://cdn.sparklio.ai/generated/hero_bg_xyz.jpg"
      },
      "feature_sections": [
        {
          "title": "16개 AI 에이전트가 협업합니다",
          "description": "각 분야의 전문 에이전트가 A2A 프로토콜로 소통하며 최적의 결과물을 만듭니다.",
          "image": "https://cdn.sparklio.ai/generated/feature1.jpg"
        }
      ],
      "testimonials": [],
      "pricing_section": {
        "plans": [
          {
            "name": "베이직",
            "price": 49000,
            "features": ["월 100개 콘텐츠 생성", "5GB 저장공간"]
          }
        ]
      }
    },
    "editor_url": "https://app.sparklio.ai/editor/pd_abc123"
  },
  "message": "상품 상세 페이지 초안이 생성되었습니다."
}
```

---

## SNS 마케팅

### SNS 콘텐츠 생성

```http
POST /sns/generate
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "brand_kit_id": "bk_xyz789",
  "brief_id": "brief_123abc",
  "platforms": ["instagram", "facebook", "twitter", "linkedin"],
  "content_type": "product_launch",
  "tone": "engaging",
  "include_hashtags": true,
  "image_style": "modern_gradient"
}
```

**응답:**

```json
{
  "success": true,
  "data": {
    "sns_set_id": "sns_set_789",
    "contents": [
      {
        "platform": "instagram",
        "caption": "🚀 마케팅의 패러다임이 바뀝니다!\n\nAI가 만드는 콘텐츠, 이제 전문가 없이도 가능합니다.\nSparklio AI Studio와 함께 마케팅 혁신을 경험하세요.\n\n✨ 16개 AI 에이전트\n📊 자동화된 워크플로우\n💎 프로 수준의 결과물\n\n지금 바로 무료로 시작하세요 👉 링크는 프로필에서",
        "hashtags": [
          "#마케팅자동화",
          "#AI마케팅",
          "#콘텐츠제작",
          "#디지털마케팅",
          "#스타트업마케팅"
        ],
        "image": {
          "url": "https://cdn.sparklio.ai/generated/instagram_post_xyz.jpg",
          "size": "1080x1080",
          "format": "jpg"
        },
        "optimal_posting_time": "2025-11-13T19:00:00Z"
      },
      {
        "platform": "linkedin",
        "caption": "AI 기반 마케팅 자동화의 새로운 기준, Sparklio AI Studio를 소개합니다.\n\n중소기업과 스타트업의 마케팅 담당자들은 항상 시간과 예산 부족에 시달립니다. Sparklio는 이 문제를 AI로 해결합니다.\n\n주요 기능:\n• 멀티 에이전트 시스템으로 전문가 수준의 콘텐츠 자동 생성\n• 브랜드 분석부터 발행까지 End-to-End 자동화\n• 16개 LLM 모델을 비용·속도·품질 기준으로 자동 선택\n\n마케팅 업무 시간을 80% 줄이고 싶으신가요?\n지금 바로 무료 트라이얼을 시작하세요.",
        "image": {
          "url": "https://cdn.sparklio.ai/generated/linkedin_post_xyz.jpg",
          "size": "1200x627",
          "format": "jpg"
        },
        "optimal_posting_time": "2025-11-14T09:00:00Z"
      }
    ],
    "editor_url": "https://app.sparklio.ai/editor/sns_set_789"
  },
  "message": "SNS 콘텐츠가 생성되었습니다."
}
```

---

## 프레젠테이션

### 프레젠테이션 생성

```http
POST /presentation/generate
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "brand_kit_id": "bk_xyz789",
  "brief_id": "brief_123abc",
  "title": "Sparklio AI Studio 제품 소개",
  "purpose": "투자 유치",
  "duration_minutes": 15,
  "slide_count": 12,
  "style": "modern_corporate"
}
```

**응답:**

```json
{
  "success": true,
  "data": {
    "presentation_id": "pres_456",
    "title": "Sparklio AI Studio 제품 소개",
    "total_slides": 12,
    "slides": [
      {
        "slide_number": 1,
        "layout": "title_slide",
        "content": {
          "title": "Sparklio AI Studio",
          "subtitle": "AI가 만드는 마케팅의 미래",
          "background_image": "https://cdn.sparklio.ai/generated/slide1_bg.jpg"
        }
      },
      {
        "slide_number": 2,
        "layout": "content_with_image",
        "content": {
          "title": "문제 정의",
          "bullet_points": [
            "중소기업은 마케팅 전문 인력 부족",
            "콘텐츠 제작 비용 월 500만원 이상",
            "일관된 브랜딩 유지 어려움"
          ],
          "image": "https://cdn.sparklio.ai/generated/slide2_img.jpg"
        }
      }
    ],
    "estimated_duration": 15,
    "editor_url": "https://app.sparklio.ai/editor/pres_456",
    "export_formats": ["pptx", "pdf", "google_slides"]
  },
  "message": "프레젠테이션이 생성되었습니다."
}
```

---

## 광고 영상/쇼츠

### 영상 스토리보드 생성

```http
POST /video/storyboard
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "brand_kit_id": "bk_xyz789",
  "brief_id": "brief_123abc",
  "video_type": "product_ad",
  "duration_seconds": 30,
  "platform": "youtube_shorts",
  "style": "dynamic_motion",
  "include_voiceover": true,
  "music_genre": "upbeat_electronic"
}
```

**응답:**

```json
{
  "success": true,
  "data": {
    "storyboard_id": "sb_999",
    "total_duration": 30,
    "scenes": [
      {
        "scene_number": 1,
        "duration": 3,
        "description": "로고 애니메이션 - 화면 중앙에서 Sparklio 로고가 파티클 효과와 함께 등장",
        "visual": {
          "type": "animation",
          "elements": ["logo", "particles"],
          "transition": "fade_in"
        },
        "audio": {
          "voiceover": null,
          "sound_effects": ["whoosh", "sparkle"],
          "music": "intro"
        }
      },
      {
        "scene_number": 2,
        "duration": 5,
        "description": "문제 제기 - 마케팅 담당자가 복잡한 툴들 앞에서 고민하는 모습",
        "visual": {
          "type": "motion_graphics",
          "elements": ["character", "multiple_apps", "stress_effects"]
        },
        "audio": {
          "voiceover": "마케팅 콘텐츠 제작, 왜 이렇게 복잡하고 비싸야 할까요?",
          "music": "tension"
        }
      },
      {
        "scene_number": 3,
        "duration": 8,
        "description": "솔루션 제시 - Sparklio 인터페이스가 등장하며 자동화 프로세스 시연",
        "visual": {
          "type": "screen_recording",
          "elements": ["app_interface", "auto_generation", "highlight_features"]
        },
        "audio": {
          "voiceover": "Sparklio는 AI가 모든 과정을 자동화합니다. 브랜드 분석부터 콘텐츠 발행까지, 하나의 플랫폼에서.",
          "music": "uplifting"
        }
      },
      {
        "scene_number": 4,
        "duration": 7,
        "description": "주요 기능 소개 - 3가지 핵심 기능을 빠르게 전환하며 보여줌",
        "visual": {
          "type": "feature_showcase",
          "elements": ["16_agents", "unified_editor", "multi_llm"]
        },
        "audio": {
          "voiceover": "16개 AI 에이전트, 통합 에디터, 그리고 최고의 LLM 모델들을 자동으로 선택합니다.",
          "music": "energetic"
        }
      },
      {
        "scene_number": 5,
        "duration": 7,
        "description": "CTA - 무료 체험 안내 및 로고와 함께 마무리",
        "visual": {
          "type": "cta_screen",
          "elements": ["free_trial_button", "logo", "website_url"]
        },
        "audio": {
          "voiceover": "지금 바로 무료로 시작하세요. Sparklio.ai",
          "music": "outro"
        }
      }
    ],
    "video_studio_url": "https://app.sparklio.ai/video-studio/sb_999",
    "status": "draft"
  },
  "message": "스토리보드가 생성되었습니다."
}
```

### 영상 렌더링 요청

```http
POST /video/{storyboard_id}/render
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "resolution": "1080x1920",
  "fps": 30,
  "format": "mp4",
  "quality": "high"
}
```

**응답:**

```json
{
  "success": true,
  "data": {
    "render_job_id": "rj_777",
    "status": "queued",
    "estimated_completion": "2025-11-13T12:00:00Z",
    "progress_url": "wss://api.sparklio.ai/video/render/rj_777/progress"
  },
  "message": "렌더링이 시작되었습니다."
}
```

---

## 발행 관리

### 발행 예약

```http
POST /publish/schedule
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content_id": "sns_set_789",
  "content_type": "sns_post",
  "platforms": [
    {
      "name": "instagram",
      "account_id": "ig_account_123",
      "scheduled_time": "2025-11-13T19:00:00Z"
    },
    {
      "name": "facebook",
      "account_id": "fb_account_456",
      "scheduled_time": "2025-11-13T19:00:00Z"
    }
  ]
}
```

**응답:**

```json
{
  "success": true,
  "data": {
    "schedule_id": "sch_888",
    "total_platforms": 2,
    "scheduled_posts": [
      {
        "platform": "instagram",
        "post_id": "post_ig_123",
        "scheduled_time": "2025-11-13T19:00:00Z",
        "status": "scheduled"
      },
      {
        "platform": "facebook",
        "post_id": "post_fb_456",
        "scheduled_time": "2025-11-13T19:00:00Z",
        "status": "scheduled"
      }
    ]
  },
  "message": "발행이 예약되었습니다."
}
```

---

## WebSocket API

실시간 업데이트를 위한 WebSocket 연결

### 연결

```javascript
const ws = new WebSocket('wss://api.sparklio.ai/ws');

// 인증
ws.send(JSON.stringify({
  type: 'auth',
  token: 'your_access_token'
}));
```

### 이벤트 구독

```javascript
// 특정 작업 진행상황 구독
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'job_progress',
  job_id: 'rj_777'
}));
```

### 서버 메시지

```json
{
  "type": "job_progress",
  "data": {
    "job_id": "rj_777",
    "progress": 45,
    "status": "rendering",
    "current_step": "씬 3/5 렌더링 중",
    "estimated_time_remaining": 120
  }
}
```

---

## Rate Limiting

### 제한 정책

| 플랜 | 시간당 요청 | 일일 요청 | 동시 연결 |
|------|------------|----------|-----------|
| Free | 100 | 1,000 | 5 |
| Basic | 500 | 10,000 | 10 |
| Pro | 2,000 | 50,000 | 25 |
| Enterprise | 무제한 | 무제한 | 무제한 |

### Rate Limit 헤더

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699876800
```

### 한도 초과 시

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "요청 한도를 초과했습니다. 1시간 후 다시 시도해주세요.",
    "retry_after": 3600
  }
}
```

---

## 추가 리소스

- [개발 가이드](../guides/개발_가이드.md)
- [인증 가이드](./인증_가이드.md)
- [웹훅 가이드](./웹훅_가이드.md)
- [Postman 컬렉션](https://www.postman.com/sparklio/sparklio-api)

---

**작성일**: 2025-11-13
**버전**: 1.0.0
**문의**: api-support@sparklio.ai
