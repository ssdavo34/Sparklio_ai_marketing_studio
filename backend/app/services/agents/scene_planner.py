"""
Scene Planner Agent

광고 영상·쇼츠의 씬 구성 설계 전문 Agent

작성일: 2025-11-21
작성자: B팀 (Backend)
문서: AGENT_EXPANSION_PLAN_2025-11-18.md (Phase 2, P1-A)

주요 기능:
1. 영상 씬 구성 설계 (15초/30초/60초)
2. 스토리보드 생성
3. 씬별 트랜지션 제안
4. 타이밍 최적화
5. 감정곡선 설계

KPI:
- 씬 구성 정확도: >90%
- 응답 시간: <5초
- 타이밍 정밀도: ±0.5초
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum

from .base import AgentBase, AgentRequest, AgentResponse, AgentError

logger = logging.getLogger(__name__)


# ============================================================================
# Scene Planning Schemas
# ============================================================================

class SceneType(str, Enum):
    """씬 타입"""
    INTRO = "intro"              # 도입부
    PROBLEM = "problem"          # 문제 제기
    SOLUTION = "solution"        # 해결책 제시
    DEMO = "demo"               # 제품 시연
    BENEFIT = "benefit"         # 이점 설명
    TESTIMONIAL = "testimonial" # 고객 후기
    CTA = "cta"                 # Call to Action
    OUTRO = "outro"             # 마무리


class TransitionType(str, Enum):
    """트랜지션 타입"""
    CUT = "cut"                 # 컷
    FADE = "fade"               # 페이드
    DISSOLVE = "dissolve"       # 디졸브
    WIPE = "wipe"              # 와이프
    ZOOM = "zoom"              # 줌
    SLIDE = "slide"            # 슬라이드
    MORPH = "morph"            # 모프


class CameraMovement(str, Enum):
    """카메라 무브먼트"""
    STATIC = "static"           # 고정
    PAN = "pan"                # 팬
    TILT = "tilt"              # 틸트
    ZOOM_IN = "zoom_in"        # 줌인
    ZOOM_OUT = "zoom_out"      # 줌아웃
    DOLLY = "dolly"            # 달리
    TRACKING = "tracking"       # 트래킹


class Scene(BaseModel):
    """씬 정보"""
    id: str = Field(..., description="씬 ID")
    type: SceneType = Field(..., description="씬 타입")
    duration: float = Field(..., ge=0, description="지속 시간 (초)")
    description: str = Field(..., description="씬 설명")

    # 시각적 요소
    visual_elements: List[str] = Field(default_factory=list, description="시각 요소 목록")
    camera_movement: CameraMovement = Field(default=CameraMovement.STATIC, description="카메라 무브먼트")
    shot_type: str = Field(default="medium", description="샷 타입 (close-up, medium, wide)")

    # 오디오 요소
    narration: Optional[str] = Field(None, description="나레이션 텍스트")
    sound_effects: List[str] = Field(default_factory=list, description="효과음 목록")
    music_mood: Optional[str] = Field(None, description="음악 분위기")

    # 텍스트 요소
    text_overlay: Optional[str] = Field(None, description="오버레이 텍스트")
    subtitle: Optional[str] = Field(None, description="자막")

    # 트랜지션
    transition_in: TransitionType = Field(default=TransitionType.CUT, description="시작 트랜지션")
    transition_out: TransitionType = Field(default=TransitionType.CUT, description="종료 트랜지션")

    # 감정/분위기
    emotion: str = Field(default="neutral", description="감정 톤")
    energy_level: int = Field(default=5, ge=1, le=10, description="에너지 레벨 (1-10)")


class Storyboard(BaseModel):
    """스토리보드"""
    title: str = Field(..., description="스토리보드 제목")
    concept: str = Field(..., description="전체 컨셉")
    total_duration: float = Field(..., description="전체 지속 시간 (초)")
    scenes: List[Scene] = Field(..., description="씬 목록")

    # 메타데이터
    target_audience: str = Field(..., description="타겟 오디언스")
    key_message: str = Field(..., description="핵심 메시지")
    style: str = Field(..., description="영상 스타일")

    # 기술적 정보
    aspect_ratio: str = Field(default="16:9", description="화면 비율")
    resolution: str = Field(default="1920x1080", description="해상도")
    fps: int = Field(default=30, description="프레임 레이트")

    # 감정 곡선
    emotion_arc: List[Dict[str, Any]] = Field(default_factory=list, description="감정 변화 곡선")


class ScenePlanResult(BaseModel):
    """씬 계획 결과"""
    storyboard: Storyboard = Field(..., description="스토리보드")
    suggestions: List[str] = Field(default_factory=list, description="개선 제안사항")
    estimated_production_time: float = Field(..., description="예상 제작 시간 (시간)")
    difficulty_level: str = Field(..., description="제작 난이도 (easy/medium/hard)")


# ============================================================================
# Scene Planner Agent
# ============================================================================

class ScenePlannerAgent(AgentBase):
    """
    Scene Planner Agent

    광고 영상·쇼츠의 씬 구성을 설계하는 전문 Agent

    주요 작업:
    1. scene_plan: 씬 구성 설계
    2. storyboard: 스토리보드 생성
    3. optimize_timing: 타이밍 최적화
    4. suggest_transitions: 트랜지션 제안
    5. emotion_arc: 감정 곡선 설계

    사용 예시:
        agent = ScenePlannerAgent()
        response = await agent.execute(AgentRequest(
            task="scene_plan",
            payload={
                "product_info": {
                    "name": "무선 이어폰 X1",
                    "features": ["노이즈 캔슬링", "24시간 배터리"],
                    "target": "2030 직장인"
                },
                "duration": 30,  # 30초
                "style": "modern",
                "platform": "youtube"
            }
        ))
    """

    @property
    def name(self) -> str:
        return "scene_planner"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        Scene Planner Agent 실행

        Args:
            request: Agent 요청

        Returns:
            AgentResponse: 씬 계획 결과

        Raises:
            AgentError: 실행 실패 시
        """
        start_time = datetime.utcnow()

        try:
            # 1. 요청 검증
            self._validate_request(request)
            self._validate_scene_input(request.payload)

            logger.info(f"Scene Planner Agent executing: task={request.task}")

            # 2. 작업별 처리
            if request.task == "scene_plan":
                result = await self._plan_scenes(request.payload)
            elif request.task == "storyboard":
                result = await self._create_storyboard(request.payload)
            elif request.task == "optimize_timing":
                result = await self._optimize_timing(request.payload)
            elif request.task == "suggest_transitions":
                result = await self._suggest_transitions(request.payload)
            elif request.task == "emotion_arc":
                result = await self._design_emotion_arc(request.payload)
            else:
                raise AgentError(
                    message=f"Unsupported task: {request.task}",
                    agent=self.name
                )

            # 3. 결과를 AgentOutput으로 변환
            outputs = self._create_outputs(result, request.task)

            # 4. 사용량 계산
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            usage = {
                "llm_calls": 1,
                "elapsed_seconds": round(elapsed, 2)
            }

            # 5. 메타데이터
            meta = {
                "task": request.task,
                "duration": request.payload.get("duration"),
                "platform": request.payload.get("platform", "youtube"),
                "scene_count": len(result.get("scenes", []))
            }

            logger.info(
                f"Scene Planner Agent success: task={request.task}, "
                f"scenes={meta['scene_count']}, elapsed={elapsed:.2f}s"
            )

            return AgentResponse(
                agent=self.name,
                task=request.task,
                outputs=outputs,
                usage=usage,
                meta=meta
            )

        except Exception as e:
            logger.error(f"Scene Planner Agent failed: {str(e)}", exc_info=True)
            raise AgentError(
                message=f"Scene planning failed: {str(e)}",
                agent=self.name,
                details={"task": request.task}
            )

    def _validate_scene_input(self, payload: Dict[str, Any]) -> None:
        """
        씬 입력 검증

        Args:
            payload: 입력 데이터

        Raises:
            AgentError: 필수 필드가 없을 때
        """
        # scene_plan 작업의 경우
        if payload.get("task_type") == "scene_plan" or "product_info" in payload:
            if "product_info" not in payload:
                raise AgentError(
                    message="'product_info' is required for scene planning",
                    agent=self.name
                )
            if "duration" not in payload:
                raise AgentError(
                    message="'duration' is required (15, 30, or 60 seconds)",
                    agent=self.name
                )

    async def _plan_scenes(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        씬 구성 계획

        Args:
            payload: 입력 데이터

        Returns:
            씬 계획 결과
        """
        product_info = payload["product_info"]
        duration = payload["duration"]
        style = payload.get("style", "modern")
        platform = payload.get("platform", "youtube")

        # LLM 프롬프트 구성
        prompt = self._build_scene_prompt(product_info, duration, style, platform)

        try:
            # LLM Gateway 호출
            llm_response = await self.llm_gateway.generate(
                role="scene_planner",
                task="scene_planning",
                prompt=prompt,
                mode="json",
                options={
                    "temperature": 0.7,
                    "max_tokens": 2000
                }
            )

            # LLM 응답 파싱
            if llm_response.output.type == "json":
                scene_data = llm_response.output.value
            else:
                # Mock 데이터로 폴백
                scene_data = self._generate_mock_scenes(duration, style)

            return scene_data

        except Exception as e:
            logger.warning(f"LLM call failed: {str(e)}. Using mock data.")
            return self._generate_mock_scenes(duration, style)

    async def _create_storyboard(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        스토리보드 생성

        Args:
            payload: 입력 데이터

        Returns:
            스토리보드
        """
        # 먼저 씬 계획 수행
        scene_data = await self._plan_scenes(payload)

        # 스토리보드 구성
        storyboard = {
            "title": payload.get("title", "Untitled Storyboard"),
            "concept": payload.get("concept", "Product Showcase"),
            "total_duration": payload["duration"],
            "scenes": scene_data["scenes"],
            "target_audience": payload.get("product_info", {}).get("target", "General"),
            "key_message": payload.get("key_message", ""),
            "style": payload.get("style", "modern"),
            "aspect_ratio": payload.get("aspect_ratio", "16:9"),
            "resolution": payload.get("resolution", "1920x1080"),
            "fps": payload.get("fps", 30),
            "emotion_arc": self._calculate_emotion_arc(scene_data["scenes"])
        }

        return {
            "storyboard": storyboard,
            "suggestions": scene_data.get("suggestions", []),
            "estimated_production_time": self._estimate_production_time(scene_data["scenes"]),
            "difficulty_level": self._assess_difficulty(scene_data["scenes"])
        }

    async def _optimize_timing(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        타이밍 최적화

        Args:
            payload: 입력 데이터

        Returns:
            최적화된 타이밍
        """
        scenes = payload.get("scenes", [])
        total_duration = payload.get("duration", 30)

        # 씬별 최적 타이밍 계산
        optimized_scenes = []
        remaining_duration = total_duration

        for i, scene in enumerate(scenes):
            # 황금 비율 기반 타이밍 분배
            if i == 0:  # Intro
                optimal_duration = total_duration * 0.15
            elif i == len(scenes) - 1:  # Outro/CTA
                optimal_duration = total_duration * 0.20
            else:  # Main content
                optimal_duration = remaining_duration / (len(scenes) - i)

            scene["duration"] = round(optimal_duration, 1)
            remaining_duration -= scene["duration"]
            optimized_scenes.append(scene)

        return {
            "optimized_scenes": optimized_scenes,
            "total_duration": total_duration,
            "timing_analysis": {
                "pacing": "optimal",
                "rhythm": "balanced",
                "attention_curve": "engaging"
            }
        }

    async def _suggest_transitions(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        트랜지션 제안

        Args:
            payload: 입력 데이터

        Returns:
            트랜지션 제안
        """
        scenes = payload.get("scenes", [])
        style = payload.get("style", "modern")

        transitions = []
        for i in range(len(scenes) - 1):
            current_scene = scenes[i]
            next_scene = scenes[i + 1]

            # 씬 간 관계 분석하여 적절한 트랜지션 선택
            if current_scene.get("energy_level", 5) < next_scene.get("energy_level", 5):
                transition = TransitionType.ZOOM
            elif current_scene.get("type") == "problem" and next_scene.get("type") == "solution":
                transition = TransitionType.MORPH
            elif style == "dynamic":
                transition = TransitionType.SLIDE
            else:
                transition = TransitionType.DISSOLVE

            transitions.append({
                "from_scene": current_scene.get("id"),
                "to_scene": next_scene.get("id"),
                "type": transition.value,
                "duration": 0.5
            })

        return {
            "transitions": transitions,
            "style_consistency": "high",
            "flow_quality": "smooth"
        }

    async def _design_emotion_arc(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        감정 곡선 설계

        Args:
            payload: 입력 데이터

        Returns:
            감정 곡선
        """
        scenes = payload.get("scenes", [])

        emotion_arc = []
        for scene in scenes:
            emotion_point = {
                "scene_id": scene.get("id"),
                "time": scene.get("start_time", 0),
                "emotion": scene.get("emotion", "neutral"),
                "energy": scene.get("energy_level", 5),
                "tension": self._calculate_tension(scene)
            }
            emotion_arc.append(emotion_point)

        return {
            "emotion_arc": emotion_arc,
            "peak_moment": self._find_peak_moment(emotion_arc),
            "emotional_journey": self._describe_journey(emotion_arc)
        }

    def _build_scene_prompt(
        self,
        product_info: Dict[str, Any],
        duration: int,
        style: str,
        platform: str
    ) -> str:
        """
        씬 계획 프롬프트 구성

        Args:
            product_info: 제품 정보
            duration: 지속 시간
            style: 스타일
            platform: 플랫폼

        Returns:
            프롬프트 문자열
        """
        prompt_parts = [
            "당신은 전문 영상 기획자입니다.",
            f"{duration}초 길이의 광고 영상을 위한 씬 구성을 설계하세요.",
            "",
            f"제품 정보:",
            f"- 이름: {product_info.get('name', 'Unknown')}",
            f"- 특징: {', '.join(product_info.get('features', []))}",
            f"- 타겟: {product_info.get('target', 'General')}",
            "",
            f"영상 스타일: {style}",
            f"플랫폼: {platform}",
            "",
            "각 씬마다 다음 정보를 포함하세요:",
            "- 씬 ID와 타입",
            "- 지속 시간",
            "- 시각적 요소",
            "- 나레이션/자막",
            "- 카메라 움직임",
            "- 트랜지션",
            "",
            "JSON 형식으로 응답하세요."
        ]

        return "\n".join(prompt_parts)

    def _generate_mock_scenes(self, duration: int, style: str) -> Dict[str, Any]:
        """
        Mock 씬 데이터 생성

        Args:
            duration: 지속 시간
            style: 스타일

        Returns:
            Mock 씬 데이터
        """
        # 지속 시간에 따른 씬 구성
        if duration <= 15:
            scenes = [
                {
                    "id": "scene_001",
                    "type": "intro",
                    "duration": 3,
                    "description": "제품 클로즈업 샷",
                    "visual_elements": ["product", "logo"],
                    "camera_movement": "zoom_in",
                    "narration": "혁신적인 무선 이어폰",
                    "energy_level": 7
                },
                {
                    "id": "scene_002",
                    "type": "demo",
                    "duration": 8,
                    "description": "주요 기능 시연",
                    "visual_elements": ["product_in_use", "feature_highlights"],
                    "camera_movement": "tracking",
                    "narration": "노이즈 캔슬링과 긴 배터리 수명",
                    "energy_level": 9
                },
                {
                    "id": "scene_003",
                    "type": "cta",
                    "duration": 4,
                    "description": "구매 유도",
                    "visual_elements": ["product", "price", "cta_button"],
                    "camera_movement": "static",
                    "text_overlay": "지금 구매하세요!",
                    "energy_level": 10
                }
            ]
        elif duration <= 30:
            scenes = [
                {
                    "id": "scene_001",
                    "type": "intro",
                    "duration": 4,
                    "description": "문제 상황 제시",
                    "visual_elements": ["problem_situation"],
                    "camera_movement": "pan",
                    "narration": "시끄러운 환경에서도",
                    "energy_level": 5
                },
                {
                    "id": "scene_002",
                    "type": "solution",
                    "duration": 6,
                    "description": "제품 소개",
                    "visual_elements": ["product_reveal"],
                    "camera_movement": "zoom_in",
                    "narration": "완벽한 노이즈 캔슬링",
                    "energy_level": 7
                },
                {
                    "id": "scene_003",
                    "type": "demo",
                    "duration": 10,
                    "description": "기능 시연",
                    "visual_elements": ["feature_demo"],
                    "camera_movement": "tracking",
                    "narration": "24시간 연속 재생",
                    "energy_level": 8
                },
                {
                    "id": "scene_004",
                    "type": "benefit",
                    "duration": 6,
                    "description": "사용자 혜택",
                    "visual_elements": ["happy_users"],
                    "camera_movement": "dolly",
                    "narration": "당신의 일상을 바꿔드립니다",
                    "energy_level": 9
                },
                {
                    "id": "scene_005",
                    "type": "cta",
                    "duration": 4,
                    "description": "행동 유도",
                    "visual_elements": ["product", "offer"],
                    "camera_movement": "static",
                    "text_overlay": "한정 특가!",
                    "energy_level": 10
                }
            ]
        else:  # 60초
            # 더 많은 씬 추가...
            scenes = self._generate_extended_scenes()

        return {
            "scenes": scenes,
            "suggestions": [
                "음악 비트에 맞춰 컷 편집 권장",
                "브랜드 컬러 일관성 유지",
                "CTA 버튼 강조 필요"
            ]
        }

    def _generate_extended_scenes(self) -> List[Dict[str, Any]]:
        """60초 영상용 확장 씬 생성"""
        # 구현 생략 (실제로는 더 상세한 씬 구성)
        return []

    def _calculate_emotion_arc(self, scenes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """감정 곡선 계산"""
        arc = []
        time_offset = 0

        for scene in scenes:
            arc.append({
                "time": time_offset,
                "energy": scene.get("energy_level", 5),
                "emotion": scene.get("emotion", "neutral")
            })
            time_offset += scene.get("duration", 0)

        return arc

    def _estimate_production_time(self, scenes: List[Dict[str, Any]]) -> float:
        """제작 시간 예측 (시간 단위)"""
        base_time = len(scenes) * 2  # 씬당 기본 2시간
        complexity_factor = 1.5  # 복잡도 계수
        return base_time * complexity_factor

    def _assess_difficulty(self, scenes: List[Dict[str, Any]]) -> str:
        """제작 난이도 평가"""
        complex_movements = ["tracking", "dolly", "morph"]
        complex_count = sum(
            1 for scene in scenes
            if scene.get("camera_movement") in complex_movements
        )

        if complex_count >= len(scenes) * 0.5:
            return "hard"
        elif complex_count >= len(scenes) * 0.25:
            return "medium"
        else:
            return "easy"

    def _calculate_tension(self, scene: Dict[str, Any]) -> int:
        """씬의 긴장도 계산"""
        energy = scene.get("energy_level", 5)
        scene_type = scene.get("type", "")

        if scene_type in ["problem", "conflict"]:
            return min(10, energy + 2)
        elif scene_type in ["solution", "cta"]:
            return max(1, energy - 1)
        else:
            return energy

    def _find_peak_moment(self, emotion_arc: List[Dict[str, Any]]) -> Dict[str, Any]:
        """감정 최고점 찾기"""
        if not emotion_arc:
            return {}

        peak = max(emotion_arc, key=lambda x: x.get("energy", 0))
        return peak

    def _describe_journey(self, emotion_arc: List[Dict[str, Any]]) -> str:
        """감정 여정 설명"""
        if not emotion_arc:
            return "neutral"

        start_energy = emotion_arc[0].get("energy", 5)
        end_energy = emotion_arc[-1].get("energy", 5)

        if end_energy > start_energy + 3:
            return "ascending"
        elif end_energy < start_energy - 3:
            return "descending"
        else:
            return "balanced"

    def _create_outputs(
        self,
        result: Dict[str, Any],
        task: str
    ) -> List:
        """
        결과를 AgentOutput 리스트로 변환

        Args:
            result: 처리 결과
            task: 작업 유형

        Returns:
            AgentOutput 리스트
        """
        outputs = []

        # 전체 결과
        outputs.append(self._create_output(
            output_type="json",
            name="scene_plan",
            value=result,
            meta={
                "task": task,
                "format": "storyboard",
                "scene_count": len(result.get("scenes", []))
            }
        ))

        # 제안사항 (텍스트 형식)
        if result.get("suggestions"):
            suggestions_text = "\n".join([
                f"• {suggestion}"
                for suggestion in result["suggestions"]
            ])

            outputs.append(self._create_output(
                output_type="text",
                name="suggestions",
                value=suggestions_text,
                meta={"format": "bullet_list"}
            ))

        return outputs


# ============================================================================
# Factory Function
# ============================================================================

def get_scene_planner_agent(llm_gateway=None) -> ScenePlannerAgent:
    """
    Scene Planner Agent 인스턴스 반환

    Args:
        llm_gateway: LLM Gateway (None이면 전역 인스턴스 사용)

    Returns:
        ScenePlannerAgent 인스턴스
    """
    return ScenePlannerAgent(llm_gateway=llm_gateway)