"""
External Integrations Module

Ollama, ComfyUI, MinIO 등 외부 서비스 연동
"""

from app.integrations.ollama_client import OllamaClient

__all__ = ["OllamaClient"]
