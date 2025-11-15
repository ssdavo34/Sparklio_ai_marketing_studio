"""
ComfyUI Client Integration Layer
Connects FastAPI backend to ComfyUI running on Desktop (100.120.180.42:8188)
"""

import httpx
import logging
import asyncio
import uuid
from typing import Optional, Dict, Any, List
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import json

logger = logging.getLogger(__name__)


class ComfyUIError(Exception):
    """Base exception for ComfyUI client errors"""
    pass


class ComfyUIConnectionError(ComfyUIError):
    """Connection to ComfyUI server failed"""
    pass


class ComfyUITimeoutError(ComfyUIError):
    """ComfyUI request timed out"""
    pass


class ComfyUIWorkflowError(ComfyUIError):
    """Workflow execution failed"""
    pass


class ComfyUIClient:
    """
    Async HTTP client for ComfyUI API

    Usage:
        client = ComfyUIClient()
        prompt_id = await client.queue_prompt(workflow_json)
        status = await client.get_status(prompt_id)
        images = await client.get_images(prompt_id)
    """

    def __init__(
        self,
        base_url: str = "http://100.120.180.42:8188",
        timeout: int = 300,  # 5 minutes for image generation
    ):
        self.base_url = base_url
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.ConnectError, httpx.TimeoutException)),
    )
    async def queue_prompt(
        self,
        workflow: Dict[str, Any],
        client_id: Optional[str] = None,
    ) -> str:
        """
        Queue a workflow for execution

        Args:
            workflow: ComfyUI workflow JSON
            client_id: Optional client ID for tracking

        Returns:
            prompt_id: Unique ID for this prompt execution

        Raises:
            ComfyUIConnectionError: If connection fails
            ComfyUIWorkflowError: If workflow is invalid
        """
        try:
            if client_id is None:
                client_id = str(uuid.uuid4())

            logger.info(f"Queuing ComfyUI workflow: client_id={client_id}")

            payload = {
                "prompt": workflow,
                "client_id": client_id
            }

            response = await self.client.post(
                f"{self.base_url}/prompt",
                json=payload
            )

            response.raise_for_status()
            result = response.json()

            prompt_id = result.get("prompt_id")
            logger.info(f"Workflow queued: prompt_id={prompt_id}")

            return prompt_id

        except httpx.ConnectError as e:
            logger.error(f"ComfyUI connection failed: {e}")
            raise ComfyUIConnectionError(f"Failed to connect to ComfyUI at {self.base_url}") from e

        except httpx.TimeoutException as e:
            logger.error(f"ComfyUI request timed out: {e}")
            raise ComfyUITimeoutError(f"Request timed out after {self.timeout}s") from e

        except httpx.HTTPStatusError as e:
            logger.error(f"ComfyUI HTTP error: {e}")
            raise ComfyUIWorkflowError(f"Workflow execution failed: {e}") from e

    async def get_queue(self) -> Dict[str, Any]:
        """
        Get current queue status

        Returns:
            {
                "queue_running": [...],
                "queue_pending": [...]
            }
        """
        try:
            response = await self.client.get(f"{self.base_url}/queue")
            response.raise_for_status()
            return response.json()

        except httpx.ConnectError as e:
            raise ComfyUIConnectionError(f"Failed to connect to ComfyUI") from e

    async def get_history(self, prompt_id: str) -> Optional[Dict[str, Any]]:
        """
        Get execution history for a prompt

        Args:
            prompt_id: Prompt ID to check

        Returns:
            History data or None if not found
        """
        try:
            response = await self.client.get(f"{self.base_url}/history/{prompt_id}")
            response.raise_for_status()
            result = response.json()

            # ComfyUI returns {prompt_id: {...}}
            return result.get(prompt_id)

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            raise

    async def wait_for_completion(
        self,
        prompt_id: str,
        poll_interval: int = 2,
        max_wait: int = 300,
    ) -> Dict[str, Any]:
        """
        Wait for workflow to complete

        Args:
            prompt_id: Prompt ID to wait for
            poll_interval: Seconds between status checks
            max_wait: Maximum seconds to wait

        Returns:
            History data when complete

        Raises:
            ComfyUITimeoutError: If max_wait exceeded
            ComfyUIWorkflowError: If workflow failed
        """
        logger.info(f"Waiting for ComfyUI completion: prompt_id={prompt_id}")

        elapsed = 0
        while elapsed < max_wait:
            history = await self.get_history(prompt_id)

            if history:
                # Check if execution completed
                status = history.get("status", {})

                if status.get("completed"):
                    logger.info(f"Workflow completed: prompt_id={prompt_id}")
                    return history

                if "error" in status:
                    error_msg = status["error"]
                    logger.error(f"Workflow failed: {error_msg}")
                    raise ComfyUIWorkflowError(f"Workflow execution failed: {error_msg}")

            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

        raise ComfyUITimeoutError(f"Workflow did not complete within {max_wait}s")

    async def get_images(self, prompt_id: str) -> List[bytes]:
        """
        Get generated images from a completed workflow

        Args:
            prompt_id: Prompt ID

        Returns:
            List of image data (bytes)
        """
        history = await self.get_history(prompt_id)

        if not history:
            raise ComfyUIWorkflowError(f"No history found for prompt_id={prompt_id}")

        images = []
        outputs = history.get("outputs", {})

        for node_id, node_output in outputs.items():
            if "images" in node_output:
                for image_info in node_output["images"]:
                    filename = image_info["filename"]
                    subfolder = image_info.get("subfolder", "")
                    image_type = image_info.get("type", "output")

                    # Download image
                    image_data = await self.download_image(filename, subfolder, image_type)
                    images.append(image_data)

        logger.info(f"Retrieved {len(images)} images for prompt_id={prompt_id}")
        return images

    async def download_image(
        self,
        filename: str,
        subfolder: str = "",
        image_type: str = "output"
    ) -> bytes:
        """
        Download an image from ComfyUI

        Args:
            filename: Image filename
            subfolder: Subfolder path
            image_type: "output" | "input" | "temp"

        Returns:
            Image data (bytes)
        """
        params = {
            "filename": filename,
            "type": image_type,
        }

        if subfolder:
            params["subfolder"] = subfolder

        response = await self.client.get(
            f"{self.base_url}/view",
            params=params
        )

        response.raise_for_status()
        return response.content

    async def interrupt(self) -> Dict[str, Any]:
        """
        Interrupt current execution

        Returns:
            {"status": "interrupted"}
        """
        try:
            response = await self.client.post(f"{self.base_url}/interrupt")
            response.raise_for_status()
            return {"status": "interrupted"}

        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to interrupt: {e}")
            raise ComfyUIError(f"Interrupt failed: {e}") from e

    async def get_system_stats(self) -> Dict[str, Any]:
        """
        Get ComfyUI system statistics

        Returns:
            {
                "system": {...},
                "devices": [...]
            }
        """
        try:
            response = await self.client.get(f"{self.base_url}/system_stats")
            response.raise_for_status()
            return response.json()

        except httpx.ConnectError as e:
            raise ComfyUIConnectionError(f"Failed to connect to ComfyUI") from e

    async def health_check(self) -> bool:
        """
        Check if ComfyUI server is healthy

        Returns:
            True if server is up, False otherwise
        """
        try:
            response = await self.client.get(f"{self.base_url}/system_stats")
            return response.status_code == 200
        except:
            return False

    async def generate_image(
        self,
        workflow: Dict[str, Any],
        wait: bool = True,
        max_wait: int = 300,
    ) -> Dict[str, Any]:
        """
        High-level method to generate image

        Args:
            workflow: ComfyUI workflow JSON
            wait: Wait for completion
            max_wait: Maximum wait time

        Returns:
            {
                "prompt_id": "...",
                "images": [bytes, ...],  # if wait=True
                "status": "completed" | "queued"
            }
        """
        prompt_id = await self.queue_prompt(workflow)

        if not wait:
            return {
                "prompt_id": prompt_id,
                "status": "queued"
            }

        # Wait for completion
        await self.wait_for_completion(prompt_id, max_wait=max_wait)

        # Get images
        images = await self.get_images(prompt_id)

        return {
            "prompt_id": prompt_id,
            "images": images,
            "status": "completed",
            "image_count": len(images)
        }


# Singleton instance for reuse
_comfyui_client: Optional[ComfyUIClient] = None


def get_comfyui_client() -> ComfyUIClient:
    """
    Get singleton ComfyUI client instance

    Usage:
        client = get_comfyui_client()
        result = await client.generate_image(workflow)
    """
    global _comfyui_client
    if _comfyui_client is None:
        _comfyui_client = ComfyUIClient()
    return _comfyui_client
