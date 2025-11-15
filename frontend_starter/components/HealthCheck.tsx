'use client';

import { useState, useEffect } from 'react';

export default function HealthCheck() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://100.123.51.5:8000'}/health`,
        { method: 'GET' }
      );

      if (response.ok) {
        setBackendStatus('online');
        setError(null);
      } else {
        setBackendStatus('offline');
        setError(`HTTP ${response.status}`);
      }
    } catch (err) {
      setBackendStatus('offline');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Backend Health Check</h3>
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            backendStatus === 'online'
              ? 'bg-green-500'
              : backendStatus === 'offline'
              ? 'bg-red-500'
              : 'bg-yellow-500'
          }`}
        />
        <span className="text-sm">
          {backendStatus === 'online'
            ? 'Backend Online'
            : backendStatus === 'offline'
            ? 'Backend Offline'
            : 'Checking...'}
        </span>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">Error: {error}</p>}
      <button
        onClick={checkBackendHealth}
        className="mt-2 text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
      >
        Refresh
      </button>
    </div>
  );
}
