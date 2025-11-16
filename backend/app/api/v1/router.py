from fastapi import APIRouter
from app.api.v1.endpoints import assets, brands, projects, users, agents, generate, documents, templates, editor, admin, llm_gateway

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
    prefix="",
    tags=["llm-gateway"]
)

# Agent API (내부 전용, Deprecated 예정)
api_router.include_router(
    agents.router,
    prefix="/agents",
    tags=["agents (deprecated)"]
)
