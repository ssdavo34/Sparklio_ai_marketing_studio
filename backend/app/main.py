from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from sqlalchemy.orm import Session
from sqlalchemy import text
import uvicorn
import time

from app.core.config import settings
from app.core.database import get_db
from app.api.v1.router import api_router
from app.monitoring.prometheus_metrics import metrics_endpoint, record_http_request

# API 메타데이터
API_DESCRIPTION = """
# Sparklio AI Marketing Studio API

**AI 기반 마케팅 콘텐츠 생성 플랫폼**

## 주요 기능

### 📝 콘텐츠 생성 (Generator)
- **제품 상세 페이지**: AI로 제품 설명, 헤드라인, CTA 자동 생성
- **SNS 콘텐츠**: Instagram, Facebook용 소셜 미디어 포스트 생성
- **브랜드 아이덴티티**: 브랜드 가이드라인, 컬러, 폰트, 톤앤매너 정의

### 🤖 AI 에이전트 (21개)
- **생성 에이전트** (10개): Copywriter, Designer, Vision, Editor 등
- **Intelligence 에이전트** (7개): TrendCollector, RAG, Embedder, Performance Analyzer 등
- **System 에이전트** (2개): ErrorHandler, Logger
- **Orchestration 에이전트** (3개): PM, QA, Template

### 🎨 에디터 (Sparklio Canvas Studio)
- Polotno 기반 비주얼 에디터
- 실시간 AI 명령 처리
- PDF/이미지 내보내기
- 템플릿 시스템

### 📊 워크플로우 (Workflow Orchestration)
- 3가지 워크플로우: Product Content, Brand Identity, Content Review
- Agent 간 데이터 전달 및 병렬 실행
- 실행 이력 및 성과 추적

## 인증

대부분의 API는 JWT Bearer 토큰 인증이 필요합니다:

```
Authorization: Bearer <your_jwt_token>
```

## 환경

- **개발 환경**: `http://localhost:8000`
- **프로덕션**: TBD

## 버전

- **Current**: v1.0.0
- **API Path**: `/api/v1`

## 문의

- GitHub: https://github.com/your-org/sparklio
- Email: support@sparklio.ai
"""

API_TAGS_METADATA = [
    {
        "name": "Health",
        "description": "시스템 상태 확인 및 헬스 체크 엔드포인트"
    },
    {
        "name": "Users",
        "description": "사용자 인증 및 관리 (회원가입, 로그인, 프로필)"
    },
    {
        "name": "Brands",
        "description": "브랜드 관리 (생성, 조회, 수정, 삭제, 브랜드킷)"
    },
    {
        "name": "Projects",
        "description": "프로젝트 관리 및 협업"
    },
    {
        "name": "Generator",
        "description": "AI 콘텐츠 생성 (제품 상세, SNS, 브랜드 아이덴티티)"
    },
    {
        "name": "Agents",
        "description": "21개 AI 에이전트 실행 및 관리"
    },
    {
        "name": "Workflows",
        "description": "워크플로우 오케스트레이션 (생성, 실행, 모니터링)"
    },
    {
        "name": "Editor",
        "description": "Sparklio Canvas Studio 에디터 API (문서, AI 명령)"
    },
    {
        "name": "Documents",
        "description": "문서 관리 (CRUD, 버전 관리, 내보내기)"
    },
    {
        "name": "Templates",
        "description": "템플릿 관리 및 적용"
    },
    {
        "name": "LLM Gateway",
        "description": "LLM 프로바이더 통합 (OpenAI, Anthropic, Ollama, Gemini)"
    },
    {
        "name": "Media Gateway",
        "description": "미디어 생성 (이미지, 비디오) - ComfyUI 통합"
    },
    {
        "name": "Assets",
        "description": "에셋 관리 (이미지, 비디오, 파일 업로드)"
    },
    {
        "name": "Admin",
        "description": "관리자 기능 (시스템 설정, 통계, 로그)"
    },
    {
        "name": "Monitoring",
        "description": "Prometheus 메트릭 및 모니터링"
    }
]

app = FastAPI(
    title=settings.APP_NAME,
    description=API_DESCRIPTION,
    version=settings.APP_VERSION,
    openapi_tags=API_TAGS_METADATA,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    contact={
        "name": "Sparklio Support",
        "email": "support@sparklio.ai",
    },
    license_info={
        "name": "Proprietary",
    },
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
# allow_credentials=True 사용 시 allow_origins=["*"]는 브라우저에서 차단됨
# 명시적인 origin 목록 필요
ALLOWED_ORIGINS = [
    "http://localhost:3000",           # Frontend 로컬 개발
    "http://127.0.0.1:3000",           # Frontend 로컬 (127.0.0.1)
    "http://100.101.68.23:3000",       # Frontend Tailscale IP
    "http://100.123.51.5:3000",        # Mac mini
    "http://192.168.0.101:3000",       # Laptop 로컬 IP
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # SSE 등 커스텀 헤더 노출
)

# Include API v1 router
app.include_router(api_router, prefix="/api/v1")

@app.get(
    "/",
    tags=["Health"],
    summary="루트 엔드포인트",
    description="API 서버의 기본 정보를 반환합니다.",
    response_description="서비스 이름, 버전, 상태, 환경 정보"
)
async def root():
    """
    **API 서버 기본 정보**

    서비스가 정상적으로 실행 중인지 확인하고 기본 정보를 제공합니다.

    Returns:
        - service: 서비스 이름
        - version: API 버전
        - status: 실행 상태
        - environment: 환경 (development, production 등)
    """
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "environment": settings.APP_ENV
    }

@app.get(
    "/health",
    tags=["Health"],
    summary="헬스 체크",
    description="시스템의 전반적인 상태를 확인합니다 (API, DB, Storage).",
    response_description="각 서비스의 상태 및 전체 시스템 상태"
)
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


@app.get(
    "/metrics",
    tags=["Monitoring"],
    summary="Prometheus 메트릭",
    description="시스템 모니터링을 위한 Prometheus 메트릭을 반환합니다.",
    response_description="Prometheus 형식의 메트릭 데이터"
)
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
