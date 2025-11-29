"""Add 3-type URL columns to generated_assets

Revision ID: 2025_11_30_asset_urls
Revises: 2025_11_28_vector
Create Date: 2025-11-30

저장 시스템 개선: generated_assets 테이블에 original_url, preview_url, thumb_url 추가
- original_url: 원본 이미지 MinIO 경로
- preview_url: 리사이즈된 프리뷰 이미지 (1080px)
- thumb_url: 썸네일 이미지 (200px)

참조: docs/STORAGE_SYSTEM_GAP_ANALYSIS_2025-11-30.md
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '2025_11_30_asset_urls'
down_revision = '2025_11_28_vector'  # 이전 마이그레이션
branch_labels = None
depends_on = None


def upgrade() -> None:
    # generated_assets 테이블에 3종 URL 컬럼 추가
    op.add_column(
        'generated_assets',
        sa.Column('original_url', sa.Text, nullable=True)
    )
    op.add_column(
        'generated_assets',
        sa.Column('preview_url', sa.Text, nullable=True)
    )
    op.add_column(
        'generated_assets',
        sa.Column('thumb_url', sa.Text, nullable=True)
    )

    # 기존 데이터에 대해 original_url을 minio_path 기반으로 채움
    # minio_path 형식: "bucket/object/path" → original_url로 복사
    op.execute("""
        UPDATE generated_assets
        SET original_url = minio_path
        WHERE original_url IS NULL AND minio_path IS NOT NULL
    """)


def downgrade() -> None:
    op.drop_column('generated_assets', 'thumb_url')
    op.drop_column('generated_assets', 'preview_url')
    op.drop_column('generated_assets', 'original_url')
