"""
Sparklio Editor AI Service

AI 기반 문서/요소 생성 및 수정

작성일: 2025-11-20
작성자: B팀 (Backend)
"""

from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from uuid import UUID
import json
import logging

from app.models.sparklio_document import SparklioDocument
from app.schemas.sparklio_document import (
    SparklioDocumentBase,
    SparklioDocumentResponse,
    SparklioPage,
    SparklioElement,
    ElementProps,
    AICommandResponse
)
from app.services.llm.gateway import LLMGateway
from app.services.brand_kit_service import BrandKitService

logger = logging.getLogger(__name__)


class EditorAIService:
    """Editor AI 서비스 클래스"""

    def __init__(self, db: Session):
        self.db = db
        self.llm_gateway = LLMGateway()
        self.brand_service = BrandKitService(db)

    async def generate_document(
        self,
        prompt: str,
        kind: str,
        brand_id: Optional[UUID] = None,
        user_id: UUID = None
    ) -> SparklioDocumentResponse:
        """AI로 새 문서 생성"""
        try:
            # 브랜드 정보 가져오기
            brand_context = ""
            if brand_id:
                brand_data = await self.brand_service.get_brand_kit(brand_id, user_id)
                if brand_data:
                    brand_context = self._create_brand_context(brand_data)

            # 문서 종류별 템플릿 정의
            template_specs = self._get_template_specs(kind)

            # AI 프롬프트 구성
            system_prompt = f"""
당신은 마케팅 콘텐츠 디자인 전문가입니다.
사용자의 요청에 따라 {kind} 형식의 문서를 생성합니다.

{brand_context}

문서 사양:
{json.dumps(template_specs, ensure_ascii=False, indent=2)}

다음 JSON 형식으로 응답하세요:
{{
  "title": "문서 제목",
  "pages": [
    {{
      "name": "페이지 이름",
      "width": 1920,
      "height": 1080,
      "backgroundColor": "#FFFFFF",
      "elements": [
        {{
          "type": "text|image|shape",
          "x": 100,
          "y": 100,
          "width": 400,
          "height": 200,
          "props": {{
            "text": "텍스트 내용",
            "fontSize": 24,
            "fill": "#000000"
          }}
        }}
      ]
    }}
  ]
}}
"""

            # LLM 호출
            response = await self.llm_gateway.generate_content(
                prompt=prompt,
                system_prompt=system_prompt,
                model="gpt-4o-mini"  # 빠른 응답을 위해 mini 모델 사용
            )

            # JSON 파싱
            document_data = json.loads(response)

            # 문서 생성
            db_document = SparklioDocument(
                title=document_data.get("title", "Untitled Document"),
                kind=kind,
                pages=document_data.get("pages", []),
                metadata={
                    "ai_generated": True,
                    "prompt": prompt,
                    "brand_id": str(brand_id) if brand_id else None
                },
                brand_id=brand_id,
                created_by_id=user_id,
                updated_by_id=user_id
            )

            self.db.add(db_document)
            self.db.commit()
            self.db.refresh(db_document)

            logger.info(f"AI 문서 생성 완료: {db_document.id}")
            return SparklioDocumentResponse.from_orm(db_document)

        except json.JSONDecodeError as e:
            logger.error(f"AI 응답 파싱 실패: {str(e)}")
            raise ValueError("AI 응답을 파싱할 수 없습니다")
        except Exception as e:
            self.db.rollback()
            logger.error(f"AI 문서 생성 실패: {str(e)}")
            raise e

    async def generate_element(
        self,
        prompt: str,
        context: Optional[SparklioDocumentBase] = None,
        brand_id: Optional[UUID] = None,
        user_id: UUID = None
    ) -> AICommandResponse:
        """AI로 새 요소 생성"""
        try:
            # 브랜드 컨텍스트
            brand_context = ""
            if brand_id:
                brand_data = await self.brand_service.get_brand_kit(brand_id, user_id)
                if brand_data:
                    brand_context = self._create_brand_context(brand_data)

            # 현재 문서 컨텍스트
            doc_context = ""
            if context:
                doc_context = f"현재 문서: {context.title}\n종류: {context.kind}"

            # AI 프롬프트
            system_prompt = f"""
마케팅 디자인 요소를 생성합니다.

{brand_context}
{doc_context}

다음 형식으로 요소를 생성하세요:
{{
  "element": {{
    "type": "text|image|shape",
    "x": 100,
    "y": 100,
    "width": 400,
    "height": 200,
    "props": {{}}
  }},
  "description": "생성된 요소 설명"
}}
"""

            response = await self.llm_gateway.generate_content(
                prompt=prompt,
                system_prompt=system_prompt,
                model="gpt-4o-mini"
            )

            element_data = json.loads(response)

            return AICommandResponse(
                success=True,
                document=None,  # 단일 요소이므로 문서는 null
                suggestions=None,
                message=element_data.get("description", "요소가 생성되었습니다"),
                metadata={"element": element_data["element"]}
            )

        except Exception as e:
            logger.error(f"AI 요소 생성 실패: {str(e)}")
            return AICommandResponse(
                success=False,
                message=f"요소 생성 실패: {str(e)}"
            )

    async def modify_element(
        self,
        prompt: str,
        element_id: str,
        context: Optional[SparklioDocumentBase] = None,
        user_id: UUID = None
    ) -> AICommandResponse:
        """AI로 기존 요소 수정"""
        try:
            # 현재 요소 찾기
            element_data = None
            if context and context.pages:
                for page in context.pages:
                    for element in page.elements:
                        if element.id == element_id:
                            element_data = element.dict()
                            break

            if not element_data:
                return AICommandResponse(
                    success=False,
                    message="요소를 찾을 수 없습니다"
                )

            # AI 프롬프트
            system_prompt = f"""
기존 디자인 요소를 수정합니다.

현재 요소:
{json.dumps(element_data, ensure_ascii=False, indent=2)}

사용자 요청에 따라 요소를 수정하고 다음 형식으로 응답하세요:
{{
  "modified_props": {{}},  // 수정할 속성만 포함
  "description": "수정 내용 설명"
}}
"""

            response = await self.llm_gateway.generate_content(
                prompt=prompt,
                system_prompt=system_prompt,
                model="gpt-4o-mini"
            )

            modification = json.loads(response)

            return AICommandResponse(
                success=True,
                message=modification.get("description", "요소가 수정되었습니다"),
                metadata={
                    "element_id": element_id,
                    "modifications": modification["modified_props"]
                }
            )

        except Exception as e:
            logger.error(f"AI 요소 수정 실패: {str(e)}")
            return AICommandResponse(
                success=False,
                message=f"요소 수정 실패: {str(e)}"
            )

    async def generate_suggestions(
        self,
        prompt: str,
        context: Optional[SparklioDocumentBase] = None,
        brand_id: Optional[UUID] = None
    ) -> AICommandResponse:
        """AI 제안 생성"""
        try:
            # 컨텍스트 구성
            brand_context = ""
            if brand_id:
                brand_data = await self.brand_service.get_brand_kit(brand_id, None)
                if brand_data:
                    brand_context = self._create_brand_context(brand_data)

            doc_context = ""
            if context:
                doc_context = f"문서: {context.title}\n종류: {context.kind}"

            # AI 프롬프트
            system_prompt = f"""
마케팅 콘텐츠 개선 제안을 생성합니다.

{brand_context}
{doc_context}

5개의 구체적인 개선 제안을 JSON 배열로 반환하세요:
[
  "제안 1",
  "제안 2",
  "제안 3",
  "제안 4",
  "제안 5"
]
"""

            response = await self.llm_gateway.generate_content(
                prompt=prompt,
                system_prompt=system_prompt,
                model="gpt-4o-mini"
            )

            suggestions = json.loads(response)

            return AICommandResponse(
                success=True,
                suggestions=suggestions,
                message="제안이 생성되었습니다"
            )

        except Exception as e:
            logger.error(f"AI 제안 생성 실패: {str(e)}")
            return AICommandResponse(
                success=False,
                message=f"제안 생성 실패: {str(e)}"
            )

    def _create_brand_context(self, brand_data: Dict[str, Any]) -> str:
        """브랜드 컨텍스트 생성"""
        context_parts = ["브랜드 가이드라인:"]

        if brand_data.get("name"):
            context_parts.append(f"- 브랜드명: {brand_data['name']}")

        if brand_data.get("colors"):
            colors = ", ".join(brand_data["colors"])
            context_parts.append(f"- 브랜드 컬러: {colors}")

        if brand_data.get("fonts"):
            fonts = ", ".join(brand_data["fonts"])
            context_parts.append(f"- 브랜드 폰트: {fonts}")

        if brand_data.get("tone"):
            context_parts.append(f"- 톤앤매너: {brand_data['tone']}")

        return "\n".join(context_parts)

    def _get_template_specs(self, kind: str) -> Dict[str, Any]:
        """문서 종류별 템플릿 사양 반환"""
        templates = {
            "concept_board": {
                "description": "컨셉 보드",
                "pages": 1,
                "recommended_size": {"width": 1920, "height": 1080},
                "elements": ["타이틀", "메인 이미지", "컨셉 설명", "무드보드"]
            },
            "banner": {
                "description": "배너 광고",
                "pages": 1,
                "recommended_size": {"width": 728, "height": 90},
                "elements": ["헤드라인", "서브카피", "CTA 버튼", "로고"]
            },
            "slide": {
                "description": "프레젠테이션 슬라이드",
                "pages": 5,
                "recommended_size": {"width": 1920, "height": 1080},
                "elements": ["타이틀", "본문", "이미지", "차트"]
            },
            "card_news": {
                "description": "카드뉴스",
                "pages": 8,
                "recommended_size": {"width": 1080, "height": 1080},
                "elements": ["헤드라인", "본문", "이미지", "번호"]
            },
            "social_post": {
                "description": "소셜미디어 포스트",
                "pages": 1,
                "recommended_size": {"width": 1080, "height": 1080},
                "elements": ["메인 텍스트", "이미지", "해시태그", "로고"]
            }
        }

        return templates.get(kind, templates["concept_board"])

    async def enhance_with_ai(
        self,
        document_id: UUID,
        enhancement_type: str,
        user_id: UUID
    ) -> AICommandResponse:
        """AI로 문서 개선"""
        # TODO: 구현 예정
        # - 색상 개선
        # - 레이아웃 개선
        # - 텍스트 개선
        # - 이미지 추천
        pass