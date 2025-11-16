"""
Media Gateway 엣지 케이스 테스트

A팀 검증용
"""
import httpx
import asyncio
import json


async def test_invalid_media_type():
    """잘못된 media_type 테스트"""
    print("=" * 60)
    print("Test: Invalid media_type")
    print("=" * 60)

    url = "http://localhost:8001/api/v1/media/generate"
    data = {
        "prompt": "Test prompt",
        "task": "product_image",
        "media_type": "invalid_type",  # 잘못된 타입
        "options": {}
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=data)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Expected error: {e}")


async def test_missing_required_fields():
    """필수 필드 누락 테스트"""
    print("\n" + "=" * 60)
    print("Test: Missing required fields")
    print("=" * 60)

    url = "http://localhost:8001/api/v1/media/generate"
    data = {
        "prompt": "Test prompt"
        # task 누락
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=data)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Expected error: {e}")


async def test_large_dimensions():
    """큰 이미지 크기 테스트"""
    print("\n" + "=" * 60)
    print("Test: Large dimensions")
    print("=" * 60)

    url = "http://localhost:8001/api/v1/media/generate"
    data = {
        "prompt": "Test large image",
        "task": "product_image",
        "media_type": "image",
        "options": {
            "width": 2048,
            "height": 2048
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data)
            result = response.json()
            print(f"✅ Status: {response.status_code}")
            print(f"Output size: {result['outputs'][0]['width']}x{result['outputs'][0]['height']}")
    except Exception as e:
        print(f"❌ Error: {e}")


async def test_empty_prompt():
    """빈 프롬프트 테스트"""
    print("\n" + "=" * 60)
    print("Test: Empty prompt")
    print("=" * 60)

    url = "http://localhost:8001/api/v1/media/generate"
    data = {
        "prompt": "",  # 빈 프롬프트
        "task": "product_image",
        "media_type": "image"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=data)
            result = response.json()
            print(f"✅ Status: {response.status_code}")
            print(f"Provider: {result['provider']}")
    except Exception as e:
        print(f"Error: {e}")


async def main():
    print("\n🧪 Media Gateway 엣지 케이스 테스트\n")
    
    await test_invalid_media_type()
    await test_missing_required_fields()
    await test_large_dimensions()
    await test_empty_prompt()
    
    print("\n" + "=" * 60)
    print("✅ 엣지 케이스 테스트 완료")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
