# Sparklio Canvas Studio v3.0 - Layout Specification

**작성일**: 2025-11-16
**작성자**: C팀 (Frontend Team)
**버전**: v3.0
**상태**: 설계 완료

---

## 📋 목차

1. [개요](#1-개요)
2. [전체 레이아웃](#2-전체-레이아웃)
3. [영역별 상세 스펙](#3-영역별-상세-스펙)
4. [뷰 모드](#4-뷰-모드)
5. [반응형 레이아웃](#5-반응형-레이아웃)
6. [애니메이션 및 전환](#6-애니메이션-및-전환)
7. [키보드 단축키](#7-키보드-단축키)
8. [Tailwind CSS 클래스](#8-tailwind-css-클래스)

---

## 1. 개요

### 1.1 설계 목표

Canvas Studio v3.0은 VSCode 스타일의 **4분할 레이아웃**을 기반으로 합니다:

```
┌─────────────────────────────────────────────────────┐
│              Top Toolbar (48px)                     │
├──────┬──────────┬──────────────┬───────────────────┤
│      │          │              │                   │
│ Act- │   Left   │   Canvas     │   Right Dock      │
│ ivity│   Panel  │   Viewport   │   (360px)         │
│ Bar  │  (280px) │   (flex-1)   │                   │
│(56px)│          │              │   ┌─────────────┐ │
│      │          │              │   │Tab│Tab│Tab│ │ │
│      │          │              │   ├─────────────┤ │
│      │          │              │   │   Content   │ │
│      │          │              │   │             │ │
└──────┴──────────┴──────────────┴───────────────────┘
```

### 1.2 핵심 원칙

- ✅ **VSCode 스타일**: 익숙한 UX/UI
- ✅ **유연성**: 패널 리사이즈, 접기/펼치기
- ✅ **효율성**: 최소 클릭으로 모든 기능 접근
- ✅ **반응형**: 다양한 화면 크기 지원

---

## 2. 전체 레이아웃

### 2.1 기본 구조

```html
<div className="flex h-screen flex-col">
  <!-- Top Toolbar -->
  <header className="h-12 border-b">...</header>

  <!-- Main Layout -->
  <main className="flex flex-1 overflow-hidden">
    <!-- Activity Bar -->
    <nav className="w-14 border-r bg-neutral-950">...</nav>

    <!-- Content Area -->
    <div className="flex flex-1 overflow-hidden">
      <!-- Left Panel -->
      <aside className="w-[280px] border-r bg-neutral-50">...</aside>

      <!-- Canvas Viewport -->
      <section className="flex-1 bg-neutral-100">...</section>

      <!-- Right Dock -->
      <aside className="w-[360px] border-l bg-white">...</aside>
    </div>
  </main>
</div>
```

### 2.2 레이아웃 크기

| 영역 | 기본 크기 | 최소 | 최대 | 리사이즈 | 접기 가능 |
|------|-----------|------|------|----------|-----------|
| **Top Toolbar** | 48px | 48px | 48px | ❌ | ❌ |
| **Activity Bar** | 56px | 56px | 56px | ❌ | ❌ |
| **Left Panel** | 280px | 200px | 500px | ✅ | ✅ |
| **Canvas Viewport** | flex-1 | 400px | - | ❌ | ❌ |
| **Right Dock** | 360px | 300px | 600px | ✅ | ✅ |

---

## 3. 영역별 상세 스펙

### 3.1 Top Toolbar

**높이**: `48px` (고정)

**구조**:
```
┌──────────────────────────────────────────────────────┐
│ [Logo] [Doc Title] ... [View Mode] [User] [Settings]│
└──────────────────────────────────────────────────────┘
```

**구성 요소**:
- **좌측**:
  - 로고 (24x24)
  - 문서 제목 (편집 가능)
  - 저장 상태 표시 (Saved / Saving...)

- **중앙**:
  - 빈 공간 (flex-1)

- **우측**:
  - View Mode Switcher (3개 버튼)
  - 사용자 메뉴
  - 설정 아이콘

**Tailwind 클래스**:
```tsx
<header className="flex h-12 items-center justify-between border-b bg-white px-4">
  <div className="flex items-center gap-4">
    {/* Logo */}
    <div className="h-6 w-6">...</div>
    {/* Title */}
    <input className="text-sm font-medium" value="Untitled Document" />
  </div>

  <div className="flex items-center gap-2">
    {/* View Mode */}
    <ViewModeSwitcher />
    {/* User */}
    <UserMenu />
  </div>
</header>
```

---

### 3.2 Activity Bar

**너비**: `56px` (고정)
**배경**: `bg-neutral-950` (다크)
**텍스트**: `text-neutral-100` (화이트)

**구조**:
```
┌────┐
│ B  │ Brand DNA
├────┤
│ C  │ Concept Board
├────┤
│ P  │ Product Story
├────┤
│ D  │ Pitch Deck
├────┤
│ A  │ Ad Studio
└────┘
```

**버튼 스펙**:
- 크기: `56x48px`
- 아이콘: 24x24px
- 활성 상태: `bg-neutral-800`
- Hover: `bg-neutral-900`

**Tailwind 클래스**:
```tsx
<nav className="flex w-14 flex-col border-r bg-neutral-950 text-neutral-100">
  <button
    className={cn(
      "flex h-12 items-center justify-center text-xs transition-colors",
      isActive ? "bg-neutral-800" : "hover:bg-neutral-900"
    )}
  >
    <Icon className="h-6 w-6" />
  </button>
</nav>
```

---

### 3.3 Left Panel

**기본 너비**: `280px`
**최소 너비**: `200px`
**최대 너비**: `500px`
**리사이즈**: ✅ 우측 경계 드래그
**접기**: ✅ 버튼 클릭 or `Ctrl+B`

**구조**:
```
┌───────────────────┐
│ Panel Header      │ (40px)
├───────────────────┤
│                   │
│   Content Area    │ (flex-1, overflow-auto)
│                   │
│                   │
└───────────────────┘
```

**모드별 컨텐츠**:

| 모드 | 헤더 | 컨텐츠 |
|------|------|--------|
| Concept Board | "Layers" | 레이어 트리 |
| Pitch Deck | "Pages" | 슬라이드 썸네일 리스트 |
| Product Story | "Sections" | 섹션 썸네일 리스트 |

**Tailwind 클래스**:
```tsx
<aside
  className="flex flex-col border-r bg-neutral-50"
  style={{ width: `${leftPanelWidth}px` }}
>
  {/* Header */}
  <div className="flex h-10 items-center justify-between border-b px-3">
    <h2 className="text-sm font-medium">Pages</h2>
    <button className="text-neutral-500 hover:text-neutral-700">
      <X className="h-4 w-4" />
    </button>
  </div>

  {/* Content */}
  <div className="flex-1 overflow-auto p-2">
    {/* Page thumbnails, layers, etc. */}
  </div>

  {/* Resize Handle */}
  <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500" />
</aside>
```

**접힌 상태**:
- 너비: `0px`
- `overflow: hidden`
- Activity Bar에 "펼치기" 버튼 표시

---

### 3.4 Canvas Viewport

**크기**: `flex-1` (남은 공간 전부)
**최소 너비**: `400px`
**배경**: `bg-neutral-100` (연한 회색)

**구조**:
```
┌─────────────────────────────────────┐
│  [Zoom Controls]                    │ (우측 상단)
├─────────────────────────────────────┤
│                                     │
│         <canvas />                  │
│       (Fabric.js)                   │
│                                     │
└─────────────────────────────────────┘
```

**Canvas 설정**:
- Fabric.js Canvas
- 배경색: `#ffffff` (흰색)
- 그림자: `shadow-2xl`
- 중앙 정렬

**Zoom Controls**:
- 위치: 우측 상단 (absolute)
- 버튼: `-`, `100%`, `+`, `Fit`
- 줌 범위: 25% ~ 400%

**Tailwind 클래스**:
```tsx
<section className="relative flex flex-1 items-center justify-center bg-neutral-100">
  {/* Canvas Container */}
  <div className="relative">
    <canvas ref={canvasRef} className="shadow-2xl" />
  </div>

  {/* Zoom Controls */}
  <div className="absolute right-4 top-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-md">
    <button className="text-neutral-600 hover:text-neutral-900">-</button>
    <span className="text-sm font-medium">100%</span>
    <button className="text-neutral-600 hover:text-neutral-900">+</button>
  </div>
</section>
```

---

### 3.5 Right Dock

**기본 너비**: `360px`
**최소 너비**: `300px`
**최대 너비**: `600px`
**리사이즈**: ✅ 좌측 경계 드래그
**접기**: ✅ 버튼 클릭 or `Ctrl+Shift+B`

**구조**:
```
┌─────────────────────────────────┐
│ [Chat][Inspector][Layers]...   │ (40px, Tabs)
├─────────────────────────────────┤
│                                 │
│     Tab Content                 │ (flex-1, overflow-auto)
│                                 │
└─────────────────────────────────┘
```

**탭 목록** (5개):
1. **Spark Chat**: AI 대화
2. **Inspector**: 속성 편집
3. **Layers**: 레이어 트리
4. **Data**: 데이터 소스
5. **Brand**: 브랜드 킷

**탭 버튼 스펙**:
- 높이: `40px`
- 활성 상태: `border-b-2 border-black font-medium`
- 비활성 상태: `text-neutral-600`

**Tailwind 클래스**:
```tsx
<aside
  className="flex flex-col border-l bg-white"
  style={{ width: `${rightDockWidth}px` }}
>
  {/* Tabs */}
  <div className="flex border-b">
    {TABS.map(tab => (
      <button
        key={tab.id}
        className={cn(
          "flex-1 px-3 py-2 text-xs transition-colors",
          activeTab === tab.id
            ? "border-b-2 border-black font-medium"
            : "text-neutral-600 hover:text-neutral-900"
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>

  {/* Content */}
  <div className="flex-1 overflow-auto">
    {activeTab === 'chat' && <SparkChatTab />}
    {activeTab === 'inspector' && <InspectorTab />}
    {/* ... */}
  </div>

  {/* Resize Handle */}
  <div className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500" />
</aside>
```

**접힌 상태**:
- 너비: `0px`
- `overflow: hidden`
- Top Toolbar에 "펼치기" 버튼 표시

---

## 4. 뷰 모드

### 4.1 Studio View (기본)

**설명**: 모든 패널 표시, 전체 편집 환경

**레이아웃**:
```
Activity Bar: 56px
Left Panel: 280px
Canvas: flex-1
Right Dock: 360px
```

**사용 케이스**:
- 기본 편집 작업
- 전체 기능 접근 필요 시

---

### 4.2 Canvas Focus

**설명**: 좌/우 패널 숨김, 캔버스만 전체 화면

**레이아웃**:
```
Activity Bar: 56px
Left Panel: 0px (collapsed)
Canvas: flex-1 (거의 전체)
Right Dock: 0px (collapsed)
```

**사용 케이스**:
- 디자인 집중 작업
- 프레젠테이션 모드
- 큰 화면에서 작업

**단축키**: `F11` or `Ctrl+Shift+F`

---

### 4.3 Chat Focus

**설명**: 우측 Dock 확대, AI 대화 중심

**레이아웃**:
```
Activity Bar: 56px
Left Panel: 48px (최소화, 아이콘만)
Canvas: flex-1
Right Dock: 50% (화면의 절반)
```

**사용 케이스**:
- AI와 긴 대화
- Chat으로 콘텐츠 대량 수정
- Chat 히스토리 확인

**단축키**: `Ctrl+Shift+C`

---

### 4.4 View Mode Switcher

**위치**: Top Toolbar 우측

**버튼**:
```tsx
<div className="flex items-center gap-1 rounded-lg border bg-neutral-50 p-1">
  <button
    className={cn(
      "rounded px-3 py-1 text-xs",
      viewMode === 'studio' ? "bg-white shadow" : ""
    )}
  >
    Studio
  </button>
  <button
    className={cn(
      "rounded px-3 py-1 text-xs",
      viewMode === 'canvas-focus' ? "bg-white shadow" : ""
    )}
  >
    Canvas
  </button>
  <button
    className={cn(
      "rounded px-3 py-1 text-xs",
      viewMode === 'chat-focus' ? "bg-white shadow" : ""
    )}
  >
    Chat
  </button>
</div>
```

---

## 5. 반응형 레이아웃

### 5.1 Breakpoint

| 화면 크기 | 최소 너비 | 레이아웃 조정 |
|-----------|-----------|---------------|
| **Desktop Large** | 1920px | 모든 기능 표시 |
| **Desktop** | 1440px | 기본 레이아웃 |
| **Desktop Small** | 1366px | Right Dock 자동 최소화 |
| **Tablet** | 1024px | Left Panel 자동 접기, Right Dock 자동 접기 |
| **Mobile** | < 1024px | ⚠️ 지원 안 함 (경고 메시지 표시) |

### 5.2 Tablet 모드 (1024px ~ 1366px)

**자동 조정**:
- Left Panel: 접힘 (버튼으로 토글)
- Right Dock: 접힘 (버튼으로 토글)
- Canvas: 전체 화면 활용
- Activity Bar: 유지

**사용자 경험**:
- 패널은 오버레이로 표시 (절대 위치)
- 패널 외부 클릭 시 자동 닫힘

---

## 6. 애니메이션 및 전환

### 6.1 패널 접기/펼치기

**애니메이션**: `transition-all duration-300 ease-in-out`

```tsx
<aside
  className={cn(
    "flex flex-col border-r bg-neutral-50 transition-all duration-300",
    isCollapsed ? "w-0" : "w-[280px]"
  )}
>
  ...
</aside>
```

### 6.2 탭 전환

**애니메이션**: Fade In/Out

```tsx
<div
  className={cn(
    "flex-1 overflow-auto transition-opacity duration-200",
    isActive ? "opacity-100" : "opacity-0"
  )}
>
  {content}
</div>
```

### 6.3 뷰 모드 전환

**애니메이션**: `transition-all duration-500 ease-in-out`

모든 패널의 너비 변경이 동시에 부드럽게 전환됩니다.

---

## 7. 키보드 단축키

### 7.1 레이아웃 관련

| 단축키 | 동작 | 설명 |
|--------|------|------|
| `Ctrl+B` | Left Panel 토글 | 좌측 패널 접기/펼치기 |
| `Ctrl+Shift+B` | Right Dock 토글 | 우측 Dock 접기/펼치기 |
| `F11` | Canvas Focus | 캔버스만 전체 화면 |
| `Ctrl+Shift+C` | Chat Focus | Chat 중심 모드 |
| `Esc` | Studio View | 기본 모드로 복귀 |

### 7.2 탭 전환

| 단축키 | 동작 |
|--------|------|
| `Ctrl+1` | Spark Chat 탭 |
| `Ctrl+2` | Inspector 탭 |
| `Ctrl+3` | Layers 탭 |
| `Ctrl+4` | Data 탭 |
| `Ctrl+5` | Brand 탭 |

### 7.3 캔버스 관련

| 단축키 | 동작 |
|--------|------|
| `Ctrl++` | Zoom In |
| `Ctrl+-` | Zoom Out |
| `Ctrl+0` | Zoom to Fit |
| `Ctrl+1` | Zoom to 100% |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+S` | Save |

---

## 8. Tailwind CSS 클래스

### 8.1 레이아웃 기본 클래스

```css
/* Container */
.studio-layout {
  @apply flex h-screen flex-col;
}

/* Top Toolbar */
.top-toolbar {
  @apply flex h-12 items-center justify-between border-b bg-white px-4;
}

/* Main Content */
.main-content {
  @apply flex flex-1 overflow-hidden;
}

/* Activity Bar */
.activity-bar {
  @apply flex w-14 flex-col border-r bg-neutral-950 text-neutral-100;
}

/* Left Panel */
.left-panel {
  @apply flex flex-col border-r bg-neutral-50;
}

/* Canvas Viewport */
.canvas-viewport {
  @apply relative flex flex-1 items-center justify-center bg-neutral-100;
}

/* Right Dock */
.right-dock {
  @apply flex flex-col border-l bg-white;
}
```

### 8.2 재사용 가능한 유틸리티 클래스

```css
/* Panel Header */
.panel-header {
  @apply flex h-10 items-center justify-between border-b px-3;
}

/* Panel Content */
.panel-content {
  @apply flex-1 overflow-auto p-2;
}

/* Resize Handle */
.resize-handle {
  @apply absolute top-0 h-full w-1 cursor-col-resize hover:bg-blue-500;
}

/* Tab Button */
.tab-button {
  @apply flex-1 px-3 py-2 text-xs transition-colors;
}

.tab-button-active {
  @apply border-b-2 border-black font-medium;
}

.tab-button-inactive {
  @apply text-neutral-600 hover:text-neutral-900;
}
```

---

## 📊 요약

### 핵심 크기

| 영역 | 기본 | 최소 | 최대 |
|------|------|------|------|
| Top Toolbar | 48px | 48px | 48px |
| Activity Bar | 56px | 56px | 56px |
| Left Panel | 280px | 200px | 500px |
| Canvas Viewport | flex-1 | 400px | - |
| Right Dock | 360px | 300px | 600px |

### 뷰 모드

- **Studio View**: 모든 패널 표시
- **Canvas Focus**: 캔버스만 전체 화면
- **Chat Focus**: Chat 중심, 우측 Dock 확대

### 반응형

- **1920px+**: 전체 기능
- **1440px**: 기본 레이아웃
- **1366px**: Right Dock 최소화
- **1024px**: Tablet 모드 (패널 자동 접기)
- **< 1024px**: 지원 안 함

---

## ✅ 다음 단계

1. ✅ 이 문서 검토 및 승인
2. ⏳ Zustand Store 설계 (레이아웃 상태 관리)
3. ⏳ Phase 1 구현 시작 (레이아웃 기본 구조)

---

**작성 완료**: 2025-11-16
**검토자**: -
**승인자**: -
**상태**: ✅ 설계 완료
