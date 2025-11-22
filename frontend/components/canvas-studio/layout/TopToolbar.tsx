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
  const isLeftPanelCollapsed = useLayoutStore((state) => state.isLeftPanelCollapsed);
  const isRightDockCollapsed = useLayoutStore((state) => state.isRightDockCollapsed);

  return (
    <div className="flex h-full items-center justify-between px-4">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleLeftPanel}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title={isLeftPanelCollapsed ? "Show Left Panel (Ctrl+B)" : "Hide Left Panel (Ctrl+B)"}
        >
          {/* VSCode-style sidebar icon */}
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
            <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h11A1.5 1.5 0 0 1 15 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5v-11zM2.5 2a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5H4V2H2.5z"/>
            {isLeftPanelCollapsed && (
              <path d="M5.5 7L8 4.5 6.5 3 3 6.5 6.5 10 8 8.5 5.5 7z" opacity="0.6"/>
            )}
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Canvas Studio v3.1</h1>
        <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          Block 5: Inspector
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleRightDock}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title={isRightDockCollapsed ? "Show Right Panel (Ctrl+Shift+B)" : "Hide Right Panel (Ctrl+Shift+B)"}
        >
          {/* VSCode-style panel icon */}
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
            <path d="M14.5 1h-13A1.5 1.5 0 0 0 0 2.5v11A1.5 1.5 0 0 0 1.5 15h13a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 14.5 1zM15 13.5a.5.5 0 0 1-.5.5H12V2h2.5a.5.5 0 0 1 .5.5v11z"/>
            {isRightDockCollapsed && (
              <path d="M10.5 7L8 9.5 9.5 11 13 7.5 9.5 4 8 5.5 10.5 7z" opacity="0.6"/>
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
