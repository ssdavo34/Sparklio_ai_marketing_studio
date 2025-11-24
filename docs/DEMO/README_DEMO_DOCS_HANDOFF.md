# DEMO 문서 작업 인수인계 문서

**작성일**: 2025-11-24 (일요일) 23:50
**작성자**: A팀 (백엔드/문서 총괄)
**인수인계 대상**: 내일 작업할 새로운 클로드
**목적**: 발표용 DEMO 문서 9개 작성 프로젝트 인수인계

---

## 📋 작업 개요

**목표**: 학원 발표용 데모를 위한 PRD와 스펙 문서 9개를 Git 커밋 가능한 수준으로 작성

**참고 문서 위치** (Obsidian):
- `K:\obsidian-k\Sparklio_ai_marketing_studio\발표 준비\1.발표용 스토리 + 데모 흐름 + 컨셉보드까지.md`
- `K:\obsidian-k\Sparklio_ai_marketing_studio\발표 준비\6.챗 기반 원페이지 스튜디오 원칙.md`
- `K:\obsidian-k\Sparklio_ai_marketing_studio\발표 준비\PRD외 문서들\1.문서목록.md`

**핵심 원칙**:
1. 전체 UX/플로우는 **"챗 기반 원페이지 스튜디오"** 원칙을 최우선으로 따른다
2. 발표 스토리, 데모 흐름, 컨셉보드 아이디어를 모두 반영
3. 학원 발표용이지만 실제 제품으로 확장 가능한 형태로 작성
4. 파일명, 경로, 역할 변경 없이 내용만 채움

---

## ✅ 완료된 작업

### 1. DEMO 폴더 생성 ✅
- 위치: `docs/DEMO/`
- 상태: 폴더 생성 완료

### 2. SPARKLIO_DEMO_V1_PRD.md 작성 ✅
- 위치: `docs/DEMO/SPARKLIO_DEMO_V1_PRD.md`
- 상태: **완성** (약 700줄, 모든 섹션 포함)
- 내용:
  - 제품 개요 (데모 버전 목표, 타깃 사용자, 한 줄 컨셉)
  - 문제 정의 (마케팅 팀의 현실, 기존 워크플로우와 비교)
  - 솔루션 개요 (캔버스 스튜디오 구성, 플로우, 4종 산출물 + 컨셉보드)
  - 핵심 플로우 개요 (Meeting From URL → 요약 → 4종 산출물 → 컨셉보드)
  - 데모 범위 (In/Out of Scope)
  - **UX 핵심 원칙: Chat 기반 원페이지 스튜디오** (상세)
  - 기능 요구사항 요약
  - 기술 아키텍처 개요
  - 에이전트 구조 개요
  - 데모 평가 기준 & 성공 조건

**특징**:
- 매우 상세하게 작성됨 (약 9000 토큰 사용)
- 실제 구현에 바로 사용 가능한 수준
- 모든 참고 문서 내용을 충실히 반영

---

## 🔲 남은 작업 (8개 문서)

### 작업 목록

```
docs/DEMO/
├─ SPARKLIO_DEMO_V1_PRD.md                 ✅ 완성
├─ SPARKLIO_DEMO_V1_STORY_AND_FLOW.md     ❌ 미작성
├─ CHAT_ONEPAGE_STUDIO_PRINCIPLES.md      ❌ 미작성
├─ FRONTEND_DEMO_FLOW.md                   ❌ 미작성
├─ BACKEND_DEMO_APIS.md                    ❌ 미작성
├─ AGENTS_DEMO_SPEC.md                     ❌ 미작성
├─ CONCEPT_BOARD_SPEC.md                   ❌ 미작성
├─ SHORTS_VIDEO_PIPELINE.md                ❌ 미작성
└─ DEMO_QA_CHECKLIST.md                    ❌ 미작성
```

### 각 문서의 역할 및 작성 기준

#### 2. SPARKLIO_DEMO_V1_STORY_AND_FLOW.md
**역할**: 실제 발표 때 말할 스토리/슬라이드 흐름/라이브 데모 시나리오

**포함 내용**:
- 발표 전체 한 줄 컨셉
- 슬라이드 구조 (8-10장)
  - Intro – 우리가 풀고 싶은 문제
  - Solution – Sparklio AI Marketing Studio
  - 핵심 플로우 개요
  - Live Demo Flow 소개
  - Concept Board 소개
  - 에이전트 구조 & 기술 스택
  - 데모 후 결과 정리 + Next Step
- 라이브 데모 내러티브 (단계별 멘트)
- 컨셉보드까지 – 발표용 문장 정리

**참고**: `1.발표용 스토리 + 데모 흐름 + 컨셉보드까지.md`의 내용을 거의 그대로 옮김

#### 3. CHAT_ONEPAGE_STUDIO_PRINCIPLES.md
**역할**: "챗 기반 원페이지 스튜디오" 원칙 별도 정리

**포함 내용**:
- 원페이지 스튜디오 철학
- 레이아웃 원칙 (좌/중/우)
- Chat = 오케스트레이터 UI
- 챗 메시지 ↔ 백엔드 파이프라인 매핑 규칙
- 상태 Narration 규칙
- 컨셉보드/결과물 뷰 전환 규칙

**참고**: `6.챗 기반 원페이지 스튜디오 원칙.md` 내용 + PRD 6장 내용 통합

#### 4. FRONTEND_DEMO_FLOW.md
**역할**: 프론트엔드 관점 라우트/레이아웃/뷰 전환/챗 시나리오

**포함 내용**:
- 라우트 & 레이아웃 (`/studio/demo`, 좌/중/우 패널)
- 주요 화면 뷰 (Meeting, 멀티아웃풋, Concept Board, Shorts Preview)
- 챗 시나리오 3가지
  - 시나리오 1: 회의 불러오기
  - 시나리오 2: 캠페인 + 멀티 채널 생성
  - 시나리오 3: 쇼츠/영상 생성 요청
- 상태 동기화 규칙 (챗 ↔ 중앙 뷰)
- Suggested Actions (Quick Chips)

#### 5. BACKEND_DEMO_APIS.md
**역할**: 데모 필요 API 스펙

**포함 내용**:
- 공통 사항 (인증, 에러 규격)
- API 목록:
  - `POST /api/v1/meetings/from-url`
  - `GET /api/v1/meetings/{id}`
  - `POST /api/v1/demo/meeting-to-campaign`
  - `POST /api/v1/demo/campaign-to-assets`
  - `POST /api/v1/demo/campaign-to-shorts`
  - `GET /api/v1/demo/concept-board/{project_id}`
- 각 API별 Request/Response JSON 스키마 (예시 포함)
- 간단한 시퀀스 다이어그램

#### 6. AGENTS_DEMO_SPEC.md
**역할**: 멀티 에이전트 상세 스펙

**포함 내용**:
- 에이전트 개요
- Meeting 계열 (MeetingFromUrlAgent, MeetingSummaryAgent)
- 기획/카피/디자인 계열 (Strategist, Concept, Copywriter, Designer)
- 이미지/영상 계열 (ShortsScript, VisualPrompt, VideoBuilder)
- 품질/검토 계열 (Reviewer)
- 각 에이전트별:
  - 역할
  - 입력/출력 스키마
  - 사용하는 LLM 종류
  - 내부 로직 개요

#### 7. CONCEPT_BOARD_SPEC.md
**역할**: 컨셉보드 화면/데이터/동작 정의

**포함 내용**:
- 컨셉보드 목적 & 정의 (믹스보드 느낌)
- 화면 구성
  - 상단: Meeting/Brand 정보
  - 하단: Concept 카드 2-3개 가로 배열
- Concept Card 구성 요소 (타이틀, 핵심 메시지, 톤앤매너, 헤드라인, 산출물 링크)
- ConceptConfig 데이터 모델
- UX 상호작용 (카드 클릭 → 뷰 전환)

#### 8. SHORTS_VIDEO_PIPELINE.md
**역할**: 쇼츠/광고 영상 파이프라인

**포함 내용**:
- 목표 (20-30초 쇼츠 자동 생성)
- 전체 플로우 (텍스트 → 이미지 → 영상)
- ShortsScriptAgent 스펙 (ShotSpec 구조)
- VisualPromptAgent 스펙 (ComfyUI 프롬프트)
- 이미지 생성 (ComfyUI 호출 규칙)
- VideoBuilder (ffmpeg 영상 조립)
- 챗 연동 방법

#### 9. DEMO_QA_CHECKLIST.md
**역할**: 발표 직전 점검 체크리스트

**포함 내용**:
- 인프라 체크 (Mac mini, DB, ComfyUI, ffmpeg)
- 백엔드 체크 (health, API 테스트)
- 프론트엔드 체크 (`/studio/demo` 접속, 플로우)
- 콘텐츠 품질 체크 (일관성, Concept 구분)
- 발표 리허설 체크 (타임라인, 메시지 전달)

---

## 📐 작성 가이드라인

### 스타일
- **언어**: 한국어 본문, 코드/API는 영어
- **길이**: PRD보다 짧게 (각 문서 200-400줄 목표)
- **구체성**: 복사해서 구현에 바로 쓸 수 있을 정도
- **구조**: H1/H2/H3 명확, 다른 문서와 중복 시 "요약+참조"

### 중복 방지
- PRD에 이미 있는 내용은 간략히 요약하고 PRD 참조
- 예: "상세 내용은 [SPARKLIO_DEMO_V1_PRD.md](./SPARKLIO_DEMO_V1_PRD.md#section) 참조"

### JSON 스키마 예시
API 문서나 에이전트 문서에서는 실제 JSON 예시를 포함:
```json
{
  "meeting_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "제주 감귤 젤리 런칭 회의",
  "key_messages": ["...", "...", "..."]
}
```

### 코드 예시
프론트엔드 문서에서는 간단한 pseudo-code 포함:
```typescript
// 챗 버튼 클릭 시
function handleChatAction(action: ChatAction) {
  if (action.action === 'open_concept_board') {
    setCentralView('concept_board');
    loadConceptBoardData(action.payload.project_id);
  }
}
```

---

## 🔧 작업 환경 정보

### Git 상태
- 현재 브랜치: `feature/editor-migration-polotno`
- Main 브랜치: `main`
- 원격 저장소: GitHub

### 작업 경로
- 로컬: `k:\sparklio_ai_marketing_studio\docs\DEMO\`
- 문서 타입: Markdown (`.md`)

### 참고 문서 경로 (Obsidian)
- `K:\obsidian-k\Sparklio_ai_marketing_studio\발표 준비\`

---

## 📝 작업 순서 제안

**우선순위 높음** (발표 직접 영향):
1. `SPARKLIO_DEMO_V1_STORY_AND_FLOW.md` - 발표 대본
2. `FRONTEND_DEMO_FLOW.md` - 화면 플로우
3. `CHAT_ONEPAGE_STUDIO_PRINCIPLES.md` - UX 원칙

**우선순위 중간** (구현 가이드):
4. `BACKEND_DEMO_APIS.md` - API 스펙
5. `AGENTS_DEMO_SPEC.md` - 에이전트 스펙
6. `CONCEPT_BOARD_SPEC.md` - 컨셉보드 스펙

**우선순위 낮음** (선택적):
7. `SHORTS_VIDEO_PIPELINE.md` - 쇼츠 파이프라인
8. `DEMO_QA_CHECKLIST.md` - QA 체크리스트

---

## 💡 작업 팁

### 효율적 작성 방법
1. **참고 문서 먼저 읽기**: 3개 Obsidian 문서를 모두 읽고 시작
2. **PRD 참조**: SPARKLIO_DEMO_V1_PRD.md에 이미 있는 내용은 재활용
3. **템플릿 활용**: 각 문서의 "목차" 구조를 먼저 만들고 내용 채우기
4. **예시 중심**: 추상적 설명보다 JSON/코드 예시 포함

### 컨텍스트 관리
- PRD가 매우 길어서 컨텍스트를 많이 사용함
- 나머지 문서는 **간결하게** 작성 (각 200-400줄)
- 필요시 여러 세션에 나눠 작업

### 품질 기준
- [ ] B/C팀이 이 문서만 보고 구현 가능한가?
- [ ] 발표자가 이 문서로 리허설 가능한가?
- [ ] 다른 문서와 일관성이 있는가?

---

## 🎯 최종 목표

**완성 기준**:
- 9개 문서 모두 작성 완료
- 각 문서 Git 커밋 가능한 품질
- 상호 참조가 정확히 연결됨
- B/C팀이 추가 설명 없이 구현 시작 가능

**완료 후 작업**:
1. 모든 문서를 Git에 커밋
   ```bash
   git add docs/DEMO/
   git commit -m "[2025-11-24][A] docs: 발표용 DEMO 문서 9개 작성 완료"
   git push origin feature/editor-migration-polotno
   ```

2. B/C팀에 Slack/이메일로 공유
   - 문서 위치: `docs/DEMO/`
   - 시작점: `SPARKLIO_DEMO_V1_PRD.md` 읽기
   - 발표 대본: `SPARKLIO_DEMO_V1_STORY_AND_FLOW.md` 참조

---

## 📞 인수인계 체크리스트

**내일 작업할 클로드가 확인할 사항**:

- [ ] 이 인수인계 문서(`README_DEMO_DOCS_HANDOFF.md`) 읽음
- [ ] 완성된 PRD 문서(`SPARKLIO_DEMO_V1_PRD.md`) 읽음
- [ ] 3개 참고 문서(Obsidian) 위치 확인
  - [ ] `1.발표용 스토리 + 데모 흐름 + 컨셉보드까지.md`
  - [ ] `6.챗 기반 원페이지 스튜디오 원칙.md`
  - [ ] `PRD외 문서들\1.문서목록.md`
- [ ] 남은 8개 문서 목록 확인
- [ ] 작업 우선순위 이해
- [ ] Git 브랜치 확인 (`feature/editor-migration-polotno`)
- [ ] 작업 시작 준비 완료

---

**작성 완료**: 2025-11-24 (일요일) 23:50
**다음 작업자**: 내일 새벽/오전 세션의 클로드
**예상 작업 시간**: 8개 문서 × 30분 = 약 4시간
**우선순위**: STORY → FRONTEND → PRINCIPLES → APIS → AGENTS → CONCEPT_BOARD → SHORTS → QA

**화이팅! 🚀**
