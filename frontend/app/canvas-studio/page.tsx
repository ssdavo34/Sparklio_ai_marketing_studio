/**
 * Canvas Studio Legacy Route - DEPRECATED
 *
 * This route redirects to the canonical editor path: /studio/v3
 *
 * Route: /canvas-studio (ALIAS)
 * Redirects to: /studio/v3
 *
 * @deprecated Use /studio/v3 instead
 * @see MAIN_EDITOR_PATH.md
 */

import { redirect } from 'next/navigation';

export default function CanvasStudioLegacyPage() {
  redirect('/studio/v3');
}
