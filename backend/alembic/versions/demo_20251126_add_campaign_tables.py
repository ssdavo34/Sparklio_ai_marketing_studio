"""Add campaign, concept, concept_asset tables for Demo Day

Revision ID: demo_20251126
Revises: a1b2c3d4e5f6
Create Date: 2025-11-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision: str = 'demo_20251126'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Campaign 상태 Enum
    campaign_status_enum = sa.Enum(
        'pending', 'processing', 'concept_ready', 'asset_generating', 'completed', 'failed',
        name='campaignstatus'
    )
    campaign_status_enum.create(op.get_bind(), checkfirst=True)

    # Asset 유형 Enum
    asset_type_enum = sa.Enum(
        'presentation', 'product_detail', 'instagram_ads', 'shorts_script',
        name='assettype'
    )
    asset_type_enum.create(op.get_bind(), checkfirst=True)

    # Asset 상태 Enum
    asset_status_enum = sa.Enum(
        'pending', 'generating', 'completed', 'failed',
        name='assetstatus'
    )
    asset_status_enum.create(op.get_bind(), checkfirst=True)

    # campaigns 테이블
    op.create_table(
        'campaigns',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('meeting_id', UUID(as_uuid=True), sa.ForeignKey('meetings.id'), nullable=False),
        sa.Column('owner_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('brand_id', UUID(as_uuid=True), sa.ForeignKey('brands.id'), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('status', campaign_status_enum, default='pending', nullable=False),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('meeting_summary', JSONB, nullable=True),
        sa.Column('campaign_brief', JSONB, nullable=True),
        sa.Column('task_id', sa.String(100), nullable=True, unique=True, index=True),
        sa.Column('meta_info', JSONB, nullable=True),
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('deleted_at', sa.TIMESTAMP, nullable=True),
    )

    # concepts 테이블
    op.create_table(
        'concepts',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('campaign_id', UUID(as_uuid=True), sa.ForeignKey('campaigns.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('target_audience', sa.Text, nullable=True),
        sa.Column('key_message', sa.String(500), nullable=True),
        sa.Column('tone_and_manner', sa.String(200), nullable=True),
        sa.Column('visual_style', sa.String(200), nullable=True),
        sa.Column('thumbnail_url', sa.Text, nullable=True),
        sa.Column('order', sa.Integer, default=0, nullable=False),
        sa.Column('is_selected', sa.Boolean, default=False, nullable=False),
        sa.Column('meta_info', JSONB, nullable=True),
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # concept_assets 테이블
    op.create_table(
        'concept_assets',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('concept_id', UUID(as_uuid=True), sa.ForeignKey('concepts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('asset_type', asset_type_enum, nullable=False),
        sa.Column('status', asset_status_enum, default='pending', nullable=False),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('title', sa.String(255), nullable=True),
        sa.Column('content', JSONB, nullable=True),
        sa.Column('style', JSONB, nullable=True),
        sa.Column('preview_url', sa.Text, nullable=True),
        sa.Column('download_url', sa.Text, nullable=True),
        sa.Column('extra_info', JSONB, nullable=True),
        sa.Column('meta_info', JSONB, nullable=True),
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # 인덱스 추가
    op.create_index('ix_campaigns_meeting_id', 'campaigns', ['meeting_id'])
    op.create_index('ix_campaigns_owner_id', 'campaigns', ['owner_id'])
    op.create_index('ix_concepts_campaign_id', 'concepts', ['campaign_id'])
    op.create_index('ix_concept_assets_concept_id', 'concept_assets', ['concept_id'])
    op.create_index('ix_concept_assets_asset_type', 'concept_assets', ['asset_type'])


def downgrade() -> None:
    # 인덱스 삭제
    op.drop_index('ix_concept_assets_asset_type', table_name='concept_assets')
    op.drop_index('ix_concept_assets_concept_id', table_name='concept_assets')
    op.drop_index('ix_concepts_campaign_id', table_name='concepts')
    op.drop_index('ix_campaigns_owner_id', table_name='campaigns')
    op.drop_index('ix_campaigns_meeting_id', table_name='campaigns')

    # 테이블 삭제
    op.drop_table('concept_assets')
    op.drop_table('concepts')
    op.drop_table('campaigns')

    # Enum 삭제
    sa.Enum(name='assetstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='assettype').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='campaignstatus').drop(op.get_bind(), checkfirst=True)
