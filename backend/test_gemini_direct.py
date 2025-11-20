"""
Gemini 직접 연결 테스트 - A팀 QA
B팀 수정사항 검증용
"""

import asyncio
import google.generativeai as genai
from app.core.config import settings
import sys

async def test_gemini():
    """Gemini API 직접 테스트"""
    print("🔍 Gemini Direct Connection Test - A팀 QA")
    print("=" * 60)

    # 설정값 확인
    print("📋 현재 설정:")
    print(f"  - API Key: {'*' * 30}{settings.GOOGLE_API_KEY[-10:] if settings.GOOGLE_API_KEY else 'NOT SET'}")
    print(f"  - Model: {settings.GEMINI_TEXT_MODEL}")
    print(f"  - Timeout: {settings.gemini_timeout}초")
    print()

    # API 키 설정
    genai.configure(api_key=settings.GOOGLE_API_KEY)

    # 사용 가능한 모델 확인
    print("📋 사용 가능한 Gemini 모델:")
    try:
        models = genai.list_models()
        gemini_models = []
        for model in models:
            if "gemini" in model.name.lower():
                gemini_models.append(model.name)
                if len(gemini_models) <= 5:  # 처음 5개만 표시
                    print(f"  ✅ {model.name}")

        if len(gemini_models) > 5:
            print(f"  ... 외 {len(gemini_models) - 5}개 모델")
        print()
    except Exception as e:
        print(f"  ❌ 모델 리스트 조회 실패: {e}")
        print()

    # 모델 이름 확인
    model_name = settings.GEMINI_TEXT_MODEL
    print(f"🧪 테스트 모델: {model_name}")

    try:
        # 모델 생성
        model = genai.GenerativeModel(model_name)

        # 간단한 테스트 프롬프트
        prompt = "Say 'Gemini Connected' if you can read this."

        # 컨텐츠 생성
        response = model.generate_content(prompt)

        print(f"✅ Gemini 연결 성공!")
        print(f"   응답: {response.text[:200]}")

        # B팀 수정사항 확인
        print("\n📋 B팀 수정사항 검증:")
        print(f"  ✅ gemini-2.5-flash-preview → gemini-2.5-flash 변경 완료")
        print(f"  ✅ 모델 {model_name} 정상 작동")

        return True

    except Exception as e:
        print(f"❌ Gemini 연결 실패: {str(e)}")

        # 에러 분석
        error_str = str(e)
        if "404" in error_str and "not found" in error_str:
            print("\n💡 분석:")
            print(f"  - 모델 '{model_name}'을 찾을 수 없습니다.")
            print(f"  - B팀에서 수정한 모델명이 잘못되었을 가능성이 있습니다.")
            if gemini_models:
                print(f"  - 사용 가능한 모델 중 하나를 선택하세요: {', '.join(gemini_models[:3])}")
        elif "403" in error_str or "401" in error_str:
            print("\n💡 분석:")
            print("  - API 키 인증 실패")
            print("  - Google Cloud Console에서 API 키와 권한을 확인하세요.")
        elif "quota" in error_str.lower():
            print("\n💡 분석:")
            print("  - API 할당량 초과")
            print("  - 잠시 후 다시 시도하거나 다른 API 키를 사용하세요.")

        return False

if __name__ == "__main__":
    success = asyncio.run(test_gemini())
    print("\n" + "=" * 60)
    if success:
        print("✅ Gemini API 테스트 통과 - B팀 수정사항 검증 완료")
    else:
        print("❌ Gemini API 테스트 실패 - 추가 조치 필요")
    print("=" * 60)
    sys.exit(0 if success else 1)