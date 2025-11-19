"""
Vision API 간단 테스트

Redis 의존성 없이 Vision API만 테스트합니다.

실행 방법:
    python test_vision_simple.py

주의:
    - ANTHROPIC_API_KEY 또는 OPENAI_API_KEY 환경변수 필요
    - 실제 API 호출이므로 비용 발생 가능
"""

import asyncio
import logging
import sys
import os

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def test_anthropic_vision():
    """Anthropic Vision API 직접 테스트"""
    from anthropic import Anthropic

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        logger.warning("ANTHROPIC_API_KEY not found. Skipping Anthropic test.")
        return False

    logger.info("=" * 80)
    logger.info("Anthropic Vision API 테스트")
    logger.info("=" * 80)

    client = Anthropic(api_key=api_key)

    # 테스트용 이미지 URL
    test_image_url = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"

    prompt = """당신은 전문 비주얼 품질 평가 전문가입니다.
제공된 이미지를 다음 기준으로 분석하고 평가하세요.

1. **구도 분석**: 요소 배치, 균형, 시선 흐름을 평가하세요.
2. **색상 조화**: 색상 조합, 대비, 가독성을 평가하세요.
3. **기술적 품질**: 해상도, 선명도, 이미지 품질을 평가하세요.

각 항목마다 0-1 점수와 상세 분석을 제공하고,
개선이 필요한 사항을 구체적으로 제안하세요.

JSON 형식으로 응답하세요:
{
  "quality_score": 0.85,
  "composition": {"score": 0.9, "analysis": "..."},
  "color_harmony": {"score": 0.85, "analysis": "..."},
  "technical_quality": {"score": 0.80, "resolution": "good", "clarity": "good"},
  "improvements": ["...", "..."],
  "overall_verdict": "good",
  "requires_regeneration": false
}"""

    try:
        logger.info(f"이미지 분석 중: {test_image_url}")

        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4000,
            temperature=0.7,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "url",
                                "url": test_image_url
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        )

        content = response.content[0].text

        logger.info("=" * 80)
        logger.info("✅ Anthropic Vision API 호출 성공!")
        logger.info("=" * 80)
        logger.info(f"응답 길이: {len(content)} 문자")
        logger.info(f"Token 사용: {response.usage.input_tokens} input, {response.usage.output_tokens} output")
        logger.info("\n응답 내용 (처음 500자):")
        logger.info(content[:500])

        return True

    except Exception as e:
        logger.error(f"❌ Anthropic Vision API 테스트 실패: {str(e)}", exc_info=True)
        return False


async def test_openai_vision():
    """OpenAI Vision API 직접 테스트"""
    from openai import OpenAI

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.warning("OPENAI_API_KEY not found. Skipping OpenAI test.")
        return False

    logger.info("=" * 80)
    logger.info("OpenAI Vision API 테스트")
    logger.info("=" * 80)

    client = OpenAI(api_key=api_key)

    # 테스트용 이미지 URL
    test_image_url = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"

    prompt = """당신은 전문 비주얼 품질 평가 전문가입니다.
제공된 이미지를 다음 기준으로 분석하고 평가하세요.

1. **구도 분석**: 요소 배치, 균형, 시선 흐름을 평가하세요.
2. **색상 조화**: 색상 조합, 대비, 가독성을 평가하세요.
3. **기술적 품질**: 해상도, 선명도, 이미지 품질을 평가하세요.

각 항목마다 0-1 점수와 상세 분석을 제공하고,
개선이 필요한 사항을 구체적으로 제안하세요.

JSON 형식으로 응답하세요."""

    try:
        logger.info(f"이미지 분석 중: {test_image_url}")

        response = client.chat.completions.create(
            model="gpt-4o",
            max_tokens=4000,
            temperature=0.7,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": test_image_url
                            }
                        }
                    ]
                }
            ]
        )

        content = response.choices[0].message.content

        logger.info("=" * 80)
        logger.info("✅ OpenAI Vision API 호출 성공!")
        logger.info("=" * 80)
        logger.info(f"응답 길이: {len(content)} 문자")
        logger.info(f"Token 사용: {response.usage.prompt_tokens} input, {response.usage.completion_tokens} output")
        logger.info("\n응답 내용 (처음 500자):")
        logger.info(content[:500])

        return True

    except Exception as e:
        logger.error(f"❌ OpenAI Vision API 테스트 실패: {str(e)}", exc_info=True)
        return False


async def main():
    """메인 함수"""
    logger.info("\n🚀 Vision API 간단 테스트 시작\n")

    # Anthropic 테스트
    anthropic_success = await test_anthropic_vision()

    print("\n" + "=" * 80 + "\n")

    # OpenAI 테스트
    openai_success = await test_openai_vision()

    logger.info("\n" + "=" * 80)
    logger.info("테스트 결과 요약")
    logger.info("=" * 80)
    logger.info(f"Anthropic Vision API: {'✅ 성공' if anthropic_success else '❌ 실패'}")
    logger.info(f"OpenAI Vision API: {'✅ 성공' if openai_success else '❌ 실패'}")
    logger.info("=" * 80)

    if anthropic_success or openai_success:
        logger.info("\n🎉 최소 1개 이상의 Vision API 테스트 성공!")
        return 0
    else:
        logger.error("\n⚠️ 모든 Vision API 테스트 실패")
        logger.error("API Key가 설정되어 있는지 확인하세요.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
