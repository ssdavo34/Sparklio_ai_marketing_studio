"""
프롬프트 디버그 - 실제로 LLM에 전달되는 프롬프트 확인

작성일: 2025-11-17
"""
import asyncio
from app.services.llm.gateway import LLMGateway

async def main():
    gateway = LLMGateway()

    # 테스트 payload
    payload = {
        "product_name": "휴대폰 보호 제품",
        "features": ["충격 방지", "긁힘 방지", "슬림 디자인"],
        "target_audience": "스마트폰 사용자"
    }

    # 프롬프트 생성 (private 메서드 직접 호출)
    prompt = gateway._build_prompt("copywriter", "product_detail", payload)

    print("=" * 80)
    print("실제 LLM에 전달되는 프롬프트:")
    print("=" * 80)
    print(prompt)
    print("=" * 80)
    print(f"\n프롬프트 길이: {len(prompt)} 글자")

    # 제품명이 포함되어 있는지 확인
    if "휴대폰 보호 제품" in prompt:
        print("✅ 제품명 '휴대폰 보호 제품'이 프롬프트에 포함됨")
    else:
        print("❌ 제품명 '휴대폰 보호 제품'이 프롬프트에 없음!")

if __name__ == "__main__":
    asyncio.run(main())
