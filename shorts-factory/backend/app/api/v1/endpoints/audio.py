"""
Audio API Endpoints

TTS 및 음성 인식 API

작성일: 2025-12-06

엔드포인트:
- POST /api/v1/audio/tts - TTS 음성 생성
- POST /api/v1/audio/transcribe - 음성 인식 (STT)
"""

import logging
import os
import tempfile
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field

from app.services.video.builder import get_tts_service
from app.services.audio import get_whisper_service

logger = logging.getLogger(__name__)

router = APIRouter()


# =============================================================================
# Request/Response Models
# =============================================================================

class TTSRequest(BaseModel):
    """TTS 요청"""
    text: str = Field(..., description="변환할 텍스트")
    voice: str = Field("ko-KR-SunHiNeural", description="음성 ID")
    rate: str = Field("+0%", description="속도 조절")


class TTSResponse(BaseModel):
    """TTS 응답"""
    audio_path: str
    text_length: int
    voice: str


class TranscriptionResponse(BaseModel):
    """음성 인식 응답"""
    text: str
    language: str
    duration_sec: float
    backend: str
    model: str
    latency_ms: int


# =============================================================================
# API Endpoints
# =============================================================================

@router.post("/tts", response_model=TTSResponse)
async def generate_tts(request: TTSRequest):
    """
    TTS 음성 생성 (Edge TTS)

    텍스트를 음성으로 변환합니다.
    """
    tts_service = get_tts_service()

    try:
        audio_path = await tts_service.generate_speech(
            text=request.text,
            voice=request.voice,
            rate=request.rate
        )

        return TTSResponse(
            audio_path=audio_path,
            text_length=len(request.text),
            voice=request.voice
        )

    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = "ko",
    model: str = "medium"
):
    """
    음성 인식 (Whisper STT)

    오디오 파일을 텍스트로 변환합니다.
    """
    whisper_service = get_whisper_service()

    # 임시 파일 저장
    temp_path = os.path.join(tempfile.gettempdir(), f"whisper_{file.filename}")

    try:
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)

        result = await whisper_service.transcribe(
            audio_path=temp_path,
            language=language,
            model_profile=model
        )

        return TranscriptionResponse(
            text=result.text,
            language=result.language,
            duration_sec=result.duration_sec,
            backend=result.backend,
            model=result.model,
            latency_ms=result.latency_ms
        )

    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # 임시 파일 삭제
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.get("/voices")
async def list_voices():
    """사용 가능한 TTS 음성 목록"""
    return {
        "voices": [
            {"id": "ko-KR-SunHiNeural", "name": "한국어 여성 (선희)", "language": "ko"},
            {"id": "ko-KR-InJoonNeural", "name": "한국어 남성 (인준)", "language": "ko"},
            {"id": "en-US-JennyNeural", "name": "English Female (Jenny)", "language": "en"},
            {"id": "en-US-GuyNeural", "name": "English Male (Guy)", "language": "en"},
        ]
    }


@router.get("/health")
async def health_check():
    """Audio API 헬스체크"""
    whisper_service = get_whisper_service()
    whisper_ok = await whisper_service.health_check()

    return {
        "status": "ok",
        "service": "shorts-factory-audio",
        "providers": {
            "edge_tts": "ok",  # Edge TTS는 항상 사용 가능
            "whisper": "ok" if whisper_ok else "unavailable"
        }
    }
