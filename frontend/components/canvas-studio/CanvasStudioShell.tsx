/**
 * Canvas Studio Shell
 *
 * Canvas Studio의 최상위 컨테이너
 * 모든 Provider를 래핑하고 전역 상태를 초기화합니다.
 *
 * Provider 계층:
 * 1. (추후) EditorStoreProvider
 * 2. (추후) LayoutStoreProvider
 * 3. (추후) CanvasStoreProvider
 * 4. (추후) TabsStoreProvider
 * 5. StudioLayout (실제 UI)
 *
 * @author C팀 (Frontend Team)
 * @version 3.0
 */

'use client';

import { useEffect } from 'react';
import { StudioLayout } from './layout/StudioLayout';
import { useEditorStore } from './stores';

export function CanvasStudioShell() {
  // 초기 빈 document 설정
  useEffect(() => {
    const store = useEditorStore.getState();

    // 기존 document가 없거나 빈 페이지가 필요한 경우
    if (!store.document || !store.document.pages || store.document.pages.length === 0) {
      store.setDocument({
        id: 'doc-' + Date.now(),
        title: 'Untitled Design',
        mode: 'editor',
        pages: [{
          id: 'page-1',
          title: 'Page 1',
          order: 0,
          objects: [], // 빈 캔버스로 시작
          width: 800,
          height: 600,
        }],
        currentPageId: 'page-1',
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: 'User',
        },
      });
    }
  }, []);

  return (
    // TODO: Phase 2에서 Provider 추가
    // <EditorStoreProvider>
    //   <LayoutStoreProvider>
    //     <CanvasStoreProvider>
    //       <TabsStoreProvider>
    <StudioLayout />
    //       </TabsStoreProvider>
    //     </CanvasStoreProvider>
    //   </LayoutStoreProvider>
    // </EditorStoreProvider>
  );
}
