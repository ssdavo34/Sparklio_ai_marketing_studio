"""
Vision Generator Agent

이미지 생성 프롬프트를 받아 실제 이미지를 생성하는 에이전트

작성일: 2025-11-28
수정일: 2025-11-29 - execute_v3() 메서드 추가 (Plan-Act-Reflect 패턴)
작성자: B팀 (Backend)
참조: AGENTS_SPEC.md - VisionGeneratorAgent

이미지 생성: Nanobanana API / ComfyUI / DALL-E
"""

import json
import logging
import asyncio
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import uuid4

from app.services.agents.base import (
    AgentBase, AgentRequest, AgentResponse, AgentOutput, AgentError,
    AgentGoal, SelfReview, ExecutionPlan
)

logger = logging.getLogger(__name__)


# =============================================================================
# Input/Output Schemas
# =============================================================================

class ImageGenerationRequest(BaseModel):
    """이미지 생성 요청"""
    prompt_text: str = Field(..., description="이미지 생성 프롬프트 (영문)")
    negative_prompt: str = Field(default="blurry, low quality, text, watermark", description="네거티브 프롬프트")
    aspect_ratio: str = Field(default="1:1", description="비율 (1:1, 16:9, 9:16, 3:4)")
    style: str = Field(default="realistic", description="스타일 (realistic, illustration, 3d, anime)")
    seed: Optional[int] = Field(None, description="시드 값 (재현성)")
    quality: str = Field(default="high", description="품질 (draft, standard, high)")


class VisionGeneratorInput(BaseModel):
    """VisionGeneratorAgent 입력"""
    prompts: List[ImageGenerationRequest] = Field(..., description="생성할 이미지 프롬프트 목록")
    provider: str = Field(default="nanobanana", description="이미지 생성 제공자")
    batch_mode: bool = Field(default=True, description="배치 모드 (병렬 생성)")
    max_concurrent: int = Field(default=3, description="최대 동시 생성 수")


class GeneratedImage(BaseModel):
    """생성된 이미지"""
    image_id: str = Field(..., description="이미지 ID")
    prompt_text: str = Field(..., description="사용된 프롬프트")
    image_url: Optional[str] = Field(None, description="이미지 URL")
    image_base64: Optional[str] = Field(None, description="Base64 인코딩 이미지")
    width: int = Field(default=1024, description="너비")
    height: int = Field(default=1024, description="높이")
    seed_used: Optional[int] = Field(None, description="사용된 시드")
    generation_time: float = Field(default=0.0, description="생성 시간 (초)")
    status: str = Field(default="completed", description="상태 (completed, failed, pending)")
    error: Optional[str] = Field(None, description="에러 메시지")


class VisionGeneratorOutput(BaseModel):
    """VisionGeneratorAgent 출력"""
    images: List[GeneratedImage] = Field(..., description="생성된 이미지 목록")
    total_requested: int = Field(..., description="요청된 이미지 수")
    total_generated: int = Field(..., description="생성된 이미지 수")
    total_failed: int = Field(default=0, description="실패한 이미지 수")
    total_time: float = Field(default=0.0, description="총 소요 시간")


# =============================================================================
# Vision Generator Agent
# =============================================================================

class VisionGeneratorAgent(AgentBase):
    """
    Vision Generator Agent

    이미지 생성 프롬프트를 받아 실제 이미지를 생성합니다.

    지원 제공자:
    - Nanobanana API (기본)
    - ComfyUI (로컬)
    - OpenAI DALL-E (백업)

    주요 기능:
    - 프롬프트 기반 이미지 생성
    - 배치 처리 (병렬 생성)
    - 에셋 유형별 비율 최적화
    - 품질/스타일 제어
    """

    # 비율별 해상도 매핑
    ASPECT_RATIO_SIZES = {
        "1:1": (1024, 1024),
        "16:9": (1280, 720),
        "9:16": (720, 1280),
        "3:4": (768, 1024),
        "4:3": (1024, 768),
        "2:3": (683, 1024),
        "3:2": (1024, 683)
    }

    @property
    def name(self) -> str:
        return "vision_generator"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        이미지 생성 실행

        Args:
            request: AgentRequest

        Returns:
            AgentResponse
        """
        start_time = datetime.utcnow()

        self._validate_request(request)

        try:
            input_data = VisionGeneratorInput(**request.payload)
        except Exception as e:
            raise AgentError(
                message=f"Invalid input: {str(e)}",
                agent=self.name,
                details={"payload": request.payload}
            )

        logger.info(f"[VisionGeneratorAgent] Generating {len(input_data.prompts)} images via {input_data.provider}")

        # 이미지 생성
        try:
            if input_data.batch_mode and len(input_data.prompts) > 1:
                generated_images = await self._generate_batch(
                    input_data.prompts,
                    input_data.provider,
                    input_data.max_concurrent
                )
            else:
                generated_images = []
                for prompt_req in input_data.prompts:
                    image = await self._generate_single(prompt_req, input_data.provider)
                    generated_images.append(image)

        except Exception as e:
            logger.error(f"[VisionGeneratorAgent] Generation failed: {e}")
            raise AgentError(
                message=f"Image generation failed: {str(e)}",
                agent=self.name,
                details={"provider": input_data.provider}
            )

        # 결과 집계
        total_generated = sum(1 for img in generated_images if img.status == "completed")
        total_failed = sum(1 for img in generated_images if img.status == "failed")
        elapsed = (datetime.utcnow() - start_time).total_seconds()

        output_data = VisionGeneratorOutput(
            images=generated_images,
            total_requested=len(input_data.prompts),
            total_generated=total_generated,
            total_failed=total_failed,
            total_time=elapsed
        )

        logger.info(f"[VisionGeneratorAgent] Generated {total_generated}/{len(input_data.prompts)} images in {elapsed:.2f}s")

        return AgentResponse(
            agent=self.name,
            task=request.task,
            outputs=[
                self._create_output(
                    output_type="json",
                    name="generated_images",
                    value=output_data.model_dump(),
                    meta={
                        "provider": input_data.provider,
                        "success_rate": total_generated / len(input_data.prompts) if input_data.prompts else 0
                    }
                )
            ],
            usage={
                "images_generated": total_generated,
                "images_failed": total_failed,
                "elapsed_seconds": elapsed
            },
            meta={
                "provider": input_data.provider,
                "batch_mode": input_data.batch_mode
            }
        )

    async def _generate_batch(
        self,
        prompts: List[ImageGenerationRequest],
        provider: str,
        max_concurrent: int
    ) -> List[GeneratedImage]:
        """배치 이미지 생성 (병렬)"""
        semaphore = asyncio.Semaphore(max_concurrent)

        async def generate_with_limit(prompt_req: ImageGenerationRequest) -> GeneratedImage:
            async with semaphore:
                return await self._generate_single(prompt_req, provider)

        tasks = [generate_with_limit(p) for p in prompts]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        images = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                images.append(GeneratedImage(
                    image_id=f"img_{uuid4().hex[:8]}",
                    prompt_text=prompts[i].prompt_text,
                    status="failed",
                    error=str(result)
                ))
            else:
                images.append(result)

        return images

    async def _generate_single(
        self,
        prompt_req: ImageGenerationRequest,
        provider: str
    ) -> GeneratedImage:
        """단일 이미지 생성"""
        start_time = datetime.utcnow()
        image_id = f"img_{uuid4().hex[:8]}"

        try:
            # 해상도 결정
            width, height = self.ASPECT_RATIO_SIZES.get(
                prompt_req.aspect_ratio,
                (1024, 1024)
            )

            # 제공자별 생성
            if provider == "nanobanana":
                result = await self._generate_nanobanana(prompt_req, width, height)
            elif provider == "comfyui":
                result = await self._generate_comfyui(prompt_req, width, height)
            elif provider == "dalle":
                result = await self._generate_dalle(prompt_req, width, height)
            else:
                # 기본: Nanobanana
                result = await self._generate_nanobanana(prompt_req, width, height)

            elapsed = (datetime.utcnow() - start_time).total_seconds()

            return GeneratedImage(
                image_id=image_id,
                prompt_text=prompt_req.prompt_text,
                image_url=result.get("url"),
                image_base64=result.get("base64"),
                width=width,
                height=height,
                seed_used=result.get("seed"),
                generation_time=elapsed,
                status="completed"
            )

        except Exception as e:
            logger.error(f"[VisionGeneratorAgent] Single image generation failed: {e}")
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            return GeneratedImage(
                image_id=image_id,
                prompt_text=prompt_req.prompt_text,
                generation_time=elapsed,
                status="failed",
                error=str(e)
            )

    async def _generate_nanobanana(
        self,
        prompt_req: ImageGenerationRequest,
        width: int,
        height: int
    ) -> Dict[str, Any]:
        """Nanobanana API로 이미지 생성"""
        # Media Gateway를 통해 Nanobanana API 호출
        try:
            result = await self.media_gateway.generate_image(
                prompt=prompt_req.prompt_text,
                negative_prompt=prompt_req.negative_prompt,
                width=width,
                height=height,
                seed=prompt_req.seed,
                provider="nanobanana"
            )
            return {
                "url": result.get("url"),
                "base64": result.get("base64"),
                "seed": result.get("seed")
            }
        except Exception as e:
            logger.warning(f"[VisionGeneratorAgent] Nanobanana failed, trying fallback: {e}")
            # 폴백: DALL-E
            return await self._generate_dalle(prompt_req, width, height)

    async def _generate_comfyui(
        self,
        prompt_req: ImageGenerationRequest,
        width: int,
        height: int
    ) -> Dict[str, Any]:
        """ComfyUI로 이미지 생성 (로컬)"""
        try:
            result = await self.media_gateway.generate_image(
                prompt=prompt_req.prompt_text,
                negative_prompt=prompt_req.negative_prompt,
                width=width,
                height=height,
                seed=prompt_req.seed,
                provider="comfyui"
            )
            return {
                "url": result.get("url"),
                "base64": result.get("base64"),
                "seed": result.get("seed")
            }
        except Exception as e:
            logger.error(f"[VisionGeneratorAgent] ComfyUI failed: {e}")
            raise

    async def _generate_dalle(
        self,
        prompt_req: ImageGenerationRequest,
        width: int,
        height: int
    ) -> Dict[str, Any]:
        """OpenAI DALL-E로 이미지 생성"""
        # DALL-E는 특정 크기만 지원
        # 1024x1024, 1024x1792, 1792x1024
        if width > height:
            dalle_size = "1792x1024"
        elif height > width:
            dalle_size = "1024x1792"
        else:
            dalle_size = "1024x1024"

        try:
            result = await self.media_gateway.generate_image(
                prompt=prompt_req.prompt_text,
                negative_prompt=prompt_req.negative_prompt,
                size=dalle_size,
                provider="dalle"
            )
            return {
                "url": result.get("url"),
                "base64": result.get("base64"),
                "seed": None  # DALL-E doesn't support seeds
            }
        except Exception as e:
            logger.error(f"[VisionGeneratorAgent] DALL-E failed: {e}")
            raise

    async def generate_from_concept(
        self,
        concept: Dict[str, Any],
        asset_type: str,
        count: int = 1
    ) -> AgentResponse:
        """
        컨셉에서 직접 이미지 생성 (VisualPromptAgent 통합)

        Args:
            concept: 컨셉 정보
            asset_type: 에셋 유형
            count: 생성할 이미지 수

        Returns:
            AgentResponse
        """
        from app.services.agents.visual_prompt import get_visual_prompt_agent

        # 1. VisualPromptAgent로 프롬프트 생성
        prompt_agent = get_visual_prompt_agent(llm_gateway=self.llm_gateway)
        prompt_response = await prompt_agent.execute(AgentRequest(
            task="generate_prompts",
            payload={
                "concept": concept,
                "asset_type": asset_type,
                "image_count": count
            }
        ))

        # 2. 프롬프트 추출
        prompts_output = prompt_response.outputs[0].value
        prompts = prompts_output.get("prompts", [])

        # 3. 이미지 생성 요청 구성
        generation_requests = [
            ImageGenerationRequest(
                prompt_text=p.get("prompt_text", ""),
                negative_prompt=p.get("negative_prompt", ""),
                aspect_ratio=p.get("aspect_ratio", "1:1")
            )
            for p in prompts
        ]

        # 4. 이미지 생성
        return await self.execute(AgentRequest(
            task="generate_images",
            payload={
                "prompts": [r.model_dump() for r in generation_requests],
                "provider": "nanobanana",
                "batch_mode": True
            }
        ))

    # =========================================================================
    # Plan-Act-Reflect 패턴 (v3.0)
    # =========================================================================

    async def execute_v3(self, request: AgentRequest) -> AgentResponse:
        """
        VisionGeneratorAgent v3.0 - Plan-Act-Reflect 패턴 적용

        기존 execute()를 래핑하여 목표 기반 자기 검수를 수행합니다.

        Args:
            request: Agent 요청 (goal 필드 권장)

        Returns:
            AgentResponse: 품질 검수를 통과한 이미지
        """
        logger.info(f"[{self.name}] execute_v3 called (Plan-Act-Reflect)")

        # Goal이 없으면 기본 Goal 생성
        if not request.goal:
            request.goal = AgentGoal(
                primary_objective="브랜드 컨셉에 맞는 고품질 이미지 생성",
                success_criteria=[
                    "프롬프트 의도와 결과 이미지 일치",
                    "해상도 및 비율 요구사항 충족",
                    "생성 성공률 80% 이상"
                ],
                quality_threshold=7.0,
                max_iterations=2
            )

        # Plan-Act-Reflect 실행
        return await self.execute_with_reflection(request)

    async def _plan(self, request: AgentRequest) -> ExecutionPlan:
        """
        VisionGenerator 전용 Plan 단계

        Args:
            request: Agent 요청

        Returns:
            ExecutionPlan
        """
        plan_id = f"vision_plan_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        goal = request.goal

        # 프로바이더별 접근 방식
        provider = request.payload.get("provider", "nanobanana")
        provider_approach = {
            "nanobanana": "Nanobanana API 호출 → 결과 검증 → 실패 시 DALL-E 폴백",
            "comfyui": "ComfyUI 로컬 생성 → 워크플로우 실행 → 결과 검증",
            "dalle": "DALL-E API 호출 → 해상도 조정 → 결과 검증"
        }

        approach = provider_approach.get(provider, provider_approach["nanobanana"])

        steps = [
            {"step": 1, "action": "프롬프트 및 옵션 검증", "status": "pending"},
            {"step": 2, "action": f"{provider} 프로바이더로 이미지 생성", "status": "pending"},
            {"step": 3, "action": "배치 처리 (병렬 생성)", "status": "pending"},
            {"step": 4, "action": "결과 검증 및 자기 검수", "status": "pending"}
        ]

        risks = [
            "API 호출 실패",
            "프롬프트 해석 오류",
            "해상도 불일치"
        ]

        prompt_count = len(request.payload.get("prompts", []))
        if prompt_count > 5:
            risks.append(f"대량 배치 처리 ({prompt_count}개)")

        return ExecutionPlan(
            plan_id=plan_id,
            steps=steps,
            approach=approach,
            estimated_quality=7.5,
            risks=risks
        )


# =============================================================================
# Factory Function
# =============================================================================

def get_vision_generator_agent(
    llm_gateway=None,
    media_gateway=None
) -> VisionGeneratorAgent:
    """VisionGeneratorAgent 인스턴스 반환"""
    return VisionGeneratorAgent(
        llm_gateway=llm_gateway,
        media_gateway=media_gateway
    )
