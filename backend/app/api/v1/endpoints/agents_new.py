"""
Agent API Endpoints (v2)

6개 Agent를 REST API로 노출

작성일: 2025-11-17
작성자: B팀 (Backend)
"""

from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel, Field
from typing import Literal, Dict, Any, Optional
import logging

from app.services.agents import (
    get_copywriter_agent,
    get_strategist_agent,
    get_designer_agent,
    get_reviewer_agent,
    get_optimizer_agent,
    get_editor_agent,
    get_meeting_ai_agent,
    AgentRequest,
    AgentResponse,
    AgentError
)

router = APIRouter()
logger = logging.getLogger(__name__)


# Agent Factory 매핑
AGENTS = {
    "copywriter": get_copywriter_agent,
    "strategist": get_strategist_agent,
    "designer": get_designer_agent,
    "reviewer": get_reviewer_agent,
    "optimizer": get_optimizer_agent,
    "editor": get_editor_agent,
    "meeting_ai": get_meeting_ai_agent
}


# Request Model (API용 - AgentRequest와 동일하지만 명시적으로 정의)
class AgentExecuteRequest(BaseModel):
    """Agent 실행 요청"""
    task: str = Field(..., description="작업 유형", example="product_detail")
    payload: Dict[str, Any] = Field(..., description="입력 데이터")
    options: Optional[Dict[str, Any]] = Field(None, description="추가 옵션")

    class Config:
        json_schema_extra = {
            "example": {
                "task": "product_detail",
                "payload": {
                    "product_name": "무선 이어폰",
                    "features": ["노이즈캔슬링", "24시간 배터리"],
                    "target_audience": "2030 직장인"
                },
                "options": {
                    "tone": "professional",
                    "length": "medium"
                }
            }
        }


@router.post("/{agent_name}/execute", response_model=AgentResponse)
async def execute_agent(
    agent_name: Literal[
        "copywriter",
        "strategist",
        "designer",
        "reviewer",
        "optimizer",
        "editor",
        "meeting_ai"
    ] = Path(..., description="Agent 이름"),
    request: AgentExecuteRequest = ...
):
    """
    Agent 실행

    6개 Agent 중 하나를 선택하여 작업 실행

    **사용 가능한 Agent**:
    - `copywriter`: 텍스트 콘텐츠 생성
    - `strategist`: 마케팅 전략 수립
    - `designer`: 비주얼 콘텐츠 생성
    - `reviewer`: 콘텐츠 품질 검토
    - `optimizer`: 콘텐츠 최적화
    - `editor`: 콘텐츠 편집/교정
    - `meeting_ai`: 회의록 분석 및 문서 초안 생성

    Returns:
        AgentResponse: Agent 실행 결과 (outputs, usage, meta)
    """
    try:
        # Agent Factory 가져오기
        if agent_name not in AGENTS:
            raise HTTPException(
                status_code=404,
                detail=f"Agent '{agent_name}' not found"
            )

        agent_factory = AGENTS[agent_name]
        agent = agent_factory()

        logger.info(f"Executing {agent_name} agent with task: {request.task}")

        # AgentRequest 생성
        agent_request = AgentRequest(
            task=request.task,
            payload=request.payload,
            options=request.options or {}
        )

        # Agent 실행
        response = await agent.execute(agent_request)

        logger.info(
            f"{agent_name} agent completed: "
            f"outputs={len(response.outputs)}, "
            f"elapsed={response.usage.get('elapsed_seconds', 0):.2f}s"
        )

        return response

    except AgentError as e:
        logger.error(f"Agent error: {e.message}", exc_info=True)
        raise HTTPException(
            status_code=400,
            detail=f"Agent execution failed: {e.message}"
        )

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/list")
async def list_agents():
    """
    사용 가능한 Agent 목록 조회

    Returns:
        dict: Agent 목록 및 설명
    """
    return {
        "agents": [
            {
                "name": "copywriter",
                "description": "텍스트 콘텐츠 생성 (제품 설명, SNS, 광고 카피 등)",
                "tasks": ["product_detail", "sns", "brand_message", "headline", "ad_copy"]
            },
            {
                "name": "strategist",
                "description": "마케팅 전략 수립 (브랜드 전략, 캠페인 기획 등)",
                "tasks": ["brand_kit", "campaign", "target_analysis", "positioning", "content_strategy"]
            },
            {
                "name": "designer",
                "description": "비주얼 콘텐츠 생성 (제품 이미지, 로고, 썸네일 등)",
                "tasks": ["product_image", "brand_logo", "sns_thumbnail", "ad_banner", "illustration"]
            },
            {
                "name": "reviewer",
                "description": "콘텐츠 품질 검토 (품질 평가, 피드백 제공)",
                "tasks": ["content_review", "copy_review", "brand_consistency", "grammar_check", "effectiveness_analysis"]
            },
            {
                "name": "optimizer",
                "description": "콘텐츠 최적화 (SEO, 전환율, 가독성 개선)",
                "tasks": ["seo_optimize", "conversion_optimize", "readability_improve", "length_adjust", "tone_adjust"]
            },
            {
                "name": "editor",
                "description": "콘텐츠 편집/교정 (교정, 재작성, 요약, 번역)",
                "tasks": ["proofread", "rewrite", "summarize", "expand", "translate", "generate_commands"]
            },
            {
                "name": "meeting_ai",
                "description": "회의록 분석 및 문서 초안 생성",
                "tasks": ["analyze_transcript", "generate_draft"]
            }
        ]
    }


@router.get("/{agent_name}/info")
async def get_agent_info(
    agent_name: Literal[
        "copywriter",
        "strategist",
        "designer",
        "reviewer",
        "optimizer",
        "editor",
        "meeting_ai"
    ] = Path(..., description="Agent 이름")
):
    """
    특정 Agent 정보 조회

    Args:
        agent_name: Agent 이름

    Returns:
        dict: Agent 상세 정보
    """
    # list에서 찾아서 반환
    agents_list = await list_agents()

    for agent_info in agents_list["agents"]:
        if agent_info["name"] == agent_name:
            return agent_info

    raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found")
