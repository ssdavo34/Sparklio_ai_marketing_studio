"""
API를 직접 호출하여 textBaseline 확인

C팀이 직접 실행할 수 있는 테스트 스크립트

작성일: 2025-11-17
작성자: B팀 (Backend)
"""

import requests
import json

print("=" * 80)
print("Backend API 직접 호출 테스트")
print("=" * 80)

# API 엔드포인트
API_URL = "http://localhost:8000/api/v1/generate"

# 요청 데이터
request_data = {
    "kind": "product_detail",
    "brandId": "brand_demo",
    "input": {
        "prompt": "textBaseline 테스트용 제품"
    },
    "options": {
        "tone": "professional",
        "length": "medium"
    }
}

print(f"\nAPI 호출: {API_URL}")
print(f"요청 데이터:")
print(json.dumps(request_data, indent=2, ensure_ascii=False))

try:
    # API 호출
    response = requests.post(
        API_URL,
        json=request_data,
        headers={"Content-Type": "application/json"},
        timeout=60
    )

    print(f"\n응답 상태 코드: {response.status_code}")

    if response.status_code == 200:
        data = response.json()

        # Canvas JSON 추출
        canvas_json = data["document"]["canvas_json"]

        # 텍스트 객체 확인
        text_objects = [
            obj for obj in canvas_json["objects"]
            if obj.get("type") == "text"
        ]

        print(f"\n✅ 응답 성공!")
        print(f"  - 전체 객체 수: {len(canvas_json['objects'])}")
        print(f"  - 텍스트 객체 수: {len(text_objects)}")

        # textBaseline 검증
        print(f"\ntextBaseline 검증:")
        has_error = False

        for idx, obj in enumerate(text_objects):
            baseline = obj.get("textBaseline")
            text = obj.get("text", "")[:30]

            if baseline == "alphabetic":
                print(f"  ✅ 텍스트 #{idx} ('{text}...'): {baseline}")
            elif baseline == "alphabetical":
                print(f"  ❌ 텍스트 #{idx} ('{text}...'): {baseline} (잘못됨!)")
                has_error = True
            elif baseline is None:
                print(f"  ⚠️  텍스트 #{idx} ('{text}...'): 필드 없음")
                has_error = True
            else:
                print(f"  ⚠️  텍스트 #{idx} ('{text}...'): {baseline} (예상치 못한 값)")

        # 결과 파일 저장
        with open("api_response_direct_test.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"\n전체 응답을 'api_response_direct_test.json'에 저장했습니다.")

        # 최종 결과
        if has_error:
            print(f"\n❌ 테스트 실패: 잘못된 textBaseline 값이 발견되었습니다!")
            print(f"   → Backend 서버를 재시작하고 Python 캐시를 삭제하세요")
            exit(1)
        else:
            print(f"\n✅ 테스트 성공: 모든 textBaseline 값이 올바릅니다!")
            print(f"   → C팀 Frontend에서도 정상 동작해야 합니다")
            exit(0)

    else:
        print(f"\n❌ API 호출 실패: {response.status_code}")
        print(f"응답 내용: {response.text}")
        exit(1)

except requests.exceptions.ConnectionError:
    print(f"\n❌ Backend 서버에 연결할 수 없습니다!")
    print(f"   → Backend 서버가 실행 중인지 확인하세요 (http://localhost:8000)")
    exit(1)

except Exception as e:
    print(f"\n❌ 오류 발생: {str(e)}")
    import traceback
    traceback.print_exc()
    exit(1)
