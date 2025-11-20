"""
Sparklio Editor API 엔드포인트

문서 저장/로드/생성 및 AI 명령 처리

작성일: 2025-11-20
작성자: B팀 (Backend)
문서: SPARKLIO_EDITOR_PLAN_v1.1
"""

from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import logging

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.sparklio_document import SparklioDocument as SparklioDocumentModel
from app.schemas.sparklio_document import (
    SparklioDocumentCreate,
    SparklioDocumentUpdate,
    SparklioDocumentResponse,
    AICommand,
    AICommandResponse,
    DocumentConversionRequest,
    DocumentConversionResponse,
    DocumentExportRequest,
    DocumentExportResponse,
    DocumentTemplate,
    TemplateListResponse
)
from app.services.editor.document_service import DocumentService
from app.services.editor.ai_service import EditorAIService
from app.services.editor.conversion_service import ConversionService
from app.services.editor.export_service import ExportService
from app.services.editor.template_service import TemplateService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sparklio", tags=["Sparklio Editor"])


# ============================================================================
# Document CRUD Operations
# ============================================================================

@router.post("/documents", response_model=SparklioDocumentResponse)
async def create_document(
    document: SparklioDocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    새 문서 생성

    - title: 문서 제목
    - kind: 문서 종류 (concept_board, banner, slide, card_news, social_post)
    - pages: 페이지 목록 (선택사항)
    - aiPrompt: AI 생성 프롬프트 (선택사항)
    """
    try:
        doc_service = DocumentService(db)

        # AI 프롬프트가 있으면 AI로 생성
        if document.aiPrompt:
            ai_service = EditorAIService(db)
            return await ai_service.generate_document(
                prompt=document.aiPrompt,
                kind=document.kind,
                brand_id=document.brandId,
                user_id=current_user.id
            )

        # 일반 문서 생성
        return await doc_service.create_document(
            document_data=document,
            user_id=current_user.id
        )
    except Exception as e:
        logger.error(f"문서 생성 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"문서 생성 실패: {str(e)}"
        )


@router.get("/documents/{document_id}", response_model=SparklioDocumentResponse)
async def get_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """특정 문서 조회"""
    try:
        doc_service = DocumentService(db)
        document = await doc_service.get_document(
            document_id=document_id,
            user_id=current_user.id
        )

        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="문서를 찾을 수 없습니다"
            )

        return document
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"문서 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"문서 조회 실패: {str(e)}"
        )


@router.get("/documents", response_model=List[SparklioDocumentResponse])
async def list_documents(
    skip: int = 0,
    limit: int = 20,
    kind: Optional[str] = None,
    brand_id: Optional[UUID] = None,
    project_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """문서 목록 조회"""
    try:
        doc_service = DocumentService(db)
        return await doc_service.list_documents(
            user_id=current_user.id,
            skip=skip,
            limit=limit,
            kind=kind,
            brand_id=brand_id,
            project_id=project_id
        )
    except Exception as e:
        logger.error(f"문서 목록 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"문서 목록 조회 실패: {str(e)}"
        )


@router.put("/documents/{document_id}", response_model=SparklioDocumentResponse)
async def update_document(
    document_id: UUID,
    document: SparklioDocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """문서 업데이트 (저장)"""
    try:
        doc_service = DocumentService(db)
        updated_doc = await doc_service.update_document(
            document_id=document_id,
            document_data=document,
            user_id=current_user.id
        )

        if not updated_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="문서를 찾을 수 없습니다"
            )

        return updated_doc
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"문서 업데이트 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"문서 업데이트 실패: {str(e)}"
        )


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """문서 삭제"""
    try:
        doc_service = DocumentService(db)
        success = await doc_service.delete_document(
            document_id=document_id,
            user_id=current_user.id
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="문서를 찾을 수 없습니다"
            )

        return {"message": "문서가 삭제되었습니다"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"문서 삭제 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"문서 삭제 실패: {str(e)}"
        )


# ============================================================================
# AI Commands
# ============================================================================

@router.post("/ai/command", response_model=AICommandResponse)
async def process_ai_command(
    command: AICommand,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    AI 명령 처리

    - type: generate(생성), modify(수정), suggest(제안)
    - prompt: 사용자 명령
    - context: 현재 문서 컨텍스트
    - targetElementId: 수정할 요소 ID (modify 시)
    """
    try:
        ai_service = EditorAIService(db)

        if command.type == "generate":
            # 새 요소/페이지 생성
            result = await ai_service.generate_element(
                prompt=command.prompt,
                context=command.context,
                brand_id=command.brandId,
                user_id=current_user.id
            )
        elif command.type == "modify":
            # 기존 요소 수정
            result = await ai_service.modify_element(
                prompt=command.prompt,
                element_id=command.targetElementId,
                context=command.context,
                user_id=current_user.id
            )
        elif command.type == "suggest":
            # 제안 생성
            result = await ai_service.generate_suggestions(
                prompt=command.prompt,
                context=command.context,
                brand_id=command.brandId
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"지원하지 않는 명령 타입: {command.type}"
            )

        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI 명령 처리 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI 명령 처리 실패: {str(e)}"
        )


@router.post("/ai/generate", response_model=SparklioDocumentResponse)
async def generate_document_with_ai(
    prompt: str,
    kind: str,
    brand_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """AI로 새 문서 생성 (간편 API)"""
    try:
        ai_service = EditorAIService(db)
        return await ai_service.generate_document(
            prompt=prompt,
            kind=kind,
            brand_id=brand_id,
            user_id=current_user.id
        )
    except Exception as e:
        logger.error(f"AI 문서 생성 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI 문서 생성 실패: {str(e)}"
        )


# ============================================================================
# Document Conversion
# ============================================================================

@router.post("/convert", response_model=DocumentConversionResponse)
async def convert_document(
    request: DocumentConversionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    문서 형식 변환

    - sourceFormat: 원본 형식 (sparklio, polotno, layerhub, konva)
    - targetFormat: 대상 형식
    - data: 문서 데이터
    """
    try:
        conversion_service = ConversionService()
        result = await conversion_service.convert(
            source_format=request.sourceFormat,
            target_format=request.targetFormat,
            data=request.data
        )

        return DocumentConversionResponse(
            success=True,
            data=result
        )
    except Exception as e:
        logger.error(f"문서 변환 실패: {str(e)}")
        return DocumentConversionResponse(
            success=False,
            error=str(e)
        )


# ============================================================================
# Document Export
# ============================================================================

@router.post("/export", response_model=DocumentExportResponse)
async def export_document(
    request: DocumentExportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    문서 내보내기

    - format: 내보낼 형식 (pdf, png, jpg, svg, json)
    - pages: 내보낼 페이지 ID 목록 (선택사항)
    - quality: 이미지 품질 (1-100)
    - scale: 크기 배율 (0.1-10.0)
    """
    try:
        export_service = ExportService(db)

        # 백그라운드로 내보내기 작업 실행
        task_id = await export_service.start_export(
            document_id=request.documentId,
            format=request.format,
            pages=request.pages,
            quality=request.quality,
            scale=request.scale,
            user_id=current_user.id,
            background_tasks=background_tasks
        )

        return DocumentExportResponse(
            success=True,
            url=f"/api/v1/sparklio/export/{task_id}/status",
            data=None,
            error=None
        )
    except Exception as e:
        logger.error(f"문서 내보내기 실패: {str(e)}")
        return DocumentExportResponse(
            success=False,
            error=str(e)
        )


@router.get("/export/{task_id}/status")
async def get_export_status(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """내보내기 작업 상태 확인"""
    try:
        export_service = ExportService(db)
        status = await export_service.get_export_status(task_id)

        if not status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="내보내기 작업을 찾을 수 없습니다"
            )

        return status
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"내보내기 상태 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"내보내기 상태 조회 실패: {str(e)}"
        )


# ============================================================================
# Templates
# ============================================================================

@router.get("/templates", response_model=TemplateListResponse)
async def list_templates(
    kind: Optional[str] = None,
    category: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    """템플릿 목록 조회"""
    try:
        template_service = TemplateService(db)
        templates, total = await template_service.list_templates(
            kind=kind,
            category=category,
            page=page,
            page_size=page_size
        )

        return TemplateListResponse(
            templates=templates,
            total=total,
            page=page,
            pageSize=page_size
        )
    except Exception as e:
        logger.error(f"템플릿 목록 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"템플릿 목록 조회 실패: {str(e)}"
        )


@router.get("/templates/{template_id}", response_model=DocumentTemplate)
async def get_template(
    template_id: UUID,
    db: Session = Depends(get_db)
):
    """특정 템플릿 조회"""
    try:
        template_service = TemplateService(db)
        template = await template_service.get_template(template_id)

        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="템플릿을 찾을 수 없습니다"
            )

        return template
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"템플릿 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"템플릿 조회 실패: {str(e)}"
        )


@router.post("/templates/{template_id}/apply", response_model=SparklioDocumentResponse)
async def apply_template(
    template_id: UUID,
    title: str,
    brand_id: Optional[UUID] = None,
    project_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """템플릿을 적용하여 새 문서 생성"""
    try:
        template_service = TemplateService(db)
        document = await template_service.apply_template(
            template_id=template_id,
            title=title,
            brand_id=brand_id,
            project_id=project_id,
            user_id=current_user.id
        )

        return document
    except Exception as e:
        logger.error(f"템플릿 적용 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"템플릿 적용 실패: {str(e)}"
        )


# ============================================================================
# Auto-save
# ============================================================================

@router.post("/documents/{document_id}/autosave")
async def autosave_document(
    document_id: UUID,
    pages: List[dict],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """자동 저장 (페이지 데이터만 업데이트)"""
    try:
        doc_service = DocumentService(db)
        success = await doc_service.autosave(
            document_id=document_id,
            pages=pages,
            user_id=current_user.id
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="문서를 찾을 수 없습니다"
            )

        return {"message": "자동 저장 완료"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"자동 저장 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"자동 저장 실패: {str(e)}"
        )