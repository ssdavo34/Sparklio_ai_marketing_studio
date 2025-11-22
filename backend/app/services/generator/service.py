"""
Generator Service

WorkflowExecutor + Agent를 사용한 콘텐츠 생성 서비스

작성일: 2025-11-17
수정일: 2025-11-18 (prompt 자동 변환 추가)
"""

from typing import Dict, Any, Optional
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
from app.services.canvas import (
    create_product_detail_canvas,
    create_brand_identity_canvas,
    create_sns_set_canvas,
    # v2.0 Abstract Canvas
    create_product_detail_document,
    create_sns_feed_document
)
from app.schemas.canvas import DocumentPayload as CanvasDocumentPayload

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
        # 🔴 자유 형식 입력(prompt) → 구조화된 데이터 자동 변환
        initial_payload = self._prepare_workflow_payload(
            req.kind, req.input, req.brandId, req.options
        )

        logger.info(f"Workflow payload prepared: {initial_payload}")

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

    def _prepare_workflow_payload(
        self,
        kind: str,
        input_data: Dict[str, Any],
        brand_id: str,
        options: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Workflow 실행을 위한 payload 준비

        자유 형식 입력(prompt)을 구조화된 데이터로 변환

        Args:
            kind: 생성 타입
            input_data: 사용자 입력
            brand_id: 브랜드 ID
            options: 추가 옵션

        Returns:
            Workflow에 전달할 initial_payload
        """
        payload = {
            "brand_id": brand_id,
            **(options or {})
        }

        # product_detail의 경우 특별 처리
        if kind in ["product_detail", "sns_set", "presentation_simple"]:
            if "prompt" in input_data:
                # 자유 형식 입력 → 구조화
                user_prompt = input_data["prompt"]
                payload.update({
                    "product_name": user_prompt,  # "지성 피부용 진정 토너"
                    "features": [user_prompt],
                    "target_audience": "일반 소비자",
                    "category": "제품",
                    "description": user_prompt
                })
                logger.info(
                    "Auto-converted prompt to structured payload: "
                    f"{user_prompt}"
                )
            else:
                # 구조화된 입력은 그대로 사용
                payload.update(input_data)
        else:
            # 다른 kind는 그대로 사용
            payload.update(input_data)

        return payload

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

        # Copywriter Agent 결과에서 텍스트 추출 (첫 번째 Agent)
        copywriter_result = None
        for result in workflow_result.results:
            if result.agent == "copywriter":
                copywriter_result = result
                break

        text_data = {}

        if copywriter_result and copywriter_result.outputs:
            logger.info(
                f"Found copywriter with "
                f"{len(copywriter_result.outputs)} outputs"
            )
            # outputs에서 텍스트 추출
            for idx, output in enumerate(copywriter_result.outputs):
                logger.info(
                    f"Output[{idx}]: type={output.type}, "
                    f"name={output.name}"
                )
                if output.type == "json" and isinstance(output.value, dict):
                    logger.info(f"  JSON keys: {list(output.value.keys())}")
                    text_data.update(output.value)
                elif output.type == "text":
                    text_data["body"] = output.value
        else:
            logger.warning("No copywriter outputs found!")

        # TextPayload 생성
        text = TextPayload(
            headline=text_data.get("headline"),
            subheadline=text_data.get("subheadline"),
            body=text_data.get("body"),
            bullets=text_data.get("bullets") or text_data.get("features"),
            cta=text_data.get("cta")
        )

        # Canvas Document 생성 (v2.0 Abstract Spec)
        logger.info(f"Creating canvas for kind={kind}, text_data={text_data}")
        canvas_document = self._create_canvas_v2(kind, text_data)
        logger.info(
            f"Canvas created: {len(canvas_document.pages)} pages, "
            f"{sum(len(p.objects) for p in canvas_document.pages)} objects"
        )

        # DocumentPayload 생성 (v2.0)
        # canvas_document는 이미 CanvasDocumentPayload 타입
        # GenerateResponse의 document는 generator.DocumentPayload 타입
        # 따라서 변환 필요
        document = DocumentPayload(
            documentId=doc_id,
            type=kind,
            canvas_json=canvas_document.model_dump()
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

    def _create_canvas_v2(
        self,
        kind: str,
        text_data: dict
    ) -> CanvasDocumentPayload:
        """
        kind에 따라 Abstract Canvas Document 생성 (v2.0)

        Args:
            kind: 생성 타입
            text_data: 텍스트 데이터

        Returns:
            CanvasDocumentPayload (v2.0 Abstract Spec)
        """
        if kind == "product_detail":
            return create_product_detail_document(text_data)
        elif kind == "sns_set":
            return create_sns_feed_document(text_data)
        elif kind == "brand_identity":
            # NOTE: brand_identity v2.0 Document 구현 예정
            # 구현 예시:
            # return CanvasDocumentPayload(
            #     documentId=f"doc_{uuid.uuid4().hex[:12]}",
            #     version="2.0",
            #     pages=[
            #         PagePayload(
            #             id="page_1",
            #             name="Brand Identity",
            #             width=1080,
            #             height=1350,
            #             objects=[
            #                 # 브랜드 로고, 컬러 팔레트, 타이포그래피 등
            #             ]
            #         )
            #     ]
            # )
            # 현재는 임시로 product_detail 사용
            return create_product_detail_document(text_data)
        else:
            # 기본 Document (product_detail 기본값)
            return create_product_detail_document(text_data)

    def _create_canvas(self, kind: str, text_data: dict) -> dict:
        """
        kind에 따라 Canvas JSON 생성 (v1.0 Legacy)

        Args:
            kind: 생성 타입
            text_data: 텍스트 데이터

        Returns:
            Fabric.js Canvas JSON
        """
        if kind == "product_detail":
            return create_product_detail_canvas(text_data)
        elif kind == "brand_identity":
            return create_brand_identity_canvas(text_data)
        elif kind == "sns_set":
            return create_sns_set_canvas(text_data)
        else:
            # 기본 Canvas (빈 객체)
            return {"version": "5.3.0", "objects": [], "background": "#ffffff"}
