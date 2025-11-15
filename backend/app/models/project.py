from sqlalchemy import Column, String, Text, TIMESTAMP, ARRAY, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class Project(Base):
    """
    프로젝트 모델

    마케팅 캠페인 또는 콘텐츠 제작 프로젝트를 관리합니다.
    - 브랜드별 프로젝트 관리
    - Brief 저장
    - 생성된 자산 연결
    """
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), ForeignKey('brands.id'), nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)

    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)

    # 프로젝트 타입
    project_type = Column(String(50), nullable=False)
    # 'campaign', 'brochure', 'presentation', 'sns', 'video', 'blog'

    # Brief (JSON)
    brief = Column(JSONB, nullable=True)
    # {
    #   "goal": "신제품 런칭 캠페인",
    #   "target_audience": "20-30대 여성",
    #   "channels": ["instagram", "facebook"],
    #   "budget": 5000000,
    #   "timeline": "2025-12-01 ~ 2025-12-31"
    # }

    # 상태
    status = Column(String(20), default='draft', nullable=False)
    # 'draft', 'in_progress', 'review', 'completed', 'archived'

    # 메타데이터
    project_metadata = Column(JSONB, nullable=True)  # Renamed from 'metadata' (SQLAlchemy reserved word)
    tags = Column(ARRAY(Text), nullable=True)

    # 타임스탬프
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(TIMESTAMP, nullable=True)

    def __repr__(self):
        return f"<Project(id={self.id}, name={self.name}, brand_id={self.brand_id})>"
