"""
textBaseline 수정 확인 테스트

C팀 보고: textBaseline: 'alphabetical' 오류 여전히 발생
Backend 코드 확인: 올바르게 'alphabetic'으로 수정됨

작성일: 2025-11-17
작성자: B팀 (Backend)
"""

import json
from app.services.canvas.fabric_builder import FabricCanvasBuilder

# 테스트 1: add_text() 함수가 올바른 textBaseline을 생성하는지 확인
print("=" * 80)
print("테스트: FabricCanvasBuilder.add_text() textBaseline 확인")
print("=" * 80)

builder = FabricCanvasBuilder()
builder.add_text(
    text="테스트 텍스트",
    left=100,
    top=100,
    font_size=24
)

canvas_json = builder.build()
text_obj = canvas_json["objects"][0]

print(f"\n생성된 텍스트 객체:")
print(f"  - type: {text_obj.get('type')}")
print(f"  - text: {text_obj.get('text')}")
print(f"  - textBaseline: {text_obj.get('textBaseline')}")

if text_obj.get('textBaseline') == 'alphabetic':
    print("\n✅ 성공: textBaseline이 올바르게 'alphabetic'으로 설정됨")
elif text_obj.get('textBaseline') == 'alphabetical':
    print("\n❌ 실패: textBaseline이 여전히 'alphabetical'로 설정됨")
    print("   → fabric_builder.py 파일을 다시 확인하세요")
elif text_obj.get('textBaseline') is None:
    print("\n⚠️  경고: textBaseline 필드가 없음")
    print("   → 이전 버전의 코드가 실행되고 있습니다")
else:
    print(f"\n⚠️  예상치 못한 값: {text_obj.get('textBaseline')}")

# 테스트 2: 전체 Canvas JSON 출력
print(f"\n{'='*80}")
print("전체 Canvas JSON:")
print(f"{'='*80}")
print(json.dumps(canvas_json, indent=2, ensure_ascii=False))

# 테스트 3: create_product_detail_canvas 확인
print(f"\n{'='*80}")
print("테스트: create_product_detail_canvas() textBaseline 확인")
print(f"{'='*80}")

from app.services.canvas import create_product_detail_canvas

text_data = {
    "headline": "테스트 제품",
    "subheadline": "테스트 서브헤드라인",
    "body": "테스트 본문",
    "bullets": ["특징1", "특징2", "특징3"],
    "cta": "구매하기"
}

canvas = create_product_detail_canvas(text_data)
text_objects = [obj for obj in canvas["objects"] if obj.get("type") == "text"]

print(f"\n생성된 텍스트 객체 수: {len(text_objects)}")

baseline_check = {
    "alphabetic": 0,
    "alphabetical": 0,
    "none": 0,
    "other": 0
}

for idx, obj in enumerate(text_objects):
    baseline = obj.get('textBaseline')
    if baseline == 'alphabetic':
        baseline_check['alphabetic'] += 1
        print(f"  ✅ 텍스트 #{idx}: textBaseline = 'alphabetic' (올바름)")
    elif baseline == 'alphabetical':
        baseline_check['alphabetical'] += 1
        print(f"  ❌ 텍스트 #{idx}: textBaseline = 'alphabetical' (잘못됨)")
    elif baseline is None:
        baseline_check['none'] += 1
        print(f"  ⚠️  텍스트 #{idx}: textBaseline = None (필드 없음)")
    else:
        baseline_check['other'] += 1
        print(f"  ⚠️  텍스트 #{idx}: textBaseline = '{baseline}' (기타)")

print(f"\n결과 요약:")
print(f"  - 올바른 값 ('alphabetic'): {baseline_check['alphabetic']}")
print(f"  - 잘못된 값 ('alphabetical'): {baseline_check['alphabetical']}")
print(f"  - 필드 없음 (None): {baseline_check['none']}")
print(f"  - 기타: {baseline_check['other']}")

if baseline_check['alphabetic'] == len(text_objects):
    print(f"\n✅ 모든 텍스트 객체가 올바른 textBaseline 값을 가지고 있습니다!")
    exit(0)
elif baseline_check['alphabetical'] > 0:
    print(f"\n❌ {baseline_check['alphabetical']}개의 텍스트 객체가 잘못된 textBaseline 값을 가지고 있습니다!")
    exit(1)
elif baseline_check['none'] > 0:
    print(f"\n⚠️  {baseline_check['none']}개의 텍스트 객체에 textBaseline 필드가 없습니다!")
    print("   → 서버를 재시작하거나 Python 모듈을 리로드하세요")
    exit(1)
else:
    print(f"\n⚠️  예상치 못한 상황입니다. 수동으로 확인하세요.")
    exit(1)
