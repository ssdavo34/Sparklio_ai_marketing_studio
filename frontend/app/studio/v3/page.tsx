/**
 * Canvas Studio v3.1 - Main Page
 *
 * Polotno-based editor with Sparklio custom UI
 *
 * @author C팀 (Frontend Team)
 * @version 3.1
 * @date 2025-11-22
 */

'use client';

import { PolotnoWorkspace } from '@/components/canvas-studio/polotno/PolotnoWorkspace';

const POLOTNO_API_KEY = 'ng2ylHnHO2NscxqyUEWy';

export default function CanvasStudioV3Page() {
  return (
    <div className="flex h-screen w-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4">
        <h1 className="text-lg font-semibold text-gray-900">
          Canvas Studio v3.1
        </h1>
        <div className="ml-4 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
          Block 2: Polotno Workspace
        </div>
      </header>

      {/* Canvas Area */}
      <main className="flex-1 overflow-hidden">
        <PolotnoWorkspace apiKey={POLOTNO_API_KEY} />
      </main>
    </div>
  );
}
