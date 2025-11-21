/**
 * Polotno Editor Wrapper Component
 *
 * Conditionally renders either the actual Polotno editor or a stub
 * based on API key availability
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-21
 */

'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { PolotnoEditorStub } from '../editor/PolotnoEditorStub';

// Dynamic import to avoid loading Polotno SDK when not needed
const PolotnoEditor = dynamic(
  () => import('./PolotnoEditor').then(mod => ({ default: mod.PolotnoEditor })),
  {
    ssr: false,
    loading: () => <EditorLoading />
  }
);

interface PolotnoEditorWrapperProps {
  onStoreReady?: (store: any) => void;
}

function EditorLoading() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading editor...</p>
      </div>
    </div>
  );
}

export function PolotnoEditorWrapper({ onStoreReady }: PolotnoEditorWrapperProps) {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showKeyDialog, setShowKeyDialog] = useState(false);

  useEffect(() => {
    // Check if API key exists and is valid
    const apiKey = process.env.NEXT_PUBLIC_POLOTNO_API_KEY;
    const isValidKey = apiKey &&
                       apiKey !== 'your_polotno_api_key_here' &&
                       apiKey.length > 10;

    setHasApiKey(isValidKey);
    setChecking(false);

    if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      console.log('[PolotnoEditorWrapper] API Key check:', {
        hasKey: !!apiKey,
        isValid: isValidKey,
        keyLength: apiKey?.length || 0
      });
    }
  }, []);

  const handleApiKeyRequired = () => {
    setShowKeyDialog(true);
  };

  const handleApiKeySubmit = (key: string) => {
    // In a real implementation, this would:
    // 1. Validate the key
    // 2. Save it to environment or backend
    // 3. Reload the component
    console.log('API Key submitted:', key.substring(0, 5) + '...');
    setShowKeyDialog(false);
    // For now, just reload the page
    window.location.reload();
  };

  if (checking) {
    return <EditorLoading />;
  }

  if (showKeyDialog) {
    return <ApiKeyDialog onSubmit={handleApiKeySubmit} onCancel={() => setShowKeyDialog(false)} />;
  }

  if (!hasApiKey) {
    return <PolotnoEditorStub onApiKeyRequired={handleApiKeyRequired} />;
  }

  // API key is available, load the actual editor
  return <PolotnoEditor onStoreReady={onStoreReady} />;
}

/**
 * API Key Input Dialog
 */
function ApiKeyDialog({
  onSubmit,
  onCancel
}: {
  onSubmit: (key: string) => void;
  onCancel: () => void;
}) {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSubmit(apiKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Polotno API 키 설정</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API 키
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="polotno_api_key_here"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <p className="mt-2 text-sm text-gray-500">
              <a
                href="https://polotno.com/cabinet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Polotno 대시보드
              </a>
              에서 API 키를 발급받으세요.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!apiKey.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              설정
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t">
          <p className="text-sm text-gray-600">
            <strong>참고:</strong> 환경 변수 설정을 선호하신다면, <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code> 파일에서
            <code className="bg-gray-100 px-1 py-0.5 rounded ml-1">NEXT_PUBLIC_POLOTNO_API_KEY</code>를 설정하세요.
          </p>
        </div>
      </div>
    </div>
  );
}