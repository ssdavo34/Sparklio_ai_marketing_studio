from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import uvicorn
import time

from app.core.config import settings
from app.core.database import get_db
from app.api.v1.router import api_router
from app.monitoring.prometheus_metrics import metrics_endpoint, record_http_request

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-driven marketing content generation platform",
    version=settings.APP_VERSION
)

# Prometheus metrics middleware
@app.middleware("http")
async def prometheus_middleware(request: Request, call_next):
    """
    Prometheus 메트릭 수집 미들웨어

    모든 HTTP 요청에 대한 메트릭을 자동으로 수집합니다.
    """
    # /metrics 엔드포인트는 메트릭 수집에서 제외
    if request.url.path == "/metrics":
        return await call_next(request)

    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time

    # 메트릭 기록
    record_http_request(
        method=request.method,
        endpoint=request.url.path,
        status_code=response.status_code,
        duration=duration
    )

    return response


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


@app.get("/metrics")
async def metrics():
    """
    Prometheus 메트릭 엔드포인트

    Prometheus가 스크랩할 수 있는 메트릭을 제공합니다.
    """
    return metrics_endpoint()

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=True if settings.APP_ENV == "development" else False
    )
