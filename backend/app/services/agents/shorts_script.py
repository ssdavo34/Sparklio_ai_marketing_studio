"""
Shorts Script Agent (Demo Day)

컨셉 기반 30-60초 숏폼 영상 스크립트 생성

작성일: 2025-11-26
작성자: B팀 (Backend)
참조: B_TEAM_TODO_LIST_2025-11-26.md

LLM: Gemini 2.0 Flash (무료 티어)
TTS: Edge TTS (무료)
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

class ShortsScriptInput(BaseModel):
    """ShortsScriptAgent 입력"""
    concept: Dict[str, Any] = Field(..., description="컨셉 정보 (ConceptAgent 출력)")
    product_name: str = Field(..., description="제품/서비스명")
    key_features: Optional[List[str]] = Field(None, description="핵심 기능 목록")
    target_duration: int = Field(default=45, ge=15, le=90, description="목표 영상 길이 (초)")
    cta_url: Optional[str] = Field(None, description="CTA 링크")


class SceneOutput(BaseModel):
    """씬 출력"""
    scene_number: int = Field(..., description="씬 번호")
    start_time: float = Field(..., description="시작 시간 (초)")
    end_time: float = Field(..., description="종료 시간 (초)")
    duration_seconds: float = Field(..., description="씬 길이 (초)")
    narration: str = Field(..., description="나레이션 텍스트")
    visual_description: str = Field(..., description="비주얼 설명")
    text_overlay: Optional[str] = Field(None, description="화면 텍스트")
    transition: str = Field(default="cut", description="전환 효과")
    bgm_mood: str = Field(default="neutral", description="BGM 무드")


class ShortsScriptOutput(BaseModel):
    """ShortsScriptAgent 출력"""
    title: str = Field(..., description="스크립트 제목")
    total_duration: int = Field(..., description="총 영상 길이 (초)")
    hook: Dict[str, Any] = Field(..., description="훅 (오프닝)")
    scenes: List[SceneOutput] = Field(..., description="씬 목록")
    cta: Dict[str, Any] = Field(..., description="CTA (클로징)")
    audio_config: Dict[str, Any] = Field(..., description="오디오 설정")


# =============================================================================
# Shorts Script Agent
# =============================================================================

class ShortsScriptAgent(AgentBase):
    """
    Shorts Script Agent

    마케팅 컨셉을 기반으로 숏폼 영상 스크립트를 생성합니다.

    구조:
    1. Hook (3-5초): 시청자 주목
    2. Problem (5-8초): 문제 제기
    3. Solution (15-20초): 해결책 제시
    4. Benefits (10-15초): 혜택 강조
    5. CTA (5-7초): 행동 유도
    """

    @property
    def name(self) -> str:
        return "shorts_script"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        숏폼 스크립트 생성

        Args:
            request: AgentRequest

        Returns:
            AgentResponse
        """
        start_time = datetime.utcnow()

        # 입력 검증
        self._validate_request(request)

        try:
            input_data = ShortsScriptInput(**request.payload)
        except Exception as e:
            raise AgentError(
                message=f"Invalid input: {str(e)}",
                agent=self.name,
                details={"payload": request.payload}
            )

        # 프롬프트 생성
        prompt = self._build_prompt(input_data)

        logger.info(f"[ShortsScriptAgent] Generating {input_data.target_duration}s script...")

        # LLM 호출 (Gemini 2.0 Flash)
        try:
            llm_response = await self.llm_gateway.generate(
                role=self.name,
                task="generate_shorts_script",
                payload={"prompt": prompt},
                mode="json",
                options={
                    "model": "gemini-2.0-flash",
                    "temperature": 0.7,
                    "max_tokens": 4000
                }
            )
        except Exception as e:
            logger.error(f"[ShortsScriptAgent] LLM call failed: {e}")
            raise AgentError(
                message=f"LLM generation failed: {str(e)}",
                agent=self.name,
                details={"input": input_data.model_dump()}
            )

        # 결과 파싱
        try:
            output_data = self._parse_output(llm_response.output.value, input_data)
        except Exception as e:
            logger.error(f"[ShortsScriptAgent] Output parsing failed: {e}")
            raise AgentError(
                message=f"Output parsing failed: {str(e)}",
                agent=self.name,
                details={"llm_output": llm_response.output.value}
            )

        elapsed = (datetime.utcnow() - start_time).total_seconds()

        logger.info(
            f"[ShortsScriptAgent] Generated {len(output_data.scenes)} scenes, "
            f"{output_data.total_duration}s in {elapsed:.2f}s"
        )

        # AgentResponse 반환
        return AgentResponse(
            agent=self.name,
            task=request.task,
            outputs=[
                self._create_output(
                    output_type="json",
                    name="shorts_script",
                    value=output_data.model_dump(),
                    meta={
                        "scene_count": len(output_data.scenes),
                        "duration": output_data.total_duration
                    }
                )
            ],
            usage={
                "llm_tokens": llm_response.usage.get("total_tokens", 0),
                "elapsed_seconds": elapsed
            },
            meta={
                "llm_provider": llm_response.provider,
                "llm_model": llm_response.model
            }
        )

    def _build_prompt(self, input_data: ShortsScriptInput) -> str:
        """프롬프트 생성"""

        concept = input_data.concept

        # 기능 목록
        features_text = ""
        if input_data.key_features:
            features_text = f"- 핵심 기능: {', '.join(input_data.key_features)}"

        prompt = f"""당신은 숏폼 영상 스크립트 전문 작가입니다. 아래 정보를 바탕으로 {input_data.target_duration}초 길이의 숏폼 영상 스크립트를 작성하세요.

## 제품/서비스
- 이름: {input_data.product_name}
{features_text}

## 마케팅 컨셉
- 컨셉명: {concept.get('concept_name', '')}
- 설명: {concept.get('concept_description', '')}
- 타겟: {concept.get('target_audience', '')}
- 핵심 메시지: {concept.get('key_message', '')}
- 톤앤매너: {concept.get('tone_and_manner', '')}
- 비주얼 스타일: {concept.get('visual_style', '')}

## 스크립트 구조 (반드시 이 순서로)
1. **Hook** (3-5초): 시청자의 주목을 끄는 질문이나 문제 제기
2. **Problem** (5-8초): 타겟이 공감할 수 있는 문제점 설명
3. **Solution** (10-15초): 제품/서비스가 해결책이 되는 방법
4. **Benefits** (10-15초): 구체적인 혜택과 결과
5. **CTA** (5-7초): 행동 유도 (프로필 링크, 무료 체험 등)

## 요구사항
1. 각 씬의 나레이션은 해당 시간 안에 읽을 수 있는 길이로 작성 (초당 약 3-4글자)
2. 비주얼 설명은 영상 제작자가 이해할 수 있게 구체적으로
3. 텍스트 오버레이는 핵심 포인트만 간결하게
4. BGM 무드: tense(긴장), uplifting(상승), exciting(흥미), neutral(중립)
5. 전환 효과: cut, fade, slide_left, slide_up, zoom_in, quick_cuts

## 출력 형식 (JSON)
{{
    "title": "스크립트 제목",
    "total_duration": {input_data.target_duration},
    "hook": {{
        "text": "훅 텍스트",
        "duration_seconds": 3,
        "visual_description": "비주얼 설명"
    }},
    "scenes": [
        {{
            "scene_number": 1,
            "start_time": 0,
            "end_time": 3,
            "duration_seconds": 3,
            "narration": "나레이션 텍스트",
            "visual_description": "씬 비주얼 설명",
            "text_overlay": "화면 텍스트 (없으면 null)",
            "transition": "cut",
            "bgm_mood": "tense"
        }}
    ],
    "cta": {{
        "text": "CTA 텍스트",
        "visual_description": "CTA 비주얼",
        "duration_seconds": 5
    }},
    "audio_config": {{
        "tts_voice": "ko-KR-SunHiNeural",
        "tts_provider": "edge-tts",
        "bgm_track": "upbeat_corporate_01.mp3",
        "bgm_volume": 0.3
    }}
}}

총 {input_data.target_duration}초가 되도록 씬을 배분하세요. 한국어로 작성하세요.
"""
        return prompt

    def _parse_output(self, llm_output: Any, input_data: ShortsScriptInput) -> ShortsScriptOutput:
        """LLM 출력 파싱"""

        # dict 또는 str 처리
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

        # scenes 파싱
        scenes = []
        current_time = 0.0

        for scene_data in data.get("scenes", []):
            scene = SceneOutput(
                scene_number=scene_data.get("scene_number", len(scenes) + 1),
                start_time=scene_data.get("start_time", current_time),
                end_time=scene_data.get("end_time", current_time + scene_data.get("duration_seconds", 5)),
                duration_seconds=scene_data.get("duration_seconds", 5),
                narration=scene_data.get("narration", ""),
                visual_description=scene_data.get("visual_description", ""),
                text_overlay=scene_data.get("text_overlay"),
                transition=scene_data.get("transition", "cut"),
                bgm_mood=scene_data.get("bgm_mood", "neutral")
            )
            scenes.append(scene)
            current_time = scene.end_time

        # hook 기본값
        hook = data.get("hook", {})
        if not hook:
            hook = {
                "text": f"{input_data.product_name}에 대해 알아보세요",
                "duration_seconds": 3,
                "visual_description": "로고와 타이틀 표시"
            }

        # cta 기본값
        cta = data.get("cta", {})
        if not cta:
            cta = {
                "text": "지금 바로 시작하세요",
                "visual_description": "CTA 버튼과 프로필 링크",
                "duration_seconds": 5
            }

        # audio_config 기본값
        audio_config = data.get("audio_config", {
            "tts_voice": "ko-KR-SunHiNeural",
            "tts_provider": "edge-tts",
            "bgm_track": "upbeat_corporate_01.mp3",
            "bgm_volume": 0.3
        })

        # total_duration 계산
        total_duration = sum(s.duration_seconds for s in scenes)

        return ShortsScriptOutput(
            title=data.get("title", f"{input_data.product_name} 숏폼 영상"),
            total_duration=int(total_duration),
            hook=hook,
            scenes=scenes,
            cta=cta,
            audio_config=audio_config
        )


# =============================================================================
# Factory Function
# =============================================================================

def get_shorts_script_agent(llm_gateway=None) -> ShortsScriptAgent:
    """ShortsScriptAgent 인스턴스 반환"""
    return ShortsScriptAgent(llm_gateway=llm_gateway)
