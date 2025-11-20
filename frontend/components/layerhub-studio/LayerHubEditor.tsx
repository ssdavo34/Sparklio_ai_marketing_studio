/**
 * LayerHub Editor Component
 *
 * Experimental v2 editor using LayerHub SDK
 * Future replacement for Polotno
 *
 * @author C팀 (Frontend Team)
 * @version 2.0 (Experimental)
 */

'use client';

import React, { useState, useEffect } from 'react';
import Editor, { Canvas, Footer, Navbar, Panel, ContextMenu } from '@layerhub-pro/react';

interface LayerHubEditorProps {
    onDesignUpdate?: (design: any) => void;
}

export function LayerHubEditor({ onDesignUpdate }: LayerHubEditorProps) {
    const [design, setDesign] = useState<any>(null);

    // Initialize with empty design
    useEffect(() => {
        const initialDesign = {
            name: 'Untitled Design',
            frame: {
                width: 1920,
                height: 1080,
            },
            objects: [],
        };
        setDesign(initialDesign);
    }, []);

    const handleDesignUpdate = (updatedDesign: any) => {
        setDesign(updatedDesign);
        if (onDesignUpdate) {
            onDesignUpdate(updatedDesign);
        }
    };

    if (!design) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading LayerHub Editor...</p>
                </div>
            </div>
        );
    }

    return (
        <Editor config={{}} onUpdate={handleDesignUpdate}>
            <Navbar />
            <div style={{ display: 'flex', flex: 1 }}>
                <Panel />
                <Canvas />
            </div>
            <Footer />
            <ContextMenu />
        </Editor>
    );
}