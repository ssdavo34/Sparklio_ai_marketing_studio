"""
httpx 연결 테스트 스크립트
"""
import httpx
import asyncio

async def test_httpx():
    """httpx로 Ollama 서버 연결 테스트"""
    url = "http://100.120.180.42:11434/api/tags"

    print(f"Testing httpx connection to: {url}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            result = response.json()

            print("✅ Connection successful!")
            print(f"Models: {len(result.get('models', []))}")
            for model in result.get('models', [])[:3]:
                print(f"  - {model['name']}")

            return True
    except Exception as e:
        print(f"❌ Connection failed: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_httpx())
    exit(0 if success else 1)
