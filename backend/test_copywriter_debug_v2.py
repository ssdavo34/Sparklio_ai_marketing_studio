"""
CopywriterAgent 디버그 테스트 (V2)
실제 LLM 출력과 Validation 결과 확인
"""

import asyncio
import json
from app.services.agents import get_copywriter_agent, AgentRequest


async def test_single_case():
    """단일 케이스 테스트"""

    # Golden Set Case 1
    request = AgentRequest(
        task="product_detail",
        payload={
            "product_name": "울트라 무선 이어폰 Pro",
            "features": ["ANC 노이즈캔슬링", "30시간 배터리", "IPX7 방수"],
            "target_audience": "2030 직장인",
            "category": "전자제품"
        },
        options={"tone": "professional", "length": "medium"}
    )

    print("=" * 60)
    print("🔍 CopywriterAgent Debug Test (V2)")
    print("=" * 60)
    print()
    print("📋 Input:")
    print(json.dumps(request.payload, indent=2, ensure_ascii=False))
    print()

    try:
        agent = get_copywriter_agent()
        response = await agent.execute(request)

        print("✅ Agent Success!")
        print()
        print("📝 Output:")
        for output in response.outputs:
            if output.type == "json":
                print(json.dumps(output.value, indent=2, ensure_ascii=False))
        print()
        print("📊 Usage:")
        print(json.dumps(response.usage, indent=2, ensure_ascii=False))
        print()

    except Exception as e:
        print(f"❌ Agent Failed: {str(e)}")
        print()

        # 에러 세부사항 출력
        if hasattr(e, 'details'):
            print("🔍 Error Details:")
            print(json.dumps(e.details, indent=2, ensure_ascii=False))
            print()


if __name__ == "__main__":
    asyncio.run(test_single_case())
