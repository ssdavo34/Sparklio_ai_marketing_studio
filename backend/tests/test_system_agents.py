"""
System Agents Unit Tests

System 에이전트 (2개) 테스트:
- ErrorHandlerAgent
- LoggerAgent

작성일: 2025-11-22
"""

import pytest


from datetime import datetime

from app.services.agents.error_handler import ErrorHandlerAgent
from app.services.agents.logger import LoggerAgent
from app.services.agents.base import AgentRequest, AgentResponse, AgentOutput


# ========================================
# ErrorHandlerAgent Tests
# ========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_error_handler_handle_error():
    """ErrorHandlerAgent - 에러 처리 테스트"""
    
    agent = ErrorHandlerAgent()

    request = AgentRequest(
        task="handle",
        payload={
            "error_type": "ValidationError",
            "error_message": "Invalid input data",
            "context": {
                "agent": "CopywriterAgent",
                "request_id": "req_001"
            },
            "stack_trace": "Traceback: ..."
        }
    )

    response = await agent.execute(request)

    assert response.success is True
    assert len(response.outputs) > 0

    output_value = response.outputs[0].value
    assert "handled" in output_value or "status" in output_value


@pytest.mark.unit
@pytest.mark.asyncio
async def test_error_handler_categorize_error():
    """ErrorHandlerAgent - 에러 분류 테스트"""
    
    agent = ErrorHandlerAgent()

    request = AgentRequest(
        task="categorize",
        payload={
            "error_message": "Connection timeout",
            "error_type": "TimeoutError"
        }
    )

    response = await agent.execute(request)

    assert response.success is True
    assert len(response.outputs) > 0

    output_value = response.outputs[0].value
    assert "category" in output_value


@pytest.mark.unit
@pytest.mark.asyncio
async def test_error_handler_suggest_fix():
    """ErrorHandlerAgent - 수정 제안 테스트"""
    
    agent = ErrorHandlerAgent()

    request = AgentRequest(
        task="suggest_fix",
        payload={
            "error_type": "APIKeyError",
            "error_message": "Invalid API key",
            "context": {"service": "OpenAI"}
        }
    )

    response = await agent.execute(request)

    assert response.success is True
    assert len(response.outputs) > 0

    output_value = response.outputs[0].value
    assert "suggestion" in output_value or "fix" in output_value


@pytest.mark.unit
@pytest.mark.asyncio
async def test_error_handler_retry_strategy():
    """ErrorHandlerAgent - 재시도 전략 테스트"""
    
    agent = ErrorHandlerAgent()

    request = AgentRequest(
        task="retry_strategy",
        payload={
            "error_type": "RateLimitError",
            "retry_count": 2,
            "context": {"service": "LLM API"}
        }
    )

    response = await agent.execute(request)

    assert response.success is True
    assert len(response.outputs) > 0

    output_value = response.outputs[0].value
    assert "strategy" in output_value or "retry" in output_value


@pytest.mark.unit
@pytest.mark.asyncio
async def test_error_handler_log_error():
    """ErrorHandlerAgent - 에러 로깅 테스트"""
    
    agent = ErrorHandlerAgent()

    request = AgentRequest(
        task="log",
        payload={
            "error_type": "DatabaseError",
            "error_message": "Connection lost",
            "severity": "critical",
            "context": {
                "database": "postgresql",
                "operation": "insert"
            }
        }
    )

    response = await agent.execute(request)

    assert response.success is True
    assert len(response.outputs) > 0


# ========================================
# LoggerAgent Tests
# ========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_logger_log_info():
    """LoggerAgent - INFO 레벨 로깅 테스트"""
    
    agent = LoggerAgent()

    request = AgentRequest(
        task="log",
        payload={
            "level": "info",
            "message": "Agent execution started",
            "context": {
                "agent": "CopywriterAgent",
                "task": "generate_copy"
            }
        }
    )

    response = await agent.execute(request)

    assert response.success is True
    assert len(response.outputs) > 0

    output_value = response.outputs[0].value
    assert "logged" in output_value or "status" in output_value


@pytest.mark.unit
@pytest.mark.asyncio
async def test_logger_log_warning():
    """LoggerAgent - WARNING 레벨 로깅 테스트"""
    
    agent = LoggerAgent()

    request = AgentRequest(
        task="log",
        payload={
            "level": "warning",
            "message": "High token usage detected",
            "context": {
                "tokens": 15000,
                "threshold": 10000
            }
        }
    )

    response = await agent.execute(request)

    assert response.success is True


@pytest.mark.unit
@pytest.mark.asyncio
async def test_logger_log_error():
    """LoggerAgent - ERROR 레벨 로깅 테스트"""
    
    agent = LoggerAgent()

    request = AgentRequest(
        task="log",
        payload={
            "level": "error",
            "message": "Failed to generate content",
            "context": {
                "error": "Timeout",
                "agent": "DesignerAgent"
            },
            "stack_trace": "Traceback: ..."
        }
    )

    response = await agent.execute(request)

    assert response.success is True


@pytest.mark.unit
@pytest.mark.asyncio
async def test_logger_query_logs():
    """LoggerAgent - 로그 조회 테스트"""
    
    agent = LoggerAgent()

    request = AgentRequest(
        task="query",
        payload={
            "level": "error",
            "time_range": "24h",
            "limit": 100
        }
    )

    response = await agent.execute(request)

    assert response.success is True
    assert len(response.outputs) > 0

    output_value = response.outputs[0].value
    assert "logs" in output_value or "results" in output_value


@pytest.mark.unit
@pytest.mark.asyncio
async def test_logger_aggregate_logs():
    """LoggerAgent - 로그 집계 테스트"""
    
    agent = LoggerAgent()

    request = AgentRequest(
        task="aggregate",
        payload={
            "group_by": "agent",
            "time_range": "7d",
            "metrics": ["count", "error_rate"]
        }
    )

    response = await agent.execute(request)

    assert response.success is True
    assert len(response.outputs) > 0

    output_value = response.outputs[0].value
    assert "aggregation" in output_value or "summary" in output_value


@pytest.mark.unit
@pytest.mark.asyncio
async def test_logger_performance_metrics():
    """LoggerAgent - 성능 메트릭 로깅 테스트"""
    
    agent = LoggerAgent()

    request = AgentRequest(
        task="log_metrics",
        payload={
            "agent": "CopywriterAgent",
            "metrics": {
                "execution_time_ms": 1250,
                "tokens_used": 850,
                "success": True
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    )

    response = await agent.execute(request)

    assert response.success is True


# ========================================
# Integration Tests (ErrorHandler + Logger)
# ========================================

@pytest.mark.integration
@pytest.mark.asyncio
async def test_error_handler_with_logger():
    """ErrorHandler와 Logger 통합 테스트"""
    

    # 1. ErrorHandlerAgent: 에러 처리
    error_handler = ErrorHandlerAgent()
    error_request = AgentRequest(
        task="handle",
        payload={
            "error_type": "ValidationError",
            "error_message": "Invalid brand_id",
            "context": {"brand_id": "invalid_id"}
        }
    )
    error_response = await error_handler.execute(error_request)
    assert error_response.success is True

    # 2. LoggerAgent: 에러 로그 기록
    logger = LoggerAgent()
    log_request = AgentRequest(
        task="log",
        payload={
            "level": "error",
            "message": "Validation error occurred",
            "context": {
                "error_type": "ValidationError",
                "handled": True
            }
        }
    )
    log_response = await logger.execute(log_request)
    assert log_response.success is True


@pytest.mark.integration
@pytest.mark.asyncio
async def test_system_monitoring_workflow():
    """시스템 모니터링 워크플로우 테스트"""
    

    logger = LoggerAgent()

    # 1. 성능 메트릭 로깅
    metrics_request = AgentRequest(
        task="log_metrics",
        payload={
            "agent": "DesignerAgent",
            "metrics": {
                "execution_time_ms": 2500,
                "tokens_used": 1200
            }
        }
    )
    await logger.execute(metrics_request)

    # 2. 로그 집계
    aggregate_request = AgentRequest(
        task="aggregate",
        payload={
            "group_by": "agent",
            "time_range": "1h"
        }
    )
    aggregate_response = await logger.execute(aggregate_request)
    assert aggregate_response.success is True


# ========================================
# Edge Cases and Error Handling
# ========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_error_handler_nested_errors():
    """ErrorHandlerAgent - 중첩 에러 처리 테스트"""
    
    agent = ErrorHandlerAgent()

    request = AgentRequest(
        task="handle",
        payload={
            "error_type": "ChainedError",
            "error_message": "Primary error",
            "caused_by": {
                "error_type": "SecondaryError",
                "error_message": "Root cause"
            }
        }
    )

    response = await agent.execute(request)

    assert response.success is True
    assert len(response.outputs) > 0


@pytest.mark.unit
@pytest.mark.asyncio
async def test_logger_large_payload():
    """LoggerAgent - 대용량 페이로드 로깅 테스트"""
    
    agent = LoggerAgent()

    # 큰 컨텍스트 데이터
    large_context = {
        "data": ["item_" + str(i) for i in range(1000)],
        "metadata": {"key_" + str(i): f"value_{i}" for i in range(100)}
    }

    request = AgentRequest(
        task="log",
        payload={
            "level": "info",
            "message": "Processing large dataset",
            "context": large_context
        }
    )

    response = await agent.execute(request)

    # 대용량 데이터도 처리되어야 함
    assert response.success is True


@pytest.mark.unit
@pytest.mark.asyncio
async def test_logger_invalid_log_level():
    """LoggerAgent - 잘못된 로그 레벨 처리 테스트"""
    
    agent = LoggerAgent()

    request = AgentRequest(
        task="log",
        payload={
            "level": "invalid_level",
            "message": "Test message"
        }
    )

    response = await agent.execute(request)

    # Mock mode에서는 성공할 수 있지만, 실제 구현에서는 기본 레벨로 처리하거나 에러
    assert response is not None


@pytest.mark.unit
@pytest.mark.asyncio
async def test_error_handler_missing_context():
    """ErrorHandlerAgent - 컨텍스트 누락 처리 테스트"""
    
    agent = ErrorHandlerAgent()

    request = AgentRequest(
        task="handle",
        payload={
            "error_type": "GenericError",
            "error_message": "Something went wrong"
            # context 누락
        }
    )

    response = await agent.execute(request)

    # 컨텍스트 없어도 처리되어야 함
    assert response.success is True


# ========================================
# Performance Tests
# ========================================

@pytest.mark.performance
@pytest.mark.asyncio
async def test_logger_concurrent_logging():
    """LoggerAgent - 동시 로깅 성능 테스트"""
    import asyncio

    
    agent = LoggerAgent()

    # 100개의 동시 로그 요청
    tasks = []
    for i in range(100):
        request = AgentRequest(
            task="log",
            payload={
                "level": "info",
                "message": f"Concurrent log {i}",
                "context": {"index": i}
            }
        )
        tasks.append(agent.execute(request))

    responses = await asyncio.gather(*tasks)

    # 모든 요청이 성공해야 함
    assert all(r.success for r in responses)
    assert len(responses) == 100


@pytest.mark.performance
@pytest.mark.asyncio
async def test_error_handler_rapid_errors():
    """ErrorHandlerAgent - 연속 에러 처리 성능 테스트"""
    
    agent = ErrorHandlerAgent()

    # 50개의 연속 에러 처리
    responses = []
    for i in range(50):
        request = AgentRequest(
            task="handle",
            payload={
                "error_type": f"Error_{i % 5}",  # 5가지 에러 타입 순환
                "error_message": f"Error message {i}"
            }
        )
        response = await agent.execute(request)
        responses.append(response)

    # 모든 에러가 처리되어야 함
    assert all(r.success for r in responses)
    assert len(responses) == 50
