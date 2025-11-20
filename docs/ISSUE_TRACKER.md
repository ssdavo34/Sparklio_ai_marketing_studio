# 이슈 트래커
**최종 업데이트**: 2025-11-20 오후
**담당**: A팀 QA

## 🔴 최우선 과제

### CRITICAL: 에디터 전환 (Konva → Polotno)
**상태**: 🔴 **진행 중** (2025-11-20 시작)
**담당**: C팀 (Frontend)
**목표**: 2주 내 완성

**배경**:
- Konva 에디터 구현 복잡도로 전체 프로젝트 진행 차질
- LLM/Brand Kit/Meeting AI 통합 불가능
- 학원 발표 데드라인 임박

**액션**:
- ✅ 결정 및 문서화 완료
- ⏳ C팀 Polotno SDK 도입 중
- ⏳ B팀 EditorAPI 구현 대기
- 📌 상세 계획: [EDITOR_TRANSITION_PRIORITY.md](./EDITOR_TRANSITION_PRIORITY.md)

---

## ✅ P0 - 해결됨 (Resolved)

### ISSUE-001: LLM Router 모델 매칭 오류
**상태**: ✅ **Resolved** (2025-11-20)
**발견일**: 2025-11-19
**해결일**: 2025-11-20
**영향도**: High - 모든 AI 기능 영향

**증상**:
- `/api/v1/chat/analyze` 엔드포인트 500 에러 발생
- 에러 메시지: "Gemini API failed: 404 models/gpt-4o is not found"

**원인**:

- Gemini 모델명 오류: `gemini-2.5-flash-preview` (존재하지 않는 모델)
- 실제 모델명: `gemini-2.5-flash`

**해결 내용**:

- ✅ B팀이 모든 관련 파일에서 모델명 수정
- ✅ `.env`: `GEMINI_TEXT_MODEL=gemini-2.5-flash`
- ✅ `config.py`: 기본값 `"gemini-2.5-flash"`로 변경
- ✅ `gemini_provider.py`: 모델 리스트 업데이트
- ✅ A팀 QA 검증 완료 (테스트 통과)

**테스트 결과**:

- Gemini API 직접 연결: ✅ PASS
- LLM Router 매핑: ✅ PASS (10/10)
- gpt-4o → OpenAI 라우팅: ✅ 정상

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