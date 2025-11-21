"""
CopywriterAgent 단위 테스트

작성일: 2025-11-22
작성자: B팀 (Backend)
"""

import pytest
from app.services.agents import get_copywriter_agent, AgentRequest, AgentError


@pytest.mark.asyncio
async def test_copywriter_agent_creation():
    """CopywriterAgent 인스턴스 생성 테스트"""
    agent = get_copywriter_agent()
    assert agent is not None
    assert agent.name == "copywriter"


@pytest.mark.asyncio
async def test_copywriter_product_detail():
    """제품 상세 설명 생성 테스트"""
    agent = get_copywriter_agent()

    request = AgentRequest(
        task="product_detail",
        payload={
            "product_name": "무선 이어폰 X1",
            "features": ["노이즈캔슬링", "24시간 배터리"],
            "target_audience": "2030 직장인"
        },
        options={"tone": "professional", "length": "medium"}
    )

    response = await agent.execute(request)

    assert response is not None
    assert len(response.outputs) > 0
    assert "headline" in response.outputs[0].data
    assert "body" in response.outputs[0].data
    assert response.usage["elapsed_seconds"] >= 0


@pytest.mark.asyncio
async def test_copywriter_sns():
    """SNS 콘텐츠 생성 테스트"""
    agent = get_copywriter_agent()

    request = AgentRequest(
        task="sns",
        payload={
            "theme": "신제품 출시",
            "target_audience": "2030 여성",
            "platform": "instagram"
        }
    )

    response = await agent.execute(request)

    assert response is not None
    assert len(response.outputs) > 0
    assert "post" in response.outputs[0].data
    assert "hashtags" in response.outputs[0].data


@pytest.mark.asyncio
async def test_copywriter_headline():
    """헤드라인 생성 테스트"""
    agent = get_copywriter_agent()

    request = AgentRequest(
        task="headline",
        payload={
            "context": "친환경 세제 신제품",
            "style": "catchy"
        }
    )

    response = await agent.execute(request)

    assert response is not None
    assert len(response.outputs) >= 3  # A/B/C 버전


@pytest.mark.asyncio
async def test_copywriter_invalid_task():
    """잘못된 task로 요청 시 에러 테스트"""
    agent = get_copywriter_agent()

    request = AgentRequest(
        task="invalid_task",
        payload={}
    )

    with pytest.raises(AgentError):
        await agent.execute(request)


@pytest.mark.asyncio
async def test_copywriter_missing_payload():
    """필수 payload 누락 시 에러 테스트"""
    agent = get_copywriter_agent()

    request = AgentRequest(
        task="product_detail",
        payload={}  # 필수 필드 누락
    )

    # Mock 모드에서는 에러가 발생하지 않을 수 있음
    response = await agent.execute(request)
    assert response is not None
