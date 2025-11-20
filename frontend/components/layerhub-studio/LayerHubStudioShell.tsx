/**
 * LayerHub Studio Shell
 *
 * Experimental v2 container for LayerHub editor
 * Integrates Spark Chat, Meeting AI, and Brand Kit
 *
 * @author C팀 (Frontend Team)
 * @version 2.0 (Experimental)
 */

'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { ChatInterface } from '../spark/ChatInterface';
import { Sparkles, Video, Palette, FlaskConical, X } from 'lucide-react';

// Dynamic import to avoid SSR issues
const LayerHubEditor = dynamic(
    () => import('./LayerHubEditor').then(mod => ({ default: mod.LayerHubEditor })),
    { ssr: false }
);

type PanelType = 'spark' | 'meeting' | 'brandkit' | null;

export function LayerHubStudioShell() {
    const [activePanel, setActivePanel] = useState<PanelType>(null);
    const [currentDesign, setCurrentDesign] = useState<any>(null);

    const handleDesignUpdate = (design: any) => {
        setCurrentDesign(design);
        console.log('LayerHub design updated:', design);
    };

    const togglePanel = (panel: PanelType) => {
        setActivePanel(activePanel === panel ? null : panel);
    };

    return (
        <div className="h-screen w-screen flex bg-gray-50">
            {/* Experimental Notice Banner */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 z-50">
                <div className="container mx-auto flex items-center justify-center gap-2">
                    <FlaskConical className="w-4 h-4" />
                    <span className="text-sm font-medium">
                        Experimental v2 Editor - For testing purposes only
                    </span>
                </div>
            </div>

            {/* Main Content - Adjusted for banner */}
            <div className="w-full flex mt-10">
                {/* Left Sidebar - Sparklio Tools */}
                <div className="w-14 bg-slate-900 flex flex-col items-center py-4 z-20">
                    <div className="flex flex-col gap-4 mt-2">
                        {/* Spark Chat */}
                        <button
                            onClick={() => togglePanel('spark')}
                            className={`p-3 rounded-lg transition-all ${
                                activePanel === 'spark'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                            title="Spark Chat"
                        >
                            <Sparkles className="w-5 h-5" />
                        </button>

                        {/* Meeting AI */}
                        <button
                            onClick={() => togglePanel('meeting')}
                            className={`p-3 rounded-lg transition-all ${
                                activePanel === 'meeting'
                                    ? 'bg-purple-600 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                            title="Meeting AI"
                        >
                            <Video className="w-5 h-5" />
                        </button>

                        {/* Brand Kit */}
                        <button
                            onClick={() => togglePanel('brandkit')}
                            className={`p-3 rounded-lg transition-all ${
                                activePanel === 'brandkit'
                                    ? 'bg-green-600 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                            title="Brand Kit"
                        >
                            <Palette className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Editor Area */}
                <div className="flex-1 flex relative">
                    {/* LayerHub Editor */}
                    <div className="flex-1">
                        <LayerHubEditor onDesignUpdate={handleDesignUpdate} />
                    </div>

                    {/* Right Panel - Sparklio Features */}
                    {activePanel && (
                        <div className="w-96 border-l border-gray-200 bg-white shadow-xl z-10">
                            <div className="h-full flex flex-col">
                                {/* Panel Header with Close */}
                                <div className="p-4 border-b bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-white font-bold text-lg flex items-center gap-2">
                                            {activePanel === 'spark' && <Sparkles className="w-5 h-5" />}
                                            {activePanel === 'meeting' && <Video className="w-5 h-5" />}
                                            {activePanel === 'brandkit' && <Palette className="w-5 h-5" />}
                                            {activePanel === 'spark' && 'Spark Chat'}
                                            {activePanel === 'meeting' && 'Meeting AI'}
                                            {activePanel === 'brandkit' && 'Brand Kit'}
                                        </h2>
                                        <p className="text-white/80 text-sm mt-1">
                                            {activePanel === 'spark' && 'AI 어시스턴트로 디자인 생성'}
                                            {activePanel === 'meeting' && '회의 내용 기반 디자인'}
                                            {activePanel === 'brandkit' && '브랜드 에셋 관리'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setActivePanel(null)}
                                        className="text-white/80 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Panel Content */}
                                <div className="flex-1 overflow-hidden">
                                    {activePanel === 'spark' && (
                                        <ChatInterface embedded={true} />
                                    )}

                                    {activePanel === 'meeting' && (
                                        <div className="p-6">
                                            <div className="space-y-4">
                                                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                                    <h3 className="font-medium text-purple-900 mb-2">
                                                        Meeting AI (Experimental)
                                                    </h3>
                                                    <p className="text-sm text-purple-700">
                                                        LayerHub 버전의 Meeting AI는 현재 개발 중입니다.
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-sm text-gray-600 mb-3">회의록 업로드</p>
                                                    <input
                                                        type="file"
                                                        accept=".txt,.pdf,.docx"
                                                        className="w-full text-sm"
                                                        disabled
                                                    />
                                                </div>
                                                <button
                                                    className="w-full py-3 bg-purple-600/50 text-white rounded-lg cursor-not-allowed"
                                                    disabled
                                                >
                                                    Coming Soon
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {activePanel === 'brandkit' && (
                                        <div className="p-6">
                                            <div className="space-y-6">
                                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                                    <h3 className="font-medium text-green-900 mb-2">
                                                        Brand Kit (Experimental)
                                                    </h3>
                                                    <p className="text-sm text-green-700">
                                                        LayerHub 버전의 Brand Kit은 현재 개발 중입니다.
                                                    </p>
                                                </div>

                                                {/* Sample Brand Colors */}
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-700 mb-3">브랜드 컬러</h3>
                                                    <div className="flex gap-2">
                                                        <div className="w-12 h-12 bg-green-600 rounded-lg opacity-50" />
                                                        <div className="w-12 h-12 bg-emerald-600 rounded-lg opacity-50" />
                                                        <div className="w-12 h-12 bg-teal-600 rounded-lg opacity-50" />
                                                        <div className="w-12 h-12 bg-gray-900 rounded-lg opacity-50" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}