"""
Agents Module

Core agents for Sparklio AI Marketing Studio
Implements A2A (Agent-to-Agent) protocol
"""

from app.agents.base import BaseAgent, LLMAgent, VisionAgent
from app.agents.brief import BriefAgent
from app.agents.brand_agent import BrandAgent
from app.agents.strategist import StrategistAgent
from app.agents.copywriter import CopywriterAgent
from app.agents.vision_generator import VisionGeneratorAgent
from app.agents.reviewer import ReviewerAgent

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
