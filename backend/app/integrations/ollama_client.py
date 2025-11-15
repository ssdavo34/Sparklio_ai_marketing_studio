"""
Ollama Client Integration Layer
Connects FastAPI backend to Ollama running on Desktop (100.120.180.42:11434)
"""

import httpx
import logging
from typing import Optional, Dict, Any, List
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import json

logger = logging.getLogger(__name__)


class OllamaError(Exception):
    """Base exception for Ollama client errors"""
    pass


class OllamaConnectionError(OllamaError):
    """Connection to Ollama server failed"""
    pass


class OllamaTimeoutError(OllamaError):
    """Ollama request timed out"""
    pass


class OllamaModelNotFoundError(OllamaError):
    """Requested model not found"""
    pass


class OllamaClient:
    """
    Async HTTP client for Ollama API

    Usage:
        client = OllamaClient()
        response = await client.generate(model="qwen2.5-7b", prompt="Hello")
    """

    def __init__(
        self,
        base_url: str = "http://100.120.180.42:11434",
        timeout: int = 120,  # 2 minutes default timeout
    ):
        self.base_url = base_url
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)

        # Model capabilities mapping
        self.MODEL_CAPABILITIES = {
            "qwen2.5-7b": {"size": "7B", "speed": "fast", "quality": "medium"},
            "qwen2.5-14b": {"size": "14B", "speed": "medium", "quality": "high"},
            "llama3.2-3b": {"size": "3B", "speed": "very_fast", "quality": "low"},
            "mistral-small": {"size": "7B", "speed": "fast", "quality": "medium"},
        }

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
    async def generate(
        self,
        model: str,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
    ) -> Dict[str, Any]:
        """
        Generate text using Ollama

        Args:
            model: Model name (e.g., "qwen2.5-7b")
            prompt: User prompt
            system: System prompt (optional)
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate
            stream: Enable streaming (not implemented yet)

        Returns:
            {
                "response": "generated text",
                "model": "qwen2.5-7b",
                "total_duration": 1234567890,
                "eval_count": 100
            }

        Raises:
            OllamaConnectionError: If connection fails
            OllamaTimeoutError: If request times out
            OllamaModelNotFoundError: If model not found
        """
        try:
            logger.info(f"Generating with Ollama: model={model}, prompt_length={len(prompt)}")

            payload = {
                "model": model,
                "prompt": prompt,
                "stream": stream,
                "options": {
                    "temperature": temperature,
                }
            }

            if system:
                payload["system"] = system

            if max_tokens:
                payload["options"]["num_predict"] = max_tokens

            response = await self.client.post(
                f"{self.base_url}/api/generate",
                json=payload
            )

            response.raise_for_status()
            result = response.json()

            logger.info(f"Ollama response received: eval_count={result.get('eval_count', 0)}")

            return result

        except httpx.ConnectError as e:
            logger.error(f"Ollama connection failed: {e}")
            raise OllamaConnectionError(f"Failed to connect to Ollama at {self.base_url}") from e

        except httpx.TimeoutException as e:
            logger.error(f"Ollama request timed out: {e}")
            raise OllamaTimeoutError(f"Request timed out after {self.timeout}s") from e

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.error(f"Model not found: {model}")
                raise OllamaModelNotFoundError(f"Model '{model}' not found") from e
            raise OllamaError(f"HTTP error: {e}") from e

    async def chat(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Chat completion using Ollama

        Args:
            model: Model name
            messages: List of {"role": "user/assistant/system", "content": "..."}
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate

        Returns:
            {
                "message": {"role": "assistant", "content": "response"},
                "model": "qwen2.5-7b",
                "total_duration": 1234567890
            }
        """
        try:
            logger.info(f"Chat with Ollama: model={model}, messages_count={len(messages)}")

            payload = {
                "model": model,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": temperature,
                }
            }

            if max_tokens:
                payload["options"]["num_predict"] = max_tokens

            response = await self.client.post(
                f"{self.base_url}/api/chat",
                json=payload
            )

            response.raise_for_status()
            result = response.json()

            logger.info(f"Chat response received")

            return result

        except httpx.ConnectError as e:
            logger.error(f"Ollama connection failed: {e}")
            raise OllamaConnectionError(f"Failed to connect to Ollama at {self.base_url}") from e

        except httpx.TimeoutException as e:
            logger.error(f"Ollama request timed out: {e}")
            raise OllamaTimeoutError(f"Request timed out after {self.timeout}s") from e

    async def list_models(self) -> List[Dict[str, Any]]:
        """
        List available models

        Returns:
            [
                {"name": "qwen2.5-7b", "size": 4661224676, "modified_at": "..."},
                ...
            ]
        """
        try:
            response = await self.client.get(f"{self.base_url}/api/tags")
            response.raise_for_status()
            result = response.json()
            return result.get("models", [])

        except httpx.ConnectError as e:
            logger.error(f"Failed to list models: {e}")
            raise OllamaConnectionError(f"Failed to connect to Ollama") from e

    async def pull_model(self, model: str) -> Dict[str, Any]:
        """
        Pull (download) a model

        Args:
            model: Model name to pull

        Returns:
            {"status": "success"}
        """
        try:
            logger.info(f"Pulling model: {model}")

            response = await self.client.post(
                f"{self.base_url}/api/pull",
                json={"name": model},
                timeout=600  # 10 minutes for downloading
            )

            response.raise_for_status()
            return {"status": "success"}

        except httpx.TimeoutException:
            raise OllamaTimeoutError(f"Model pull timed out for {model}")

    async def health_check(self) -> bool:
        """
        Check if Ollama server is healthy

        Returns:
            True if server is up, False otherwise
        """
        try:
            response = await self.client.get(f"{self.base_url}/api/version")
            return response.status_code == 200
        except:
            return False

    def get_model_info(self, model: str) -> Optional[Dict[str, Any]]:
        """
        Get model capabilities

        Args:
            model: Model name

        Returns:
            {"size": "7B", "speed": "fast", "quality": "medium"}
        """
        return self.MODEL_CAPABILITIES.get(model)

    def select_best_model(
        self,
        task_complexity: str = "medium",  # "low" | "medium" | "high"
        context_size: int = 0,
    ) -> str:
        """
        Select best model based on task requirements

        Args:
            task_complexity: Task complexity level
            context_size: Context size in bytes

        Returns:
            Model name (e.g., "qwen2.5-14b")
        """
        if task_complexity == "high" or context_size > 10000:
            return "qwen2.5-14b"
        elif task_complexity == "medium":
            return "qwen2.5-7b"
        else:
            return "llama3.2-3b"


# Singleton instance for reuse
_ollama_client: Optional[OllamaClient] = None


def get_ollama_client() -> OllamaClient:
    """
    Get singleton Ollama client instance

    Usage:
        client = get_ollama_client()
        response = await client.generate(...)
    """
    global _ollama_client
    if _ollama_client is None:
        _ollama_client = OllamaClient()
    return _ollama_client
