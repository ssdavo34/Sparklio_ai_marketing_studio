"""
/api/v1/generate 엔드포인트 E2E 테스트

BrandKitGenerator 테스트
"""

import requests
import json

API_BASE = "http://100.123.51.5:8000"  # Mac mini 서버

def test_generate_brand_kit():
    """
    Brand Kit Generator E2E 테스트
    """
    print("=" * 80)
    print("Brand Kit Generator E2E 테스트")
    print("=" * 80)

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
        if response.status_code == 200:
            print("✅ 사용자 등록 성공")
        else:
            print(f"⚠️  사용자 이미 존재 또는 등록 실패: {response.status_code}")
    except Exception as e:
        print(f"❌ 사용자 등록 에러: {e}")

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
            return

        token_data = response.json()
        access_token = token_data["access_token"]
        print(f"✅ 로그인 성공, token: {access_token[:20]}...")

    except Exception as e:
        print(f"❌ 로그인 에러: {e}")
        return

    # 3. /api/v1/generate 호출 (Brand Kit)
    print("\n[3] /api/v1/generate 호출 (kind=brand_kit)...")

    generate_request = {
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

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(
            f"{API_BASE}/api/v1/generate",
            json=generate_request,
            headers=headers,
            timeout=30
        )

        print(f"\nStatus Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()

            print("\n" + "=" * 80)
            print("✅ Generator 실행 성공!")
            print("=" * 80)

            print(f"\n[Task ID] {result.get('taskId')}")
            print(f"[Kind] {result.get('kind')}")

            print("\n[Text Blocks]")
            text_blocks = result.get("textBlocks", {})
            for key, value in text_blocks.items():
                print(f"  - {key}: {value}")

            print("\n[Editor Document]")
            editor_doc = result.get("editorDocument", {})
            print(f"  - documentId: {editor_doc.get('documentId')}")
            print(f"  - type: {editor_doc.get('type')}")
            print(f"  - brandId: {editor_doc.get('brandId')}")
            print(f"  - pages: {len(editor_doc.get('pages', []))}개")

            if editor_doc.get("pages"):
                page = editor_doc["pages"][0]
                print(f"\n  [Page 1]")
                print(f"    - id: {page.get('id')}")
                print(f"    - name: {page.get('name')}")
                print(f"    - size: {page.get('width')}x{page.get('height')}")
                print(f"    - objects: {len(page.get('objects', []))}개")

                for obj in page.get("objects", []):
                    print(f"      - {obj.get('role', 'N/A')}: {obj.get('type')}")

            print("\n[Meta]")
            meta = result.get("meta", {})
            print(f"  - templates_used: {meta.get('templates_used')}")
            print(f"  - agents_trace: {len(meta.get('agents_trace', []))}개 trace")
            print(f"  - llm_cost: {meta.get('llm_cost')}")

            print("\n" + "=" * 80)
            print("테스트 완료!")
            print("=" * 80)

            # 결과 JSON 파일로 저장
            with open("test_result_brand_kit.json", "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2, ensure_ascii=False)

            print("\n💾 결과 저장: test_result_brand_kit.json")

        else:
            print(f"\n❌ Generator 실행 실패: {response.status_code}")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"\n❌ Generator 호출 에러: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    test_generate_brand_kit()
