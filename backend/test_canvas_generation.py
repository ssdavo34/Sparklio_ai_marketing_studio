"""
Canvas 생성 테스트

Fabric.js 호환 Canvas 객체 생성 검증

작성일: 2025-11-17
"""
import asyncio
import httpx
import json


BASE_URL = "http://localhost:8001/api/v1"


async def test_canvas_generation():
    """Canvas 객체 생성 테스트"""
    print("=" * 60)
    print("Canvas 생성 테스트")
    print("=" * 60)

    url = f"{BASE_URL}/generate"
    data = {
        "kind": "product_detail",
        "brandId": "brand_test",
        "input": {
            "product_name": "프리미엄 무선 이어폰",
            "features": ["노이즈캔슬링", "24시간 배터리", "IPX7 방수"],
            "target_audience": "2030 직장인"
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
            print(f"Document ID: {result['document']['documentId']}")

            # Canvas JSON 확인
            canvas_json = result['document']['canvas_json']
            print(f"\n📊 Canvas JSON:")
            print(f"  Version: {canvas_json.get('version')}")
            print(f"  Background: {canvas_json.get('background')}")
            print(f"  Objects Count: {len(canvas_json.get('objects', []))}")

            # 객체 상세
            if canvas_json.get('objects'):
                print(f"\n📝 Canvas Objects:")
                for idx, obj in enumerate(canvas_json['objects'][:5]):  # 처음 5개만
                    print(f"  {idx+1}. type={obj['type']}, left={obj.get('left')}, top={obj.get('top')}")
                    if obj['type'] == 'text':
                        print(f"     text=\"{obj.get('text', '')[:50]}...\"")
                    elif obj['type'] == 'rect':
                        print(f"     width={obj.get('width')}, height={obj.get('height')}, fill={obj.get('fill')}")

                if len(canvas_json['objects']) > 5:
                    print(f"  ... and {len(canvas_json['objects']) - 5} more objects")

            # 전체 응답 저장
            with open("canvas_test_result.json", "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            print(f"\n💾 Full response saved to: canvas_test_result.json")

    except httpx.HTTPStatusError as e:
        print(f"❌ HTTP Error: {e}")
        print(f"Response: {e.response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    asyncio.run(test_canvas_generation())
