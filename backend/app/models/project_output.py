"""
Project Output 모델

프로젝트별 최종 출력물(영상, 프레젠테이션, 상세페이지 등)을 관리합니다.

작성일: 2025-11-30
작성자: B팀 (Backend)

테이블 용도:
- 영상 제작 결과물 저장 (Video Pipeline V2)
- 프레젠테이션 출력물 저장
- 상세페이지 출력물 저장
- SNS 콘텐츠 출력물 저장
"""

from sqlalchemy import Column, String, BigInteger, Float, TIMESTAMP, ARRAY, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class ProjectOutput(Base):
    """
    프로젝트 출력물 모델

    프로젝트에서 생성된 최종 산출물을 관리합니다.
    - 영상 (video)
    - 프레젠테이션 (presentation)
    - 상세페이지 (product_detail)
    - SNS 콘텐츠 (sns_post)
    - 배너 (banner)
    """
    __tablename__ = "project_outputs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # 연결 정보
    brand_id = Column(UUID(as_uuid=True), ForeignKey('brands.id'), nullable=False, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)

    # 출력물 타입
    output_type = Column(String(50), nullable=False, index=True)
    # 'video', 'presentation', 'product_detail', 'sns_post', 'banner', 'brochure'

    # 기본 정보
    name = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)

    # 파일 정보
    minio_path = Column(Text, nullable=True)  # MinIO 저장 경로
    file_url = Column(Text, nullable=True)  # 접근 URL (presigned)
    thumbnail_url = Column(Text, nullable=True)  # 썸네일 URL
    preview_url = Column(Text, nullable=True)  # 프리뷰 URL
    file_size = Column(BigInteger, nullable=True)
    mime_type = Column(String(100), nullable=True)

    # 영상 전용 필드
    duration_sec = Column(Float, nullable=True)  # 영상 길이 (초)
    resolution = Column(String(20), nullable=True)  # '1080x1920', '1920x1080'
    fps = Column(Float, nullable=True)  # 프레임 레이트

    # 생성 정보
    source = Column(String(50), nullable=False, default='system')
    # 'video_pipeline_v2', 'presentation_generator', 'manual', etc.

    source_metadata = Column(JSONB, nullable=True)
    # {
    #   "video_project_id": "vp_xxx",
    #   "plan_draft": {...},
    #   "render_job_id": "job_xxx",
    #   "generation_mode": "hybrid"
    # }

    # 상태
    status = Column(String(20), default='active', nullable=False, index=True)
    # 'draft', 'processing', 'active', 'archived', 'deleted', 'failed'

    # 메타데이터
    output_metadata = Column(JSONB, nullable=True)
    # 출력물 타입별 추가 정보
    # video: {"scenes_count": 6, "bgm_mood": "warm_lofi", ...}
    # presentation: {"slides_count": 12, "template": "modern", ...}

    tags = Column(ARRAY(Text), nullable=True)

    # 버전 관리
    version = Column(String(20), default='1.0', nullable=False)
    parent_output_id = Column(UUID(as_uuid=True), ForeignKey('project_outputs.id'), nullable=True)
    # 수정/재생성 시 이전 버전 참조

    # 타임스탬프
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    completed_at = Column(TIMESTAMP, nullable=True)  # 생성 완료 시점
    deleted_at = Column(TIMESTAMP, nullable=True)

    def __repr__(self):
        return f"<ProjectOutput(id={self.id}, type={self.output_type}, project_id={self.project_id})>"
