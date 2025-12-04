"""
ComfyUI Media Provider

ComfyUI를 통한 이미지/비디오 생성 Provider

작성일: 2025-11-16
작성자: B팀 (Backend)
문서: ARCH-002, SPEC-001
"""

import httpx
import json
import uuid
import asyncio
import base64
import logging
from typing import Dict, Any, Optional, Literal, List
from datetime import datetime

from app.core.config import settings
from .base import MediaProvider, MediaProviderResponse, MediaProviderOutput, ProviderError

logger = logging.getLogger(__name__)


class ComfyUIProvider(MediaProvider):
    """
    ComfyUI Provider

    ComfyUI API를 통한 이미지/비디오 생성
    - Workflow 기반 생성
    - WebSocket을 통한 진행 상황 모니터링
    - 생성된 이미지 다운로드
    """

    def __init__(
        self,
        base_url: str,
        timeout: int = 300,
        polling_interval: float = 1.0
    ):
        """
        ComfyUI Provider 초기화

        Args:
            base_url: ComfyUI 서버 URL
            timeout: API 호출 타임아웃 (초)
            polling_interval: 상태 폴링 간격 (초)
        """
        super().__init__(
            vendor="comfyui",
            base_url=base_url,
            timeout=timeout
        )
        self.polling_interval = polling_interval

    async def generate(
        self,
        prompt: str,
        task: str,
        media_type: Literal["image", "video", "audio"],
        options: Optional[Dict[str, Any]] = None
    ) -> MediaProviderResponse:
        """
        ComfyUI를 통한 미디어 생성

        Args:
            prompt: 생성 프롬프트
            task: 작업 유형 (product_image, brand_logo 등)
            media_type: 미디어 타입 (현재는 image만 지원)
            options: ComfyUI 워크플로우 옵션

        Returns:
            MediaProviderResponse: 생성된 미디어

        Raises:
            ProviderError: ComfyUI 호출 실패 시
        """
        start_time = datetime.utcnow()

        if media_type != "image":
            raise ProviderError(
                message=f"ComfyUI Provider currently only supports 'image' type, got '{media_type}'",
                provider="comfyui",
                details={"media_type": media_type}
            )

        try:
            # 1. 워크플로우 구성
            workflow = self._build_workflow(prompt, task, options)

            # 2. ComfyUI에 워크플로우 제출
            prompt_id = await self._submit_workflow(workflow)

            logger.info(f"ComfyUI workflow submitted: prompt_id={prompt_id}")

            # 3. 생성 완료 대기 (폴링)
            await self._wait_for_completion(prompt_id)

            # 4. 생성된 이미지 다운로드
            outputs = await self._download_outputs(prompt_id, workflow)

            # 5. 응답 구성
            elapsed = (datetime.utcnow() - start_time).total_seconds()

            return MediaProviderResponse(
                provider="comfyui",
                model=workflow.get("model", "unknown"),
                usage={
                    "generation_time": elapsed,
                    "vram_used": 0  # ComfyUI API에서 제공하지 않음
                },
                outputs=outputs,
                meta={
                    "prompt": prompt,
                    "task": task,
                    "prompt_id": prompt_id,
                    "seed": workflow.get("seed", -1)
                }
            )

        except httpx.HTTPStatusError as e:
            logger.error(f"ComfyUI HTTP error: {e.response.status_code} - {e.response.text}")
            raise ProviderError(
                message=f"ComfyUI HTTP error: {e.response.text}",
                provider="comfyui",
                status_code=e.response.status_code,
                details={"prompt": prompt, "task": task}
            )

        except Exception as e:
            logger.error(f"ComfyUI generation failed: {type(e).__name__}: {str(e)}", exc_info=True)
            raise ProviderError(
                message=f"ComfyUI generation failed: {str(e)}",
                provider="comfyui",
                details={"prompt": prompt, "task": task}
            )

    def _build_workflow(
        self,
        prompt: str,
        task: str,
        options: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        ComfyUI 워크플로우 구성

        Args:
            prompt: 프롬프트
            task: 작업 유형
            options: 추가 옵션

        Returns:
            워크플로우 딕셔너리
        """
        # 기본 옵션
        default_opts = self.get_default_options(task, "image")
        merged_opts = {**default_opts, **(options or {})}

        # 시드값 처리 (-1이면 랜덤 시드 생성)
        import random
        seed = merged_opts.get("seed", -1)
        if seed == -1:
            seed = random.randint(0, 2**32 - 1)

        # Z-Image 사용 여부 확인
        use_zimage = merged_opts.get("use_zimage", True)

        if use_zimage:
            # Z-Image 전용 워크플로우 (ComfyUI Z-Image 설정 기반)
            # Model: z_image_turbo_bf16.safetensors
            # CLIP: qwen_3_4b.safetensors (lumina2 type)
            # VAE: ae.safetensors
            # KSampler: steps=9, cfg=1.0, sampler=res_multistep, scheduler=simple
            workflow = {
                # UNETLoader - Z-Image 모델 로드
                "1": {
                    "inputs": {
                        "unet_name": merged_opts.get("unet_name", "z_image_turbo_bf16.safetensors"),
                        "weight_dtype": "bf16"
                    },
                    "class_type": "UNETLoader"
                },
                # DualCLIPLoader - CLIP 모델 로드 (Qwen + T5XXL)
                "2": {
                    "inputs": {
                        "clip_name1": merged_opts.get("clip_name", "qwen_3_4b.safetensors"),
                        "clip_name2": "t5xxl_fp16.safetensors",
                        "type": "lumina2"
                    },
                    "class_type": "DualCLIPLoader"
                },
                # VAELoader - VAE 로드
                "3": {
                    "inputs": {
                        "vae_name": merged_opts.get("vae_name", "ae.safetensors")
                    },
                    "class_type": "VAELoader"
                },
                # CLIPTextEncode - 프롬프트 인코딩
                "4": {
                    "inputs": {
                        "text": prompt,
                        "clip": ["2", 0]
                    },
                    "class_type": "CLIPTextEncode"
                },
                # EmptyLatentImage - 빈 Latent 생성
                "5": {
                    "inputs": {
                        "width": merged_opts.get("width", 1024),
                        "height": merged_opts.get("height", 1024),
                        "batch_size": merged_opts.get("batch_size", 1)
                    },
                    "class_type": "EmptyLatentImage"
                },
                # KSampler - Z-Image 최적 설정
                "6": {
                    "inputs": {
                        "seed": seed,
                        "steps": merged_opts.get("steps", 9),
                        "cfg": merged_opts.get("cfg_scale", 1.0),
                        "sampler_name": merged_opts.get("sampler", "res_multistep"),
                        "scheduler": merged_opts.get("scheduler", "simple"),
                        "denoise": merged_opts.get("denoise", 1.0),
                        "model": ["1", 0],
                        "positive": ["4", 0],
                        "negative": ["4", 0],  # Z-Image는 negative prompt 미사용
                        "latent_image": ["5", 0]
                    },
                    "class_type": "KSampler"
                },
                # VAEDecode - 이미지 디코딩
                "7": {
                    "inputs": {
                        "samples": ["6", 0],
                        "vae": ["3", 0]
                    },
                    "class_type": "VAEDecode"
                },
                # SaveImage - 이미지 저장
                "8": {
                    "inputs": {
                        "filename_prefix": f"sparklio_{task}",
                        "images": ["7", 0]
                    },
                    "class_type": "SaveImage"
                }
            }

            return {
                "workflow": workflow,
                "model": "z_image_turbo_bf16.safetensors",
                "seed": seed,
                "save_node_id": "8"  # SaveImage 노드 ID
            }
        else:
            # 기본 SDXL 워크플로우 (기존 코드)
            workflow = {
                "3": {
                    "inputs": {
                        "seed": seed,
                        "steps": merged_opts.get("steps", 20),
                        "cfg": merged_opts.get("cfg_scale", 7.0),
                        "sampler_name": merged_opts.get("sampler", "euler"),
                        "scheduler": merged_opts.get("scheduler", "normal"),
                        "denoise": merged_opts.get("denoise", 1.0),
                        "model": ["4", 0],
                        "positive": ["6", 0],
                        "negative": ["7", 0],
                        "latent_image": ["5", 0]
                    },
                    "class_type": "KSampler"
                },
                "4": {
                    "inputs": {
                        "ckpt_name": merged_opts.get("checkpoint", "sd_xl_base_1.0.safetensors")
                    },
                    "class_type": "CheckpointLoaderSimple"
                },
                "5": {
                    "inputs": {
                        "width": merged_opts.get("width", 512),
                        "height": merged_opts.get("height", 512),
                        "batch_size": merged_opts.get("batch_size", 1)
                    },
                    "class_type": "EmptyLatentImage"
                },
                "6": {
                    "inputs": {
                        "text": prompt,
                        "clip": ["4", 1]
                    },
                    "class_type": "CLIPTextEncode"
                },
                "7": {
                    "inputs": {
                        "text": merged_opts.get("negative_prompt", ""),
                        "clip": ["4", 1]
                    },
                    "class_type": "CLIPTextEncode"
                },
                "8": {
                    "inputs": {
                        "samples": ["3", 0],
                        "vae": ["4", 2]
                    },
                    "class_type": "VAEDecode"
                },
                "9": {
                    "inputs": {
                        "filename_prefix": f"sparklio_{task}",
                        "images": ["8", 0]
                    },
                    "class_type": "SaveImage"
                }
            }

            return {
                "workflow": workflow,
                "model": merged_opts.get("checkpoint", "sd_xl_base_1.0.safetensors"),
                "seed": seed,
                "save_node_id": "9"
            }

    async def _submit_workflow(self, workflow: Dict[str, Any]) -> str:
        """
        ComfyUI에 워크플로우 제출

        Args:
            workflow: 워크플로우 딕셔너리

        Returns:
            prompt_id (작업 ID)

        Raises:
            ProviderError: 제출 실패 시
        """
        url = f"{self.base_url}/prompt"

        # Client-ID 생성 (WebSocket 연결용)
        client_id = str(uuid.uuid4())

        payload = {
            "prompt": workflow["workflow"],
            "client_id": client_id
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()

            result = response.json()
            prompt_id = result.get("prompt_id")

            if not prompt_id:
                raise ProviderError(
                    message="ComfyUI did not return prompt_id",
                    provider="comfyui",
                    details={"response": result}
                )

            return prompt_id

    async def _wait_for_completion(self, prompt_id: str, max_wait: int = 300):
        """
        워크플로우 완료 대기 (폴링 방식)

        Args:
            prompt_id: 작업 ID
            max_wait: 최대 대기 시간 (초)

        Raises:
            ProviderError: 타임아웃 또는 실패 시
        """
        url = f"{self.base_url}/history/{prompt_id}"
        waited = 0

        async with httpx.AsyncClient(timeout=10.0) as client:
            while waited < max_wait:
                try:
                    response = await client.get(url)
                    response.raise_for_status()

                    history = response.json()

                    if prompt_id in history:
                        # 완료됨
                        status = history[prompt_id].get("status", {})
                        if status.get("status_str") == "success":
                            logger.info(f"ComfyUI workflow completed: {prompt_id}")
                            return
                        elif status.get("status_str") == "error":
                            raise ProviderError(
                                message=f"ComfyUI workflow failed: {status.get('messages', [])}",
                                provider="comfyui",
                                details={"prompt_id": prompt_id, "status": status}
                            )

                    # 아직 진행 중
                    await asyncio.sleep(self.polling_interval)
                    waited += self.polling_interval

                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 404:
                        # 아직 히스토리에 없음 (진행 중)
                        await asyncio.sleep(self.polling_interval)
                        waited += self.polling_interval
                        continue
                    raise

        raise ProviderError(
            message=f"ComfyUI workflow timeout after {max_wait}s",
            provider="comfyui",
            details={"prompt_id": prompt_id, "max_wait": max_wait}
        )

    async def _download_outputs(
        self,
        prompt_id: str,
        workflow: Dict[str, Any]
    ) -> List[MediaProviderOutput]:
        """
        생성된 이미지 다운로드

        Args:
            prompt_id: 작업 ID
            workflow: 워크플로우 (메타데이터용)

        Returns:
            MediaProviderOutput 리스트

        Raises:
            ProviderError: 다운로드 실패 시
        """
        # 1. 히스토리에서 파일명 조회
        url = f"{self.base_url}/history/{prompt_id}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()

            history = response.json()

            if prompt_id not in history:
                raise ProviderError(
                    message=f"Prompt {prompt_id} not found in history",
                    provider="comfyui",
                    details={"prompt_id": prompt_id}
                )

            outputs_info = history[prompt_id].get("outputs", {})

            # SaveImage 노드 출력 찾기 (Z-Image: 8, SDXL: 9)
            save_node_id = workflow.get("save_node_id", "9")
            save_node_outputs = outputs_info.get(save_node_id, {}).get("images", [])

            if not save_node_outputs:
                raise ProviderError(
                    message="No images found in ComfyUI outputs",
                    provider="comfyui",
                    details={"prompt_id": prompt_id, "outputs": outputs_info}
                )

            # 2. 각 이미지 다운로드
            media_outputs = []

            for img_info in save_node_outputs:
                filename = img_info.get("filename")
                subfolder = img_info.get("subfolder", "")
                file_type = img_info.get("type", "output")

                # 이미지 다운로드
                image_url = f"{self.base_url}/view"
                params = {
                    "filename": filename,
                    "subfolder": subfolder,
                    "type": file_type
                }

                img_response = await client.get(image_url, params=params)
                img_response.raise_for_status()

                # Base64 인코딩
                image_data = base64.b64encode(img_response.content).decode('utf-8')

                media_outputs.append(MediaProviderOutput(
                    type="image",
                    format="png",
                    data=image_data,
                    width=workflow.get("workflow", {}).get("5", {}).get("inputs", {}).get("width"),
                    height=workflow.get("workflow", {}).get("5", {}).get("inputs", {}).get("height")
                ))

            return media_outputs

    async def health_check(self) -> bool:
        """
        ComfyUI 서버 헬스 체크

        Returns:
            정상 동작 여부
        """
        try:
            url = f"{self.base_url}/system_stats"
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                return True

        except Exception as e:
            logger.warning(f"ComfyUI health check failed: {str(e)}")
            return False

    def get_default_options(self, task: str, media_type: str) -> Dict[str, Any]:
        """
        작업별 기본 옵션

        Z-Image 기본 설정:
        - Model: z_image_turbo_bf16.safetensors
        - CLIP: qwen_3_4b.safetensors (lumina2)
        - VAE: ae.safetensors
        - KSampler: steps=9, cfg=1.0, sampler=res_multistep, scheduler=simple

        Args:
            task: 작업 유형
            media_type: 미디어 타입

        Returns:
            기본 옵션
        """
        if media_type == "image":
            # Z-Image 기본 설정 (모든 작업에 공통)
            zimage_base = {
                "use_zimage": True,
                "unet_name": "z_image_turbo_bf16.safetensors",
                "clip_name": "qwen_3_4b.safetensors",
                "vae_name": "ae.safetensors",
                "steps": 9,
                "cfg_scale": 1.0,
                "sampler": "res_multistep",
                "scheduler": "simple",
            }

            return {
                "product_image": {
                    **zimage_base,
                    "width": 1024,
                    "height": 1024,
                },
                "brand_logo": {
                    **zimage_base,
                    "width": 512,
                    "height": 512,
                },
                "sns_thumbnail": {
                    **zimage_base,
                    "width": 1200,
                    "height": 630,
                },
                "portrait": {
                    **zimage_base,
                    "width": 992,
                    "height": 1728,  # 스크린샷에서 본 세로 비율
                },
            }.get(task, {
                **zimage_base,
                "width": 1024,
                "height": 1024,
            })

        return {}


def get_comfyui_provider(
    base_url: str = None,
    timeout: int = 300,
    polling_interval: float = 1.0
) -> ComfyUIProvider:
    """
    ComfyUI Provider 인스턴스 생성

    Args:
        base_url: ComfyUI 서버 URL (None이면 settings에서 가져옴)
        timeout: API 호출 타임아웃 (초)
        polling_interval: 상태 폴링 간격 (초)

    Returns:
        ComfyUIProvider 인스턴스
    """
    return ComfyUIProvider(
        base_url=base_url or settings.comfyui_base_url,
        timeout=timeout,
        polling_interval=polling_interval
    )
