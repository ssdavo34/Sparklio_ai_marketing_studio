"""
Ollama Client

Ollama LLM API와의 통합을 위한 클라이언트
"""

import httpx
import logging
from typing import Dict, Any, Optional, List
from app.core.config import settings

logger = logging.getLogger(__name__)


class OllamaClient:
    """
    Ollama LLM 클라이언트
    
    Ollama API를 통해 LLM 추론을 수행합니다.
    """
    
    def __init__(self):
        self.base_url = settings.OLLAMA_ENDPOINT
        self.timeout = 300.0  # 5 minutes for LLM inference
    
    async def generate(
        self,
        prompt: str,
        model: str = "qwen2.5:7b",
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        텍스트 생성 요청
        
        Args:
            prompt: 사용자 프롬프트
            model: 사용할 모델 (qwen2.5:7b, qwen2.5:14b 등)
            system: 시스템 프롬프트 (optional)
            temperature: 생성 온도 (0.0 ~ 1.0)
            max_tokens: 최대 토큰 수
            stream: 스트리밍 응답 여부
            
        Returns:
            Dict containing:
                - response: 생성된 텍스트
                - model: 사용된 모델
                - prompt_tokens: 프롬프트 토큰 수
                - completion_tokens: 생성 토큰 수
                - total_duration: 총 소요 시간 (ns)
        """
        url = f"{self.base_url}/api/generate"
        
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
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                logger.info(f"[OllamaClient] Generating with model={model}, prompt_len={len(prompt)}")
                
                response = await client.post(url, json=payload)
                response.raise_for_status()
                
                result = response.json()
                
                logger.info(
                    f"[OllamaClient] Generation complete: "
                    f"response_len={len(result.get('response', ''))}, "
                    f"duration={result.get('total_duration', 0) / 1e9:.2f}s"
                )
                
                return {
                    "response": result.get("response", ""),
                    "model": result.get("model", model),
                    "prompt_tokens": result.get("prompt_eval_count", 0),
                    "completion_tokens": result.get("eval_count", 0),
                    "total_duration": result.get("total_duration", 0),
                }
                
        except httpx.HTTPError as e:
            logger.error(f"[OllamaClient] HTTP error: {e}")
            raise
        except Exception as e:
            logger.error(f"[OllamaClient] Unexpected error: {e}")
            raise
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "qwen2.5:7b",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        대화형 채팅 요청
        
        Args:
            messages: 대화 메시지 리스트 [{"role": "user", "content": "..."}, ...]
            model: 사용할 모델
            temperature: 생성 온도
            max_tokens: 최대 토큰 수
            stream: 스트리밍 응답 여부
            
        Returns:
            Dict containing chat response and metadata
        """
        url = f"{self.base_url}/api/chat"
        
        payload = {
            "model": model,
            "messages": messages,
            "stream": stream,
            "options": {
                "temperature": temperature,
            }
        }
        
        if max_tokens:
            payload["options"]["num_predict"] = max_tokens
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                logger.info(f"[OllamaClient] Chat with model={model}, messages={len(messages)}")
                
                response = await client.post(url, json=payload)
                response.raise_for_status()
                
                result = response.json()
                
                logger.info(f"[OllamaClient] Chat complete")
                
                return {
                    "message": result.get("message", {}),
                    "response": result.get("message", {}).get("content", ""),
                    "model": result.get("model", model),
                    "prompt_tokens": result.get("prompt_eval_count", 0),
                    "completion_tokens": result.get("eval_count", 0),
                    "total_duration": result.get("total_duration", 0),
                }
                
        except httpx.HTTPError as e:
            logger.error(f"[OllamaClient] HTTP error: {e}")
            raise
        except Exception as e:
            logger.error(f"[OllamaClient] Unexpected error: {e}")
            raise
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """
        사용 가능한 모델 목록 조회
        
        Returns:
            List of available models
        """
        url = f"{self.base_url}/api/tags"
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                
                result = response.json()
                return result.get("models", [])
                
        except httpx.HTTPError as e:
            logger.error(f"[OllamaClient] HTTP error: {e}")
            raise
        except Exception as e:
            logger.error(f"[OllamaClient] Unexpected error: {e}")
            raise
