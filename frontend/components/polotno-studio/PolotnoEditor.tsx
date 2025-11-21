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

import React, { useEffect, useRef, useMemo } from 'react';
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
    const containerRef = useRef<HTMLDivElement>(null);
    const onStoreReadyRef = useRef(onStoreReady);

    // Update ref when callback changes
    useEffect(() => {
        onStoreReadyRef.current = onStoreReady;
    }, [onStoreReady]);

    // Create store once using useMemo
    const store = useMemo(() => {
        // API key must be passed from parent component
        if (!apiKey) {
            console.error('[PolotnoEditor] ❌ API key is required but not provided!');
            throw new Error('Polotno API key is required');
        }

        console.log('[PolotnoEditor] Creating store with key (ONCE):', apiKey.substring(0, 8) + '...');

        const newStore = createStore({
            key: apiKey,
            showCredit: false,
        });

        // Set default page size (A4)
        newStore.setSize(595, 842);

        return newStore;
    }, [apiKey]); // Recreate if apiKey changes

    // Notify parent component when store is ready
    useEffect(() => {
        if (store && onStoreReadyRef.current) {
            onStoreReadyRef.current(store);
        }
    }, [store]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            console.log('[PolotnoEditor] Cleaning up store');
            store.clear();
        };
    }, [store]);

    if (!store) {
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
                        store={store}
                        sections={DEFAULT_SECTIONS}
                    />
                </SidePanelWrap>
                <WorkspaceWrap>
                    <Toolbar store={store} />
                    <Workspace store={store} />
                    <ZoomButtons store={store} />
                </WorkspaceWrap>
            </PolotnoContainer>
        </div>
    );
}