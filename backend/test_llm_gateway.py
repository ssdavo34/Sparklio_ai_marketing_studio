"""
LLM Gateway 직접 테스트

Live/Mock 모드 확인

작성일: 2025-11-17
"""
import asyncio
from app.services.llm.gateway import LLMGateway
from app.core.config import settings


async def test_llm_gateway():
    """LLM Gateway 직접 테스트"""
    print("=" * 60)
    print("LLM Gateway Test")
    print("=" * 60)

    print(f"\nSettings:")
    print(f"  GENERATOR_MODE: {settings.generator_mode}")
    print(f"  OLLAMA_BASE_URL: {settings.ollama_base_url}")
    print(f"  OLLAMA_DEFAULT_MODEL: {settings.ollama_default_model}")

    # LLM Gateway 초기화
    gateway = LLMGateway()

    print(f"\nInitialized Providers:")
    for name in gateway.providers.keys():
        print(f"  - {name}")

    # 간단한 생성 테스트
    print(f"\n" + "=" * 60)
    print("Test: Simple Generation")
    print("=" * 60)

    response = await gateway.generate(
        role="copywriter",
        task="test",
        payload={"test": "hello world"},
        mode="text"
    )

    print(f"\n✅ Response:")
    print(f"  Provider: {response.provider}")
    print(f"  Model: {response.model}")
    print(f"  Output Type: {response.output.get('type')}")
    print(f"  Tokens Used: {response.usage.get('total_tokens', 0)}")

    if response.provider == "mock":
        print(f"\n⚠️  Mock Provider가 사용되었습니다!")
        print(f"  Live 모드로 전환하려면:")
        print(f"  1. Ollama Provider 초기화 확인")
        print(f"  2. Network 연결 확인 (Tailscale)")
    else:
        print(f"\n✅ Live Provider 사용 중!")


if __name__ == "__main__":
    asyncio.run(test_llm_gateway())
