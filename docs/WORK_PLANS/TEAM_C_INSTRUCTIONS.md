# Team C (Frontend & Editor) 작업 지시서

**최초 작성**: 2025-11-14 (금요일) 16:25
**최종 수정**: 2025-11-14 (금요일) 16:25
**대상 기간**: 2025-11-14 ~ 2026-02-11 (90일)
**담당**: Frontend & Editor Team

---

## 🎯 Team C의 역할

Team C는 **사용자가 보는 모든 것**을 책임집니다.

### 핵심 책임
1. **One-Page Editor 구현**: Text/Image/Video 통합 에디터
2. **Chat-Driven Creation UI**: 대화형 콘텐츠 생성 인터페이스
3. **Review Buffer Pattern**: AI 초안 → 사용자 편집 → 승인 플로우
4. **Dashboard & Cost Alert**: 비용 추적 및 경고 UI
5. **PPC Ads Publishing UI**: 광고 캠페인 관리 인터페이스

---

## 📋 작업 범위

### Week 1-2 (Foundation) - 2025-11-14 ~ 2025-11-27

#### 1. Next.js 프로젝트 셋업 ✅ 최우선
- **목표**: 개발 환경 구축
- **작업 내용**:
  - Next.js 14 프로젝트 초기화
  - TypeScript 설정
  - Tailwind CSS 설정
  - 폴더 구조 구성
  - ESLint + Prettier 설정
- **산출물**:
  - `package.json`
  - `tsconfig.json`
  - `tailwind.config.ts`
  - `src/app/` (App Router)
  - `src/components/`
- **예상 소요**: 4시간 (1일)

#### 2. Editor Shell & Layout ✅ 최우선
- **목표**: 에디터 기본 레이아웃
- **작업 내용**:
  - 헤더 (로고, 사용자 메뉴, 비용 표시)
  - 사이드바 (프로젝트 목록, 최근 작업)
  - 메인 에디터 영역
  - Footer (저장 상태, 단축키 안내)
- **참조 문서**:
  - `docs/PHASE0/ONE_PAGE_EDITOR_SPEC.md`
- **산출물**:
  - `src/app/layout.tsx`
  - `src/components/layout/Header.tsx`
  - `src/components/layout/Sidebar.tsx`
  - `src/components/layout/Footer.tsx`
- **테스트**:
  - 레이아웃 반응형 테스트 (Desktop, Tablet, Mobile)
- **예상 소요**: 8시간 (2일)

#### 3. Chat Interface (Chat-Driven Creation) ✅ 최우선
- **목표**: 대화형 콘텐츠 생성 UI
- **작업 내용**:
  - 채팅 입력창 (텍스트 + 파일 업로드)
  - 메시지 리스트 (사용자/AI 구분)
  - 실시간 타이핑 애니메이션
  - WebSocket 연결 (실시간 응답)
- **API 계약**:
  - Team B가 제공할 API: `/api/chat/message`, `/ws/chat`
  - **Mock 데이터로 선행 개발** (Team B 완성 대기하지 않음)
- **산출물**:
  - `src/components/chat/ChatInterface.tsx`
  - `src/components/chat/MessageList.tsx`
  - `src/components/chat/InputBox.tsx`
  - `src/mocks/chat.mock.ts` (Mock 데이터)
- **테스트**:
  - Mock 데이터 기반 채팅 플로우 테스트
- **예상 소요**: 10시간 (2.5일)

---

### Week 3-5 (Core Features) - 2025-11-28 ~ 2025-12-18

#### 4. Text Editor (Rich Text Editing)
- **목표**: 텍스트 콘텐츠 편집기
- **작업 내용**:
  - Lexical 또는 Tiptap 에디터 통합
  - 서식 도구 (Bold, Italic, Heading 등)
  - AI 제안 하이라이트
  - 실시간 자동 저장
- **참조 문서**:
  - `docs/PHASE0/ONE_PAGE_EDITOR_SPEC.md` Section 7
- **산출물**:
  - `src/components/editor/TextEditor.tsx`
  - `src/components/editor/Toolbar.tsx`
  - `src/hooks/useAutoSave.ts`
- **예상 소요**: 12시간 (3일)

#### 5. Image Editor (Drag & Drop + AI 편집)
- **목표**: 이미지 편집 및 AI 생성
- **작업 내용**:
  - 이미지 업로드 (Drag & Drop)
  - 기본 편집 (Crop, Resize, Filter)
  - AI 이미지 생성 버튼 (DALL-E, ComfyUI 연동)
  - Multi-Ratio 프리뷰 (1:1, 4:5, 9:16, 16:9)
- **참조 문서**:
  - `docs/PHASE0/ONE_PAGE_EDITOR_SPEC.md` Section 8
- **API 계약**:
  - `/api/image/generate` (Team B 제공)
  - `docs/API_CONTRACTS/comfyui.json` 참조
- **산출물**:
  - `src/components/editor/ImageEditor.tsx`
  - `src/components/editor/ImageUploader.tsx`
  - `src/components/editor/AIImageGenerator.tsx`
- **예상 소요**: 15시간 (4일)

#### 6. Review Buffer Pattern UI
- **목표**: AI 초안 → 사용자 편집 → 승인 플로우
- **작업 내용**:
  - AI 초안 표시 (읽기 전용)
  - "편집하기" 버튼 → 에디터 활성화
  - "승인" / "재생성" 버튼
  - 변경 이력 표시 (Diff View)
- **참조 문서**:
  - `docs/PHASE0/ONE_PAGE_EDITOR_SPEC.md` Section 6
- **산출물**:
  - `src/components/review/ReviewBuffer.tsx`
  - `src/components/review/DiffViewer.tsx`
- **예상 소요**: 8시간 (2일)

---

### Week 6-8 (Video & Intelligence) - 2025-12-19 ~ 2026-01-08

#### 7. Video Studio Editor (Timeline + Preview)
- **목표**: 영상 편집 타임라인
- **작업 내용**:
  - Timeline UI (클립 배치)
  - Video Player (Preview)
  - Action Controls (Clip, Trim, Split, Transition, Effect)
  - Audio Track 추가
- **참조 문서**:
  - `docs/PHASE0/ONE_PAGE_EDITOR_SPEC.md` Section 9.2
- **API 계약**:
  - `/api/video/generate` (Team B 제공)
  - `docs/API_CONTRACTS/video_pipeline.json` 참조
- **산출물**:
  - `src/components/video/VideoStudio.tsx`
  - `src/components/video/Timeline.tsx`
  - `src/components/video/VideoPlayer.tsx`
  - `src/components/video/ActionToolbar.tsx`
- **테스트**:
  - Mock 영상 데이터로 편집 플로우 테스트
- **예상 소요**: 20시간 (5일)

#### 8. Meeting AI UI (음성/영상 녹음)
- **목표**: 회의 녹음 및 요약 UI
- **작업 내용**:
  - 음성 녹음 버튼 (WebRTC)
  - 파일 업로드 (MP3, MP4, WAV)
  - 실시간 STT 결과 표시
  - 요약 및 Action Items 표시
- **참조 문서**:
  - `docs/PHASE0/MEETING_AI_SPEC.md` (Team A 작성 예정)
- **API 계약**:
  - `/api/meeting/upload`, `/api/meeting/stream` (Team B 제공)
- **산출물**:
  - `src/components/meeting/MeetingRecorder.tsx`
  - `src/components/meeting/TranscriptViewer.tsx`
  - `src/components/meeting/SummaryPanel.tsx`
- **예상 소요**: 12시간 (3일)

---

### Week 9-11 (PPC Ads & Dashboard) - 2026-01-09 ~ 2026-01-29

#### 9. PPC Ads Publishing UI
- **목표**: 광고 캠페인 생성 및 관리
- **작업 내용**:
  - 캠페인 설정 폼 (목적, 예산, 지역, 키워드 등)
  - 플랫폼 선택 (Google, Naver, Kakao)
  - 소재 미리보기
  - 승인 플로우 (Review Buffer 재사용)
  - 집행 버튼 + 스케줄 설정
- **참조 문서**:
  - `docs/PRD/Sparklio_V4_PRD_Final.md` Section 8.1
- **API 계약**:
  - `/api/ppc/publish`, `/api/ppc/status` (Team B 제공)
  - `docs/API_CONTRACTS/ppc_ads.json` (Team B 작성 예정)
- **산출물**:
  - `src/components/ppc/CampaignForm.tsx`
  - `src/components/ppc/PlatformSelector.tsx`
  - `src/components/ppc/AdPreview.tsx`
  - `src/components/ppc/PublishButton.tsx`
- **예상 소요**: 15시간 (4일)

#### 10. Dashboard & Analytics
- **목표**: 성과 추적 대시보드
- **작업 내용**:
  - 주요 지표 카드 (CTR, CPC, CPA, ROAS)
  - 차트 (시계열 그래프, 비교 차트)
  - 프로젝트별 필터
  - 데이터 Export (CSV, Excel)
- **산출물**:
  - `src/components/dashboard/Dashboard.tsx`
  - `src/components/dashboard/MetricCard.tsx`
  - `src/components/dashboard/PerformanceChart.tsx`
- **예상 소요**: 10시간 (2.5일)

#### 11. Cost Alert & Budget Control UI
- **목표**: 비용 경고 팝업 및 예산 관리
- **작업 내용**:
  - 실시간 비용 표시 (헤더)
  - 경고 팝업 ($1, $5, $20 임계값)
  - 대체 모델 제안 표시
  - 일일/주간/월간 예산 설정
- **참조 문서**:
  - `docs/PHASE0/LLM_ROUTER_POLICY.md` Section 6
- **산출물**:
  - `src/components/cost/CostDisplay.tsx`
  - `src/components/cost/CostAlertModal.tsx`
  - `src/components/cost/BudgetSettings.tsx`
- **예상 소요**: 8시간 (2일)

---

### Week 12-13 (Integration & Polish) - 2026-01-30 ~ 2026-02-11

#### 12. UI/UX 폴리싱
- **작업 내용**:
  - 애니메이션 추가 (Framer Motion)
  - 로딩 스켈레톤
  - 에러 상태 UI
  - 빈 상태 UI (Empty State)
  - 단축키 지원
- **예상 소요**: 12시간 (3일)

#### 13. 온보딩 플로우
- **작업 내용**:
  - 초기 설정 마법사
  - 튜토리얼 툴팁
  - 샘플 프로젝트 제공
- **예상 소요**: 8시간 (2일)

#### 14. 반응형 & 접근성
- **작업 내용**:
  - 모바일/태블릿 최적화
  - 키보드 내비게이션
  - 스크린 리더 지원 (ARIA)
- **예상 소요**: 10시간 (2.5일)

---

## 🔄 일일 작업 루틴

### 매일 오전 (09:00 - 09:30)
1. **필독 문서 확인**
   - `docs/WORK_REGULATIONS.md`
   - **`docs/API_CONTRACTS/changelog.md`** ⭐⭐⭐ 최우선!
   - `docs/WORK_PLANS/MASTER_TODO.md`
   - `docs/WORK_REPORTS/[어제날짜]_Team_C_Report.md`
   - `docs/WORK_PLANS/NEXT_DAY/[오늘날짜]_Team_C_Plan.md`

2. **API Contract 변경 확인** (매우 중요!)
   ```bash
   cd K:\sparklio_ai_marketing_studio
   git status

   # API Contracts 변경 확인
   code docs/API_CONTRACTS/changelog.md
   ```

3. **환경 실행**
   ```bash
   git checkout feature/frontend-ui
   npm run dev  # http://localhost:3000
   ```

### 작업 중 (수시)
- **Mock 데이터로 선행 개발** (Team B 대기하지 않음)
  ```typescript
  // src/mocks/llm-router.mock.ts
  export const mockRouteResponse = {
    selectedModel: "gpt-4o",
    estimatedCost: 0.015,
    reasoning: "긴 컨텍스트 처리 필요"
  };
  ```

- **API Contract 기반 타입 생성**
  ```typescript
  // src/types/api.ts
  // docs/API_CONTRACTS/llm_router.json 기반
  export interface LLMRouteRequest {
    prompt: string;
    mode: "draft_fast" | "balanced" | "high_fidelity" | "privacy_first" | "cost_optimized";
    context?: {
      brandId?: string;
      conversationId?: string;
    };
  }
  ```

- **Feature Flag 활용**
  ```typescript
  // 백엔드 미완성 기능
  const FEATURE_FLAGS = {
    VIDEO_GENERATION: process.env.NEXT_PUBLIC_BACKEND_VIDEO_READY === 'true',
    PPC_ADS: process.env.NEXT_PUBLIC_BACKEND_PPC_READY === 'true',
  };

  // UI에서
  {FEATURE_FLAGS.VIDEO_GENERATION ? (
    <VideoStudio />
  ) : (
    <ComingSoonBanner />
  )}
  ```

- **작업 완료 시 즉시 Git 커밋** (규정 7)
  ```bash
  git add src/
  git commit -m "[2025-11-14 15:30] feat: Chat Interface 구현 완료"
  git push origin feature/frontend-ui
  ```

### 매일 저녁 (18:00 - 18:30)
1. **작업 보고서 작성**
   - `docs/WORK_REPORTS/[오늘날짜]_Team_C_Report.md`

2. **익일 작업 계획서 작성**
   - `docs/WORK_PLANS/NEXT_DAY/[내일날짜]_Team_C_Plan.md`

3. **Git 커밋 & 마감**

---

## 📅 주간 작업 루틴

### 매주 금요일 (통합의 날)

#### 오전 (09:00 - 12:00): UI 테스트 & 버그 수정
```bash
npm run test
npm run build
npm run lint
```

#### 오후 (14:00 - 17:00): Team A와 통합
- Team A가 `main` 브랜치로 merge 진행
- 충돌 해결 협조
- E2E 테스트 참여

---

## 🚨 에러 대응 (Team C 전용)

### API 엔드포인트 없음 에러
- **당황하지 말 것!** Team B가 아직 구현 안했을 수 있음
- Mock 데이터로 개발 계속 진행
- Team A에게 확인 요청

### API 응답 형식 변경
1. `docs/API_CONTRACTS/changelog.md` 확인
2. 타입 정의 업데이트 (`src/types/api.ts`)
3. 영향받는 컴포넌트 수정
4. 테스트 업데이트

---

## 🎯 90일 마일스톤

| 주차 | 목표 | 핵심 산출물 |
|------|------|-------------|
| Week 1-2 | Foundation | Next.js 셋업, Editor Shell, Chat Interface |
| Week 3-5 | Core Editor | Text Editor, Image Editor, Review Buffer |
| Week 6-8 | Video & Meeting | Video Studio, Meeting AI UI |
| Week 9-11 | PPC & Dashboard | PPC Ads UI, Dashboard, Cost Alert |
| Week 12-13 | Polish | UI/UX 폴리싱, 온보딩, 반응형 |

---

## 📝 Team C 전용 체크리스트

### 작업 시작 시
- [ ] API Contracts 변경 확인 (매일 필수!)
- [ ] Mock 데이터 준비
- [ ] Feature Flag 확인

### 컴포넌트 작성 시
- [ ] TypeScript 타입 정의
- [ ] Props 인터페이스 명시
- [ ] 주석 작성 (JSDoc)
- [ ] 반응형 고려 (Tailwind Responsive)
- [ ] 접근성 고려 (ARIA 속성)

### 작업 완료 시
- [ ] 로컬 테스트
- [ ] 반응형 테스트 (Desktop/Tablet/Mobile)
- [ ] Git 커밋
- [ ] 작업 보고서 작성

---

## 💡 Team C 꿀팁

### 1. Mock 데이터로 선행 개발
- Team B 완성 기다리지 말고 **UI 먼저 완성**
- API Contract 기반 Mock 데이터 작성
- 나중에 실제 API로 교체만 하면 됨

### 2. Storybook 활용 (선택)
```bash
npx storybook@latest init
```
- 컴포넌트 독립적으로 개발
- 디자인 시스템 구축

### 3. React Query 활용
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['llm-route'],
  queryFn: () => fetch('/api/llm/route').then(res => res.json())
});
```
- API 호출 간편화
- 캐싱 자동 처리

---

**Team C는 사용자가 보는 모든 것을 책임집니다.**
**UI/UX가 좋지 않으면 아무리 백엔드가 좋아도 의미 없습니다.**
**API Contract 변경을 매일 확인하세요!**
