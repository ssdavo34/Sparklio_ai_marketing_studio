"""
인증 관련 유틸리티

JWT 토큰 검증 및 사용자 인증

작성일: 2025-11-21
작성자: B팀
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.models.user import User

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False  # Optional로 처리
)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    """
    현재 사용자 정보 조회

    Args:
        token: JWT 토큰

    Returns:
        User 객체

    Note:
        개발 환경에서는 token 없어도 Mock User 반환
        실제로는 JWT 토큰 검증 필요
    """
    # 개발 중 Mock User (token 없어도 반환)
    # TODO: 프로덕션에서는 JWT 토큰 검증 로직 추가
    mock_user = User(
        email="test@sparklio.ai",
        username="test_user",
        hashed_password="mock_password",
        full_name="Test User",
        is_active=True,
        role="user"
    )

    return mock_user


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[User]:
    """
    현재 사용자 정보 조회 (선택적)

    인증이 필수가 아닌 엔드포인트용

    Args:
        token: JWT 토큰

    Returns:
        User 객체 또는 None
    """
    return await get_current_user(token)


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    활성 사용자 확인

    Args:
        current_user: 현재 사용자

    Returns:
        활성 상태의 User 객체

    Raises:
        HTTPException: 사용자가 없거나 비활성 상태일 때
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )

    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    관리자 권한 확인

    Args:
        current_user: 현재 사용자

    Returns:
        관리자 권한을 가진 User 객체

    Raises:
        HTTPException: 관리자 권한이 없을 때
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    return current_user