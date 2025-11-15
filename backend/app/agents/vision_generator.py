"""
VisionGeneratorAgent

Brief + Copy → 이미지 생성 (ComfyUI)
"""

from typing import Dict, Any
import logging

from app.agents.base import VisionAgent
from app.schemas.agent import A2ARequest, A2AResponse


logger = logging.getLogger(__name__)


class VisionGeneratorAgent(VisionAgent):
    """
    VisionGeneratorAgent - 이미지 생성

    입력: Brief, Copy, Style
    출력: 생성된 이미지 URL (MinIO)
    """

    def __init__(self):
        super().__init__(agent_name="VisionGeneratorAgent", agent_version="1.0.0")

    def _register_capabilities(self) -> list[str]:
        return ["generate_image", "create_prompt", "upload_to_storage"]

    async def process(self, request: A2ARequest) -> A2AResponse:
        """
        이미지 생성 메인 로직

        Args:
            request: A2A 요청

        Returns:
            A2AResponse: 생성된 이미지 정보
        """
        brief = request.payload.get("brief", {})
        copy_text = request.payload.get("copy", "")
        style = request.payload.get("style", "modern")
        aspect_ratio = request.payload.get("aspect_ratio", "1:1")

        logger.info(f"[VisionGeneratorAgent] Generating image with style={style}")

        # TODO: 실제 구현
        # 1. Brief + Copy 분석
        # 2. 이미지 프롬프트 생성
        # 3. ComfyUI 워크플로우 생성
        # 4. ComfyUI API 호출
        # 5. 생성된 이미지 MinIO 업로드
        # 6. DB에 asset 정보 저장

        # 임시 구현
        result = {
            "image_url": "https://minio.example.com/sparklio/assets/generated-image-001.png",
            "prompt_used": f"A {style} marketing image representing: {copy_text[:50]}",
            "asset_id": "asset-123e4567-e89b-12d3-a456-426614174000"
        }

        return self._create_success_response(
            request=request,
            result=result,
            metadata={
                "style": style,
                "aspect_ratio": aspect_ratio,
                "comfyui_workflow": "workflow_v1"
            }
        )
