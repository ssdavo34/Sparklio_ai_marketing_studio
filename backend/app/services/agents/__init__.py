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
    AgentError,
    # 에이전트 고도화 클래스 (2025-11-28 추가)
    AgentGoal,
    SelfReview,
    ExecutionPlan
)

from .copywriter import CopywriterAgent, get_copywriter_agent
from .strategist import StrategistAgent, get_strategist_agent
from .designer import DesignerAgent, get_designer_agent
from .reviewer import ReviewerAgent, get_reviewer_agent
from .optimizer import OptimizerAgent, get_optimizer_agent
from .editor import EditorAgent, get_editor_agent
from .vision_analyzer import VisionAnalyzerAgent, get_vision_analyzer_agent
from .meeting_ai import MeetingAIAgent, get_meeting_ai_agent
from .scene_planner import ScenePlannerAgent, get_scene_planner_agent
from .template import TemplateAgent, create_template_agent
from .pm import PMAgent, create_pm_agent
from .qa import QAAgent, create_qa_agent
from .trend_collector import TrendCollectorAgent, get_trend_collector_agent
from .data_cleaner import DataCleanerAgent, get_data_cleaner_agent
from .embedder import EmbedderAgent, create_embedder_agent
from .rag import RAGAgent, create_rag_agent
from .ingestor import IngestorAgent, create_ingestor_agent
from .performance_analyzer import PerformanceAnalyzerAgent, create_performance_analyzer_agent
from .self_learning import SelfLearningAgent, create_self_learning_agent
from .error_handler import ErrorHandlerAgent, create_error_handler_agent
from .logger import LoggerAgent, create_logger_agent
from .concept import (
    ConceptAgent, get_concept_agent,
    # ConceptV1 스키마 (CONCEPT_SPEC.md 기준)
    ConceptV1, ConceptV1Output,
    VisualWorld, ChannelStrategy, Guardrails, ConceptMeta,
    # Legacy 스키마 (하위 호환)
    ConceptOutput, ConceptAgentOutput
)
from .shorts_script import ShortsScriptAgent, get_shorts_script_agent
from .visual_prompt import VisualPromptAgent, get_visual_prompt_agent
from .presentation import PresentationAgent, get_presentation_agent
from .product_detail import ProductDetailAgent, get_product_detail_agent
from .instagram_ads import InstagramAdsAgent, get_instagram_ads_agent

# Video Pipeline Agents (2025-11-28 추가)
from .vision_generator import VisionGeneratorAgent, get_vision_generator_agent
from .video_builder import VideoBuilder, get_video_builder
from .storyboard_builder import StoryboardBuilderAgent, get_storyboard_builder_agent
from .video_director import VideoDirectorAgent, get_video_director_agent
from .video_reviewer import VideoReviewerAgent, get_video_reviewer_agent

# Brand Learning Agent (2025-11-28 추가)
from .brand_model_updater import BrandModelUpdaterAgent, get_brand_model_updater_agent

__all__ = [
    # Base classes
    "AgentBase",
    "AgentRequest",
    "AgentResponse",
    "AgentOutput",
    "AgentError",
    # 에이전트 고도화 클래스 (2025-11-28 추가)
    "AgentGoal",
    "SelfReview",
    "ExecutionPlan",

    # Agent classes
    "CopywriterAgent",
    "StrategistAgent",
    "DesignerAgent",
    "ReviewerAgent",
    "OptimizerAgent",
    "EditorAgent",
    "VisionAnalyzerAgent",
    "MeetingAIAgent",
    "ScenePlannerAgent",
    "TemplateAgent",
    "PMAgent",
    "QAAgent",
    "TrendCollectorAgent",
    "DataCleanerAgent",
    "EmbedderAgent",
    "RAGAgent",
    "IngestorAgent",
    "PerformanceAnalyzerAgent",
    "SelfLearningAgent",
    "ErrorHandlerAgent",
    "LoggerAgent",

    # Factory functions
    "get_copywriter_agent",
    "get_strategist_agent",
    "get_designer_agent",
    "get_reviewer_agent",
    "get_optimizer_agent",
    "get_editor_agent",
    "get_vision_analyzer_agent",
    "get_meeting_ai_agent",
    "get_scene_planner_agent",
    "create_template_agent",
    "create_pm_agent",
    "create_qa_agent",
    "get_trend_collector_agent",
    "get_data_cleaner_agent",
    "create_embedder_agent",
    "create_rag_agent",
    "create_ingestor_agent",
    "create_performance_analyzer_agent",
    "create_self_learning_agent",
    "create_error_handler_agent",
    "create_logger_agent",
    # Demo Day Agents
    "ConceptAgent",
    "ShortsScriptAgent",
    "VisualPromptAgent",
    "PresentationAgent",
    "ProductDetailAgent",
    "InstagramAdsAgent",
    "get_concept_agent",
    "get_shorts_script_agent",
    "get_visual_prompt_agent",
    "get_presentation_agent",
    "get_product_detail_agent",
    "get_instagram_ads_agent",
    # ConceptV1 스키마 (CONCEPT_SPEC.md 기준)
    "ConceptV1",
    "ConceptV1Output",
    "VisualWorld",
    "ChannelStrategy",
    "Guardrails",
    "ConceptMeta",
    # Legacy 스키마 (하위 호환)
    "ConceptOutput",
    "ConceptAgentOutput",
    # Video Pipeline Agents (2025-11-28 추가)
    "VisionGeneratorAgent",
    "get_vision_generator_agent",
    "VideoBuilder",
    "get_video_builder",
    "StoryboardBuilderAgent",
    "get_storyboard_builder_agent",
    "VideoDirectorAgent",
    "get_video_director_agent",
    "VideoReviewerAgent",
    "get_video_reviewer_agent",
    # Brand Learning Agent (2025-11-28 추가)
    "BrandModelUpdaterAgent",
    "get_brand_model_updater_agent"
]
