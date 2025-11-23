"""
CopywriterAgent RAW 출력 확인
Validation 없이 LLM의 실제 출력 확인
"""

import asyncio
import json
from app.services.agents.copywriter import CopywriterAgent
from app.services.agents.base import AgentRequest
from app.services.llm import get_llm_gateway


async def test_raw_output():
    """Validation 없이 LLM Raw 출력 확인"""

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
    print("🔍 LLM RAW Output Test")
    print("=" * 60)
    print()

    # LLM Gateway 직접 호출
    llm_gateway = get_llm_gateway()

    # Payload 구성 (CopywriterAgent._enhance_payload 로직 복제)
    enhanced_payload = request.payload.copy()
    if "language" not in enhanced_payload:
        enhanced_payload["language"] = "ko"

    print("📋 Enhanced Payload:")
    print(json.dumps(enhanced_payload, indent=2, ensure_ascii=False))
    print()

    # LLM 호출
    try:
        llm_response = await llm_gateway.generate(
            role="copywriter",
            task=request.task,
            payload=enhanced_payload,
            mode="json",
            options=request.options
        )

        print("✅ LLM Response Success!")
        print()
        print("📝 LLM Raw Output:")
        print(json.dumps(llm_response.output.value, indent=2, ensure_ascii=False))
        print()
        print("📊 Usage:")
        print(json.dumps(llm_response.usage, indent=2, ensure_ascii=False))
        print()

        # 정규화 함수 적용
        agent = CopywriterAgent()
        normalized = agent._normalize_product_detail(llm_response.output.value)

        print("🔄 Normalized Output:")
        print(json.dumps(normalized, indent=2, ensure_ascii=False))
        print()

    except Exception as e:
        print(f"❌ LLM Failed: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_raw_output())
