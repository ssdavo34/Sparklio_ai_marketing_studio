import asyncio
import sys
import os

# Add backend directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.agents import get_editor_agent, get_meeting_ai_agent, AgentRequest
from app.core.config import settings

async def test_editor_agent():
    print("\n=== Testing EditorAgent (generate_commands) ===")
    agent = get_editor_agent()
    
    request = AgentRequest(
        task="generate_commands",
        payload={
            "natural_language": "배경을 파란색으로 바꿔줘",
            "context": "spark_chat"
        }
    )
    
    try:
        response = await agent.execute(request)
        print(f"Status: Success")
        print(f"Provider: {response.meta.get('llm_provider')}")
        print(f"Model: {response.meta.get('llm_model')}")
        
        for output in response.outputs:
            print(f"Output ({output.name}): {output.value}")
            
    except Exception as e:
        print(f"Error: {e}")

async def test_meeting_ai_agent():
    print("\n=== Testing MeetingAIAgent (analyze_transcript) ===")
    agent = get_meeting_ai_agent()
    
    mock_transcript = (
        "A: 이번 프로젝트 일정은 어떻게 되나요?\n"
        "B: 다음 주 월요일까지 기획안을 마감해야 합니다.\n"
        "A: 알겠습니다. 제가 디자인 팀과 협의하겠습니다."
    )
    
    request = AgentRequest(
        task="analyze_transcript",
        payload={
            "transcript": mock_transcript,
            "context": "weekly_sync"
        }
    )
    
    try:
        response = await agent.execute(request)
        print(f"Status: Success")
        print(f"Provider: {response.meta.get('llm_provider')}")
        print(f"Model: {response.meta.get('llm_model')}")
        
        for output in response.outputs:
            print(f"Output ({output.name}): {output.value}")
            
    except Exception as e:
        print(f"Error: {e}")

async def main():
    print(f"Current Generator Mode: {settings.generator_mode}")
    await test_editor_agent()
    await test_meeting_ai_agent()

if __name__ == "__main__":
    asyncio.run(main())
