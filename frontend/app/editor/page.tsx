/**
 * Editor Legacy Route (Deprecated)
 *
 * 이 라우트는 더 이상 사용되지 않습니다.
 * Canvas Studio v3 (/studio)로 자동 리다이렉트됩니다.
 *
 * @deprecated 2025-11-19
 * @see /studio - Canvas Studio v3 (Konva 기반)
 *
 * 레거시 코드는 git 브랜치에 백업됩니다:
 * - 브랜치: legacy/fabric-editor-v2
 * - 위치: src/modules/editor/
 */

import { redirect } from 'next/navigation';

export default function EditorPage() {
  // /editor로 접근 시 /studio로 리다이렉트
  redirect('/studio');
}
