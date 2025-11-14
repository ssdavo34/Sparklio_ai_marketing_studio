# Sparklio AI Marketing Studio - 상세 작업 계획서

**최초 작성**: 2025-11-14 (금요일) 16:17
**최종 수정**: 2025-11-14 (금요일) 16:17
**프로젝트 기간**: 90일 (2025-11-14 ~ 2026-02-11)
**목표**: MVP 완성 및 배포

---

## 🎯 프로젝트 개요

### 비전
**Chat-Driven AI Marketing OS** - 대화만으로 마케팅 콘텐츠 생성부터 광고 집행까지 자동화

### 핵심 기능
1. **Smart LLM Router**: 5가지 프리셋 모드로 최적 모델 선택
2. **Multi-Agent A2A System**: 24개 에이전트 협업
3. **One-Page Editor**: Text/Image/Video 통합 편집
4. **Video Pipeline**: VEo3, AnimateDiff, Sora2 통합
5. **ComfyUI Integration**: 로컬 이미지 생성
6. **PPC Ads Publishing**: Google/Naver/Kakao 자동 집행
7. **Brand Learning Engine**: 자가 학습 시스템

### 기술 스택
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, FastAPI (Python)
- **AI**: OpenAI GPT-4o, Gemini 2.0, Claude 3.7 등
- **Video**: VEo3, AnimateDiff, FFmpeg
- **Image**: ComfyUI, DALL-E 3, SDXL
- **Infra**: 3-Node Hybrid (Desktop GPU + Laptop + Mac mini M2)

---

## 📅 90일 타임라인

### Phase 1: Foundation (Week 1-2)
**목표**: 기반 인프라 구축

#### Week 1 (2025-11-14 ~ 2025-11-20)
**Team A**:
- [ ] Model Catalog 통일 (2시간)
- [ ] Agent 목록 통일 (1.5시간)
- [ ] PPC Ads 섹션 반영 (2시간)

**Team B**:
- [ ] Smart LLM Router 구현 (12시간)
  - 5가지 프리셋 모드
  - 비용 추정 로직
  - 예산 임계값 제어

**Team C**:
- [ ] Next.js 프로젝트 셋업 (4시간)
  - TypeScript, Tailwind CSS 설정
  - 폴더 구조 구성

**주간 산출물**:
- Model Catalog 통합 완료
- Smart LLM Router API 완성
- Next.js 개발 환경 준비

---

#### Week 2 (2025-11-21 ~ 2025-11-27)
**Team A**:
- [ ] VIDEO_PIPELINE_SPEC.md (4시간)
- [ ] COMFYUI_INTEGRATION.md (3시간)
- [ ] MEETING_AI_SPEC.md (3시간)

**Team B**:
- [ ] Agent Base Class & A2A Protocol (10시간)
  - BaseAgent 클래스
  - Message Queue
  - Agent Registry
- [ ] API Contract 작성 (agents.json) (2시간)

**Team C**:
- [ ] Editor Shell & Layout (8시간)
- [ ] Chat Interface (10시간)
  - Mock 데이터 기반 선행 개발

**주간 산출물**:
- P1 스펙 문서 3개 완성
- Agent 기반 시스템 완성
- Chat Interface 프로토타입

---

### Phase 2: Core Features (Week 3-5)
**목표**: Text/Image Creation E2E 완성

#### Week 3 (2025-11-28 ~ 2025-12-04)
**Team B**:
- [ ] 9개 Creation Agents 구현 시작 (15시간)
  - StrategistAgent, CopywriterAgent
  - VisionGeneratorAgent, VisionAnalyzerAgent
  - ScenePlannerAgent

**Team C**:
- [ ] Text Editor (12시간)
  - Lexical/Tiptap 통합
  - 서식 도구
  - 자동 저장

**주간 목표**: 텍스트 생성 플로우 E2E 데모

---

#### Week 4 (2025-12-05 ~ 2025-12-11)
**Team B**:
- [ ] 9개 Creation Agents 구현 완료 (15시간)
  - StoryboardBuilderAgent, VideoDirectorAgent
  - VideoReviewerAgent, TemplateAgent

**Team C**:
- [ ] Image Editor (15시간)
  - 이미지 업로드
  - 기본 편집 (Crop, Resize)
  - AI 이미지 생성 버튼
- [ ] Review Buffer Pattern UI (8시간)

**주간 목표**: 이미지 생성 플로우 E2E 데모

---

#### Week 5 (2025-12-12 ~ 2025-12-18)
**Team A**:
- [ ] ONE_PAGE_EDITOR_SPEC.md Section 9.2 확장 (2시간)
- [ ] BRAND_LEARNING_ENGINE.md 재학습 트리거 추가 (2시간)

**Team B**:
- [ ] API Contract 작성 (video_pipeline.json, comfyui.json) (3시간)
- [ ] Video Pipeline 구현 시작 (10시간)
  - VEo3 API 연동
  - AnimateDiff 로컬 실행

**Team C**:
- [ ] Video Studio Editor 시작 (10시간)
  - Timeline UI
  - Video Player

**주간 목표**: Text/Image Creation 완전 완성

---

### Phase 3: Video & Intelligence (Week 6-8)
**목표**: Video Creation E2E 완성

#### Week 6 (2025-12-19 ~ 2025-12-25)
**Team B**:
- [ ] Video Pipeline 구현 완료 (10시간)
  - Sora2, Runway Gen-3 준비
  - FFmpeg 후처리
- [ ] ComfyUI Integration (15시간)
  - Workflow JSON 관리
  - LoRA/ControlNet 로드

**Team C**:
- [ ] Video Studio Editor 완성 (10시간)
  - Action Controls (Clip, Trim, Split 등)
  - Audio Track

**주간 목표**: 영상 생성 플로우 프로토타입

---

#### Week 7 (2025-12-26 ~ 2026-01-01)
**Team B**:
- [ ] 11개 Intelligence Agents 구현 시작 (15시간)
  - TrendCollectorAgent, DataCleanerAgent
  - EmbedderAgent, IngestorAgent
  - ReviewerAgent, PerformanceAnalyzerAgent

**Team C**:
- [ ] Meeting AI UI (12시간)
  - 음성 녹음 버튼
  - 실시간 STT 표시
  - 요약 패널

**주간 목표**: Meeting AI 프로토타입

---

#### Week 8 (2026-01-02 ~ 2026-01-08)
**Team B**:
- [ ] 11개 Intelligence Agents 구현 완료 (10시간)
  - SelfLearningAgent, BrandModelUpdaterAgent
  - RAGAgent, TrendAgent, DataCollectorAgent

**통합 테스트**:
- [ ] Text Creation E2E 테스트
- [ ] Image Creation E2E 테스트
- [ ] Video Creation E2E 테스트

**주간 목표**: Video Creation 완전 완성

---

### Phase 4: PPC Ads & Learning (Week 9-11)
**목표**: PPC 광고 자동 집행 완성

#### Week 9 (2026-01-09 ~ 2026-01-15)
**Team A**:
- [ ] TECH_DECISION_v1.md Multi-Node 상세화 (3시간)
- [ ] LLM_ROUTER_POLICY.md 비용 추적 로직 (2시간)

**Team B**:
- [ ] PPC Ads API 구현 시작 (12시간)
  - Google Ads API 연동
  - Naver 검색광고 API

**Team C**:
- [ ] PPC Ads Publishing UI 시작 (10시간)
  - 캠페인 설정 폼
  - 플랫폼 선택

**주간 목표**: PPC Ads 기본 기능 완성

---

#### Week 10 (2026-01-16 ~ 2026-01-22)
**Team B**:
- [ ] PPC Ads API 구현 완료 (8시간)
  - Kakao Moment API
  - 성과 추적 API
- [ ] Brand Learning Loop 구현 (18시간)
  - 재학습 트리거 감지
  - 브랜드 모델 업데이트

**Team C**:
- [ ] PPC Ads UI 완성 (5시간)
- [ ] Dashboard & Analytics (10시간)
  - 주요 지표 카드
  - 차트

**주간 목표**: PPC Ads Publishing 데모

---

#### Week 11 (2026-01-23 ~ 2026-01-29)
**Team B**:
- [ ] 4개 System Agents 구현 (10시간)
  - PMAgent, SecurityAgent, BudgetAgent, ADAgent

**Team C**:
- [ ] Cost Alert & Budget Control UI (8시간)
  - 비용 경고 팝업
  - 예산 설정

**통합 테스트**:
- [ ] PPC Ads E2E 테스트
- [ ] Brand Learning Loop 테스트

**주간 목표**: P2 기능 완성

---

### Phase 5: Integration & Polish (Week 12-13)
**목표**: MVP 완성 및 배포

#### Week 12 (2026-01-30 ~ 2026-02-05)
**Team B**:
- [ ] Multi-Node Orchestration (12시간)
  - 노드 헬스체크
  - 작업 분산 라우팅
  - Failover 처리
- [ ] 성능 최적화 (15시간)
  - API 응답 최적화
  - 메모리 누수 수정

**Team C**:
- [ ] UI/UX 폴리싱 (12시간)
  - 애니메이션 추가
  - 로딩 스켈레톤
  - 에러 상태 UI

**통합 테스트**:
- [ ] 전체 E2E 시나리오 테스트

---

#### Week 13 (2026-02-06 ~ 2026-02-11)
**Team A**:
- [ ] 배포 가이드 작성
- [ ] 운영 매뉴얼 작성

**Team C**:
- [ ] 온보딩 플로우 (8시간)
  - 초기 설정 마법사
  - 튜토리얼
- [ ] 반응형 & 접근성 (10시간)
  - 모바일 최적화
  - ARIA 지원

**최종 배포**:
- [ ] Mac mini 서버 프로덕션 배포
- [ ] 모니터링 설정
- [ ] 백업 시스템 구축

**주간 목표**: MVP 완성 🎉

---

## 🔄 작업 흐름

### 일일 작업 흐름

#### 오전 (09:00 - 09:30) - 작업 준비
1. 시간 확인
   ```bash
   powershell -Command "Get-Date -Format 'yyyy-MM-dd (dddd) HH:mm:ss'"
   ```

2. 필독 문서 확인 (규정 12)
   - `docs/WORK_REGULATIONS.md`
   - `docs/API_CONTRACTS/changelog.md`
   - `docs/WORK_PLANS/MASTER_TODO.md`
   - `docs/WORK_REPORTS/[어제날짜]_Team_X_Report.md`
   - `docs/WORK_PLANS/NEXT_DAY/[오늘날짜]_Team_X_Plan.md`

3. 환경 확인
   ```bash
   cd K:\sparklio_ai_marketing_studio
   git status
   npm run dev  # 또는 python manage.py runserver
   ```

#### 작업 중 (09:30 - 18:00)
- 작업 단위 완료 시 **즉시 Git 커밋** (규정 7)
- API Contract 변경 시 **즉시 Team C에게 공지** (Team B)
- Mock 데이터로 **선행 개발** (Team C)

#### 저녁 (18:00 - 18:30) - 작업 마감
1. 작업 보고서 작성
   - `docs/WORK_REPORTS/[오늘날짜]_Team_X_Report.md`

2. 익일 작업 계획서 작성 (규정 11)
   - `docs/WORK_PLANS/NEXT_DAY/[내일날짜]_Team_X_Plan.md`

3. Git 커밋 & Push
   ```bash
   git add docs/
   git commit -m "[2025-11-14 18:30] docs: 작업 보고서 및 익일 계획서"
   git push origin [branch-name]
   ```

---

### 주간 작업 흐름 (매주 금요일)

#### 오전 (09:00 - 12:00) - 테스트
- 단위 테스트 실행
- 통합 테스트 실행
- 버그 수정

#### 오후 (14:00 - 17:00) - 통합
- Team A 주도로 `main` 브랜치 merge
- 충돌 해결
- 전체 빌드 테스트
- Mac mini 서버 배포 (규정 9, 10)

#### 저녁 (17:00 - 18:00) - 계획 수립
- 다음 주 작업 계획 조정
- `MASTER_TODO.md` 업데이트
- 주간 회고

---

## 📊 성공 지표 (KPI)

### 기능 완성도
- [ ] Week 2: P0 완료 (Foundation)
- [ ] Week 5: Text/Image Creation E2E
- [ ] Week 8: Video Creation E2E
- [ ] Week 11: PPC Ads Publishing E2E
- [ ] Week 13: MVP 완성

### 코드 품질
- [ ] 테스트 커버리지 80% 이상
- [ ] 모든 API에 OpenAPI 스펙 작성
- [ ] 모든 함수에 JSDoc/TSDoc 주석
- [ ] ESLint 에러 0개

### 문서 완성도
- [ ] P0/P1/P2 문서 100% 작성
- [ ] API Contract 100% 작성
- [ ] 작업 보고서 90일 전체 기록
- [ ] 배포 가이드 작성

### 성능
- [ ] API 응답 시간 < 500ms (p95)
- [ ] 이미지 생성 < 10초
- [ ] 영상 생성 < 60초 (1분 영상 기준)
- [ ] 메모리 사용 < 4GB (Mac mini)

---

## 🚨 리스크 관리

### 주요 리스크

#### 1. 일정 지연
- **원인**: 예상 소요 시간 초과, 기술적 난이도
- **대응**:
  - P1/P2 작업 연기
  - 기능 축소 (MVP 범위 재조정)
  - 외부 라이브러리 활용

#### 2. API 불일치
- **원인**: Team B/C 간 소통 부족
- **대응**:
  - API Contract First 원칙 엄수
  - 매일 오전 `changelog.md` 확인
  - Mock 데이터 기반 선행 개발

#### 3. 인프라 장애
- **원인**: Mac mini 서버 다운, SSD 고장
- **대응**:
  - 원격 저장소 백업 (매일 Push)
  - Cloud GPU 대체 전략
  - 헬스체크 자동화

#### 4. 비용 초과
- **원인**: AI API 과다 사용
- **대응**:
  - 비용 Alert 시스템 우선 구현
  - 로컬 모델 우선 사용 (ComfyUI, AnimateDiff)
  - 개발 중 Mock 데이터 활용

---

## 📝 문서 관리 규칙

### 문서 위치
```
docs/
├─ WORK_REGULATIONS.md (규정집)
├─ API_CONTRACTS/ (API 계약서)
├─ WORK_REPORTS/ (작업 보고서)
├─ WORK_PLANS/ (작업 계획서)
│   ├─ MASTER_TODO.md (마스터 TODO)
│   ├─ DETAILED_WORK_PLAN.md (본 문서)
│   ├─ TEAM_A_INSTRUCTIONS.md
│   ├─ TEAM_B_INSTRUCTIONS.md
│   ├─ TEAM_C_INSTRUCTIONS.md
│   └─ NEXT_DAY/ (익일 계획서)
├─ PHASE0/ (설계 문서)
└─ PRD/ (제품 요구사항)
```

### 문서 작성 규칙
1. 모든 문서 상단에 날짜/시간 기재 (규정 1)
2. 한글 작성 원칙 (규정 2)
3. 변경 시 "최종 수정" 날짜 업데이트
4. Git 커밋 메시지에 날짜 포함

---

## 🎯 다음 단계

### 즉시 수행 (오늘)
1. ✅ 규정집 작성 완료
2. ✅ API Contract 템플릿 완료
3. ✅ 작업 보고서 템플릿 완료
4. ✅ 익일 계획서 템플릿 완료
5. ✅ Team A/B/C 작업 지시서 완료
6. ✅ Master TODO 완료
7. ✅ 상세 작업 계획서 완료 (본 문서)
8. [ ] 오늘 작업 보고서 작성
9. [ ] 내일(11/15) 작업 계획서 작성
10. [ ] Git 커밋 & Push

### 내일 (2025-11-15 금요일)
- **Team A**: [P0-A1] Model Catalog 통일 시작
- **Team B**: 환경 셋업 (대기 상태)
- **Team C**: 환경 셋업 (대기 상태)

---

**본 문서는 90일 프로젝트의 상세 로드맵입니다.**
**매주 업데이트하며, 실제 진행 상황에 맞게 조정합니다.**
