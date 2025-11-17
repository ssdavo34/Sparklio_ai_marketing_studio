"""
Orchestrator 테스트

워크플로우 실행 테스트

작성일: 2025-11-17
"""
import asyncio
import json
from app.services.orchestrator import (
    WorkflowExecutor,
    get_workflow
)


async def test_product_content_workflow():
    """제품 콘텐츠 파이프라인 테스트"""
    print("=" * 60)
    print("Test 1: Product Content Workflow")
    print("=" * 60)

    # 워크플로우 정의 가져오기
    workflow = get_workflow("product_content")

    print(f"\n워크플로우: {workflow.name}")
    print(f"설명: {workflow.description}")
    print(f"스텝 수: {len(workflow.steps)}")
    print(f"실행 방식: {workflow.step_type}")

    # 워크플로우 실행
    executor = WorkflowExecutor()

    initial_payload = {
        "product_name": "프리미엄 무선 이어폰",
        "features": ["프리미엄 노이즈캔슬링", "24시간 배터리", "IPX7 방수"],
        "target_audience": "2030 직장인"
    }

    print(f"\n초기 입력:")
    print(json.dumps(initial_payload, ensure_ascii=False, indent=2))

    try:
        result = await executor.execute(workflow, initial_payload)

        print(f"\n실행 결과:")
        print(f"  Success: {result.success}")
        print(f"  Steps Completed: {result.steps_completed}/{result.total_steps}")
        print(f"  Total Elapsed: {result.total_elapsed_seconds:.2f}s")

        if result.success:
            print(f"\n각 스텝 결과:")
            for idx, agent_result in enumerate(result.results):
                print(f"\n  Step {idx + 1}: {agent_result.agent} ({agent_result.task})")
                print(f"    Outputs: {len(agent_result.outputs)}")
                print(f"    Elapsed: {agent_result.usage.get('elapsed_seconds', 0):.2f}s")

                # 최종 결과만 출력
                if idx == len(result.results) - 1:
                    for output in agent_result.outputs:
                        if output.type == "json":
                            value_str = json.dumps(
                                output.value,
                                ensure_ascii=False,
                                indent=2
                            )
                            print(f"\n    최종 최적화 결과:")
                            print(f"    {value_str[:500]}...")

            print(f"\n✅ 워크플로우 성공!")
        else:
            print(f"\n❌ 워크플로우 실패:")
            for error in result.errors:
                print(f"  - {error}")

    except Exception as e:
        print(f"\n❌ Error: {e}")


async def test_brand_identity_workflow():
    """브랜드 아이덴티티 파이프라인 테스트"""
    print("\n" + "=" * 60)
    print("Test 2: Brand Identity Workflow")
    print("=" * 60)

    workflow = get_workflow("brand_identity")

    print(f"\n워크플로우: {workflow.name}")
    print(f"스텝 수: {len(workflow.steps)}")

    executor = WorkflowExecutor()

    initial_payload = {
        "brand_name": "EcoTech",
        "industry": "친환경 기술",
        "target_market": "환경의식 높은 MZ세대"
    }

    try:
        result = await executor.execute(workflow, initial_payload)

        print(f"\n실행 결과:")
        print(f"  Success: {result.success}")
        print(f"  Steps: {result.steps_completed}/{result.total_steps}")
        print(f"  Elapsed: {result.total_elapsed_seconds:.2f}s")

        if result.success:
            print(f"\n✅ 워크플로우 성공!")
        else:
            print(f"\n❌ 워크플로우 실패:")
            for error in result.errors:
                print(f"  - {error}")

    except Exception as e:
        print(f"\n❌ Error: {e}")


async def test_content_review_workflow():
    """콘텐츠 검토 파이프라인 테스트"""
    print("\n" + "=" * 60)
    print("Test 3: Content Review Workflow")
    print("=" * 60)

    workflow = get_workflow("content_review")

    print(f"\n워크플로우: {workflow.name}")
    print(f"스텝 수: {len(workflow.steps)}")

    executor = WorkflowExecutor()

    initial_payload = {
        "content": {
            "headline": "완벽한 소음 차단의 시작",
            "body": "프리미엄 노이즈캔슬링 기술로 당신만의 조용한 공간을 만들어보세요."
        }
    }

    try:
        result = await executor.execute(workflow, initial_payload)

        print(f"\n실행 결과:")
        print(f"  Success: {result.success}")
        print(f"  Steps: {result.steps_completed}/{result.total_steps}")
        print(f"  Elapsed: {result.total_elapsed_seconds:.2f}s")

        if result.success:
            print(f"\n✅ 워크플로우 성공!")
        else:
            print(f"\n❌ 워크플로우 실패:")
            for error in result.errors:
                print(f"  - {error}")

    except Exception as e:
        print(f"\n❌ Error: {e}")


async def test_workflow_list():
    """워크플로우 목록 테스트"""
    print("\n" + "=" * 60)
    print("Test 4: Available Workflows")
    print("=" * 60)

    workflows = ["product_content", "brand_identity", "content_review"]

    for name in workflows:
        workflow = get_workflow(name)
        print(f"\n{name}:")
        print(f"  Name: {workflow.name}")
        print(f"  Description: {workflow.description}")
        print(f"  Steps: {len(workflow.steps)}")
        print(f"  Type: {workflow.step_type}")


async def main():
    """메인 테스트 실행"""
    print("\n🚀 Orchestrator 통합 테스트 시작\n")

    # Test 1: Product Content Workflow
    await test_product_content_workflow()

    # Test 2: Brand Identity Workflow
    await test_brand_identity_workflow()

    # Test 3: Content Review Workflow
    await test_content_review_workflow()

    # Test 4: Workflow List
    await test_workflow_list()

    print("\n" + "=" * 60)
    print("✅ 모든 Orchestrator 테스트 완료")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
