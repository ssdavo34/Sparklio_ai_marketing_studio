"""
C팀 요청사항 수정 테스트

문제 1: LLM이 사용자 입력 무시
문제 2: textBaseline 잘못된 값

작성일: 2025-11-17
작성자: B팀 (Backend)
"""

import asyncio
import json
import logging

from app.services.generator.service import GeneratorService
from app.schemas.generator import GenerateRequest

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def test_user_prompt_reflection():
    """
    테스트 시나리오: 사용자 입력이 LLM 응답에 올바르게 반영되는지 확인
    """
    logger.info("=" * 80)
    logger.info("테스트 시작: 사용자 입력 반영 확인")
    logger.info("=" * 80)

    service = GeneratorService()

    # 테스트 케이스 1: 지성 피부용 진정 토너
    test_cases = [
        {
            "name": "지성 피부용 진정 토너",
            "request": GenerateRequest(
                kind="product_detail",
                brandId="brand_demo",
                input={
                    "prompt": "지성 피부용 진정 토너 상세 페이지를 만들어줘"
                },
                options={
                    "tone": "professional",
                    "length": "medium"
                }
            ),
            "expected_keywords": ["지성", "피부", "진정", "토너"]
        },
        {
            "name": "30대 여성용 레티놀 아이크림",
            "request": GenerateRequest(
                kind="product_detail",
                brandId="brand_demo",
                input={
                    "prompt": "30대 여성용 레티놀 주름 개선 아이크림"
                },
                options={
                    "tone": "professional",
                    "length": "medium"
                }
            ),
            "expected_keywords": ["레티놀", "주름", "아이크림", "30대"]
        },
        {
            "name": "블루투스 노이즈 캔슬링 헤드폰",
            "request": GenerateRequest(
                kind="product_detail",
                brandId="brand_demo",
                input={
                    "prompt": "블루투스 노이즈 캔슬링 헤드폰"
                },
                options={
                    "tone": "professional",
                    "length": "medium"
                }
            ),
            "expected_keywords": ["블루투스", "노이즈", "헤드폰"]
        }
    ]

    results = []

    for test_case in test_cases:
        logger.info(f"\n{'='*80}")
        logger.info(f"테스트 케이스: {test_case['name']}")
        logger.info(f"{'='*80}")

        try:
            # 생성 요청
            response = await service.generate(test_case["request"])

            # 응답 확인
            logger.info(f"\n생성 결과:")
            logger.info(f"  - Headline: {response.text.headline}")
            logger.info(f"  - Subheadline: {response.text.subheadline}")
            logger.info(f"  - Body: {response.text.body[:100]}...")
            logger.info(f"  - Bullets: {response.text.bullets}")
            logger.info(f"  - CTA: {response.text.cta}")

            # 키워드 매칭 검증
            response_text = f"{response.text.headline} {response.text.body}"
            matched_keywords = [
                kw for kw in test_case["expected_keywords"]
                if kw in response_text
            ]

            match_rate = (
                len(matched_keywords) / len(test_case["expected_keywords"])
            )

            logger.info(f"\n키워드 매칭:")
            logger.info(f"  - 예상 키워드: {test_case['expected_keywords']}")
            logger.info(f"  - 매칭된 키워드: {matched_keywords}")
            logger.info(f"  - 매칭률: {match_rate * 100:.1f}%")

            # Canvas JSON에서 textBaseline 확인
            canvas_objects = response.document.canvas_json.get("objects", [])
            text_objects = [
                obj for obj in canvas_objects if obj.get("type") == "text"
            ]

            logger.info(f"\nCanvas 검증:")
            logger.info(f"  - 전체 객체 수: {len(canvas_objects)}")
            logger.info(f"  - 텍스트 객체 수: {len(text_objects)}")

            # textBaseline 검증
            invalid_baseline_count = 0
            for idx, obj in enumerate(text_objects):
                baseline = obj.get("textBaseline")
                if baseline == "alphabetical":
                    logger.error(
                        f"  ❌ 텍스트 객체 #{idx}: "
                        f"잘못된 textBaseline 값 발견: '{baseline}'"
                    )
                    invalid_baseline_count += 1
                elif baseline == "alphabetic":
                    logger.info(
                        f"  ✅ 텍스트 객체 #{idx}: "
                        f"올바른 textBaseline: '{baseline}'"
                    )
                else:
                    logger.warning(
                        f"  ⚠️  텍스트 객체 #{idx}: "
                        f"textBaseline 없음 또는 다른 값: '{baseline}'"
                    )

            # 결과 저장
            test_result = {
                "name": test_case["name"],
                "success": match_rate >= 0.5 and invalid_baseline_count == 0,
                "match_rate": match_rate,
                "matched_keywords": matched_keywords,
                "invalid_baseline_count": invalid_baseline_count,
                "headline": response.text.headline,
                "subheadline": response.text.subheadline
            }

            if test_result["success"]:
                logger.info(f"\n✅ 테스트 통과!")
            else:
                logger.error(f"\n❌ 테스트 실패!")
                if match_rate < 0.5:
                    logger.error(
                        f"   - 키워드 매칭률 부족: {match_rate * 100:.1f}%"
                    )
                if invalid_baseline_count > 0:
                    logger.error(
                        f"   - 잘못된 textBaseline: "
                        f"{invalid_baseline_count}개"
                    )

            results.append(test_result)

        except Exception as e:
            logger.error(f"❌ 테스트 실패: {str(e)}", exc_info=True)
            results.append({
                "name": test_case["name"],
                "success": False,
                "error": str(e)
            })

    # 전체 결과 요약
    logger.info(f"\n{'='*80}")
    logger.info("전체 테스트 결과 요약")
    logger.info(f"{'='*80}")

    success_count = sum(1 for r in results if r.get("success"))
    total_count = len(results)

    logger.info(f"\n성공: {success_count}/{total_count}")

    for result in results:
        status = "✅ 통과" if result.get("success") else "❌ 실패"
        logger.info(f"  {status} - {result['name']}")
        if not result.get("success") and "error" not in result:
            logger.info(
                f"       매칭률: {result.get('match_rate', 0) * 100:.1f}%"
            )

    # JSON 파일로 저장
    with open("test_user_prompt_result.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    logger.info(f"\n테스트 결과를 test_user_prompt_result.json에 저장했습니다.")

    return success_count == total_count


if __name__ == "__main__":
    success = asyncio.run(test_user_prompt_reflection())
    exit(0 if success else 1)
