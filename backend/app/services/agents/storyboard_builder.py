"""
Storyboard Builder Agent

영상 스토리보드를 생성하는 에이전트
숏폼/릴스 영상의 씬 구성, 타이밍, 전환 효과를 계획합니다.

작성일: 2025-11-28
작성자: B팀 (Backend)
참조: AGENTS_SPEC.md - StoryboardBuilderAgent

LLM: GPT-4o / Gemini 2.0 Flash
"""

import json
import logging
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

from app.services.agents.base import AgentBase, AgentRequest, AgentResponse, AgentOutput, AgentError

logger = logging.getLogger(__name__)


# =============================================================================
# Input/Output Schemas
# =============================================================================

class StoryboardScene(BaseModel):
    """스토리보드 씬"""
    scene_number: int = Field(..., description="씬 번호")
    duration: float = Field(..., description="씬 길이 (초)")
    visual_description: str = Field(..., description="시각적 설명")
    camera_movement: str = Field(default="static", description="카메라 움직임")
    text_overlay: Optional[str] = Field(None, description="화면 텍스트")
    voiceover: Optional[str] = Field(None, description="나레이션")
    transition_to_next: str = Field(default="cut", description="다음 씬 전환")
    mood: str = Field(default="neutral", description="분위기")
    image_prompt_hint: str = Field(default="", description="이미지 생성 힌트")


class StoryboardBuilderInput(BaseModel):
    """StoryboardBuilderAgent 입력"""
    concept: Dict[str, Any] = Field(..., description="컨셉 정보")
    script: Optional[str] = Field(None, description="스크립트 (ShortsScriptAgent 출력)")
    video_type: str = Field(default="shorts", description="영상 유형 (shorts, reel, tiktok)")
    target_duration: float = Field(default=30.0, description="목표 길이 (초)")
    style: str = Field(default="dynamic", description="스타일 (dynamic, calm, storytelling)")


class StoryboardOutput(BaseModel):
    """StoryboardBuilderAgent 출력"""
    storyboard_id: str = Field(..., description="스토리보드 ID")
    title: str = Field(..., description="영상 제목")
    total_duration: float = Field(..., description="총 길이")
    scenes: List[StoryboardScene] = Field(..., description="씬 목록")
    music_suggestion: str = Field(default="", description="음악 추천")
    color_palette: List[str] = Field(default_factory=list, description="색상 팔레트")
    overall_mood: str = Field(default="", description="전체 분위기")


# =============================================================================
# Storyboard Builder Agent
# =============================================================================

class StoryboardBuilderAgent(AgentBase):
    """
    Storyboard Builder Agent

    숏폼/릴스 영상의 스토리보드를 생성합니다.

    주요 기능:
    - 컨셉/스크립트 기반 씬 구성
    - 씬별 시각적 설명 생성
    - 타이밍 및 전환 효과 계획
    - 이미지 생성 힌트 제공
    """

    # 영상 유형별 기본 설정
    VIDEO_TYPE_CONFIGS = {
        "shorts": {"max_duration": 60, "optimal_scenes": 6, "aspect": "9:16"},
        "reel": {"max_duration": 90, "optimal_scenes": 8, "aspect": "9:16"},
        "tiktok": {"max_duration": 60, "optimal_scenes": 6, "aspect": "9:16"},
        "story": {"max_duration": 15, "optimal_scenes": 3, "aspect": "9:16"}
    }

    @property
    def name(self) -> str:
        return "storyboard_builder"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        스토리보드 생성

        Args:
            request: AgentRequest

        Returns:
            AgentResponse
        """
        start_time = datetime.utcnow()

        self._validate_request(request)

        try:
            input_data = StoryboardBuilderInput(**request.payload)
        except Exception as e:
            raise AgentError(
                message=f"Invalid input: {str(e)}",
                agent=self.name,
                details={"payload": request.payload}
            )

        prompt = self._build_prompt(input_data)

        logger.info(f"[StoryboardBuilderAgent] Generating storyboard for {input_data.video_type}")

        try:
            llm_response = await self.llm_gateway.generate(
                role=self.name,
                task="generate_storyboard",
                payload={"prompt": prompt},
                mode="json",
                override_model="gpt-4o",
                options={
                    "temperature": 0.7,
                    "max_tokens": 3000
                }
            )
        except Exception as e:
            logger.error(f"[StoryboardBuilderAgent] LLM call failed: {e}")
            raise AgentError(
                message=f"LLM generation failed: {str(e)}",
                agent=self.name,
                details={"input": input_data.model_dump()}
            )

        try:
            output_data = self._parse_output(llm_response.output.value, input_data)
        except Exception as e:
            logger.error(f"[StoryboardBuilderAgent] Output parsing failed: {e}")
            raise AgentError(
                message=f"Output parsing failed: {str(e)}",
                agent=self.name,
                details={"llm_output": llm_response.output.value}
            )

        elapsed = (datetime.utcnow() - start_time).total_seconds()

        logger.info(f"[StoryboardBuilderAgent] Generated {len(output_data.scenes)} scenes in {elapsed:.2f}s")

        return AgentResponse(
            agent=self.name,
            task=request.task,
            outputs=[
                self._create_output(
                    output_type="json",
                    name="storyboard",
                    value=output_data.model_dump(),
                    meta={"scenes_count": len(output_data.scenes)}
                )
            ],
            usage={
                "llm_tokens": llm_response.usage.get("total_tokens", 0),
                "elapsed_seconds": elapsed
            },
            meta={
                "llm_provider": llm_response.provider,
                "llm_model": llm_response.model,
                "video_type": input_data.video_type
            }
        )

    def _build_prompt(self, input_data: StoryboardBuilderInput) -> str:
        """프롬프트 생성"""
        concept = input_data.concept
        config = self.VIDEO_TYPE_CONFIGS.get(input_data.video_type, self.VIDEO_TYPE_CONFIGS["shorts"])

        prompt = f"""You are an expert video storyboard creator for short-form marketing content.

## Marketing Concept
- Name: {concept.get('concept_name', '')}
- Description: {concept.get('concept_description', '')}
- Target Audience: {concept.get('target_audience', '')}
- Tone: {concept.get('tone_and_manner', '')}
- Visual Style: {concept.get('visual_style', '')}

## Script (if provided)
{input_data.script or 'No script provided - create based on concept'}

## Video Specifications
- Type: {input_data.video_type}
- Target Duration: {input_data.target_duration} seconds (max {config['max_duration']}s)
- Optimal Scenes: {config['optimal_scenes']}
- Aspect Ratio: {config['aspect']}
- Style: {input_data.style}

## Requirements
1. Create {config['optimal_scenes']} scenes that fit within {input_data.target_duration} seconds
2. Each scene should have clear visual description for AI image generation
3. Include text overlays for key messages (keep text minimal for short-form)
4. Plan smooth transitions between scenes
5. Suggest camera movements (static, zoom_in, zoom_out, pan)
6. Provide image generation hints for each scene

## Style Guidelines for {input_data.style}
{"- Fast cuts, high energy, bold text" if input_data.style == "dynamic" else ""}
{"- Smooth transitions, gentle pacing, soft visuals" if input_data.style == "calm" else ""}
{"- Build-up structure, emotional arc, narrative flow" if input_data.style == "storytelling" else ""}

## Output Format (JSON)
{{
    "storyboard_id": "sb_unique_id",
    "title": "Video title",
    "total_duration": {input_data.target_duration},
    "scenes": [
        {{
            "scene_number": 1,
            "duration": 5.0,
            "visual_description": "Detailed description of what's shown",
            "camera_movement": "static | zoom_in | zoom_out | pan_left | pan_right",
            "text_overlay": "Text shown on screen (optional)",
            "voiceover": "Narration text (optional)",
            "transition_to_next": "cut | fade | slide | zoom",
            "mood": "energetic | calm | inspiring | urgent",
            "image_prompt_hint": "Hint for AI image generation"
        }}
    ],
    "music_suggestion": "Upbeat electronic | Calm ambient | etc",
    "color_palette": ["#FFFFFF", "#000000"],
    "overall_mood": "Overall emotional tone"
}}

Create a compelling storyboard that captures attention in the first 3 seconds and delivers the message effectively.
"""
        return prompt

    def _parse_output(self, llm_output: Any, input_data: StoryboardBuilderInput) -> StoryboardOutput:
        """LLM 출력 파싱"""
        if isinstance(llm_output, dict):
            data = llm_output
        elif isinstance(llm_output, str):
            try:
                data = json.loads(llm_output)
            except json.JSONDecodeError:
                import re
                json_match = re.search(r'\{[\s\S]*\}', llm_output)
                if json_match:
                    data = json.loads(json_match.group())
                else:
                    raise ValueError("Cannot parse LLM output as JSON")
        else:
            raise ValueError(f"Unexpected output type: {type(llm_output)}")

        scenes = []
        for scene_data in data.get("scenes", []):
            scenes.append(StoryboardScene(
                scene_number=scene_data.get("scene_number", len(scenes) + 1),
                duration=scene_data.get("duration", 5.0),
                visual_description=scene_data.get("visual_description", ""),
                camera_movement=scene_data.get("camera_movement", "static"),
                text_overlay=scene_data.get("text_overlay"),
                voiceover=scene_data.get("voiceover"),
                transition_to_next=scene_data.get("transition_to_next", "cut"),
                mood=scene_data.get("mood", "neutral"),
                image_prompt_hint=scene_data.get("image_prompt_hint", "")
            ))

        # 씬이 없으면 기본 씬 생성
        if not scenes:
            scenes = self._create_default_scenes(input_data)

        return StoryboardOutput(
            storyboard_id=data.get("storyboard_id", f"sb_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"),
            title=data.get("title", input_data.concept.get("concept_name", "Untitled")),
            total_duration=sum(s.duration for s in scenes),
            scenes=scenes,
            music_suggestion=data.get("music_suggestion", ""),
            color_palette=data.get("color_palette", []),
            overall_mood=data.get("overall_mood", "")
        )

    def _create_default_scenes(self, input_data: StoryboardBuilderInput) -> List[StoryboardScene]:
        """기본 씬 생성"""
        concept = input_data.concept
        config = self.VIDEO_TYPE_CONFIGS.get(input_data.video_type, self.VIDEO_TYPE_CONFIGS["shorts"])

        scene_count = config["optimal_scenes"]
        duration_per_scene = input_data.target_duration / scene_count

        scenes = []
        for i in range(scene_count):
            if i == 0:
                # 오프닝
                scenes.append(StoryboardScene(
                    scene_number=1,
                    duration=duration_per_scene,
                    visual_description=f"Eye-catching opening shot related to {concept.get('concept_name', 'product')}",
                    camera_movement="zoom_in",
                    text_overlay=concept.get("concept_name", ""),
                    transition_to_next="fade",
                    mood="energetic",
                    image_prompt_hint="Bold, attention-grabbing visual"
                ))
            elif i == scene_count - 1:
                # 엔딩
                scenes.append(StoryboardScene(
                    scene_number=i + 1,
                    duration=duration_per_scene,
                    visual_description="Call-to-action closing shot",
                    camera_movement="static",
                    text_overlay="Learn More / Shop Now",
                    transition_to_next="fade",
                    mood="inspiring",
                    image_prompt_hint="Clean, CTA-focused composition"
                ))
            else:
                # 중간 씬
                scenes.append(StoryboardScene(
                    scene_number=i + 1,
                    duration=duration_per_scene,
                    visual_description=f"Scene {i+1} showcasing key feature or benefit",
                    camera_movement="static",
                    transition_to_next="cut",
                    mood="neutral",
                    image_prompt_hint="Product/benefit focused shot"
                ))

        return scenes


# =============================================================================
# Factory Function
# =============================================================================

def get_storyboard_builder_agent(llm_gateway=None) -> StoryboardBuilderAgent:
    """StoryboardBuilderAgent 인스턴스 반환"""
    return StoryboardBuilderAgent(llm_gateway=llm_gateway)
