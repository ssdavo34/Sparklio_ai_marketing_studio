"""
CopywriterAgent 단독 테스트 (간소화 버전)

실제 LLM 호출 후 outputs 구조 확인
"""
import asyncio
import json
from app.services.agents.copywriter import CopywriterAgent
from app.services.agents.base import AgentRequest


async def main():
    agent = CopywriterAgent()

    req = AgentRequest(
        task="product_detail",
        payload={
            "product_name": "프리미엄 무선 이어폰",
            "features": ["노이즈캔슬링", "24시간 배터리", "IPX7 방수"],
            "target_audience": "2030 직장인",
        },
        options={"tone": "professional"}
    )

    print("=" * 60)
    print("CopywriterAgent Output 진단")
    print("=" * 60)

    res = await agent.execute(req)

    print("\n[기본 정보]")
    print("agent:", res.agent)
    print("task:", res.task)
    print("outputs 개수:", len(res.outputs))
    print("usage:", res.usage)

    print("\n[outputs 상세]")
    for i, out in enumerate(res.outputs):
        print(f"\n  [{i}] type={out.type}, name={out.name}")
        v = out.value
        if isinstance(v, dict):
            print("    keys:", list(v.keys()))
            print("    json:")
            print(json.dumps(v, ensure_ascii=False, indent=4))
        else:
            preview = str(v)
            if len(preview) > 300:
                preview = preview[:300] + "..."
            print("    value:", preview)

    # GeneratorService와 동일한 로직으로 텍스트 추출
    print("\n" + "=" * 60)
    print("GeneratorService 로직 시뮬레이션")
    print("=" * 60)

    text_data = {}
    for out in res.outputs:
        if out.type == "json" and isinstance(out.value, dict):
            text_data.update(out.value)
        elif out.type == "text":
            text_data["body"] = out.value

    print("\n추출된 text_data:")
    print(json.dumps(text_data, ensure_ascii=False, indent=2))

    print("\n기대 필드 체크:")
    print("  headline:", "✅" if text_data.get("headline") else "❌", text_data.get("headline"))
    print("  subheadline:", "✅" if text_data.get("subheadline") else "❌", text_data.get("subheadline"))
    print("  body:", "✅" if text_data.get("body") else "❌", text_data.get("body", "")[:80] if text_data.get("body") else None)
    print("  bullets:", "✅" if text_data.get("bullets") else "❌", text_data.get("bullets"))
    print("  cta:", "✅" if text_data.get("cta") else "❌", text_data.get("cta"))


if __name__ == "__main__":
    asyncio.run(main())
