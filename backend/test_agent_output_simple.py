"""
Agent Output 진단 - 간단 버전

실제 LLM 호출 후 응답 구조 확인
"""
import asyncio
import json
from app.services.workflows.executor import WorkflowExecutor


async def test_workflow_output():
    """Workflow 실행 후 Agent 출력 확인"""
    print("=" * 60)
    print("Workflow Output 진단")
    print("=" * 60)

    executor = WorkflowExecutor()

    # Product Content Pipeline 실행
    result = await executor.execute(
        workflow_name="product_content_pipeline",
        input_data={
            "kind": "product_detail",
            "product_name": "프리미엄 무선 이어폰",
            "features": ["노이즈캔슬링", "24시간 배터리"],
            "target_audience": "2030 직장인"
        },
        options={}
    )

    print(f"\n✅ Workflow 완료:")
    print(f"  steps_completed: {result.steps_completed}/{result.total_steps}")
    print(f"  total_elapsed: {result.total_elapsed_seconds:.2f}s")

    print(f"\n📊 Agents 실행 결과: {len(result.results)}개")
    for idx, agent_result in enumerate(result.results):
        print(f"\n[{idx}] Agent: {agent_result.agent}")
        print(f"    status: {agent_result.status}")
        print(f"    outputs: {len(agent_result.outputs)}개")
        print(f"    usage: {agent_result.usage}")

        for out_idx, output in enumerate(agent_result.outputs):
            print(f"\n    Output[{out_idx}]:")
            print(f"      type: {output.type}")
            print(f"      name: {output.name}")

            if output.type == "json" and isinstance(output.value, dict):
                print(f"      value keys: {list(output.value.keys())}")
                print(f"      value content:")
                print(json.dumps(output.value, ensure_ascii=False, indent=8))
            else:
                value_preview = str(output.value)[:200]
                print(f"      value preview: {value_preview}")

    # 마지막 Agent 출력 집중 분석
    if result.results:
        last_result = result.results[-1]
        print(f"\n" + "=" * 60)
        print(f"마지막 Agent ({last_result.agent}) 출력 분석")
        print("=" * 60)

        text_data = {}
        for output in last_result.outputs:
            if output.type == "json" and isinstance(output.value, dict):
                text_data.update(output.value)

        print(f"\n추출된 text_data:")
        print(json.dumps(text_data, ensure_ascii=False, indent=2))

        print(f"\n기대하는 필드:")
        print(f"  headline: {'✅' if 'headline' in text_data else '❌'}")
        print(f"  subheadline: {'✅' if 'subheadline' in text_data else '❌'}")
        print(f"  body: {'✅' if 'body' in text_data else '❌'}")
        print(f"  bullets: {'✅' if 'bullets' in text_data else '❌'}")
        print(f"  cta: {'✅' if 'cta' in text_data else '❌'}")


if __name__ == "__main__":
    asyncio.run(test_workflow_output())
