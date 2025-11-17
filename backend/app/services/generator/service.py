"""
Generator Service

WorkflowExecutor + Agent를 사용한 콘텐츠 생성 서비스

작성일: 2025-11-17
"""

from typing import Dict, Any
import logging
import uuid

from app.schemas.generator import (
    GenerateRequest,
    GenerateResponse,
    DocumentPayload,
    TextPayload
)
from app.services.orchestrator.base import WorkflowExecutor
from app.services.orchestrator.workflows import (
    ProductContentWorkflow,
    BrandIdentityWorkflow,
    ContentReviewWorkflow
)

logger = logging.getLogger(__name__)


class GeneratorService:
    """
    Generator Service

    kind에 따라 적절한 워크플로우를 실행하고
    프론트엔드에 맞는 형태로 응답 변환
    """

    def __init__(self):
        self.executor = WorkflowExecutor()

        # kind → Workflow 매핑
        self.workflow_map = {
            "product_detail": ProductContentWorkflow,
            "sns_set": ProductContentWorkflow,  # 초기엔 같은 워크플로우
            "presentation_simple": ProductContentWorkflow,  # 초기엔 같은 워크플로우
            "brand_identity": BrandIdentityWorkflow,
            "content_review": ContentReviewWorkflow
        }

    async def generate(self, req: GenerateRequest) -> GenerateResponse:
        """
        콘텐츠 생성

        Args:
            req: GenerateRequest (kind, brandId, input, options)

        Returns:
            GenerateResponse: document + text + meta

        Raises:
            ValueError: 지원하지 않는 kind
            RuntimeError: 워크플로우 실행 실패
        """
        logger.info(
            f"Generator 시작: kind={req.kind}, brandId={req.brandId}"
        )

        # 1. Workflow 선택
        workflow_cls = self.workflow_map.get(req.kind)
        if not workflow_cls:
            available_kinds = list(self.workflow_map.keys())
            raise ValueError(
                f"지원하지 않는 kind: {req.kind}. "
                f"사용 가능: {available_kinds}"
            )

        # 2. Workflow 실행
        workflow_def = workflow_cls.get_definition()

        # input을 initial_payload로 변환
        initial_payload = {
            **req.input,
            "brand_id": req.brandId,
            **(req.options or {})
        }

        result = await self.executor.execute(
            workflow=workflow_def,
            initial_payload=initial_payload
        )

        if not result.success:
            error_msg = ", ".join(result.errors)
            raise RuntimeError(
                f"워크플로우 실행 실패: {error_msg}"
            )

        # 3. 응답 변환 (AgentResponse → GenerateResponse)
        return self._build_response(req.kind, result)

    def _build_response(
        self,
        kind: str,
        workflow_result
    ) -> GenerateResponse:
        """
        WorkflowResult를 GenerateResponse로 변환

        Args:
            kind: 생성 타입
            workflow_result: WorkflowResult

        Returns:
            GenerateResponse
        """
        # Document ID 생성
        doc_id = f"doc_{uuid.uuid4().hex[:12]}"

        # 마지막 Agent 결과에서 텍스트 추출
        last_result = workflow_result.results[-1] if workflow_result.results else None  # noqa: E501

        text_data = {}
        canvas_data = {"version": "5.3.0", "objects": []}

        if last_result and last_result.outputs:
            # outputs에서 텍스트 추출
            for output in last_result.outputs:
                if output.type == "json" and isinstance(output.value, dict):
                    text_data.update(output.value)
                elif output.type == "text":
                    text_data["body"] = output.value

        # TextPayload 생성
        text = TextPayload(
            headline=text_data.get("headline"),
            subheadline=text_data.get("subheadline"),
            body=text_data.get("body"),
            bullets=text_data.get("bullets") or text_data.get("features"),
            cta=text_data.get("cta")
        )

        # DocumentPayload 생성 (향후 Canvas 통합)
        document = DocumentPayload(
            documentId=doc_id,
            type=kind,
            canvas_json=canvas_data
        )

        # Meta 정보
        meta = {
            "workflow": workflow_result.workflow_name,
            "agents_used": [
                r.agent for r in workflow_result.results
            ],
            "elapsed_seconds": workflow_result.total_elapsed_seconds,
            "tokens_used": sum(
                r.usage.get("total_tokens", 0)
                for r in workflow_result.results
            ),
            "steps_completed": workflow_result.steps_completed,
            "total_steps": workflow_result.total_steps
        }

        return GenerateResponse(
            kind=kind,
            document=document,
            text=text,
            meta=meta
        )
