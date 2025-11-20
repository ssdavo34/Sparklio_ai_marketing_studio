"""
LLM Provider 실제 연결 상태 테스트
각 Provider가 실제로 API와 통신할 수 있는지 확인

작성일: 2025-11-20
작성자: B팀 (Backend)
"""

import asyncio
import sys
import os
from typing import Dict, Any

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings


async def test_openai_connection():
    """OpenAI API 연결 테스트"""
    print("\n🔍 OpenAI API 연결 테스트")
    print("-" * 40)

    try:
        from app.services.llm.providers.openai_provider import OpenAIProvider

        provider = OpenAIProvider()

        # 간단한 테스트 프롬프트
        response = await provider.chat(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Say 'OpenAI Connected' if you can read this."}],
            temperature=0.1
        )

        if response and response.content:
            print(f"✅ OpenAI 연결 성공!")
            print(f"   응답: {response.content[:100]}...")
            print(f"   모델: {response.model}")
            return True
        else:
            print("❌ OpenAI 응답 없음")
            return False

    except Exception as e:
        print(f"❌ OpenAI 연결 실패: {str(e)}")
        return False


async def test_anthropic_connection():
    """Anthropic (Claude) API 연결 테스트"""
    print("\n🔍 Anthropic (Claude) API 연결 테스트")
    print("-" * 40)

    try:
        from app.services.llm.providers.anthropic_provider import AnthropicProvider

        provider = AnthropicProvider()

        # 간단한 테스트 프롬프트
        response = await provider.chat(
            model="claude-3-5-haiku-20241022",
            messages=[{"role": "user", "content": "Say 'Claude Connected' if you can read this."}],
            temperature=0.1
        )

        if response and response.content:
            print(f"✅ Anthropic 연결 성공!")
            print(f"   응답: {response.content[:100]}...")
            print(f"   모델: {response.model}")
            return True
        else:
            print("❌ Anthropic 응답 없음")
            return False

    except Exception as e:
        print(f"❌ Anthropic 연결 실패: {str(e)}")
        return False


async def test_gemini_connection():
    """Google Gemini API 연결 테스트"""
    print("\n🔍 Google Gemini API 연결 테스트")
    print("-" * 40)

    try:
        from app.services.llm.providers.gemini_provider import GeminiProvider

        provider = GeminiProvider()

        # 간단한 테스트 프롬프트
        response = await provider.chat(
            model="gemini-2.0-flash-exp",
            messages=[{"role": "user", "content": "Say 'Gemini Connected' if you can read this."}],
            temperature=0.1
        )

        if response and response.content:
            print(f"✅ Gemini 연결 성공!")
            print(f"   응답: {response.content[:100]}...")
            print(f"   모델: {response.model}")
            return True
        else:
            print("❌ Gemini 응답 없음")
            return False

    except Exception as e:
        print(f"❌ Gemini 연결 실패: {str(e)}")
        return False


async def test_ollama_connection():
    """Ollama API 연결 테스트"""
    print("\n🔍 Ollama API 연결 테스트")
    print("-" * 40)

    try:
        from app.services.llm.providers.ollama import OllamaProvider

        provider = OllamaProvider()

        # 간단한 테스트 프롬프트
        response = await provider.chat(
            model="qwen2.5:7b",
            messages=[{"role": "user", "content": "Say 'Ollama Connected' if you can read this."}],
            temperature=0.1
        )

        if response and response.content:
            print(f"✅ Ollama 연결 성공!")
            print(f"   응답: {response.content[:100]}...")
            print(f"   모델: {response.model}")
            return True
        else:
            print("❌ Ollama 응답 없음")
            return False

    except Exception as e:
        print(f"❌ Ollama 연결 실패: {str(e)}")
        print(f"   (Ollama 서버가 {settings.OLLAMA_BASE_URL}에서 실행 중인지 확인하세요)")
        return False


async def test_llm_gateway():
    """LLM Gateway 통합 테스트"""
    print("\n🔍 LLM Gateway 통합 테스트")
    print("-" * 40)

    try:
        from app.services.llm import LLMGateway

        gateway = LLMGateway()

        # 각 Provider로 테스트
        test_cases = [
            ("gpt-4o-mini", "openai"),
            ("claude-3-5-haiku-20241022", "anthropic"),
            ("gemini-2.0-flash-exp", "gemini"),
            # ("qwen2.5:7b", "ollama")  # Ollama는 로컬 서버 필요
        ]

        results = []
        for model, expected_provider in test_cases:
            try:
                response = await gateway.chat(
                    model=model,
                    messages=[{"role": "user", "content": f"Say 'Hello from {model}'"}],
                    temperature=0.1
                )

                if response and response.content:
                    print(f"✅ {model:30} → 성공")
                    results.append(True)
                else:
                    print(f"❌ {model:30} → 응답 없음")
                    results.append(False)

            except Exception as e:
                print(f"❌ {model:30} → 실패: {str(e)[:50]}...")
                results.append(False)

        return all(results) if results else False

    except Exception as e:
        print(f"❌ LLM Gateway 테스트 실패: {str(e)}")
        return False


async def check_api_keys():
    """API 키 설정 확인"""
    print("\n📋 API 키 설정 확인")
    print("-" * 40)

    keys_status = {
        "OpenAI": bool(getattr(settings, 'OPENAI_API_KEY', None)),
        "Anthropic": bool(getattr(settings, 'ANTHROPIC_API_KEY', None)),
        "Google (Gemini)": bool(getattr(settings, 'GOOGLE_API_KEY', None)),
        "Ollama URL": bool(getattr(settings, 'OLLAMA_BASE_URL', None))
    }

    for provider, has_key in keys_status.items():
        status = "✅ 설정됨" if has_key else "❌ 미설정"
        print(f"{provider:15} : {status}")

    return all(keys_status.values())


async def main():
    """메인 테스트 실행"""
    print("=" * 50)
    print("🚀 LLM Provider 연결 상태 종합 테스트")
    print("=" * 50)

    # API 키 확인
    keys_ok = await check_api_keys()

    if not keys_ok:
        print("\n⚠️ 일부 API 키가 설정되지 않았습니다.")
        print("   .env 파일을 확인해주세요.")

    # 각 Provider 테스트
    results = {
        "OpenAI": await test_openai_connection(),
        "Anthropic": await test_anthropic_connection(),
        "Gemini": await test_gemini_connection(),
        "Ollama": await test_ollama_connection()
    }

    # LLM Gateway 통합 테스트
    gateway_ok = await test_llm_gateway()

    # 결과 요약
    print("\n" + "=" * 50)
    print("📊 테스트 결과 요약")
    print("=" * 50)

    for provider, success in results.items():
        status = "✅ 정상" if success else "❌ 실패"
        print(f"{provider:15} : {status}")

    print(f"{'LLM Gateway':15} : {'✅ 정상' if gateway_ok else '❌ 실패'}")

    # 전체 상태
    all_success = all(results.values()) and gateway_ok

    print("\n" + "=" * 50)
    if all_success:
        print("🎉 모든 LLM Provider가 정상적으로 연결되었습니다!")
    else:
        print("⚠️ 일부 Provider 연결에 문제가 있습니다.")
        print("\n📝 확인 사항:")
        if not results["OpenAI"]:
            print("  - OpenAI API 키가 유효한지 확인")
        if not results["Anthropic"]:
            print("  - Anthropic API 키가 유효한지 확인")
        if not results["Gemini"]:
            print("  - Google API 키가 유효한지 확인")
        if not results["Ollama"]:
            print(f"  - Ollama 서버가 {settings.OLLAMA_BASE_URL}에서 실행 중인지 확인")

    return all_success


if __name__ == "__main__":
    # 이벤트 루프 실행
    success = asyncio.run(main())

    # 종료 코드
    exit(0 if success else 1)