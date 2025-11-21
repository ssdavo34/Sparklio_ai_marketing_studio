"""
VisionAnalyzerAgent 단위 테스트

작성일: 2025-11-22
작성자: B팀 (Backend)
"""

import pytest
from app.services.agents import get_vision_analyzer_agent, AgentRequest, AgentError


@pytest.mark.asyncio
async def test_vision_analyzer_agent_creation():
    """VisionAnalyzerAgent 인스턴스 생성 테스트"""
    agent = get_vision_analyzer_agent()
    assert agent is not None
    assert agent.name == "vision_analyzer"


@pytest.mark.asyncio
async def test_vision_analyze_image():
    """이미지 분석 테스트"""
    agent = get_vision_analyzer_agent()

    request = AgentRequest(
        task="analyze_image",
        payload={
            "image_url": "https://example.com/test-image.jpg",
            "analysis_type": "comprehensive"
        }
    )

    response = await agent.execute(request)

    assert response is not None
    assert len(response.outputs) > 0
    assert "description" in response.outputs[0].data


@pytest.mark.asyncio
async def test_vision_generate_description():
    """이미지 설명 생성 테스트"""
    agent = get_vision_analyzer_agent()

    request = AgentRequest(
        task="generate_description",
        payload={
            "image_url": "https://example.com/product.jpg",
            "style": "marketing"
        }
    )

    response = await agent.execute(request)

    assert response is not None
    assert len(response.outputs) > 0


@pytest.mark.asyncio
async def test_vision_detect_objects():
    """객체 감지 테스트"""
    agent = get_vision_analyzer_agent()

    request = AgentRequest(
        task="detect_objects",
        payload={
            "image_url": "https://example.com/scene.jpg"
        }
    )

    response = await agent.execute(request)

    assert response is not None
    assert len(response.outputs) > 0
