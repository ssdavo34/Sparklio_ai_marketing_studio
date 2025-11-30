import React, { useEffect } from 'react';
import { useBrandKitStore } from '../stores/useBrandKitStore';
import { Upload, Link as LinkIcon, Plus, Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { BrandColorToken } from '@/types/brandKit';

export function BrandKitPanel() {
    const {
        profile,
        sources,
        isLoading,
        lastAnalysisStatus,
        loadBrandKit,
        updateProfilePartial,
        addSource,
        addUrlSource,
        deleteSource,
        requestAnalysis
    } = useBrandKitStore();

    // Load initial data (Mock for now)
    useEffect(() => {
        loadBrandKit('mock-brand-id');
    }, [loadBrandKit]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            addSource(e.target.files[0], 'pdf');
        }
    };

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const input = form.elements.namedItem('url') as HTMLInputElement;
        if (input.value) {
            addUrlSource(input.value);
            input.value = '';
        }
    };

    const handleColorChange = (index: number, newHex: string) => {
        if (!profile?.visual?.colors) return;
        const newColors = [...profile.visual.colors];
        newColors[index] = { ...newColors[index], hex: newHex, source: 'manual' };
        updateProfilePartial({ visual: { ...profile.visual, colors: newColors } });
    };

    if (isLoading && !profile) {
        return <div className="p-4 text-center text-gray-500">Loading Brand Kit...</div>;
    }

    return (
        <div className="h-full flex flex-col bg-white overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Brand Kit</h2>
                <p className="text-xs text-gray-500 mt-1">브랜드 자산 및 AI 분석</p>
            </div>

            {/* 1. Brand Sources */}
            <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                    브랜드 문서
                </h3>

                <div className="space-y-2 mb-4">
                    {/* File Upload Button */}
                    <label className="flex items-center justify-center w-full h-10 px-4 transition bg-purple-600 border border-transparent rounded-md cursor-pointer hover:bg-purple-700 active:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                        <div className="flex items-center space-x-2 text-white">
                            <Upload className="w-4 h-4" />
                            <span className="text-sm font-medium">파일 업로드 (PDF, 이미지)</span>
                        </div>
                        <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.png,.jpg,.jpeg" />
                    </label>

                    {/* URL Input */}
                    <form onSubmit={handleUrlSubmit} className="flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <LinkIcon className="w-4 h-4 text-gray-400" />
                            </div>
                            <input
                                type="url"
                                name="url"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                placeholder="URL 크롤링"
                            />
                        </div>
                        <button type="submit" className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium">
                            추가
                        </button>
                    </form>
                </div>

                {/* Source List */}
                <div className="space-y-2">
                    {sources.map(source => (
                        <div key={source.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-100">
                            <div className="flex items-center gap-2 overflow-hidden">
                                {source.sourceType === 'file' ? <Upload className="w-3 h-3 text-gray-400" /> : <LinkIcon className="w-3 h-3 text-gray-400" />}
                                <span className="text-xs text-gray-700 truncate max-w-[120px]" title={source.title}>{source.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${source.status === 'done' ? 'bg-green-100 text-green-700' :
                                        source.status === 'analyzing' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-600'
                                    }`}>
                                    {source.status}
                                </span>
                                <button onClick={() => deleteSource(source.id)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Analyze Button */}
                <button
                    onClick={requestAnalysis}
                    disabled={lastAnalysisStatus === 'running' || sources.length === 0}
                    className={`w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${lastAnalysisStatus === 'running'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-sm'
                        }`}
                >
                    {lastAnalysisStatus === 'running' ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            분석 중...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-4 h-4" />
                            Brand DNA 자동 분석
                        </>
                    )}
                </button>
            </div>

            {/* 2. Brand Colors */}
            <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Brand Colors
                </h3>

                <div className="grid grid-cols-4 gap-2">
                    {profile?.visual?.colors.map((color, idx) => (
                        <div key={idx} className="group relative">
                            <div
                                className="w-full aspect-square rounded-lg shadow-sm border border-gray-200 cursor-pointer transition-transform hover:scale-105"
                                style={{ backgroundColor: color.hex }}
                            >
                                <input
                                    type="color"
                                    value={color.hex}
                                    onChange={(e) => handleColorChange(idx, e.target.value)}
                                    className="opacity-0 w-full h-full cursor-pointer"
                                />
                            </div>
                            <div className="text-[10px] text-center mt-1 text-gray-500 truncate">{color.name}</div>
                        </div>
                    ))}
                    <button className="w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-purple-500 hover:text-purple-500 transition-colors">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Click to add to canvas</p>
            </div>

            {/* 3. Tone & Manner */}
            <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-pink-500 rounded-full"></span>
                    Tone & Manner
                </h3>

                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Summary</label>
                        <textarea
                            className="w-full text-xs p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                            rows={2}
                            value={profile?.tone?.summary || ''}
                            onChange={(e) => updateProfilePartial({ tone: { ...profile!.tone!, summary: e.target.value } })}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Keywords</label>
                        <div className="flex flex-wrap gap-1">
                            {profile?.tone?.keywords.map((keyword, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                    {keyword}
                                </span>
                            ))}
                            <button className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100">
                                <Plus className="w-3 h-3 mr-1" /> Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
