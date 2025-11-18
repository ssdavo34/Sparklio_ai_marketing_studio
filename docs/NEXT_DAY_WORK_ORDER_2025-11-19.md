# 🚀 다음 작업 지침서 (2025-11-19)

**발신**: B팀 Backend (2025-11-18 EOD)
**수신**: 내일 아침 Claude (B팀 Backend 담당)
**긴급도**: 🟢 일반 (P1 작업 진행)
**작성일**: 2025-11-18 (화) 18:40

---

## 📋 즉시 실행 체크리스트 (10분)

### ✅ Step 1: 현재 시간 확인
```bash
# Windows (PowerShell)
powershell -Command "Get-Date -Format 'yyyy-MM-dd (dddd) HH:mm:ss'"

# macOS/Linux
date "+%Y-%m-%d (%A) %H:%M:%S"
```
> 📌 모든 보고서, 커밋 메시지에 정확한 날짜/시간 기록 필수

---

### ✅ Step 2: SESSION_START_CHECKLIST 실행 (1분)

**문서 위치**: `docs/SESSION_START_CHECKLIST.md`

**반드시 순서대로 체크**:
1. 인프라/네트워크 상태 점검 (Tailscale, 맥미니, Desktop)
2. Git/코드 상태 점검 (브랜치, 동기화, 변경사항)
3. 환경 변수/가상환경 점검 (.env, venv, 의존성)
4. 서비스 상태 빠른 점검 (Generate API, Agent API)
5. 문서 읽기/오늘 작업 계획 확인 (본 문서!)

---

### ✅ Step 3: 맥미니 Backend 서버 시작 (자동화)

**노트북에서 원격 실행** (추천):
```bash
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/backend && ./start_macmini.sh"
```

**예상 출력**:
```
[INFO] Backend 자동 시작 스크립트 실행
[INFO] Step 1/5: Git Pull (최신 코드 동기화)
✅ Git Pull 완료
[INFO] Step 2/5: 가상환경 활성화
✅ 가상환경 활성화 완료 (Python: 3.11.x)
[INFO] Step 3/5: 의존성 설치
✅ 의존성 설치 완료
[INFO] Step 4/5: 기존 Backend 서버 프로세스 확인 및 종료
✅ 실행 중인 Backend 서버 없음
[INFO] Step 5/5: Backend FastAPI 서버 시작 (백그라운드)
✅ Backend 서버 시작 완료 (PID: XXXXX)
[INFO] Backend 서버 Health Check 대기 (최대 30초)...
✅ Backend 서버 Health Check 성공!
{"status":"healthy","services":{"api":"ok","database":"ok","storage":"ok"}}

================================================
🚀 Sparklio Backend 서버 시작 완료!
================================================
서버 URL: http://100.123.51.5:8000
API 문서: http://100.123.51.5:8000/docs
Health Check: http://100.123.51.5:8000/health
프로세스 PID: XXXXX
로그 위치: /tmp/sparklio_backend.log
================================================
```

**문제 발생 시**:
```bash
# 로그 확인
ssh woosun@100.123.51.5 "tail -50 /tmp/sparklio_backend.log"

# 수동 재시작
ssh woosun@100.123.51.5 "pkill -f uvicorn && cd ~/sparklio_ai_marketing_studio/backend && source .venv/bin/activate && nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/sparklio_backend.log 2>&1 &"
```

---

### ✅ Step 4: Git 상태 확인 및 어제 작업 커밋

**현재 상태**:
```bash
cd K:\sparklio_ai_marketing_studio
git status
```

**Staged 파일** (어제 작업 완료, 커밋 대기 중):
- `docs/API_CONTRACTS/agents_api.json` (P1-01: Agent API OpenAPI 스펙)

**Unstaged 파일** (오늘 추가됨):
- `docs/reports/B_TEAM_EOD_REPORT_2025-11-18.md` (어제 EOD 보고서)
- `docs/NEXT_DAY_WORK_ORDER_2025-11-19.md` (본 문서)

**즉시 실행할 Git 명령**:
```bash
cd K:\sparklio_ai_marketing_studio

# 어제 작업 커밋 (agents_api.json)
git add docs/API_CONTRACTS/agents_api.json
git commit -m "docs(api): Agent API OpenAPI 3.0 스펙 문서 작성

P1-01 작업 완료:

1. 파일 위치: docs/API_CONTRACTS/agents_api.json

2. 포함된 내용:
   - 6개 Agent API 엔드포인트 명세
   - Request/Response 스키마 정의
   - 실제 예제 (Copywriter, Strategist, Reviewer)

3. 목적:
   - Frontend와의 API 계약 명확화
   - Agent 실행 방법 문서화

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# EOD 보고서 및 작업 지침 커밋
git add docs/reports/B_TEAM_EOD_REPORT_2025-11-18.md docs/NEXT_DAY_WORK_ORDER_2025-11-19.md
git commit -m "docs: B팀 2025-11-18 EOD 보고서 및 다음날 작업 지침

완료 내용:
- P0 작업 3개 완료 (세션 시작 자동화)
- P1 작업 1개 완료 (Agent API OpenAPI 스펙)

다음 작업:
- P1-02: E2E 테스트 시나리오 문서
- P1-03: 성능 측정 계획서

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 원격 저장소에 푸시
git push origin master
```

---

### ✅ Step 5: 어제 EOD 보고서 읽기 (5분)

**문서 위치**: `docs/reports/B_TEAM_EOD_REPORT_2025-11-18.md`

**핵심 내용**:
- P0 완료: SESSION_START_CHECKLIST.md, requirements.txt, start_macmini.sh
- P1 완료: agents_api.json
- 의존성 관리 근본 해결
- 세션 시작 시간 30분 → 1분 단축

---

## 📝 오늘 작업 계획 (P1 - 노트북 작업)

### P1-02: E2E 테스트 시나리오 문서 (1시간) ⭐ 우선순위 1

**목적**: 전체 워크플로우 End-to-End 테스트 시나리오 문서화

**파일**: `docs/testing/E2E_TEST_SCENARIOS.md`

**포함 내용**:

1. **테스트 시나리오 개요**
   - E2E 테스트 목적
   - 테스트 환경 (맥미니, Desktop, 노트북)
   - 테스트 대상 API

2. **시나리오 1: 제품 상세 페이지 생성 워크플로우**
   ```
   사용자 입력: "무선 이어폰"

   Step 1: POST /api/v1/generate
   - kind: product_detail
   - input: {"prompt": "무선 이어폰"}

   Step 2: Copywriter Agent 실행
   - headline, body, bullets 생성

   Step 3: Reviewer Agent 실행
   - 품질 검토, 피드백

   Step 4: Optimizer Agent 실행
   - 최적화 및 개선

   Step 5: Canvas JSON 생성
   - textBaseline: "alphabetic" 확인
   - 모든 text 객체 검증

   Step 6: Frontend 렌더링
   - Canvas 정상 표시 확인
   - Console 에러 0개 확인
   ```

3. **시나리오 2: 브랜드 전략 수립 워크플로우**
   - Strategist Agent 사용
   - 브랜드킷 생성
   - 타겟 분석

4. **시나리오 3: 이미지 생성 워크플로우**
   - Designer Agent 사용
   - ComfyUI 연동
   - 이미지 URL 반환

5. **테스트 체크리스트**
   - [ ] API 응답 시간 측정 (15-30초)
   - [ ] 토큰 사용량 기록
   - [ ] Agent 실행 순서 확인
   - [ ] Canvas JSON 유효성 검증
   - [ ] Frontend 렌더링 성공 확인

6. **실패 케이스 및 해결 방법**
   - Ollama 연결 실패 → Mock 모드 전환
   - 타임아웃 → 재시도 로직
   - Canvas 렌더링 에러 → textBaseline 확인

**예상 시간**: 1시간

**우선순위**: P1 (중요)

**프롬프트 예시**:
```
docs/testing/E2E_TEST_SCENARIOS.md 파일을 만들어줘.

내용:
1. E2E 테스트 개요
2. 시나리오 1: 제품 상세 페이지 생성 워크플로우
   - 사용자 입력 → Copywriter → Reviewer → Optimizer → Canvas JSON → Frontend 렌더링
3. 시나리오 2: 브랜드 전략 수립 워크플로우
4. 시나리오 3: 이미지 생성 워크플로우
5. 테스트 체크리스트
6. 실패 케이스 및 해결 방법

각 시나리오마다:
- 입력 데이터 예시
- 예상 API 호출 순서
- 예상 응답 형식
- 검증 항목
- 예상 소요 시간

참고 문서:
- docs/API_CONTRACTS/agents_api.json (Agent API 스펙)
- docs/reports/B_TEAM_EOD_REPORT_2025-11-18.md (B팀 작업 결과)
- docs/C_TEAM_VERIFICATION_REQUEST_2025-11-18.md (Frontend 검증 방법)
```

---

### P1-03: 성능 측정 계획서 (30분) ⭐ 우선순위 2

**목적**: LLM 응답 시간, 토큰 사용량 등 성능 측정 기준 및 계획 수립

**파일**: `docs/testing/PERFORMANCE_TEST_PLAN.md`

**포함 내용**:

1. **측정 목표**
   - Ollama Live 모드 평균 응답 시간
   - Agent별 토큰 사용량
   - 병렬 Agent 실행 시 성능
   - 최대 동시 요청 처리량

2. **측정 항목**
   | 항목 | 목표 | 측정 방법 |
   |------|------|----------|
   | Generate API 응답 시간 | 15-30초 | `elapsed_seconds` |
   | Copywriter Agent 토큰 | 1000-2000 | `usage.tokens` |
   | Strategist Agent 토큰 | 2000-3000 | `usage.tokens` |
   | Canvas JSON 생성 시간 | 1초 이하 | Python time.time() |
   | 동시 요청 처리량 | 10 req/min | 부하 테스트 |

3. **테스트 환경**
   - 맥미니 M2 (Backend)
   - Desktop RTX 4070 (Ollama)
   - Tailscale VPN

4. **테스트 시나리오**
   - 단일 요청 성능 테스트
   - 병렬 요청 성능 테스트
   - 장시간 실행 안정성 테스트

5. **성능 개선 목표**
   - 응답 시간 20% 단축
   - 토큰 사용량 10% 절감
   - 동시 요청 처리량 2배 증가

6. **측정 도구**
   - Prometheus (메트릭 수집)
   - Grafana (대시보드)
   - pytest-benchmark (Python 성능 측정)

**예상 시간**: 30분

**우선순위**: P1 (중요)

**프롬프트 예시**:
```
docs/testing/PERFORMANCE_TEST_PLAN.md 파일을 만들어줘.

내용:
1. 측정 목표
2. 측정 항목 (응답 시간, 토큰 사용량, 처리량)
3. 테스트 환경
4. 테스트 시나리오
5. 성능 개선 목표
6. 측정 도구

참고:
- Ollama Live 모드 평균 15-30초
- Copywriter 토큰 1000-2000
- Strategist 토큰 2000-3000
- 목표: 응답 시간 20% 단축
```

---

## 📊 작업 우선순위

### P1 (오늘 완료 목표)
1. ✅ **Git 커밋/푸시** (5분) - 어제 작업 반영
2. 🔲 **E2E 테스트 시나리오 문서** (1시간) - 가장 중요
3. 🔲 **성능 측정 계획서** (30분) - 두 번째 중요

### P2 (시간 있으면)
1. Backend 폴더 구조 문서화 (backend/PROJECT_STRUCTURE.md)
2. Quick Start Guide (docs/QUICK_START.md)

### 서버 작업 (집에서)
- Workflow Executor 완성 (2시간)
- E2E 테스트 실행 (2시간)

---

## 🚨 중요한 주의사항

### ⚠️ 반드시 지킬 것

1. **start_macmini.sh 우선 실행**
   - 모든 작업 전에 맥미니 Backend 서버 시작
   - Health Check 성공 확인

2. **SESSION_START_CHECKLIST.md 반드시 따를 것**
   - 건너뛰지 말고 1분 투자
   - 인프라 문제 조기 발견

3. **Git 커밋 메시지 형식 준수**
   - 타입: docs, feat, fix, refactor, test
   - 본문: 상세 설명
   - 푸터: Co-Authored-By

4. **오늘 작업 환경: 노트북 (학원)**
   - 서버 작업 불가
   - 문서 작업만 가능
   - 맥미니는 원격 접속만

5. **오늘 작업 종료 시 EOD 보고서 작성**
   - `docs/reports/B_TEAM_EOD_REPORT_2025-11-19.md`
   - 완료 내용, 미완료 내용, 다음 작업 지침
   - Git 커밋/푸시 필수

---

## 📚 참고 문서

### 반드시 읽어야 할 문서
1. **docs/SESSION_START_CHECKLIST.md** - 세션 시작 체크리스트
2. **docs/reports/B_TEAM_EOD_REPORT_2025-11-18.md** - 어제 EOD 보고서
3. **docs/API_CONTRACTS/agents_api.json** - Agent API 스펙

### 참고용 문서
1. **docs/DESKTOP_INFRASTRUCTURE.md** - Desktop 인프라 구조
2. **docs/C_TEAM_VERIFICATION_REQUEST_2025-11-18.md** - Frontend 검증 방법
3. **backend/requirements.txt** - 의존성 목록

---

## 🔧 자주 사용하는 명령어

### 맥미니 Backend 서버 관리
```bash
# 자동 시작 (추천)
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/backend && ./start_macmini.sh"

# Health Check
curl -s http://100.123.51.5:8000/health

# 로그 확인
ssh woosun@100.123.51.5 "tail -50 /tmp/sparklio_backend.log"

# 서버 종료
ssh woosun@100.123.51.5 "pkill -f 'uvicorn app.main:app'"
```

### Git 관리
```bash
# 빠른 동기화
git fetch origin && git status && git log origin/master --oneline -5

# 커밋 & 푸시
git add .
git commit -m "커밋 메시지"
git push origin master
```

### 테스트 API 호출
```bash
# Generate API 테스트
curl -s -X POST http://100.123.51.5:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"kind":"product_detail","brandId":"brand_demo","input":{"prompt":"무선 이어폰"},"options":{}}' | head -50

# Agent 목록 조회
curl -s http://100.123.51.5:8000/api/v1/agents/list
```

---

## ✅ 작업 완료 시 체크리스트

오늘 작업 종료 전에 반드시 확인:

- [ ] P1-02 E2E 테스트 시나리오 문서 작성 완료
- [ ] P1-03 성능 측정 계획서 작성 완료
- [ ] 모든 작업 Git 커밋/푸시 완료
- [ ] EOD 보고서 작성 (`docs/reports/B_TEAM_EOD_REPORT_2025-11-19.md`)
- [ ] 다음날 작업 지침 작성 (`docs/NEXT_DAY_WORK_ORDER_2025-11-20.md`)
- [ ] 맥미니 Backend 서버 정상 작동 확인
- [ ] Git 상태 깔끔 (no uncommitted changes)

---

## 💡 성공 팁

1. **시간 관리**
   - P1-02: 1시간
   - P1-03: 30분
   - EOD 보고서: 30분
   - 총 2시간 집중

2. **문서 작성**
   - 예제 많이 포함
   - 실제 명령어 포함
   - Frontend와의 계약 명확히

3. **Git 관리**
   - 작업 단위로 커밋
   - 커밋 메시지 명확히
   - 푸시 자주 하기

4. **인프라 점검**
   - SESSION_START_CHECKLIST.md 따르기
   - 문제 발생 시 즉시 해결
   - 로그 자주 확인

---

## 🎯 오늘의 목표

✅ Git 커밋/푸시 완료
✅ E2E 테스트 시나리오 문서 완성
✅ 성능 측정 계획서 완성
✅ EOD 보고서 및 다음날 지침 작성
✅ 깔끔한 Git 상태로 종료

---

**작성 시간**: 2025-11-18 (화) 18:40
**다음 작업자**: 2025-11-19 아침 Claude
**상태**: ✅ 준비 완료

**화이팅! 🚀**

---

**B팀 Backend** 🤖
