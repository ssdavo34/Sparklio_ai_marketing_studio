import React from 'react';
import { AgentStatus } from '../../hooks/useAdminDashboard';
import { Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface AgentStatusCardProps {
    agent: AgentStatus;
}

export const AgentStatusCard: React.FC<AgentStatusCardProps> = ({ agent }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-green-500 bg-green-50 border-green-200';
            case 'idle': return 'text-slate-500 bg-slate-50 border-slate-200';
            case 'error': return 'text-red-500 bg-red-50 border-red-200';
            default: return 'text-slate-400 bg-slate-50 border-slate-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <Activity className="w-5 h-5" />;
            case 'idle': return <Clock className="w-5 h-5" />;
            case 'error': return <AlertCircle className="w-5 h-5" />;
            default: return <CheckCircle className="w-5 h-5" />;
        }
    };

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${getStatusColor(agent.status)}`}>
                        {getStatusIcon(agent.status)}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">{agent.name}</h3>
                        <p className="text-xs text-slate-500">ID: {agent.id}</p>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(agent.status)}`}>
                    {agent.status.toUpperCase()}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                    <p className="text-xs text-slate-500 mb-1">Tasks Completed</p>
                    <p className="font-semibold text-slate-800">{agent.tasksCompleted.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 mb-1">Error Rate</p>
                    <p className={`font-semibold ${agent.errorRate > 5 ? 'text-red-500' : 'text-slate-800'}`}>
                        {agent.errorRate}%
                    </p>
                </div>
                <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-1">Last Active</p>
                    <p className="text-sm text-slate-700">{new Date(agent.lastActive).toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
};
