'use client';

import HealthCheck from '@/components/HealthCheck';

export default function TestPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">API Test Page</h1>

        <div className="space-y-6">
          <HealthCheck />

          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Environment Variables</h3>
            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium">API URL:</span>{' '}
                {process.env.NEXT_PUBLIC_API_URL || 'Not set'}
              </p>
              <p>
                <span className="font-medium">Environment:</span>{' '}
                {process.env.NEXT_PUBLIC_APP_ENV || 'Not set'}
              </p>
              <p>
                <span className="font-medium">Max File Size:</span>{' '}
                {process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || 'Not set'} MB
              </p>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Next Steps</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Backend health check 확인</li>
              <li>Asset upload 기능 테스트</li>
              <li>SmartRouter 연동 테스트</li>
              <li>Editor 컴포넌트 구현</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
