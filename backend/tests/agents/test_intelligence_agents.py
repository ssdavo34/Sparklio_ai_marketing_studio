"""
Intelligence Agents 단위 테스트

작성일: 2025-11-22
작성자: B팀 (Backend)
"""

import pytest
from app.services.agents import (
    get_trend_collector_agent,
    get_data_cleaner_agent,
    create_embedder_agent,
    create_rag_agent,
    create_ingestor_agent,
    create_performance_analyzer_agent,
    create_self_learning_agent,
    AgentRequest,
    AgentError
)


@pytest.mark.asyncio
async def test_trend_collector_agent_creation():
    """TrendCollectorAgent 인스턴스 생성 테스트"""
    agent = get_trend_collector_agent()
    assert agent is not None
    assert agent.name == "trend_collector"


@pytest.mark.asyncio
async def test_data_cleaner_agent_creation():
    """DataCleanerAgent 인스턴스 생성 테스트"""
    agent = get_data_cleaner_agent()
    assert agent is not None
    assert agent.name == "data_cleaner"


@pytest.mark.asyncio
async def test_embedder_agent_creation():
    """EmbedderAgent 인스턴스 생성 테스트"""
    agent = create_embedder_agent()
    assert agent is not None
    assert agent.name == "embedder"


@pytest.mark.asyncio
async def test_rag_agent_creation():
    """RAGAgent 인스턴스 생성 테스트"""
    agent = create_rag_agent()
    assert agent is not None
    assert agent.name == "rag"


@pytest.mark.asyncio
async def test_ingestor_agent_creation():
    """IngestorAgent 인스턴스 생성 테스트"""
    agent = create_ingestor_agent()
    assert agent is not None
    assert agent.name == "ingestor"


@pytest.mark.asyncio
async def test_performance_analyzer_agent_creation():
    """PerformanceAnalyzerAgent 인스턴스 생성 테스트"""
    agent = create_performance_analyzer_agent()
    assert agent is not None
    assert agent.name == "performance_analyzer"


@pytest.mark.asyncio
async def test_self_learning_agent_creation():
    """SelfLearningAgent 인스턴스 생성 테스트"""
    agent = create_self_learning_agent()
    assert agent is not None
    assert agent.name == "self_learning"


@pytest.mark.asyncio
async def test_trend_collector_collect():
    """트렌드 수집 테스트"""
    agent = get_trend_collector_agent()

    request = AgentRequest(
        task="collect_trends",
        payload={
            "source": "twitter",
            "keywords": ["AI", "마케팅"],
            "timeframe": "24h"
        }
    )

    response = await agent.execute(request)
    assert response is not None
    assert len(response.outputs) > 0


@pytest.mark.asyncio
async def test_embedder_embed_text():
    """텍스트 임베딩 테스트"""
    agent = create_embedder_agent()

    request = AgentRequest(
        task="embed_text",
        payload={
            "text": "이것은 테스트 텍스트입니다."
        }
    )

    response = await agent.execute(request)
    assert response is not None
    assert len(response.outputs) > 0


@pytest.mark.asyncio
async def test_rag_search_and_generate():
    """RAG 검색 및 생성 테스트"""
    agent = create_rag_agent()

    request = AgentRequest(
        task="search_and_generate",
        payload={
            "query": "마케팅 전략이란?",
            "top_k": 5
        }
    )

    response = await agent.execute(request)
    assert response is not None
    assert len(response.outputs) > 0
