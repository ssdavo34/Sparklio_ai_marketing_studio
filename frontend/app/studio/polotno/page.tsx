/**
 * Polotno Editor Page
 *
 * Production-ready editor using Polotno SDK
 * This will be the main editor for Sparklio v1
 *
 * Route: /studio/polotno
 */

import React from 'react';
import { PolotnoStudioShell } from '@/components/polotno-studio/PolotnoStudioShell';
import { EditorErrorBoundary } from '@/components/common/EditorErrorBoundary';

export default function PolotnoStudioPage() {
    return (
        <EditorErrorBoundary editorType="polotno">
            <main className="h-screen w-screen overflow-hidden">
                <PolotnoStudioShell />
            </main>
        </EditorErrorBoundary>
    );
}