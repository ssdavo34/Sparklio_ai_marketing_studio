"""add_transcript_layer_standardization

Revision ID: 26f6a23a7395
Revises: f008efc6ac1b
Create Date: 2025-11-24 11:25:05.667087

Meeting AI Transcript Layer 표준화:
- source_type enum (caption, whisper, merged)
- provider enum (upload, youtube, zoom, gmeet, teams, manual)
- is_primary boolean (MeetingAgent가 사용할 primary transcript 지정)
- quality_score float (자동 계산 품질 점수)

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '26f6a23a7395'
down_revision: Union[str, None] = 'f008efc6ac1b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create transcript_source_type enum
    source_type_enum = sa.Enum(
        'caption', 'whisper', 'merged',
        name='transcriptsourcetype',
        create_type=True
    )
    source_type_enum.create(op.get_bind(), checkfirst=True)

    # Create transcript_provider enum
    provider_enum = sa.Enum(
        'upload', 'youtube', 'zoom', 'gmeet', 'teams', 'manual',
        name='transcriptprovider',
        create_type=True
    )
    provider_enum.create(op.get_bind(), checkfirst=True)

    # Add new columns to meeting_transcripts
    op.add_column('meeting_transcripts',
        sa.Column('source_type', source_type_enum, nullable=False, server_default='whisper')
    )
    op.add_column('meeting_transcripts',
        sa.Column('provider', provider_enum, nullable=False, server_default='upload')
    )
    op.add_column('meeting_transcripts',
        sa.Column('is_primary', sa.Boolean, nullable=False, server_default='false')
    )
    op.add_column('meeting_transcripts',
        sa.Column('quality_score', sa.Float, nullable=True)
    )

    # Create index on is_primary for faster primary transcript lookups
    op.create_index('ix_meeting_transcripts_is_primary', 'meeting_transcripts', ['meeting_id', 'is_primary'])


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_meeting_transcripts_is_primary', 'meeting_transcripts')

    # Drop columns
    op.drop_column('meeting_transcripts', 'quality_score')
    op.drop_column('meeting_transcripts', 'is_primary')
    op.drop_column('meeting_transcripts', 'provider')
    op.drop_column('meeting_transcripts', 'source_type')

    # Drop enums
    provider_enum = sa.Enum(name='transcriptprovider')
    provider_enum.drop(op.get_bind(), checkfirst=True)

    source_type_enum = sa.Enum(name='transcriptsourcetype')
    source_type_enum.drop(op.get_bind(), checkfirst=True)
