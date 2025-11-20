/**
 * LayerHub Editor Page
 *
 * Next-generation editor using LayerHub SDK
 * This will be the v2 editor for Sparklio (experimental)
 *
 * Route: /studio/layerhub
 */

import React from 'react';
import { LayerHubStudioShell } from '@/components/layerhub-studio/LayerHubStudioShell';
import { EditorErrorBoundary } from '@/components/common/EditorErrorBoundary';

export default function LayerHubStudioPage() {
    return (
        <EditorErrorBoundary editorType="layerhub">
            <main className="h-screen w-screen overflow-hidden">
                <LayerHubStudioShell />
            </main>
        </EditorErrorBoundary>
    );
}