"""
Brand Embedding Model - pgvector를 활용한 Vector DB

브랜드 학습 데이터의 임베딩을 저장하고 유사도 검색을 지원합니다.

작성일: 2025-11-28
작성자: B팀 (Backend)
참조: B_TEAM_REQUEST_2025-11-28.md (P3 - IngestorAgent Vector DB)
"""

from sqlalchemy import Column, String, Text, Integer, Float, TIMESTAMP, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from app.core.database import Base
import uuid


class BrandEmbedding(Base):
    """
    브랜드 학습 데이터 임베딩 테이블

    Brand별 학습된 콘텐츠를 벡터로 저장하여 RAG에서 유사도 검색 지원
    """
    __tablename__ = "brand_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id"), nullable=False, index=True)

    # 콘텐츠 정보
    content_type = Column(String(50), nullable=False)  # 'guideline', 'campaign', 'product', 'social', 'document'
    content_text = Column(Text, nullable=False)  # 원본 텍스트
    content_hash = Column(String(64), nullable=False, unique=True)  # SHA256 해시 (중복 방지)

    # 임베딩 벡터 (OpenAI text-embedding-3-small: 1536차원)
    embedding = Column(Vector(1536), nullable=False)

    # 메타데이터
    source = Column(String(100), nullable=True)  # 출처 (URL, 파일명 등)
    title = Column(String(500), nullable=True)  # 제목
    chunk_index = Column(Integer, default=0)  # 청크 인덱스 (긴 문서 분할 시)
    token_count = Column(Integer, nullable=True)  # 토큰 수

    # 추가 메타데이터
    metadata = Column(JSONB, default={})

    # 타임스탬프
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # 인덱스 (pgvector IVFFlat 또는 HNSW)
    __table_args__ = (
        Index(
            'ix_brand_embeddings_embedding_ivfflat',
            embedding,
            postgresql_using='ivfflat',
            postgresql_with={'lists': 100},
            postgresql_ops={'embedding': 'vector_cosine_ops'}
        ),
    )


class ConceptEmbedding(Base):
    """
    컨셉 임베딩 테이블

    생성된 ConceptV1의 임베딩을 저장하여 유사 컨셉 검색 지원
    """
    __tablename__ = "concept_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    concept_id = Column(String(50), nullable=False, unique=True, index=True)  # CONCEPT_xxxxxxxx
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id"), nullable=True, index=True)

    # 컨셉 핵심 정보
    concept_name = Column(String(100), nullable=False)
    audience_insight = Column(Text, nullable=True)
    core_promise = Column(Text, nullable=True)

    # 임베딩 벡터 (컨셉 전체 텍스트 기반)
    embedding = Column(Vector(1536), nullable=False)

    # 메타데이터
    metadata = Column(JSONB, default={})

    # 타임스탬프
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        Index(
            'ix_concept_embeddings_embedding_ivfflat',
            embedding,
            postgresql_using='ivfflat',
            postgresql_with={'lists': 50},
            postgresql_ops={'embedding': 'vector_cosine_ops'}
        ),
    )


class DocumentChunk(Base):
    """
    문서 청크 임베딩 테이블

    긴 문서를 청크로 분할하여 저장 (RAG용)
    """
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False, index=True)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id"), nullable=True, index=True)

    # 청크 정보
    chunk_text = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    chunk_hash = Column(String(64), nullable=False)

    # 임베딩
    embedding = Column(Vector(1536), nullable=False)

    # 메타데이터
    start_char = Column(Integer, nullable=True)  # 원본 문서에서 시작 위치
    end_char = Column(Integer, nullable=True)  # 원본 문서에서 끝 위치
    token_count = Column(Integer, nullable=True)
    metadata = Column(JSONB, default={})

    # 타임스탬프
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        Index(
            'ix_document_chunks_embedding_ivfflat',
            embedding,
            postgresql_using='ivfflat',
            postgresql_with={'lists': 100},
            postgresql_ops={'embedding': 'vector_cosine_ops'}
        ),
    )
