# RAG System Specification

> **Version**: 1.0
> **Date**: 2025-11-14 (목요일)
> **Status**: Draft
> **Owner**: Team A (Documentation & Architecture)

---

## 1. Overview

**RAG (Retrieval-Augmented Generation) System**은 Sparklio.ai의 지능형 콘텐츠 생성을 위한 핵심 인프라로, 벡터 검색·재랭킹·컨텍스트 증강을 통해 **정확하고 브랜드 일관성 있는 AI 생성 결과물**을 제공합니다.

### 1.1 핵심 목표

1. **고정밀 검색**: 벡터 유사도 + 메타데이터 필터링으로 관련성 > 90%
2. **브랜드 맞춤화**: 브랜드별 전용 벡터 공간 및 컨텍스트 증강
3. **실시간 응답**: P95 레이턴시 < 500ms
4. **하이브리드 검색**: 텍스트 + 이미지 + 메타데이터 통합 검색
5. **자가 학습 연동**: 성과 데이터 기반 검색 품질 자동 개선 (BRAND_LEARNING_ENGINE.md 연동)

### 1.2 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                           RAG System                             │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Query Processor  │  │ Vector Retriever │  │ Context Builder  │
│ (쿼리 최적화)     │  │ (벡터 검색)       │  │ (컨텍스트 구성)   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
         │                    │                    │
         └────────────────────┴────────────────────┘
                             │
                             ▼
         ┌──────────────────────────────────────┐
         │      Hybrid Search Engine            │
         │  (텍스트 + 이미지 + 메타데이터)      │
         └──────────────────────────────────────┘
                    │                  │
                    ▼                  ▼
         ┌──────────────────┐  ┌──────────────────┐
         │ Reranker         │  │ Cache Layer      │
         │ (재랭킹)          │  │ (Redis)          │
         └──────────────────┘  └──────────────────┘
                    │
                    ▼
         ┌──────────────────────────────────────┐
         │   Response Generator                  │
         │   (LLM + Brand Style Adapter)         │
         └──────────────────────────────────────┘
```

---

## 2. Core Components

### 2.1 Query Processor (쿼리 처리기)

#### 2.1.1 기능

- 쿼리 정규화 (맞춤법 교정, 동의어 확장)
- 쿼리 의도 분류 (정보 검색, 콘텐츠 생성, 분석 등)
- 쿼리 확장 (관련 키워드 추가)
- 쿼리 임베딩 생성

#### 2.1.2 구현

```python
# backend/rag/query_processor.py

from typing import Optional, List
import asyncio
from app.llm.embedder import EmbedderService
from app.rag.query_expander import QueryExpander

class QueryProcessor:
    """
    쿼리 전처리 및 최적화
    """

    def __init__(self):
        self.embedder = EmbedderService()
        self.expander = QueryExpander()
        self.corrector = SpellCorrector()
        self.intent_classifier = IntentClassifier()

    async def process(
        self,
        query: str,
        brand_id: Optional[str] = None,
        expand: bool = True
    ) -> ProcessedQuery:
        """
        쿼리 전처리

        Args:
            query: 원본 쿼리
            brand_id: 브랜드 ID (브랜드 특화 처리용)
            expand: 쿼리 확장 여부

        Returns:
            처리된 쿼리 객체
        """
        # 1. 맞춤법 교정
        corrected_query = await self.corrector.correct(query)

        # 2. 의도 분류
        intent = await self.intent_classifier.classify(corrected_query)

        # 3. 쿼리 확장
        expanded_terms = []
        if expand:
            expanded_terms = await self.expander.expand(
                query=corrected_query,
                brand_id=brand_id,
                intent=intent
            )

        # 4. 최종 쿼리 구성
        final_query = self._build_final_query(
            original=corrected_query,
            expanded_terms=expanded_terms,
            intent=intent
        )

        # 5. 임베딩 생성
        embedding = await self.embedder.embed_text(final_query)

        return ProcessedQuery(
            original=query,
            corrected=corrected_query,
            final=final_query,
            expanded_terms=expanded_terms,
            intent=intent,
            embedding=embedding,
            metadata={
                'brand_id': brand_id,
                'expansion_enabled': expand
            }
        )

    def _build_final_query(
        self,
        original: str,
        expanded_terms: List[str],
        intent: str
    ) -> str:
        """
        최종 쿼리 구성

        Args:
            original: 원본 쿼리
            expanded_terms: 확장된 용어들
            intent: 쿼리 의도

        Returns:
            최종 쿼리 문자열
        """
        if not expanded_terms:
            return original

        # 의도별 확장 전략
        if intent == 'content_generation':
            # 콘텐츠 생성 시 맥락 강화
            return f"{original} {' '.join(expanded_terms[:3])}"

        elif intent == 'brand_analysis':
            # 브랜드 분석 시 관련 키워드 추가
            return f"{original} 브랜드 {' '.join(expanded_terms[:5])}"

        elif intent == 'trend_search':
            # 트렌드 검색 시 최신성 강조
            return f"최근 {original} 트렌드 {' '.join(expanded_terms[:2])}"

        else:
            # 기본: 상위 3개 용어 추가
            return f"{original} {' '.join(expanded_terms[:3])}"
```

#### 2.1.3 Query Expander (쿼리 확장)

```python
# backend/rag/query_expander.py

class QueryExpander:
    """
    쿼리 확장 엔진
    """

    def __init__(self):
        self.synonym_db = SynonymDatabase()
        self.brand_kb = BrandKnowledgeBase()
        self.llm_expander = LLMQueryExpander()

    async def expand(
        self,
        query: str,
        brand_id: Optional[str] = None,
        intent: Optional[str] = None
    ) -> List[str]:
        """
        쿼리 확장

        Args:
            query: 원본 쿼리
            brand_id: 브랜드 ID
            intent: 쿼리 의도

        Returns:
            확장된 용어 리스트
        """
        expanded = set()

        # 1. 동의어 확장
        synonyms = await self.synonym_db.get_synonyms(query)
        expanded.update(synonyms)

        # 2. 브랜드 특화 키워드
        if brand_id:
            brand_keywords = await self.brand_kb.get_keywords(brand_id)
            # 쿼리와 관련성 있는 키워드만 선택
            relevant_keywords = self._filter_relevant(
                query=query,
                candidates=brand_keywords
            )
            expanded.update(relevant_keywords)

        # 3. LLM 기반 확장 (의도별)
        if intent in ['content_generation', 'trend_search']:
            llm_terms = await self.llm_expander.expand(
                query=query,
                intent=intent,
                max_terms=5
            )
            expanded.update(llm_terms)

        # 4. 관련성 기반 정렬 및 반환
        scored_terms = self._score_relevance(query, list(expanded))
        return [term for term, score in scored_terms if score > 0.6]

    def _filter_relevant(
        self,
        query: str,
        candidates: List[str],
        threshold: float = 0.5
    ) -> List[str]:
        """
        쿼리와 관련성 높은 키워드 필터링
        """
        from sklearn.metrics.pairwise import cosine_similarity
        import numpy as np

        # 간단한 TF-IDF 기반 유사도 계산
        query_vec = self._tfidf_vectorize(query)
        candidate_vecs = [self._tfidf_vectorize(c) for c in candidates]

        similarities = [
            cosine_similarity([query_vec], [cv])[0][0]
            for cv in candidate_vecs
        ]

        return [
            candidates[i] for i, sim in enumerate(similarities)
            if sim > threshold
        ]
```

### 2.2 Vector Retriever (벡터 검색)

#### 2.2.1 검색 전략

```python
# backend/rag/vector_retriever.py

from typing import Optional, List, Dict, Any
import asyncpg
import numpy as np

class VectorRetriever:
    """
    벡터 데이터베이스 검색 엔진
    """

    def __init__(self):
        self.db_pool = None  # PostgreSQL connection pool
        self.cache = RetrievalCache()

    async def initialize(self):
        """데이터베이스 연결 초기화"""
        self.db_pool = await asyncpg.create_pool(
            host='localhost',
            database='sparklio',
            user='sparklio',
            password='<password>'
        )

    async def search(
        self,
        embedding: np.ndarray,
        filters: Optional[Dict[str, Any]] = None,
        top_k: int = 10,
        search_method: str = 'cosine'  # 'cosine', 'l2', 'inner_product'
    ) -> List[SearchResult]:
        """
        벡터 유사도 검색

        Args:
            embedding: 쿼리 임베딩
            filters: 메타데이터 필터 (brand_id, type, date_range 등)
            top_k: 상위 K개 결과
            search_method: 거리 메트릭

        Returns:
            검색 결과 리스트
        """
        # 캐시 확인
        cache_key = self._generate_cache_key(embedding, filters, top_k)
        cached = await self.cache.get(cache_key)
        if cached:
            return cached

        # 검색 쿼리 구성
        query, params = self._build_search_query(
            embedding=embedding,
            filters=filters,
            top_k=top_k,
            search_method=search_method
        )

        # 검색 실행
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch(query, *params)

        # 결과 변환
        results = [
            SearchResult(
                chunk_id=row['id'],
                text=row['chunk_text'],
                embedding=row['embedding'],
                score=1 - row['distance'],  # distance → similarity
                metadata=row['metadata'],
                source_id=row['source_id']
            )
            for row in rows
        ]

        # 캐시 저장
        await self.cache.set(cache_key, results, ttl=300)

        return results

    def _build_search_query(
        self,
        embedding: np.ndarray,
        filters: Optional[Dict[str, Any]],
        top_k: int,
        search_method: str
    ) -> tuple:
        """
        PostgreSQL 검색 쿼리 구성

        Returns:
            (쿼리 문자열, 파라미터 튜플)
        """
        # 거리 메트릭 선택
        distance_ops = {
            'cosine': '<=>',
            'l2': '<->',
            'inner_product': '<#>'
        }
        distance_op = distance_ops[search_method]

        # 기본 쿼리
        query = f"""
        SELECT
            v.id,
            v.chunk_text,
            v.embedding,
            v.embedding {distance_op} $1 AS distance,
            v.metadata,
            v.source_id
        FROM vectors v
        """

        params = [embedding.tolist()]
        where_clauses = []
        param_counter = 2

        # 필터 조건 추가
        if filters:
            if 'brand_id' in filters:
                where_clauses.append(f"v.metadata->>'brand_id' = ${param_counter}")
                params.append(filters['brand_id'])
                param_counter += 1

            if 'type' in filters:
                where_clauses.append(f"v.metadata->>'type' = ${param_counter}")
                params.append(filters['type'])
                param_counter += 1

            if 'date_range' in filters:
                date_range = filters['date_range']
                if 'gte' in date_range:
                    where_clauses.append(f"v.created_at >= ${param_counter}")
                    params.append(date_range['gte'])
                    param_counter += 1
                if 'lte' in date_range:
                    where_clauses.append(f"v.created_at <= ${param_counter}")
                    params.append(date_range['lte'])
                    param_counter += 1

            if 'performance_score' in filters:
                perf = filters['performance_score']
                if 'gte' in perf:
                    where_clauses.append(f"(v.metadata->>'performance_score')::float >= ${param_counter}")
                    params.append(perf['gte'])
                    param_counter += 1

        # WHERE 절 추가
        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)

        # ORDER BY 및 LIMIT
        query += f"""
        ORDER BY distance ASC
        LIMIT {top_k}
        """

        return query, params

    async def hybrid_search(
        self,
        text_embedding: Optional[np.ndarray] = None,
        image_embedding: Optional[np.ndarray] = None,
        metadata_filters: Optional[Dict[str, Any]] = None,
        top_k: int = 10,
        weights: Optional[Dict[str, float]] = None
    ) -> List[SearchResult]:
        """
        하이브리드 검색 (텍스트 + 이미지)

        Args:
            text_embedding: 텍스트 임베딩
            image_embedding: 이미지 임베딩
            metadata_filters: 메타데이터 필터
            top_k: 상위 K개 결과
            weights: 각 모달리티 가중치 {'text': 0.7, 'image': 0.3}

        Returns:
            검색 결과 리스트
        """
        if not weights:
            weights = {'text': 0.7, 'image': 0.3}

        results = []

        # 텍스트 검색
        if text_embedding is not None:
            text_results = await self.search(
                embedding=text_embedding,
                filters=metadata_filters,
                top_k=top_k * 2  # 더 많이 가져와서 merge
            )
            for r in text_results:
                r.score *= weights.get('text', 1.0)
            results.extend(text_results)

        # 이미지 검색
        if image_embedding is not None:
            image_results = await self.search(
                embedding=image_embedding,
                filters=metadata_filters,
                top_k=top_k * 2
            )
            for r in image_results:
                r.score *= weights.get('image', 1.0)
            results.extend(image_results)

        # 중복 제거 및 점수 합산
        merged = self._merge_results(results)

        # 상위 top_k 반환
        sorted_results = sorted(merged, key=lambda x: x.score, reverse=True)
        return sorted_results[:top_k]

    def _merge_results(self, results: List[SearchResult]) -> List[SearchResult]:
        """
        중복 제거 및 점수 합산
        """
        result_dict = {}

        for r in results:
            if r.chunk_id in result_dict:
                # 점수 합산
                result_dict[r.chunk_id].score += r.score
            else:
                result_dict[r.chunk_id] = r

        return list(result_dict.values())
```

### 2.3 Reranker (재랭킹)

#### 2.3.1 Cross-Encoder Reranker

```python
# backend/rag/reranker.py

from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch

class CrossEncoderReranker:
    """
    Cross-Encoder 기반 재랭킹
    """

    def __init__(self, model_name: str = 'cross-encoder/ms-marco-MiniLM-L-6-v2'):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
        self.model.to(self.device)
        self.model.eval()

    async def rerank(
        self,
        query: str,
        candidates: List[SearchResult],
        top_k: int = 10
    ) -> List[SearchResult]:
        """
        Cross-Encoder로 재랭킹

        Args:
            query: 쿼리 텍스트
            candidates: 검색 결과 후보들
            top_k: 상위 K개

        Returns:
            재랭킹된 결과
        """
        if not candidates:
            return []

        # 쿼리-문서 쌍 구성
        pairs = [(query, c.text) for c in candidates]

        # 배치 처리
        batch_size = 32
        all_scores = []

        for i in range(0, len(pairs), batch_size):
            batch = pairs[i:i+batch_size]

            # 토크나이징
            inputs = self.tokenizer(
                batch,
                padding=True,
                truncation=True,
                return_tensors='pt',
                max_length=512
            ).to(self.device)

            # 추론
            with torch.no_grad():
                outputs = self.model(**inputs)
                scores = outputs.logits.squeeze(-1).cpu().numpy()

            all_scores.extend(scores.tolist())

        # 점수 업데이트
        for candidate, score in zip(candidates, all_scores):
            # Cross-Encoder 점수와 벡터 유사도 점수 결합
            candidate.rerank_score = score
            candidate.final_score = 0.6 * score + 0.4 * candidate.score

        # 정렬 및 상위 K개 반환
        sorted_candidates = sorted(
            candidates,
            key=lambda x: x.final_score,
            reverse=True
        )

        return sorted_candidates[:top_k]


class BrandAwareReranker:
    """
    브랜드 일관성 기반 재랭킹
    """

    def __init__(self):
        self.cross_encoder = CrossEncoderReranker()
        self.brand_scorer = BrandConsistencyScorer()

    async def rerank(
        self,
        query: str,
        candidates: List[SearchResult],
        brand_id: str,
        top_k: int = 10
    ) -> List[SearchResult]:
        """
        브랜드 일관성을 고려한 재랭킹

        Args:
            query: 쿼리
            candidates: 후보 결과들
            brand_id: 브랜드 ID
            top_k: 상위 K개

        Returns:
            재랭킹된 결과
        """
        # 1. Cross-Encoder 재랭킹
        reranked = await self.cross_encoder.rerank(query, candidates, top_k * 2)

        # 2. 브랜드 일관성 점수 계산
        brand_kit = await self.get_brand_kit(brand_id)

        for candidate in reranked:
            brand_score = await self.brand_scorer.score(
                text=candidate.text,
                brand_kit=brand_kit
            )

            # 최종 점수 = Cross-Encoder (50%) + 벡터 유사도 (30%) + 브랜드 일관성 (20%)
            candidate.final_score = (
                0.5 * candidate.rerank_score +
                0.3 * candidate.score +
                0.2 * brand_score
            )

        # 3. 최종 정렬 및 상위 K개
        sorted_results = sorted(
            reranked,
            key=lambda x: x.final_score,
            reverse=True
        )

        return sorted_results[:top_k]
```

### 2.4 Context Builder (컨텍스트 구성)

```python
# backend/rag/context_builder.py

class ContextBuilder:
    """
    검색 결과로부터 LLM 컨텍스트 구성
    """

    def __init__(self):
        self.max_context_length = 4000  # 토큰
        self.brand_kb = BrandKnowledgeBase()

    async def build_context(
        self,
        query: str,
        search_results: List[SearchResult],
        brand_id: Optional[str] = None,
        include_metadata: bool = True
    ) -> str:
        """
        LLM 프롬프트용 컨텍스트 구성

        Args:
            query: 쿼리
            search_results: 검색 결과
            brand_id: 브랜드 ID
            include_metadata: 메타데이터 포함 여부

        Returns:
            컨텍스트 문자열
        """
        context_parts = []

        # 1. 브랜드 정보 추가
        if brand_id:
            brand_context = await self._build_brand_context(brand_id)
            context_parts.append(brand_context)

        # 2. 검색 결과 추가
        results_context = self._build_results_context(
            search_results,
            include_metadata=include_metadata
        )
        context_parts.append(results_context)

        # 3. 컨텍스트 길이 제한
        full_context = "\n\n".join(context_parts)
        truncated_context = self._truncate_context(
            full_context,
            max_tokens=self.max_context_length
        )

        return truncated_context

    async def _build_brand_context(self, brand_id: str) -> str:
        """브랜드 컨텍스트 구성"""
        brand_kit = await self.brand_kb.get_kit(brand_id)

        context = f"""
## 브랜드 가이드

### 브랜드명
{brand_kit.name}

### 톤앤매너
- 격식: {brand_kit.tone_manner.get('formality', 'N/A')}
- 감정: {brand_kit.tone_manner.get('emotion', 'N/A')}
- 목소리: {brand_kit.tone_manner.get('voice', 'N/A')}

### 선호 표현
{', '.join(brand_kit.preferred_phrases[:10])}

### 회피 표현
{', '.join(brand_kit.avoided_phrases[:10])}

### 색상 팔레트
{', '.join([c['hex'] for c in brand_kit.colors.get('palette', {}).values()])}
"""
        return context

    def _build_results_context(
        self,
        results: List[SearchResult],
        include_metadata: bool = True
    ) -> str:
        """검색 결과 컨텍스트 구성"""
        context = "## 관련 정보\n\n"

        for i, result in enumerate(results, 1):
            context += f"### 참고 자료 {i}\n"
            context += f"{result.text}\n"

            if include_metadata and result.metadata:
                metadata_str = self._format_metadata(result.metadata)
                context += f"*출처: {metadata_str}*\n"

            context += "\n"

        return context

    def _format_metadata(self, metadata: dict) -> str:
        """메타데이터 포맷팅"""
        parts = []

        if 'source_url' in metadata:
            parts.append(metadata['source_url'])

        if 'type' in metadata:
            parts.append(f"유형: {metadata['type']}")

        if 'created_at' in metadata:
            from datetime import datetime
            dt = datetime.fromisoformat(metadata['created_at'])
            parts.append(f"작성일: {dt.strftime('%Y-%m-%d')}")

        return " | ".join(parts)

    def _truncate_context(self, context: str, max_tokens: int) -> str:
        """컨텍스트 길이 제한"""
        from tiktoken import encoding_for_model

        enc = encoding_for_model('gpt-4')
        tokens = enc.encode(context)

        if len(tokens) <= max_tokens:
            return context

        # 토큰 수 초과 시 truncate
        truncated_tokens = tokens[:max_tokens]
        return enc.decode(truncated_tokens)
```

---

## 3. Brand-Aware RAG

### 3.1 브랜드 특화 검색

```python
# backend/rag/brand_aware_rag.py

from typing import Optional, List
from datetime import datetime, timedelta

class BrandAwareRAG:
    """
    브랜드 맞춤형 RAG 시스템
    """

    def __init__(self):
        self.query_processor = QueryProcessor()
        self.retriever = VectorRetriever()
        self.reranker = BrandAwareReranker()
        self.context_builder = ContextBuilder()
        self.response_generator = ResponseGenerator()

    async def generate_brand_content(
        self,
        prompt: str,
        brand_id: str,
        content_type: str,  # 'ad', 'sns', 'presentation', etc.
        context_sources: Optional[List[str]] = None,  # 'brand_data', 'trends', 'competitors', 'success_cases'
        top_k: int = 10
    ) -> BrandContentResponse:
        """
        브랜드 맞춤 콘텐츠 생성

        Args:
            prompt: 생성 프롬프트
            brand_id: 브랜드 ID
            content_type: 콘텐츠 유형
            context_sources: 컨텍스트 소스 목록
            top_k: 검색 결과 수

        Returns:
            생성된 콘텐츠 및 메타데이터
        """
        if not context_sources:
            context_sources = ['brand_data', 'success_cases', 'trends']

        # 1. 쿼리 처리
        processed_query = await self.query_processor.process(
            query=prompt,
            brand_id=brand_id,
            expand=True
        )

        # 2. 다중 소스 검색
        all_results = {}

        for source_type in context_sources:
            results = await self._search_by_source_type(
                query=processed_query,
                brand_id=brand_id,
                source_type=source_type,
                content_type=content_type,
                top_k=top_k
            )
            all_results[source_type] = results

        # 3. 브랜드 일관성 기반 재랭킹
        combined_results = self._combine_results(all_results)
        reranked = await self.reranker.rerank(
            query=prompt,
            candidates=combined_results,
            brand_id=brand_id,
            top_k=top_k
        )

        # 4. 컨텍스트 구성
        context = await self.context_builder.build_context(
            query=prompt,
            search_results=reranked,
            brand_id=brand_id,
            include_metadata=True
        )

        # 5. 브랜드 스타일 가이드 추가
        brand_kit = await self._get_brand_kit(brand_id)
        style_context = self._build_style_context(brand_kit, content_type)
        full_context = f"{style_context}\n\n{context}"

        # 6. 콘텐츠 생성
        generated_content = await self.response_generator.generate(
            prompt=prompt,
            context=full_context,
            brand_id=brand_id,
            content_type=content_type
        )

        # 7. 브랜드 일관성 검증
        consistency_score = await self._validate_brand_consistency(
            content=generated_content,
            brand_kit=brand_kit
        )

        # 일관성 낮으면 재생성
        if consistency_score < 0.7:
            generated_content = await self._regenerate_with_feedback(
                prompt=prompt,
                context=full_context,
                brand_kit=brand_kit,
                previous_attempt=generated_content
            )

        return BrandContentResponse(
            content=generated_content,
            brand_id=brand_id,
            content_type=content_type,
            consistency_score=consistency_score,
            sources=all_results,
            context_used=full_context,
            metadata={
                'query': prompt,
                'processed_query': processed_query.final,
                'search_results_count': len(reranked),
                'context_sources': context_sources
            }
        )

    async def _search_by_source_type(
        self,
        query: ProcessedQuery,
        brand_id: str,
        source_type: str,
        content_type: str,
        top_k: int
    ) -> List[SearchResult]:
        """
        소스 타입별 검색

        Args:
            query: 처리된 쿼리
            brand_id: 브랜드 ID
            source_type: 소스 타입 ('brand_data', 'trends', 'competitors', 'success_cases')
            content_type: 콘텐츠 유형
            top_k: 검색 결과 수

        Returns:
            검색 결과 리스트
        """
        filters = {'brand_id': brand_id}

        if source_type == 'brand_data':
            filters['type'] = 'brand_data'

        elif source_type == 'trends':
            filters['type'] = 'trend'
            filters['date_range'] = {
                'gte': datetime.now() - timedelta(days=30)  # 최근 30일
            }

        elif source_type == 'competitors':
            filters['type'] = 'competitor'
            # 브랜드 ID는 제외하고 같은 업종만
            brand_kit = await self._get_brand_kit(brand_id)
            filters['industry'] = brand_kit.industry

        elif source_type == 'success_cases':
            filters['type'] = content_type
            filters['performance_score'] = {'gte': 0.8}  # 고성과 콘텐츠만

        results = await self.retriever.search(
            embedding=query.embedding,
            filters=filters,
            top_k=top_k
        )

        return results

    def _build_style_context(self, brand_kit: BrandKit, content_type: str) -> str:
        """
        콘텐츠 타입별 스타일 가이드 구성
        """
        context = f"""
## 콘텐츠 생성 가이드 ({content_type})

### 필수 준수 사항
1. 브랜드 톤앤매너: {brand_kit.tone_manner.get('formality')} / {brand_kit.tone_manner.get('emotion')}
2. 선호 표현 적극 사용: {', '.join(brand_kit.preferred_phrases[:5])}
3. 회피 표현 절대 사용 금지: {', '.join(brand_kit.avoided_phrases[:5])}
"""

        # 콘텐츠 타입별 추가 가이드
        if content_type == 'ad':
            context += """
### 광고 카피 가이드
- CTA는 브랜드 톤에 맞게 작성
- 과장 표현 지양
- USP 명확히 전달
"""
        elif content_type == 'sns':
            context += """
### SNS 콘텐츠 가이드
- 해시태그 3-5개 추천
- 이모지 사용 (브랜드 톤에 따라 조절)
- 인게이지먼트 유도 문구 포함
"""
        elif content_type == 'presentation':
            context += """
### 프레젠테이션 가이드
- 슬라이드당 핵심 메시지 1개
- 간결한 제목과 bullet points
- 브랜드 컬러 팔레트 활용
"""

        return context
```

---

## 4. Performance Optimization

### 4.1 Caching Strategy

```python
# backend/rag/cache.py

import redis.asyncio as aioredis
import pickle
from typing import Optional, Any

class RAGCache:
    """
    RAG 검색 결과 캐싱
    """

    def __init__(self):
        self.redis = None
        self.default_ttl = 300  # 5분

    async def initialize(self):
        """Redis 연결 초기화"""
        self.redis = await aioredis.from_url(
            'redis://localhost:6379',
            encoding='utf-8',
            decode_responses=False  # binary mode for pickle
        )

    async def get(self, key: str) -> Optional[Any]:
        """캐시 조회"""
        if not self.redis:
            return None

        cached = await self.redis.get(key)
        if cached:
            return pickle.loads(cached)

        return None

    async def set(self, key: str, value: Any, ttl: int = None):
        """캐시 저장"""
        if not self.redis:
            return

        ttl = ttl or self.default_ttl
        serialized = pickle.dumps(value)
        await self.redis.setex(key, ttl, serialized)

    async def invalidate(self, pattern: str):
        """패턴 매칭 캐시 무효화"""
        if not self.redis:
            return

        keys = await self.redis.keys(pattern)
        if keys:
            await self.redis.delete(*keys)

    def generate_cache_key(self, *args) -> str:
        """캐시 키 생성"""
        import hashlib
        import json

        # args를 JSON으로 직렬화 → hash
        key_data = json.dumps(args, sort_keys=True)
        hash_key = hashlib.sha256(key_data.encode()).hexdigest()

        return f"rag:{hash_key}"
```

### 4.2 Index Optimization

```python
# backend/rag/index_optimizer.py

class IndexOptimizer:
    """
    벡터 인덱스 최적화
    """

    async def optimize_indices(self):
        """
        벡터 인덱스 최적화 실행
        """
        async with self.db_pool.acquire() as conn:
            # 1. 테이블 통계 업데이트
            await conn.execute("ANALYZE vectors;")

            # 2. 데이터 크기에 따른 IVFFlat lists 수 조정
            row_count = await conn.fetchval("SELECT COUNT(*) FROM vectors;")
            optimal_lists = max(100, int(math.sqrt(row_count)))

            # 3. 인덱스 재구축
            await conn.execute("DROP INDEX IF EXISTS vectors_embedding_idx;")
            await conn.execute(f"""
                CREATE INDEX vectors_embedding_idx
                ON vectors
                USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = {optimal_lists});
            """)

            # 4. VACUUM ANALYZE
            await conn.execute("VACUUM ANALYZE vectors;")

    async def add_hnsw_index(self):
        """
        HNSW 인덱스 추가 (고정밀 검색용)
        """
        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS vectors_embedding_hnsw_idx
                ON vectors
                USING hnsw (embedding vector_cosine_ops)
                WITH (m = 16, ef_construction = 64);
            """)
```

---

## 5. Evaluation & Monitoring

### 5.1 RAG 품질 평가

```python
# backend/rag/evaluator.py

class RAGEvaluator:
    """
    RAG 시스템 품질 평가
    """

    def __init__(self):
        self.metrics = {
            'relevance': RelevanceEvaluator(),
            'faithfulness': FaithfulnessEvaluator(),
            'answer_correctness': CorrectnessEvaluator(),
            'context_precision': PrecisionEvaluator(),
            'context_recall': RecallEvaluator()
        }

    async def evaluate(
        self,
        query: str,
        retrieved_contexts: List[str],
        generated_answer: str,
        ground_truth: Optional[str] = None
    ) -> EvaluationResult:
        """
        RAG 결과 평가

        Args:
            query: 쿼리
            retrieved_contexts: 검색된 컨텍스트들
            generated_answer: 생성된 답변
            ground_truth: 정답 (있는 경우)

        Returns:
            평가 결과
        """
        scores = {}

        # 1. Relevance: 검색 결과가 쿼리와 관련 있는가?
        scores['relevance'] = await self.metrics['relevance'].evaluate(
            query=query,
            contexts=retrieved_contexts
        )

        # 2. Faithfulness: 생성 답변이 검색 결과에 기반하는가?
        scores['faithfulness'] = await self.metrics['faithfulness'].evaluate(
            answer=generated_answer,
            contexts=retrieved_contexts
        )

        # 3. Answer Correctness (ground truth 있을 때)
        if ground_truth:
            scores['correctness'] = await self.metrics['answer_correctness'].evaluate(
                answer=generated_answer,
                ground_truth=ground_truth
            )

        # 4. Context Precision
        scores['context_precision'] = await self.metrics['context_precision'].evaluate(
            query=query,
            contexts=retrieved_contexts
        )

        # 5. Context Recall (ground truth 있을 때)
        if ground_truth:
            scores['context_recall'] = await self.metrics['context_recall'].evaluate(
                ground_truth=ground_truth,
                contexts=retrieved_contexts
            )

        # 종합 점수
        overall_score = sum(scores.values()) / len(scores)

        return EvaluationResult(
            scores=scores,
            overall_score=overall_score,
            query=query,
            contexts=retrieved_contexts,
            answer=generated_answer
        )


class RelevanceEvaluator:
    """
    검색 관련성 평가
    """

    def __init__(self):
        self.llm = LLMClient(model='gpt-4o-mini')

    async def evaluate(self, query: str, contexts: List[str]) -> float:
        """
        검색된 컨텍스트가 쿼리와 얼마나 관련있는지 평가

        Returns:
            0.0 ~ 1.0 점수
        """
        prompt = f"""
다음 쿼리에 대해 검색된 컨텍스트들의 관련성을 0.0 ~ 1.0 점수로 평가하세요.

쿼리: {query}

컨텍스트:
{chr(10).join([f"{i+1}. {c}" for i, c in enumerate(contexts)])}

평가 기준:
- 1.0: 매우 관련 있음
- 0.8: 관련 있음
- 0.5: 부분적으로 관련 있음
- 0.3: 약간 관련 있음
- 0.0: 관련 없음

JSON 형식으로 답변하세요:
{{"score": 0.85, "reason": "설명"}}
"""

        response = await self.llm.generate(prompt)
        import json
        result = json.loads(response)

        return result['score']
```

### 5.2 Monitoring Metrics

```python
# backend/rag/metrics.py

from prometheus_client import Counter, Histogram, Gauge

class RAGMetrics:
    """
    RAG 시스템 메트릭
    """

    def __init__(self):
        # 검색 요청 수
        self.search_requests = Counter(
            'rag_search_requests_total',
            'Total RAG search requests',
            ['brand_id', 'content_type']
        )

        # 검색 레이턴시
        self.search_latency = Histogram(
            'rag_search_latency_seconds',
            'RAG search latency',
            ['stage']  # 'query_processing', 'retrieval', 'reranking', 'generation'
        )

        # 캐시 적중률
        self.cache_hit_rate = Gauge(
            'rag_cache_hit_rate',
            'RAG cache hit rate'
        )

        # 검색 품질 점수
        self.search_quality = Gauge(
            'rag_search_quality_score',
            'RAG search quality score',
            ['metric']  # 'relevance', 'faithfulness', etc.
        )

        # 생성 품질 점수
        self.generation_quality = Gauge(
            'rag_generation_quality_score',
            'RAG generation quality score'
        )

    async def record_search(
        self,
        brand_id: str,
        content_type: str,
        latencies: dict,
        quality_scores: dict
    ):
        """검색 메트릭 기록"""
        # 요청 수 증가
        self.search_requests.labels(
            brand_id=brand_id,
            content_type=content_type
        ).inc()

        # 레이턴시 기록
        for stage, latency in latencies.items():
            self.search_latency.labels(stage=stage).observe(latency)

        # 품질 점수 기록
        for metric, score in quality_scores.items():
            self.search_quality.labels(metric=metric).set(score)
```

---

## 6. Integration with Other Systems

### 6.1 BRAND_LEARNING_ENGINE.md Integration

```python
# backend/rag/learning_integration.py

class RAGLearningIntegration:
    """
    RAG ↔ Brand Learning Engine 연동
    """

    def __init__(self):
        self.rag = BrandAwareRAG()
        self.learner = SelfLearningAgent()

    async def update_from_feedback(
        self,
        content_id: str,
        performance_data: dict
    ):
        """
        성과 데이터 기반 RAG 검색 품질 개선

        Args:
            content_id: 콘텐츠 ID
            performance_data: 성과 데이터 (CTR, engagement, etc.)
        """
        # 1. 콘텐츠 생성 시 사용된 검색 결과 조회
        generation_log = await self._get_generation_log(content_id)

        # 2. 성과 기반 검색 결과 가중치 조정
        if performance_data['ctr'] > 0.05:  # 고성과
            await self._boost_search_results(
                brand_id=generation_log['brand_id'],
                source_chunks=generation_log['source_chunks'],
                boost_factor=1.2
            )

        elif performance_data['ctr'] < 0.01:  # 저성과
            await self._penalize_search_results(
                brand_id=generation_log['brand_id'],
                source_chunks=generation_log['source_chunks'],
                penalty_factor=0.8
            )

        # 3. 검색 쿼리 최적화
        if performance_data['engagement_rate'] > 0.1:
            await self._update_query_expansion(
                brand_id=generation_log['brand_id'],
                successful_query=generation_log['query']
            )

    async def _boost_search_results(
        self,
        brand_id: str,
        source_chunks: List[str],
        boost_factor: float
    ):
        """
        고성과 콘텐츠의 소스 청크에 가중치 부여
        """
        async with self.db_pool.acquire() as conn:
            for chunk_id in source_chunks:
                await conn.execute("""
                    UPDATE vectors
                    SET metadata = jsonb_set(
                        metadata,
                        '{performance_boost}',
                        to_jsonb($2::float)
                    )
                    WHERE id = $1
                """, chunk_id, boost_factor)
```

### 6.2 AGENTS_SPEC.md Integration

```python
# backend/agents/rag_agent.py

from app.agents.base import BaseAgent
from app.rag.brand_aware_rag import BrandAwareRAG

class RAGAgent(BaseAgent):
    """
    RAG 전용 에이전트 (AGENTS_SPEC.md 연동)
    """

    def __init__(self):
        super().__init__(name='RAGAgent', role='knowledge_retrieval')
        self.rag = BrandAwareRAG()

    async def execute(self, task: dict) -> dict:
        """
        RAG 작업 실행

        Args:
            task: {
                'type': 'search' | 'generate',
                'query': str,
                'brand_id': str,
                'content_type': str,
                'context_sources': List[str]
            }

        Returns:
            RAG 결과
        """
        task_type = task.get('type', 'search')

        if task_type == 'search':
            # 검색만
            results = await self.rag.retriever.search(
                embedding=task['query_embedding'],
                filters={'brand_id': task['brand_id']},
                top_k=task.get('top_k', 10)
            )

            return {
                'status': 'success',
                'results': results,
                'count': len(results)
            }

        elif task_type == 'generate':
            # 검색 + 생성
            response = await self.rag.generate_brand_content(
                prompt=task['query'],
                brand_id=task['brand_id'],
                content_type=task['content_type'],
                context_sources=task.get('context_sources')
            )

            return {
                'status': 'success',
                'content': response.content,
                'consistency_score': response.consistency_score,
                'sources': response.sources
            }

        else:
            raise ValueError(f"Unknown task type: {task_type}")
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

```python
# tests/test_rag_system.py

import pytest
from app.rag.vector_retriever import VectorRetriever
from app.rag.reranker import CrossEncoderReranker

@pytest.mark.asyncio
async def test_vector_search():
    """벡터 검색 기본 테스트"""
    retriever = VectorRetriever()
    await retriever.initialize()

    # 테스트 쿼리 임베딩
    import numpy as np
    query_embedding = np.random.rand(1536)  # 임베딩 차원

    # 검색 실행
    results = await retriever.search(
        embedding=query_embedding,
        filters={'brand_id': 'test_brand_123'},
        top_k=5
    )

    assert len(results) <= 5
    assert all(r.score >= 0 and r.score <= 1 for r in results)

@pytest.mark.asyncio
async def test_reranking():
    """재랭킹 테스트"""
    reranker = CrossEncoderReranker()

    query = "프리미엄 화장품 광고 카피"
    candidates = [
        SearchResult(chunk_id='1', text='고급스러운 스킨케어', score=0.8),
        SearchResult(chunk_id='2', text='저렴한 할인 행사', score=0.75),
        SearchResult(chunk_id='3', text='자연 성분 프리미엄 제품', score=0.85)
    ]

    reranked = await reranker.rerank(query, candidates, top_k=3)

    # 재랭킹 후 순서 변경 확인
    assert reranked[0].chunk_id == '3'  # 가장 관련성 높은 결과
```

### 7.2 Integration Tests

```python
# tests/integration/test_brand_aware_rag.py

@pytest.mark.integration
async def test_brand_content_generation_flow():
    """브랜드 콘텐츠 생성 전체 플로우 테스트"""
    rag = BrandAwareRAG()

    # 브랜드 콘텐츠 생성 요청
    response = await rag.generate_brand_content(
        prompt="신제품 출시 SNS 포스트",
        brand_id='test_brand_123',
        content_type='sns',
        context_sources=['brand_data', 'success_cases'],
        top_k=5
    )

    assert response.content is not None
    assert response.consistency_score >= 0.7
    assert len(response.sources) > 0
    assert 'brand_data' in response.sources
```

---

## 8. Deployment & Operations

### 8.1 Database Schema

```sql
-- 벡터 테이블 (DATA_PIPELINE_PLAN.md에서 정의)
CREATE TABLE vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES sources(id),
    chunk_text TEXT,
    embedding VECTOR(3072),  -- text-embedding-3-large
    model VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX vectors_embedding_idx ON vectors
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX vectors_metadata_idx ON vectors USING gin (metadata);
CREATE INDEX vectors_brand_idx ON vectors ((metadata->>'brand_id'));

-- 성과 부스트 필드 추가
ALTER TABLE vectors ADD COLUMN IF NOT EXISTS performance_boost FLOAT DEFAULT 1.0;
CREATE INDEX vectors_performance_boost_idx ON vectors (performance_boost);
```

### 8.2 Configuration

```python
# backend/rag/config.py

class RAGConfig:
    """RAG 시스템 설정"""

    # 검색 설정
    DEFAULT_TOP_K = 10
    MAX_TOP_K = 100
    SEARCH_METHOD = 'cosine'  # 'cosine', 'l2', 'inner_product'

    # 임베딩 설정
    EMBEDDING_MODEL = 'text-embedding-3-large'
    EMBEDDING_DIM = 3072

    # 재랭킹 설정
    RERANKER_MODEL = 'cross-encoder/ms-marco-MiniLM-L-6-v2'
    RERANK_TOP_K_MULTIPLIER = 3

    # 컨텍스트 설정
    MAX_CONTEXT_LENGTH = 4000  # 토큰
    INCLUDE_METADATA = True

    # 캐싱 설정
    CACHE_TTL = 300  # 5분
    CACHE_ENABLED = True

    # 브랜드 일관성 설정
    MIN_BRAND_CONSISTENCY_SCORE = 0.7
    BRAND_CONSISTENCY_WEIGHT = 0.2
```

---

## 9. Performance Benchmarks

### 9.1 Target KPIs

| 지표 | 목표 | 현재 | 측정 방법 |
|------|------|------|-----------|
| **검색 레이턴시 (P95)** | < 500ms | - | Prometheus histogram |
| **검색 정확도** | > 90% | - | Relevance score |
| **브랜드 일관성** | > 85% | - | Brand consistency score |
| **캐시 적중률** | > 70% | - | Redis metrics |
| **생성 품질 (Faithfulness)** | > 0.85 | - | LLM evaluation |

### 9.2 Scalability Targets

- **동시 검색 요청**: 1,000 req/s
- **벡터 DB 크기**: 10M+ 벡터
- **브랜드 수**: 10,000+
- **일일 검색 요청**: 1M+

---

## 10. Roadmap

### Phase 0 (MVP - Current)

- [x] 벡터 검색 기본 구현
- [x] PostgreSQL + pgvector 설정
- [ ] Cross-Encoder 재랭킹
- [ ] 브랜드 일관성 기반 재랭킹
- [ ] 기본 캐싱

### Phase 1 (Post-MVP)

- [ ] 하이브리드 검색 (텍스트 + 이미지)
- [ ] 성과 기반 자동 학습 (BRAND_LEARNING_ENGINE 연동)
- [ ] 고급 쿼리 확장
- [ ] HNSW 인덱스 추가

### Phase 2 (Advanced)

- [ ] 멀티모달 RAG (텍스트 + 이미지 + 비디오)
- [ ] Graph RAG (지식 그래프 통합)
- [ ] Agentic RAG (Self-RAG, CRAG)
- [ ] Federated RAG (브랜드 간 지식 공유, Opt-in)

### Phase 3 (Future)

- [ ] Real-time RAG (실시간 데이터 업데이트)
- [ ] Explainable RAG (검색 근거 시각화)
- [ ] Adaptive RAG (사용자 피드백 기반 자동 조정)

---

## 11. References

### 11.1 Internal Documents

- [DATA_PIPELINE_PLAN.md](./DATA_PIPELINE_PLAN.md) - TrendPipeline, Collector, Embedder, Ingestor
- [BRAND_LEARNING_ENGINE.md](./BRAND_LEARNING_ENGINE.md) - Self-Learning Loop, Performance Analyzer
- [BRAND_KIT_SPEC.md](./BRAND_KIT_SPEC.md) - Brand Kit Schema, Brand Consistency Validation
- [AGENTS_SPEC.md](./AGENTS_SPEC.md) - RAGAgent, Agent Integration
- [TECH_DECISION_v1.md](./TECH_DECISION_v1.md) - Technology Stack, Database Schema

### 11.2 External Resources

- **LangChain RAG Tutorial**: https://python.langchain.com/docs/tutorials/rag/
- **Pinecone RAG Guide**: https://www.pinecone.io/learn/retrieval-augmented-generation/
- **pgvector Documentation**: https://github.com/pgvector/pgvector
- **Cross-Encoder Models**: https://www.sbert.net/docs/pretrained_cross-encoders.html
- **RAGAS Evaluation**: https://docs.ragas.io/

---

## 12. Conclusion

RAG System은 Sparklio.ai의 **지능형 콘텐츠 생성**을 위한 핵심 인프라로, 벡터 검색·재랭킹·브랜드 맞춤화를 통해 정확하고 일관성 있는 결과물을 제공합니다.

### 12.1 Key Takeaways

1. **브랜드 특화**: 브랜드별 전용 벡터 공간 및 일관성 기반 재랭킹
2. **하이브리드 검색**: 텍스트 + 이미지 + 메타데이터 통합
3. **자가 학습 연동**: 성과 데이터 기반 검색 품질 자동 개선
4. **고성능**: 캐싱 + 인덱스 최적화로 < 500ms 응답

### 12.2 Success Metrics

- **검색 정확도**: > 90%
- **브랜드 일관성**: > 85%
- **레이턴시 (P95)**: < 500ms
- **사용자 만족도**: ≥ 4.5/5

---

**문서 버전**: 1.0
**최종 수정**: 2025-11-14 (목요일)
**작성자**: Team A
**검토자**: CTO, Lead Data Engineer
