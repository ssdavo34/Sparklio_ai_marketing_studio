"""
Google Gemini 사용 가능한 모델 목록 확인
"""

import google.generativeai as genai
from app.core.config import settings

# API 키 설정
genai.configure(api_key=settings.GOOGLE_API_KEY)

# 사용 가능한 모델 목록 확인
print("📋 Google Gemini 사용 가능한 모델 목록:")
print("=" * 60)

for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(f"✅ {model.name}")
        print(f"   - Display Name: {model.display_name}")
        print(f"   - Description: {model.description[:100]}...")
        print()

print("=" * 60)
print("\n사용 가능한 모델 중 하나를 .env 파일에 설정하세요.")
print("예: GEMINI_TEXT_MODEL=gemini-1.5-flash")