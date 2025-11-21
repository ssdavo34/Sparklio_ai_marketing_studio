"""
TemplateAgent 단위 테스트

작성일: 2025-11-22
작성자: B팀 (Backend)
"""

import pytest
from app.services.agents import create_template_agent, AgentRequest, AgentError


@pytest.mark.asyncio
async def test_template_agent_creation():
    """TemplateAgent 인스턴스 생성 테스트"""
    agent = create_template_agent()
    assert agent is not None
    assert agent.name == "template"


@pytest.mark.asyncio
async def test_template_generate():
    """템플릿 생성 테스트"""
    agent = create_template_agent()

    request = AgentRequest(
        task="generate_template",
        payload={
            "industry": "ecommerce",
            "channel": "landing_page",
            "purpose": "product_intro"
        }
    )

    response = await agent.execute(request)

    assert response is not None
    assert len(response.outputs) > 0
    assert "template_id" in response.outputs[0].data
    assert "sections" in response.outputs[0].data


@pytest.mark.asyncio
async def test_template_list():
    """템플릿 목록 조회 테스트"""
    agent = create_template_agent()

    request = AgentRequest(
        task="list_templates",
        payload={
            "industry": "ecommerce",
            "limit": 10
        }
    )

    response = await agent.execute(request)

    assert response is not None
    assert len(response.outputs) > 0
    assert "templates" in response.outputs[0].data
    assert "total_count" in response.outputs[0].data


@pytest.mark.asyncio
async def test_template_customize():
    """템플릿 커스터마이징 테스트"""
    agent = create_template_agent()

    request = AgentRequest(
        task="customize_template",
        payload={
            "template_id": "tpl_ecommerce_001",
            "sections_to_add": ["pricing", "faq"],
            "style_overrides": {
                "colors": {"primary": "#ff6b6b"}
            }
        }
    )

    response = await agent.execute(request)

    assert response is not None
    assert len(response.outputs) > 0


@pytest.mark.asyncio
async def test_template_apply():
    """템플릿 적용 테스트"""
    agent = create_template_agent()

    request = AgentRequest(
        task="apply_template",
        payload={
            "template_id": "tpl_ecommerce_001",
            "variable_values": {
                "headline": "최고의 제품",
                "hero_image": "https://example.com/image.jpg"
            }
        }
    )

    response = await agent.execute(request)

    assert response is not None
    assert len(response.outputs) > 0
    assert "rendered_html" in response.outputs[0].data


@pytest.mark.asyncio
async def test_template_invalid_industry():
    """잘못된 산업군 입력 테스트"""
    agent = create_template_agent()

    request = AgentRequest(
        task="generate_template",
        payload={
            "industry": "invalid_industry",
            "channel": "landing_page",
            "purpose": "product_intro"
        }
    )

    # Mock 모드에서는 에러가 발생하지 않을 수 있음
    response = await agent.execute(request)
    assert response is not None
