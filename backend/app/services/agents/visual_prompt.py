"""
Visual Prompt Agent (Demo Day)

컨셉 기반 이미지 생성 프롬프트 생성 (Nanobanana API용)

작성일: 2025-11-26
작성자: B팀 (Backend)

LLM: Gemini 2.0 Flash (무료 티어)
이미지 생성: Nanobanana API
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

class VisualPromptInput(BaseModel):
    """VisualPromptAgent 입력"""
    concept: Dict[str, Any] = Field(..., description="컨셉 정보")
    asset_type: str = Field(..., description="에셋 유형 (presentation, instagram, shorts)")
    scene_description: Optional[str] = Field(None, description="씬/슬라이드 설명 (옵션)")
    style_preferences: Optional[Dict[str, Any]] = Field(None, description="스타일 선호도")
    image_count: int = Field(default=1, ge=1, le=10, description="생성할 이미지 수")


class ImagePromptOutput(BaseModel):
    """이미지 프롬프트 출력"""
    prompt_id: str = Field(..., description="프롬프트 ID")
    prompt_text: str = Field(..., description="Nanobanana용 프롬프트 (영문)")
    negative_prompt: str = Field(default="", description="네거티브 프롬프트")
    style_tags: List[str] = Field(default_factory=list, description="스타일 태그")
    aspect_ratio: str = Field(default="1:1", description="비율")
    suggested_seed: Optional[int] = Field(None, description="추천 시드")


class VisualPromptAgentOutput(BaseModel):
    """VisualPromptAgent 출력"""
    prompts: List[ImagePromptOutput] = Field(..., description="생성된 프롬프트 목록")
    style_guide: Dict[str, Any] = Field(default_factory=dict, description="스타일 가이드")


# =============================================================================
# Visual Prompt Agent
# =============================================================================

class VisualPromptAgent(AgentBase):
    """
    Visual Prompt Agent

    마케팅 컨셉을 기반으로 Nanobanana API용 이미지 생성 프롬프트를 생성합니다.

    주요 기능:
    - 한국어 컨셉 → 영문 프롬프트 변환
    - 마케팅 목적에 맞는 비주얼 스타일 적용
    - 에셋 유형별 최적화 (인스타, 발표자료, 숏폼 등)
    """

    @property
    def name(self) -> str:
        return "visual_prompt"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        이미지 프롬프트 생성

        Args:
            request: AgentRequest

        Returns:
            AgentResponse
        """
        start_time = datetime.utcnow()

        self._validate_request(request)

        try:
            input_data = VisualPromptInput(**request.payload)
        except Exception as e:
            raise AgentError(
                message=f"Invalid input: {str(e)}",
                agent=self.name,
                details={"payload": request.payload}
            )

        prompt = self._build_prompt(input_data)

        logger.info(f"[VisualPromptAgent] Generating {input_data.image_count} prompts for {input_data.asset_type}")

        try:
            llm_response = await self.llm_gateway.generate(
                role=self.name,
                task="generate_visual_prompts",
                payload={"prompt": prompt},
                mode="json",
                options={
                    "model": "gemini-2.0-flash",
                    "temperature": 0.7,
                    "max_tokens": 2000
                }
            )
        except Exception as e:
            logger.error(f"[VisualPromptAgent] LLM call failed: {e}")
            raise AgentError(
                message=f"LLM generation failed: {str(e)}",
                agent=self.name,
                details={"input": input_data.model_dump()}
            )

        try:
            output_data = self._parse_output(llm_response.output.value, input_data)
        except Exception as e:
            logger.error(f"[VisualPromptAgent] Output parsing failed: {e}")
            raise AgentError(
                message=f"Output parsing failed: {str(e)}",
                agent=self.name,
                details={"llm_output": llm_response.output.value}
            )

        elapsed = (datetime.utcnow() - start_time).total_seconds()

        logger.info(f"[VisualPromptAgent] Generated {len(output_data.prompts)} prompts in {elapsed:.2f}s")

        return AgentResponse(
            agent=self.name,
            task=request.task,
            outputs=[
                self._create_output(
                    output_type="json",
                    name="visual_prompts",
                    value=output_data.model_dump(),
                    meta={"count": len(output_data.prompts)}
                )
            ],
            usage={
                "llm_tokens": llm_response.usage.get("total_tokens", 0),
                "elapsed_seconds": elapsed
            },
            meta={
                "llm_provider": llm_response.provider,
                "llm_model": llm_response.model,
                "asset_type": input_data.asset_type
            }
        )

    def _build_prompt(self, input_data: VisualPromptInput) -> str:
        """프롬프트 생성"""
        concept = input_data.concept

        # 에셋 유형별 가이드
        asset_guides = {
            "presentation": "Clean, professional, corporate style. Suitable for business presentations.",
            "instagram": "Eye-catching, vibrant, social media optimized. High contrast, engaging visuals.",
            "shorts": "Dynamic, motion-friendly, vertical format. Bold text-friendly backgrounds.",
            "product_detail": "Product-focused, clean background, lifestyle context."
        }

        asset_guide = asset_guides.get(input_data.asset_type, asset_guides["instagram"])

        # 비율 결정
        aspect_ratios = {
            "presentation": "16:9",
            "instagram": "1:1",
            "shorts": "9:16",
            "product_detail": "3:4"
        }
        aspect_ratio = aspect_ratios.get(input_data.asset_type, "1:1")

        prompt = f"""You are an expert at creating image generation prompts for marketing visuals.

## Marketing Concept (Korean)
- Concept Name: {concept.get('concept_name', '')}
- Description: {concept.get('concept_description', '')}
- Visual Style: {concept.get('visual_style', '')}
- Tone: {concept.get('tone_and_manner', '')}
- Target: {concept.get('target_audience', '')}

## Asset Type
{input_data.asset_type}: {asset_guide}

## Scene Description (if provided)
{input_data.scene_description or 'Generate based on concept'}

## Requirements
1. Write prompts in English for Stable Diffusion / Nanobanana API
2. Include style modifiers (photography style, lighting, composition)
3. Add quality tags: 8k, high quality, detailed, professional
4. Avoid text in images (AI struggles with text)
5. Focus on visual elements that convey the marketing message

## Output Format (JSON)
{{
    "prompts": [
        {{
            "prompt_id": "prompt_1",
            "prompt_text": "Full English prompt for image generation",
            "negative_prompt": "blurry, low quality, text, watermark, distorted",
            "style_tags": ["photography", "professional", "modern"],
            "aspect_ratio": "{aspect_ratio}",
            "suggested_seed": null
        }}
    ],
    "style_guide": {{
        "color_mood": "warm/cool/neutral",
        "lighting": "natural/studio/dramatic",
        "composition": "centered/rule-of-thirds/dynamic"
    }}
}}

Generate {input_data.image_count} unique prompts. Each should offer a different visual interpretation of the concept.
"""
        return prompt

    def _parse_output(self, llm_output: Any, input_data: VisualPromptInput) -> VisualPromptAgentOutput:
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

        prompts = []
        for i, prompt_data in enumerate(data.get("prompts", [])):
            prompts.append(ImagePromptOutput(
                prompt_id=prompt_data.get("prompt_id", f"prompt_{i+1}"),
                prompt_text=prompt_data.get("prompt_text", ""),
                negative_prompt=prompt_data.get("negative_prompt", "blurry, low quality, text, watermark"),
                style_tags=prompt_data.get("style_tags", []),
                aspect_ratio=prompt_data.get("aspect_ratio", "1:1"),
                suggested_seed=prompt_data.get("suggested_seed")
            ))

        if not prompts:
            # 기본 프롬프트 생성
            concept = input_data.concept
            prompts.append(ImagePromptOutput(
                prompt_id="prompt_1",
                prompt_text=f"Professional marketing image, {concept.get('visual_style', 'modern')}, "
                           f"8k, high quality, detailed, commercial photography",
                negative_prompt="blurry, low quality, text, watermark, distorted",
                style_tags=["professional", "marketing", "modern"],
                aspect_ratio="1:1"
            ))

        return VisualPromptAgentOutput(
            prompts=prompts,
            style_guide=data.get("style_guide", {})
        )


# =============================================================================
# Factory Function
# =============================================================================

def get_visual_prompt_agent(llm_gateway=None) -> VisualPromptAgent:
    """VisualPromptAgent 인스턴스 반환"""
    return VisualPromptAgent(llm_gateway=llm_gateway)
