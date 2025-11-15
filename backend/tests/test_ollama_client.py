"""
Tests for Ollama Client integration
"""

import pytest
from app.integrations.ollama_client import (
    OllamaClient,
    get_ollama_client,
    OllamaConnectionError,
    OllamaTimeoutError,
)


@pytest.mark.asyncio
async def test_ollama_health_check():
    """Test Ollama server health check"""
    client = get_ollama_client()
    is_healthy = await client.health_check()

    # This will fail if Ollama is not running on Desktop
    # It's expected to fail in CI/CD environment
    print(f"Ollama health check: {is_healthy}")


@pytest.mark.asyncio
async def test_ollama_list_models():
    """Test listing available models"""
    client = get_ollama_client()

    try:
        models = await client.list_models()
        print(f"Available models: {[m['name'] for m in models]}")

        # Check if required models are available
        model_names = [m['name'] for m in models]
        assert any('qwen' in name for name in model_names), "Qwen model not found"

    except OllamaConnectionError:
        pytest.skip("Ollama server not available")


@pytest.mark.asyncio
async def test_ollama_generate():
    """Test text generation"""
    client = get_ollama_client()

    try:
        response = await client.generate(
            model="qwen2.5-7b",
            prompt="Say 'Hello' in one word",
            temperature=0.1,
        )

        assert "response" in response
        assert len(response["response"]) > 0
        print(f"Generated: {response['response']}")

    except OllamaConnectionError:
        pytest.skip("Ollama server not available")


@pytest.mark.asyncio
async def test_ollama_chat():
    """Test chat completion"""
    client = get_ollama_client()

    try:
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "What is 2+2?"}
        ]

        response = await client.chat(
            model="qwen2.5-7b",
            messages=messages,
            temperature=0.1,
        )

        assert "message" in response
        assert response["message"]["role"] == "assistant"
        print(f"Chat response: {response['message']['content']}")

    except OllamaConnectionError:
        pytest.skip("Ollama server not available")


def test_model_selection():
    """Test model selection logic"""
    client = get_ollama_client()

    # Low complexity task
    model = client.select_best_model(task_complexity="low", context_size=1000)
    assert model == "llama3.2-3b"

    # Medium complexity task
    model = client.select_best_model(task_complexity="medium", context_size=5000)
    assert model == "qwen2.5-7b"

    # High complexity task
    model = client.select_best_model(task_complexity="high", context_size=2000)
    assert model == "qwen2.5-14b"

    # Large context
    model = client.select_best_model(task_complexity="medium", context_size=15000)
    assert model == "qwen2.5-14b"


def test_get_model_info():
    """Test getting model information"""
    client = get_ollama_client()

    info = client.get_model_info("qwen2.5-7b")
    assert info is not None
    assert info["size"] == "7B"
    assert info["speed"] == "fast"

    info = client.get_model_info("unknown-model")
    assert info is None
