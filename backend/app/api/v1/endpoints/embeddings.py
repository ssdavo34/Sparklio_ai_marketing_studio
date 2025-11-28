"""
Embeddings API - Vector DB 엔드포인트

브랜드 학습 데이터, 컨셉, 문서의 임베딩 저장 및 검색 API

작성일: 2025-11-28
작성자: B팀 (Backend)
"""

import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.vector_db import get_vector_db_service

logger = logging.getLogger(__name__)

router = APIRouter()


# =============================================================================
# Request/Response Schemas
# =============================================================================

class StoreEmbeddingRequest(BaseModel):
    """임베딩 저장 요청"""
    brand_id: UUID
    content_text: str = Field(..., min_length=1, max_length=50000)
    embedding: List[float] = Field(..., min_items=1536, max_items=1536)
    content_type: str = Field(default="document")
    source: Optional[str] = None
    title: Optional[str] = None
    metadata: Optional[dict] = None


class SearchEmbeddingRequest(BaseModel):
    """임베딩 검색 요청"""
    brand_id: UUID
    query_embedding: List[float] = Field(..., min_items=1536, max_items=1536)
    top_k: int = Field(default=5, ge=1, le=50)
    content_type: Optional[str] = None
    threshold: float = Field(default=0.7, ge=0.0, le=1.0)


class EmbeddingResult(BaseModel):
    """임베딩 검색 결과"""
    id: str
    content_text: str
    title: Optional[str]
    source: Optional[str]
    content_type: str
    similarity: float
    metadata: Optional[dict]


class SearchResponse(BaseModel):
    """검색 응답"""
    results: List[EmbeddingResult]
    count: int


class StatsResponse(BaseModel):
    """통계 응답"""
    brand_embeddings: int
    concept_embeddings: int
    document_chunks: int
    total: int


# =============================================================================
# API Endpoints
# =============================================================================

@router.post("/store", response_model=dict)
async def store_embedding(
    request: StoreEmbeddingRequest,
    db: Session = Depends(get_db)
):
    """
    브랜드 학습 데이터 임베딩 저장

    Args:
        request: 임베딩 저장 요청

    Returns:
        저장된 임베딩 ID
    """
    try:
        service = get_vector_db_service(db)
        result = await service.store_brand_embedding(
            brand_id=request.brand_id,
            content_text=request.content_text,
            embedding=request.embedding,
            content_type=request.content_type,
            source=request.source,
            title=request.title,
            metadata=request.metadata
        )
        return {
            "id": str(result.id),
            "status": "stored",
            "content_hash": result.content_hash[:16] + "..."
        }
    except Exception as e:
        logger.error(f"[Embeddings API] Store failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search", response_model=SearchResponse)
async def search_embeddings(
    request: SearchEmbeddingRequest,
    db: Session = Depends(get_db)
):
    """
    브랜드 임베딩 유사도 검색

    Args:
        request: 검색 요청

    Returns:
        유사 콘텐츠 목록
    """
    try:
        service = get_vector_db_service(db)
        results = await service.search_brand_embeddings(
            brand_id=request.brand_id,
            query_embedding=request.query_embedding,
            top_k=request.top_k,
            content_type=request.content_type,
            threshold=request.threshold
        )
        return SearchResponse(
            results=[EmbeddingResult(**r) for r in results],
            count=len(results)
        )
    except Exception as e:
        logger.error(f"[Embeddings API] Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    brand_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Vector DB 통계 조회

    Args:
        brand_id: 브랜드 ID (선택)

    Returns:
        통계 정보
    """
    try:
        service = get_vector_db_service(db)
        stats = service.get_stats(brand_id)
        return StatsResponse(**stats)
    except Exception as e:
        logger.error(f"[Embeddings API] Stats failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/brand/{brand_id}")
async def delete_brand_embeddings(
    brand_id: UUID,
    db: Session = Depends(get_db)
):
    """
    브랜드 임베딩 삭제

    Args:
        brand_id: 브랜드 ID

    Returns:
        삭제된 레코드 수
    """
    try:
        service = get_vector_db_service(db)
        deleted = service.delete_brand_embeddings(brand_id)
        return {"deleted": deleted, "brand_id": str(brand_id)}
    except Exception as e:
        logger.error(f"[Embeddings API] Delete failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Auto Embedding Endpoints (OpenAI 임베딩 자동 생성)
# =============================================================================

class AutoEmbedRequest(BaseModel):
    """자동 임베딩 요청 (텍스트만 제공)"""
    brand_id: UUID
    content_text: str = Field(..., min_length=1, max_length=50000)
    content_type: str = Field(default="document")
    source: Optional[str] = None
    title: Optional[str] = None
    metadata: Optional[dict] = None


class AutoSearchRequest(BaseModel):
    """자동 검색 요청 (쿼리 텍스트만 제공)"""
    brand_id: UUID
    query_text: str = Field(..., min_length=1, max_length=5000)
    top_k: int = Field(default=5, ge=1, le=50)
    content_type: Optional[str] = None
    threshold: float = Field(default=0.7, ge=0.0, le=1.0)


@router.post("/auto-embed", response_model=dict)
async def auto_embed(
    request: AutoEmbedRequest,
    db: Session = Depends(get_db)
):
    """
    텍스트 자동 임베딩 및 저장

    텍스트만 제공하면 OpenAI API로 임베딩을 생성하고 저장합니다.

    Args:
        request: 자동 임베딩 요청

    Returns:
        저장된 임베딩 정보
    """
    from app.services.agents.ingestor import create_ingestor_agent
    from app.services.agents.base import AgentRequest

    try:
        agent = create_ingestor_agent()
        response = await agent.execute(AgentRequest(
            task="auto_embed",
            payload={
                "brand_id": str(request.brand_id),
                "content_text": request.content_text,
                "content_type": request.content_type,
                "source": request.source,
                "title": request.title,
                "metadata": request.metadata
            }
        ))
        # AgentResponse의 outputs에서 결과 추출
        if response.outputs and len(response.outputs) > 0:
            return response.outputs[0].value
        return {"error": "No output from agent"}
    except Exception as e:
        logger.error(f"[Embeddings API] Auto embed failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auto-search", response_model=SearchResponse)
async def auto_search(
    request: AutoSearchRequest,
    db: Session = Depends(get_db)
):
    """
    텍스트 기반 자동 유사도 검색

    쿼리 텍스트만 제공하면 임베딩을 생성하고 유사 콘텐츠를 검색합니다.

    Args:
        request: 자동 검색 요청

    Returns:
        유사 콘텐츠 목록
    """
    from app.services.agents.ingestor import create_ingestor_agent
    from app.services.agents.base import AgentRequest

    try:
        agent = create_ingestor_agent()
        response = await agent.execute(AgentRequest(
            task="auto_search",
            payload={
                "brand_id": str(request.brand_id),
                "query_text": request.query_text,
                "top_k": request.top_k,
                "content_type": request.content_type,
                "threshold": request.threshold
            }
        ))

        # AgentResponse의 outputs에서 결과 추출
        if response.outputs and len(response.outputs) > 0:
            result = response.outputs[0].value
            if result.get("success"):
                return SearchResponse(
                    results=[EmbeddingResult(**r) for r in result.get("results", [])],
                    count=result.get("count", 0)
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail=result.get("error", "Search failed")
                )
        raise HTTPException(status_code=500, detail="No output from agent")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Embeddings API] Auto search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health():
    """Vector DB 헬스체크"""
    return {
        "status": "ok",
        "service": "embeddings-api",
        "storage": "pgvector",
        "dimensions": 1536,
        "features": ["store", "search", "auto-embed", "auto-search"]
    }
