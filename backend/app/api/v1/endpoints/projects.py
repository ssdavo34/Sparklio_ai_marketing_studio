"""
Project CRUD API 엔드포인트

프로젝트 생성, 조회, 수정, 삭제 기능
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.brand import Brand
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.auth.jwt import get_current_user

router = APIRouter()


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    새로운 프로젝트를 생성합니다.

    Args:
        project_data: 프로젝트 생성 데이터
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        생성된 프로젝트 정보
    """
    # Brand 존재 여부 및 권한 확인
    brand = db.query(Brand).filter(
        Brand.id == project_data.brand_id,
        Brand.deleted_at == None
    ).first()

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )

    if brand.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to create project for this brand"
        )

    # 프로젝트 생성
    project = Project(
        **project_data.model_dump(),
        owner_id=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    return project


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    brand_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    프로젝트 목록을 조회합니다.

    Args:
        brand_id: 브랜드 ID (선택)
        skip: 건너뛸 레코드 수
        limit: 조회할 최대 레코드 수
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        프로젝트 목록
    """
    query = db.query(Project).filter(
        Project.owner_id == current_user.id,
        Project.deleted_at == None
    )

    if brand_id:
        query = query.filter(Project.brand_id == brand_id)

    projects = query.offset(skip).limit(limit).all()

    return projects


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    특정 프로젝트의 상세 정보를 조회합니다.

    Args:
        project_id: 프로젝트 ID
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        프로젝트 상세 정보
    """
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.deleted_at == None
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # 권한 확인
    if project.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    프로젝트 정보를 수정합니다.

    Args:
        project_id: 프로젝트 ID
        project_data: 수정할 데이터
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        수정된 프로젝트 정보
    """
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.deleted_at == None
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # 권한 확인
    if project.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # 수정
    update_data = project_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)

    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    hard_delete: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    프로젝트를 삭제합니다 (기본: Soft Delete).

    Args:
        project_id: 프로젝트 ID
        hard_delete: True면 완전 삭제, False면 소프트 삭제
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션
    """
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # 권한 확인
    if project.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    if hard_delete:
        db.delete(project)
    else:
        from datetime import datetime
        project.deleted_at = datetime.utcnow()

    db.commit()
