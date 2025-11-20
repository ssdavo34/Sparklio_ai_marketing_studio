/**
 * Canvas Studio Router Page
 *
 * This page serves as the main entry point for Canvas Studio.
 * It provides access to different editor implementations:
 * - Polotno (v1 - Production ready)
 * - Konva (Legacy/Reference)
 * - LayerHub (v2 - Experimental)
 *
 * Route: /studio
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Layers, Package, ArrowRight } from 'lucide-react';

export default function StudioRouterPage() {
    const router = useRouter();

    // Auto-redirect to Polotno once it's ready
    // For now, show selection page
    const autoRedirect = false; // Will be true when Polotno is production-ready

    useEffect(() => {
        if (autoRedirect) {
            router.push('/studio/polotno');
        }
    }, [autoRedirect, router]);

    const editors = [
        {
            id: 'polotno',
            name: 'Polotno Editor',
            version: 'v1.0',
            status: 'available',
            description: 'Production-ready editor with full features',
            icon: <FileText className="w-8 h-8" />,
            path: '/studio/polotno',
            color: 'from-blue-500 to-cyan-500',
            recommended: true,
        },
        {
            id: 'konva',
            name: 'Konva Editor',
            version: 'Legacy',
            status: 'available',
            description: 'Original editor implementation (reference)',
            icon: <Layers className="w-8 h-8" />,
            path: '/studio/konva',
            color: 'from-purple-500 to-pink-500',
            recommended: false,
        },
        {
            id: 'layerhub',
            name: 'LayerHub Editor',
            version: 'v2.0',
            status: 'available',
            description: 'Next-generation editor (experimental)',
            icon: <Package className="w-8 h-8" />,
            path: '/studio/layerhub',
            color: 'from-green-500 to-emerald-500',
            recommended: false,
        },
    ];

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="container mx-auto px-6 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-white mb-4">
                        Sparklio Canvas Studio
                    </h1>
                    <p className="text-xl text-slate-300">
                        Choose your editor experience
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {editors.map((editor) => (
                        <div
                            key={editor.id}
                            className={`relative group ${
                                editor.status !== 'available' ? 'opacity-75' : ''
                            }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl"
                                 style={{
                                     background: `linear-gradient(to right, ${editor.color.split(' ')[1]}, ${editor.color.split(' ')[3]})`
                                 }}
                            />

                            <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-8 hover:border-slate-600 transition-all duration-300 hover:transform hover:-translate-y-1">
                                {editor.recommended && (
                                    <div className="absolute -top-3 left-8 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full">
                                        RECOMMENDED
                                    </div>
                                )}

                                <div className={`mb-6 inline-flex p-3 rounded-xl bg-gradient-to-br ${editor.color} text-white`}>
                                    {editor.icon}
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-2">
                                    {editor.name}
                                </h3>

                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-sm text-slate-400">
                                        {editor.version}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                        editor.status === 'available'
                                            ? 'bg-green-500/20 text-green-400'
                                            : editor.status === 'coming-soon'
                                            ? 'bg-yellow-500/20 text-yellow-400'
                                            : 'bg-purple-500/20 text-purple-400'
                                    }`}>
                                        {editor.status.replace('-', ' ').toUpperCase()}
                                    </span>
                                </div>

                                <p className="text-slate-300 mb-6 min-h-[48px]">
                                    {editor.description}
                                </p>

                                <button
                                    onClick={() => editor.status === 'available' && router.push(editor.path)}
                                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                                        editor.status === 'available'
                                            ? 'bg-white/10 hover:bg-white/20 text-white'
                                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    }`}
                                    disabled={editor.status !== 'available'}
                                >
                                    {editor.status === 'available' ? (
                                        <>
                                            Launch Editor
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    ) : editor.status === 'coming-soon' ? (
                                        'Coming Soon'
                                    ) : (
                                        'In Development'
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-slate-400 text-sm">
                        Tip: Polotno Editor will become the default editor once available
                    </p>
                </div>
            </div>
        </main>
    );
}