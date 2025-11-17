"""
VisionGeneratorAgent

Brief + Copy → 이미지 생성 (ComfyUI)
"""

from typing import Dict, Any, Optional
import logging
import json
import hashlib
from datetime import datetime
from uuid import UUID
import uuid

from app.agents.base import VisionAgent
from app.schemas.agent import A2ARequest, A2AResponse
from app.integrations.comfyui_client import ComfyUIClient, get_comfyui_client, ComfyUIError
from app.integrations.minio_client import MinIOClient, get_minio_client
from app.integrations.ollama_client import OllamaClient
from app.models.asset import GeneratedAsset
from app.core.database import get_db


logger = logging.getLogger(__name__)


class VisionGeneratorAgent(VisionAgent):
    """
    VisionGeneratorAgent - 이미지 생성

    입력: Brief, Copy, Style
    출력: 생성된 이미지 URL (MinIO)
    """

    def __init__(self):
        super().__init__(agent_name="VisionGeneratorAgent", agent_version="1.0.0")
        self.comfyui_client = get_comfyui_client()
        self.minio_client = get_minio_client()
        self.ollama_client = OllamaClient()

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
        brand_colors = request.payload.get("brand_colors", {})
        db_session = request.payload.get("db_session")

        brand_id = request.system_context.brand_id
        project_id = request.system_context.project_id
        user_id = request.system_context.user_id

        logger.info(f"[VisionGeneratorAgent] Generating image with style={style}, aspect_ratio={aspect_ratio}")

        try:
            # 1. Brief + Copy 분석 및 이미지 프롬프트 생성
            image_prompt = await self._generate_image_prompt(
                brief=brief,
                copy_text=copy_text,
                style=style,
                brand_colors=brand_colors
            )

            logger.info(f"[VisionGeneratorAgent] Image prompt generated: {image_prompt[:100]}...")

            # 2. ComfyUI 워크플로우 생성
            workflow = self._create_comfyui_workflow(
                prompt=image_prompt,
                aspect_ratio=aspect_ratio,
                style=style
            )

            # 3. ComfyUI API 호출 (이미지 생성)
            comfyui_result = await self.comfyui_client.generate_image(
                workflow=workflow,
                wait=True,
                max_wait=300  # 5분
            )

            # 4. 생성된 이미지 MinIO 업로드
            image_urls = []
            asset_ids = []

            for idx, image_data in enumerate(comfyui_result.get("images", [])):
                # 이미지 업로드
                upload_result = await self._upload_image_to_minio(
                    image_data=image_data,
                    brand_id=brand_id,
                    project_id=project_id,
                    user_id=user_id,
                    index=idx
                )

                image_urls.append(upload_result["url"])
                asset_ids.append(upload_result["asset_id"])

                # 5. DB에 asset 정보 저장
                if db_session:
                    await self._save_asset_to_db(
                        db_session=db_session,
                        asset_id=upload_result["asset_id"],
                        brand_id=brand_id,
                        project_id=project_id,
                        user_id=user_id,
                        minio_path=upload_result["minio_path"],
                        file_size=len(image_data),
                        prompt=image_prompt,
                        comfyui_prompt_id=comfyui_result["prompt_id"]
                    )

            result = {
                "image_urls": image_urls,
                "asset_ids": asset_ids,
                "prompt_used": image_prompt,
                "comfyui_prompt_id": comfyui_result["prompt_id"],
                "image_count": len(image_urls),
                "style": style,
                "aspect_ratio": aspect_ratio
            }

            return self._create_success_response(
                request=request,
                result=result,
                metadata={
                    "style": style,
                    "aspect_ratio": aspect_ratio,
                    "comfyui_workflow": "flux_schnell_v1",
                    "generation_time": "~30s",
                    "model_used": self.default_model
                }
            )

        except ComfyUIError as e:
            logger.error(f"[VisionGeneratorAgent] ComfyUI error: {e}")
            return self._create_error_response(
                request=request,
                error=f"이미지 생성 실패 (ComfyUI): {str(e)}"
            )

        except Exception as e:
            logger.error(f"[VisionGeneratorAgent] Error generating image: {e}")
            return self._create_error_response(
                request=request,
                error=f"이미지 생성 중 오류 발생: {str(e)}"
            )

    async def _generate_image_prompt(
        self,
        brief: Dict[str, Any],
        copy_text: str,
        style: str,
        brand_colors: Dict[str, str]
    ) -> str:
        """
        Ollama를 사용하여 Brief + Copy로부터 이미지 프롬프트 생성

        Args:
            brief: Brief 데이터
            copy_text: 마케팅 카피
            style: 스타일 (modern, minimalist, vibrant 등)
            brand_colors: 브랜드 컬러 (primary, secondary)

        Returns:
            str: 이미지 생성 프롬프트
        """
        system_prompt = """당신은 이미지 생성 프롬프트 전문가입니다. 마케팅 Brief와 카피를 분석하여 FLUX 모델용 이미지 생성 프롬프트를 작성합니다.

프롬프트 작성 가이드라인:
1. 구체적이고 명확한 시각적 요소 묘사
2. 브랜드 컬러 반영
3. 스타일에 맞는 분위기 표현
4. 타겟 오디언스에게 어필하는 이미지
5. 마케팅 메시지를 시각적으로 전달

다음 JSON 형식으로 응답하세요:
{
  "prompt": "이미지 생성 프롬프트 (영문, 상세하게)",
  "negative_prompt": "피해야 할 요소들",
  "style_notes": "스타일 설명",
  "composition": "구도 설명"
}"""

        color_description = ""
        if brand_colors:
            primary = brand_colors.get("primary", "")
            secondary = brand_colors.get("secondary", "")
            color_description = f"Primary color: {primary}, Secondary color: {secondary}"

        user_prompt = f"""Brief 정보:
- 목표: {brief.get('goal', '')}
- 타겟 오디언스: {brief.get('target_audience', '')}
- 핵심 메시지: {', '.join(brief.get('key_messages', []))}
- 톤: {brief.get('tone', '')}

마케팅 카피:
{copy_text}

스타일: {style}
브랜드 컬러: {color_description or '정보 없음'}

위 정보를 바탕으로 마케팅 이미지 생성 프롬프트를 JSON 형식으로 작성해주세요."""

        try:
            response = await self.ollama_client.generate(
                prompt=user_prompt,
                system=system_prompt,
                model=self.default_model,
                temperature=0.7,
                max_tokens=500
            )

            response_text = response["response"].strip()

            # JSON 블록 추출
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()

            prompt_data = json.loads(response_text)

            logger.info(f"[VisionGeneratorAgent] Prompt generated by LLM")

            return prompt_data.get("prompt", copy_text[:200])

        except json.JSONDecodeError as e:
            logger.error(f"[VisionGeneratorAgent] Failed to parse JSON response: {e}")
            # Fallback: Brief 목표를 기반으로 기본 프롬프트 생성
            return f"Professional marketing image for {brief.get('goal', 'brand campaign')[:100]}, {style} style, high quality, commercial photography"

        except Exception as e:
            logger.error(f"[VisionGeneratorAgent] Error generating prompt: {e}")
            return f"Marketing image, {style} style, professional, high quality"

    def _create_comfyui_workflow(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        style: str = "modern"
    ) -> Dict[str, Any]:
        """
        ComfyUI 워크플로우 JSON 생성 (FLUX Schnell)

        Args:
            prompt: 이미지 생성 프롬프트
            aspect_ratio: 비율 (1:1, 16:9, 9:16, 4:3)
            style: 스타일

        Returns:
            Dict: ComfyUI 워크플로우 JSON
        """
        # 비율별 해상도 설정
        resolution_map = {
            "1:1": (1024, 1024),
            "16:9": (1344, 768),
            "9:16": (768, 1344),
            "4:3": (1152, 896),
            "3:4": (896, 1152)
        }

        width, height = resolution_map.get(aspect_ratio, (1024, 1024))

        # FLUX Schnell 워크플로우
        # 실제 ComfyUI 워크플로우는 C Team에서 제공
        # 여기서는 기본 구조만 정의
        workflow = {
            "3": {
                "inputs": {
                    "seed": 42,  # Random seed
                    "steps": 4,  # FLUX Schnell은 4 steps
                    "cfg": 1.0,
                    "sampler_name": "euler",
                    "scheduler": "simple",
                    "denoise": 1,
                    "model": ["4", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["5", 0]
                },
                "class_type": "KSampler",
                "_meta": {"title": "KSampler"}
            },
            "4": {
                "inputs": {
                    "unet_name": "flux1-schnell.safetensors"
                },
                "class_type": "UNETLoader",
                "_meta": {"title": "Load Diffusion Model"}
            },
            "5": {
                "inputs": {
                    "width": width,
                    "height": height,
                    "batch_size": 1
                },
                "class_type": "EmptyLatentImage",
                "_meta": {"title": "Empty Latent Image"}
            },
            "6": {
                "inputs": {
                    "text": prompt,
                    "clip": ["11", 0]
                },
                "class_type": "CLIPTextEncode",
                "_meta": {"title": "CLIP Text Encode (Positive)"}
            },
            "7": {
                "inputs": {
                    "text": "",
                    "clip": ["11", 0]
                },
                "class_type": "CLIPTextEncode",
                "_meta": {"title": "CLIP Text Encode (Negative)"}
            },
            "8": {
                "inputs": {
                    "samples": ["3", 0],
                    "vae": ["10", 0]
                },
                "class_type": "VAEDecode",
                "_meta": {"title": "VAE Decode"}
            },
            "9": {
                "inputs": {
                    "filename_prefix": "sparklio_",
                    "images": ["8", 0]
                },
                "class_type": "SaveImage",
                "_meta": {"title": "Save Image"}
            },
            "10": {
                "inputs": {
                    "vae_name": "ae.safetensors"
                },
                "class_type": "VAELoader",
                "_meta": {"title": "Load VAE"}
            },
            "11": {
                "inputs": {
                    "clip_name1": "t5xxl_fp16.safetensors",
                    "clip_name2": "clip_l.safetensors",
                    "type": "flux"
                },
                "class_type": "DualCLIPLoader",
                "_meta": {"title": "DualCLIPLoader"}
            }
        }

        logger.info(f"[VisionGeneratorAgent] Created ComfyUI workflow: {width}x{height}, style={style}")

        return workflow

    async def _upload_image_to_minio(
        self,
        image_data: bytes,
        brand_id: Optional[str],
        project_id: Optional[str],
        user_id: str,
        index: int = 0
    ) -> Dict[str, Any]:
        """
        생성된 이미지를 MinIO에 업로드

        Args:
            image_data: 이미지 바이너리 데이터
            brand_id: 브랜드 ID
            project_id: 프로젝트 ID
            user_id: 사용자 ID
            index: 이미지 인덱스

        Returns:
            Dict: 업로드 결과 (url, asset_id, minio_path)
        """
        # Asset ID 생성
        asset_id = str(uuid.uuid4())

        # MinIO 경로 생성: sparklio-assets/brand_id/project_id/YYYYMMDD/asset_id.png
        date_str = datetime.now().strftime("%Y%m%d")
        object_name = f"{brand_id or 'nobrand'}/{project_id or 'noproject'}/{date_str}/{asset_id}.png"

        try:
            # MinIO 업로드
            minio_path = self.minio_client.upload_file(
                bucket_name="sparklio-assets",
                object_name=object_name,
                data=image_data,
                content_type="image/png",
                metadata={
                    "brand_id": brand_id or "",
                    "project_id": project_id or "",
                    "user_id": user_id,
                    "asset_id": asset_id
                }
            )

            # Presigned URL 생성 (1시간 유효)
            presigned_url = self.minio_client.get_presigned_url(
                bucket_name="sparklio-assets",
                object_name=object_name
            )

            logger.info(f"[VisionGeneratorAgent] Image uploaded to MinIO: {minio_path}")

            return {
                "url": presigned_url,
                "asset_id": asset_id,
                "minio_path": minio_path,
                "object_name": object_name
            }

        except Exception as e:
            logger.error(f"[VisionGeneratorAgent] Failed to upload image to MinIO: {e}")
            raise

    async def _save_asset_to_db(
        self,
        db_session,
        asset_id: str,
        brand_id: Optional[str],
        project_id: Optional[str],
        user_id: str,
        minio_path: str,
        file_size: int,
        prompt: str,
        comfyui_prompt_id: str
    ):
        """
        생성된 Asset 정보를 DB에 저장

        Args:
            db_session: 데이터베이스 세션
            asset_id: Asset ID
            brand_id: 브랜드 ID
            project_id: 프로젝트 ID
            user_id: 사용자 ID
            minio_path: MinIO 경로
            file_size: 파일 크기
            prompt: 이미지 생성 프롬프트
            comfyui_prompt_id: ComfyUI Prompt ID
        """
        try:
            asset = GeneratedAsset(
                id=UUID(asset_id),
                brand_id=UUID(brand_id) if brand_id else None,
                project_id=UUID(project_id) if project_id else None,
                user_id=UUID(user_id),
                type="image",
                minio_path=minio_path,
                original_name=f"{asset_id}.png",
                file_size=file_size,
                mime_type="image/png",
                source="comfyui",
                source_metadata={
                    "comfyui_prompt_id": comfyui_prompt_id,
                    "prompt": prompt,
                    "model": "flux1-schnell"
                },
                status="active",
                asset_metadata={
                    "generated_by": "VisionGeneratorAgent",
                    "generation_date": datetime.now().isoformat()
                }
            )

            db_session.add(asset)
            db_session.commit()

            logger.info(f"[VisionGeneratorAgent] Asset saved to DB: asset_id={asset_id}")

        except Exception as e:
            logger.error(f"[VisionGeneratorAgent] Failed to save asset to DB: {e}")
            db_session.rollback()
