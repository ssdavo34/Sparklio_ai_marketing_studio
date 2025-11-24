"""add_brand_os_schema_brand_dna_and_documents

Revision ID: c06bb9428f75
Revises: ceff52a1a5d9
Create Date: 2025-11-24 09:25:37.157750

MVP P0-1 Brand OS Module:
- Add brand_dna column to brands table (BrandAnalyzerAgent output)
- Create brand_documents table (PDF, image, text, URL document storage)
- Create document_type enum

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID, TIMESTAMP


# revision identifiers, used by Alembic.
revision: str = 'c06bb9428f75'
down_revision: Union[str, None] = 'ceff52a1a5d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create document_type enum
    document_type_enum = sa.Enum(
        'pdf', 'image', 'text', 'url', 'brochure',
        name='documenttype',
        create_type=True
    )
    document_type_enum.create(op.get_bind(), checkfirst=True)

    # Add brand_dna column to brands table
    op.add_column(
        'brands',
        sa.Column('brand_dna', JSONB, nullable=True, comment='BrandAnalyzerAgent output')
    )

    # Create brand_documents table
    op.create_table(
        'brand_documents',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('brand_id', UUID(as_uuid=True), sa.ForeignKey('brands.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=True),
        sa.Column('document_type', document_type_enum, nullable=False),
        sa.Column('file_url', sa.Text, nullable=True, comment='S3/local file path'),
        sa.Column('source_url', sa.Text, nullable=True, comment='Crawled URL'),
        sa.Column('extracted_text', sa.Text, nullable=True, comment='Extracted text for analysis'),
        sa.Column('file_size', sa.Integer, nullable=True),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('processed', sa.String(20), server_default='pending', nullable=False),
        sa.Column('document_metadata', JSONB, nullable=True, comment='Additional metadata (page_count, etc.)'),
        sa.Column('created_at', TIMESTAMP, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', TIMESTAMP, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)
    )

    # Create index on brand_id for faster lookups
    op.create_index('ix_brand_documents_brand_id', 'brand_documents', ['brand_id'])


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_brand_documents_brand_id', 'brand_documents')

    # Drop brand_documents table
    op.drop_table('brand_documents')

    # Drop brand_dna column
    op.drop_column('brands', 'brand_dna')

    # Drop enum type
    document_type_enum = sa.Enum(name='documenttype')
    document_type_enum.drop(op.get_bind(), checkfirst=True)
