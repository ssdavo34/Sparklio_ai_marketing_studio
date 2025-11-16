---
doc_id: WORK-ORDER-001
title: 익일 작업 지시서 (2025-11-17 월요일)
created: 2025-11-16
updated: 2025-11-16 23:50
status: active
priority: P0
target_date: 2025-11-17
---

# 📋 익일 작업 지시서
## 2025년 11월 17일 (월요일)

**작성 시각**: 2025-11-16 (일) 23:50
**작성자**: A팀 종합 (QA & Testing)
**대상**: 다음 세션 Claude (A/B/C팀 역할 수행)

---

## 🚨 다음 Claude에게 - 반드시 읽으세요!

### 세션 시작 전 필수 작업 (30분)

1. **필수 문서 읽기** (순서대로!)
   ```
   1순위: docs/reports/TEAM_ALL_EOD_REPORT_2025-11-16.md
          → 전체 프로젝트 현황, 완료된 작업, 남은 작업 파악

   2순위: docs/CANVAS_STUDIO_EOD_2025-11-16.md (1138줄)
          → Canvas Studio 버그 4개 상세 분석 및 해결 방법

   3순위: backend/NEXT_SESSION_GUIDE.md
          → Agent API 구현 Step-by-Step 가이드

   4순위: backend/EOD_REPORT_2025-11-16_Phase2-1.md
          → Agent 구현 상세 (6개 Agent 아키텍처)

   5순위: docs/reports/2025-11-16_HANDOFF_NOTES.md (업데이트 예정)
          → 빠른 시작 가이드
   ```

2. **인프라 점검**
   ```bash
   # Desktop Ollama 확인
   curl http://100.120.180.42:11434/api/tags

   # Desktop ComfyUI 확인 (필요 시 실행)
   curl -I http://100.120.180.42:8188
   # 만약 실패 시: D:\AI\ComfyUI\run_nvidia_gpu.bat 실행

   # Backend 서버 확인
   curl http://localhost:8001/health

   # 환경 변수 확인
   cd backend && cat .env | grep GENERATOR_MODE
   # GENERATOR_MODE=live 확인
   ```

3. **Git 상태 확인**
   ```bash
   git log --oneline -10
   git status
   ```

4. **기존 작업 테스트**
   ```bash
   cd backend
   python test_agents.py              # Agent 테스트
   python test_media_gateway.py       # Media Gateway 테스트
   python test_llm_gateway_correct.py # LLM Gateway 테스트
   ```

---

## 🎯 오늘의 작업 (우선순위 순)

### 전체 공정율: 58% → 목표 65%

```
✅ 완료: Backend Phase 1-4, Phase 2-1, Frontend Phase 1-4
⏳ 진행 중: Frontend Phase 5 (70%), Backend Phase 2-2 (0%)
⏸️  대기: Backend Phase 2-3~4, Frontend Phase 6
```

---

## 🔴 최우선 작업 (09:00-12:00, 3시간)

### C팀: Canvas Studio 버그 4개 수정

**목표**: Phase 5 UX 개선 70% → 100% 완료

#### 버그 수정 순서 (우선순위 순)

##### 1. 버그 #1: 하단 잘림 (30분) ⭐⭐⭐
**파일**: `frontend/components/canvas-studio/layout/CanvasViewport.tsx`

**문제**:
```tsx
// ❌ 현재 코드 (잘못됨)
<section className="... flex items-center justify-center">
```
- `items-center`가 뷰포트를 수직 중앙 정렬 → 하단이 잘림

**해결**:
```tsx
// ✅ 수정 코드
<section className="... flex justify-center">
  {/* items-center 제거! */}
</section>
```

**검증**:
- 캔버스 확대 시 스크롤 바가 하단까지 보임
- 객체가 하단에 있어도 스크롤로 접근 가능

---

##### 2. 버그 #3: Pan (손 도구) 작동 안 함 (1시간) ⭐⭐
**파일**: `frontend/hooks/useCanvasEngine.ts`

**문제**:
```typescript
// ❌ 현재 코드 (잘못됨)
if (canvas) {
  const vpt = canvas.viewportTransform;
  vpt[4] += deltaX;
  vpt[5] += deltaY;
  canvas.requestRenderAll();
}
```
- CSS `transform: scale()`을 사용하는 상태에서 Fabric.js `viewportTransform` 조작은 효과 없음!
- 두 좌표계를 섞으면 안 됨!

**해결**:
```typescript
// ✅ 수정 코드
const section = sectionRef.current;
if (section && isPanning) {
  // CSS scroll 직접 조작
  section.scrollLeft -= deltaX;
  section.scrollTop -= deltaY;
}
```

**추가 작업**:
```typescript
// useCanvasEngine.ts에 sectionRef 추가
interface UseCanvasEngineProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  sectionRef: React.RefObject<HTMLElement>; // 추가!
}

// page.tsx에서 sectionRef 전달
const sectionRef = useRef<HTMLElement>(null);
const { /* ... */ } = useCanvasEngine({
  canvasRef,
  sectionRef, // 추가!
});

// CanvasViewport.tsx에서 ref 전달
<section ref={sectionRef}>
```

**검증**:
- 스페이스바 + 드래그 시 캔버스가 실제로 이동
- 손 모양 커서 표시
- 스크롤 바 위치 변경 확인

---

##### 3. 버그 #2: 컨트롤이 스크롤 시 벗어남 (30분) ⭐⭐
**파일**: `frontend/components/canvas-studio/layout/CanvasViewport.tsx`

**문제**:
- 컨트롤(`TopToolbar` 등)이 `<section>` 내부에 있어서 스크롤 시 함께 움직임

**해결 방법 1** (Sticky 사용):
```tsx
<div className="relative">
  {/* 컨트롤을 sticky로 */}
  <div className="sticky top-0 left-0 z-50 bg-white">
    <TopToolbar />
  </div>

  <section className="overflow-auto" ref={sectionRef}>
    <div style={{ transform: `scale(${zoom})` }}>
      <canvas ref={canvasRef} />
    </div>
  </section>
</div>
```

**해결 방법 2** (Fixed 사용):
```tsx
{/* 컨트롤을 section 외부로 이동 */}
<div className="relative">
  <div className="fixed top-0 left-0 z-50 bg-white">
    <TopToolbar />
  </div>

  <section className="overflow-auto mt-12" ref={sectionRef}>
    {/* ... */}
  </section>
</div>
```

**검증**:
- 스크롤해도 컨트롤이 화면 상단에 고정
- 컨트롤 클릭 가능

---

##### 4. 버그 #4: ZoomToFit 후 중앙 정렬 안 됨 (20분) ⭐
**파일**: `frontend/store/useCanvasStore.ts`

**문제**:
- ZoomToFit 후 스크롤 위치가 (0, 0)에 있어서 중앙 정렬이 안 됨

**해결**:
```typescript
// zoomToFit() 함수 수정
zoomToFit: (canvas, sectionRef) => { // sectionRef 추가!
  if (!canvas) return;

  const objects = canvas.getObjects();
  if (objects.length === 0) {
    set({ zoom: 1 });
    if (sectionRef.current) {
      sectionRef.current.scrollLeft = 0;
      sectionRef.current.scrollTop = 0;
    }
    return;
  }

  // Bounding Box 계산 (기존 코드)
  const { minX, minY, maxX, maxY } = /* ... */;
  const bbox = { /* ... */ };
  const padding = 0.1;

  // Zoom 계산 (기존 코드)
  const scaleX = containerWidth / (bbox.width * (1 + padding * 2));
  const scaleY = containerHeight / (bbox.height * (1 + padding * 2));
  const newZoom = Math.min(scaleX, scaleY, 2);

  set({ zoom: newZoom });

  // ✅ 추가: 스크롤 위치 중앙 정렬
  if (sectionRef.current) {
    const scaledWidth = canvas.width * newZoom;
    const scaledHeight = canvas.height * newZoom;

    sectionRef.current.scrollLeft = (scaledWidth - containerWidth) / 2;
    sectionRef.current.scrollTop = (scaledHeight - containerHeight) / 2;
  }
}
```

**검증**:
- ZoomToFit 클릭 시 모든 객체가 화면 중앙에 보임
- 스크롤 위치가 중앙으로 조정됨

---

##### 5. 통합 테스트 (30분)
**체크리스트**:
- [ ] 캔버스 확대/축소 (마우스 휠)
- [ ] ZoomToFit 버튼 클릭
- [ ] Pan (스페이스바 + 드래그)
- [ ] 객체 드래그
- [ ] 객체 선택
- [ ] 컨트롤 클릭
- [ ] 스크롤 (모든 방향)
- [ ] 하단 영역 접근 가능

**완료 시**:
- Canvas Studio Phase 5: 70% → 100% ✅
- Frontend 전체: 85% → 92%
- Git 커밋:
  ```bash
  git add .
  git commit -m "fix(canvas): Canvas Studio Phase 5 버그 4개 수정 완료

  - 하단 잘림 버그 수정 (items-center 제거)
  - Pan 기능 정상 작동 (CSS scroll 사용)
  - 컨트롤 위치 고정 (sticky/fixed)
  - ZoomToFit 후 중앙 정렬

  Phase 5 UX 개선 100% 완료"
  ```

---

## 🟡 우선순위 2 작업 (13:00-16:00, 2-3시간)

### B팀: Phase 2-2 Agent API 엔드포인트 구현

**목표**: Backend Phase 2-2 0% → 100% 완료

**작업 내용**:

#### 1. API 엔드포인트 파일 생성 (1.5시간)
**파일**: `backend/app/api/v1/endpoints/agents_new.py`

```python
"""
Agent API Endpoints

Agent 실행 및 관리 API
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

from app.services.agents import (
    CopywriterAgent,
    StrategistAgent,
    DesignerAgent,
    ReviewerAgent,
    OptimizerAgent,
    EditorAgent,
    AgentRequest,
    AgentResponse
)

router = APIRouter(prefix="/agents", tags=["Agents"])

# Agent Registry
AGENTS = {
    "copywriter": CopywriterAgent(),
    "strategist": StrategistAgent(),
    "designer": DesignerAgent(),
    "reviewer": ReviewerAgent(),
    "optimizer": OptimizerAgent(),
    "editor": EditorAgent(),
}


class AgentExecuteRequest(BaseModel):
    """Agent 실행 요청"""
    task: str = Field(..., description="작업 유형")
    payload: Dict[str, Any] = Field(..., description="입력 데이터")
    options: Optional[Dict[str, Any]] = Field(None, description="추가 옵션")


@router.post("/{agent_name}/execute", response_model=AgentResponse)
async def execute_agent(
    agent_name: str,
    request: AgentExecuteRequest
):
    """
    Agent 실행

    **지원 Agent**:
    - `copywriter`: 카피라이팅
    - `strategist`: 전략 수립
    - `designer`: 이미지 생성
    - `reviewer`: 콘텐츠 검토
    - `optimizer`: 콘텐츠 최적화
    - `editor`: 편집/교정
    """
    if agent_name not in AGENTS:
        raise HTTPException(
            status_code=404,
            detail=f"Agent '{agent_name}' not found. Available: {list(AGENTS.keys())}"
        )

    agent = AGENTS[agent_name]

    agent_request = AgentRequest(
        task=request.task,
        payload=request.payload,
        options=request.options or {}
    )

    try:
        response = await agent.execute(agent_request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Agent execution failed: {str(e)}"
        )


@router.get("/list")
async def list_agents():
    """Agent 목록 조회"""
    return {
        "agents": [
            {
                "name": name,
                "role": agent.role,
                "tasks": agent.get_supported_tasks() if hasattr(agent, 'get_supported_tasks') else []
            }
            for name, agent in AGENTS.items()
        ]
    }


@router.get("/{agent_name}/info")
async def get_agent_info(agent_name: str):
    """Agent 정보 조회"""
    if agent_name not in AGENTS:
        raise HTTPException(
            status_code=404,
            detail=f"Agent '{agent_name}' not found"
        )

    agent = AGENTS[agent_name]

    return {
        "name": agent_name,
        "role": agent.role,
        "tasks": agent.get_supported_tasks() if hasattr(agent, 'get_supported_tasks') else [],
        "description": agent.__doc__ or ""
    }
```

#### 2. 라우터 등록 (10분)
**파일**: `backend/app/api/v1/router.py` (수정)

```python
from app.api.v1.endpoints import agents_new

# 라우터 등록
app.include_router(agents_new.router, prefix="/api/v1")
```

#### 3. API 테스트 파일 생성 (40분)
**파일**: `backend/test_agents_api.py`

```python
"""
Agent API 테스트
"""
import httpx
import asyncio
import json


async def test_list_agents():
    """Agent 목록 조회"""
    print("=" * 60)
    print("Test 1: List Agents")
    print("=" * 60)

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get("http://localhost:8001/api/v1/agents/list")
        result = response.json()

        print(f"✅ Status: {response.status_code}")
        print(f"Agents: {len(result['agents'])}")
        for agent in result['agents']:
            print(f"  - {agent['name']}: {agent['role']}")


async def test_copywriter_execute():
    """Copywriter Agent 실행"""
    print("\n" + "=" * 60)
    print("Test 2: Copywriter Agent Execute")
    print("=" * 60)

    data = {
        "task": "product_detail",
        "payload": {
            "product_name": "프리미엄 무선 이어폰",
            "features": ["노이즈 캔슬링", "24시간 배터리"],
            "target_audience": "2030 세대"
        }
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "http://localhost:8001/api/v1/agents/copywriter/execute",
            json=data
        )
        result = response.json()

        print(f"✅ Status: {response.status_code}")
        print(f"Agent: {result['agent']}")
        print(f"Task: {result['task']}")
        print(f"Outputs: {len(result['outputs'])}")
        print(f"Usage: {result['usage']}")


async def test_designer_execute():
    """Designer Agent 실행"""
    print("\n" + "=" * 60)
    print("Test 3: Designer Agent Execute")
    print("=" * 60)

    data = {
        "task": "product_image",
        "payload": {
            "product_name": "무선 이어폰",
            "concept": "프리미엄, 미니멀"
        },
        "options": {
            "enhance_prompt": True
        }
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "http://localhost:8001/api/v1/agents/designer/execute",
            json=data
        )
        result = response.json()

        print(f"✅ Status: {response.status_code}")
        print(f"Agent: {result['agent']}")
        print(f"Outputs: {len(result['outputs'])}")
        print(f"Output Type: {result['outputs'][0]['type']}")


async def main():
    print("\n🚀 Agent API 테스트 시작\n")

    await test_list_agents()
    await test_copywriter_execute()
    await test_designer_execute()

    print("\n" + "=" * 60)
    print("✅ 모든 테스트 완료")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
```

#### 4. 테스트 실행 및 검증 (20분)
```bash
cd backend
python test_agents_api.py
```

**검증 체크리스트**:
- [ ] GET /api/v1/agents/list → 6개 Agent 목록
- [ ] POST /api/v1/agents/copywriter/execute → JSON 응답
- [ ] POST /api/v1/agents/designer/execute → 이미지 Base64
- [ ] GET /api/v1/agents/copywriter/info → Agent 정보

**완료 시**:
- Backend Phase 2-2: 0% → 100% ✅
- Backend 전체: 50% → 60%
- Git 커밋:
  ```bash
  git add .
  git commit -m "feat(agents): Phase 2-2 Agent API 엔드포인트 구현 완료

  - POST /api/v1/agents/{agent_name}/execute
  - GET /api/v1/agents/list
  - GET /api/v1/agents/{agent_name}/info

  6개 Agent 모두 REST API로 접근 가능"
  ```

---

## 🟢 우선순위 3 작업 (16:00-17:00, 1시간)

### A팀: 검증 및 테스트

#### 1. Canvas Studio 버그 재테스트 (30분)
**체크리스트** (C팀 수정 검증):
- [ ] 하단 잘림 버그 수정 확인
- [ ] Pan 기능 작동 확인
- [ ] 컨트롤 위치 고정 확인
- [ ] ZoomToFit 중앙 정렬 확인
- [ ] 전체 통합 테스트

**문서 작성**:
- `docs/reports/A_TEAM_CANVAS_VERIFICATION_2025-11-17.md`

#### 2. Agent API 검증 (30분)
```bash
# Postman 또는 curl로 테스트
curl -X GET http://localhost:8001/api/v1/agents/list

curl -X POST http://localhost:8001/api/v1/agents/copywriter/execute \
  -H "Content-Type: application/json" \
  -d '{"task":"product_detail","payload":{"product_name":"Test"}}'
```

**문서 작성**:
- `docs/reports/A_TEAM_AGENT_API_VERIFICATION_2025-11-17.md`

---

## 📝 마무리 작업 (17:00-18:00, 1시간)

### 1. EOD 보고서 작성 (30분)
- `docs/reports/TEAM_ALL_EOD_REPORT_2025-11-17.md`
- 오늘 완료 작업 정리
- 프로젝트 전체 공정율 업데이트 (58% → 65%)
- 내일 작업 계획

### 2. Git 커밋 & 푸시 (20분)
```bash
# 모든 변경사항 확인
git status

# 스테이징
git add .

# 커밋
git commit -m "docs: EOD Report 2025-11-17 - Canvas 버그 수정 및 Agent API 완료

- Canvas Studio Phase 5 완료 (버그 4개 수정)
- Agent API 엔드포인트 구현 (Phase 2-2)
- 검증 및 테스트 완료

전체 공정율: 58% → 65%"

# 푸시
git push origin master
```

### 3. 핸드오프 노트 업데이트 (10분)
- `docs/reports/2025-11-17_HANDOFF_NOTES.md` 작성
- 다음 세션(2025-11-18) 빠른 시작 가이드

---

## ⚠️ 주의사항

### ❌ 하지 말아야 할 것
1. **문서 읽지 않고 작업 시작 ❌**
2. **Git Pull ❌** (SSD가 원본)
3. **Fabric.js zoom 사용 ❌** (CSS transform scale 사용)
4. **Fabric.js viewportTransform 사용 ❌** (CSS scroll 사용)
5. **환경 변수 임의 변경 ❌**

### ✅ 반드시 해야 할 것
1. **본 문서 먼저 읽기 ✅**
2. **Canvas Studio EOD 문서 읽기 ✅** (버그 해결 방법 상세)
3. **인프라 점검 먼저 ✅**
4. **테스트 먼저 실행 ✅**
5. **C팀 작업부터 시작 ✅** (최우선!)

---

## 📊 예상 결과

### 오늘 완료 시
- **Frontend Phase 5**: 70% → 100% ✅
- **Backend Phase 2-2**: 0% → 100% ✅
- **전체 공정율**: 58% → 65%
- **커밋**: 3개 (Canvas 버그 수정 + Agent API + EOD)

### 남은 작업 (Phase별)
```
⏳ Backend Phase 2-3: Agent 오케스트레이션 (예상 3-4시간)
⏸️  Backend Phase 3-1: E2E 테스트 (예상 4-5시간)
⏸️  Backend Phase 3-2: 성능 최적화 (예상 3-4시간)
⏸️  Backend Phase 4: 프로덕션 배포 (예상 6-8시간)
⏸️  Frontend Phase 6: 백엔드 연동 (예상 5-6시간)
```

**총 남은 작업 시간**: 약 21-27시간
**예상 완료일**: 2025-11-22 (금요일)

---

## 🎯 성공 기준

### 오늘 작업 성공 시
- [ ] Canvas Studio 버그 4개 모두 수정
- [ ] Agent API 3개 엔드포인트 모두 정상 작동
- [ ] 모든 테스트 통과 (100%)
- [ ] EOD 보고서 작성 완료
- [ ] Git 커밋 & 푸시 완료

---

**작성 완료**: 2025-11-16 (일) 23:50
**다음 세션**: 2025-11-17 (월) 09:00
**예상 완료**: 2025-11-17 (월) 18:00

**🚀 화이팅!** 모든 정보가 문서에 있습니다. 순서대로 진행하세요! 💪
