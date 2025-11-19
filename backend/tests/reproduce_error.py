import asyncio
import sys
import os
import json

# Add backend directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.agents import get_editor_agent, AgentRequest

async def test_editor():
    print("Testing EditorAgent...")
    agent = get_editor_agent()
    
    request = AgentRequest(
        task="generate_commands",
        payload={
            "natural_language": "배경을 파란색 그라데이션으로 바꿔줘",
            "context": "test"
        }
    )
    
    try:
        response = await agent.execute(request)
        print("Success!")
        print(response)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_editor())
