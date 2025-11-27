/**
 * Polotno Workspace
 *
 * Polotno SDK를 통합하는 핵심 컴포넌트
 * - Polotno Store 싱글톤으로 관리 (뷰 전환 시 상태 유지)
 * - Zustand Store와 동기화
 * - Canvas 렌더링
 *
 * @author C팀 (Frontend Team)
 * @version 3.2
 * @date 2025-11-26
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { PolotnoContainer, WorkspaceWrap } from 'polotno';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import { Workspace } from 'polotno/canvas/workspace';
import { useCanvasStore } from '../stores/useCanvasStore';
import { useLayoutStore } from '../stores/useLayoutStore';
import {
  getOrCreatePolotnoStore,
  isPolotnoStoreInitialized,
} from './polotnoStoreSingleton';

interface PolotnoWorkspaceProps {
  apiKey: string;
}

export function PolotnoWorkspace({ apiKey }: PolotnoWorkspaceProps) {
  const storeRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const setPolotnoStore = useCanvasStore((state) => state.setPolotnoStore);
  const currentTemplate = useCanvasStore((state) => state.currentTemplate);
  const isViewMode = useLayoutStore((state) => state.isViewMode);

  // Client-side mount check
  useEffect(() => {
    console.log('[PolotnoWorkspace] Component v3.3 mounted (Sizing fix applied)');
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // 싱글톤 Polotno Store 가져오기 또는 생성
    const store = getOrCreatePolotnoStore(apiKey);
    const wasAlreadyInitialized = isPolotnoStoreInitialized();

    // 새로 생성된 경우에만 초기 페이지 추가
    if (store.pages.length === 0) {
      store.addPage({
        width: currentTemplate.width,
        height: currentTemplate.height,
      });
      console.log('[PolotnoWorkspace] Added initial page');
    } else {
      console.log('[PolotnoWorkspace] Using existing pages:', store.pages.length);
    }

    storeRef.current = store;
    setPolotnoStore(store);
    setIsLoading(false);

    // 싱글톤이므로 cleanup에서 store를 파괴하지 않음
    return () => {
      // storeRef만 정리, 실제 store는 유지
      console.log('[PolotnoWorkspace] Component unmounting, store preserved');
    };
  }, [isMounted, apiKey, setPolotnoStore, currentTemplate.width, currentTemplate.height]);

  // View Mode 변경 시 선택 해제
  useEffect(() => {
    if (storeRef.current && isViewMode) {
      // View Mode로 전환 시 모든 선택 해제
      storeRef.current.selectElements([]);
    }
  }, [isViewMode]);

  if (!isMounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative flex flex-col" style={{ minHeight: '500px' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <PolotnoContainer style={{ width: '100%', height: '100%' }}>
          <WorkspaceWrap>
            <Workspace
              store={storeRef.current}
              components={{
                // Disable context menu
                ContextMenu: () => null,
              }}
            />
            <ZoomButtons store={storeRef.current} />
          </WorkspaceWrap>
        </PolotnoContainer>
      </div>
    </div>
  );
}
