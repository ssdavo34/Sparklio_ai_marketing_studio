"""
Document API 엔드포인트

Editor Document 저장, 조회, 수정 기능
SYSTEM_ARCHITECTURE.md 섹션 5.3.3 기반 구현
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.brand import Brand
from app.models.project import Project
from app.schemas.document import (
    DocumentSaveRequest,
    DocumentUpdateRequest,
    DocumentResponse,
    DocumentListResponse,
)
from app.auth.jwt import get_current_user

router = APIRouter()


@router.post("/{docId}/save", response_model=dict, status_code=status.HTTP_200_OK)
async def save_document(
    docId: UUID,
    data: DocumentSaveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Editor Document를 저장합니다.

    신규 생성 또는 기존 문서 업데이트를 자동으로 처리합니다.

    Args:
        docId: Document ID
        data: Document 저장 데이터
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        저장 결과 및 버전 정보
    """
    doc = db.query(Document).filter(Document.id == docId).first()

    if not doc:
        # 신규 문서 생성
        doc = Document(
            id=docId,
            user_id=current_user.id,
            document_json=data.documentJson,
            document_metadata=data.metadata or {},
            version=1
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        return {
            "status": "created",
            "documentId": str(doc.id),
            "version": doc.version,
            "created_at": doc.created_at.isoformat()
        }
    else:
        # 권한 확인
        if doc.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to update this document"
            )

        # 기존 문서 업데이트
        doc.document_json = data.documentJson
        if data.metadata:
            doc.document_metadata = data.metadata
        doc.version += 1
        doc.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(doc)

        return {
            "status": "updated",
            "documentId": str(doc.id),
            "version": doc.version,
            "updated_at": doc.updated_at.isoformat()
        }


@router.get("/{docId}", response_model=DocumentResponse)
async def get_document(
    docId: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Editor Document를 조회합니다.

    Args:
        docId: Document ID
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        Document 정보
    """
    doc = db.query(Document).filter(Document.id == docId).first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # 권한 확인
    if doc.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this document"
        )

    return doc


@router.patch("/{docId}", response_model=DocumentResponse)
async def update_document(
    docId: UUID,
    data: DocumentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Editor Document를 부분 수정합니다.

    Args:
        docId: Document ID
        data: Document 수정 데이터
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        수정된 Document 정보
    """
    doc = db.query(Document).filter(Document.id == docId).first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # 권한 확인
    if doc.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this document"
        )

    # 부분 업데이트
    if data.documentJson is not None:
        doc.document_json = data.documentJson
        doc.version += 1

    if data.metadata is not None:
        doc.document_metadata = data.metadata

    doc.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(doc)

    return doc


@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    brand_id: Optional[UUID] = None,
    project_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Document 목록을 조회합니다.

    Args:
        brand_id: 브랜드 ID (선택)
        project_id: 프로젝트 ID (선택)
        skip: 건너뛸 레코드 수
        limit: 조회할 최대 레코드 수
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        Document 목록
    """
    query = db.query(Document).filter(
        Document.user_id == current_user.id
    )

    if brand_id:
        query = query.filter(Document.brand_id == brand_id)

    if project_id:
        query = query.filter(Document.project_id == project_id)

    total = query.count()
    documents = query.order_by(Document.updated_at.desc()).offset(skip).limit(limit).all()

    return DocumentListResponse(
        documents=documents,
        total=total
    )


@router.delete("/{docId}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    docId: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Document를 삭제합니다.

    Args:
        docId: Document ID
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        204 No Content
    """
    doc = db.query(Document).filter(Document.id == docId).first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # 권한 확인
    if doc.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this document"
        )

    db.delete(doc)
    db.commit()

    return None
