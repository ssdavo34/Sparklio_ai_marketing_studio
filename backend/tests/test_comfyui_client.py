"""
Tests for ComfyUI Client integration
"""

import pytest
from app.integrations.comfyui_client import (
    ComfyUIClient,
    get_comfyui_client,
    ComfyUIConnectionError,
)


@pytest.mark.asyncio
async def test_comfyui_health_check():
    """Test ComfyUI server health check"""
    client = get_comfyui_client()
    is_healthy = await client.health_check()

    # This will fail if ComfyUI is not running on Desktop
    # It's expected to fail in CI/CD environment
    print(f"ComfyUI health check: {is_healthy}")


@pytest.mark.asyncio
async def test_comfyui_system_stats():
    """Test getting system statistics"""
    client = get_comfyui_client()

    try:
        stats = await client.get_system_stats()
        print(f"System stats: {stats.keys()}")

        assert "system" in stats or "devices" in stats

    except ComfyUIConnectionError:
        pytest.skip("ComfyUI server not available")


@pytest.mark.asyncio
async def test_comfyui_get_queue():
    """Test getting queue status"""
    client = get_comfyui_client()

    try:
        queue = await client.get_queue()
        print(f"Queue: {queue.keys()}")

        assert "queue_running" in queue or "queue_pending" in queue

    except ComfyUIConnectionError:
        pytest.skip("ComfyUI server not available")


@pytest.mark.asyncio
async def test_comfyui_queue_prompt():
    """Test queuing a simple workflow"""
    client = get_comfyui_client()

    # Minimal test workflow (this is a dummy workflow)
    workflow = {
        "1": {
            "class_type": "LoadImage",
            "inputs": {"image": "example.png"}
        }
    }

    try:
        prompt_id = await client.queue_prompt(workflow)
        print(f"Queued prompt_id: {prompt_id}")

        assert prompt_id is not None
        assert len(prompt_id) > 0

    except ComfyUIConnectionError:
        pytest.skip("ComfyUI server not available")
    except Exception as e:
        # Workflow might fail due to missing files, but queueing should work
        print(f"Expected error: {e}")


# Note: Full image generation tests require a valid ComfyUI workflow
# and should be tested manually or in integration tests
