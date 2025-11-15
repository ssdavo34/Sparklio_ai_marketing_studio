"""
Base Generator 클래스

모든 Generator의 기본 클래스로, Agent 파이프라인 오케스트레이션을 담당합니다.
GENERATORS_SPEC.md 섹션 2, 3 기반 구현
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
import logging
import uuid

logger = logging.getLogger(__name__)


class GenerationRequest(BaseModel):
    """
    Generator 요청 스키마

    GENERATORS_SPEC.md 섹션 2.2 기반
    """
    kind: str = Field(..., description="Generator 타입 (brand_kit, product_detail, sns 등)")
    brandId: Optional[str] = Field(None, description="브랜드 ID")
    locale: str = Field(default="ko-KR", description="언어/로케일")
    channel: Optional[str] = Field(None, description="채널 (shop_detail, instagram, blog 등)")
    input: Dict[str, Any] = Field(..., description="Generator별 입력 데이터")
    context: Dict[str, Any] = Field(default_factory=dict, description="추가 컨텍스트 (brand_kit_id, meeting_summary_id 등)")


class GenerationResult(BaseModel):
    """
    Generator 출력 스키마

    GENERATORS_SPEC.md 섹션 2.2 기반
    """
    taskId: str = Field(..., description="생성 작업 ID")
    kind: str = Field(..., description="Generator 타입")
    textBlocks: Dict[str, Any] = Field(..., description="생성된 텍스트 블록 (headline, description 등)")
    editorDocument: Dict[str, Any] = Field(..., description="One-Page Editor용 JSON 문서")
    meta: Dict[str, Any] = Field(default_factory=dict, description="메타데이터 (templates_used, agents_trace, llm_cost 등)")


class BaseGenerator(ABC):
    """
    Generator 기본 클래스

    GENERATORS_SPEC.md 섹션 3 공통 구성 요소 기반
    """

    def __init__(self):
        """
        Generator 초기화

        각 Generator는 필요한 Agent를 초기화합니다.
        """
        self.strategist = None      # 구조 설계
        self.data_fetcher = None    # RAG/데이터 수집
        self.template_selector = None  # 템플릿 선택
        self.copywriter = None      # 카피 생성
        self.layout_designer = None # 레이아웃 생성
        self.reviewer = None        # 품질 검토
        self.brand_analyzer = None  # 브랜드 분석 (필요 시)

        logger.info(f"[Generator] {self.__class__.__name__} initialized")

    @abstractmethod
    async def generate(self, request: GenerationRequest) -> GenerationResult:
        """
        Generator 실행 메인 메서드

        각 Generator는 이 메서드를 구현하여 고유한 파이프라인을 정의합니다.

        Args:
            request: Generator 요청 데이터

        Returns:
            GenerationResult: 생성 결과 (textBlocks + editorDocument)

        Raises:
            ValueError: 입력 검증 실패
            RuntimeError: Generator 실행 실패
        """
        pass

    async def _execute_pipeline(
        self,
        request: GenerationRequest,
        pipeline_steps: List[str]
    ) -> Dict[str, Any]:
        """
        공통 파이프라인 실행기

        GENERATORS_SPEC.md 섹션 2.1 공통 플로우 기반:
        1. StrategistAgent: 구조 설계
        2. DataFetcher: RAG/브랜드 데이터 수집
        3. TemplateSelector: 템플릿 선택
        4. CopywriterAgent: 텍스트 생성
        5. LayoutDesignerAgent: Editor JSON 생성
        6. ReviewerAgent: 품질 검토

        Args:
            request: Generator 요청
            pipeline_steps: 실행할 단계 목록 ['strategist', 'data_fetcher', ...]

        Returns:
            파이프라인 실행 결과
        """
        context = {
            "request": request.model_dump(),
            "traces": [],  # Agent 실행 추적
            "llm_cost": {
                "prompt_tokens": 0,
                "completion_tokens": 0
            }
        }

        logger.info(f"[Pipeline] Starting pipeline with steps: {pipeline_steps}")

        # 1. Strategist: 구조 설계
        if "strategist" in pipeline_steps and self.strategist:
            logger.info("[Pipeline] Executing StrategistAgent")
            try:
                # TODO: StrategistAgent A2A 프로토콜 호출 구현
                context["structure"] = {
                    "sections": [],  # 섹션 구조
                    "required_data": []  # 필요한 데이터 필드
                }
                context["traces"].append({
                    "agent": "StrategistAgent",
                    "status": "success",
                    "timestamp": datetime.utcnow().isoformat()
                })
            except Exception as e:
                logger.error(f"[Pipeline] StrategistAgent failed: {e}")
                context["traces"].append({
                    "agent": "StrategistAgent",
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                })

        # 2. DataFetcher: RAG/브랜드 데이터
        if "data_fetcher" in pipeline_steps and self.data_fetcher:
            logger.info("[Pipeline] Executing DataFetcher")
            try:
                # TODO: DataFetcher RAG 조회 구현
                context["rag_data"] = {
                    "brand_guidelines": {},
                    "industry_examples": [],
                    "trend_keywords": []
                }
                context["traces"].append({
                    "agent": "DataFetcher",
                    "status": "success",
                    "timestamp": datetime.utcnow().isoformat()
                })
            except Exception as e:
                logger.error(f"[Pipeline] DataFetcher failed: {e}")
                context["traces"].append({
                    "agent": "DataFetcher",
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                })

        # 3. TemplateSelector: 템플릿 선택
        if "template_selector" in pipeline_steps and self.template_selector:
            logger.info("[Pipeline] Executing TemplateSelector")
            try:
                # TODO: Admin approved templates 조회 구현
                context["selected_template"] = {
                    "template_id": "tpl_default",
                    "type": "content_template",
                    "origin": "manual"
                }
                context["traces"].append({
                    "agent": "TemplateSelector",
                    "status": "success",
                    "timestamp": datetime.utcnow().isoformat()
                })
            except Exception as e:
                logger.error(f"[Pipeline] TemplateSelector failed: {e}")
                context["traces"].append({
                    "agent": "TemplateSelector",
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                })

        # 4. Copywriter: 텍스트 생성
        if "copywriter" in pipeline_steps and self.copywriter:
            logger.info("[Pipeline] Executing CopywriterAgent")
            try:
                # TODO: CopywriterAgent A2A 프로토콜 호출 구현
                context["text_blocks"] = {
                    "headline": "샘플 헤드라인",
                    "description": "샘플 설명",
                    "cta": "지금 확인하기"
                }
                context["traces"].append({
                    "agent": "CopywriterAgent",
                    "status": "success",
                    "timestamp": datetime.utcnow().isoformat()
                })
            except Exception as e:
                logger.error(f"[Pipeline] CopywriterAgent failed: {e}")
                context["traces"].append({
                    "agent": "CopywriterAgent",
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                })

        # 5. LayoutDesigner: Editor JSON 생성
        if "layout_designer" in pipeline_steps and self.layout_designer:
            logger.info("[Pipeline] Executing LayoutDesignerAgent")
            try:
                # TODO: LayoutDesignerAgent 구현
                # ONE_PAGE_EDITOR_SPEC.md 섹션 5.2 기반 JSON 생성
                context["editor_document"] = self._generate_default_editor_document(
                    request,
                    context.get("text_blocks", {})
                )
                context["traces"].append({
                    "agent": "LayoutDesignerAgent",
                    "status": "success",
                    "timestamp": datetime.utcnow().isoformat()
                })
            except Exception as e:
                logger.error(f"[Pipeline] LayoutDesignerAgent failed: {e}")
                context["traces"].append({
                    "agent": "LayoutDesignerAgent",
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                })

        # 6. Reviewer: 품질 검토
        if "reviewer" in pipeline_steps and self.reviewer:
            logger.info("[Pipeline] Executing ReviewerAgent")
            try:
                # TODO: ReviewerAgent A2A 프로토콜 호출 구현
                context["review"] = {
                    "overall_score": 0.85,
                    "approved": True,
                    "feedback": "품질 기준 충족"
                }
                context["traces"].append({
                    "agent": "ReviewerAgent",
                    "status": "success",
                    "timestamp": datetime.utcnow().isoformat()
                })
            except Exception as e:
                logger.error(f"[Pipeline] ReviewerAgent failed: {e}")
                context["traces"].append({
                    "agent": "ReviewerAgent",
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                })

        logger.info(f"[Pipeline] Completed with {len(context['traces'])} steps")
        return context

    def _generate_default_editor_document(
        self,
        request: GenerationRequest,
        text_blocks: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        기본 Editor Document 생성

        ONE_PAGE_EDITOR_SPEC.md 섹션 5.2 JSON 구조 기반

        Args:
            request: Generator 요청
            text_blocks: 생성된 텍스트 블록

        Returns:
            Editor Document JSON
        """
        document_id = f"doc_{uuid.uuid4().hex[:12]}"

        return {
            "documentId": document_id,
            "type": request.kind,
            "brandId": request.brandId,
            "pages": [
                {
                    "id": "page_1",
                    "name": "Main",
                    "width": 1080,
                    "height": 1350,
                    "background": "#FFFFFF",
                    "objects": [
                        {
                            "id": "obj_title",
                            "type": "text",
                            "role": "TITLE",
                            "bounds": {"x": 80, "y": 120, "width": 920, "height": 120},
                            "props": {
                                "text": text_blocks.get("headline", "제목"),
                                "fontFamily": "Pretendard",
                                "fontSize": 48,
                                "fontWeight": 700,
                                "fill": "#111111",
                                "textAlign": "center"
                            },
                            "bindings": {
                                "field": "headline"
                            }
                        },
                        {
                            "id": "obj_description",
                            "type": "text",
                            "role": "DESCRIPTION",
                            "bounds": {"x": 80, "y": 280, "width": 920, "height": 200},
                            "props": {
                                "text": text_blocks.get("description", "설명"),
                                "fontFamily": "Pretendard",
                                "fontSize": 16,
                                "fontWeight": 400,
                                "fill": "#333333",
                                "textAlign": "left"
                            },
                            "bindings": {
                                "field": "description"
                            }
                        }
                    ]
                }
            ]
        }

    def _generate_task_id(self) -> str:
        """
        Generation Task ID 생성

        Returns:
            task_id (gen_xxxxx 형식)
        """
        return f"gen_{uuid.uuid4().hex[:12]}"
