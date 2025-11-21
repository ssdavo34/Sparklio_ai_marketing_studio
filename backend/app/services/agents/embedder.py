"""
Embedder Agent - 텍스트 및 이미지 임베딩 생성 에이전트

이 에이전트는 텍스트와 이미지를 벡터로 변환하여 유사도 검색과
클러스터링을 가능하게 합니다.

주요 기능:
1. 텍스트 임베딩 생성 (OpenAI, Sentence Transformers)
2. 이미지 임베딩 생성 (CLIP, Vision Transformers)
3. 멀티모달 임베딩 (텍스트+이미지)
4. 임베딩 저장 및 인덱싱
5. 유사도 검색
"""

import json
import hashlib
import numpy as np
from typing import Dict, Any, List, Optional, Tuple, Union
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, ValidationError
import asyncio
import logging

from app.services.agents.base import AgentBase, AgentRequest, AgentResponse, AgentError
from app.services.llm import LLMGateway as LLMService

logger = logging.getLogger(__name__)

# ==================== Enums ====================

class EmbeddingModel(str, Enum):
    """임베딩 모델 종류"""
    # Text Models
    OPENAI_ADA = "openai_ada_002"
    OPENAI_SMALL = "openai_text_embedding_3_small"
    OPENAI_LARGE = "openai_text_embedding_3_large"
    SENTENCE_BERT = "sentence_transformers_all_MiniLM"
    KOREAN_BERT = "klue_bert_base"

    # Image Models
    CLIP_VIT_B32 = "clip_vit_b32"
    CLIP_VIT_L14 = "clip_vit_l14"
    RESNET50 = "resnet50_imagenet"

    # Multimodal
    CLIP_MULTIMODAL = "clip_multimodal"
    ALIGN_MODEL = "align_base"

class EmbeddingTask(str, Enum):
    """임베딩 작업 종류"""
    EMBED_TEXT = "embed_text"
    EMBED_IMAGE = "embed_image"
    EMBED_BATCH = "embed_batch"
    SEARCH_SIMILAR = "search_similar"
    CLUSTER_EMBEDDINGS = "cluster_embeddings"
    REDUCE_DIMENSIONS = "reduce_dimensions"

class SimilarityMetric(str, Enum):
    """유사도 측정 방식"""
    COSINE = "cosine"
    EUCLIDEAN = "euclidean"
    DOT_PRODUCT = "dot_product"
    MANHATTAN = "manhattan"

class DimensionReduction(str, Enum):
    """차원 축소 방법"""
    PCA = "pca"
    TSNE = "tsne"
    UMAP = "umap"
    AUTOENCODER = "autoencoder"

# ==================== Input/Output Schemas ====================

class TextEmbeddingInput(BaseModel):
    """텍스트 임베딩 입력"""
    text: str = Field(..., description="임베딩할 텍스트")
    model: EmbeddingModel = Field(
        default=EmbeddingModel.OPENAI_SMALL,
        description="사용할 임베딩 모델"
    )
    normalize: bool = Field(
        default=True,
        description="벡터 정규화 여부"
    )

class ImageEmbeddingInput(BaseModel):
    """이미지 임베딩 입력"""
    image_path: Optional[str] = Field(None, description="이미지 파일 경로")
    image_url: Optional[str] = Field(None, description="이미지 URL")
    image_base64: Optional[str] = Field(None, description="Base64 인코딩된 이미지")
    model: EmbeddingModel = Field(
        default=EmbeddingModel.CLIP_VIT_B32,
        description="사용할 이미지 임베딩 모델"
    )

class BatchEmbeddingInput(BaseModel):
    """배치 임베딩 입력"""
    items: List[Union[TextEmbeddingInput, ImageEmbeddingInput]] = Field(
        ..., description="임베딩할 항목 리스트"
    )
    batch_size: int = Field(default=32, description="배치 크기")
    parallel: bool = Field(default=True, description="병렬 처리 여부")

class SimilaritySearchInput(BaseModel):
    """유사도 검색 입력"""
    query_embedding: List[float] = Field(..., description="쿼리 임베딩 벡터")
    embeddings: List[List[float]] = Field(..., description="검색 대상 임베딩들")
    metadata: Optional[List[Dict[str, Any]]] = Field(None, description="임베딩 메타데이터")
    top_k: int = Field(default=10, description="상위 k개 결과")
    metric: SimilarityMetric = Field(
        default=SimilarityMetric.COSINE,
        description="유사도 측정 방식"
    )
    threshold: Optional[float] = Field(None, description="유사도 임계값")

class ClusteringInput(BaseModel):
    """클러스터링 입력"""
    embeddings: List[List[float]] = Field(..., description="클러스터링할 임베딩들")
    n_clusters: Optional[int] = Field(None, description="클러스터 개수")
    method: str = Field(default="kmeans", description="클러스터링 방법")
    min_cluster_size: int = Field(default=5, description="최소 클러스터 크기")

class DimensionReductionInput(BaseModel):
    """차원 축소 입력"""
    embeddings: List[List[float]] = Field(..., description="축소할 임베딩들")
    target_dim: int = Field(default=2, description="목표 차원 수")
    method: DimensionReduction = Field(
        default=DimensionReduction.PCA,
        description="차원 축소 방법"
    )

# ==================== Output Schemas ====================

class EmbeddingResult(BaseModel):
    """임베딩 결과"""
    embedding: List[float] = Field(..., description="임베딩 벡터")
    model: str = Field(..., description="사용된 모델")
    dimensions: int = Field(..., description="벡터 차원")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="메타데이터")

class BatchEmbeddingResult(BaseModel):
    """배치 임베딩 결과"""
    embeddings: List[EmbeddingResult] = Field(..., description="임베딩 결과 리스트")
    total: int = Field(..., description="전체 개수")
    processed: int = Field(..., description="처리된 개수")
    failed: int = Field(..., description="실패한 개수")
    processing_time: float = Field(..., description="처리 시간(초)")

class SimilarityResult(BaseModel):
    """유사도 검색 결과"""
    index: int = Field(..., description="인덱스")
    score: float = Field(..., description="유사도 점수")
    metadata: Optional[Dict[str, Any]] = Field(None, description="메타데이터")

class SearchResult(BaseModel):
    """검색 결과"""
    results: List[SimilarityResult] = Field(..., description="검색 결과 리스트")
    query_time: float = Field(..., description="검색 시간(ms)")
    total_candidates: int = Field(..., description="전체 후보 개수")

class ClusterResult(BaseModel):
    """클러스터링 결과"""
    cluster_id: int = Field(..., description="클러스터 ID")
    items: List[int] = Field(..., description="클러스터에 속한 아이템 인덱스")
    centroid: List[float] = Field(..., description="클러스터 중심")
    size: int = Field(..., description="클러스터 크기")

class ClusteringResult(BaseModel):
    """클러스터링 전체 결과"""
    clusters: List[ClusterResult] = Field(..., description="클러스터 리스트")
    n_clusters: int = Field(..., description="클러스터 개수")
    method: str = Field(..., description="사용된 방법")
    silhouette_score: float = Field(..., description="실루엣 점수")

class ReductionResult(BaseModel):
    """차원 축소 결과"""
    reduced_embeddings: List[List[float]] = Field(..., description="축소된 임베딩")
    original_dim: int = Field(..., description="원본 차원")
    target_dim: int = Field(..., description="목표 차원")
    explained_variance: Optional[float] = Field(None, description="설명된 분산")

# ==================== Main Agent Class ====================

class EmbedderAgent(AgentBase):
    """텍스트/이미지 임베딩 생성 에이전트"""

    def __init__(self, llm_service: Optional[LLMService] = None):
        super().__init__(
            agent_id="embedder",
            name="Embedder Agent",
            description="텍스트와 이미지를 벡터로 변환하고 유사도 검색을 수행합니다",
            category="intelligence",
            llm_service=llm_service
        )

        # 임베딩 캐시 (메모리 절약)
        self.embedding_cache = {}
        self.cache_size = 1000

        # 모델별 차원 정보
        self.model_dimensions = {
            EmbeddingModel.OPENAI_ADA: 1536,
            EmbeddingModel.OPENAI_SMALL: 1536,
            EmbeddingModel.OPENAI_LARGE: 3072,
            EmbeddingModel.SENTENCE_BERT: 384,
            EmbeddingModel.KOREAN_BERT: 768,
            EmbeddingModel.CLIP_VIT_B32: 512,
            EmbeddingModel.CLIP_VIT_L14: 768,
            EmbeddingModel.RESNET50: 2048,
            EmbeddingModel.CLIP_MULTIMODAL: 512,
            EmbeddingModel.ALIGN_MODEL: 640,
        }

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """에이전트 실행"""
        try:
            task = EmbeddingTask(request.task)

            if task == EmbeddingTask.EMBED_TEXT:
                result = await self._embed_text(request.payload)
            elif task == EmbeddingTask.EMBED_IMAGE:
                result = await self._embed_image(request.payload)
            elif task == EmbeddingTask.EMBED_BATCH:
                result = await self._embed_batch(request.payload)
            elif task == EmbeddingTask.SEARCH_SIMILAR:
                result = await self._search_similar(request.payload)
            elif task == EmbeddingTask.CLUSTER_EMBEDDINGS:
                result = await self._cluster_embeddings(request.payload)
            elif task == EmbeddingTask.REDUCE_DIMENSIONS:
                result = await self._reduce_dimensions(request.payload)
            else:
                raise AgentError(f"Unknown task: {request.task}")

            return AgentResponse(
                agent_id=self.agent_id,
                status="success",
                result=result,
                metadata={
                    "task": task.value,
                    "timestamp": datetime.now().isoformat(),
                    "cache_hits": len(self.embedding_cache)
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
            logger.error(f"Embedder agent error: {e}")
            return AgentResponse(
                agent_id=self.agent_id,
                status="error",
                error=str(e)
            )

    async def _embed_text(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """텍스트 임베딩 생성"""
        input_data = TextEmbeddingInput(**payload)

        # 캐시 확인
        cache_key = self._get_cache_key(input_data.text, input_data.model.value)
        if cache_key in self.embedding_cache:
            logger.info(f"Cache hit for text embedding")
            return self.embedding_cache[cache_key]

        # Mock 임베딩 생성 (실제로는 API 호출)
        if self.llm_service:
            # TODO: LLM 서비스를 통한 실제 임베딩 생성
            pass

        # Mock 데이터
        dimensions = self.model_dimensions[input_data.model]
        embedding = np.random.randn(dimensions).tolist()

        if input_data.normalize:
            # L2 정규화
            norm = np.linalg.norm(embedding)
            embedding = (np.array(embedding) / norm).tolist()

        result = EmbeddingResult(
            embedding=embedding,
            model=input_data.model.value,
            dimensions=dimensions,
            metadata={
                "text_length": len(input_data.text),
                "normalized": input_data.normalize,
                "language": self._detect_language(input_data.text)
            }
        ).dict()

        # 캐시 저장
        self._update_cache(cache_key, result)

        return result

    async def _embed_image(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """이미지 임베딩 생성"""
        input_data = ImageEmbeddingInput(**payload)

        # 이미지 소스 확인
        image_source = None
        if input_data.image_path:
            image_source = f"file:{input_data.image_path}"
        elif input_data.image_url:
            image_source = f"url:{input_data.image_url}"
        elif input_data.image_base64:
            image_source = f"base64:{input_data.image_base64[:32]}..."

        if not image_source:
            raise ValueError("이미지 소스가 제공되지 않았습니다")

        # Mock 임베딩 생성
        dimensions = self.model_dimensions[input_data.model]
        embedding = np.random.randn(dimensions).tolist()

        # 정규화 (이미지 임베딩은 기본적으로 정규화)
        norm = np.linalg.norm(embedding)
        embedding = (np.array(embedding) / norm).tolist()

        return EmbeddingResult(
            embedding=embedding,
            model=input_data.model.value,
            dimensions=dimensions,
            metadata={
                "image_source": image_source,
                "normalized": True
            }
        ).dict()

    async def _embed_batch(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """배치 임베딩 생성"""
        input_data = BatchEmbeddingInput(**payload)

        start_time = datetime.now()
        results = []
        failed = 0

        # 배치 처리
        for i in range(0, len(input_data.items), input_data.batch_size):
            batch = input_data.items[i:i + input_data.batch_size]

            if input_data.parallel:
                # 병렬 처리
                tasks = []
                for item in batch:
                    if isinstance(item, dict):
                        if "text" in item:
                            tasks.append(self._embed_text(item))
                        elif any(k in item for k in ["image_path", "image_url", "image_base64"]):
                            tasks.append(self._embed_image(item))

                batch_results = await asyncio.gather(*tasks, return_exceptions=True)

                for result in batch_results:
                    if isinstance(result, Exception):
                        failed += 1
                        logger.error(f"Batch embedding failed: {result}")
                    else:
                        results.append(EmbeddingResult(**result))
            else:
                # 순차 처리
                for item in batch:
                    try:
                        if isinstance(item, dict):
                            if "text" in item:
                                result = await self._embed_text(item)
                            elif any(k in item for k in ["image_path", "image_url", "image_base64"]):
                                result = await self._embed_image(item)
                            else:
                                continue
                            results.append(EmbeddingResult(**result))
                    except Exception as e:
                        failed += 1
                        logger.error(f"Batch embedding failed: {e}")

        processing_time = (datetime.now() - start_time).total_seconds()

        return BatchEmbeddingResult(
            embeddings=results,
            total=len(input_data.items),
            processed=len(results),
            failed=failed,
            processing_time=processing_time
        ).dict()

    async def _search_similar(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """유사도 검색"""
        input_data = SimilaritySearchInput(**payload)

        start_time = datetime.now()

        # 유사도 계산
        similarities = []
        query_vec = np.array(input_data.query_embedding)

        for i, embedding in enumerate(input_data.embeddings):
            target_vec = np.array(embedding)

            # 유사도 계산
            if input_data.metric == SimilarityMetric.COSINE:
                score = self._cosine_similarity(query_vec, target_vec)
            elif input_data.metric == SimilarityMetric.EUCLIDEAN:
                score = -np.linalg.norm(query_vec - target_vec)  # 음수로 변환 (작을수록 좋음)
            elif input_data.metric == SimilarityMetric.DOT_PRODUCT:
                score = np.dot(query_vec, target_vec)
            elif input_data.metric == SimilarityMetric.MANHATTAN:
                score = -np.sum(np.abs(query_vec - target_vec))  # 음수로 변환
            else:
                score = 0.0

            # 임계값 필터링
            if input_data.threshold is None or score >= input_data.threshold:
                metadata = input_data.metadata[i] if input_data.metadata and i < len(input_data.metadata) else None
                similarities.append(SimilarityResult(
                    index=i,
                    score=float(score),
                    metadata=metadata
                ))

        # 상위 k개 선택
        similarities.sort(key=lambda x: x.score, reverse=True)
        top_results = similarities[:input_data.top_k]

        query_time = (datetime.now() - start_time).total_seconds() * 1000  # ms

        return SearchResult(
            results=top_results,
            query_time=query_time,
            total_candidates=len(input_data.embeddings)
        ).dict()

    async def _cluster_embeddings(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """임베딩 클러스터링"""
        input_data = ClusteringInput(**payload)

        embeddings = np.array(input_data.embeddings)

        # Mock 클러스터링 (실제로는 sklearn 사용)
        if input_data.n_clusters:
            n_clusters = input_data.n_clusters
        else:
            # 자동 결정 (엘보우 메서드 등)
            n_clusters = min(5, len(embeddings) // 10)

        # Mock 클러스터 할당
        clusters = []
        items_per_cluster = len(embeddings) // n_clusters

        for i in range(n_clusters):
            start_idx = i * items_per_cluster
            end_idx = start_idx + items_per_cluster if i < n_clusters - 1 else len(embeddings)

            cluster_items = list(range(start_idx, end_idx))

            # 클러스터 중심 계산
            if cluster_items:
                cluster_embeddings = embeddings[cluster_items]
                centroid = np.mean(cluster_embeddings, axis=0).tolist()
            else:
                centroid = embeddings[0].tolist()

            clusters.append(ClusterResult(
                cluster_id=i,
                items=cluster_items,
                centroid=centroid,
                size=len(cluster_items)
            ))

        # Mock 실루엣 점수
        silhouette_score = 0.65 + np.random.random() * 0.2

        return ClusteringResult(
            clusters=clusters,
            n_clusters=n_clusters,
            method=input_data.method,
            silhouette_score=silhouette_score
        ).dict()

    async def _reduce_dimensions(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """차원 축소"""
        input_data = DimensionReductionInput(**payload)

        embeddings = np.array(input_data.embeddings)
        original_dim = embeddings.shape[1]

        # Mock 차원 축소 (실제로는 sklearn/umap 사용)
        reduced_embeddings = []

        for embedding in embeddings:
            if input_data.method == DimensionReduction.PCA:
                # PCA 시뮬레이션
                reduced = np.random.randn(input_data.target_dim)
                # 원본과 약간의 상관관계 유지
                reduced += embedding[:input_data.target_dim] * 0.3
            elif input_data.method == DimensionReduction.TSNE:
                # t-SNE 시뮬레이션
                reduced = np.random.randn(input_data.target_dim) * 10
            elif input_data.method == DimensionReduction.UMAP:
                # UMAP 시뮬레이션
                reduced = np.random.randn(input_data.target_dim) * 5
            else:
                # Autoencoder 시뮬레이션
                reduced = np.random.randn(input_data.target_dim)

            reduced_embeddings.append(reduced.tolist())

        # Mock 설명된 분산 (PCA의 경우)
        explained_variance = None
        if input_data.method == DimensionReduction.PCA:
            explained_variance = 0.85 + np.random.random() * 0.1

        return ReductionResult(
            reduced_embeddings=reduced_embeddings,
            original_dim=original_dim,
            target_dim=input_data.target_dim,
            explained_variance=explained_variance
        ).dict()

    # ==================== Helper Methods ====================

    def _get_cache_key(self, content: str, model: str) -> str:
        """캐시 키 생성"""
        return hashlib.md5(f"{content}:{model}".encode()).hexdigest()

    def _update_cache(self, key: str, value: Dict[str, Any]):
        """캐시 업데이트"""
        if len(self.embedding_cache) >= self.cache_size:
            # LRU 방식으로 가장 오래된 항목 제거
            oldest_key = next(iter(self.embedding_cache))
            del self.embedding_cache[oldest_key]

        self.embedding_cache[key] = value

    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """코사인 유사도 계산"""
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return dot_product / (norm1 * norm2)

    def _detect_language(self, text: str) -> str:
        """텍스트 언어 감지 (간단한 휴리스틱)"""
        # 한글 포함 여부 확인
        if any('\uac00' <= char <= '\ud7af' for char in text):
            return "ko"
        # 일본어 확인
        elif any('\u3040' <= char <= '\u309f' or '\u30a0' <= char <= '\u30ff' for char in text):
            return "ja"
        # 중국어 확인
        elif any('\u4e00' <= char <= '\u9fff' for char in text):
            return "zh"
        else:
            return "en"

    def get_capabilities(self) -> Dict[str, Any]:
        """에이전트 능력 정보 반환"""
        return {
            "supported_tasks": [task.value for task in EmbeddingTask],
            "text_models": [
                EmbeddingModel.OPENAI_ADA,
                EmbeddingModel.OPENAI_SMALL,
                EmbeddingModel.OPENAI_LARGE,
                EmbeddingModel.SENTENCE_BERT,
                EmbeddingModel.KOREAN_BERT,
            ],
            "image_models": [
                EmbeddingModel.CLIP_VIT_B32,
                EmbeddingModel.CLIP_VIT_L14,
                EmbeddingModel.RESNET50,
            ],
            "multimodal_models": [
                EmbeddingModel.CLIP_MULTIMODAL,
                EmbeddingModel.ALIGN_MODEL,
            ],
            "similarity_metrics": [metric.value for metric in SimilarityMetric],
            "dimension_reduction": [method.value for method in DimensionReduction],
            "model_dimensions": {k.value: v for k, v in self.model_dimensions.items()},
            "features": {
                "batch_processing": True,
                "parallel_execution": True,
                "caching": True,
                "clustering": True,
                "dimension_reduction": True,
                "multilingual": True,
            }
        }

# ==================== Factory Function ====================

def create_embedder_agent(llm_service: Optional[LLMService] = None) -> EmbedderAgent:
    """EmbedderAgent 인스턴스 생성"""
    return EmbedderAgent(llm_service=llm_service)

# ==================== Example Usage ====================

if __name__ == "__main__":
    async def test_embedder_agent():
        # 에이전트 생성
        agent = create_embedder_agent()

        # 1. 텍스트 임베딩
        text_request = AgentRequest(
            task="embed_text",
            payload={
                "text": "스파클리오는 AI 기반 마케팅 자동화 플랫폼입니다",
                "model": "openai_small",
                "normalize": True
            }
        )

        result = await agent.execute(text_request)
        print(f"텍스트 임베딩 결과: {result.status}")
        if result.status == "success":
            print(f"  - 모델: {result.result['model']}")
            print(f"  - 차원: {result.result['dimensions']}")

        # 2. 배치 임베딩
        batch_request = AgentRequest(
            task="embed_batch",
            payload={
                "items": [
                    {"text": "AI 마케팅", "model": "openai_small"},
                    {"text": "자동화 플랫폼", "model": "openai_small"},
                    {"text": "콘텐츠 생성", "model": "openai_small"},
                ],
                "batch_size": 2,
                "parallel": True
            }
        )

        result = await agent.execute(batch_request)
        print(f"\n배치 임베딩 결과: {result.status}")
        if result.status == "success":
            print(f"  - 처리된 항목: {result.result['processed']}/{result.result['total']}")
            print(f"  - 처리 시간: {result.result['processing_time']:.2f}초")

        # 3. 유사도 검색
        # 먼저 임베딩 생성
        embeddings = []
        texts = [
            "AI 마케팅 자동화",
            "디지털 광고 플랫폼",
            "콘텐츠 생성 도구",
            "데이터 분석 시스템",
            "소셜 미디어 관리"
        ]

        for text in texts:
            req = AgentRequest(
                task="embed_text",
                payload={"text": text, "model": "openai_small"}
            )
            res = await agent.execute(req)
            if res.status == "success":
                embeddings.append(res.result["embedding"])

        # 유사도 검색
        search_request = AgentRequest(
            task="search_similar",
            payload={
                "query_embedding": embeddings[0],  # "AI 마케팅 자동화"로 검색
                "embeddings": embeddings[1:],
                "metadata": [{"text": text} for text in texts[1:]],
                "top_k": 3,
                "metric": "cosine"
            }
        )

        result = await agent.execute(search_request)
        print(f"\n유사도 검색 결과: {result.status}")
        if result.status == "success":
            print(f"  - 검색 시간: {result.result['query_time']:.2f}ms")
            for item in result.result['results']:
                print(f"  - 인덱스 {item['index']}: 점수 {item['score']:.3f}")

        # 4. 클러스터링
        cluster_request = AgentRequest(
            task="cluster_embeddings",
            payload={
                "embeddings": embeddings,
                "n_clusters": 2,
                "method": "kmeans"
            }
        )

        result = await agent.execute(cluster_request)
        print(f"\n클러스터링 결과: {result.status}")
        if result.status == "success":
            print(f"  - 클러스터 개수: {result.result['n_clusters']}")
            print(f"  - 실루엣 점수: {result.result['silhouette_score']:.3f}")
            for cluster in result.result['clusters']:
                print(f"  - 클러스터 {cluster['cluster_id']}: {cluster['size']}개 항목")

        # 5. 차원 축소
        reduction_request = AgentRequest(
            task="reduce_dimensions",
            payload={
                "embeddings": embeddings,
                "target_dim": 2,
                "method": "pca"
            }
        )

        result = await agent.execute(reduction_request)
        print(f"\n차원 축소 결과: {result.status}")
        if result.status == "success":
            print(f"  - 원본 차원: {result.result['original_dim']}")
            print(f"  - 목표 차원: {result.result['target_dim']}")
            if result.result.get('explained_variance'):
                print(f"  - 설명된 분산: {result.result['explained_variance']:.1%}")

    # 테스트 실행
    asyncio.run(test_embedder_agent())