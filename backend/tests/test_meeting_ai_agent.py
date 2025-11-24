"""
MeetingAI Agent Tests

회의 분석 Agent (meeting_summary task) 테스트

작성일: 2025-11-24
작성자: B팀 (Backend)
"""

import pytest
import json
from pathlib import Path
from typing import Dict, Any
from unittest.mock import Mock, AsyncMock, patch

from app.services.agents.meeting_ai import MeetingAIAgent, get_meeting_ai_agent
from app.services.agents.base import AgentRequest, AgentResponse, AgentError
from app.services.llm import LLMProviderOutput


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def golden_set() -> Dict[str, Any]:
    """Golden Set 로드"""
    golden_set_path = Path(__file__).parent / "golden_set" / "meeting_summary_v1.json"
    with open(golden_set_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def mock_llm_gateway():
    """Mock LLM Gateway"""
    gateway = Mock()
    gateway.generate = AsyncMock()
    return gateway


@pytest.fixture
def meeting_agent(mock_llm_gateway):
    """MeetingAIAgent 인스턴스"""
    return MeetingAIAgent(llm_gateway=mock_llm_gateway)


# =============================================================================
# Unit Tests - Agent Basics
# =============================================================================

def test_meeting_agent_name(meeting_agent):
    """Agent 이름 확인"""
    assert meeting_agent.name == "meeting_ai"


def test_get_meeting_ai_agent():
    """get_meeting_ai_agent() 팩토리 함수 테스트"""
    agent = get_meeting_ai_agent()
    assert isinstance(agent, MeetingAIAgent)
    assert agent.name == "meeting_ai"


# =============================================================================
# Unit Tests - meeting_summary Task
# =============================================================================

@pytest.mark.asyncio
async def test_meeting_summary_basic(meeting_agent, mock_llm_gateway):
    """meeting_summary 기본 동작 테스트"""
    # Mock LLM 응답
    mock_llm_response = Mock()
    mock_llm_response.output = LLMProviderOutput(
        type="json",
        value={
            "summary": "Test meeting summary",
            "agenda": ["Topic 1", "Topic 2"],
            "decisions": ["Decision 1"],
            "action_items": ["Action 1"],
            "campaign_ideas": ["Idea 1"]
        }
    )
    mock_llm_response.provider = "ollama"
    mock_llm_response.model = "qwen2.5:7b"
    mock_llm_response.usage = {"total_tokens": 500}

    mock_llm_gateway.generate.return_value = mock_llm_response

    # Execute
    request = AgentRequest(
        task="meeting_summary",
        payload={
            "transcript": "A: Hello. B: Hi.",
            "meeting_title": "Test Meeting"
        }
    )

    response = await meeting_agent.execute(request)

    # Assert
    assert isinstance(response, AgentResponse)
    assert response.agent == "meeting_ai"
    assert response.task == "meeting_summary"
    assert len(response.outputs) == 1
    assert response.outputs[0].type == "json"
    assert "summary" in response.outputs[0].value
    assert "agenda" in response.outputs[0].value
    assert "decisions" in response.outputs[0].value
    assert "action_items" in response.outputs[0].value
    assert "campaign_ideas" in response.outputs[0].value


@pytest.mark.asyncio
async def test_meeting_summary_with_brand_context(meeting_agent, mock_llm_gateway):
    """Brand context 포함 테스트"""
    mock_llm_response = Mock()
    mock_llm_response.output = LLMProviderOutput(
        type="json",
        value={
            "summary": "Brand-aligned summary",
            "agenda": ["Branding topic"],
            "decisions": [],
            "action_items": [],
            "campaign_ideas": ["Brand campaign"]
        }
    )
    mock_llm_response.provider = "ollama"
    mock_llm_response.model = "qwen2.5:7b"
    mock_llm_response.usage = {"total_tokens": 600}

    mock_llm_gateway.generate.return_value = mock_llm_response

    request = AgentRequest(
        task="meeting_summary",
        payload={
            "transcript": "Discussing brand strategy...",
            "meeting_title": "Brand Meeting",
            "brand_context": "Eco-friendly fashion brand targeting Gen Z"
        }
    )

    response = await meeting_agent.execute(request)

    # LLM gateway가 brand_context를 받았는지 확인
    call_args = mock_llm_gateway.generate.call_args
    assert "brand_context" in call_args[1]["payload"]
    assert call_args[1]["payload"]["brand_context"] == "Eco-friendly fashion brand targeting Gen Z"


@pytest.mark.asyncio
async def test_meeting_summary_korean_language(meeting_agent, mock_llm_gateway):
    """한국어 회의 트랜스크립트 테스트"""
    mock_llm_response = Mock()
    mock_llm_response.output = LLMProviderOutput(
        type="json",
        value={
            "summary": "신제품 런칭 전략 회의 요약",
            "agenda": ["타겟 고객 분석", "마케팅 채널 선정"],
            "decisions": ["타겟: 20-30대 여성"],
            "action_items": ["인플루언서 섭외 (담당: 김대리, 기한: 12월 1일)"],
            "campaign_ideas": ["언박싱 챌린지"]
        }
    )
    mock_llm_response.provider = "openai"
    mock_llm_response.model = "gpt-4o-mini"
    mock_llm_response.usage = {"total_tokens": 800}

    mock_llm_gateway.generate.return_value = mock_llm_response

    request = AgentRequest(
        task="meeting_summary",
        payload={
            "transcript": "김대리: 안녕하세요. 박팀장: 네, 시작하겠습니다.",
            "meeting_title": "신제품 런칭 회의"
        }
    )

    response = await meeting_agent.execute(request)

    assert response.outputs[0].value["summary"] == "신제품 런칭 전략 회의 요약"


# =============================================================================
# Unit Tests - Error Handling
# =============================================================================

@pytest.mark.asyncio
async def test_missing_transcript(meeting_agent):
    """transcript 누락 시 에러"""
    request = AgentRequest(
        task="meeting_summary",
        payload={
            "meeting_title": "Test"
            # transcript 누락
        }
    )

    with pytest.raises(AgentError):
        await meeting_agent.execute(request)


@pytest.mark.asyncio
async def test_llm_failure_handling(meeting_agent, mock_llm_gateway):
    """LLM 호출 실패 처리"""
    mock_llm_gateway.generate.side_effect = Exception("LLM API Error")

    request = AgentRequest(
        task="meeting_summary",
        payload={
            "transcript": "Test transcript"
        }
    )

    with pytest.raises(AgentError) as exc_info:
        await meeting_agent.execute(request)

    assert "Meeting AI execution failed" in str(exc_info.value)


# =============================================================================
# Golden Set Tests
# =============================================================================

@pytest.mark.asyncio
@pytest.mark.golden_set
async def test_golden_set_case_001(meeting_agent, mock_llm_gateway, golden_set):
    """Golden Set Case 001: 신제품 런칭 전략 회의"""
    test_case = golden_set["test_cases"][0]
    expected = test_case["expected_output"]

    # Mock LLM이 expected output을 반환하도록 설정
    mock_llm_response = Mock()
    mock_llm_response.output = LLMProviderOutput(
        type="json",
        value=expected
    )
    mock_llm_response.provider = "ollama"
    mock_llm_response.model = "qwen2.5:7b"
    mock_llm_response.usage = {"total_tokens": 1000}

    mock_llm_gateway.generate.return_value = mock_llm_response

    # Execute
    request = AgentRequest(
        task="meeting_summary",
        payload=test_case["input"]
    )

    response = await meeting_agent.execute(request)
    result = response.outputs[0].value

    # Validate structure
    assert "summary" in result
    assert "agenda" in result
    assert "decisions" in result
    assert "action_items" in result
    assert "campaign_ideas" in result

    # Validate counts
    validation = test_case["validation_rules"]
    assert len(result["summary"]) >= validation["summary_min_length"]
    assert validation["agenda_count"][0] <= len(result["agenda"]) <= validation["agenda_count"][1]
    assert validation["decisions_count"][0] <= len(result["decisions"]) <= validation["decisions_count"][1]
    assert validation["action_items_count"][0] <= len(result["action_items"]) <= validation["action_items_count"][1]
    assert validation["campaign_ideas_count"][0] <= len(result["campaign_ideas"]) <= validation["campaign_ideas_count"][1]


@pytest.mark.asyncio
@pytest.mark.golden_set
async def test_golden_set_case_002_english(meeting_agent, mock_llm_gateway, golden_set):
    """Golden Set Case 002: Brand Strategy Meeting (English)"""
    test_case = golden_set["test_cases"][1]
    expected = test_case["expected_output"]

    mock_llm_response = Mock()
    mock_llm_response.output = LLMProviderOutput(type="json", value=expected)
    mock_llm_response.provider = "anthropic"
    mock_llm_response.model = "claude-3-5-haiku-20241022"
    mock_llm_response.usage = {"total_tokens": 900}

    mock_llm_gateway.generate.return_value = mock_llm_response

    request = AgentRequest(
        task="meeting_summary",
        payload=test_case["input"]
    )

    response = await meeting_agent.execute(request)
    result = response.outputs[0].value

    # Validate structure
    assert all(key in result for key in ["summary", "agenda", "decisions", "action_items", "campaign_ideas"])

    # Validate counts
    validation = test_case["validation_rules"]
    assert len(result["summary"]) >= validation["summary_min_length"]
    assert validation["agenda_count"][0] <= len(result["agenda"]) <= validation["agenda_count"][1]


@pytest.mark.asyncio
@pytest.mark.golden_set
async def test_golden_set_case_003_minimal(meeting_agent, mock_llm_gateway, golden_set):
    """Golden Set Case 003: 짧은 간단한 회의"""
    test_case = golden_set["test_cases"][2]
    expected = test_case["expected_output"]

    mock_llm_response = Mock()
    mock_llm_response.output = LLMProviderOutput(type="json", value=expected)
    mock_llm_response.provider = "ollama"
    mock_llm_response.model = "qwen2.5:7b"
    mock_llm_response.usage = {"total_tokens": 400}

    mock_llm_gateway.generate.return_value = mock_llm_response

    request = AgentRequest(
        task="meeting_summary",
        payload=test_case["input"]
    )

    response = await meeting_agent.execute(request)
    result = response.outputs[0].value

    # campaign_ideas가 빈 배열일 수 있음
    assert isinstance(result["campaign_ideas"], list)
    validation = test_case["validation_rules"]
    assert len(result["campaign_ideas"]) <= validation["campaign_ideas_count"][1]


@pytest.mark.asyncio
@pytest.mark.golden_set
async def test_golden_set_case_004_brainstorming(meeting_agent, mock_llm_gateway, golden_set):
    """Golden Set Case 004: 크리에이티브 브레인스토밍"""
    test_case = golden_set["test_cases"][3]
    expected = test_case["expected_output"]

    mock_llm_response = Mock()
    mock_llm_response.output = LLMProviderOutput(type="json", value=expected)
    mock_llm_response.provider = "openai"
    mock_llm_response.model = "gpt-4o-mini"
    mock_llm_response.usage = {"total_tokens": 1200}

    mock_llm_gateway.generate.return_value = mock_llm_response

    request = AgentRequest(
        task="meeting_summary",
        payload=test_case["input"]
    )

    response = await meeting_agent.execute(request)
    result = response.outputs[0].value

    # 브레인스토밍이므로 campaign_ideas가 많아야 함
    validation = test_case["validation_rules"]
    assert len(result["campaign_ideas"]) >= validation["campaign_ideas_count"][0]
    assert len(result["campaign_ideas"]) <= validation["campaign_ideas_count"][1]


@pytest.mark.asyncio
@pytest.mark.golden_set
async def test_golden_set_case_005_quarterly_review(meeting_agent, mock_llm_gateway, golden_set):
    """Golden Set Case 005: 분기 리뷰 회의"""
    test_case = golden_set["test_cases"][4]
    expected = test_case["expected_output"]

    mock_llm_response = Mock()
    mock_llm_response.output = LLMProviderOutput(type="json", value=expected)
    mock_llm_response.provider = "ollama"
    mock_llm_response.model = "qwen2.5:7b"
    mock_llm_response.usage = {"total_tokens": 1500}

    mock_llm_gateway.generate.return_value = mock_llm_response

    request = AgentRequest(
        task="meeting_summary",
        payload=test_case["input"]
    )

    response = await meeting_agent.execute(request)
    result = response.outputs[0].value

    # 분기 리뷰이므로 summary가 길고 상세해야 함
    validation = test_case["validation_rules"]
    assert len(result["summary"]) >= validation["summary_min_length"]

    # decisions와 action_items가 있어야 함
    assert len(result["decisions"]) >= validation["decisions_count"][0]
    assert len(result["action_items"]) >= validation["action_items_count"][0]


# =============================================================================
# Integration-like Tests (Mock 사용하지만 전체 플로우 테스트)
# =============================================================================

@pytest.mark.asyncio
async def test_full_flow_with_all_fields(meeting_agent, mock_llm_gateway):
    """모든 필드 포함한 전체 플로우 테스트"""
    mock_llm_response = Mock()
    mock_llm_response.output = LLMProviderOutput(
        type="json",
        value={
            "summary": "Full meeting summary with all details",
            "agenda": ["Agenda 1", "Agenda 2", "Agenda 3"],
            "decisions": ["Decision 1", "Decision 2"],
            "action_items": [
                "Task 1 (Owner: John, Due: 2025-12-01)",
                "Task 2 (Owner: Sarah, Due: 2025-12-05)"
            ],
            "campaign_ideas": ["Campaign 1", "Campaign 2", "Campaign 3"]
        }
    )
    mock_llm_response.provider = "openai"
    mock_llm_response.model = "gpt-4o-mini"
    mock_llm_response.usage = {"total_tokens": 2000}

    mock_llm_gateway.generate.return_value = mock_llm_response

    request = AgentRequest(
        task="meeting_summary",
        payload={
            "transcript": "Very detailed meeting transcript...",
            "meeting_title": "Q4 Strategy Meeting",
            "meeting_date": "2025-11-24T14:00:00Z",
            "brand_context": "Premium beauty brand"
        }
    )

    response = await meeting_agent.execute(request)

    # Response structure
    assert response.agent == "meeting_ai"
    assert response.task == "meeting_summary"
    assert response.usage["llm_tokens"] == 2000
    assert response.meta["llm_provider"] == "openai"
    assert response.meta["llm_model"] == "gpt-4o-mini"

    # Output
    result = response.outputs[0].value
    assert len(result["agenda"]) == 3
    assert len(result["decisions"]) == 2
    assert len(result["action_items"]) == 2
    assert len(result["campaign_ideas"]) == 3


# =============================================================================
# Unit Tests - meeting_to_brief Task
# =============================================================================

@pytest.mark.asyncio
async def test_meeting_to_brief_basic(meeting_agent, mock_llm_gateway):
    """meeting_to_brief 기본 동작 테스트"""
    mock_llm_response = Mock()
    mock_llm_response.output = LLMProviderOutput(
        type="json",
        value={
            "brief_title": "Test Campaign Brief",
            "objective": "Test objective",
            "target_audience": "Test audience",
            "key_messages": ["Message 1", "Message 2", "Message 3"],
            "channels": ["Instagram", "TikTok"],
            "timeline": "2025-12 ~ 2026-02",
            "budget": "50,000,000원",
            "deliverables": ["Deliverable 1", "Deliverable 2"],
            "constraints": ["Constraint 1"],
            "success_metrics": ["Metric 1"]
        }
    )
    mock_llm_response.provider = "openai"
    mock_llm_response.model = "gpt-4o-mini"
    mock_llm_response.usage = {"total_tokens": 1500}

    mock_llm_gateway.generate.return_value = mock_llm_response

    request = AgentRequest(
        task="meeting_to_brief",
        payload={
            "meeting_summary": {
                "summary": "Product launch meeting",
                "agenda": ["Target audience", "Channels"],
                "decisions": ["Target: 20-30s women"],
                "action_items": ["Hire influencers"],
                "campaign_ideas": ["Unboxing challenge"]
            },
            "brand_context": "Eco-friendly brand"
        }
    )

    response = await meeting_agent.execute(request)

    assert isinstance(response, AgentResponse)
    assert response.agent == "meeting_ai"
    assert response.task == "meeting_to_brief"
    assert len(response.outputs) == 1
    assert response.outputs[0].type == "json"
    assert response.outputs[0].name == "campaign_brief"
    assert "brief_title" in response.outputs[0].value
    assert "objective" in response.outputs[0].value
    assert "key_messages" in response.outputs[0].value


@pytest.mark.asyncio
async def test_meeting_to_brief_with_brand_context(meeting_agent, mock_llm_gateway):
    """Brand context 포함한 meeting_to_brief 테스트"""
    mock_llm_response = Mock()
    mock_llm_response.output = LLMProviderOutput(
        type="json",
        value={
            "brief_title": "Brand-aligned Campaign",
            "objective": "Brand objective",
            "target_audience": "Brand target",
            "key_messages": ["Message 1"],
            "channels": ["Instagram"],
            "deliverables": ["Deliverable 1"]
        }
    )
    mock_llm_response.provider = "ollama"
    mock_llm_response.model = "qwen2.5:7b"
    mock_llm_response.usage = {"total_tokens": 1000}

    mock_llm_gateway.generate.return_value = mock_llm_response

    request = AgentRequest(
        task="meeting_to_brief",
        payload={
            "meeting_summary": {
                "summary": "Test meeting",
                "agenda": [],
                "decisions": [],
                "action_items": [],
                "campaign_ideas": []
            },
            "brand_context": "Premium beauty brand targeting Gen Z"
        }
    )

    response = await meeting_agent.execute(request)

    # LLM gateway가 brand_context를 받았는지 확인
    call_args = mock_llm_gateway.generate.call_args
    assert "brand_context" in call_args[1]["payload"]


# =============================================================================
# Integration-like Tests
# =============================================================================

@pytest.mark.asyncio
async def test_usage_and_meta_tracking(meeting_agent, mock_llm_gateway):
    """사용량 및 메타데이터 추적 테스트"""
    mock_llm_response = Mock()
    mock_llm_response.output = LLMProviderOutput(
        type="json",
        value={
            "summary": "Test",
            "agenda": [],
            "decisions": [],
            "action_items": [],
            "campaign_ideas": []
        }
    )
    mock_llm_response.provider = "anthropic"
    mock_llm_response.model = "claude-3-5-haiku-20241022"
    mock_llm_response.usage = {"total_tokens": 1234}

    mock_llm_gateway.generate.return_value = mock_llm_response

    request = AgentRequest(
        task="meeting_summary",
        payload={"transcript": "Short meeting"}
    )

    response = await meeting_agent.execute(request)

    # Usage tracking
    assert response.usage["llm_tokens"] == 1234
    assert response.usage["total_tokens"] == 1234
    assert "elapsed_seconds" in response.usage
    assert isinstance(response.usage["elapsed_seconds"], float)

    # Meta tracking
    assert response.meta["llm_provider"] == "anthropic"
    assert response.meta["llm_model"] == "claude-3-5-haiku-20241022"
    assert response.meta["task"] == "meeting_summary"


# =============================================================================
# Run Golden Set Tests with Real LLM (Optional, for manual testing)
# =============================================================================

@pytest.mark.skip(reason="Requires real LLM connection - for manual testing only")
@pytest.mark.asyncio
async def test_golden_set_with_real_llm(golden_set):
    """
    실제 LLM으로 Golden Set 테스트 (수동 실행용)

    실행 방법:
        pytest tests/test_meeting_ai_agent.py::test_golden_set_with_real_llm -v -s
    """
    from app.services.llm import get_llm_gateway

    agent = get_meeting_ai_agent(llm_gateway=get_llm_gateway())

    passed = 0
    failed = 0

    for test_case in golden_set["test_cases"]:
        print(f"\n{'='*60}")
        print(f"Testing: {test_case['name']}")
        print(f"{'='*60}")

        request = AgentRequest(
            task="meeting_summary",
            payload=test_case["input"]
        )

        try:
            response = await agent.execute(request)
            result = response.outputs[0].value

            print(f"\nResult:")
            print(json.dumps(result, ensure_ascii=False, indent=2))

            # Validate
            validation = test_case["validation_rules"]
            valid = (
                len(result["summary"]) >= validation["summary_min_length"]
                and validation["agenda_count"][0] <= len(result["agenda"]) <= validation["agenda_count"][1]
                and validation["decisions_count"][0] <= len(result["decisions"]) <= validation["decisions_count"][1]
                and validation["action_items_count"][0] <= len(result["action_items"]) <= validation["action_items_count"][1]
                and validation["campaign_ideas_count"][0] <= len(result["campaign_ideas"]) <= validation["campaign_ideas_count"][1]
            )

            if valid:
                print(f"✅ PASS: {test_case['name']}")
                passed += 1
            else:
                print(f"❌ FAIL: {test_case['name']}")
                failed += 1

        except Exception as e:
            print(f"❌ ERROR: {test_case['name']} - {str(e)}")
            failed += 1

    print(f"\n{'='*60}")
    print(f"Results: {passed} passed, {failed} failed")
    print(f"Pass Rate: {passed}/{passed+failed} ({100*passed/(passed+failed):.1f}%)")
    print(f"{'='*60}")

    # Pass if >= 70%
    assert passed / (passed + failed) >= 0.7, f"Golden Set pass rate too low: {100*passed/(passed+failed):.1f}%"
