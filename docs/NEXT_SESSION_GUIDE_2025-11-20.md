# 다음 세션 작업 가이드 (2025-11-20 업데이트)

## 📌 현재 상태 요약

### 완료된 Phase
- ✅ **Phase 1-3**: EditorAgent, MeetingAIAgent 구현 완료
- ✅ **Phase 4**: Admin Monitoring Dashboard 구현 완료
- ✅ **Phase 5**: Integration Testing & Debugging 완료
- ✅ **Phase 6**: User-Selected LLM Mode 구현 완료

### 현재 브랜치
```bash
feature/editor-v2-konva
```

### 시스템 상태
- **백엔드**: Mock Mode로 정상 동작 (`GENERATOR_MODE="mock"`)
- **프론트엔드**: LLM Selector UI 통합 완료
- **통합 테스트**: 모든 테스트 통과 ✅
- **Git 상태**: Phase 6 변경사항 커밋 대기 중

---

## 🔄 Git 동기화 방법

### 1. 현재 변경사항 확인
```powershell
cd k:\sparklio_ai_marketing_studio
git status
```

### 2. Phase 6 변경사항 커밋
```powershell
# 모든 변경사항 스테이징
git add .

# 커밋 메시지 작성
git commit -m "feat: Phase 6 - User-Selected LLM Mode 구현 완료

- LLMSelection 스키마 추가 (backend/app/schemas/llm.py)
- LLMGateway 업데이트 (Manual/Auto 모드 지원, Novita 제거)
- Chat API 및 EditorAgent LLM 선택 기능 통합
- Zustand LLM Store 및 LLMSelector 컴포넌트 추가
- ChatInterface에 LLM 선택 UI 통합
- useSparkChat Hook에서 LLM 선택 전송 구현

Backend: 4 files modified, 1 file added
Frontend: 3 files modified, 2 files added"

# 원격 저장소에 푸시
git push origin feature/editor-v2-konva
```

### 3. 충돌 발생 시
```powershell
# 원격 변경사항 먼저 가져오기
git pull origin feature/editor-v2-konva --rebase

# 충돌 해결 후
git add .
git rebase --continue
git push origin feature/editor-v2-konva
```

---

## 🚀 Phase 7 작업 지침

### 목표: Live LLM Provider 활성화 및 Manual Mode 검증

#### 1단계: Live LLM Provider 설정 (우선순위: 높음)

##### Option A: OpenAI (GPT-4o) 활성화
```bash
# .env 파일 수정
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_DEFAULT_MODEL=gpt-4o-mini
OPENAI_TIMEOUT=60
```

**테스트 방법**:
1. 백엔드 재시작 (Mock Mode 해제)
   ```powershell
   cd backend
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
2. 브라우저에서 Spark Chat 접속
3. LLM Mode를 "Manual Selection"으로 변경
4. Text LLM을 "GPT-4o"로 선택
5. 메시지 전송 후 응답 확인

##### Option B: Gemini (2.5 Flash) 활성화
```bash
# .env 파일 수정
GOOGLE_API_KEY=your-gemini-api-key-here
GEMINI_TEXT_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT=60
```

**테스트 방법**: OpenAI와 동일 (Text LLM을 "Gemini 2.5 Flash"로 선택)

##### Option C: Ollama (로컬) 활성화
```bash
# Ollama 서버 실행 (별도 터미널)
ollama serve

# 모델 다운로드
ollama pull qwen2.5:7b
ollama pull llama3.1:8b
```

**테스트 방법**: OpenAI와 동일 (Text LLM을 "Ollama (Local)"로 선택)

#### 2단계: Manual Mode 브라우저 테스트

##### 테스트 시나리오 1: Auto → Manual 전환
1. Spark Chat 접속
2. 초기 상태: "Auto (Smart Router)" 확인
3. "Manual Selection"으로 변경
4. Text LLM 드롭다운 표시 확인
5. 각 Provider 선택 후 메시지 전송
6. 응답 정상 수신 확인

##### 테스트 시나리오 2: Provider 변경
1. Manual Mode에서 "GPT-4o" 선택 → 메시지 전송
2. "Gemini 2.5 Flash"로 변경 → 메시지 전송
3. "Ollama (Local)"로 변경 → 메시지 전송
4. 각 Provider별 응답 차이 확인

##### 테스트 시나리오 3: 에러 처리
1. API 키 없는 Provider 선택 (예: Anthropic)
2. 에러 메시지 확인
3. Mock Provider로 Fallback 되는지 확인

#### 3단계: Image/Video Engine 구현 (선택)

**현재 상태**: UI만 구현됨, 실제 Provider 미구현

**작업 필요사항**:
1. `backend/app/services/llm/providers/comfyui_image.py` 생성
2. `backend/app/services/llm/providers/nanobanana.py` 생성
3. `LLMGateway`에 Image/Video Provider 초기화 추가
4. `_provider_from_name()`에 매핑 추가

**참고 파일**:
- `backend/app/services/llm/providers/base.py` (Provider 인터페이스)
- `backend/app/services/llm/providers/mock.py` (구현 예시)

---

## 🐛 알려진 이슈 및 해결 방법

### 이슈 1: "Ollama API error: 404"
**원인**: Ollama에 요청한 모델이 설치되지 않음  
**해결**:
```bash
ollama pull gpt-4o  # 실패 (Ollama는 GPT 모델 미지원)
ollama pull qwen2.5:7b  # 성공
```
**권장**: Manual Mode에서 Ollama 선택 시 `qwen2.5:7b` 또는 `llama3.1:8b` 사용

### 이슈 2: "Provider 'novita' not found"
**상태**: ✅ 해결됨 (Phase 6에서 Novita 완전 제거)

### 이슈 3: Redis 연결 실패
**상태**: ⚠️ 낮은 우선순위  
**현재 동작**: `NO-REDIS` 모드로 정상 동작 중  
**해결 방법** (선택):
```bash
# Redis 서버 설치 및 실행
# Windows: https://github.com/microsoftarchive/redis/releases
redis-server
```

---

## 📂 중요 파일 위치

### Backend
```
backend/
├── app/
│   ├── schemas/
│   │   └── llm.py                    # LLMSelection 스키마
│   ├── services/
│   │   ├── llm/
│   │   │   ├── gateway.py            # LLM Gateway (Manual/Auto 로직)
│   │   │   └── providers/
│   │   │       ├── base.py           # Provider 인터페이스
│   │   │       ├── mock.py           # Mock Provider
│   │   │       ├── openai_provider.py
│   │   │       ├── gemini_provider.py
│   │   │       └── ollama.py
│   │   └── agents/
│   │       └── editor.py             # EditorAgent (LLM 선택 전달)
│   └── api/
│       └── v1/
│           └── chat.py               # Chat API (LLM 선택 수신)
└── tests/
    └── test_integration_flow.py      # 통합 테스트
```

### Frontend
```
frontend/
├── store/
│   └── llmStore.ts                   # Zustand LLM Store
├── components/
│   └── spark/
│       ├── LLMSelector.tsx           # LLM 선택 UI
│       └── ChatInterface.tsx         # Spark Chat (LLM Selector 통합)
└── hooks/
    └── useSparkChat.ts               # Chat Hook (LLM 선택 전송)
```

---

## 🧪 테스트 실행 방법

### 1. 통합 테스트 (Mock Mode)
```powershell
cd backend
$env:GENERATOR_MODE="mock"
python -m pytest tests/test_integration_flow.py -v
```

**예상 결과**: 모든 테스트 통과 ✅

### 2. 브라우저 테스트
```powershell
# Terminal 1: Backend (Mock Mode)
cd backend
$env:GENERATOR_MODE="mock"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

**접속**: `http://localhost:3000/studio` → Spark Chat 탭

### 3. Live Mode 테스트 (API 키 설정 후)
```powershell
# Terminal 1: Backend (Live Mode)
cd backend
# GENERATOR_MODE 환경변수 제거 또는 "live"로 설정
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## 📋 Phase 7 체크리스트

### 필수 작업
- [ ] OpenAI API 키 설정 및 GPT-4o 테스트
- [ ] Gemini API 키 설정 및 Gemini 2.5 Flash 테스트
- [ ] Manual Mode 브라우저 테스트 (Auto ↔ Manual 전환)
- [ ] 각 Provider 선택 시 정상 동작 확인
- [ ] 에러 처리 및 Fallback 로직 검증

### 선택 작업
- [ ] Ollama 로컬 서버 설정 및 모델 다운로드
- [ ] ComfyUI Image Provider 구현
- [ ] Nanobanana Provider 구현
- [ ] Redis 서버 설정 (낮은 우선순위)

### 문서화
- [ ] Live Mode 테스트 결과 기록
- [ ] Provider별 성능 비교 (응답 시간, 품질)
- [ ] Phase 7 완료 보고서 작성

---

## 💡 작업 팁

### 1. 환경변수 관리
`.env` 파일을 사용하여 API 키 관리:
```bash
# backend/.env
GENERATOR_MODE=live  # or "mock"
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
ANTHROPIC_API_KEY=...
```

### 2. 디버깅
백엔드 로그 확인:
```powershell
# backend/app/services/llm/gateway.py 에서 로그 출력
# "LLM Generate: role=..., provider=..., model=..." 확인
```

프론트엔드 콘솔 확인:
```javascript
// 브라우저 개발자 도구 → Console
// Network 탭에서 /api/v1/chat/analyze 요청 확인
```

### 3. Mock Mode ↔ Live Mode 전환
```powershell
# Mock Mode
$env:GENERATOR_MODE="mock"

# Live Mode (환경변수 제거)
Remove-Item Env:GENERATOR_MODE
```

---

## 📞 문제 발생 시

### 1. 백엔드 에러
- 로그 확인: 터미널 출력 또는 `backend/logs/` 확인
- `debug_log.txt` 파일 확인 (Chat API 디버그 로그)

### 2. 프론트엔드 에러
- 브라우저 개발자 도구 → Console 확인
- Network 탭에서 API 요청/응답 확인

### 3. Provider 연결 실패
- API 키 확인 (`.env` 파일)
- Provider 초기화 로그 확인 ("Initializing ... Provider")
- Mock Provider로 Fallback 되는지 확인

---

## 🎯 다음 세션 목표

**Phase 7: Live LLM Provider 활성화 및 검증**

1. ✅ OpenAI/Gemini 중 1개 이상 활성화
2. ✅ Manual Mode 브라우저 테스트 완료
3. ✅ 에러 처리 검증
4. ✅ Phase 7 완료 보고서 작성

**예상 소요 시간**: 2-3시간

---

**작성일**: 2025-11-20  
**작성자**: AI Agent (Claude)  
**다음 작업자**: Phase 7 구현 담당자
