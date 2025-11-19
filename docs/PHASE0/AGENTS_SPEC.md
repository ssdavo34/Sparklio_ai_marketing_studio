# Multi-Agent A2A System Specification

> **Version**: 2.0
> **Date**: 2025-01-13
> **Status**: Final
> **Owner**: AI Engineering Team

---

## Sparklio.ai — Multi-Agent A2A System Specification
**16 Agents + TrendPipeline + Brand Learning**

본 문서는 Sparklio.ai의 전체 에이전트 아키텍처(A2A Protocol 기반)와 각 에이전트의 **역할, 입력/출력, KPI, 에러 처리**, 그리고 **TrendPipeline/Brand Learning Engine**과의 연동 구조를 정의합니다.

---

# 1. Architecture Overview

Sparklio의 에이전트 시스템은 다음 **3축**으로 구성됩니다:

## 1.1 Agent Categories

### A. Creation Agents (카피/이미지/영상 생성)
- StrategistAgent
- CopywriterAgent
- VisionGeneratorAgent
- VisionAnalyzerAgent
- ScenePlannerAgent
- StoryboardBuilderAgent
- VideoDirectorAgent
- VideoReviewerAgent
- TemplateAgent

### B. Intelligence Agents (브랜드 학습·트렌드·분석)
- **TrendCollectorAgent** ← DATA_PIPELINE_PLAN.md Collector
- **DataCleanerAgent** ← DATA_PIPELINE_PLAN.md Cleaner
- **EmbedderAgent** ← DATA_PIPELINE_PLAN.md Embedder
- **IngestorAgent** ← DATA_PIPELINE_PLAN.md Ingestor
- **ReviewerAgent** ← BRAND_LEARNING_ENGINE.md Self-Learning Loop
- **PerformanceAnalyzerAgent** ← BRAND_LEARNING_ENGINE.md Performance Analyzer
- **SelfLearningAgent** ← BRAND_LEARNING_ENGINE.md Core
- **BrandModelUpdaterAgent** ← BRAND_LEARNING_ENGINE.md Prompt Tuner + Style Model Builder
- **RAGAgent** ← DATA_PIPELINE_PLAN.md RAG Engine
- **TrendAgent** (기존 유지)
- **DataCollectorAgent** (기존 유지, TrendCollectorAgent와 통합 예정)

### C. System Agents (시스템 안정성·비용·보안)
- PMAgent
- SecurityAgent
- BudgetAgent
- ADAgent

## 1.2 A2A Protocol

에이전트 간 통신은 **A2A 표준 프로토콜** 기반으로 이루어집니다.

### Request Format

```json
{
  "message_id": "uuid-v4",
  "timestamp": "ISO8601",
  "sender": "agent_name",
  "receiver": "agent_name",
  "correlation_id": "parent_message_id",
  "priority": "P0|P1|P2",
  "payload": {
    "task": "task_name",
    "data": { }
  }
}
```

### Response Format

```json
{
  "message_id": "uuid-v4",
  "timestamp": "ISO8601",
  "correlation_id": "request_message_id",
  "status": "ok | error | partial",
  "payload": { ... },
  "error": null,
  "metrics": {
    "processing_time": 5.2,
    "tokens_used": 1500,
    "model": "gpt-4"
  }
}
```

---

# 2. Creation Agents (콘텐츠 생성)

## 2.1 StrategistAgent

**역할**: 브리프 기반 캠페인 전략·구조 설계

**입력**:
```json
{
  "brand_id": "uuid",
  "brief": {
    "goal": "신제품 런칭",
    "target_audience": "20-30대 여성",
    "budget": 5000000,
    "channels": ["instagram", "naver_blog"]
  }
}
```

**출력**:
```json
{
  "strategy": {
    "positioning": "자연주의 스킨케어 리더",
    "messaging": {
      "primary": "피부과학 기반 자연 성분",
      "secondary": "임상 테스트 완료",
      "tertiary": "지속 가능한 뷰티"
    },
    "channel_mix": [
      {"channel": "instagram", "weight": 0.6},
      {"channel": "naver_blog", "weight": 0.4}
    ],
    "timeline": {
      "phase1": "브랜드 인지도 (Week 1-2)",
      "phase2": "제품 소개 (Week 3-4)",
      "phase3": "전환 캠페인 (Week 5-6)"
    }
  },
  "structure": {
    "slides": 12,
    "outline": [
      {"slide": 1, "topic": "문제 제기"},
      {"slide": 2, "topic": "솔루션 소개"},
      {"slide": 3, "topic": "USP"},
      ...
    ]
  }
}
```

**KPI**:
- Strategic Clarity: > 85%
- Audience Fit: > 90%
- Execution Feasibility: > 80%

**연동**:
- TrendAgent → 시장 트렌드 반영
- BrandModelUpdaterAgent → 브랜드 스타일 가이드 적용

---

## 2.2 CopywriterAgent

**역할**: 텍스트·카피·슬라이드 문구 생성

**입력**:
```json
{
  "brand_id": "uuid",
  "brief": {
    "task": "headline",
    "tone": "professional_warm",
    "length": {"min": 5, "max": 10},
    "keywords": ["자연", "과학", "지속가능"]
  }
}
```

**출력**:
```json
{
  "headline": {
    "primary": "자연에서 온 과학, 피부에 전하는 지속 가능한 아름다움",
    "alternatives": [
      "피부과학으로 증명된 자연의 힘",
      "자연과 과학이 만난 순간, 당신의 피부가 말합니다"
    ]
  },
  "body": "...",
  "cta": "지금 체험하기",
  "metadata": {
    "readability_score": 0.92,
    "tone_match": 0.89,
    "seo_score": 0.85
  }
}
```

**KPI**:
- Text Quality: > 90%
- Tone Consistency: > 90%
- SEO Score: > 80%

**연동**:
- BrandModelUpdaterAgent → 최신 Prompt Template 적용
- SelfLearningAgent → 브랜드 키워드 가중치 반영

---

## 2.3 VisionGeneratorAgent

**역할**: 이미지 생성 (NanoBanana, DALL·E, Stable Diffusion)

**입력**:
```json
{
  "brand_id": "uuid",
  "description": "자연 성분 스킨케어 제품",
  "style": "minimal_natural",
  "dimensions": {"width": 1024, "height": 1024},
  "brand_colors": ["#F2EDE8", "#7C4D3A"]
}
```

**출력**:
```json
{
  "images": [
    {
      "url": "https://cdn.sparklio.ai/image_001.png",
      "prompt_used": "natural skincare product, minimal style, warm tones...",
      "model": "dall-e-3",
      "metadata": {"generation_time": 12.5}
    }
  ],
  "variations": [...],
  "editing_suggestions": ["밝기 +10%", "대비 조정"]
}
```

**KPI**:
- Visual Quality: > 85%
- Brand Style Fit: > 90%
- Generation Time: < 30s (P90)

**연동**:
- BrandModelUpdaterAgent → Brand LoRA 모델 자동 적용

---

## 2.4 VisionAnalyzerAgent

**역할**: 생성 이미지 품질 평가

**출력**:
```json
{
  "quality_score": 0.87,
  "analysis": {
    "composition": {"balance": 0.9, "focal_point": "center"},
    "colors": {"brand_match": 0.92, "harmony": 0.88},
    "technical": {"resolution": "high", "sharpness": 0.85}
  },
  "issues": ["배경 노이즈 약간 있음"],
  "improvements": ["색상 채도 +5%"]
}
```

**KPI**:
- Analysis Accuracy: > 95%
- Issue Detection Rate: > 90%

---

## 2.5 ScenePlannerAgent

**역할**: 광고 영상·쇼츠의 씬 구성 설계

**출력**:
```json
{
  "scenes": [
    {
      "id": "scene_001",
      "duration": 3.5,
      "description": "제품 클로즈업 + 자연 배경",
      "shots": [
        {"type": "close_up", "duration": 1.5},
        {"type": "wide", "duration": 2.0}
      ],
      "transitions": ["fade_in"],
      "audio": {"bgm": true, "voiceover": false}
    }
  ],
  "timeline": {...}
}
```

---

## 2.6 StoryboardBuilderAgent

**역할**: 비디오 스토리보드 생성

**출력**:
```json
{
  "storyboard": [
    {
      "frame_id": "frame_001",
      "image": "https://cdn.sparklio.ai/storyboard_001.png",
      "description": "Opening scene - 제품 등장",
      "camera_angle": "overhead",
      "duration": 2.0
    }
  ],
  "pdf_url": "https://cdn.sparklio.ai/storyboard.pdf"
}
```

---

## 2.7 VideoDirectorAgent

**역할**: 영상 제작·컷 구성·타임라인 편집

**출력**:
```json
{
  "video": {
    "url": "https://cdn.sparklio.ai/video_001.mp4",
    "format": "mp4",
    "duration": 30.0,
    "resolution": "1920x1080",
    "fps": 30
  },
  "edl": "...",
  "project_file": "..."
}
```

**KPI**:
- Render Time: < 5min (P90)
- Video Quality: > 85%

---

## 2.8 VideoReviewerAgent

**역할**: 영상 품질 검사 (밝기·톤·장면일관성)

**출력**:
```json
{
  "quality_report": {
    "technical": {"resolution": "high", "fps": 30, "bitrate": "ok"},
    "creative": {"tone_consistency": 0.89, "scene_flow": 0.92},
    "compliance": {"platform": "youtube", "duration_ok": true}
  },
  "issues": ["Scene 3 밝기 불균형"],
  "recommendations": ["Scene 3 색보정 필요"]
}
```

**연동**:
- SelfLearningAgent → 영상 품질 피드백 학습

---

## 2.9 TemplateAgent

**역할**: 마케팅 템플릿 자동 생성기

**입력**:
```json
{
  "content_type": "landing_page",
  "industry": "cosmetics",
  "brand_id": "uuid"
}
```

**출력**:
```json
{
  "template": {
    "id": "tpl_landing_cosmetics_001",
    "structure": {
      "sections": ["hero", "features", "testimonials", "cta"],
      "layout": "single_column"
    },
    "variables": [
      {"name": "headline", "type": "string"},
      {"name": "hero_image", "type": "image"}
    ]
  }
}
```

**KPI**:
- Template Reuse Rate: > 70%

---

## 2.10 EditorAgent

**역할**: 자연어 명령을 EditorCommand로 변환하여 문서 편집 수행

**입력**:
```json
{
  "role": "editor",
  "task": "update_background",
  "document": { ... },
  "selection": ["obj_123"],
  "natural_language": "배경을 차분한 파란색 그라데이션으로 바꿔줘"
}
```

**출력**:
```json
{
  "commands": [
    {
      "type": "UPDATE_BACKGROUND",
      "payload": { "gradient": "..." }
    }
  ],
  "message": "배경을 변경했습니다."
}
```

**KPI**:
- Command Accuracy: > 95%
- Latency: < 2s

---

## 2.11 MeetingAIAgent

**역할**: 회의록 분석 및 초안 문서 생성

**입력**:
```json
{
  "transcript": "A: 이번 신제품은 20대 여성을 타겟으로...",
  "context": { "brand_id": "..." }
}
```

**출력**:
```json
{
  "summary": "신제품 런칭 캠페인 기획 회의...",
  "action_items": ["인스타 광고 시안 제작"],
  "draft_document": { ...EditorDocument }
}
```

**KPI**:
- Summary Accuracy: > 90%
- Draft Relevance: > 85%

---

# 3. Intelligence Agents (브랜드·트렌드·학습)

## 3.1 TrendCollectorAgent

**역할**: 키워드/SNS/경쟁사/광고 데이터 크롤링

**연동**: `DATA_PIPELINE_PLAN.md` → **Collector** 단계

**입력**:
```json
{
  "industry": "cosmetics",
  "keywords": ["자연주의", "비건"],
  "sources": ["naver_trends", "instagram", "youtube"],
  "time_range": {"start": "2025-01-01", "end": "2025-01-31"}
}
```

**출력**:
```json
{
  "collected_data": [
    {
      "source": "naver_trends",
      "keyword": "자연주의",
      "volume": 12500,
      "trend": "rising",
      "timestamp": "2025-01-13T10:00:00Z"
    },
    {
      "source": "instagram",
      "post_id": "12345",
      "content": "...",
      "likes": 3500,
      "comments": 250
    }
  ],
  "metadata": {
    "total_items": 1250,
    "collection_time": 45.2
  }
}
```

**KPI**:
- Collection Success Rate: > 95%
- Data Quality: > 90%
- Latency: < 60s (P90)

**구현**:
```python
# backend/agents/trend_collector_agent.py

from typing import Dict, List, Any
from datetime import datetime
import asyncio

class TrendCollectorAgent:
    """
    트렌드 데이터 수집 Agent
    """

    def __init__(self):
        self.crawlers = {
            'naver_trends': NaverTrendsCrawler(),
            'instagram': InstagramCrawler(),
            'youtube': YouTubeCrawler(),
            'news': NewsCrawler()
        }

    async def collect(
        self,
        industry: str,
        keywords: List[str],
        sources: List[str],
        time_range: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        트렌드 데이터 수집

        Returns:
            수집된 원본 데이터
        """
        tasks = []
        for source in sources:
            crawler = self.crawlers.get(source)
            if crawler:
                task = crawler.crawl(
                    keywords=keywords,
                    time_range=time_range
                )
                tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        collected_data = []
        for result in results:
            if isinstance(result, Exception):
                self.logger.error(f"Crawling failed: {result}")
                continue
            collected_data.extend(result)

        return {
            'collected_data': collected_data,
            'metadata': {
                'total_items': len(collected_data),
                'sources': sources,
                'timestamp': datetime.utcnow().isoformat()
            }
        }
```

---

## 3.2 DataCleanerAgent

**역할**: HTML 제거, 광고성 텍스트 제거, OCR 정제, 중복 제거

**연동**: `DATA_PIPELINE_PLAN.md` → **Cleaner** 단계

**입력**:
```json
{
  "raw_data": [
    {
      "content": "<div>피부에 좋은 자연 성분...</div>",
      "type": "html"
    },
    {
      "content": "image_base64...",
      "type": "image"
    }
  ]
}
```

**출력**:
```json
{
  "cleaned_data": [
    {
      "content": "피부에 좋은 자연 성분",
      "type": "text",
      "metadata": {"cleaned": true, "method": "html_strip"}
    }
  ],
  "removed_count": 15,
  "duplicate_count": 3
}
```

**KPI**:
- Cleaning Accuracy: > 95%
- Duplicate Detection: > 98%

**구현**:
```python
# backend/agents/data_cleaner_agent.py

from bs4 import BeautifulSoup
from typing import Dict, List, Any
import re

class DataCleanerAgent:
    """
    데이터 정제 Agent
    """

    def __init__(self):
        self.spam_patterns = [
            r'광고',
            r'클릭',
            r'이벤트 참여',
            r'지금 바로'
        ]

    async def clean(self, raw_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        데이터 정제

        Returns:
            정제된 데이터
        """
        cleaned_data = []
        removed_count = 0

        for item in raw_data:
            if item['type'] == 'html':
                cleaned = self._clean_html(item['content'])
            elif item['type'] == 'image':
                cleaned = await self._ocr_and_clean(item['content'])
            else:
                cleaned = self._clean_text(item['content'])

            # 스팸 필터링
            if self._is_spam(cleaned):
                removed_count += 1
                continue

            cleaned_data.append({
                'content': cleaned,
                'type': 'text',
                'metadata': {'cleaned': True}
            })

        # 중복 제거
        unique_data, duplicate_count = self._remove_duplicates(cleaned_data)

        return {
            'cleaned_data': unique_data,
            'removed_count': removed_count,
            'duplicate_count': duplicate_count
        }

    def _clean_html(self, html_content: str) -> str:
        """HTML 태그 제거 및 텍스트 추출"""
        soup = BeautifulSoup(html_content, 'html.parser')

        # 스크립트, 스타일 제거
        for script in soup(['script', 'style', 'nav', 'footer']):
            script.decompose()

        text = soup.get_text()

        # 공백 정리
        lines = (line.strip() for line in text.splitlines())
        text = '\n'.join(line for line in lines if line)

        return text

    def _is_spam(self, text: str) -> bool:
        """스팸 판별"""
        for pattern in self.spam_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False

    def _remove_duplicates(
        self,
        data: List[Dict[str, Any]]
    ) -> tuple[List[Dict[str, Any]], int]:
        """중복 제거 (해시 기반)"""
        import hashlib

        seen = set()
        unique_data = []
        duplicate_count = 0

        for item in data:
            content_hash = hashlib.md5(item['content'].encode()).hexdigest()
            if content_hash not in seen:
                seen.add(content_hash)
                unique_data.append(item)
            else:
                duplicate_count += 1

        return unique_data, duplicate_count
```

---

## 3.3 EmbedderAgent

**역할**: OpenAI / Llama3.1 / BGE 임베딩 생성

**연동**: `DATA_PIPELINE_PLAN.md` → **Embedder** 단계

**입력**:
```json
{
  "texts": [
    "자연 성분 기반 스킨케어...",
    "비건 인증 화장품..."
  ],
  "model": "text-embedding-ada-002"
}
```

**출력**:
```json
{
  "embeddings": [
    {
      "text": "자연 성분 기반 스킨케어...",
      "embedding": [0.012, -0.045, ...],
      "model": "text-embedding-ada-002",
      "dimensions": 1536
    }
  ]
}
```

**KPI**:
- Embedding Generation Time: < 1s per 100 texts
- Accuracy (Retrieval@10): > 0.85

**구현**:
```python
# backend/agents/embedder_agent.py

from typing import List, Dict, Any
import numpy as np

class EmbedderAgent:
    """
    임베딩 생성 Agent
    """

    def __init__(self):
        from sentence_transformers import SentenceTransformer

        self.models = {
            'ada-002': self._openai_embed,
            'multilingual-e5': SentenceTransformer('intfloat/multilingual-e5-large'),
            'bge-m3': SentenceTransformer('BAAI/bge-m3')
        }

    async def embed(
        self,
        texts: List[str],
        model: str = 'ada-002'
    ) -> Dict[str, Any]:
        """
        텍스트 임베딩 생성

        Returns:
            임베딩 벡터 리스트
        """
        if model == 'ada-002':
            embeddings = await self._openai_embed(texts)
        else:
            embedder = self.models[model]
            embeddings = embedder.encode(texts, batch_size=32)

        return {
            'embeddings': [
                {
                    'text': text,
                    'embedding': emb.tolist(),
                    'model': model,
                    'dimensions': len(emb)
                }
                for text, emb in zip(texts, embeddings)
            ]
        }

    async def _openai_embed(self, texts: List[str]) -> np.ndarray:
        """OpenAI Embedding API 호출"""
        import openai

        response = await openai.Embedding.acreate(
            model="text-embedding-ada-002",
            input=texts
        )

        embeddings = [item['embedding'] for item in response['data']]
        return np.array(embeddings)
```

---

## 3.4 IngestorAgent

**역할**: Postgres 저장, Redis 캐싱, S3 업로드

**연동**: `DATA_PIPELINE_PLAN.md` → **Ingestor** 단계

**입력**:
```json
{
  "embeddings": [...],
  "metadata": {...},
  "storage": ["postgres", "redis", "s3"]
}
```

**출력**:
```json
{
  "postgres": {"inserted": 125, "failed": 0},
  "redis": {"cached": 125},
  "s3": {"uploaded": 3, "urls": ["..."]}
}
```

**KPI**:
- Insertion Rate: > 1000 records/sec
- Error Rate: < 1%

---

## 3.5 ReviewerAgent

**역할**: 데이터 품질 평가 (중복·스팸·경쟁사 민감정보)

**연동**:
- `DATA_PIPELINE_PLAN.md` → **Reviewer** 단계
- `BRAND_LEARNING_ENGINE.md` → **Self-Learning Loop** 핵심 Agent

**입력**:
```json
{
  "content": {
    "text": "...",
    "images": [...]
  },
  "brand_kit": {...}
}
```

**출력**:
```json
{
  "scores": {
    "tone_consistency": 0.84,
    "visual_consistency": 0.78,
    "style_alignment": 0.81,
    "message_clarity": 0.89,
    "cta_strength": 0.76
  },
  "overall": 0.82,
  "suggestions": [
    "색상 팔레트를 브랜드 키트와 더 일치시켜주세요",
    "CTA 문구를 더 명확하게 수정해주세요"
  ],
  "flags": {
    "spam": false,
    "duplicate": false,
    "sensitive": false
  }
}
```

**KPI**:
- Review Accuracy: > 90%
- False Positive Rate: < 5%

**구현**:
```python
# backend/agents/reviewer_agent.py

from typing import Dict, Any
import numpy as np

class ReviewerAgent:
    """
    품질 평가 Agent (Data + Content)
    """

    def __init__(self):
        self.classifiers = {
            'spam': self._detect_spam,
            'duplicate': self._detect_duplicate,
            'tone': self._evaluate_tone
        }

    async def review(
        self,
        content: Dict[str, Any],
        brand_kit: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        콘텐츠 품질 평가

        Returns:
            평가 점수 + 개선 제안
        """
        scores = {
            'tone_consistency': await self._evaluate_tone(content, brand_kit),
            'visual_consistency': await self._evaluate_visual(content, brand_kit),
            'style_alignment': await self._evaluate_style(content, brand_kit),
            'message_clarity': await self._evaluate_clarity(content),
            'cta_strength': await self._evaluate_cta(content)
        }

        # 가중 평균
        weights = {
            'tone_consistency': 0.25,
            'visual_consistency': 0.25,
            'style_alignment': 0.20,
            'message_clarity': 0.15,
            'cta_strength': 0.15
        }

        overall_score = sum(scores[k] * weights[k] for k in scores)

        # 플래그 검사
        flags = {
            'spam': await self._detect_spam(content),
            'duplicate': await self._detect_duplicate(content),
            'sensitive': await self._detect_sensitive(content)
        }

        suggestions = await self._generate_suggestions(scores)

        return {
            'scores': scores,
            'overall': overall_score,
            'suggestions': suggestions,
            'flags': flags
        }
```

---

## 3.6 PerformanceAnalyzerAgent

**역할**: SNS·광고 성과 데이터 분석

**연동**: `BRAND_LEARNING_ENGINE.md` → **Performance Analyzer**

**입력**:
```json
{
  "brand_id": "uuid",
  "content_id": "uuid",
  "platform": "instagram",
  "post_id": "12345"
}
```

**출력**:
```json
{
  "metrics": {
    "likes": 1250,
    "comments": 45,
    "shares": 23,
    "saves": 89,
    "reach": 15000,
    "engagement_rate": 0.083
  },
  "performance_grade": 0.85,
  "insights": [
    "이 브랜드는 감성형 짧은 카피의 CTR이 평균 대비 35% 높습니다",
    "밝은 톤 이미지가 전환율 상승에 27% 기여했습니다"
  ]
}
```

**KPI**:
- Data Collection Rate: > 95%
- Insight Accuracy: > 80%

---

## 3.7 SelfLearningAgent

**역할**: 사용자 입력 + 반응 + 트렌드 기반 브랜드 벡터 조정

**연동**: `BRAND_LEARNING_ENGINE.md` → **Self-Learning Loop**

**입력**:
```json
{
  "brand_id": "uuid",
  "feedback": {
    "user_edits": [...],
    "reviewer_scores": {...},
    "performance_data": {...}
  }
}
```

**출력**:
```json
{
  "brand_vector_updated": true,
  "changes": {
    "keywords": {"자연": "+0.15", "과학": "+0.10"},
    "tone_preferences": {"warm": "+0.05"},
    "color_weights": {"#F2EDE8": "+0.08"}
  },
  "next_retrain_date": "2025-01-20"
}
```

**KPI**:
- Learning Effectiveness: > 85% (재학습 후 품질 향상)
- Update Frequency: 매주 1회 이상

---

## 3.8 BrandModelUpdaterAgent

**역할**: 프롬프트 규칙 업데이트 / 미니 파인튜닝 (로드맵)

**연동**: `BRAND_LEARNING_ENGINE.md` → **Prompt Tuner + Style Model Builder**

**입력**:
```json
{
  "brand_id": "uuid",
  "task_type": "headline",
  "feedback_history": [...]
}
```

**출력**:
```json
{
  "updated_prompt": "...",
  "lora_model_path": "models/lora/brand_12345/brand_style.safetensors",
  "improvement_estimate": "+12% quality, -20% edit time"
}
```

**KPI**:
- Prompt Optimization Effect: +15% quality
- Model Training Success Rate: > 90%

---

## 3.9 RAGAgent

**역할**: 지식 검색 및 컨텍스트 제공

**연동**: `DATA_PIPELINE_PLAN.md` → **RAG Engine**

**입력**:
```json
{
  "query": "비건 화장품 트렌드",
  "brand_id": "uuid",
  "top_k": 5
}
```

**출력**:
```json
{
  "results": [
    {
      "content": "비건 화장품 시장은 2025년 전년 대비 35% 성장...",
      "source": "cosmetics_trend_report_2025.pdf",
      "relevance_score": 0.92,
      "metadata": {"page": 15}
    }
  ],
  "summary": "비건 화장품 시장은 급성장 중이며, 20-30대 여성이 주요 구매층입니다.",
  "confidence": 0.89
}
```

**KPI**:
- Retrieval@10: > 0.85
- Query Latency: < 500ms (P90)

---

## 3.10 TrendAgent

**역할**: 트렌드 분석 및 인사이트 제공

**입력**:
```json
{
  "industry": "cosmetics",
  "keywords": ["비건", "자연주의"],
  "time_range": "30_days"
}
```

**출력**:
```json
{
  "trends": [
    {
      "topic": "비건 화장품",
      "momentum": 0.85,
      "sentiment": 0.78,
      "volume": 125000,
      "forecast": "계속 상승"
    }
  ],
  "insights": ["비건 인증이 구매 결정 요인 1위"],
  "recommendations": ["비건 인증 마크를 전면 배치"]
}
```

**KPI**:
- Forecast Accuracy: > 75%
- Insight Relevance: > 80%

---

## 3.11 DataCollectorAgent

**역할**: 데이터 수집 및 전처리 (TrendCollectorAgent와 통합 예정)

---

# 4. System Agents (시스템 안정성·비용·보안)

## 4.1 PMAgent (Project Manager)

**역할**: 전체 워크플로우 조율 및 태스크 분배

**입력**:
```json
{
  "user_request": "신제품 런칭 캠페인 생성",
  "context": {
    "brand_id": "uuid",
    "budget": 5000000,
    "deadline": "2025-02-01"
  }
}
```

**출력**:
```json
{
  "execution_plan": [
    {"agent": "StrategistAgent", "task": "develop_strategy", "priority": "P0"},
    {"agent": "CopywriterAgent", "task": "generate_copy", "priority": "P0"},
    {"agent": "VisionGeneratorAgent", "task": "generate_images", "priority": "P1"}
  ],
  "estimated_time": 180,
  "estimated_cost": 15000,
  "dependencies": {
    "CopywriterAgent": ["StrategistAgent"],
    "VisionGeneratorAgent": ["StrategistAgent"]
  }
}
```

**KPI**:
- Planning Time: < 5s
- Task Success Rate: > 95%
- Resource Utilization: > 80%

---

## 4.2 SecurityAgent

**역할**: 파일/텍스트 민감정보 탐지, 정책 위반 검사

**입력**:
```json
{
  "content": "...",
  "policies": ["pii", "copyright", "brand"]
}
```

**출력**:
```json
{
  "compliance_status": true,
  "violations": [],
  "risk_score": 0.05
}
```

**KPI**:
- False Positive Rate: < 5%
- Detection Rate: > 98%

---

## 4.3 BudgetAgent

**역할**: LLM Token/Cost 추적, Smart Router 비용 최적화

**입력**:
```json
{
  "project_id": "uuid",
  "budget_limit": 50000
}
```

**출력**:
```json
{
  "current_spend": 12500,
  "projected_spend": 45000,
  "breakdown": {
    "llm_tokens": 8000,
    "image_generation": 3500,
    "video_processing": 1000
  },
  "optimization_opportunities": [
    {"area": "LLM", "potential_savings": 2000, "implementation": "로컬 모델 사용"}
  ],
  "alerts": []
}
```

**KPI**:
- Cost Prediction Accuracy: ±10%
- Budget Overrun Prevention: > 95%

---

## 4.4 ADAgent

**역할**: 광고 퍼포먼스 최적화 (Google Ads, Naver, Kakao)

**입력**:
```json
{
  "campaign": {...},
  "performance": {...},
  "budget": 1000000,
  "goals": {"ctr": 0.05, "cpa": 5000}
}
```

**출력**:
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
  ],
  "bid_adjustments": {...},
  "audience_refinements": {...}
}
```

**KPI**:
- ROI Improvement: > 20%
- CPA Reduction: > 15%

---

# 5. A2A Workflow Examples

## 5.1 Presentation Generation

```
User Request
    ↓
PMAgent (워크플로우 계획)
    ↓
StrategistAgent (전략 수립)
    ↓
CopywriterAgent (카피 작성) | VisionGeneratorAgent (이미지 생성)
    ↓
ReviewerAgent (품질 검토)
    ↓
TemplateAgent (템플릿 적용)
    ↓
BudgetAgent (비용 계산)
    ↓
SecurityAgent (정책 검증)
    ↓
Final Output
```

## 5.2 Video Generation

```
User Request
    ↓
PMAgent
    ↓
StrategistAgent
    ↓
ScenePlannerAgent (씬 구성)
    ↓
StoryboardBuilderAgent (스토리보드)
    ↓
VideoDirectorAgent (영상 제작)
    ↓
VideoReviewerAgent (품질 검사)
    ↓
BudgetAgent (비용 계산)
    ↓
Final Output
```

## 5.3 TrendPipeline

```
TrendCollectorAgent (데이터 크롤링)
    ↓
DataCleanerAgent (데이터 정제)
    ↓
EmbedderAgent (임베딩 생성)
    ↓
IngestorAgent (저장)
    ↓
ReviewerAgent (품질 검증)
    ↓
RAGAgent (검색 가능)
```

## 5.4 Brand Learning

```
User Upload
    ↓
BrandIntakeAgent (자료 파싱)
    ↓
BrandStyleExtractorAgent (스타일 추출)
    ↓
ReviewerAgent (품질 평가)
    ↓
SelfLearningAgent (브랜드 벡터 업데이트)
    ↓
BrandModelUpdaterAgent (프롬프트/모델 업데이트)
    ↓
Next Generation (개선된 결과)
```

---

# 6. I/O Format (공통)

## 6.1 Request Format (표준)

```json
{
  "header": {
    "message_id": "uuid-v4",
    "timestamp": "ISO8601",
    "sender": "agent_name",
    "receiver": "agent_name",
    "correlation_id": "parent_message_id",
    "priority": "P0|P1|P2",
    "ttl": 300
  },
  "payload": {
    "task": "task_name",
    "data": {},
    "context": {
      "brand_id": "uuid",
      "brief_id": "uuid",
      "user_id": "uuid"
    }
  },
  "metadata": {
    "retry_count": 0,
    "trace_id": "uuid",
    "version": "1.0"
  }
}
```

## 6.2 Response Format (표준)

```json
{
  "header": {
    "message_id": "uuid-v4",
    "timestamp": "ISO8601",
    "correlation_id": "request_message_id",
    "sender": "agent_name"
  },
  "status": "success|error|partial",
  "payload": {
    "result": {},
    "confidence": 0.95,
    "metadata": {}
  },
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  },
  "metrics": {
    "processing_time": 5.2,
    "tokens_used": 1500,
    "model": "gpt-4",
    "cost": 0.05
  }
}
```

---

# 7. Shared KPI Metrics

| 메트릭 | 목표 | 측정 방법 |
|--------|------|----------|
| **Text Quality** | > 90% | NLP Score + User Rating |
| **Tone Consistency** | > 90% | Brand Kit Match |
| **Visual Consistency** | > 85% | Color/Style Similarity |
| **Strategic Clarity** | > 85% | User Comprehension |
| **Performance Lift** | +20% | 재학습 전후 비교 |
| **Cost Efficiency** | < $0.10/request | Token + API 비용 |
| **Latency (P90)** | < 30s | End-to-End |
| **Error Rate** | < 1% | Failed Requests |
| **Throughput** | > 100 req/s | System Capacity |

---

# 8. Error Handling

## 8.1 에러 타입

```python
class AgentError(Exception):
    TIMEOUT = "AGENT_TIMEOUT"
    INVALID_INPUT = "INVALID_INPUT"
    MODEL_ERROR = "MODEL_ERROR"
    QUOTA_EXCEEDED = "QUOTA_EXCEEDED"
    DEPENDENCY_FAILED = "DEPENDENCY_FAILED"
    DATA_QUALITY_ISSUE = "DATA_QUALITY_ISSUE"
    COMPLIANCE_VIOLATION = "COMPLIANCE_VIOLATION"
```

## 8.2 재시도 전략

```python
RETRY_CONFIG = {
    "max_attempts": 3,
    "backoff": "exponential",
    "base_delay": 1.0,
    "max_delay": 60.0,
    "jitter": True,
    "retryable_errors": [
        "TIMEOUT",
        "MODEL_ERROR",
        "QUOTA_EXCEEDED"
    ]
}
```

## 8.3 Fallback 전략

- **soft fail**: 다음 에이전트로 진행 (품질 저하 허용)
- **hard fail**: PMAgent 중단 후 에러 반환
- **model fallback**: GPT-4 실패 → Claude 3.5 Sonnet → Llama3.1 (로컬)

---

# 9. Security

## 9.1 보안 정책

- **개인정보 필터링**: PII 자동 탐지 및 마스킹
- **브랜드 민감정보 보호**: 경쟁사 데이터 접근 제한
- **API key masking**: 로그에서 API 키 자동 제거
- **Rate-limit 보호**: 외부 API 호출 제한 (100 req/min)

## 9.2 감사 로그

```python
AUDIT_LOG = {
    "timestamp": "ISO8601",
    "agent": "agent_name",
    "user_id": "uuid",
    "action": "generate_content",
    "input_summary": "...",
    "output_summary": "...",
    "compliance_check": "passed",
    "cost": 0.05
}
```

---

# 10. Future Extensions

## Phase 1 (Post-MVP)
- [ ] Brand Fine-tuning Model Agent (LoRA 훈련)
- [ ] Video Style Consistency Agent (영상 스타일 일관성)
- [ ] PPC Ads Optimization Agent (광고 자동 최적화)

## Phase 2 (Advanced)
- [ ] Real-time Learning Agent (온라인 학습)
- [ ] Multi-modal Fusion Agent (텍스트+이미지+영상 통합)
- [ ] Influencer Recommendation Agent (인플루언서 매칭)

## Phase 3 (Future)
- [ ] Autonomous Campaign Agent (자율 캠페인 실행)
- [ ] Predictive Analytics Agent (성과 예측)
- [ ] Cross-Brand Knowledge Transfer Agent (브랜드 간 지식 공유)

---

# 11. Implementation Guidelines

## 11.1 Agent Base Class

```python
from abc import ABC, abstractmethod
from typing import Dict, Any
import asyncio

class BaseAgent(ABC):
    """
    모든 에이전트의 기본 클래스
    """

    def __init__(self, config: AgentConfig):
        self.name = config.name
        self.version = config.version
        self.models = config.models
        self.retry_config = config.retry_config
        self.metrics_collector = MetricsCollector()
        self.logger = self._setup_logger()

    @abstractmethod
    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """에이전트의 핵심 처리 로직"""
        pass

    async def execute(self, message: Message) -> Response:
        """메시지 처리 및 응답"""
        start_time = time.time()

        try:
            # Validate input
            validated_input = self.validate_input(message.payload)

            # Process with retry
            result = await self.with_retry(
                self.process(validated_input)
            )

            # Collect metrics
            self.metrics_collector.record(
                processing_time=time.time() - start_time,
                success=True
            )

            return Response(
                status="success",
                payload=result,
                metrics=self.get_metrics()
            )

        except Exception as e:
            self.logger.error(f"Error in {self.name}: {e}")
            return Response(
                status="error",
                error={
                    "code": self.get_error_code(e),
                    "message": str(e)
                }
            )
```

## 11.2 Message Queue Integration

```python
from celery import Celery

app = Celery('agents')

# Queue Configuration
app.conf.task_routes = {
    'agents.pm.*': {'queue': 'pm_queue', 'priority': 10},
    'agents.strategist.*': {'queue': 'strategy_queue', 'priority': 9},
    'agents.copywriter.*': {'queue': 'content_queue', 'priority': 8},
    'agents.vision.*': {'queue': 'vision_queue', 'priority': 7},
    'agents.video.*': {'queue': 'video_queue', 'priority': 6},
    'agents.intelligence.*': {'queue': 'intelligence_queue', 'priority': 5},
    'agents.system.*': {'queue': 'system_queue', 'priority': 4},
}

@app.task(bind=True, max_retries=3)
async def process_agent_task(self, agent_name: str, message: dict):
    """Celery 태스크로 에이전트 실행"""
    try:
        agent = registry.get_agent(agent_name)
        response = await agent.execute(Message(**message))
        return response.dict()
    except Exception as e:
        raise self.retry(exc=e, countdown=2 ** self.request.retries)
```

---

# 12. Monitoring & Observability

## 12.1 Metrics (Prometheus)

```python
from prometheus_client import Counter, Histogram, Gauge

# Agent별 메트릭
agent_requests = Counter(
    'agent_requests_total',
    'Total agent requests',
    ['agent_name', 'status']
)

agent_latency = Histogram(
    'agent_latency_seconds',
    'Agent processing latency',
    ['agent_name']
)

agent_cost = Counter(
    'agent_cost_total',
    'Total agent cost',
    ['agent_name']
)
```

## 12.2 Tracing (OpenTelemetry)

```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

class TracedAgent(BaseAgent):

    async def execute(self, message: Message):
        with tracer.start_as_current_span(
            f"agent.{self.name}.execute",
            attributes={
                "agent.name": self.name,
                "message.id": message.header.message_id
            }
        ) as span:
            result = await super().execute(message)
            span.set_attribute("result.status", result.status)
            return result
```

---

# 13. References

## 13.1 내부 문서

- [DATA_PIPELINE_PLAN.md](./DATA_PIPELINE_PLAN.md) - TrendPipeline 구조
- [BRAND_LEARNING_ENGINE.md](./BRAND_LEARNING_ENGINE.md) - Self-Learning 시스템
- [LLM_ROUTER_POLICY.md](./LLM_ROUTER_POLICY.md) - Smart Router 정책
- [MVP_v0_SCOPE_PLAN.md](./MVP_v0_SCOPE_PLAN.md) - MVP 범위

## 13.2 외부 리소스

- [Multi-Agent Systems: A Survey](https://arxiv.org/abs/2103.00616)
- [Celery Documentation](https://docs.celeryproject.org/)
- [OpenTelemetry Specification](https://opentelemetry.io/docs/)

---

**문서 버전**: 2.0
**최종 수정**: 2025-01-13
**작성자**: AI Engineering Team
