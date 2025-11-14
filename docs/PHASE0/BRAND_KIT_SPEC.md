# Brand Kit System Specification

> **Version**: 1.0
> **Date**: 2025-11-14 (목요일)
> **Status**: Draft
> **Owner**: Team A (Documentation & Architecture)

---

## 1. Overview

**Brand Kit**은 Sparklio.ai의 핵심 데이터 구조로, 브랜드의 시각적·언어적 아이덴티티를 저장하고 관리하는 시스템입니다. 모든 콘텐츠 생성 시 Brand Kit을 참조하여 **브랜드 일관성**을 유지합니다.

### 1.1 핵심 목표

1. **브랜드 아이덴티티 중앙 관리**: 색상, 폰트, 로고, 톤앤매너를 한곳에서 관리
2. **자동 학습 및 업데이트**: 사용자 업로드 자료 및 피드백 기반 자동 개선 (BRAND_LEARNING_ENGINE.md 연동)
3. **AI 생성 품질 향상**: 모든 Agent가 Brand Kit을 참조하여 일관된 결과물 생성
4. **멀티 버전 관리**: 브랜드 진화에 따른 버전 히스토리 추적

### 1.2 주요 기능

- **자동 추출**: PDF/PPT/이미지에서 색상·폰트·톤 자동 분석 (BRAND_LEARNING_ENGINE.md §3)
- **수동 편집**: 사용자 직접 색상·로고·가이드라인 입력
- **LoRA 통합**: 브랜드 특화 이미지 생성 모델 연동 (Phase 2)
- **RAG 참조**: 브랜드 관련 문서·가이드라인을 RAG로 검색 (DATA_PIPELINE_PLAN.md 연동)
- **A/B 테스트 반영**: 고성과 패턴을 Brand Kit에 자동 강화 (BRAND_LEARNING_ENGINE.md §7)

---

## 2. Data Schema

### 2.1 Core Schema (PostgreSQL)

```sql
-- 브랜드 기본 정보
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),  -- 'cosmetics', 'fitness', 'cafe', 'saas', etc.
    description TEXT,
    website_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand Kit (메인)
CREATE TABLE brand_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id),
    version INTEGER DEFAULT 1,

    -- Visual Identity
    colors JSONB NOT NULL DEFAULT '{}',
    fonts JSONB NOT NULL DEFAULT '{}',
    logos JSONB NOT NULL DEFAULT '[]',

    -- Tone & Style
    tone_manner JSONB NOT NULL DEFAULT '{}',
    preferred_phrases TEXT[] DEFAULT ARRAY[]::TEXT[],
    avoided_phrases TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Layout Preferences
    layout_patterns JSONB DEFAULT '{}',

    -- AI Assets
    lora_model_path TEXT,
    style_embedding VECTOR(768),

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    learning_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(brand_id, version)
);

-- Brand Kit 변경 이력
CREATE TABLE brand_kit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_kit_id UUID REFERENCES brand_kits(id),
    changed_by UUID REFERENCES users(id),
    change_type VARCHAR(50),  -- 'manual_edit', 'auto_learn', 'ab_test_win'
    changes JSONB NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 브랜드 에셋 (로고, 이미지, 가이드라인 PDF 등)
CREATE TABLE brand_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id),
    asset_type VARCHAR(50),  -- 'logo', 'guideline_pdf', 'image', 'video'
    file_name VARCHAR(255),
    storage_path TEXT NOT NULL,  -- MinIO path
    mime_type VARCHAR(100),
    file_size_bytes BIGINT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_brand_kits_brand_id ON brand_kits(brand_id);
CREATE INDEX idx_brand_kits_active ON brand_kits(brand_id, is_active);
CREATE INDEX idx_brand_assets_brand_id ON brand_assets(brand_id);
CREATE INDEX idx_brand_kit_history_kit_id ON brand_kit_history(brand_kit_id);
```

### 2.2 Colors Schema (JSONB)

```json
{
  "palette": {
    "primary": {
      "hex": "#F2EDE8",
      "rgb": [242, 237, 232],
      "cmyk": [0, 2, 4, 5],
      "usage": "메인 배경, 전체 톤"
    },
    "secondary": {
      "hex": "#7C4D3A",
      "rgb": [124, 77, 58],
      "cmyk": [0, 38, 53, 51],
      "usage": "강조 텍스트, CTA 버튼"
    },
    "accent": {
      "hex": "#D4AF37",
      "rgb": [212, 175, 55],
      "cmyk": [0, 18, 74, 17],
      "usage": "포인트, 아이콘"
    },
    "text": {
      "dark": "#2C2C2C",
      "light": "#F5F5F5"
    },
    "background": {
      "white": "#FFFFFF",
      "light": "#F9F9F9",
      "dark": "#1A1A1A"
    }
  },
  "color_rules": {
    "saturation_range": [0.4, 0.8],
    "brightness_range": [0.3, 0.9],
    "contrast_ratio": 4.5,  // WCAG AA 준수
    "harmony_type": "analogous"  // 'analogous', 'complementary', 'triadic', 'monochromatic'
  },
  "extracted_from": [
    {
      "source": "brand_logo.png",
      "colors": ["#F2EDE8", "#7C4D3A"],
      "confidence": 0.95
    },
    {
      "source": "website_screenshot.png",
      "colors": ["#D4AF37"],
      "confidence": 0.87
    }
  ]
}
```

### 2.3 Fonts Schema (JSONB)

```json
{
  "typography": {
    "heading": {
      "family": "Montserrat",
      "weights": [600, 700, 800],
      "fallback": ["Helvetica Neue", "Arial", "sans-serif"],
      "usage": "타이틀, 헤드라인",
      "size_range": {
        "min": 24,
        "max": 72,
        "unit": "px"
      }
    },
    "body": {
      "family": "Noto Sans KR",
      "weights": [400, 500],
      "fallback": ["맑은 고딕", "Apple Gothic", "sans-serif"],
      "usage": "본문, 설명",
      "size_range": {
        "min": 14,
        "max": 18,
        "unit": "px"
      }
    },
    "accent": {
      "family": "Playfair Display",
      "weights": [400, 700],
      "fallback": ["Georgia", "serif"],
      "usage": "특별 강조, 캐치프레이즈",
      "size_range": {
        "min": 20,
        "max": 48,
        "unit": "px"
      }
    }
  },
  "font_rules": {
    "heading_body_ratio": 1.5,  // 헤딩이 본문 대비 1.5배 크기
    "line_height_ratio": 1.6,
    "letter_spacing": {
      "heading": "0.02em",
      "body": "0em"
    }
  },
  "extracted_from": [
    {
      "source": "brand_guidelines.pdf",
      "fonts": ["Montserrat", "Noto Sans KR"],
      "confidence": 1.0
    }
  ]
}
```

### 2.4 Logos Schema (JSONB Array)

```json
[
  {
    "logo_id": "logo_main_color",
    "type": "primary",  // 'primary', 'secondary', 'icon', 'wordmark'
    "variants": [
      {
        "variant_id": "main_color",
        "storage_path": "brands/brand_12345/logos/main_color.png",
        "format": "png",
        "dimensions": {
          "width": 1200,
          "height": 400
        },
        "usage": "메인 로고 (컬러 배경)",
        "background": "light"
      },
      {
        "variant_id": "main_white",
        "storage_path": "brands/brand_12345/logos/main_white.png",
        "format": "png",
        "dimensions": {
          "width": 1200,
          "height": 400
        },
        "usage": "어두운 배경용",
        "background": "dark"
      }
    ],
    "safe_zone": {
      "top": 20,
      "right": 20,
      "bottom": 20,
      "left": 20,
      "unit": "px"
    },
    "min_size": {
      "width": 120,
      "height": 40,
      "unit": "px"
    }
  },
  {
    "logo_id": "logo_icon",
    "type": "icon",
    "variants": [
      {
        "variant_id": "icon_square",
        "storage_path": "brands/brand_12345/logos/icon_square.svg",
        "format": "svg",
        "dimensions": {
          "width": 512,
          "height": 512
        },
        "usage": "프로필 이미지, 파비콘"
      }
    ]
  }
]
```

### 2.5 Tone & Manner Schema (JSONB)

```json
{
  "tone": {
    "formality": "casual",  // 'formal', 'casual', 'balanced'
    "emotion": "warm",  // 'warm', 'neutral', 'energetic', 'professional'
    "voice": "friendly",  // 'authoritative', 'friendly', 'playful', 'inspirational'
    "perspective": "we",  // 'I', 'we', 'you', 'third-person'
    "politeness": "존댓말",  // '존댓말', '반말', '혼합'
    "emotion_ratio": 0.7  // 감성:이성 비율 (0.0=완전 이성, 1.0=완전 감성)
  },
  "writing_style": {
    "sentence_length": "short",  // 'short' (<15 words), 'medium' (15-25), 'long' (>25)
    "paragraph_structure": "simple",  // 'simple' (단문), 'complex' (복문)
    "active_voice_ratio": 0.8,  // 능동태 사용 비율
    "question_usage": "moderate",  // 'rare', 'moderate', 'frequent'
    "emoji_usage": "minimal"  // 'none', 'minimal', 'moderate', 'frequent'
  },
  "message_structure": {
    "opening": "문제 제기 또는 공감",
    "body": "솔루션 설명 → 혜택 강조",
    "closing": "명확한 CTA"
  },
  "examples": [
    {
      "context": "신제품 출시 공지",
      "good": "드디어 만나요! 여러분이 기다리던 신제품이 출시됐어요. 지금 바로 만나보세요 💚",
      "bad": "신제품 출시 알림. 당사는 고객님을 위해 새로운 제품을 준비했습니다."
    }
  ],
  "extracted_from": [
    {
      "source": "social_media_posts",
      "sample_count": 47,
      "confidence": 0.92
    }
  ]
}
```

### 2.6 Preferred/Avoided Phrases

```sql
-- TEXT[] 배열로 저장
preferred_phrases: [
  "자연 그대로",
  "균형 잡힌",
  "프리미엄 경험",
  "지속 가능한",
  "당신만을 위한"
]

avoided_phrases: [
  "최저가",
  "폭탄 세일",
  "지금 바로 구매",
  "놓치면 후회"
]
```

### 2.7 Layout Patterns Schema (JSONB)

```json
{
  "composition": {
    "alignment": "center",  // 'left', 'center', 'right', 'justified'
    "grid_type": "2-column",  // '1-column', '2-column', 'grid', 'asymmetric'
    "whitespace": "generous",  // 'minimal', 'moderate', 'generous'
    "balance": "symmetric"  // 'symmetric', 'asymmetric'
  },
  "hierarchy": {
    "heading_prominence": "high",  // 'low', 'medium', 'high'
    "image_text_ratio": 0.6,  // 이미지:텍스트 비율 (0.6 = 이미지 60%, 텍스트 40%)
    "cta_position": "bottom-right"  // 'top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'
  },
  "spacing": {
    "padding": {
      "horizontal": 40,
      "vertical": 60,
      "unit": "px"
    },
    "element_gap": 24
  },
  "patterns": [
    {
      "pattern_name": "Hero Image + Overlay Text",
      "usage_count": 23,
      "success_rate": 0.87,
      "example_assets": ["asset_id_1", "asset_id_2"]
    },
    {
      "pattern_name": "Split Screen (Image Left, Text Right)",
      "usage_count": 15,
      "success_rate": 0.79
    }
  ]
}
```

---

## 3. API Endpoints

### 3.1 Brand Kit CRUD

#### 3.1.1 Create Brand Kit

```http
POST /api/v1/brands/{brand_id}/kit
Authorization: Bearer {token}
Content-Type: application/json

{
  "colors": { ... },
  "fonts": { ... },
  "logos": [ ... ],
  "tone_manner": { ... },
  "preferred_phrases": [ ... ],
  "layout_patterns": { ... }
}

Response 201 Created:
{
  "kit_id": "uuid",
  "brand_id": "uuid",
  "version": 1,
  "created_at": "2025-11-14T10:30:00Z"
}
```

#### 3.1.2 Get Brand Kit (Latest Version)

```http
GET /api/v1/brands/{brand_id}/kit
Authorization: Bearer {token}

Response 200 OK:
{
  "kit_id": "uuid",
  "brand_id": "uuid",
  "version": 3,
  "colors": { ... },
  "fonts": { ... },
  "logos": [ ... ],
  "tone_manner": { ... },
  "preferred_phrases": [ ... ],
  "avoided_phrases": [ ... ],
  "layout_patterns": { ... },
  "lora_model_path": "models/lora/brand_12345/v3.safetensors",
  "style_embedding": [...],
  "is_active": true,
  "learning_enabled": true,
  "created_at": "2025-11-14T10:30:00Z",
  "updated_at": "2025-11-14T15:45:00Z"
}
```

#### 3.1.3 Update Brand Kit

```http
PATCH /api/v1/brands/{brand_id}/kit
Authorization: Bearer {token}
Content-Type: application/json

{
  "colors": {
    "palette": {
      "primary": {
        "hex": "#E8F2ED",
        "usage": "새로운 메인 배경"
      }
    }
  },
  "change_reason": "시즌 리브랜딩"
}

Response 200 OK:
{
  "kit_id": "uuid",
  "brand_id": "uuid",
  "version": 4,  // 버전 자동 증가
  "updated_fields": ["colors"],
  "previous_version": 3,
  "updated_at": "2025-11-14T16:00:00Z"
}
```

#### 3.1.4 Get Brand Kit History

```http
GET /api/v1/brands/{brand_id}/kit/history?limit=10
Authorization: Bearer {token}

Response 200 OK:
{
  "brand_id": "uuid",
  "history": [
    {
      "version": 4,
      "changed_by": "user_uuid",
      "change_type": "manual_edit",
      "changes": {
        "colors.palette.primary.hex": {
          "from": "#F2EDE8",
          "to": "#E8F2ED"
        }
      },
      "reason": "시즌 리브랜딩",
      "created_at": "2025-11-14T16:00:00Z"
    },
    {
      "version": 3,
      "changed_by": "system",
      "change_type": "auto_learn",
      "changes": {
        "preferred_phrases": {
          "added": ["지속 가능한"]
        }
      },
      "reason": "Self-Learning Loop - 고성과 패턴 반영",
      "created_at": "2025-11-14T12:00:00Z"
    }
  ],
  "total": 4
}
```

### 3.2 Asset Upload & Analysis

#### 3.2.1 Upload Brand Asset

```http
POST /api/v1/brands/{brand_id}/assets
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "file": <binary>,
  "asset_type": "guideline_pdf",  // 'logo', 'guideline_pdf', 'image', 'video'
  "auto_extract": true  // 자동으로 Brand Kit 업데이트 여부
}

Response 202 Accepted:
{
  "asset_id": "uuid",
  "brand_id": "uuid",
  "file_name": "brand_guidelines_2025.pdf",
  "storage_path": "brands/brand_12345/assets/brand_guidelines_2025.pdf",
  "mime_type": "application/pdf",
  "file_size_bytes": 2485760,
  "status": "processing",  // 'processing', 'completed', 'failed'
  "extraction_task_id": "celery_task_uuid"
}
```

#### 3.2.2 Get Asset Extraction Status

```http
GET /api/v1/brands/{brand_id}/assets/{asset_id}/extraction
Authorization: Bearer {token}

Response 200 OK:
{
  "asset_id": "uuid",
  "status": "completed",
  "extracted_data": {
    "colors": ["#F2EDE8", "#7C4D3A", "#D4AF37"],
    "fonts": ["Montserrat", "Noto Sans KR"],
    "keywords": ["프리미엄", "자연", "균형"],
    "tone_analysis": {
      "formality": "casual",
      "emotion": "warm"
    }
  },
  "applied_to_kit": true,
  "kit_version_updated": 5
}
```

### 3.3 Brand Kit Analysis

#### 3.3.1 Validate Brand Consistency

```http
POST /api/v1/brands/{brand_id}/kit/validate
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": {
    "headline": "지금 바로 구매하세요!",
    "body": "최저가 폭탄 세일",
    "colors_used": ["#FF0000", "#00FF00"],
    "font_family": "Comic Sans MS"
  }
}

Response 200 OK:
{
  "validation_result": {
    "overall_score": 0.32,  // 0.0 ~ 1.0
    "issues": [
      {
        "category": "tone_manner",
        "severity": "high",
        "message": "회피 단어 사용: '지금 바로 구매', '최저가', '폭탄 세일'",
        "suggestion": "브랜드 톤에 맞게 '프리미엄 경험', '자연 그대로' 등의 표현 사용 권장"
      },
      {
        "category": "colors",
        "severity": "high",
        "message": "브랜드 컬러 팔레트와 불일치: #FF0000, #00FF00",
        "suggestion": "권장 색상: #F2EDE8 (primary), #7C4D3A (secondary)"
      },
      {
        "category": "fonts",
        "severity": "medium",
        "message": "브랜드 폰트 아님: Comic Sans MS",
        "suggestion": "권장 폰트: Montserrat (heading), Noto Sans KR (body)"
      }
    ],
    "recommendations": [
      "headline 수정 제안: '당신만을 위한 프리미엄 경험'",
      "색상 팔레트 적용 권장",
      "브랜드 폰트로 변경 필요"
    ]
  }
}
```

### 3.4 Brand Kit Export

#### 3.4.1 Export as PDF

```http
GET /api/v1/brands/{brand_id}/kit/export?format=pdf
Authorization: Bearer {token}

Response 200 OK:
Content-Type: application/pdf
Content-Disposition: attachment; filename="brand_kit_brand_12345.pdf"

<binary PDF data>
```

#### 3.4.2 Export as JSON

```http
GET /api/v1/brands/{brand_id}/kit/export?format=json
Authorization: Bearer {token}

Response 200 OK:
{
  "brand_kit": { ... },
  "exported_at": "2025-11-14T17:00:00Z",
  "version": 5
}
```

---

## 4. Integration with Other Systems

### 4.1 BRAND_LEARNING_ENGINE.md Integration

Brand Kit은 Brand Learning Engine의 핵심 데이터 구조입니다:

```python
# backend/brand_learning/brand_kit_manager.py

from app.models.brand_kit import BrandKit
from app.brand_learning.intake_module import BrandIntakeModule
from app.brand_learning.style_extractor import BrandStyleExtractor

class BrandKitManager:
    """
    Brand Kit 생성·업데이트·조회 관리
    """

    def __init__(self):
        self.intake_module = BrandIntakeModule()
        self.style_extractor = BrandStyleExtractor()

    async def create_from_upload(
        self,
        brand_id: str,
        file_path: str,
        auto_extract: bool = True
    ) -> BrandKit:
        """
        업로드 파일로부터 Brand Kit 생성

        Args:
            brand_id: 브랜드 ID
            file_path: 업로드된 파일 경로 (MinIO)
            auto_extract: 자동 추출 여부

        Returns:
            생성된 Brand Kit
        """
        # 1. 파일 파싱 (BRAND_LEARNING_ENGINE.md §3)
        if auto_extract:
            parsed_data = await self.intake_module.process_upload(file_path)

            # 2. 스타일 추출
            text_styles = await self.style_extractor.extract_text_style(
                parsed_data.get('text', [])
            )
            image_styles = await self.style_extractor.extract_image_style(
                parsed_data.get('images', [])
            )

            # 3. Brand Kit 생성
            brand_kit = await self._build_brand_kit(
                brand_id=brand_id,
                parsed_data=parsed_data,
                text_styles=text_styles,
                image_styles=image_styles
            )
        else:
            # 빈 Brand Kit 생성
            brand_kit = await BrandKit.create(brand_id=brand_id)

        return brand_kit

    async def update_from_learning(
        self,
        brand_id: str,
        learning_data: dict
    ):
        """
        Self-Learning Loop 결과로 Brand Kit 업데이트
        (BRAND_LEARNING_ENGINE.md §5)
        """
        brand_kit = await BrandKit.get_latest(brand_id)

        # 버전 증가
        new_version = brand_kit.version + 1

        # 학습 데이터 반영
        if 'preferred_phrases' in learning_data:
            brand_kit.preferred_phrases.extend(learning_data['preferred_phrases'])

        if 'tone_adjustments' in learning_data:
            brand_kit.tone_manner.update(learning_data['tone_adjustments'])

        # 새 버전 저장
        new_kit = await brand_kit.create_new_version(
            version=new_version,
            change_type='auto_learn',
            reason='Self-Learning Loop 피드백 반영'
        )

        return new_kit

    async def update_from_ab_test(
        self,
        brand_id: str,
        winner_pattern: dict
    ):
        """
        A/B 테스트 승자 패턴을 Brand Kit에 반영
        (BRAND_LEARNING_ENGINE.md §7)
        """
        brand_kit = await BrandKit.get_latest(brand_id)

        # 승자 패턴 강화
        if 'color_scheme' in winner_pattern:
            await self._reinforce_colors(brand_kit, winner_pattern['color_scheme'])

        if 'headline_pattern' in winner_pattern:
            await self._reinforce_phrases(brand_kit, winner_pattern['headline_pattern'])

        # 새 버전 저장
        new_kit = await brand_kit.create_new_version(
            version=brand_kit.version + 1,
            change_type='ab_test_win',
            reason=f"A/B 테스트 승자 패턴 반영 (CTR: {winner_pattern.get('ctr', 0):.2%})"
        )

        return new_kit
```

### 4.2 AGENTS_SPEC.md Integration

모든 Creation Agent는 Brand Kit을 참조하여 콘텐츠 생성:

```python
# backend/agents/copywriter_agent.py

from app.models.brand_kit import BrandKit
from app.agents.base import BaseAgent

class CopywriterAgent(BaseAgent):
    """
    카피라이팅 에이전트 (AGENTS_SPEC.md §4.2)
    """

    async def generate_copy(
        self,
        brief: dict,
        brand_id: str
    ) -> str:
        """
        Brand Kit을 참조하여 브랜드 일관성 있는 카피 생성
        """
        # 1. 최신 Brand Kit 로드
        brand_kit = await BrandKit.get_latest(brand_id)

        # 2. 톤앤매너 반영
        tone_context = self._build_tone_context(brand_kit.tone_manner)

        # 3. 선호 단어 반영
        phrase_hints = self._build_phrase_hints(
            preferred=brand_kit.preferred_phrases,
            avoided=brand_kit.avoided_phrases
        )

        # 4. 프롬프트 구성
        prompt = f"""
        다음 브랜드 가이드를 따라 카피를 작성해주세요:

        ## 브랜드: {brand_kit.brand.name}

        ### 톤앤매너
        - 격식: {tone_context['formality']}
        - 감정: {tone_context['emotion']}
        - 관점: {tone_context['perspective']}

        ### 선호 표현
        {', '.join(brand_kit.preferred_phrases)}

        ### 회피 표현
        {', '.join(brand_kit.avoided_phrases)}

        ### 브리프
        {brief['description']}

        ### 타겟
        {brief.get('target_audience', '일반')}

        ---

        위 가이드를 엄격히 준수하여 카피를 작성해주세요.
        """

        # 5. LLM 생성
        copy = await self.llm_client.generate(prompt)

        # 6. 브랜드 일관성 검증
        validation = await self.validate_brand_consistency(copy, brand_kit)

        if validation['score'] < 0.7:
            # 재생성 또는 수정
            copy = await self._refine_copy(copy, validation['issues'])

        return copy

    def _build_tone_context(self, tone_manner: dict) -> dict:
        """톤앤매너 JSONB → LLM 프롬프트 컨텍스트"""
        tone = tone_manner.get('tone', {})

        return {
            'formality': tone.get('formality', 'casual'),
            'emotion': tone.get('emotion', 'neutral'),
            'voice': tone.get('voice', 'friendly'),
            'perspective': tone.get('perspective', 'we'),
            'politeness': tone.get('politeness', '존댓말')
        }
```

### 4.3 DATA_PIPELINE_PLAN.md Integration (RAG)

Brand Kit 관련 문서·가이드라인을 RAG로 검색:

```python
# backend/services/brand_kit_rag.py

from app.db.models import Embedding
from app.services.embedder import EmbedderService

class BrandKitRAG:
    """
    Brand Kit 관련 문서 RAG 검색
    """

    def __init__(self):
        self.embedder = EmbedderService()

    async def search_guideline(
        self,
        brand_id: str,
        query: str,
        top_k: int = 5
    ) -> list:
        """
        브랜드 가이드라인 문서에서 관련 내용 검색

        Args:
            brand_id: 브랜드 ID
            query: 검색 쿼리 (예: "로고 사용 규칙", "색상 조합 가이드")
            top_k: 상위 K개 결과

        Returns:
            관련 문서 청크 리스트
        """
        # 1. 쿼리 임베딩
        query_embedding = await self.embedder.embed_text(query)

        # 2. 벡터 검색 (pgvector)
        results = await Embedding.search_similar(
            embedding=query_embedding,
            filters={'brand_id': brand_id, 'source_type': 'brand_guideline'},
            top_k=top_k
        )

        return results

    async def augment_prompt_with_guidelines(
        self,
        brand_id: str,
        task_context: str,
        base_prompt: str
    ) -> str:
        """
        프롬프트에 브랜드 가이드라인 컨텍스트 추가
        """
        # 관련 가이드라인 검색
        guidelines = await self.search_guideline(brand_id, task_context, top_k=3)

        if not guidelines:
            return base_prompt

        # 가이드라인 컨텍스트 구성
        guideline_context = "\n\n".join([
            f"[가이드라인 참고]\n{g['chunk_text']}"
            for g in guidelines
        ])

        # 프롬프트 증강
        augmented_prompt = f"""
        {base_prompt}

        ---

        ## 브랜드 가이드라인 참고 자료

        {guideline_context}

        ---

        위 가이드라인을 참고하여 작업해주세요.
        """

        return augmented_prompt
```

### 4.4 LLM_ROUTER_POLICY.md Integration

Brand Kit 기반 모델 라우팅:

```python
# backend/llm/router.py

from app.models.brand_kit import BrandKit

class SmartRouter:
    """
    Smart LLM Router (TECH_DECISION_v1.md §2.4.1)
    """

    async def select_model_for_brand(
        self,
        task: Task,
        brand_id: str
    ) -> str:
        """
        브랜드 특성 기반 모델 선택
        """
        brand_kit = await BrandKit.get_latest(brand_id)

        # 브랜드 복잡도 평가
        complexity = self._assess_brand_complexity(brand_kit)

        # 복잡도 높은 브랜드 → 고품질 모델
        if complexity >= 0.8:
            return self.select_from_preset('high_fidelity')

        # 일반 브랜드 → 균형 모델
        elif complexity >= 0.5:
            return self.select_from_preset('balanced')

        # 단순 브랜드 → 빠른 모델
        else:
            return self.select_from_preset('draft_fast')

    def _assess_brand_complexity(self, brand_kit: BrandKit) -> float:
        """
        Brand Kit 복잡도 평가

        Returns:
            0.0 ~ 1.0 (높을수록 복잡)
        """
        score = 0.0

        # 색상 팔레트 복잡도
        color_count = len(brand_kit.colors.get('palette', {}))
        score += min(color_count / 10, 0.2)

        # 폰트 종류
        font_families = len(brand_kit.fonts.get('typography', {}))
        score += min(font_families / 5, 0.2)

        # 톤앤매너 정교함
        tone_rules = len(brand_kit.tone_manner.get('tone', {}))
        score += min(tone_rules / 10, 0.2)

        # 선호 단어 수
        phrase_count = len(brand_kit.preferred_phrases)
        score += min(phrase_count / 20, 0.2)

        # 레이아웃 패턴 수
        layout_patterns = len(brand_kit.layout_patterns.get('patterns', []))
        score += min(layout_patterns / 10, 0.2)

        return score
```

---

## 5. Brand Kit UI/UX

### 5.1 Brand Kit Editor (Frontend)

```typescript
// frontend/components/brand-kit/BrandKitEditor.tsx

import { useState, useEffect } from 'react';
import { useBrandKit } from '@/hooks/useBrandKit';
import ColorPaletteEditor from './ColorPaletteEditor';
import FontEditor from './FontEditor';
import LogoUploader from './LogoUploader';
import ToneMoodEditor from './ToneMoodEditor';

export default function BrandKitEditor({ brandId }: { brandId: string }) {
  const { brandKit, updateBrandKit, isLoading } = useBrandKit(brandId);
  const [activeTab, setActiveTab] = useState<'colors' | 'fonts' | 'logos' | 'tone'>('colors');

  if (isLoading) {
    return <BrandKitSkeleton />;
  }

  return (
    <div className="brand-kit-editor">
      <header className="editor-header">
        <h1>브랜드 키트</h1>
        <div className="version-info">
          버전 {brandKit.version} ·
          마지막 업데이트: {new Date(brandKit.updated_at).toLocaleString('ko-KR')}
        </div>
      </header>

      <nav className="editor-tabs">
        <button
          className={activeTab === 'colors' ? 'active' : ''}
          onClick={() => setActiveTab('colors')}
        >
          🎨 색상
        </button>
        <button
          className={activeTab === 'fonts' ? 'active' : ''}
          onClick={() => setActiveTab('fonts')}
        >
          Aa 폰트
        </button>
        <button
          className={activeTab === 'logos' ? 'active' : ''}
          onClick={() => setActiveTab('logos')}
        >
          🖼 로고
        </button>
        <button
          className={activeTab === 'tone' ? 'active' : ''}
          onClick={() => setActiveTab('tone')}
        >
          💬 톤앤매너
        </button>
      </nav>

      <main className="editor-content">
        {activeTab === 'colors' && (
          <ColorPaletteEditor
            colors={brandKit.colors}
            onChange={(newColors) => updateBrandKit({ colors: newColors })}
          />
        )}

        {activeTab === 'fonts' && (
          <FontEditor
            fonts={brandKit.fonts}
            onChange={(newFonts) => updateBrandKit({ fonts: newFonts })}
          />
        )}

        {activeTab === 'logos' && (
          <LogoUploader
            logos={brandKit.logos}
            brandId={brandId}
            onUpload={(newLogos) => updateBrandKit({ logos: newLogos })}
          />
        )}

        {activeTab === 'tone' && (
          <ToneMoodEditor
            toneManner={brandKit.tone_manner}
            preferredPhrases={brandKit.preferred_phrases}
            avoidedPhrases={brandKit.avoided_phrases}
            onChange={(updates) => updateBrandKit(updates)}
          />
        )}
      </main>

      <aside className="editor-preview">
        <h3>미리보기</h3>
        <BrandKitPreview brandKit={brandKit} />
      </aside>
    </div>
  );
}
```

### 5.2 Color Palette Editor

```typescript
// frontend/components/brand-kit/ColorPaletteEditor.tsx

import { ColorPicker } from '@/components/ui/ColorPicker';
import { useState } from 'react';

interface ColorPaletteEditorProps {
  colors: any;
  onChange: (colors: any) => void;
}

export default function ColorPaletteEditor({ colors, onChange }: ColorPaletteEditorProps) {
  const [palette, setPalette] = useState(colors.palette || {});

  const updateColor = (colorKey: string, field: string, value: any) => {
    const updatedPalette = {
      ...palette,
      [colorKey]: {
        ...palette[colorKey],
        [field]: value
      }
    };

    setPalette(updatedPalette);
    onChange({ palette: updatedPalette });
  };

  const addColor = () => {
    const newKey = `custom_${Date.now()}`;
    const updatedPalette = {
      ...palette,
      [newKey]: {
        hex: '#CCCCCC',
        usage: '새 색상'
      }
    };

    setPalette(updatedPalette);
    onChange({ palette: updatedPalette });
  };

  return (
    <div className="color-palette-editor">
      <div className="palette-grid">
        {Object.entries(palette).map(([key, color]: [string, any]) => (
          <div key={key} className="color-item">
            <div className="color-header">
              <label>{key}</label>
              <button
                className="btn-remove"
                onClick={() => {
                  const { [key]: removed, ...rest } = palette;
                  setPalette(rest);
                  onChange({ palette: rest });
                }}
              >
                ×
              </button>
            </div>

            <ColorPicker
              color={color.hex}
              onChange={(newHex) => updateColor(key, 'hex', newHex)}
            />

            <div className="color-swatch" style={{ backgroundColor: color.hex }}>
              {color.hex}
            </div>

            <input
              type="text"
              placeholder="사용 용도"
              value={color.usage || ''}
              onChange={(e) => updateColor(key, 'usage', e.target.value)}
              className="input-usage"
            />
          </div>
        ))}
      </div>

      <button onClick={addColor} className="btn-add-color">
        + 색상 추가
      </button>

      <div className="color-rules">
        <h4>색상 규칙</h4>
        <div className="rule-item">
          <label>채도 범위</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={colors.color_rules?.saturation_range?.[0] || 0.4}
            onChange={(e) => {
              const newRules = {
                ...colors.color_rules,
                saturation_range: [parseFloat(e.target.value), colors.color_rules?.saturation_range?.[1] || 0.8]
              };
              onChange({ color_rules: newRules });
            }}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

```python
# tests/test_brand_kit.py

import pytest
from app.models.brand_kit import BrandKit
from app.brand_learning.brand_kit_manager import BrandKitManager

@pytest.mark.asyncio
async def test_create_brand_kit():
    """Brand Kit 생성 테스트"""
    manager = BrandKitManager()

    brand_kit = await manager.create_from_upload(
        brand_id='test_brand_123',
        file_path='tests/fixtures/brand_guidelines.pdf',
        auto_extract=True
    )

    assert brand_kit.brand_id == 'test_brand_123'
    assert brand_kit.version == 1
    assert len(brand_kit.colors['palette']) > 0
    assert len(brand_kit.fonts['typography']) > 0

@pytest.mark.asyncio
async def test_brand_kit_versioning():
    """Brand Kit 버전 관리 테스트"""
    brand_kit_v1 = await BrandKit.get_latest('test_brand_123')

    # 업데이트
    brand_kit_v2 = await brand_kit_v1.create_new_version(
        version=2,
        change_type='manual_edit',
        reason='색상 변경'
    )

    assert brand_kit_v2.version == 2
    assert brand_kit_v1.version == 1

    # 이전 버전은 비활성화
    assert brand_kit_v1.is_active == False
    assert brand_kit_v2.is_active == True

@pytest.mark.asyncio
async def test_brand_consistency_validation():
    """브랜드 일관성 검증 테스트"""
    from app.services.brand_validator import BrandValidator

    brand_kit = await BrandKit.get_latest('test_brand_123')
    validator = BrandValidator()

    # 일관성 있는 콘텐츠
    good_content = {
        'headline': '당신만을 위한 프리미엄 경험',
        'colors_used': ['#F2EDE8', '#7C4D3A'],
        'font_family': 'Montserrat'
    }

    result_good = await validator.validate(good_content, brand_kit)
    assert result_good['overall_score'] >= 0.8

    # 일관성 없는 콘텐츠
    bad_content = {
        'headline': '지금 바로 구매! 최저가 폭탄 세일',
        'colors_used': ['#FF0000'],
        'font_family': 'Comic Sans MS'
    }

    result_bad = await validator.validate(bad_content, brand_kit)
    assert result_bad['overall_score'] < 0.5
    assert len(result_bad['issues']) > 0
```

### 6.2 Integration Tests

```python
# tests/integration/test_brand_kit_flow.py

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.mark.integration
def test_brand_kit_creation_flow():
    """Brand Kit 생성 전체 플로우 테스트"""

    # 1. 브랜드 생성
    response = client.post('/api/v1/brands', json={
        'name': 'Test Brand',
        'industry': 'cosmetics'
    })
    assert response.status_code == 201
    brand_id = response.json()['brand_id']

    # 2. 에셋 업로드
    with open('tests/fixtures/logo.png', 'rb') as f:
        response = client.post(
            f'/api/v1/brands/{brand_id}/assets',
            files={'file': f},
            data={'asset_type': 'logo', 'auto_extract': 'true'}
        )
    assert response.status_code == 202
    asset_id = response.json()['asset_id']

    # 3. 추출 완료 대기 (폴링)
    import time
    max_wait = 30
    elapsed = 0
    while elapsed < max_wait:
        response = client.get(f'/api/v1/brands/{brand_id}/assets/{asset_id}/extraction')
        if response.json()['status'] == 'completed':
            break
        time.sleep(1)
        elapsed += 1

    assert response.json()['status'] == 'completed'

    # 4. Brand Kit 조회
    response = client.get(f'/api/v1/brands/{brand_id}/kit')
    assert response.status_code == 200
    brand_kit = response.json()
    assert len(brand_kit['colors']['palette']) > 0
```

---

## 7. Security & Privacy

### 7.1 데이터 보호

- **암호화**: Brand Kit 내 민감 정보 (로고, 가이드라인) AES-256-GCM 암호화
- **접근 제어**: Brand Kit은 소유자 및 팀 멤버만 접근 가능 (RBAC)
- **버전 히스토리 보호**: 삭제된 버전도 감사 목적으로 보관 (GDPR Right to Erasure 준수)

### 7.2 학습 데이터 Opt-in

```python
# backend/models/brand_kit.py

class BrandKit(Base):
    __tablename__ = 'brand_kits'

    # ...

    learning_enabled = Column(Boolean, default=True)  # 기본값 True (Opt-in)

    async def disable_learning(self):
        """학습 비활성화"""
        self.learning_enabled = False
        await self.save()

        # 학습 데이터 삭제
        await LearningData.delete_for_brand(self.brand_id)
```

---

## 8. Performance Considerations

### 8.1 Caching Strategy

```python
# backend/services/brand_kit_cache.py

from functools import lru_cache
import redis

class BrandKitCache:
    """
    Brand Kit 캐싱
    """

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.ttl = 3600  # 1 hour

    async def get_brand_kit(self, brand_id: str) -> dict | None:
        """캐시에서 Brand Kit 조회"""
        key = f"brand_kit:{brand_id}:latest"
        cached = await self.redis.get(key)

        if cached:
            import json
            return json.loads(cached)

        return None

    async def set_brand_kit(self, brand_id: str, brand_kit: dict):
        """Brand Kit 캐시 저장"""
        key = f"brand_kit:{brand_id}:latest"
        import json
        await self.redis.setex(key, self.ttl, json.dumps(brand_kit))

    async def invalidate(self, brand_id: str):
        """캐시 무효화"""
        key = f"brand_kit:{brand_id}:latest"
        await self.redis.delete(key)
```

### 8.2 Query Optimization

```python
# backend/models/brand_kit.py

from sqlalchemy.orm import selectinload, joinedload

class BrandKit(Base):
    # ...

    @classmethod
    async def get_latest_with_assets(cls, brand_id: str):
        """
        Brand Kit + Assets 조인 로드
        """
        return await db.query(cls)\
            .options(
                joinedload(cls.brand),
                selectinload(cls.brand).selectinload(Brand.assets)
            )\
            .filter(cls.brand_id == brand_id, cls.is_active == True)\
            .first()
```

---

## 9. Deployment & Operations

### 9.1 Database Migration

```bash
# Alembic migration
alembic revision --autogenerate -m "Create brand_kits table"
alembic upgrade head
```

### 9.2 Monitoring

```python
# backend/monitoring/brand_kit_metrics.py

from prometheus_client import Counter, Histogram

brand_kit_reads = Counter('brand_kit_reads_total', 'Total Brand Kit reads')
brand_kit_updates = Counter('brand_kit_updates_total', 'Total Brand Kit updates')
extraction_duration = Histogram('brand_asset_extraction_duration_seconds', 'Asset extraction duration')
```

### 9.3 Backup Strategy

```bash
# PostgreSQL 백업
pg_dump -U sparklio -t brands -t brand_kits -t brand_assets > brand_kit_backup_$(date +%Y%m%d).sql

# MinIO 에셋 백업
mc mirror sparklio/brands /backup/brands/
```

---

## 10. Roadmap

### Phase 0 (MVP - Current)

- [x] Brand Kit 기본 스키마 설계
- [x] PostgreSQL JSONB 구조
- [x] API 엔드포인트 정의
- [ ] Frontend Editor UI
- [ ] 파일 업로드 및 자동 추출 (BRAND_LEARNING_ENGINE.md §3 연동)

### Phase 1 (Post-MVP)

- [ ] LoRA 모델 통합 (브랜드별 이미지 생성)
- [ ] RAG 검색 (가이드라인 문서)
- [ ] A/B 테스트 결과 자동 반영
- [ ] Brand Consistency Score 대시보드

### Phase 2 (Advanced)

- [ ] 멀티 브랜드 비교 분석
- [ ] Industry Benchmark (업종별 평균 비교)
- [ ] 브랜드 진화 추이 시각화
- [ ] Export to Figma/Sketch

### Phase 3 (Future)

- [ ] 브랜드 DNA 자동 생성 (AI)
- [ ] 경쟁사 브랜드 분석 (선택적)
- [ ] 브랜드 키트 마켓플레이스 (템플릿)

---

## 11. References

### 11.1 Internal Documents

- [BRAND_LEARNING_ENGINE.md](./BRAND_LEARNING_ENGINE.md) - Brand Intake Module, Style Extractor, Self-Learning Loop
- [AGENTS_SPEC.md](./AGENTS_SPEC.md) - Agent Integration (CopywriterAgent, VisionGeneratorAgent 등)
- [DATA_PIPELINE_PLAN.md](./DATA_PIPELINE_PLAN.md) - RAG System Integration
- [LLM_ROUTER_POLICY.md](./LLM_ROUTER_POLICY.md) - Brand Complexity 기반 모델 라우팅
- [TECH_DECISION_v1.md](./TECH_DECISION_v1.md) - Technology Stack, Database Schema

### 11.2 External Resources

- **Google Material Design**: Color System Guidelines
- **Adobe Brand Guidelines**: Industry Standards
- **WCAG 2.1**: Accessibility (Contrast Ratio)
- **OpenType Spec**: Font Metadata

---

## 12. Conclusion

Brand Kit System은 Sparklio.ai의 **브랜드 일관성 유지**를 위한 핵심 시스템입니다. 자동 학습·수동 편집·A/B 테스트 반영을 통해 **쓰면 쓸수록 브랜드와 닮아가는** 지능형 시스템을 구현합니다.

### 12.1 Key Takeaways

1. **중앙 집중식 브랜드 데이터**: 모든 Agent가 하나의 Brand Kit 참조
2. **자동 학습 통합**: BRAND_LEARNING_ENGINE.md와 긴밀히 연동
3. **버전 관리**: 브랜드 진화 추적 및 롤백 가능
4. **확장 가능**: LoRA 모델, RAG, A/B 테스트 통합 준비

### 12.2 Success Metrics

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| **Brand Consistency Score** | ≥ 85% | ReviewerAgent 평가 평균 |
| **Asset Extraction Accuracy** | ≥ 90% | 수동 검증 샘플 |
| **API Response Time** | < 200ms | P95 latency |
| **User Satisfaction** | ≥ 4.5/5 | 설문 조사 |

---

**문서 버전**: 1.0
**최종 수정**: 2025-11-14 (목요일)
**작성자**: Team A
**검토자**: CTO, Lead Engineer
