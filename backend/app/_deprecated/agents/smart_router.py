"""
SmartRouter - Central routing engine for Sparklio V4

Based on SMART_ROUTER_SPEC.md
"""

from typing import Dict, Any, Optional
import logging
import json
from app.schemas.router import RouterRequest, RouterResponse, Intent
from app.schemas.common import RiskLevel
from app.integrations.ollama_client import OllamaClient, get_ollama_client

logger = logging.getLogger(__name__)


class SmartRouter:
    """
    SmartRouter: Central routing engine

    Responsibilities:
    1. Intent Classification
    2. Agent Selection
    3. Model Selection
    4. Context Minimization
    5. Risk Assessment
    """

    # Intent keyword mapping
    INTENT_KEYWORDS = {
        "brand_query": ["브랜드", "색상", "폰트", "톤", "로고"],
        "copywriting": ["카피", "문구", "헤드라인", "슬로건", "작성", "글"],
        "visual_generation": ["이미지", "비주얼", "그래픽", "디자인", "만들어", "생성"],
        "template_selection": ["템플릿", "양식"],
        "editing": ["수정", "바꿔", "변경", "편집"],
        "strategy": ["전략", "캠페인", "기획"],
        "brief_creation": ["브리프", "계획서"],
        "complex_workflow": ["전체", "런칭", "여러", "많은"],
        "trend_query": ["트렌드", "유행", "최신"],
    }

    # Agent selection mapping
    INTENT_TO_AGENT = {
        "brand_query": "BrandAgent",
        "copywriting": "CopywriterAgent",
        "visual_generation": "VisionGeneratorAgent",
        "template_selection": "TemplateMatcherAgent",
        "editing": "EditorAgent",
        "strategy": "StrategistAgent",
        "brief_creation": "BriefAgent",
        "complex_workflow": "PMAgent",
        "trend_query": "RAGAgent",
        "unknown": "PMAgent",  # Fallback
    }

    # Model selection by agent
    AGENT_DEFAULT_MODELS = {
        "StrategistAgent": "qwen2.5-14b",      # High quality for strategy
        "CopywriterAgent": "qwen2.5-14b",      # High quality for copy
        "VisionGeneratorAgent": "qwen2.5-7b",  # Medium for prompts
        "BrandAgent": "qwen2.5-7b",            # Fast for brand queries
        "EditorAgent": "qwen2.5-7b",           # Fast for editing
        "ReviewerAgent": "qwen2.5-14b",        # High quality for review
        "PMAgent": "qwen2.5-14b",              # High quality for planning
        "BriefAgent": "qwen2.5-7b",
        "TemplateMatcherAgent": "qwen2.5-7b",
        "RAGAgent": "qwen2.5-7b",
    }

    # Context requirements by agent
    AGENT_CONTEXT_REQUIREMENTS = {
        "BrandAgent": ["brand_id", "brandkit"],
        "CopywriterAgent": ["brand_id", "brandkit_summary", "brief", "tone"],
        "VisionGeneratorAgent": ["brand_id", "brandkit_summary", "brief", "style"],
        "EditorAgent": ["canvas", "command", "editor_rules"],
        "StrategistAgent": ["brand_id", "brandkit", "brief", "market_data"],
        "PMAgent": ["full_context"],  # PMAgent needs everything
    }

    def __init__(self, ollama_client: Optional[OllamaClient] = None):
        self.ollama_client = ollama_client or get_ollama_client()

    async def route(self, request: RouterRequest) -> RouterResponse:
        """
        Main routing method

        Args:
            request: RouterRequest

        Returns:
            RouterResponse with agent, model, risk level, minimized context
        """
        logger.info(f"Routing request: user={request.user_id}, text={request.request_text[:50]}...")

        # 1. Intent Classification
        intent = await self._classify_intent(request.request_text)
        logger.info(f"Classified intent: {intent.intent_type} (confidence: {intent.confidence})")

        # 2. Risk Assessment
        risk_level = self._assess_risk(request.request_text, request.context or {})
        logger.info(f"Risk level: {risk_level}")

        # 3. Agent Selection
        target_agent = self._select_agent(intent.intent_type)
        logger.info(f"Selected agent: {target_agent}")

        # 4. Model Selection
        selected_model = request.force_model or self._select_model(
            target_agent,
            risk_level,
            request.context or {}
        )
        logger.info(f"Selected model: {selected_model}")

        # 5. Context Minimization
        minimized_context = self._minimize_context(request.context or {}, target_agent)

        # 6. Build Response
        return RouterResponse(
            target_agent=target_agent,
            selected_model=selected_model,
            risk_level=risk_level,
            minimized_context=minimized_context,
            routing_metadata={
                "intent": intent.intent_type,
                "confidence": intent.confidence,
                "reasoning": intent.reasoning or f"Classified as {intent.intent_type}",
            }
        )

    async def _classify_intent(self, text: str) -> Intent:
        """
        Classify intent using hybrid approach (keywords + LLM if needed)

        Args:
            text: User request text

        Returns:
            Intent with type, confidence, and reasoning
        """
        # 1. Try keyword-based classification (fast)
        for intent_type, keywords in self.INTENT_KEYWORDS.items():
            if any(keyword in text for keyword in keywords):
                return Intent(
                    intent_type=intent_type,
                    confidence=0.8,
                    reasoning=f"Matched keyword-based classification"
                )

        # 2. Fallback to unknown
        return Intent(
            intent_type="unknown",
            confidence=0.5,
            reasoning="No keywords matched, using fallback"
        )

    def _assess_risk(self, text: str, context: Dict[str, Any]) -> RiskLevel:
        """
        Assess risk level of the request

        Args:
            text: User request text
            context: Request context

        Returns:
            RiskLevel (low/medium/high)
        """
        # High-risk keywords
        high_risk_keywords = ["캠페인", "런칭", "전체", "브랜드 리뉴얼"]
        if any(kw in text for kw in high_risk_keywords):
            return RiskLevel.HIGH

        # Large quantity
        if any(quantity in text for quantity in ["10개", "100개", "대량"]):
            return RiskLevel.HIGH

        # Budget-based
        if context.get("budget", 0) > 1000000:  # 100만원 이상
            return RiskLevel.HIGH

        # Intent-based
        if context.get("intent") in ["strategy", "complex_workflow"]:
            return RiskLevel.MEDIUM

        return RiskLevel.LOW

    def _select_agent(self, intent: str) -> str:
        """
        Select agent based on intent

        Args:
            intent: Classified intent type

        Returns:
            Agent name
        """
        return self.INTENT_TO_AGENT.get(intent, "PMAgent")

    def _select_model(
        self,
        agent: str,
        risk_level: RiskLevel,
        context: Dict[str, Any]
    ) -> str:
        """
        Select best model for the agent and task

        Args:
            agent: Agent name
            risk_level: Risk level
            context: Request context

        Returns:
            Model name
        """
        # High-risk tasks always use best model
        if risk_level == RiskLevel.HIGH:
            return "qwen2.5-14b"

        # Large context needs larger model
        context_size = len(json.dumps(context).encode('utf-8'))
        if context_size > 10000:
            return "qwen2.5-14b"

        # Use agent default
        return self.AGENT_DEFAULT_MODELS.get(agent, "qwen2.5-7b")

    def _minimize_context(self, context: Dict[str, Any], agent: str) -> Dict[str, Any]:
        """
        Minimize context based on agent requirements

        Args:
            context: Full context
            agent: Target agent name

        Returns:
            Minimized context
        """
        # PMAgent needs full context
        if agent == "PMAgent":
            return context

        # Get required fields for this agent
        required_fields = self.AGENT_CONTEXT_REQUIREMENTS.get(agent, [])

        minimized = {}
        for field in required_fields:
            if field in context:
                minimized[field] = context[field]

        # BrandKit summarization (if present and agent doesn't need full)
        if "brandkit" in context and agent != "BrandAgent":
            brandkit = context["brandkit"]
            minimized["brandkit_summary"] = {
                "primary_color": brandkit.get("colors", {}).get("primary"),
                "font": brandkit.get("typography", {}).get("primary_font"),
                "tone": brandkit.get("tone"),
            }

        logger.info(f"Context minimized: {len(json.dumps(context))} -> {len(json.dumps(minimized))} bytes")

        return minimized


# Singleton instance
_smart_router: Optional[SmartRouter] = None


def get_smart_router() -> SmartRouter:
    """Get singleton SmartRouter instance"""
    global _smart_router
    if _smart_router is None:
        _smart_router = SmartRouter()
    return _smart_router
