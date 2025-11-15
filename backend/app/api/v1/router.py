from fastapi import APIRouter
from app.api.v1.endpoints import assets, brands, projects, users, agents, generate

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

# Agent API (내부 전용, Deprecated 예정)
api_router.include_router(
    agents.router,
    prefix="/agents",
    tags=["agents (deprecated)"]
)
