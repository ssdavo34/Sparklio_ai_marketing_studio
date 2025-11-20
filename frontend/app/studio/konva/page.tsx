/**
 * Canvas Studio v3 Entry Page
 * 
 * This page serves as the entry point for the Canvas Studio application.
 * It renders the main shell component which handles the layout and state initialization.
 * 
 * Route: /studio
 */

import React from 'react';
import { CanvasStudioShell } from '@/components/canvas-studio/CanvasStudioShell';

export default function CanvasStudioPage() {
    return (
        <main className="h-screen w-screen overflow-hidden bg-[#1e1e1e] text-white">
            {/* 
        CanvasStudioShell contains the entire IDE layout:
        - Activity Bar (Leftmost)
        - Side Panel (Left)
        - Main Canvas (Center)
        - Right Dock (Right)
        - Bottom Panel (Bottom)
      */}
            <CanvasStudioShell />
        </main>
    );
}
