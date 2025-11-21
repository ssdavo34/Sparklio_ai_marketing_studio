"""
Vision API 모델 테스트 스크립트

Vision API 모델 가용성 및 성능 테스트

작성일: 2025-11-21
작성자: B팀
"""

import asyncio
import os
import sys
import logging
from pathlib import Path

# 프로젝트 루트 경로 추가
sys.path.insert(0, str(Path(__file__).parent))

from app.services.llm import get_gateway
from app.services.agents.vision_analyzer import get_vision_analyzer_agent
from app.services.agents.base import AgentRequest

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_vision_models():
    """Vision API 모델 테스트"""

    print("\n" + "="*60)
    print("🔬 Vision API 모델 테스트")
    print("="*60)

    # 테스트할 Vision 모델들
    vision_models = [
        ("claude-3-5-sonnet-20241022", "Claude 3.5 Sonnet (Latest)"),
        ("claude-3-5-sonnet-20240620", "Claude 3.5 Sonnet (June)"),
        ("claude-3-opus-20240229", "Claude 3 Opus"),
        ("gpt-4o", "GPT-4o"),
        ("gpt-4-vision-preview", "GPT-4 Vision Preview"),
    ]

    # 테스트 이미지 URL
    test_image_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg"

    print(f"\n📷 테스트 이미지: {test_image_url}")
    print("-" * 60)

    results = []

    for model_name, display_name in vision_models:
        print(f"\n🔍 테스팅: {display_name}")
        print(f"   모델 ID: {model_name}")

        try:
            # LLM Gateway 직접 테스트
            llm_gateway = get_gateway()

            # Vision API 호출
            start_time = asyncio.get_event_loop().time()

            response = await llm_gateway.generate_with_vision(
                prompt="이 이미지에 무엇이 보이나요? 간단히 설명해주세요.",
                image_url=test_image_url,
                override_model=model_name
            )

            elapsed = asyncio.get_event_loop().time() - start_time

            print(f"   ✅ 성공!")
            print(f"   응답 시간: {elapsed:.2f}초")
            print(f"   응답 타입: {response.output.type}")

            if response.output.type == "text":
                preview = response.output.value[:100] + "..." if len(response.output.value) > 100 else response.output.value
                print(f"   응답 내용: {preview}")

            results.append({
                "model": model_name,
                "status": "✅ 성공",
                "time": f"{elapsed:.2f}초",
                "provider": response.meta.get("provider", "unknown")
            })

        except Exception as e:
            error_msg = str(e)
            print(f"   ❌ 실패: {error_msg}")

            results.append({
                "model": model_name,
                "status": "❌ 실패",
                "error": error_msg[:50] + "..." if len(error_msg) > 50 else error_msg,
                "provider": "N/A"
            })

    # 결과 요약
    print("\n" + "="*60)
    print("📊 테스트 결과 요약")
    print("="*60)

    print("\n| 모델 | 상태 | 응답시간 | Provider |")
    print("|------|------|----------|----------|")

    for result in results:
        model = result["model"][:30]
        status = result["status"]
        time = result.get("time", result.get("error", "N/A"))[:20]
        provider = result.get("provider", "N/A")

        print(f"| {model} | {status} | {time} | {provider} |")

    # 사용 가능한 모델 확인
    working_models = [r for r in results if "✅" in r["status"]]

    if working_models:
        print(f"\n✅ 사용 가능한 Vision 모델: {len(working_models)}개")
        for model in working_models:
            print(f"   - {model['model']}")
    else:
        print("\n⚠️ 현재 사용 가능한 Vision 모델이 없습니다.")
        print("   Mock 모드로 자동 전환됩니다.")

    return results


async def test_vision_analyzer_agent():
    """VisionAnalyzerAgent 통합 테스트"""

    print("\n" + "="*60)
    print("🤖 VisionAnalyzerAgent 통합 테스트")
    print("="*60)

    agent = get_vision_analyzer_agent()

    # 테스트 케이스
    test_cases = [
        {
            "name": "이미지 종합 분석",
            "task": "image_analysis",
            "payload": {
                "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg",
                "criteria": {
                    "composition": True,
                    "color_harmony": True,
                    "brand_consistency": False,
                    "technical_quality": True
                }
            }
        },
        {
            "name": "브랜드 일관성 체크 포함",
            "task": "image_analysis",
            "payload": {
                "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg",
                "criteria": {
                    "composition": True,
                    "color_harmony": True,
                    "brand_consistency": True,
                    "technical_quality": True
                },
                "brand_guidelines": {
                    "primary_colors": ["#FF6B6B", "#4ECDC4"],
                    "style": "modern",
                    "tone": "friendly"
                }
            }
        }
    ]

    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📝 테스트 케이스 #{i}: {test_case['name']}")
        print("-" * 40)

        try:
            start_time = asyncio.get_event_loop().time()

            response = await agent.execute(AgentRequest(
                task=test_case["task"],
                payload=test_case["payload"]
            ))

            elapsed = asyncio.get_event_loop().time() - start_time

            print(f"✅ 성공!")
            print(f"   응답 시간: {elapsed:.2f}초")
            print(f"   Agent: {response.agent}")
            print(f"   Task: {response.task}")

            # 결과 출력
            if response.outputs:
                output = response.outputs[0]
                if output.type == "json":
                    value = output.value
                    print(f"   품질 점수: {value.get('quality_score', 'N/A')}")
                    print(f"   전체 평가: {value.get('overall_verdict', 'N/A')}")
                    print(f"   재생성 필요: {value.get('requires_regeneration', 'N/A')}")

                    if value.get('improvements'):
                        print(f"   개선 제안: {len(value['improvements'])}개")

        except Exception as e:
            print(f"❌ 실패: {str(e)}")


async def main():
    """메인 테스트 실행"""

    print("\n🚀 Vision API & VisionAnalyzerAgent 테스트 시작")
    print("작성일: 2025-11-21")
    print("작성자: B팀\n")

    # 1. Vision 모델 테스트
    model_results = await test_vision_models()

    # 2. VisionAnalyzerAgent 테스트
    await test_vision_analyzer_agent()

    print("\n" + "="*60)
    print("✅ 테스트 완료!")
    print("="*60)

    # 권장 사항
    print("\n💡 권장 사항:")

    working_models = [r for r in model_results if "✅" in r["status"]]

    if working_models:
        fastest = min(working_models, key=lambda x: float(x["time"].replace("초", "")))
        print(f"   - 가장 빠른 모델: {fastest['model']} ({fastest['time']})")
        print(f"   - Primary로 설정 권장")
    else:
        print("   - Vision API 키 확인 필요")
        print("   - 현재는 Mock 모드 사용 중")

    print("\n📄 자세한 내용은 AGENTS_SPEC.md의 VisionAnalyzerAgent 섹션 참조")


if __name__ == "__main__":
    asyncio.run(main())