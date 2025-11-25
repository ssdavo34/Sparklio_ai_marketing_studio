"""add_meeting_error_message

Revision ID: a1b2c3d4e5f6
Revises: d459397166c3
Create Date: 2025-11-25 12:00:00.000000

Meeting 테이블에 error_message 컬럼 추가:
- C팀 요청 (2025-11-25)
- YouTube 다운로드 실패 시 에러 원인 Frontend 전달용

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'd459397166c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # meetings 테이블에 error_message 컬럼 추가
    op.add_column(
        'meetings',
        sa.Column('error_message', sa.Text(), nullable=True)
    )


def downgrade() -> None:
    # error_message 컬럼 삭제
    op.drop_column('meetings', 'error_message')
