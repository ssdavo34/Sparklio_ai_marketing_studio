"""
Copywriter Agent

텍스트 콘텐츠 생성 전문 Agent

작성일: 2025-11-16
작성자: B팀 (Backend)
문서: ARCH-003, SPEC-002
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

from .base import AgentBase, AgentRequest, AgentResponse, AgentError
from app.services.llm import LLMProviderOutput
from app.services.validation import OutputValidator

logger = logging.getLogger(__name__)


class CopywriterAgent(AgentBase):
    """
    Copywriter Agent

    제품 설명, SNS 콘텐츠, 브랜드 메시지 등 텍스트 콘텐츠 생성

    주요 작업:
    1. product_detail: 제품 상세 설명 작성
    2. sns: SNS 콘텐츠 작성
    3. brand_message: 브랜드 메시지 작성
    4. headline: 헤드라인/제목 생성
    5. ad_copy: 광고 카피 작성

    사용 예시:
        agent = CopywriterAgent()
        response = await agent.execute(AgentRequest(
            task="product_detail",
            payload={
                "product_name": "무선 이어폰",
                "features": ["노이즈캔슬링", "24시간 배터리"],
                "target_audience": "2030 직장인"
            },
            options={"tone": "professional", "length": "medium"}
        ))
    """

    @property
    def name(self) -> str:
        return "copywriter"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        Copywriter Agent 실행

        Args:
            request: Agent 요청

        Returns:
            AgentResponse: 생성된 카피 (JSON 형식)

        Raises:
            AgentError: 실행 실패 시
        """
        start_time = datetime.utcnow()

        try:
            # 1. 요청 검증
            self._validate_request(request)

            logger.info(f"Copywriter Agent executing: task={request.task}")

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
            # 🐛 디버그: LLM Raw 출력 확인 (A팀 임시 로깅)
            logger.info(f"🐛 LLM Raw Output: {llm_response.output.value}")
            outputs = self._parse_llm_response(llm_response.output, request.task)
            logger.info(f"🐛 Parsed Output: {outputs[0].value}")

            # ✅ 4.5. Validation Pipeline (B팀 추가 2025-11-23)
            validator = OutputValidator()
            validation_result = validator.validate(
                output=outputs[0].value,
                task=request.task,
                input_data=request.payload
            )

            if not validation_result.passed:
                logger.warning(
                    f"Validation failed: {validation_result.errors} | "
                    f"Score: {validation_result.overall_score:.1f}/10"
                )

                # Validation 실패 시 에러 발생 (재생성 유도)
                raise AgentError(
                    message=f"Output validation failed",
                    agent=self.name,
                    details={
                        "validation_errors": validation_result.errors,
                        "validation_score": validation_result.overall_score,
                        "output": outputs[0].value
                    }
                )

            logger.info(
                f"Validation passed: Score {validation_result.overall_score:.1f}/10"
            )

            # 5. 사용량 계산
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            usage = {
                "llm_tokens": llm_response.usage.get("total_tokens", 0),
                "total_tokens": llm_response.usage.get("total_tokens", 0),  # GeneratorService가 사용
                "elapsed_seconds": round(elapsed, 2)
            }

            # 6. 메타데이터
            meta = {
                "llm_provider": llm_response.provider,
                "llm_model": llm_response.model,
                "task": request.task,
                "tone": request.options.get("tone", "default") if request.options else "default"
            }

            logger.info(
                f"Copywriter Agent success: task={request.task}, "
                f"elapsed={elapsed:.2f}s, tokens={usage['llm_tokens']}"
            )

            return AgentResponse(
                agent=self.name,
                task=request.task,
                outputs=outputs,
                usage=usage,
                meta=meta
            )

        except Exception as e:
            logger.error(f"Copywriter Agent failed: {str(e)}", exc_info=True)
            raise AgentError(
                message=f"Copywriter execution failed: {str(e)}",
                agent=self.name,
                details={"task": request.task, "payload": request.payload}
            )

    def _enhance_payload(self, request: AgentRequest) -> Dict[str, Any]:
        """
        Payload에 작업별 추가 지시사항 추가

        Args:
            request: Agent 요청

        Returns:
            향상된 Payload
        """
        enhanced = request.payload.copy()

        # 언어 설정 추가 (기본값: 한국어)
        if "language" not in enhanced:
            enhanced["language"] = "ko"

        # 작업별 기본 지시사항 추가
        task_instructions = {
            "product_detail": {
                "instruction": "제품의 핵심 가치와 차별점을 강조하여 매력적인 설명을 작성하세요.",
                "structure": {
                    "headline": "임팩트 있는 헤드라인 (10자 이내)",
                    "body": "본문 설명 (100-200자)",
                    "features": "주요 특징 3개 (각 30자 이내)",
                    "cta": "행동 유도 문구 (15자 이내)"
                }
            },
            "sns": {
                "instruction": "SNS에 최적화된 짧고 임팩트 있는 콘텐츠를 작성하세요.",
                "structure": {
                    "post": "메인 포스팅 내용 (80-120자)",
                    "hashtags": "해시태그 5-10개",
                    "cta": "행동 유도 문구"
                }
            },
            "brand_message": {
                "instruction": "브랜드의 가치와 비전을 담은 메시지를 작성하세요.",
                "structure": {
                    "tagline": "브랜드 태그라인 (10자 이내)",
                    "message": "브랜드 메시지 (50-100자)",
                    "values": "핵심 가치 3개"
                }
            },
            "headline": {
                "instruction": "주목도 높은 헤드라인을 3가지 버전으로 작성하세요.",
                "structure": {
                    "version_a": "임팩트형 헤드라인",
                    "version_b": "혜택 강조형 헤드라인",
                    "version_c": "질문형 헤드라인"
                }
            },
            "ad_copy": {
                "instruction": "광고 효과를 극대화할 수 있는 카피를 작성하세요.",
                "structure": {
                    "headline": "광고 헤드라인",
                    "body": "광고 본문 (50-100자)",
                    "cta": "행동 유도 문구"
                }
            }
        }

        # 작업별 지시사항 추가
        if request.task in task_instructions:
            enhanced["_instructions"] = task_instructions[request.task]["instruction"]
            enhanced["_output_structure"] = task_instructions[request.task]["structure"]

        # 옵션 추가 (tone, length 등)
        if request.options:
            if "tone" in request.options:
                tone_guide = {
                    "professional": "전문적이고 신뢰감 있는 톤",
                    "friendly": "친근하고 따뜻한 톤",
                    "luxury": "프리미엄하고 세련된 톤",
                    "casual": "편안하고 자연스러운 톤",
                    "energetic": "활기차고 역동적인 톤"
                }
                enhanced["_tone_guide"] = tone_guide.get(
                    request.options["tone"],
                    "기본 톤"
                )

            if "length" in request.options:
                enhanced["_length"] = request.options["length"]

        return enhanced

    def _normalize_product_detail(self, content: dict) -> dict:
        """
        product_detail 응답의 필드명을 정규화

        LLM이 다른 필드명을 사용할 경우를 대비하여
        표준 필드명으로 변환하고 누락된 필드는 기본값으로 채움

        Args:
            content: LLM 응답 JSON

        Returns:
            정규화된 dict (headline, subheadline, body, bullets, cta)
        """
        normalized = {}

        # headline (title, name 등으로 올 수 있음)
        normalized["headline"] = (
            content.get("headline") or
            content.get("title") or
            content.get("name") or
            "제품명"
        )

        # subheadline (subtitle, tagline 등으로 올 수 있음)
        # ✅ B팀 수정 (2025-11-23): "제품 설명" Fallback 제거
        # ✅ A팀 수정 (2025-11-23): body에서 첫 30자 Fallback
        normalized["subheadline"] = (
            content.get("subheadline") or
            content.get("subtitle") or
            content.get("tagline") or
            (content.get("body") or content.get("description") or "")[:30] or
            ""  # 빈 문자열로 변경 (Validation에서 잡힘)
        )

        # body (description, content 등으로 올 수 있음)
        normalized["body"] = (
            content.get("body") or
            content.get("description") or
            content.get("content") or
            ""
        )

        # bullets (features, highlights, benefits 등으로 올 수 있음)
        bullets = (
            content.get("bullets") or
            content.get("features") or
            content.get("highlights") or
            content.get("benefits") or
            []
        )
        # 리스트가 아니면 빈 리스트로
        normalized["bullets"] = bullets if isinstance(bullets, list) else []

        # cta (call_to_action, action 등으로 올 수 있음)
        normalized["cta"] = (
            content.get("cta") or
            content.get("call_to_action") or
            content.get("action") or
            "자세히 보기"
        )

        return normalized

    def _parse_llm_response(
        self,
        llm_output: LLMProviderOutput,
        task: str
    ) -> list:
        """
        LLM 응답을 AgentOutput 리스트로 변환

        Args:
            llm_output: LLM 출력
            task: 작업 유형

        Returns:
            AgentOutput 리스트
        """
        outputs = []

        # JSON 응답 처리
        if llm_output.type == "json":
            content = llm_output.value

            # 작업별로 적절한 이름으로 출력 생성
            if task == "product_detail":
                # 필드명 정규화 (LLM이 다른 필드명을 사용할 경우 대비)
                normalized_content = self._normalize_product_detail(content)
                outputs.append(self._create_output(
                    output_type="json",
                    name="product_copy",
                    value=normalized_content,
                    meta={"format": "structured_copy"}
                ))
            elif task == "sns":
                outputs.append(self._create_output(
                    output_type="json",
                    name="sns_content",
                    value=content,
                    meta={"format": "social_media"}
                ))
            elif task == "brand_message":
                outputs.append(self._create_output(
                    output_type="json",
                    name="brand_message",
                    value=content,
                    meta={"format": "brand_identity"}
                ))
            elif task == "headline":
                outputs.append(self._create_output(
                    output_type="json",
                    name="headlines",
                    value=content,
                    meta={"format": "variations"}
                ))
            elif task == "ad_copy":
                outputs.append(self._create_output(
                    output_type="json",
                    name="ad_copy",
                    value=content,
                    meta={"format": "advertising"}
                ))
            else:
                # 기본 처리
                outputs.append(self._create_output(
                    output_type="json",
                    name="content",
                    value=content
                ))

        # 텍스트 응답 처리 (폴백)
        elif llm_output.type == "text":
            outputs.append(self._create_output(
                output_type="text",
                name="raw_text",
                value=llm_output.value
            ))

        return outputs


# ============================================================================
# Factory Function
# ============================================================================

def get_copywriter_agent(llm_gateway=None) -> CopywriterAgent:
    """
    Copywriter Agent 인스턴스 반환

    Args:
        llm_gateway: LLM Gateway (None이면 전역 인스턴스 사용)

    Returns:
        CopywriterAgent 인스턴스
    """
    return CopywriterAgent(llm_gateway=llm_gateway)
