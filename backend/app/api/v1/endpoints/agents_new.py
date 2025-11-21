"""
Agent API Endpoints (v2)

21개 Agent를 REST API로 노출

작성일: 2025-11-17
업데이트: 2025-11-22 (21개 Agent로 확장)
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
    get_vision_analyzer_agent,
    get_scene_planner_agent,
    create_template_agent,
    create_pm_agent,
    create_qa_agent,
    get_trend_collector_agent,
    get_data_cleaner_agent,
    create_embedder_agent,
    create_rag_agent,
    create_ingestor_agent,
    create_performance_analyzer_agent,
    create_self_learning_agent,
    create_error_handler_agent,
    create_logger_agent,
    AgentRequest,
    AgentResponse,
    AgentError
)

router = APIRouter()
logger = logging.getLogger(__name__)


# Agent Factory 매핑
AGENTS = {
    # Creation Agents
    "copywriter": get_copywriter_agent,
    "strategist": get_strategist_agent,
    "designer": get_designer_agent,
    "reviewer": get_reviewer_agent,
    "optimizer": get_optimizer_agent,
    "editor": get_editor_agent,
    "meeting_ai": get_meeting_ai_agent,
    "vision_analyzer": get_vision_analyzer_agent,
    "scene_planner": get_scene_planner_agent,
    "template": create_template_agent,
    # System Agents
    "pm": create_pm_agent,
    "qa": create_qa_agent,
    "error_handler": create_error_handler_agent,
    "logger": create_logger_agent,
    # Intelligence Agents
    "trend_collector": get_trend_collector_agent,
    "data_cleaner": get_data_cleaner_agent,
    "embedder": create_embedder_agent,
    "rag": create_rag_agent,
    "ingestor": create_ingestor_agent,
    "performance_analyzer": create_performance_analyzer_agent,
    "self_learning": create_self_learning_agent
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
        # Creation Agents
        "copywriter",
        "strategist",
        "designer",
        "reviewer",
        "optimizer",
        "editor",
        "meeting_ai",
        "vision_analyzer",
        "scene_planner",
        "template",
        # System Agents
        "pm",
        "qa",
        "error_handler",
        "logger",
        # Intelligence Agents
        "trend_collector",
        "data_cleaner",
        "embedder",
        "rag",
        "ingestor",
        "performance_analyzer",
        "self_learning"
    ] = Path(..., description="Agent 이름"),
    request: AgentExecuteRequest = ...
):
    """
    Agent 실행

    21개 Agent 중 하나를 선택하여 작업 실행

    **Creation Agents (10개)**:
    - `copywriter`: 텍스트 콘텐츠 생성
    - `strategist`: 마케팅 전략 수립
    - `designer`: 비주얼 콘텐츠 생성
    - `reviewer`: 콘텐츠 품질 검토
    - `optimizer`: 콘텐츠 최적화
    - `editor`: 콘텐츠 편집/교정
    - `meeting_ai`: 회의록 분석 및 문서 초안 생성
    - `vision_analyzer`: 이미지 분석 및 설명 생성
    - `scene_planner`: 영상 씬 구성 및 스토리보드 생성
    - `template`: 마케팅 템플릿 자동 생성

    **System Agents (4개)**:
    - `pm`: 워크플로우 조율 및 태스크 분배
    - `qa`: 품질 검증 및 테스트
    - `error_handler`: 에러 감지 및 복구
    - `logger`: 로깅 및 모니터링

    **Intelligence Agents (7개)**:
    - `trend_collector`: 트렌드 데이터 수집
    - `data_cleaner`: 데이터 정제
    - `embedder`: 벡터 임베딩 생성
    - `rag`: 검색 증강 생성
    - `ingestor`: 데이터 저장 관리
    - `performance_analyzer`: 성과 분석
    - `self_learning`: 자기 학습

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
            },
            {
                "name": "vision_analyzer",
                "description": "이미지 분석 및 설명 생성 (이미지 해석, 대체 텍스트 생성)",
                "tasks": ["analyze_image", "generate_description", "extract_text", "detect_objects", "assess_quality"]
            },
            {
                "name": "scene_planner",
                "description": "영상 씬 구성 및 스토리보드 생성 (광고 영상, 쇼츠)",
                "tasks": ["scene_plan", "storyboard", "optimize_timing", "suggest_transitions", "emotion_arc"]
            },
            {
                "name": "template",
                "description": "마케팅 템플릿 자동 생성 (산업군/채널/목적별 템플릿)",
                "tasks": ["generate_template", "list_templates", "customize_template", "apply_template", "get_template"]
            },
            {
                "name": "pm",
                "description": "워크플로우 조율 및 태스크 분배 (프로젝트 관리)",
                "tasks": ["plan_workflow", "assign_tasks", "monitor_progress", "coordinate_agents", "optimize_workflow"]
            },
            {
                "name": "qa",
                "description": "품질 검증 및 테스트 (콘텐츠 품질 검사, 브랜드 가이드라인 준수)",
                "tasks": ["quality_check", "brand_compliance", "grammar_check", "seo_validation", "accessibility_check"]
            },
            {
                "name": "error_handler",
                "description": "에러 감지 및 복구 (자동 재시도, 폴백 처리)",
                "tasks": ["detect_error", "recover", "retry", "fallback", "log_error"]
            },
            {
                "name": "logger",
                "description": "로깅 및 모니터링 (이벤트 로깅, 메트릭 수집)",
                "tasks": ["log_event", "track_metric", "monitor_performance", "generate_report", "alert"]
            },
            {
                "name": "trend_collector",
                "description": "트렌드 데이터 수집 (소셜미디어, 검색 트렌드)",
                "tasks": ["collect_trends", "analyze_keywords", "track_hashtags", "monitor_competitors", "identify_emerging"]
            },
            {
                "name": "data_cleaner",
                "description": "데이터 정제 (중복 제거, 정규화, 검증)",
                "tasks": ["remove_duplicates", "normalize", "validate", "sanitize", "transform"]
            },
            {
                "name": "embedder",
                "description": "벡터 임베딩 생성 (텍스트/이미지 임베딩)",
                "tasks": ["embed_text", "embed_image", "batch_embed", "similarity_search", "cluster"]
            },
            {
                "name": "rag",
                "description": "검색 증강 생성 (RAG - 문서 검색 + LLM 생성)",
                "tasks": ["search_and_generate", "retrieve_context", "answer_question", "summarize_docs", "fact_check"]
            },
            {
                "name": "ingestor",
                "description": "데이터 저장 관리 (벡터 DB, 문서 저장)",
                "tasks": ["ingest_documents", "store_embeddings", "index_data", "update_storage", "delete_data"]
            },
            {
                "name": "performance_analyzer",
                "description": "성과 분석 (캠페인 성과, ROI 분석)",
                "tasks": ["analyze_campaign", "calculate_roi", "track_kpi", "compare_performance", "predict_trends"]
            },
            {
                "name": "self_learning",
                "description": "자기 학습 (피드백 학습, 모델 개선)",
                "tasks": ["learn_from_feedback", "update_model", "improve_accuracy", "adapt_strategy", "optimize_params"]
            }
        ]
    }


@router.get("/{agent_name}/info")
async def get_agent_info(
    agent_name: Literal[
        # Creation Agents
        "copywriter",
        "strategist",
        "designer",
        "reviewer",
        "optimizer",
        "editor",
        "meeting_ai",
        "vision_analyzer",
        "scene_planner",
        "template",
        # System Agents
        "pm",
        "qa",
        "error_handler",
        "logger",
        # Intelligence Agents
        "trend_collector",
        "data_cleaner",
        "embedder",
        "rag",
        "ingestor",
        "performance_analyzer",
        "self_learning"
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
