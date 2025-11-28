"""
Vector DB Service - pgvector 기반 벡터 검색 서비스

브랜드 학습 데이터, 컨셉, 문서 청크의 임베딩을 저장하고 유사도 검색을 수행합니다.

작성일: 2025-11-28
작성자: B팀 (Backend)
참조: B_TEAM_REQUEST_2025-11-28.md (P3 - IngestorAgent Vector DB)

주요 기능:
1. 임베딩 저장 (Brand, Concept, Document)
2. 유사도 검색 (Cosine Similarity)
3. RAG용 문서 청킹 및 검색
"""

import hashlib
import logging
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.embedding import BrandEmbedding, ConceptEmbedding, DocumentChunk

logger = logging.getLogger(__name__)


class VectorDBService:
    """
    pgvector 기반 Vector DB 서비스

    PostgreSQL의 pgvector 확장을 활용하여 벡터 유사도 검색을 수행합니다.
    """

    def __init__(self, db: Session):
        self.db = db

    # =========================================================================
    # Brand Embedding
    # =========================================================================

    async def store_brand_embedding(
        self,
        brand_id: UUID,
        content_text: str,
        embedding: List[float],
        content_type: str = "document",
        source: Optional[str] = None,
        title: Optional[str] = None,
        chunk_index: int = 0,
        metadata: Optional[Dict[str, Any]] = None
    ) -> BrandEmbedding:
        """
        브랜드 학습 데이터 임베딩 저장

        Args:
            brand_id: 브랜드 ID
            content_text: 원본 텍스트
            embedding: 임베딩 벡터 (1536차원)
            content_type: 콘텐츠 타입 ('guideline', 'campaign', 'product', 'social', 'document')
            source: 출처 (URL, 파일명 등)
            title: 제목
            chunk_index: 청크 인덱스
            metadata: 추가 메타데이터

        Returns:
            저장된 BrandEmbedding 객체
        """
        # 콘텐츠 해시 생성 (중복 방지)
        content_hash = hashlib.sha256(content_text.encode()).hexdigest()

        # 기존 임베딩 확인
        existing = self.db.query(BrandEmbedding).filter(
            BrandEmbedding.content_hash == content_hash
        ).first()

        if existing:
            logger.info(f"[VectorDB] Embedding already exists for content hash: {content_hash[:16]}...")
            # 임베딩 업데이트
            existing.embedding = embedding
            existing.updated_at = datetime.utcnow()
            self.db.commit()
            return existing

        # 토큰 수 추정 (대략 4자 = 1토큰)
        token_count = len(content_text) // 4

        # 새 임베딩 저장
        brand_embedding = BrandEmbedding(
            brand_id=brand_id,
            content_type=content_type,
            content_text=content_text,
            content_hash=content_hash,
            embedding=embedding,
            source=source,
            title=title,
            chunk_index=chunk_index,
            token_count=token_count,
            metadata=metadata or {}
        )

        self.db.add(brand_embedding)
        self.db.commit()
        self.db.refresh(brand_embedding)

        logger.info(f"[VectorDB] Stored brand embedding: {brand_embedding.id} for brand {brand_id}")
        return brand_embedding

    async def search_brand_embeddings(
        self,
        brand_id: UUID,
        query_embedding: List[float],
        top_k: int = 5,
        content_type: Optional[str] = None,
        threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        브랜드 임베딩 유사도 검색

        Args:
            brand_id: 브랜드 ID
            query_embedding: 쿼리 임베딩 벡터
            top_k: 상위 k개 결과
            content_type: 콘텐츠 타입 필터 (선택)
            threshold: 유사도 임계값 (0-1)

        Returns:
            유사 콘텐츠 목록 [{"id", "content_text", "similarity", "metadata"}, ...]
        """
        # pgvector 코사인 유사도 검색 쿼리
        # 1 - (embedding <=> query) 를 사용하여 유사도 계산
        embedding_str = f"[{','.join(map(str, query_embedding))}]"

        if content_type:
            query = text("""
                SELECT id, content_text, title, source, content_type, metadata,
                       1 - (embedding <=> :query_embedding::vector) as similarity
                FROM brand_embeddings
                WHERE brand_id = :brand_id
                  AND content_type = :content_type
                  AND 1 - (embedding <=> :query_embedding::vector) >= :threshold
                ORDER BY embedding <=> :query_embedding::vector
                LIMIT :top_k
            """)
            result = self.db.execute(query, {
                "brand_id": str(brand_id),
                "query_embedding": embedding_str,
                "content_type": content_type,
                "threshold": threshold,
                "top_k": top_k
            })
        else:
            query = text("""
                SELECT id, content_text, title, source, content_type, metadata,
                       1 - (embedding <=> :query_embedding::vector) as similarity
                FROM brand_embeddings
                WHERE brand_id = :brand_id
                  AND 1 - (embedding <=> :query_embedding::vector) >= :threshold
                ORDER BY embedding <=> :query_embedding::vector
                LIMIT :top_k
            """)
            result = self.db.execute(query, {
                "brand_id": str(brand_id),
                "query_embedding": embedding_str,
                "threshold": threshold,
                "top_k": top_k
            })

        results = []
        for row in result:
            results.append({
                "id": str(row.id),
                "content_text": row.content_text,
                "title": row.title,
                "source": row.source,
                "content_type": row.content_type,
                "similarity": float(row.similarity),
                "metadata": row.metadata
            })

        logger.info(f"[VectorDB] Found {len(results)} similar embeddings for brand {brand_id}")
        return results

    # =========================================================================
    # Concept Embedding
    # =========================================================================

    async def store_concept_embedding(
        self,
        concept_id: str,
        concept_name: str,
        embedding: List[float],
        brand_id: Optional[UUID] = None,
        audience_insight: Optional[str] = None,
        core_promise: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> ConceptEmbedding:
        """
        컨셉 임베딩 저장

        Args:
            concept_id: 컨셉 ID (CONCEPT_xxxxxxxx)
            concept_name: 컨셉 이름
            embedding: 임베딩 벡터
            brand_id: 브랜드 ID (선택)
            audience_insight: 고객 인사이트
            core_promise: 핵심 약속
            metadata: 추가 메타데이터

        Returns:
            저장된 ConceptEmbedding 객체
        """
        # 기존 컨셉 확인
        existing = self.db.query(ConceptEmbedding).filter(
            ConceptEmbedding.concept_id == concept_id
        ).first()

        if existing:
            # 업데이트
            existing.concept_name = concept_name
            existing.embedding = embedding
            existing.audience_insight = audience_insight
            existing.core_promise = core_promise
            existing.metadata = metadata or {}
            self.db.commit()
            return existing

        # 새 컨셉 저장
        concept_embedding = ConceptEmbedding(
            concept_id=concept_id,
            brand_id=brand_id,
            concept_name=concept_name,
            audience_insight=audience_insight,
            core_promise=core_promise,
            embedding=embedding,
            metadata=metadata or {}
        )

        self.db.add(concept_embedding)
        self.db.commit()
        self.db.refresh(concept_embedding)

        logger.info(f"[VectorDB] Stored concept embedding: {concept_id}")
        return concept_embedding

    async def search_similar_concepts(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        brand_id: Optional[UUID] = None,
        threshold: float = 0.6
    ) -> List[Dict[str, Any]]:
        """
        유사 컨셉 검색

        Args:
            query_embedding: 쿼리 임베딩 벡터
            top_k: 상위 k개 결과
            brand_id: 브랜드 ID 필터 (선택)
            threshold: 유사도 임계값

        Returns:
            유사 컨셉 목록
        """
        embedding_str = f"[{','.join(map(str, query_embedding))}]"

        if brand_id:
            query = text("""
                SELECT concept_id, concept_name, audience_insight, core_promise, metadata,
                       1 - (embedding <=> :query_embedding::vector) as similarity
                FROM concept_embeddings
                WHERE brand_id = :brand_id
                  AND 1 - (embedding <=> :query_embedding::vector) >= :threshold
                ORDER BY embedding <=> :query_embedding::vector
                LIMIT :top_k
            """)
            result = self.db.execute(query, {
                "brand_id": str(brand_id),
                "query_embedding": embedding_str,
                "threshold": threshold,
                "top_k": top_k
            })
        else:
            query = text("""
                SELECT concept_id, concept_name, audience_insight, core_promise, metadata,
                       1 - (embedding <=> :query_embedding::vector) as similarity
                FROM concept_embeddings
                WHERE 1 - (embedding <=> :query_embedding::vector) >= :threshold
                ORDER BY embedding <=> :query_embedding::vector
                LIMIT :top_k
            """)
            result = self.db.execute(query, {
                "query_embedding": embedding_str,
                "threshold": threshold,
                "top_k": top_k
            })

        results = []
        for row in result:
            results.append({
                "concept_id": row.concept_id,
                "concept_name": row.concept_name,
                "audience_insight": row.audience_insight,
                "core_promise": row.core_promise,
                "similarity": float(row.similarity),
                "metadata": row.metadata
            })

        return results

    # =========================================================================
    # Document Chunking & RAG
    # =========================================================================

    async def store_document_chunks(
        self,
        document_id: UUID,
        chunks: List[Tuple[str, List[float], int]],  # (text, embedding, index)
        brand_id: Optional[UUID] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        문서 청크 임베딩 일괄 저장

        Args:
            document_id: 문서 ID
            chunks: 청크 목록 [(텍스트, 임베딩, 인덱스), ...]
            brand_id: 브랜드 ID (선택)
            metadata: 추가 메타데이터

        Returns:
            저장된 청크 수
        """
        # 기존 청크 삭제
        self.db.query(DocumentChunk).filter(
            DocumentChunk.document_id == document_id
        ).delete()

        stored_count = 0
        for chunk_text, embedding, chunk_index in chunks:
            chunk_hash = hashlib.sha256(chunk_text.encode()).hexdigest()
            token_count = len(chunk_text) // 4

            chunk = DocumentChunk(
                document_id=document_id,
                brand_id=brand_id,
                chunk_text=chunk_text,
                chunk_index=chunk_index,
                chunk_hash=chunk_hash,
                embedding=embedding,
                token_count=token_count,
                metadata=metadata or {}
            )
            self.db.add(chunk)
            stored_count += 1

        self.db.commit()
        logger.info(f"[VectorDB] Stored {stored_count} chunks for document {document_id}")
        return stored_count

    async def search_document_chunks(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        document_id: Optional[UUID] = None,
        brand_id: Optional[UUID] = None,
        threshold: float = 0.6
    ) -> List[Dict[str, Any]]:
        """
        문서 청크 유사도 검색 (RAG용)

        Args:
            query_embedding: 쿼리 임베딩 벡터
            top_k: 상위 k개 결과
            document_id: 문서 ID 필터 (선택)
            brand_id: 브랜드 ID 필터 (선택)
            threshold: 유사도 임계값

        Returns:
            유사 청크 목록
        """
        embedding_str = f"[{','.join(map(str, query_embedding))}]"

        # 동적 필터 조건 생성
        conditions = ["1 - (embedding <=> :query_embedding::vector) >= :threshold"]
        params = {
            "query_embedding": embedding_str,
            "threshold": threshold,
            "top_k": top_k
        }

        if document_id:
            conditions.append("document_id = :document_id")
            params["document_id"] = str(document_id)

        if brand_id:
            conditions.append("brand_id = :brand_id")
            params["brand_id"] = str(brand_id)

        where_clause = " AND ".join(conditions)

        query = text(f"""
            SELECT id, document_id, chunk_text, chunk_index, metadata,
                   1 - (embedding <=> :query_embedding::vector) as similarity
            FROM document_chunks
            WHERE {where_clause}
            ORDER BY embedding <=> :query_embedding::vector
            LIMIT :top_k
        """)

        result = self.db.execute(query, params)

        results = []
        for row in result:
            results.append({
                "id": str(row.id),
                "document_id": str(row.document_id),
                "chunk_text": row.chunk_text,
                "chunk_index": row.chunk_index,
                "similarity": float(row.similarity),
                "metadata": row.metadata
            })

        return results

    # =========================================================================
    # 통계 및 관리
    # =========================================================================

    def get_stats(self, brand_id: Optional[UUID] = None) -> Dict[str, Any]:
        """
        Vector DB 통계 조회

        Args:
            brand_id: 브랜드 ID (선택, 없으면 전체)

        Returns:
            통계 정보
        """
        if brand_id:
            brand_count = self.db.query(BrandEmbedding).filter(
                BrandEmbedding.brand_id == brand_id
            ).count()
            concept_count = self.db.query(ConceptEmbedding).filter(
                ConceptEmbedding.brand_id == brand_id
            ).count()
            chunk_count = self.db.query(DocumentChunk).filter(
                DocumentChunk.brand_id == brand_id
            ).count()
        else:
            brand_count = self.db.query(BrandEmbedding).count()
            concept_count = self.db.query(ConceptEmbedding).count()
            chunk_count = self.db.query(DocumentChunk).count()

        return {
            "brand_embeddings": brand_count,
            "concept_embeddings": concept_count,
            "document_chunks": chunk_count,
            "total": brand_count + concept_count + chunk_count
        }

    def delete_brand_embeddings(self, brand_id: UUID) -> int:
        """
        브랜드 임베딩 삭제

        Args:
            brand_id: 브랜드 ID

        Returns:
            삭제된 레코드 수
        """
        deleted = self.db.query(BrandEmbedding).filter(
            BrandEmbedding.brand_id == brand_id
        ).delete()
        self.db.commit()
        logger.info(f"[VectorDB] Deleted {deleted} embeddings for brand {brand_id}")
        return deleted


# =========================================================================
# Factory Function
# =========================================================================

def get_vector_db_service(db: Session) -> VectorDBService:
    """VectorDBService 인스턴스 반환"""
    return VectorDBService(db)
