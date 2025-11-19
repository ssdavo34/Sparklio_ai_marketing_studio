"""
VisionAnalyzerAgent 독립 테스트 실행기

Redis 의존성 없이 Vision Analyzer를 직접 테스트합니다.

실행 방법:
    python run_vision_tests.py
"""

import sys
import asyncio
import logging
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def test_suite():
    """테스트 스위트 실행"""
    from app.services.agents.vision_analyzer import VisionAnalyzerAgent
    from app.services.agents.base import AgentRequest, AgentError
    from app.services.llm.gateway import LLMGateway

    print("=" * 80)
    print("VisionAnalyzerAgent 통합 테스트")
    print("=" * 80)

    # Gateway 및 Agent 초기화
    gateway = LLMGateway()
    agent = VisionAnalyzerAgent(llm_gateway=gateway)

    test_results = []

    # ========================================================================
    # 테스트 1: 기본 이미지 분석 (URL)
    # ========================================================================
    print("\n" + "=" * 80)
    print("테스트 1: 기본 이미지 분석 (URL)")
    print("=" * 80)

    try:
        request = AgentRequest(
            task="image_analysis",
            payload={
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
                "criteria": {
                    "composition": True,
                    "color_harmony": True,
                    "technical_quality": True
                }
            }
        )

        response = await agent.execute(request)
        analysis = response.outputs[0].value

        # 검증
        assert response.agent == "vision_analyzer"
        assert "quality_score" in analysis
        assert 0 <= analysis["quality_score"] <= 1
        assert "overall_verdict" in analysis

        print(f"✅ 통과")
        print(f"   - Quality Score: {analysis['quality_score']:.2f}")
        print(f"   - Overall Verdict: {analysis['overall_verdict']}")
        test_results.append(("테스트 1", True, None))

    except Exception as e:
        print(f"❌ 실패: {str(e)}")
        test_results.append(("테스트 1", False, str(e)))

    # ========================================================================
    # 테스트 2: Base64 이미지 분석
    # ========================================================================
    print("\n" + "=" * 80)
    print("테스트 2: Base64 이미지 분석")
    print("=" * 80)

    try:
        # 간단한 1x1 PNG (빨간색)
        test_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="

        request = AgentRequest(
            task="image_analysis",
            payload={
                "image_base64": test_base64,
                "criteria": {
                    "composition": True,
                    "technical_quality": True
                }
            }
        )

        response = await agent.execute(request)
        analysis = response.outputs[0].value

        assert "quality_score" in analysis
        print(f"✅ 통과")
        print(f"   - Quality Score: {analysis['quality_score']:.2f}")
        test_results.append(("테스트 2", True, None))

    except Exception as e:
        print(f"❌ 실패: {str(e)}")
        test_results.append(("테스트 2", False, str(e)))

    # ========================================================================
    # 테스트 3: 브랜드 가이드라인 포함
    # ========================================================================
    print("\n" + "=" * 80)
    print("테스트 3: 브랜드 가이드라인 포함 분석")
    print("=" * 80)

    try:
        request = AgentRequest(
            task="image_analysis",
            payload={
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
                "criteria": {
                    "composition": True,
                    "color_harmony": True,
                    "brand_consistency": True,
                    "technical_quality": True
                },
                "brand_guidelines": {
                    "primary_colors": ["#FF0000", "#0000FF"],
                    "style": "minimalist"
                }
            }
        )

        response = await agent.execute(request)
        analysis = response.outputs[0].value

        assert "brand_consistency" in analysis
        assert "score" in analysis["brand_consistency"]

        print(f"✅ 통과")
        print(f"   - Brand Consistency Score: {analysis['brand_consistency']['score']:.2f}")
        print(f"   - Matches Guidelines: {analysis['brand_consistency']['matches_guidelines']}")
        test_results.append(("테스트 3", True, None))

    except Exception as e:
        print(f"❌ 실패: {str(e)}")
        test_results.append(("테스트 3", False, str(e)))

    # ========================================================================
    # 테스트 4: 구도 전용 분석
    # ========================================================================
    print("\n" + "=" * 80)
    print("테스트 4: 구도 전용 분석")
    print("=" * 80)

    try:
        request = AgentRequest(
            task="image_analysis",
            payload={
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
                "criteria": {
                    "composition": True,
                    "color_harmony": False,
                    "technical_quality": False
                }
            }
        )

        response = await agent.execute(request)
        analysis = response.outputs[0].value

        assert "composition" in analysis
        assert "score" in analysis["composition"]

        print(f"✅ 통과")
        print(f"   - Composition Score: {analysis['composition']['score']:.2f}")
        test_results.append(("테스트 4", True, None))

    except Exception as e:
        print(f"❌ 실패: {str(e)}")
        test_results.append(("테스트 4", False, str(e)))

    # ========================================================================
    # 테스트 5: 품질 점수 범위 검증
    # ========================================================================
    print("\n" + "=" * 80)
    print("테스트 5: 품질 점수 범위 검증")
    print("=" * 80)

    try:
        request = AgentRequest(
            task="image_analysis",
            payload={
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
                "criteria": {
                    "composition": True,
                    "color_harmony": True,
                    "technical_quality": True
                }
            }
        )

        response = await agent.execute(request)
        analysis = response.outputs[0].value

        # 점수 범위 검증
        assert 0 <= analysis["quality_score"] <= 1
        assert 0 <= analysis["composition"]["score"] <= 1
        assert 0 <= analysis["color_harmony"]["score"] <= 1
        assert 0 <= analysis["technical_quality"]["score"] <= 1

        print(f"✅ 통과")
        print(f"   - All scores in valid range [0, 1]")
        test_results.append(("테스트 5", True, None))

    except Exception as e:
        print(f"❌ 실패: {str(e)}")
        test_results.append(("테스트 5", False, str(e)))

    # ========================================================================
    # 테스트 6: 개선 제안 검증
    # ========================================================================
    print("\n" + "=" * 80)
    print("테스트 6: 개선 제안 검증")
    print("=" * 80)

    try:
        request = AgentRequest(
            task="image_analysis",
            payload={
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
                "criteria": {
                    "composition": True,
                    "color_harmony": True,
                    "technical_quality": True
                }
            }
        )

        response = await agent.execute(request)
        analysis = response.outputs[0].value

        assert "improvements" in analysis
        assert isinstance(analysis["improvements"], list)
        assert "requires_regeneration" in analysis
        assert isinstance(analysis["requires_regeneration"], bool)

        print(f"✅ 통과")
        print(f"   - Improvements: {len(analysis['improvements'])}개")
        print(f"   - Requires Regeneration: {analysis['requires_regeneration']}")
        test_results.append(("테스트 6", True, None))

    except Exception as e:
        print(f"❌ 실패: {str(e)}")
        test_results.append(("테스트 6", False, str(e)))

    # ========================================================================
    # 테스트 7: 에러 처리 - 이미지 입력 없음
    # ========================================================================
    print("\n" + "=" * 80)
    print("테스트 7: 에러 처리 - 이미지 입력 없음")
    print("=" * 80)

    try:
        request = AgentRequest(
            task="image_analysis",
            payload={
                "criteria": {
                    "composition": True
                }
                # image_url과 image_base64 모두 없음
            }
        )

        try:
            await agent.execute(request)
            # 에러가 발생하지 않으면 실패
            print(f"❌ 실패: 에러가 발생하지 않음")
            test_results.append(("테스트 7", False, "Expected error not raised"))
        except AgentError:
            # 정상적으로 에러 발생
            print(f"✅ 통과 - 예상된 에러 발생")
            test_results.append(("테스트 7", True, None))

    except Exception as e:
        print(f"❌ 실패: {str(e)}")
        test_results.append(("테스트 7", False, str(e)))

    # ========================================================================
    # 테스트 결과 요약
    # ========================================================================
    print("\n" + "=" * 80)
    print("테스트 결과 요약")
    print("=" * 80)

    passed = sum(1 for _, success, _ in test_results if success)
    failed = sum(1 for _, success, _ in test_results if not success)

    for name, success, error in test_results:
        status = "✅ 통과" if success else f"❌ 실패 ({error})"
        print(f"{name}: {status}")

    print(f"\n{'=' * 80}")
    print(f"✅ 통과: {passed}/{len(test_results)}")
    print(f"❌ 실패: {failed}/{len(test_results)}")
    print(f"성공률: {(passed / len(test_results) * 100):.1f}%")
    print(f"{'=' * 80}")

    return passed == len(test_results)


if __name__ == "__main__":
    try:
        success = asyncio.run(test_suite())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n테스트 중단됨")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n테스트 실행 중 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
