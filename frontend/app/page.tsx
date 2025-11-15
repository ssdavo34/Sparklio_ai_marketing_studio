'use client';

import { useState } from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import ChatPanel from '@/components/Chat/ChatPanel';
import Inspector from '@/components/Editor/Inspector';

/**
 * Sparklio V4.3 - Main Application (SPA)
 *
 * 중요: 이것은 단일 페이지 애플리케이션입니다!
 * - 모든 기능이 이 페이지에서 작동합니다
 * - Chat, Editor, Inspector가 동시에 표시됩니다
 * - 페이지 전환 없이 상태 기반 UI 전환
 *
 * 레이아웃:
 * - 좌측: Sidebar + Chat Panel
 * - 중앙: Editor Canvas (Fabric.js)
 * - 우측: Inspector Panel
 */
export default function SparklioCoreApp() {
  const [currentMode, setCurrentMode] = useState<'chat' | 'editor' | 'assets'>('chat');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 좌측: Sidebar + Chat */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <Sidebar currentMode={currentMode} onModeChange={setCurrentMode} />
        <ChatPanel />
      </div>

      {/* 중앙: Editor Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="border-b border-gray-200 bg-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">새 문서</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                Undo
              </button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                Redo
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
              저장
            </button>
            <button className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              Export
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-100 p-8 flex items-center justify-center overflow-auto">
          <div className="bg-white shadow-lg" style={{ width: '1080px', height: '1350px' }}>
            {/* Fabric.js Canvas가 여기에 렌더링됩니다 */}
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-6xl mb-4">🎨</div>
                <p className="text-lg font-medium">Canvas Area</p>
                <p className="text-sm mt-2">
                  Chat에서 생성된 초안이 여기에 로딩됩니다
                </p>
                <p className="text-xs text-gray-400 mt-4">
                  (Fabric.js Canvas 통합 예정)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 우측: Inspector Panel */}
      <Inspector />
    </div>
  );
}
