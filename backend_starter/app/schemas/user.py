"""
User Pydantic 스키마

사용자 관련 요청/응답 스키마 정의
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    """사용자 기본 스키마"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    full_name: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    """사용자 생성 스키마"""
    password: str = Field(..., min_length=8, max_length=100)


class UserUpdate(BaseModel):
    """사용자 수정 스키마"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8, max_length=100)


class UserResponse(UserBase):
    """사용자 응답 스키마"""
    id: UUID
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """사용자 로그인 스키마"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """토큰 응답 스키마"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
