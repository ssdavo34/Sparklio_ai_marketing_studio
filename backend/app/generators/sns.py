"""
SNSGenerator

SNS 카드뉴스/피드 이미지 생성 Generator
GENERATORS_SPEC.md 섹션 4.4 기반 구현
"""

from typing import Dict, Any
import logging

from app.generators.base import BaseGenerator, GenerationRequest, GenerationResult

logger = logging.getLogger(__name__)


class SNSGenerator(BaseGenerator):
    """
    SNS Content & Card Generator

    인스타그램/블로그용 카드뉴스, 피드 이미지, 썸네일 등을 생성합니다.

    파이프라인:
    1. StrategistAgent: 카드 구조 설계 (장수, 순서, 메시지 흐름)
    2. DataFetcher: RAG로 트렌드/해시태그 데이터 수집
    3. TemplateSelectorAgent: SNS 채널/스타일에 맞는 템플릿 선택
    4. CopywriterAgent: 카드별 카피 생성
    5. LayoutDesignerAgent: 다중 페이지 Editor JSON 생성
    6. ReviewerAgent: 품질 검토

    입력 예시:
    {
      "kind": "sns",
      "brandId": "brand_001",
      "locale": "ko-KR",
      "channel": "instagram",
      "input": {
        "post": {
          "purpose": "정보 공유",
          "topic": "겨울 스킨케어 팁",
          "format": "card_news",
          "card_count": 5,
          "style": "magazine"
        }
      }
    }

    출력:
    - textBlocks: { card_1_headline, card_1_body, ..., hashtags }
    - editorDocument: 다중 페이지 카드뉴스 레이아웃
    """

    def __init__(self):
        super().__init__()
        logger.info("[SNSGenerator] Initialized")

    async def generate(self, request: GenerationRequest) -> GenerationResult:
        """
        SNS Content 생성 실행

        Args:
            request: Generator 요청

        Returns:
            GenerationResult: SNS 카드 데이터 + Editor JSON

        Raises:
            ValueError: 필수 입력 누락
            RuntimeError: Generator 실행 실패
        """
        task_id = self._generate_task_id()
        logger.info(f"[SNSGenerator] Starting generation, task_id={task_id}")

        # 입력 검증
        if not request.input.get("post"):
            raise ValueError("Post 정보가 필요합니다 (input.post)")

        post_input = request.input["post"]
        card_count = post_input.get("card_count", 5)

        try:
            # TODO: 실제 Agent 파이프라인 구현
            # 현재는 Mock 데이터로 응답

            # Step 1: Strategist - 카드 구조 설계
            logger.info(f"[SNSGenerator] Step 1: Card structure design (Mock) - {card_count}장")

            # Step 2: DataFetcher - 트렌드/해시태그 데이터 수집
            logger.info("[SNSGenerator] Step 2: Trend/hashtag data fetch (Mock)")

            # Step 3: TemplateSelector - SNS 템플릿 선택
            logger.info("[SNSGenerator] Step 3: Template selection (Mock)")

            # Step 4: Copywriter - 카드별 카피 생성
            logger.info("[SNSGenerator] Step 4: Card copy generation (Mock)")
            text_blocks = self._generate_card_texts(post_input, card_count)

            # Step 5: LayoutDesigner - 다중 페이지 Editor JSON 생성
            logger.info("[SNSGenerator] Step 5: Multi-page editor document generation (Mock)")
            editor_document = self._create_sns_document(
                request,
                post_input,
                text_blocks,
                card_count
            )

            # Step 6: Reviewer - 품질 검토
            logger.info("[SNSGenerator] Step 6: Quality review (Mock)")
            review_result = {
                "overall_score": 0.88,
                "approved": True,
                "feedback": "카드 흐름이 자연스럽고 메시지가 명확함"
            }

            # 결과 생성
            result = GenerationResult(
                taskId=task_id,
                kind="sns",
                textBlocks=text_blocks,
                editorDocument=editor_document,
                meta={
                    "templates_used": [f"sns_{post_input.get('style', 'default')}"],
                    "agents_trace": [
                        {"agent": "StrategistAgent", "status": "completed (mock)"},
                        {"agent": "DataFetcher", "status": "completed (mock)"},
                        {"agent": "TemplateSelectorAgent", "status": "completed (mock)"},
                        {"agent": "CopywriterAgent", "status": "completed (mock)"},
                        {"agent": "LayoutDesignerAgent", "status": "completed (mock)"},
                        {"agent": "ReviewerAgent", "status": "completed (mock)", "score": review_result["overall_score"]}
                    ],
                    "llm_cost": {
                        "prompt_tokens": 600,
                        "completion_tokens": 1000
                    },
                    "review": review_result,
                    "is_mock": True,
                    "card_count": card_count
                }
            )

            logger.info(f"[SNSGenerator] Completed, task_id={task_id}, cards={card_count}")
            return result

        except Exception as e:
            logger.error(f"[SNSGenerator] Failed: {e}", exc_info=True)
            raise RuntimeError(f"SNS Content 생성 실패: {str(e)}")

    def _generate_card_texts(self, post_input: Dict[str, Any], card_count: int) -> Dict[str, Any]:
        """
        카드별 텍스트 생성 (Mock)

        Args:
            post_input: 포스트 입력 데이터
            card_count: 카드 장수

        Returns:
            카드별 텍스트 블록
        """
        topic = post_input.get("topic", "주제")
        text_blocks = {}

        for i in range(1, card_count + 1):
            text_blocks[f"card_{i}_headline"] = f"{topic} - {i}번째 팁"
            text_blocks[f"card_{i}_body"] = f"{i}번째 카드 본문 내용입니다."

        # 해시태그
        text_blocks["hashtags"] = "#스킨케어 #뷰티팁 #겨울피부관리 #일상"

        return text_blocks

    def _create_sns_document(
        self,
        request: GenerationRequest,
        post_input: Dict[str, Any],
        text_blocks: Dict[str, Any],
        card_count: int
    ) -> Dict[str, Any]:
        """
        SNS용 Editor Document 생성 (다중 페이지)

        ONE_PAGE_EDITOR_SPEC.md 기반 JSON 구조

        Args:
            request: Generator 요청
            post_input: 포스트 입력 데이터
            text_blocks: 생성된 텍스트 블록
            card_count: 카드 장수

        Returns:
            Editor Document JSON (다중 페이지)
        """
        import uuid

        document_id = f"doc_{uuid.uuid4().hex[:12]}"

        # 다중 페이지 생성
        pages = []
        for i in range(1, card_count + 1):
            page = {
                "id": f"page_{i}",
                "name": f"Card {i}",
                "width": 1080,
                "height": 1080,  # Instagram 정사각형
                "background": "#F9FAFB" if i % 2 == 0 else "#FFFFFF",
                "objects": [
                    # 카드 번호 배지
                    {
                        "id": f"obj_card_{i}_badge",
                        "type": "text",
                        "role": "BADGE",
                        "bounds": {"x": 80, "y": 80, "width": 80, "height": 80},
                        "props": {
                            "text": f"{i}/{card_count}",
                            "fontFamily": "Pretendard",
                            "fontSize": 24,
                            "fontWeight": 700,
                            "fill": "#1E3A8A",
                            "textAlign": "center"
                        }
                    },
                    # 헤드라인
                    {
                        "id": f"obj_card_{i}_headline",
                        "type": "text",
                        "role": "HEADLINE",
                        "bounds": {"x": 80, "y": 200, "width": 920, "height": 150},
                        "props": {
                            "text": text_blocks.get(f"card_{i}_headline", f"카드 {i} 제목"),
                            "fontFamily": "Pretendard",
                            "fontSize": 36,
                            "fontWeight": 700,
                            "fill": "#111111",
                            "textAlign": "left",
                            "lineHeight": 1.4
                        },
                        "bindings": {"field": f"card_{i}_headline"}
                    },
                    # 본문
                    {
                        "id": f"obj_card_{i}_body",
                        "type": "text",
                        "role": "BODY",
                        "bounds": {"x": 80, "y": 380, "width": 920, "height": 500},
                        "props": {
                            "text": text_blocks.get(f"card_{i}_body", f"카드 {i} 본문"),
                            "fontFamily": "Pretendard",
                            "fontSize": 20,
                            "fontWeight": 400,
                            "fill": "#333333",
                            "textAlign": "left",
                            "lineHeight": 1.6
                        },
                        "bindings": {"field": f"card_{i}_body"}
                    }
                ]
            }

            # 마지막 카드에만 해시태그 추가
            if i == card_count:
                page["objects"].append({
                    "id": "obj_hashtags",
                    "type": "text",
                    "role": "HASHTAGS",
                    "bounds": {"x": 80, "y": 920, "width": 920, "height": 100},
                    "props": {
                        "text": text_blocks.get("hashtags", ""),
                        "fontFamily": "Pretendard",
                        "fontSize": 16,
                        "fontWeight": 400,
                        "fill": "#1E3A8A",
                        "textAlign": "left"
                    },
                    "bindings": {"field": "hashtags"}
                })

            pages.append(page)

        return {
            "documentId": document_id,
            "type": "sns",
            "brandId": request.brandId,
            "pages": pages
        }
