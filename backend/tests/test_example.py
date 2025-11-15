"""
Example Test File

테스트 작성 예시 및 템플릿
"""

import pytest
from fastapi.testclient import TestClient


# ========================================
# Unit Test Example
# ========================================

@pytest.mark.unit
def test_example_unit():
    """Example unit test"""
    assert 1 + 1 == 2


# ========================================
# API Test Example
# ========================================

@pytest.mark.api
def test_health_check(client: TestClient):
    """Test health check endpoint"""
    response = client.get("/health")

    assert response.status_code == 200

    data = response.json()
    assert "status" in data
    assert "services" in data
    assert data["services"]["api"] == "ok"


@pytest.mark.api
def test_root_endpoint(client: TestClient):
    """Test root endpoint"""
    response = client.get("/")

    assert response.status_code == 200

    data = response.json()
    assert data["service"] == "Sparklio AI Marketing Studio"
    assert data["status"] == "running"


# ========================================
# Authentication Test Example
# ========================================

@pytest.mark.api
def test_user_registration(client: TestClient, test_user_data: dict):
    """Test user registration"""
    response = client.post("/api/v1/users/register", json=test_user_data)

    assert response.status_code == 201

    data = response.json()
    assert data["email"] == test_user_data["email"]
    assert data["username"] == test_user_data["username"]
    assert "id" in data
    assert "hashed_password" not in data  # Password should not be returned


@pytest.mark.api
def test_user_login(client: TestClient, test_user_data: dict):
    """Test user login"""
    # Register first
    client.post("/api/v1/users/register", json=test_user_data)

    # Login
    login_data = {
        "email": test_user_data["email"],
        "password": test_user_data["password"]
    }
    response = client.post("/api/v1/users/login", json=login_data)

    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data


# ========================================
# Database Test Example
# ========================================

@pytest.mark.database
def test_brand_crud(authenticated_client: TestClient, test_brand_data: dict):
    """Test brand CRUD operations"""
    # Create
    response = authenticated_client.post("/api/v1/brands", json=test_brand_data)
    assert response.status_code == 201

    brand_id = response.json()["id"]

    # Read
    response = authenticated_client.get(f"/api/v1/brands/{brand_id}")
    assert response.status_code == 200
    assert response.json()["name"] == test_brand_data["name"]

    # Update
    update_data = {"name": "Updated Brand Name"}
    response = authenticated_client.patch(f"/api/v1/brands/{brand_id}", json=update_data)
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Brand Name"

    # Delete
    response = authenticated_client.delete(f"/api/v1/brands/{brand_id}")
    assert response.status_code == 204


# ========================================
# Agent Test Example (Template)
# ========================================

@pytest.mark.agent
@pytest.mark.skip(reason="Agent not implemented yet")
def test_brief_agent():
    """Test BriefAgent - Template for future implementation"""
    # TODO: Implement when BriefAgent is ready
    pass
