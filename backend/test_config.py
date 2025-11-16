"""
Config 테스트

Pydantic Settings가 .env 파일을 제대로 읽는지 확인
"""
import os
from pathlib import Path

# 1. 현재 작업 디렉토리
print(f"Current working directory: {os.getcwd()}")

# 2. .env 파일 존재 확인
env_path = Path(".env")
print(f"\n.env file exists: {env_path.exists()}")
if env_path.exists():
    print(f".env absolute path: {env_path.absolute()}")
    with open(env_path) as f:
        for line in f:
            if "GENERATOR_MODE" in line:
                print(f"  .env content: {line.strip()}")

# 3. 환경 변수 확인
print(f"\nOS environ GENERATOR_MODE: {os.getenv('GENERATOR_MODE')}")

# 4. Pydantic Settings 로드
from app.core.config import settings

print(f"\nPydantic Settings:")
print(f"  GENERATOR_MODE: {settings.GENERATOR_MODE}")
print(f"  OLLAMA_BASE_URL: {settings.OLLAMA_BASE_URL}")

# 5. Settings class 정보
print(f"\nSettings class info:")
print(f"  env_file: {settings.Config.env_file}")
print(f"  case_sensitive: {settings.Config.case_sensitive}")
