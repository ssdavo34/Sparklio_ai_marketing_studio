"""
BrandAnalyzerAgent Implementation

브랜드 문서 분석 및 Brand DNA Card 생성 Agent

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: SPARKLIO_MVP_MASTER_TRACKER.md - P0-1 Brand OS Module
"""

import logging
from typing import Any, Dict, Optional, List

from app.services.agents.base import AgentBase, AgentError, AgentRequest, AgentResponse, AgentOutput
from app.services.llm.gateway import LLMGateway
from app.services.validation.output_validator import OutputValidator
from app.schemas.brand_analyzer import BrandAnalysisInputV1, BrandDNAOutputV1

logger = logging.getLogger(__name__)


class BrandAnalyzerAgent(AgentBase):
    """
    BrandAnalyzerAgent: 브랜드 문서 분석 및 Brand DNA 생성 Agent

    Role:
    - 브랜드 문서 (PDF, 이미지, 텍스트, URL 크롤링 결과) 분석
    - Brand DNA Card 생성 (tone, key_messages, target_audience, dos/donts, sample_copies)
    - Brand Kit 자동 생성 제안 (colors, fonts, tone_keywords, forbidden_expressions)

    Input:
    - brand_name: 브랜드 이름
    - documents: 브랜드 문서 목록 (extracted_text)
    - website_url: 브랜드 웹사이트 URL (optional)
    - industry: 산업/업종 (optional)
    - existing_brand_kit: 기존 Brand Kit (optional, 수정 시 사용)

    Output (Brand DNA Card):
    - tone: 브랜드 톤앤매너 (예: "professional yet approachable")
    - key_messages: 핵심 메시지 3-5개
    - target_audience: 타겟 오디언스 상세 페르소나
    - dos: 브랜드 커뮤니케이션에서 해야 할 것 (3-5개)
    - donts: 브랜드 커뮤니케이션에서 하지 말아야 할 것 (3-5개)
    - sample_copies: 샘플 카피 예시 (3-5개)
    - suggested_brand_kit: 제안된 Brand Kit (colors, fonts, tone_keywords 등)

    Features:
    - Retry Logic (최대 3회, temperature 0.3 → 0.4 → 0.5)
    - 4-Stage Validation Pipeline 통합
    - Structured Quality Logging
    - Multi-document analysis (여러 문서 종합 분석)
    """

    def __init__(self, llm_gateway=None):
        super().__init__(llm_gateway=llm_gateway)
        self.task_instructions = self._build_task_instructions()

    @property
    def name(self) -> str:
        return "brand_analyzer"

    def _build_task_instructions(self) -> Dict[str, Any]:
        """
        Task별 Instruction 정의

        현재 지원: brand_dna_generation
        """
        return {
            "brand_dna_generation": {
                "instruction": (
                    "브랜드 문서를 전문 마케터 관점에서 체계적으로 분석하고, "
                    "브랜드의 핵심 정체성을 담은 Brand DNA Card를 생성하세요. "
                    "\n\n"
                    "**분석 방법:**\n"
                    "1. 제공된 모든 문서(PDF, 이미지, 웹사이트 크롤링 결과 등)를 종합 분석\n"
                    "2. 브랜드의 톤앤매너, 핵심 가치, 타겟 오디언스를 추출\n"
                    "3. 브랜드 커뮤니케이션 가이드라인 (Dos/Don'ts) 도출\n"
                    "4. 실제 사용 가능한 샘플 카피 3-5개 생성\n"
                    "5. 브랜드 컬러, 폰트, 톤 키워드, 금지 표현 제안\n"
                    "\n"
                    "**톤앤매너 분석 가이드:**\n"
                    "- 브랜드 문서에서 사용된 언어 스타일, 어조, 격식 수준 파악\n"
                    "- 감성적/이성적, 친근한/전문적, 혁신적/전통적 등 축으로 분류\n"
                    "- 단순히 'professional' 같은 단어만 사용하지 말고, 구체적인 묘사 필요\n"
                    "  예: 'professional yet approachable, with a touch of innovation'\n"
                    "\n"
                    "**타겟 오디언스 분석:**\n"
                    "- 연령대, 직업, 라이프스타일, 가치관 등을 포함한 상세 페르소나\n"
                    "- 단순히 '2030 직장인'이 아니라 구체적 묘사 필요\n"
                    "  예: '일과 삶의 균형을 중시하는 2030 직장인, 혁신적인 제품을 선호하며 품질에 투자'\n"
                    "\n"
                    "**핵심 메시지 도출:**\n"
                    "- 브랜드가 일관되게 전달하는 3-5개의 핵심 메시지\n"
                    "- 각 메시지는 10-50자, 명확하고 임팩트 있게\n"
                    "- 브랜드 가치, 차별점, 고객 약속 등을 담아야 함\n"
                    "\n"
                    "**Dos/Don'ts 작성:**\n"
                    "- Dos: 브랜드 커뮤니케이션에서 반드시 지켜야 할 원칙 3-5개\n"
                    "- Don'ts: 브랜드 이미지를 해칠 수 있는 금지 사항 3-5개\n"
                    "- 구체적이고 실행 가능한 가이드라인으로 작성\n"
                    "\n"
                    "**샘플 카피 생성:**\n"
                    "- 브랜드 DNA에 완벽히 부합하는 광고 카피 3-5개\n"
                    "- 다양한 시나리오 (제품 출시, SNS, 캠페인 등) 반영\n"
                    "- 각 카피는 20-100자\n"
                    "\n"
                    "**Brand Kit 제안:**\n"
                    "- primary_colors: 브랜드 주요 컬러 1-3개 (HEX 코드)\n"
                    "- secondary_colors: 보조 컬러 1-3개 (HEX 코드)\n"
                    "- fonts: 브랜드에 어울리는 폰트 제안 (primary, secondary)\n"
                    "- tone_keywords: 톤앤매너를 나타내는 키워드 3-5개\n"
                    "- forbidden_expressions: 사용 금지 표현 3-10개\n"
                ),
                "structure": {
                    "tone": "브랜드 톤앤매너 (50-200자, 구체적으로)",
                    "key_messages": "핵심 메시지 리스트 (3-5개, 각 10-50자)",
                    "target_audience": "타겟 오디언스 페르소나 (50-300자, 상세하게)",
                    "dos": "Dos 리스트 (3-5개, 각 10-100자, 실행 가능하게)",
                    "donts": "Don'ts 리스트 (3-5개, 각 10-100자, 구체적으로)",
                    "sample_copies": "샘플 카피 리스트 (3-5개, 각 20-100자)",
                    "suggested_brand_kit": {
                        "primary_colors": "주요 컬러 (1-3개 HEX 코드)",
                        "secondary_colors": "보조 컬러 (1-3개 HEX 코드)",
                        "fonts": {
                            "primary": "주요 폰트명",
                            "secondary": "보조 폰트명"
                        },
                        "tone_keywords": "톤 키워드 (3-5개)",
                        "forbidden_expressions": "금지 표현 (3-10개)"
                    },
                    "confidence_score": "분석 신뢰도 (0-10, 소수점 1자리)",
                    "analysis_notes": "분석 노트 (optional, 추가 인사이트)"
                },
                "example_scenario": {
                    "brand_name": "EcoLife",
                    "documents": [
                        {
                            "type": "pdf",
                            "extracted_text": "EcoLife는 지속 가능한 라이프스타일을 제안합니다. "
                                              "친환경 소재로 만든 일상용품으로 지구와 함께하는 삶..."
                        },
                        {
                            "type": "url",
                            "extracted_text": "Our Mission: Creating a sustainable future for the next generation. "
                                              "We believe in quality products that don't compromise the environment..."
                        }
                    ],
                    "industry": "친환경 생활용품",
                    "output": {
                        "tone": "진정성 있고 따뜻한 톤, 환경 문제에 대한 진지함과 일상 속 실천 가능성을 동시에 전달",
                        "key_messages": [
                            "지속 가능한 내일을 위한 오늘의 선택",
                            "품질과 환경, 두 마리 토끼를 모두 잡다",
                            "작은 실천이 만드는 큰 변화"
                        ],
                        "target_audience": "환경 문제에 관심이 많은 2030 밀레니얼/Z세대, "
                                          "윤리적 소비를 실천하며 일상 속 작은 변화를 중시하는 라이프스타일",
                        "dos": [
                            "환경 문제에 대한 진정성 있는 메시지 전달",
                            "실제 사용 가능한 구체적인 실천 방법 제시",
                            "제품의 친환경 인증, 소재 정보를 투명하게 공개",
                            "고객의 작은 실천을 격려하고 응원하는 톤 유지"
                        ],
                        "donts": [
                            "과도한 환경 보호 주장으로 부담감 주기",
                            "비현실적이거나 극단적인 제안",
                            "그린워싱으로 의심받을 수 있는 과장 광고",
                            "타 브랜드를 직접적으로 비난하는 표현"
                        ],
                        "sample_copies": [
                            "오늘 하나, 내일의 지구를 위한 작은 실천",
                            "품질은 타협하지 않습니다. 환경도 마찬가지로.",
                            "일상이 바뀌면 지구가 바뀝니다",
                            "지속 가능한 라이프스타일, EcoLife와 함께"
                        ],
                        "suggested_brand_kit": {
                            "primary_colors": ["#2E7D32", "#66BB6A"],
                            "secondary_colors": ["#F5F5F5", "#8D6E63"],
                            "fonts": {
                                "primary": "Montserrat",
                                "secondary": "Noto Sans KR"
                            },
                            "tone_keywords": ["진정성", "따뜻함", "실천", "지속가능", "품질"],
                            "forbidden_expressions": ["완벽한", "100%", "절대", "유일한", "최고급"]
                        },
                        "confidence_score": 8.5,
                        "analysis_notes": "브랜드 문서 2개 분석 완료. 추가 문서(제품 카탈로그, SNS 게시물 등)가 있으면 더 정확한 분석 가능"
                    }
                },
                "guidelines": [
                    "모든 필드는 한국어로 작성하세요 (fonts, HEX 코드 제외)",
                    "tone은 구체적이고 실감나게 묘사하세요",
                    "key_messages는 브랜드의 핵심 가치를 담아야 합니다",
                    "target_audience는 단순 인구통계학적 정보를 넘어 라이프스타일, 가치관까지 포함하세요",
                    "dos/donts는 실제 마케팅 실무에 바로 적용 가능해야 합니다",
                    "sample_copies는 브랜드 DNA에 완벽히 부합해야 합니다",
                    "suggested_brand_kit의 컬러는 반드시 HEX 코드 형식 (#RRGGBB)으로 제공하세요",
                    "confidence_score는 분석에 사용된 문서의 품질과 양을 고려하세요",
                    "문서가 부족하거나 모호한 경우 confidence_score를 낮게 책정하고 analysis_notes에 이유를 명시하세요"
                ]
            }
        }

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        BrandAnalyzerAgent 실행 로직 (Retry + Validation 통합)

        Flow:
        1. Input validation (Pydantic)
        2. LLM 호출 (JSON Mode, 최대 3회 재시도)
        3. Output validation (4-stage pipeline)
        4. Quality logging
        5. AgentResponse 반환
        """
        logger.info(f"BrandAnalyzerAgent executing task: {request.task}")

        # Input validation
        if request.task == "brand_dna_generation":
            try:
                validated_input = BrandAnalysisInputV1(**request.payload)
            except Exception as e:
                raise AgentError(f"Input validation failed: {str(e)}", agent=self.name)
        else:
            raise AgentError(f"Unknown task: {request.task}", agent=self.name)

        # Task instruction 가져오기
        task_config = self.task_instructions.get(request.task)
        if not task_config:
            raise AgentError(f"No instruction found for task: {request.task}", agent=self.name)

        # Payload 강화 (instruction + structure)
        enhanced_payload = {
            **request.payload,
            "_instruction": task_config["instruction"],
            "_structure": task_config["structure"],
            "_example": task_config.get("example_scenario"),
            "_guidelines": task_config.get("guidelines")
        }

        # Retry Logic with progressive temperature
        max_retries = 3
        base_temperature = 0.3  # Brand analysis는 창의성과 일관성 균형 (0.3 → 0.4 → 0.5)
        validator = OutputValidator()
        last_validation_error = None  # 마지막 검증 에러 저장

        for attempt in range(max_retries):
            try:
                current_temp = base_temperature + (attempt * 0.1)

                logger.info(
                    f"BrandAnalyzerAgent attempt {attempt + 1}/{max_retries} "
                    f"(temperature={current_temp})"
                )

                # LLM 호출 (Brand DNA 응답은 길 수 있으므로 max_tokens 증가)
                llm_options = {
                    **(request.options or {}),
                    "temperature": current_temp,
                    "max_tokens": 4000  # 기본 2000에서 증가
                }

                # 이전 시도에서 검증 에러가 있으면 payload에 힌트 추가
                retry_payload = enhanced_payload.copy()
                if last_validation_error and attempt > 0:
                    retry_payload["_retry_hint"] = (
                        f"이전 시도에서 다음 오류가 발생했습니다: {last_validation_error}. "
                        "반드시 모든 필드를 포함한 완전한 JSON을 반환하세요."
                    )

                llm_response = await self.llm_gateway.generate(
                    role=self.name,
                    task=request.task,
                    payload=retry_payload,
                    mode="json",
                    options=llm_options
                )

                # Parse output
                output_data = llm_response.output.value
                if isinstance(output_data, str):
                    import json
                    output_data = json.loads(output_data)

                # Pydantic validation
                if request.task == "brand_dna_generation":
                    validated_output = BrandDNAOutputV1(**output_data)
                    output_dict = validated_output.model_dump()
                else:
                    raise AgentError(f"Unknown task for validation: {request.task}", agent=self.name)

                # AgentOutput 생성
                outputs = [
                    AgentOutput(
                        type="json",
                        name=request.task,
                        value=output_dict,
                        meta={
                            "format": "brand_dna_card",
                            "task": request.task
                        }
                    )
                ]

                # 4-Stage Validation Pipeline
                validation_result = validator.validate(
                    output=outputs[0].value,
                    task=request.task,
                    input_data=request.payload
                )

                # Validation 실패 시 재시도
                if not validation_result.passed:
                    last_validation_error = ', '.join(validation_result.errors)
                    if attempt < max_retries - 1:
                        logger.warning(
                            f"Validation failed (attempt {attempt + 1}), retrying... "
                            f"Errors: {validation_result.errors}"
                        )
                        continue
                    else:
                        # 최종 실패
                        raise AgentError(
                            f"Validation failed after {max_retries} attempts: "
                            f"{last_validation_error}",
                            agent=self.name
                        )

                # Structured quality logging
                logger.info(
                    "quality_metrics",
                    extra={
                        "agent": self.name,
                        "task": request.task,
                        "overall_score": round(validation_result.overall_score, 2),
                        "field_scores": {
                            stage.stage: round(stage.score, 2)
                            for stage in validation_result.stage_results
                        },
                        "validation_passed": validation_result.passed,
                        "validation_errors": validation_result.errors,
                        "validation_warnings": validation_result.warnings,
                        "attempt": attempt + 1,
                        "max_retries": max_retries,
                        "temperature": current_temp,
                        "confidence_score": output_dict.get("confidence_score", 0.0),
                        "document_count": len(validated_input.documents) if hasattr(validated_input, 'documents') else 0
                    }
                )

                # 성공 응답 생성
                return AgentResponse(
                    agent=self.name,
                    task=request.task,
                    outputs=outputs,
                    usage={
                        "llm_tokens": llm_response.usage.get("total_tokens", 0) if llm_response.usage else 0,
                        "total_tokens": llm_response.usage.get("total_tokens", 0) if llm_response.usage else 0,
                        "elapsed_seconds": llm_response.meta.get("elapsed_seconds", 0.0) if llm_response.meta else 0.0
                    },
                    meta={
                        "llm_provider": llm_response.provider,
                        "llm_model": llm_response.model,
                        "task": request.task,
                        "validation_score": round(validation_result.overall_score, 2),
                        "attempt": attempt + 1
                    }
                )

            except AgentError:
                raise
            except Exception as e:
                last_validation_error = str(e)
                if attempt < max_retries - 1:
                    logger.warning(
                        f"BrandAnalyzerAgent execution failed (attempt {attempt + 1}), "
                        f"retrying... Error: {str(e)}"
                    )
                    continue
                else:
                    raise AgentError(f"BrandAnalyzerAgent failed after {max_retries} attempts: {str(e)}", agent=self.name)

        # 여기까지 도달하면 안 됨 (모든 retry 실패)
        raise AgentError(f"BrandAnalyzerAgent failed after {max_retries} attempts", agent=self.name)


# Factory function
def get_brand_analyzer_agent(llm_gateway=None) -> BrandAnalyzerAgent:
    """
    BrandAnalyzerAgent 인스턴스 생성

    Args:
        llm_gateway: LLM Gateway (None이면 전역 인스턴스 사용)

    Returns:
        BrandAnalyzerAgent: LLMGateway와 함께 초기화된 BrandAnalyzerAgent
    """
    return BrandAnalyzerAgent(llm_gateway=llm_gateway)
