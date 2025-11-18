# 다음 세션 작업 가이드 - 2025년 11월 20일

**대상**: 다음 세션을 담당할 Claude AI
**이전 작업자**: B팀 Backend (2025-11-19)
**작성일**: 2025-11-19 23:00

---

## 🎯 세션 시작 시 필수 확인사항

### 1. 서버 상태 확인
```bash
# 포트 8000에서 실행 중인 프로세스 확인
netstat -ano | findstr ":8000"

# 서버가 실행 중이 아니면 시작
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. 어제 작업 결과 확인
```bash
# 간단한 API 테스트
curl -X POST http://localhost:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"kind":"product_detail","brandId":"test","input":{"prompt":"테스트 제품"}}'

# 헤드라인에 "테스트 제품"이 포함되어야 함 (템플릿 변수 X)
```

### 3. 문서 읽기
1. `EOD_REPORT_2025-11-19.md` - 어제 작업 내용
2. `AGENT_EXPANSION_PLAN_2025-11-18.md` - 전체 로드맵
3. 이 문서 - 오늘 할 일

---

## 📋 오늘의 작업 계획 (우선순위)

### P0: 긴급 - 당장 해야 할 일

#### 1. LLM 응답 언어 문제 해결 ⚠️
**문제**: LLM이 한국어 입력에 중국어로 응답하는 경우 발생

**원인 추정**:
- System prompt에 언어 지정 누락
- LLM 모델 자체 문제 (Ollama qwen2.5:7b)

**해결 방법**:
1. `app/services/llm/gateway.py`의 system prompt에 명시적 언어 지정 추가
   ```python
   system_prompt = f"""당신은 전문 {role}입니다.

   🔴 중요: 모든 응답은 반드시 한국어로 작성하세요.

   {task_specific_instructions}
   """
   ```

2. 테스트:
   ```bash
   curl -X POST http://localhost:8000/api/v1/generate \
     -H "Content-Type: application/json" \
     -d '{"kind":"product_detail","brandId":"test","input":{"prompt":"지성 피부용 진정 토너"}}'
   ```

**예상 소요 시간**: 30분

---

#### 2. Agent 확장 플랜 검토 및 공유
**목표**: AGENT_EXPANSION_PLAN_2025-11-18.md를 A팀(QA), C팀(Frontend)과 공유

**작업 순서**:
1. 플랜 문서 재검토 및 업데이트
2. A팀/C팀과 공유 가능한 요약 문서 작성
3. Slack/Discord 등을 통해 공유 (사용자 확인 필요)

**예상 소요 시간**: 1시간

---

### P1: 중요 - 오늘 완료하면 좋은 일

#### 3. AGENTS_SPEC.md 작성
**목표**: 모든 Agent의 명세를 하나의 문서로 통합

**포함 내용**:
- 각 Agent의 역할 및 책임
- Input/Output 스키마
- 사용 예시
- 제약사항 및 주의사항

**참고 파일**:
- `app/services/agents/copywriter.py`
- `app/services/agents/strategist.py`
- `app/services/agents/reviewer.py`
- 기타 Agent 파일들

**예상 소요 시간**: 2시간

---

#### 4. GENERATORS_SPEC.md 작성
**목표**: 모든 Generator의 명세를 하나의 문서로 통합

**포함 내용**:
- Generator 종류 및 용도
- Workflow 구조
- Input/Output 형식
- Canvas 생성 규칙

**참고 파일**:
- `app/services/generator/service.py`
- `app/services/orchestrator/workflows.py`
- `app/services/canvas/`

**예상 소요 시간**: 2시간

---

### P2: 보통 - 시간이 남으면 하면 좋은 일

#### 5. NanoBanana Provider 활성화
**목표**: Gemini Image Generation 기능 활성화

**작업 순서**:
1. `google-genai` 패키지 설치
   ```bash
   pip install google-genai==1.50.1
   ```

2. `.env` 파일 확인 (GOOGLE_API_KEY 존재 여부)

3. 서버 재시작 후 테스트
   ```bash
   # 서버 로그에서 확인
   # "NanoBanana Provider initialized successfully" 메시지 확인
   ```

**예상 소요 시간**: 30분

---

#### 6. 코드 품질 개선

##### 6-1. Type Hints 추가
- 모든 함수/메서드에 타입 힌트 추가
- mypy로 타입 체크

##### 6-2. Docstring 보완
- Google Style Docstring 형식 통일
- 모든 public 메서드에 docstring 추가

##### 6-3. 로깅 개선
- 중요 포인트에 DEBUG 로그 추가
- 에러 로그에 context 정보 포함

**예상 소요 시간**: 2-3시간

---

## 🚧 알려진 이슈 및 제약사항

### 1. LLM Provider 관련
- **NanoBanana**: `google-genai` 미설치로 비활성화 상태
- **Novita**: API 키가 placeholder (`your-novita-api-key-here`) - 실제 사용 불가

### 2. Workflow 관련
- ProductContentWorkflow가 Reviewer, Optimizer를 호출하지만 실제로는 Copywriter만 결과 사용
- 불필요한 Agent 호출로 비용/시간 낭비 가능성

### 3. 프론트엔드 연동 관련
- Canvas JSON 형식이 Fabric.js v5.3.0 기준
- 프론트엔드에서 제대로 렌더링되는지 미확인

---

## 📚 참고 문서

### 프로젝트 개요
- `README.md` - 프로젝트 전체 구조
- `ARCHITECTURE.md` - 아키텍처 문서 (있다면)

### 어제까지의 작업
- `EOD_REPORT_2025-11-18.md` - 11/18 작업 보고
- `EOD_REPORT_2025-11-19.md` - 11/19 작업 보고

### 계획 문서
- `AGENT_EXPANSION_PLAN_2025-11-18.md` - 8주 확장 로드맵
- `SESSION_START_CHECKLIST.md` - 세션 시작 체크리스트

### API 문서
- `docs/OPENAPI_SPEC_V4_AGENT.md` - Agent API 명세

---

## 🔧 개발 환경

### Python 환경
```bash
Python 3.11.8
pyenv-win (Windows)
```

### 주요 패키지
```bash
fastapi==0.121.2
uvicorn[standard]==0.38.0
openai==2.8.1
anthropic==0.73.0
google-generativeai==0.8.5
sqlalchemy==2.0.23
redis==5.0.1
```

### 환경 변수
```bash
# .env 파일 위치: backend/.env
GENERATOR_MODE=live
LOG_LEVEL=INFO
OLLAMA_BASE_URL=http://100.120.180.42:11434
OLLAMA_DEFAULT_MODEL=qwen2.5:7b
```

---

## 💡 유용한 명령어

### 서버 관련
```bash
# 서버 시작
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 모든 Python 프로세스 종료 (Windows)
taskkill //F //IM python.exe //T

# 캐시 삭제
find app -type d -name __pycache__ -exec rm -rf {} +
```

### 테스트 관련
```bash
# 간단한 API 테스트
curl http://localhost:8000/health

# Generator 테스트
curl -X POST http://localhost:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d @test_request.json

# 설정 확인
curl http://localhost:8000/api/v1/debug/settings
```

### Git 관련
```bash
# 현재 브랜치 확인
git branch

# 변경사항 확인
git status

# 스테이징
git add .

# 커밋
git commit -m "commit message"

# 푸시
git push origin main
```

---

## 🎯 성공 기준

오늘 세션이 성공했다고 평가할 수 있는 기준:

### 필수 (Must Have)
- [ ] LLM이 한국어로 일관되게 응답
- [ ] Agent 확장 플랜 공유 완료
- [ ] AGENTS_SPEC.md 작성 완료

### 권장 (Should Have)
- [ ] GENERATORS_SPEC.md 작성 완료
- [ ] NanoBanana Provider 활성화

### 선택 (Nice to Have)
- [ ] 코드 품질 개선 (Type hints, Docstring)
- [ ] 추가 테스트 케이스 작성

---

## 🚨 트러블슈팅 가이드

### 문제: 서버가 시작되지 않음
```bash
# 해결 1: 포트 충돌 확인
netstat -ano | findstr ":8000"

# 해결 2: 이전 프로세스 종료
taskkill //F //IM python.exe //T

# 해결 3: 캐시 삭제 후 재시작
find app -type d -name __pycache__ -exec rm -rf {} +
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 문제: Import Error
```bash
# 해결: 패키지 재설치
pip install -r requirements.txt
```

### 문제: Workflow 실행 실패
```bash
# 디버깅: 로그 레벨 변경
# .env 파일 수정
LOG_LEVEL=DEBUG

# 서버 재시작 후 로그 확인
```

---

## 📞 도움이 필요할 때

### 사용자에게 물어봐야 하는 경우
1. Slack/Discord 공유 방법 및 채널 정보
2. API 키 관련 (Novita 등)
3. 프론트엔드 팀과의 연동 테스트 일정

### 문서를 참고해야 하는 경우
1. Agent 동작 원리 → `app/services/agents/` 코드 직접 확인
2. Workflow 구조 → `app/services/orchestrator/workflows.py`
3. 전체 아키텍처 → `EOD_REPORT` 파일들 연대기순 확인

---

**작성 완료**: 2025-11-19 23:00
**다음 리뷰**: 2025-11-20 EOD

---

## ✅ 오늘 작업 완료 체크리스트

세션 종료 전 확인:

- [ ] EOD 보고서 작성 완료
- [ ] 다음 세션 가이드 작성 완료
- [ ] Git 커밋 및 푸시 완료
- [ ] 서버 정상 작동 확인
- [ ] 중요 파일 백업 확인
