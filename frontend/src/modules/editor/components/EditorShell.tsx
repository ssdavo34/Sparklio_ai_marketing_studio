/**
 * EditorShell - Main Editor Layout
 *
 * 레이아웃 구조:
 * ┌──────────────────────────────────────────┐
 * │            TopBar (Toolbar)              │
 * ├──────┬───────────────────────┬───────────┤
 * │      │                       │           │
 * │ Left │     Canvas Stage      │   Right   │
 * │Panel │   (Konva Rendering)   │   Panel   │
 * │      │                       │           │
 * │Pages │                       │Inspector  │
 * │Assets│                       │   Chat    │
 * │      │                       │  Assets   │
 * └──────┴───────────────────────┴───────────┘
 */

'use client';

import React, { useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';
import { CanvasStage } from './CanvasStage';

export function EditorShell() {
  const {
    document: editorDocument,
    panels,
    toggleLeftPanel,
    toggleRightPanel,
    setTool,
    tool,
    undo,
    redo,
    history,
  } = useEditorStore();

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl/Cmd + Shift + Z: Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }

      // Delete: 선택 객체 삭제
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedIds = useEditorStore.getState().selectedIds;
        if (selectedIds.length > 0) {
          e.preventDefault();
          useEditorStore.getState().removeObjects(selectedIds);
        }
      }

      // Escape: 선택 해제
      if (e.key === 'Escape') {
        useEditorStore.getState().deselectAll();
      }

      // V: Select Tool
      if (e.key === 'v' || e.key === 'V') {
        setTool('select');
      }

      // H: Hand Tool
      if (e.key === 'h' || e.key === 'H') {
        setTool('hand');
      }

      // T: Text Tool
      if (e.key === 't' || e.key === 'T') {
        setTool('text');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setTool]);

  if (!editorDocument) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            No Document Loaded
          </h2>
          <p className="text-gray-500">
            Load a document to start editing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Bar (Toolbar) */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
        {/* Logo */}
        <div className="font-bold text-lg text-blue-600">
          Sparklio Editor
        </div>

        {/* Tool Buttons */}
        <div className="flex gap-1 ml-4">
          <ToolButton
            active={tool === 'select'}
            onClick={() => setTool('select')}
            title="Select (V)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </ToolButton>

          <ToolButton
            active={tool === 'hand'}
            onClick={() => setTool('hand')}
            title="Hand (H)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
          </ToolButton>

          <ToolButton
            active={tool === 'text'}
            onClick={() => setTool('text')}
            title="Text (T)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </ToolButton>

          <ToolButton
            active={tool === 'shape'}
            onClick={() => setTool('shape')}
            title="Shape (R)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
            </svg>
          </ToolButton>
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-1 ml-4">
          <ToolButton
            onClick={undo}
            disabled={history.past.length === 0}
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </ToolButton>

          <ToolButton
            onClick={redo}
            disabled={history.future.length === 0}
            title="Redo (Ctrl+Shift+Z)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </ToolButton>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Panel Toggles */}
        <button
          onClick={toggleLeftPanel}
          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
        >
          {panels.leftPanelOpen ? 'Hide' : 'Show'} Pages
        </button>

        <button
          onClick={toggleRightPanel}
          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
        >
          {panels.rightPanelOpen ? 'Hide' : 'Show'} Inspector
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel (Pages & Assets) */}
        {panels.leftPanelOpen && (
          <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
            <LeftPanel />
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-100 overflow-hidden">
          <CanvasStage />
        </div>

        {/* Right Panel (Inspector & Chat) */}
        {panels.rightPanelOpen && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <RightPanel />
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// Tool Button Component
// ========================================

type ToolButtonProps = {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
  children: React.ReactNode;
};

function ToolButton({ active, disabled, onClick, title, children }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded transition-colors
        ${active ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  );
}

// ========================================
// Left Panel (Pages)
// ========================================

function LeftPanel() {
  const { document: doc, activePageId, setActivePage } = useEditorStore();

  if (!doc) return null;

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Pages</h3>
      <div className="space-y-2">
        {doc.pages.map((page) => (
          <button
            key={page.id}
            onClick={() => setActivePage(page.id)}
            className={`
              w-full text-left px-3 py-2 rounded text-sm transition-colors
              ${activePageId === page.id ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}
            `}
          >
            {page.name}
            <div className="text-xs text-gray-400 mt-0.5">
              {page.width} × {page.height}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ========================================
// Right Panel (Inspector)
// ========================================

function RightPanel() {
  const { selectedIds, document: doc, activePageId } = useEditorStore();

  const selectedObjects = React.useMemo(() => {
    if (!doc || selectedIds.length === 0) return [];
    const page = doc.pages.find((p) => p.id === activePageId);
    if (!page) return [];
    return selectedIds
      .map((id) => page.objects.find((obj) => obj.id === id))
      .filter(Boolean);
  }, [doc, activePageId, selectedIds]);

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Inspector</h3>

      {selectedObjects.length === 0 ? (
        <p className="text-sm text-gray-400">No object selected</p>
      ) : selectedObjects.length === 1 ? (
        <ObjectInspector object={selectedObjects[0]!} />
      ) : (
        <p className="text-sm text-gray-600">
          {selectedObjects.length} objects selected
        </p>
      )}
    </div>
  );
}

// ========================================
// Object Inspector
// ========================================

function ObjectInspector({ object }: { object: any }) {
  const { updateObject } = useEditorStore();

  return (
    <div className="space-y-4">
      {/* Position */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={Math.round(object.x)}
            onChange={(e) => updateObject(object.id, { x: Number(e.target.value) })}
            className="px-2 py-1 text-sm border border-gray-300 rounded"
            placeholder="X"
          />
          <input
            type="number"
            value={Math.round(object.y)}
            onChange={(e) => updateObject(object.id, { y: Number(e.target.value) })}
            className="px-2 py-1 text-sm border border-gray-300 rounded"
            placeholder="Y"
          />
        </div>
      </div>

      {/* Size */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={Math.round(object.width)}
            onChange={(e) => updateObject(object.id, { width: Number(e.target.value) })}
            className="px-2 py-1 text-sm border border-gray-300 rounded"
            placeholder="W"
          />
          <input
            type="number"
            value={Math.round(object.height)}
            onChange={(e) => updateObject(object.id, { height: Number(e.target.value) })}
            className="px-2 py-1 text-sm border border-gray-300 rounded"
            placeholder="H"
          />
        </div>
      </div>

      {/* Rotation */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Rotation</label>
        <input
          type="number"
          value={Math.round(object.rotation || 0)}
          onChange={(e) => updateObject(object.id, { rotation: Number(e.target.value) })}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          placeholder="0°"
        />
      </div>

      {/* Opacity */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Opacity ({Math.round((object.opacity ?? 1) * 100)}%)
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={(object.opacity ?? 1) * 100}
          onChange={(e) => updateObject(object.id, { opacity: Number(e.target.value) / 100 })}
          className="w-full"
        />
      </div>

      {/* Type-specific properties */}
      {object.type === 'text' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Text</label>
            <textarea
              value={object.text}
              onChange={(e) => updateObject(object.id, { text: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
            <input
              type="number"
              value={object.fontSize}
              onChange={(e) => updateObject(object.id, { fontSize: Number(e.target.value) })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
            <input
              type="color"
              value={object.fill}
              onChange={(e) => updateObject(object.id, { fill: e.target.value })}
              className="w-full h-8 border border-gray-300 rounded"
            />
          </div>
        </>
      )}

      {object.type === 'shape' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fill Color</label>
            <input
              type="color"
              value={object.fill || '#000000'}
              onChange={(e) => updateObject(object.id, { fill: e.target.value })}
              className="w-full h-8 border border-gray-300 rounded"
            />
          </div>

          {object.stroke && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Stroke Color</label>
              <input
                type="color"
                value={object.stroke}
                onChange={(e) => updateObject(object.id, { stroke: e.target.value })}
                className="w-full h-8 border border-gray-300 rounded"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
