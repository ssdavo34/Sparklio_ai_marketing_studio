from fastapi import APIRouter
from app.api.v1 import chat, admin
from app.api.v1.endpoints import (
    assets, brands, projects, users, agents_new,
    generate, documents, templates, editor,
    llm_gateway, media_gateway, debug,
    sparklio_editor,  # Sparklio Editor API 추가
    workflows,  # Workflow Orchestration API 추가
    meetings,  # Meeting AI API (P0-2)
    generators  # Multi-Channel Generators API (P1)
)
# agents (legacy) - Deprecated, import 에러로 주석 처리

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(
    assets.router,
    prefix="/assets",
    tags=["Assets"]
)

api_router.include_router(
    brands.router,
    prefix="/brands",
    tags=["Brands"]
)

api_router.include_router(
    projects.router,
    prefix="/projects",
    tags=["Projects"]
)

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["Users"]
)

# 통합 Generator API (공식 외부 API)
api_router.include_router(
    generate.router,
    prefix="",
    tags=["Generator"]
)

# Document API (Editor Document 저장/로드)
api_router.include_router(
    documents.router,
    prefix="/documents",
    tags=["Documents"]
)

# Template API (Layout Template 조회/관리)
api_router.include_router(
    templates.router,
    prefix="/templates",
    tags=["Templates"]
)

# Editor Action API (Document Action 처리)
api_router.include_router(
    editor.router,
    prefix="/editor",
    tags=["Editor"]
)

# Sparklio Editor API (신규 Editor API - C팀 지원)
api_router.include_router(
    sparklio_editor.router,
    prefix="/sparklio",
    tags=["Editor"]
)

# LLM Gateway API (신규 - Phase 1-2)
api_router.include_router(
    llm_gateway.router,
    prefix="/llm",
    tags=["LLM Gateway"]
)

# Media Gateway API (신규 - Phase 1-4)
api_router.include_router(
    media_gateway.router,
    prefix="/media",
    tags=["Media Gateway"]
)

# Agent API v2 (신규 - Phase 2-2)
api_router.include_router(
    agents_new.router,
    prefix="/agents",
    tags=["Agents"]
)

# Workflow Orchestration API (신규 - Phase 3)
api_router.include_router(
    workflows.router,
    prefix="/workflows",
    tags=["Workflows"]
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
    tags=["Admin"]
)

# Chat API (Phase 2)
api_router.include_router(chat.router, prefix="/chat", tags=["Editor"])

# Meeting AI API (P0-2 - Week 1)
api_router.include_router(meetings.router, prefix="", tags=["Meetings"])

# Multi-Channel Generators API (P1)
api_router.include_router(generators.router, prefix="/generators", tags=["Generators"])

# Admin API (관리자 전용 모니터링)
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
