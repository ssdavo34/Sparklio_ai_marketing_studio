"""
Ollama API 직접 테스트
"""
import httpx
import asyncio
import json

async def test_ollama_generate():
    """Ollama API /api/generate 엔드포인트 테스트"""
    base_url = "http://100.120.180.42:11434"
    api_url = f"{base_url}/api/generate"

    print(f"Testing Ollama API: {api_url}")

    # Request payload
    payload = {
        "model": "qwen2.5:7b",
        "prompt": "안녕하세요",
        "stream": False
    }

    try:
        # 방법 1: base_url 없이 전체 URL 사용
        print("\n=== Test 1: AsyncClient without base_url ===")
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(api_url, json=payload)
            response.raise_for_status()
            result = response.json()

            print(f"✅ Success with full URL!")
            print(f"Response: {result.get('response', '')[:100]}...")

    except Exception as e:
        print(f"❌ Test 1 failed: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()

    try:
        # 방법 2: base_url 파라미터 사용
        print("\n=== Test 2: AsyncClient with base_url ===")
        async with httpx.AsyncClient(base_url=base_url, timeout=30.0) as client:
            response = await client.post("/api/generate", json=payload)
            response.raise_for_status()
            result = response.json()

            print(f"✅ Success with base_url!")
            print(f"Response: {result.get('response', '')[:100]}...")

    except Exception as e:
        print(f"❌ Test 2 failed: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_ollama_generate())
