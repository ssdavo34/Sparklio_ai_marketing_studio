# SPARKLIO AI Marketing Studio - Agent 명세서

**작성일**: 2025년 11월 19일 (수요일)
**작성자**: B팀 (Backend)
**문서 버전**: v1.0
**상태**: 정식 릴리스

---

## 📋 문서 개요

본 문서는 SPARKLIO AI Marketing Studio Backend의 **24개 Agent 전체 명세**를 정의합니다.

### 대상 독자
- **A팀 (Frontend - 기존)**: Phase 2-3에서 호출할 Agent API 이해
- **C팀 (Frontend)**: Phase 2-3에서 호출할 Agent API 이해
- **B팀 (Backend)**: Phase 2-3-7에서 구현할 Agent 명세

### 문서 구조
1. [Agent 개요](#agent-개요)
2. [구현 완료 Agent (7개)](#구현-완료-agent-7개)
3. [계획된 Agent (17개)](#계획된-agent-17개)
4. [Agent API 엔드포인트](#agent-api-엔드포인트)
5. [공통 스키마](#공통-스키마)
6. [에러 처리](#에러-처리)

---

## Agent 개요

### 전체 Agent 구성

| 카테고리 | 설명 | Agent 수 | 구현 상태 |
|---------|------|---------|----------|
| **Creation Agents** | 콘텐츠 생성 및 편집 | 9개 | 7개 완료 |
| **Intelligence Agents** | 데이터 수집 및 분석 | 7개 | 0개 완료 |
| **System Agents** | 시스템 관리 및 최적화 | 4개 | 0개 완료 |
| **Orchestration** | 워크플로우 조율 | 4개 | 3개 완료 |
| **합계** | | **24개** | **10개 (41%)** |

### Agent 아키텍처 원칙

#### 1. 공통 인터페이스
모든 Agent는 `AgentBase`를 상속하고 동일한 인터페이스를 구현합니다:
```python
class SomeAgent(AgentBase):
    @property
    def name(self) -> str:
        return "agent_name"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        # 비즈니스 로직
        pass
```

#### 2. LLM Gateway 통합
Agent는 직접 LLM Provider를 호출하지 않고 `LLMGateway`를 통합합니다:
- Provider 추상화 (Anthropic, OpenAI, Ollama)
- 자동 폴백 (Primary → Fallback)
- Prompt 자동 변환 (Role + Task + Payload)

#### 3. 확장성 우선
- 새로운 Agent 추가 시 기존 Agent 수정 불필요
- Workflow Orchestrator가 Agent 간 연결 관리
- Factory Pattern으로 인스턴스 생성 통일

---

## 구현 완료 Agent (7개)

### 1. CopywriterAgent

**역할**: 텍스트 콘텐츠 생성 전문 Agent

**파일**: [app/services/agents/copywriter.py](app/services/agents/copywriter.py)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `product_detail` | 제품 상세 설명 작성 | `product_name`, `features`, `target_audience` | `headline`, `subheadline`, `body`, `bullets`, `cta` |
| `sns` | SNS 콘텐츠 작성 | `theme`, `target_audience`, `platform` | `post`, `hashtags`, `cta` |
| `brand_message` | 브랜드 메시지 작성 | `brand_name`, `industry`, `values` | `tagline`, `message`, `values` |
| `headline` | 헤드라인 생성 | `context`, `style` | `version_a`, `version_b`, `version_c` |
| `ad_copy` | 광고 카피 작성 | `product_name`, `selling_points` | `headline`, `body`, `cta` |

**사용 예시**:
```python
from app.services.agents import get_copywriter_agent, AgentRequest

agent = get_copywriter_agent()
response = await agent.execute(AgentRequest(
    task="product_detail",
    payload={
        "product_name": "무선 이어폰 X1",
        "features": ["노이즈캔슬링", "24시간 배터리"],
        "target_audience": "2030 직장인"
    },
    options={"tone": "professional", "length": "medium"}
))

# response.outputs[0].value:
{
    "headline": "몰입의 시작, X1",
    "subheadline": "완벽한 노이즈캔슬링과 24시간 배터리",
    "body": "출퇴근길, 카페, 사무실 어디서나 당신만의 공간을 만들어드립니다...",
    "bullets": [
        "업계 최고 수준 노이즈캔슬링 기술",
        "한 번 충전으로 24시간 사용",
        "프리미엄 사운드 품질"
    ],
    "cta": "지금 구매하기"
}
```

**LLM Provider**: Ollama (Qwen2.5:7b) / OpenAI (GPT-4o-mini)

**KPI**:
- 생성 품질: >90% (Reviewer 평가 기준)
- 응답 시간: <5초 (P95)

---

### 2. StrategistAgent

**역할**: 마케팅 전략 수립 및 브랜드 기획 전문 Agent

**파일**: [app/services/agents/strategist.py](app/services/agents/strategist.py)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `brand_kit` | 브랜드 아이덴티티 전략 수립 | `brand_name`, `industry`, `target_market` | `brand_identity`, `positioning`, `personality`, `strategy` |
| `campaign` | 마케팅 캠페인 기획 | `objective`, `budget`, `duration` | `overview`, `strategy`, `execution`, `measurement` |
| `target_analysis` | 타겟 고객 분석 | `product_info`, `market_info` | `demographics`, `psychographics`, `behavior`, `persona` |
| `positioning` | 브랜드 포지셔닝 전략 | `brand_name`, `competitors` | `market_analysis`, `competitive_analysis`, `positioning_strategy` |
| `content_strategy` | 콘텐츠 전략 수립 | `brand_info`, `channels` | `content_pillars`, `channel_strategy`, `calendar` |

**사용 예시**:
```python
response = await strategist.execute(AgentRequest(
    task="brand_kit",
    payload={
        "brand_name": "EcoLife",
        "industry": "친환경 생활용품",
        "target_market": "환경의식 높은 MZ세대"
    }
))

# response.outputs[0].value:
{
    "brand_identity": {
        "mission": "지속 가능한 일상을 만듭니다",
        "vision": "2030년까지 플라스틱 제로 달성",
        "values": ["환경", "혁신", "투명성"]
    },
    "positioning": {
        "target_audience": "25-35세 환경의식 높은 소비자",
        "unique_value": "100% 생분해 소재 + 디자인 감성",
        "differentiation": "가격 경쟁력 + 윤리적 공급망"
    },
    # ...
}
```

**LLM Provider**: Ollama (Qwen2.5:7b) / OpenAI (GPT-4o-mini)

**KPI**:
- 전략 적합성: >85% (전문가 평가)
- 응답 시간: <10초 (P95)

---

### 3. DesignerAgent

**역할**: 비주얼 콘텐츠 생성 전문 Agent (이미지, 로고, 배너)

**파일**: [app/services/agents/designer.py](app/services/agents/designer.py)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `product_image` | 제품 이미지 생성 | `product_description`, `style`, `aspect_ratio` | `image_url`, `metadata` |
| `brand_logo` | 브랜드 로고 생성 | `brand_name`, `brand_values`, `style` | `logo_url`, `variants` |
| `sns_thumbnail` | SNS 썸네일 생성 | `theme`, `text_overlay`, `platform` | `thumbnail_url` |
| `ad_banner` | 광고 배너 생성 | `copy`, `product_image`, `size` | `banner_url` |
| `illustration` | 일러스트레이션 생성 | `description`, `style`, `color_palette` | `illustration_url` |

**사용 예시**:
```python
response = await designer.execute(AgentRequest(
    task="product_image",
    payload={
        "product_description": "프리미엄 무선 이어폰, 블랙 색상",
        "style": "minimalist",
        "aspect_ratio": "1:1"
    }
))

# response.outputs[0].value:
{
    "image_url": "https://storage.example.com/images/abc123.png",
    "metadata": {
        "width": 1024,
        "height": 1024,
        "format": "png",
        "generation_model": "comfyui"
    }
}
```

**Media Provider**: ComfyUI (Mock 모드 지원)

**KPI**:
- 생성 성공률: >90%
- 응답 시간: <30초 (P95)
- 품질 점수: >0.80 (VisionAnalyzer 평가)

---

### 4. ReviewerAgent

**역할**: 콘텐츠 품질 검토 및 피드백 제공 전문 Agent

**파일**: [app/services/agents/reviewer.py](app/services/agents/reviewer.py)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `content_review` | 콘텐츠 전반적 검토 | `content`, `criteria` | `overall_score`, `strengths`, `weaknesses`, `improvements` |
| `copy_review` | 카피 품질 검토 | `copy_text` | `clarity_score`, `persuasiveness_score`, `impact_score`, `suggestions` |
| `brand_consistency` | 브랜드 일관성 검토 | `content`, `brand_guidelines` | `consistency_score`, `deviations`, `recommendations` |
| `grammar_check` | 문법 및 맞춤법 검토 | `text` | `errors`, `corrected_version` |
| `effectiveness_analysis` | 마케팅 효과성 분석 | `content`, `target_audience` | `target_fit_score`, `cta_effectiveness`, `predicted_performance` |

**사용 예시**:
```python
response = await reviewer.execute(AgentRequest(
    task="content_review",
    payload={
        "content": {
            "headline": "혁신의 시작",
            "body": "..."
        },
        "criteria": ["quality", "brand_fit", "effectiveness"]
    }
))

# response.outputs[0].value:
{
    "overall_score": 8.5,
    "strengths": [
        "헤드라인이 임팩트 있음",
        "타겟 언어 사용 적절"
    ],
    "weaknesses": [
        "CTA가 다소 약함"
    ],
    "improvements": [
        "CTA를 더 구체적으로 변경 권장 (예: '지금 50% 할인 받기')"
    ]
}
```

**LLM Provider**: Ollama / OpenAI

**KPI**:
- 검토 정확도: >95%
- 응답 시간: <5초

---

### 5. OptimizerAgent

**역할**: 콘텐츠 최적화 전문 Agent (SEO, 전환율, 가독성)

**파일**: [app/services/agents/optimizer.py](app/services/agents/optimizer.py)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `seo_optimize` | SEO 최적화 | `content`, `target_keywords` | `optimized_content`, `meta_title`, `meta_description` |
| `conversion_optimize` | 전환율 최적화 | `content` | `optimized_content`, `cta_improvements` |
| `readability_improve` | 가독성 개선 | `text` | `improved_content`, `readability_score` |
| `length_adjust` | 길이 조정 | `content`, `target_length` | `adjusted_content` |
| `tone_adjust` | 톤앤매너 조정 | `content`, `target_tone` | `adjusted_content` |

**사용 예시**:
```python
response = await optimizer.execute(AgentRequest(
    task="seo_optimize",
    payload={
        "content": "원본 콘텐츠...",
        "target_keywords": ["무선 이어폰", "노이즈캔슬링"]
    }
))

# response.outputs[0].value:
{
    "optimized_content": "최적화된 콘텐츠...",
    "keyword_placement": {
        "무선 이어폰": {"count": 5, "positions": ["title", "h1", "p1"]},
        "노이즈캔슬링": {"count": 3, "positions": ["h2", "p2"]}
    },
    "meta_title": "프리미엄 무선 이어폰 | 노이즈캔슬링",
    "meta_description": "..."
}
```

**LLM Provider**: Ollama / OpenAI

**KPI**:
- SEO 점수 향상: 평균 +20점
- 전환율 개선: 평균 +15%

---

### 6. EditorAgent

**역할**: 콘텐츠 편집 및 교정 전문 Agent

**파일**: [app/services/agents/editor.py](app/services/agents/editor.py)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `proofread` | 교정 | `text` | `corrected_text`, `corrections` |
| `rewrite` | 재작성 | `text`, `style` | `rewritten_text` |
| `summarize` | 요약 | `text`, `length` | `summary` |
| `expand` | 확장 | `text`, `target_length` | `expanded_text` |
| `translate` | 번역 | `text`, `target_language` | `translated_text` |

**사용 예시**:
```python
response = await editor.execute(AgentRequest(
    task="proofread",
    payload={
        "text": "오늘은 날씨가 좋다. 밖에서 산책할게요."
    }
))

# response.outputs[0].value:
{
    "corrected_text": "오늘은 날씨가 좋아요. 밖에서 산책할게요.",
    "corrections": [
        {"type": "grammar", "original": "좋다", "corrected": "좋아요"}
    ]
}
```

**LLM Provider**: Ollama / OpenAI

**KPI**:
- 교정 정확도: >98%
- 응답 시간: <5초

---

### 7. VisionAnalyzerAgent ✅ **구현 완료**

**역할**: 생성 이미지 품질 자동 평가 전문 Agent

**파일**: [app/services/agents/vision_analyzer.py](app/services/agents/vision_analyzer.py)

**구현 상태**:
- ✅ **STEP 1**: Agent 클래스 구현 완료 (2025-11-19)
- ✅ **STEP 2**: Vision API 연동 완료 (Claude 3.5 Sonnet, GPT-4o)
- ✅ **STEP 3**: 품질 평가 로직 구현 완료
- ✅ **STEP 4**: 통합 테스트 완료 (Mock 모드 지원)
- ✅ **STEP 5**: 문서화 완료 (2025-11-21)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `image_analysis` | 이미지 종합 분석 | `image_url` 또는 `image_base64`, `criteria`, `brand_guidelines` | `quality_score`, `composition`, `color_harmony`, `brand_consistency`, `technical_quality`, `improvements` |
| `composition_check` | 구도 분석 | `image_url` 또는 `image_base64` | `composition` 분석 |
| `color_check` | 색상 조화 분석 | `image_url` 또는 `image_base64` | `color_harmony` 분석 |
| `brand_check` | 브랜드 일관성 체크 | `image_url` 또는 `image_base64`, `brand_guidelines` | `brand_consistency` 분석 |
| `quality_check` | 기술적 품질 평가 | `image_url` 또는 `image_base64` | `technical_quality` 분석 |

**입력 형식**:
```python
# URL 형식
payload = {
    "image_url": "https://example.com/image.jpg",
    "criteria": {...},
    "brand_guidelines": {...}
}

# Base64 형식 (프론트엔드 직접 업로드 시)
payload = {
    "image_base64": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "criteria": {...},
    "brand_guidelines": {...}
}
```

**Vision API 연동**:
- **Primary Provider**: Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`)
- **Fallback Provider**: GPT-4o (`gpt-4o`)
- **Mock Mode**: 개발/테스트 시 자동 폴백

**사용 예시**:
```python
from app.services.agents import get_vision_analyzer_agent, AgentRequest

# Agent 인스턴스 생성
agent = get_vision_analyzer_agent()

# 이미지 분석 요청
response = await agent.execute(AgentRequest(
    task="image_analysis",
    payload={
        "image_url": "https://example.com/product.jpg",
        "criteria": {
            "composition": True,      # 구도 분석
            "color_harmony": True,     # 색상 조화
            "brand_consistency": True, # 브랜드 일관성
            "technical_quality": True  # 기술적 품질
        },
        "brand_guidelines": {  # 선택적
            "primary_colors": ["#FF0000", "#0000FF"],
            "style": "minimalist",
            "tone": "professional"
        }
    }
))

# response.outputs[0].value 결과:
{
    "quality_score": 0.87,  # 종합 점수 (0-1)
    "composition": {
        "score": 0.9,
        "analysis": "요소 배치가 균형적이며 시선 흐름이 자연스러움. 주요 메시지가 적절히 강조됨.",
        "issues": ["텍스트와 이미지 간격이 약간 좁음"]
    },
    "color_harmony": {
        "score": 0.85,
        "analysis": "색상 조합이 조화로우며 브랜드 아이덴티티를 잘 반영함.",
        "issues": ["배경색이 일부 텍스트 가독성을 저해할 수 있음"]
    },
    "brand_consistency": {
        "score": 0.88,
        "matches_guidelines": True,
        "deviations": ["폰트 크기가 가이드라인보다 작음"]
    },
    "technical_quality": {
        "score": 0.80,
        "resolution": "good",
        "clarity": "good",
        "issues": []
    },
    "improvements": [
        "텍스트와 이미지 사이 여백을 20px에서 40px로 증가 권장",
        "배경색을 약간 밝게 조정하여 가독성 향상",
        "헤드라인 폰트 크기를 36px로 조정"
    ],
    "overall_verdict": "good",
    "requires_regeneration": false
}
```

**API 엔드포인트**:
```python
# POST /api/v1/agents/vision_analyzer
{
    "task": "image_analysis",
    "payload": {
        "image_url": "https://...",  # 또는 image_base64
        "criteria": {...},
        "brand_guidelines": {...}
    }
}
```

**Frontend 통합 가이드**:
```javascript
// A팀/C팀 프론트엔드 사용 예시
const analyzeImage = async (imageUrl, brandGuidelines) => {
    const response = await fetch('/api/v1/agents/vision_analyzer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            task: 'image_analysis',
            payload: {
                image_url: imageUrl,
                criteria: {
                    composition: true,
                    color_harmony: true,
                    brand_consistency: !!brandGuidelines,
                    technical_quality: true
                },
                brand_guidelines: brandGuidelines
            }
        })
    });

    const result = await response.json();
    return result.outputs[0].value;
};
```

**에러 처리**:
- `404 Not Found`: Vision 모델이 사용 불가능할 때 → Mock 데이터로 자동 폴백
- `413 Payload Too Large`: 이미지 크기가 너무 클 때 (5MB 제한)
- `422 Validation Error`: 필수 파라미터 누락
- `500 Internal Server Error`: Vision API 오류 → 재시도 로직 포함

**KPI**:
- 분석 정확도: >95%
- 응답 시간: <3초
- False Positive Rate: <5%
- Mock 모드 전환 시간: <100ms

**남은 작업**:
- STEP 3: 품질 평가 로직 고도화 (2일)
- STEP 4: 통합 테스트 (2일)
- STEP 5: 문서화 (1일)

---

## 계획된 Agent (17개)

### Creation Agents (2개)

#### 8. ScenePlannerAgent ✅ **구현 완료**

**역할**: 광고 영상·쇼츠의 씬 구성 설계 전문 Agent

**파일**: [app/services/agents/scene_planner.py](app/services/agents/scene_planner.py)

**구현 상태**:
- ✅ Agent 클래스 구현 완료 (2025-11-21)
- ✅ 씬 구성 로직 구현
- ✅ 스토리보드 생성 기능
- ✅ 타이밍 최적화 알고리즘
- ✅ Mock 데이터 지원

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `scene_plan` | 씬 구성 설계 | `product_info`, `duration`, `style`, `platform` | `scenes` 배열, `suggestions` |
| `storyboard` | 스토리보드 생성 | `product_info`, `concept`, `duration` | `storyboard` JSON |
| `optimize_timing` | 타이밍 최적화 | `scenes`, `duration` | `optimized_scenes` |
| `suggest_transitions` | 트랜지션 제안 | `scenes`, `style` | `transitions` 배열 |
| `emotion_arc` | 감정 곡선 설계 | `scenes` | `emotion_arc` 데이터 |

**Input 스키마**:
```json
{
    "product_info": {
        "name": "무선 이어폰 X1",
        "features": ["노이즈캔슬링", "24시간 배터리"],
        "target": "2030 직장인"
    },
    "duration": 30,  // 15, 30, 60초 지원
    "style": "modern",  // modern, classic, dynamic 등
    "platform": "youtube"  // youtube, instagram, tiktok 등
}
```

**Output 스키마**:
```json
{
    "scenes": [
        {
            "id": "scene_001",
            "type": "intro",
            "duration": 3.5,
            "description": "제품 클로즈업 샷",
            "visual_elements": ["product", "logo", "natural_background"],
            "camera_movement": "zoom_in",
            "shot_type": "close_up",
            "narration": "혁신적인 무선 이어폰",
            "sound_effects": ["swoosh", "ambient"],
            "music_mood": "upbeat",
            "text_overlay": "완벽한 몰입",
            "transition_in": "fade",
            "transition_out": "cut",
            "emotion": "excitement",
            "energy_level": 8
        }
    ],
    "suggestions": [
        "음악 비트에 맞춰 컷 편집 권장",
        "브랜드 컬러 일관성 유지",
        "CTA 버튼 강조 필요"
    ],
    "estimated_production_time": 15.0,
    "difficulty_level": "medium"
}
```

**사용 예시**:
```python
from app.services.agents import get_scene_planner_agent, AgentRequest

agent = get_scene_planner_agent()

# 30초 YouTube 광고 씬 계획
response = await agent.execute(AgentRequest(
    task="scene_plan",
    payload={
        "product_info": {
            "name": "무선 이어폰 X1",
            "features": ["노이즈 캔슬링", "24시간 배터리"],
            "target": "2030 직장인"
        },
        "duration": 30,
        "style": "modern",
        "platform": "youtube"
    }
))

# response.outputs[0].value에서 씬 계획 확인
scenes = response.outputs[0].value["scenes"]
for scene in scenes:
    print(f"Scene {scene['id']}: {scene['duration']}초 - {scene['description']}")
```

**API 엔드포인트**: `POST /api/v1/agents/scene_planner`

**LLM Provider**:
- **Primary**: Ollama (Qwen2.5:7b) - 구조화된 JSON 출력
- **Fallback**: GPT-4o-mini - 빠른 응답
- **Mock Mode**: 개발/테스트 시 자동 전환

**KPI**:
- 씬 구성 정확도: >90%
- 응답 시간: <5초
- 타이밍 정밀도: ±0.5초

---

#### 9. TemplateAgent (P1)

**역할**: 마케팅 템플릿 자동 생성 Agent

**예상 구현**: Phase 2 (2025-12-02~12-15)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `generate_template` | 템플릿 생성 | `industry`, `channel`, `purpose` | `template` JSON |
| `list_templates` | 템플릿 목록 조회 | `filters` | `templates` 배열 |

**Input 스키마**:
```json
{
    "industry": "이커머스",
    "channel": "landing_page",
    "purpose": "제품 소개"
}
```

**Output 스키마**:
```json
{
    "template": {
        "id": "tpl_landing_001",
        "name": "이커머스 제품 랜딩페이지",
        "structure": {
            "sections": ["hero", "features", "testimonials", "cta"]
        },
        "variables": [
            {"name": "headline", "type": "string", "required": true},
            {"name": "product_images", "type": "array", "required": true}
        ],
        "style_guide": {
            "colors": ["#primary", "#secondary"],
            "fonts": ["heading_font", "body_font"]
        }
    }
}
```

**API 엔드포인트**: `POST /api/v1/agents/template/execute`

**Storage**: PostgreSQL + Redis Cache

**KPI**:
- Template Reuse Rate: >70%
- 생성 시간: <5초

---

### Intelligence Agents (7개)

#### 10. TrendCollectorAgent ✅ **구현 완료**

**역할**: 마케팅 트렌드 데이터 수집 및 분석 전문 Agent

**파일**: [app/services/agents/trend_collector.py](app/services/agents/trend_collector.py)

**구현 상태**:
- ✅ Agent 클래스 구현 완료 (2025-11-21)
- ✅ 다중 데이터 소스 지원 (Google Trends, Twitter, Instagram, Naver)
- ✅ 키워드 분석 및 경쟁사 모니터링
- ✅ 트렌드 리포트 생성
- ✅ Mock 데이터 지원

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `collect_trends` | 트렌드 데이터 수집 | `keywords`, `sources`, `period` | `collected_data` 배열 |
| `analyze_keywords` | 키워드 분석 | `keywords`, `market` | `analysis` 결과 |
| `monitor_competitors` | 경쟁사 모니터링 | `competitors`, `metrics` | `monitoring_data` |
| `generate_report` | 리포트 생성 | `data`, `format` | `report` |

**Input 스키마**:
```json
{
    "keywords": ["친환경", "비건"],
    "sources": ["google_trends", "twitter", "instagram", "naver"],
    "period": {"start": "2025-01-01", "end": "2025-01-31"},
    "region": "KR"
}
```

**Output 스키마**:
```json
{
    "collected_data": [
        {
            "source": "google_trends",
            "keyword": "친환경",
            "volume": 12500,
            "trend": "rising",
            "growth_rate": 0.35,
            "related_keywords": ["제로웨이스트", "업사이클링"],
            "region_data": {
                "KR": 100,
                "US": 45
            }
        }
    ],
    "metadata": {
        "total_items": 1250,
        "collection_time": 45.2,
        "success_rate": 0.98,
        "data_quality_score": 0.92
    }
}
```

**API 엔드포인트**: `POST /api/v1/agents/trend_collector/execute`

**KPI**:
- Collection Success Rate: >95%
- 처리 속도: >100 items/min
- Data Quality Score: >0.9

---

#### 11. DataCleanerAgent ✅ **구현 완료**

**역할**: 데이터 정제 및 품질 개선 전문 Agent

**파일**: [app/services/agents/data_cleaner.py](app/services/agents/data_cleaner.py)

**구현 상태**:
- ✅ Agent 클래스 구현 완료 (2025-11-21)
- ✅ 중복 제거, 표준화, 이상치 탐지
- ✅ 결측값 처리 및 데이터 검증
- ✅ 6가지 품질 지표 평가
- ✅ Mock 데이터 지원

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `clean_data` | 데이터 정제 | `data`, `rules` | `cleaned_data` |
| `validate_data` | 데이터 검증 | `data`, `schema` | `validation_result` |
| `detect_outliers` | 이상치 탐지 | `data`, `method` | `outliers` |
| `standardize_format` | 형식 표준화 | `data`, `format_rules` | `standardized_data` |
| `assess_quality` | 품질 평가 | `data` | `quality_metrics` |

**Input 스키마**:
```json
{
    "data": [
        {"text": "<p>HTML 태그 포함 텍스트</p>", "phone": "010-1234-5678"}
    ],
    "rules": {
        "remove_html": true,
        "remove_duplicates": true,
        "standardize_phone": true,
        "fill_missing": "mean"
    }
}
```

**Output 스키마**:
```json
{
    "cleaned_data": [
        {"text": "HTML 태그 포함 텍스트", "phone": "01012345678"}
    ],
    "quality_metrics": {
        "completeness": 0.95,
        "accuracy": 0.92,
        "consistency": 0.88,
        "validity": 0.91,
        "uniqueness": 0.99,
        "timeliness": 0.87
    },
    "stats": {
        "original_count": 1000,
        "cleaned_count": 850,
        "duplicates_removed": 150,
        "outliers_detected": 25
    }
}
```

**API 엔드포인트**: `POST /api/v1/agents/data_cleaner/execute`

**KPI**:
- Cleaning Accuracy: >95%
- 처리 속도: >500 items/sec
- Quality Score: >0.9

---

#### 12. EmbedderAgent ✅ **구현 완료**

**역할**: 텍스트/이미지 임베딩 생성 및 벡터 검색 전문 Agent

**파일**: [app/services/agents/embedder.py](app/services/agents/embedder.py)

**구현 상태**:
- ✅ Agent 클래스 구현 완료 (2025-11-21)
- ✅ 텍스트/이미지 임베딩 생성
- ✅ 다양한 모델 지원 (OpenAI, CLIP, BERT)
- ✅ 유사도 검색 및 클러스터링
- ✅ 차원 축소 기능

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `embed_text` | 텍스트 임베딩 | `text`, `model` | `embedding` |
| `embed_image` | 이미지 임베딩 | `image`, `model` | `embedding` |
| `embed_batch` | 배치 임베딩 | `items`, `batch_size` | `embeddings` 배열 |
| `search_similar` | 유사도 검색 | `query`, `embeddings`, `top_k` | `results` |
| `cluster_embeddings` | 클러스터링 | `embeddings`, `n_clusters` | `clusters` |

**Input 스키마**:
```json
{
    "text": "텍스트 콘텐츠",
    "model": "openai_text_embedding_3_small",
    "normalize": true
}
```

**Output 스키마**:
```json
{
    "embedding": [0.1, 0.2, ..., 0.9],
    "model": "openai_text_embedding_3_small",
    "dimensions": 1536,
    "metadata": {
        "text_length": 15,
        "normalized": true,
        "language": "ko"
    }
}
```

**API 엔드포인트**: `POST /api/v1/agents/embedder/execute`

**Provider**: OpenAI / CLIP / SentenceTransformers

**KPI**:
- Embedding Generation: <1s per 100 texts
- Cache Hit Rate: >70%
- Clustering Accuracy: >0.85

---

#### 13. IngestorAgent ✅ **구현 완료**

**역할**: 다양한 스토리지 시스템 데이터 저장 및 관리 전문 Agent

**파일**: [app/services/agents/ingestor.py](app/services/agents/ingestor.py)

**구현 상태**:
- ✅ Agent 클래스 구현 완료 (2025-11-21)
- ✅ 다중 스토리지 지원 (PostgreSQL, Redis, S3, Elasticsearch)
- ✅ 배치 처리 및 트랜잭션 관리
- ✅ 캐싱 및 파일 업로드
- ✅ 데이터 조회 및 삭제

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `ingest_data` | 데이터 저장 | `data`, `destination`, `data_type` | `ingest_result` |
| `batch_ingest` | 배치 저장 | `items`, `batch_size`, `strategy` | `batch_result` |
| `cache_data` | Redis 캐싱 | `key`, `value`, `ttl` | `cache_result` |
| `upload_file` | S3 파일 업로드 | `file_content`, `file_name`, `bucket` | `upload_result` |
| `query_data` | 데이터 조회 | `destination`, `query` | `query_result` |
| `delete_data` | 데이터 삭제 | `destination`, `conditions` | `delete_result` |

**Input 스키마**:
```json
{
    "data": [
        {"title": "문서 제목", "content": "내용", "category": "guide"}
    ],
    "destination": "postgresql",
    "data_type": "document",
    "options": {
        "table": "documents",
        "batch_size": 1000
    }
}
```

**Output 스키마**:
```json
{
    "success": true,
    "inserted_count": 1000,
    "failed_count": 0,
    "duration": 2.5,
    "errors": null
}
```

**API 엔드포인트**: `POST /api/v1/agents/ingestor/execute`

**KPI**:
- Insertion Rate: >1000 records/sec
- Error Rate: <1%
- Cache Hit Rate: >70%

---

#### 14. PerformanceAnalyzerAgent ✅ **구현 완료**

**역할**: SNS 및 광고 캠페인 성과 분석 및 최적화 제안 전문 Agent

**파일**: [app/services/agents/performance_analyzer.py](app/services/agents/performance_analyzer.py)

**구현 상태**:
- ✅ Agent 클래스 구현 완료 (2025-11-21)
- ✅ SNS 성과 분석 (Instagram, Facebook, YouTube 등)
- ✅ A/B 테스트 분석 및 통계적 유의성 검정
- ✅ 업계 벤치마킹
- ✅ 성과 예측 및 최적화 제안

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `performance` | 성과 분석 | `platform`, `post_id`, `period`, `metrics` | `performance_report` |
| `ab_test` | A/B 테스트 | `variant_a`, `variant_b`, `metric` | `test_result` |
| `benchmark` | 벤치마크 분석 | `platform`, `industry`, `competitors` | `benchmark_report` |
| `prediction` | 성과 예측 | `historical_data`, `forecast_days` | `predictions` |
| `optimization` | 최적화 제안 | `current_performance`, `goals` | `suggestions` |

**Input 스키마**:
```json
{
    "platform": "instagram",
    "post_id": "abc123",
    "period": {"start": "2025-01-01", "end": "2025-01-31"},
    "metrics": ["engagement", "reach", "ctr"]
}
```

**Output 스키마**:
```json
{
    "platform": "instagram",
    "period": {"start": "2025-01-01", "end": "2025-01-31"},
    "metrics": [
        {"name": "engagement", "value": 0.035, "change": 0.15, "benchmark": 0.03}
    ],
    "grade": "A",
    "score": 85.5,
    "insights": [
        "engagement 지표가 15% 증가했습니다",
        "업계 평균보다 16.7% 높습니다"
    ],
    "recommendations": [
        "최적 게시 시간대 분석을 통한 도달률 향상"
    ]
}
```

**API 엔드포인트**: `POST /api/v1/agents/performance_analyzer/execute`

**KPI**:
- 분석 정확도: >90%
- 예측 정확도: >75%
- A/B 테스트 신뢰도: >95%

---

#### 15. SelfLearningAgent ✅ **구현 완료**

**역할**: 사용자 피드백 기반 학습 및 지속적 개선 전문 Agent

**파일**: [app/services/agents/self_learning.py](app/services/agents/self_learning.py)

**구현 상태**:
- ✅ Agent 클래스 구현 완료 (2025-11-21)
- ✅ 브랜드 벡터 학습 및 업데이트
- ✅ 사용자 선호도 분석
- ✅ 파라미터 자동 최적화
- ✅ 개인화 프로파일 구축

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `update_brand_vector` | 브랜드 벡터 업데이트 | `brand_id`, `feedback_data`, `learning_mode` | `vector_update_result` |
| `analyze_preferences` | 선호도 분석 | `user_id`, `history_window` | `preference_profile` |
| `optimize_parameters` | 파라미터 최적화 | `brand_id`, `target_metric`, `performance_history` | `optimized_params` |
| `build_profile` | 개인화 프로파일 | `user_id`, `interactions` | `personalization_profile` |
| `record_feedback` | 피드백 기록 | `user_id`, `content_id`, `feedback_type` | `record_result` |
| `get_metrics` | 학습 지표 | `brand_id` | `learning_metrics` |

**Input 스키마**:
```json
{
    "brand_id": "brand_001",
    "feedback_data": [
        {
            "user_id": "user_001",
            "content_id": "c001",
            "feedback_type": "like",
            "features": {"tone": "professional", "style": "modern"}
        }
    ],
    "learning_mode": "incremental"
}
```

**Output 스키마**:
```json
{
    "previous_vector": [0.1, 0.2, ...],
    "updated_vector": [0.15, 0.25, ...],
    "change_magnitude": 0.08,
    "improvement_score": 0.75,
    "applied_feedback": 10
}
```

**API 엔드포인트**: `POST /api/v1/agents/self_learning/execute`

**KPI**:
- Learning Effectiveness: >85%
- 업데이트 시간: <2초
- Preference Accuracy: >80%

---

#### 16. RAGAgent ✅ **구현 완료**

**역할**: 검색 증강 생성(RAG) 및 지식 베이스 관리 전문 Agent

**파일**: [app/services/agents/rag.py](app/services/agents/rag.py)

**구현 상태**:
- ✅ Agent 클래스 구현 완료 (2025-11-21)
- ✅ 문서 인덱싱 및 청킹
- ✅ 하이브리드 검색 (키워드 + 벡터)
- ✅ 컨텍스트 증강 생성
- ✅ 답변 추출 기능

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `index_document` | 문서 인덱싱 | `documents`, `chunking_strategy` | `index_result` |
| `search_knowledge` | 지식 검색 | `query`, `top_k`, `strategy` | `search_results` |
| `generate_with_context` | 컨텍스트 증강 생성 | `prompt`, `context_query` | `generated_text` |
| `hybrid_search` | 하이브리드 검색 | `query`, `weights` | `results` |
| `extract_answers` | 답변 추출 | `question`, `context` | `answers` |

**Input 스키마**:
```json
{
    "query": "비건 화장품 트렌드",
    "top_k": 5,
    "strategy": "hybrid",
    "doc_types": ["marketing_guide", "industry_report"],
    "min_score": 0.7
}
```

**Output 스키마**:
```json
{
    "results": [
        {
            "doc_id": "doc_001",
            "title": "비건 뷰티 시장 분석",
            "snippet": "비건 화장품 시장이 연평균 15% 성장...",
            "score": 0.89,
            "doc_type": "industry_report",
            "metadata": {"date": "2025-01-15"}
        }
    ],
    "total_found": 5,
    "search_time": 45.2,
    "strategy_used": "hybrid_rerank"
}
```

**API 엔드포인트**: `POST /api/v1/agents/rag/execute`

**연동**: In-memory (개발) / PostgreSQL (pgvector) + Redis Cache (프로덕션)

**KPI**:
- Retrieval@10: >0.85
- 응답 시간: <2초
- Context Relevance: >0.85

---

### System Agents (4개)

#### 17. PMAgent ✅ **구현 완료**

**역할**: 워크플로우 조율 및 태스크 분배 전문 Agent

**파일**: [app/services/agents/pm.py](app/services/agents/pm.py)

**구현 상태**:
- ✅ Agent 클래스 구현 완료 (2025-11-21)
- ✅ 워크플로우 계획 수립
- ✅ 태스크 분해 및 우선순위 결정
- ✅ 병렬/순차 실행 관리
- ✅ 진행 상황 모니터링

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `plan_workflow` | 워크플로우 계획 | `request_text`, `context` | `workflow_plan` |
| `execute_workflow` | 워크플로우 실행 | `workflow_id` | `workflow_result` |
| `assign_task` | 태스크 할당 | `task`, `workflow_id` | `assignment` |
| `monitor_progress` | 진행 상황 모니터링 | `workflow_id` | `execution_status` |
| `optimize_workflow` | 워크플로우 최적화 | `workflow_id` | `optimization_suggestions` |

**Input 스키마**:
```json
{
    "request_text": "비건 화장품 광고 캠페인을 만들어주세요",
    "context": {
        "brand": "EcoBeauty",
        "target_audience": "MZ세대"
    },
    "constraints": {},
    "preferences": {}
}
```

**Output 스키마**:
```json
{
    "workflow_id": "wf_20251121153045",
    "tasks": [
        {
            "task_id": "task_001",
            "description": "트렌드 데이터 수집",
            "agent_type": "trend_collector",
            "priority": "high",
            "dependencies": [],
            "estimated_duration": 5.0
        }
    ],
    "execution_mode": "mixed",
    "total_estimated_time": 40.0,
    "resource_requirements": {
        "required_agents": {"trend_collector": 1, "copy_writer": 1},
        "estimated_memory_mb": 400
    }
}
```

**API 엔드포인트**: `POST /api/v1/agents/pm/execute`

**KPI**:
- Planning Time: <5초
- Plan Accuracy: >90%
- Workflow Success Rate: >85%

---

#### 18. QAAgent ✅ **구현 완료**

**역할**: 콘텐츠 품질 검증 및 테스트 전문 Agent

**파일**: [app/services/agents/qa.py](app/services/agents/qa.py)

**구현 상태**:
- ✅ Agent 클래스 구현 완료 (2025-11-21)
- ✅ 문법/맞춤법 검사
- ✅ 브랜드 가이드라인 준수 확인
- ✅ SEO 최적화 검증
- ✅ 접근성 검사
- ✅ 자동 수정 기능

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `quality_check` | 종합 품질 검증 | `content`, `content_type`, `checks` | `qa_report` |
| `brand_compliance` | 브랜드 준수 검사 | `content`, `brand_guidelines` | `compliance_check` |
| `seo_analysis` | SEO 분석 | `content`, `keywords` | `seo_analysis` |
| `accessibility_check` | 접근성 검사 | `content` | `accessibility_report` |
| `grammar_check` | 문법 검사 | `content` | `grammar_issues` |
| `auto_fix` | 자동 수정 | `content`, `issues` | `fixed_content` |

**Input 스키마**:
```json
{
    "content": "비건 화장품으로 아름다워지세요!",
    "content_type": "text",
    "checks": ["grammar", "spelling", "brand_alignment", "seo"],
    "brand_guidelines": {
        "tone": "professional",
        "banned_words": []
    }
}
```

**Output 스키마**:
```json
{
    "overall_quality": "excellent",
    "quality_score": 92.5,
    "issues": [
        {
            "issue_id": "seo_001",
            "check_type": "seo",
            "severity": "medium",
            "description": "타겟 키워드 밀도가 낮습니다",
            "suggestion": "관련 키워드를 추가하세요",
            "auto_fixable": false
        }
    ],
    "passed_checks": ["grammar", "spelling", "brand_alignment"],
    "failed_checks": ["seo"],
    "recommendations": ["키워드 밀도를 높이세요"],
    "execution_time": 0.25
}
```

**API 엔드포인트**: `POST /api/v1/agents/qa/execute`

**KPI**:
- Quality Detection Accuracy: >95%
- False Positive Rate: <5%
- 검사 시간: <1초

---

#### 19. ErrorHandlerAgent ✅ **구현 완료**

**역할**: 에러 처리 및 자동 복구 전문 Agent

**파일**: [app/services/agents/error_handler.py](app/services/agents/error_handler.py)

**구현 상태**:
- ✅ Agent 클래스 구현 완료 (2025-11-21)
- ✅ 에러 감지 및 분류
- ✅ 심각도 평가
- ✅ 자동 복구 시도 (재시도, 폴백)
- ✅ 에러 패턴 학습
- ✅ 알림 시스템

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `handle_error` | 에러 처리 | `error_report` | `handling_result` |
| `analyze_error` | 에러 분석 | `error_report` | `error_analysis` |
| `retry_operation` | 작업 재시도 | `operation`, `retry_config` | `retry_result` |
| `get_error_summary` | 에러 요약 | `time_range` | `error_summary` |
| `suggest_fix` | 수정 방법 제안 | `error_id` | `suggestions` |

**Input 스키마**:
```json
{
    "error_id": "err_001",
    "timestamp": "2025-11-21T15:30:00Z",
    "error_type": "ConnectionError",
    "error_message": "Database connection timeout",
    "stacktrace": "...",
    "context": {"database": "postgresql"},
    "affected_component": "database"
}
```

**Output 스키마**:
```json
{
    "error_id": "err_001",
    "handled": true,
    "analysis": {
        "severity": "high",
        "category": "database",
        "root_cause": "작업 처리 시간 초과",
        "recommended_action": "retry"
    },
    "recovery_attempted": true,
    "recovery_result": {
        "success": true,
        "attempts": 2,
        "strategy": "retry"
    },
    "notification_sent": true
}
```

**API 엔드포인트**: `POST /api/v1/agents/error_handler/execute`

**KPI**:
- Error Recovery Rate: >70%
- Mean Time To Recovery: <5분
- False Alarm Rate: <10%

---

#### 20. LoggerAgent ✅ **구현 완료**

**역할**: 시스템 로깅 및 성능 모니터링 전문 Agent

**파일**: [app/services/agents/logger.py](app/services/agents/logger.py)

**구현 상태**:
- ✅ Agent 클래스 구현 완료 (2025-11-21)
- ✅ 구조화된 로깅
- ✅ 성능 메트릭 추적
- ✅ 로그 검색 및 필터링
- ✅ 실시간 모니터링
- ✅ 알림 시스템

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `log` | 로그 기록 | `log_entry` | `log_result` |
| `record_metric` | 메트릭 기록 | `metric_entry` | `metric_result` |
| `query_logs` | 로그 쿼리 | `query` | `log_results` |
| `get_stats` | 로그 통계 | `time_range` | `log_stats` |
| `get_performance` | 성능 메트릭 | - | `performance_metrics` |
| `set_alert` | 알림 설정 | `alert_rule` | `alert_config` |

**Input 스키마**:
```json
{
    "timestamp": "2025-11-21T15:30:00Z",
    "level": "info",
    "category": "application",
    "message": "사용자 로그인 성공",
    "source": "auth_service",
    "user_id": "user_001",
    "metadata": {"ip": "192.168.1.1"}
}
```

**Output 스키마**:
```json
{
    "logged": true,
    "timestamp": "2025-11-21T15:30:00Z",
    "level": "info",
    "alerts_triggered": 0
}
```

**API 엔드포인트**: `POST /api/v1/agents/logger/execute`

**KPI**:
- Log Collection Rate: >99.9%
- Query Response Time: <100ms
- Storage Efficiency: >80%

---

### Orchestration Agents (4개)

#### 21. WorkflowExecutor

**역할**: 사전 정의된 워크플로우 실행

**파일**: [app/services/orchestrator/base.py](app/services/orchestrator/base.py)

**구현 상태**: ✅ 완료

#### 22. ProductContentWorkflow

**역할**: 제품 콘텐츠 생성 워크플로우 (Copywriter → Reviewer → Optimizer)

**구현 상태**: ✅ 완료

#### 23. BrandIdentityWorkflow

**역할**: 브랜드 아이덴티티 워크플로우 (Strategist → Copywriter → Reviewer)

**구현 상태**: ✅ 완료

#### 24. ContentReviewWorkflow

**역할**: 콘텐츠 검토 워크플로우 (Reviewer → Editor → Reviewer)

**구현 상태**: ✅ 완료

---

## Agent API 엔드포인트

### 공통 엔드포인트 구조

모든 Agent는 통일된 REST API 엔드포인트를 제공합니다:

```
POST /api/v1/agents/{agent_name}/execute
```

### Request 형식

```json
{
    "task": "task_name",
    "payload": {
        "param1": "value1",
        "param2": "value2"
    },
    "options": {
        "tone": "professional",
        "length": "medium"
    }
}
```

### Response 형식

```json
{
    "agent": "agent_name",
    "task": "task_name",
    "outputs": [
        {
            "type": "json",
            "name": "output_name",
            "value": {...},
            "meta": {...}
        }
    ],
    "usage": {
        "llm_tokens": 350,
        "total_tokens": 350,
        "elapsed_seconds": 2.5
    },
    "meta": {
        "llm_provider": "ollama",
        "llm_model": "qwen2.5:7b"
    }
}
```

### 엔드포인트 목록 (구현 완료)

| Agent | 엔드포인트 | 메서드 | 상태 |
|-------|-----------|--------|------|
| Copywriter | `/api/v1/agents/copywriter/execute` | POST | ✅ |
| Strategist | `/api/v1/agents/strategist/execute` | POST | ✅ |
| Designer | `/api/v1/agents/designer/execute` | POST | ✅ |
| Reviewer | `/api/v1/agents/reviewer/execute` | POST | ✅ |
| Optimizer | `/api/v1/agents/optimizer/execute` | POST | ✅ |
| Editor | `/api/v1/agents/editor/execute` | POST | ✅ |
| VisionAnalyzer | `/api/v1/agents/vision_analyzer/execute` | POST | ✅ |

### 엔드포인트 목록 (예정)

| Agent | 엔드포인트 | 메서드 | 예정 |
|-------|-----------|--------|------|
| ScenePlanner | `/api/v1/agents/scene_planner/execute` | POST | Phase 2 |
| Template | `/api/v1/agents/template/execute` | POST | Phase 2 |
| TrendCollector | `/api/v1/agents/trend_collector/execute` | POST | Phase 3 |
| DataCleaner | `/api/v1/agents/data_cleaner/execute` | POST | Phase 3 |
| Embedder | `/api/v1/agents/embedder/execute` | POST | Phase 3 |
| Ingestor | `/api/v1/agents/ingestor/execute` | POST | Phase 3 |
| PerformanceAnalyzer | `/api/v1/agents/performance_analyzer/execute` | POST | Phase 3 |
| SelfLearning | `/api/v1/agents/self_learning/execute` | POST | Phase 3 |
| RAG | `/api/v1/agents/rag/execute` | POST | Phase 3 |
| PM | `/api/v1/agents/pm/execute` | POST | Phase 4 |
| Security | `/api/v1/agents/security/execute` | POST | Phase 4 |
| Budget | `/api/v1/agents/budget/execute` | POST | Phase 4 |
| AD | `/api/v1/agents/ad/execute` | POST | Phase 4 |

---

## 공통 스키마

### AgentRequest

```python
class AgentRequest(BaseModel):
    task: str
    payload: Dict[str, Any]
    options: Optional[Dict[str, Any]] = None
```

### AgentResponse

```python
class AgentResponse(BaseModel):
    agent: str
    task: str
    outputs: List[AgentOutput]
    usage: Dict[str, Any]
    meta: Dict[str, Any]
```

### AgentOutput

```python
class AgentOutput(BaseModel):
    type: str  # "json" | "text" | "image" | "video"
    name: str
    value: Any
    meta: Optional[Dict[str, Any]] = None
```

### AgentError

```python
class AgentError(Exception):
    message: str
    agent: str
    details: Optional[Dict[str, Any]] = None
```

---

## 에러 처리

### 에러 코드

| 코드 | 설명 | HTTP Status |
|-----|------|-------------|
| `AGENT_NOT_FOUND` | Agent를 찾을 수 없음 | 404 |
| `INVALID_REQUEST` | 잘못된 요청 형식 | 400 |
| `MISSING_PARAMETER` | 필수 파라미터 누락 | 400 |
| `EXECUTION_FAILED` | Agent 실행 실패 | 500 |
| `LLM_ERROR` | LLM Provider 오류 | 503 |
| `TIMEOUT` | 실행 시간 초과 | 504 |
| `QUOTA_EXCEEDED` | API 할당량 초과 | 429 |

### 에러 응답 형식

```json
{
    "error": {
        "code": "EXECUTION_FAILED",
        "message": "Copywriter execution failed: LLM timeout",
        "agent": "copywriter",
        "details": {
            "task": "product_detail",
            "provider": "ollama"
        }
    }
}
```

### Retry 정책

Frontend에서 Agent API 호출 시 권장 Retry 정책:

| 에러 코드 | Retry 여부 | Max Attempts | Backoff |
|----------|-----------|--------------|---------|
| `LLM_ERROR` | ✅ | 3 | Exponential (1s, 2s, 4s) |
| `TIMEOUT` | ✅ | 2 | Exponential (2s, 4s) |
| `QUOTA_EXCEEDED` | ✅ | 3 | Fixed (60s) |
| `INVALID_REQUEST` | ❌ | 0 | - |
| `MISSING_PARAMETER` | ❌ | 0 | - |

---

## 부록

### A. Frontend 연동 가이드

#### 예시: Copywriter Agent 호출 (JavaScript)

```javascript
async function generateProductCopy(productInfo) {
    const response = await fetch('/api/v1/agents/copywriter/execute', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            task: 'product_detail',
            payload: {
                product_name: productInfo.name,
                features: productInfo.features,
                target_audience: productInfo.target
            },
            options: {
                tone: 'professional',
                length: 'medium'
            }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message);
    }

    const result = await response.json();
    return result.outputs[0].value;
}
```

#### 예시: VisionAnalyzer Agent 호출 (TypeScript)

```typescript
interface VisionAnalysisRequest {
    task: 'image_analysis';
    payload: {
        image_url: string;
        criteria: {
            composition: boolean;
            color_harmony: boolean;
            brand_consistency: boolean;
            technical_quality: boolean;
        };
        brand_guidelines?: {
            primary_colors: string[];
            style: string;
            tone: string;
        };
    };
}

async function analyzeImage(imageUrl: string, brandGuidelines?: any) {
    const request: VisionAnalysisRequest = {
        task: 'image_analysis',
        payload: {
            image_url: imageUrl,
            criteria: {
                composition: true,
                color_harmony: true,
                brand_consistency: !!brandGuidelines,
                technical_quality: true
            },
            brand_guidelines: brandGuidelines
        }
    };

    const response = await fetch('/api/v1/agents/vision_analyzer/execute', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request)
    });

    const result = await response.json();
    return result.outputs[0].value;
}
```

---

### B. 참고 문서

| 문서 | 경로 | 설명 |
|-----|------|------|
| Agent 확장 플랜 | [AGENT_EXPANSION_PLAN_2025-11-18.md](AGENT_EXPANSION_PLAN_2025-11-18.md) | 8주 확장 로드맵 |
| Agent API 명세 (v4) | [docs/OPENAPI_SPEC_V4_AGENT.md](docs/OPENAPI_SPEC_V4_AGENT.md) | OpenAPI 3.0 명세 |
| C팀 통합 검토 | [C_TEAM_INTEGRATION_REVIEW_2025-11-19.md](C_TEAM_INTEGRATION_REVIEW_2025-11-19.md) | C팀 요청사항 검토 |

---

### C. 용어 정의

| 용어 | 정의 |
|-----|------|
| **Agent** | 특정 작업을 수행하는 독립적인 AI 컴포넌트 |
| **Task** | Agent가 수행할 수 있는 개별 작업 (예: `product_detail`, `brand_kit`) |
| **Payload** | Agent에 전달되는 입력 데이터 |
| **Output** | Agent가 반환하는 결과 데이터 |
| **LLM Gateway** | LLM Provider를 추상화한 통합 인터페이스 |
| **Vision API** | 이미지 분석을 지원하는 LLM API (GPT-4V, Claude 3.5 Sonnet) |
| **Mock Mode** | 실제 API 호출 없이 더미 데이터를 반환하는 개발 모드 |
| **Workflow** | 여러 Agent를 조합한 실행 파이프라인 |

---

## 업데이트 히스토리

| 버전 | 날짜 | 변경 사항 | 작성자 |
|-----|------|----------|--------|
| v1.0 | 2025-11-19 | 초안 작성 (7개 구현 Agent + 17개 계획 Agent) | B팀 |

---

**문서 종료**

**다음 단계**:
1. A팀/C팀에 본 명세서 전달
2. Phase 2-3 Agent 구현 시작
3. 008_AGENTS_INTEGRATION.md 작성 (통합 가이드)

**질문/피드백**: B팀 Slack 채널 #backend-agents

---

**작성자**: B팀 (Backend)
**최종 검토**: 2025년 11월 19일 (수요일)
**승인**: 대기 중
