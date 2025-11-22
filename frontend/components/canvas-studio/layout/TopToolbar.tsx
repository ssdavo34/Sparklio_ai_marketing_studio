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
import { Layout, Maximize2, MessageSquare, ChevronDown, Eye, Edit3 } from 'lucide-react';
import type { StudioMode, ViewMode } from '../stores/types';

export function TopToolbar() {
  const currentMode = useEditorStore((state) => state.currentMode);
  const setCurrentMode = useEditorStore((state) => state.setCurrentMode);
  const viewMode = useEditorStore((state) => state.viewMode);
  const setViewMode = useEditorStore((state) => state.setViewMode);
  const isViewMode = useLayoutStore((state) => state.isViewMode);
  const toggleViewMode = useLayoutStore((state) => state.toggleViewMode);

  const modeLabels: Record<StudioMode, string> = {
    planning: 'Planning',
    editor: 'Editor',
    video: 'Video',
    admin: 'Admin',
  };

  return (
    <div className="flex h-full items-center justify-between px-4">
      {/* Left */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">Sparklio</span>
        </div>

        {/* Mode Dropdown */}
        <div className="relative">
          <select
            value={currentMode}
            onChange={(e) => setCurrentMode(e.target.value as StudioMode)}
            className="appearance-none pl-3 pr-8 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border-none cursor-pointer transition-colors"
          >
            <option value="planning">Planning</option>
            <option value="editor">Editor</option>
            <option value="video">Video</option>
            <option value="admin">Admin</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>

        <div className="h-6 w-px bg-gray-300" />

        {/* Project Title */}
        <input
          type="text"
          defaultValue="Untitled Project"
          className="text-sm text-gray-700 bg-transparent hover:bg-gray-100 px-2 py-1 rounded border-none focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Project name..."
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Edit/View Mode Toggle */}
        <button
          onClick={toggleViewMode}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            isViewMode
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={isViewMode ? 'Switch to Edit Mode' : 'Switch to View Mode'}
        >
          {isViewMode ? (
            <>
              <Eye className="w-4 h-4" />
              <span>View</span>
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </>
          )}
        </button>

        <div className="h-6 w-px bg-gray-300" />

        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('studio')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'studio'
                ? 'bg-white shadow-sm text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Studio View"
          >
            <Layout className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('canvas-focus')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'canvas-focus'
                ? 'bg-white shadow-sm text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Canvas Focus"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('chat-focus')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'chat-focus'
                ? 'bg-white shadow-sm text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Chat Focus"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>

        {/* Share Button */}
        <button className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
          Share
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
          U
        </div>
      </div>
    </div>
  );
}
