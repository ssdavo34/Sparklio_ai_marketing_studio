"""
Debug Endpoints

디버깅 및 헬스체크용 엔드포인트
"""

from fastapi import APIRouter, HTTPException
import httpx
import logging
from datetime import datetime

from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/ollama")
async def debug_ollama():
    """
    Ollama 서버 직접 연결 테스트

    FastAPI 컨텍스트 내에서 httpx로 Ollama 서버에 직접 연결하여
    네트워크 및 httpx 라이브러리 동작을 검증합니다.

    Returns:
        연결 테스트 결과
    """
    start_time = datetime.utcnow()
    target_url = f"{settings.OLLAMA_BASE_URL}/api/tags"

    result = {
        "target_url": target_url,
        "base_url_from_settings": settings.OLLAMA_BASE_URL,
        "timestamp": start_time.isoformat(),
        "success": False,
        "error": None,
        "models": None,
        "elapsed_ms": 0
    }

    try:
        # 새로운 AsyncClient 인스턴스로 직접 호출
        async with httpx.AsyncClient(timeout=30.0) as client:
            logger.info(f"Debug: Attempting connection to {target_url}")
            response = await client.get(target_url)
            response.raise_for_status()

            data = response.json()
            models = data.get("models", [])

            elapsed = (datetime.utcnow() - start_time).total_seconds() * 1000

            result.update({
                "success": True,
                "models": [m.get("name") for m in models[:5]],  # 처음 5개만
                "total_models": len(models),
                "elapsed_ms": round(elapsed, 2)
            })

            logger.info(f"Debug: Success - {len(models)} models found")
            return result

    except httpx.ConnectError as e:
        result["error"] = {
            "type": "ConnectError",
            "message": str(e),
            "details": "Failed to connect to Ollama server"
        }
        logger.error(f"Debug: ConnectError - {str(e)}")
        return result

    except httpx.HTTPStatusError as e:
        result["error"] = {
            "type": "HTTPStatusError",
            "status_code": e.response.status_code,
            "message": str(e)
        }
        logger.error(f"Debug: HTTPStatusError - {e.response.status_code}")
        return result

    except Exception as e:
        result["error"] = {
            "type": type(e).__name__,
            "message": str(e)
        }
        logger.error(f"Debug: Unexpected error - {type(e).__name__}: {str(e)}")
        return result


@router.get("/ollama/generate")
async def debug_ollama_generate():
    """
    Ollama 서버 /api/generate 엔드포인트 직접 테스트

    실제 텍스트 생성을 요청하여 Ollama API 전체 동작을 검증합니다.

    Returns:
        생성 테스트 결과
    """
    start_time = datetime.utcnow()
    target_url = f"{settings.OLLAMA_BASE_URL}/api/generate"

    payload = {
        "model": settings.OLLAMA_DEFAULT_MODEL,
        "prompt": "Hello",
        "stream": False
    }

    result = {
        "target_url": target_url,
        "model": settings.OLLAMA_DEFAULT_MODEL,
        "timestamp": start_time.isoformat(),
        "success": False,
        "error": None,
        "response_text": None,
        "elapsed_ms": 0
    }

    try:
        # 새로운 AsyncClient 인스턴스로 직접 호출
        async with httpx.AsyncClient(timeout=60.0) as client:
            logger.info(f"Debug: Attempting generate to {target_url}")
            response = await client.post(target_url, json=payload)
            response.raise_for_status()

            data = response.json()
            response_text = data.get("response", "")

            elapsed = (datetime.utcnow() - start_time).total_seconds() * 1000

            result.update({
                "success": True,
                "response_text": response_text[:100] + "..." if len(response_text) > 100 else response_text,
                "full_length": len(response_text),
                "elapsed_ms": round(elapsed, 2)
            })

            logger.info(f"Debug: Generate success - {len(response_text)} chars")
            return result

    except httpx.ConnectError as e:
        result["error"] = {
            "type": "ConnectError",
            "message": str(e),
            "details": "Failed to connect to Ollama server"
        }
        logger.error(f"Debug: ConnectError - {str(e)}")
        return result

    except httpx.HTTPStatusError as e:
        result["error"] = {
            "type": "HTTPStatusError",
            "status_code": e.response.status_code,
            "message": str(e),
            "response_text": e.response.text[:200]
        }
        logger.error(f"Debug: HTTPStatusError - {e.response.status_code}")
        return result

    except Exception as e:
        result["error"] = {
            "type": type(e).__name__,
            "message": str(e)
        }
        logger.error(f"Debug: Unexpected error - {type(e).__name__}: {str(e)}")
        return result


@router.get("/settings")
async def debug_settings():
    """
    현재 설정값 확인

    Returns:
        주요 설정 값들
    """
    return {
        "generator_mode": settings.generator_mode,
        "ollama_base_url": settings.ollama_base_url,
        "ollama_timeout": settings.ollama_timeout,
        "ollama_default_model": settings.ollama_default_model,
        "comfyui_base_url": settings.comfyui_base_url
    }
