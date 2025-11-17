"""
BrandAgent

BrandKit 조회 및 브랜드 분석
"""

from typing import Dict, Any, Optional
import logging
import json

from app.agents.base import LLMAgent
from app.schemas.agent import A2ARequest, A2AResponse
from app.integrations.ollama_client import OllamaClient
from app.core.database import get_db
from app.models.brand import Brand
from sqlalchemy.orm import Session


logger = logging.getLogger(__name__)


class BrandAgent(LLMAgent):
    """
    BrandAgent - BrandKit 조회 및 브랜드 특성 분석

    입력: brand_id
    출력: BrandKit 데이터 + 브랜드 분석
    """

    def __init__(self):
        super().__init__(agent_name="BrandAgent", agent_version="1.0.0")
        self.ollama_client = OllamaClient()

    def _register_capabilities(self) -> list[str]:
        return ["get_brand_kit", "analyze_brand", "extract_brand_voice"]

    async def process(self, request: A2ARequest) -> A2AResponse:
        """
        BrandKit 조회 및 분석

        Args:
            request: A2A 요청

        Returns:
            A2AResponse: BrandKit 데이터 + 브랜드 분석
        """
        brand_id = request.system_context.brand_id
        db_session = request.payload.get("db_session")

        if not brand_id:
            return self._create_error_response(
                request=request,
                error="brand_id가 필요합니다"
            )

        logger.info(f"[BrandAgent] Retrieving brand_kit for brand_id={brand_id}")

        # 1. DB에서 Brand 조회
        brand = await self._get_brand_from_db(brand_id, db_session)

        if not brand:
            return self._create_error_response(
                request=request,
                error=f"브랜드를 찾을 수 없습니다: {brand_id}"
            )

        # 2. BrandKit 파싱
        brand_kit = brand.brand_kit or {}

        # 3. Ollama로 브랜드 특성 분석
        brand_analysis = await self._analyze_brand_with_llm(brand, brand_kit)

        result = {
            "brand_id": str(brand.id),
            "brand_name": brand.name,
            "brand_kit": brand_kit,
            "brand_analysis": brand_analysis,
            "industry": brand.industry,
            "tags": brand.tags or []
        }

        return self._create_success_response(
            request=request,
            result=result,
            metadata={
                "model_used": self.default_model,
                "analysis_confidence": brand_analysis.get("confidence", 0.0)
            }
        )

    async def _get_brand_from_db(self, brand_id: str, db_session: Optional[Session] = None) -> Optional[Brand]:
        """
        DB에서 Brand 조회

        Args:
            brand_id: 브랜드 ID
            db_session: 데이터베이스 세션 (optional)

        Returns:
            Brand 객체 또는 None
        """
        try:
            # db_session이 제공되지 않으면 새로 생성
            if db_session is None:
                db = next(get_db())
            else:
                db = db_session

            from uuid import UUID
            brand = db.query(Brand).filter(
                Brand.id == UUID(brand_id),
                Brand.deleted_at.is_(None)
            ).first()

            return brand

        except Exception as e:
            logger.error(f"[BrandAgent] Error retrieving brand: {e}")
            return None

    async def _analyze_brand_with_llm(self, brand: Brand, brand_kit: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ollama를 사용하여 브랜드 특성 분석

        Args:
            brand: Brand 객체
            brand_kit: BrandKit 데이터

        Returns:
            Dict: 브랜드 분석 결과
        """
        system_prompt = """당신은 브랜드 전문가입니다. 브랜드 정보를 분석하여 마케팅에 활용할 수 있는 인사이트를 제공합니다.

다음 JSON 형식으로 응답하세요:
{
  "brand_voice": "브랜드 보이스 (예: professional, friendly, energetic)",
  "tone_guidelines": ["톤앤매너 가이드라인 1", "가이드라인 2"],
  "key_values": ["브랜드 핵심 가치 1", "가치 2"],
  "target_persona": "추천 타겟 페르소나 설명",
  "content_themes": ["추천 콘텐츠 테마 1", "테마 2"],
  "do_and_dont": {
    "do": ["권장사항 1", "권장사항 2"],
    "dont": ["금지사항 1", "금지사항 2"]
  },
  "confidence": 0.0~1.0
}"""

        user_prompt = f"""브랜드 정보:
- 브랜드명: {brand.name}
- 설명: {brand.description or '정보 없음'}
- 산업: {brand.industry or '정보 없음'}
- 태그: {', '.join(brand.tags) if brand.tags else '정보 없음'}

BrandKit:
{json.dumps(brand_kit, ensure_ascii=False, indent=2)}

위 브랜드 정보를 분석하여 마케팅 가이드를 JSON 형식으로 생성해주세요."""

        try:
            response = await self.ollama_client.generate(
                prompt=user_prompt,
                system=system_prompt,
                model=self.default_model,
                temperature=0.5,
                max_tokens=1000
            )

            response_text = response["response"].strip()

            # JSON 블록 추출
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()

            analysis = json.loads(response_text)

            logger.info(f"[BrandAgent] Brand analysis complete with confidence={analysis.get('confidence', 0.0)}")

            return analysis

        except json.JSONDecodeError as e:
            logger.error(f"[BrandAgent] Failed to parse JSON response: {e}")

            # 파싱 실패 시 기본 분석 반환
            return {
                "brand_voice": brand_kit.get("tone", "professional"),
                "tone_guidelines": [],
                "key_values": brand_kit.get("key_messages", []),
                "target_persona": "분석 필요",
                "content_themes": [],
                "do_and_dont": {"do": [], "dont": []},
                "confidence": 0.3,
                "_error": "JSON 파싱 실패"
            }

        except Exception as e:
            logger.error(f"[BrandAgent] Error analyzing brand: {e}")

            return {
                "brand_voice": "professional",
                "tone_guidelines": [],
                "key_values": [],
                "target_persona": "분석 실패",
                "content_themes": [],
                "do_and_dont": {"do": [], "dont": []},
                "confidence": 0.2,
                "_error": str(e)
            }
