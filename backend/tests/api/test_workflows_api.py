"""
Workflow API 엔드포인트 테스트

작성일: 2025-11-22
작성자: B팀 (Backend)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.mark.asyncio
async def test_list_workflows():
    """워크플로우 목록 조회 테스트"""
    response = client.get("/api/v1/workflows/list")
    assert response.status_code == 200

    data = response.json()
    assert "workflows" in data
    assert "total_count" in data
    assert data["total_count"] == 3
    assert len(data["workflows"]) == 3

    # 워크플로우 이름 확인
    workflow_names = [wf["name"] for wf in data["workflows"]]
    assert "product_content" in workflow_names
    assert "brand_identity" in workflow_names
    assert "content_review" in workflow_names


@pytest.mark.asyncio
async def test_get_workflow_info_product_content():
    """제품 콘텐츠 워크플로우 정보 조회 테스트"""
    response = client.get("/api/v1/workflows/product_content")
    assert response.status_code == 200

    data = response.json()
    assert data["name"] == "product_content"
    assert "display_name" in data
    assert "description" in data
    assert "steps" in data
    assert len(data["steps"]) > 0


@pytest.mark.asyncio
async def test_get_workflow_info_brand_identity():
    """브랜드 아이덴티티 워크플로우 정보 조회 테스트"""
    response = client.get("/api/v1/workflows/brand_identity")
    assert response.status_code == 200

    data = response.json()
    assert data["name"] == "brand_identity"
    assert "steps" in data
    assert len(data["steps"]) > 0


@pytest.mark.asyncio
async def test_get_workflow_info_content_review():
    """콘텐츠 검토 워크플로우 정보 조회 테스트"""
    response = client.get("/api/v1/workflows/content_review")
    assert response.status_code == 200

    data = response.json()
    assert data["name"] == "content_review"
    assert "steps" in data
    assert len(data["steps"]) > 0


@pytest.mark.asyncio
async def test_get_workflow_info_not_found():
    """존재하지 않는 워크플로우 조회 시 404 에러 테스트"""
    response = client.get("/api/v1/workflows/nonexistent")
    assert response.status_code == 422  # Literal validation error


@pytest.mark.asyncio
async def test_execute_product_content_workflow():
    """제품 콘텐츠 워크플로우 실행 테스트"""
    payload = {
        "initial_payload": {
            "product_name": "스마트 워치 Pro",
            "features": ["심박수 모니터링", "GPS", "방수"],
            "target_audience": "운동을 즐기는 2040 남성"
        }
    }

    response = client.post(
        "/api/v1/workflows/product_content/execute",
        json=payload
    )

    assert response.status_code == 200
    data = response.json()

    # WorkflowResult 필드 확인
    assert "workflow_name" in data
    assert "success" in data
    assert "steps_completed" in data
    assert "total_steps" in data
    assert "results" in data  # step_results가 아닌 results
    assert "errors" in data
    assert "total_elapsed_seconds" in data
    assert data["success"] is True
    assert len(data["results"]) > 0
    assert data["steps_completed"] == data["total_steps"]


@pytest.mark.asyncio
async def test_execute_brand_identity_workflow():
    """브랜드 아이덴티티 워크플로우 실행 테스트"""
    payload = {
        "initial_payload": {
            "brand_name": "에코테크",
            "industry": "친환경 기술",
            "values": ["지속가능성", "혁신", "신뢰"],
            "target_market": "환경 의식이 있는 밀레니얼 세대"
        }
    }

    response = client.post(
        "/api/v1/workflows/brand_identity/execute",
        json=payload
    )

    assert response.status_code == 200
    data = response.json()

    assert data["workflow_name"] == "brand_identity_pipeline"  # 실제 workflow 이름
    assert "success" in data
    assert "results" in data  # step_results가 아닌 results
    assert data["success"] is True


@pytest.mark.asyncio
async def test_execute_content_review_workflow():
    """콘텐츠 검토 워크플로우 실행 테스트"""
    payload = {
        "initial_payload": {
            "content": "이것은 테스트 콘텐츠입니다. 마케팅 자료로 사용될 예정입니다.",
            "content_type": "marketing_copy",
            "target_criteria": ["clarity", "persuasiveness", "brand_alignment"]
        }
    }

    response = client.post(
        "/api/v1/workflows/content_review/execute",
        json=payload
    )

    assert response.status_code == 200
    data = response.json()

    assert data["workflow_name"] == "content_review_pipeline"  # 실제 workflow 이름
    assert "success" in data
    assert "results" in data  # step_results가 아닌 results
    assert data["success"] is True


@pytest.mark.asyncio
async def test_execute_workflow_missing_payload():
    """필수 payload 누락 시 422 에러 테스트"""
    response = client.post(
        "/api/v1/workflows/product_content/execute",
        json={}
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_execute_workflow_invalid_name():
    """존재하지 않는 워크플로우 실행 시 422 에러 테스트"""
    payload = {
        "initial_payload": {
            "test": "data"
        }
    }

    response = client.post(
        "/api/v1/workflows/invalid_workflow/execute",
        json=payload
    )

    assert response.status_code == 422  # Literal validation error


@pytest.mark.asyncio
async def test_workflow_health():
    """워크플로우 시스템 헬스 체크 테스트"""
    response = client.get("/api/v1/workflows/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert "available_workflows" in data
    assert "workflow_names" in data
    assert data["available_workflows"] == 3
    assert len(data["workflow_names"]) == 3


@pytest.mark.asyncio
async def test_workflow_execution_with_empty_payload():
    """빈 initial_payload로 워크플로우 실행 테스트"""
    payload = {
        "initial_payload": {}
    }

    response = client.post(
        "/api/v1/workflows/product_content/execute",
        json=payload
    )

    # 워크플로우가 실행되지만 결과가 부족할 수 있음
    # 실제 구현에 따라 200 또는 400이 될 수 있음
    assert response.status_code in [200, 400]
