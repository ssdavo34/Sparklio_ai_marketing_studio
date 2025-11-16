"""
Ollama LLM Provider

Ollama API를 사용하는 실제 LLM Provider

작성일: 2025-11-16
작성자: B팀 (Backend)
문서: ARCH-002, SPEC-001
"""

import httpx
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime

from app.core.config import settings
from .base import LLMProvider, LLMProviderResponse, ProviderError

logger = logging.getLogger(__name__)


class OllamaProvider(LLMProvider):
    """
    Ollama LLM Provider

    Ollama API를 사용하여 실제 LLM 텍스트를 생성하는 Provider
    - Desktop GPU 서버 (100.120.180.42:11434) 연결
    - JSON 모드 지원
    - 타임아웃 처리 (120초)
    - 에러 핸들링

    사용 예시:
        provider = OllamaProvider()
        response = await provider.generate(
            prompt="상품 설명을 작성해주세요",
            role="copywriter",
            task="product_detail",
            mode="json"
        )
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout: Optional[int] = None,
        default_model: Optional[str] = None
    ):
        """
        Args:
            base_url: Ollama API 베이스 URL (기본값: settings.OLLAMA_BASE_URL)
            timeout: 타임아웃 (초) (기본값: settings.OLLAMA_TIMEOUT)
            default_model: 기본 모델명 (기본값: settings.OLLAMA_DEFAULT_MODEL)
        """
        self.base_url = base_url or settings.OLLAMA_BASE_URL
        self.timeout = timeout or settings.OLLAMA_TIMEOUT
        self.default_model = default_model or settings.OLLAMA_DEFAULT_MODEL

        # HTTP 클라이언트 (재사용)
        # base_url 파라미터를 사용하지 않고 전체 URL 사용
        self.client = httpx.AsyncClient(timeout=self.timeout)

        logger.info(f"Ollama Provider initialized: {self.base_url}, timeout={self.timeout}s")

    @property
    def vendor(self) -> str:
        """Provider 벤더명"""
        return "ollama"

    @property
    def supports_json(self) -> bool:
        """JSON 모드 지원 여부"""
        return True

    @property
    def supports_streaming(self) -> bool:
        """스트리밍 지원 여부"""
        return True  # Ollama는 스트리밍 지원 (Phase 2에서 구현)

    async def generate(
        self,
        prompt: str,
        role: str,
        task: str,
        mode: str = "json",
        options: Optional[Dict[str, Any]] = None
    ) -> LLMProviderResponse:
        """
        Ollama LLM 텍스트 생성

        Args:
            prompt: 프롬프트
            role: Agent 역할 (copywriter, strategist, reviewer 등)
            task: 작업 유형 (product_detail, brand_kit, sns 등)
            mode: 출력 모드 ('json' | 'text')
            options: Ollama 옵션
                - temperature: float (기본값: 0.7)
                - top_p: float (기본값: 0.9)
                - max_tokens: int (기본값: 2000)
                - model: str (모델명 오버라이드)

        Returns:
            LLMProviderResponse: 표준 형식의 응답

        Raises:
            ProviderError: Ollama API 호출 실패 시
        """
        start_time = datetime.utcnow()

        try:
            # 옵션 병합
            merged_options = self.get_default_options(role, task)
            if options:
                merged_options.update(options)

            # 모델 선택
            model = merged_options.pop("model", self.default_model)

            # Ollama API 요청 구성
            request_data = self._build_request(
                prompt=prompt,
                model=model,
                mode=mode,
                options=merged_options
            )

            logger.info(f"Ollama API call: model={model}, mode={mode}, timeout={self.timeout}s")

            # Ollama API 호출 (전체 URL 사용)
            api_url = f"{self.base_url}/api/generate"
            response = await self.client.post(api_url, json=request_data)
            response.raise_for_status()

            # 응답 파싱
            result = response.json()

            # 응답 변환
            llm_response = self._parse_response(
                result=result,
                model=model,
                mode=mode,
                role=role,
                task=task,
                start_time=start_time
            )

            elapsed = (datetime.utcnow() - start_time).total_seconds()
            logger.info(f"Ollama success: {model} - elapsed={elapsed:.2f}s")

            return llm_response

        except httpx.TimeoutException as e:
            logger.error(f"Ollama timeout: {str(e)}")
            raise ProviderError(
                message=f"Ollama request timeout after {self.timeout}s",
                provider="ollama",
                status_code=504,
                details={"timeout": self.timeout, "base_url": self.base_url}
            )

        except httpx.HTTPStatusError as e:
            logger.error(f"Ollama HTTP error: {e.response.status_code} - {e.response.text}")
            raise ProviderError(
                message=f"Ollama API error: {e.response.status_code}",
                provider="ollama",
                status_code=e.response.status_code,
                details={"response": e.response.text}
            )

        except Exception as e:
            logger.error(f"Ollama unexpected error: {str(e)}", exc_info=True)
            raise ProviderError(
                message=f"Ollama error: {str(e)}",
                provider="ollama",
                details={"error_type": type(e).__name__}
            )

    def _build_request(
        self,
        prompt: str,
        model: str,
        mode: str,
        options: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Ollama API 요청 데이터 구성

        Args:
            prompt: 프롬프트
            model: 모델명
            mode: 출력 모드
            options: 옵션

        Returns:
            요청 데이터
        """
        request_data = {
            "model": model,
            "prompt": prompt,
            "stream": False,  # Phase 1-3에서는 스트리밍 미사용
            "options": {
                "temperature": options.get("temperature", 0.7),
                "top_p": options.get("top_p", 0.9),
                "num_predict": options.get("max_tokens", 2000),
            }
        }

        # JSON 모드 활성화
        if mode == "json" and self.supports_json:
            request_data["format"] = "json"

        # stop_sequences 추가 (있는 경우)
        if "stop_sequences" in options:
            request_data["options"]["stop"] = options["stop_sequences"]

        return request_data

    def _parse_response(
        self,
        result: Dict[str, Any],
        model: str,
        mode: str,
        role: str,
        task: str,
        start_time: datetime
    ) -> LLMProviderResponse:
        """
        Ollama API 응답 파싱

        Args:
            result: Ollama API 응답
            model: 모델명
            mode: 출력 모드
            role: 역할
            task: 작업
            start_time: 시작 시각

        Returns:
            LLMProviderResponse
        """
        # 응답 텍스트 추출
        response_text = result.get("response", "")

        # JSON 모드인 경우 파싱
        if mode == "json":
            try:
                output = json.loads(response_text)
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse JSON response: {e}")
                # JSON 파싱 실패 시 텍스트로 반환
                output = {"text": response_text, "parse_error": str(e)}
        else:
            output = response_text

        # 토큰 사용량 (Ollama API 응답에서 추출)
        usage = {
            "prompt_tokens": result.get("prompt_eval_count", 0),
            "completion_tokens": result.get("eval_count", 0),
            "total_tokens": result.get("prompt_eval_count", 0) + result.get("eval_count", 0)
        }

        # 메타데이터
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        meta = {
            "latency_ms": elapsed * 1000,
            "mode": mode,
            "role": role,
            "task": task,
            "model_info": {
                "total_duration": result.get("total_duration"),
                "load_duration": result.get("load_duration"),
                "prompt_eval_duration": result.get("prompt_eval_duration"),
                "eval_duration": result.get("eval_duration"),
            }
        }

        return LLMProviderResponse(
            provider="ollama",
            model=model,
            usage=usage,
            output=output,
            meta=meta,
            timestamp=datetime.utcnow()
        )

    async def health_check(self) -> bool:
        """
        Ollama 서버 상태 확인

        Returns:
            bool: 정상 작동 시 True
        """
        try:
            # Ollama API /api/tags 엔드포인트로 모델 목록 조회 (전체 URL 사용)
            api_url = f"{self.base_url}/api/tags"
            response = await self.client.get(api_url, timeout=10.0)
            response.raise_for_status()

            result = response.json()
            models = result.get("models", [])

            logger.info(f"Ollama health check OK: {len(models)} models available")
            return True

        except Exception as e:
            logger.error(f"Ollama health check failed: {str(e)}")
            return False

    async def list_models(self) -> list[Dict[str, Any]]:
        """
        사용 가능한 모델 목록 조회

        Returns:
            모델 목록
        """
        try:
            api_url = f"{self.base_url}/api/tags"
            response = await self.client.get(api_url)
            response.raise_for_status()

            result = response.json()
            return result.get("models", [])

        except Exception as e:
            logger.error(f"Failed to list Ollama models: {str(e)}")
            return []

    async def close(self):
        """HTTP 클라이언트 종료"""
        await self.client.aclose()


# Ollama Provider 인스턴스 생성 헬퍼
def create_ollama_provider(
    base_url: Optional[str] = None,
    timeout: Optional[int] = None,
    default_model: Optional[str] = None
) -> OllamaProvider:
    """
    Ollama Provider 인스턴스 생성

    Args:
        base_url: Ollama API URL
        timeout: 타임아웃 (초)
        default_model: 기본 모델명

    Returns:
        OllamaProvider 인스턴스
    """
    return OllamaProvider(
        base_url=base_url,
        timeout=timeout,
        default_model=default_model
    )
