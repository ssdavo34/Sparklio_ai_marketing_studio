"""
Workflow 통합 테스트

여러 Agent를 조합한 워크플로우가 정상적으로 동작하는지 테스트

작성일: 2025-11-22
작성자: B팀 (Backend)
"""

import pytest
from app.services.agents import (
    get_copywriter_agent,
    get_reviewer_agent,
    create_template_agent,
    AgentRequest
)


@pytest.mark.asyncio
async def test_content_creation_workflow():
    """
    콘텐츠 생성 워크플로우 테스트

    1. CopywriterAgent로 카피 생성
    2. ReviewerAgent로 품질 검토
    """
    # Step 1: 카피 생성
    copywriter = get_copywriter_agent()
    copy_request = AgentRequest(
        task="product_detail",
        payload={
            "product_name": "스마트 워치 Pro",
            "features": ["심박수 모니터링", "GPS 추적", "방수"],
            "target_audience": "운동을 즐기는 2040 남성"
        }
    )

    copy_response = await copywriter.execute(copy_request)
    assert len(copy_response.outputs) > 0

    generated_copy = copy_response.outputs[0].data

    # Step 2: 품질 검토
    reviewer = get_reviewer_agent()
    review_request = AgentRequest(
        task="copy_review",
        payload={
            "content": generated_copy.get("body", ""),
            "criteria": ["grammar", "clarity", "persuasiveness"]
        }
    )

    review_response = await reviewer.execute(review_request)
    assert len(review_response.outputs) > 0

    review_result = review_response.outputs[0].data
    assert "score" in review_result or "quality_score" in review_result


@pytest.mark.asyncio
async def test_template_based_workflow():
    """
    템플릿 기반 콘텐츠 생성 워크플로우 테스트

    1. TemplateAgent로 템플릿 생성
    2. TemplateAgent로 템플릿 적용
    """
    template_agent = create_template_agent()

    # Step 1: 템플릿 생성
    generate_request = AgentRequest(
        task="generate_template",
        payload={
            "industry": "ecommerce",
            "channel": "landing_page",
            "purpose": "product_intro"
        }
    )

    generate_response = await template_agent.execute(generate_request)
    assert len(generate_response.outputs) > 0

    template_data = generate_response.outputs[0].data
    template_id = template_data.get("template_id")

    # Step 2: 템플릿 적용
    apply_request = AgentRequest(
        task="apply_template",
        payload={
            "template_id": template_id,
            "variable_values": {
                "headline": "혁신적인 스마트 워치",
                "hero_image": "https://example.com/watch.jpg",
                "description": "최고의 기술력"
            }
        }
    )

    apply_response = await template_agent.execute(apply_request)
    assert len(apply_response.outputs) > 0

    rendered_data = apply_response.outputs[0].data
    assert "rendered_html" in rendered_data or "result" in rendered_data


@pytest.mark.asyncio
async def test_multi_agent_collaboration():
    """
    여러 Agent가 협업하는 시나리오 테스트

    1. TemplateAgent로 템플릿 목록 조회
    2. CopywriterAgent로 헤드라인 생성
    3. ReviewerAgent로 검토
    """
    # Step 1: 템플릿 조회
    template_agent = create_template_agent()
    list_request = AgentRequest(
        task="list_templates",
        payload={
            "industry": "tech",
            "limit": 5
        }
    )

    list_response = await template_agent.execute(list_request)
    assert len(list_response.outputs) > 0

    # Step 2: 헤드라인 생성
    copywriter = get_copywriter_agent()
    headline_request = AgentRequest(
        task="headline",
        payload={
            "context": "AI 기반 마케팅 자동화 플랫폼",
            "style": "innovative"
        }
    )

    headline_response = await copywriter.execute(headline_request)
    assert len(headline_response.outputs) >= 3  # A/B/C 버전

    # Step 3: 첫 번째 헤드라인 검토
    reviewer = get_reviewer_agent()
    first_headline = headline_response.outputs[0].data.get("headline", "")

    review_request = AgentRequest(
        task="content_review",
        payload={
            "content": first_headline,
            "content_type": "headline"
        }
    )

    review_response = await reviewer.execute(review_request)
    assert len(review_response.outputs) > 0


@pytest.mark.asyncio
async def test_error_recovery_workflow():
    """
    에러 발생 시 복구 시나리오 테스트

    1. 잘못된 입력으로 Agent 실행
    2. 올바른 입력으로 재시도
    """
    copywriter = get_copywriter_agent()

    # Step 1: 잘못된 요청 (빈 payload)
    invalid_request = AgentRequest(
        task="product_detail",
        payload={}  # 필수 필드 누락
    )

    try:
        # Mock 모드에서는 에러가 발생하지 않을 수 있음
        invalid_response = await copywriter.execute(invalid_request)
        assert invalid_response is not None
    except Exception:
        pass  # 에러가 발생해도 OK

    # Step 2: 올바른 요청으로 재시도
    valid_request = AgentRequest(
        task="product_detail",
        payload={
            "product_name": "복구 테스트 제품",
            "features": ["기능1", "기능2"],
            "target_audience": "테스트 사용자"
        }
    )

    valid_response = await copywriter.execute(valid_request)
    assert len(valid_response.outputs) > 0


@pytest.mark.asyncio
async def test_performance_workflow():
    """
    성능 테스트: 여러 Agent를 순차적으로 실행
    """
    import time

    start_time = time.time()

    # 3개 Agent 순차 실행
    copywriter = get_copywriter_agent()
    reviewer = get_reviewer_agent()
    template_agent = create_template_agent()

    tasks = [
        (copywriter, AgentRequest(task="headline", payload={"context": "테스트"})),
        (reviewer, AgentRequest(task="content_review", payload={"content": "테스트"})),
        (template_agent, AgentRequest(task="list_templates", payload={"industry": "ecommerce"}))
    ]

    results = []
    for agent, request in tasks:
        response = await agent.execute(request)
        results.append(response)

    elapsed_time = time.time() - start_time

    # 모든 Agent가 정상 실행되었는지 확인
    assert len(results) == 3
    for result in results:
        assert len(result.outputs) > 0

    # 성능 체크 (Mock 모드에서는 빠르게 실행됨)
    assert elapsed_time < 30  # 30초 이내
