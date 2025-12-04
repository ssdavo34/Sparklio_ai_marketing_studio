"""Quick test for Meeting AI Agent"""
import asyncio
from app.services.agents.meeting_ai import get_meeting_ai_agent
from app.services.agents.base import AgentRequest

async def test():
    agent = get_meeting_ai_agent()
    request = AgentRequest(
        task='meeting_summary',
        payload={
            'transcript': '''
            A: 안녕하세요. 오늘 마케팅 회의를 시작하겠습니다.
            B: 네, 먼저 신제품 런칭 일정에 대해 이야기하죠.
            A: 네, 다음 달 15일로 확정되었습니다.
            B: 좋아요. SNS 캠페인은 언제 시작하나요?
            A: 런칭 1주일 전인 8일부터 시작합니다.
            B: 알겠습니다. 인플루언서 협업도 진행하기로 했죠?
            A: 네, 3명의 인플루언서와 계약을 진행 중입니다.
            B: 예산은 얼마로 책정되었나요?
            A: 총 500만원으로 책정했습니다.
            B: 좋습니다. 그럼 오늘 회의는 여기까지 하죠.
            ''',
            'meeting_title': '마케팅 회의',
            'meeting_date': '2025-12-04'
        }
    )

    print("Executing Meeting AI Agent...")
    response = await agent.execute(request)
    print('=' * 50)
    print('Agent Response:')
    print(f'Outputs count: {len(response.outputs)}')
    for i, output in enumerate(response.outputs):
        print(f'\nOutput {i}:')
        print(f'  type: {output.type}')
        print(f'  name: {output.name}')
        print(f'  value: {output.value}')
    print('=' * 50)

if __name__ == "__main__":
    asyncio.run(test())
