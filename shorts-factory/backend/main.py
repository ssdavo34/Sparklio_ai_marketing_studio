"""
Shorts Factory - Main Application

숏폼 영상 생성 플랫폼 API 서버

작성일: 2025-12-06

실행:
    uvicorn main:app --host 0.0.0.0 --port 8001 --reload

서버 정보:
    - Mac mini (100.123.51.5): PostgreSQL, Redis, MinIO
    - Desktop GPU (100.120.180.42): ComfyUI, HunyuanVideo, Whisper
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작/종료 시 실행"""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"ComfyUI: {settings.comfyui_base_url}")
    logger.info(f"Whisper: {settings.whisper_endpoint}")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="숏폼 영상 생성 플랫폼 API",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",  # Shorts Factory Frontend
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """헬스 체크"""
    from app.services.media.providers import get_hunyuan_provider
    from app.services.audio import get_whisper_service
    from app.integrations import get_comfyui_client

    # ComfyUI 상태
    comfyui_client = get_comfyui_client()
    comfyui_ok = await comfyui_client.health_check()

    # Whisper 상태
    whisper_service = get_whisper_service()
    whisper_ok = await whisper_service.health_check()

    return {
        "status": "healthy" if (comfyui_ok and whisper_ok) else "degraded",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "components": {
            "comfyui": "ok" if comfyui_ok else "unavailable",
            "whisper": "ok" if whisper_ok else "unavailable",
            "edge_tts": "ok"
        },
        "config": {
            "comfyui_url": settings.comfyui_base_url,
            "whisper_url": settings.whisper_endpoint,
            "video_mode": settings.video_mode
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=True
    )
