"""
VisionAnalyzerAgent 통합 테스트 스위트

STEP 4: 통합 테스트 (10개 테스트 케이스)

작성일: 2025-11-19
작성자: B팀 (Backend)

테스트 시나리오:
1. 기본 이미지 분석 (URL)
2. 기본 이미지 분석 (Base64)
3. 브랜드 가이드라인 포함 분석
4. 구도 전용 분석
5. 색상 조화 전용 분석
6. 기술적 품질 전용 분석
7. 모든 기준 포함 분석
8. 저품질 이미지 분석
9. 고품질 이미지 분석
10. 에러 처리 테스트 (잘못된 입력)

실행 방법:
    pytest tests/test_vision_analyzer_integration.py -v
    # 또는
    python tests/test_vision_analyzer_integration.py
"""

import asyncio
import pytest
from typing import Dict, Any
from app.services.agents.vision_analyzer import VisionAnalyzerAgent, get_vision_analyzer_agent
from app.services.agents.base import AgentRequest, AgentError


class TestVisionAnalyzerIntegration:
    """VisionAnalyzerAgent 통합 테스트"""

    @pytest.fixture
    def agent(self):
        """Agent 인스턴스 픽스처"""
        return get_vision_analyzer_agent()

    @pytest.mark.asyncio
    async def test_01_basic_analysis_url(self, agent):
        """테스트 1: 기본 이미지 분석 (URL)"""
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

        # 검증
        assert response.agent == "vision_analyzer"
        assert response.task == "image_analysis"
        assert len(response.outputs) >= 1

        # 분석 결과 검증
        analysis = response.outputs[0].value
        assert "quality_score" in analysis
        assert 0 <= analysis["quality_score"] <= 1
        assert "overall_verdict" in analysis
        assert analysis["overall_verdict"] in ["excellent", "good", "fair", "poor"]

    @pytest.mark.asyncio
    async def test_02_basic_analysis_base64(self, agent):
        """테스트 2: 기본 이미지 분석 (Base64)"""
        # 간단한 1x1 PNG 이미지 (Base64)
        test_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

        request = AgentRequest(
            task="image_analysis",
            payload={
                "image_base64": test_base64,
                "criteria": {
                    "composition": True,
                    "color_harmony": True,
                    "technical_quality": True
                }
            }
        )

        response = await agent.execute(request)

        # 검증
        assert response.agent == "vision_analyzer"
        assert len(response.outputs) >= 1

        analysis = response.outputs[0].value
        assert "quality_score" in analysis

    @pytest.mark.asyncio
    async def test_03_brand_guidelines_analysis(self, agent):
        """테스트 3: 브랜드 가이드라인 포함 분석"""
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
                    "style": "minimalist",
                    "tone": "professional"
                }
            }
        )

        response = await agent.execute(request)

        # 검증
        analysis = response.outputs[0].value
        assert "brand_consistency" in analysis
        assert "score" in analysis["brand_consistency"]
        assert "matches_guidelines" in analysis["brand_consistency"]

    @pytest.mark.asyncio
    async def test_04_composition_only(self, agent):
        """테스트 4: 구도 전용 분석"""
        request = AgentRequest(
            task="image_analysis",
            payload={
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
                "criteria": {
                    "composition": True,
                    "color_harmony": False,
                    "brand_consistency": False,
                    "technical_quality": False
                }
            }
        )

        response = await agent.execute(request)

        # 검증
        analysis = response.outputs[0].value
        assert "composition" in analysis
        assert "score" in analysis["composition"]
        assert "analysis" in analysis["composition"]

    @pytest.mark.asyncio
    async def test_05_color_harmony_only(self, agent):
        """테스트 5: 색상 조화 전용 분석"""
        request = AgentRequest(
            task="image_analysis",
            payload={
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
                "criteria": {
                    "composition": False,
                    "color_harmony": True,
                    "brand_consistency": False,
                    "technical_quality": False
                }
            }
        )

        response = await agent.execute(request)

        # 검증
        analysis = response.outputs[0].value
        assert "color_harmony" in analysis
        assert "score" in analysis["color_harmony"]

    @pytest.mark.asyncio
    async def test_06_technical_quality_only(self, agent):
        """테스트 6: 기술적 품질 전용 분석"""
        request = AgentRequest(
            task="image_analysis",
            payload={
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
                "criteria": {
                    "composition": False,
                    "color_harmony": False,
                    "brand_consistency": False,
                    "technical_quality": True
                }
            }
        )

        response = await agent.execute(request)

        # 검증
        analysis = response.outputs[0].value
        assert "technical_quality" in analysis
        assert "score" in analysis["technical_quality"]
        assert "resolution" in analysis["technical_quality"]
        assert "clarity" in analysis["technical_quality"]

    @pytest.mark.asyncio
    async def test_07_all_criteria(self, agent):
        """테스트 7: 모든 기준 포함 분석"""
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
                    "primary_colors": ["#000000", "#FFFFFF"],
                    "style": "modern"
                }
            }
        )

        response = await agent.execute(request)

        # 검증
        analysis = response.outputs[0].value
        assert "composition" in analysis
        assert "color_harmony" in analysis
        assert "brand_consistency" in analysis
        assert "technical_quality" in analysis
        assert "quality_score" in analysis
        assert "improvements" in analysis

    @pytest.mark.asyncio
    async def test_08_quality_score_range(self, agent):
        """테스트 8: 품질 점수 범위 검증"""
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

        # 품질 점수 범위 검증
        assert 0 <= analysis["quality_score"] <= 1

        # 각 항목별 점수 범위 검증
        if "composition" in analysis:
            assert 0 <= analysis["composition"]["score"] <= 1

        if "color_harmony" in analysis:
            assert 0 <= analysis["color_harmony"]["score"] <= 1

        if "technical_quality" in analysis:
            assert 0 <= analysis["technical_quality"]["score"] <= 1

    @pytest.mark.asyncio
    async def test_09_improvements_suggestions(self, agent):
        """테스트 9: 개선 제안 검증"""
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

        # 개선 제안 검증
        assert "improvements" in analysis
        assert isinstance(analysis["improvements"], list)

        # 재생성 필요 여부 검증
        assert "requires_regeneration" in analysis
        assert isinstance(analysis["requires_regeneration"], bool)

    @pytest.mark.asyncio
    async def test_10_error_handling_no_image(self, agent):
        """테스트 10: 에러 처리 - 이미지 입력 없음"""
        request = AgentRequest(
            task="image_analysis",
            payload={
                "criteria": {
                    "composition": True
                }
                # image_url과 image_base64 모두 없음
            }
        )

        # 에러 발생 예상
        with pytest.raises(AgentError) as exc_info:
            await agent.execute(request)

        assert "image" in str(exc_info.value).lower()


# ============================================================================
# 성능 테스트
# ============================================================================

class TestVisionAnalyzerPerformance:
    """VisionAnalyzerAgent 성능 테스트"""

    @pytest.fixture
    def agent(self):
        """Agent 인스턴스 픽스처"""
        return get_vision_analyzer_agent()

    @pytest.mark.asyncio
    async def test_response_time(self, agent):
        """응답 시간 테스트 (< 5초 목표)"""
        import time

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

        start_time = time.time()
        response = await agent.execute(request)
        elapsed = time.time() - start_time

        # 응답 시간 검증 (5초 이내)
        assert elapsed < 5.0, f"Response time {elapsed:.2f}s exceeds 5s threshold"

        # Usage 정보 검증
        assert "elapsed_seconds" in response.usage
        assert response.usage["elapsed_seconds"] < 5.0


# ============================================================================
# 통합 테스트 실행 (pytest 없이)
# ============================================================================

async def run_integration_tests():
    """pytest 없이 통합 테스트 실행"""
    print("=" * 80)
    print("VisionAnalyzerAgent 통합 테스트 스위트")
    print("=" * 80)

    agent = get_vision_analyzer_agent()
    test_suite = TestVisionAnalyzerIntegration()
    perf_suite = TestVisionAnalyzerPerformance()

    tests = [
        ("테스트 1: 기본 이미지 분석 (URL)", test_suite.test_01_basic_analysis_url),
        ("테스트 2: 기본 이미지 분석 (Base64)", test_suite.test_02_basic_analysis_base64),
        ("테스트 3: 브랜드 가이드라인 포함", test_suite.test_03_brand_guidelines_analysis),
        ("테스트 4: 구도 전용 분석", test_suite.test_04_composition_only),
        ("테스트 5: 색상 조화 전용 분석", test_suite.test_05_color_harmony_only),
        ("테스트 6: 기술적 품질 전용 분석", test_suite.test_06_technical_quality_only),
        ("테스트 7: 모든 기준 포함", test_suite.test_07_all_criteria),
        ("테스트 8: 품질 점수 범위", test_suite.test_08_quality_score_range),
        ("테스트 9: 개선 제안 검증", test_suite.test_09_improvements_suggestions),
        ("테스트 10: 에러 처리", test_suite.test_10_error_handling_no_image),
        ("성능 테스트: 응답 시간", perf_suite.test_response_time),
    ]

    passed = 0
    failed = 0

    for name, test_func in tests:
        print(f"\n{'=' * 80}")
        print(f"🧪 {name}")
        print(f"{'=' * 80}")

        try:
            await test_func(agent)
            print(f"✅ 통과")
            passed += 1
        except Exception as e:
            print(f"❌ 실패: {str(e)}")
            failed += 1
            import traceback
            traceback.print_exc()

    print(f"\n{'=' * 80}")
    print(f"테스트 결과 요약")
    print(f"{'=' * 80}")
    print(f"✅ 통과: {passed}/{len(tests)}")
    print(f"❌ 실패: {failed}/{len(tests)}")
    print(f"성공률: {(passed / len(tests) * 100):.1f}%")
    print(f"{'=' * 80}")

    return passed == len(tests)


if __name__ == "__main__":
    success = asyncio.run(run_integration_tests())
    exit(0 if success else 1)
