"""
최종 검증 테스트 - LLM 텍스트 생성 및 Canvas 통합

작성일: 2025-11-17
"""
import requests
import json

url = "http://localhost:8001/api/v1/generate"

payload = {
    "kind": "product_detail",
    "brandId": "test",
    "input": {
        "product_name": "딥그린 진정 토너",
        "features": ["저자극", "지성피부", "트러블케어"],
        "target_audience": "2030 여성"
    }
}

print("=" * 60)
print("최종 검증 테스트: LLM → Canvas 통합")
print("=" * 60)
print(f"\n📤 Request: {payload['input']['product_name']}")

response = requests.post(url, json=payload)

if response.status_code == 200:
    data = response.json()

    print(f"\n✅ Status: {response.status_code}")
    print(f"📄 Document ID: {data['document']['documentId']}")

    print("\n📝 Generated Text:")
    text = data['text']
    print(f"  headline: {text['headline']}")
    print(f"  subheadline: {text['subheadline']}")
    print(f"  body: {text['body'][:80]}...")
    print(f"  bullets: {text['bullets']}")
    print(f"  cta: {text['cta']}")

    print("\n🎨 Canvas:")
    canvas = data['document']['canvas_json']
    objects = canvas['objects']
    text_objects = [o for o in objects if o['type'] == 'text']
    print(f"  Total objects: {len(objects)}")
    print(f"  Text objects: {len(text_objects)}")

    # 실제 텍스트 확인
    print("\n  실제 Canvas 텍스트 내용:")
    for idx, obj in enumerate(text_objects[:3]):
        text_preview = obj['text'][:50]
        print(f"    [{idx+1}] {text_preview}...")

    print("\n📊 Meta:")
    meta = data['meta']
    print(f"  Workflow: {meta['workflow']}")
    print(f"  Agents: {meta['agents_used']}")
    print(f"  Tokens: {meta['tokens_used']}")
    print(f"  Time: {meta['elapsed_seconds']:.2f}s")

    # 최종 판정
    all_fields_ok = all([
        text['headline'],
        text['subheadline'],
        text['body'],
        text['bullets'],
        text['cta']
    ])

    canvas_ok = len(text_objects) > 0

    print("\n" + "=" * 60)
    if all_fields_ok and canvas_ok:
        print("🎉 SUCCESS: LLM 텍스트 생성 및 Canvas 통합 완료!")
        print("✅ C Team 테스트 준비 완료")
    else:
        print("❌ FAILED: 일부 필드가 누락되었습니다")
    print("=" * 60)

else:
    print(f"\n❌ Error: {response.status_code}")
    print(response.text)
