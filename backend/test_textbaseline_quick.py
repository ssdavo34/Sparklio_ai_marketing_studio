"""
textBaseline 빠른 확인 테스트

C팀 요청: textBaseline이 'alphabetic'인지 확인
"""

from app.services.canvas.fabric_builder import FabricCanvasBuilder

# 테스트: FabricCanvasBuilder로 텍스트 생성
print("=" * 60)
print("textBaseline 빠른 확인 테스트")
print("=" * 60)

builder = FabricCanvasBuilder(width=1200, height=800)
builder.add_text("테스트 텍스트", left=100, top=100, font_size=24)

canvas_json = builder.build()

# textBaseline 확인
for obj in canvas_json.get("objects", []):
    if obj.get("type") == "text":
        baseline = obj.get("textBaseline")
        print(f"\n✅ 텍스트 객체 발견:")
        print(f"   - text: {obj.get('text')}")
        print(f"   - textBaseline: {baseline}")

        if baseline == "alphabetic":
            print(f"\n✅✅✅ 성공: textBaseline이 올바르게 'alphabetic'으로 설정됨!")
            print(f"✅✅✅ C팀에게 보고 가능: 수정 완료!")
        elif baseline == "alphabetical":
            print(f"\n❌❌❌ 실패: textBaseline이 여전히 'alphabetical'로 설정됨")
        else:
            print(f"\n⚠️ 예상치 못한 값: {baseline}")

print("\n" + "=" * 60)
