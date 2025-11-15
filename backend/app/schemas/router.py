"""
SmartRouter schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from .common import RiskLevel


class RouterRequest(BaseModel):
    """Request to SmartRouter"""
    user_id: str = Field(..., description="User ID")
    request_text: str = Field(..., description="User's natural language request")
    brand_id: Optional[str] = Field(None, description="Brand ID")
    project_id: Optional[str] = Field(None, description="Project ID")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    force_model: Optional[str] = Field(None, description="Force specific model (for testing)")


class RouterResponse(BaseModel):
    """Response from SmartRouter"""
    target_agent: str = Field(..., description="Selected agent name")
    selected_model: str = Field(..., description="Selected LLM model")
    risk_level: RiskLevel = Field(..., description="Assessed risk level")
    minimized_context: Dict[str, Any] = Field(..., description="Context after minimization")
    routing_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Routing metadata (intent, confidence, reasoning)"
    )


class Intent(BaseModel):
    """Classified intent"""
    intent_type: str = Field(..., description="Intent type")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    reasoning: Optional[str] = Field(None, description="Reasoning for classification")
