'use client';

import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { AgentStatusCard } from '../../components/admin/AgentStatusCard';
import { CostChart } from '../../components/admin/CostChart';
import { LayoutDashboard, RefreshCw } from 'lucide-react';

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
            </div>
        </div>
    );
}
