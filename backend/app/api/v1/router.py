from fastapi import APIRouter
from app.api.v1.endpoints import (
    assets, brands, projects, users, agents_new,
    generate, documents, templates, editor, admin,
    llm_gateway, media_gateway, debug
)
# agents (legacy) - Deprecated, import 에러로 주석 처리

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(
    assets.router,
    prefix="/assets",
    tags=["assets"]
)

api_router.include_router(
    brands.router,
    prefix="/brands",
    tags=["brands"]
)

api_router.include_router(
    projects.router,
    prefix="/projects",
    tags=["projects"]
)

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["users"]
)

# 통합 Generator API (공식 외부 API)
api_router.include_router(
    generate.router,
    prefix="",
    tags=["generate"]
)

# Document API (Editor Document 저장/로드)
api_router.include_router(
    documents.router,
    prefix="/documents",
    tags=["documents"]
)

# Template API (Layout Template 조회/관리)
api_router.include_router(
    templates.router,
    prefix="/templates",
    tags=["templates"]
)

# Editor Action API (Document Action 처리)
api_router.include_router(
    editor.router,
    prefix="/editor",
    tags=["editor"]
)

# Admin API (관리자 전용 모니터링)
api_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["admin"]
)

# LLM Gateway API (신규 - Phase 1-2)
api_router.include_router(
    llm_gateway.router,
    prefix="/llm",
    tags=["llm-gateway"]
)

# Media Gateway API (신규 - Phase 1-4)
api_router.include_router(
    media_gateway.router,
    prefix="/media",
    tags=["media-gateway"]
)

# Agent API v2 (신규 - Phase 2-2)
api_router.include_router(
    agents_new.router,
    prefix="/agents",
    tags=["agents-v2"]
)

# Agent API v1 (내부 전용, Deprecated - import 에러로 비활성화)
# api_router.include_router(
#     agents.router,
#     prefix="/agents-v1",
#     tags=["agents-v1 (deprecated)"]
# )

# Debug API (개발/디버깅용)
api_router.include_router(
    debug.router,
    prefix="/debug",
    tags=["debug"]
)
