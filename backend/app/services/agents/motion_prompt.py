"""
Motion Prompt Agent

AI 영상 생성 (Luma/Runway/Veo)을 위한 모션 프롬프트 생성 전문 에이전트

작성일: 2025-12-01
작성자: B팀 (Backend)

기능:
- 정적 이미지 분석 후 자연스러운 모션 프롬프트 생성
- 씬 컨텍스트 기반 카메라 무빙 제안
- 브랜드 톤앤매너에 맞는 모션 스타일 결정

중요:
- AI 영상 생성은 비용이 높음 ($0.5~2 per video)
- 모션 프롬프트 품질이 영상 품질을 결정함
- 한 번에 좋은 프롬프트를 생성해야 재생성 비용 절감
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum

from .base import AgentBase, AgentRequest, AgentResponse, AgentError

logger = logging.getLogger(__name__)


# =============================================================================
# Motion Types & Presets
# =============================================================================

class MotionStyle(str, Enum):
    """모션 스타일"""
    CINEMATIC = "cinematic"      # 시네마틱 (부드럽고 웅장한)
    DYNAMIC = "dynamic"          # 다이나믹 (빠르고 에너지틱)
    GENTLE = "gentle"           # 부드러운 (느리고 차분한)
    DRAMATIC = "dramatic"        # 드라마틱 (강렬하고 임팩트 있는)
    NATURAL = "natural"          # 자연스러운 (일상적인)
    ELEGANT = "elegant"          # 우아한 (품격 있는)


class CameraMotion(str, Enum):
    """카메라 무빙 타입"""
    STATIC = "static"           # 고정
    SLOW_ZOOM_IN = "slow_zoom_in"     # 천천히 줌인
    SLOW_ZOOM_OUT = "slow_zoom_out"   # 천천히 줌아웃
    PAN_LEFT = "pan_left"       # 왼쪽으로 팬
    PAN_RIGHT = "pan_right"     # 오른쪽으로 팬
    TILT_UP = "tilt_up"         # 위로 틸트
    TILT_DOWN = "tilt_down"     # 아래로 틸트
    DOLLY_IN = "dolly_in"       # 돌리인 (카메라가 다가감)
    DOLLY_OUT = "dolly_out"     # 돌리아웃 (카메라가 멀어짐)
    ORBIT = "orbit"             # 오빗 (주변을 돎)
    CRANE_UP = "crane_up"       # 크레인업
    CRANE_DOWN = "crane_down"   # 크레인다운
    TRACKING = "tracking"       # 트래킹 (피사체 따라감)


class SubjectMotion(str, Enum):
    """피사체 움직임"""
    STILL = "still"             # 정지
    SUBTLE = "subtle"           # 미세한 움직임
    BREATHING = "breathing"     # 호흡하는 듯한 움직임
    SWAYING = "swaying"         # 흔들림 (바람에 등)
    FLOWING = "flowing"         # 흐르는 움직임
    FLOATING = "floating"       # 떠다니는 움직임
    WALKING = "walking"         # 걷는 움직임
    PARTICLES = "particles"     # 파티클/입자 움직임
    LIQUID = "liquid"           # 액체 움직임
    LIGHT_PLAY = "light_play"   # 빛의 변화


# =============================================================================
# Input/Output Schemas
# =============================================================================

class MotionPromptInput(BaseModel):
    """모션 프롬프트 생성 입력"""
    # 이미지 정보
    image_url: str = Field(..., description="이미지 URL")
    image_description: Optional[str] = Field(None, description="이미지 설명 (있으면)")

    # 씬 컨텍스트
    scene_index: int = Field(default=1, description="씬 번호")
    total_scenes: int = Field(default=1, description="전체 씬 수")
    scene_role: Optional[str] = Field(None, description="씬 역할 (intro/main/outro)")

    # 스크립트/내레이션
    script: Optional[str] = Field(None, description="이 씬의 나레이션 스크립트")
    caption: Optional[str] = Field(None, description="화면에 표시될 캡션")

    # 스타일 설정
    motion_style: MotionStyle = Field(default=MotionStyle.CINEMATIC, description="모션 스타일")
    duration_sec: float = Field(default=5.0, ge=3.0, le=10.0, description="영상 길이")

    # 브랜드 컨텍스트
    brand_tone: Optional[str] = Field(None, description="브랜드 톤앤매너")
    product_category: Optional[str] = Field(None, description="제품 카테고리")


class MotionPromptOutput(BaseModel):
    """모션 프롬프트 생성 출력"""
    # 주요 출력
    motion_prompt: str = Field(..., description="AI 영상 생성용 모션 프롬프트")
    motion_prompt_ko: str = Field(..., description="한국어 설명 (확인용)")

    # 구성 요소
    camera_motion: CameraMotion = Field(..., description="카메라 무빙")
    subject_motion: SubjectMotion = Field(..., description="피사체 움직임")

    # 메타
    confidence: float = Field(default=0.8, ge=0.0, le=1.0, description="신뢰도")
    reasoning: str = Field(default="", description="프롬프트 생성 이유")


class BatchMotionPromptInput(BaseModel):
    """배치 모션 프롬프트 생성 입력"""
    scenes: List[MotionPromptInput] = Field(..., description="씬 목록")
    motion_style: MotionStyle = Field(default=MotionStyle.CINEMATIC, description="전체 모션 스타일")
    brand_tone: Optional[str] = Field(None, description="브랜드 톤앤매너")


class BatchMotionPromptOutput(BaseModel):
    """배치 모션 프롬프트 생성 출력"""
    prompts: List[MotionPromptOutput] = Field(..., description="씬별 모션 프롬프트")
    style_consistency: float = Field(default=0.9, description="스타일 일관성")


# =============================================================================
# Motion Prompt Templates
# =============================================================================

MOTION_TEMPLATES = {
    # 제품 샷
    "product_hero": [
        "Camera slowly orbits around the {subject}, revealing its elegant design from multiple angles",
        "Gentle zoom in on {subject}, with soft light reflections dancing across its surface",
        "Slow dolly in towards {subject}, with subtle particle effects floating in the air",
    ],

    # 인물 샷
    "person_portrait": [
        "Subject's hair gently sways as if touched by a soft breeze, while camera slowly pushes in",
        "Subtle breathing motion, eyes slowly blink, camera gently pulls back",
        "Subject turns head slightly, soft smile forms, warm light plays across face",
    ],

    # 풍경/공간
    "landscape": [
        "Camera slowly pans across the scene, clouds drift gently in the sky",
        "Soft crane up revealing the full vista, light shifts subtly",
        "Gentle tracking shot through the space, elements sway naturally",
    ],

    # 음식/요리
    "food": [
        "Steam rises gently from the dish, camera slowly pushes in",
        "Sauce slowly drips, garnish settles, soft lighting shift",
        "Slow orbit around the plate, highlighting textures and colors",
    ],

    # 라이프스타일
    "lifestyle": [
        "Natural movement in frame, soft focus shift, warm ambient light",
        "Subject interacts naturally with environment, camera gently follows",
        "Slow motion moment, subtle environmental particles float",
    ],

    # 추상/그래픽
    "abstract": [
        "Colors slowly morph and blend, shapes gently transform",
        "Particles float and swirl in elegant patterns",
        "Geometric elements shift and rotate in harmonious motion",
    ],
}

# 스타일별 수식어
STYLE_MODIFIERS = {
    MotionStyle.CINEMATIC: [
        "cinematic lighting shifts",
        "film-like quality",
        "dramatic depth of field",
        "anamorphic lens flares",
    ],
    MotionStyle.DYNAMIC: [
        "energetic movement",
        "quick transitions",
        "vibrant energy",
        "impactful motion",
    ],
    MotionStyle.GENTLE: [
        "soft and subtle",
        "delicate movement",
        "peaceful atmosphere",
        "serene motion",
    ],
    MotionStyle.DRAMATIC: [
        "high contrast",
        "bold shadows",
        "intense atmosphere",
        "powerful presence",
    ],
    MotionStyle.NATURAL: [
        "organic movement",
        "realistic motion",
        "authentic feel",
        "lifelike quality",
    ],
    MotionStyle.ELEGANT: [
        "refined movement",
        "graceful motion",
        "sophisticated style",
        "luxurious feel",
    ],
}

# 씬 역할별 카메라 제안
SCENE_ROLE_CAMERAS = {
    "intro": [CameraMotion.SLOW_ZOOM_IN, CameraMotion.CRANE_DOWN, CameraMotion.DOLLY_IN],
    "main": [CameraMotion.ORBIT, CameraMotion.PAN_LEFT, CameraMotion.PAN_RIGHT, CameraMotion.TRACKING],
    "outro": [CameraMotion.SLOW_ZOOM_OUT, CameraMotion.CRANE_UP, CameraMotion.DOLLY_OUT],
}


# =============================================================================
# Motion Prompt Agent
# =============================================================================

class MotionPromptAgent(AgentBase):
    """
    Motion Prompt Agent

    AI 영상 생성 (Luma/Runway/Veo)을 위한 고품질 모션 프롬프트를 생성합니다.

    주요 작업:
    1. generate_motion_prompt: 단일 씬 모션 프롬프트 생성
    2. generate_batch_prompts: 배치 모션 프롬프트 생성
    3. analyze_image: 이미지 분석 후 최적 모션 제안

    사용 예시:
        agent = MotionPromptAgent()
        response = await agent.execute(AgentRequest(
            task="generate_motion_prompt",
            payload={
                "image_url": "https://...",
                "scene_role": "intro",
                "motion_style": "cinematic",
                "script": "혁신적인 디자인의 무선 이어폰"
            }
        ))
    """

    @property
    def name(self) -> str:
        return "motion_prompt"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """모션 프롬프트 생성 실행"""
        start_time = datetime.utcnow()

        self._validate_request(request)

        logger.info(f"[MotionPromptAgent] Starting task: {request.task}")

        try:
            if request.task == "generate_motion_prompt":
                result = await self._generate_single_prompt(request.payload)
            elif request.task == "generate_batch_prompts":
                result = await self._generate_batch_prompts(request.payload)
            elif request.task == "analyze_image":
                result = await self._analyze_image(request.payload)
            else:
                raise AgentError(
                    message=f"Unsupported task: {request.task}",
                    agent=self.name
                )

            elapsed = (datetime.utcnow() - start_time).total_seconds()

            logger.info(f"[MotionPromptAgent] Task completed in {elapsed:.2f}s")

            return AgentResponse(
                agent=self.name,
                task=request.task,
                outputs=[
                    self._create_output(
                        output_type="json",
                        name="motion_prompt",
                        value=result,
                        meta={"task": request.task}
                    )
                ],
                usage={
                    "elapsed_seconds": elapsed,
                    "llm_calls": 1 if request.task != "generate_batch_prompts" else len(request.payload.get("scenes", []))
                },
                meta={"task": request.task}
            )

        except Exception as e:
            logger.error(f"[MotionPromptAgent] Error: {e}", exc_info=True)
            raise AgentError(
                message=f"Motion prompt generation failed: {str(e)}",
                agent=self.name,
                details={"task": request.task}
            )

    async def _generate_single_prompt(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """단일 씬 모션 프롬프트 생성"""
        try:
            input_data = MotionPromptInput(**payload)
        except Exception as e:
            raise AgentError(
                message=f"Invalid input: {e}",
                agent=self.name
            )

        # 1. LLM으로 이미지 분석 및 모션 프롬프트 생성
        prompt = self._build_llm_prompt(input_data)

        try:
            llm_response = await self.llm_gateway.generate(
                role="motion_prompt_generator",
                task="generate_motion_prompt",
                prompt=prompt,
                mode="json",
                options={
                    "temperature": 0.7,
                    "max_tokens": 1000
                }
            )

            if llm_response.output.type == "json":
                result = llm_response.output.value
                return self._validate_and_enhance_result(result, input_data)
            else:
                # LLM 실패 시 폴백
                return self._generate_fallback_prompt(input_data)

        except Exception as e:
            logger.warning(f"[MotionPromptAgent] LLM call failed: {e}, using fallback")
            return self._generate_fallback_prompt(input_data)

    async def _generate_batch_prompts(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """배치 모션 프롬프트 생성"""
        try:
            input_data = BatchMotionPromptInput(**payload)
        except Exception as e:
            raise AgentError(
                message=f"Invalid batch input: {e}",
                agent=self.name
            )

        results = []
        for scene in input_data.scenes:
            # 배치 컨텍스트 추가
            scene_dict = scene.model_dump()
            scene_dict["motion_style"] = input_data.motion_style
            scene_dict["brand_tone"] = input_data.brand_tone or scene.brand_tone

            result = await self._generate_single_prompt(scene_dict)
            results.append(MotionPromptOutput(**result))

        return BatchMotionPromptOutput(
            prompts=results,
            style_consistency=self._calculate_style_consistency(results)
        ).model_dump()

    async def _analyze_image(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """이미지 분석 후 최적 모션 제안"""
        image_url = payload.get("image_url")
        if not image_url:
            raise AgentError(
                message="image_url is required",
                agent=self.name
            )

        # Vision LLM으로 이미지 분석
        prompt = f"""Analyze this image and suggest the best motion for AI video generation.

Image URL: {image_url}

Respond in JSON format:
{{
    "detected_category": "product|person|landscape|food|lifestyle|abstract",
    "detected_elements": ["list", "of", "elements"],
    "suggested_camera_motion": "slow_zoom_in|orbit|pan_left|...",
    "suggested_subject_motion": "still|subtle|breathing|swaying|...",
    "motion_description": "Brief description of suggested motion",
    "confidence": 0.0-1.0
}}
"""

        try:
            llm_response = await self.llm_gateway.generate(
                role="image_analyzer",
                task="analyze_for_motion",
                prompt=prompt,
                mode="json",
                options={
                    "temperature": 0.3,
                    "max_tokens": 500
                }
            )

            if llm_response.output.type == "json":
                return llm_response.output.value
            else:
                return self._default_image_analysis()

        except Exception as e:
            logger.warning(f"[MotionPromptAgent] Image analysis failed: {e}")
            return self._default_image_analysis()

    def _build_llm_prompt(self, input_data: MotionPromptInput) -> str:
        """LLM 프롬프트 구성"""
        scene_context = ""
        if input_data.scene_role:
            scene_context = f"Scene role: {input_data.scene_role} ({input_data.scene_index}/{input_data.total_scenes})"

        script_context = ""
        if input_data.script:
            script_context = f"Narration: \"{input_data.script}\""

        brand_context = ""
        if input_data.brand_tone:
            brand_context = f"Brand tone: {input_data.brand_tone}"
        if input_data.product_category:
            brand_context += f", Product: {input_data.product_category}"

        prompt = f"""You are an expert AI Video Director specializing in motion prompts for Luma AI, Runway, and Google Veo.

Your task is to create a high-quality motion prompt that will transform a static image into an engaging video.

IMAGE CONTEXT:
- Image URL: {input_data.image_url}
{f'- Image description: {input_data.image_description}' if input_data.image_description else ''}

SCENE CONTEXT:
{scene_context}
{script_context}
{brand_context}

STYLE REQUIREMENTS:
- Motion style: {input_data.motion_style.value}
- Duration: {input_data.duration_sec} seconds
- The motion should feel natural and enhance the storytelling

IMPORTANT GUIDELINES:
1. The prompt should describe MOTION, not just describe the image
2. Include camera movement AND subject movement
3. Consider the emotional tone matching the narration
4. Keep it concise but descriptive (50-100 words ideal)
5. Avoid impossible physics or jarring movements
6. For {input_data.motion_style.value} style, emphasize: {', '.join(STYLE_MODIFIERS.get(input_data.motion_style, ['natural movement'])[:2])}

Respond in JSON format:
{{
    "motion_prompt": "English prompt for AI video generation (50-100 words)",
    "motion_prompt_ko": "한국어 설명 (이 모션이 어떤 효과를 줄지)",
    "camera_motion": "slow_zoom_in|slow_zoom_out|pan_left|pan_right|tilt_up|tilt_down|dolly_in|dolly_out|orbit|crane_up|crane_down|tracking|static",
    "subject_motion": "still|subtle|breathing|swaying|flowing|floating|walking|particles|liquid|light_play",
    "confidence": 0.0-1.0,
    "reasoning": "Why this motion works for this scene"
}}
"""
        return prompt

    def _generate_fallback_prompt(self, input_data: MotionPromptInput) -> Dict[str, Any]:
        """폴백 모션 프롬프트 생성 (LLM 실패 시)"""
        import random

        # 씬 역할에 따른 카메라 선택
        role = input_data.scene_role or "main"
        camera_options = SCENE_ROLE_CAMERAS.get(role, [CameraMotion.SLOW_ZOOM_IN])
        camera_motion = random.choice(camera_options)

        # 스타일에 따른 수식어
        style_mods = STYLE_MODIFIERS.get(input_data.motion_style, ["natural movement"])

        # 기본 모션 프롬프트 구성
        motion_parts = []

        # 카메라 무빙
        camera_descriptions = {
            CameraMotion.SLOW_ZOOM_IN: "Camera slowly zooms in",
            CameraMotion.SLOW_ZOOM_OUT: "Camera slowly pulls back",
            CameraMotion.PAN_LEFT: "Camera gently pans left",
            CameraMotion.PAN_RIGHT: "Camera gently pans right",
            CameraMotion.ORBIT: "Camera slowly orbits around the subject",
            CameraMotion.DOLLY_IN: "Camera smoothly dollies in",
            CameraMotion.DOLLY_OUT: "Camera smoothly dollies out",
            CameraMotion.CRANE_UP: "Camera cranes up revealing the scene",
            CameraMotion.CRANE_DOWN: "Camera cranes down into the scene",
            CameraMotion.TILT_UP: "Camera tilts up",
            CameraMotion.TILT_DOWN: "Camera tilts down",
            CameraMotion.TRACKING: "Camera tracks the subject",
            CameraMotion.STATIC: "Camera holds steady",
        }
        motion_parts.append(camera_descriptions.get(camera_motion, "Camera moves gently"))

        # 피사체 움직임 (기본)
        subject_motion = SubjectMotion.SUBTLE
        if input_data.product_category:
            if "food" in input_data.product_category.lower():
                subject_motion = SubjectMotion.LIQUID
                motion_parts.append("steam rises gently")
            elif "fashion" in input_data.product_category.lower():
                subject_motion = SubjectMotion.SWAYING
                motion_parts.append("fabric sways softly")
            else:
                motion_parts.append("subtle environmental movement")
        else:
            motion_parts.append("subtle ambient motion")

        # 스타일 수식어 추가
        motion_parts.append(random.choice(style_mods))

        # 최종 프롬프트
        motion_prompt = ", ".join(motion_parts) + f", {input_data.motion_style.value} style, {input_data.duration_sec} seconds"

        return MotionPromptOutput(
            motion_prompt=motion_prompt,
            motion_prompt_ko=f"{camera_descriptions.get(camera_motion, '카메라 움직임')}과 함께 {input_data.motion_style.value} 스타일의 자연스러운 모션",
            camera_motion=camera_motion,
            subject_motion=subject_motion,
            confidence=0.6,
            reasoning="Generated using fallback template based on scene role and style"
        ).model_dump()

    def _validate_and_enhance_result(
        self,
        result: Dict[str, Any],
        input_data: MotionPromptInput
    ) -> Dict[str, Any]:
        """LLM 결과 검증 및 보완"""
        # 필수 필드 확인
        if "motion_prompt" not in result:
            return self._generate_fallback_prompt(input_data)

        # 카메라 모션 검증
        camera_motion = result.get("camera_motion", "slow_zoom_in")
        try:
            camera_motion = CameraMotion(camera_motion)
        except ValueError:
            camera_motion = CameraMotion.SLOW_ZOOM_IN

        # 피사체 모션 검증
        subject_motion = result.get("subject_motion", "subtle")
        try:
            subject_motion = SubjectMotion(subject_motion)
        except ValueError:
            subject_motion = SubjectMotion.SUBTLE

        return MotionPromptOutput(
            motion_prompt=result["motion_prompt"],
            motion_prompt_ko=result.get("motion_prompt_ko", "모션 프롬프트"),
            camera_motion=camera_motion,
            subject_motion=subject_motion,
            confidence=result.get("confidence", 0.8),
            reasoning=result.get("reasoning", "")
        ).model_dump()

    def _default_image_analysis(self) -> Dict[str, Any]:
        """기본 이미지 분석 결과"""
        return {
            "detected_category": "product",
            "detected_elements": ["unknown"],
            "suggested_camera_motion": "slow_zoom_in",
            "suggested_subject_motion": "subtle",
            "motion_description": "Gentle zoom with subtle ambient motion",
            "confidence": 0.5
        }

    def _calculate_style_consistency(self, results: List[MotionPromptOutput]) -> float:
        """스타일 일관성 계산"""
        if len(results) <= 1:
            return 1.0

        # 카메라 모션 일관성
        camera_types = [r.camera_motion for r in results]
        unique_cameras = len(set(camera_types))
        camera_consistency = 1.0 - (unique_cameras - 1) / len(results)

        # 평균 신뢰도
        avg_confidence = sum(r.confidence for r in results) / len(results)

        return (camera_consistency * 0.6 + avg_confidence * 0.4)


# =============================================================================
# Factory Function
# =============================================================================

def get_motion_prompt_agent(llm_gateway=None) -> MotionPromptAgent:
    """MotionPromptAgent 인스턴스 반환"""
    return MotionPromptAgent(llm_gateway=llm_gateway)
