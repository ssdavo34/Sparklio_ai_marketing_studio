'use client';

import { useState } from 'react';

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
  const [currentMode, setCurrentMode] = useState<'chat' | 'editor'>('chat');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 좌측: Sidebar + Chat */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        {/* Sidebar (메뉴) */}
        <div className="border-b border-gray-200 p-4">
          <h1 className="text-xl font-bold text-gray-900">Sparklio Studio</h1>
          <p className="text-xs text-gray-500 mt-1">Chat-First One-Page Editor</p>
        </div>

        {/* Navigation Menu */}
        <div className="border-b border-gray-200 p-2">
          <nav className="space-y-1">
            <button
              onClick={() => setCurrentMode('chat')}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                currentMode === 'chat'
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              💬 새로 만들기
            </button>
            <button
              onClick={() => setCurrentMode('editor')}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                currentMode === 'editor'
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              ✏️ 에디터
            </button>
          </nav>
        </div>

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Chat</h2>
            <p className="text-xs text-gray-500">AI와 대화로 콘텐츠 생성</p>
          </div>

          {/* 메시지 리스트 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                안녕하세요! 무엇을 만들어드릴까요?
              </p>
              <p className="text-xs text-blue-700 mt-2">
                예시: "스킨케어 제품 상세페이지 만들어줘"
              </p>
            </div>
          </div>

          {/* 입력창 */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="무엇을 만들까요?"
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                전송
              </button>
            </div>
          </div>
        </div>
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
      <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Inspector</h2>
          <p className="text-xs text-gray-500">선택된 오브젝트 속성</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-center text-gray-400 mt-8">
            <div className="text-4xl mb-2">🔧</div>
            <p className="text-sm">오브젝트를 선택하세요</p>
            <p className="text-xs mt-2">
              텍스트, 이미지, 도형 등의 속성을 편집할 수 있습니다
            </p>
          </div>

          {/* 예시 속성 패널 */}
          <div className="mt-8 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                폰트 크기
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                placeholder="48"
                disabled
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                색상
              </label>
              <input
                type="color"
                className="w-full h-10 border border-gray-300 rounded"
                disabled
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
