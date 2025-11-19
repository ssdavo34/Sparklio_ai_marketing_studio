import { useState, useEffect, useCallback } from 'react';

export interface AgentStatus {
    id: string;
    name: string;
    status: 'active' | 'idle' | 'error' | 'offline';
    lastActive: string;
    tasksCompleted: number;
    errorRate: number;
}

export interface DailyCost {
    date: string;
    tokens: number;
    cost: number;
}

export const useAdminDashboard = () => {
    const [agents, setAgents] = useState<AgentStatus[]>([]);
    const [costs, setCosts] = useState<DailyCost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Real API call
            const response = await fetch('/api/v1/admin/stats');

            if (response.ok) {
                const data = await response.json();
                setAgents(data.agents);
                setCosts(data.costs);
            } else {
                console.error('Failed to fetch admin data');
            }
        } catch (error) {
            console.error('Admin dashboard error:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    return {
        agents,
        costs,
        isLoading,
        refresh: fetchData
    };
};
