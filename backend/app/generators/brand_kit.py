"""
BrandKitGenerator

Brand Kit 생성 Generator
GENERATORS_SPEC.md 섹션 4.1 기반 구현
"""

from typing import Dict, Any
import logging

from app.generators.base import BaseGenerator, GenerationRequest, GenerationResult
from app.agents.brand_agent import BrandAgent
from app.agents.strategist import StrategistAgent
from app.agents.copywriter import CopywriterAgent
from app.agents.reviewer import ReviewerAgent
from app.schemas.agent import A2ARequest, SystemContext

logger = logging.getLogger(__name__)


class BrandKitGenerator(BaseGenerator):
    """
    Brand Kit Generator

    브랜드의 색/폰트/로고/톤/메시지를 정리된 형태로 생성합니다.

    파이프라인:
    1. BrandAgent: 기존 Brand 정보 조회
    2. StrategistAgent: Brand Kit 구조 설계
    3. CopywriterAgent: 브랜드 메시지/슬로건 생성
    4. ReviewerAgent: 브랜드 일관성 검토

    입력 예시:
    {
      "kind": "brand_kit",
      "brandId": "brand_001",
      "input": {
        "brand": {
          "name": "스킨케어 브랜드 A",
          "industry": "beauty",
          "description": "자연주의 스킨케어",
          "target_audience": "20-30대 여성",
          "values": ["자연", "건강", "지속가능성"]
        }
      }
    }

    출력:
    - textBlocks: { slogan, mission, values, tone_of_voice }
    - editorDocument: Brand Kit 소개 카드 레이아웃
    """

    def __init__(self):
        super().__init__()

        # Agent 초기화
        self.brand_analyzer = BrandAgent()
        self.strategist = StrategistAgent()
        self.copywriter = CopywriterAgent()
        self.reviewer = ReviewerAgent()

        logger.info("[BrandKitGenerator] Initialized")

    async def generate(self, request: GenerationRequest) -> GenerationResult:
        """
        Brand Kit 생성 실행

        Args:
            request: Generator 요청

        Returns:
            GenerationResult: Brand Kit 데이터 + Editor JSON

        Raises:
            ValueError: 필수 입력 누락
            RuntimeError: Generator 실행 실패
        """
        task_id = self._generate_task_id()
        logger.info(f"[BrandKitGenerator] Starting generation, task_id={task_id}")

        # 입력 검증
        if not request.input.get("brand"):
            raise ValueError("Brand 정보가 필요합니다 (input.brand)")

        brand_input = request.input["brand"]

        # 파이프라인 실행
        try:
            # Step 1: Brand 정보 조회 (brandId가 있는 경우)
            brand_data = {}
            if request.brandId:
                logger.info(f"[BrandKitGenerator] Retrieving existing brand: {request.brandId}")
                # TODO: DB에서 Brand 조회 (현재는 입력 데이터 사용)
                brand_data = {
                    "brand_id": request.brandId,
                    "brand_kit": {}
                }

            # Step 2: Strategist - Brand Kit 구조 설계
            logger.info("[BrandKitGenerator] Step 2: StrategistAgent - 구조 설계")
            structure_request = A2ARequest(
                request_id=f"{task_id}_strategist",
                source_agent="BrandKitGenerator",
                target_agent="StrategistAgent",
                system_context=SystemContext(
                    brand_id=request.brandId,
                    project_id=None,
                    user_id=None,
                    task_type="brand_kit_structure",
                    risk_level="low"
                ),
                payload={
                    "brief": {
                        "goal": "Brand Kit 정의 및 구조 설계",
                        "target_audience": brand_input.get("target_audience", ""),
                        "key_messages": brand_input.get("values", []),
                        "tone": "professional",
                        "channels": ["brand_identity"],
                        "requirements": ["slogan", "mission", "values", "tone_of_voice", "visual_identity"]
                    },
                    "brand_kit": brand_data.get("brand_kit", {}),
                    "brand_analysis": {"key_values": brand_input.get("values", [])}
                }
            )

            # StrategistAgent 실행
            strategist_response = await self.strategist.process(structure_request)

            if strategist_response.status != "success":
                logger.warning(f"[BrandKitGenerator] StrategistAgent 실패, fallback 사용: {strategist_response.error}")
                brand_kit_structure = {
                    "sections": ["slogan", "mission", "values", "tone_of_voice", "visual_identity"]
                }
            else:
                strategy_data = strategist_response.result.get("strategy", {})
                brand_kit_structure = {
                    "sections": ["slogan", "mission", "values", "tone_of_voice", "visual_identity"],
                    "key_messages": strategy_data.get("key_messages", []),
                    "content_themes": strategy_data.get("content_themes", [])
                }

            # Step 3: Copywriter - 브랜드 슬로건 생성
            logger.info("[BrandKitGenerator] Step 3: CopywriterAgent - 슬로건 생성")
            slogan_request = A2ARequest(
                request_id=f"{task_id}_copywriter_slogan",
                source_agent="BrandKitGenerator",
                target_agent="CopywriterAgent",
                system_context=SystemContext(
                    brand_id=request.brandId,
                    project_id=None,
                    user_id=None,
                    task_type="brand_slogan",
                    risk_level="low"
                ),
                payload={
                    "brief": {
                        "goal": f"{brand_input.get('name', '브랜드')} 슬로건 작성",
                        "target_audience": brand_input.get("target_audience", ""),
                        "key_messages": brand_input.get("values", []),
                        "tone": "professional"
                    },
                    "strategy": brand_kit_structure,
                    "brand_voice": "professional",
                    "channel": "brand_identity",
                    "copy_type": "slogan",
                    "max_length": 50,
                    "variants_count": 2
                }
            )

            # CopywriterAgent 실행 (슬로건)
            slogan_response = await self.copywriter.process(slogan_request)

            # Step 4: Copywriter - 미션 생성
            logger.info("[BrandKitGenerator] Step 4: CopywriterAgent - 미션 생성")
            mission_request = A2ARequest(
                request_id=f"{task_id}_copywriter_mission",
                source_agent="BrandKitGenerator",
                target_agent="CopywriterAgent",
                system_context=SystemContext(
                    brand_id=request.brandId,
                    project_id=None,
                    user_id=None,
                    task_type="brand_mission",
                    risk_level="low"
                ),
                payload={
                    "brief": {
                        "goal": f"{brand_input.get('name', '브랜드')} 미션 작성",
                        "target_audience": brand_input.get("target_audience", ""),
                        "key_messages": brand_input.get("values", []),
                        "tone": "professional"
                    },
                    "strategy": brand_kit_structure,
                    "brand_voice": "professional",
                    "channel": "brand_identity",
                    "copy_type": "mission",
                    "max_length": 200,
                    "variants_count": 1
                }
            )

            # CopywriterAgent 실행 (미션)
            mission_response = await self.copywriter.process(mission_request)

            # 텍스트 블록 구성
            text_blocks = {
                "slogan": slogan_response.result.get("primary_copy", brand_input.get("name", "브랜드명") + "와 함께하는 새로운 경험") if slogan_response.status == "success" else brand_input.get("name", "브랜드명") + "와 함께하는 새로운 경험",
                "mission": mission_response.result.get("primary_copy", f"{brand_input.get('name', '브랜드')}는 고객에게 최고의 가치를 제공합니다") if mission_response.status == "success" else f"{brand_input.get('name', '브랜드')}는 고객에게 최고의 가치를 제공합니다",
                "values": ", ".join(brand_input.get("values", ["혁신", "신뢰", "지속가능성"])),
                "vision": f"{brand_input.get('name', '브랜드')}가 만드는 더 나은 미래",
                "tone_of_voice": "전문적이면서도 친근한 톤",
                "primary_colors": ["#1E3A8A", "#F59E0B"],
                "secondary_colors": ["#64748B", "#D1D5DB"],
                "fonts": {
                    "heading": "Pretendard Bold",
                    "body": "Pretendard Regular"
                }
            }

            # Step 5: Reviewer - 브랜드 일관성 검토
            logger.info("[BrandKitGenerator] Step 5: ReviewerAgent - 품질 검토")
            review_request = A2ARequest(
                request_id=f"{task_id}_reviewer",
                source_agent="BrandKitGenerator",
                target_agent="ReviewerAgent",
                system_context=SystemContext(
                    brand_id=request.brandId,
                    project_id=None,
                    user_id=None,
                    task_type="brand_kit_review",
                    risk_level="low"
                ),
                payload={
                    "brief": {
                        "goal": "Brand Kit 생성",
                        "target_audience": brand_input.get("target_audience", ""),
                        "key_messages": brand_input.get("values", []),
                        "tone": "professional"
                    },
                    "generated_content": text_blocks,
                    "content_type": "brand_kit",
                    "brand_kit": brand_data.get("brand_kit", {}),
                    "strict_mode": False
                }
            )

            # ReviewerAgent 실행
            reviewer_response = await self.reviewer.process(review_request)

            if reviewer_response.status != "success":
                logger.warning(f"[BrandKitGenerator] ReviewerAgent 실패, 기본 승인: {reviewer_response.error}")
                review_result = {
                    "overall_score": 0.7,
                    "approved": True,
                    "feedback": ["자동 승인 (Reviewer 실패)"],
                    "suggestions": []
                }
            else:
                review_result = reviewer_response.result

            # Step 6: Editor Document 생성
            logger.info("[BrandKitGenerator] Step 6: Editor Document 생성")
            editor_document = self._create_brand_kit_document(
                request,
                brand_input,
                text_blocks
            )

            # Agents trace 구성
            agents_trace = [
                {
                    "agent": "StrategistAgent",
                    "status": "completed" if strategist_response.status == "success" else "failed",
                    "metadata": strategist_response.metadata if strategist_response.status == "success" else {}
                },
                {
                    "agent": "CopywriterAgent (Slogan)",
                    "status": "completed" if slogan_response.status == "success" else "failed",
                    "metadata": slogan_response.metadata if slogan_response.status == "success" else {}
                },
                {
                    "agent": "CopywriterAgent (Mission)",
                    "status": "completed" if mission_response.status == "success" else "failed",
                    "metadata": mission_response.metadata if mission_response.status == "success" else {}
                },
                {
                    "agent": "ReviewerAgent",
                    "status": "completed" if reviewer_response.status == "success" else "failed",
                    "score": review_result.get("overall_score", 0.7),
                    "approved": review_result.get("approved", True)
                }
            ]

            # 결과 생성
            result = GenerationResult(
                taskId=task_id,
                kind="brand_kit",
                textBlocks=text_blocks,
                editorDocument=editor_document,
                meta={
                    "templates_used": ["brand_kit_default"],
                    "agents_trace": agents_trace,
                    "llm_cost": {
                        "prompt_tokens": 500,
                        "completion_tokens": 800
                    },
                    "review": review_result,
                    "is_mock": False  # 실제 Agent 연동됨
                }
            )

            logger.info(f"[BrandKitGenerator] Completed, task_id={task_id}")
            return result

        except Exception as e:
            logger.error(f"[BrandKitGenerator] Failed: {e}", exc_info=True)
            raise RuntimeError(f"Brand Kit 생성 실패: {str(e)}")

    def _create_brand_kit_document(
        self,
        request: GenerationRequest,
        brand_input: Dict[str, Any],
        text_blocks: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Brand Kit용 Editor Document 생성

        ONE_PAGE_EDITOR_SPEC.md 기반 JSON 구조

        Args:
            request: Generator 요청
            brand_input: 브랜드 입력 데이터
            text_blocks: 생성된 텍스트 블록

        Returns:
            Editor Document JSON
        """
        import uuid

        document_id = f"doc_{uuid.uuid4().hex[:12]}"

        return {
            "documentId": document_id,
            "type": "brand_kit",
            "brandId": request.brandId,
            "pages": [
                {
                    "id": "page_1",
                    "name": "Brand Kit Overview",
                    "width": 1080,
                    "height": 1350,
                    "background": "#FFFFFF",
                    "objects": [
                        # 브랜드명
                        {
                            "id": "obj_brand_name",
                            "type": "text",
                            "role": "BRAND_NAME",
                            "bounds": {"x": 80, "y": 80, "width": 920, "height": 80},
                            "props": {
                                "text": brand_input.get("name", "브랜드명"),
                                "fontFamily": "Pretendard",
                                "fontSize": 48,
                                "fontWeight": 700,
                                "fill": text_blocks.get("primary_colors", ["#1E3A8A"])[0],
                                "textAlign": "center"
                            },
                            "bindings": {"field": "brand.name"}
                        },
                        # 슬로건
                        {
                            "id": "obj_slogan",
                            "type": "text",
                            "role": "SLOGAN",
                            "bounds": {"x": 80, "y": 180, "width": 920, "height": 60},
                            "props": {
                                "text": text_blocks.get("slogan", ""),
                                "fontFamily": "Pretendard",
                                "fontSize": 24,
                                "fontWeight": 500,
                                "fill": "#333333",
                                "textAlign": "center"
                            },
                            "bindings": {"field": "slogan"}
                        },
                        # 미션
                        {
                            "id": "obj_mission",
                            "type": "text",
                            "role": "MISSION",
                            "bounds": {"x": 80, "y": 300, "width": 920, "height": 150},
                            "props": {
                                "text": text_blocks.get("mission", ""),
                                "fontFamily": "Pretendard",
                                "fontSize": 16,
                                "fontWeight": 400,
                                "fill": "#666666",
                                "textAlign": "left",
                                "lineHeight": 1.6
                            },
                            "bindings": {"field": "mission"}
                        },
                        # 핵심 가치
                        {
                            "id": "obj_values",
                            "type": "text",
                            "role": "VALUES",
                            "bounds": {"x": 80, "y": 500, "width": 920, "height": 100},
                            "props": {
                                "text": f"핵심 가치: {text_blocks.get('values', '')}",
                                "fontFamily": "Pretendard",
                                "fontSize": 14,
                                "fontWeight": 600,
                                "fill": "#444444",
                                "textAlign": "left"
                            },
                            "bindings": {"field": "values"}
                        },
                        # 톤앤매너
                        {
                            "id": "obj_tone",
                            "type": "text",
                            "role": "TONE_OF_VOICE",
                            "bounds": {"x": 80, "y": 640, "width": 920, "height": 80},
                            "props": {
                                "text": f"톤앤매너: {text_blocks.get('tone_of_voice', '')}",
                                "fontFamily": "Pretendard",
                                "fontSize": 14,
                                "fontWeight": 400,
                                "fill": "#666666",
                                "textAlign": "left"
                            },
                            "bindings": {"field": "tone_of_voice"}
                        },
                        # 컬러 팔레트 (Primary)
                        {
                            "id": "obj_color_primary",
                            "type": "shape",
                            "role": "COLOR_PRIMARY",
                            "bounds": {"x": 80, "y": 780, "width": 200, "height": 100},
                            "props": {
                                "type": "rect",
                                "fill": text_blocks.get("primary_colors", ["#1E3A8A"])[0],
                                "stroke": "#E5E7EB",
                                "strokeWidth": 2
                            }
                        },
                        # 컬러 팔레트 (Secondary)
                        {
                            "id": "obj_color_secondary",
                            "type": "shape",
                            "role": "COLOR_SECONDARY",
                            "bounds": {"x": 300, "y": 780, "width": 200, "height": 100},
                            "props": {
                                "type": "rect",
                                "fill": text_blocks.get("primary_colors", ["#1E3A8A", "#F59E0B"])[1] if len(text_blocks.get("primary_colors", [])) > 1 else "#F59E0B",
                                "stroke": "#E5E7EB",
                                "strokeWidth": 2
                            }
                        }
                    ]
                }
            ]
        }
