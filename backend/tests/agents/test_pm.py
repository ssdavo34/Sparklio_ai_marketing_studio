"""
PMAgent 단위 테스트

작성일: 2025-11-22
작성자: B팀 (Backend)
"""

import pytest
from app.services.agents import create_pm_agent, AgentRequest, AgentError


@pytest.mark.asyncio
async def test_pm_agent_creation():
    """PMAgent 인스턴스 생성 테스트"""
    agent = create_pm_agent()
    assert agent is not None
    assert agent.name == "pm"


@pytest.mark.asyncio
async def test_pm_plan_workflow():
    """워크플로우 계획 생성 테스트"""
    agent = create_pm_agent()

    request = AgentRequest(
        task="plan_workflow",
        payload={
            "goal": "신제품 마케팅 캠페인 실행",
            "constraints": {
                "budget": 1000000,
                "deadline": "2025-12-31"
            }
        }
    )

    response = await agent.execute(request)

    assert response is not None
    assert len(response.outputs) > 0
    assert "workflow" in response.outputs[0].data
    assert "tasks" in response.outputs[0].data


@pytest.mark.asyncio
async def test_pm_assign_tasks():
    """태스크 할당 테스트"""
    agent = create_pm_agent()

    request = AgentRequest(
        task="assign_tasks",
        payload={
            "tasks": [
                {"name": "카피 작성", "type": "copywriting"},
                {"name": "이미지 생성", "type": "design"}
            ]
        }
    )

    response = await agent.execute(request)

    assert response is not None
    assert len(response.outputs) > 0


@pytest.mark.asyncio
async def test_pm_monitor_progress():
    """진행 상황 모니터링 테스트"""
    agent = create_pm_agent()

    request = AgentRequest(
        task="monitor_progress",
        payload={
            "workflow_id": "wf_001",
            "current_tasks": [
                {"task_id": "t1", "status": "completed"},
                {"task_id": "t2", "status": "in_progress"}
            ]
        }
    )

    response = await agent.execute(request)

    assert response is not None
    assert len(response.outputs) > 0
