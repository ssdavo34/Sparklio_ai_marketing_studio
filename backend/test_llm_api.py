"""
LLM API 통합 테스트
실제 API 엔드포인트를 통해 LLM 연결 상태 확인

작성일: 2025-11-20
작성자: B팀 (Backend)
"""

import asyncio
import httpx
import json
from typing import Dict, Any

# API 서버 URL
BASE_URL = "http://localhost:8001/api/v1"


async def test_llm_health():
    """LLM Gateway 헬스체크"""
    print("\n🔍 LLM Gateway 헬스체크")
    print("-" * 40)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/llm/health")

            if response.status_code == 200:
                data = response.json()
                print("✅ LLM Gateway 상태: 정상")
                print(f"   모드: {data.get('mode', 'unknown')}")

                # Provider별 상태
                providers = data.get('providers', {})
                for name, info in providers.items():
                    status = info.get('status', 'unknown')
                    emoji = "✅" if status == "healthy" else "❌"
                    print(f"   {emoji} {name}: {status}")

                return True
            else:
                print(f"❌ LLM Gateway 헬스체크 실패: {response.status_code}")
                return False

        except Exception as e:
            print(f"❌ API 연결 실패: {str(e)}")
            print("   (서버가 실행 중인지 확인하세요)")
            return False


async def test_generate_api():
    """Generate API 테스트 (실제 LLM 호출)"""
    print("\n🔍 Generate API 테스트")
    print("-" * 40)

    test_cases = [
        {
            "name": "Product Detail (GPT-4o)",
            "payload": {
                "type": "product_detail",
                "brief": {
                    "product_name": "스마트 무선 이어폰",
                    "features": ["노이즈 캔슬링", "24시간 배터리", "IPX7 방수"],
                    "target_audience": "음악 애호가"
                },
                "override_model": "gpt-4o-mini"
            }
        },
        {
            "name": "Product Detail (Claude)",
            "payload": {
                "type": "product_detail",
                "brief": {
                    "product_name": "프리미엄 요가매트",
                    "features": ["미끄럼 방지", "친환경 소재", "6mm 두께"],
                    "target_audience": "요가 입문자"
                },
                "override_model": "claude-3-5-haiku-20241022"
            }
        },
        {
            "name": "Product Detail (Gemini)",
            "payload": {
                "type": "product_detail",
                "brief": {
                    "product_name": "휴대용 블렌더",
                    "features": ["USB 충전", "BPA Free", "350ml 용량"],
                    "target_audience": "건강 관리족"
                },
                "override_model": "gemini-2.5-flash"
            }
        }
    ]

    async with httpx.AsyncClient(timeout=60.0) as client:
        for test in test_cases:
            print(f"\n📝 테스트: {test['name']}")

            try:
                response = await client.post(
                    f"{BASE_URL}/generate",
                    json=test['payload']
                )

                if response.status_code == 200:
                    data = response.json()

                    # 성공 확인
                    if data.get('status') == 'success':
                        print(f"✅ 생성 성공!")

                        # 메타데이터 확인
                        meta = data.get('meta', {})
                        print(f"   모델: {meta.get('model', 'unknown')}")
                        print(f"   Provider: {meta.get('provider', 'unknown')}")
                        print(f"   처리시간: {meta.get('processing_time', 0):.2f}초")

                        # 생성된 컨텐츠 일부 표시
                        content = data.get('data', {})
                        if 'headline' in content:
                            print(f"   Headline: {content['headline'][:50]}...")
                    else:
                        print(f"❌ 생성 실패: {data.get('error', 'Unknown error')}")

                else:
                    print(f"❌ API 호출 실패: {response.status_code}")
                    print(f"   응답: {response.text[:200]}...")

            except httpx.TimeoutException:
                print(f"⏱️ 타임아웃 (60초 초과)")
            except Exception as e:
                print(f"❌ 오류: {str(e)}")


async def test_chat_analyze_api():
    """Chat Analyze API 테스트 (C팀 요청사항)"""
    print("\n🔍 Chat Analyze API 테스트 (C팀 요청사항)")
    print("-" * 40)

    test_payload = {
        "message": "무선 이어폰의 장점을 분석해주세요",
        "model": "gpt-4o-mini"  # 명시적 모델 지정
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{BASE_URL}/chat/analyze",
                json=test_payload
            )

            if response.status_code == 200:
                data = response.json()
                print("✅ Chat Analyze API 정상 작동!")
                print(f"   응답: {str(data)[:100]}...")
            else:
                print(f"❌ Chat Analyze API 실패: {response.status_code}")
                print(f"   응답: {response.text[:200]}...")

        except Exception as e:
            print(f"❌ API 호출 오류: {str(e)}")


async def main():
    """메인 테스트 실행"""
    print("=" * 50)
    print("🚀 LLM API 통합 테스트")
    print("=" * 50)

    # 1. 헬스체크
    health_ok = await test_llm_health()

    if not health_ok:
        print("\n⚠️ 서버가 실행되지 않았거나 연결할 수 없습니다.")
        print("다음 명령어로 서버를 실행하세요:")
        print("  uvicorn app.main:app --reload --port 8001")
        return False

    # 2. Generate API 테스트
    await test_generate_api()

    # 3. Chat Analyze API 테스트
    await test_chat_analyze_api()

    print("\n" + "=" * 50)
    print("📊 테스트 완료!")
    print("=" * 50)

    return True


if __name__ == "__main__":
    asyncio.run(main())