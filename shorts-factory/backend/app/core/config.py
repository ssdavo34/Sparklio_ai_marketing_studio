"""
Shorts Factory Configuration

영상 생성 플랫폼 전용 설정

작성일: 2025-12-06
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Literal


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Shorts Factory"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8001  # Sparklio와 다른 포트 사용

    # PostgreSQL (Mac mini)
    POSTGRES_HOST: str = "100.123.51.5"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "shorts_factory"
    POSTGRES_USER: str = "sparklio"
    POSTGRES_PASSWORD: str = "sparklio_secure_2025"

    # Redis (Mac mini)
    REDIS_HOST: str = "100.123.51.5"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 1  # Sparklio와 다른 DB 사용

    # MinIO (Mac mini)
    MINIO_ENDPOINT: str = "100.123.51.5:9000"
    MINIO_PUBLIC_URL: str = "http://100.123.51.5:9000"
    MINIO_ACCESS_KEY: str = "sparklio"
    MINIO_SECRET_KEY: str = "sparklio_minio_2025"
    MINIO_SECURE: bool = False
    MINIO_BUCKET: str = "shorts-factory"

    # ComfyUI (Desktop GPU - HunyuanVideo)
    comfyui_base_url: str = Field(
        "http://100.120.180.42:8188",
        env="COMFYUI_BASE_URL"
    )
    comfyui_timeout: int = Field(600, env="COMFYUI_TIMEOUT")  # 10분

    # HunyuanVideo 설정
    hunyuan_enabled: bool = Field(True, env="HUNYUAN_ENABLED")
    hunyuan_default_width: int = Field(720, env="HUNYUAN_DEFAULT_WIDTH")
    hunyuan_default_height: int = Field(480, env="HUNYUAN_DEFAULT_HEIGHT")
    hunyuan_default_frames: int = Field(125, env="HUNYUAN_DEFAULT_FRAMES")  # 5초 @ 25fps
    hunyuan_default_steps: int = Field(30, env="HUNYUAN_DEFAULT_STEPS")

    # Whisper STT (Desktop GPU)
    whisper_endpoint: str = Field(
        "http://100.120.180.42:9000/transcribe",
        env="WHISPER_ENDPOINT"
    )
    whisper_timeout: int = Field(300, env="WHISPER_TIMEOUT")  # 5분

    # LLM (Ollama on Desktop GPU)
    ollama_base_url: str = Field(
        "http://100.120.180.42:11434",
        env="OLLAMA_BASE_URL"
    )
    ollama_default_model: str = Field("llama3.2:latest", env="OLLAMA_DEFAULT_MODEL")

    # OpenAI API (optional)
    openai_api_key: str = Field("", env="OPENAI_API_KEY")
    openai_default_model: str = Field("gpt-4o-mini", env="OPENAI_DEFAULT_MODEL")

    # Edge TTS (무료 TTS)
    tts_default_voice: str = Field("ko-KR-SunHiNeural", env="TTS_DEFAULT_VOICE")

    # Video Generation Mode
    video_mode: Literal["mock", "real"] = Field("mock", env="VIDEO_MODE")
    daily_cost_limit: float = Field(50.0, env="DAILY_COST_LIMIT")  # $50/day

    @property
    def DATABASE_URL(self) -> str:
        from urllib.parse import quote_plus
        password = quote_plus(self.POSTGRES_PASSWORD)
        return f"postgresql://{self.POSTGRES_USER}:{password}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


settings = Settings()
