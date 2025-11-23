"""
CopywriterAgent 디버그 테스트
현재 출력을 확인하기 위한 스크립트
"""
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.services.agents import get_copywriter_agent, AgentRequest


async def test_single_case():
    """Golden Set의 첫 번째 케이스를 테스트"""

    # Golden Set 로드
    golden_path = Path("tests/golden_sets/copywriter_golden_set.json")
    with open(golden_path, "r", encoding="utf-8") as f:
        golden_data = json.load(f)

    case = golden_data["golden_cases"][0]  # golden_001

    print("=" * 80)
    print(f"📝 Testing: {case['scenario']}")
    print("=" * 80)

    # Agent 실행
    agent = get_copywriter_agent()

    request = AgentRequest(
        task=case["input"]["task"],
        payload=case["input"]["payload"],
        options=case["input"]["options"]
    )

    print("\n📥 INPUT:")
    print(json.dumps(case["input"]["payload"], indent=2, ensure_ascii=False))

    try:
        response = await agent.execute(request)

        print("\n📤 ACTUAL OUTPUT:")
        actual = response.outputs[0].value
        print(json.dumps(actual, indent=2, ensure_ascii=False))

        print("\n🎯 EXPECTED OUTPUT:")
        expected = case["expected_output"]
        print(json.dumps(expected, indent=2, ensure_ascii=False))

        print("\n📊 COMPARISON:")
        for field in ["headline", "subheadline", "body", "bullets", "cta"]:
            if field in actual and field in expected:
                print(f"\n{field.upper()}:")
                print(f"  Expected: {expected[field]}")
                print(f"  Actual:   {actual[field]}")
                if field != "bullets":
                    print(f"  Length:   {len(str(actual[field]))} chars")
            else:
                print(f"\n{field.upper()}: ❌ MISSING")

        print("\n✅ Test completed")

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_single_case())
