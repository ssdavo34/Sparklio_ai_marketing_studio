# Team A (Docs & Architecture) 작업 지시서

**최초 작성**: 2025-11-14 (금요일) 16:15
**최종 수정**: 2025-11-14 (금요일) 16:15
**대상 기간**: 2025-11-14 ~ 2026-02-11 (90일)
**담당**: Docs & Architecture Team

---

## 🎯 Team A의 역할

Team A는 **프로젝트의 두뇌이자 교통정리자**입니다.

### 핵심 책임
1. **문서 관리**: 모든 PHASE0, PRD, API Contracts 문서의 Single Source of Truth 유지
2. **아키텍처 검증**: Team B/C의 구현이 설계 문서와 일치하는지 검증
3. **팀 간 조율**: API Contract 충돌, 의존성 문제 해결
4. **규정 집행**: `WORK_REGULATIONS.md` 준수 여부 확인
5. **Mac mini 서버 관리**: 주간 통합 후 서버 배포 (woosun@100.123.51.5)

---

## 📋 작업 범위

### P0 (1주 이내 - 2025-11-14 ~ 2025-11-21)

#### 1. Model Catalog 통일 ✅ 최우선
- **목표**: `Sparklio_V4_PRD_Final.md` + `V4.4_PRD` + `LLM_ROUTER_POLICY.md` 완전 통합
- **작업 내용**:
  - VEo3, AnimateDiff, ComfyUI 신규 모델 추가
  - GPT-4.1, GPT-4-Turbo 누락 복원
  - 비용 단가 통일 (LLM_ROUTER_POLICY.md 기준)
  - 통합 Model Catalog 표 작성
- **산출물**:
  - `docs/PRD/Sparklio_V4_PRD_Final.md` (업데이트)
  - `docs/PHASE0/LLM_ROUTER_POLICY.md` (업데이트)
- **예상 소요**: 2시간

#### 2. Agent 목록 통일 ✅ 최우선
- **목표**: V4.4 PRD에 24개 에이전트 전체 반영
- **작업 내용**:
  - Creation Agents (9개) 명시
  - Intelligence Agents (11개) 추가
  - System Agents (4개) 추가
  - AGENTS_SPEC.md와 100% 일치 확인
- **산출물**:
  - `docs/V4.4_PRD.md` Section 6 업데이트
- **예상 소요**: 1.5시간

#### 3. PPC Ads 섹션 기존 PRD 반영 ✅ 최우선
- **목표**: V4.4의 PPC Ads 내용을 Sparklio_V4_PRD_Final.md에 편입
- **작업 내용**:
  - Section 8.1 전체 블록 추가
  - 입력/처리/출력/API 계약 명시
  - Google Ads, Naver, Kakao 연동 명시
- **산출물**:
  - `docs/PRD/Sparklio_V4_PRD_Final.md` Section 8 업데이트
- **예상 소요**: 2시간

---

### P1 (2주 이내 - 2025-11-22 ~ 2025-12-05)

#### 4. VIDEO_PIPELINE_SPEC.md 작성
- **목표**: 영상 생성 파이프라인 전체 명세 문서화
- **작업 내용**:
  - VEo3, AnimateDiff, Sora2, Runway Gen-3 통합 구조
  - ScenePlannerAgent → VideoDirectorAgent → FFmpeg 플로우
  - API 계약 (입력/출력 스키마)
  - Mermaid 시퀀스 다이어그램
- **산출물**:
  - `docs/PHASE0/VIDEO_PIPELINE_SPEC.md` (신규)
- **예상 소요**: 4시간

#### 5. COMFYUI_INTEGRATION.md 작성
- **목표**: ComfyUI 로컬 이미지 생성 스택 명세
- **작업 내용**:
  - ComfyUI 서버 설정
  - Workflow JSON 템플릿
  - LoRA/ControlNet 관리
  - Brand Color Adapter
  - Multi-Ratio Output (1:1, 4:5, 9:16, 16:9)
- **산출물**:
  - `docs/PHASE0/COMFYUI_INTEGRATION.md` (신규)
- **예상 소요**: 3시간

#### 6. MEETING_AI_SPEC.md 작성
- **목표**: 음성/영상 회의 AI 명세
- **작업 내용**:
  - WebRTC 실시간 스트림 / 파일 업로드
  - Whisper STT + Pyannote Diarization
  - GPT-4o 요약 + Action Items 추출
  - Notion/Asana 연동
- **산출물**:
  - `docs/PHASE0/MEETING_AI_SPEC.md` (신규)
- **예상 소요**: 3시간

#### 7. ONE_PAGE_EDITOR_SPEC.md Section 9.2 확장
- **목표**: Video Studio Editor UI/기능 상세화
- **작업 내용**:
  - Timeline UI 구조
  - Action Types (clip/trim/split/transition/effect/audio 등)
  - WebSocket 이벤트
  - Editor Agent 연동
- **산출물**:
  - `docs/PHASE0/ONE_PAGE_EDITOR_SPEC.md` Section 9.2 업데이트
- **예상 소요**: 2시간

---

### P2 (4주 이내 - 2025-12-06 ~ 2026-01-02)

#### 8. BRAND_LEARNING_ENGINE.md 재학습 트리거 추가
- **목표**: 자동/수동 재학습 조건 명시
- **작업 내용**:
  - 자동 트리거 (성과 하락 30%, 50개 콘텐츠 누적 등)
  - 수동 트리거 (사용자 요청, 브랜드 가이드 변경)
  - 재학습 프로세스 5단계
- **산출물**:
  - `docs/PHASE0/BRAND_LEARNING_ENGINE.md` 업데이트
- **예상 소요**: 2시간

#### 9. TECH_DECISION_v1.md Multi-Node Orchestration 상세화
- **목표**: 3-Node 인프라 라우팅/Failover 로직
- **작업 내용**:
  - Desktop GPU (고성능 우선)
  - Laptop (경량 모델)
  - Mac mini (24/7 서버)
  - 헬스체크 + Offline 대체 전략
- **산출물**:
  - `docs/PHASE0/TECH_DECISION_v1.md` 업데이트
- **예상 소요**: 3시간

#### 10. LLM_ROUTER_POLICY.md 비용 추적 로직 확장
- **목표**: 비용 계산식 + 임계값 제어 + 대체 제안
- **작업 내용**:
  - LLM/이미지/영상 비용 계산 공식
  - 예산 임계값 ($1/$5/$20)
  - 대체 모델 제안 알고리즘
- **산출물**:
  - `docs/PHASE0/LLM_ROUTER_POLICY.md` Section 7.5 추가
- **예상 소요**: 2시간

---

## 🔄 일일 작업 루틴

### 매일 오전 (09:00 - 09:30)
1. **시간 확인**
   ```bash
   powershell -Command "Get-Date -Format 'yyyy-MM-dd (dddd) HH:mm:ss'"
   ```

2. **필독 문서 확인** (규정 12)
   - `docs/WORK_REGULATIONS.md`
   - `docs/API_CONTRACTS/changelog.md`
   - `docs/WORK_PLANS/MASTER_TODO.md`
   - `docs/WORK_REPORTS/[어제날짜]_Team_A_Report.md`
   - `docs/WORK_PLANS/NEXT_DAY/[오늘날짜]_Team_A_Plan.md`
   - `docs/WORK_PLANS/DETAILED_WORK_PLAN.md`

3. **Team B/C 업데이트 확인**
   ```bash
   cd K:\sparklio_ai_marketing_studio
   git status
   ```

4. **작업 시작 체크리스트 작성**

### 작업 중 (수시)
- 작업 단위 완료 시 즉시 Git 커밋 (규정 7)
- API Contract 변경 시 Team B/C에게 알림
- 문서 수정 시 날짜/시간 업데이트 (규정 1)

### 매일 저녁 (18:00 - 18:30)
1. **작업 보고서 작성**
   - `docs/WORK_REPORTS/[오늘날짜]_Team_A_Report.md`
   - DAILY_REPORT_TEMPLATE.md 참조

2. **익일 작업 계획서 작성** (규정 11)
   - `docs/WORK_PLANS/NEXT_DAY/[내일날짜]_Team_A_Plan.md`
   - NEXT_DAY_PLAN_TEMPLATE.md 참조

3. **Git 커밋 & 마감**
   ```bash
   git add docs/
   git commit -m "[2025-11-14 18:30] docs: Team A 작업 보고서 및 익일 계획서"
   git push origin docs/phase0-completion
   ```

---

## 📅 주간 작업 루틴

### 매주 금요일 (통합의 날)

#### 오전 (09:00 - 12:00): 문서 최종 검토
- P0/P1/P2 문서 진행 상황 점검
- Team B/C 작업 반영 여부 확인

#### 오후 (14:00 - 17:00): 코드 통합
```bash
cd K:\sparklio_ai_marketing_studio
git checkout main

# 각 팀 브랜치 merge
git merge docs/phase0-completion
git merge feature/backend-core
git merge feature/frontend-ui

# 충돌 해결 (있을 경우)
# ...

# 통합 테스트
npm run test:integration
npm run build

# 성공 시 원격 Push
git push origin main
```

#### 저녁 (17:00 - 18:00): Mac mini 서버 배포 (규정 9, 10)
```bash
ssh woosun@100.123.51.5
cd /path/to/sparklio
git fetch origin main
git reset --hard origin/main
npm install
npm run build
pm2 restart sparklio
pm2 status

# 헬스체크
curl http://100.123.51.5:3000/health
```

#### 주말 (토요일 09:00): 다음 주 계획 수립
- MASTER_TODO.md 업데이트
- DETAILED_WORK_PLAN.md 우선순위 조정
- Team B/C 작업 지시서 업데이트 (필요 시)

---

## 🚨 에러 대응 (Team A 전용)

### API Contract 충돌 발생 시
1. Team B/C 양쪽에서 확인
2. 우선순위: **실제 구현(Team B) > 문서(Team A)**
3. 문서 업데이트 후 Team C에게 즉시 공지

### 문서 불일치 발견 시
1. `docs/WORK_REPORTS/ERROR_LOG.md`에 기록
2. 해당 문서 작성자(Team A)가 즉시 수정
3. 관련 팀에게 공지

### Mac mini 서버 장애 시 (규정 10)
```bash
# 1. 서버 상태 확인
ssh woosun@100.123.51.5
pm2 status

# 2. 로그 확인
pm2 logs sparklio --lines 100

# 3. 재시작
pm2 restart sparklio

# 4. 복구 안되면
pm2 delete sparklio
cd /path/to/sparklio
git pull origin main
npm install
npm run build
pm2 start ecosystem.config.js
```

---

## 🎯 90일 마일스톤

| 주차 | 날짜 | 목표 | 산출물 |
|------|------|------|--------|
| Week 1-2 | 11/14 - 11/27 | P0 완료 | Model Catalog, Agent 명세, PPC Ads 통합 |
| Week 3-5 | 11/28 - 12/18 | P1 완료 | VIDEO_PIPELINE, COMFYUI, MEETING_AI, Editor 확장 |
| Week 6-8 | 12/19 - 01/08 | P2 완료 | Brand Learning, Multi-Node, Cost Control |
| Week 9-11 | 01/09 - 01/29 | 전체 통합 검증 | 최종 아키텍처 검토 |
| Week 12-13 | 01/30 - 02/11 | 배포 준비 | 배포 가이드, 운영 매뉴얼 |

---

## 📝 Team A 전용 체크리스트

### 작업 시작 시
- [ ] 규정집 확인 (`WORK_REGULATIONS.md`)
- [ ] API Contracts 변경 이력 확인
- [ ] 마스터 TODO 확인
- [ ] 전일 보고서 확인
- [ ] 당일 계획서 확인

### 작업 중
- [ ] 문서 수정 시 날짜/시간 업데이트
- [ ] 한글로 작성 (기술 용어는 영문 병기)
- [ ] 작업 완료 시 즉시 Git 커밋
- [ ] SSD 기반 작업 (Pull 금지)

### 작업 종료 시
- [ ] 작업 보고서 작성
- [ ] 익일 계획서 작성
- [ ] Git 커밋 & Push
- [ ] 규정 준수 체크리스트 확인

### 주간 통합 시 (금요일)
- [ ] 문서 최종 검토
- [ ] 브랜치 통합 (`main`)
- [ ] 통합 테스트 실행
- [ ] Mac mini 서버 배포
- [ ] 다음 주 계획 수립

---

## 💬 Team B/C와의 소통 규칙

### Team B (Backend)에게
- API 설계 변경 시 **즉시 알림 요청**
- API Contract JSON 파일 작성 요청
- 구현 완료 시 문서 업데이트 요청

### Team C (Frontend)에게
- API Contract 변경 시 **즉시 공지**
- Mock 데이터 기반 선행 개발 권장
- UI/UX 변경 시 문서 반영 요청

### 소통 채널
- 긴급: Slack/Discord 즉시 멘션
- 일반: Git 커밋 메시지 + API changelog.md
- 주간: 금요일 통합 미팅

---

**Team A는 프로젝트의 Single Source of Truth입니다.**
**모든 문서는 Team A가 최종 검토하고 승인합니다.**
