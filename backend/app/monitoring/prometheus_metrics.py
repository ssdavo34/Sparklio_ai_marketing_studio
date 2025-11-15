"""
Prometheus Metrics for Sparklio V4

This module provides Prometheus-compatible metrics for monitoring
FastAPI application, agents, and workflows.
"""

from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST, REGISTRY
from fastapi import Response
import time
import logging

logger = logging.getLogger(__name__)

# ======================================================================
# HTTP Request Metrics
# ======================================================================

request_counter = Counter(
    'sparklio_http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

request_latency = Histogram(
    'sparklio_http_request_duration_seconds',
    'HTTP request latency in seconds',
    ['method', 'endpoint']
)

# ======================================================================
# Agent Metrics
# ======================================================================

agent_execution_counter = Counter(
    'sparklio_agent_executions_total',
    'Total agent executions',
    ['agent_name', 'status']
)

agent_latency = Histogram(
    'sparklio_agent_duration_seconds',
    'Agent execution duration in seconds',
    ['agent_name'],
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0, 120.0)
)

agent_error_counter = Counter(
    'sparklio_agent_errors_total',
    'Total agent errors',
    ['agent_name', 'error_type']
)

# ======================================================================
# Workflow Metrics
# ======================================================================

workflow_counter = Counter(
    'sparklio_workflows_total',
    'Total workflows',
    ['status']
)

active_workflows = Gauge(
    'sparklio_active_workflows',
    'Number of currently running workflows'
)

workflow_latency = Histogram(
    'sparklio_workflow_duration_seconds',
    'Workflow execution duration in seconds',
    buckets=(1.0, 5.0, 10.0, 15.0, 20.0, 30.0, 60.0, 120.0)
)

# ======================================================================
# Context Metrics
# ======================================================================

context_size_bytes = Histogram(
    'sparklio_context_size_bytes',
    'Context size in bytes',
    ['context_layer'],
    buckets=(100, 500, 1000, 5000, 10000, 20000, 50000)
)

context_minimization_ratio = Histogram(
    'sparklio_context_minimization_ratio',
    'Context size reduction ratio (before/after)',
    buckets=(0.1, 0.3, 0.5, 0.7, 0.9, 1.0, 1.5, 2.0)
)

# ======================================================================
# SmartRouter Metrics
# ======================================================================

router_requests = Counter(
    'sparklio_router_requests_total',
    'Total SmartRouter requests',
    ['intent_type']
)

router_model_selection = Counter(
    'sparklio_router_model_selections_total',
    'Model selections by SmartRouter',
    ['selected_model', 'risk_level']
)

# ======================================================================
# Database Metrics
# ======================================================================

db_connection_pool_size = Gauge(
    'sparklio_db_connection_pool_size',
    'Database connection pool size'
)

db_query_duration = Histogram(
    'sparklio_db_query_duration_seconds',
    'Database query duration',
    ['query_type'],
    buckets=(0.001, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0)
)

# ======================================================================
# Celery Metrics
# ======================================================================

celery_task_counter = Counter(
    'sparklio_celery_tasks_total',
    'Total Celery tasks',
    ['task_name', 'status']
)

celery_queue_size = Gauge(
    'sparklio_celery_queue_size',
    'Celery queue size',
    ['queue_name']
)

# ======================================================================
# Asset Generation Metrics
# ======================================================================

asset_generation_counter = Counter(
    'sparklio_assets_generated_total',
    'Total assets generated',
    ['asset_type', 'status']
)

asset_generation_latency = Histogram(
    'sparklio_asset_generation_duration_seconds',
    'Asset generation duration',
    ['asset_type'],
    buckets=(1.0, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0)
)

# ======================================================================
# LLM Metrics
# ======================================================================

llm_tokens_used = Counter(
    'sparklio_llm_tokens_used_total',
    'Total LLM tokens used',
    ['model_name', 'token_type']  # token_type: prompt or completion
)

llm_api_calls = Counter(
    'sparklio_llm_api_calls_total',
    'Total LLM API calls',
    ['model_name', 'status']
)

llm_latency = Histogram(
    'sparklio_llm_call_duration_seconds',
    'LLM API call duration',
    ['model_name'],
    buckets=(0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0)
)

# ======================================================================
# Helper Functions
# ======================================================================

def metrics_endpoint() -> Response:
    """
    Generate Prometheus metrics endpoint response

    Returns:
        FastAPI Response with Prometheus metrics
    """
    return Response(content=generate_latest(REGISTRY), media_type=CONTENT_TYPE_LATEST)


def record_agent_execution(agent_name: str, duration: float, status: str = "success"):
    """
    Record agent execution metrics

    Args:
        agent_name: Name of the agent
        duration: Execution duration in seconds
        status: Status (success, error, partial)
    """
    agent_execution_counter.labels(agent_name=agent_name, status=status).inc()
    agent_latency.labels(agent_name=agent_name).observe(duration)
    logger.debug(f"Recorded {agent_name} execution: {duration:.2f}s ({status})")


def record_agent_error(agent_name: str, error_type: str):
    """
    Record agent error

    Args:
        agent_name: Name of the agent
        error_type: Type of error
    """
    agent_error_counter.labels(agent_name=agent_name, error_type=error_type).inc()
    logger.warning(f"Recorded {agent_name} error: {error_type}")


def record_workflow_execution(status: str, duration: float = None):
    """
    Record workflow execution

    Args:
        status: Workflow status (completed, failed, cancelled)
        duration: Execution duration in seconds (optional)
    """
    workflow_counter.labels(status=status).inc()
    if duration:
        workflow_latency.observe(duration)
    logger.debug(f"Recorded workflow execution: {status}")


def record_context_size(context_layer: str, size_bytes: int):
    """
    Record context size

    Args:
        context_layer: Context layer (system, task, working, ephemeral)
        size_bytes: Size in bytes
    """
    context_size_bytes.labels(context_layer=context_layer).observe(size_bytes)


def record_context_minimization(before_size: int, after_size: int):
    """
    Record context minimization ratio

    Args:
        before_size: Context size before minimization
        after_size: Context size after minimization
    """
    ratio = before_size / after_size if after_size > 0 else 1.0
    context_minimization_ratio.observe(ratio)
    logger.debug(f"Context minimization: {before_size}B → {after_size}B (ratio: {ratio:.2f})")


def record_router_request(intent_type: str, selected_model: str, risk_level: str):
    """
    Record SmartRouter request

    Args:
        intent_type: Classified intent
        selected_model: Selected model
        risk_level: Risk level (low, medium, high)
    """
    router_requests.labels(intent_type=intent_type).inc()
    router_model_selection.labels(selected_model=selected_model, risk_level=risk_level).inc()


def record_llm_call(model_name: str, duration: float, prompt_tokens: int, completion_tokens: int, status: str = "success"):
    """
    Record LLM API call

    Args:
        model_name: LLM model name
        duration: Call duration in seconds
        prompt_tokens: Number of prompt tokens
        completion_tokens: Number of completion tokens
        status: Call status (success, error)
    """
    llm_api_calls.labels(model_name=model_name, status=status).inc()
    llm_latency.labels(model_name=model_name).observe(duration)
    llm_tokens_used.labels(model_name=model_name, token_type="prompt").inc(prompt_tokens)
    llm_tokens_used.labels(model_name=model_name, token_type="completion").inc(completion_tokens)

    total_tokens = prompt_tokens + completion_tokens
    logger.debug(f"LLM call {model_name}: {duration:.2f}s, {total_tokens} tokens ({status})")


def increment_active_workflows():
    """Increment active workflows gauge"""
    active_workflows.inc()


def decrement_active_workflows():
    """Decrement active workflows gauge"""
    active_workflows.dec()
