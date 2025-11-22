/**
 * Top Toolbar
 *
 * 상단 툴바 (Block 3)
 * - Canvas Studio v3.1 로고 및 브랜드
 * - 저장 상태 표시
 * - 간단한 컨트롤
 *
 * @author C팀 (Frontend Team)
 * @version 3.1
 * @date 2025-11-22
 */

'use client';

import { useEditorStore } from '../stores/useEditorStore';
import { useLayoutStore } from '../stores/useLayoutStore';

export function TopToolbar() {
  const toggleLeftPanel = useLayoutStore((state) => state.toggleLeftPanel);
  const toggleRightDock = useLayoutStore((state) => state.toggleRightDock);

  return (
    <div className="flex h-full items-center justify-between px-4">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleLeftPanel}
          className="p-2 hover:bg-gray-100 rounded"
          title="Toggle Left Panel (Ctrl+B)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Canvas Studio v3.1</h1>
        <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          Block 3: Layout
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleRightDock}
          className="p-2 hover:bg-gray-100 rounded"
          title="Toggle Right Dock (Ctrl+Shift+B)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
