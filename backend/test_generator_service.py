"""
GeneratorService 테스트

GeneratorService와 /api/v1/generate 엔드포인트 검증

작성일: 2025-11-17
"""
import asyncio
import httpx
import json


BASE_URL = "http://localhost:8001/api/v1"


async def test_list_kinds():
    """사용 가능한 kind 목록 조회 테스트"""
    print("=" * 60)
    print("Test 1: List Available Kinds")
    print("=" * 60)

    url = f"{BASE_URL}/generate/kinds"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()

            result = response.json()

            print(f"\n✅ Status: {response.status_code}")
            print(f"Total Kinds: {len(result['kinds'])}\n")

            for kind_info in result['kinds']:
                print(f"  - {kind_info['kind']}: {kind_info['description']}")
                print(f"    Workflow: {kind_info['workflow']}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_generate_product_detail():
    """Product Detail 생성 테스트"""
    print("\n" + "=" * 60)
    print("Test 2: Generate Product Detail")
    print("=" * 60)

    url = f"{BASE_URL}/generate"
    data = {
        "kind": "product_detail",
        "brandId": "brand_demo",
        "input": {
            "product_name": "프리미엄 무선 이어폰",
            "features": [
                "프리미엄 노이즈캔슬링",
                "24시간 배터리",
                "IPX7 방수"
            ],
            "target_audience": "2030 직장인"
        },
        "options": {
            "tone": "professional",
            "length": "medium"
        }
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            print(f"\n📤 Request:")
            print(json.dumps(data, ensure_ascii=False, indent=2))

            response = await client.post(url, json=data)
            response.raise_for_status()

            result = response.json()

            print(f"\n✅ Status: {response.status_code}")
            print(f"Kind: {result['kind']}")
            print(f"Document ID: {result['document']['documentId']}")
            print(f"Document Type: {result['document']['type']}")

            print(f"\n📝 Generated Text:")
            text = result['text']
            if text.get('headline'):
                print(f"  Headline: {text['headline']}")
            if text.get('subheadline'):
                print(f"  Subheadline: {text['subheadline']}")
            if text.get('body'):
                body_preview = text['body'][:100] + "..." if len(
                    text['body']) > 100 else text['body']
                print(f"  Body: {body_preview}")
            if text.get('bullets'):
                print(f"  Bullets: {text['bullets']}")

            print(f"\n📊 Meta:")
            meta = result['meta']
            print(f"  Workflow: {meta['workflow']}")
            print(f"  Agents Used: {', '.join(meta['agents_used'])}")
            print(f"  Elapsed: {meta['elapsed_seconds']:.2f}s")
            print(f"  Tokens Used: {meta['tokens_used']}")
            print(f"  Steps: {meta['steps_completed']}/{meta['total_steps']}")

    except httpx.HTTPStatusError as e:
        print(f"❌ HTTP Error: {e}")
        print(f"Response: {e.response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")


async def test_generate_brand_identity():
    """Brand Identity 생성 테스트"""
    print("\n" + "=" * 60)
    print("Test 3: Generate Brand Identity")
    print("=" * 60)

    url = f"{BASE_URL}/generate"
    data = {
        "kind": "brand_identity",
        "brandId": "brand_ecotech",
        "input": {
            "brand_name": "EcoTech",
            "industry": "친환경 기술",
            "target_market": "환경의식 높은 MZ세대"
        }
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            print(f"\n📤 Request:")
            print(json.dumps(data, ensure_ascii=False, indent=2))

            response = await client.post(url, json=data)
            response.raise_for_status()

            result = response.json()

            print(f"\n✅ Status: {response.status_code}")
            print(f"Kind: {result['kind']}")
            print(f"Document ID: {result['document']['documentId']}")

            print(f"\n📊 Meta:")
            meta = result['meta']
            print(f"  Workflow: {meta['workflow']}")
            print(f"  Agents Used: {', '.join(meta['agents_used'])}")
            print(f"  Elapsed: {meta['elapsed_seconds']:.2f}s")
            print(f"  Steps: {meta['steps_completed']}/{meta['total_steps']}")

    except httpx.HTTPStatusError as e:
        print(f"❌ HTTP Error: {e}")
        print(f"Response: {e.response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")


async def test_generate_invalid_kind():
    """잘못된 kind 에러 처리 테스트"""
    print("\n" + "=" * 60)
    print("Test 4: Invalid Kind Error Handling")
    print("=" * 60)

    url = f"{BASE_URL}/generate"
    data = {
        "kind": "invalid_kind",
        "brandId": "brand_demo",
        "input": {}
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=data)

            if response.status_code == 400:
                print(f"\n✅ Expected Error: HTTP {response.status_code}")
                error = response.json()
                print(f"Error Detail: {error.get('detail', 'N/A')}")
            else:
                print(f"⚠️ Unexpected Status: {response.status_code}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_sns_set():
    """SNS Set 생성 테스트"""
    print("\n" + "=" * 60)
    print("Test 5: Generate SNS Set")
    print("=" * 60)

    url = f"{BASE_URL}/generate"
    data = {
        "kind": "sns_set",
        "brandId": "brand_demo",
        "input": {
            "product_name": "친환경 텀블러",
            "features": ["이중 단열", "24시간 보온", "재활용 소재"],
            "target_audience": "환경 의식 높은 2030"
        }
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=data)
            response.raise_for_status()

            result = response.json()

            print(f"\n✅ Status: {response.status_code}")
            print(f"Kind: {result['kind']}")
            print(f"Workflow: {result['meta']['workflow']}")
            print(f"Elapsed: {result['meta']['elapsed_seconds']:.2f}s")

    except httpx.HTTPStatusError as e:
        print(f"❌ HTTP Error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")


async def main():
    """메인 테스트 실행"""
    print("\n🚀 GeneratorService 통합 테스트 시작\n")

    # Test 1: List Kinds
    await test_list_kinds()

    # Test 2: Product Detail
    await test_generate_product_detail()

    # Test 3: Brand Identity
    await test_generate_brand_identity()

    # Test 4: Invalid Kind
    await test_generate_invalid_kind()

    # Test 5: SNS Set
    await test_sns_set()

    print("\n" + "=" * 60)
    print("✅ 모든 GeneratorService 테스트 완료")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
