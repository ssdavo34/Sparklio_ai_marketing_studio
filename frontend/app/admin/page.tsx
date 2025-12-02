'use client';

import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { AgentStatusCard } from '../../components/admin/AgentStatusCard';
import { CostChart } from '../../components/admin/CostChart';
import { LayoutDashboard, RefreshCw, FileText, Layers, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const INTERNAL_MODE = process.env.NEXT_PUBLIC_INTERNAL_MODE === 'true';

export default function AdminPage() {
    const { agents, costs, isLoading, refresh } = useAdminDashboard();

    const totalCost = costs.reduce((sum, day) => sum + day.cost, 0);
    const totalTokens = costs.reduce((sum, day) => sum + day.tokens, 0);

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <LayoutDashboard className="w-8 h-8 text-indigo-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">System Monitor</h1>
                            <p className="text-slate-500">Multi-Agent System Status Dashboard</p>
                        </div>
                    </div>
                    <button
                        onClick={refresh}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-5 h-5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <p className="text-sm text-slate-500 mb-1">Total Active Agents</p>
                        <p className="text-3xl font-bold text-slate-800">
                            {agents.filter(a => a.status === 'active').length} / {agents.length}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <p className="text-sm text-slate-500 mb-1">Est. Cost (Last 7 Days)</p>
                        <p className="text-3xl font-bold text-slate-800">${totalCost.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <p className="text-sm text-slate-500 mb-1">Total Tokens Processed</p>
                        <p className="text-3xl font-bold text-slate-800">{(totalTokens / 1000000).toFixed(1)}M</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Agent Status */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-slate-800">Agent Status</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {agents.map(agent => (
                                <AgentStatusCard key={agent.id} agent={agent} />
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Cost Chart */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-800">Cost Analysis</h2>
                        <div className="h-[400px]">
                            <CostChart data={costs} />
                        </div>
                    </div>
                </div>

                {/* Internal Mode: Editor Selection */}
                {INTERNAL_MODE && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">INTERNAL</span>
                            Editor Selection
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Polotno Editor */}
                            <Link href="/studio/polotno" className="group">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800">Polotno Editor</h3>
                                            <span className="text-xs text-green-600 font-medium">v1.0 - Available</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-3">Production-ready editor with full features</p>
                                    <div className="flex items-center text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
                                        Launch <ArrowRight className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                            </Link>

                            {/* Konva Editor */}
                            <Link href="/studio/konva" className="group">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <Layers className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800">Konva Editor</h3>
                                            <span className="text-xs text-slate-500 font-medium">Legacy</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-3">Original editor implementation (reference)</p>
                                    <div className="flex items-center text-purple-600 text-sm font-medium group-hover:gap-2 transition-all">
                                        Launch <ArrowRight className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                            </Link>

                            {/* LayerHub Editor */}
                            <Link href="/studio/layerhub" className="group">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-green-400 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <Package className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800">LayerHub Editor</h3>
                                            <span className="text-xs text-amber-600 font-medium">v2.0 - Experimental</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-3">Next-generation editor (experimental)</p>
                                    <div className="flex items-center text-green-600 text-sm font-medium group-hover:gap-2 transition-all">
                                        Launch <ArrowRight className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* Legacy Editor Selection Page Link */}
                        <div className="flex justify-end">
                            <Link
                                href="/studio"
                                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                            >
                                에디터 선택 페이지 전체 보기 <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
