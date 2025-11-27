"""
Concept API v2.0

Chat에서 직접 ConceptAgent를 호출할 수 있는 엔드포인트

작성일: 2025-11-27
작성자: B팀 (Backend)
참조: C_TEAM_TO_B_TEAM_REQUEST_2025-11-27.md, CONCEPT_SPEC.md

주요 엔드포인트:
- POST /api/v1/concepts/from-prompt: 프롬프트 기반 ConceptV1 생성
"""

import logging
from typing import Optional, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.agents.concept import (
    get_concept_agent,
    ConceptV1,
    ConceptV1Output,
    VisualWorld,
    ChannelStrategy,
    Guardrails
)
from app.services.agents.base import AgentRequest

logger = logging.getLogger(__name__)

router = APIRouter()


# =============================================================================
# Request/Response Schemas
# =============================================================================

class ConceptFromPromptRequest(BaseModel):
    """프롬프트 기반 컨셉 생성 요청"""
    prompt: str = Field(
        ...,
        description="사용자 입력 프롬프트",
        min_length=5,
        max_length=500
    )
    concept_count: int = Field(
        default=3,
        ge=1,
        le=5,
        description="생성할 컨셉 수 (1-5)"
    )
    brand_context: Optional[str] = Field(
        None,
        description="브랜드 컨텍스트 (선택)"
    )


class ConceptFromPromptResponse(BaseModel):
    """
    프롬프트 기반 컨셉 생성 응답

    ConceptV1 스키마 기반 - CONCEPT_SPEC.md 참조
    """
    concepts: List[ConceptV1] = Field(
        ...,
        description="생성된 ConceptV1 컨셉 목록"
    )
    reasoning: str = Field(
        ...,
        description="컨셉 도출 근거"
    )


# =============================================================================
# API Endpoints
# =============================================================================

@router.post("/concepts/from-prompt", response_model=ConceptFromPromptResponse)
async def create_concepts_from_prompt(
    request: ConceptFromPromptRequest
):
    """
    프롬프트 기반 ConceptV1 생성

    Chat에서 사용자 입력을 받아 ConceptAgent v2.0으로 전략적 마케팅 컨셉 생성

    ConceptV1 구조 (CONCEPT_SPEC.md 기준):
    - audience_insight: 고객 인사이트
    - core_promise: 핵심 약속
    - brand_role: 브랜드 역할
    - reason_to_believe: 믿음의 근거
    - creative_device: 크리에이티브 장치
    - hook_patterns: 훅 패턴
    - visual_world: 비주얼 세계관
    - channel_strategy: 채널 전략
    - guardrails: 가드레일

    Args:
        request: 프롬프트, 컨셉 수, 브랜드 컨텍스트

    Returns:
        ConceptV1 컨셉 목록 + 도출 근거
    """
    logger.info(
        f"[Concepts API] Generating {request.concept_count} ConceptV1 "
        f"for prompt: {request.prompt[:50]}..."
    )

    try:
        # ConceptAgent v2.0 초기화
        concept_agent = get_concept_agent()

        # 프롬프트를 meeting_summary 형식으로 변환
        # (ConceptAgent는 meeting_summary를 입력으로 받음)
        meeting_summary = {
            "title": "사용자 요청",
            "key_points": [request.prompt],
            "core_message": request.prompt,
            "topic": request.prompt  # topic 추가
        }

        # ConceptAgent 실행
        agent_response = await concept_agent.execute(
            AgentRequest(
                task="generate_concepts_v2",
                payload={
                    "meeting_summary": meeting_summary,
                    "concept_count": request.concept_count,
                    "brand_context": request.brand_context
                }
            )
        )

        # 결과 파싱
        output = agent_response.outputs[0].value
        concepts_data = output.get("concepts", [])
        reasoning = output.get("reasoning", "")

        logger.info(
            f"[Concepts API] Generated {len(concepts_data)} ConceptV1 concepts"
        )

        # ConceptV1 객체로 변환 (이미 ConceptV1 형태)
        concepts = []
        for concept_data in concepts_data:
            # dict인 경우 ConceptV1로 변환
            if isinstance(concept_data, dict):
                # visual_world 파싱
                vw_data = concept_data.get("visual_world", {})
                if isinstance(vw_data, dict):
                    visual_world = VisualWorld(**vw_data)
                else:
                    visual_world = vw_data

                # channel_strategy 파싱
                cs_data = concept_data.get("channel_strategy", {})
                if isinstance(cs_data, dict):
                    channel_strategy = ChannelStrategy(**cs_data)
                else:
                    channel_strategy = cs_data

                # guardrails 파싱
                gr_data = concept_data.get("guardrails", {})
                if isinstance(gr_data, dict):
                    guardrails = Guardrails(**gr_data)
                else:
                    guardrails = gr_data

                concept = ConceptV1(
                    id=concept_data.get("id", ""),
                    version=concept_data.get("version", 1),
                    name=concept_data.get("name", ""),
                    topic=concept_data.get("topic", ""),
                    mode=concept_data.get("mode", "launch_campaign"),
                    audience_insight=concept_data.get("audience_insight", ""),
                    core_promise=concept_data.get("core_promise", ""),
                    brand_role=concept_data.get("brand_role", ""),
                    reason_to_believe=concept_data.get("reason_to_believe", []),
                    creative_device=concept_data.get("creative_device", ""),
                    hook_patterns=concept_data.get("hook_patterns", []),
                    visual_world=visual_world,
                    channel_strategy=channel_strategy,
                    guardrails=guardrails,
                    target_audience=concept_data.get("target_audience", ""),
                    tone_and_manner=concept_data.get("tone_and_manner", ""),
                    keywords=concept_data.get("keywords", [])
                )
                concepts.append(concept)
            else:
                # 이미 ConceptV1 객체인 경우
                concepts.append(concept_data)

        return ConceptFromPromptResponse(
            concepts=concepts,
            reasoning=reasoning
        )

    except Exception as e:
        logger.error(f"[Concepts API] Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Concept generation failed: {str(e)}"
        )


@router.get("/concepts/health")
async def concepts_health():
    """Concepts API 헬스 체크"""
    return {
        "status": "ok",
        "service": "concepts-api",
        "version": "v2.0",
        "schema": "ConceptV1"
    }
