"""
이미지 생성 테스트 스크립트

Media Gateway를 통한 이미지 생성 테스트
"""
import asyncio
from app.services.media.gateway import get_media_gateway


async def main():
    print("=" * 60)
    print("이미지 생성 테스트")
    print("=" * 60)

    gateway = get_media_gateway()

    # 간단한 프롬프트로 테스트
    prompt = "A modern smartphone with a sleek design"
    task = "product_image"

    print(f"\n프롬프트: {prompt}")
    print(f"작업 유형: {task}")
    print("\n이미지 생성 시작...")

    try:
        response = await gateway.generate(
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
