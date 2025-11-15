"""
Prometheus Metrics Collection

시스템 모니터링을 위한 메트릭 정의 및 수집
"""

from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response
from typing import Dict, Any


# =============================================================================
# HTTP Request Metrics
# =============================================================================

request_counter = Counter(
    'sparklio_http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

request_latency = Histogram(
    'sparklio_http_request_duration_seconds',
    'HTTP request latency in seconds',
    ['method', 'endpoint'],
    buckets=(0.01, 0.05, 0.1, 0.5, 1.0, 2.5, 5.0, 10.0)
)


# =============================================================================
# Agent Execution Metrics
# =============================================================================

agent_execution_counter = Counter(
    'sparklio_agent_executions_total',
    'Total agent executions',
    ['agent_name', 'status']  # status: success, error, timeout
)

agent_latency = Histogram(
    'sparklio_agent_execution_duration_seconds',
    'Agent execution latency in seconds',
    ['agent_name'],
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0)
)


# =============================================================================
# LLM (Ollama) Metrics
# =============================================================================

llm_tokens_used = Counter(
    'sparklio_llm_tokens_total',
    'Total LLM tokens used',
    ['model', 'token_type']  # token_type: prompt, completion
)

llm_latency = Histogram(
    'sparklio_llm_request_duration_seconds',
    'LLM request latency in seconds',
    ['model'],
    buckets=(0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 30.0, 60.0)
)


# =============================================================================
# Workflow Metrics
# =============================================================================

workflow_counter = Counter(
    'sparklio_workflows_total',
    'Total workflow executions',
    ['workflow_type', 'status']  # status: completed, failed, cancelled
)

active_workflows = Gauge(
    'sparklio_active_workflows',
    'Number of currently active workflows',
    ['workflow_type']
)


# =============================================================================
# Context Metrics (for monitoring context window usage)
# =============================================================================

context_size_bytes = Histogram(
    'sparklio_context_size_bytes',
    'Context size in bytes for LLM requests',
    ['agent_name'],
    buckets=(1024, 4096, 16384, 65536, 262144, 1048576, 4194304)  # 1KB to 4MB
)


# =============================================================================
# Database Metrics
# =============================================================================

db_query_counter = Counter(
    'sparklio_db_queries_total',
    'Total database queries',
    ['operation', 'table']  # operation: select, insert, update, delete
)

db_query_latency = Histogram(
    'sparklio_db_query_duration_seconds',
    'Database query latency in seconds',
    ['operation', 'table'],
    buckets=(0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0)
)


# =============================================================================
# Metrics Endpoint
# =============================================================================

def metrics_endpoint() -> Response:
    """
    Prometheus metrics 엔드포인트

    Returns:
        Response: Prometheus 메트릭 데이터
    """
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


# =============================================================================
# Helper Functions (for easy metric recording)
# =============================================================================

def record_http_request(method: str, endpoint: str, status_code: int, duration: float):
    """
    HTTP 요청 메트릭 기록

    Args:
        method: HTTP 메소드
        endpoint: 엔드포인트 경로
        status_code: 응답 상태 코드
        duration: 요청 처리 시간 (초)
    """
    request_counter.labels(method=method, endpoint=endpoint, status_code=status_code).inc()
    request_latency.labels(method=method, endpoint=endpoint).observe(duration)


def record_agent_execution(agent_name: str, status: str, duration: float):
    """
    Agent 실행 메트릭 기록

    Args:
        agent_name: Agent 이름
        status: 실행 상태 (success, error, timeout)
        duration: 실행 시간 (초)
    """
    agent_execution_counter.labels(agent_name=agent_name, status=status).inc()
    agent_latency.labels(agent_name=agent_name).observe(duration)


def record_llm_usage(model: str, prompt_tokens: int, completion_tokens: int, duration: float):
    """
    LLM 사용 메트릭 기록

    Args:
        model: LLM 모델명
        prompt_tokens: 프롬프트 토큰 수
        completion_tokens: 생성된 토큰 수
        duration: 요청 시간 (초)
    """
    llm_tokens_used.labels(model=model, token_type='prompt').inc(prompt_tokens)
    llm_tokens_used.labels(model=model, token_type='completion').inc(completion_tokens)
    llm_latency.labels(model=model).observe(duration)


def record_workflow(workflow_type: str, status: str, active_count: int = None):
    """
    Workflow 메트릭 기록

    Args:
        workflow_type: Workflow 타입
        status: 실행 상태 (completed, failed, cancelled)
        active_count: 현재 활성 workflow 수 (optional)
    """
    workflow_counter.labels(workflow_type=workflow_type, status=status).inc()
    if active_count is not None:
        active_workflows.labels(workflow_type=workflow_type).set(active_count)


# =============================================================================
# Generator Metrics (Phase 4 추가)
# =============================================================================

generator_execution_counter = Counter(
    'sparklio_generator_executions_total',
    'Total generator executions',
    ['generator_kind', 'status']  # kind: brand_kit, product_detail, sns
)

generator_latency = Histogram(
    'sparklio_generator_execution_duration_seconds',
    'Generator execution latency in seconds',
    ['generator_kind'],
    buckets=(1.0, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0)
)


# =============================================================================
# Cache Metrics (Phase 4 추가)
# =============================================================================

cache_hit_counter = Counter(
    'sparklio_cache_hits_total',
    'Total cache hits',
    ['cache_type']  # cache_type: template, brand_learning
)

cache_miss_counter = Counter(
    'sparklio_cache_misses_total',
    'Total cache misses',
    ['cache_type']
)


# =============================================================================
# Document Metrics (Phase 4 추가)
# =============================================================================

document_operations_counter = Counter(
    'sparklio_document_operations_total',
    'Total document operations',
    ['operation']  # operation: save, load, update, delete
)

template_operations_counter = Counter(
    'sparklio_template_operations_total',
    'Total template operations',
    ['operation', 'status']  # operation: create, approve, reject, delete
)


# =============================================================================
# Helper Functions (Phase 4 추가)
# =============================================================================

def record_generator_execution(generator_kind: str, status: str, duration: float):
    """
    Generator 실행 메트릭 기록

    Args:
        generator_kind: Generator 유형 (brand_kit, product_detail, sns)
        status: 실행 상태 (success, error)
        duration: 실행 시간 (초)
    """
    generator_execution_counter.labels(generator_kind=generator_kind, status=status).inc()
    generator_latency.labels(generator_kind=generator_kind).observe(duration)


def record_cache_hit(cache_type: str):
    """
    캐시 HIT 기록

    Args:
        cache_type: 캐시 유형 (template, brand_learning)
    """
    cache_hit_counter.labels(cache_type=cache_type).inc()


def record_cache_miss(cache_type: str):
    """
    캐시 MISS 기록

    Args:
        cache_type: 캐시 유형 (template, brand_learning)
    """
    cache_miss_counter.labels(cache_type=cache_type).inc()


def record_document_operation(operation: str):
    """
    Document 작업 메트릭 기록

    Args:
        operation: 작업 유형 (save, load, update, delete)
    """
    document_operations_counter.labels(operation=operation).inc()


def record_template_operation(operation: str, status: str):
    """
    Template 작업 메트릭 기록

    Args:
        operation: 작업 유형 (create, approve, reject, delete)
        status: 상태
    """
    template_operations_counter.labels(operation=operation, status=status).inc()
