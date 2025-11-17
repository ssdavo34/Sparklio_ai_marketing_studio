"""
나노바나나 직접 테스트

NanoBananaProvider를 직접 호출해서 테스트
"""
import asyncio
from app.core.config import settings
from app.services.media.providers.nanobanana_provider import NanoBananaProvider


async def main():
    print("=" * 60)
    print("나노바나나 직접 테스트")
    print("=" * 60)

    print(f"\nGoogle API Key: {settings.GOOGLE_API_KEY[:20]}...")
    print(f"이미지 모델: {settings.GEMINI_IMAGE_MODEL}")

    provider = NanoBananaProvider(
        api_key=settings.GOOGLE_API_KEY,
        default_model=settings.GEMINI_IMAGE_MODEL,
        timeout=settings.GEMINI_TIMEOUT
    )

    prompt = "A modern smartphone with a sleek design"
    task = "product_image"

    print(f"\n프롬프트: {prompt}")
    print(f"작업 유형: {task}")
    print("\n이미지 생성 시작...")

    try:
        response = await provider.generate(
            prompt=prompt,
            task=task,
            media_type="image"
        )

        print("\n✅ 이미지 생성 성공!")
        print(f"Provider: {response.provider}")
        print(f"Model: {response.model}")
        print(f"생성된 이미지 수: {len(response.outputs)}")
        print(f"Usage: {response.usage}")

        for i, output in enumerate(response.outputs):
            print(f"\n이미지 {i+1}:")
            print(f"  - 타입: {output.type}")
            print(f"  - 포맷: {output.format}")
            print(f"  - 크기: {output.width}x{output.height}" if output.width else "  - 크기: 정보 없음")
            print(f"  - 데이터 길이: {len(output.data)} bytes")

    except Exception as e:
        print(f"\n❌ 에러 발생: {type(e).__name__}")
        print(f"메시지: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
