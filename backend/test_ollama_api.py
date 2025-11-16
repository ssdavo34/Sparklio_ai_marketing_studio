"""
Ollama LLM Gateway API 테스트

2025-11-16
"""
import httpx
import asyncio
import json


async def test_ollama_text_mode():
    """Ollama Provider - 텍스트 모드 테스트"""
    print("=" * 60)
    print("Test 1: Ollama Provider - Text Mode")
    print("=" * 60)

    url = "http://localhost:8001/api/v1/llm/generate"
    data = {
        "role": "copywriter",
        "task": "product_detail",
        "payload": {
            "product_name": "무선 이어폰",
            "features": ["노이즈 캔슬링", "24시간 배터리"]
        },
        "mode": "text"
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=data)
            response.raise_for_status()

            result = response.json()
            print(f"\n✅ Status: {response.status_code}")
            print(f"\nProvider: {result['provider']}")
            print(f"Model: {result['model']}")
            print(f"\nOutput Type: {result['output']['type']}")
            print(f"Output Value:\n{result['output']['value'][:200]}...")
            print(f"\nUsage: {result['usage']}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_ollama_json_mode():
    """Ollama Provider - JSON 모드 테스트"""
    print("\n" + "=" * 60)
    print("Test 2: Ollama Provider - JSON Mode")
    print("=" * 60)

    url = "http://localhost:8001/api/v1/llm/generate"
    data = {
        "role": "copywriter",
        "task": "product_detail",
        "payload": {
            "product_name": "무선 이어폰",
            "features": ["노이즈 캔슬링", "24시간 배터리"]
        },
        "mode": "json"
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=data)
            response.raise_for_status()

            result = response.json()
            print(f"\n✅ Status: {response.status_code}")
            print(f"\nProvider: {result['provider']}")
            print(f"Model: {result['model']}")
            print(f"\nOutput Type: {result['output']['type']}")
            print(f"Output Value:")
            print(json.dumps(result['output']['value'], indent=2, ensure_ascii=False))
            print(f"\nUsage: {result['usage']}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def main():
    """메인 테스트 실행"""
    print("\n🚀 Ollama LLM Gateway API 테스트 시작\n")

    # Test 1: Text Mode
    await test_ollama_text_mode()

    # Test 2: JSON Mode
    await test_ollama_json_mode()

    print("\n" + "=" * 60)
    print("✅ 모든 테스트 완료")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
