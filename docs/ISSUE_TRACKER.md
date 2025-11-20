# 이슈 트래커
**최종 업데이트**: 2025-11-20
**담당**: A팀 QA

## 🔴 P0 - 긴급 (Critical)

### ISSUE-001: LLM Router 모델 매칭 오류
**상태**: 🔴 Open
**발견일**: 2025-11-19
**영향도**: High - 모든 AI 기능 영향

**증상**:
- `/api/v1/chat/analyze` 엔드포인트 500 에러 발생
- 에러 메시지: "Gemini API failed: 404 models/gpt-4o is not found"

**원인**:
- `backend/app/services/llm/router.py`에서 모델-프로바이더 매칭 실패
- gpt-4o 모델을 Gemini Provider로 잘못 라우팅

**재현 방법**:
1. Frontend에서 채팅 메시지 입력
2. Send 버튼 클릭
3. Network 탭에서 500 에러 확인

**임시 해결책**:
- 환경 변수에서 DEFAULT_LLM_MODEL을 gemini-pro로 변경

**영구 해결 방안**:
```python
# backend/app/services/llm/router.py 수정 필요
MODEL_PROVIDER_MAP = {
    "gpt-4o": "openai",
    "gpt-4o-mini": "openai",
    "gemini-pro": "gemini",
    "gemini-2.5-flash": "gemini",
    "llama3": "ollama",
    # ...
}
```

---

## 🟡 P1 - 중요 (Major)

### ISSUE-002: Redis 연결 경고
**상태**: 🟡 Workaround
**발견일**: 2025-11-19
**영향도**: Low - 캐싱 기능만 영향

**증상**:
- Backend 시작 시 Redis 연결 실패 경고
- "Redis connection failed: Connection refused"

**현재 상태**:
- NO-REDIS 모드로 정상 작동 중
- 메모리 캐싱으로 대체 동작

**해결 방안**:
- Redis 서버 설치 및 실행
- 또는 환경 변수 DISABLE_REDIS=true 설정

---

### ISSUE-003: WebSocket 재연결 실패
**상태**: 🟡 Open
**발견일**: 2025-11-20
**영향도**: Medium - 실시간 기능 영향

**증상**:
- 네트워크 끊김 후 WebSocket 자동 재연결 실패
- 페이지 새로고침 필요

**재현 방법**:
1. Chat 페이지 접속
2. 개발자 도구 > Network > Offline 모드 전환
3. 다시 Online 전환
4. WebSocket 연결 상태 확인

---

## 🟢 P2 - 일반 (Minor)

### ISSUE-004: Konva.js Drag 이벤트 경고
**상태**: 🟢 Low Priority
**발견일**: 2025-11-19
**영향도**: None - 기능 정상

**증상**:
- Console에 "Konva warning: Node has no dragBoundFunc" 경고

**위치**:
- `frontend/components/canvas-studio/CanvasArea.tsx`

**해결 방안**:
```tsx
// dragBoundFunc 추가
<Layer dragBoundFunc={(pos) => pos}>
```

---

### ISSUE-005: TypeScript 타입 경고
**상태**: 🟢 Low Priority
**발견일**: 2025-11-20
**영향도**: None - 빌드 정상

**파일 목록**:
- `frontend/hooks/useSparkChat.ts:45` - any 타입 사용
- `frontend/components/canvas-studio/layout/RightDock.tsx:78` - implicit any

---

## 📊 이슈 통계

### 우선순위별
- P0 (긴급): 1개
- P1 (중요): 2개
- P2 (일반): 2개

### 상태별
- 🔴 Open: 2개
- 🟡 Workaround: 1개
- 🟢 Low Priority: 2개
- ✅ Closed: 0개

## 📝 버그 리포트 템플릿

```markdown
### ISSUE-XXX: [제목]
**상태**: 🔴/🟡/🟢/✅
**발견일**: YYYY-MM-DD
**영향도**: Critical/High/Medium/Low/None

**증상**:
[버그 설명]

**재현 방법**:
1. [단계]
2. [단계]

**예상 동작**:
[정상 동작]

**실제 동작**:
[문제 동작]

**스크린샷/로그**:
[첨부]

**해결 방안**:
[제안된 수정 방법]
```

## 🔄 업데이트 히스토리

- 2025-11-20: 초기 이슈 트래커 생성
- 2025-11-20: P0 이슈 1개, P1 이슈 2개, P2 이슈 2개 등록

---

**다음 리뷰**: 2025-11-21 10:00 AM