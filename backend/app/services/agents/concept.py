"""
Concept Agent (Demo Day)

회의 요약 + 브리프를 기반으로 3개 마케팅 컨셉 생성

작성일: 2025-11-26
작성자: B팀 (Backend)
참조: B_TEAM_TODO_LIST_2025-11-26.md

LLM: Gemini 2.0 Flash (무료 티어)
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

class ConceptInput(BaseModel):
    """ConceptAgent 입력"""
    meeting_summary: Dict[str, Any] = Field(..., description="회의 요약 (MeetingAgent 출력)")
    campaign_brief: Optional[Dict[str, Any]] = Field(None, description="캠페인 브리프 (StrategistAgent 출력)")
    brand_context: Optional[str] = Field(None, description="브랜드 컨텍스트")
    concept_count: int = Field(default=3, ge=1, le=5, description="생성할 컨셉 수")


class ConceptOutput(BaseModel):
    """생성된 컨셉"""
    concept_name: str = Field(..., description="컨셉 이름 (한글, 5-15자)")
    concept_description: str = Field(..., description="컨셉 설명 (2-3문장)")
    target_audience: str = Field(..., description="타겟 고객")
    key_message: str = Field(..., description="핵심 메시지 (10-30자)")
    tone_and_manner: str = Field(..., description="톤앤매너")
    visual_style: str = Field(..., description="비주얼 스타일")
    color_palette: List[str] = Field(default_factory=list, description="색상 팔레트 (HEX)")
    keywords: List[str] = Field(default_factory=list, description="연관 키워드")


class ConceptAgentOutput(BaseModel):
    """ConceptAgent 전체 출력"""
    concepts: List[ConceptOutput] = Field(..., description="생성된 컨셉 목록")
    reasoning: str = Field(..., description="컨셉 도출 근거")


# =============================================================================
# Concept Agent
# =============================================================================

class ConceptAgent(AgentBase):
    """
    Concept Agent

    회의 요약과 브리프를 분석하여 3개의 마케팅 컨셉을 생성합니다.

    각 컨셉은 다음을 포함:
    - 컨셉명 (예: "시간 절약 강조", "비용 절감 강조")
    - 타겟 고객
    - 핵심 메시지
    - 톤앤매너
    - 비주얼 스타일
    """

    @property
    def name(self) -> str:
        return "concept"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        컨셉 생성 실행

        Args:
            request: AgentRequest (payload에 ConceptInput 필드 포함)

        Returns:
            AgentResponse (outputs에 concepts 포함)
        """
        start_time = datetime.utcnow()

        # 입력 검증
        self._validate_request(request)

        try:
            input_data = ConceptInput(**request.payload)
        except Exception as e:
            raise AgentError(
                message=f"Invalid input: {str(e)}",
                agent=self.name,
                details={"payload": request.payload}
            )

        # 프롬프트 생성
        prompt = self._build_prompt(input_data)

        logger.info(f"[ConceptAgent] Generating {input_data.concept_count} concepts...")

        # LLM 호출 (Gemini 2.0 Flash)
        try:
            llm_response = await self.llm_gateway.generate(
                role=self.name,
                task="generate_concepts",
                payload={"prompt": prompt},
                mode="json",
                override_model="gemini-2.0-flash",
                options={
                    "temperature": 0.8,  # 창의성 중요
                    "max_tokens": 3000
                }
            )
        except Exception as e:
            logger.error(f"[ConceptAgent] LLM call failed: {e}")
            raise AgentError(
                message=f"LLM generation failed: {str(e)}",
                agent=self.name,
                details={"input": input_data.model_dump()}
            )

        # 결과 파싱
        try:
            output_data = self._parse_output(llm_response.output.value, input_data.concept_count)
        except Exception as e:
            logger.error(f"[ConceptAgent] Output parsing failed: {e}")
            raise AgentError(
                message=f"Output parsing failed: {str(e)}",
                agent=self.name,
                details={"llm_output": llm_response.output.value}
            )

        elapsed = (datetime.utcnow() - start_time).total_seconds()

        logger.info(
            f"[ConceptAgent] Generated {len(output_data.concepts)} concepts in {elapsed:.2f}s"
        )

        # AgentResponse 반환
        return AgentResponse(
            agent=self.name,
            task=request.task,
            outputs=[
                self._create_output(
                    output_type="json",
                    name="concepts",
                    value=output_data.model_dump(),
                    meta={"count": len(output_data.concepts)}
                )
            ],
            usage={
                "llm_tokens": llm_response.usage.get("total_tokens", 0),
                "elapsed_seconds": elapsed
            },
            meta={
                "llm_provider": llm_response.provider,
                "llm_model": llm_response.model,
                "concept_count": len(output_data.concepts)
            }
        )

    def _build_prompt(self, input_data: ConceptInput) -> str:
        """프롬프트 생성"""

        # 회의 요약 정리
        meeting = input_data.meeting_summary
        meeting_text = f"""
## 회의 요약
- 제목: {meeting.get('title', '제목 없음')}
- 핵심 포인트: {', '.join(meeting.get('key_points', []))}
- 핵심 메시지: {meeting.get('core_message', '')}
"""

        # 브리프 정리 (있으면)
        brief_text = ""
        if input_data.campaign_brief:
            brief = input_data.campaign_brief
            brief_text = f"""
## 캠페인 브리프
- 목표: {brief.get('objective', '')}
- 타겟: {brief.get('target_audience', '')}
- 톤앤매너: {brief.get('tone_and_manner', '')}
"""

        # 브랜드 컨텍스트
        brand_text = ""
        if input_data.brand_context:
            brand_text = f"""
## 브랜드 컨텍스트
{input_data.brand_context}
"""

        prompt = f"""당신은 마케팅 전문가입니다. 아래 정보를 바탕으로 {input_data.concept_count}개의 마케팅 컨셉을 생성하세요.

{meeting_text}
{brief_text}
{brand_text}

## 요구사항
1. 각 컨셉은 서로 다른 접근 방식을 가져야 합니다 (예: 감성적 vs 이성적, 가격 강조 vs 품질 강조)
2. 타겟 고객이 공감할 수 있는 핵심 메시지를 만드세요
3. 비주얼 스타일은 구체적으로 설명하세요 (예: "밝고 모던한 오피스 분위기")
4. 색상 팔레트는 HEX 코드 3-5개를 제안하세요

## 출력 형식 (JSON)
{{
    "concepts": [
        {{
            "concept_name": "컨셉명 (5-15자)",
            "concept_description": "컨셉 설명 (2-3문장)",
            "target_audience": "타겟 고객",
            "key_message": "핵심 메시지 (10-30자)",
            "tone_and_manner": "톤앤매너",
            "visual_style": "비주얼 스타일 설명",
            "color_palette": ["#HEX1", "#HEX2", "#HEX3"],
            "keywords": ["키워드1", "키워드2", "키워드3"]
        }}
    ],
    "reasoning": "컨셉 도출 근거 설명"
}}

{input_data.concept_count}개의 컨셉을 생성하세요. 한국어로 작성하세요.
"""
        return prompt

    def _parse_output(self, llm_output: Any, expected_count: int) -> ConceptAgentOutput:
        """LLM 출력 파싱"""

        # 이미 dict인 경우 (JSON 모드)
        if isinstance(llm_output, dict):
            data = llm_output
        elif isinstance(llm_output, str):
            # JSON 파싱 시도
            try:
                data = json.loads(llm_output)
            except json.JSONDecodeError:
                # JSON 블록 추출 시도
                import re
                json_match = re.search(r'\{[\s\S]*\}', llm_output)
                if json_match:
                    data = json.loads(json_match.group())
                else:
                    raise ValueError("Cannot parse LLM output as JSON")
        else:
            raise ValueError(f"Unexpected output type: {type(llm_output)}")

        # concepts 필드 확인
        if "concepts" not in data:
            raise ValueError("Missing 'concepts' field in output")

        # 컨셉 파싱
        concepts = []
        for i, concept_data in enumerate(data["concepts"]):
            try:
                concept = ConceptOutput(
                    concept_name=concept_data.get("concept_name", f"컨셉 {i+1}"),
                    concept_description=concept_data.get("concept_description", ""),
                    target_audience=concept_data.get("target_audience", ""),
                    key_message=concept_data.get("key_message", ""),
                    tone_and_manner=concept_data.get("tone_and_manner", ""),
                    visual_style=concept_data.get("visual_style", ""),
                    color_palette=concept_data.get("color_palette", ["#4F46E5", "#10B981", "#F59E0B"]),
                    keywords=concept_data.get("keywords", [])
                )
                concepts.append(concept)
            except Exception as e:
                logger.warning(f"Failed to parse concept {i}: {e}")
                continue

        if len(concepts) == 0:
            raise ValueError("No valid concepts parsed")

        return ConceptAgentOutput(
            concepts=concepts,
            reasoning=data.get("reasoning", "")
        )


# =============================================================================
# Factory Function
# =============================================================================

def get_concept_agent(llm_gateway=None) -> ConceptAgent:
    """ConceptAgent 인스턴스 반환"""
    return ConceptAgent(llm_gateway=llm_gateway)
