# Sparklio AI Marketing Studio - Claude 작업 규칙

---

## ⚠️ 경고: 이 문서를 반드시 꼼꼼히 읽으세요

> **이 문서를 대충 읽으면 반드시 실수합니다.**
>
> 이전 Claude들이 이 문서를 대충 읽어서 발생한 문제들:
> - 이미 있는 파일을 새로 생성해서 중복 발생
> - 문서에 있는 서버 정보를 못 찾아서 서버가 없다고 함
> - 문서에 있는 경로를 무시하고 엉뚱한 경로에 코드 작성
> - 팀 역할을 무시하고 다른 팀 영역을 마음대로 수정
> - 최신 상태를 확인하지 않고 오래된 정보 기반으로 작업
> - `<ide_selection>` 내용을 현재 작업으로 착각
>
> **당신도 같은 실수를 할 수 있습니다. 천천히, 꼼꼼히 읽으세요.**

---

## 📋 목차

1. [기본 전제 & 언어 규칙](#1-기본-전제--언어-규칙)
2. [작업 준비 절차 (CRITICAL)](#2-작업-준비-절차-critical)
3. [과거 실수 사례 & 교훈](#3-과거-실수-사례--교훈)
4. [팀별 역할 & 시작 루틴](#4-팀별-역할--시작-루틴)
5. [프로젝트 구조](#5-프로젝트-구조)
6. [서버 정보](#6-서버-정보)
7. [코딩 규칙](#7-코딩-규칙)
8. [Git 규칙](#8-git-규칙)
9. [세션 종료 절차](#9-세션-종료-절차)
10. [현재 상태 (2025-11-29 기준)](#10-현재-상태-2025-11-29-기준)

---

## 1. 기본 전제 & 언어 규칙

### 1.1 이 프로젝트에서 Claude의 역할

- 이 레포에서 사용하는 Claude는 **"도구가 붙은 팀원"**이다.
  - ✅ 코드 파일을 직접 읽고·수정할 수 있고
  - ✅ shell/터미널 명령을 실행할 수 있고
  - ✅ 테스트(pytest, 스크립트 등)를 돌리고 로그를 분석할 수 있으며
  - ✅ 필요한 보고서/요약/요청서를 **직접 초안으로 작성**해야 한다.
- 즉, **"이걸 하세요"**가 아니라
  **"내가 도구로 실행하고, 결과를 요약해서 보고하고, 필요한 문서까지 쓴다"**가 기본이다.

### 1.2 언어 규칙

- **모든 보고서, 요약 보고, 요청서, 작업 지침 문서**는 **반드시 한국어로 작성**한다.
- 코드 주석, 타입 이름, 함수명은 영어 사용 가능하지만,
  **상태 보고·요약·QA결과·작업지시 등 인간이 읽는 문서는 한국어가 기본**이다.

### 1.3 수정 전 확인 규칙 (CRITICAL)

> **이전 Claude가 실수한 것 같은 코드를 발견해도, 무조건 수정하지 마세요.**

1. 정말 실수인지 **검토**한다
2. 사용자에게 **"이런 경우가 있는데 어떻게 해야 할지"** 물어본다
3. 사용자 승인 후 수정한다

---

## 2. 작업 준비 절차 (CRITICAL)

### 2.1 "작업 준비" 명령 시 필수 수행 사항

사용자가 **"작업 준비", "작업 시작", "준비해줘"** 등을 말하면 **반드시** 다음을 수행:

```
1. [ ] 이 CLAUDE.md 전체를 꼼꼼히 읽기
2. [ ] docs/SESSION_HANDOVER.md 읽기
3. [ ] git log --oneline -10 확인
4. [ ] 최신 팀별 일일 보고서 찾아서 읽기
       - C팀: frontend/docs/C_TEAM_DAILY_*.md 중 최신
       - B팀: docs/B_TEAM_DAILY_*.md 중 최신
5. [ ] 최신 커밋에서 언급된 문서 모두 읽기
6. [ ] Blocking 이슈 문서 읽기 (있으면)
7. [ ] 팀 선언하기: "이번 세션에서는 [A/B/C]팀 역할로 작업합니다."
```

### 2.2 금지 사항

- ❌ **문서 안 읽고 작업 제안하기**
- ❌ **`<ide_selection>` 내용을 현재 작업으로 가정하기** (관련성 확인 전까지 무시)
- ❌ **최신 상태 파악 전에 질문하기**
- ❌ **체크리스트 완료 전에 다른 작업 시작하기**

### 2.3 작업 준비 완료 체크리스트

다음 항목을 모두 확인했다면 작업 시작 가능:

- [ ] 현재 시간 확인 및 기록
- [ ] CLAUDE.md 전체 읽음
- [ ] SESSION_HANDOVER.md 읽음
- [ ] 최신 팀별 보고서 읽음
- [ ] git log -10 확인
- [ ] 팀 역할 선언함
- [ ] 서버 상태 정상 확인 (필요 시)
- [ ] 오늘의 작업 목록 파악

---

## 3. 과거 실수 사례 & 교훈

### 3.1 가짜 실행 / 가짜 로그 금지

**❌ 실제 사례:**
- 실제로 테스트를 돌리지 않았는데 **돌린 것처럼 로그까지 적음**
- "테스트 통과했습니다"라고 했지만, 실제로는 어떤 테스트도 실행 안 함

**✅ 올바른 방법:**
1. 테스트·명령·스크립트 실행이 필요하면 **먼저 도구로 실제 실행**
2. 도구 출력 결과를 보고, **그걸 기반으로만 요약**
3. 실행할 수 없으면 **정직하게 상태를 먼저 밝힘**

### 3.2 이미 있는 파일을 새로 만드는 문제

**❌ 실제 사례:**
- Reviewer, Strategist 등 **이미 구현된 Agent가 있는데 새로 만들었다고 서술**
- Golden Set 파일도 이미 있는데 **중복으로 생성하려 함**

**✅ 올바른 방법:**
1. 작업 시작 전, 관련 파일 존재 여부를 **먼저 Glob/Grep으로 확인**
2. 이미 있으면: "이미 존재합니다. 이번 세션에서는 다음 부분을 보강합니다: ..."
3. 없으면: "존재하지 않습니다. 신규 구현을 진행합니다."

### 3.3 팀 역할 혼동

**❌ 실제 사례:**
- B팀 세션인데 프론트엔드 경로/에디터를 마음대로 수정
- C팀 세션인데 백엔드 전체 구조를 독자적으로 리팩토링

**✅ 올바른 방법:**
1. **세션 시작 시, 자신이 어느 팀(A/B/C)인지 한 줄로 선언**
2. 기본 작업 범위는 자신의 팀 도메인에 한정
3. 다른 팀 코드를 대규모로 변경하려면 **제안 수준**으로만 작성

### 3.4 고도화/업그레이드 시 새로운 시스템 생성

**❌ 실제 사례 (2025-11-27):**
- Backend가 `ConceptAgent`를 v2.0으로 **기존 파일을 개선**했는데,
- Frontend는 **완전히 새로운 독립 시스템**을 만들어버림
  - 새로운 모드 토글 (`isConceptMode`) 추가
  - 새로운 Hook (`useConceptGenerate`) 생성
  - 새로운 View (`ConceptV1BoardView`) 중복 생성
- 결과: **기존 시스템과 단절**, 다른 컴포넌트와 연동 불가

**✅ 핵심 원칙:**
- 고도화 = **개선 (Improvement)**, 재창조 (Recreation) ❌
- 새 모드 추가 ❌ → 기존 모드 개선 ✅
- 중복 컴포넌트 생성 ❌ → 기존 컴포넌트 확장 ✅
- 독립 채널 생성 ❌ → 기존 채널 품질 향상 ✅

### 3.5 문서에 있는 정보를 못 찾는 문제

**❌ 실제 사례:**
- 이 문서에 서버 IP가 있는데 "서버 정보가 없다"고 함
- 이 문서에 SSH 명령이 있는데 "접속 방법을 모르겠다"고 함
- 경로가 명시되어 있는데 엉뚱한 경로에 파일 생성

**✅ 올바른 방법:**
- **이 문서를 꼼꼼히 읽으면 다 있음**
- 못 찾겠으면 Grep으로 검색

---

## 4. 팀별 역할 & 시작 루틴

### 4.1 팀 구성

| 팀 | 담당 | 주요 작업 폴더 |
|----|------|---------------|
| **A팀** | QA, 통합 테스트, Mac mini 서버 관리 | docs/, 전체 |
| **B팀** | 백엔드 API, Agent 구현 | backend/ |
| **C팀** | 프론트엔드 UI, Canvas Studio | frontend/ |

### 4.2 A팀 (QA & Testing) 시작 루틴

**역할**: 품질 검증, Golden Set 관리, 회귀 방지, Mac mini 서버 배포

**추가 필수 문서**:
- `docs/MAC_MINI_SERVER_GUIDELINES.md`
- `docs/REVIEWER_EVALUATION_GUIDE.md`

**시작 선언**:
```
"이번 세션에서는 A팀(QA & Testing) 역할로 Golden Set 기반 검증을 진행합니다."
```

### 4.3 B팀 (Backend) 시작 루틴

**역할**: Agent 구현/개선, Validation & Retry, Golden Set 파이프라인 유지

**추가 필수 문서**:
- `docs/SYSTEM_ARCHITECTURE.md`
- `backend/docs/AGENT_SPECIFICATIONS.md`

**시작 선언**:
```
"이번 세션에서는 B팀(Backend) 역할로 Agent/Backend 작업을 진행합니다."
```

### 4.4 C팀 (Frontend) 시작 루틴

**역할**: Canvas Studio v3 에디터, Backend 응답 렌더링, UI/UX 개선

**추가 필수 문서**:
- `frontend/docs/` 내 최신 문서
- `frontend/C_TEAM_HANDOFF.md`

**에디터 경로 규칙**:
- ✅ 메인 페이지: `/studio/v3`
- ✅ 메인 엔진 폴더: `frontend/components/canvas-studio/`
- 🚫 새 에디터 라우트 생성 금지 (`/studio/v4`, `/canvas-studio2` 등)
- 🚫 엔진 폴더 복제 금지 (`canvas-studio-v2/` 등)

**시작 선언**:
```
"이번 세션에서는 C팀(Frontend) 역할로 /studio/v3 에디터와 Agent UI를 작업합니다."
```

---

## 5. 프로젝트 구조

```
K:\sparklio_ai_marketing_studio\
├── backend/                    # FastAPI 백엔드
│   ├── .env                    # 로컬 개발용 환경변수 (모든 API 키 포함)
│   ├── app/
│   │   ├── api/v1/            # API 엔드포인트
│   │   ├── models/            # SQLAlchemy 모델
│   │   ├── services/          # 비즈니스 로직
│   │   │   └── agents/        # Agent 구현
│   │   └── core/              # 설정, DB 연결
│   └── alembic/               # DB 마이그레이션
├── frontend/                   # Next.js 프론트엔드
│   ├── components/
│   │   └── canvas-studio/     # ⭐ 메인 에디터 (수정 시 주의!)
│   ├── hooks/                 # React Hooks
│   ├── lib/                   # 유틸리티, API 클라이언트
│   └── docs/                  # C팀 문서
├── docker/
│   └── mac-mini/              # Mac mini Docker 설정
│       ├── .env               # Docker 인프라용 (DB, Redis, MinIO 비밀번호)
│       └── docker-compose.yml
├── docs/                      # 프로젝트 문서, 보고서
│   └── SESSION_HANDOVER.md    # ⭐ 세션 인수인계 (필수 확인)
└── CLAUDE.md                  # ⭐ 이 파일 (필수 확인)
```

---

## 6. 서버 정보

### 6.1 서버 목록

| 서버 | IP (Tailscale) | 용도 | 접속 방법 |
|------|----------------|------|----------|
| **Mac mini** | `100.123.51.5` | 메인 서버 (Docker, PostgreSQL, Redis, MinIO, FastAPI) | `ssh woosun@100.123.51.5` |
| **Desktop (GPU)** | `100.120.180.42` | GPU 작업 (Ollama, ComfyUI, Whisper STT) | - |
| **Laptop** | `192.168.0.101` | Frontend 개발 전용 | `localhost:3000` |

### 6.2 Mac mini SSH 접속

```bash
# ✅ 올바른 방법 (SSH 키 인증, 비밀번호 불필요)
ssh woosun@100.123.51.5

# ❌ 틀린 방법 (사용 금지)
ssh macmini
ssh root@100.123.51.5
```

### 6.3 Mac mini Docker 명령

```bash
# ⚠️ 중요: 전체 경로 필수! docker-compose는 PATH에 없음

# 백엔드 재시작
ssh woosun@100.123.51.5 "/usr/local/bin/docker compose -f ~/sparklio_ai_marketing_studio/docker/mac-mini/docker-compose.yml restart backend"

# 상태 확인
ssh woosun@100.123.51.5 "/usr/local/bin/docker ps --filter 'name=sparklio-backend'"

# 로그 확인
ssh woosun@100.123.51.5 "/usr/local/bin/docker logs sparklio-backend --tail 100"

# Git Pull (원격 실행)
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio && git pull origin feature/editor-migration-polotno"
```

### 6.4 API 엔드포인트

| 엔드포인트 | 상태 | 용도 |
|-----------|------|------|
| `/api/v1/documents` | ✅ 작동 | 문서 저장/로드 |
| `/api/v1/meetings` | ✅ 작동 | Meeting AI |
| `/api/v1/embeddings` | ✅ 작동 | Vector DB (pgvector) |
| `/api/v1/concepts` | ✅ 작동 | ConceptAgent |
| `/api/v1/media/upload` | ✅ 작동 | 파일 업로드 |
| `/api/v1/unsplash` | ⚠️ API 키 필요 | 이미지 검색 |

### 6.5 헬스체크

```bash
# Mac mini Backend
curl http://100.123.51.5:8000/health

# 로컬 Backend (Windows)
curl http://localhost:8000/health

# GPU 서버 Ollama
curl http://100.120.180.42:11434/api/tags

# GPU 서버 Whisper
curl http://100.120.180.42:9000/health
```

---

## 7. 코딩 규칙

### 7.1 파일 생성 전 확인 (필수)

**새 파일 만들기 전에 반드시:**
1. `Glob`으로 유사한 파일이 있는지 검색
2. `Grep`으로 관련 코드가 있는지 검색
3. 기존 파일이 있으면 **수정**, 없을 때만 **생성**

### 7.2 SQLAlchemy 예약어

```python
# ❌ 사용 금지 (예약어)
metadata = Column(JSONB)  # 에러!

# ✅ 올바른 방법
extra_data = Column(JSONB)
```

### 7.3 .env 파일 역할

| 파일 | 용도 | 수정 시기 |
|------|------|----------|
| `backend/.env` | 로컬 개발 + 모든 API 키 | API 키 추가/변경 시 |
| `docker/mac-mini/.env` | Docker 컨테이너 비밀번호 | 거의 수정 안 함 |

---

## 8. Git 규칙

### 8.1 금지 사항

```bash
# ❌ 절대 금지
git pull origin main
```
**이유**: K: 드라이브가 Single Source of Truth. Pull하면 충돌 발생.

### 8.2 커밋 메시지 형식

```bash
[YYYY-MM-DD][팀] type: 설명

# 예시
[2025-11-29][B] feat: Vector DB API 추가
[2025-11-29][C] fix: CORS 에러 수정
[2025-11-29][A] docs: 테스트 결과 보고서 작성
```

### 8.3 현재 브랜치

```bash
# 현재 작업 브랜치
feature/editor-migration-polotno

# 메인 브랜치 (master 아님!)
main
```

---

## 9. 세션 종료 절차

### 9.1 작업 종료 시 필수 체크리스트

사용자가 "작업 종료", "마무리", "끝" 등을 말하면:

```
1. [ ] Git 상태 확인 및 커밋
   git status
   git add -A && git commit -m "[날짜][팀] ..."

2. [ ] Mac Mini 배포 (변경사항 있으면)
   ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio && git pull origin feature/editor-migration-polotno"
   ssh woosun@100.123.51.5 "/usr/local/bin/docker compose -f ~/sparklio_ai_marketing_studio/docker/mac-mini/docker-compose.yml restart backend"

3. [ ] SESSION_HANDOVER.md 작성/업데이트

4. [ ] 팀별 일일 보고서 작성
   - B팀: docs/B_TEAM_DAILY_BACKEND_REPORT_YYYY-MM-DD.md
   - C팀: frontend/docs/C_TEAM_DAILY_FRONTEND_REPORT_YYYY-MM-DD.md
```

### 9.2 SESSION_HANDOVER.md 작성 규칙

**위치**: `docs/SESSION_HANDOVER.md`
**목적**: 다음 Claude가 빠르게 상황 파악

**필수 포함 내용**:
```markdown
# 세션 인수인계 (YYYY-MM-DD HH:MM 기준)

## 현재 상태
- 브랜치: feature/editor-migration-polotno
- 최신 커밋: [해시] [메시지]
- Mac Mini 배포: ✅/❌

## 오늘 완료한 작업
1. [작업1]
2. [작업2]

## 진행 중인 작업 (있으면)
- [작업]: [현재 상태]

## 알려진 이슈
- [이슈1]: [상태]

## 다음 작업 우선순위
1. [P0] [작업]
2. [P1] [작업]
```

---

## 10. 현재 상태 (2025-11-29 기준)

### 10.1 Blocking 이슈

| 이슈 | 상태 | 담당 | 문서 |
|------|------|------|------|
| CORS - `localhost:3001` 미허용 | 🔴 차단 | B팀 | `frontend/docs/BACKEND_CORS_ISSUE_2025-11-28.md` |
| Nano Banana Provider 버그 | ⚠️ 수정됨 (도커 미반영) | B팀 | `frontend/docs/BACKEND_BUG_REPORT_2025-11-28.md` |

### 10.2 최근 완료 작업 (2025-11-28)

**B팀:**
- 에이전트 고도화 P0 - Plan-Act-Reflect 패턴 적용
- 신규 에이전트 6개 생성 (VisionGeneratorAgent 등)
- NanoBanana Provider 버그 수정

**C팀:**
- VisionGeneratorAgent 완전 통합 (2,500+ lines)
- Image LLM UI 추가 (RightDock에 섹션 추가)
- 7개 문서 작성

### 10.3 다음 작업 우선순위

**C팀:**
1. [P0] CORS 해결 후 End-to-End 테스트
2. [P1] 테스트 결과 문서화
3. [P2] V3 Layout 구현 (V3_LAYOUT_SPECIFICATION.md 참고)

**B팀:**
1. [P0] CORS에 `localhost:3001` 추가
2. [P0] Mac mini Docker 재시작 (Nano Banana 수정 반영)
3. [P1] 나머지 에이전트 Plan-Act-Reflect 적용

### 10.4 API 키 상태

| API | backend/.env | Mac mini 컨테이너 | 상태 |
|-----|--------------|------------------|------|
| OpenAI | ✅ 있음 | ✅ 있음 | 정상 |
| Anthropic | ✅ 있음 | ❌ 없음 | Mac mini 추가 필요 |
| Google Gemini | ✅ 있음 | ❌ 미확인 | 확인 필요 |
| Unsplash | ❌ 없음 | ❌ 없음 | 추가 필요 |

---

## 📞 긴급 상황 대응

### Mac mini 서버 다운

```bash
# 1. SSH 접속 확인
ssh woosun@100.123.51.5 "echo OK"

# 2. Docker 상태 확인
ssh woosun@100.123.51.5 "/usr/local/bin/docker ps"

# 3. Backend 재시작
ssh woosun@100.123.51.5 "/usr/local/bin/docker compose -f ~/sparklio_ai_marketing_studio/docker/mac-mini/docker-compose.yml restart backend"

# 4. 상태 확인
curl http://100.123.51.5:8000/health
```

---

## 업데이트 이력

| 날짜 | 작성자 | 변경 내용 |
|------|--------|----------|
| 2025-11-28 | B팀 | 최초 작성 |
| 2025-11-29 | C팀 | README_FIRST.md 통합, 실수 사례 추가, 현재 상태 업데이트 |

---

**이 문서를 다 읽었다면, 이제 `docs/SESSION_HANDOVER.md`를 확인하고 작업을 시작하세요.**

**그리고 기억하세요: 열심히 하는 건 소용없습니다. 잘 해야 합니다. 완벽하게.**
