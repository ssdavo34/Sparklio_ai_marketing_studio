"""
ComfyUI 직접 테스트

ComfyUIProvider를 직접 호출해서 테스트
"""
import asyncio
from app.core.config import settings
from app.services.media.providers.comfyui import ComfyUIProvider


async def main():
    print("=" * 60)
    print("ComfyUI 직접 테스트")
    print("=" * 60)

    print(f"\nComfyUI URL: {settings.comfyui_base_url}")

    provider = ComfyUIProvider(
        base_url=settings.comfyui_base_url,
        timeout=settings.comfyui_timeout
    )

    # 헬스 체크 먼저
    print("\n헬스 체크 중...")
    is_healthy = await provider.health_check()
    if is_healthy:
        print("✅ ComfyUI 서버 정상")
    else:
        print("❌ ComfyUI 서버 접속 불가")
        return

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
