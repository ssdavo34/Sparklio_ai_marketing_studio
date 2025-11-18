# Frontend Routing Structure

**작성일**: 2025-11-18
**작성자**: C팀 (Frontend Team)

## ⚠️ 중요: 에디터는 하나만 존재합니다!

Sparklio Frontend는 **단일 에디터 구조**입니다.
**같은 `<CanvasStudioShell />` 컴포넌트**를 사용합니다.

---

## 📁 라우트 구조

### 1. 메인 페이지: `/` (루트)
- **파일**: `app/page.tsx`
- **컴포넌트**: `<CanvasStudioShell />`
- **상태**:
  - 현재 `BYPASS_AUTH_FOR_TESTING = true`로 인증 우회
  - 바로 Canvas Studio 에디터 표시
- **용도**: 유일한 진입점

### 2. 테스트 페이지: `/test`
- **파일**: `app/test/page.tsx`
- **용도**: 개발자 전용 테스트 페이지

---

## 🎯 Canvas Studio Shell

**실제 에디터는 하나**: `components/canvas-studio/CanvasStudioShell.tsx`

```typescript
<CanvasStudioShell />
  └─ StudioLayout (VSCode 스타일 레이아웃)
      ├─ ActivityBar (좌측 아이콘 바)
      ├─ LeftPanel (Layers, Assets 등)
      ├─ CanvasViewport (메인 캔버스)
      └─ RightDock (ChatPanel, InspectorPanel)
```

---

## ✅ 개발 시 주의사항

1. **에디터를 수정할 때**:
   - `components/canvas-studio/` 폴더 내 파일만 수정
   - `app/page.tsx`나 `app/studio/page.tsx`는 절대 수정 금지 (라우팅만 담당)

2. **새로운 라우트 추가 금지**:
   - `/studio2`, `/editor` 같은 중복 라우트 생성하지 말것
   - 모든 에디터 기능은 `<CanvasStudioShell />` 내부에서 처리

3. **사용자에게 URL 안내 시**:
   - **http://localhost:3000/** (메인 페이지)
   - **주의**: 포트는 3000 또는 3001 (자동 할당됨)

4. **인증 우회 모드**:
   - `app/page.tsx:26` - `BYPASS_AUTH_FOR_TESTING = true`
   - Backend 서버 준비되면 `false`로 변경하여 로그인 화면 활성화

---

## 🔥 다음 작업 (TODO)

- [ ] Backend User/Auth API 준비 후 `BYPASS_AUTH_FOR_TESTING = false` 설정

---

**마지막 업데이트**: 2025-11-18 22:49 KST
