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
from app.schemas.brand_analyzer import BrandAnalysisInputV1, BrandDNAOutputV1, BrandDNAOutputV2

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

        지원 Task:
        - brand_dna_generation: V1 (Legacy, 호환성 유지)
        - brand_dna_generation_v2: V2 (Repomix 기준 풍부한 구조)
        """
        return {
            # ================================================================
            # V1: Legacy (호환성 유지)
            # ================================================================
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
                ),
                "structure": {
                    "tone": "브랜드 톤앤매너 (50-200자)",
                    "key_messages": "핵심 메시지 리스트 (3-5개)",
                    "target_audience": "타겟 오디언스 (50-300자)",
                    "dos": "Dos 리스트 (3-5개)",
                    "donts": "Don'ts 리스트 (3-5개)",
                    "sample_copies": "샘플 카피 (3-5개)",
                    "suggested_brand_kit": {
                        "primary_colors": "HEX 코드 리스트",
                        "secondary_colors": "HEX 코드 리스트",
                        "fonts": {"primary": "폰트명", "secondary": "폰트명"},
                        "tone_keywords": "키워드 리스트",
                        "forbidden_expressions": "금지 표현 리스트"
                    },
                    "confidence_score": "0-10",
                    "analysis_notes": "선택사항"
                },
                "guidelines": [
                    "모든 필드는 한국어로 작성 (fonts, HEX 제외)",
                    "V2 사용을 권장합니다"
                ]
            },

            # ================================================================
            # V2: Repomix 기준 풍부한 구조 (권장)
            # ================================================================
            "brand_dna_generation_v2": {
                "instruction": (
                    "당신은 세계적인 브랜드 전략가입니다. "
                    "브랜드 문서를 종합 분석하여 풍부하고 실용적인 Brand DNA Card를 생성하세요.\n\n"

                    "## 분석 철학\n"
                    "- 표면적인 정보가 아닌, 브랜드의 본질과 영혼을 파악하세요\n"
                    "- '무엇을'보다 '왜'에 집중하세요\n"
                    "- 타겟 고객의 감정과 니즈를 깊이 이해하세요\n"
                    "- 모든 분석은 실제 마케팅에 바로 활용 가능해야 합니다\n\n"

                    "## 출력 구조 (10개 섹션)\n\n"

                    "### 1. Brand Core (브랜드 핵심 정체성)\n"
                    "- one_liner: 브랜드를 한 문장으로 정의 (10-100자)\n"
                    "- purpose: 브랜드가 존재하는 이유 (Why we exist)\n"
                    "- promise: 고객에게 하는 약속 (What we promise)\n"
                    "- personality: 브랜드 성격 키워드 3-6개\n\n"

                    "### 2. Message Structure (핵심 메시지 구조)\n"
                    "- main_message: 가장 중요한 단일 메시지 (슬로건급)\n"
                    "- sub_pillars: 메인 메시지를 뒷받침하는 2-5개의 서브 메시지\n"
                    "  - 각 pillar는 title + description 구조\n\n"

                    "### 3. Tone & Manner (톤앤매너)\n"
                    "- summary: 전체적인 톤 요약 (30-200자)\n"
                    "- keywords: 톤을 나타내는 키워드 4-8개\n"
                    "- voice_style: 어떻게 말하는지 구체적 설명\n\n"

                    "### 4. Target Audience (타겟 오디언스)\n"
                    "- primary: 주요 타겟 세그먼트\n"
                    "  - segment_name: 세그먼트 이름\n"
                    "  - description: 상세 페르소나 (30-300자)\n"
                    "  - needs: 이 세그먼트의 니즈/페인포인트 2-5개\n"
                    "- secondary: (선택) 보조 타겟 세그먼트\n\n"

                    "### 5. Benefit Ladder (베네핏 래더)\n"
                    "- functional: 기능적 혜택 2-5개 (무엇을 해주는가)\n"
                    "- emotional: 감성적 혜택 2-5개 (어떤 기분을 주는가)\n\n"

                    "### 6. Do's (브랜드가 해야 할 것)\n"
                    "- 3-7개의 구체적이고 실행 가능한 가이드라인\n"
                    "- 각 항목 10-100자\n\n"

                    "### 7. Don'ts (브랜드가 하지 말아야 할 것)\n"
                    "- 3-7개의 금지 사항\n"
                    "- 각 항목 10-100자\n\n"

                    "### 8. Sample Copies (샘플 카피)\n"
                    "- 브랜드 DNA에 부합하는 광고 카피 3-5개\n"
                    "- 다양한 시나리오 반영 (SNS, 광고, 슬로건 등)\n\n"

                    "### 9. Visual Direction (비주얼 방향성)\n"
                    "- style_keywords: 비주얼 스타일 키워드 3-6개\n"
                    "- mood: 전체적인 무드/분위기 설명\n"
                    "- avoid: 피해야 할 비주얼 요소 2-5개\n\n"

                    "### 10. Suggested Brand Kit\n"
                    "- primary_colors: 주요 컬러 HEX 코드 1-3개\n"
                    "- secondary_colors: 보조 컬러 HEX 코드 1-3개\n"
                    "- fonts: primary/secondary 폰트명\n"
                    "- tone_keywords: 톤 키워드 3-5개\n"
                    "- forbidden_expressions: 금지 표현 3-10개\n"
                ),
                "structure": {
                    "brand_core": {
                        "one_liner": "브랜드 한줄정의 (10-100자)",
                        "purpose": "존재 목적 (20-200자)",
                        "promise": "고객 약속 (20-200자)",
                        "personality": ["성격 키워드 3-6개"]
                    },
                    "message_structure": {
                        "main_message": "메인 메시지 (10-100자)",
                        "sub_pillars": [
                            {"title": "제목", "description": "설명 (20-200자)"}
                        ]
                    },
                    "tone_and_manner": {
                        "summary": "톤 요약 (30-200자)",
                        "keywords": ["톤 키워드 4-8개"],
                        "voice_style": "보이스 스타일 (20-150자)"
                    },
                    "target_audience": {
                        "primary": {
                            "segment_name": "세그먼트명",
                            "description": "상세 설명 (30-300자)",
                            "needs": ["니즈 2-5개"]
                        },
                        "secondary": "선택 (같은 구조)"
                    },
                    "benefit_ladder": {
                        "functional": ["기능적 혜택 2-5개"],
                        "emotional": ["감성적 혜택 2-5개"]
                    },
                    "dos": ["Do's 3-7개, 각 10-100자"],
                    "donts": ["Don'ts 3-7개, 각 10-100자"],
                    "sample_copies": ["샘플 카피 3-5개, 각 20-100자"],
                    "visual_direction": {
                        "style_keywords": ["스타일 키워드 3-6개"],
                        "mood": "무드 설명 (20-150자)",
                        "avoid": ["피해야 할 요소 2-5개"]
                    },
                    "suggested_brand_kit": {
                        "primary_colors": ["HEX 코드"],
                        "secondary_colors": ["HEX 코드"],
                        "fonts": {"primary": "폰트명", "secondary": "폰트명"},
                        "tone_keywords": ["키워드"],
                        "forbidden_expressions": ["금지 표현"]
                    },
                    "confidence_score": "0-10",
                    "analysis_notes": "분석 노트 (최대 1000자)"
                },
                "example_scenario": {
                    "brand_name": "Repomix",
                    "documents": [
                        {
                            "type": "url",
                            "title": "GitHub README",
                            "extracted_text": (
                                "Repomix is a powerful tool that packs your entire repository into a single, "
                                "AI-friendly file. Perfect for when you need to feed your codebase to Large Language Models. "
                                "Features: AI-Optimized output, Token counting, Simple CLI, Multiple output formats. "
                                "Quick Start: npx repomix. Open source under MIT license."
                            )
                        }
                    ],
                    "industry": "개발자 도구 / 오픈소스",
                    "output": {
                        "brand_core": {
                            "one_liner": "개발자 코드베이스를 AI가 이해할 수 있는 형태로 압축하는 도구",
                            "purpose": "AI와 개발자 간의 소통 장벽을 허물어 더 나은 코드 작성을 돕는다",
                            "promise": "복잡한 코드베이스도 하나의 파일로, 누구나 쉽게 AI와 협업할 수 있도록",
                            "personality": ["실용적", "기술친화적", "간결함을 추구", "개발자 중심", "오픈소스 지향"]
                        },
                        "message_structure": {
                            "main_message": "코드를 AI가 이해하도록, Repomix가 해결합니다",
                            "sub_pillars": [
                                {
                                    "title": "간편한 통합",
                                    "description": "복잡한 레포지토리 구조를 단일 파일로 변환하여 AI 프롬프트에 즉시 활용 가능"
                                },
                                {
                                    "title": "개발자 친화적",
                                    "description": "CLI 기반의 직관적인 사용법으로 기존 워크플로우에 자연스럽게 통합"
                                },
                                {
                                    "title": "오픈소스 투명성",
                                    "description": "누구나 기여할 수 있는 오픈소스 프로젝트로 지속적인 개선과 신뢰 확보"
                                }
                            ]
                        },
                        "tone_and_manner": {
                            "summary": "기술적이지만 친근하게, 전문성과 접근성의 균형을 유지하는 실용적 커뮤니케이션",
                            "keywords": ["실용적", "직관적", "깔끔한", "개발자 친화적", "무겁지 않은", "신뢰감 있는"],
                            "voice_style": "기술 문서처럼 정확하되, 대화하듯 자연스럽게"
                        },
                        "target_audience": {
                            "primary": {
                                "segment_name": "AI 협업 개발자",
                                "description": "Claude, GPT 등 AI를 코딩 파트너로 활용하는 개발자. 대규모 코드베이스를 AI에게 설명하는 데 어려움을 겪음",
                                "needs": [
                                    "코드베이스 전체 맥락을 AI에게 효율적으로 전달",
                                    "반복적인 복사-붙여넣기 작업 최소화",
                                    "토큰 제한 내에서 최대한 많은 정보 전달"
                                ]
                            },
                            "secondary": {
                                "segment_name": "오픈소스 컨트리뷰터",
                                "description": "오픈소스 프로젝트에 기여하고자 하는 개발자. 새로운 코드베이스 이해에 시간이 많이 소요됨",
                                "needs": [
                                    "새로운 프로젝트 구조 빠르게 파악",
                                    "코드 리뷰 시 전체 맥락 이해",
                                    "문서화되지 않은 코드 분석"
                                ]
                            }
                        },
                        "benefit_ladder": {
                            "functional": [
                                "복잡한 레포를 단일 파일로 변환",
                                "AI 프롬프트 토큰 효율 최적화",
                                "CLI 한 줄로 즉시 사용 가능",
                                "다양한 출력 포맷 지원 (XML, Markdown 등)"
                            ],
                            "emotional": [
                                "AI와 진짜 협업하는 느낌",
                                "복잡한 코드도 두렵지 않은 자신감",
                                "개발 생산성 향상의 뿌듯함",
                                "오픈소스 커뮤니티의 일원이라는 소속감"
                            ]
                        },
                        "dos": [
                            "기술적 정확성을 유지하되 쉽게 설명하기",
                            "개발자의 실제 워크플로우를 중심으로 소통하기",
                            "오픈소스 정신과 커뮤니티 기여 강조하기",
                            "실용적인 예시와 코드 스니펫 제공하기",
                            "CLI 도구의 간편함과 효율성 부각하기"
                        ],
                        "donts": [
                            "과도한 마케팅 용어나 과장된 표현 사용",
                            "비개발자를 위한 불필요한 설명 추가",
                            "경쟁 도구를 직접적으로 비난하기",
                            "복잡한 설정이나 의존성 요구하기",
                            "개발자 커뮤니티 문화에 어긋나는 표현 사용"
                        ],
                        "sample_copies": [
                            "코드베이스 전체를 AI에게 한 번에 전달하세요",
                            "npx repomix 한 줄이면 충분합니다",
                            "복잡한 레포도, 하나의 파일로, AI가 이해할 수 있게",
                            "오픈소스의 힘으로 만들어가는 개발자 도구"
                        ],
                        "visual_direction": {
                            "style_keywords": ["미니멀", "모노톤", "개발자 친화적", "다크모드 기반", "코드 에디터 느낌"],
                            "mood": "개발자 IDE처럼 깔끔하고 집중력 있는 분위기, 불필요한 장식 없이 기능에 집중",
                            "avoid": ["과도한 그라데이션", "화려한 일러스트", "비즈니스맨 스톡 이미지", "과장된 3D 그래픽"]
                        },
                        "suggested_brand_kit": {
                            "primary_colors": ["#1A1A2E", "#16213E"],
                            "secondary_colors": ["#0F3460", "#E94560"],
                            "fonts": {
                                "primary": "JetBrains Mono",
                                "secondary": "Inter"
                            },
                            "tone_keywords": ["실용적", "기술적", "간결한", "신뢰감", "개발자 친화적"],
                            "forbidden_expressions": ["혁신적인", "게임체인저", "완벽한", "최고의", "유일한"]
                        },
                        "confidence_score": 9.2,
                        "analysis_notes": "Repomix GitHub 레포지토리, README, 공식 문서 분석 완료. 오픈소스 개발자 도구로서의 정체성이 명확하며, 타겟 오디언스(AI 협업 개발자)의 페인포인트를 정확히 해결하는 포지셔닝"
                    }
                },
                "guidelines": [
                    "모든 필드는 한국어로 작성하세요 (fonts, HEX 코드 제외)",
                    "brand_core.one_liner는 브랜드의 본질을 압축한 한 문장이어야 합니다",
                    "message_structure.main_message는 슬로건처럼 임팩트 있게 작성하세요",
                    "target_audience는 단순 인구통계가 아닌, 그들의 니즈와 페인포인트를 파악하세요",
                    "benefit_ladder는 기능적(What) → 감성적(How it feels) 순서로 사고하세요",
                    "dos/donts는 실제 마케팅 실무에 바로 적용 가능해야 합니다",
                    "visual_direction은 디자이너가 바로 작업 착수할 수 있을 정도로 구체적으로",
                    "suggested_brand_kit의 컬러는 반드시 HEX 코드 형식 (#RRGGBB)으로 제공하세요",
                    "confidence_score는 분석에 사용된 문서의 품질과 양을 고려하세요",
                    "analysis_notes에 추가 분석이 필요한 부분이나 제약 사항을 명시하세요"
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

        Supported Tasks:
        - brand_dna_generation: V1 (Legacy)
        - brand_dna_generation_v2: V2 (Repomix 기준 풍부한 구조)
        """
        logger.info(f"BrandAnalyzerAgent executing task: {request.task}")

        # Determine output schema version
        use_v2 = request.task == "brand_dna_generation_v2"

        # Input validation (same for both V1 and V2)
        if request.task in ["brand_dna_generation", "brand_dna_generation_v2"]:
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

                # Pydantic validation (V1 or V2)
                if request.task == "brand_dna_generation":
                    validated_output = BrandDNAOutputV1(**output_data)
                    output_dict = validated_output.model_dump()
                    output_format = "brand_dna_card_v1"
                elif request.task == "brand_dna_generation_v2":
                    validated_output = BrandDNAOutputV2(**output_data)
                    output_dict = validated_output.model_dump()
                    output_format = "brand_dna_card_v2"
                else:
                    raise AgentError(f"Unknown task for validation: {request.task}", agent=self.name)

                # AgentOutput 생성
                outputs = [
                    AgentOutput(
                        type="json",
                        name=request.task,
                        value=output_dict,
                        meta={
                            "format": output_format,
                            "task": request.task,
                            "schema_version": "v2" if use_v2 else "v1"
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
