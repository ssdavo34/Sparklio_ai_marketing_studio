"""Add project_outputs table

Revision ID: 2025_11_30_project_outputs
Revises: 2025_11_30_asset_urls
Create Date: 2025-11-30

프로젝트 출력물 테이블 생성
- 영상, 프레젠테이션, 상세페이지 등 최종 산출물 저장
- Video Pipeline V2 결과물 저장용

참조: docs/VIDEO_PIPELINE_DESIGN_V2.md
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY

# revision identifiers, used by Alembic.
revision = '2025_11_30_project_outputs'
down_revision = '2025_11_30_asset_urls'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # project_outputs 테이블 생성
    op.create_table(
        'project_outputs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),

        # 연결 정보
        sa.Column('brand_id', UUID(as_uuid=True), sa.ForeignKey('brands.id'), nullable=False, index=True),
        sa.Column('project_id', UUID(as_uuid=True), sa.ForeignKey('projects.id'), nullable=True, index=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),

        # 출력물 타입
        sa.Column('output_type', sa.String(50), nullable=False, index=True),

        # 기본 정보
        sa.Column('name', sa.String(255), nullable=True),
        sa.Column('description', sa.Text, nullable=True),

        # 파일 정보
        sa.Column('minio_path', sa.Text, nullable=True),
        sa.Column('file_url', sa.Text, nullable=True),
        sa.Column('thumbnail_url', sa.Text, nullable=True),
        sa.Column('preview_url', sa.Text, nullable=True),
        sa.Column('file_size', sa.BigInteger, nullable=True),
        sa.Column('mime_type', sa.String(100), nullable=True),

        # 영상 전용 필드
        sa.Column('duration_sec', sa.Float, nullable=True),
        sa.Column('resolution', sa.String(20), nullable=True),
        sa.Column('fps', sa.Float, nullable=True),

        # 생성 정보
        sa.Column('source', sa.String(50), nullable=False, server_default='system'),
        sa.Column('source_metadata', JSONB, nullable=True),

        # 상태
        sa.Column('status', sa.String(20), nullable=False, server_default='active', index=True),

        # 메타데이터
        sa.Column('output_metadata', JSONB, nullable=True),
        sa.Column('tags', ARRAY(sa.Text), nullable=True),

        # 버전 관리
        sa.Column('version', sa.String(20), nullable=False, server_default='1.0'),
        sa.Column('parent_output_id', UUID(as_uuid=True), sa.ForeignKey('project_outputs.id'), nullable=True),

        # 타임스탬프
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('completed_at', sa.TIMESTAMP, nullable=True),
        sa.Column('deleted_at', sa.TIMESTAMP, nullable=True),
    )

    # 인덱스 추가
    op.create_index(
        'ix_project_outputs_brand_type',
        'project_outputs',
        ['brand_id', 'output_type']
    )
    op.create_index(
        'ix_project_outputs_status_created',
        'project_outputs',
        ['status', 'created_at']
    )


def downgrade() -> None:
    op.drop_index('ix_project_outputs_status_created')
    op.drop_index('ix_project_outputs_brand_type')
    op.drop_table('project_outputs')
