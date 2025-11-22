"""
Document Template Service

문서 템플릿 관리 및 적용

작성일: 2025-11-20
작성자: B팀 (Backend)
"""

from sqlalchemy.orm import Session
from typing import Optional, List, Tuple, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime
import json
import logging

from app.models.sparklio_document import SparklioDocument
from app.schemas.sparklio_document import (
    SparklioDocumentResponse,
    DocumentTemplate,
    SparklioPage,
    SparklioElement,
    ElementProps
)

logger = logging.getLogger(__name__)


class TemplateService:
    """템플릿 서비스 클래스"""

    def __init__(self, db: Session):
        self.db = db
        # 하드코딩된 템플릿 (실제로는 DB나 파일에서 로드)
        self.templates = self._load_default_templates()

    async def list_templates(
        self,
        kind: Optional[str] = None,
        category: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[DocumentTemplate], int]:
        """템플릿 목록 조회"""
        try:
            filtered_templates = self.templates

            # 필터링
            if kind:
                filtered_templates = [
                    t for t in filtered_templates
                    if t["kind"] == kind
                ]

            if category:
                filtered_templates = [
                    t for t in filtered_templates
                    if t.get("category") == category
                ]

            # 페이징
            total = len(filtered_templates)
            start = (page - 1) * page_size
            end = start + page_size
            paginated = filtered_templates[start:end]

            # DocumentTemplate 객체로 변환
            templates = [
                DocumentTemplate(**template)
                for template in paginated
            ]

            return templates, total

        except Exception as e:
            logger.error(f"템플릿 목록 조회 실패: {str(e)}")
            raise e

    async def get_template(self, template_id: UUID) -> Optional[DocumentTemplate]:
        """특정 템플릿 조회"""
        try:
            for template in self.templates:
                if template["id"] == str(template_id):
                    return DocumentTemplate(**template)
            return None

        except Exception as e:
            logger.error(f"템플릿 조회 실패: {str(e)}")
            raise e

    async def apply_template(
        self,
        template_id: UUID,
        title: str,
        brand_id: Optional[UUID] = None,
        project_id: Optional[UUID] = None,
        user_id: UUID = None
    ) -> SparklioDocumentResponse:
        """템플릿 적용하여 새 문서 생성"""
        try:
            # 템플릿 조회
            template = await self.get_template(template_id)
            if not template:
                raise ValueError("템플릿을 찾을 수 없습니다")

            # 새 문서 생성
            db_document = SparklioDocument(
                title=title,
                kind=template.kind,
                pages=[page.dict() for page in template.pages],
                metadata={
                    "template_id": str(template_id),
                    "template_name": template.name
                },
                brand_id=brand_id,
                project_id=project_id,
                created_by_id=user_id,
                updated_by_id=user_id
            )

            self.db.add(db_document)
            self.db.commit()
            self.db.refresh(db_document)

            logger.info(f"템플릿 적용 완료: {template_id} -> {db_document.id}")
            return SparklioDocumentResponse.from_orm(db_document)

        except Exception as e:
            self.db.rollback()
            logger.error(f"템플릿 적용 실패: {str(e)}")
            raise e

    def _load_default_templates(self) -> List[Dict[str, Any]]:
        """기본 템플릿 로드"""
        return [
            # 컨셉 보드 템플릿
            {
                "id": str(uuid4()),
                "name": "모던 컨셉 보드",
                "description": "깔끔하고 현대적인 컨셉 보드 템플릿",
                "kind": "concept_board",
                "thumbnail": "/templates/modern-concept.png",
                "category": "modern",
                "tags": ["모던", "깔끔", "비즈니스"],
                "isPremium": False,
                "pages": [
                    {
                        "id": str(uuid4()),
                        "name": "메인 페이지",
                        "width": 1920,
                        "height": 1080,
                        "backgroundColor": "#F5F5F5",
                        "elements": [
                            {
                                "id": str(uuid4()),
                                "type": "text",
                                "x": 100,
                                "y": 100,
                                "width": 600,
                                "height": 80,
                                "props": {
                                    "text": "프로젝트 컨셉",
                                    "fontSize": 48,
                                    "fontFamily": "Pretendard",
                                    "fontWeight": "bold",
                                    "color": "#333333"
                                }
                            },
                            {
                                "id": str(uuid4()),
                                "type": "text",
                                "x": 100,
                                "y": 200,
                                "width": 800,
                                "height": 200,
                                "props": {
                                    "text": "여기에 프로젝트 설명을 입력하세요",
                                    "fontSize": 18,
                                    "fontFamily": "Pretendard",
                                    "color": "#666666",
                                    "lineHeight": 1.6
                                }
                            },
                            {
                                "id": str(uuid4()),
                                "type": "shape",
                                "x": 1000,
                                "y": 100,
                                "width": 800,
                                "height": 600,
                                "props": {
                                    "fill": "#E0E0E0",
                                    "radius": 8
                                }
                            }
                        ]
                    }
                ]
            },

            # 배너 템플릿
            {
                "id": str(uuid4()),
                "name": "세일 배너",
                "description": "프로모션용 배너 템플릿",
                "kind": "banner",
                "thumbnail": "/templates/sale-banner.png",
                "category": "promotion",
                "tags": ["세일", "프로모션", "할인"],
                "isPremium": False,
                "pages": [
                    {
                        "id": str(uuid4()),
                        "name": "배너",
                        "width": 728,
                        "height": 90,
                        "backgroundColor": "#FF6B6B",
                        "elements": [
                            {
                                "id": str(uuid4()),
                                "type": "text",
                                "x": 20,
                                "y": 20,
                                "width": 200,
                                "height": 50,
                                "props": {
                                    "text": "SALE 50%",
                                    "fontSize": 36,
                                    "fontWeight": "bold",
                                    "color": "#FFFFFF"
                                }
                            },
                            {
                                "id": str(uuid4()),
                                "type": "text",
                                "x": 240,
                                "y": 30,
                                "width": 300,
                                "height": 30,
                                "props": {
                                    "text": "특별 할인 이벤트",
                                    "fontSize": 20,
                                    "color": "#FFFFFF"
                                }
                            },
                            {
                                "id": str(uuid4()),
                                "type": "shape",
                                "x": 560,
                                "y": 20,
                                "width": 140,
                                "height": 50,
                                "props": {
                                    "fill": "#FFFFFF",
                                    "radius": 25
                                }
                            },
                            {
                                "id": str(uuid4()),
                                "type": "text",
                                "x": 580,
                                "y": 35,
                                "width": 100,
                                "height": 20,
                                "props": {
                                    "text": "지금 구매",
                                    "fontSize": 16,
                                    "fontWeight": "bold",
                                    "color": "#FF6B6B",
                                    "textAlign": "center"
                                }
                            }
                        ]
                    }
                ]
            },

            # 슬라이드 템플릿
            {
                "id": str(uuid4()),
                "name": "비즈니스 프레젠테이션",
                "description": "전문적인 비즈니스 프레젠테이션 템플릿",
                "kind": "slide",
                "thumbnail": "/templates/business-slide.png",
                "category": "business",
                "tags": ["비즈니스", "프레젠테이션", "전문"],
                "isPremium": True,
                "pages": [
                    {
                        "id": str(uuid4()),
                        "name": "표지",
                        "width": 1920,
                        "height": 1080,
                        "backgroundColor": "#1A237E",
                        "elements": [
                            {
                                "id": str(uuid4()),
                                "type": "text",
                                "x": 760,
                                "y": 440,
                                "width": 400,
                                "height": 80,
                                "props": {
                                    "text": "프레젠테이션 제목",
                                    "fontSize": 48,
                                    "fontWeight": "bold",
                                    "color": "#FFFFFF",
                                    "textAlign": "center"
                                }
                            },
                            {
                                "id": str(uuid4()),
                                "type": "text",
                                "x": 760,
                                "y": 540,
                                "width": 400,
                                "height": 40,
                                "props": {
                                    "text": "2025년 비즈니스 전략",
                                    "fontSize": 24,
                                    "color": "#B3E5FC",
                                    "textAlign": "center"
                                }
                            }
                        ]
                    },
                    {
                        "id": str(uuid4()),
                        "name": "목차",
                        "width": 1920,
                        "height": 1080,
                        "backgroundColor": "#FFFFFF",
                        "elements": [
                            {
                                "id": str(uuid4()),
                                "type": "text",
                                "x": 100,
                                "y": 100,
                                "width": 300,
                                "height": 60,
                                "props": {
                                    "text": "목차",
                                    "fontSize": 42,
                                    "fontWeight": "bold",
                                    "color": "#1A237E"
                                }
                            }
                        ]
                    }
                ]
            },

            # 카드뉴스 템플릿
            {
                "id": str(uuid4()),
                "name": "인스타그램 카드뉴스",
                "description": "정사각형 카드뉴스 템플릿",
                "kind": "card_news",
                "thumbnail": "/templates/card-news.png",
                "category": "social",
                "tags": ["인스타그램", "카드뉴스", "SNS"],
                "isPremium": False,
                "pages": self._create_card_news_pages()
            },

            # 소셜 포스트 템플릿
            {
                "id": str(uuid4()),
                "name": "인스타그램 포스트",
                "description": "인스타그램용 정사각형 포스트",
                "kind": "social_post",
                "thumbnail": "/templates/insta-post.png",
                "category": "social",
                "tags": ["인스타그램", "SNS", "포스트"],
                "isPremium": False,
                "pages": [
                    {
                        "id": str(uuid4()),
                        "name": "포스트",
                        "width": 1080,
                        "height": 1080,
                        "backgroundColor": "#FFFFFF",
                        "elements": [
                            {
                                "id": str(uuid4()),
                                "type": "shape",
                                "x": 0,
                                "y": 0,
                                "width": 1080,
                                "height": 1080,
                                "props": {
                                    "fill": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                }
                            },
                            {
                                "id": str(uuid4()),
                                "type": "text",
                                "x": 340,
                                "y": 440,
                                "width": 400,
                                "height": 100,
                                "props": {
                                    "text": "Your Text Here",
                                    "fontSize": 48,
                                    "fontWeight": "bold",
                                    "color": "#FFFFFF",
                                    "textAlign": "center"
                                }
                            }
                        ]
                    }
                ]
            }
        ]

    def _create_card_news_pages(self) -> List[Dict[str, Any]]:
        """카드뉴스 페이지 생성"""
        pages = []
        for i in range(8):
            page_num = i + 1
            pages.append({
                "id": str(uuid4()),
                "name": f"카드 {page_num}",
                "width": 1080,
                "height": 1080,
                "backgroundColor": "#FFFFFF",
                "elements": [
                    {
                        "id": str(uuid4()),
                        "type": "text",
                        "x": 50,
                        "y": 50,
                        "width": 100,
                        "height": 50,
                        "props": {
                            "text": f"{page_num}/8",
                            "fontSize": 24,
                            "fontWeight": "bold",
                            "color": "#666666"
                        }
                    },
                    {
                        "id": str(uuid4()),
                        "type": "text",
                        "x": 140,
                        "y": 440,
                        "width": 800,
                        "height": 200,
                        "props": {
                            "text": f"카드 {page_num} 내용",
                            "fontSize": 36,
                            "fontWeight": "bold",
                            "color": "#333333",
                            "textAlign": "center"
                        }
                    }
                ]
            })
        return pages

    async def create_custom_template(
        self,
        name: str,
        description: str,
        document_id: UUID,
        user_id: UUID
    ) -> DocumentTemplate:
        """사용자 정의 템플릿 생성"""
        # NOTE: 사용자가 만든 문서를 템플릿으로 저장하는 기능 구현 예정
        # 구현 예시:
        # document = self.db.query(SparklioDocument).filter_by(id=document_id).first()
        # if not document or document.created_by_id != user_id:
        #     raise ValueError("문서를 찾을 수 없거나 권한이 없습니다")
        #
        # template_data = {
        #     "id": str(uuid4()),
        #     "name": name,
        #     "description": description,
        #     "kind": document.kind,
        #     "thumbnail": None,  # 썸네일 생성 로직 필요
        #     "category": "custom",
        #     "tags": ["사용자 정의"],
        #     "isPremium": False,
        #     "pages": document.pages,
        #     "created_by_id": user_id
        # }
        # # DB에 저장하고 DocumentTemplate 반환
        pass

    async def delete_template(
        self,
        template_id: UUID,
        user_id: UUID
    ) -> bool:
        """템플릿 삭제"""
        # NOTE: 사용자 정의 템플릿 삭제 기능 구현 예정
        # 구현 예시:
        # template = self.db.query(UserTemplate).filter_by(
        #     id=template_id,
        #     created_by_id=user_id
        # ).first()
        # if not template:
        #     return False
        # self.db.delete(template)
        # self.db.commit()
        # return True
        #
        # 주의: 기본 시스템 템플릿은 삭제 불가능하도록 검증 필요
        pass