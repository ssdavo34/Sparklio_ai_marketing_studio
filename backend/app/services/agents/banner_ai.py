"""
Banner AI Agent

광고 배너 생성 전문 Agent

작성일: 2025-11-24
작성자: B팀 (Backend)
문서: ARCH-003, SPEC-002
"""

import logging
from typing import Dict, Any
from datetime import datetime

from .base import AgentBase, AgentRequest, AgentResponse, AgentError
from app.services.llm import LLMProviderOutput

logger = logging.getLogger(__name__)


class BannerAIAgent(AgentBase):
    """
    Banner AI Agent

    광고 배너 콘텐츠 생성 (여러 사이즈 동시 지원)

    주요 작업:
    1. banner_set: 여러 사이즈의 배너 세트 생성 (1080x1080, 1200x628, 1080x1920)

    사용 예시:
        agent = BannerAIAgent()
        response = await agent.execute(AgentRequest(
            task="banner_set",
            payload={
                "headline": "신제품 출시",
                "cta_text": "지금 구매하기",
                "sizes": ["1080x1080", "1200x628", "1080x1920"],
                "ad_type": "product"
            }
        ))
    """

    @property
    def name(self) -> str:
        return "banner_ai"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        Banner AI Agent 실행

        Args:
            request: Agent 요청

        Returns:
            AgentResponse: 생성된 배너 콘텐츠

        Raises:
            AgentError: 실행 실패 시
        """
        start_time = datetime.utcnow()

        try:
            # 1. 요청 검증
            self._validate_request(request)

            logger.info(f"Banner AI Agent executing: task={request.task}")

            # 2. LLM 프롬프트 구성
            enhanced_payload = self._enhance_payload(request)

            # 3. LLM 호출 (JSON 모드)
            llm_response = await self.llm_gateway.generate(
                role=self.name,
                task=request.task,
                payload=enhanced_payload,
                mode="json",
                options=request.options
            )

            # 4. 응답 파싱
            outputs = self._parse_llm_response(llm_response.output, request.task)

            # 5. 사용량 계산
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            usage = {
                "llm_tokens": llm_response.usage.get("total_tokens", 0),
                "total_tokens": llm_response.usage.get("total_tokens", 0),
                "elapsed_seconds": round(elapsed, 2)
            }

            # 6. 메타데이터
            meta = {
                "llm_provider": llm_response.provider,
                "llm_model": llm_response.model,
                "task": request.task
            }

            logger.info(
                f"Banner AI Agent success: task={request.task}, "
                f"elapsed={elapsed:.2f}s"
            )

            return AgentResponse(
                agent=self.name,
                task=request.task,
                outputs=outputs,
                usage=usage,
                meta=meta
            )

        except Exception as e:
            logger.error(f"Banner AI Agent failed: {str(e)}", exc_info=True)
            raise AgentError(
                message=f"Banner AI execution failed: {str(e)}",
                agent=self.name,
                details={"task": request.task}
            )

    def _enhance_payload(self, request: AgentRequest) -> Dict[str, Any]:
        """
        Payload에 작업별 추가 지시사항 추가
        """
        enhanced = request.payload.copy()

        if request.task == "banner_set":
            # Banner Set Generation
            enhanced["_instructions"] = (
                "여러 사이즈의 광고 배너 콘텐츠를 생성하세요.\\n\\n"
                "**사이즈별 특성:**\\n"
                "- 1080x1080 (Square): 인스타그램 피드, 페이스북 포스트\\n"
                "  - 텍스트는 중앙 또는 하단 배치\\n"
                "  - 제품 이미지는 상단 또는 배경으로\\n"
                "  - 헤드라인 + 서브헤드라인 + CTA (본문 생략 가능)\\n\\n"
                "- 1200x628 (Landscape): 페이스북 링크, 트위터 카드\\n"
                "  - 좌우 2분할 레이아웃 (이미지 | 텍스트)\\n"
                "  - 헤드라인 + 서브헤드라인 + 본문 + CTA 모두 포함 가능\\n"
                "  - 텍스트 양이 가장 많음\\n\\n"
                "- 1080x1920 (Story): 인스타그램/페이스북 스토리, 틱톡\\n"
                "  - 세로형, 전체 화면 몰입\\n"
                "  - 텍스트는 상단 또는 하단 (중앙은 이미지 영역)\\n"
                "  - 헤드라인 + CTA (서브헤드라인 옵션)\\n\\n"
                "**생성 지침:**\\n"
                "1. 각 사이즈별로 headline, subheadline, body_text, cta_text 최적화\\n"
                "2. layout_type 결정 (center, left, right, top, bottom)\\n"
                "3. text_area 좌표 계산 (x, y, width, height in px)\\n"
                "4. platform_fit 지정 (instagram, facebook, twitter, tiktok)\\n\\n"
                "**중요:**\\n"
                "- 헤드라인 길이: Square 15-25자, Landscape 20-40자, Story 10-20자\\n"
                "- 과대광고 금지 (최고, 1등, 100% 등 검증 불가 표현 제외)\\n"
                "- 브랜드 컨텍스트(brand_context)가 있으면 톤앤매너 반영\\n"
                "- ad_type에 맞게 메시지 조정 (product, brand, event, sale)\\n"
                "- language에 맞는 언어로 생성 (ko/en)"
            )
            enhanced["_output_structure"] = {
                "banners": [
                    {
                        "size": "1080x1080",
                        "width": 1080,
                        "height": 1080,
                        "headline": "헤드라인 (15-25자)",
                        "subheadline": "서브헤드라인 (50자 이내) or null",
                        "body_text": "본문 (100자 이내) or null",
                        "cta_text": "CTA (10자 이내)",
                        "layout_type": "center | left | right | top | bottom",
                        "text_area": {"x": 100, "y": 400, "width": 880, "height": 300},
                        "background_image_url": "입력값 그대로 전달 or null",
                        "product_image_url": "입력값 그대로 전달 or null",
                        "platform_fit": ["instagram", "facebook"]
                    }
                ]
            }

        return enhanced

    def _parse_llm_response(
        self,
        llm_output: LLMProviderOutput,
        task: str
    ) -> list:
        """
        LLM 응답을 AgentOutput 리스트로 변환
        """
        outputs = []

        if llm_output.type == "json":
            content = llm_output.value

            if task == "banner_set":
                outputs.append(self._create_output(
                    output_type="json",
                    name="banner_set",
                    value=content,
                    meta={"task": task}
                ))

        elif llm_output.type == "text":
            outputs.append(self._create_output(
                output_type="text",
                name="raw_text",
                value=llm_output.value
            ))

        return outputs


def get_banner_ai_agent(llm_gateway=None) -> BannerAIAgent:
    """
    Banner AI Agent 인스턴스 반환
    """
    return BannerAIAgent(llm_gateway=llm_gateway)
