"""
BriefAgent

사용자 요구사항 → 구조화된 Brief 생성
"""

from typing import Dict, Any
import logging
import json

from app.agents.base import LLMAgent
from app.schemas.agent import A2ARequest, A2AResponse, BriefRequest, BriefResponse
from app.integrations.ollama_client import OllamaClient


logger = logging.getLogger(__name__)


class BriefAgent(LLMAgent):
    """
    BriefAgent - 사용자 요구사항을 구조화된 Brief로 변환

    입력: 사용자의 자연어 입력
    출력: 구조화된 Brief (goal, target_audience, budget, timeline 등)
    """

    def __init__(self):
        super().__init__(agent_name="BriefAgent", agent_version="1.0.0")
        self.ollama_client = OllamaClient()

    def _register_capabilities(self) -> list[str]:
        return ["generate_brief", "parse_user_input", "extract_requirements"]

    async def process(self, request: A2ARequest) -> A2AResponse:
        """
        Brief 생성 메인 로직

        Args:
            request: A2A 요청

        Returns:
            A2AResponse: 생성된 Brief
        """
        # 페이로드 파싱
        user_input = request.payload.get("user_input", "")
        brand_id = request.system_context.brand_id
        project_type = request.payload.get("project_type", "campaign")

        logger.info(f"[BriefAgent] Generating brief for brand_id={brand_id}, project_type={project_type}")

        # 1. Ollama를 사용하여 사용자 입력 분석
        brief = await self._generate_brief_from_input(user_input, project_type)

        # 2. 필수 필드 검증
        validated_brief = self._validate_brief(brief)

        result = {
            "brief": validated_brief,
            "confidence": validated_brief.get("_confidence", 0.8),
            "raw_input": user_input
        }

        return self._create_success_response(
            request=request,
            result=result,
            metadata={
                "model_used": self.default_model,
                "project_type": project_type
            }
        )

    async def _generate_brief_from_input(self, user_input: str, project_type: str) -> Dict[str, Any]:
        """
        Ollama를 사용하여 사용자 입력으로부터 Brief 생성

        Args:
            user_input: 사용자의 자연어 입력
            project_type: 프로젝트 타입

        Returns:
            Dict: 생성된 Brief
        """
        system_prompt = """당신은 마케팅 전문가입니다. 사용자의 요구사항을 분석하여 구조화된 마케팅 Brief를 생성합니다.

다음 JSON 형식으로 응답하세요:
{
  "goal": "프로젝트의 구체적인 목표",
  "target_audience": "타겟 오디언스 정의 (연령, 성별, 관심사 등)",
  "key_messages": ["전달할 핵심 메시지 1", "핵심 메시지 2"],
  "channels": ["사용할 마케팅 채널들"],
  "budget": "예산 정보 (숫자만, 없으면 null)",
  "timeline": "예상 일정",
  "tone": "브랜드 톤 앤 보이스 (예: professional, friendly, energetic)",
  "requirements": ["특별 요구사항들"],
  "_confidence": 0.0~1.0
}

사용자가 명시하지 않은 정보는 추론하되, confidence를 낮게 설정하세요."""

        user_prompt = f"""프로젝트 타입: {project_type}

사용자 요구사항:
{user_input}

위 요구사항을 분석하여 마케팅 Brief를 JSON 형식으로 생성해주세요."""

        try:
            # Ollama 호출
            response = await self.ollama_client.generate(
                prompt=user_prompt,
                system=system_prompt,
                model=self.default_model,
                temperature=0.3,  # 낮은 temperature로 일관성 있는 응답
                max_tokens=1000
            )

            # JSON 파싱
            response_text = response["response"].strip()

            # JSON 블록 추출 (```json ... ``` 형식 처리)
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()

            brief = json.loads(response_text)

            logger.info(f"[BriefAgent] Brief generated successfully with confidence={brief.get('_confidence', 0.0)}")

            return brief

        except json.JSONDecodeError as e:
            logger.error(f"[BriefAgent] Failed to parse JSON response: {e}")
            logger.error(f"[BriefAgent] Response text: {response_text}")

            # 파싱 실패 시 기본 Brief 반환
            return {
                "goal": user_input[:200],
                "target_audience": "분석 필요",
                "key_messages": [],
                "channels": [],
                "budget": None,
                "timeline": "미정",
                "tone": "professional",
                "requirements": [],
                "_confidence": 0.3,
                "_error": "JSON 파싱 실패"
            }

        except Exception as e:
            logger.error(f"[BriefAgent] Error generating brief: {e}")

            return {
                "goal": user_input[:200],
                "target_audience": "분석 필요",
                "key_messages": [],
                "channels": [],
                "budget": None,
                "timeline": "미정",
                "tone": "professional",
                "requirements": [],
                "_confidence": 0.2,
                "_error": str(e)
            }

    def _validate_brief(self, brief: Dict[str, Any]) -> Dict[str, Any]:
        """
        Brief 필수 필드 검증 및 보완

        Args:
            brief: 생성된 Brief

        Returns:
            Dict: 검증된 Brief
        """
        # 필수 필드 확인
        required_fields = ["goal", "target_audience", "tone"]
        for field in required_fields:
            if not brief.get(field):
                brief[field] = "미정"
                brief["_confidence"] = min(brief.get("_confidence", 0.5), 0.5)

        # 리스트 필드 기본값 설정
        list_fields = ["key_messages", "channels", "requirements"]
        for field in list_fields:
            if not isinstance(brief.get(field), list):
                brief[field] = []

        return brief
