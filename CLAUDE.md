# Sparklio AI Marketing Studio - Claude 작업 규칙

> **모든 Claude 세션은 이 파일을 먼저 읽어야 합니다.**
> 이 파일은 프로젝트의 Single Source of Truth입니다.

---

## 1. 프로젝트 구조

```
K:\sparklio_ai_marketing_studio\
├── backend/                    # FastAPI 백엔드
│   ├── .env                    # 로컬 개발용 환경변수 (모든 API 키 포함)
│   ├── app/
│   │   ├── api/v1/            # API 엔드포인트
│   │   ├── models/            # SQLAlchemy 모델
│   │   ├── services/          # 비즈니스 로직
│   │   └── core/              # 설정, DB 연결
│   └── alembic/               # DB 마이그레이션
├── frontend/                   # Next.js 프론트엔드
│   ├── components/canvas-studio/  # Polotno 에디터
│   ├── hooks/                 # React Hooks
│   └── lib/                   # 유틸리티, API 클라이언트
├── docker/
│   └── mac-mini/              # Mac mini Docker 설정
│       ├── .env               # Docker 인프라용 (DB, Redis, MinIO 비밀번호)
│       └── docker-compose.yml
├── docs/                      # 문서, 보고서
├── scripts/                   # 자동화 스크립트 (신규)
└── CLAUDE.md                  # 이 파일
```

---

## 2. 환경 정보

### 2.1 서버 접속 정보

| 서버 | IP (Tailscale) | 용도 | SSH 명령 |
|------|----------------|------|----------|
| Mac mini | `100.123.51.5` | 메인 서버 (Docker) | `ssh woosun@100.123.51.5` |
| Desktop (GPU) | `100.120.180.42` | GPU 작업 (Ollama, ComfyUI) | - |

### 2.2 .env 파일 역할

| 파일 | 용도 | 수정 시기 |
|------|------|----------|
| `backend/.env` | 로컬 개발 + 모든 API 키 | API 키 추가/변경 시 |
| `docker/mac-mini/.env` | Docker 컨테이너 비밀번호 | 거의 수정 안 함 |

### 2.3 현재 API 키 상태 (2025-11-28 기준)

| API | backend/.env | Mac mini 컨테이너 | 상태 |
|-----|--------------|------------------|------|
| OpenAI | ✅ 있음 | ✅ 있음 | 정상 |
| Anthropic | ✅ 있음 | ❌ 없음 | Mac mini 추가 필요 |
| Google Gemini | ✅ 있음 | ❌ 미확인 | 확인 필요 |
| Unsplash | ❌ 없음 | ❌ 없음 | **추가 필요** |

---

## 3. Mac mini 작업 규칙

### 3.1 SSH 접속
```bash
# 올바른 방법
ssh woosun@100.123.51.5

# 틀린 방법 (사용 금지)
ssh macmini
ssh root@100.123.51.5
```

### 3.2 SSH 키 인증 (비밀번호 불필요)
```bash
# SSH 키가 설정되어 있어 비밀번호 없이 접속 가능
# 이 Windows 시스템의 SSH 키:
#   - C:\Users\user\.ssh\id_ed25519
#   - C:\Users\user\.ssh\id_rsa
# Mac Mini의 ~/.ssh/authorized_keys에 등록됨

# 테스트 (비밀번호 프롬프트 없이 작동해야 함)
ssh -o BatchMode=yes woosun@100.123.51.5 "echo 'connected'"
```

### 3.3 Docker 명령 실행
```bash
# 원격에서 Docker 명령 실행 (전체 경로 필수!)
# docker-compose는 PATH에 없으므로 /usr/local/bin/docker 사용

# 백엔드 재시작
ssh woosun@100.123.51.5 "/usr/local/bin/docker compose -f ~/sparklio_ai_marketing_studio/docker/mac-mini/docker-compose.yml restart backend"

# 상태 확인
ssh woosun@100.123.51.5 "/usr/local/bin/docker ps --filter 'name=sparklio-backend'"

# 로그 확인
ssh woosun@100.123.51.5 "/usr/local/bin/docker logs sparklio-backend --tail 100"

# 환경변수 확인
ssh woosun@100.123.51.5 "/usr/local/bin/docker exec sparklio-backend env | grep API_KEY"
```

### 3.4 PostgreSQL 접속
```bash
# 올바른 유저: sparklio
docker exec -it sparklio-postgres psql -U sparklio -d sparklio

# 틀린 유저 (사용 금지)
psql -U postgres  # 에러 발생
```

---

## 4. 코딩 규칙

### 4.1 SQLAlchemy 예약어
```python
# 사용 금지 (예약어)
metadata = Column(JSONB)  # 에러!

# 올바른 방법
extra_data = Column(JSONB)
```

### 4.2 파일 생성 전 확인
**새 파일 만들기 전에 반드시:**
1. `Glob`으로 유사한 파일이 있는지 검색
2. `Grep`으로 관련 코드가 있는지 검색
3. 기존 파일이 있으면 **수정**, 없을 때만 **생성**

### 4.3 커밋 메시지 형식
```
[YYYY-MM-DD][팀] type: 설명

예시:
[2025-11-28][B] feat: Vector DB API 추가
[2025-11-28][C] fix: CORS 에러 수정
```

---

## 5. 팀별 역할

| 팀 | 담당 | 주요 작업 폴더 |
|----|------|---------------|
| A팀 | 아키텍처, 통합 테스트 | docs/, 전체 |
| B팀 | 백엔드 API | backend/ |
| C팀 | 프론트엔드 UI | frontend/ |

---

## 6. 주요 API 엔드포인트 (2025-11-28 기준)

### 6.1 핵심 API
| 엔드포인트 | 상태 | 용도 |
|-----------|------|------|
| `/api/v1/documents` | ✅ 작동 | 문서 저장/로드 |
| `/api/v1/meetings` | ✅ 작동 | Meeting AI |
| `/api/v1/embeddings` | ✅ 작동 | Vector DB (pgvector) |
| `/api/v1/unsplash` | ⚠️ API 키 필요 | 이미지 검색 |
| `/api/v1/media/upload` | ✅ 작동 | 파일 업로드 |

### 6.2 헬스체크
```bash
# 로컬
curl http://localhost:8000/api/v1/embeddings/health

# Mac mini
curl http://100.123.51.5:8000/api/v1/embeddings/health
```

---

## 7. 세션 종료 절차 (CRITICAL)

### 7.1 작업 종료 시 필수 체크리스트

사용자가 "작업 종료", "마무리", "끝" 등을 말하면:

```
1. [ ] Git 상태 확인 및 커밋
   git status
   git add -A && git commit -m "..."

2. [ ] Mac Mini 배포 (변경사항 있으면)
   ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio && git pull origin feature/editor-migration-polotno"
   ssh woosun@100.123.51.5 "/usr/local/bin/docker compose -f ~/sparklio_ai_marketing_studio/docker/mac-mini/docker-compose.yml restart backend"

3. [ ] SESSION_HANDOVER.md 작성/업데이트
   docs/SESSION_HANDOVER.md (최신 상태 유지)

4. [ ] 이 CLAUDE.md의 "현재 상태" 섹션 업데이트
```

### 7.2 SESSION_HANDOVER.md 작성 규칙

**위치**: `docs/SESSION_HANDOVER.md`
**목적**: 다음 Claude가 빠르게 상황 파악

**필수 포함 내용** (100줄 이내로 간결하게):
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

## 중요 명령어 (복사해서 바로 사용)
- Mac Mini 배포: `ssh woosun@100.123.51.5 "..."`
- Docker 재시작: `...`
```

### 7.3 다음 세션 시작 시 읽을 파일 순서

```
1. CLAUDE.md (이 파일) - 환경 정보, 규칙
2. docs/SESSION_HANDOVER.md - 마지막 세션 상태
3. git log --oneline -10 - 최근 커밋 확인
```

---

## 8. 자주 하는 실수 방지

### 8.1 경로 관련
```bash
# Mac mini Docker 경로
~/sparklio/docker/mac-mini/  # 올바름
~/sparklio_ai_marketing_studio/  # 틀림 (로컬 경로)
```

### 8.2 Git 관련
```bash
# 현재 브랜치 확인
git branch --show-current

# 메인 브랜치
main  # (master 아님)
```

### 8.3 API 테스트
```bash
# Mac mini API 테스트
curl http://100.123.51.5:8000/health

# 로컬 API 테스트 (Windows)
curl http://localhost:8001/health
```

---

## 9. 업데이트 이력

| 날짜 | 작성자 | 변경 내용 |
|------|--------|----------|
| 2025-11-28 | B팀 | 최초 작성, 환경 정보 정리 |

---

**이 파일은 모든 Claude 세션의 시작점입니다. 문제가 생기면 이 파일을 먼저 확인하세요.**
