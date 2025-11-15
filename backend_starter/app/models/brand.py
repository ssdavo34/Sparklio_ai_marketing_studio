from sqlalchemy import Column, String, Text, TIMESTAMP, ARRAY, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class Brand(Base):
    """
    브랜드 모델

    브랜드 정보 및 Brand Kit을 관리합니다.
    - Brand Kit: 컬러, 폰트, 톤앤매너, 키 메시지
    - 브랜드별 자산 및 프로젝트 관계
    - 사용자별 역할 관리
    """
    __tablename__ = "brands"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)

    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Brand Kit (JSON)
    brand_kit = Column(JSONB, nullable=True)
    # {
    #   "colors": {"primary": "#FF5733", "secondary": "#33FF57"},
    #   "fonts": {"heading": "Montserrat", "body": "Open Sans"},
    #   "tone": "professional, friendly",
    #   "key_messages": ["Innovation", "Quality", "Trust"]
    # }

    # 브랜드 자산
    logo_url = Column(Text, nullable=True)
    website_url = Column(Text, nullable=True)
    industry = Column(String(100), nullable=True)
    tags = Column(ARRAY(Text), nullable=True)

    # 메타데이터
    brand_metadata = Column(JSONB, nullable=True)  # Renamed from 'metadata' (SQLAlchemy reserved word)

    # 타임스탬프
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(TIMESTAMP, nullable=True)

    def __repr__(self):
        return f"<Brand(id={self.id}, name={self.name}, owner_id={self.owner_id})>"
