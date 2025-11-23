"""
Context Engineering Integration 테스트

Agent → LLM Gateway 연동이 제대로 작동하는지 검증

작성일: 2025-11-23
작성자: B팀 (Backend)
"""

import asyncio
import logging
from app.services.agents.copywriter import CopywriterAgent
from app.services.agents.base import AgentRequest

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_context_engineering():
    """
    Context Engineering 필드가 LLM Gateway로 전달되는지 테스트
    """
    print("\n" + "=" * 70)
    print("Context Engineering Integration 테스트")
    print("=" * 70)

    # CopywriterAgent 초기화
    agent = CopywriterAgent()

    # 테스트 요청
    request = AgentRequest(
        task="product_detail",
        payload={
            "product_name": "테스트용 무선 이어폰",
            "features": ["노이즈캔슬링", "30시간 배터리", "방수"],
            "target_audience": "2030 직장인"
        },
        options={
            "tone": "professional"
        }
    )

    # _enhance_payload 호출하여 확인
    enhanced_payload = agent._enhance_payload(request)

    print("\n📦 Enhanced Payload:")
    print("-" * 70)
    for key, value in enhanced_payload.items():
        if key.startswith("_"):
            print(f"  {key}: {value}")

    # 검증
    assert "_instructions" in enhanced_payload, "❌ _instructions 없음"
    assert "_output_structure" in enhanced_payload, "❌ _output_structure 없음"
    assert "_tone_guide" in enhanced_payload, "❌ _tone_guide 없음"

    print("\n✅ 모든 Context Engineering 필드가 정상적으로 추가되었습니다!")

    # 실제 Agent 실행 (Mock 모드)
    print("\n🚀 Agent 실행 테스트...")
    try:
        response = await agent.execute(request)

        print(f"\n✅ Agent 실행 성공!")
        print(f"  - Agent: {response.agent}")
        print(f"  - Task: {response.task}")
        print(f"  - Outputs: {len(response.outputs)}개")
        print(f"  - LLM Provider: {response.meta.get('llm_provider')}")
        print(f"  - LLM Model: {response.meta.get('llm_model')}")

        if response.outputs:
            output = response.outputs[0]
            print(f"\n📝 생성된 결과:")
            print(f"  Type: {output.type}")
            print(f"  Name: {output.name}")
            if output.type == "json":
                import json
                print(f"  Value:\n{json.dumps(output.value, indent=2, ensure_ascii=False)}")

    except Exception as e:
        print(f"❌ Agent 실행 실패: {str(e)}")
        import traceback
        traceback.print_exc()

    print("\n" + "=" * 70)
    print("테스트 완료!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(test_context_engineering())
