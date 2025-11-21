"""
System Agents 단위 테스트

작성일: 2025-11-22
작성자: B팀 (Backend)
"""

import pytest
from app.services.agents import (
    create_error_handler_agent,
    create_logger_agent,
    AgentRequest,
    AgentError
)


@pytest.mark.asyncio
async def test_error_handler_agent_creation():
    """ErrorHandlerAgent 인스턴스 생성 테스트"""
    agent = create_error_handler_agent()
    assert agent is not None
    assert agent.name == "error_handler"


@pytest.mark.asyncio
async def test_logger_agent_creation():
    """LoggerAgent 인스턴스 생성 테스트"""
    agent = create_logger_agent()
    assert agent is not None
    assert agent.name == "logger"


@pytest.mark.asyncio
async def test_error_handler_detect():
    """에러 감지 테스트"""
    agent = create_error_handler_agent()

    request = AgentRequest(
        task="detect_error",
        payload={
            "error_message": "Connection timeout",
            "error_type": "NetworkError"
        }
    )

    response = await agent.execute(request)
    assert response is not None
    assert len(response.outputs) > 0


@pytest.mark.asyncio
async def test_logger_log_event():
    """이벤트 로깅 테스트"""
    agent = create_logger_agent()

    request = AgentRequest(
        task="log_event",
        payload={
            "event_name": "user_login",
            "event_data": {"user_id": "test_user"}
        }
    )

    response = await agent.execute(request)
    assert response is not None
    assert len(response.outputs) > 0
