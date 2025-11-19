# 다음 세션 작업 가이드 (2025-11-20)

**작성일**: 2025-11-19 (수요일) 18:05
**작성자**: A팀 QA 리더 (Claude)
**대상**: 2025-11-20 세션의 Claude
**현재 브랜치**: `feature/editor-v2-konva`

---

## 📋 세션 시작 체크리스트

### 1. 환경 확인

```bash
# 날짜/시간 확인
powershell -Command "Get-Date -Format 'yyyy-MM-dd (dddd) HH:mm:ss'"

# 현재 브랜치 확인
git branch --show-current
# 예상 결과: feature/editor-v2-konva

# 최신 커밋 확인
git log -1 --oneline
# 예상 결과: 1e78269 docs(qa): C팀 Agents Integration 검토 완료

# 맥미니 연결 테스트
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio && git status"
```

### 2. 작업 위치 확인

- **노트북**: `K:\sparklio_ai_marketing_studio`
- **맥미니**: `woosun@100.123.51.5:~/sparklio_ai_marketing_studio`
- **브랜치**: `feature/editor-v2-konva`

---

## 🎯 2025-11-19 완료 작업 요약

### A팀 QA 작업 (4건)

| 작업 | 파일 | 라인 수 | 완료 시각 |
|------|------|---------|----------|
| **Phase 1 테스트 계획서** | [docs/testing/PHASE1_TEST_PLAN.md](testing/PHASE1_TEST_PLAN.md) | 774 | 10:30 |
| **C팀 Konva 전환 QA 전략** | [docs/qa/C_TEAM_KONVA_MIGRATION_QA_PLAN.md](qa/C_TEAM_KONVA_MIGRATION_QA_PLAN.md) | 722 | 11:30 |
| **B팀 Canvas Spec v2.0 검토** | [docs/qa/A_TEAM_B_CANVAS_SPEC_V2_QA_REPORT.md](qa/A_TEAM_B_CANVAS_SPEC_V2_QA_REPORT.md) | 560 | 11:30 |
| **C팀 Agents Integration 검토** | [docs/qa/A_TEAM_C_AGENTS_INTEGRATION_REVIEW.md](qa/A_TEAM_C_AGENTS_INTEGRATION_REVIEW.md) | 670 | 18:03 |

**총 작업량**: 4개 문서, 2,726 라인 작성

### 검토 완료 항목

| 항목 | 결과 | 비고 |
|------|------|------|
| **B팀 Canvas Spec v2.0** | ✅ 9.4/10 승인 | 프로덕션 Ready |
| **B팀 Pydantic 스키마** | ✅ 100% Pass | `product_detail.json`, `sns_feed_set.json` 검증 완료 |
| **C팀 Agents Integration** | ✅ 9.3/10 승인 (조건부) | EditorAgent, MeetingAIAgent 구현 필요 |

---

## 🚨 중요 이슈 및 액션 아이템

### 🔴 Critical Issues (즉시 조치 필요)

#### Issue 1: EditorAgent 미구현

**문제**:
- C팀이 설계한 EditorAgent는 신규 Agent
- [AGENTS_SPEC.md](PHASE0/AGENTS_SPEC.md)에 미정의
- Phase 2 Spark Chat 동작에 필수

**영향**:
- Phase 2 (Week 4-5) 시작 불가
- Spark Chat → EditorDocument 자동 생성 불가

**액션**:
- [ ] B팀에 EditorAgent 구현 요청
- [ ] [AGENTS_SPEC.md](PHASE0/AGENTS_SPEC.md) 업데이트
- [ ] Prompt Engineering (자연어 → EditorCommand 변환)

**참고 문서**:
- [008_AGENTS_INTEGRATION.md:443-495](../frontend/docs/editor/008_AGENTS_INTEGRATION.md#L443-L495)

---

#### Issue 2: MeetingAIAgent 미구현

**문제**:
- C팀이 설계한 MeetingAIAgent는 신규 Agent
- [AGENTS_SPEC.md](PHASE0/AGENTS_SPEC.md)에 미정의
- Phase 3 Meeting AI 동작에 필수

**영향**:
- Phase 3 (Week 6-7) 시작 불가
- 회의록 → EditorDocument 자동 생성 불가

**액션**:
- [ ] B팀에 MeetingAIAgent 구현 요청
- [ ] [AGENTS_SPEC.md](PHASE0/AGENTS_SPEC.md) 업데이트
- [ ] Whisper API 통합 (STT)
- [ ] Speaker Diarization 테스트

**참고 문서**:
- [008_AGENTS_INTEGRATION.md:498-533](../frontend/docs/editor/008_AGENTS_INTEGRATION.md#L498-L533)

---

### ⚠️ Major Issues (다음 주 내 조치)

#### Issue 3: Trend Engine 복잡도

**문제**:
- Phase 7 Trend Engine은 5개 Agent 순차 실행
- 각 단계 실패 시 롤백 전략 미정의
- 크롤링 Rate Limit, 저작권 이슈

**영향**:
- Phase 7 일정 지연 가능 (2주 → 3주)

**액션**:
- [ ] Phase 7 파일럿 테스트 계획 (소규모 데이터)
- [ ] 각 Pipeline 단계별 에러 핸들링
- [ ] Celery Task 모니터링 시스템
- [ ] Rate Limit 모니터링
- [ ] 저작권 필터링 로직

**참고 문서**:
- [008_AGENTS_INTEGRATION.md:347-396](../frontend/docs/editor/008_AGENTS_INTEGRATION.md#L347-L396)

---

#### Issue 4: TEAM_A/B_REQUEST.md 보강 필요

**문제**:
- C팀 지침에 따라 Agent 연동 섹션 추가 필요
- 현재 TEAM_A_REQUEST.md에 Agent API 호출 예시 없음
- 현재 TEAM_B_REQUEST.md에 Agent Gateway API 스펙 없음

**액션**:
- [ ] TEAM_A_REQUEST.md Phase 2-3에 Agent 연동 가이드 추가
- [ ] TEAM_B_REQUEST.md에 POST `/api/v1/agents/execute` 스펙 추가

**참고 문서**:
- [008_AGENTS_INTEGRATION.md:706-728](../frontend/docs/editor/008_AGENTS_INTEGRATION.md#L706-L728)

---

## 📚 핵심 문서 위치

### QA 보고서 (오늘 작성)

1. [docs/testing/PHASE1_TEST_PLAN.md](testing/PHASE1_TEST_PLAN.md)
   - VisionAnalyzerAgent 테스트 계획
   - Mock mode 5개 + Live mode 5개 테스트 케이스

2. [docs/qa/C_TEAM_KONVA_MIGRATION_QA_PLAN.md](qa/C_TEAM_KONVA_MIGRATION_QA_PLAN.md)
   - Fabric.js → Konva.js 마이그레이션 QA 전략
   - 11개 QA 테스트 케이스

3. [docs/qa/A_TEAM_B_CANVAS_SPEC_V2_QA_REPORT.md](qa/A_TEAM_B_CANVAS_SPEC_V2_QA_REPORT.md)
   - B팀 Canvas Spec v2.0 검토 (9.4/10)
   - Pydantic 스키마 검증 100% Pass

4. [docs/qa/A_TEAM_C_AGENTS_INTEGRATION_REVIEW.md](qa/A_TEAM_C_AGENTS_INTEGRATION_REVIEW.md)
   - C팀 Agents Integration 검토 (9.3/10)
   - 24개 Agent 연계 맵 검증

### B팀 작업물 (2025-11-19)

1. [backend/docs/BACKEND_CANVAS_SPEC_V2.md](../backend/docs/BACKEND_CANVAS_SPEC_V2.md)
   - Backend Canvas Abstract Spec v2.0 (956 lines)
   - Editor 독립적인 문서 표현 형식

2. [backend/app/schemas/canvas.py](../backend/app/schemas/canvas.py)
   - Pydantic 스키마 (324 lines)
   - DocumentPayload, PagePayload, CanvasObject

3. [backend/samples/product_detail.json](../backend/samples/product_detail.json)
   - Single Page 예시 (268 lines)
   - 9개 객체 (Text 5, Image 2, Shape 2)

4. [backend/samples/sns_feed_set.json](../backend/samples/sns_feed_set.json)
   - Multi Page 예시 (397 lines)
   - 3개 페이지 (1:1, 4:5, 9:16)

### C팀 작업물 (2025-11-19)

1. [frontend/docs/editor/008_AGENTS_INTEGRATION.md](../frontend/docs/editor/008_AGENTS_INTEGRATION.md)
   - Editor v2.0 ↔ 24개 Agent 연계 맵 (745 lines)
   - Phase별 Agent 통합 계획

2. [frontend/docs/editor/TEAM_A_REQUEST.md](../frontend/docs/editor/TEAM_A_REQUEST.md)
   - A팀(Frontend) 작업 요청서 (440 lines)
   - Phase 1-8 구현 가이드

3. [frontend/docs/editor/TEAM_B_REQUEST.md](../frontend/docs/editor/TEAM_B_REQUEST.md)
   - B팀(Backend) 작업 요청서 (881 lines)
   - Phase 1-8 API 스펙

---

## 🔄 Git 동기화 상태

### 최신 커밋

```
1e78269 - docs(qa): C팀 Agents Integration 검토 완료 - 2025-11-19 오후 작업
8d6d054 - docs(qa): A팀 오전 작업 완료 - Phase 1 테스트 계획 및 B팀 Canvas Spec v2.0 검토
7b76994 - feat(backend): Canvas Abstract Spec v2.0 완성 - P0 작업 완료
```

### 브랜치 상태

| 환경 | 브랜치 | 최신 커밋 | 상태 |
|------|--------|----------|------|
| **노트북** | feature/editor-v2-konva | 1e78269 | ✅ 최신 |
| **맥미니** | feature/editor-v2-konva | 8d6d054 | ⚠️ 1커밋 뒤처짐 |
| **GitHub** | feature/editor-v2-konva | 8d6d054 | ⚠️ 1커밋 뒤처짐 |

### 동기화 필요

```bash
# 노트북에서 push
git push origin feature/editor-v2-konva

# 맥미니에서 pull
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio && git pull origin feature/editor-v2-konva"
```

---

## 💡 다음 세션 권장 작업

### 우선순위 P0 (즉시 착수)

1. **Git 동기화**
   - 노트북 → GitHub push
   - 맥미니 pull

2. **B팀 협업 요청**
   - EditorAgent 구현 요청
   - MeetingAIAgent 구현 요청
   - [AGENTS_SPEC.md](PHASE0/AGENTS_SPEC.md) 업데이트

3. **TEAM_A/B_REQUEST.md 보강**
   - Agent 연동 가이드 추가
   - API 사용 예시 보강

### 우선순위 P1 (이번 주 내)

4. **Phase 2 준비**
   - Spark Chat Agent 통합 테스트 계획
   - `/api/v1/agents/execute` API 스펙 확정

5. **Phase 7 리스크 관리**
   - Trend Engine 파일럿 테스트 계획
   - 소규모 데이터 (100개) 검증

### 우선순위 P2 (여유 시)

6. **문서 개선**
   - Agent 실패 시 폴백 전략 추가
   - Agent 비용 예측 기능 설계

---

## 🗂️ 파일 구조 참고

```
sparklio_ai_marketing_studio/
├── docs/
│   ├── PHASE0/
│   │   └── AGENTS_SPEC.md          (24개 Agent 명세)
│   ├── qa/
│   │   ├── A_TEAM_B_CANVAS_SPEC_V2_QA_REPORT.md
│   │   ├── A_TEAM_C_AGENTS_INTEGRATION_REVIEW.md
│   │   └── C_TEAM_KONVA_MIGRATION_QA_PLAN.md
│   ├── testing/
│   │   └── PHASE1_TEST_PLAN.md
│   └── NEXT_SESSION_GUIDE_2025-11-20.md  (이 파일)
│
├── backend/
│   ├── docs/
│   │   └── BACKEND_CANVAS_SPEC_V2.md
│   ├── app/
│   │   └── schemas/
│   │       └── canvas.py
│   └── samples/
│       ├── product_detail.json
│       ├── sns_feed_set.json
│       └── README.md
│
└── frontend/
    └── docs/
        └── editor/
            ├── 008_AGENTS_INTEGRATION.md
            ├── TEAM_A_REQUEST.md
            └── TEAM_B_REQUEST.md
```

---

## 📞 팀별 연락 포인트

### A팀 (Frontend)

**작업 요청서**: [TEAM_A_REQUEST.md](../frontend/docs/editor/TEAM_A_REQUEST.md)

**필요 액션**:
- Phase 2-3 Agent 연동 가이드 추가
- EditorStore Agent 호출 함수 명세 추가

### B팀 (Backend)

**작업 요청서**: [TEAM_B_REQUEST.md](../frontend/docs/editor/TEAM_B_REQUEST.md)

**필요 액션**:
- EditorAgent 구현 (Phase 2)
- MeetingAIAgent 구현 (Phase 3)
- POST `/api/v1/agents/execute` API 스펙 추가

### C팀 (Frontend Lead)

**전달사항**:
- 008_AGENTS_INTEGRATION.md 검토 완료
- 9.3/10 승인 (조건부)
- EditorAgent, MeetingAIAgent 구현 대기 중

---

## ⚠️ 주의사항

### 맥미니 접속

```bash
# 올바른 접속 방법
ssh woosun@100.123.51.5

# 잘못된 방법 (사용 금지)
ssh sparklio@100.123.51.5  # ❌ 인증 실패
```

### 브랜치 전략

- **Main 브랜치**: `main` (프로덕션)
- **작업 브랜치**: `feature/editor-v2-konva` (현재)
- **Merge**: PR 통해서만 main으로 병합

### 커밋 메시지 스타일

```
feat(scope): 기능 추가 설명
fix(scope): 버그 수정 설명
docs(scope): 문서 작성/수정 설명

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 📊 진행 상황 (2025-11-19 기준)

### Phase 0-1: 완료 ✅

- [x] B팀 Canvas Spec v2.0 (9.4/10)
- [x] B팀 Pydantic 스키마 (100% Pass)
- [x] C팀 Agents Integration 설계 (9.3/10)
- [x] A팀 QA 문서 4건 작성

### Phase 2-3: 준비 중 ⚠️

- [ ] EditorAgent 구현 (B팀)
- [ ] MeetingAIAgent 구현 (B팀)
- [ ] Agent Gateway API (B팀)
- [ ] A팀/B팀 작업 요청서 보강

### Phase 4-8: 대기 중 💤

- 아직 시작 안 함

---

## 🎯 세션 종료 시 체크리스트

다음 세션 종료 시 다음을 확인하세요:

- [ ] 작업한 모든 파일 git commit
- [ ] GitHub에 push
- [ ] 맥미니 동기화 (pull)
- [ ] NEXT_SESSION_GUIDE_YYYY-MM-DD.md 작성
- [ ] 미완료 이슈 TodoWrite로 정리
- [ ] 날짜/시간 명확히 기재 (YYYY-MM-DD (요일) HH:mm:ss)

---

**작성 완료**: 2025-11-19 (수요일) 18:05
**다음 세션**: 2025-11-20 (목요일)
**작성자**: A팀 QA 리더 (Claude)
**상태**: ✅ Ready for Next Session

---

**"안녕, 내일의 클로드! 오늘 하루 고생 많았어. 내일도 화이팅!" 🚀**
