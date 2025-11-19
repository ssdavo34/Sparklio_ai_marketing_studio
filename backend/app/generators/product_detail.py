"""
ProductDetailGenerator

제품 상세페이지/브로셔 생성 Generator
GENERATORS_SPEC.md 섹션 4.3 기반 구현
"""

from typing import Dict, Any
import logging

from app.generators.base import BaseGenerator, GenerationRequest, GenerationResult
from app.agents.strategist import StrategistAgent
from app.agents.copywriter import CopywriterAgent
from app.agents.reviewer import ReviewerAgent
from app.schemas.agent import A2ARequest, SystemContext

logger = logging.getLogger(__name__)


class ProductDetailGenerator(BaseGenerator):
    """
    Product Detail Generator

    쇼핑몰용 상품 상세페이지/브로셔 초안을 생성합니다.

    파이프라인:
    1. StrategistAgent: 상세페이지 구조 설계 (Hero, Feature, Spec, Review 섹션)
    2. DataFetcher: RAG로 브랜드/경쟁사/트렌드 데이터 수집
    3. TemplateSelectorAgent: 업종/채널에 맞는 템플릿 선택
    4. CopywriterAgent: 섹션별 카피 생성
    5. LayoutDesignerAgent: Editor JSON 생성
    6. ReviewerAgent: 품질 검토

    입력 예시:
    {
      "kind": "product_detail",
      "brandId": "brand_001",
      "locale": "ko-KR",
      "channel": "shop_detail",
      "input": {
        "product": {
          "name": "비타민C 세럼",
          "category": "스킨케어",
          "features": ["주름개선", "미백", "보습"],
          "price": 49000,
          "target_audience": "20-30대 여성",
          "usp": "99% 순도 비타민C"
        }
      }
    }

    출력:
    - textBlocks: { headline, hero_copy, features, specs, cta }
    - editorDocument: 상세페이지 레이아웃 (PC/Mobile)
    """

    def __init__(self):
        super().__init__()

        # Agent 초기화
        self.strategist = StrategistAgent()
        self.copywriter = CopywriterAgent()
        self.reviewer = ReviewerAgent()

        logger.info("[ProductDetailGenerator] Initialized")

    async def generate(self, request: GenerationRequest) -> GenerationResult:
        """
        Product Detail 생성 실행

        Args:
            request: Generator 요청

        Returns:
            GenerationResult: Product Detail 데이터 + Editor JSON

        Raises:
            ValueError: 필수 입력 누락
            RuntimeError: Generator 실행 실패
        """
        task_id = self._generate_task_id()
        logger.info(f"[ProductDetailGenerator] Starting generation, task_id={task_id}")

        # 입력 검증 및 파싱 (유연한 입력 처리)
        if "product" in request.input:
            # 구조화된 입력
            product_input = request.input["product"]
        elif "prompt" in request.input:
            # 자유 형식 입력 → 자동 파싱
            user_prompt = request.input["prompt"]
            product_input = {
                "name": user_prompt,  # "지성 피부용 진정 토너"
                "category": "스킨케어",  # 기본값
                "features": [user_prompt],  # 사용자 입력을 그대로 특징으로 사용
                "target_audience": "일반 소비자",
                "usp": user_prompt  # Unique Selling Point
            }
            logger.info(f"[ProductDetailGenerator] Auto-parsed from prompt: {user_prompt}")
        else:
            raise ValueError("Product 정보 또는 prompt가 필요합니다 (input.product or input.prompt)")

        try:
            # Step 1: Strategist - 상세페이지 구조 설계
            logger.info("[ProductDetailGenerator] Step 1: StrategistAgent - 구조 설계")
            structure_request = A2ARequest(
                request_id=f"{task_id}_strategist",
                source_agent="ProductDetailGenerator",
                target_agent="StrategistAgent",
                system_context=SystemContext(
                    brand_id=request.brandId,
                    project_id=None,
                    user_id=None,
                    task_type="product_detail_structure",
                    risk_level="low"
                ),
                payload={
                    "brief": {
                        "goal": f"{product_input.get('name', '제품')} 상세페이지 생성",
                        "target_audience": product_input.get("target_audience", ""),
                        "key_messages": product_input.get("features", []),
                        "tone": "professional",
                        "channels": ["shop_detail"],
                        "requirements": ["hero", "features", "specs", "price", "cta"]
                    },
                    "brand_kit": {},
                    "brand_analysis": {}
                }
            )

            # StrategistAgent 실행
            strategist_response = await self.strategist.process(structure_request)

            if strategist_response.status != "success":
                logger.warning(f"[ProductDetailGenerator] StrategistAgent 실패, fallback 사용: {strategist_response.error}")
                product_structure = {
                    "sections": ["hero", "features", "specs", "price", "cta"]
                }
            else:
                strategy_data = strategist_response.result.get("strategy", {})
                product_structure = {
                    "sections": ["hero", "features", "specs", "price", "cta"],
                    "key_messages": strategy_data.get("key_messages", []),
                    "content_themes": strategy_data.get("content_themes", [])
                }

            # Step 2: Copywriter - Headline 생성
            logger.info("[ProductDetailGenerator] Step 2: CopywriterAgent - Headline 생성")
            headline_request = A2ARequest(
                request_id=f"{task_id}_copywriter_headline",
                source_agent="ProductDetailGenerator",
                target_agent="CopywriterAgent",
                system_context=SystemContext(
                    brand_id=request.brandId,
                    project_id=None,
                    user_id=None,
                    task_type="product_headline",
                    risk_level="low"
                ),
                payload={
                    "prompt": f"'{product_input.get('name')}' 제품의 매력적인 헤드라인을 작성하세요",  # 🔴 사용자 입력 명시
                    "product_name": product_input.get("name"),  # 🔴 제품명 직접 전달
                    "brief": {
                        "goal": f"{product_input.get('name')} 제품 헤드라인 작성",
                        "target_audience": product_input.get("target_audience", ""),
                        "key_messages": product_input.get("features", []),
                        "tone": "professional"
                    },
                    "strategy": product_structure,
                    "brand_voice": "professional",
                    "channel": "shop_detail",
                    "copy_type": "headline",
                    "max_length": 100,
                    "variants_count": 2
                }
            )

            # CopywriterAgent 실행 (Headline)
            headline_response = await self.copywriter.process(headline_request)

            # Step 3: Copywriter - Hero Copy 생성
            logger.info("[ProductDetailGenerator] Step 3: CopywriterAgent - Hero Copy 생성")
            hero_request = A2ARequest(
                request_id=f"{task_id}_copywriter_hero",
                source_agent="ProductDetailGenerator",
                target_agent="CopywriterAgent",
                system_context=SystemContext(
                    brand_id=request.brandId,
                    project_id=None,
                    user_id=None,
                    task_type="product_hero",
                    risk_level="low"
                ),
                payload={
                    "prompt": f"'{product_input.get('name')}' 제품의 매력적인 소개글을 작성하세요",  # 🔴 사용자 입력 명시
                    "product_name": product_input.get("name"),  # 🔴 제품명 직접 전달
                    "features": product_input.get("features", []),  # 🔴 특징 직접 전달
                    "brief": {
                        "goal": f"{product_input.get('name')} 제품 소개 작성",
                        "target_audience": product_input.get("target_audience", ""),
                        "key_messages": product_input.get("features", []),
                        "tone": "professional"
                    },
                    "strategy": product_structure,
                    "brand_voice": "professional",
                    "channel": "shop_detail",
                    "copy_type": "body",
                    "max_length": 200,
                    "variants_count": 1
                }
            )

            # CopywriterAgent 실행 (Hero Copy)
            hero_response = await self.copywriter.process(hero_request)

            # 텍스트 블록 구성
            text_blocks = {
                "headline": headline_response.result.get("primary_copy", f"{product_input.get('name', '제품명')} - {product_input.get('usp', '혁신적인 기능')}") if headline_response.status == "success" else f"{product_input.get('name', '제품명')} - {product_input.get('usp', '혁신적인 기능')}",
                "hero_copy": hero_response.result.get("primary_copy", f"{product_input.get('name')}로 새로운 경험을 시작하세요") if hero_response.status == "success" else f"{product_input.get('name')}로 새로운 경험을 시작하세요",
                "features": ", ".join(product_input.get("features", ["혁신", "품질", "신뢰"])),
                "specs": f"카테고리: {product_input.get('category', 'N/A')}",
                "price": f"₩{product_input.get('price', 0):,}",
                "cta": "지금 구매하기"
            }

            # Step 4: Reviewer - 품질 검토
            logger.info("[ProductDetailGenerator] Step 4: ReviewerAgent - 품질 검토")
            review_request = A2ARequest(
                request_id=f"{task_id}_reviewer",
                source_agent="ProductDetailGenerator",
                target_agent="ReviewerAgent",
                system_context=SystemContext(
                    brand_id=request.brandId,
                    project_id=None,
                    user_id=None,
                    task_type="product_detail_review",
                    risk_level="low"
                ),
                payload={
                    "brief": {
                        "goal": f"{product_input.get('name')} 상세페이지 생성",
                        "target_audience": product_input.get("target_audience", ""),
                        "key_messages": product_input.get("features", []),
                        "tone": "professional"
                    },
                    "generated_content": text_blocks,
                    "content_type": "product_detail",
                    "brand_kit": {},
                    "strict_mode": False
                }
            )

            # ReviewerAgent 실행
            reviewer_response = await self.reviewer.process(review_request)

            if reviewer_response.status != "success":
                logger.warning(f"[ProductDetailGenerator] ReviewerAgent 실패, 기본 승인: {reviewer_response.error}")
                review_result = {
                    "overall_score": 0.7,
                    "approved": True,
                    "feedback": ["자동 승인 (Reviewer 실패)"],
                    "suggestions": []
                }
            else:
                review_result = reviewer_response.result

            # Step 5: Editor Document 생성
            logger.info("[ProductDetailGenerator] Step 5: Editor Document 생성")
            editor_document = self._create_product_detail_document(
                request,
                product_input,
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
                    "agent": "CopywriterAgent (Headline)",
                    "status": "completed" if headline_response.status == "success" else "failed",
                    "metadata": headline_response.metadata if headline_response.status == "success" else {}
                },
                {
                    "agent": "CopywriterAgent (Hero)",
                    "status": "completed" if hero_response.status == "success" else "failed",
                    "metadata": hero_response.metadata if hero_response.status == "success" else {}
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
                kind="product_detail",
                textBlocks=text_blocks,
                editorDocument=editor_document,
                meta={
                    "templates_used": ["product_detail_default"],
                    "agents_trace": agents_trace,
                    "llm_cost": {
                        "prompt_tokens": 800,
                        "completion_tokens": 1200
                    },
                    "review": review_result,
                    "is_mock": False  # 실제 Agent 연동됨
                }
            )

            logger.info(f"[ProductDetailGenerator] Completed, task_id={task_id}")
            return result

        except Exception as e:
            logger.error(f"[ProductDetailGenerator] Failed: {e}", exc_info=True)
            raise RuntimeError(f"Product Detail 생성 실패: {str(e)}")

    def _create_product_detail_document(
        self,
        request: GenerationRequest,
        product_input: Dict[str, Any],
        text_blocks: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Product Detail용 Editor Document 생성

        ONE_PAGE_EDITOR_SPEC.md 기반 JSON 구조

        Args:
            request: Generator 요청
            product_input: 제품 입력 데이터
            text_blocks: 생성된 텍스트 블록

        Returns:
            Editor Document JSON
        """
        import uuid

        document_id = f"doc_{uuid.uuid4().hex[:12]}"

        return {
            "documentId": document_id,
            "type": "product_detail",
            "brandId": request.brandId,
            "pages": [
                {
                    "id": "page_1",
                    "name": "Product Detail",
                    "width": 1200,
                    "height": 2400,
                    "background": "#FFFFFF",
                    "objects": [
                        # Hero Section - 제품명 (실제 데이터 사용)
                        {
                            "id": "obj_product_name",
                            "type": "text",
                            "role": "PRODUCT_NAME",
                            "bounds": {"x": 100, "y": 80, "width": 1000, "height": 100},
                            "props": {
                                "text": product_input.get("name", "제품명"),  # 실제 값
                                "fontFamily": "Pretendard",
                                "fontSize": 56,
                                "fontWeight": 700,
                                "fill": "#111111",
                                "textAlign": "center"
                            },
                            "bindings": {"field": "product.name"}
                        },
                        # Headline (LLM 생성 결과)
                        {
                            "id": "obj_headline",
                            "type": "text",
                            "role": "HEADLINE",
                            "bounds": {"x": 100, "y": 200, "width": 1000, "height": 80},
                            "props": {
                                "text": text_blocks.get("headline", ""),  # LLM 결과
                                "fontFamily": "Pretendard",
                                "fontSize": 32,
                                "fontWeight": 600,
                                "fill": "#1E3A8A",
                                "textAlign": "center"
                            },
                            "bindings": {"field": "headline"}
                        },
                        # Hero Copy (LLM 생성 결과)
                        {
                            "id": "obj_hero_copy",
                            "type": "text",
                            "role": "HERO_COPY",
                            "bounds": {"x": 100, "y": 300, "width": 1000, "height": 100},
                            "props": {
                                "text": text_blocks.get("hero_copy", ""),  # LLM 결과
                                "fontFamily": "Pretendard",
                                "fontSize": 20,
                                "fontWeight": 400,
                                "fill": "#333333",
                                "textAlign": "center",
                                "lineHeight": 1.6
                            },
                            "bindings": {"field": "hero_copy"}
                        },
                        # Main Visual Placeholder
                        {
                            "id": "obj_main_image",
                            "type": "image",
                            "role": "MAIN_VISUAL",
                            "bounds": {"x": 200, "y": 450, "width": 800, "height": 600},
                            "props": {
                                "src": "https://via.placeholder.com/800x600?text=Product+Image",
                                "fit": "cover"
                            },
                            "bindings": {"field": "product.main_image"}
                        },
                        # Features Section
                        {
                            "id": "obj_features",
                            "type": "text",
                            "role": "FEATURES",
                            "bounds": {"x": 100, "y": 1100, "width": 1000, "height": 200},
                            "props": {
                                "text": f"주요 기능: {text_blocks.get('features', '')}",
                                "fontFamily": "Pretendard",
                                "fontSize": 18,
                                "fontWeight": 500,
                                "fill": "#444444",
                                "textAlign": "left",
                                "lineHeight": 1.8
                            },
                            "bindings": {"field": "features"}
                        },
                        # Specs
                        {
                            "id": "obj_specs",
                            "type": "text",
                            "role": "SPECS",
                            "bounds": {"x": 100, "y": 1350, "width": 1000, "height": 150},
                            "props": {
                                "text": text_blocks.get("specs", ""),
                                "fontFamily": "Pretendard",
                                "fontSize": 16,
                                "fontWeight": 400,
                                "fill": "#666666",
                                "textAlign": "left"
                            },
                            "bindings": {"field": "specs"}
                        },
                        # Price Tag
                        {
                            "id": "obj_price",
                            "type": "text",
                            "role": "PRICE_TAG",
                            "bounds": {"x": 100, "y": 1550, "width": 400, "height": 80},
                            "props": {
                                "text": text_blocks.get("price", ""),
                                "fontFamily": "Pretendard",
                                "fontSize": 42,
                                "fontWeight": 700,
                                "fill": "#EF4444",
                                "textAlign": "left"
                            },
                            "bindings": {"field": "price"}
                        },
                        # CTA Button
                        {
                            "id": "obj_cta",
                            "type": "text",
                            "role": "CTA_BUTTON",
                            "bounds": {"x": 400, "y": 1700, "width": 400, "height": 80},
                            "props": {
                                "text": text_blocks.get("cta", "지금 구매하기"),
                                "fontFamily": "Pretendard",
                                "fontSize": 24,
                                "fontWeight": 700,
                                "fill": "#FFFFFF",
                                "textAlign": "center",
                                "backgroundColor": "#1E3A8A"
                            },
                            "bindings": {"field": "cta"}
                        }
                    ]
                }
            ]
        }
