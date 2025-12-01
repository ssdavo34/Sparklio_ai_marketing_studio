"""
Video Job Model

비디오 렌더링 작업을 추적하는 모델

작성일: 2025-12-01
작성자: B팀 (Backend)
참조: VIDEO_PIPELINE_FLOW_V2.md
"""

from sqlalchemy import Column, String, Text, TIMESTAMP, Float, Integer, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class VideoJob(Base):
    """
    비디오 렌더링 작업 모델

    4단계 확인 플로우에서 최종 렌더링 작업을 추적합니다.
    - 렌더 모드 (mock/real)
    - 비용 추적
    - Provider별 Job ID
    - 에러 코드 및 재시도
    """
    __tablename__ = "video_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # 연결 관계
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=True)
    brand_id = Column(UUID(as_uuid=True), ForeignKey('brands.id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)

    # 상태
    status = Column(String(50), nullable=False, default='queued')
    # 'queued', 'rendering', 'completed', 'failed', 'cancelled'

    # 렌더 모드
    render_mode = Column(String(10), nullable=False, default='mock')
    # 'mock', 'real'

    # 비용 정보
    estimated_cost = Column(Float, nullable=True)  # 예상 비용 ($)
    actual_cost = Column(Float, nullable=True)  # 실제 비용 ($)
    cost_breakdown = Column(JSONB, nullable=True)
    # {"veo": 0.5, "luma": 0.3, "image_gen": 0.1}

    # Provider Job IDs
    provider_job_ids = Column(JSONB, nullable=True)
    # {"veo": "job_123", "luma": "job_456", "scenes": {"1": "job_a", "2": "job_b"}}

    # Plan Draft (입력 데이터)
    plan_draft = Column(JSONB, nullable=False)

    # 결과
    video_url = Column(String(1024), nullable=True)
    thumbnail_url = Column(String(1024), nullable=True)
    duration_sec = Column(Float, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)

    # 에러 정보
    error_code = Column(String(50), nullable=True)
    # 'cost_limit_exceeded', 'provider_timeout', 'image_safety_blocked' 등
    error_message = Column(Text, nullable=True)

    # 재시도 정보
    retry_count = Column(Integer, default=0, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)

    # dry_run 여부
    is_dry_run = Column(Boolean, default=False, nullable=False)

    # Provider 정보
    primary_provider = Column(String(50), nullable=True)
    # 'veo', 'luma', 'runway', 'mock'
    fallback_used = Column(Boolean, default=False, nullable=False)
    fallback_provider = Column(String(50), nullable=True)

    # 메타데이터
    job_metadata = Column(JSONB, nullable=True)
    # {"request_ip": "...", "user_agent": "...", "session_id": "..."}

    # 타임스탬프
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    started_at = Column(TIMESTAMP, nullable=True)  # 렌더 시작 시간
    completed_at = Column(TIMESTAMP, nullable=True)  # 렌더 완료 시간

    # 렌더 시간 (초)
    render_time_sec = Column(Float, nullable=True)

    def __repr__(self):
        return f"<VideoJob(id={self.id}, status={self.status}, render_mode={self.render_mode})>"


class VideoDailyCost(Base):
    """
    일일 비디오 렌더링 비용 추적

    Cost Guard 기능을 위해 일별 비용을 추적합니다.
    """
    __tablename__ = "video_daily_costs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # 날짜 (YYYY-MM-DD 형식)
    date = Column(String(10), nullable=False, index=True)

    # 사용자/브랜드별 비용 추적
    brand_id = Column(UUID(as_uuid=True), ForeignKey('brands.id'), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)

    # 비용
    total_cost = Column(Float, default=0.0, nullable=False)
    job_count = Column(Integer, default=0, nullable=False)

    # Provider별 비용
    cost_by_provider = Column(JSONB, nullable=True)
    # {"veo": 10.5, "luma": 5.2, "runway": 3.0}

    # 타임스탬프
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<VideoDailyCost(date={self.date}, total_cost={self.total_cost})>"
