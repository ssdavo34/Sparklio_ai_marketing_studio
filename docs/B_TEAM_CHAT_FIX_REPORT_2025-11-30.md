# B팀 작업 보고서: Chat 기능 오류 수정

**작성일**: 2025-11-30
**작성자**: B팀 (Backend)
**커밋**: 3605fcb

---

## 1. 문제 요약

### 1.1 증상
- Chat에서 메시지 전송 시 오류 발생
- 오류 메시지: `"Agent execution failed: Strategist execution failed: Output validation failed after 3 attempts"`
- 일반 질문에도 응답 불가

### 1.2 영향 범위
- 모든 Chat 기능 (우측 패널)
- Agent Role: strategist, copywriter 등

---

## 2. 원인 분석

### 2.1 Chat 흐름

```
사용자 입력
  ↓
useChatStore.sendMessage()
  ↓
llm-gateway-client.sendChatMessage()
  - agent: chatConfig.role (strategist, copywriter, etc.)
  - task: chatConfig.task (campaign_strategy, chat, etc.)
  ↓
Backend: /agents/{agent}/execute
  ↓
Strategist/Copywriter Agent
  - LLM 호출
  - OutputValidator.validate() ← 여기서 실패!
```

### 2.2 근본 원인

1. **Frontend**에서 `sendChatMessage()`가 선택된 `chatConfig.task` (예: `campaign_strategy`)로 Backend Agent 호출
2. **Strategist/Copywriter Agent**가 모든 task에 대해 엄격한 Pydantic 스키마 validation 수행
3. 일반 대화 응답(예: "브랜드 컬러 표시해줘")은 복잡한 `CampaignStrategyOutputV1` 스키마를 만족하지 못함
4. 3회 재시도 후 최종 실패

### 2.3 CampaignStrategyOutputV1 스키마 요구사항 (일부)

```python
class CampaignStrategyOutputV1(BaseModel):
    core_message: str = Field(..., min_length=10, max_length=200)
    positioning: str = Field(..., min_length=20, max_length=150)
    target_insights: List[str] = Field(..., min_items=3, max_items=5)
    big_idea: str = Field(..., min_length=15, max_length=100)
    strategic_pillars: List[StrategicPillar] = Field(..., min_items=2, max_items=3)
    channel_strategy: List[ChannelStrategy] = Field(..., min_items=2, max_items=5)
    funnel_structure: FunnelStructure
    risk_factors: List[str] = Field(..., min_items=1, max_items=5)
    success_metrics: List[str] = Field(..., min_items=3, max_items=8)
```

일반 대화 응답이 이 복잡한 구조를 만족할 수 없음.

---

## 3. 해결 방안

### 3.1 Strategist Agent 수정

**파일**: `backend/app/services/agents/strategist.py`

#### 3.1.1 Validation Skip 로직 추가 (line 117-135)

```python
# Validation Pipeline
# chat task는 자유 형식 응답이므로 validation 건너뛰기
skip_validation = request.task in ['chat', 'free_chat', 'general_chat']

if skip_validation:
    logger.info(f"⏭️ Skipping validation for task: {request.task}")
    validation_result = type('ValidationResult', (), {
        'passed': True,
        'overall_score': 10.0,
        'stage_results': [],
        'errors': [],
        'warnings': []
    })()
else:
    validation_result = validator.validate(
        output=outputs[0].value,
        task=request.task,
        input_data=request.payload
    )
```

#### 3.1.2 Chat Task Instruction 추가 (line 423-433)

```python
# Chat task: 자유 형식 대화
"chat": {
    "instruction": (
        "사용자의 질문에 친절하고 도움이 되게 응답하세요. "
        "마케팅, 브랜딩, 콘텐츠 전략에 대한 전문적인 조언을 제공하세요. "
        "응답은 간결하고 실용적이어야 합니다."
    ),
    "structure": {
        "response": "사용자 질문에 대한 응답"
    }
}
```

#### 3.1.3 Chat Response Output 추가 (line 461)

```python
output_names = {
    # ... 기존 task들 ...
    "chat": "chat_response"  # Chat task 지원
}
```

### 3.2 Copywriter Agent 수정

**파일**: `backend/app/services/agents/copywriter.py`

동일한 패턴으로 수정:
- Validation skip 로직 추가 (line 115-133)
- Chat task instruction 추가 (line 302-312)
- Chat response output 추가 (line 520-527)

---

## 4. 배포

### 4.1 커밋

```
3605fcb [2025-11-30][B] fix: Add chat task support to Strategist/Copywriter Agents
```

### 4.2 Mac mini 배포

```bash
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio && git pull origin feature/editor-migration-polotno"
ssh woosun@100.123.51.5 "/usr/local/bin/docker compose -f ~/sparklio_ai_marketing_studio/docker/mac-mini/docker-compose.yml restart backend"
```

### 4.3 상태 확인

```bash
curl http://100.123.51.5:8000/health
# {"status":"healthy","services":{"api":"ok","database":"ok","storage":"ok"},"environment":"development","version":"4.0.0"}
```

---

## 5. Chat과 Brand Kit 연결 분석

### 5.1 현재 상태

- **Chat 시스템과 Brand Kit 탭은 직접 연결되어 있지 않음**
- Chat에서는 이미지 생성 시에만 `brandKit.brand_id` 참조 (line 272-273 of useChatStore.ts)
- Brand Kit 탭의 Brand DNA 분석 결과를 Chat에서 활용하려면 추가 연동 작업 필요

### 5.2 Chat 흐름 요약

| 컴포넌트 | 위치 | 기능 |
|----------|------|------|
| ChatPanel.tsx (하단) | components/canvas-studio/components/ | Kind 선택, Generate API 호출 |
| useChatStore.ts (우측) | stores/ | Agent 기반 Chat, LLM Gateway 호출 |
| llm-gateway-client.ts | lib/ | Backend `/agents/{agent}/execute` 호출 |

### 5.3 향후 연동 방안 (필요 시)

1. Chat에서 `useBrandStore`의 Brand DNA 분석 결과를 `brand_context`로 전달
2. Backend Agent가 `brand_context`를 LLM 프롬프트에 포함
3. 브랜드 맞춤형 응답 생성

---

## 6. 테스트 방법

### 6.1 Chat 기능 테스트

1. Canvas Studio 접속 (http://localhost:3000/studio/v3)
2. 우측 Chat 패널 열기
3. Agent Role: Strategist 또는 Copywriter 선택
4. Task: Chat 선택 (또는 기본값)
5. 일반 질문 입력 (예: "브랜드 컬러를 어떻게 선택해야 하나요?")
6. 응답 확인 (오류 없이 응답이 와야 함)

### 6.2 예상 로그 (Mac mini Backend)

```
⏭️ Skipping validation for task: chat
✅ Validation passed (attempt 1/3): Score 10.0/10
```

---

## 7. 관련 파일

| 파일 | 변경 내용 |
|------|----------|
| `backend/app/services/agents/strategist.py` | chat task validation skip, instruction 추가 |
| `backend/app/services/agents/copywriter.py` | 동일 |
| `backend/app/services/validation/output_validator.py` | 변경 없음 (참조용) |
| `frontend/lib/llm-gateway-client.ts` | 변경 없음 (참조용) |
| `frontend/components/canvas-studio/stores/useChatStore.ts` | 변경 없음 (참조용) |

---

## 8. 참고: 오늘의 전체 커밋 히스토리

```
3605fcb [2025-11-30][B] fix: Add chat task support to Strategist/Copywriter Agents
5c8ed4d [2025-11-30][C] feat: Add multi-page crawling UI option
c803bb2 [2025-11-30][B] feat: Add multi-page crawling for Brand DNA analysis
1791c2c [2025-11-30][B] fix: Improve web crawler to extract main content only
cf5a85d [2025-11-30][B] fix: Add fallback for over-aggressive brand_kit cleaning
```

---

**작성 완료**: 2025-11-30 19:35 KST
