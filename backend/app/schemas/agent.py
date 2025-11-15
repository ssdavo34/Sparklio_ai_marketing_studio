"""
Agent Schemas

A2A (Agent-to-Agent) 프로토콜 스키마
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime
from uuid import UUID, uuid4


# ========================================
# A2A Protocol Schemas
# ========================================

class SystemContext(BaseModel):
    """
    시스템 컨텍스트

    Agent 실행에 필요한 공통 컨텍스트 정보
    """
    brand_id: Optional[str] = Field(None, description="브랜드 ID")
    project_id: Optional[str] = Field(None, description="프로젝트 ID")
    user_id: Optional[str] = Field(None, description="사용자 ID")
    task_type: str = Field(..., description="작업 유형 (strategy, copy, vision 등)")
    risk_level: str = Field(default="medium", description="리스크 레벨 (low, medium, high)")
    context_data: Optional[Dict[str, Any]] = Field(default={}, description="추가 컨텍스트 데이터")


class A2ARequest(BaseModel):
    """
    A2A 요청 스키마

    Agent 간 통신 시 사용하는 표준 요청 형식
    """
    request_id: str = Field(default_factory=lambda: str(uuid4()), description="요청 ID")
    source_agent: str = Field(..., description="요청 발신 Agent")
    target_agent: str = Field(..., description="요청 수신 Agent")
    system_context: SystemContext = Field(..., description="시스템 컨텍스트")
    payload: Dict[str, Any] = Field(..., description="요청 페이로드")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="생성 시각")

    class Config:
        json_schema_extra = {
            "example": {
                "request_id": "req-123e4567-e89b-12d3-a456-426614174000",
                "source_agent": "PMAgent",
                "target_agent": "StrategistAgent",
                "system_context": {
                    "brand_id": "brand-001",
                    "project_id": "proj-001",
                    "task_type": "strategy",
                    "risk_level": "medium"
                },
                "payload": {
                    "brief": {
                        "goal": "신제품 런칭 캠페인",
                        "target_audience": "20-30대 여성",
                        "budget": 5000000
                    }
                }
            }
        }


class A2AResponse(BaseModel):
    """
    A2A 응답 스키마

    Agent 간 통신 시 사용하는 표준 응답 형식
    """
    request_id: str = Field(..., description="원본 요청 ID")
    source_agent: str = Field(..., description="응답 발신 Agent")
    target_agent: str = Field(..., description="응답 수신 Agent")
    status: str = Field(..., description="처리 상태 (success, error, partial)")
    result: Dict[str, Any] = Field(..., description="처리 결과")
    error: Optional[str] = Field(None, description="에러 메시지")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="메타데이터")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="생성 시각")

    class Config:
        json_schema_extra = {
            "example": {
                "request_id": "req-123e4567-e89b-12d3-a456-426614174000",
                "source_agent": "StrategistAgent",
                "target_agent": "PMAgent",
                "status": "success",
                "result": {
                    "strategy": {
                        "channels": ["Instagram", "YouTube"],
                        "content_types": ["Video", "Carousel"],
                        "timeline": "3 months"
                    }
                },
                "metadata": {
                    "processing_time_ms": 1250,
                    "model_used": "qwen2.5:14b"
                }
            }
        }


# ========================================
# Agent-specific Schemas
# ========================================

class BriefRequest(BaseModel):
    """BriefAgent 요청"""
    user_input: str = Field(..., description="사용자 입력 텍스트")
    brand_id: str = Field(..., description="브랜드 ID")
    additional_context: Optional[Dict[str, Any]] = Field(default={}, description="추가 컨텍스트")


class BriefResponse(BaseModel):
    """BriefAgent 응답"""
    brief: Dict[str, Any] = Field(..., description="생성된 Brief")
    confidence: float = Field(..., description="신뢰도 (0.0 ~ 1.0)")


class StrategyRequest(BaseModel):
    """StrategistAgent 요청"""
    brief: Dict[str, Any] = Field(..., description="Brief")
    brand_kit: Optional[Dict[str, Any]] = Field(None, description="BrandKit")


class StrategyResponse(BaseModel):
    """StrategistAgent 응답"""
    strategy: Dict[str, Any] = Field(..., description="생성된 전략")
    channels: List[str] = Field(..., description="추천 채널")
    target_audience: Dict[str, Any] = Field(..., description="타겟 오디언스 분석")


class CopyRequest(BaseModel):
    """CopywriterAgent 요청"""
    brief: Dict[str, Any] = Field(..., description="Brief")
    strategy: Optional[Dict[str, Any]] = Field(None, description="전략")
    tone: str = Field(default="professional", description="톤 (professional, casual, friendly 등)")
    max_length: int = Field(default=500, description="최대 길이")


class CopyResponse(BaseModel):
    """CopywriterAgent 응답"""
    copy: str = Field(..., description="생성된 카피")
    variants: List[str] = Field(default=[], description="대안 카피")
    tone_score: float = Field(..., description="톤 매칭 점수 (0.0 ~ 1.0)")


class VisionRequest(BaseModel):
    """VisionGeneratorAgent 요청"""
    brief: Dict[str, Any] = Field(..., description="Brief")
    copy: Optional[str] = Field(None, description="카피 텍스트")
    style: str = Field(default="modern", description="스타일 (modern, vintage, minimal 등)")
    aspect_ratio: str = Field(default="1:1", description="가로세로 비율")


class VisionResponse(BaseModel):
    """VisionGeneratorAgent 응답"""
    image_url: str = Field(..., description="생성된 이미지 URL")
    prompt_used: str = Field(..., description="사용된 프롬프트")
    asset_id: str = Field(..., description="자산 ID (DB)")


class ReviewRequest(BaseModel):
    """ReviewerAgent 요청"""
    brief: Dict[str, Any] = Field(..., description="Brief")
    generated_content: Dict[str, Any] = Field(..., description="생성된 콘텐츠 (카피, 이미지 등)")
    content_type: str = Field(..., description="콘텐츠 유형 (copy, image, video)")


class ReviewResponse(BaseModel):
    """ReviewerAgent 응답"""
    score: float = Field(..., description="품질 점수 (0.0 ~ 1.0)")
    brief_alignment: float = Field(..., description="Brief 일치도 (0.0 ~ 1.0)")
    feedback: List[str] = Field(..., description="피드백 목록")
    approved: bool = Field(..., description="승인 여부")


# ========================================
# Workflow Schemas
# ========================================

class WorkflowNodeRequest(BaseModel):
    """Workflow Node 요청"""
    node_id: str = Field(..., description="노드 ID")
    agent_name: str = Field(..., description="실행할 Agent 이름")
    input_data: Dict[str, Any] = Field(..., description="입력 데이터")
    dependencies: List[str] = Field(default=[], description="의존 노드 ID 목록")


class WorkflowNodeResponse(BaseModel):
    """Workflow Node 응답"""
    node_id: str = Field(..., description="노드 ID")
    status: str = Field(..., description="상태 (pending, running, completed, failed)")
    output_data: Optional[Dict[str, Any]] = Field(None, description="출력 데이터")
    error: Optional[str] = Field(None, description="에러 메시지")
    started_at: Optional[datetime] = Field(None, description="시작 시각")
    completed_at: Optional[datetime] = Field(None, description="완료 시각")


class WorkflowCreateRequest(BaseModel):
    """Workflow 생성 요청"""
    project_id: str = Field(..., description="프로젝트 ID")
    workflow_type: str = Field(..., description="워크플로우 유형 (simple, complex)")
    nodes: List[WorkflowNodeRequest] = Field(..., description="노드 목록")


class WorkflowStatusResponse(BaseModel):
    """Workflow 상태 응답"""
    workflow_id: str = Field(..., description="워크플로우 ID")
    status: str = Field(..., description="전체 상태")
    progress: float = Field(..., description="진행률 (0.0 ~ 1.0)")
    nodes: List[WorkflowNodeResponse] = Field(..., description="노드 상태 목록")
    created_at: datetime = Field(..., description="생성 시각")
    updated_at: datetime = Field(..., description="업데이트 시각")
