"""
Agent Service Package

Agent 클라이언트 패키지

작성일: 2025-11-16
작성자: B팀 (Backend)
"""

from .base import (
    AgentBase,
    AgentRequest,
    AgentResponse,
    AgentOutput,
    AgentError
)

from .copywriter import CopywriterAgent, get_copywriter_agent
from .strategist import StrategistAgent, get_strategist_agent
from .designer import DesignerAgent, get_designer_agent
from .reviewer import ReviewerAgent, get_reviewer_agent
from .optimizer import OptimizerAgent, get_optimizer_agent
from .editor import EditorAgent, get_editor_agent

__all__ = [
    # Base classes
    "AgentBase",
    "AgentRequest",
    "AgentResponse",
    "AgentOutput",
    "AgentError",

    # Agent classes
    "CopywriterAgent",
    "StrategistAgent",
    "DesignerAgent",
    "ReviewerAgent",
    "OptimizerAgent",
    "EditorAgent",

    # Factory functions
    "get_copywriter_agent",
    "get_strategist_agent",
    "get_designer_agent",
    "get_reviewer_agent",
    "get_optimizer_agent",
    "get_editor_agent"
]
