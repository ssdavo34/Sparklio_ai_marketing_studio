"""
Sparklio Document Service

문서 CRUD 및 비즈니스 로직 처리

작성일: 2025-11-20
작성자: B팀 (Backend)
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
import json
import logging

from app.models.sparklio_document import SparklioDocument
from app.schemas.sparklio_document import (
    SparklioDocumentCreate,
    SparklioDocumentUpdate,
    SparklioDocumentResponse,
    SparklioPage
)

logger = logging.getLogger(__name__)


class DocumentService:
    """문서 서비스 클래스"""

    def __init__(self, db: Session):
        self.db = db

    async def create_document(
        self,
        document_data: SparklioDocumentCreate,
        user_id: UUID
    ) -> SparklioDocumentResponse:
        """새 문서 생성"""
        try:
            # 기본 페이지 생성 (없는 경우)
            if not document_data.pages:
                default_page = SparklioPage(
                    name="Page 1",
                    elements=[],
                    width=1920,
                    height=1080,
                    backgroundColor="#FFFFFF"
                )
                pages = [default_page.dict()]
            else:
                pages = [page.dict() for page in document_data.pages]

            # 문서 모델 생성
            db_document = SparklioDocument(
                title=document_data.title,
                kind=document_data.kind,
                pages=pages,
                metadata=document_data.metadata or {},
                brand_id=document_data.brandId,
                project_id=document_data.projectId,
                created_by_id=user_id,
                updated_by_id=user_id
            )

            self.db.add(db_document)
            self.db.commit()
            self.db.refresh(db_document)

            logger.info(f"문서 생성 완료: {db_document.id}")
            return SparklioDocumentResponse.from_orm(db_document)

        except Exception as e:
            self.db.rollback()
            logger.error(f"문서 생성 실패: {str(e)}")
            raise e

    async def get_document(
        self,
        document_id: UUID,
        user_id: UUID
    ) -> Optional[SparklioDocumentResponse]:
        """문서 조회"""
        try:
            document = self.db.query(SparklioDocument).filter(
                and_(
                    SparklioDocument.id == document_id,
                    SparklioDocument.created_by_id == user_id
                )
            ).first()

            if not document:
                return None

            return SparklioDocumentResponse.from_orm(document)

        except Exception as e:
            logger.error(f"문서 조회 실패: {str(e)}")
            raise e

    async def list_documents(
        self,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20,
        kind: Optional[str] = None,
        brand_id: Optional[UUID] = None,
        project_id: Optional[UUID] = None
    ) -> List[SparklioDocumentResponse]:
        """문서 목록 조회"""
        try:
            query = self.db.query(SparklioDocument).filter(
                SparklioDocument.created_by_id == user_id
            )

            # 필터링
            if kind:
                query = query.filter(SparklioDocument.kind == kind)
            if brand_id:
                query = query.filter(SparklioDocument.brand_id == brand_id)
            if project_id:
                query = query.filter(SparklioDocument.project_id == project_id)

            # 정렬 및 페이징
            documents = query.order_by(
                SparklioDocument.updated_at.desc()
            ).offset(skip).limit(limit).all()

            return [SparklioDocumentResponse.from_orm(doc) for doc in documents]

        except Exception as e:
            logger.error(f"문서 목록 조회 실패: {str(e)}")
            raise e

    async def update_document(
        self,
        document_id: UUID,
        document_data: SparklioDocumentUpdate,
        user_id: UUID
    ) -> Optional[SparklioDocumentResponse]:
        """문서 업데이트"""
        try:
            document = self.db.query(SparklioDocument).filter(
                and_(
                    SparklioDocument.id == document_id,
                    SparklioDocument.created_by_id == user_id
                )
            ).first()

            if not document:
                return None

            # 업데이트할 필드만 처리
            update_data = document_data.dict(exclude_unset=True)

            if "title" in update_data:
                document.title = update_data["title"]
            if "kind" in update_data:
                document.kind = update_data["kind"]
            if "pages" in update_data:
                document.pages = [page.dict() if hasattr(page, 'dict') else page
                                 for page in update_data["pages"]]
            if "metadata" in update_data:
                document.metadata = update_data["metadata"]

            document.updated_by_id = user_id
            document.updated_at = datetime.utcnow()

            self.db.commit()
            self.db.refresh(document)

            logger.info(f"문서 업데이트 완료: {document_id}")
            return SparklioDocumentResponse.from_orm(document)

        except Exception as e:
            self.db.rollback()
            logger.error(f"문서 업데이트 실패: {str(e)}")
            raise e

    async def delete_document(
        self,
        document_id: UUID,
        user_id: UUID
    ) -> bool:
        """문서 삭제"""
        try:
            document = self.db.query(SparklioDocument).filter(
                and_(
                    SparklioDocument.id == document_id,
                    SparklioDocument.created_by_id == user_id
                )
            ).first()

            if not document:
                return False

            self.db.delete(document)
            self.db.commit()

            logger.info(f"문서 삭제 완료: {document_id}")
            return True

        except Exception as e:
            self.db.rollback()
            logger.error(f"문서 삭제 실패: {str(e)}")
            raise e

    async def autosave(
        self,
        document_id: UUID,
        pages: List[dict],
        user_id: UUID
    ) -> bool:
        """자동 저장"""
        try:
            document = self.db.query(SparklioDocument).filter(
                and_(
                    SparklioDocument.id == document_id,
                    SparklioDocument.created_by_id == user_id
                )
            ).first()

            if not document:
                return False

            # 페이지 데이터만 업데이트
            document.pages = pages
            document.updated_at = datetime.utcnow()

            # 메타데이터에 자동저장 시간 기록
            if not document.metadata:
                document.metadata = {}
            document.metadata["last_autosave"] = datetime.utcnow().isoformat()

            self.db.commit()

            logger.debug(f"자동 저장 완료: {document_id}")
            return True

        except Exception as e:
            self.db.rollback()
            logger.error(f"자동 저장 실패: {str(e)}")
            raise e

    async def duplicate_document(
        self,
        document_id: UUID,
        new_title: str,
        user_id: UUID
    ) -> Optional[SparklioDocumentResponse]:
        """문서 복제"""
        try:
            original = self.db.query(SparklioDocument).filter(
                and_(
                    SparklioDocument.id == document_id,
                    SparklioDocument.created_by_id == user_id
                )
            ).first()

            if not original:
                return None

            # 새 문서 생성
            duplicate = SparklioDocument(
                title=new_title,
                kind=original.kind,
                pages=original.pages.copy(),  # 딥 복사
                metadata=original.metadata.copy() if original.metadata else {},
                brand_id=original.brand_id,
                project_id=original.project_id,
                created_by_id=user_id,
                updated_by_id=user_id
            )

            self.db.add(duplicate)
            self.db.commit()
            self.db.refresh(duplicate)

            logger.info(f"문서 복제 완료: {document_id} -> {duplicate.id}")
            return SparklioDocumentResponse.from_orm(duplicate)

        except Exception as e:
            self.db.rollback()
            logger.error(f"문서 복제 실패: {str(e)}")
            raise e

    async def get_document_history(
        self,
        document_id: UUID,
        user_id: UUID,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """문서 변경 이력 조회"""
        # TODO: 버전 관리 시스템 구현 후 완성
        # 현재는 간단한 메타데이터만 반환
        try:
            document = self.db.query(SparklioDocument).filter(
                and_(
                    SparklioDocument.id == document_id,
                    SparklioDocument.created_by_id == user_id
                )
            ).first()

            if not document:
                return []

            history = []
            if document.metadata and "history" in document.metadata:
                history = document.metadata["history"][-limit:]

            return history

        except Exception as e:
            logger.error(f"문서 이력 조회 실패: {str(e)}")
            raise e