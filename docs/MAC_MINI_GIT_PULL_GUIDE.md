# Mac mini Git Pull 가이드

**일시**: 2025-11-16 (일) 23:59
**대상**: Mac mini (100.123.51.5)

---

## 🚨 중요: Mac mini에서 실행 필요

현재 Windows 환경에서 Mac mini에 원격 접근이 불가능합니다.
Mac mini에 직접 접속하여 아래 명령어를 실행해주세요.

---

## 📋 실행 명령어

### 1. Mac mini에 접속
```bash
ssh user@100.123.51.5
# 또는 Mac mini에 직접 로그인
```

### 2. 프로젝트 디렉토리로 이동
```bash
cd K:\sparklio_ai_marketing_studio
# 또는 Mac mini의 실제 경로
```

### 3. Git Pull 실행
```bash
git pull origin master
```

**예상 출력**:
```
Updating f6f04ed..c6f3a36
Fast-forward
 15 files changed, 4565 insertions(+), 51 deletions(-)
 create mode 100644 backend/test_llm_gateway_correct.py
 create mode 100644 backend/test_llm_gateway_fixed.py
 create mode 100644 backend/test_media_gateway_edge_cases.py
 create mode 100644 docs/NEXT_DAY_WORK_ORDER_2025-11-17.md
 create mode 100644 docs/reports/2025-11-17_HANDOFF_NOTES.md
 create mode 100644 docs/reports/AB_TEAM_EOD_REPORT_2025-11-16.md
 create mode 100644 docs/reports/A_TEAM_PHASE1-4_VERIFICATION_REPORT.md
 create mode 100644 docs/reports/TEAM_ALL_EOD_REPORT_2025-11-16.md
 create mode 100644 frontend/BACKEND_REQUEST.md
 create mode 100644 frontend/LOGIN_INFO.md
 create mode 100644 frontend/docs/P0_PHASE1_COMPLETION_REPORT.md
 create mode 100644 frontend/store/layout-store.ts
 create mode 100644 frontend/tests/canvas-phase3-test-plan.md
```

### 4. 확인
```bash
git log --oneline -5
```

**예상 출력**:
```
c6f3a36 docs(teams): EOD 2025-11-16 - 전체 팀 작업 완료 및 내일 준비
a9cc9c2 docs(canvas): Canvas Studio EOD Report 2025-11-16
2c29dd8 feat(canvas): 반응형 뷰포트, 스크롤, Pan 및 ZoomToFit 구현
c45b505 feat(agents): Phase 2-1 완료 - Agent Client 전체 구현
53c3be6 feat(backend): Phase 1-3 LLM Gateway 개선 및 Phase 1-4 Media Gateway 완료
```

### 5. Backend 서버 재시작 (선택)
환경 변수 변경 사항이 있는 경우:
```bash
cd backend
# 기존 서버 종료 후
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

---

## ✅ 완료 확인

- [ ] Mac mini에 접속 완료
- [ ] git pull origin master 실행
- [ ] 15개 파일 업데이트 확인
- [ ] git log로 최신 커밋 확인 (c6f3a36)
- [ ] (선택) Backend 서버 재시작

---

**작성**: 2025-11-16 (일) 23:59
