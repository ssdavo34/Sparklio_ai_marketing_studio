"""
Orchestrator Base Classes

워크플로우 정의 및 실행 엔진

작성일: 2025-11-17
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from enum import Enum
import asyncio
import logging

from app.services.agents import AgentRequest, AgentResponse

logger = logging.getLogger(__name__)


class StepType(str, Enum):
    """워크플로우 스텝 타입"""
    SEQUENTIAL = "sequential"  # 순차 실행
    PARALLEL = "parallel"      # 병렬 실행


class WorkflowStep(BaseModel):
    """워크플로우 단일 스텝"""
    agent_name: str = Field(..., description="Agent 이름")
    task: str = Field(..., description="작업 유형")
    payload_template: Optional[Dict[str, Any]] = Field(
        None,
        description="페이로드 템플릿 (이전 결과 참조 가능)"
    )
    options: Optional[Dict[str, Any]] = Field(None, description="추가 옵션")


class WorkflowDefinition(BaseModel):
    """워크플로우 정의"""
    name: str = Field(..., description="워크플로우 이름")
    description: str = Field(..., description="워크플로우 설명")
    steps: List[WorkflowStep] = Field(..., description="실행 스텝 목록")
    step_type: StepType = Field(
        StepType.SEQUENTIAL,
        description="스텝 실행 방식"
    )


class WorkflowResult(BaseModel):
    """워크플로우 실행 결과"""
    workflow_name: str
    success: bool
    steps_completed: int
    total_steps: int
    results: List[AgentResponse] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    total_elapsed_seconds: float = 0.0


class WorkflowError(Exception):
    """워크플로우 실행 에러"""
    def __init__(self, message: str, step_index: int = -1):
        self.message = message
        self.step_index = step_index
        super().__init__(self.message)


class WorkflowExecutor:
    """워크플로우 실행 엔진"""

    def __init__(self):
        from app.services.agents import (
            get_copywriter_agent,
            get_strategist_agent,
            get_designer_agent,
            get_reviewer_agent,
            get_optimizer_agent,
            get_editor_agent
        )

        # Agent Factory 매핑
        self.agent_factories = {
            "copywriter": get_copywriter_agent,
            "strategist": get_strategist_agent,
            "designer": get_designer_agent,
            "reviewer": get_reviewer_agent,
            "optimizer": get_optimizer_agent,
            "editor": get_editor_agent
        }

    async def execute(
        self,
        workflow: WorkflowDefinition,
        initial_payload: Dict[str, Any]
    ) -> WorkflowResult:
        """
        워크플로우 실행

        Args:
            workflow: 워크플로우 정의
            initial_payload: 초기 입력 데이터

        Returns:
            WorkflowResult: 실행 결과
        """
        logger.info(f"Executing workflow: {workflow.name}")

        result = WorkflowResult(
            workflow_name=workflow.name,
            success=False,
            steps_completed=0,
            total_steps=len(workflow.steps)
        )

        # 실행 컨텍스트 (이전 결과 저장)
        context = {"initial": initial_payload}

        try:
            import time
            start_time = time.time()

            if workflow.step_type == StepType.SEQUENTIAL:
                # 순차 실행
                for idx, step in enumerate(workflow.steps):
                    step_result = await self._execute_step(step, context)
                    result.results.append(step_result)
                    result.steps_completed += 1

                    # 컨텍스트 업데이트
                    context[f"step_{idx}"] = step_result

            elif workflow.step_type == StepType.PARALLEL:
                # 병렬 실행
                tasks = [
                    self._execute_step(step, context)
                    for step in workflow.steps
                ]
                step_results = await asyncio.gather(*tasks, return_exceptions=True)

                for idx, step_result in enumerate(step_results):
                    if isinstance(step_result, Exception):
                        raise WorkflowError(
                            f"Step {idx} failed: {str(step_result)}",
                            step_index=idx
                        )
                    result.results.append(step_result)
                    result.steps_completed += 1

            result.total_elapsed_seconds = time.time() - start_time
            result.success = True

            logger.info(
                f"Workflow completed: {workflow.name}, "
                f"steps={result.steps_completed}/{result.total_steps}, "
                f"elapsed={result.total_elapsed_seconds:.2f}s"
            )

        except WorkflowError as e:
            logger.error(f"Workflow error: {e.message}", exc_info=True)
            result.errors.append(e.message)
            result.success = False

        except Exception as e:
            logger.error(f"Unexpected workflow error: {str(e)}", exc_info=True)
            result.errors.append(f"Unexpected error: {str(e)}")
            result.success = False

        return result

    async def _execute_step(
        self,
        step: WorkflowStep,
        context: Dict[str, Any]
    ) -> AgentResponse:
        """
        단일 스텝 실행

        Args:
            step: 워크플로우 스텝
            context: 실행 컨텍스트 (이전 결과)

        Returns:
            AgentResponse: Agent 실행 결과
        """
        # Agent 가져오기
        if step.agent_name not in self.agent_factories:
            raise WorkflowError(f"Unknown agent: {step.agent_name}")

        agent = self.agent_factories[step.agent_name]()

        # 페이로드 생성 (템플릿 기반)
        payload = self._build_payload(step.payload_template, context)

        # AgentRequest 생성
        request = AgentRequest(
            task=step.task,
            payload=payload,
            options=step.options or {}
        )

        logger.info(f"Executing step: {step.agent_name}.{step.task}")

        # Agent 실행
        response = await agent.execute(request)

        return response

    def _build_payload(
        self,
        template: Optional[Dict[str, Any]],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        페이로드 템플릿에서 실제 페이로드 생성

        템플릿에서 ${step_0.outputs[0].value.headline} 형태로 이전 결과 참조 가능

        Args:
            template: 페이로드 템플릿
            context: 실행 컨텍스트

        Returns:
            실제 페이로드
        """
        if template is None:
            return context.get("initial", {})

        # 간단한 템플릿 치환 (실제로는 더 정교한 구현 필요)
        import json
        import re

        payload_str = json.dumps(template)

        # ${...} 패턴 찾아서 치환
        def replace_var(match):
            var_path = match.group(1)
            try:
                # context에서 값 추출
                value = context
                for key in var_path.split('.'):
                    if '[' in key:
                        # 배열 인덱스 처리
                        key_name, index = key.split('[')
                        index = int(index.rstrip(']'))
                        value = value[key_name][index]
                    else:
                        value = value[key]
                # JSON 값으로 변환
                return json.dumps(value, ensure_ascii=False)
            except (KeyError, IndexError, TypeError):
                return match.group(0)  # 치환 실패 시 원본 유지

        # 템플릿에서 "${...}" 패턴을 찾아서 치환 (따옴표 포함)
        payload_str = re.sub(r'"\$\{([^}]+)\}"', replace_var, payload_str)

        return json.loads(payload_str)
