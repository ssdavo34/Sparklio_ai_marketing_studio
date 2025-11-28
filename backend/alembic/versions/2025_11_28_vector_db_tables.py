"""Add Vector DB tables (pgvector)

Revision ID: 2025_11_28_vector
Revises:
Create Date: 2025-11-28

브랜드 학습 데이터, 컨셉, 문서 청크의 임베딩을 저장하는 테이블 생성
pgvector 확장 활성화 및 IVFFlat 인덱스 생성
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision = '2025_11_28_vector'
down_revision = None  # 실제 마이그레이션 시 이전 revision ID로 변경 필요
branch_labels = None
depends_on = None


def upgrade() -> None:
    # pgvector 확장 활성화
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')

    # brand_embeddings 테이블
    op.create_table(
        'brand_embeddings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('brand_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('content_type', sa.String(50), nullable=False),
        sa.Column('content_text', sa.Text, nullable=False),
        sa.Column('content_hash', sa.String(64), nullable=False, unique=True),
        sa.Column('embedding', Vector(1536), nullable=False),
        sa.Column('source', sa.String(100), nullable=True),
        sa.Column('title', sa.String(500), nullable=True),
        sa.Column('chunk_index', sa.Integer, default=0),
        sa.Column('token_count', sa.Integer, nullable=True),
        sa.Column('metadata', postgresql.JSONB, default={}),
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['brand_id'], ['brands.id']),
    )
    op.create_index('ix_brand_embeddings_brand_id', 'brand_embeddings', ['brand_id'])

    # concept_embeddings 테이블
    op.create_table(
        'concept_embeddings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('concept_id', sa.String(50), nullable=False, unique=True),
        sa.Column('brand_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('concept_name', sa.String(100), nullable=False),
        sa.Column('audience_insight', sa.Text, nullable=True),
        sa.Column('core_promise', sa.Text, nullable=True),
        sa.Column('embedding', Vector(1536), nullable=False),
        sa.Column('metadata', postgresql.JSONB, default={}),
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['brand_id'], ['brands.id']),
    )
    op.create_index('ix_concept_embeddings_concept_id', 'concept_embeddings', ['concept_id'])
    op.create_index('ix_concept_embeddings_brand_id', 'concept_embeddings', ['brand_id'])

    # document_chunks 테이블
    op.create_table(
        'document_chunks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('brand_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('chunk_text', sa.Text, nullable=False),
        sa.Column('chunk_index', sa.Integer, nullable=False),
        sa.Column('chunk_hash', sa.String(64), nullable=False),
        sa.Column('embedding', Vector(1536), nullable=False),
        sa.Column('start_char', sa.Integer, nullable=True),
        sa.Column('end_char', sa.Integer, nullable=True),
        sa.Column('token_count', sa.Integer, nullable=True),
        sa.Column('metadata', postgresql.JSONB, default={}),
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id']),
        sa.ForeignKeyConstraint(['brand_id'], ['brands.id']),
    )
    op.create_index('ix_document_chunks_document_id', 'document_chunks', ['document_id'])
    op.create_index('ix_document_chunks_brand_id', 'document_chunks', ['brand_id'])

    # IVFFlat 인덱스 생성 (벡터 검색 성능 최적화)
    # 참고: 데이터가 충분히 쌓인 후 lists 값 조정 권장
    op.execute('''
        CREATE INDEX ix_brand_embeddings_embedding_ivfflat
        ON brand_embeddings
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
    ''')

    op.execute('''
        CREATE INDEX ix_concept_embeddings_embedding_ivfflat
        ON concept_embeddings
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 50)
    ''')

    op.execute('''
        CREATE INDEX ix_document_chunks_embedding_ivfflat
        ON document_chunks
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
    ''')


def downgrade() -> None:
    op.drop_table('document_chunks')
    op.drop_table('concept_embeddings')
    op.drop_table('brand_embeddings')
