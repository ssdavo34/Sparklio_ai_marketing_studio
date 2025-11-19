"""
VisionAnalyzerAgent 테스트

작성일: 2025-11-19
작성자: B팀 (Backend)

간단한 기능 테스트 스크립트
"""

import asyncio
from app.services.agents import get_vision_analyzer_agent, AgentRequest


async def test_vision_analyzer_basic():
    """기본 Vision Analyzer 테스트"""

    print("=" * 60)
    print("VisionAnalyzerAgent 기본 테스트")
    print("=" * 60)

    # Agent 인스턴스 생성
    agent = get_vision_analyzer_agent()
    print(f"✅ Agent 생성 완료: {agent.name}")

    # 테스트 요청 생성
    request = AgentRequest(
        task="image_analysis",
        payload={
            "image_url": "https://example.com/test-image.jpg",
            "criteria": {
                "composition": True,
                "color_harmony": True,
                "brand_consistency": False,
                "technical_quality": True
            }
        }
    )

    print(f"\n📋 테스트 요청:")
    print(f"  - Task: {request.task}")
    print(f"  - Image URL: {request.payload['image_url']}")
    print(f"  - Criteria: {request.payload['criteria']}")

    # Agent 실행
    print(f"\n🔄 Agent 실행 중...")
    response = await agent.execute(request)

    print(f"\n✅ Agent 실행 완료!")
    print(f"  - Agent: {response.agent}")
    print(f"  - Task: {response.task}")
    print(f"  - Outputs: {len(response.outputs)}개")
    print(f"  - Elapsed: {response.usage.get('elapsed_seconds')}초")

    # 결과 출력
    for idx, output in enumerate(response.outputs):
        print(f"\n📦 Output #{idx + 1}:")
        print(f"  - Type: {output.type}")
        print(f"  - Name: {output.name}")

        if output.type == "json":
            analysis = output.value
            print(f"  - Quality Score: {analysis.get('quality_score'):.2f}")
            print(f"  - Overall Verdict: {analysis.get('overall_verdict')}")
            print(f"  - Requires Regeneration: {analysis.get('requires_regeneration')}")

            if analysis.get('improvements'):
                print(f"\n  📝 개선 제안:")
                for improvement in analysis['improvements']:
                    print(f"    - {improvement}")

    print("\n" + "=" * 60)
    print("테스트 완료!")
    print("=" * 60)


async def test_vision_analyzer_with_brand_guidelines():
    """브랜드 가이드라인 포함 테스트"""

    print("\n\n" + "=" * 60)
    print("VisionAnalyzerAgent 브랜드 가이드라인 테스트")
    print("=" * 60)

    # Agent 인스턴스 생성
    agent = get_vision_analyzer_agent()

    # 브랜드 가이드라인 포함 요청
    request = AgentRequest(
        task="image_analysis",
        payload={
            "image_url": "https://example.com/branded-image.jpg",
            "criteria": {
                "composition": True,
                "color_harmony": True,
                "brand_consistency": True,  # 브랜드 일관성 체크 활성화
                "technical_quality": True
            },
            "brand_guidelines": {
                "primary_colors": ["#FF0000", "#0000FF"],
                "style": "minimalist",
                "tone": "professional"
            }
        }
    )

    print(f"\n📋 테스트 요청:")
    print(f"  - Task: {request.task}")
    print(f"  - Brand Guidelines: Yes")
    print(f"    - Colors: {request.payload['brand_guidelines']['primary_colors']}")
    print(f"    - Style: {request.payload['brand_guidelines']['style']}")

    # Agent 실행
    print(f"\n🔄 Agent 실행 중...")
    response = await agent.execute(request)

    print(f"\n✅ Agent 실행 완료!")

    # 브랜드 일관성 결과 확인
    for output in response.outputs:
        if output.type == "json":
            analysis = output.value
            if "brand_consistency" in analysis:
                bc = analysis["brand_consistency"]
                print(f"\n📊 브랜드 일관성 분석:")
                print(f"  - Score: {bc.get('score'):.2f}")
                print(f"  - Matches Guidelines: {bc.get('matches_guidelines')}")
                if bc.get('deviations'):
                    print(f"  - Deviations:")
                    for deviation in bc['deviations']:
                        print(f"    - {deviation}")

    print("\n" + "=" * 60)
    print("테스트 완료!")
    print("=" * 60)


async def main():
    """메인 테스트 함수"""
    try:
        # 기본 테스트
        await test_vision_analyzer_basic()

        # 브랜드 가이드라인 테스트
        await test_vision_analyzer_with_brand_guidelines()

        print("\n\n🎉 모든 테스트가 성공적으로 완료되었습니다!")

    except Exception as e:
        print(f"\n\n❌ 테스트 실패: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
