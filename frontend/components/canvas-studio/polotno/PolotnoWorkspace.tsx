/**
 * Polotno Workspace
 *
 * Polotno SDK를 통합하는 핵심 컴포넌트
 * - Polotno Store 초기화 및 관리
 * - Zustand Store와 동기화
 * - Canvas 렌더링
 *
 * @author C팀 (Frontend Team)
 * @version 3.1
 * @date 2025-11-22
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { createStore } from 'polotno/model/store';
import { PolotnoContainer, SidePanelWrap, WorkspaceWrap } from 'polotno';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import { Workspace } from 'polotno/canvas/workspace';
import { useCanvasStore } from '../stores/useCanvasStore';

interface PolotnoWorkspaceProps {
  apiKey: string;
}

export function PolotnoWorkspace({ apiKey }: PolotnoWorkspaceProps) {
  const storeRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const setPolotnoStore = useCanvasStore((state) => state.setPolotnoStore);

  useEffect(() => {
    // Polotno Store 초기화
    const store = createStore({
      key: apiKey,
      showCredit: true, // Free version requirement
    });

    // 기본 페이지 추가
    store.addPage({
      width: 1920,
      height: 1080,
    });

    storeRef.current = store;
    setPolotnoStore(store);
    setIsLoading(false);

    return () => {
      // Cleanup
      if (storeRef.current) {
        storeRef.current = null;
      }
    };
  }, [apiKey, setPolotnoStore]);

  if (isLoading) {
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
    <div className="h-full w-full">
      <PolotnoContainer className="h-full">
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
  );
}
