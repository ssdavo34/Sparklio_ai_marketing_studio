# Mac mini 서버 관리 가이드라인

**작성일**: 2025-11-16
**버전**: v1.0
**적용 대상**: 전체 팀 (A팀, B팀, C팀)
**중요도**: ⚠️ **필수 준수사항**

---

## 1. Mac mini 서버 정보

### 1.1 서버 스펙
- **호스트명**: Mac mini (Tailscale 네트워크)
- **IP 주소**: 100.123.51.5
- **SSH 계정**: woosun
- **운영 환경**: macOS
- **역할**: Backend API 서버, PostgreSQL, MinIO, Redis

### 1.2 접속 방법 ⚠️ **중요**

**올바른 접속 방법:**
```bash
# SSH 접속
ssh woosun@100.123.51.5

# 원격 명령 실행 예시
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/backend && git log -1"
```

**잘못된 접속 방법 (작동하지 않음):**
```bash
# ❌ 계정명 없이 호출
ssh 100.123.51.5

# ❌ 호스트명으로 호출
ssh mac-mini

# ❌ 별칭으로 호출
ssh macmini
```

**⚠️ 주의:**
- 반드시 `woosun@100.123.51.5` 형식으로만 접속해야 합니다
- 다른 형식은 모두 실패합니다

### 1.3 RTX Desktop (Whisper STT 서버)

- **호스트명**: RTX Desktop (Tailscale 네트워크)
- **IP 주소**: 100.120.180.42
- **포트**: 9000
- **역할**: Faster-Whisper STT 서버 (Meeting AI Transcriber)
- **GPU**: NVIDIA GeForce RTX 4070 SUPER (12GB VRAM)
- **모델**: Systran/faster-distil-whisper-large-v3

**엔드포인트:**
```bash
# 서버 상태 확인
curl http://100.120.180.42:9000/

# Health Check
curl http://100.120.180.42:9000/health

# 음성 → 텍스트 변환 (POST)
curl -X POST http://100.120.180.42:9000/transcribe \
  -F "audio_file=@recording.wav" \
  -F "model=large-v3" \
  -F "language=auto"

# API 문서 확인
curl http://100.120.180.42:9000/docs
```

**상태 확인 예시:**
```json
{
  "status": "healthy",
  "gpu": "NVIDIA GeForce RTX 4070 SUPER",
  "memory": "2.4GB / 12.3GB",
  "model": "Systran/faster-distil-whisper-large-v3"
}
```

**팀별 사용 지침:**
- **A팀**: 회의 녹음 STT 품질 검증 (OpenAI vs Local 비교 테스트)
- **B팀**: TranscriberService 4-Mode 구현 및 연동 (faster-whisper client)
- **C팀**: Meeting AI Transcriber UI 렌더링 (transcript segments 표시)

**⚠️ 주의사항:**
- 서버 재시작 불가 (GPU 서버 관리는 시스템 관리자만)
- API 타임아웃 설정 필요 (긴 회의는 300초 이상 소요 가능)
- 서버 다운 시 자동으로 OpenAI fallback 사용 (hybrid_cost/hybrid_quality 모드)

---

## 2. 전체 팀 공통 규정

### 2.1 일일 작업 시작 전 체크리스트 (매일 09:00)

**모든 팀원은 작업 시작 전 다음을 확인해야 합니다:**

```bash
# 1. Mac mini 서버 상태 확인
curl http://100.123.51.5:8000/health

# 2. 로컬 Git과 원격 저장소 동기화 확인
git fetch origin
git status

# 3. Mac mini 서버의 코드 버전 확인
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio && git log -1 --oneline"

# 4. 로컬과 서버의 커밋 차이 확인
git log origin/master..HEAD --oneline  # 로컬이 앞선 커밋
git log HEAD..origin/master --oneline  # 서버가 앞선 커밋
```

**체크 항목:**
- [ ] Mac mini 서버가 정상 응답하는지 확인
- [ ] 로컬 코드와 서버 코드의 커밋 해시가 일치하는지 확인
- [ ] 동기화 문제 발견 시 즉시 담당 팀에 알림

### 2.2 일일 작업 종료 후 체크리스트 (매일 18:00)

```bash
# 1. 모든 변경사항 커밋 및 푸시
git add .
git commit -m "<팀명>: <작업 내용>"
git push origin master
```

**체크 항목:**
- [ ] 모든 변경사항을 커밋하고 원격 저장소에 푸시
- [ ] Mac mini 서버 배포 필요 여부 확인 (Backend 변경 시)
- [ ] 담당 팀에 서버 배포 요청 (필요 시)

---

## 3. 팀별 책임사항

### 3.1 A팀 (QA & Testing)

**핵심 책임: Mac mini 서버 상태 모니터링**

#### 작업 시작 전 (매일 09:00)
```bash
# 1. Backend API 엔드포인트 확인
curl http://100.123.51.5:8000/health
curl http://100.123.51.5:8000/docs  # OpenAPI 문서

# 2. 테스트 환경 설정 확인
cat .env.test | grep API_BASE_URL  # http://100.123.51.5:8000 확인
cat .env.test | grep POSTGRES_HOST  # 100.123.51.5 확인

# 3. Backend 최신 커밋 확인
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/backend && git log -1 --oneline"
```

**동기화 문제 발견 시:**
- 즉시 B팀에 알림
- Slack/이메일로 동기화 요청
- 테스트 시작 보류 (동기화 완료 후 재개)

#### 작업 종료 후 (매일 18:00)
```bash
# 1. 테스트 결과 커밋
git add docs/reports/
git commit -m "docs(A팀): 일일 테스트 결과 및 리포트"
git push origin master

# 2. B팀에 Mac mini 배포 상태 확인 요청
```

**⚠️ 중요 사례:**
- **2025-11-16 발견된 문제**: Backend API 코드가 Mac mini에 배포되지 않아 189개 테스트 모두 실패
- 원인: B팀이 로컬에서만 개발하고 Mac mini 서버에 배포하지 않음
- 해결: B팀에게 즉시 배포 요청, 동기화 후 테스트 재실행

---

### 3.2 B팀 (Backend)

**핵심 책임: Mac mini 서버에 Backend 코드 배포**

#### 작업 시작 전 (매일 09:00)
```bash
# 1. 로컬과 원격 저장소 동기화
git fetch origin
git pull origin master

# 2. Mac mini 서버 코드 상태 확인
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/backend && git status"
```

#### 코드 변경 후 배포 절차 ⚠️ **필수**

**중요: Backend 코드를 변경한 경우 반드시 Mac mini 서버에 배포해야 합니다**

```bash
# 1. 로컬 변경사항 커밋 및 푸시
git add .
git commit -m "feat(Backend): <작업 내용>"
git push origin master

# 2. Mac mini 서버에 SSH 접속하여 배포
ssh woosun@100.123.51.5

# 3. 서버에서 코드 업데이트
cd ~/sparklio_ai_marketing_studio
git pull origin master

# 4. Backend 재시작 (가상환경 활성화 후)
cd backend
source venv/bin/activate
pkill -f uvicorn  # 기존 프로세스 종료
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &

# 5. 서버 정상 작동 확인
curl http://100.123.51.5:8000/health

# 6. 로그아웃
exit
```

**체크 항목:**
- [ ] 로컬 코드를 원격 저장소에 푸시
- [ ] Mac mini 서버에서 git pull 실행
- [ ] Backend 서비스 재시작
- [ ] Health check로 정상 작동 확인
- [ ] A팀에 배포 완료 알림

#### 작업 종료 후 (매일 18:00)
```bash
# 1. 모든 변경사항 커밋 및 푸시
git add .
git commit -m "feat(Backend): <작업 내용>"
git push origin master

# 2. Mac mini 서버 배포 여부 확인
# Backend 코드 변경이 있었다면 반드시 배포 완료 상태여야 함

# 3. A팀에 배포 상태 공유
```

**⚠️ 배포 누락 방지:**
- Backend API 엔드포인트 추가/수정 시 반드시 Mac mini 서버에 배포
- 배포 없이 로컬에서만 테스트하면 A팀 테스트가 모두 실패함
- 배포 완료 후 A팀에 Slack으로 알림

---

### 3.3 C팀 (Frontend)

**핵심 책임: Backend API 엔드포인트 확인**

#### 작업 시작 전 (매일 09:00)
```bash
# 1. Backend API 문서 확인
curl http://100.123.51.5:8000/docs

# 2. 환경 변수 확인 (.env.local 또는 .env.development)
cat frontend/.env.local | grep NEXT_PUBLIC_API_URL  # http://100.123.51.5:8000 확인
```

#### Backend API 통합 시 주의사항

**API 호출 전 반드시 확인:**
```bash
# OpenAPI 스펙 확인
curl http://100.123.51.5:8000/openapi.json | jq '.paths'

# 특정 엔드포인트 테스트
curl -X POST http://100.123.51.5:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"type":"brand_kit","prompt":"테스트"}'
```

**체크 항목:**
- [ ] API 엔드포인트가 실제로 존재하는지 확인
- [ ] 요청/응답 스키마가 OpenAPI 문서와 일치하는지 확인
- [ ] 테스트 코드에서 사용하는 API가 실제 구현되었는지 확인

#### 작업 종료 후 (매일 18:00)
```bash
# 1. 모든 변경사항 커밋 및 푸시
git add .
git commit -m "feat(Frontend): <작업 내용>"
git push origin master

# 2. Backend API 변경 요청사항 B팀에 전달 (필요 시)
```

**⚠️ API 불일치 발견 시:**
- B팀에게 즉시 알림
- MODIFICATION_REQUEST_TEMPLATE.md 사용하여 요청 문서 작성
- 구현 완료 전까지 Mock 데이터 사용

---

## 4. 동기화 문제 해결 프로세스

### 4.1 문제 발견 시 즉시 조치

**증상:**
- [ ] 테스트 실패율 급증
- [ ] API 엔드포인트 404 에러
- [ ] 응답 스키마 불일치
- [ ] Health check 실패

**확인 절차:**
```bash
# 1. 서버 상태 확인
curl http://100.123.51.5:8000/health

# 2. 서버 코드 버전 확인
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio && git log -1"

# 3. 로컬 코드 버전 확인
git log -1

# 4. 차이점 확인
git log HEAD..origin/master --oneline  # 서버가 최신인지
git log origin/master..HEAD --oneline  # 로컬이 최신인지
```

### 4.2 담당 팀별 대응

| 증상 | 담당 팀 | 조치 |
|------|---------|------|
| Backend API 404 | B팀 | Mac mini 서버에 배포 |
| 테스트 실패 | A팀 | B팀에 배포 요청 |
| API 스키마 불일치 | B팀 + C팀 | 스펙 협의 후 수정 |
| 서버 다운 | A팀 | 서버 재시작, B팀에 알림 |

### 4.3 긴급 상황 대응

**서버 응답 없음:**
```bash
# 1. SSH 접속 가능 여부 확인
ssh woosun@100.123.51.5 "echo OK"

# 2. Backend 프로세스 확인
ssh woosun@100.123.51.5 "ps aux | grep uvicorn"

# 3. Backend 재시작
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/backend && source venv/bin/activate && pkill -f uvicorn && nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &"

# 4. 정상 작동 확인
sleep 5
curl http://100.123.51.5:8000/health
```

---

## 5. 자주 묻는 질문 (FAQ)

### Q1. Mac mini 서버 접속이 안 됩니다.

**A:**
```bash
# 올바른 접속 방법 확인
ssh woosun@100.123.51.5

# Tailscale VPN 연결 확인
tailscale status | grep 100.123.51.5

# 방화벽 확인
ping 100.123.51.5
```

### Q2. Backend 코드를 수정했는데 테스트가 실패합니다.

**A:**
Mac mini 서버에 배포했는지 확인하세요.
```bash
# 서버 코드 버전 확인
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/backend && git log -1 --oneline"

# 로컬 코드 버전 확인
git log -1 --oneline

# 불일치하면 서버에 배포 필요
```

### Q3. 누가 Mac mini 서버를 관리하나요?

**A:**
- **일차 책임**: B팀 (Backend 코드 배포)
- **모니터링**: A팀 (서버 상태 확인, 테스트)
- **협업**: 전체 팀 (동기화 상태 공유)

### Q4. 매일 배포해야 하나요?

**A:**
Backend 코드 변경이 있을 때만 배포하면 됩니다.
- Backend API 엔드포인트 추가/수정 시: **반드시 배포**
- 내부 로직만 수정 (엔드포인트 변경 없음): **배포 권장**
- Frontend만 변경: 배포 불필요

### Q5. 테스트 환경(.env.test)은 누가 관리하나요?

**A:**
- **작성 및 관리**: A팀
- **확인**: 전체 팀 (작업 시작 전)
- **중요 설정**:
  ```bash
  API_BASE_URL=http://100.123.51.5:8000
  POSTGRES_HOST=100.123.51.5
  ARTILLERY_TARGET=http://100.123.51.5:8000
  ```

---

## 6. 참고 문서

- **시스템 아키텍처**: [docs/SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)
- **A팀 작업지시서**: [docs/A_TEAM_QA_WORK_ORDER.md](A_TEAM_QA_WORK_ORDER.md)
- **B팀 작업지시서**: [docs/B_TEAM_WORK_ORDER.md](B_TEAM_WORK_ORDER.md)
- **C팀 작업지시서**: [docs/C_TEAM_WORK_ORDER.md](C_TEAM_WORK_ORDER.md)
- **수정 요청 템플릿**: [docs/templates/MODIFICATION_REQUEST_TEMPLATE.md](templates/MODIFICATION_REQUEST_TEMPLATE.md)

---

**작성 완료일**: 2025-11-16
**버전**: v1.0
**다음 액션**: 전체 팀 공유, 일일 체크리스트 준수

**⚠️ 이 가이드라인은 필수 준수사항입니다.**
