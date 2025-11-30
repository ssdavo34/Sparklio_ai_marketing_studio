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
import { useCanvasStore } from '../stores/useCanvasStore';
import { useWorkspaceStore, useProjectStore } from '../stores';
import { Layout, Maximize2, MessageSquare, ChevronDown, Eye, Edit3, Download, FolderOpen, Building2 } from 'lucide-react';
import type { StudioMode, ViewMode } from '../stores/types';
import { useState, useEffect, useRef } from 'react';
import { ThemeSelector } from './ThemeSelector';
import { SaveStatusIndicator } from '../components/SaveStatusIndicator';
import { toast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

export function TopToolbar() {
  const router = useRouter();
  const currentMode = useEditorStore((state) => state.currentMode);
  const setCurrentMode = useEditorStore((state) => state.setCurrentMode);
  const viewMode = useEditorStore((state) => state.viewMode);
  const setViewMode = useEditorStore((state) => state.setViewMode);

  // Save State
  const saveStatus = useEditorStore((state) => state.saveStatus);
  const lastSaved = useEditorStore((state) => state.lastSaved);
  const isDirty = useEditorStore((state) => state.isDirty);
  const lastError = useEditorStore((state) => state.lastError);
  const autoSaveEnabled = useEditorStore((state) => state.autoSaveEnabled);
  const setAutoSaveEnabled = useEditorStore((state) => state.setAutoSaveEnabled);

  const isViewMode = useLayoutStore((state) => state.isViewMode);
  const toggleViewMode = useLayoutStore((state) => state.toggleViewMode);
  const polotnoStore = useCanvasStore((state) => state.polotnoStore);
  const { currentWorkspace } = useWorkspaceStore();
  const { currentProject } = useProjectStore();
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const projectSelectorRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (projectSelectorRef.current && !projectSelectorRef.current.contains(event.target as Node)) {
        setShowProjectSelector(false);
      }
    };

    if (showExportMenu || showProjectSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu, showProjectSelector]);

  // View Mode 변경 + 패널 접기/펴기 연동
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);

    if (mode === 'studio') {
      // Studio View: 모든 패널 표시
      useLayoutStore.setState({
        isLeftPanelCollapsed: false,
        isRightDockCollapsed: false
      });
    } else if (mode === 'canvas-focus') {
      // Canvas Focus: Canvas만 크게 (Chat 접기)
      useLayoutStore.setState({
        isLeftPanelCollapsed: false,
        isRightDockCollapsed: true
      });
    } else if (mode === 'chat-focus') {
      // Chat Focus: Chat 패널 크게 (Left Panel 접기)
      useLayoutStore.setState({
        isLeftPanelCollapsed: true,
        isRightDockCollapsed: false,
        rightDockWidth: 600  // Chat 패널 크게
      });
    }
  };

  // Export Canvas (PNG or JPG)
  const handleExport = async (format: 'png' | 'jpeg') => {
    if (!polotnoStore) {
      alert('Canvas is not ready. Please wait for the canvas to load.');
      return;
    }

    setIsExporting(true);
    setShowExportMenu(false);

    try {
      // Polotno Store의 toDataURL 사용
      const dataURL = await polotnoStore.toDataURL({
        mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
        pixelRatio: 2, // High quality (2x resolution)
      });

      // Download the image
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `sparklio-canvas-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export canvas. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Manual Save Handler
  const handleManualSave = async () => {
    if (!polotnoStore || !isDirty) return;

    try {
      await useEditorStore.getState().saveDocument();
      toast.success('문서가 저장되었습니다.');
    } catch (error) {
      console.error('[TopToolbar] Manual save failed:', error);
      toast.error('저장에 실패했습니다. 네트워크를 확인하고 다시 시도해주세요.');
    }
  };

  // Keyboard Shortcut (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [polotnoStore, isDirty]);

  return (
    <div className="flex h-full items-center justify-between px-4">
      {/* Left */}
      <div className="flex items-center gap-4">
        {/* Logo - Click to refresh */}
        <button
          onClick={() => router.push('/studio/v3')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          title="Refresh Studio"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">Sparklio</span>
        </button>

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

        {/* Project/Workspace Selector */}
        <div className="relative" ref={projectSelectorRef}>
          <button
            onClick={() => setShowProjectSelector(!showProjectSelector)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            {currentProject && currentWorkspace ? (
              <>
                <FolderOpen className="w-4 h-4 text-purple-600" />
                <div className="flex flex-col items-start">
                  <span className="text-xs text-gray-500">{currentWorkspace.name}</span>
                  <span className="font-medium text-gray-900">{currentProject.name}</span>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">No Project Selected</span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </>
            )}
          </button>

          {/* Project Selector Dropdown */}
          {showProjectSelector && (
            <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
              <div className="px-3 py-2 border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-700 uppercase">Select Project</h3>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    router.push('/workspace');
                    setShowProjectSelector(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-purple-600 hover:bg-purple-50 transition-colors flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Browse All Workspaces</span>
                </button>
              </div>

              {currentWorkspace && (
                <>
                  <div className="px-3 py-1 mt-2">
                    <p className="text-xs text-gray-500">Current Workspace:</p>
                    <p className="text-sm font-medium text-gray-900">{currentWorkspace.name}</p>
                  </div>
                  <button
                    onClick={() => {
                      router.push(`/workspace/${currentWorkspace.id}`);
                      setShowProjectSelector(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    View All Projects in this Workspace
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Project Name Editor */}
        <input
          type="text"
          value={currentProject?.name || ''}
          onChange={(e) => {
            if (currentProject) {
              useProjectStore.getState().setCurrentProject({
                ...currentProject,
                name: e.target.value,
              });
            }
          }}
          className="text-sm text-gray-700 bg-transparent hover:bg-gray-100 px-2 py-1 rounded border-none focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[150px]"
          placeholder="프로젝트 이름..."
        />

        {/* Save Status Indicator */}
        <SaveStatusIndicator
          status={saveStatus}
          lastSaved={lastSaved}
          isDirty={isDirty}
          lastError={lastError}
          onManualSave={handleManualSave}
        />

        {/* Auto-save Toggle */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-xs text-gray-600">자동 저장</span>
          <button
            onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              autoSaveEnabled ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
            title={autoSaveEnabled ? '자동 저장 켜짐' : '자동 저장 꺼짐'}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                autoSaveEnabled ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
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

        {/* Theme Selector */}
        <ThemeSelector />

        <div className="h-6 w-px bg-gray-300" />

        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleViewModeChange('studio')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'studio'
                ? 'bg-white shadow-sm text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Studio View - Show all panels"
          >
            <Layout className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleViewModeChange('canvas-focus')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'canvas-focus'
                ? 'bg-white shadow-sm text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Canvas Focus - Hide chat panel"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleViewModeChange('chat-focus')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'chat-focus'
                ? 'bg-white shadow-sm text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Chat Focus - Hide left panel, expand chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>

        {/* Export Button with Dropdown */}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {/* Export Menu Dropdown */}
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <button
                onClick={() => handleExport('png')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Export as PNG
              </button>
              <button
                onClick={() => handleExport('jpeg')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Export as JPG
              </button>
            </div>
          )}
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
