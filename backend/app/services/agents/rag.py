"""
RAG Agent - 검색 증강 생성 에이전트

이 에이전트는 지식 베이스를 활용하여 더 정확하고 관련성 높은
콘텐츠를 생성합니다.

주요 기능:
1. 문서 인덱싱 및 저장
2. 의미 기반 검색
3. 컨텍스트 증강 생성
4. 하이브리드 검색 (키워드 + 벡터)
5. 지식 베이스 관리
"""

import json
import hashlib
from typing import Dict, Any, List, Optional, Tuple, Union
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, ValidationError
import asyncio
import logging
import re
from collections import defaultdict

from app.services.agents.base import AgentBase, AgentRequest, AgentResponse, AgentError
from app.services.llm import LLMGateway as LLMService

logger = logging.getLogger(__name__)

# ==================== Enums ====================

class RAGTask(str, Enum):
    """RAG 작업 종류"""
    INDEX_DOCUMENT = "index_document"
    SEARCH_KNOWLEDGE = "search_knowledge"
    GENERATE_WITH_CONTEXT = "generate_with_context"
    UPDATE_KNOWLEDGE = "update_knowledge"
    HYBRID_SEARCH = "hybrid_search"
    EXTRACT_ANSWERS = "extract_answers"

class DocumentType(str, Enum):
    """문서 타입"""
    MARKETING_GUIDE = "marketing_guide"
    PRODUCT_INFO = "product_info"
    BRAND_GUIDELINE = "brand_guideline"
    CAMPAIGN_HISTORY = "campaign_history"
    CUSTOMER_FEEDBACK = "customer_feedback"
    COMPETITOR_ANALYSIS = "competitor_analysis"
    INDUSTRY_REPORT = "industry_report"
    FAQ = "faq"
    BLOG_POST = "blog_post"
    SOCIAL_MEDIA = "social_media"

class SearchStrategy(str, Enum):
    """검색 전략"""
    VECTOR_ONLY = "vector_only"
    KEYWORD_ONLY = "keyword_only"
    HYBRID = "hybrid"
    RERANK = "rerank"

class ChunkingStrategy(str, Enum):
    """텍스트 청킹 전략"""
    FIXED_SIZE = "fixed_size"
    SENTENCE = "sentence"
    PARAGRAPH = "paragraph"
    SEMANTIC = "semantic"
    SLIDING_WINDOW = "sliding_window"

# ==================== Input/Output Schemas ====================

class Document(BaseModel):
    """문서 모델"""
    doc_id: Optional[str] = Field(None, description="문서 ID")
    title: str = Field(..., description="문서 제목")
    content: str = Field(..., description="문서 내용")
    doc_type: DocumentType = Field(..., description="문서 타입")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="메타데이터")
    created_at: Optional[datetime] = Field(None, description="생성 시간")
    updated_at: Optional[datetime] = Field(None, description="수정 시간")

class IndexRequest(BaseModel):
    """문서 인덱싱 요청"""
    documents: List[Document] = Field(..., description="인덱싱할 문서들")
    chunking_strategy: ChunkingStrategy = Field(
        default=ChunkingStrategy.SEMANTIC,
        description="청킹 전략"
    )
    chunk_size: int = Field(default=512, description="청크 크기")
    chunk_overlap: int = Field(default=128, description="청크 오버랩")
    extract_keywords: bool = Field(default=True, description="키워드 추출 여부")

class SearchRequest(BaseModel):
    """검색 요청"""
    query: str = Field(..., description="검색 쿼리")
    top_k: int = Field(default=5, description="상위 k개 결과")
    doc_types: Optional[List[DocumentType]] = Field(None, description="문서 타입 필터")
    strategy: SearchStrategy = Field(
        default=SearchStrategy.HYBRID,
        description="검색 전략"
    )
    min_score: Optional[float] = Field(None, description="최소 점수 임계값")
    date_range: Optional[Tuple[datetime, datetime]] = Field(None, description="날짜 범위")

class GenerateRequest(BaseModel):
    """컨텍스트 증강 생성 요청"""
    prompt: str = Field(..., description="생성 프롬프트")
    context_query: Optional[str] = Field(None, description="컨텍스트 검색 쿼리")
    context_docs: Optional[List[Document]] = Field(None, description="직접 제공된 컨텍스트")
    max_context_length: int = Field(default=2000, description="최대 컨텍스트 길이")
    temperature: float = Field(default=0.7, description="생성 온도")
    include_citations: bool = Field(default=True, description="인용 포함 여부")

class UpdateRequest(BaseModel):
    """지식 베이스 업데이트 요청"""
    doc_id: str = Field(..., description="문서 ID")
    updates: Dict[str, Any] = Field(..., description="업데이트 내용")
    reindex: bool = Field(default=True, description="재인덱싱 여부")

class HybridSearchRequest(BaseModel):
    """하이브리드 검색 요청"""
    query: str = Field(..., description="검색 쿼리")
    keyword_weight: float = Field(default=0.3, description="키워드 가중치")
    vector_weight: float = Field(default=0.7, description="벡터 가중치")
    top_k: int = Field(default=10, description="상위 k개 결과")
    rerank: bool = Field(default=True, description="재순위화 여부")

class ExtractRequest(BaseModel):
    """답변 추출 요청"""
    question: str = Field(..., description="질문")
    context: str = Field(..., description="컨텍스트")
    max_answers: int = Field(default=3, description="최대 답변 개수")
    answer_types: Optional[List[str]] = Field(None, description="답변 타입")

# ==================== Output Schemas ====================

class Chunk(BaseModel):
    """텍스트 청크"""
    chunk_id: str = Field(..., description="청크 ID")
    doc_id: str = Field(..., description="소속 문서 ID")
    content: str = Field(..., description="청크 내용")
    position: int = Field(..., description="문서 내 위치")
    embedding: Optional[List[float]] = Field(None, description="임베딩 벡터")
    keywords: List[str] = Field(default_factory=list, description="키워드")

class IndexResult(BaseModel):
    """인덱싱 결과"""
    indexed_docs: int = Field(..., description="인덱싱된 문서 수")
    total_chunks: int = Field(..., description="생성된 청크 수")
    avg_chunk_size: float = Field(..., description="평균 청크 크기")
    index_time: float = Field(..., description="인덱싱 시간(초)")

class SearchResult(BaseModel):
    """검색 결과"""
    doc_id: str = Field(..., description="문서 ID")
    title: str = Field(..., description="문서 제목")
    snippet: str = Field(..., description="관련 텍스트 스니펫")
    score: float = Field(..., description="관련도 점수")
    doc_type: str = Field(..., description="문서 타입")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="메타데이터")

class SearchResponse(BaseModel):
    """검색 응답"""
    results: List[SearchResult] = Field(..., description="검색 결과")
    total_found: int = Field(..., description="전체 매칭 수")
    search_time: float = Field(..., description="검색 시간(ms)")
    strategy_used: str = Field(..., description="사용된 전략")

class GenerateResult(BaseModel):
    """생성 결과"""
    generated_text: str = Field(..., description="생성된 텍스트")
    context_used: List[str] = Field(..., description="사용된 컨텍스트")
    citations: Optional[List[Dict[str, Any]]] = Field(None, description="인용 정보")
    confidence_score: float = Field(..., description="신뢰도 점수")

class Answer(BaseModel):
    """추출된 답변"""
    text: str = Field(..., description="답변 텍스트")
    confidence: float = Field(..., description="신뢰도")
    start_pos: int = Field(..., description="시작 위치")
    end_pos: int = Field(..., description="끝 위치")

class ExtractResult(BaseModel):
    """답변 추출 결과"""
    answers: List[Answer] = Field(..., description="추출된 답변들")
    question_type: str = Field(..., description="질문 유형")
    processing_time: float = Field(..., description="처리 시간(ms)")

# ==================== Main Agent Class ====================

class RAGAgent(AgentBase):
    """검색 증강 생성 에이전트"""

    def __init__(self, llm_service: Optional[LLMService] = None):
        super().__init__(
            agent_id="rag",
            name="RAG Agent",
            description="지식 베이스를 활용한 검색 증강 생성을 수행합니다",
            category="intelligence",
            llm_service=llm_service
        )

        # 지식 베이스 (인메모리 Mock)
        self.knowledge_base: Dict[str, Document] = {}
        self.chunks: List[Chunk] = []
        self.inverted_index: Dict[str, List[str]] = defaultdict(list)  # 키워드 -> 문서ID

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """에이전트 실행"""
        try:
            task = RAGTask(request.task)

            if task == RAGTask.INDEX_DOCUMENT:
                result = await self._index_document(request.payload)
            elif task == RAGTask.SEARCH_KNOWLEDGE:
                result = await self._search_knowledge(request.payload)
            elif task == RAGTask.GENERATE_WITH_CONTEXT:
                result = await self._generate_with_context(request.payload)
            elif task == RAGTask.UPDATE_KNOWLEDGE:
                result = await self._update_knowledge(request.payload)
            elif task == RAGTask.HYBRID_SEARCH:
                result = await self._hybrid_search(request.payload)
            elif task == RAGTask.EXTRACT_ANSWERS:
                result = await self._extract_answers(request.payload)
            else:
                raise AgentError(f"Unknown task: {request.task}")

            return AgentResponse(
                agent_id=self.agent_id,
                status="success",
                result=result,
                metadata={
                    "task": task.value,
                    "timestamp": datetime.now().isoformat(),
                    "knowledge_base_size": len(self.knowledge_base),
                    "total_chunks": len(self.chunks)
                }
            )

        except ValidationError as e:
            logger.error(f"Validation error: {e}")
            return AgentResponse(
                agent_id=self.agent_id,
                status="error",
                error=f"입력 데이터 검증 실패: {str(e)}"
            )
        except Exception as e:
            logger.error(f"RAG agent error: {e}")
            return AgentResponse(
                agent_id=self.agent_id,
                status="error",
                error=str(e)
            )

    async def _index_document(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """문서 인덱싱"""
        input_data = IndexRequest(**payload)
        start_time = datetime.now()

        indexed_docs = 0
        total_chunks = 0
        chunk_sizes = []

        for doc in input_data.documents:
            # 문서 ID 생성
            if not doc.doc_id:
                doc.doc_id = self._generate_doc_id(doc.title + doc.content)

            # 문서 저장
            self.knowledge_base[doc.doc_id] = doc
            indexed_docs += 1

            # 청킹
            chunks = self._chunk_text(
                doc.content,
                doc.doc_id,
                input_data.chunking_strategy,
                input_data.chunk_size,
                input_data.chunk_overlap
            )

            # 키워드 추출
            if input_data.extract_keywords:
                for chunk in chunks:
                    keywords = self._extract_keywords(chunk.content)
                    chunk.keywords = keywords

                    # 역인덱스 업데이트
                    for keyword in keywords:
                        self.inverted_index[keyword.lower()].append(doc.doc_id)

            self.chunks.extend(chunks)
            total_chunks += len(chunks)
            chunk_sizes.extend([len(c.content) for c in chunks])

        avg_chunk_size = sum(chunk_sizes) / len(chunk_sizes) if chunk_sizes else 0
        index_time = (datetime.now() - start_time).total_seconds()

        return IndexResult(
            indexed_docs=indexed_docs,
            total_chunks=total_chunks,
            avg_chunk_size=avg_chunk_size,
            index_time=index_time
        ).dict()

    async def _search_knowledge(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """지식 베이스 검색"""
        input_data = SearchRequest(**payload)
        start_time = datetime.now()

        results = []

        if input_data.strategy == SearchStrategy.KEYWORD_ONLY:
            # 키워드 검색
            results = await self._keyword_search(
                input_data.query,
                input_data.top_k,
                input_data.doc_types
            )
        elif input_data.strategy == SearchStrategy.VECTOR_ONLY:
            # 벡터 검색
            results = await self._vector_search(
                input_data.query,
                input_data.top_k,
                input_data.doc_types
            )
        else:
            # 하이브리드 검색
            keyword_results = await self._keyword_search(
                input_data.query,
                input_data.top_k * 2,
                input_data.doc_types
            )
            vector_results = await self._vector_search(
                input_data.query,
                input_data.top_k * 2,
                input_data.doc_types
            )

            # 결과 병합 및 재순위화
            results = self._merge_results(keyword_results, vector_results)

            if input_data.strategy == SearchStrategy.RERANK:
                results = await self._rerank_results(results, input_data.query)

        # 필터링
        if input_data.min_score:
            results = [r for r in results if r.score >= input_data.min_score]

        # 날짜 범위 필터
        if input_data.date_range:
            results = self._filter_by_date(results, input_data.date_range)

        # 상위 k개 선택
        results = results[:input_data.top_k]

        search_time = (datetime.now() - start_time).total_seconds() * 1000

        return SearchResponse(
            results=results,
            total_found=len(results),
            search_time=search_time,
            strategy_used=input_data.strategy.value
        ).dict()

    async def _generate_with_context(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """컨텍스트 증강 생성"""
        input_data = GenerateRequest(**payload)

        # 컨텍스트 수집
        context_chunks = []

        if input_data.context_query:
            # 검색을 통한 컨텍스트
            search_results = await self._search_knowledge({
                "query": input_data.context_query,
                "top_k": 5,
                "strategy": SearchStrategy.HYBRID
            })
            for result in search_results["results"]:
                context_chunks.append(result["snippet"])

        elif input_data.context_docs:
            # 직접 제공된 컨텍스트
            for doc in input_data.context_docs:
                context_chunks.append(doc.content[:input_data.max_context_length // len(input_data.context_docs)])

        # 컨텍스트 제한
        combined_context = "\n\n".join(context_chunks)
        if len(combined_context) > input_data.max_context_length:
            combined_context = combined_context[:input_data.max_context_length]

        # Mock 생성 (실제로는 LLM 호출)
        if self.llm_service:
            # TODO: LLM을 통한 실제 생성
            pass

        # Mock 응답
        generated_text = self._generate_mock_response(input_data.prompt, combined_context)

        # 인용 정보
        citations = []
        if input_data.include_citations and context_chunks:
            for i, chunk in enumerate(context_chunks[:3]):
                citations.append({
                    "source": f"Source {i+1}",
                    "text": chunk[:100] + "...",
                    "relevance": 0.85 - i * 0.1
                })

        # 신뢰도 점수 계산
        confidence_score = min(0.95, 0.7 + len(context_chunks) * 0.05)

        return GenerateResult(
            generated_text=generated_text,
            context_used=context_chunks,
            citations=citations if input_data.include_citations else None,
            confidence_score=confidence_score
        ).dict()

    async def _update_knowledge(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """지식 베이스 업데이트"""
        input_data = UpdateRequest(**payload)

        if input_data.doc_id not in self.knowledge_base:
            raise ValueError(f"문서를 찾을 수 없습니다: {input_data.doc_id}")

        doc = self.knowledge_base[input_data.doc_id]

        # 업데이트 적용
        for key, value in input_data.updates.items():
            if hasattr(doc, key):
                setattr(doc, key, value)

        doc.updated_at = datetime.now()

        # 재인덱싱
        if input_data.reindex:
            # 기존 청크 제거
            self.chunks = [c for c in self.chunks if c.doc_id != input_data.doc_id]

            # 새로운 청킹
            new_chunks = self._chunk_text(
                doc.content,
                doc.doc_id,
                ChunkingStrategy.SEMANTIC,
                512,
                128
            )

            for chunk in new_chunks:
                keywords = self._extract_keywords(chunk.content)
                chunk.keywords = keywords

            self.chunks.extend(new_chunks)

        return {
            "doc_id": input_data.doc_id,
            "updated_fields": list(input_data.updates.keys()),
            "reindexed": input_data.reindex,
            "updated_at": doc.updated_at.isoformat()
        }

    async def _hybrid_search(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """하이브리드 검색"""
        input_data = HybridSearchRequest(**payload)

        # 키워드 검색
        keyword_results = await self._keyword_search(
            input_data.query,
            input_data.top_k * 2
        )

        # 벡터 검색
        vector_results = await self._vector_search(
            input_data.query,
            input_data.top_k * 2
        )

        # 가중치 적용 및 병합
        combined_results = {}

        for result in keyword_results:
            combined_results[result.doc_id] = result.score * input_data.keyword_weight

        for result in vector_results:
            if result.doc_id in combined_results:
                combined_results[result.doc_id] += result.score * input_data.vector_weight
            else:
                combined_results[result.doc_id] = result.score * input_data.vector_weight

        # 정렬
        sorted_results = sorted(
            combined_results.items(),
            key=lambda x: x[1],
            reverse=True
        )[:input_data.top_k]

        # 결과 구성
        final_results = []
        for doc_id, score in sorted_results:
            if doc_id in self.knowledge_base:
                doc = self.knowledge_base[doc_id]
                final_results.append(SearchResult(
                    doc_id=doc_id,
                    title=doc.title,
                    snippet=doc.content[:200] + "...",
                    score=score,
                    doc_type=doc.doc_type.value,
                    metadata=doc.metadata
                ))

        # 재순위화
        if input_data.rerank:
            final_results = await self._rerank_results(final_results, input_data.query)

        return SearchResponse(
            results=final_results,
            total_found=len(final_results),
            search_time=10.5,  # Mock
            strategy_used="hybrid_rerank" if input_data.rerank else "hybrid"
        ).dict()

    async def _extract_answers(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """답변 추출"""
        input_data = ExtractRequest(**payload)
        start_time = datetime.now()

        # 질문 유형 분석
        question_type = self._analyze_question_type(input_data.question)

        # Mock 답변 추출 (실제로는 NLP 모델 사용)
        answers = []

        # 간단한 패턴 매칭으로 답변 추출 시뮬레이션
        sentences = input_data.context.split('.')
        for i, sentence in enumerate(sentences[:input_data.max_answers]):
            if self._is_relevant_sentence(sentence, input_data.question):
                start_pos = input_data.context.find(sentence)
                end_pos = start_pos + len(sentence)

                answers.append(Answer(
                    text=sentence.strip(),
                    confidence=0.85 - i * 0.1,
                    start_pos=start_pos,
                    end_pos=end_pos
                ))

        # 답변이 없으면 Mock 답변 생성
        if not answers:
            answers.append(Answer(
                text="답변을 찾을 수 없습니다.",
                confidence=0.3,
                start_pos=0,
                end_pos=0
            ))

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        return ExtractResult(
            answers=answers,
            question_type=question_type,
            processing_time=processing_time
        ).dict()

    # ==================== Helper Methods ====================

    def _generate_doc_id(self, content: str) -> str:
        """문서 ID 생성"""
        return hashlib.md5(content.encode()).hexdigest()[:12]

    def _chunk_text(
        self,
        text: str,
        doc_id: str,
        strategy: ChunkingStrategy,
        chunk_size: int,
        overlap: int
    ) -> List[Chunk]:
        """텍스트 청킹"""
        chunks = []

        if strategy == ChunkingStrategy.FIXED_SIZE:
            # 고정 크기 청킹
            for i in range(0, len(text), chunk_size - overlap):
                chunk_content = text[i:i + chunk_size]
                if chunk_content:
                    chunks.append(Chunk(
                        chunk_id=f"{doc_id}_{len(chunks)}",
                        doc_id=doc_id,
                        content=chunk_content,
                        position=i
                    ))

        elif strategy == ChunkingStrategy.SENTENCE:
            # 문장 단위 청킹
            sentences = re.split(r'[.!?]', text)
            current_chunk = ""
            position = 0

            for sentence in sentences:
                if len(current_chunk) + len(sentence) > chunk_size:
                    if current_chunk:
                        chunks.append(Chunk(
                            chunk_id=f"{doc_id}_{len(chunks)}",
                            doc_id=doc_id,
                            content=current_chunk,
                            position=position
                        ))
                        position += len(current_chunk)
                    current_chunk = sentence
                else:
                    current_chunk += sentence

            if current_chunk:
                chunks.append(Chunk(
                    chunk_id=f"{doc_id}_{len(chunks)}",
                    doc_id=doc_id,
                    content=current_chunk,
                    position=position
                ))

        elif strategy == ChunkingStrategy.PARAGRAPH:
            # 단락 단위 청킹
            paragraphs = text.split('\n\n')
            position = 0

            for para in paragraphs:
                if para:
                    chunks.append(Chunk(
                        chunk_id=f"{doc_id}_{len(chunks)}",
                        doc_id=doc_id,
                        content=para[:chunk_size],
                        position=position
                    ))
                    position += len(para) + 2

        else:
            # 의미 단위 청킹 (Mock)
            # 실제로는 NLP 모델을 사용하여 의미 단위로 분할
            chunk_count = max(1, len(text) // chunk_size)
            for i in range(chunk_count):
                start = i * (len(text) // chunk_count)
                end = (i + 1) * (len(text) // chunk_count)
                chunks.append(Chunk(
                    chunk_id=f"{doc_id}_{i}",
                    doc_id=doc_id,
                    content=text[start:end],
                    position=start
                ))

        return chunks

    def _extract_keywords(self, text: str) -> List[str]:
        """키워드 추출"""
        # 간단한 키워드 추출 (실제로는 TF-IDF, TextRank 등 사용)
        words = re.findall(r'\b\w+\b', text.lower())
        # 불용어 제거
        stopwords = {'의', '를', '을', '는', '이', '가', '에', '와', '과', '로', '으로', 'the', 'a', 'an', 'in', 'on', 'at'}
        keywords = [w for w in words if w not in stopwords and len(w) > 2]

        # 빈도 기반 상위 키워드
        from collections import Counter
        word_counts = Counter(keywords)
        return [word for word, _ in word_counts.most_common(10)]

    async def _keyword_search(
        self,
        query: str,
        top_k: int,
        doc_types: Optional[List[DocumentType]] = None
    ) -> List[SearchResult]:
        """키워드 검색"""
        query_keywords = self._extract_keywords(query)
        doc_scores = defaultdict(float)

        # 역인덱스를 사용한 검색
        for keyword in query_keywords:
            if keyword in self.inverted_index:
                for doc_id in self.inverted_index[keyword]:
                    doc_scores[doc_id] += 1.0

        # 정렬 및 결과 생성
        results = []
        for doc_id, score in sorted(doc_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]:
            if doc_id in self.knowledge_base:
                doc = self.knowledge_base[doc_id]

                # 문서 타입 필터
                if doc_types and doc.doc_type not in doc_types:
                    continue

                results.append(SearchResult(
                    doc_id=doc_id,
                    title=doc.title,
                    snippet=doc.content[:200] + "...",
                    score=score / len(query_keywords),
                    doc_type=doc.doc_type.value,
                    metadata=doc.metadata
                ))

        return results

    async def _vector_search(
        self,
        query: str,
        top_k: int,
        doc_types: Optional[List[DocumentType]] = None
    ) -> List[SearchResult]:
        """벡터 검색 (Mock)"""
        # 실제로는 임베딩을 생성하고 유사도 검색
        results = []

        # Mock 검색 결과
        for i, (doc_id, doc) in enumerate(list(self.knowledge_base.items())[:top_k]):
            if doc_types and doc.doc_type not in doc_types:
                continue

            results.append(SearchResult(
                doc_id=doc_id,
                title=doc.title,
                snippet=doc.content[:200] + "...",
                score=0.9 - i * 0.05,
                doc_type=doc.doc_type.value,
                metadata=doc.metadata
            ))

        return results

    def _merge_results(
        self,
        keyword_results: List[SearchResult],
        vector_results: List[SearchResult]
    ) -> List[SearchResult]:
        """결과 병합"""
        merged = {}

        for result in keyword_results:
            merged[result.doc_id] = result
            merged[result.doc_id].score *= 0.3

        for result in vector_results:
            if result.doc_id in merged:
                merged[result.doc_id].score += result.score * 0.7
            else:
                merged[result.doc_id] = result
                merged[result.doc_id].score *= 0.7

        return sorted(merged.values(), key=lambda x: x.score, reverse=True)

    async def _rerank_results(self, results: List[SearchResult], query: str) -> List[SearchResult]:
        """결과 재순위화 (Mock)"""
        # 실제로는 Cross-Encoder 등을 사용
        for i, result in enumerate(results):
            # Mock 재순위 점수
            result.score *= (1.0 - i * 0.02)
        return sorted(results, key=lambda x: x.score, reverse=True)

    def _filter_by_date(
        self,
        results: List[SearchResult],
        date_range: Tuple[datetime, datetime]
    ) -> List[SearchResult]:
        """날짜 필터링"""
        filtered = []
        for result in results:
            if result.doc_id in self.knowledge_base:
                doc = self.knowledge_base[result.doc_id]
                if doc.created_at and date_range[0] <= doc.created_at <= date_range[1]:
                    filtered.append(result)
        return filtered

    def _generate_mock_response(self, prompt: str, context: str) -> str:
        """Mock 응답 생성"""
        return f"""
질문: {prompt}

컨텍스트 기반 응답:
제공된 컨텍스트를 바탕으로 다음과 같이 답변드립니다.

{context[:300]}...를 참고하여 작성된 내용입니다.

이 답변은 검색된 관련 문서들을 종합하여 생성되었으며,
정확성과 관련성을 높이기 위해 여러 소스를 참조했습니다.
"""

    def _analyze_question_type(self, question: str) -> str:
        """질문 유형 분석"""
        if any(word in question for word in ['무엇', '뭐', 'what']):
            return "what_question"
        elif any(word in question for word in ['언제', 'when']):
            return "when_question"
        elif any(word in question for word in ['어디', 'where']):
            return "where_question"
        elif any(word in question for word in ['왜', 'why']):
            return "why_question"
        elif any(word in question for word in ['어떻게', 'how']):
            return "how_question"
        elif any(word in question for word in ['누가', '누구', 'who']):
            return "who_question"
        else:
            return "general_question"

    def _is_relevant_sentence(self, sentence: str, question: str) -> bool:
        """문장 관련성 판단 (Mock)"""
        # 간단한 키워드 매칭
        question_keywords = set(self._extract_keywords(question))
        sentence_keywords = set(self._extract_keywords(sentence))
        return len(question_keywords & sentence_keywords) > 0

    def get_capabilities(self) -> Dict[str, Any]:
        """에이전트 능력 정보 반환"""
        return {
            "supported_tasks": [task.value for task in RAGTask],
            "document_types": [dtype.value for dtype in DocumentType],
            "search_strategies": [strategy.value for strategy in SearchStrategy],
            "chunking_strategies": [strategy.value for strategy in ChunkingStrategy],
            "features": {
                "hybrid_search": True,
                "semantic_chunking": True,
                "keyword_extraction": True,
                "reranking": True,
                "answer_extraction": True,
                "incremental_indexing": True,
                "multilingual": True
            },
            "knowledge_base_stats": {
                "total_documents": len(self.knowledge_base),
                "total_chunks": len(self.chunks),
                "indexed_keywords": len(self.inverted_index)
            }
        }

# ==================== Factory Function ====================

def create_rag_agent(llm_service: Optional[LLMService] = None) -> RAGAgent:
    """RAGAgent 인스턴스 생성"""
    return RAGAgent(llm_service=llm_service)

# ==================== Example Usage ====================

if __name__ == "__main__":
    async def test_rag_agent():
        # 에이전트 생성
        agent = create_rag_agent()

        # 1. 문서 인덱싱
        index_request = AgentRequest(
            task="index_document",
            payload={
                "documents": [
                    {
                        "title": "Sparklio 마케팅 가이드",
                        "content": """
                        Sparklio는 AI 기반 마케팅 자동화 플랫폼으로,
                        콘텐츠 생성, 캠페인 관리, 성과 분석을 통합 제공합니다.
                        주요 기능으로는 AI 콘텐츠 생성, 자동 A/B 테스팅,
                        실시간 성과 모니터링이 있습니다.
                        """,
                        "doc_type": "marketing_guide",
                        "metadata": {"version": "1.0", "category": "platform"}
                    },
                    {
                        "title": "브랜드 가이드라인",
                        "content": """
                        Sparklio 브랜드는 혁신, 효율성, 창의성을 추구합니다.
                        주요 색상은 파란색과 흰색이며,
                        톤앤매너는 전문적이면서도 친근합니다.
                        """,
                        "doc_type": "brand_guideline",
                        "metadata": {"year": 2024}
                    }
                ],
                "chunking_strategy": "semantic",
                "chunk_size": 256
            }
        )

        result = await agent.execute(index_request)
        print(f"문서 인덱싱 결과: {result.status}")
        if result.status == "success":
            print(f"  - 인덱싱된 문서: {result.result['indexed_docs']}")
            print(f"  - 생성된 청크: {result.result['total_chunks']}")

        # 2. 지식 베이스 검색
        search_request = AgentRequest(
            task="search_knowledge",
            payload={
                "query": "Sparklio AI 기능",
                "top_k": 3,
                "strategy": "hybrid"
            }
        )

        result = await agent.execute(search_request)
        print(f"\n지식 베이스 검색 결과: {result.status}")
        if result.status == "success":
            print(f"  - 검색 결과: {result.result['total_found']}개")
            for item in result.result['results']:
                print(f"    - {item['title']}: 점수 {item['score']:.2f}")

        # 3. 컨텍스트 증강 생성
        generate_request = AgentRequest(
            task="generate_with_context",
            payload={
                "prompt": "Sparklio의 주요 장점은 무엇인가요?",
                "context_query": "Sparklio 기능 장점",
                "include_citations": True
            }
        )

        result = await agent.execute(generate_request)
        print(f"\n컨텍스트 증강 생성 결과: {result.status}")
        if result.status == "success":
            print(f"  - 생성된 텍스트: {result.result['generated_text'][:200]}...")
            print(f"  - 신뢰도: {result.result['confidence_score']:.2f}")
            if result.result.get('citations'):
                print(f"  - 인용 수: {len(result.result['citations'])}")

        # 4. 하이브리드 검색
        hybrid_request = AgentRequest(
            task="hybrid_search",
            payload={
                "query": "브랜드 색상",
                "keyword_weight": 0.4,
                "vector_weight": 0.6,
                "top_k": 2
            }
        )

        result = await agent.execute(hybrid_request)
        print(f"\n하이브리드 검색 결과: {result.status}")
        if result.status == "success":
            print(f"  - 검색 전략: {result.result['strategy_used']}")
            print(f"  - 결과 수: {result.result['total_found']}")

        # 5. 답변 추출
        extract_request = AgentRequest(
            task="extract_answers",
            payload={
                "question": "Sparklio의 주요 기능은 무엇인가요?",
                "context": """
                Sparklio는 AI 기반 마케팅 자동화 플랫폼입니다.
                주요 기능으로는 AI 콘텐츠 생성이 있습니다.
                자동 A/B 테스팅도 제공합니다.
                실시간 성과 모니터링이 가능합니다.
                """,
                "max_answers": 3
            }
        )

        result = await agent.execute(extract_request)
        print(f"\n답변 추출 결과: {result.status}")
        if result.status == "success":
            print(f"  - 질문 유형: {result.result['question_type']}")
            for answer in result.result['answers']:
                print(f"    - 답변: {answer['text']} (신뢰도: {answer['confidence']:.2f})")

    # 테스트 실행
    asyncio.run(test_rag_agent())