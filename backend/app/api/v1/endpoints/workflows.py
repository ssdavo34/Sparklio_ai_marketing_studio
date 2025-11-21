"""
Workflow API Endpoints

워크플로우 실행 및 관리 API

작성일: 2025-11-22
작성자: B팀 (Backend)
"""

from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, Literal
import logging

from app.services.orchestrator.base import WorkflowExecutor, WorkflowResult, WorkflowError
from app.services.orchestrator.workflows import get_workflow, WORKFLOWS

router = APIRouter()
logger = logging.getLogger(__name__)


class WorkflowExecuteRequest(BaseModel):
    """워크플로우 실행 요청"""
    initial_payload: Dict[str, Any] = Field(..., description="초기 입력 데이터")

    class Config:
        json_schema_extra = {
            "example": {
                "initial_payload": {
                    "product_name": "스마트 워치 Pro",
                    "features": ["심박수 모니터링", "GPS"],
                    "target_audience": "운동을 즐기는 2040 남성"
                }
            }
        }


@router.get("/health")
async def workflow_health():
    """
    워크플로우 시스템 상태 확인

    Returns:
        dict: 시스템 상태
    """
    return {
        "status": "healthy",
        "available_workflows": len(WORKFLOWS),
        "workflow_names": list(WORKFLOWS.keys())
    }


@router.get("/list")
async def list_workflows():
    """
    사용 가능한 워크플로우 목록 조회

    Returns:
        dict: 워크플로우 목록 및 설명
    """
    workflows_info = []

    for name, workflow_class in WORKFLOWS.items():
        definition = workflow_class.get_definition()
        workflows_info.append({
            "name": name,
            "display_name": definition.name,
            "description": definition.description,
            "steps_count": len(definition.steps),
            "step_type": definition.step_type.value
        })

    return {
        "workflows": workflows_info,
        "total_count": len(workflows_info)
    }


@router.get("/{workflow_name}")
async def get_workflow_info(
    workflow_name: Literal[
        "product_content",
        "brand_identity",
        "content_review"
    ] = Path(..., description="워크플로우 이름")
):
    """
    특정 워크플로우 상세 정보 조회

    Args:
        workflow_name: 워크플로우 이름

    Returns:
        dict: 워크플로우 상세 정보
    """
    try:
        definition = get_workflow(workflow_name)

        return {
            "name": workflow_name,
            "display_name": definition.name,
            "description": definition.description,
            "step_type": definition.step_type.value,
            "steps": [
                {
                    "agent_name": step.agent_name,
                    "task": step.task,
                    "payload_template": step.payload_template,
                    "options": step.options
                }
                for step in definition.steps
            ],
            "steps_count": len(definition.steps)
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{workflow_name}/execute", response_model=WorkflowResult)
async def execute_workflow(
    workflow_name: Literal[
        "product_content",
        "brand_identity",
        "content_review"
    ] = Path(..., description="워크플로우 이름"),
    request: WorkflowExecuteRequest = ...
):
    """
    워크플로우 실행

    **사용 가능한 워크플로우**:
    - `product_content`: 제품 콘텐츠 생성 파이프라인
      - Copywriter → Reviewer → Optimizer
    - `brand_identity`: 브랜드 아이덴티티 수립 파이프라인
      - Strategist → Copywriter → Reviewer
    - `content_review`: 콘텐츠 검토 및 개선 파이프라인
      - Reviewer → Editor → Reviewer (재검토)

    Args:
        workflow_name: 실행할 워크플로우 이름
        request: 초기 입력 데이터

    Returns:
        WorkflowResult: 워크플로우 실행 결과
    """
    try:
        # 워크플로우 정의 가져오기
        workflow_definition = get_workflow(workflow_name)

        logger.info(f"Executing workflow: {workflow_name}")

        # WorkflowExecutor 생성 및 실행
        executor = WorkflowExecutor()
        result = await executor.execute(
            workflow=workflow_definition,
            initial_payload=request.initial_payload
        )

        logger.info(
            f"Workflow {workflow_name} completed: "
            f"success={result.success}, "
            f"steps={result.steps_completed}/{result.total_steps}, "
            f"elapsed={result.total_elapsed_seconds:.2f}s"
        )

        return result

    except ValueError as e:
        logger.error(f"Workflow not found: {workflow_name}")
        raise HTTPException(status_code=404, detail=str(e))

    except WorkflowError as e:
        logger.error(f"Workflow error: {e.message} at step {e.step_index}")
        raise HTTPException(
            status_code=400,
            detail=f"Workflow execution failed: {e.message}"
        )

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
