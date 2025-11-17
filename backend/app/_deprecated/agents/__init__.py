"""
Agents Module (DEPRECATED)

Core agents for Sparklio AI Marketing Studio
Implements A2A (Agent-to-Agent) protocol

⚠️ DEPRECATED - Legacy agents moved to _deprecated folder
"""

from app._deprecated.agents.base import BaseAgent, LLMAgent, VisionAgent
from app._deprecated.agents.brief import BriefAgent
from app._deprecated.agents.brand_agent import BrandAgent
from app._deprecated.agents.strategist import StrategistAgent
from app._deprecated.agents.copywriter import CopywriterAgent
from app._deprecated.agents.vision_generator import VisionGeneratorAgent
from app._deprecated.agents.reviewer import ReviewerAgent

__all__ = [
    "BaseAgent",
    "LLMAgent",
    "VisionAgent",
    "BriefAgent",
    "BrandAgent",
    "StrategistAgent",
    "CopywriterAgent",
    "VisionGeneratorAgent",
    "ReviewerAgent",
]
