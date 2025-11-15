"""
Common schemas used across all agents
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class TaskType(str, Enum):
    """Types of tasks"""
    IMAGE = "image"
    BROCHURE = "brochure"
    PPT = "ppt"
    VIDEO = "video"
    COPY = "copy"
    STRATEGY = "strategy"


class RiskLevel(str, Enum):
    """Risk levels for tasks"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AgentStatus(str, Enum):
    """Agent execution status"""
    SUCCESS = "success"
    ERROR = "error"
    PARTIAL = "partial"


# ===================
# A2A Protocol Schemas
# ===================

class SystemContext(BaseModel):
    """System-level context (immutable, always propagated)"""
    brand_id: str = Field(..., description="Brand ID")
    project_id: Optional[str] = Field(None, description="Project ID")
    task_type: TaskType = Field(..., description="Type of task")
    risk_level: RiskLevel = Field(default=RiskLevel.LOW, description="Risk level")
    language: str = Field(default="ko", description="Language code")
    output_format: str = Field(default="json", description="Output format")


class TaskContext(BaseModel):
    """Task-level context (minimized based on agent needs)"""
    brief: Optional[Dict[str, Any]] = Field(None, description="Marketing brief")
    brandkit_summary: Optional[Dict[str, Any]] = Field(None, description="Brand kit summary")
    user_command: Optional[str] = Field(None, description="User command/instruction")
    quality_gates: Optional[Dict[str, Any]] = Field(None, description="Quality requirements")


class WorkingMemory(BaseModel):
    """Working memory (last 2-3 agent outputs)"""
    previous_outputs: List[Dict[str, Any]] = Field(default_factory=list, description="Previous agent outputs")
    style_selections: Optional[Dict[str, Any]] = Field(None, description="Style selections made")
    decisions: Optional[Dict[str, Any]] = Field(None, description="Decisions made")


class EphemeralContext(BaseModel):
    """Ephemeral context (rarely propagated)"""
    recent_conversation: List[str] = Field(default_factory=list, description="Recent conversation history")
    temp_settings: Optional[Dict[str, Any]] = Field(None, description="Temporary settings")


class A2ARequest(BaseModel):
    """Standard A2A request format"""
    request_id: str = Field(..., description="Unique request ID")
    source_agent: str = Field(..., description="Source agent name")
    target_agent: str = Field(..., description="Target agent name")
    timestamp: datetime = Field(default_factory=datetime.now, description="Request timestamp")

    # Context layers
    system_context: SystemContext
    task_context: Optional[TaskContext] = None
    working_memory: Optional[WorkingMemory] = None
    ephemeral_context: Optional[EphemeralContext] = None

    # Agent-specific payload
    payload: Dict[str, Any] = Field(default_factory=dict, description="Agent-specific data")


class A2AResponse(BaseModel):
    """Standard A2A response format"""
    request_id: str = Field(..., description="Original request ID")
    source_agent: str = Field(..., description="Agent that generated this response")
    status: AgentStatus = Field(..., description="Execution status")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")

    result: Optional[Dict[str, Any]] = Field(None, description="Result data")
    error: Optional[str] = Field(None, description="Error message if failed")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata (confidence, reasoning, etc.)")


# ===================
# Error Schemas
# ===================

class AgentErrorType(str, Enum):
    """Types of agent errors"""
    VALIDATION_ERROR = "validation_error"
    MODEL_ERROR = "model_error"
    TIMEOUT = "timeout"
    RESOURCE_ERROR = "resource_error"
    UNKNOWN = "unknown"


class AgentError(BaseModel):
    """Standard error format"""
    error_type: AgentErrorType = Field(..., description="Error type")
    error_message: str = Field(..., description="Human-readable error message")
    error_details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.now, description="Error timestamp")
    agent_name: str = Field(..., description="Agent that encountered the error")
    retry_possible: bool = Field(default=False, description="Whether retry is possible")


# ===================
# Common Data Models
# ===================

class BrandKitSummary(BaseModel):
    """Minimized brand kit for context propagation"""
    primary_color: str = Field(..., description="Primary brand color (hex)")
    secondary_color: Optional[str] = Field(None, description="Secondary color")
    primary_font: str = Field(..., description="Primary font name")
    tone: str = Field(..., description="Brand tone (e.g., 'premium', 'friendly')")
    logo_url: Optional[str] = Field(None, description="Logo URL")


class Brief(BaseModel):
    """Marketing brief"""
    brief_id: str = Field(..., description="Brief ID")
    asset_type: TaskType = Field(..., description="Type of asset to generate")
    objective: str = Field(..., description="Marketing objective")
    key_messages: List[str] = Field(..., description="Key messages to convey")
    target_audience: Optional[str] = Field(None, description="Target audience")
    constraints: Optional[Dict[str, Any]] = Field(None, description="Constraints")
