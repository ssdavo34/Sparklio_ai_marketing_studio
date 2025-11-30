from sqlalchemy import Column, String, Text, TIMESTAMP, ARRAY, ForeignKey, Integer, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
import enum


class DocumentType(str, enum.Enum):
    """브랜드 문서 타입"""
    PDF = "pdf"
    IMAGE = "image"
    TEXT = "text"
    URL = "url"
    BROCHURE = "brochure"


class Brand(Base):
    """
    브랜드 모델 (MVP Enhanced)

    브랜드 정보 및 Brand Kit을 관리합니다.
    - Brand Kit: 컬러, 폰트, 톤앤매너, 키 메시지, 금지 표현
    - 브랜드별 자산 및 프로젝트 관계
    - 사용자별 역할 관리
    - BrandAnalyzerAgent 출력 (Brand DNA Card) 저장
    """
    __tablename__ = "brands"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)

    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Brand Kit (JSON) - MVP Enhanced Structure
    brand_kit = Column(JSONB, nullable=True)
    # {
    #   "logo_url": "https://...",
    #   "colors": {
    #     "primary": ["#FF5733", "#C70039"],
    #     "secondary": ["#33FF57", "#28B463"],
    #     "accent": ["#3357FF"]
    #   },
    #   "fonts": {
    #     "primary": "Montserrat",
    #     "secondary": "Open Sans",
    #     "weights": ["400", "600", "700"]
    #   },
    #   "tone_keywords": ["professional", "friendly", "innovative"],
    #   "forbidden_expressions": ["cheap", "discount", "free"],
    #   "key_messages": [
    #     "Innovation at its finest",
    #     "Quality you can trust",
    #     "Building the future"
    #   ],
    #   "target_audience": "2030 tech professionals",
    #   "brand_values": ["innovation", "transparency", "sustainability"]
    # }

    # Brand DNA Card (BrandAnalyzerAgent 출력)
    brand_dna = Column(JSONB, nullable=True)
    # {
    #   "tone": "professional yet approachable",
    #   "key_messages": ["message1", "message2", "message3"],
    #   "target_audience": "detailed persona",
    #   "dos": ["Do this", "Do that"],
    #   "donts": ["Don't do this", "Avoid that"],
    #   "sample_copies": ["example1", "example2", "example3"],
    #   "analyzed_at": "2025-11-24T14:30:00Z",
    #   "analyzer_version": "v1.0"
    # }

    # 브랜드 자산
    logo_url = Column(Text, nullable=True)
    website_url = Column(Text, nullable=True)
    industry = Column(String(100), nullable=True)
    tags = Column(ARRAY(Text), nullable=True)

    # 메타데이터
    brand_metadata = Column(JSONB, nullable=True)

    # 타임스탬프
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(TIMESTAMP, nullable=True)

    # Relationships
    documents = relationship("BrandDocument", back_populates="brand", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Brand(id={self.id}, name={self.name}, owner_id={self.owner_id})>"


class BrandDocument(Base):
    """
    브랜드 문서 모델

    브랜드 분석에 사용되는 문서 관리
    - PDF, 이미지, 텍스트, URL 등 다양한 타입 지원
    - BrandAnalyzerAgent 입력으로 사용
    """
    __tablename__ = "brand_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), ForeignKey('brands.id', ondelete='CASCADE'), nullable=False)

    # 문서 정보
    title = Column(String(255), nullable=True)
    document_type = Column(SQLEnum(DocumentType), nullable=False)
    file_url = Column(Text, nullable=True)  # S3/로컬 파일 경로
    source_url = Column(Text, nullable=True)  # 크롤링한 URL (document_type=url인 경우)

    # 추출된 텍스트 (PDF/이미지 OCR 결과)
    extracted_text = Column(Text, nullable=True)  # 원본 텍스트 (raw)

    # Brand DNA 분석용 정제된 텍스트
    clean_text = Column(Text, nullable=True)  # DataCleanerAgent로 정제된 텍스트

    # 정제 시 추출된 키워드
    extracted_keywords = Column(ARRAY(Text), nullable=True)  # 해시태그, 브랜드 키워드 등

    # 파일 메타데이터
    file_size = Column(Integer, nullable=True)  # bytes
    mime_type = Column(String(100), nullable=True)

    # 처리 상태
    processed = Column(String(20), default="pending")  # pending, processing, completed, failed

    # 메타데이터
    document_metadata = Column(JSONB, nullable=True)
    # {
    #   "page_count": 10,
    #   "language": "ko",
    #   "extraction_method": "pdf_plumber",
    #   "ocr_confidence": 0.95
    # }

    # 타임스탬프
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    brand = relationship("Brand", back_populates="documents")

    def __repr__(self):
        return f"<BrandDocument(id={self.id}, brand_id={self.brand_id}, type={self.document_type})>"
