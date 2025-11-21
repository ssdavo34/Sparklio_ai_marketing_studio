"""
TemplateAgent - 마케팅 템플릿 자동 생성 Agent

마케팅 콘텐츠 템플릿을 자동으로 생성하고 관리합니다.
산업군, 채널, 목적에 맞는 템플릿을 추천하고 커스터마이징을 지원합니다.

작성일: 2025-11-21
Phase: 2 (Priority 1)
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from enum import Enum
import logging
import asyncio
from datetime import datetime

from app.services.agents.base import AgentBase, AgentError

logger = logging.getLogger(__name__)


# ============================================================
# Enums
# ============================================================

class IndustryType(str, Enum):
    """산업군 타입"""
    ECOMMERCE = "ecommerce"
    FASHION = "fashion"
    FOOD = "food"
    BEAUTY = "beauty"
    TECH = "tech"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    FINANCE = "finance"
    TRAVEL = "travel"
    REAL_ESTATE = "real_estate"
    ENTERTAINMENT = "entertainment"
    OTHER = "other"


class ChannelType(str, Enum):
    """마케팅 채널 타입"""
    LANDING_PAGE = "landing_page"
    EMAIL = "email"
    SOCIAL_POST = "social_post"
    BANNER_AD = "banner_ad"
    VIDEO_AD = "video_ad"
    BLOG_POST = "blog_post"
    PRODUCT_PAGE = "product_page"
    NEWSLETTER = "newsletter"
    INFOGRAPHIC = "infographic"
    PRESENTATION = "presentation"


class PurposeType(str, Enum):
    """템플릿 목적"""
    PRODUCT_INTRO = "product_intro"
    BRAND_AWARENESS = "brand_awareness"
    LEAD_GENERATION = "lead_generation"
    SALES_CONVERSION = "sales_conversion"
    CUSTOMER_RETENTION = "customer_retention"
    EVENT_PROMOTION = "event_promotion"
    CONTENT_MARKETING = "content_marketing"
    ANNOUNCEMENT = "announcement"


class VariableType(str, Enum):
    """템플릿 변수 타입"""
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"
    ARRAY = "array"
    OBJECT = "object"
    IMAGE = "image"
    VIDEO = "video"
    COLOR = "color"
    FONT = "font"


class SectionType(str, Enum):
    """템플릿 섹션 타입"""
    HERO = "hero"
    FEATURES = "features"
    BENEFITS = "benefits"
    TESTIMONIALS = "testimonials"
    CTA = "cta"
    FOOTER = "footer"
    PRICING = "pricing"
    FAQ = "faq"
    ABOUT = "about"
    CONTACT = "contact"
    GALLERY = "gallery"
    STATS = "stats"


# ============================================================
# Pydantic Models
# ============================================================

class TemplateVariable(BaseModel):
    """템플릿 변수"""
    name: str = Field(..., description="변수 이름")
    type: VariableType = Field(..., description="변수 타입")
    required: bool = Field(True, description="필수 여부")
    default: Optional[Any] = Field(None, description="기본값")
    description: Optional[str] = Field(None, description="변수 설명")
    validation: Optional[Dict[str, Any]] = Field(None, description="검증 규칙")


class TemplateSection(BaseModel):
    """템플릿 섹션"""
    type: SectionType = Field(..., description="섹션 타입")
    order: int = Field(..., description="섹션 순서")
    required: bool = Field(True, description="필수 여부")
    components: List[str] = Field(default_factory=list, description="포함 컴포넌트")
    layout: Optional[str] = Field(None, description="레이아웃 타입")


class StyleGuide(BaseModel):
    """스타일 가이드"""
    colors: Dict[str, str] = Field(default_factory=dict, description="컬러 팔레트")
    fonts: Dict[str, str] = Field(default_factory=dict, description="폰트 설정")
    spacing: Optional[Dict[str, Any]] = Field(None, description="간격 설정")
    breakpoints: Optional[Dict[str, int]] = Field(None, description="반응형 브레이크포인트")


class Template(BaseModel):
    """마케팅 템플릿"""
    id: str = Field(..., description="템플릿 ID")
    name: str = Field(..., description="템플릿 이름")
    description: str = Field(..., description="템플릿 설명")
    industry: IndustryType = Field(..., description="산업군")
    channel: ChannelType = Field(..., description="채널")
    purpose: PurposeType = Field(..., description="목적")

    sections: List[TemplateSection] = Field(..., description="섹션 구조")
    variables: List[TemplateVariable] = Field(..., description="템플릿 변수")
    style_guide: StyleGuide = Field(..., description="스타일 가이드")

    preview_url: Optional[str] = Field(None, description="미리보기 URL")
    thumbnail_url: Optional[str] = Field(None, description="썸네일 URL")

    usage_count: int = Field(0, description="사용 횟수")
    rating: float = Field(0.0, description="평점 (0-5)")

    created_at: str = Field(..., description="생성일시")
    updated_at: str = Field(..., description="수정일시")

    tags: List[str] = Field(default_factory=list, description="태그")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="메타데이터")


class GenerateTemplateRequest(BaseModel):
    """템플릿 생성 요청"""
    industry: IndustryType = Field(..., description="산업군")
    channel: ChannelType = Field(..., description="채널")
    purpose: PurposeType = Field(..., description="목적")

    brand_name: Optional[str] = Field(None, description="브랜드명")
    target_audience: Optional[str] = Field(None, description="타겟 고객")

    sections: Optional[List[SectionType]] = Field(None, description="포함할 섹션")
    custom_requirements: Optional[str] = Field(None, description="추가 요구사항")

    style_preferences: Optional[Dict[str, Any]] = Field(None, description="스타일 선호도")


class ListTemplatesRequest(BaseModel):
    """템플릿 목록 조회 요청"""
    industry: Optional[IndustryType] = Field(None, description="산업군 필터")
    channel: Optional[ChannelType] = Field(None, description="채널 필터")
    purpose: Optional[PurposeType] = Field(None, description="목적 필터")

    tags: Optional[List[str]] = Field(None, description="태그 필터")
    min_rating: Optional[float] = Field(None, description="최소 평점")

    sort_by: str = Field("usage_count", description="정렬 기준")
    limit: int = Field(20, description="최대 결과 수")
    offset: int = Field(0, description="결과 오프셋")


class CustomizeTemplateRequest(BaseModel):
    """템플릿 커스터마이징 요청"""
    template_id: str = Field(..., description="템플릿 ID")

    sections_to_add: Optional[List[SectionType]] = Field(None, description="추가할 섹션")
    sections_to_remove: Optional[List[SectionType]] = Field(None, description="제거할 섹션")

    variable_overrides: Optional[Dict[str, Any]] = Field(None, description="변수 오버라이드")
    style_overrides: Optional[Dict[str, Any]] = Field(None, description="스타일 오버라이드")

    custom_name: Optional[str] = Field(None, description="커스텀 이름")


class ApplyTemplateRequest(BaseModel):
    """템플릿 적용 요청"""
    template_id: str = Field(..., description="템플릿 ID")
    variable_values: Dict[str, Any] = Field(..., description="변수 값")

    output_format: str = Field("json", description="출력 형식")
    include_preview: bool = Field(True, description="미리보기 포함")


# ============================================================
# TemplateAgent
# ============================================================

class TemplateAgent(AgentBase):
    """마케팅 템플릿 자동 생성 Agent

    기능:
    - 산업군/채널/목적별 템플릿 생성
    - 템플릿 목록 조회 및 검색
    - 템플릿 커스터마이징
    - 템플릿 적용 및 렌더링
    """

    def __init__(self):
        super().__init__(
            name="template",
            description="마케팅 템플릿 자동 생성 및 관리 Agent"
        )
        self.template_database: Dict[str, Template] = {}
        self._load_default_templates()

    def _load_default_templates(self):
        """기본 템플릿 로드"""
        # Mock 데이터: 기본 템플릿들
        default_templates = [
            self._create_mock_template(
                "tpl_ecommerce_001",
                "이커머스 제품 랜딩페이지",
                IndustryType.ECOMMERCE,
                ChannelType.LANDING_PAGE,
                PurposeType.PRODUCT_INTRO
            ),
            self._create_mock_template(
                "tpl_fashion_001",
                "패션 브랜드 소개",
                IndustryType.FASHION,
                ChannelType.LANDING_PAGE,
                PurposeType.BRAND_AWARENESS
            ),
            self._create_mock_template(
                "tpl_email_001",
                "뉴스레터 템플릿",
                IndustryType.OTHER,
                ChannelType.EMAIL,
                PurposeType.CONTENT_MARKETING
            ),
        ]

        for template in default_templates:
            self.template_database[template.id] = template

    def _create_mock_template(
        self,
        template_id: str,
        name: str,
        industry: IndustryType,
        channel: ChannelType,
        purpose: PurposeType
    ) -> Template:
        """Mock 템플릿 생성"""
        return Template(
            id=template_id,
            name=name,
            description=f"{industry.value} 산업의 {channel.value} 채널용 템플릿",
            industry=industry,
            channel=channel,
            purpose=purpose,
            sections=[
                TemplateSection(
                    type=SectionType.HERO,
                    order=1,
                    required=True,
                    components=["headline", "subheadline", "hero_image", "cta_button"],
                    layout="full_width"
                ),
                TemplateSection(
                    type=SectionType.FEATURES,
                    order=2,
                    required=True,
                    components=["feature_grid", "feature_icons"],
                    layout="three_column"
                ),
                TemplateSection(
                    type=SectionType.CTA,
                    order=3,
                    required=True,
                    components=["cta_headline", "cta_button", "trust_badges"],
                    layout="centered"
                ),
            ],
            variables=[
                TemplateVariable(
                    name="headline",
                    type=VariableType.STRING,
                    required=True,
                    description="메인 헤드라인",
                    validation={"max_length": 100}
                ),
                TemplateVariable(
                    name="hero_image",
                    type=VariableType.IMAGE,
                    required=True,
                    description="히어로 이미지 URL"
                ),
                TemplateVariable(
                    name="features",
                    type=VariableType.ARRAY,
                    required=True,
                    description="제품 특징 목록",
                    validation={"min_items": 3, "max_items": 6}
                ),
            ],
            style_guide=StyleGuide(
                colors={
                    "primary": "#2563eb",
                    "secondary": "#7c3aed",
                    "accent": "#f59e0b",
                    "background": "#ffffff",
                    "text": "#1f2937"
                },
                fonts={
                    "heading": "Inter",
                    "body": "Inter",
                    "display": "Poppins"
                },
                spacing={
                    "section_gap": "4rem",
                    "component_gap": "2rem"
                },
                breakpoints={
                    "mobile": 640,
                    "tablet": 768,
                    "desktop": 1024
                }
            ),
            preview_url=f"https://templates.sparklio.ai/preview/{template_id}",
            thumbnail_url=f"https://templates.sparklio.ai/thumb/{template_id}.jpg",
            usage_count=125,
            rating=4.7,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            tags=["modern", "clean", "conversion-focused"],
            metadata={
                "recommended_for": ["SMB", "startup"],
                "difficulty": "beginner",
                "estimated_time": "30min"
            }
        )

    async def execute(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Agent 실행"""
        task = request.get("task")
        payload = request.get("payload", {})

        logger.info(f"TemplateAgent executing task: {task}")

        try:
            if task == "generate_template":
                return await self._generate_template(payload)
            elif task == "list_templates":
                return await self._list_templates(payload)
            elif task == "customize_template":
                return await self._customize_template(payload)
            elif task == "apply_template":
                return await self._apply_template(payload)
            elif task == "get_template":
                return await self._get_template(payload)
            else:
                raise AgentError(f"Unsupported task: {task}")

        except Exception as e:
            logger.error(f"TemplateAgent error: {str(e)}", exc_info=True)
            raise AgentError(f"Template generation failed: {str(e)}")

    async def _generate_template(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """템플릿 생성

        Args:
            payload: GenerateTemplateRequest 데이터

        Returns:
            생성된 템플릿
        """
        input_data = GenerateTemplateRequest(**payload)

        # Mock: 시뮬레이션 딜레이
        await asyncio.sleep(0.5)

        # 템플릿 ID 생성
        template_id = f"tpl_{input_data.industry.value}_{len(self.template_database) + 1:03d}"

        # 섹션 결정
        sections = input_data.sections or self._recommend_sections(
            input_data.channel,
            input_data.purpose
        )

        # 템플릿 섹션 생성
        template_sections = [
            TemplateSection(
                type=section,
                order=idx + 1,
                required=idx < 3,  # 첫 3개는 필수
                components=self._get_section_components(section),
                layout=self._get_section_layout(section)
            )
            for idx, section in enumerate(sections)
        ]

        # 템플릿 변수 생성
        variables = self._generate_variables(sections, input_data.channel)

        # 스타일 가이드 생성
        style_guide = self._generate_style_guide(
            input_data.industry,
            input_data.style_preferences
        )

        # 템플릿 생성
        template = Template(
            id=template_id,
            name=f"{input_data.industry.value.title()} {input_data.channel.value.replace('_', ' ').title()}",
            description=f"{input_data.purpose.value.replace('_', ' ').title()} 목적의 {input_data.channel.value} 템플릿",
            industry=input_data.industry,
            channel=input_data.channel,
            purpose=input_data.purpose,
            sections=template_sections,
            variables=variables,
            style_guide=style_guide,
            preview_url=f"https://templates.sparklio.ai/preview/{template_id}",
            thumbnail_url=f"https://templates.sparklio.ai/thumb/{template_id}.jpg",
            usage_count=0,
            rating=0.0,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            tags=self._generate_tags(input_data),
            metadata={
                "brand_name": input_data.brand_name,
                "target_audience": input_data.target_audience,
                "custom_requirements": input_data.custom_requirements
            }
        )

        # 데이터베이스에 저장
        self.template_database[template_id] = template

        logger.info(f"Template generated: {template_id}")

        return {
            "template": template.model_dump(),
            "metadata": {
                "generation_time": 0.5,
                "sections_count": len(template_sections),
                "variables_count": len(variables)
            }
        }

    async def _list_templates(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """템플릿 목록 조회

        Args:
            payload: ListTemplatesRequest 데이터

        Returns:
            템플릿 목록
        """
        input_data = ListTemplatesRequest(**payload)

        # 필터링
        filtered_templates = list(self.template_database.values())

        if input_data.industry:
            filtered_templates = [
                t for t in filtered_templates
                if t.industry == input_data.industry
            ]

        if input_data.channel:
            filtered_templates = [
                t for t in filtered_templates
                if t.channel == input_data.channel
            ]

        if input_data.purpose:
            filtered_templates = [
                t for t in filtered_templates
                if t.purpose == input_data.purpose
            ]

        if input_data.tags:
            filtered_templates = [
                t for t in filtered_templates
                if any(tag in t.tags for tag in input_data.tags)
            ]

        if input_data.min_rating:
            filtered_templates = [
                t for t in filtered_templates
                if t.rating >= input_data.min_rating
            ]

        # 정렬
        if input_data.sort_by == "usage_count":
            filtered_templates.sort(key=lambda t: t.usage_count, reverse=True)
        elif input_data.sort_by == "rating":
            filtered_templates.sort(key=lambda t: t.rating, reverse=True)
        elif input_data.sort_by == "created_at":
            filtered_templates.sort(key=lambda t: t.created_at, reverse=True)

        # 페이지네이션
        total = len(filtered_templates)
        templates = filtered_templates[input_data.offset:input_data.offset + input_data.limit]

        logger.info(f"Listed {len(templates)} templates (total: {total})")

        return {
            "templates": [t.model_dump() for t in templates],
            "pagination": {
                "total": total,
                "limit": input_data.limit,
                "offset": input_data.offset,
                "has_more": input_data.offset + input_data.limit < total
            }
        }

    async def _customize_template(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """템플릿 커스터마이징

        Args:
            payload: CustomizeTemplateRequest 데이터

        Returns:
            커스터마이징된 템플릿
        """
        input_data = CustomizeTemplateRequest(**payload)

        # 원본 템플릿 가져오기
        if input_data.template_id not in self.template_database:
            raise AgentError(f"Template not found: {input_data.template_id}")

        original = self.template_database[input_data.template_id]

        # 템플릿 복사
        customized = original.model_copy(deep=True)

        # 새 ID 생성
        customized.id = f"{original.id}_custom_{len(self.template_database) + 1}"

        # 커스텀 이름
        if input_data.custom_name:
            customized.name = input_data.custom_name

        # 섹션 추가/제거
        if input_data.sections_to_add:
            for section_type in input_data.sections_to_add:
                if section_type not in [s.type for s in customized.sections]:
                    customized.sections.append(
                        TemplateSection(
                            type=section_type,
                            order=len(customized.sections) + 1,
                            required=False,
                            components=self._get_section_components(section_type),
                            layout=self._get_section_layout(section_type)
                        )
                    )

        if input_data.sections_to_remove:
            customized.sections = [
                s for s in customized.sections
                if s.type not in input_data.sections_to_remove
            ]

        # 변수 오버라이드
        if input_data.variable_overrides:
            for var in customized.variables:
                if var.name in input_data.variable_overrides:
                    var.default = input_data.variable_overrides[var.name]

        # 스타일 오버라이드
        if input_data.style_overrides:
            if "colors" in input_data.style_overrides:
                customized.style_guide.colors.update(input_data.style_overrides["colors"])
            if "fonts" in input_data.style_overrides:
                customized.style_guide.fonts.update(input_data.style_overrides["fonts"])

        # 메타데이터 업데이트
        customized.updated_at = datetime.now().isoformat()
        customized.usage_count = 0
        customized.rating = 0.0
        customized.metadata["customized_from"] = original.id

        # 데이터베이스에 저장
        self.template_database[customized.id] = customized

        logger.info(f"Template customized: {customized.id}")

        return {
            "template": customized.model_dump(),
            "changes": {
                "sections_added": len(input_data.sections_to_add or []),
                "sections_removed": len(input_data.sections_to_remove or []),
                "variables_overridden": len(input_data.variable_overrides or {}),
                "styles_overridden": len(input_data.style_overrides or {})
            }
        }

    async def _apply_template(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """템플릿 적용

        Args:
            payload: ApplyTemplateRequest 데이터

        Returns:
            렌더링된 결과
        """
        input_data = ApplyTemplateRequest(**payload)

        # 템플릿 가져오기
        if input_data.template_id not in self.template_database:
            raise AgentError(f"Template not found: {input_data.template_id}")

        template = self.template_database[input_data.template_id]

        # 변수 검증
        missing_vars = []
        for var in template.variables:
            if var.required and var.name not in input_data.variable_values:
                missing_vars.append(var.name)

        if missing_vars:
            raise AgentError(f"Missing required variables: {', '.join(missing_vars)}")

        # Mock: 템플릿 렌더링
        await asyncio.sleep(0.3)

        # 렌더링된 결과 생성
        rendered = {
            "template_id": template.id,
            "template_name": template.name,
            "sections": [],
            "variables": input_data.variable_values,
            "style_guide": template.style_guide.model_dump()
        }

        for section in template.sections:
            rendered["sections"].append({
                "type": section.type.value,
                "components": section.components,
                "layout": section.layout,
                "rendered_html": f"<section id='{section.type.value}'><!-- Rendered content --></section>"
            })

        # 미리보기 URL
        preview_url = None
        if input_data.include_preview:
            preview_url = f"https://templates.sparklio.ai/render/{template.id}?preview=true"

        # 사용 횟수 증가
        template.usage_count += 1

        logger.info(f"Template applied: {template.id}")

        return {
            "rendered": rendered,
            "preview_url": preview_url,
            "metadata": {
                "render_time": 0.3,
                "sections_count": len(template.sections),
                "output_format": input_data.output_format
            }
        }

    async def _get_template(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """템플릿 상세 조회

        Args:
            payload: {"template_id": str}

        Returns:
            템플릿 상세 정보
        """
        template_id = payload.get("template_id")

        if not template_id or template_id not in self.template_database:
            raise AgentError(f"Template not found: {template_id}")

        template = self.template_database[template_id]

        return {
            "template": template.model_dump()
        }

    # ============================================================
    # Helper Methods
    # ============================================================

    def _recommend_sections(
        self,
        channel: ChannelType,
        purpose: PurposeType
    ) -> List[SectionType]:
        """채널과 목적에 맞는 섹션 추천"""
        # 기본 섹션
        sections = [SectionType.HERO, SectionType.CTA]

        # 채널별 추가 섹션
        if channel == ChannelType.LANDING_PAGE:
            sections.extend([SectionType.FEATURES, SectionType.BENEFITS, SectionType.TESTIMONIALS])
        elif channel == ChannelType.PRODUCT_PAGE:
            sections.extend([SectionType.FEATURES, SectionType.PRICING, SectionType.FAQ])
        elif channel == ChannelType.EMAIL:
            sections.extend([SectionType.BENEFITS])

        # 목적별 추가 섹션
        if purpose == PurposeType.SALES_CONVERSION:
            if SectionType.PRICING not in sections:
                sections.append(SectionType.PRICING)
            if SectionType.TESTIMONIALS not in sections:
                sections.append(SectionType.TESTIMONIALS)
        elif purpose == PurposeType.BRAND_AWARENESS:
            if SectionType.ABOUT not in sections:
                sections.append(SectionType.ABOUT)
            if SectionType.GALLERY not in sections:
                sections.append(SectionType.GALLERY)

        return sections

    def _get_section_components(self, section_type: SectionType) -> List[str]:
        """섹션 타입별 컴포넌트 목록"""
        components_map = {
            SectionType.HERO: ["headline", "subheadline", "hero_image", "cta_button"],
            SectionType.FEATURES: ["feature_grid", "feature_icons", "feature_descriptions"],
            SectionType.BENEFITS: ["benefit_list", "benefit_icons"],
            SectionType.TESTIMONIALS: ["testimonial_cards", "customer_photos", "ratings"],
            SectionType.CTA: ["cta_headline", "cta_button", "trust_badges"],
            SectionType.PRICING: ["pricing_cards", "feature_comparison", "faq_link"],
            SectionType.FAQ: ["faq_accordion", "search_box"],
            SectionType.FOOTER: ["footer_links", "social_icons", "copyright"],
            SectionType.ABOUT: ["about_text", "team_photos", "company_stats"],
            SectionType.CONTACT: ["contact_form", "map", "contact_info"],
            SectionType.GALLERY: ["image_grid", "lightbox"],
            SectionType.STATS: ["stat_counters", "chart_visualizations"],
        }
        return components_map.get(section_type, ["content"])

    def _get_section_layout(self, section_type: SectionType) -> str:
        """섹션 타입별 레이아웃"""
        layout_map = {
            SectionType.HERO: "full_width",
            SectionType.FEATURES: "three_column",
            SectionType.BENEFITS: "two_column",
            SectionType.TESTIMONIALS: "carousel",
            SectionType.CTA: "centered",
            SectionType.PRICING: "three_column",
            SectionType.FAQ: "single_column",
            SectionType.FOOTER: "four_column",
        }
        return layout_map.get(section_type, "single_column")

    def _generate_variables(
        self,
        sections: List[SectionType],
        channel: ChannelType
    ) -> List[TemplateVariable]:
        """섹션에 필요한 변수 생성"""
        variables = []

        # 공통 변수
        variables.extend([
            TemplateVariable(
                name="headline",
                type=VariableType.STRING,
                required=True,
                description="메인 헤드라인",
                validation={"max_length": 100}
            ),
            TemplateVariable(
                name="brand_name",
                type=VariableType.STRING,
                required=True,
                description="브랜드명"
            ),
        ])

        # 섹션별 변수
        if SectionType.HERO in sections:
            variables.append(
                TemplateVariable(
                    name="hero_image",
                    type=VariableType.IMAGE,
                    required=True,
                    description="히어로 이미지 URL"
                )
            )

        if SectionType.FEATURES in sections:
            variables.append(
                TemplateVariable(
                    name="features",
                    type=VariableType.ARRAY,
                    required=True,
                    description="제품 특징 목록",
                    validation={"min_items": 3, "max_items": 6}
                )
            )

        if SectionType.TESTIMONIALS in sections:
            variables.append(
                TemplateVariable(
                    name="testimonials",
                    type=VariableType.ARRAY,
                    required=False,
                    description="고객 후기",
                    validation={"max_items": 5}
                )
            )

        if SectionType.PRICING in sections:
            variables.append(
                TemplateVariable(
                    name="pricing_plans",
                    type=VariableType.ARRAY,
                    required=True,
                    description="가격 플랜",
                    validation={"min_items": 1, "max_items": 4}
                )
            )

        return variables

    def _generate_style_guide(
        self,
        industry: IndustryType,
        preferences: Optional[Dict[str, Any]]
    ) -> StyleGuide:
        """산업군과 선호도에 맞는 스타일 가이드 생성"""
        # 산업군별 기본 컬러
        industry_colors = {
            IndustryType.TECH: {"primary": "#2563eb", "secondary": "#7c3aed"},
            IndustryType.HEALTHCARE: {"primary": "#10b981", "secondary": "#3b82f6"},
            IndustryType.FASHION: {"primary": "#ec4899", "secondary": "#8b5cf6"},
            IndustryType.FOOD: {"primary": "#f59e0b", "secondary": "#ef4444"},
            IndustryType.FINANCE: {"primary": "#059669", "secondary": "#0891b2"},
        }

        colors = industry_colors.get(industry, {"primary": "#2563eb", "secondary": "#7c3aed"})
        colors.update({
            "accent": "#f59e0b",
            "background": "#ffffff",
            "text": "#1f2937"
        })

        # 선호도 오버라이드
        if preferences and "colors" in preferences:
            colors.update(preferences["colors"])

        return StyleGuide(
            colors=colors,
            fonts={
                "heading": "Inter",
                "body": "Inter",
                "display": "Poppins"
            },
            spacing={
                "section_gap": "4rem",
                "component_gap": "2rem"
            },
            breakpoints={
                "mobile": 640,
                "tablet": 768,
                "desktop": 1024
            }
        )

    def _generate_tags(self, input_data: GenerateTemplateRequest) -> List[str]:
        """템플릿 태그 생성"""
        tags = [
            input_data.industry.value,
            input_data.channel.value,
            input_data.purpose.value
        ]

        # 추가 태그
        tags.extend(["modern", "responsive", "customizable"])

        return tags


# ============================================================
# Factory Function
# ============================================================

def create_template_agent() -> TemplateAgent:
    """TemplateAgent 인스턴스 생성"""
    return TemplateAgent()
