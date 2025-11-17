from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional, Literal
import os

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Sparklio AI Marketing Studio"
    APP_VERSION: str = "0.1.0"
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    API_SECRET_KEY: str = "your-secret-key-change-in-production"

    # PostgreSQL
    POSTGRES_HOST: str = "100.123.51.5"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "sparklio"
    POSTGRES_USER: str = "sparklio"
    POSTGRES_PASSWORD: str = "sparklio_secure_2025"

    # Redis
    REDIS_HOST: str = "100.123.51.5"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    # MinIO
    MINIO_ENDPOINT: str = "100.123.51.5:9000"
    MINIO_ACCESS_KEY: str = "sparklio"
    MINIO_SECRET_KEY: str = "sparklio_minio_2025"
    MINIO_SECURE: bool = False
    MINIO_BUCKET_PREFIX: str = "dev-"

    # Generator Mode (mock | live) - 소문자 필드명 사용
    generator_mode: Literal["mock", "live"] = Field(
        "live",
        env="GENERATOR_MODE"
    )

    # AI Workers - LLM (Ollama) - 소문자 필드명 사용
    ollama_base_url: str = Field(
        "http://100.120.180.42:11434",
        env="OLLAMA_BASE_URL"
    )
    ollama_timeout: int = Field(120, env="OLLAMA_TIMEOUT")
    ollama_default_model: str = Field("qwen2.5:7b", env="OLLAMA_DEFAULT_MODEL")

    # OpenAI API
    openai_api_key: str = Field("", env="OPENAI_API_KEY")
    openai_default_model: str = Field("gpt-4o-mini", env="OPENAI_DEFAULT_MODEL")
    openai_timeout: int = Field(60, env="OPENAI_TIMEOUT")

    # Anthropic API (Claude)
    anthropic_api_key: str = Field("", env="ANTHROPIC_API_KEY")
    anthropic_default_model: str = Field(
        "claude-3-5-haiku-20241022",
        env="ANTHROPIC_DEFAULT_MODEL"
    )
    anthropic_timeout: int = Field(60, env="ANTHROPIC_TIMEOUT")

    # Google Gemini API
    google_api_key: str = Field("", env="GOOGLE_API_KEY")
    gemini_text_model: str = Field(
        "gemini-2.5-flash-preview",
        env="GEMINI_TEXT_MODEL"
    )
    gemini_image_model: str = Field(
        "gemini-2.5-flash-image",
        env="GEMINI_IMAGE_MODEL"
    )
    gemini_timeout: int = Field(60, env="GEMINI_TIMEOUT")

    # Novita AI (Llama 3.3 70B)
    novita_api_key: str = Field("", env="NOVITA_API_KEY")
    novita_base_url: str = Field(
        "https://api.novita.ai/v3/openai",
        env="NOVITA_BASE_URL"
    )
    novita_default_model: str = Field(
        "meta-llama/llama-3.3-70b-instruct",
        env="NOVITA_DEFAULT_MODEL"
    )
    novita_timeout: int = Field(60, env="NOVITA_TIMEOUT")

    # AI Workers - Media (ComfyUI) - 소문자 필드명 사용
    comfyui_base_url: str = Field(
        "http://100.120.180.42:8188",
        env="COMFYUI_BASE_URL"
    )
    comfyui_timeout: int = Field(300, env="COMFYUI_TIMEOUT")

    # Legacy endpoints (deprecated, use ollama_base_url instead)
    OLLAMA_ENDPOINT: str = "http://100.120.180.42:11434"
    COMFYUI_ENDPOINT: str = "http://100.120.180.42:8188"

    # File Upload
    MAX_FILE_SIZE_MB: int = 100
    ALLOWED_FILE_TYPES: str = "image/jpeg,image/png,image/webp,video/mp4,text/plain"

    # Presigned URL
    PRESIGNED_URL_EXPIRY: int = 3600  # 1 hour

    # Vector Search
    EMBEDDING_DIMENSION: int = 1536

    # Database URL (computed)
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Redis URL (computed)
    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # 하위 호환성을 위한 대문자 속성 (deprecated)
    @property
    def GENERATOR_MODE(self) -> str:
        """Deprecated: Use generator_mode instead"""
        return self.generator_mode

    @property
    def OLLAMA_BASE_URL(self) -> str:
        """Deprecated: Use ollama_base_url instead"""
        return self.ollama_base_url

    @property
    def OLLAMA_TIMEOUT(self) -> int:
        """Deprecated: Use ollama_timeout instead"""
        return self.ollama_timeout

    @property
    def OLLAMA_DEFAULT_MODEL(self) -> str:
        """Deprecated: Use ollama_default_model instead"""
        return self.ollama_default_model

    # OpenAI 대문자 속성
    @property
    def OPENAI_API_KEY(self) -> str:
        return self.openai_api_key

    @property
    def OPENAI_DEFAULT_MODEL(self) -> str:
        return self.openai_default_model

    @property
    def OPENAI_TIMEOUT(self) -> int:
        return self.openai_timeout

    # Anthropic 대문자 속성
    @property
    def ANTHROPIC_API_KEY(self) -> str:
        return self.anthropic_api_key

    @property
    def ANTHROPIC_DEFAULT_MODEL(self) -> str:
        return self.anthropic_default_model

    @property
    def ANTHROPIC_TIMEOUT(self) -> int:
        return self.anthropic_timeout

    # Google 대문자 속성
    @property
    def GOOGLE_API_KEY(self) -> str:
        return self.google_api_key

    @property
    def GEMINI_TEXT_MODEL(self) -> str:
        return self.gemini_text_model

    @property
    def GEMINI_IMAGE_MODEL(self) -> str:
        return self.gemini_image_model

    @property
    def GEMINI_TIMEOUT(self) -> int:
        return self.gemini_timeout

    # Novita 대문자 속성
    @property
    def NOVITA_API_KEY(self) -> str:
        return self.novita_api_key

    @property
    def NOVITA_BASE_URL(self) -> str:
        return self.novita_base_url

    @property
    def NOVITA_DEFAULT_MODEL(self) -> str:
        return self.novita_default_model

    @property
    def NOVITA_TIMEOUT(self) -> int:
        return self.novita_timeout

    @property
    def COMFYUI_BASE_URL(self) -> str:
        """Deprecated: Use comfyui_base_url instead"""
        return self.comfyui_base_url

    @property
    def COMFYUI_TIMEOUT(self) -> int:
        """Deprecated: Use comfyui_timeout instead"""
        return self.comfyui_timeout

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

# Global settings instance
settings = Settings()
