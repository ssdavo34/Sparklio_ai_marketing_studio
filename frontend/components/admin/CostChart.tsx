import React from 'react';
import { DailyCost } from '../../hooks/useAdminDashboard';

interface CostChartProps {
    data: DailyCost[];
}

export const CostChart: React.FC<CostChartProps> = ({ data }) => {
    const maxCost = Math.max(...data.map(d => d.cost), 1);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
            <h3 className="font-bold text-slate-800 mb-6">Daily Cost & Token Usage (Last 7 Days)</h3>

            <div className="flex items-end justify-between h-64 gap-4">
                {data.map((day, index) => (
                    <div key={index} className="flex flex-col items-center gap-2 flex-1 group relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-slate-800 text-white text-xs p-2 rounded shadow-lg whitespace-nowrap">
                            <p>Date: {day.date}</p>
                            <p>Cost: ${day.cost.toFixed(2)}</p>
                            <p>Tokens: {day.tokens.toLocaleString()}</p>
                        </div>

                        {/* Bar */}
                        <div
                            className="w-full bg-indigo-100 rounded-t-lg relative overflow-hidden hover:bg-indigo-200 transition-colors cursor-pointer"
                            style={{ height: `${(day.cost / maxCost) * 100}%` }}
                        >
                            <div
                                className="absolute bottom-0 left-0 right-0 bg-indigo-500 transition-all duration-500"
                                style={{ height: '100%' }}
                            />
                        </div>

                        {/* Label */}
                        <div className="text-xs text-slate-500 font-medium">
                            {day.date.split('-').slice(1).join('/')}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
