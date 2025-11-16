/**
 * Top Toolbar
 *
 * 화면 최상단에 위치한 고정 툴바
 * - 높이: 48px (고정)
 * - 배경: 흰색
 * - 그림자: 하단에 살짝
 *
 * 구성:
 * - 좌측: 로고, 문서 제목, 저장 상태
 * - 중앙: 도형 추가 도구 (Phase 3 ✅)
 * - 우측: 뷰 모드 전환, 사용자 메뉴
 *
 * Phase 3: useCanvas() 훅으로 addShape 함수 가져오기
 *
 * @author C팀 (Frontend Team)
 * @version 3.0
 */

'use client';

import { useCanvas } from '../context';

export function TopToolbar() {
  // Phase 3: Canvas Context에서 함수 가져오기
  const {
    addShape,
    copySelected,
    pasteSelected,
    duplicateSelected,
    deleteSelected,
    groupSelected,
    ungroupSelected,
    undo,
    redo,
  } = useCanvas();
  return (
    <header className="flex h-12 items-center justify-between border-b border-neutral-200 bg-white px-4 shadow-sm">
      {/* 좌측: 로고 + 문서 제목 */}
      <div className="flex items-center gap-4">
        {/* 로고 */}
        <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
          S
        </div>

        {/* 문서 제목 (나중에 편집 가능하게) */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-900">
            Untitled Document
          </span>
          <span className="text-xs text-neutral-400">• Saved</span>
        </div>
      </div>

      {/* 중앙: 도구 모음 */}
      <div className="flex items-center gap-2">
        {/* Undo 버튼 */}
        <button
          onClick={undo}
          className="flex h-8 w-8 items-center justify-center rounded text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>

        {/* Redo 버튼 */}
        <button
          onClick={redo}
          className="flex h-8 w-8 items-center justify-center rounded text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </button>

        {/* 구분선 */}
        <div className="mx-1 h-6 w-px bg-neutral-200" />

        {/* 사각형 추가 */}
        <button
          onClick={() => addShape('rectangle')}
          className="flex h-8 w-8 items-center justify-center rounded text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          title="Add Rectangle (R)"
          aria-label="Add Rectangle"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" strokeWidth={2} rx="2" />
          </svg>
        </button>

        {/* 원 추가 */}
        <button
          onClick={() => addShape('circle')}
          className="flex h-8 w-8 items-center justify-center rounded text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          title="Add Circle (C)"
          aria-label="Add Circle"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8" strokeWidth={2} />
          </svg>
        </button>

        {/* 삼각형 추가 */}
        <button
          onClick={() => addShape('triangle')}
          className="flex h-8 w-8 items-center justify-center rounded text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          title="Add Triangle (T)"
          aria-label="Add Triangle"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 4 L20 20 L4 20 Z" strokeWidth={2} strokeLinejoin="round" />
          </svg>
        </button>

        {/* 구분선 */}
        <div className="mx-1 h-6 w-px bg-neutral-200" />

        {/* 텍스트 추가 */}
        <button
          onClick={() => addShape('text')}
          className="flex h-8 w-8 items-center justify-center rounded text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          title="Add Text (T)"
          aria-label="Add Text"
        >
          <span className="text-lg font-bold">T</span>
        </button>

        {/* 구분선 */}
        <div className="mx-1 h-6 w-px bg-neutral-200" />

        {/* Copy 버튼 */}
        <button
          onClick={copySelected}
          className="flex h-8 w-8 items-center justify-center rounded text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          title="Copy (Ctrl+C)"
          aria-label="Copy"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Paste 버튼 */}
        <button
          onClick={pasteSelected}
          className="flex h-8 w-8 items-center justify-center rounded text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          title="Paste (Ctrl+V)"
          aria-label="Paste"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </button>

        {/* Duplicate 버튼 */}
        <button
          onClick={duplicateSelected}
          className="flex h-8 w-8 items-center justify-center rounded text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          title="Duplicate (Ctrl+D)"
          aria-label="Duplicate"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        {/* 구분선 */}
        <div className="mx-1 h-6 w-px bg-neutral-200" />

        {/* Delete 버튼 */}
        <button
          onClick={deleteSelected}
          className="flex h-8 w-8 items-center justify-center rounded text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          title="Delete (Delete)"
          aria-label="Delete"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        {/* 구분선 */}
        <div className="mx-1 h-6 w-px bg-neutral-200" />

        {/* Group 버튼 */}
        <button
          onClick={groupSelected}
          className="flex h-8 w-8 items-center justify-center rounded text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          title="Group (Ctrl+G)"
          aria-label="Group"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>

        {/* Ungroup 버튼 */}
        <button
          onClick={ungroupSelected}
          className="flex h-8 w-8 items-center justify-center rounded text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          title="Ungroup (Ctrl+Shift+G)"
          aria-label="Ungroup"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        </button>
      </div>

      {/* 우측: 뷰 모드 + 사용자 메뉴 */}
      <div className="flex items-center gap-3">
        {/* 뷰 모드 전환 (Studio / Canvas / Chat) */}
        <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
          <button className="rounded bg-white px-3 py-1 text-xs font-medium text-neutral-900 shadow-sm">
            Studio
          </button>
          <button className="rounded px-3 py-1 text-xs text-neutral-600 hover:text-neutral-900">
            Canvas
          </button>
          <button className="rounded px-3 py-1 text-xs text-neutral-600 hover:text-neutral-900">
            Chat
          </button>
        </div>

        {/* 사용자 아이콘 (임시) */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-blue-500 text-xs font-bold text-white">
          U
        </div>
      </div>
    </header>
  );
}
