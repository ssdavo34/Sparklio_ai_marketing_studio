"""
Pytest Configuration and Fixtures

테스트 실행 시 사용되는 공통 설정 및 픽스처
"""

import pytest
import asyncio
from typing import Generator, AsyncGenerator
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings


# ========================================
# Database Fixtures
# ========================================

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def db_engine():
    """
    Create in-memory SQLite database for testing

    각 테스트마다 독립적인 DB 생성
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Create all tables
    Base.metadata.create_all(bind=engine)

    yield engine

    # Cleanup
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(db_engine) -> Generator[Session, None, None]:
    """
    Create database session for testing

    트랜잭션 롤백을 통해 테스트 간 격리 보장
    """
    connection = db_engine.connect()
    transaction = connection.begin()

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = SessionLocal()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """
    FastAPI Test Client with database override

    API 테스트 시 사용
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


# ========================================
# User & Authentication Fixtures
# ========================================

@pytest.fixture
def test_user_data():
    """Test user data"""
    return {
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpassword123",
        "full_name": "Test User"
    }


@pytest.fixture
def authenticated_client(client: TestClient, test_user_data: dict) -> TestClient:
    """
    Authenticated test client with JWT token

    인증이 필요한 API 테스트 시 사용
    """
    # Register user
    response = client.post("/api/v1/users/register", json=test_user_data)
    assert response.status_code == 201

    # Login
    login_data = {
        "email": test_user_data["email"],
        "password": test_user_data["password"]
    }
    response = client.post("/api/v1/users/login", json=login_data)
    assert response.status_code == 200

    token_data = response.json()
    token = token_data["access_token"]

    # Add token to client headers
    client.headers.update({"Authorization": f"Bearer {token}"})

    return client


# ========================================
# Brand & Project Fixtures
# ========================================

@pytest.fixture
def test_brand_data():
    """Test brand data"""
    return {
        "name": "Test Brand",
        "slug": "test-brand",
        "description": "A test brand for testing",
        "brand_kit": {
            "colors": {
                "primary": "#FF5733",
                "secondary": "#33FF57"
            },
            "fonts": {
                "heading": "Montserrat",
                "body": "Open Sans"
            }
        }
    }


@pytest.fixture
def test_project_data(test_brand):
    """Test project data"""
    return {
        "name": "Test Project",
        "slug": "test-project",
        "brand_id": str(test_brand.id),
        "project_type": "campaign",
        "brief": {
            "goal": "Test campaign goal",
            "target_audience": "Test audience",
            "budget": 10000
        }
    }


@pytest.fixture
def test_brand(authenticated_client: TestClient, test_brand_data: dict):
    """Create test brand"""
    response = authenticated_client.post("/api/v1/brands", json=test_brand_data)
    assert response.status_code == 201

    from app.schemas.brand import BrandResponse
    return BrandResponse(**response.json())


@pytest.fixture
def test_project(authenticated_client: TestClient, test_project_data: dict):
    """Create test project"""
    response = authenticated_client.post("/api/v1/projects", json=test_project_data)
    assert response.status_code == 201

    from app.schemas.project import ProjectResponse
    return ProjectResponse(**response.json())


# ========================================
# Agent Test Fixtures
# ========================================

@pytest.fixture
def mock_ollama_response():
    """Mock Ollama API response"""
    return {
        "model": "qwen2.5:7b",
        "response": "This is a mock response from Ollama",
        "done": True
    }


@pytest.fixture
def mock_comfyui_response():
    """Mock ComfyUI API response"""
    return {
        "prompt_id": "test-prompt-id",
        "status": "success"
    }


@pytest.fixture
def test_agent_request():
    """Test agent request data"""
    return {
        "request_id": "test-request-001",
        "source_agent": "TestAgent",
        "target_agent": "TargetAgent",
        "system_context": {
            "brand_id": "test-brand-id",
            "project_id": "test-project-id",
            "task_type": "test",
            "risk_level": "low"
        },
        "payload": {
            "test_data": "test value"
        }
    }


# ========================================
# Utility Functions
# ========================================

def assert_valid_uuid(value: str):
    """Assert that value is a valid UUID"""
    import uuid
    try:
        uuid.UUID(value)
        return True
    except ValueError:
        return False


def assert_datetime_format(value: str):
    """Assert that value is a valid ISO datetime"""
    from datetime import datetime
    try:
        datetime.fromisoformat(value.replace('Z', '+00:00'))
        return True
    except ValueError:
        return False
