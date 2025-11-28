"""
Designer Agent

비주얼 콘텐츠 생성 전문 Agent

작성일: 2025-11-16
수정일: 2025-11-29 - execute_v3() 메서드 추가 (Plan-Act-Reflect 패턴)
작성자: B팀 (Backend)
문서: ARCH-003, SPEC-002, B_TEAM_AGENT_UPGRADE_PLAN.md
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

from .base import (
    AgentBase, AgentRequest, AgentResponse, AgentError,
    AgentGoal, SelfReview, ExecutionPlan
)

logger = logging.getLogger(__name__)


class DesignerAgent(AgentBase):
    """
    Designer Agent

    제품 이미지, 브랜드 로고, SNS 썸네일 등 비주얼 콘텐츠 생성

    **Media Gateway 사용**:
    - ComfyUI Provider를 통한 이미지 생성
    - 작업별 최적화된 프롬프트 구성
    - LLM을 활용한 프롬프트 개선 (선택)

    주요 작업:
    1. product_image: 제품 이미지 생성 (1024x1024)
    2. brand_logo: 브랜드 로고 생성 (512x512)
    3. sns_thumbnail: SNS 썸네일 생성 (1200x630)
    4. ad_banner: 광고 배너 생성 (1920x1080)
    5. illustration: 일러스트레이션 생성

    사용 예시:
        agent = DesignerAgent()
        response = await agent.execute(AgentRequest(
            task="product_image",
            payload={
                "product_name": "무선 이어폰",
                "description": "프리미엄 노이즈캔슬링",
                "style": "minimal"
            },
            options={
                "enhance_prompt": True,  # LLM으로 프롬프트 개선
                "width": 1024,
                "height": 1024
            }
        ))
    """

    @property
    def name(self) -> str:
        return "designer"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        Designer Agent 실행

        Args:
            request: Agent 요청

        Returns:
            AgentResponse: 생성된 이미지 (Base64)

        Raises:
            AgentError: 실행 실패 시
        """
        start_time = datetime.utcnow()

        try:
            # 1. 요청 검증
            self._validate_request(request)

            logger.info(f"Designer Agent executing: task={request.task}")

            # 2. 프롬프트 구성
            prompt = await self._build_visual_prompt(request)

            # 3. Media Gateway 옵션 구성
            media_options = self._build_media_options(request)

            # 4. Media Gateway 호출
            media_response = await self.media_gateway.generate(
                prompt=prompt,
                task=request.task,
                media_type="image",
                options=media_options
            )

            # 5. 응답 변환
            outputs = self._convert_media_outputs(media_response, request.task)

            # 6. 사용량 계산
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            usage = {
                "media_provider": media_response.provider,
                "images_generated": len(media_response.outputs),
                "elapsed_seconds": round(elapsed, 2)
            }

            # LLM을 사용한 경우 토큰 사용량 추가
            if request.options and request.options.get("enhance_prompt"):
                usage["llm_used"] = True

            # 7. 메타데이터
            meta = {
                "media_provider": media_response.provider,
                "media_model": media_response.model,
                "task": request.task,
                "prompt": prompt,  # 사용된 프롬프트 기록
                "style": request.payload.get("style", "default")
            }

            logger.info(
                f"Designer Agent success: task={request.task}, "
                f"provider={media_response.provider}, "
                f"elapsed={elapsed:.2f}s, images={len(outputs)}"
            )

            return AgentResponse(
                agent=self.name,
                task=request.task,
                outputs=outputs,
                usage=usage,
                meta=meta
            )

        except Exception as e:
            logger.error(f"Designer Agent failed: {str(e)}", exc_info=True)
            raise AgentError(
                message=f"Designer execution failed: {str(e)}",
                agent=self.name,
                details={"task": request.task, "payload": request.payload}
            )

    async def _build_visual_prompt(self, request: AgentRequest) -> str:
        """
        비주얼 생성용 프롬프트 구성

        옵션에 따라 LLM을 사용하여 프롬프트를 개선할 수 있음

        Args:
            request: Agent 요청

        Returns:
            최종 프롬프트
        """
        # 기본 프롬프트 구성
        base_prompt = self._compose_base_prompt(request)

        # LLM 프롬프트 개선 옵션 확인
        enhance_prompt = (
            request.options and
            request.options.get("enhance_prompt", False)
        )

        if enhance_prompt:
            # LLM을 사용하여 프롬프트 개선
            enhanced = await self._enhance_prompt_with_llm(base_prompt, request)
            logger.info(f"Prompt enhanced by LLM: {enhanced[:100]}...")
            return enhanced
        else:
            return base_prompt

    def _compose_base_prompt(self, request: AgentRequest) -> str:
        """
        기본 프롬프트 구성 (템플릿 기반)

        Args:
            request: Agent 요청

        Returns:
            기본 프롬프트
        """
        payload = request.payload
        task = request.task

        # 작업별 프롬프트 템플릿
        templates = {
            "product_image": (
                "{product_name} product photo, {description}, "
                "{style} style, professional lighting, white background, "
                "high quality, commercial photography"
            ),
            "brand_logo": (
                "{brand_name} logo design, {description}, "
                "{style} style, simple, memorable, scalable, "
                "professional branding"
            ),
            "sns_thumbnail": (
                "{title} social media thumbnail, {description}, "
                "{style} style, eye-catching, vibrant colors, "
                "optimized for social platforms"
            ),
            "ad_banner": (
                "{title} advertising banner, {description}, "
                "{style} style, attention-grabbing, "
                "professional marketing visual"
            ),
            "illustration": (
                "{subject} illustration, {description}, "
                "{style} style, creative, artistic"
            )
        }

        # 템플릿 선택
        template = templates.get(task, "{description}, {style} style, high quality")

        # Payload 값으로 템플릿 채우기
        prompt_vars = {
            "product_name": payload.get("product_name", "product"),
            "brand_name": payload.get("brand_name", "brand"),
            "title": payload.get("title", "image"),
            "subject": payload.get("subject", "subject"),
            "description": payload.get("description", ""),
            "style": payload.get("style", "modern")
        }

        # 템플릿 포맷팅
        try:
            prompt = template.format(**prompt_vars)
        except KeyError as e:
            logger.warning(f"Template formatting failed: {e}, using fallback")
            prompt = f"{payload.get('description', 'image')}, {payload.get('style', 'modern')} style"

        return prompt

    async def _enhance_prompt_with_llm(
        self,
        base_prompt: str,
        request: AgentRequest
    ) -> str:
        """
        LLM을 사용하여 프롬프트 개선

        Args:
            base_prompt: 기본 프롬프트
            request: Agent 요청

        Returns:
            개선된 프롬프트
        """
        try:
            # LLM에게 프롬프트 개선 요청
            llm_response = await self.llm_gateway.generate(
                role="prompt_engineer",
                task="enhance_image_prompt",
                payload={
                    "base_prompt": base_prompt,
                    "task_type": request.task,
                    "additional_context": request.payload
                },
                mode="text",
                options={"temperature": 0.7}
            )

            # LLM 응답에서 개선된 프롬프트 추출
            enhanced_prompt = llm_response.output.value

            # 문자열 정제 (불필요한 줄바꿈 제거 등)
            if isinstance(enhanced_prompt, str):
                enhanced_prompt = enhanced_prompt.strip().replace("\n", " ")
                return enhanced_prompt
            else:
                logger.warning("LLM returned non-string, using base prompt")
                return base_prompt

        except Exception as e:
            logger.error(f"Prompt enhancement failed: {str(e)}, using base prompt")
            return base_prompt

    def _build_media_options(self, request: AgentRequest) -> Dict[str, Any]:
        """
        Media Gateway 옵션 구성

        Args:
            request: Agent 요청

        Returns:
            Media Gateway 옵션
        """
        # 작업별 기본 해상도
        default_sizes = {
            "product_image": {"width": 1024, "height": 1024},
            "brand_logo": {"width": 512, "height": 512},
            "sns_thumbnail": {"width": 1200, "height": 630},
            "ad_banner": {"width": 1920, "height": 1080},
            "illustration": {"width": 1024, "height": 1024}
        }

        # 기본값
        size = default_sizes.get(request.task, {"width": 1024, "height": 1024})

        options = {
            "width": size["width"],
            "height": size["height"],
            "steps": 30,
            "cfg_scale": 7.0
        }

        # 사용자 옵션으로 오버라이드
        if request.options:
            if "width" in request.options:
                options["width"] = request.options["width"]
            if "height" in request.options:
                options["height"] = request.options["height"]
            if "steps" in request.options:
                options["steps"] = request.options["steps"]
            if "cfg_scale" in request.options:
                options["cfg_scale"] = request.options["cfg_scale"]
            if "seed" in request.options:
                options["seed"] = request.options["seed"]
            if "negative_prompt" in request.options:
                options["negative_prompt"] = request.options["negative_prompt"]

        return options

    def _convert_media_outputs(self, media_response, task: str) -> list:
        """
        Media Gateway 응답을 AgentOutput 리스트로 변환

        Args:
            media_response: Media Gateway 응답
            task: 작업 유형

        Returns:
            AgentOutput 리스트
        """
        outputs = []

        for idx, media_output in enumerate(media_response.outputs):
            # 작업별 출력 이름 지정
            output_names = {
                "product_image": "product_visual",
                "brand_logo": "logo_design",
                "sns_thumbnail": "thumbnail",
                "ad_banner": "banner",
                "illustration": "artwork"
            }

            base_name = output_names.get(task, "image")
            output_name = f"{base_name}_{idx + 1}" if len(media_response.outputs) > 1 else base_name

            outputs.append(self._create_output(
                output_type="image",
                name=output_name,
                value=media_output.data,  # Base64 데이터
                meta={
                    "format": media_output.format,
                    "width": media_output.width,
                    "height": media_output.height
                }
            ))

        return outputs


    # ========================================================================
    # Plan-Act-Reflect 패턴 (v3.0)
    # ========================================================================

    async def execute_v3(self, request: AgentRequest) -> AgentResponse:
        """
        Designer Agent v3.0 - Plan-Act-Reflect 패턴 적용

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
                primary_objective=f"{request.task} 작업에 최적화된 비주얼 생성",
                success_criteria=[
                    "브랜드 톤앤매너 일관성",
                    "해상도 및 품질 요구사항 충족",
                    "구도 및 레이아웃 적절성"
                ],
                quality_threshold=7.0,
                max_iterations=2
            )

        # Plan-Act-Reflect 실행
        return await self.execute_with_reflection(request)

    async def _plan(self, request: AgentRequest) -> ExecutionPlan:
        """
        Designer 전용 Plan 단계

        Args:
            request: Agent 요청

        Returns:
            ExecutionPlan
        """
        plan_id = f"designer_plan_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        goal = request.goal

        # 작업별 접근 방식 결정
        approach_map = {
            "product_image": "제품 특성 분석 → 프롬프트 최적화 → 이미지 생성 → 품질 검수",
            "brand_logo": "브랜드 아이덴티티 분석 → 심볼 컨셉 → 로고 생성",
            "sns_thumbnail": "플랫폼 사양 확인 → 시선 집중 구도 → 썸네일 생성",
            "ad_banner": "광고 목적 분석 → CTA 배치 → 배너 생성",
            "illustration": "스타일 정의 → 구도 설계 → 일러스트 생성"
        }

        approach = approach_map.get(request.task, "표준 비주얼 생성 프로세스")

        steps = [
            {"step": 1, "action": "입력 분석 및 스타일 가이드 확인", "status": "pending"},
            {"step": 2, "action": "프롬프트 구성 (LLM 개선 선택)", "status": "pending"},
            {"step": 3, "action": "Media Gateway 이미지 생성", "status": "pending"},
            {"step": 4, "action": "자기 검수 (Self-Review)", "status": "pending"}
        ]

        risks = ["프롬프트 해석 오류", "스타일 불일치"]
        if request.options and request.options.get("enhance_prompt"):
            risks.append("LLM 프롬프트 개선 실패 가능성")

        return ExecutionPlan(
            plan_id=plan_id,
            steps=steps,
            approach=approach,
            estimated_quality=7.5,
            risks=risks
        )


# ============================================================================
# Factory Function
# ============================================================================

def get_designer_agent(llm_gateway=None, media_gateway=None) -> DesignerAgent:
    """
    Designer Agent 인스턴스 반환

    Args:
        llm_gateway: LLM Gateway (None이면 전역 인스턴스 사용)
        media_gateway: Media Gateway (None이면 전역 인스턴스 사용)

    Returns:
        DesignerAgent 인스턴스
    """
    return DesignerAgent(llm_gateway=llm_gateway, media_gateway=media_gateway)
