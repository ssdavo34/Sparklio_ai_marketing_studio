"""
Agent API 테스트

6개 Agent API 엔드포인트 테스트

작성일: 2025-11-17
"""
import httpx
import asyncio
import json


BASE_URL = "http://localhost:8001/api/v1/agents"


async def test_list_agents():
    """Agent 목록 조회 테스트"""
    print("=" * 60)
    print("Test 1: List All Agents")
    print("=" * 60)

    url = f"{BASE_URL}/list"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()

            result = response.json()

            print(f"\n✅ Status: {response.status_code}")
            print(f"Total Agents: {len(result['agents'])}\n")

            for agent in result['agents']:
                print(f"  - {agent['name']}: {agent['description']}")
                print(f"    Tasks: {', '.join(agent['tasks'][:3])}...")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_copywriter_api():
    """Copywriter Agent API 테스트"""
    print("\n" + "=" * 60)
    print("Test 2: Copywriter Agent - Product Detail")
    print("=" * 60)

    url = f"{BASE_URL}/copywriter/execute"
    data = {
        "task": "product_detail",
        "payload": {
            "product_name": "프리미엄 무선 이어폰",
            "features": ["프리미엄 노이즈캔슬링", "24시간 배터리", "IPX7 방수"],
            "target_audience": "2030 직장인"
        },
        "options": {
            "tone": "professional",
            "length": "medium"
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data)
            response.raise_for_status()

            result = response.json()

            print(f"\n✅ Status: {response.status_code}")
            print(f"Agent: {result['agent']}")
            print(f"Task: {result['task']}")
            print(f"Outputs: {len(result['outputs'])}\n")

            for output in result['outputs']:
                print(f"  Output Name: {output['name']}")
                print(f"  Type: {output['type']}")

                if output['type'] == 'json':
                    value_str = json.dumps(
                        output['value'],
                        ensure_ascii=False,
                        indent=2
                    )
                    print(f"  Value: {value_str[:300]}...")

            print(f"\nUsage: {result['usage']}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_designer_api():
    """Designer Agent API 테스트 (ComfyUI 연결 실패 예상)"""
    print("\n" + "=" * 60)
    print("Test 3: Designer Agent - Product Image")
    print("=" * 60)

    url = f"{BASE_URL}/designer/execute"
    data = {
        "task": "product_image",
        "payload": {
            "product_name": "무선 이어폰",
            "description": "프리미엄 노이즈캔슬링",
            "style": "minimal"
        },
        "options": {
            "width": 1024,
            "height": 1024,
            "enhance_prompt": False
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data)
            response.raise_for_status()

            result = response.json()

            print(f"\n✅ Status: {response.status_code}")
            print(f"Agent: {result['agent']}")
            print(f"Outputs: {len(result['outputs'])}")

    except httpx.HTTPStatusError as e:
        print(f"⚠️  Expected Error (ComfyUI not connected): {e}")
    except Exception as e:
        print(f"❌ Error: {e}")


async def test_strategist_api():
    """Strategist Agent API 테스트"""
    print("\n" + "=" * 60)
    print("Test 4: Strategist Agent - Brand Kit")
    print("=" * 60)

    url = f"{BASE_URL}/strategist/execute"
    data = {
        "task": "brand_kit",
        "payload": {
            "brand_name": "EcoTech",
            "industry": "친환경 기술",
            "target_market": "환경의식 높은 MZ세대"
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data)
            response.raise_for_status()

            result = response.json()

            print(f"\n✅ Status: {response.status_code}")
            print(f"Agent: {result['agent']}")
            print(f"Outputs: {len(result['outputs'])}")
            print(f"Usage: {result['usage']}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_reviewer_api():
    """Reviewer Agent API 테스트"""
    print("\n" + "=" * 60)
    print("Test 5: Reviewer Agent - Content Review")
    print("=" * 60)

    url = f"{BASE_URL}/reviewer/execute"
    data = {
        "task": "content_review",
        "payload": {
            "content": {
                "headline": "완벽한 소음 차단의 시작",
                "body": "프리미엄 노이즈캔슬링 기술로 당신만의 조용한 공간을 만들어보세요."
            },
            "criteria": ["quality", "brand_fit", "effectiveness"]
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data)
            response.raise_for_status()

            result = response.json()

            print(f"\n✅ Status: {response.status_code}")
            print(f"Agent: {result['agent']}")
            print(f"Usage: {result['usage']}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_agent_info():
    """특정 Agent 정보 조회 테스트"""
    print("\n" + "=" * 60)
    print("Test 6: Agent Info - Copywriter")
    print("=" * 60)

    url = f"{BASE_URL}/copywriter/info"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()

            result = response.json()

            print(f"\n✅ Status: {response.status_code}")
            print(f"Name: {result['name']}")
            print(f"Description: {result['description']}")
            print(f"Tasks: {', '.join(result['tasks'])}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def main():
    """메인 테스트 실행"""
    print("\n🚀 Agent API 통합 테스트 시작\n")

    # Test 1: List Agents
    await test_list_agents()

    # Test 2: Copywriter
    await test_copywriter_api()

    # Test 3: Designer (ComfyUI 연결 실패 예상)
    await test_designer_api()

    # Test 4: Strategist
    await test_strategist_api()

    # Test 5: Reviewer
    await test_reviewer_api()

    # Test 6: Agent Info
    await test_agent_info()

    print("\n" + "=" * 60)
    print("✅ 모든 Agent API 테스트 완료")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
