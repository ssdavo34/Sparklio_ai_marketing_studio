from pydantic_settings import BaseSettings
from typing import Optional
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

    # Generator Mode (mock | live)
    GENERATOR_MODE: str = "mock"

    # AI Workers - LLM (Ollama)
    OLLAMA_BASE_URL: str = "http://100.120.180.42:11434"
    OLLAMA_TIMEOUT: int = 120
    OLLAMA_DEFAULT_MODEL: str = "qwen2.5:7b"

    # AI Workers - Media (ComfyUI)
    COMFYUI_BASE_URL: str = "http://100.120.180.42:8188"
    COMFYUI_TIMEOUT: int = 300

    # Legacy endpoints (deprecated, use OLLAMA_BASE_URL instead)
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

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields from .env

# Global settings instance
settings = Settings()
