"""
/api/v1/generate 엔드포인트 E2E 테스트 (전체)

P0 3개 Generator 테스트: Brand Kit, Product Detail, SNS
"""

import requests
import json
import sys

API_BASE = "http://100.123.51.5:8000"  # Mac mini 서버


def get_access_token():
    """
    로그인하여 access_token 획득
    """
    # 1. 회원가입 (이미 존재하면 skip)
    print("\n[1] 사용자 등록...")
    register_data = {
        "email": "test@sparklio.ai",
        "username": "testuser",
        "password": "test1234",
        "full_name": "Test User"
    }

    try:
        response = requests.post(
            f"{API_BASE}/api/v1/users/register",
            json=register_data,
            timeout=5
        )
        if response.status_code in [200, 201]:
            print("✅ 사용자 등록 성공")
        else:
            print(f"⚠️  사용자 이미 존재: {response.status_code}")
    except Exception as e:
        print(f"⚠️  등록 에러 (무시): {e}")

    # 2. 로그인
    print("\n[2] 로그인...")
    login_data = {
        "email": "test@sparklio.ai",
        "password": "test1234"
    }

    try:
        response = requests.post(
            f"{API_BASE}/api/v1/users/login",
            json=login_data,
            timeout=5
        )

        if response.status_code != 200:
            print(f"❌ 로그인 실패: {response.status_code}")
            print(f"   Response: {response.text}")
            return None

        token_data = response.json()
        access_token = token_data["access_token"]
        print(f"✅ 로그인 성공, token: {access_token[:20]}...")
        return access_token

    except Exception as e:
        print(f"❌ 로그인 에러: {e}")
        return None


def test_brand_kit(access_token):
    """
    Brand Kit Generator 테스트
    """
    print("\n" + "=" * 80)
    print("[Test 1] Brand Kit Generator")
    print("=" * 80)

    request_data = {
        "kind": "brand_kit",
        "brandId": "brand_test_001",
        "locale": "ko-KR",
        "input": {
            "brand": {
                "name": "자연주의 스킨케어 A",
                "industry": "beauty",
                "description": "피부 건강을 생각하는 자연주의 스킨케어 브랜드",
                "target_audience": "20-30대 여성, 직장인",
                "values": ["자연", "건강", "지속가능성"]
            }
        }
    }

    return call_generate_api(access_token, request_data, "brand_kit")


def test_product_detail(access_token):
    """
    Product Detail Generator 테스트
    """
    print("\n" + "=" * 80)
    print("[Test 2] Product Detail Generator")
    print("=" * 80)

    request_data = {
        "kind": "product_detail",
        "brandId": "brand_test_001",
        "locale": "ko-KR",
        "channel": "shop_detail",
        "input": {
            "product": {
                "name": "비타민C 세럼",
                "category": "스킨케어",
                "features": ["주름개선", "미백", "보습"],
                "price": 49000,
                "target_audience": "20-30대 여성",
                "usp": "99% 순도 비타민C"
            }
        }
    }

    return call_generate_api(access_token, request_data, "product_detail")


def test_sns(access_token):
    """
    SNS Generator 테스트
    """
    print("\n" + "=" * 80)
    print("[Test 3] SNS Generator")
    print("=" * 80)

    request_data = {
        "kind": "sns",
        "brandId": "brand_test_001",
        "locale": "ko-KR",
        "channel": "instagram",
        "input": {
            "post": {
                "purpose": "정보 공유",
                "topic": "겨울 스킨케어 팁",
                "format": "card_news",
                "card_count": 5,
                "style": "magazine"
            }
        }
    }

    return call_generate_api(access_token, request_data, "sns")


def call_generate_api(access_token, request_data, kind):
    """
    /api/v1/generate API 호출 공통 함수
    """
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(
            f"{API_BASE}/api/v1/generate",
            json=request_data,
            headers=headers,
            timeout=30
        )

        print(f"\nStatus Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()

            print(f"\n✅ {kind.upper()} Generator 성공!")
            print(f"Task ID: {result.get('taskId')}")
            print(f"Kind: {result.get('kind')}")

            # Text Blocks
            text_blocks = result.get("textBlocks", {})
            print(f"\nText Blocks: {len(text_blocks)}개")
            for key in list(text_blocks.keys())[:5]:  # 처음 5개만 출력
                value = text_blocks[key]
                if isinstance(value, str) and len(value) > 50:
                    value = value[:50] + "..."
                print(f"  - {key}: {value}")

            # Editor Document
            editor_doc = result.get("editorDocument", {})
            print(f"\nEditor Document:")
            print(f"  - documentId: {editor_doc.get('documentId')}")
            print(f"  - type: {editor_doc.get('type')}")
            print(f"  - pages: {len(editor_doc.get('pages', []))}개")

            # Meta
            meta = result.get("meta", {})
            print(f"\nMeta:")
            print(f"  - templates_used: {meta.get('templates_used')}")
            print(f"  - agents_trace: {len(meta.get('agents_trace', []))}개")
            print(f"  - is_mock: {meta.get('is_mock', False)}")

            # 결과 저장
            filename = f"test_result_{kind}.json"
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            print(f"\n💾 결과 저장: {filename}")

            return True

        else:
            print(f"\n❌ {kind.upper()} Generator 실패: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except Exception as e:
        print(f"\n❌ {kind.upper()} Generator 호출 에러: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """
    메인 테스트 실행
    """
    print("=" * 80)
    print("Sparklio P0 Generators E2E 테스트")
    print("=" * 80)

    # 로그인
    access_token = get_access_token()
    if not access_token:
        print("\n❌ 로그인 실패로 테스트 중단")
        sys.exit(1)

    # 3개 Generator 테스트
    results = {}
    results["brand_kit"] = test_brand_kit(access_token)
    results["product_detail"] = test_product_detail(access_token)
    results["sns"] = test_sns(access_token)

    # 최종 결과
    print("\n" + "=" * 80)
    print("최종 테스트 결과")
    print("=" * 80)

    for kind, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{kind:20s}: {status}")

    all_passed = all(results.values())
    print("\n" + "=" * 80)
    if all_passed:
        print("🎉 모든 테스트 통과!")
    else:
        print("⚠️  일부 테스트 실패")
    print("=" * 80)

    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
