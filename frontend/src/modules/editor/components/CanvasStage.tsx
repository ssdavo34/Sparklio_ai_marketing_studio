/**
 * CanvasStage - Konva Stage Wrapper Component
 *
 * 역할:
 * 1. CanvasEngine 인스턴스 생성 및 관리
 * 2. Zustand Store 변경 감지 → Konva 업데이트
 * 3. Canvas 컨테이너 제공
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import { CanvasEngine } from '../core/CanvasEngine';

export function CanvasStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const rafRef = useRef<number | null>(null);

  const {
    document: editorDocument,
    activePageId,
    selectedIds,
    zoom,
    pan,
  } = useEditorStore();

  // CanvasEngine 초기화
  useEffect(() => {
    if (!containerRef.current || !editorDocument) return;

    // 컨테이너 크기 가져오기
    const rect = containerRef.current.getBoundingClientRect();

    // CanvasEngine 생성
    engineRef.current = new CanvasEngine({
      container: containerRef.current,
      width: rect.width,
      height: rect.height,
      store: useEditorStore.getState(),
    });

    // 활성 페이지 렌더링
    const activePage = editorDocument.pages.find((p) => p.id === activePageId);
    if (activePage && engineRef.current) {
      engineRef.current.renderPage(activePage);
    }

    // 윈도우 리사이즈 핸들러
    const handleResize = () => {
      if (containerRef.current && engineRef.current) {
        const newRect = containerRef.current.getBoundingClientRect();
        engineRef.current['stage'].setAttrs({
          width: newRect.width,
          height: newRect.height,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [editorDocument, activePageId]);

  // 활성 페이지 변경 시 다시 렌더링
  useEffect(() => {
    if (!engineRef.current || !editorDocument) return;

    const activePage = editorDocument.pages.find((p) => p.id === activePageId);
    if (activePage) {
      engineRef.current.renderPage(activePage);
    }
  }, [editorDocument, activePageId]);

  // 선택 상태 업데이트
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.updateSelection(selectedIds);
  }, [selectedIds]);

  // 줌/팬 업데이트
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.updateView(zoom, pan);
  }, [zoom, pan]);

  // Store 변경 감지 → Konva 동기화
  useEffect(() => {
    if (!engineRef.current || !editorDocument) return;

    const unsubscribe = useEditorStore.subscribe((state, prevState) => {
      if (!engineRef.current) return;

      const activePage = state.document?.pages.find((p) => p.id === state.activePageId);
      if (!activePage) return;

      // 객체 추가/삭제 감지 → 전체 다시 렌더링
      const prevPage = prevState.document?.pages.find((p) => p.id === prevState.activePageId);
      if (
        !prevPage ||
        activePage.objects.length !== prevPage.objects.length ||
        activePage.objects.some((obj, i) => obj.id !== prevPage.objects[i]?.id)
      ) {
        engineRef.current.renderPage(activePage);
        return;
      }

      // 객체 속성 변경 감지 → 개별 업데이트
      activePage.objects.forEach((obj, i) => {
        const prevObj = prevPage.objects[i];
        if (prevObj && hasObjectChanged(obj, prevObj)) {
          engineRef.current!.updateObject(obj.id, obj);
        }
      });
    });

    return unsubscribe;
  }, [editorDocument]);

  if (!editorDocument) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-gray-400">No document loaded</p>
      </div>
    );
  }

  const activePage = editorDocument.pages.find((p) => p.id === activePageId);

  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden">
      {/* Canvas Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={containerRef}
          className="bg-white shadow-lg"
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 bg-white shadow-lg rounded-lg p-2 flex items-center gap-2">
        <ZoomButton onClick={() => useEditorStore.getState().setZoom(zoom - 0.1)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </ZoomButton>

        <span className="text-xs font-medium text-gray-600 min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <ZoomButton onClick={() => useEditorStore.getState().setZoom(zoom + 0.1)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </ZoomButton>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        <ZoomButton
          onClick={() => useEditorStore.getState().resetView()}
          title="Reset View (100%)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </ZoomButton>
      </div>

      {/* Canvas Info */}
      <div className="absolute top-4 left-4 bg-white shadow-lg rounded-lg px-3 py-2">
        <div className="text-xs text-gray-600">
          {activePage?.name || 'Page'} • {activePage?.width} × {activePage?.height}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {activePage?.objects.length || 0} objects
        </div>
      </div>
    </div>
  );
}

// ========================================
// Zoom Button Component
// ========================================

type ZoomButtonProps = {
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
};

function ZoomButton({ onClick, title, children }: ZoomButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
    >
      {children}
    </button>
  );
}

// ========================================
// Helper Functions
// ========================================

/**
 * 객체가 변경되었는지 확인
 */
function hasObjectChanged(obj: any, prevObj: any): boolean {
  const keys: (keyof typeof obj)[] = [
    'x',
    'y',
    'width',
    'height',
    'rotation',
    'opacity',
    'visible',
    'text',
    'fontSize',
    'fill',
    'stroke',
  ];

  return keys.some((key) => obj[key] !== prevObj[key]);
}
