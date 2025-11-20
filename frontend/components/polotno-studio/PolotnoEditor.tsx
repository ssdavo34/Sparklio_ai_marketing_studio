/**
 * Polotno Editor Component
 *
 * Main wrapper for the Polotno SDK
 * Provides the core editor functionality
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { PolotnoContainer, SidePanelWrap, WorkspaceWrap } from 'polotno';
import { Workspace } from 'polotno/canvas/workspace';
import { SidePanel } from 'polotno/side-panel';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import { createStore } from 'polotno/model/store';

// Import default sections
import { DEFAULT_SECTIONS } from 'polotno/side-panel';

interface PolotnoEditorProps {
    apiKey?: string;
    onStoreReady?: (store: any) => void;
}

export function PolotnoEditor({ apiKey, onStoreReady }: PolotnoEditorProps) {
    const storeRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Create store with API key
        const store = createStore({
            key: apiKey || process.env.NEXT_PUBLIC_POLOTNO_API_KEY || 'free',
            // Enable all features
            showCredit: !apiKey, // Show credit only in free mode
        });

        // Set default page size (A4)
        store.setSize(595, 842);

        // Save store reference
        storeRef.current = store;

        // Notify parent component
        if (onStoreReady) {
            onStoreReady(store);
        }

        // Cleanup
        return () => {
            store.clear();
        };
    }, [apiKey, onStoreReady]);

    if (!storeRef.current) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading Polotno Editor...</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="h-full w-full">
            <PolotnoContainer className="h-full">
                <SidePanelWrap>
                    <SidePanel
                        store={storeRef.current}
                        sections={DEFAULT_SECTIONS}
                    />
                </SidePanelWrap>
                <WorkspaceWrap>
                    <Toolbar store={storeRef.current} />
                    <Workspace store={storeRef.current} />
                    <ZoomButtons store={storeRef.current} />
                </WorkspaceWrap>
            </PolotnoContainer>
        </div>
    );
}