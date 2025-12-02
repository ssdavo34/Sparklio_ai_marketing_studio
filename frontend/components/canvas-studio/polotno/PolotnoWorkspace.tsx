/**
 * Polotno Workspace
 *
 * 멀티 캔버스를 지원하는 Polotno 워크스페이스
 * - activeCanvasType에 따라 해당 캔버스 렌더링
 * - 탭 전환 시 캔버스 상태 유지
 * - Zustand Store와 동기화
 *
 * @author C팀 (Frontend Team)
 * @version 4.0 (2025-12-01 멀티캔버스)
 */

'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { PolotnoContainer, WorkspaceWrap } from 'polotno';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import { Workspace } from 'polotno/canvas/workspace';
import { useCanvasStore } from '../stores/useCanvasStore';
import { useLayoutStore } from '../stores/useLayoutStore';
import { CANVAS_CONFIGS } from '../stores/types';
import { getOrCreateCanvasStore } from './polotnoStoreSingleton';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { processPendingBrandDNA } from '@/hooks/useBrandToCanvas';
import type { StoreType } from 'polotno/model/store';

interface PolotnoWorkspaceProps {
  apiKey: string;
}

export function PolotnoWorkspace({ apiKey }: PolotnoWorkspaceProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pendingBrandDNAProcessed = useRef(false);

  // Store 연결
  const activeCanvasType = useCanvasStore((state) => state.activeCanvasType);
  const setCanvas = useCanvasStore((state) => state.setCanvas);
  const isViewMode = useLayoutStore((state) => state.isViewMode);

  // 현재 활성 캔버스의 Store
  const [currentStore, setCurrentStore] = useState<StoreType | null>(null);

  // 현재 캔버스 설정
  const canvasConfig = useMemo(() => CANVAS_CONFIGS[activeCanvasType], [activeCanvasType]);

  // Keyboard Shortcuts (Undo/Redo, Copy/Paste, etc.)
  useKeyboardShortcuts({
    enabled: !isViewMode,
    onShortcut: (shortcut) => {
      console.log('[PolotnoWorkspace] Keyboard shortcut:', shortcut);
    },
  });

  // Client-side mount check
  useEffect(() => {
    console.log('[PolotnoWorkspace] v4.0 mounted (Multi-canvas support)');
    setIsMounted(true);
  }, []);

  // 캔버스 타입 변경 시 해당 Store 로드/생성
  useEffect(() => {
    if (!isMounted) return;

    console.log(`[PolotnoWorkspace] ⭐ Canvas type changed to: ${activeCanvasType}`);
    console.log(`[PolotnoWorkspace] 🔄 Loading canvas for type: ${activeCanvasType}`);
    setIsLoading(true);

    // 캔버스 전환 시 레이아웃이 확정될 때까지 약간의 지연
    const loadCanvas = () => {
      try {
        // 해당 타입의 Store 가져오기 또는 생성
        const store = getOrCreateCanvasStore(activeCanvasType, apiKey);

        // Zustand Store에 등록
        setCanvas(activeCanvasType, store);

        // 현재 Store 설정
        setCurrentStore(store);

        console.log(`[PolotnoWorkspace] Canvas ${activeCanvasType} ready (${canvasConfig.width}x${canvasConfig.height})`);

        // Pending Brand DNA 처리 (brand-dna 캔버스일 때만, 한 번만)
        if (activeCanvasType === 'brand-dna' && !pendingBrandDNAProcessed.current) {
          pendingBrandDNAProcessed.current = true;
          setTimeout(() => {
            const processed = processPendingBrandDNA(store);
            if (processed) {
              console.log('[PolotnoWorkspace] Pending Brand DNA processed successfully');
            }
          }, 500);
        }

        setIsLoading(false);
      } catch (error) {
        console.error(`[PolotnoWorkspace] Failed to load canvas ${activeCanvasType}:`, error);
        setIsLoading(false);
      }
    };

    // requestAnimationFrame으로 레이아웃이 확정된 후 캔버스 로드
    const rafId = requestAnimationFrame(() => {
      setTimeout(loadCanvas, 50);
    });

    return () => cancelAnimationFrame(rafId);
  }, [isMounted, activeCanvasType, apiKey, setCanvas, canvasConfig]);

  // View Mode 변경 시 선택 해제
  useEffect(() => {
    if (currentStore && isViewMode) {
      currentStore.selectElements([]);
    }
  }, [isViewMode, currentStore]);

  // 로딩 상태
  if (!isMounted || isLoading || !currentStore) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-50" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Canvas...</p>
          <p className="text-xs text-gray-400 mt-1">
            {activeCanvasType} ({canvasConfig.width}x{canvasConfig.height})
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative" style={{ minHeight: '400px' }}>
      {/* 캔버스 타입 인디케이터 (개발용) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 z-50 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {activeCanvasType} ({canvasConfig.width}x{canvasConfig.height})
        </div>
      )}

      <PolotnoContainer style={{ width: '100%', height: '100%' }}>
        <WorkspaceWrap>
          <Workspace
            store={currentStore}
            components={{
              ContextMenu: () => null,
            }}
          />
          <ZoomButtons store={currentStore} />
        </WorkspaceWrap>
      </PolotnoContainer>
    </div>
  );
}
