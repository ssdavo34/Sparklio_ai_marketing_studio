"""
Agent Output 진단 테스트

LLM 응답이 제대로 파싱되는지 확인

작성일: 2025-11-17
"""
import asyncio
import json
from app.services.llm.gateway import LLMGateway
from app.services.agents.copywriter import CopywriterAgent
from app.services.agents.base import AgentRequest, AgentContext


async def test_agent_output():
    """Agent의 실제 출력 확인"""
    print("=" * 60)
    print("Agent Output 진단")
    print("=" * 60)

    # CopywriterAgent 초기화
    agent = CopywriterAgent()

    # 간단한 요청
    request = AgentRequest(
        role="copywriter",
        task="product_detail",
        payload={
            "product_name": "프리미엄 무선 이어폰",
            "features": ["노이즈캔슬링", "24시간 배터리", "IPX7 방수"],
            "target_audience": "2030 직장인"
        },
        context=AgentContext(
            brand_id="test_brand",
            locale="ko-KR"
        )
    )

    print(f"\n📤 Request:")
    print(f"  role: {request.role}")
    print(f"  task: {request.task}")
    print(f"  payload: {json.dumps(request.payload, ensure_ascii=False, indent=2)}")

    # Agent 실행
    print(f"\n⚙️  실행 중...")
    response = await agent.execute(request)

    print(f"\n📥 Response:")
    print(f"  agent: {response.agent}")
    print(f"  status: {response.status}")
    print(f"  outputs 개수: {len(response.outputs)}")

    print(f"\n🔍 Outputs 상세:")
    for idx, output in enumerate(response.outputs):
        print(f"\n  [{idx}]")
        print(f"    type: {output.type}")
        print(f"    name: {output.name}")
        print(f"    value type: {type(output.value)}")

        if isinstance(output.value, dict):
            print(f"    value keys: {list(output.value.keys())}")
            print(f"    value: {json.dumps(output.value, ensure_ascii=False, indent=6)}")
        elif isinstance(output.value, str):
            print(f"    value (first 200 chars): {output.value[:200]}")
        else:
            print(f"    value: {output.value}")

    print(f"\n📊 Usage:")
    print(f"  {json.dumps(response.usage, ensure_ascii=False, indent=2)}")

    print(f"\n🔗 Metadata:")
    print(f"  {json.dumps(response.metadata, ensure_ascii=False, indent=2)}")

    # 텍스트 추출 시뮬레이션 (GeneratorService._build_response 로직)
    print(f"\n" + "=" * 60)
    print("텍스트 추출 시뮬레이션 (GeneratorService 로직)")
    print("=" * 60)

    text_data = {}
    for output in response.outputs:
        if output.type == "json" and isinstance(output.value, dict):
            text_data.update(output.value)
        elif output.type == "text":
            text_data["body"] = output.value

    print(f"\n📝 추출된 text_data:")
    print(f"  {json.dumps(text_data, ensure_ascii=False, indent=2)}")

    print(f"\n✅ 예상 필드:")
    print(f"  headline: {text_data.get('headline', 'MISSING')}")
    print(f"  subheadline: {text_data.get('subheadline', 'MISSING')}")
    print(f"  body: {text_data.get('body', 'MISSING')[:100] if text_data.get('body') else 'MISSING'}")
    print(f"  bullets: {text_data.get('bullets', 'MISSING')}")
    print(f"  cta: {text_data.get('cta', 'MISSING')}")


if __name__ == "__main__":
    asyncio.run(test_agent_output())
