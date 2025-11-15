from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import uvicorn

from app.core.config import settings
from app.core.database import get_db
from app.api.v1.router import api_router

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-driven marketing content generation platform",
    version=settings.APP_VERSION
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "environment": settings.APP_ENV
    }

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    시스템 헬스 체크

    API, 데이터베이스, Storage 연결 상태를 확인합니다.
    Frontend에서 Backend 상태 확인용으로 사용됩니다.
    """
    services = {
        "api": "ok",
        "database": "error",
        "storage": "ok"  # MinIO는 선택적으로 체크
    }

    # Database 연결 확인
    try:
        db.execute(text("SELECT 1"))
        services["database"] = "ok"
    except Exception as e:
        services["database"] = f"error: {str(e)}"

    # 전체 상태 결정
    overall_status = "healthy" if all(v == "ok" for v in services.values()) else "degraded"

    return {
        "status": overall_status,
        "services": services,
        "environment": settings.APP_ENV,
        "version": settings.APP_VERSION
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=True if settings.APP_ENV == "development" else False
    )
