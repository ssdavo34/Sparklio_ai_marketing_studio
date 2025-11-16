"""
Media Gateway API 테스트

2025-11-16
"""
import httpx
import asyncio
import json


async def test_media_generate_mock():
    """Mock Provider - 이미지 생성 테스트"""
    print("=" * 60)
    print("Test 1: Mock Provider - Image Generation")
    print("=" * 60)

    url = "http://localhost:8001/api/v1/media/generate"
    data = {
        "prompt": "A modern wireless earbud product photo, white background, professional lighting",
        "task": "product_image",
        "media_type": "image",
        "options": {
            "width": 1024,
            "height": 1024
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
            print(f"\nOutputs: {len(result['outputs'])} image(s)")

            for idx, output in enumerate(result['outputs']):
                print(f"\nOutput {idx + 1}:")
                print(f"  Type: {output['type']}")
                print(f"  Format: {output['format']}")
                print(f"  Size: {output['width']}x{output['height']}")
                print(f"  Data (first 50 chars): {output['data'][:50]}...")

            print(f"\nUsage: {result['usage']}")
            print(f"Meta: {result['meta']}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_media_health():
    """Health Check 테스트"""
    print("\n" + "=" * 60)
    print("Test 2: Media Gateway Health Check")
    print("=" * 60)

    url = "http://localhost:8001/api/v1/media/health"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()

            result = response.json()
            print(f"\n✅ Status: {response.status_code}")
            print(f"\nGateway: {result['gateway']}")
            print(f"Mode: {result['mode']}")
            print(f"\nProviders:")
            for name, info in result['providers'].items():
                print(f"  {name}: {info['status']} (vendor: {info['vendor']})")

    except Exception as e:
        print(f"❌ Error: {e}")


async def main():
    """메인 테스트 실행"""
    print("\n🚀 Media Gateway API 테스트 시작\n")

    # Test 1: Mock Image Generation
    await test_media_generate_mock()

    # Test 2: Health Check
    await test_media_health()

    print("\n" + "=" * 60)
    print("✅ 모든 테스트 완료")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
