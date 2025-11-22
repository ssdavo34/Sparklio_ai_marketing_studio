"""
Agent execute() 메서드를 새로운 AgentResponse 형식으로 일괄 수정하는 스크립트
"""
import re

AGENT_FILES = [
    "app/services/agents/rag.py",
    "app/services/agents/ingestor.py",
    "app/services/agents/performance_analyzer.py",
    "app/services/agents/self_learning.py",
]

def fix_agent_response(file_path):
    """Agent 파일의 AgentResponse를 수정"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Import AgentOutput 추가 (execute 메서드 시작 부분에)
    if "from app.services.agents.base import AgentOutput" not in content:
        content = re.sub(
            r'(async def execute\(self, request: AgentRequest\) -> AgentResponse:\s+""".*?""")',
            r'\1\n        from app.services.agents.base import AgentOutput',
            content,
            flags=re.DOTALL
        )

    # 2. Success 응답 수정
    # Pattern: return AgentResponse(agent_id=self.agent_id, status="success", result=result, metadata={...})
    success_pattern = r'return AgentResponse\(\s*agent_id=self\.agent_id,\s*status="success",\s*result=(\w+),\s*metadata=(\{[^}]+\})\s*\)'

    def success_replacement(match):
        result_var = match.group(1)
        metadata_dict = match.group(2)
        return f'''return AgentResponse(
                agent=self.name,
                task=task.value if hasattr(task, 'value') else task,
                outputs=[AgentOutput(type="json", value={result_var})],
                usage={{}},
                meta={metadata_dict}
            )'''

    content = re.sub(success_pattern, success_replacement, content, flags=re.DOTALL)

    # 3. Error 응답 수정 (ValidationError)
    validation_error_pattern = r'return AgentResponse\(\s*agent_id=self\.agent_id,\s*status="error",\s*error=f"입력 데이터 검증 실패: \{str\(e\)\}"\s*\)'

    validation_error_replacement = '''return AgentResponse(
                agent=self.name,
                task=request.task,
                outputs=[AgentOutput(
                    type="error",
                    value={"error": f"입력 데이터 검증 실패: {str(e)}"}
                )],
                usage={},
                meta={}
            )'''

    content = re.sub(validation_error_pattern, validation_error_replacement, content)

    # 4. Error 응답 수정 (General Exception)
    general_error_pattern = r'return AgentResponse\(\s*agent_id=self\.agent_id,\s*status="error",\s*error=str\(e\)\s*\)'

    general_error_replacement = '''return AgentResponse(
                agent=self.name,
                task=request.task,
                outputs=[AgentOutput(
                    type="error",
                    value={"error": str(e)}
                )],
                usage={},
                meta={}
            )'''

    content = re.sub(general_error_pattern, general_error_replacement, content)

    # 파일 저장
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ Fixed: {file_path}")

if __name__ == "__main__":
    for agent_file in AGENT_FILES:
        try:
            fix_agent_response(agent_file)
        except Exception as e:
            print(f"❌ Error fixing {agent_file}: {e}")
