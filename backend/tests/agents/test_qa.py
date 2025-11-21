"""
QAAgent 단위 테스트

작성일: 2025-11-22
작성자: B팀 (Backend)
"""

import pytest
from app.services.agents import create_qa_agent, AgentRequest, AgentError


@pytest.mark.asyncio
async def test_qa_agent_creation():
    """QAAgent 인스턴스 생성 테스트"""
    agent = create_qa_agent()
    assert agent is not None
    assert agent.name == "qa"


@pytest.mark.asyncio
async def test_qa_quality_check():
    """품질 검사 테스트"""
    agent = create_qa_agent()

    request = AgentRequest(
        task="quality_check",
        payload={
            "content_type": "text",
            "content": "이것은 테스트 콘텐츠입니다. 품질을 확인해주세요.",
            "criteria": ["grammar", "clarity", "tone"]
        }
    )

    response = await agent.execute(request)

    assert response is not None
    assert len(response.outputs) > 0
    assert "quality_score" in response.outputs[0].data
    assert "issues" in response.outputs[0].data


@pytest.mark.asyncio
async def test_qa_brand_compliance():
    """브랜드 가이드라인 준수 검사 테스트"""
    agent = create_qa_agent()

    request = AgentRequest(
        task="brand_compliance",
        payload={
            "content": "테스트 콘텐츠",
            "brand_guidelines": {
                "tone": "professional",
                "keywords": ["혁신", "신뢰"],
                "forbidden_words": ["싸다", "저렴"]
            }
        }
    )

    response = await agent.execute(request)

    assert response is not None
    assert len(response.outputs) > 0


@pytest.mark.asyncio
async def test_qa_grammar_check():
    """문법 검사 테스트"""
    agent = create_qa_agent()

    request = AgentRequest(
        task="grammar_check",
        payload={
            "text": "이것은 테스트 문장입니다",
            "language": "ko"
        }
    )

    response = await agent.execute(request)

    assert response is not None
    assert len(response.outputs) > 0
