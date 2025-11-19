"""
Vision API 통합 테스트

VisionAnalyzerAgent가 실제로 Vision API를 호출하여
이미지를 분석하는지 테스트합니다.

실행 방법:
    python test_vision_api_integration.py

주의:
    - ANTHROPIC_API_KEY 또는 OPENAI_API_KEY 환경변수 필요
    - 실제 API 호출이므로 비용 발생 가능
"""

import asyncio
import logging
from app.services.agents.vision_analyzer import VisionAnalyzerAgent
from app.services.agents.base import AgentRequest
from app.services.llm.gateway import LLMGateway

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def test_vision_api():
    """Vision API 통합 테스트"""

    logger.info("=" * 80)
    logger.info("Vision API 통합 테스트 시작")
    logger.info("=" * 80)

    # LLM Gateway 초기화
    gateway = LLMGateway()

    # VisionAnalyzerAgent 초기화
    agent = VisionAnalyzerAgent(llm_gateway=gateway)

    # 테스트용 이미지 URL (공개 이미지)
    test_image_url = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"

    # Agent 요청
    request = AgentRequest(
        task="image_analysis",
        payload={
            "image_url": test_image_url,
            "criteria": {
                "composition": True,
                "color_harmony": True,
                "brand_consistency": False,
                "technical_quality": True
            }
        },
        options={
            "temperature": 0.7
        }
    )

    try:
        logger.info("VisionAnalyzerAgent 실행 중...")
        logger.info(f"이미지 URL: {test_image_url}")

        # Agent 실행
        response = await agent.execute(request)

        logger.info("=" * 80)
        logger.info("Vision API 호출 성공!")
        logger.info("=" * 80)

        # 결과 출력
        logger.info(f"Agent: {response.agent}")
        logger.info(f"Task: {response.task}")
        logger.info(f"Outputs: {len(response.outputs)}개")

        # 분석 결과 출력
        for output in response.outputs:
            if output.type == "json" and output.name == "vision_analysis":
                result = output.value
                logger.info("\n📊 분석 결과:")
                logger.info(f"  - 종합 점수: {result.get('quality_score', 0):.2f}")
                logger.info(f"  - 종합 평가: {result.get('overall_verdict', 'N/A')}")
                logger.info(f"  - 재생성 필요: {result.get('requires_regeneration', False)}")

                if "composition" in result:
                    logger.info(f"\n  🎨 구도 분석:")
                    logger.info(f"    - 점수: {result['composition'].get('score', 0):.2f}")
                    logger.info(f"    - 분석: {result['composition'].get('analysis', 'N/A')}")

                if "color_harmony" in result:
                    logger.info(f"\n  🌈 색상 조화:")
                    logger.info(f"    - 점수: {result['color_harmony'].get('score', 0):.2f}")
                    logger.info(f"    - 분석: {result['color_harmony'].get('analysis', 'N/A')}")

                if "technical_quality" in result:
                    logger.info(f"\n  🔧 기술적 품질:")
                    logger.info(f"    - 점수: {result['technical_quality'].get('score', 0):.2f}")
                    logger.info(f"    - 해상도: {result['technical_quality'].get('resolution', 'N/A')}")
                    logger.info(f"    - 선명도: {result['technical_quality'].get('clarity', 'N/A')}")

                if "improvements" in result and result["improvements"]:
                    logger.info(f"\n  💡 개선 제안:")
                    for i, improvement in enumerate(result["improvements"], 1):
                        logger.info(f"    {i}. {improvement}")

        # 사용량 출력
        logger.info(f"\n📈 사용량:")
        logger.info(f"  - Vision API 호출: {response.usage.get('vision_api_calls', 0)}회")
        logger.info(f"  - 소요 시간: {response.usage.get('elapsed_seconds', 0):.2f}초")

        logger.info("\n" + "=" * 80)
        logger.info("✅ Vision API 통합 테스트 성공!")
        logger.info("=" * 80)

        return True

    except Exception as e:
        logger.error("=" * 80)
        logger.error("❌ Vision API 통합 테스트 실패!")
        logger.error("=" * 80)
        logger.error(f"에러: {str(e)}", exc_info=True)
        return False


async def main():
    """메인 함수"""
    success = await test_vision_api()

    if success:
        logger.info("\n🎉 모든 테스트 통과!")
        return 0
    else:
        logger.error("\n⚠️ 테스트 실패")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
