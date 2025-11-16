"""
Agent 통합 테스트

2025-11-16
"""
import httpx
import asyncio
import json


async def test_copywriter_agent():
    """Copywriter Agent - 제품 설명 생성 테스트"""
    print("=" * 60)
    print("Test 1: Copywriter Agent - Product Detail")
    print("=" * 60)

    # Agent는 직접 호출하지 않고, 추후 API 엔드포인트를 통해 호출
    # 현재는 Agent 클래스가 잘 import되는지 확인
    from app.services.agents import (
        get_copywriter_agent,
        AgentRequest
    )

    agent = get_copywriter_agent()

    request = AgentRequest(
        task="product_detail",
        payload={
            "product_name": "프리미엄 무선 이어폰",
            "features": ["프리미엄 노이즈캔슬링", "24시간 배터리", "IPX7 방수"],
            "target_audience": "2030 직장인"
        },
        options={
            "tone": "professional",
            "length": "medium"
        }
    )

    try:
        response = await agent.execute(request)

        print(f"\n✅ Agent: {response.agent}")
        print(f"Task: {response.task}")
        print(f"Outputs: {len(response.outputs)}")

        for output in response.outputs:
            print(f"\n  Output Name: {output.name}")
            print(f"  Type: {output.type}")

            if output.type == "json":
                print(f"  Value: {json.dumps(output.value, ensure_ascii=False, indent=2)}")
            else:
                print(f"  Value: {output.value[:200]}...")

        print(f"\nUsage: {response.usage}")
        print(f"Meta: {response.meta}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_designer_agent():
    """Designer Agent - 제품 이미지 생성 테스트"""
    print("\n" + "=" * 60)
    print("Test 2: Designer Agent - Product Image")
    print("=" * 60)

    from app.services.agents import (
        get_designer_agent,
        AgentRequest
    )

    agent = get_designer_agent()

    request = AgentRequest(
        task="product_image",
        payload={
            "product_name": "무선 이어폰",
            "description": "프리미엄 노이즈캔슬링",
            "style": "minimal"
        },
        options={
            "width": 1024,
            "height": 1024,
            "enhance_prompt": False  # LLM 프롬프트 개선 사용 안함 (빠른 테스트)
        }
    )

    try:
        response = await agent.execute(request)

        print(f"\n✅ Agent: {response.agent}")
        print(f"Task: {response.task}")
        print(f"Outputs: {len(response.outputs)}")

        for output in response.outputs:
            print(f"\n  Output Name: {output.name}")
            print(f"  Type: {output.type}")
            print(f"  Format: {output.meta.get('format', 'N/A')}")
            print(f"  Size: {output.meta.get('width', 'N/A')}x{output.meta.get('height', 'N/A')}")
            print(f"  Data (first 50 chars): {output.value[:50]}...")

        print(f"\nUsage: {response.usage}")
        print(f"Prompt: {response.meta.get('prompt', 'N/A')[:100]}...")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_strategist_agent():
    """Strategist Agent - 브랜드 전략 수립 테스트"""
    print("\n" + "=" * 60)
    print("Test 3: Strategist Agent - Brand Kit")
    print("=" * 60)

    from app.services.agents import (
        get_strategist_agent,
        AgentRequest
    )

    agent = get_strategist_agent()

    request = AgentRequest(
        task="brand_kit",
        payload={
            "brand_name": "EcoTech",
            "industry": "친환경 기술",
            "target_market": "환경의식 높은 MZ세대"
        }
    )

    try:
        response = await agent.execute(request)

        print(f"\n✅ Agent: {response.agent}")
        print(f"Task: {response.task}")
        print(f"Outputs: {len(response.outputs)}")

        for output in response.outputs:
            print(f"\n  Output Name: {output.name}")
            print(f"  Type: {output.type}")

            if output.type == "json":
                print(f"  Value: {json.dumps(output.value, ensure_ascii=False, indent=2)[:500]}...")

        print(f"\nUsage: {response.usage}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_reviewer_agent():
    """Reviewer Agent - 콘텐츠 검토 테스트"""
    print("\n" + "=" * 60)
    print("Test 4: Reviewer Agent - Content Review")
    print("=" * 60)

    from app.services.agents import (
        get_reviewer_agent,
        AgentRequest
    )

    agent = get_reviewer_agent()

    request = AgentRequest(
        task="content_review",
        payload={
            "content": {
                "headline": "완벽한 소음 차단의 시작",
                "body": "프리미엄 노이즈캔슬링 기술로 당신만의 조용한 공간을 만들어보세요."
            },
            "criteria": ["quality", "brand_fit", "effectiveness"]
        }
    )

    try:
        response = await agent.execute(request)

        print(f"\n✅ Agent: {response.agent}")
        print(f"Task: {response.task}")
        print(f"Outputs: {len(response.outputs)}")

        for output in response.outputs:
            print(f"\n  Output Name: {output.name}")
            print(f"  Type: {output.type}")

            if output.type == "json":
                print(f"  Value: {json.dumps(output.value, ensure_ascii=False, indent=2)[:500]}...")

        print(f"\nUsage: {response.usage}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_all_agents():
    """모든 Agent 임포트 테스트"""
    print("\n" + "=" * 60)
    print("Test: All Agents Import Check")
    print("=" * 60)

    try:
        from app.services.agents import (
            CopywriterAgent,
            StrategistAgent,
            DesignerAgent,
            ReviewerAgent,
            OptimizerAgent,
            EditorAgent,
            get_copywriter_agent,
            get_strategist_agent,
            get_designer_agent,
            get_reviewer_agent,
            get_optimizer_agent,
            get_editor_agent
        )

        print("\n✅ All Agent classes imported successfully!")

        # 각 Agent 인스턴스 생성 테스트
        agents = {
            "Copywriter": get_copywriter_agent(),
            "Strategist": get_strategist_agent(),
            "Designer": get_designer_agent(),
            "Reviewer": get_reviewer_agent(),
            "Optimizer": get_optimizer_agent(),
            "Editor": get_editor_agent()
        }

        print("\n✅ All Agents instantiated successfully!")
        for name, agent in agents.items():
            print(f"  - {name} Agent: {agent.name}")

    except Exception as e:
        print(f"❌ Import Error: {e}")


async def main():
    """메인 테스트 실행"""
    print("\n🚀 Agent 통합 테스트 시작\n")

    # Test 0: Import 확인
    await test_all_agents()

    # Test 1: Copywriter Agent
    await test_copywriter_agent()

    # Test 2: Designer Agent
    await test_designer_agent()

    # Test 3: Strategist Agent
    await test_strategist_agent()

    # Test 4: Reviewer Agent
    await test_reviewer_agent()

    print("\n" + "=" * 60)
    print("✅ 모든 Agent 테스트 완료")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
