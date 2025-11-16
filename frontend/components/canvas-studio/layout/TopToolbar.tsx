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
 * - 우측: 뷰 모드 전환, 사용자 메뉴
 *
 * @author C팀 (Frontend Team)
 * @version 3.0
 */

'use client';

export function TopToolbar() {
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
