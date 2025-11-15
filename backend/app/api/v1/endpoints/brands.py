"""
Brand CRUD API 엔드포인트

브랜드 생성, 조회, 수정, 삭제 기능
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.user import User
from app.models.brand import Brand
from app.schemas.brand import BrandCreate, BrandUpdate, BrandResponse
from app.auth.jwt import get_current_user

router = APIRouter()


@router.post("/", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
async def create_brand(
    brand_data: BrandCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    새로운 브랜드를 생성합니다.

    Args:
        brand_data: 브랜드 생성 데이터
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        생성된 브랜드 정보
    """
    # slug 중복 확인
    existing_brand = db.query(Brand).filter(Brand.slug == brand_data.slug).first()
    if existing_brand:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Brand with slug '{brand_data.slug}' already exists"
        )

    # 브랜드 생성
    brand = Brand(
        **brand_data.model_dump(),
        owner_id=current_user.id
    )
    db.add(brand)
    db.commit()
    db.refresh(brand)

    return brand


@router.get("/", response_model=List[BrandResponse])
async def list_brands(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    사용자의 브랜드 목록을 조회합니다.

    Args:
        skip: 건너뛸 레코드 수
        limit: 조회할 최대 레코드 수
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        브랜드 목록
    """
    brands = db.query(Brand).filter(
        Brand.owner_id == current_user.id,
        Brand.deleted_at == None
    ).offset(skip).limit(limit).all()

    return brands


@router.get("/{brand_id}", response_model=BrandResponse)
async def get_brand(
    brand_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    특정 브랜드의 상세 정보를 조회합니다.

    Args:
        brand_id: 브랜드 ID
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        브랜드 상세 정보

    Raises:
        HTTPException: 브랜드를 찾을 수 없거나 권한이 없는 경우
    """
    brand = db.query(Brand).filter(
        Brand.id == brand_id,
        Brand.deleted_at == None
    ).first()

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )

    # 권한 확인 (소유자만 조회 가능)
    if brand.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    return brand


@router.patch("/{brand_id}", response_model=BrandResponse)
async def update_brand(
    brand_id: UUID,
    brand_data: BrandUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    브랜드 정보를 수정합니다.

    Args:
        brand_id: 브랜드 ID
        brand_data: 수정할 데이터
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        수정된 브랜드 정보

    Raises:
        HTTPException: 브랜드를 찾을 수 없거나 권한이 없는 경우
    """
    brand = db.query(Brand).filter(
        Brand.id == brand_id,
        Brand.deleted_at == None
    ).first()

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )

    # 권한 확인
    if brand.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # 수정
    update_data = brand_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(brand, key, value)

    db.commit()
    db.refresh(brand)

    return brand


@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brand(
    brand_id: UUID,
    hard_delete: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    브랜드를 삭제합니다 (기본: Soft Delete).

    Args:
        brand_id: 브랜드 ID
        hard_delete: True면 완전 삭제, False면 소프트 삭제
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Raises:
        HTTPException: 브랜드를 찾을 수 없거나 권한이 없는 경우
    """
    brand = db.query(Brand).filter(Brand.id == brand_id).first()

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )

    # 권한 확인
    if brand.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    if hard_delete:
        # 완전 삭제
        db.delete(brand)
    else:
        # 소프트 삭제
        from datetime import datetime
        brand.deleted_at = datetime.utcnow()

    db.commit()
