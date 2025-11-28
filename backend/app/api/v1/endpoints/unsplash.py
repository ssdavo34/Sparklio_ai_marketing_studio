"""
Unsplash API Proxy - 외부 이미지 검색 프록시

C팀 Photos Tab 지원을 위한 Unsplash API 프록시
- CORS 문제 해결
- API 키 보안 (서버 사이드에서만 관리)

작성일: 2025-11-28
작성자: B팀 (Backend)
"""

import logging
import httpx
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# Unsplash API 설정
UNSPLASH_API_URL = "https://api.unsplash.com"
UNSPLASH_ACCESS_KEY = getattr(settings, 'UNSPLASH_ACCESS_KEY', None)


# =============================================================================
# Response Schemas
# =============================================================================

class UnsplashUrls(BaseModel):
    """Unsplash 이미지 URL"""
    raw: str
    full: str
    regular: str
    small: str
    thumb: str


class UnsplashUser(BaseModel):
    """Unsplash 사용자"""
    id: str
    username: str
    name: str
    portfolio_url: Optional[str] = None
    profile_image: Optional[dict] = None


class UnsplashPhoto(BaseModel):
    """Unsplash 사진"""
    id: str
    width: int
    height: int
    color: Optional[str] = None
    blur_hash: Optional[str] = None
    description: Optional[str] = None
    alt_description: Optional[str] = None
    urls: UnsplashUrls
    user: UnsplashUser
    likes: int = 0
    created_at: Optional[str] = None


class SearchPhotosResponse(BaseModel):
    """사진 검색 응답"""
    total: int
    total_pages: int
    results: List[UnsplashPhoto]


class ListPhotosResponse(BaseModel):
    """사진 목록 응답"""
    photos: List[UnsplashPhoto]
    page: int
    per_page: int


# =============================================================================
# API Endpoints
# =============================================================================

@router.get("/search", response_model=SearchPhotosResponse)
async def search_photos(
    query: str = Query(..., min_length=1, description="검색어"),
    page: int = Query(1, ge=1, le=100, description="페이지 번호"),
    per_page: int = Query(20, ge=1, le=30, description="페이지당 결과 수"),
    orientation: Optional[str] = Query(None, description="방향 (landscape, portrait, squarish)"),
    color: Optional[str] = Query(None, description="색상 필터")
):
    """
    Unsplash 사진 검색

    Args:
        query: 검색어 (필수)
        page: 페이지 번호 (기본: 1)
        per_page: 페이지당 결과 수 (기본: 20, 최대: 30)
        orientation: 이미지 방향 필터
        color: 색상 필터

    Returns:
        검색 결과 목록
    """
    if not UNSPLASH_ACCESS_KEY:
        raise HTTPException(
            status_code=503,
            detail="Unsplash API key not configured"
        )

    params = {
        "query": query,
        "page": page,
        "per_page": per_page,
    }

    if orientation:
        params["orientation"] = orientation
    if color:
        params["color"] = color

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{UNSPLASH_API_URL}/search/photos",
                params=params,
                headers={
                    "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}",
                    "Accept-Version": "v1"
                },
                timeout=10.0
            )

            if response.status_code != 200:
                logger.error(f"Unsplash API error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Unsplash API error: {response.text}"
                )

            data = response.json()
            return SearchPhotosResponse(
                total=data.get("total", 0),
                total_pages=data.get("total_pages", 0),
                results=[UnsplashPhoto(**photo) for photo in data.get("results", [])]
            )

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Unsplash API timeout")
    except httpx.RequestError as e:
        logger.error(f"Unsplash request error: {e}")
        raise HTTPException(status_code=502, detail="Failed to connect to Unsplash API")


@router.get("/photos", response_model=ListPhotosResponse)
async def list_photos(
    page: int = Query(1, ge=1, le=100, description="페이지 번호"),
    per_page: int = Query(20, ge=1, le=30, description="페이지당 결과 수"),
    order_by: str = Query("popular", description="정렬 기준 (latest, popular)")
):
    """
    Unsplash 인기/최신 사진 목록

    Args:
        page: 페이지 번호
        per_page: 페이지당 결과 수
        order_by: 정렬 기준

    Returns:
        사진 목록
    """
    if not UNSPLASH_ACCESS_KEY:
        raise HTTPException(
            status_code=503,
            detail="Unsplash API key not configured"
        )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{UNSPLASH_API_URL}/photos",
                params={
                    "page": page,
                    "per_page": per_page,
                    "order_by": order_by
                },
                headers={
                    "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}",
                    "Accept-Version": "v1"
                },
                timeout=10.0
            )

            if response.status_code != 200:
                logger.error(f"Unsplash API error: {response.status_code}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Unsplash API error"
                )

            data = response.json()
            return ListPhotosResponse(
                photos=[UnsplashPhoto(**photo) for photo in data],
                page=page,
                per_page=per_page
            )

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Unsplash API timeout")
    except httpx.RequestError as e:
        logger.error(f"Unsplash request error: {e}")
        raise HTTPException(status_code=502, detail="Failed to connect to Unsplash API")


@router.get("/photos/{photo_id}")
async def get_photo(photo_id: str):
    """
    특정 사진 상세 정보

    Args:
        photo_id: Unsplash 사진 ID

    Returns:
        사진 상세 정보
    """
    if not UNSPLASH_ACCESS_KEY:
        raise HTTPException(
            status_code=503,
            detail="Unsplash API key not configured"
        )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{UNSPLASH_API_URL}/photos/{photo_id}",
                headers={
                    "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}",
                    "Accept-Version": "v1"
                },
                timeout=10.0
            )

            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Photo not found")

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Unsplash API error"
                )

            return response.json()

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Unsplash API timeout")
    except httpx.RequestError as e:
        logger.error(f"Unsplash request error: {e}")
        raise HTTPException(status_code=502, detail="Failed to connect to Unsplash API")


@router.get("/photos/{photo_id}/download")
async def track_download(photo_id: str):
    """
    다운로드 트래킹 (Unsplash 정책 준수)

    Unsplash 이미지를 사용할 때는 download 엔드포인트를
    호출해야 합니다 (Unsplash API 가이드라인).

    Args:
        photo_id: Unsplash 사진 ID

    Returns:
        다운로드 URL
    """
    if not UNSPLASH_ACCESS_KEY:
        raise HTTPException(
            status_code=503,
            detail="Unsplash API key not configured"
        )

    try:
        async with httpx.AsyncClient() as client:
            # 먼저 사진 정보를 가져와서 download_location URL을 얻음
            response = await client.get(
                f"{UNSPLASH_API_URL}/photos/{photo_id}",
                headers={
                    "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}",
                    "Accept-Version": "v1"
                },
                timeout=10.0
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to get photo info"
                )

            photo_data = response.json()
            download_location = photo_data.get("links", {}).get("download_location")

            if not download_location:
                raise HTTPException(status_code=404, detail="Download location not found")

            # download_location 호출하여 트래킹
            download_response = await client.get(
                download_location,
                headers={
                    "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}",
                    "Accept-Version": "v1"
                },
                timeout=10.0
            )

            if download_response.status_code != 200:
                logger.warning(f"Download tracking failed: {download_response.status_code}")

            return {
                "photo_id": photo_id,
                "download_url": photo_data.get("urls", {}).get("full"),
                "tracked": download_response.status_code == 200
            }

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Unsplash API timeout")
    except httpx.RequestError as e:
        logger.error(f"Unsplash request error: {e}")
        raise HTTPException(status_code=502, detail="Failed to connect to Unsplash API")


@router.get("/health")
async def health():
    """Unsplash API 헬스체크"""
    return {
        "status": "ok" if UNSPLASH_ACCESS_KEY else "no_api_key",
        "service": "unsplash-proxy",
        "api_configured": bool(UNSPLASH_ACCESS_KEY)
    }
