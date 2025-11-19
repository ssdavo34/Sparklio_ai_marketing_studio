from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta
import random

from app.services.llm.gateway import get_gateway

router = APIRouter()

class AgentStatus(BaseModel):
    id: str
    name: str
    status: str  # active, idle, error, offline
    lastActive: str
    tasksCompleted: int
    errorRate: float

class DailyCost(BaseModel):
    date: str
    tokens: int
    cost: float

class AdminStatsResponse(BaseModel):
    agents: List[AgentStatus]
    costs: List[DailyCost]

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats():
    """
    Get Admin Dashboard Statistics
    - Agent Status (Live check via LLMGateway)
    - Cost/Token Usage (Mock data for now)
    """
    gateway = get_gateway()
    health = await gateway.health_check()
    
    # Agent Configuration & Provider Mapping
    # In a real system, this might come from a DB or config
    agents_list = [
        {"id": "ag_copy_01", "name": "Copywriter", "provider": "openai"},
        {"id": "ag_strat_01", "name": "Strategist", "provider": "anthropic"},
        {"id": "ag_design_01", "name": "Designer", "provider": "novita"},
        {"id": "ag_review_01", "name": "Reviewer", "provider": "openai"},
        {"id": "ag_opt_01", "name": "Optimizer", "provider": "openai"},
        {"id": "ag_edit_01", "name": "Editor", "provider": "openai"},
        {"id": "ag_meet_01", "name": "Meeting AI", "provider": "openai"},
    ]
    
    agent_statuses = []
    
    # Determine status based on provider health
    providers_health = health.get('providers', {})
    
    for agent in agents_list:
        # Default to 'openai' if provider not found in mapping
        provider_key = agent['provider']
        
        # Check if provider exists in health check
        # Note: health check keys might be 'openai', 'anthropic', 'mock' etc.
        # If using mock mode, all might map to 'mock' provider effectively, 
        # but let's try to map to the logical provider first.
        
        provider_info = providers_health.get(provider_key)
        if not provider_info and 'mock' in providers_health:
             provider_info = providers_health['mock']
             
        provider_status = provider_info.get('status', 'unknown') if provider_info else 'offline'
        
        status = 'offline'
        if provider_status == 'healthy':
            status = 'idle' # Default to idle if healthy
            # Randomly simulate 'active' for demo purposes (10% chance)
            if random.random() < 0.1:
                status = 'active'
        elif provider_status == 'error':
            status = 'error'
            
        agent_statuses.append(AgentStatus(
            id=agent['id'],
            name=agent['name'],
            status=status,
            lastActive=datetime.utcnow().isoformat(),
            tasksCompleted=random.randint(100, 1000),
            errorRate=round(random.random() * 2, 1) # 0.0 - 2.0% error rate
        ))
        
    # Mock Cost Data (Last 7 days)
    costs = []
    for i in range(7):
        # Reverse order: 6 days ago to today
        date = (datetime.utcnow() - timedelta(days=6-i)).strftime("%Y-%m-%d")
        costs.append(DailyCost(
            date=date,
            tokens=random.randint(10000, 50000),
            cost=random.uniform(5.0, 20.0)
        ))
        
    return AdminStatsResponse(
        agents=agent_statuses,
        costs=costs
    )
