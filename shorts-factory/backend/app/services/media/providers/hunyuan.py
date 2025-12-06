"""
HunyuanVideo Provider (Text-to-Video / Image-to-Video)

ComfyUI를 통해 HunyuanVideo 모델로 영상 생성

작성일: 2025-12-06
원본: sparklio_ai_marketing_studio/backend/app/services/media/providers/hunyuan_provider.py

기능:
- Text-to-Video: 텍스트 프롬프트로 영상 생성
- Image-to-Video: 이미지를 움직이는 영상으로 변환

요구사항:
- ComfyUI 서버 (HunyuanVideo 모델 설치됨)
- GPU 서버: 100.120.180.42:8188
"""

import logging
import asyncio
import uuid
import base64
from typing import Dict, Any, Optional, Literal
from datetime import datetime

import httpx

from .base import MediaProvider, MediaProviderResponse, MediaProviderOutput, ProviderError

logger = logging.getLogger(__name__)


class HunyuanVideoProvider(MediaProvider):
    """
    HunyuanVideo Provider

    ComfyUI API를 통해 HunyuanVideo 모델로 영상을 생성합니다.

    지원 기능:
    - text_to_video: 텍스트 → 영상 (5초)
    - image_to_video: 이미지 → 영상 (5초)
    """

    def __init__(
        self,
        comfyui_url: str = "http://100.120.180.42:8188",
        timeout: int = 600,
        poll_interval: int = 5,
        max_wait_time: int = 900
    ):
        super().__init__(
            vendor="hunyuan",
            base_url=comfyui_url,
            timeout=timeout
        )
        self.comfyui_url = comfyui_url.rstrip("/")
        self.poll_interval = poll_interval
        self.max_wait_time = max_wait_time

    async def generate(
        self,
        prompt: str,
        task: str,
        media_type: Literal["image", "video", "audio"],
        options: Optional[Dict[str, Any]] = None
    ) -> MediaProviderResponse:
        """영상 생성"""
        if media_type != "video":
            raise ProviderError(
                message=f"HunyuanVideo only supports 'video', got '{media_type}'",
                provider=self.vendor,
                status_code=400
            )

        opts = options or {}
        start_time = datetime.utcnow()

        logger.info(f"[HunyuanVideo] Starting {task}: prompt='{prompt[:50]}...'")

        try:
            if task == "text_to_video":
                workflow = self._build_t2v_workflow(prompt, opts)
            elif task == "image_to_video":
                workflow = self._build_i2v_workflow(prompt, opts)
            else:
                raise ProviderError(
                    message=f"Unsupported task: {task}",
                    provider=self.vendor,
                    status_code=400
                )

            prompt_id = await self._queue_prompt(workflow)
            result = await self._poll_completion(prompt_id)
            video_data = await self._get_output_video(result)

            elapsed = (datetime.utcnow() - start_time).total_seconds()

            width = opts.get("width", 720)
            height = opts.get("height", 480)
            frames = opts.get("frames", 125)
            fps = 25
            duration = frames / fps

            return MediaProviderResponse(
                provider=self.vendor,
                model="hunyuan-video-t2v" if task == "text_to_video" else "hunyuan-video-i2v",
                usage={
                    "generation_time_sec": elapsed,
                    "frames": frames,
                    "steps": opts.get("steps", 30)
                },
                outputs=[
                    MediaProviderOutput(
                        type="video",
                        format="webp",
                        data=video_data,
                        width=width,
                        height=height,
                        duration=duration
                    )
                ],
                meta={
                    "prompt_id": prompt_id,
                    "prompt": prompt,
                    "task": task,
                    "fps": fps
                }
            )

        except ProviderError:
            raise
        except Exception as e:
            logger.error(f"[HunyuanVideo] Generation failed: {e}", exc_info=True)
            raise ProviderError(
                message=f"HunyuanVideo generation failed: {str(e)}",
                provider=self.vendor,
                details={"prompt": prompt[:100], "task": task}
            )

    def _build_t2v_workflow(self, prompt: str, options: Dict[str, Any]) -> Dict:
        """Text-to-Video 워크플로우 생성"""
        width = options.get("width", 720)
        height = options.get("height", 480)
        frames = options.get("frames", 125)
        steps = options.get("steps", 30)
        cfg = options.get("cfg", 6.0)
        seed = options.get("seed", -1)

        if seed == -1:
            import random
            seed = random.randint(0, 2**32 - 1)

        workflow = {
            "1": {
                "class_type": "HunyuanVideoTextEncode",
                "inputs": {
                    "prompt": prompt,
                    "clip": ["2", 0],
                    "llm_model": ["3", 0]
                }
            },
            "2": {
                "class_type": "CLIPLoader",
                "inputs": {"clip_name": "clip_l.safetensors"}
            },
            "3": {
                "class_type": "LLaVALoader",
                "inputs": {"llm_name": "llava_llama3_fp8_scaled.safetensors"}
            },
            "4": {
                "class_type": "HunyuanVideoSampler",
                "inputs": {
                    "seed": seed,
                    "steps": steps,
                    "cfg": cfg,
                    "width": width,
                    "height": height,
                    "video_frames": frames,
                    "positive": ["1", 0],
                    "negative": ["5", 0],
                    "model": ["6", 0]
                }
            },
            "5": {
                "class_type": "HunyuanVideoTextEncode",
                "inputs": {
                    "prompt": "",
                    "clip": ["2", 0],
                    "llm_model": ["3", 0]
                }
            },
            "6": {
                "class_type": "UNETLoader",
                "inputs": {"unet_name": "hunyuan_video_t2v_720p_bf16.safetensors"}
            },
            "7": {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["4", 0],
                    "vae": ["8", 0]
                }
            },
            "8": {
                "class_type": "VAELoader",
                "inputs": {"vae_name": "hunyuan_video_vae_bf16.safetensors"}
            },
            "9": {
                "class_type": "SaveAnimatedWEBP",
                "inputs": {
                    "filename_prefix": "shorts_t2v",
                    "fps": 25,
                    "lossless": False,
                    "quality": 90,
                    "method": "default",
                    "images": ["7", 0]
                }
            }
        }

        return workflow

    def _build_i2v_workflow(self, prompt: str, options: Dict[str, Any]) -> Dict:
        """Image-to-Video 워크플로우 생성"""
        width = options.get("width", 720)
        height = options.get("height", 480)
        frames = options.get("frames", 125)
        steps = options.get("steps", 30)
        cfg = options.get("cfg", 6.0)
        seed = options.get("seed", -1)

        image_url = options.get("image_url")
        image_base64 = options.get("image_base64")

        if not image_url and not image_base64:
            raise ProviderError(
                message="image_to_video requires 'image_url' or 'image_base64'",
                provider=self.vendor,
                status_code=400
            )

        if seed == -1:
            import random
            seed = random.randint(0, 2**32 - 1)

        workflow = {
            "1": {
                "class_type": "HunyuanVideoTextEncode",
                "inputs": {
                    "prompt": prompt,
                    "clip": ["2", 0],
                    "llm_model": ["3", 0]
                }
            },
            "2": {
                "class_type": "CLIPLoader",
                "inputs": {"clip_name": "clip_l.safetensors"}
            },
            "3": {
                "class_type": "LLaVALoader",
                "inputs": {"llm_name": "llava_llama3_fp8_scaled.safetensors"}
            },
            "4": {
                "class_type": "HunyuanVideoI2VSampler",
                "inputs": {
                    "seed": seed,
                    "steps": steps,
                    "cfg": cfg,
                    "width": width,
                    "height": height,
                    "video_frames": frames,
                    "positive": ["1", 0],
                    "negative": ["5", 0],
                    "model": ["6", 0],
                    "image": ["10", 0]
                }
            },
            "5": {
                "class_type": "HunyuanVideoTextEncode",
                "inputs": {
                    "prompt": "",
                    "clip": ["2", 0],
                    "llm_model": ["3", 0]
                }
            },
            "6": {
                "class_type": "UNETLoader",
                "inputs": {"unet_name": "hunyuan_video_image_to_video_720p_bf16.safetensors"}
            },
            "7": {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["4", 0],
                    "vae": ["8", 0]
                }
            },
            "8": {
                "class_type": "VAELoader",
                "inputs": {"vae_name": "hunyuan_video_vae_bf16.safetensors"}
            },
            "9": {
                "class_type": "SaveAnimatedWEBP",
                "inputs": {
                    "filename_prefix": "shorts_i2v",
                    "fps": 25,
                    "lossless": False,
                    "quality": 90,
                    "method": "default",
                    "images": ["7", 0]
                }
            },
            "10": {
                "class_type": "LoadImageFromURL" if image_url else "LoadImageBase64",
                "inputs": {"url": image_url} if image_url else {"image": image_base64}
            }
        }

        return workflow

    async def _queue_prompt(self, workflow: Dict) -> str:
        """ComfyUI에 워크플로우 제출"""
        client_id = str(uuid.uuid4())
        payload = {"prompt": workflow, "client_id": client_id}

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(f"{self.comfyui_url}/prompt", json=payload)

            if response.status_code != 200:
                raise ProviderError(
                    message=f"Failed to queue prompt: {response.text}",
                    provider=self.vendor,
                    status_code=response.status_code
                )

            data = response.json()
            prompt_id = data.get("prompt_id")

            if not prompt_id:
                raise ProviderError(
                    message="No prompt_id in response",
                    provider=self.vendor,
                    details=data
                )

            logger.info(f"[HunyuanVideo] Prompt queued: {prompt_id}")
            return prompt_id

    async def _poll_completion(self, prompt_id: str) -> Dict[str, Any]:
        """완료까지 폴링"""
        start_time = datetime.utcnow()

        async with httpx.AsyncClient(timeout=30) as client:
            while True:
                elapsed = (datetime.utcnow() - start_time).total_seconds()
                if elapsed > self.max_wait_time:
                    raise ProviderError(
                        message=f"Generation timed out after {self.max_wait_time}s",
                        provider=self.vendor,
                        details={"prompt_id": prompt_id}
                    )

                response = await client.get(f"{self.comfyui_url}/history/{prompt_id}")

                if response.status_code == 200:
                    data = response.json()
                    if prompt_id in data:
                        result = data[prompt_id]
                        if result.get("outputs"):
                            logger.info(f"[HunyuanVideo] Generation completed: {prompt_id}")
                            return result

                logger.debug(f"[HunyuanVideo] Waiting... elapsed={elapsed:.0f}s")
                await asyncio.sleep(self.poll_interval)

    async def _get_output_video(self, result: Dict[str, Any]) -> str:
        """출력 영상 가져오기"""
        outputs = result.get("outputs", {})

        for node_id, node_output in outputs.items():
            if "gifs" in node_output:
                gif_info = node_output["gifs"][0]
                filename = gif_info.get("filename")
                subfolder = gif_info.get("subfolder", "")

                params = {"filename": filename, "subfolder": subfolder, "type": "output"}
                async with httpx.AsyncClient(timeout=60) as client:
                    response = await client.get(f"{self.comfyui_url}/view", params=params)

                    if response.status_code == 200:
                        return base64.b64encode(response.content).decode("utf-8")

        raise ProviderError(
            message="No video output found",
            provider=self.vendor,
            details={"outputs": outputs}
        )

    async def health_check(self) -> bool:
        """헬스 체크"""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(f"{self.comfyui_url}/system_stats")
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"[HunyuanVideo] Health check failed: {e}")
            return False

    def get_default_options(self, task: str, media_type: str) -> Dict[str, Any]:
        """기본 옵션"""
        return {
            "width": 720,
            "height": 480,
            "frames": 125,
            "steps": 30,
            "cfg": 6.0,
            "seed": -1
        }


# Singleton
_hunyuan_instance: Optional[HunyuanVideoProvider] = None


def get_hunyuan_provider(comfyui_url: Optional[str] = None) -> HunyuanVideoProvider:
    """HunyuanVideo Provider 인스턴스 반환 (싱글톤)"""
    global _hunyuan_instance

    if _hunyuan_instance is None:
        if not comfyui_url:
            from app.core.config import settings
            comfyui_url = settings.comfyui_base_url

        _hunyuan_instance = HunyuanVideoProvider(comfyui_url=comfyui_url)

    return _hunyuan_instance
