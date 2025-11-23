# ⚠️ MAIN EDITOR PATH - 모든 Claude는 이 파일을 먼저 읽으세요

## Canonical Editor Route (공식 경로) - 2025-11-23 확정

**메인 경로:** `/studio/v3`

**URL:** `http://localhost:3000/studio/v3`

**파일:** `app/studio/v3/page.tsx`

**버전:** Sparklio Canvas Editor v3.1

---

## Alias / Deprecated Routes

**리다이렉트 경로:**
- `/canvas-studio` → redirects to `/studio/v3` (alias)

**사용 금지 (old versions):**
- `/studio/polotno`
- `/studio/layerhub`
- `/studio/konva`
- `/editor`

---

## ✅ 작업 허용 디렉토리

**에디터 엔진 (항상 여기서만 작업):**
- `components/canvas-studio/` - 모든 에디터 컴포넌트
- `lib/api/` - API 연동
- `lib/utils/` - 유틸리티 함수

**페이지 라우트 (수정만 허용):**
- `app/studio/v3/page.tsx` - 메인 에디터 페이지

---

## 🚫 절대 금지 규칙

1. **새 에디터 라우트 생성 금지**
   - `app/studio/v4/`, `app/canvas-studio2/`, `app/new-editor/` 등 절대 생성 금지
   - 에디터 페이지는 `/studio/v3` 하나만 존재

2. **엔진 복제 금지**
   - `components/canvas-studio-v2/`, `components/new-editor/` 등 복제 금지
   - 항상 `components/canvas-studio/` 만 사용

3. **문서/URL 통일**
   - 모든 데모, 문서, 북마크는 `/studio/v3` 로 통일

---

## 📌 Claude 작업 체크리스트

**작업 시작 전:**
- [ ] MAIN_EDITOR_PATH.md 읽음
- [ ] `/studio/v3` 가 메인 경로임을 확인
- [ ] 새 라우트를 만들지 않을 것을 확인

**작업 중:**
- [ ] `components/canvas-studio/*` 에서만 작업
- [ ] 페이지 수정이 필요하면 `app/studio/v3/page.tsx` 수정
- [ ] 절대 새 경로를 생성하지 않음

**작업 완료 후:**
- [ ] 변경사항을 이 파일 히스토리에 기록

---

## 🔄 히스토리

- **2025-11-22**: `/studio/v3` 생성 (C팀)
- **2025-11-23**: `/canvas-studio` 리다이렉트로 변경 (경로 통일)
- **2025-11-23**: Strategist 통합 완료
  - `components/canvas-studio/types/strategist.ts`
  - `components/canvas-studio/components/StrategistStrategyView.tsx`
  - `lib/api/strategist-api.ts`
  - `components/canvas-studio/components/AIResponseRenderer.tsx` 수정
  - `components/canvas-studio/components/pages/ContentPlanViewer.tsx` 수정
- **2025-11-23**: Reviewer 통합 완료
  - `components/canvas-studio/types/reviewer.ts`
  - `components/canvas-studio/components/ReviewerReviewView.tsx`
  - `lib/api/reviewer-api.ts`
  - `components/canvas-studio/mocks/reviewer-mock.ts`
  - `lib/utils/response-type-detector.ts` (Reviewer 감지 추가)
  - `components/canvas-studio/components/AIResponseRenderer.tsx` (Reviewer 렌더링 추가)

---

## 📞 중요 안내

**이 파일은 팀의 작업 연속성을 보장합니다.**

경로 변경이 필요하면:
1. 팀원과 충분히 상의
2. 이 문서 업데이트
3. 모든 Claude 세션에 공지
