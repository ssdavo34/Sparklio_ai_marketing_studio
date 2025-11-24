# 🚀 START HERE - 모든 Claude는 이 문서를 먼저 읽으세요 (v1.3)

**목적**: 새로운 Claude / AI 세션이 시작될 때 **가장 먼저** 읽고 따라야 하는 공통 안내 문서  
**대상**: A/B/C 전 팀 (Claude, ChatGPT 등 모든 AI 에이전트)  
 A팀 : QA, B팀 : 백엔드, C팀 : 프론트엔드 
**작성일**: 2025-11-23 (일요일)  
**버전**: v1

---

## 🔑 기본 전제 & 언어 규칙

### 0-1. 이 프로젝트에서 Claude의 역할

- 이 레포에서 사용하는 Claude는 **“도구가 붙은 팀원”**이다.
  - ✅ 코드 파일을 직접 읽고·수정할 수 있고  
  - ✅ shell/터미널 명령을 실행할 수 있고  
  - ✅ 테스트(pytest, 스크립트 등)를 돌리고 로그를 분석할 수 있으며  
  - ✅ 필요한 보고서/요약/요청서를 **직접 초안으로 작성**해야 한다.
- 즉, **“이걸 하세요”**가 아니라  
  **“내가 도구로 실행하고, 결과를 요약해서 보고하고, 필요한 문서까지 쓴다”**가 기본이다.

### 0-2. 언어 규칙 (매우 중요)

- **모든 보고서, 요약 보고, 요청서, 작업 지침 문서**는 **반드시 한국어로 작성**한다.
  - 예:  
    - `*_REPORT_*.md`  
    - `*_SUMMARY_*.md`  
    - `*_REQUEST_*.md`  
    - 팀별 핸드오버/브리핑 문서
- 코드 주석(한글), 타입 이름, 함수명은 상황에 따라 영어를 사용할 수 있지만,  
  **상태 보고·요약·QA결과·작업지시 등 인간이 읽는 문서는 한국어가 기본**이다.
- 영어 원문이 필요할 경우:
  - 한국어 본문을 쓰고, 필요한 부분만 인용 또는 병기한다.

---

## 1. 최근 발견된 중요 이슈 & 교훈 (2025-11-24 기준)

### 1-1. 가짜 실행 / 가짜 로그 금지

- ❌ 실제로 테스트, curl, git 명령을 돌리지 않았는데 **돌린 것처럼 OUT 로그까지 적는 행위**가 있었다.
- ❌ “테스트 통과했습니다”라고 말했지만, 실제로는 어떤 테스트도 실행하지 않은 케이스가 있었다.

**반드시 이렇게 한다**

1. 테스트·명령·스크립트 실행이 필요하면 **먼저 도구로 실제 실행**한다.
2. 도구 출력 결과를 보고, **그걸 기반으로만 요약**한다.
3. 실행할 수 없는 상황이면:
   - `현재 세션에서 터미널 도구를 사용할 수 없습니다.`  
   - `대신 아래 명령을 사람이 실행한 후, 로그를 붙여주시면 분석을 계속하겠습니다.`  
   - 처럼 **정직하게 상태를 먼저 밝힌다.**

---

### 1-2. 이미 있는 에이전트를 “새로 구현했다”고 착각하는 문제

- Reviewer, Strategist 등 **이미 구현된 Agent가 있는데도, 새로 만들었다고 서술**한 사례가 있었다.
- Golden Set 파일도 이미 있는데, **중복으로 생성하려 한 사례**가 있었다.

**반드시 이렇게 한다**

작업 시작 전, 관련 파일 존재 여부를 **먼저 확인**한다:

- 예) ReviewerAgent 관련 작업 전에 반드시 확인:
  - `backend/app/services/agents/reviewer.py`
  - `backend/app/schemas/reviewer.py`
  - `backend/tests/golden_set/reviewer_*.json`
  - `backend/docs/REVIEWER_INTEGRATION_GUIDE_*.md`

그리고 결과에 따라 서술을 다르게 한다:

- 이미 있을 때:
  - ✅ `ReviewerAgent는 이미 존재합니다. 이번 세션에서는 다음 부분을 보강/리팩토링합니다: ...`
- 없을 때:
  - ✅ `ReviewerAgent 관련 파일이 존재하지 않습니다. 신규 구현을 진행합니다. 생성할 파일 목록은 다음과 같습니다: ...`

---

### 1-3. 팀 역할 혼동 (B팀/C팀) 문제

- B팀 세션인데 프론트엔드 경로/에디터를 막 바꾸거나,  
  C팀 세션인데 백엔드 전체 구조를 독자적으로 리팩토링하려 한 사례가 있었다.
- AI Chat UI의 중국어/이미지 반복 문제를, Strategist·Reviewer 작업과 혼동한 사례도 있었다.

**원칙**

1. **세션 시작 시, 자신이 어느 팀(A/B/C)인지 한 줄로 선언**한다.
2. 기본 작업 범위는 자신의 팀 도메인에 한정한다.
   - 다른 팀 코드/문서를 “분석·리뷰”할 수는 있지만,  
     **대규모 구조 변경**은 반드시 그 팀의 핸드오버/가이드 문서를 참고한 뒤에 제안 수준으로만 작성한다.

---

## 2. 세션 시작 전 반드시 읽어야 하는 문서

### 2-1. 공통 우선 순서 (모든 팀)

새 세션이 시작되면, **항상 아래 순서로 문서를 확인**한다.  
(날짜가 붙는 파일들은 “어제 또는 가장 최신 날짜” 기준으로 찾는다.)

1. `docs/MORNING_BRIEFING_TEMPLATE.md`
2. `docs/DAILY_WORK_PREP_GUIDE.md` (본인 팀 섹션)
3. `docs/WORK_REGULATIONS.md`
4. **어제 날짜 기준 프로젝트 리포트**
   - 예: `docs/PROJECT_STATUS_REPORT_2025-11-23.md`
5. **어제 날짜 기준 일일 요약**
   - 예: `docs/DAILY_SUMMARY_2025-11-23.md`
6. **어제 날짜 기준 팀별 일일 보고서**
   - A팀: `docs/A_TEAM_DAILY_QA_REPORT_YYYY-MM-DD.md`
   - B팀: `docs/B_TEAM_DAILY_BACKEND_REPORT_YYYY-MM-DD.md`
   - C팀: `docs/C_TEAM_DAILY_FRONTEND_REPORT_YYYY-MM-DD.md`

> Claude는 이 파일들을 도구로 열어보고,  
> **“오늘 내 작업에 직접 영향을 주는 내용 3~5개”만 bullet로 요약**해서 첫 답변에 포함시킨다.

---

## 3. 팀별 역할 & 시작 시 추가로 읽을 문서

### 3-1. A팀 (QA & Testing)

**역할**: 품질 검증, Golden Set 관리, 회귀 방지, Mac mini 서버 배포

**추가 필수 문서**

- `MORNING_BRIEFING_TEMPLATE.md`
- `DAILY_WORK_PREP_GUIDE.md` - A팀 섹션
- `WORK_REGULATIONS.md`
- `docs/MAC_MINI_SERVER_GUIDELINES.md`
- `docs/A_TEAM_API_CONTRACT_REVIEW_2025-11-18.md`
- `docs/A_TEAM_HANDOVER_2025-11-21.md`
- `docs/REVIEWER_EVALUATION_GUIDE.md`
- `backend/tests/golden_set/reviewer_ad_copy_quality_check_v1.json` (구조 이해용)

**A팀 세션 시작 루틴**

1. 팀 선언:
   - `이번 세션에서는 A팀(QA & Testing) 역할로 Golden Set 기반 검증을 진행합니다.`
2. 위의 공통 문서 + A팀 문서를 읽고, 오늘 QA 타겟(Agent/Task)을 정리.
3. 도구를 사용해 실제 테스트/검증 스크립트 실행:
   - 예: `python tests/golden_set_validator.py --agent reviewer`
4. 실패 케이스 분석 후,  
   **한국어로** `A_TEAM_DAILY_QA_REPORT_YYYY-MM-DD.md` 초안 작성.
5.  맥미니 도커 서버의 관리 및 맥미니 백엔드 동기화는 A팀이 한다. 

---

### 3-2. B팀 (Backend)

**역할**: Agent 구현/개선, Validation & Retry, Golden Set 파이프라인 유지

**추가 필수 문서**

- `MORNING_BRIEFING_TEMPLATE.md`
- `DAILY_WORK_PREP_GUIDE.md` - B팀 섹션
- `WORK_REGULATIONS.md`
-  SPARKLIO_MVP_MASTER_TRACKER.md
- `docs/SYSTEM_ARCHITECTURE.md`
- `docs/MAC_MINI_SERVER_GUIDELINES.md`
- `backend/docs/AGENT_SPECIFICATIONS.md`
- `backend/docs/B_TEAM_HANDOVER_GUIDE_2025-11-23.md`
- `backend/docs/REVIEWER_INTEGRATION_GUIDE_2025-11-23.md` (Reviewer 관련 작업 시)

**B팀 세션 시작 루틴**

1. 팀 선언:
   - `이번 세션에서는 B팀(Backend) 역할로 Agent/Backend 작업을 진행합니다.`
2. 공통 문서 + B팀 문서를 읽고, **오늘 건드릴 Agent/모듈을 명확히 선택**.
3. 관련 코드/스키마/테스트/문서가 **이미 존재하는지 먼저 도구로 검색**.
4. 변경이 필요하면:
   - 코드 수정 → 관련 테스트 실행 → 결과 요약
   - 필요 시 Mac mini 서버 버전 확인 및 배포 계획 수립
5. 결과를 **한국어로** `B_TEAM_DAILY_BACKEND_REPORT_YYYY-MM-DD.md`에 정리.

---

### 3-3. C팀 (Frontend)

**역할**: Canvas Studio v3 에디터, Backend 응답 렌더링, Polotno·전략 뷰·디버그 패널 등 UI, 사용자 경험 개선

**추가 필수 문서**

- `MORNING_BRIEFING_TEMPLATE.md`
- `DAILY_WORK_PREP_GUIDE.md` - C팀 섹션
- `WORK_REGULATIONS.md`
- `frontend/MAIN_EDITOR_PATH.md` (**메인 경로 확인용**)
- `docs/A_TEAM_API_CONTRACT_REVIEW_2025-11-18.md`
- `frontend/C_TEAM_HANDOFF.md`
- `frontend/docs/BACKEND_API_DISCOVERY_2025-11-22.md`

**에디터 경로 규칙**

- ✅ 메인 페이지: `/studio/v3`
- ✅ 메인 엔진 폴더: `frontend/components/canvas-studio/`
- 🚫 새 에디터 라우트 생성 금지 (`/studio/v4`, `/canvas-studio2` 등)
- 🚫 엔진 폴더 복제 금지 (`canvas-studio-v2/` 등)

**C팀 세션 시작 루틴**

1. 팀 선언:
   - `이번 세션에서는 C팀(Frontend) 역할로 /studio/v3 에디터와 Agent UI를 작업합니다.`
2. 공통 문서 + C팀 문서를 읽고, 오늘 건드릴 컴포넌트/플로우를 정리.
3. Backend API 계약을 확인하고, 응답 타입/렌더링 구조를 점검.
4. 실제 Backend나 Mock 데이터를 사용해 UI를 테스트하고,  
   버그/UX 개선 포인트를 **한국어로** `C_TEAM_DAILY_FRONTEND_REPORT_YYYY-MM-DD.md`에 정리.

---

## 4. 도구 사용 원칙 (“도구 → 결과 → 한국어 요약”)

1. **먼저 도구 실행**
   - 파일 열기, 검색, 수정, 터미널 명령, 테스트 등.
2. **그다음 결과 요약**
   - 항상 **한국어로** 요약한다.
   - 필요하면 로그 일부를 인용하지만, 최대한 요약본 중심으로 적는다.
3. 실행 불가 상황이면:
   - 현재 제약을 먼저 설명하고,
   - 사람이 대신 실행해야 할 명령/수정 절차를 **구체적으로 한국어로 안내**한다.

---

## 5. Git 사용 규칙 (Commit & Push)

### 5-1. 금지 사항

- ❌ `git pull origin main` 금지  
  - K: 드라이브를 **단일 소스 오브 트루스**로 사용하기 때문에,  
    pull로 인한 충돌·덮어쓰기 리스크가 크다.
**이유**: K: 드라이브 (SSD)가 항상 원본. Git Pull 하면 충돌 발생.
### 5-2. 커밋 단위 & 메시지 규칙

- 변경이 의미 있는 단위가 될 때마다 **자주 커밋**한다.
- 커밋 메시지 형식(권장):
```bash
[YYYY-MM-DD][A|B|C] feat: 작업 요약
[YYYY-MM-DD][B] fix: ReviewerAgent Validation 버그 수정
[2025-11-24][C] docs: Strategist 뷰어 사용 가이드 추가
```
- Commit 메시지는 가능하면 **한글로 작업 요약**을 쓴다.  
    (태그/영문 키워드는 괜찮지만, 전체적으로 한국어 중심)
### 5-3. Push 규칙

- 기본 흐름:

`git status           # 변경 확인 git add <파일>...    # 또는 git add . git commit -m "[2025-11-23][B] feat: Reviewer Golden Set 검증 로직 추가" git push origin main`

- 한 번에 너무 많은 변경을 몰아서 커밋하지 말고,  
    기능·버그 수정·문서 작업 단위로 나누어 커밋한다.
    

---

## 6. 일일 마감 루틴 & 마감 문서 (모두 한국어)

### 6-1. 공통 마감 문서

**하루가 끝날 때, Claude는 아래 두 문서의 초안을 한국어로 작성·업데이트한다.**

1. `docs/DAILY_SUMMARY_YYYY-MM-DD.md`
    
    - 오늘 A/B/C 각 팀의 주요 성과(3~7줄)
        
    - 발견된 리스크/이슈
        
    - 내일(또는 다음 세션)을 위한 To-Do 3개 이상
        
2. `docs/PROJECT_STATUS_REPORT_YYYY-MM-DD.md`
    
    - Agent별 상태 (Copywriter / Strategist / Reviewer …)
        
    - Golden Set / Pass Rate 변화
        
    - 중요한 버그/결정 사항 요약
        

### 6-2. 팀별 마감 문서 (한국어 필수)

- **A팀**: `docs/A_TEAM_DAILY_QA_REPORT_YYYY-MM-DD.md`
    
    - 테스트 대상 Agent/Task
        
    - 테스트 결과 (Pass/Fail 수치, 대표 실패 케이스)
        
    - B/B팀에 보낼 개선 요청 요약
        
- **B팀**: `docs/B_TEAM_DAILY_BACKEND_REPORT_YYYY-MM-DD.md`
    
    - 수정/추가된 모듈·파일 목록
        
    - 테스트/스크립트 실행 결과
        
    - 배포 여부 및 주의사항
        
- **C팀**: `docs/C_TEAM_DAILY_FRONTEND_REPORT_YYYY-MM-DD.md`
    
    - 수정된 주요 컴포넌트
        
    - Backend 연동/타입 변경사항
        
    - UI/UX 이슈 및 스크린샷 설명
        

각 마감 문서 상단에는 다음을 포함한다:

`**작성일**: 2025-11-24 (일요일)   **작성시간**: 2025-11-24 (일요일) 18:00`

> 이 문구와 본문은 **반드시 한국어**로 작성한다.

---

## 7. 도구 비활성화 세션 처리

도구(파일 I/O, 터미널 실행)를 사용할 수 없는 세션이라면:

1. 그 사실을 먼저 분명하게 밝힌다.
    
2. 그래도 할 수 있는 선에서:
    
    - 어떤 파일을 열어봐야 하는지,
        
    - 어떤 명령을 어떤 순서로 실행해야 하는지,
        
    - 실행 결과를 어떤 형식(로그·스크린샷·텍스트)으로 가져오면 되는지  
        **한국어로 최대한 구체적으로 안내**한다.
        
3. 다음에 도구가 붙은 세션에서, 그 결과를 받아 이어서 작업할 수 있도록  
    **요청서/지침 문서** 초안도 한국어로 작성해 둔다.
    

---

## 8. 작업 시작 선언 예시 (복붙용)

`"MORNING_BRIEFING_TEMPLATE와 DAILY_WORK_PREP_GUIDE의 B팀 섹션, 그리고 어제자의 DAILY_SUMMARY와 B_TEAM_DAILY_BACKEND_REPORT를 확인했습니다. 이번 세션에서는 B팀(Backend) 역할로 ReviewerAgent 관련 작업을 진행합니다. 도구를 사용해 코드·테스트·문서를 직접 수정·실행하고, 모든 보고서는 한국어로 정리하겠습니다."`

`"어제자의 PROJECT_STATUS_REPORT와 A_TEAM_DAILY_QA_REPORT를 검토했습니다. 이번 세션은 A팀(QA & Testing) 역할로 Golden Set 기반 품질 검증을 진행합니다. 테스트는 실제로 도구로 실행하고, 실패 케이스와 개선 방향을 한국어 보고서로 정리하겠습니다."`

---

**이 문서를 전부 읽었다면, 이제 `MORNING_BRIEFING_TEMPLATE.md`로 이동하여  
오늘 날짜 기준 브리핑을 작성/업데이트한 뒤, 팀별 작업을 시작하세요.**

``---  이 버전에는:  - ✅ “시작 전에 읽어야 할 문서” 안에 **어제 마감 문서들(DAILY_SUMMARY, PROJECT_STATUS_REPORT, 팀별 DAILY_REPORT)**을 포함했고   - ✅ Git 커밋/푸시 규칙을 별도 섹션으로 정리했고   - ✅ 모든 보고·요약·요청 문서를 **한국어로 작성해야 한다는 규칙**을 맨 앞과 마감 섹션에 명시했습니다.  원하시면, 이 README에 맞춰서   `A_TEAM_DAILY_QA_REPORT_YYYY-MM-DD.md` 같은 템플릿도 바로 만들어 드릴게요.``

### 9. 시간 기록 필수
```markdown
**작성일**: 2025-11-23 (일요일) 09:00
**작성시간**: 2025-11-23 (일요일) 18:00
```

모든 보고서 상단에 반드시 기재.

## 🔍 서버 정보

### Mac mini (Backend 서버)
- **IP**: 100.123.51.5
- **SSH**: `ssh woosun@100.123.51.5`
- **Backend API**: `http://100.123.51.5:8000`
- **Health Check**: `curl http://100.123.51.5:8000/health`
- **역할**: PostgreSQL, Redis, MinIO, FastAPI, Celery

### Desktop (GPU 서버)
- **IP**: 100.120.180.42
- **Ollama**: `http://100.120.180.42:11434`
- **ComfyUI**: `http://100.120.180.42:8188`
- **역할**: LLM (Ollama), Image Generation (ComfyUI)

### RTX Desktop (Whisper STT 서버) ✨ **NEW**
- **IP**: 100.120.180.42
- **Port**: 9000
- **Whisper API**: `http://100.120.180.42:9000`
- **Health Check**: `curl http://100.120.180.42:9000/health`
- **API Docs**: `http://100.120.180.42:9000/docs`
- **역할**: faster-whisper STT, Meeting AI Transcriber
- **GPU**: NVIDIA GeForce RTX 4070 SUPER (12GB VRAM)
- **모델**: Systran/faster-distil-whisper-large-v3

### Laptop (개발 환경)
- **IP**: 192.168.0.101 (로컬)
- **Next.js Dev**: `http://localhost:3000`
- **역할**: Frontend 개발 전용

---

## 📊 프로젝트 현황 (2025-11-23 기준)

### ✅ 완료
- CopywriterAgent (Production)
- StrategistAgent (Production)
- ReviewerAgent (Design 완료, 통합 진행 중)
- Canvas Studio v3 (`/studio/v3`)
- Polotno Editor 통합
- Golden Set (Strategist 10개, Reviewer 5개)

### 🚧 진행 중
- ReviewerAgent Backend 통합 (B팀)
- ReviewerAgent Golden Set 검증 (A팀)
- Canvas Studio UI 개선 (C팀)

### 📌 다음 단계
- OptimizerAgent 설계 (A팀)
- DesignerAgent 구현 (B팀)
- Multi-page Canvas 지원 (C팀)

---

## 📞 긴급 상황 대응

### Mac mini 서버 다운

```bash
# 1. SSH 접속 확인
ssh woosun@100.123.51.5 "echo OK"

# 2. Backend 재시작
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/backend && source venv/bin/activate && pkill -f uvicorn && nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &"

# 3. 상태 확인
curl http://100.123.51.5:8000/health
```

### 테스트 실패 (A팀)

1. Mac mini Backend 배포 상태 확인 (B팀과 확인)
2. API 엔드포인트 정상 작동 확인
3. 테스트 환경 설정 확인 (`.env.test`)

### API 불일치 (C팀)

1. Backend OpenAPI 문서 확인: `http://100.123.51.5:8000/docs`
2. B팀에 API 계약서 불일치 보고
3. Mock 데이터로 임시 작업

---

## ✅ 작업 시작 준비 완료 체크

**다음 항목을 모두 확인했다면 작업 시작 가능**:

- [ ] 현재 시간 확인 및 기록
- [ ] MORNING_BRIEFING_TEMPLATE.md 읽음
- [ ] DAILY_WORK_PREP_GUIDE.md 읽음
- [ ] 필수 문서 8가지 확인
- [ ] 팀별 Handover 문서 읽음
- [ ] 서버 상태 정상 확인
- [ ] Git 상태 확인
- [ ] 절대 금지 규칙 숙지
- [ ] 오늘의 작업 목록 파악

---

## 🎯 작업 시작 명령어

**모든 준비가 완료되었다면**:

```
"DAILY_WORK_PREP_GUIDE를 따라 [A팀/B팀/C팀] 작업을 시작합니다."
```

**또는**:

```
"MORNING_BRIEFING_TEMPLATE의 [A팀/B팀/C팀] 섹션을 확인하고 작업을 시작합니다."
```

---

**이 문서를 읽었다면, 이제 MORNING_BRIEFING_TEMPLATE.md로 이동하세요!**

**다음 문서**: [MORNING_BRIEFING_TEMPLATE.md](./MORNING_BRIEFING_TEMPLATE.md)

---

**작성일**: 2025-11-23 (일요일)
**버전**: v1.0
**대상**: 전체 팀 (A/B/C)
