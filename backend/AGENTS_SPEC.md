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

### 7. VisionAnalyzerAgent

**역할**: 생성 이미지 품질 자동 평가 전문 Agent

**파일**: [app/services/agents/vision_analyzer.py](app/services/agents/vision_analyzer.py)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `image_analysis` | 이미지 종합 분석 | `image_url`, `criteria`, `brand_guidelines` | `quality_score`, `composition`, `color_harmony`, `brand_consistency`, `technical_quality`, `improvements` |
| `composition_check` | 구도 분석 | `image_url` | `composition` 분석 |
| `color_check` | 색상 조화 분석 | `image_url` | `color_harmony` 분석 |
| `brand_check` | 브랜드 일관성 체크 | `image_url`, `brand_guidelines` | `brand_consistency` 분석 |
| `quality_check` | 기술적 품질 평가 | `image_url` | `technical_quality` 분석 |

**사용 예시**:
```python
response = await vision_analyzer.execute(AgentRequest(
    task="image_analysis",
    payload={
        "image_url": "https://example.com/product.jpg",
        "criteria": {
            "composition": True,
            "color_harmony": True,
            "brand_consistency": True,
            "technical_quality": True
        },
        "brand_guidelines": {
            "primary_colors": ["#FF0000", "#0000FF"],
            "style": "minimalist",
            "tone": "professional"
        }
    }
))

# response.outputs[0].value:
{
    "quality_score": 0.87,
    "composition": {
        "score": 0.9,
        "analysis": "요소 배치가 균형적이며 시선 흐름이 자연스러움",
        "issues": ["텍스트와 이미지 간격이 약간 좁음"]
    },
    "color_harmony": {
        "score": 0.85,
        "analysis": "색상 조합이 조화로우며 브랜드 아이덴티티를 잘 반영함",
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
        "배경색을 약간 밝게 조정하여 가독성 향상"
    ],
    "overall_verdict": "good",
    "requires_regeneration": False
}
```

**Vision API Provider**: Claude 3.5 Sonnet (Primary) / GPT-4o (Fallback)

**KPI**:
- 분석 정확도: >95%
- 응답 시간: <3초
- False Positive Rate: <5%

**구현 상태**: ✅ STEP 1-2 완료 (2025-11-19)
- Agent 클래스 구현
- Vision API 통합 (LLM Gateway)
- 기본 테스트 완료

**남은 작업**:
- STEP 3: 품질 평가 로직 고도화 (2일)
- STEP 4: 통합 테스트 (2일)
- STEP 5: 문서화 (1일)

---

## 계획된 Agent (17개)

### Creation Agents (2개)

#### 8. ScenePlannerAgent (P1)

**역할**: 광고 영상·쇼츠의 씬 구성 설계 전문 Agent

**예상 구현**: Phase 2 (2025-12-02~12-15)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `scene_plan` | 씬 구성 설계 | `product_info`, `duration`, `style` | `scenes` 배열 |
| `storyboard` | 스토리보드 생성 | `concept`, `duration` | `storyboard` JSON |

**Input 스키마**:
```json
{
    "product_info": {
        "name": "무선 이어폰 X1",
        "features": ["노이즈캔슬링", "24시간 배터리"]
    },
    "duration": 30,
    "style": "modern"
}
```

**Output 스키마**:
```json
{
    "scenes": [
        {
            "id": "scene_001",
            "duration": 3.5,
            "description": "제품 클로즈업 + 자연 배경",
            "shots": [
                {"type": "close_up", "duration": 1.5, "angle": "45deg"},
                {"type": "medium", "duration": 2.0, "angle": "front"}
            ],
            "audio": "경쾌한 배경음악",
            "text_overlay": "완벽한 몰입"
        }
    ],
    "total_duration": 30.0,
    "scene_count": 5
}
```

**API 엔드포인트**: `POST /api/v1/agents/scene_planner/execute`

**LLM Provider**: Ollama (Qwen2.5:7b)

**KPI**:
- Scene Clarity: >85%
- 응답 시간: <10초

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

#### 10. TrendCollectorAgent (P1)

**역할**: 트렌드 데이터 크롤링 전문 Agent (Naver, Instagram, YouTube)

**예상 구현**: Phase 3 (2025-12-16~12-29)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `collect_trends` | 트렌드 데이터 수집 | `keywords`, `sources`, `period` | `collected_data` 배열 |

**Input 스키마**:
```json
{
    "keywords": ["친환경", "비건"],
    "sources": ["naver_trends", "instagram", "youtube"],
    "period": {"start": "2025-01-01", "end": "2025-01-31"}
}
```

**Output 스키마**:
```json
{
    "collected_data": [
        {
            "source": "naver_trends",
            "keyword": "친환경",
            "volume": 12500,
            "trend": "rising",
            "growth_rate": 0.35,
            "related_keywords": ["제로웨이스트", "업사이클링"]
        }
    ],
    "metadata": {
        "total_items": 1250,
        "collection_time": 45.2,
        "success_rate": 0.98
    }
}
```

**API 엔드포인트**: `POST /api/v1/agents/trend_collector/execute`

**연동**: Selenium + BeautifulSoup + Naver API

**KPI**:
- Collection Success Rate: >95%
- 처리 속도: >100 items/min

---

#### 11. DataCleanerAgent (P1)

**역할**: 수집 데이터 정제 전문 Agent (HTML 제거, 중복 제거, OCR)

**예상 구현**: Phase 3 (2025-12-16~12-29)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `clean_data` | 데이터 정제 | `raw_data`, `options` | `cleaned_data` |

**Input 스키마**:
```json
{
    "raw_data": [
        {"text": "<p>HTML 태그 포함 텍스트</p>", "source": "web"}
    ],
    "options": {
        "remove_html": true,
        "remove_duplicates": true,
        "ocr_enabled": false
    }
}
```

**Output 스키마**:
```json
{
    "cleaned_data": [
        {"text": "HTML 태그 포함 텍스트", "source": "web"}
    ],
    "stats": {
        "original_count": 1000,
        "cleaned_count": 850,
        "duplicates_removed": 150
    }
}
```

**API 엔드포인트**: `POST /api/v1/agents/data_cleaner/execute`

**KPI**:
- Cleaning Accuracy: >95%
- 처리 속도: >500 items/sec

---

#### 12. EmbedderAgent (P1)

**역할**: 텍스트 임베딩 생성 전문 Agent

**예상 구현**: Phase 3 (2025-12-16~12-29)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `embed_texts` | 텍스트 임베딩 | `texts`, `model` | `embeddings` 배열 |

**Input 스키마**:
```json
{
    "texts": ["텍스트1", "텍스트2"],
    "model": "text-embedding-3-large"
}
```

**Output 스키마**:
```json
{
    "embeddings": [
        {"text": "텍스트1", "embedding": [0.1, 0.2, ..., 0.9], "dimension": 1536},
        {"text": "텍스트2", "embedding": [0.3, 0.4, ..., 0.8], "dimension": 1536}
    ],
    "metadata": {
        "model": "text-embedding-3-large",
        "total_tokens": 120
    }
}
```

**API 엔드포인트**: `POST /api/v1/agents/embedder/execute`

**Provider**: OpenAI (text-embedding-3-large) / SentenceTransformers (BGE-M3)

**KPI**:
- Embedding Generation: <1s per 100 texts
- Cache Hit Rate: >70%

---

#### 13. IngestorAgent (P1)

**역할**: 데이터 저장 전문 Agent (PostgreSQL, Redis, S3)

**예상 구현**: Phase 3 (2025-12-16~12-29)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `ingest_data` | 데이터 저장 | `data`, `destination` | `ingestion_result` |

**Input 스키마**:
```json
{
    "data": [
        {"text": "...", "embedding": [...], "metadata": {...}}
    ],
    "destination": "postgresql",
    "options": {
        "batch_size": 1000,
        "cache_enabled": true
    }
}
```

**Output 스키마**:
```json
{
    "ingestion_result": {
        "success": true,
        "inserted_count": 1000,
        "failed_count": 0,
        "duration": 2.5
    }
}
```

**API 엔드포인트**: `POST /api/v1/agents/ingestor/execute`

**KPI**:
- Insertion Rate: >1000 records/sec
- Error Rate: <1%

---

#### 14. PerformanceAnalyzerAgent (P2)

**역할**: SNS·광고 성과 데이터 분석 전문 Agent

**예상 구현**: Phase 3 (2025-12-16~12-29)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `analyze_performance` | 성과 분석 | `platform`, `post_id` | `metrics`, `insights` |

**Input 스키마**:
```json
{
    "platform": "instagram",
    "post_id": "abc123"
}
```

**Output 스키마**:
```json
{
    "metrics": {
        "likes": 1250,
        "comments": 45,
        "shares": 12,
        "engagement_rate": 0.083
    },
    "performance_grade": 0.85,
    "insights": [
        "감성형 짧은 카피의 CTR이 35% 높음",
        "주말 오전 게시물의 engagement가 40% 높음"
    ]
}
```

**API 엔드포인트**: `POST /api/v1/agents/performance_analyzer/execute`

**연동**: Instagram API, Naver Ad API

**KPI**:
- Data Collection Rate: >95%
- 분석 정확도: >90%

---

#### 15. SelfLearningAgent (P2)

**역할**: 사용자 피드백 기반 브랜드 벡터 조정 전문 Agent

**예상 구현**: Phase 3 (2025-12-16~12-29)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `update_brand_vector` | 브랜드 벡터 업데이트 | `brand_id`, `feedback_data` | `updated_vector` |

**Input 스키마**:
```json
{
    "brand_id": "brand_001",
    "feedback_data": [
        {"content_id": "c001", "rating": 4.5, "feedback": "톤이 좋음"}
    ]
}
```

**Output 스키마**:
```json
{
    "updated_vector": {
        "brand_id": "brand_001",
        "vector": [0.1, 0.2, ..., 0.9],
        "confidence": 0.92
    }
}
```

**API 엔드포인트**: `POST /api/v1/agents/self_learning/execute`

**KPI**:
- Learning Effectiveness: >85%
- 업데이트 시간: <2초

---

#### 16. RAGAgent (P1)

**역할**: 지식 검색 및 컨텍스트 제공 전문 Agent

**예상 구현**: Phase 3 (2025-12-16~12-29)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `search_knowledge` | 지식 검색 | `query`, `brand_id`, `top_k` | `results`, `summary` |

**Input 스키마**:
```json
{
    "query": "비건 화장품 트렌드",
    "brand_id": "brand_001",
    "top_k": 5
}
```

**Output 스키마**:
```json
{
    "results": [
        {
            "content": "비건 화장품 시장은 2025년 35% 성장 예상...",
            "source": "report_2025.pdf",
            "relevance_score": 0.92,
            "metadata": {"date": "2025-01-15"}
        }
    ],
    "summary": "비건 화장품 시장 급성장 중, MZ세대 주도"
}
```

**API 엔드포인트**: `POST /api/v1/agents/rag/execute`

**연동**: PostgreSQL (pgvector) + Embedding

**KPI**:
- Retrieval@10: >0.85
- 응답 시간: <2초

---

### System Agents (4개)

#### 17. PMAgent (P2)

**역할**: 전체 워크플로우 조율 및 태스크 분배 Agent

**예상 구현**: Phase 4 (2025-12-30~2026-01-12)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `plan_workflow` | 워크플로우 계획 | `user_request` (자연어) | `execution_plan` |

**Input 스키마**:
```json
{
    "user_request": "친환경 비건 화장품 브랜드 론칭을 위한 마케팅 콘텐츠 생성해줘"
}
```

**Output 스키마**:
```json
{
    "execution_plan": [
        {"agent": "StrategistAgent", "task": "brand_kit", "priority": "P0"},
        {"agent": "CopywriterAgent", "task": "brand_message", "priority": "P0"},
        {"agent": "DesignerAgent", "task": "brand_logo", "priority": "P1"}
    ],
    "estimated_time": 180,
    "estimated_cost": 15000
}
```

**API 엔드포인트**: `POST /api/v1/agents/pm/execute`

**LLM Provider**: GPT-4o / Claude 3.5 Sonnet

**KPI**:
- Planning Time: <5초
- Plan Accuracy: >90%

---

#### 18. SecurityAgent (P2)

**역할**: 민감정보 탐지 및 정책 위반 검사 Agent

**예상 구현**: Phase 4 (2025-12-30~2026-01-12)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `check_compliance` | 컴플라이언스 검사 | `content`, `policy` | `compliance_status`, `violations` |

**Input 스키마**:
```json
{
    "content": {
        "text": "...",
        "images": ["url1", "url2"]
    },
    "policy": "korea_pii"
}
```

**Output 스키마**:
```json
{
    "compliance_status": true,
    "violations": [],
    "risk_score": 0.05,
    "details": {
        "pii_detected": false,
        "offensive_content": false
    }
}
```

**API 엔드포인트**: `POST /api/v1/agents/security/execute`

**연동**: PII Detection Library

**KPI**:
- False Positive Rate: <5%
- 검사 시간: <1초

---

#### 19. BudgetAgent (P2)

**역할**: LLM Token/Cost 추적 및 비용 최적화 Agent

**예상 구현**: Phase 4 (2025-12-30~2026-01-12)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `track_cost` | 비용 추적 | `project_id`, `budget_limit` | `current_spend`, `projected_spend`, `optimization_opportunities` |

**Input 스키마**:
```json
{
    "project_id": "proj_001",
    "budget_limit": 50000
}
```

**Output 스키마**:
```json
{
    "current_spend": 12500,
    "projected_spend": 45000,
    "breakdown": {
        "llm_tokens": 8000,
        "image_generation": 3500,
        "data_storage": 1000
    },
    "optimization_opportunities": [
        {"area": "LLM", "potential_savings": 2000, "suggestion": "Ollama 활용 확대"}
    ]
}
```

**API 엔드포인트**: `POST /api/v1/agents/budget/execute`

**연동**: Prometheus + Cost Tracking DB

**KPI**:
- Cost Prediction Accuracy: ±10%
- 최적화 제안 수용률: >60%

---

#### 20. ADAgent (P2)

**역할**: 광고 퍼포먼스 최적화 Agent (Google Ads, Naver, Kakao)

**예상 구현**: Phase 4 (2025-12-30~2026-01-12)

**지원 작업**:
| Task | 설명 | Input | Output |
|------|------|-------|--------|
| `optimize_campaign` | 캠페인 최적화 | `campaign_info`, `performance_data` | `optimizations` |

**Input 스키마**:
```json
{
    "campaign_info": {
        "platform": "google_ads",
        "campaign_id": "camp_001"
    },
    "performance_data": {
        "ctr": 0.02,
        "cpc": 500
    }
}
```

**Output 스키마**:
```json
{
    "optimizations": [
        {
            "element": "keyword_bid",
            "current": 500,
            "recommended": 650,
            "expected_impact": "+15% CTR",
            "confidence": 0.85
        }
    ]
}
```

**API 엔드포인트**: `POST /api/v1/agents/ad/execute`

**연동**: Google Ads API, Naver Ad API

**KPI**:
- ROI Improvement: >20%
- 최적화 정확도: >85%

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
