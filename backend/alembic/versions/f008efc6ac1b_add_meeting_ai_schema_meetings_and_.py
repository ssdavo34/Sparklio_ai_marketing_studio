"""add_meeting_ai_schema_meetings_and_transcripts

Revision ID: f008efc6ac1b
Revises: c06bb9428f75
Create Date: 2025-11-24 10:36:07.936709

MVP P0-2 Meeting AI Module:
- Create meetings table (audio/video upload, analysis result storage)
- Create meeting_transcripts table (Whisper API transcripts with timestamps)
- Create meeting_status enum

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, TIMESTAMP


# revision identifiers, used by Alembic.
revision: str = 'f008efc6ac1b'
down_revision: Union[str, None] = 'c06bb9428f75'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create meeting_status enum
    meeting_status_enum = sa.Enum(
        'uploaded', 'transcribing', 'transcribed', 'analyzed', 'failed',
        name='meetingstatus',
        create_type=True
    )
    meeting_status_enum.create(op.get_bind(), checkfirst=True)

    # Create meetings table
    op.create_table(
        'meetings',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('owner_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('brand_id', UUID(as_uuid=True), sa.ForeignKey('brands.id'), nullable=True),
        sa.Column('project_id', UUID(as_uuid=True), sa.ForeignKey('projects.id'), nullable=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('meeting_date', TIMESTAMP, nullable=True),
        sa.Column('file_url', sa.Text, nullable=True, comment='S3/local audio/video file path'),
        sa.Column('file_size', sa.Integer, nullable=True),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('duration_seconds', sa.Integer, nullable=True),
        sa.Column('status', meeting_status_enum, server_default='uploaded', nullable=False),
        sa.Column('analysis_result', JSONB, nullable=True, comment='MeetingAgent analysis output'),
        sa.Column('meeting_metadata', JSONB, nullable=True),
        sa.Column('created_at', TIMESTAMP, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', TIMESTAMP, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('deleted_at', TIMESTAMP, nullable=True)
    )

    # Create indexes on meetings
    op.create_index('ix_meetings_owner_id', 'meetings', ['owner_id'])
    op.create_index('ix_meetings_brand_id', 'meetings', ['brand_id'])
    op.create_index('ix_meetings_project_id', 'meetings', ['project_id'])
    op.create_index('ix_meetings_status', 'meetings', ['status'])

    # Create meeting_transcripts table
    op.create_table(
        'meeting_transcripts',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('meeting_id', UUID(as_uuid=True), sa.ForeignKey('meetings.id', ondelete='CASCADE'), nullable=False),
        sa.Column('transcript_text', sa.Text, nullable=False),
        sa.Column('language', sa.String(10), nullable=True),
        sa.Column('segments', JSONB, nullable=True, comment='Timestamped segments'),
        sa.Column('whisper_metadata', JSONB, nullable=True),
        sa.Column('created_at', TIMESTAMP, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', TIMESTAMP, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)
    )

    # Create index on meeting_id for faster lookups
    op.create_index('ix_meeting_transcripts_meeting_id', 'meeting_transcripts', ['meeting_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_meeting_transcripts_meeting_id', 'meeting_transcripts')
    op.drop_index('ix_meetings_status', 'meetings')
    op.drop_index('ix_meetings_project_id', 'meetings')
    op.drop_index('ix_meetings_brand_id', 'meetings')
    op.drop_index('ix_meetings_owner_id', 'meetings')

    # Drop tables
    op.drop_table('meeting_transcripts')
    op.drop_table('meetings')

    # Drop enum type
    meeting_status_enum = sa.Enum(name='meetingstatus')
    meeting_status_enum.drop(op.get_bind(), checkfirst=True)
