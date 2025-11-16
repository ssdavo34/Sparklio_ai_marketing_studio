# 다음 세션 작업 가이드

**대상**: 다음 Claude 세션
**작성일**: 2025-11-16 23:05
**현재 진행률**: 45% (Phase 2-1 완료)

---

## 🎯 당신이 해야 할 일: Phase 2-2 (Agent API 엔드포인트)

---

## 📖 시작 전 필독 사항

### 1. 컨텍스트 파악
다음 문서를 **반드시** 먼저 읽으세요:
- ✅ `EOD_REPORT_2025-11-16_Phase2-1.md` (오늘 작업 내역)
- ✅ `EOD_REPORT_2025-11-16.md` (Phase 1-2~1-4 작업 내역)

### 2. 프로젝트 구조 이해
```
backend/
├── app/
│   ├── services/
│   │   ├── llm/          # LLM Gateway (Ollama/Mock)
│   │   ├── media/        # Media Gateway (ComfyUI/Mock)
│   │   └── agents/       # ⭐ 오늘 완성한 Agent들
│   └── api/v1/endpoints/
│       ├── llm_gateway.py
│       ├── media_gateway.py
│       └── agents_new.py  # 🔜 당신이 만들 파일
├── test_agents.py         # Agent 직접 호출 테스트 (완료)
└── test_agents_api.py     # 🔜 당신이 만들 API 테스트
```

---

## 🚀 Phase 2-2 작업 상세 가이드

### 목표
Agent들을 REST API로 노출하여 프론트엔드에서 호출 가능하게 만들기

### 예상 소요 시간: 2-3시간

---

## 📝 Step-by-Step 가이드

### Step 1: 환경 확인 (10분)

#### 1.1 Git 상태 확인
```bash
git log --oneline -5
git status
```

**기대 결과**: 최신 커밋이 "feat(agents): Phase 2-1 완료..." 여야 함

#### 1.2 서버 실행 확인
```bash
# 포트 8001에 서버가 실행 중인지 확인
netstat -ano | findstr :8001
```

**서버가 없으면 시작**:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

#### 1.3 기존 테스트 실행
```bash
python test_agents.py
```

**기대 결과**:
```
✅ All Agent classes imported successfully!
✅ Copywriter Agent - Product Detail 통과
✅ Designer Agent - Product Image 통과
✅ Strategist Agent - Brand Kit 통과
✅ Reviewer Agent - Content Review 통과
```

**만약 실패하면**: 이전 작업이 손상됨. 문제 해결 후 진행.

---

### Step 2: Agent API 엔드포인트 파일 생성 (30분)

#### 2.1 파일 생성
```bash
# 새 파일 생성 (또는 IDE에서 생성)
New-Item -Path "app\api\v1\endpoints\agents_new.py" -ItemType File
```

#### 2.2 기본 구조 작성
`app/api/v1/endpoints/agents_new.py` 파일에 다음 내용 작성:

```python
"""
Agent API Endpoints (v2)

Agent 실행 API

작성일: 2025-11-17
작성자: B팀 (Backend)
"""

from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel, Field
from typing import Literal, Dict, Any, Optional
import logging

from app.services.agents import (
    get_copywriter_agent,
    get_strategist_agent,
    get_designer_agent,
    get_reviewer_agent,
    get_optimizer_agent,
    get_editor_agent,
    AgentRequest,
    AgentResponse,
    AgentError
)

router = APIRouter()
logger = logging.getLogger(__name__)


# Agent Factory 매핑
AGENTS = {
    "copywriter": get_copywriter_agent,
    "strategist": get_strategist_agent,
    "designer": get_designer_agent,
    "reviewer": get_reviewer_agent,
    "optimizer": get_optimizer_agent,
    "editor": get_editor_agent
}


# Request/Response Models (API용)
class AgentExecuteRequest(BaseModel):
    """Agent 실행 요청 (API)"""
    task: str = Field(..., description="작업 유형", example="product_detail")
    payload: Dict[str, Any] = Field(..., description="입력 데이터")
    options: Optional[Dict[str, Any]] = Field(None, description="추가 옵션")

    class Config:
        json_schema_extra = {
            "example": {
                "task": "product_detail",
                "payload": {
                    "product_name": "무선 이어폰",
                    "features": ["노이즈캔슬링", "24시간 배터리"],
                    "target_audience": "2030 직장인"
                },
                "options": {
                    "tone": "professional",
                    "length": "medium"
                }
            }
        }


@router.post("/{agent_name}/execute", response_model=AgentResponse)
async def execute_agent(
    agent_name: Literal[
        "copywriter",
        "strategist",
        "designer",
        "reviewer",
        "optimizer",
        "editor"
    ] = Path(..., description="Agent 이름"),
    request: AgentExecuteRequest = ...
):
    """
    Agent 실행

    **사용 가능한 Agent**:
    - `copywriter`: 텍스트 콘텐츠 생성
    - `strategist`: 마케팅 전략 수립
    - `designer`: 비주얼 콘텐츠 생성
    - `reviewer`: 콘텐츠 품질 검토
    - `optimizer`: 콘텐츠 최적화
    - `editor`: 콘텐츠 편집/교정

    **공통 요청 형식**:
    ```json
    {
      "task": "작업_유형",
      "payload": {...},
      "options": {...}
    }
    ```

    Returns:
        AgentResponse: Agent 실행 결과
    """
    try:
        # Agent Factory 가져오기
        if agent_name not in AGENTS:
            raise HTTPException(
                status_code=404,
                detail=f"Agent '{agent_name}' not found"
            )

        agent_factory = AGENTS[agent_name]
        agent = agent_factory()

        logger.info(f"Executing {agent_name} agent with task: {request.task}")

        # AgentRequest 생성
        agent_request = AgentRequest(
            task=request.task,
            payload=request.payload,
            options=request.options
        )

        # Agent 실행
        response = await agent.execute(agent_request)

        logger.info(
            f"{agent_name} agent completed: "
            f"outputs={len(response.outputs)}, "
            f"elapsed={response.usage.get('elapsed_seconds', 0)}s"
        )

        return response

    except AgentError as e:
        logger.error(f"Agent error: {e.message}", exc_info=True)
        raise HTTPException(
            status_code=400,
            detail=f"Agent execution failed: {e.message}"
        )

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/list")
async def list_agents():
    """
    사용 가능한 Agent 목록 조회

    Returns:
        Agent 목록 및 설명
    """
    return {
        "agents": [
            {
                "name": "copywriter",
                "description": "텍스트 콘텐츠 생성 (제품 설명, SNS, 광고 카피 등)",
                "tasks": ["product_detail", "sns", "brand_message", "headline", "ad_copy"]
            },
            {
                "name": "strategist",
                "description": "마케팅 전략 수립 (브랜드 전략, 캠페인 기획 등)",
                "tasks": ["brand_kit", "campaign", "target_analysis", "positioning", "content_strategy"]
            },
            {
                "name": "designer",
                "description": "비주얼 콘텐츠 생성 (제품 이미지, 로고, 썸네일 등)",
                "tasks": ["product_image", "brand_logo", "sns_thumbnail", "ad_banner", "illustration"]
            },
            {
                "name": "reviewer",
                "description": "콘텐츠 품질 검토 (품질 평가, 피드백 제공)",
                "tasks": ["content_review", "copy_review", "brand_consistency", "grammar_check", "effectiveness_analysis"]
            },
            {
                "name": "optimizer",
                "description": "콘텐츠 최적화 (SEO, 전환율, 가독성 개선)",
                "tasks": ["seo_optimize", "conversion_optimize", "readability_improve", "length_adjust", "tone_adjust"]
            },
            {
                "name": "editor",
                "description": "콘텐츠 편집/교정 (교정, 재작성, 요약, 번역)",
                "tasks": ["proofread", "rewrite", "summarize", "expand", "translate"]
            }
        ]
    }


@router.get("/{agent_name}/info")
async def get_agent_info(
    agent_name: Literal[
        "copywriter",
        "strategist",
        "designer",
        "reviewer",
        "optimizer",
        "editor"
    ] = Path(..., description="Agent 이름")
):
    """
    특정 Agent 정보 조회

    Args:
        agent_name: Agent 이름

    Returns:
        Agent 상세 정보
    """
    # 간단히 list에서 찾아서 반환
    agents_list = await list_agents()

    for agent_info in agents_list["agents"]:
        if agent_info["name"] == agent_name:
            return agent_info

    raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found")
```

---

### Step 3: 라우터 등록 (10분)

#### 3.1 `app/api/v1/router.py` 수정

파일 상단 import 섹션에 추가:
```python
from app.api.v1.endpoints import ..., agents_new  # agents_new 추가
```

라우터 등록 섹션에 추가:
```python
# Agent API v2 (신규 - Phase 2-2)
api_router.include_router(
    agents_new.router,
    prefix="/agents",
    tags=["agents-v2"]
)
```

**⚠️ 주의**: 기존 `agents.router`는 그대로 유지 (deprecated이지만 호환성 유지)

#### 3.2 서버 재시작 확인
`--reload` 모드면 자동 재시작됨. 로그 확인:
```
INFO:     Will watch for changes in these directories: [...]
INFO:     Application startup complete.
```

---

### Step 4: API 테스트 파일 작성 (30분)

#### 4.1 `test_agents_api.py` 파일 생성
루트 디렉토리에 파일 생성:

```python
"""
Agent API 테스트

2025-11-17
"""
import httpx
import asyncio
import json


BASE_URL = "http://localhost:8001/api/v1/agents"


async def test_list_agents():
    """Agent 목록 조회 테스트"""
    print("=" * 60)
    print("Test 1: List All Agents")
    print("=" * 60)

    url = f"{BASE_URL}/list"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()

            result = response.json()

            print(f"\n✅ Status: {response.status_code}")
            print(f"Total Agents: {len(result['agents'])}\n")

            for agent in result['agents']:
                print(f"  - {agent['name']}: {agent['description']}")
                print(f"    Tasks: {', '.join(agent['tasks'])}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_copywriter_api():
    """Copywriter Agent API 테스트"""
    print("\n" + "=" * 60)
    print("Test 2: Copywriter Agent - Product Detail")
    print("=" * 60)

    url = f"{BASE_URL}/copywriter/execute"
    data = {
        "task": "product_detail",
        "payload": {
            "product_name": "프리미엄 무선 이어폰",
            "features": ["프리미엄 노이즈캔슬링", "24시간 배터리", "IPX7 방수"],
            "target_audience": "2030 직장인"
        },
        "options": {
            "tone": "professional",
            "length": "medium"
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data)
            response.raise_for_status()

            result = response.json()

            print(f"\n✅ Status: {response.status_code}")
            print(f"Agent: {result['agent']}")
            print(f"Task: {result['task']}")
            print(f"Outputs: {len(result['outputs'])}\n")

            for output in result['outputs']:
                print(f"  Output Name: {output['name']}")
                print(f"  Type: {output['type']}")

                if output['type'] == 'json':
                    print(f"  Value: {json.dumps(output['value'], ensure_ascii=False, indent=2)[:300]}...")

            print(f"\nUsage: {result['usage']}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_designer_api():
    """Designer Agent API 테스트"""
    print("\n" + "=" * 60)
    print("Test 3: Designer Agent - Product Image")
    print("=" * 60)

    url = f"{BASE_URL}/designer/execute"
    data = {
        "task": "product_image",
        "payload": {
            "product_name": "무선 이어폰",
            "description": "프리미엄 노이즈캔슬링",
            "style": "minimal"
        },
        "options": {
            "width": 1024,
            "height": 1024,
            "enhance_prompt": False
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data)
            response.raise_for_status()

            result = response.json()

            print(f"\n✅ Status: {response.status_code}")
            print(f"Agent: {result['agent']}")
            print(f"Task: {result['task']}")
            print(f"Outputs: {len(result['outputs'])}\n")

            for output in result['outputs']:
                print(f"  Output Name: {output['name']}")
                print(f"  Type: {output['type']}")
                print(f"  Format: {output['meta'].get('format')}")
                print(f"  Size: {output['meta'].get('width')}x{output['meta'].get('height')}")
                print(f"  Data (first 50 chars): {output['value'][:50]}...")

            print(f"\nUsage: {result['usage']}")
            print(f"Prompt: {result['meta'].get('prompt', '')[:100]}...")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_strategist_api():
    """Strategist Agent API 테스트"""
    print("\n" + "=" * 60)
    print("Test 4: Strategist Agent - Brand Kit")
    print("=" * 60)

    url = f"{BASE_URL}/strategist/execute"
    data = {
        "task": "brand_kit",
        "payload": {
            "brand_name": "EcoTech",
            "industry": "친환경 기술",
            "target_market": "환경의식 높은 MZ세대"
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data)
            response.raise_for_status()

            result = response.json()

            print(f"\n✅ Status: {response.status_code}")
            print(f"Agent: {result['agent']}")
            print(f"Outputs: {len(result['outputs'])}\n")

            print(f"Usage: {result['usage']}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_reviewer_api():
    """Reviewer Agent API 테스트"""
    print("\n" + "=" * 60)
    print("Test 5: Reviewer Agent - Content Review")
    print("=" * 60)

    url = f"{BASE_URL}/reviewer/execute"
    data = {
        "task": "content_review",
        "payload": {
            "content": {
                "headline": "완벽한 소음 차단의 시작",
                "body": "프리미엄 노이즈캔슬링 기술로 당신만의 조용한 공간을 만들어보세요."
            },
            "criteria": ["quality", "brand_fit", "effectiveness"]
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data)
            response.raise_for_status()

            result = response.json()

            print(f"\n✅ Status: {response.status_code}")
            print(f"Agent: {result['agent']}")
            print(f"Usage: {result['usage']}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def test_agent_info():
    """특정 Agent 정보 조회 테스트"""
    print("\n" + "=" * 60)
    print("Test 6: Agent Info - Copywriter")
    print("=" * 60)

    url = f"{BASE_URL}/copywriter/info"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()

            result = response.json()

            print(f"\n✅ Status: {response.status_code}")
            print(f"Name: {result['name']}")
            print(f"Description: {result['description']}")
            print(f"Tasks: {', '.join(result['tasks'])}")

    except Exception as e:
        print(f"❌ Error: {e}")


async def main():
    """메인 테스트 실행"""
    print("\n🚀 Agent API 통합 테스트 시작\n")

    # Test 1: List Agents
    await test_list_agents()

    # Test 2: Copywriter
    await test_copywriter_api()

    # Test 3: Designer
    await test_designer_api()

    # Test 4: Strategist
    await test_strategist_api()

    # Test 5: Reviewer
    await test_reviewer_api()

    # Test 6: Agent Info
    await test_agent_info()

    print("\n" + "=" * 60)
    print("✅ 모든 Agent API 테스트 완료")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
```

#### 4.2 테스트 실행
```bash
python test_agents_api.py
```

**기대 결과**:
```
✅ Test 1: List All Agents - 통과
✅ Test 2: Copywriter Agent - 통과
✅ Test 3: Designer Agent - 통과
✅ Test 4: Strategist Agent - 통과
✅ Test 5: Reviewer Agent - 통과
✅ Test 6: Agent Info - 통과
```

---

### Step 5: Swagger UI 확인 (10분)

브라우저에서 접속:
```
http://localhost:8001/docs
```

**확인 사항**:
1. "agents-v2" 태그 섹션 존재
2. 다음 엔드포인트들 확인:
   - `GET /api/v1/agents/list`
   - `POST /api/v1/agents/{agent_name}/execute`
   - `GET /api/v1/agents/{agent_name}/info`

**Swagger에서 테스트**:
1. `POST /api/v1/agents/copywriter/execute` 클릭
2. "Try it out" 클릭
3. 예시 데이터 입력 후 "Execute"
4. 200 응답 및 결과 확인

---

### Step 6: Git 커밋 (10분)

#### 6.1 변경사항 확인
```bash
git status
```

**기대 결과**:
```
modified:   app/api/v1/router.py
new file:   app/api/v1/endpoints/agents_new.py
new file:   test_agents_api.py
```

#### 6.2 커밋
```bash
git add app/api/v1/router.py
git add app/api/v1/endpoints/agents_new.py
git add test_agents_api.py

git commit -m "feat(api): Phase 2-2 완료 - Agent API 엔드포인트 구현

- Agent 실행 API: POST /api/v1/agents/{agent_name}/execute
- Agent 목록 조회: GET /api/v1/agents/list
- Agent 정보 조회: GET /api/v1/agents/{agent_name}/info
- 6개 Agent 모두 REST API로 노출
- API 테스트 모두 통과

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## ✅ 완료 체크리스트

작업 완료 전에 다음을 확인하세요:

- [ ] `app/api/v1/endpoints/agents_new.py` 파일 생성 완료
- [ ] `app/api/v1/router.py` 라우터 등록 완료
- [ ] `test_agents_api.py` 테스트 파일 생성 완료
- [ ] 모든 API 테스트 통과 (6/6)
- [ ] Swagger UI에서 엔드포인트 확인 완료
- [ ] Git 커밋 완료
- [ ] EOD 보고서 작성 완료

---

## 🔥 문제 해결 가이드

### 문제 1: Import 에러
```
ImportError: cannot import name 'agents_new' from 'app.api.v1.endpoints'
```

**해결**:
1. `app/api/v1/endpoints/__init__.py` 파일 확인
2. 파일이 없으면 생성
3. 내용: `# Auto-discovery enabled`

### 문제 2: 서버 재시작 안됨
**해결**:
```bash
# 기존 프로세스 종료
taskkill /F /IM python.exe

# 서버 재시작
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### 문제 3: 404 Not Found
**원인**: 라우터 등록 누락

**해결**:
`app/api/v1/router.py`에서 `agents_new.router` 등록 확인

---

## 📊 작업 완료 후 보고서 작성

다음 파일을 생성하세요:
```
EOD_REPORT_2025-11-17_Phase2-2.md
```

**포함 내용**:
1. Phase 2-2 완료 상황
2. 생성/수정된 파일 목록
3. API 엔드포인트 목록
4. 테스트 결과
5. 다음 작업 (Phase 2-3: Agent 오케스트레이션)

---

## 🎯 다음 다음 세션 예고: Phase 2-3

Phase 2-2 완료 후 다음 작업:
- **Phase 2-3**: Agent 오케스트레이션
- 여러 Agent를 조합한 워크플로우
- 예: Copywriter → Reviewer → Optimizer

---

**화이팅! 🚀**

---

**문서 버전**: v1.0
**최종 업데이트**: 2025-11-16 23:05
