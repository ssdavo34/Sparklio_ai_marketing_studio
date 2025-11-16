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

import { StudioLayout } from './layout/StudioLayout';

export function CanvasStudioShell() {
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
