"""
Agent API 엔드포인트 테스트

작성일: 2025-11-22
작성자: B팀 (Backend)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_agents():
    """Agent 목록 조회 API 테스트"""
    response = client.get("/api/v1/agents/list")
    assert response.status_code == 200

    data = response.json()
    assert "agents" in data
    assert len(data["agents"]) == 12  # 12개 Agent

    # 모든 Agent가 필수 필드를 가지고 있는지 확인
    for agent in data["agents"]:
        assert "name" in agent
        assert "description" in agent
        assert "tasks" in agent


def test_get_agent_info():
    """특정 Agent 정보 조회 API 테스트"""
    response = client.get("/api/v1/agents/copywriter/info")
    assert response.status_code == 200

    data = response.json()
    assert data["name"] == "copywriter"
    assert "description" in data
    assert "tasks" in data


def test_get_agent_info_not_found():
    """존재하지 않는 Agent 조회 시 404 테스트"""
    response = client.get("/api/v1/agents/nonexistent/info")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_execute_copywriter():
    """CopywriterAgent 실행 API 테스트"""
    payload = {
        "task": "product_detail",
        "payload": {
            "product_name": "무선 이어폰 X1",
            "features": ["노이즈캔슬링", "24시간 배터리"],
            "target_audience": "2030 직장인"
        },
        "options": {
            "tone": "professional",
            "length": "medium"
        }
    }

    response = client.post("/api/v1/agents/copywriter/execute", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert "outputs" in data
    assert "usage" in data
    assert "meta" in data
    assert len(data["outputs"]) > 0


@pytest.mark.asyncio
async def test_execute_template():
    """TemplateAgent 실행 API 테스트"""
    payload = {
        "task": "generate_template",
        "payload": {
            "industry": "ecommerce",
            "channel": "landing_page",
            "purpose": "product_intro"
        }
    }

    response = client.post("/api/v1/agents/template/execute", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert "outputs" in data
    assert len(data["outputs"]) > 0


@pytest.mark.asyncio
async def test_execute_pm():
    """PMAgent 실행 API 테스트"""
    payload = {
        "task": "plan_workflow",
        "payload": {
            "goal": "신제품 마케팅 캠페인 실행"
        }
    }

    response = client.post("/api/v1/agents/pm/execute", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert "outputs" in data


@pytest.mark.asyncio
async def test_execute_qa():
    """QAAgent 실행 API 테스트"""
    payload = {
        "task": "quality_check",
        "payload": {
            "content_type": "text",
            "content": "테스트 콘텐츠입니다."
        }
    }

    response = client.post("/api/v1/agents/qa/execute", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert "outputs" in data


@pytest.mark.asyncio
async def test_execute_vision_analyzer():
    """VisionAnalyzerAgent 실행 API 테스트"""
    payload = {
        "task": "analyze_image",
        "payload": {
            "image_url": "https://example.com/test.jpg"
        }
    }

    response = client.post("/api/v1/agents/vision_analyzer/execute", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert "outputs" in data


def test_execute_invalid_agent():
    """존재하지 않는 Agent 실행 시 404 테스트"""
    payload = {
        "task": "test",
        "payload": {}
    }

    response = client.post("/api/v1/agents/nonexistent/execute", json=payload)
    assert response.status_code == 422  # Validation error


def test_execute_missing_payload():
    """필수 필드 누락 시 422 테스트"""
    payload = {
        "task": "product_detail"
        # payload 누락
    }

    response = client.post("/api/v1/agents/copywriter/execute", json=payload)
    assert response.status_code == 422  # Validation error
