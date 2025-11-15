"""
Template API 엔드포인트

Layout Template 조회, 관리 기능
SYSTEM_ARCHITECTURE.md 섹션 5.3.4 기반 구현
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import logging

from app.core.database import get_db
from app.models.user import User
from app.models.document import Template
from app.schemas.document import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    TemplateListResponse,
)
from app.auth.jwt import get_current_user, get_current_admin_user
from app.services.template_cache import TemplateCacheService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=TemplateListResponse)
async def list_templates(
    type: Optional[str] = Query(None, description="Template 유형 필터 (brand_kit, product_detail, sns)"),
    industry: Optional[str] = Query(None, description="산업 필터 (beauty, food, fashion)"),
    channel: Optional[str] = Query(None, description="채널 필터 (instagram, blog, youtube)"),
    status: Optional[str] = Query(default="approved", description="상태 필터 (draft, approved, rejected)"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Template 목록을 조회합니다.

    공개 API - 인증 불필요 (approved 템플릿만 조회 가능)

    Args:
        type: Template 유형 필터
        industry: 산업 분류 필터
        channel: 채널 분류 필터
        status: 상태 필터 (기본값: approved)
        skip: 건너뛸 레코드 수
        limit: 조회할 최대 레코드 수
        db: 데이터베이스 세션

    Returns:
        Template 목록
    """
    query = db.query(Template)

    # 상태 필터 (기본적으로 approved만)
    if status:
        query = query.filter(Template.status == status)

    # 유형 필터
    if type:
        query = query.filter(Template.type == type)

    # 산업 필터 (JSONB 배열 검색)
    if industry:
        query = query.filter(Template.industry.contains([industry]))

    # 채널 필터 (JSONB 배열 검색)
    if channel:
        query = query.filter(Template.channel.contains([channel]))

    total = query.count()
    templates = query.order_by(Template.created_at.desc()).offset(skip).limit(limit).all()

    return TemplateListResponse(
        templates=templates,
        total=total
    )


@router.get("/{templateId}", response_model=TemplateResponse)
async def get_template(
    templateId: str,
    db: Session = Depends(get_db)
):
    """
    특정 Template을 조회합니다.

    공개 API - 인증 불필요 (approved 템플릿만 조회 가능)
    Redis 캐싱 적용 - 1시간 TTL

    Args:
        templateId: Template ID
        db: 데이터베이스 세션

    Returns:
        Template 정보
    """
    # Redis 캐시 우선 조회
    template_data = TemplateCacheService.get_template(templateId, db)

    if not template_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found or not approved"
        )

    return template_data


# ========================================
# Admin APIs (관리자 전용)
# ========================================

@router.post("/", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: TemplateCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    새로운 Template을 생성합니다.

    Admin 전용 API

    Args:
        template_data: Template 생성 데이터
        current_user: 현재 인증된 관리자
        db: 데이터베이스 세션

    Returns:
        생성된 Template 정보
    """
    # Template ID 중복 확인
    existing = db.query(Template).filter(
        Template.template_id == template_data.template_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template ID already exists"
        )

    # Template 생성
    template = Template(**template_data.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)

    return template


@router.patch("/{templateId}", response_model=TemplateResponse)
async def update_template(
    templateId: str,
    template_data: TemplateUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Template을 수정합니다.

    Admin 전용 API

    Args:
        templateId: Template ID
        template_data: Template 수정 데이터
        current_user: 현재 인증된 관리자
        db: 데이터베이스 세션

    Returns:
        수정된 Template 정보
    """
    template = db.query(Template).filter(
        Template.template_id == templateId
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # 부분 업데이트
    update_data = template_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(template, key, value)

    db.commit()
    db.refresh(template)

    # 캐시 무효화
    TemplateCacheService.invalidate_template(templateId)
    logger.info(f"[Templates API] Cache invalidated for template_id={templateId}")

    return template


@router.delete("/{templateId}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    templateId: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Template을 삭제합니다.

    Admin 전용 API

    Args:
        templateId: Template ID
        current_user: 현재 인증된 관리자
        db: 데이터베이스 세션

    Returns:
        204 No Content
    """
    template = db.query(Template).filter(
        Template.template_id == templateId
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    db.delete(template)
    db.commit()

    # 캐시 무효화
    TemplateCacheService.invalidate_template(templateId)
    logger.info(f"[Templates API] Cache invalidated for deleted template_id={templateId}")

    return None


@router.post("/{templateId}/approve", response_model=TemplateResponse)
async def approve_template(
    templateId: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Template을 승인합니다.

    Admin 전용 API
    승인된 템플릿만 공개 API에서 조회 가능합니다.

    Args:
        templateId: Template ID
        current_user: 현재 인증된 관리자
        db: 데이터베이스 세션

    Returns:
        승인된 Template 정보
    """
    template = db.query(Template).filter(
        Template.template_id == templateId
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    template.status = "approved"
    db.commit()
    db.refresh(template)

    # 캐시 무효화 (승인 시 캐시 추가됨)
    TemplateCacheService.invalidate_template(templateId)
    logger.info(f"[Templates API] Cache invalidated for approved template_id={templateId}")

    return template


@router.post("/{templateId}/reject", response_model=TemplateResponse)
async def reject_template(
    templateId: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Template을 거부합니다.

    Admin 전용 API

    Args:
        templateId: Template ID
        current_user: 현재 인증된 관리자
        db: 데이터베이스 세션

    Returns:
        거부된 Template 정보
    """
    template = db.query(Template).filter(
        Template.template_id == templateId
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    template.status = "rejected"
    db.commit()
    db.refresh(template)

    # 캐시 무효화 (거부 시 캐시 제거)
    TemplateCacheService.invalidate_template(templateId)
    logger.info(f"[Templates API] Cache invalidated for rejected template_id={templateId}")

    return template
