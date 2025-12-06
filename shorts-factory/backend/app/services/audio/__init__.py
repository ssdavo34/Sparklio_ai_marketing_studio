# Audio services module
from .whisper import WhisperService, get_whisper_service

__all__ = [
    "WhisperService",
    "get_whisper_service",
]
