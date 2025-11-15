"""
Admin API 엔드포인트

관리자 전용 모니터링 및 관리 기능
SYSTEM_ARCHITECTURE.md Phase 4 기반 구현
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from app.core.database import get_db
from app.models.user import User
from app.models.document import GenerationJob, Template, Document
from app.auth.jwt import get_current_admin_user
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)


# ========================================
# Response Schemas
# ========================================

class AdminUserStats(BaseModel):
    """Admin Users 통계"""
    total_users: int
    active_users: int
    admin_users: int
    new_users_last_24h: int
    users: List[dict]


class AdminJobStats(BaseModel):
    """Admin Jobs 통계"""
    total_jobs: int
    completed_jobs: int
    failed_jobs: int
    running_jobs: int
    queued_jobs: int
    average_duration_ms: float
    jobs: List[dict]


class AdminAgentStats(BaseModel):
    """Admin Agents 통계"""
    total_agents: int
    agents_status: dict
    recent_executions: List[dict]


# ========================================
# Admin Users API
# ========================================

@router.get("/users", response_model=AdminUserStats)
async def get_admin_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    사용자 목록 및 통계 조회

    Admin 전용 API

    Args:
        skip: 건너뛸 레코드 수
        limit: 조회할 최대 레코드 수
        current_user: 현재 인증된 관리자
        db: 데이터베이스 세션

    Returns:
        사용자 통계 및 목록
    """
    # 전체 사용자 통계
    total_users = db.query(User).filter(User.deleted_at == None).count()
    active_users = db.query(User).filter(
        User.deleted_at == None,
        User.is_active == True
    ).count()
    admin_users = db.query(User).filter(
        User.deleted_at == None,
        User.role == "admin"
    ).count()

    # 최근 24시간 신규 가입자
    yesterday = datetime.utcnow() - timedelta(days=1)
    new_users_last_24h = db.query(User).filter(
        User.created_at >= yesterday
    ).count()

    # 사용자 목록
    users = db.query(User).filter(
        User.deleted_at == None
    ).order_by(desc(User.created_at)).offset(skip).limit(limit).all()

    users_list = [
        {
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at.isoformat(),
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None
        }
        for user in users
    ]

    return AdminUserStats(
        total_users=total_users,
        active_users=active_users,
        admin_users=admin_users,
        new_users_last_24h=new_users_last_24h,
        users=users_list
    )


# ========================================
# Admin Jobs API
# ========================================

@router.get("/jobs", response_model=AdminJobStats)
async def get_admin_jobs(
    status_filter: Optional[str] = Query(None, description="상태 필터 (queued, running, completed, failed)"),
    kind: Optional[str] = Query(None, description="Generator 유형 필터 (brand_kit, product_detail, sns)"),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Generation Job 목록 및 통계 조회

    Admin 전용 API

    Args:
        status_filter: 상태 필터
        kind: Generator 유형 필터
        skip: 건너뛸 레코드 수
        limit: 조회할 최대 레코드 수
        current_user: 현재 인증된 관리자
        db: 데이터베이스 세션

    Returns:
        Job 통계 및 목록
    """
    # 전체 Job 통계
    total_jobs = db.query(GenerationJob).count()
    completed_jobs = db.query(GenerationJob).filter(
        GenerationJob.status == "completed"
    ).count()
    failed_jobs = db.query(GenerationJob).filter(
        GenerationJob.status == "failed"
    ).count()
    running_jobs = db.query(GenerationJob).filter(
        GenerationJob.status == "running"
    ).count()
    queued_jobs = db.query(GenerationJob).filter(
        GenerationJob.status == "queued"
    ).count()

    # 평균 실행 시간 (완료된 Job만)
    avg_duration = db.query(func.avg(GenerationJob.duration_ms)).filter(
        GenerationJob.status == "completed",
        GenerationJob.duration_ms != None
    ).scalar()

    average_duration_ms = float(avg_duration) if avg_duration else 0.0

    # Job 목록 조회
    query = db.query(GenerationJob)

    if status_filter:
        query = query.filter(GenerationJob.status == status_filter)

    if kind:
        query = query.filter(GenerationJob.kind == kind)

    jobs = query.order_by(desc(GenerationJob.created_at)).offset(skip).limit(limit).all()

    jobs_list = [
        {
            "id": str(job.id),
            "task_id": job.task_id,
            "user_id": str(job.user_id) if job.user_id else None,
            "brand_id": str(job.brand_id) if job.brand_id else None,
            "kind": job.kind,
            "status": job.status,
            "duration_ms": job.duration_ms,
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            "error_message": job.error_message,
            "created_at": job.created_at.isoformat()
        }
        for job in jobs
    ]

    return AdminJobStats(
        total_jobs=total_jobs,
        completed_jobs=completed_jobs,
        failed_jobs=failed_jobs,
        running_jobs=running_jobs,
        queued_jobs=queued_jobs,
        average_duration_ms=average_duration_ms,
        jobs=jobs_list
    )


# ========================================
# Admin Agents Status API
# ========================================

@router.get("/agents", response_model=AdminAgentStats)
async def get_admin_agents(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Agent 상태 및 실행 이력 조회

    Admin 전용 API
    각 Agent의 최근 실행 이력 및 성공/실패 통계를 반환합니다.

    Args:
        current_user: 현재 인증된 관리자
        db: 데이터베이스 세션

    Returns:
        Agent 통계 및 최근 실행 이력
    """
    # Agent 목록 (실제로는 AgentLog 테이블에서 조회해야 하지만, 현재는 간단히 구현)
    agents = [
        "StrategistAgent",
        "CopywriterAgent",
        "ReviewerAgent",
        "BrandAgent",
        "DataFetcherAgent",
        "TemplateSelectorAgent",
        "LayoutDesignerAgent"
    ]

    # 최근 실행 이력 (GenerationJob의 agents_trace에서 추출)
    recent_jobs = db.query(GenerationJob).filter(
        GenerationJob.status == "completed"
    ).order_by(desc(GenerationJob.completed_at)).limit(50).all()

    recent_executions = []
    agents_status = {agent: {"total": 0, "success": 0, "failed": 0} for agent in agents}

    for job in recent_jobs:
        # result_data에서 agents_trace 추출
        if job.result_data and isinstance(job.result_data, dict):
            meta = job.result_data.get("meta", {})
            agents_trace = meta.get("agents_trace", [])

            for trace in agents_trace:
                agent_name = trace.get("agent", "")
                agent_status = trace.get("status", "")

                # Agent별 통계 업데이트
                if agent_name in agents_status:
                    agents_status[agent_name]["total"] += 1
                    if agent_status == "completed":
                        agents_status[agent_name]["success"] += 1
                    else:
                        agents_status[agent_name]["failed"] += 1

                # 최근 실행 이력 추가
                if len(recent_executions) < 20:
                    recent_executions.append({
                        "agent": agent_name,
                        "status": agent_status,
                        "task_id": job.task_id,
                        "kind": job.kind,
                        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
                        "metadata": trace.get("metadata", {})
                    })

    return AdminAgentStats(
        total_agents=len(agents),
        agents_status=agents_status,
        recent_executions=recent_executions
    )


# ========================================
# Admin System Health API
# ========================================

@router.get("/health")
async def get_admin_health(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    시스템 헬스 체크

    Admin 전용 API
    DB, Redis, MinIO 등 주요 서비스 상태를 반환합니다.

    Args:
        current_user: 현재 인증된 관리자
        db: 데이터베이스 세션

    Returns:
        시스템 헬스 상태
    """
    from app.core.redis_client import redis_client

    health_status = {
        "database": "unknown",
        "redis": "unknown",
        "timestamp": datetime.utcnow().isoformat()
    }

    # DB 연결 확인
    try:
        db.execute("SELECT 1")
        health_status["database"] = "healthy"
    except Exception as e:
        logger.error(f"[Admin Health] Database check failed: {e}")
        health_status["database"] = "unhealthy"

    # Redis 연결 확인
    try:
        if redis_client.ping():
            health_status["redis"] = "healthy"
        else:
            health_status["redis"] = "unhealthy"
    except Exception as e:
        logger.error(f"[Admin Health] Redis check failed: {e}")
        health_status["redis"] = "unhealthy"

    return health_status


# ========================================
# Admin Statistics Dashboard API
# ========================================

@router.get("/dashboard")
async def get_admin_dashboard(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Admin 대시보드 통계

    Admin 전용 API
    전체 시스템 통계를 한 번에 조회합니다.

    Args:
        current_user: 현재 인증된 관리자
        db: 데이터베이스 세션

    Returns:
        대시보드 통계
    """
    # 사용자 통계
    total_users = db.query(User).filter(User.deleted_at == None).count()
    active_users = db.query(User).filter(
        User.deleted_at == None,
        User.is_active == True
    ).count()

    # Job 통계
    total_jobs = db.query(GenerationJob).count()
    completed_jobs = db.query(GenerationJob).filter(
        GenerationJob.status == "completed"
    ).count()
    failed_jobs = db.query(GenerationJob).filter(
        GenerationJob.status == "failed"
    ).count()

    # Document 통계
    total_documents = db.query(Document).count()

    # Template 통계
    total_templates = db.query(Template).count()
    approved_templates = db.query(Template).filter(
        Template.status == "approved"
    ).count()

    # 최근 24시간 통계
    yesterday = datetime.utcnow() - timedelta(days=1)
    jobs_last_24h = db.query(GenerationJob).filter(
        GenerationJob.created_at >= yesterday
    ).count()

    return {
        "users": {
            "total": total_users,
            "active": active_users
        },
        "jobs": {
            "total": total_jobs,
            "completed": completed_jobs,
            "failed": failed_jobs,
            "last_24h": jobs_last_24h
        },
        "documents": {
            "total": total_documents
        },
        "templates": {
            "total": total_templates,
            "approved": approved_templates
        },
        "timestamp": datetime.utcnow().isoformat()
    }
