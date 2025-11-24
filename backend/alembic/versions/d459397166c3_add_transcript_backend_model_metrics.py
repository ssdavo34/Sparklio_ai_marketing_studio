"""add_transcript_backend_model_metrics

Revision ID: d459397166c3
Revises: 26f6a23a7395
Create Date: 2025-11-24 11:45:00.000000

Meeting AI Transcript 추적성 향상:
- backend enum (openai, whisper_cpp, faster_whisper, manual, unknown)
- model varchar(100) (whisper-1, large-v3, medium 등)
- confidence float (Whisper confidence 점수)
- latency_ms integer (STT 처리 시간)

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd459397166c3'
down_revision: Union[str, None] = '26f6a23a7395'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create transcript_backend enum
    backend_enum = sa.Enum(
        'openai', 'whisper_cpp', 'faster_whisper', 'manual', 'unknown',
        name='transcriptbackend',
        create_type=True
    )
    backend_enum.create(op.get_bind(), checkfirst=True)

    # Add new columns to meeting_transcripts
    op.add_column('meeting_transcripts',
        sa.Column('backend', backend_enum, nullable=False, server_default='unknown')
    )
    op.add_column('meeting_transcripts',
        sa.Column('model', sa.String(100), nullable=True)
    )
    op.add_column('meeting_transcripts',
        sa.Column('confidence', sa.Float, nullable=True)
    )
    op.add_column('meeting_transcripts',
        sa.Column('latency_ms', sa.Integer, nullable=True)
    )


def downgrade() -> None:
    # Drop columns
    op.drop_column('meeting_transcripts', 'latency_ms')
    op.drop_column('meeting_transcripts', 'confidence')
    op.drop_column('meeting_transcripts', 'model')
    op.drop_column('meeting_transcripts', 'backend')

    # Drop enum
    backend_enum = sa.Enum(name='transcriptbackend')
    backend_enum.drop(op.get_bind(), checkfirst=True)
