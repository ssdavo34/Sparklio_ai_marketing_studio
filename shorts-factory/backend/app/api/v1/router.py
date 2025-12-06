"""
API v1 Router

모든 v1 엔드포인트 통합
"""

from fastapi import APIRouter

from app.api.v1.endpoints import videos, audio

api_router = APIRouter()

api_router.include_router(
    videos.router,
    prefix="/videos",
    tags=["videos"]
)

api_router.include_router(
    audio.router,
    prefix="/audio",
    tags=["audio"]
)
