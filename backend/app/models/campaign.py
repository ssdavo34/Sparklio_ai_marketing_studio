"""
Campaign 및 Concept 모델

Demo Day 캠페인 생성 및 컨셉 관리

작성일: 2025-11-26
작성자: B팀 (Backend)
참조: B_TEAM_TODO_LIST_2025-11-26.md
"""

import uuid
from sqlalchemy import Column, String, Text, Integer, Float, ForeignKey, TIMESTAMP, Enum as SQLEnum, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


# =============================================================================
# Enums
# =============================================================================

class CampaignStatus(str, enum.Enum):
    """캠페인 상태"""
    PENDING = "pending"  # 생성 대기
    PROCESSING = "processing"  # 처리 중
    CONCEPT_READY = "concept_ready"  # 컨셉 생성 완료
    ASSET_GENERATING = "asset_generating"  # 에셋 생성 중
    COMPLETED = "completed"  # 완료
    FAILED = "failed"  # 실패


class AssetType(str, enum.Enum):
    """에셋 유형"""
    PRESENTATION = "presentation"
    PRODUCT_DETAIL = "product_detail"
    INSTAGRAM_ADS = "instagram_ads"
    SHORTS_SCRIPT = "shorts_script"


class AssetStatus(str, enum.Enum):
    """에셋 상태"""
    PENDING = "pending"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


# =============================================================================
# Campaign Model
# =============================================================================

class Campaign(Base):
    """
    캠페인 모델

    회의에서 생성된 마케팅 캠페인
    하나의 Campaign은 여러 Concept을 가질 수 있음
    """
    __tablename__ = "campaigns"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys
    meeting_id = Column(UUID(as_uuid=True), ForeignKey('meetings.id'), nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    brand_id = Column(UUID(as_uuid=True), ForeignKey('brands.id'), nullable=True)

    # 캠페인 정보
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # 상태 - values_callable로 소문자 enum value 사용
    status = Column(
        SQLEnum(CampaignStatus, values_callable=lambda x: [e.value for e in x]),
        default=CampaignStatus.PENDING,
        nullable=False
    )
    error_message = Column(Text, nullable=True)

    # 회의 요약 (from MeetingAgent)
    meeting_summary = Column(JSONB, nullable=True)
    # {
    #   "title": "회의 제목",
    #   "duration_minutes": 45,
    #   "participants": ["김대표", "이마케팅"],
    #   "key_points": ["포인트1", "포인트2"],
    #   "core_message": "핵심 메시지"
    # }

    # 캠페인 브리프 (from StrategistAgent)
    campaign_brief = Column(JSONB, nullable=True)
    # {
    #   "objective": "마케팅 목표",
    #   "target_audience": "타겟 고객",
    #   "key_messages": ["메시지1", "메시지2"],
    #   "tone_and_manner": "톤앤매너",
    #   "budget": "예산",
    #   "timeline": "일정"
    # }

    # Task ID (SSE 스트리밍용)
    task_id = Column(String(100), nullable=True, unique=True, index=True)

    # 메타데이터
    meta_info = Column(JSONB, nullable=True)

    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(TIMESTAMP, nullable=True)

    # Relationships
    concepts = relationship("Concept", back_populates="campaign", cascade="all, delete-orphan")


# =============================================================================
# Concept Model
# =============================================================================

class Concept(Base):
    """
    컨셉 모델

    캠페인의 마케팅 컨셉
    하나의 Concept은 여러 Asset을 가질 수 있음
    """
    __tablename__ = "concepts"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys
    campaign_id = Column(UUID(as_uuid=True), ForeignKey('campaigns.id', ondelete='CASCADE'), nullable=False)

    # 컨셉 정보
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # 컨셉 상세
    target_audience = Column(Text, nullable=True)
    key_message = Column(String(500), nullable=True)
    tone_and_manner = Column(String(200), nullable=True)
    visual_style = Column(String(200), nullable=True)

    # 썸네일
    thumbnail_url = Column(Text, nullable=True)

    # 순서 (UI 표시용)
    order = Column(Integer, default=0, nullable=False)

    # 선택 여부
    is_selected = Column(Boolean, default=False, nullable=False)

    # 메타데이터 (LLM 출력 원본 등)
    meta_info = Column(JSONB, nullable=True)

    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    campaign = relationship("Campaign", back_populates="concepts")
    assets = relationship("ConceptAsset", back_populates="concept", cascade="all, delete-orphan")


# =============================================================================
# ConceptAsset Model
# =============================================================================

class ConceptAsset(Base):
    """
    컨셉 에셋 모델

    컨셉별 생성된 마케팅 에셋 (발표자료, 상세페이지, 인스타 광고, 숏폼 스크립트)
    """
    __tablename__ = "concept_assets"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys
    concept_id = Column(UUID(as_uuid=True), ForeignKey('concepts.id', ondelete='CASCADE'), nullable=False)

    # 에셋 정보 - values_callable로 소문자 enum value 사용
    asset_type = Column(
        SQLEnum(AssetType, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )
    status = Column(
        SQLEnum(AssetStatus, values_callable=lambda x: [e.value for e in x]),
        default=AssetStatus.PENDING,
        nullable=False
    )
    error_message = Column(Text, nullable=True)

    # 에셋 제목
    title = Column(String(255), nullable=True)

    # 에셋 컨텐츠 (JSON)
    content = Column(JSONB, nullable=True)
    # asset_type에 따라 구조가 다름:
    # - presentation: { slides: [...], style: {...} }
    # - product_detail: { sections: [...], style: {...} }
    # - instagram_ads: { ads: [...], hashtags: [...] }
    # - shorts_script: { scenes: [...], audio: {...} }

    # 스타일 설정
    style = Column(JSONB, nullable=True)
    # {
    #   "primary_color": "#4F46E5",
    #   "secondary_color": "#10B981",
    #   "font_family": "Pretendard",
    #   "theme": "modern"
    # }

    # 미리보기/다운로드 URL
    preview_url = Column(Text, nullable=True)
    download_url = Column(Text, nullable=True)

    # 추가 정보 (에셋별)
    extra_info = Column(JSONB, nullable=True)
    # - instagram_ads: { count: 3 }
    # - shorts_script: { duration_seconds: 45 }

    # 메타데이터
    meta_info = Column(JSONB, nullable=True)

    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    concept = relationship("Concept", back_populates="assets")
