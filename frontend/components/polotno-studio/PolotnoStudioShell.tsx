/**
 * Polotno Studio Shell
 *
 * Main container for Polotno editor with Sparklio features
 * Integrates Spark Chat, Meeting AI, and Brand Kit
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 */

'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ChatInterface } from '../spark/ChatInterface';
import { Sparkles, Video, Palette, Menu, X } from 'lucide-react';

// Dynamic import to avoid SSR issues
const PolotnoEditorWrapper = dynamic(
    () => import('./PolotnoEditorWrapper').then(mod => ({ default: mod.PolotnoEditorWrapper })),
    { ssr: false }
);

type PanelType = 'spark' | 'meeting' | 'brandkit' | null;

export function PolotnoStudioShell() {
    const [activePanel, setActivePanel] = useState<PanelType>(null);
    const [editorStore, setEditorStore] = useState<any>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handleStoreReady = (store: any) => {
        setEditorStore(store);
        console.log('Polotno store ready:', store);
    };

    const togglePanel = (panel: PanelType) => {
        setActivePanel(activePanel === panel ? null : panel);
    };

    return (
        <div className="h-screen w-screen flex bg-gray-50">
            {/* Left Sidebar - Sparklio Tools */}
            <div className={`${isSidebarCollapsed ? 'w-16' : 'w-14'} bg-slate-900 flex flex-col items-center py-4 transition-all duration-300 z-20`}>
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="mb-6 p-2 text-slate-400 hover:text-white transition-colors"
                >
                    {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </button>

                <div className="flex flex-col gap-4">
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
            <div className="flex-1 flex relative h-screen">
                {/* Polotno Editor */}
                <div className="flex-1 h-full">
                    <PolotnoEditorWrapper onStoreReady={handleStoreReady} />
                </div>

                {/* Right Panel - Sparklio Features */}
                {activePanel && (
                    <div className="w-96 border-l border-gray-200 bg-white shadow-xl z-10">
                        {activePanel === 'spark' && (
                            <div className="h-full flex flex-col">
                                <div className="p-4 border-b bg-gradient-to-r from-indigo-500 to-purple-600">
                                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                                        <Sparkles className="w-5 h-5" />
                                        Spark Chat
                                    </h2>
                                    <p className="text-white/80 text-sm mt-1">
                                        AI 어시스턴트로 디자인 생성
                                    </p>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <ChatInterface embedded={true} />
                                </div>
                            </div>
                        )}

                        {activePanel === 'meeting' && (
                            <div className="h-full p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Video className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-lg">Meeting AI</h2>
                                        <p className="text-sm text-gray-500">회의 내용 기반 디자인</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="text-sm text-gray-600 mb-3">회의록 업로드</p>
                                        <input
                                            type="file"
                                            accept=".txt,.pdf,.docx"
                                            className="w-full text-sm"
                                        />
                                    </div>
                                    <button className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                                        회의록 분석 시작
                                    </button>
                                </div>
                            </div>
                        )}

                        {activePanel === 'brandkit' && (
                            <div className="h-full p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Palette className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-lg">Brand Kit</h2>
                                        <p className="text-sm text-gray-500">브랜드 에셋 관리</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    {/* Colors */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">브랜드 컬러</h3>
                                        <div className="flex gap-2">
                                            <div className="w-12 h-12 bg-indigo-600 rounded-lg" title="#4F46E5" />
                                            <div className="w-12 h-12 bg-purple-600 rounded-lg" title="#9333EA" />
                                            <div className="w-12 h-12 bg-pink-600 rounded-lg" title="#EC4899" />
                                            <div className="w-12 h-12 bg-gray-900 rounded-lg" title="#111827" />
                                        </div>
                                    </div>

                                    {/* Fonts */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">브랜드 폰트</h3>
                                        <div className="space-y-2">
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="font-bold">Pretendard</p>
                                                <p className="text-xs text-gray-500">제목용</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p>Noto Sans KR</p>
                                                <p className="text-xs text-gray-500">본문용</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Logos */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">로고</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
                                                <Sparkles className="w-8 h-8 text-indigo-600" />
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
                                                <span className="text-xl font-bold text-indigo-600">S</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}