"""
휴대폰 보호 제품 테스트

사용자 입력: "휴대폰 보호 제품"
LLM이 이 입력을 정확히 사용하는지 확인

작성일: 2025-11-17
"""
import requests
import json

url = "http://localhost:8001/api/v1/generate"

payload = {
    "kind": "product_detail",
    "brandId": "test",
    "input": {
        "product_name": "휴대폰 보호 제품",
        "features": ["충격 방지", "긁힘 방지", "슬림 디자인"],
        "target_audience": "스마트폰 사용자"
    }
}

print("=" * 60)
print("휴대폰 보호 제품 생성 테스트")
print("=" * 60)
print(f"\n📤 사용자 입력:")
print(f"  제품명: {payload['input']['product_name']}")
print(f"  기능: {payload['input']['features']}")
print(f"  타겟: {payload['input']['target_audience']}")

response = requests.post(url, json=payload)

if response.status_code == 200:
    data = response.json()

    print(f"\n✅ Status: {response.status_code}")

    text = data['text']

    print("\n📝 LLM 생성 결과:")
    print(f"  headline: {text['headline']}")
    print(f"  subheadline: {text['subheadline']}")
    print(f"  body: {text['body'][:100]}...")
    print(f"  bullets: {text['bullets']}")
    print(f"  cta: {text['cta']}")

    # 검증: headline에 "휴대폰 보호" 또는 관련 키워드가 있는지
    headline = text['headline'].lower()
    keywords = ["휴대폰", "보호", "케이스", "커버"]

    matched = [kw for kw in keywords if kw in headline]

    print("\n" + "=" * 60)
    if matched:
        print(f"✅ SUCCESS: headline에 관련 키워드 포함 ({', '.join(matched)})")
        print("✅ LLM이 사용자 입력을 정확히 반영했습니다!")
    else:
        print(f"❌ FAILED: headline에 관련 키워드 없음")
        print(f"   예상: '휴대폰 보호' 관련")
        print(f"   실제: {text['headline']}")
    print("=" * 60)

else:
    print(f"\n❌ Error: {response.status_code}")
    print(response.text)
