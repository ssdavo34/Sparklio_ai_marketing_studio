"""
LLM Gateway API 테스트 (A팀 검증용)

올바른 스키마 사용: role, task, payload
"""
import httpx
import asyncio
import json


async def test_llm_health():
    """LLM Gateway Health Check"""
    print("=" * 60)
    print("Test 1: LLM Gateway Health Check")
    print("=" * 60)

    url = "http://localhost:8001/api/v1/llm/llm/health"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()

            result = response.json()
            print(f"\n✅ Status: {response.status_code}")
            print(f"\nGateway: {result.get('gateway')}")
            print(f"Mode: {result.get('mode')}")
            print(f"\nProviders:")
            for name, info in result.get('providers', {}).items():
                print(f"  {name}: {info.get('status')} (vendor: {info.get('vendor')})")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_llm_json_mode():
    """JSON Mode 테스트 - Copywriter Role"""
    print("\n" + "=" * 60)
    print("Test 2: LLM Generate - JSON Mode (Copywriter)")
    print("=" * 60)

    url = "http://localhost:8001/api/v1/llm/llm/generate"
    data = {
        "role": "copywriter",
        "task": "product_detail",
        "payload": {
            "product_name": "프리미엄 무선 이어폰",
            "features": ["노이즈 캔슬링", "24시간 배터리", "IPX7 방수"],
            "target_audience": "2030 세대"
        },
        "mode": "json",
        "options": {
            "temperature": 0.7
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data)
            response.raise_for_status()

            result = response.json()
            print(f"\n✅ Status: {response.status_code}")
            print(f"\nProvider: {result['provider']}")
            print(f"Model: {result['model']}")
            print(f"\nOutput Type: {result['output']['type']}")
            
            if result['output']['type'] == 'json':
                print(f"Output Value: {json.dumps(result['output']['value'], indent=2, ensure_ascii=False)}")
            else:
                print(f"Output Value: {result['output']['value'][:200]}...")
            
            print(f"\nUsage: {result['usage']}")
            print(f"Meta: {result['meta']}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_llm_text_mode():
    """Text Mode 테스트 - Strategist Role"""
    print("\n" + "=" * 60)
    print("Test 3: LLM Generate - Text Mode (Strategist)")
    print("=" * 60)

    url = "http://localhost:8001/api/v1/llm/llm/generate"
    data = {
        "role": "strategist",
        "task": "campaign_strategy",
        "payload": {
            "brand": "EcoLife",
            "product": "친환경 텀블러",
            "budget": "500만원",
            "period": "1개월"
        },
        "mode": "text",
        "options": {
            "temperature": 0.8
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data)
            response.raise_for_status()

            result = response.json()
            print(f"\n✅ Status: {response.status_code}")
            print(f"\nProvider: {result['provider']}")
            print(f"Model: {result['model']}")
            print(f"\nOutput Type: {result['output']['type']}")
            print(f"Output Value (first 200 chars): {str(result['output']['value'])[:200]}...")
            print(f"\nUsage: {result['usage']}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_debug_settings():
    """Debug Settings 확인"""
    print("\n" + "=" * 60)
    print("Test 4: Debug Settings")
    print("=" * 60)

    url = "http://localhost:8001/api/v1/debug/settings"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()

            result = response.json()
            print(f"\n✅ Status: {response.status_code}")
            print(f"\nGenerator Mode: {result.get('generator_mode')}")
            print(f"Ollama Base URL: {result.get('ollama_base_url')}")
            print(f"Ollama Model: {result.get('ollama_default_model')}")
            print(f"ComfyUI Base URL: {result.get('comfyui_base_url')}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def main():
    print("\n🚀 LLM Gateway 검증 테스트 시작\n")
    
    await test_debug_settings()
    await test_llm_health()
    await test_llm_json_mode()
    await test_llm_text_mode()
    
    print("\n" + "=" * 60)
    print("✅ LLM Gateway 테스트 완료")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
