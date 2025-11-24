"""
Sparklio Document 데이터베이스 모델

에디터에서 사용하는 통합 문서 모델
Polotno/LayerHub/Konva와 독립적인 중간 표현

작성일: 2025-11-20
작성자: B팀 (Backend)
문서: SPARKLIO_EDITOR_PLAN_v1.1
"""

from sqlalchemy import Column, String, JSON, ForeignKey, DateTime, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from app.core.database import Base


class DocumentKind(str, enum.Enum):
    """문서 종류"""
    CONCEPT_BOARD = "concept_board"  # 컨셉보드
    BANNER = "banner"                # 배너
    SLIDE = "slide"                  # 슬라이드/프레젠테이션
    CARD_NEWS = "card_news"          # 카드뉴스
    SOCIAL_POST = "social_post"      # SNS 포스트


class SparklioDocument(Base):
    """
    Sparklio 통합 문서 모델

    에디터 엔진(Polotno/LayerHub)과 독립적인 중간 표현
    모든 디자인 데이터의 중심 모델
    """
    __tablename__ = "sparklio_documents"

    # 기본 필드
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    kind = Column(SQLEnum(DocumentKind), nullable=False, default=DocumentKind.CONCEPT_BOARD)

    # 문서 데이터 (JSON)
    pages = Column(JSON, nullable=False, default=list)
    # pages 구조:
    # [
    #   {
    #     "id": "page-uuid",
    #     "name": "Page 1",
    #     "elements": [
    #       {
    #         "id": "element-uuid",
    #         "type": "text|image|shape|frame",
    #         "x": 100,
    #         "y": 100,
    #         "width": 200,
    #         "height": 100,
    #         "rotation": 0,
    #         "props": {
    #           "text": "Hello",
    #           "fontSize": 24,
    #           "fontFamily": "Arial",
    #           "color": "#000000",
    #           ...
    #         }
    #       }
    #     ]
    #   }
    # ]

    # 메타데이터
    document_metadata = Column(JSON, nullable=True)
    # metadata 구조:
    # {
    #   "width": 1920,
    #   "height": 1080,
    #   "backgroundColor": "#FFFFFF",
    #   "theme": "light",
    #   ...
    # }

    # 관계
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id"), nullable=True)
    brand = relationship("Brand")  # 단방향 관계 (back_populates 제거)

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    project = relationship("Project", back_populates="documents")

    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_by = relationship("User", foreign_keys=[created_by_id])

    updated_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_by = relationship("User", foreign_keys=[updated_by_id])

    # AI 생성 관련
    ai_prompt = Column(Text, nullable=True)  # 생성 시 사용한 프롬프트
    ai_model = Column(String(100), nullable=True)  # 사용한 AI 모델
    ai_generated = Column(JSON, nullable=True)  # AI가 생성한 원본 데이터

    # 엔진별 원본 데이터 (호환성을 위해 보관)
    polotno_data = Column(JSON, nullable=True)
    layerhub_data = Column(JSON, nullable=True)
    konva_data = Column(JSON, nullable=True)

    # 타임스탬프
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 소프트 삭제
    deleted_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<SparklioDocument(id={self.id}, title='{self.title}', kind={self.kind})>"

    def to_dict(self):
        """문서를 딕셔너리로 변환"""
        return {
            "id": str(self.id),
            "title": self.title,
            "kind": self.kind.value,
            "pages": self.pages,
            "metadata": self.metadata,
            "brandId": str(self.brand_id) if self.brand_id else None,
            "projectId": str(self.project_id) if self.project_id else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

    def add_page(self, page_data: dict):
        """페이지 추가"""
        if not self.pages:
            self.pages = []
        self.pages.append(page_data)

    def update_page(self, page_id: str, page_data: dict):
        """페이지 업데이트"""
        if not self.pages:
            return
        for i, page in enumerate(self.pages):
            if page.get("id") == page_id:
                self.pages[i] = page_data
                break

    def delete_page(self, page_id: str):
        """페이지 삭제"""
        if not self.pages:
            return
        self.pages = [p for p in self.pages if p.get("id") != page_id]

    def get_page(self, page_id: str):
        """특정 페이지 가져오기"""
        if not self.pages:
            return None
        for page in self.pages:
            if page.get("id") == page_id:
                return page
        return None