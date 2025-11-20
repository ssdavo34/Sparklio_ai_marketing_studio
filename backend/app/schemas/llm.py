from typing import Literal, Optional
from pydantic import BaseModel

LLMProviderName = Literal[
    "auto",        # SmartRouter
    "mock",        # 개발/테스트용
    "openai",
    "gemini",
    "ollama",
    "qwen",
    "llama",
    "mistral",
    "anthropic",
    "nanobanana",
    "comfyui_image",
    "comfyui_video",
]

class LLMSelection(BaseModel):
    mode: Literal["auto", "manual"] = "auto"
    text: Optional[LLMProviderName] = None
    image: Optional[LLMProviderName] = None
    video: Optional[LLMProviderName] = None
