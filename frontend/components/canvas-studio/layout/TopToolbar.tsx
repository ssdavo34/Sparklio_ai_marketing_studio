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
  // Phase 3: Canvas Context에서 addShape 함수 가져오기
  const { addShape } = useCanvas();
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

      {/* 중앙: 도형 추가 도구 (Phase 3 ✅) */}
      <div className="flex items-center gap-2">
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
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
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
