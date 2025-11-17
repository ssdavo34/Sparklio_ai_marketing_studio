"""
FabricCanvasBuilder 단위 테스트

작성일: 2025-11-17
"""
import json
from app.services.canvas import create_product_detail_canvas


def test_empty_text_data():
    """빈 text_data로 Canvas 생성 테스트"""
    print("=" * 60)
    print("Test: 빈 text_data로 Canvas 생성")
    print("=" * 60)

    text_data = {}
    canvas_json = create_product_detail_canvas(text_data)

    print(f"\n✅ Canvas 생성 성공")
    print(f"  Version: {canvas_json.get('version')}")
    print(f"  Background: {canvas_json.get('background')}")
    print(f"  Objects Count: {len(canvas_json.get('objects', []))}")

    if canvas_json.get('objects'):
        print(f"\n📝 Objects:")
        for idx, obj in enumerate(canvas_json['objects'][:5]):
            print(f"  {idx+1}. type={obj['type']}, left={obj.get('left')}, top={obj.get('top')}")
            if obj['type'] == 'text':
                print(f"     text=\"{obj.get('text', '')}\"")

    # JSON 저장
    with open("canvas_builder_test.json", "w", encoding="utf-8") as f:
        json.dump(canvas_json, f, ensure_ascii=False, indent=2)
    print(f"\n💾 Saved to: canvas_builder_test.json")


def test_with_text_data():
    """실제 text_data로 Canvas 생성 테스트"""
    print("\n" + "=" * 60)
    print("Test: 실제 text_data로 Canvas 생성")
    print("=" * 60)

    text_data = {
        "headline": "프리미엄 무선 이어폰",
        "subheadline": "완벽한 사운드, 하루 종일",
        "body": "노이즈캔슬링과 24시간 배터리로 언제 어디서나 최고의 음악 경험을 제공합니다.",
        "bullets": ["프리미엄 노이즈캔슬링", "24시간 배터리", "IPX7 방수"],
        "cta": "지금 구매하기"
    }

    canvas_json = create_product_detail_canvas(text_data)

    print(f"\n✅ Canvas 생성 성공")
    print(f"  Objects Count: {len(canvas_json.get('objects', []))}")

    print(f"\n📝 Objects:")
    for idx, obj in enumerate(canvas_json['objects']):
        print(f"  {idx+1}. type={obj['type']}")
        if obj['type'] == 'text':
            print(f"     text=\"{obj.get('text', '')[:50]}...\"")


if __name__ == "__main__":
    test_empty_text_data()
    test_with_text_data()
    print("\n" + "=" * 60)
    print("✅ 모든 테스트 완료")
    print("=" * 60)
