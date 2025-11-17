/**
 * Chat Panel
 *
 * AI와 대화하여 콘텐츠를 생성하는 패널
 *
 * 기능:
 * - Kind 선택 (product_detail, sns, brand_kit)
 * - 프롬프트 입력
 * - Generate API 호출
 * - Canvas에 결과 반영
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 */

'use client';

import { useState } from 'react';
import type { GenerateKind } from '@/lib/api/types';
import { useGenerate } from '../hooks/useGenerate';
import { applyGenerateResponseToCanvas } from '../adapters/response-to-fabric';
import { useCanvas } from '../context';

export function ChatPanel() {
  const { fabricCanvas } = useCanvas();
  const { generate, isLoading, error, clearError } = useGenerate();

  // Form State
  const [kind, setKind] = useState<GenerateKind>('product_detail');
  const [prompt, setPrompt] = useState('');

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      alert('프롬프트를 입력해주세요');
      return;
    }

    if (!fabricCanvas) {
      alert('Canvas가 초기화되지 않았습니다');
      return;
    }

    clearError();

    try {
      console.log('[ChatPanel] Generating:', { kind, prompt });

      const response = await generate(kind, prompt);

      console.log('[ChatPanel] Generate response:', response);

      // Canvas에 결과 반영
      await applyGenerateResponseToCanvas(fabricCanvas, response);

      console.log('[ChatPanel] Canvas updated successfully');

      // 성공 시 프롬프트 초기화
      setPrompt('');
    } catch (e: any) {
      console.error('[ChatPanel] Generation failed:', e);
      // error는 useGenerate에서 이미 설정되어 있음
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-neutral-200 p-4">
        <div className="mb-1 flex items-center">
          <span className="text-2xl">💬</span>
          <h3 className="ml-2 text-sm font-semibold text-neutral-800">
            Spark Chat
          </h3>
        </div>
        <p className="text-xs text-neutral-500">
          AI와 대화하여 콘텐츠를 생성하세요
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Kind 선택 */}
          <div>
            <label
              htmlFor="kind"
              className="mb-2 block text-xs font-medium text-neutral-700"
            >
              콘텐츠 타입
            </label>
            <select
              id="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as GenerateKind)}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="product_detail">상품 상세</option>
              <option value="sns">SNS 콘텐츠</option>
              <option value="brand_kit">브랜드킷</option>
              <option value="presentation">프레젠테이션</option>
            </select>
          </div>

          {/* 프롬프트 입력 */}
          <div>
            <label
              htmlFor="prompt"
              className="mb-2 block text-xs font-medium text-neutral-700"
            >
              무엇을 만들까요?
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="예: 고급 스킨케어 제품 상세 페이지를 만들어줘"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={4}
              disabled={isLoading}
            />
          </div>

          {/* 에러 표시 */}
          {error && (
            <div className="rounded bg-red-50 p-3 text-xs text-red-700">
              <strong>에러:</strong> {error}
            </div>
          )}

          {/* 생성 버튼 */}
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="w-full rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {isLoading ? '생성 중...' : '생성하기'}
          </button>
        </form>

        {/* 안내 메시지 */}
        {!isLoading && !error && (
          <div className="mt-6 rounded bg-blue-50 p-3 text-xs text-blue-700">
            <strong>💡 Tip:</strong> 구체적으로 설명할수록 더 좋은 결과를
            얻을 수 있습니다.
          </div>
        )}
      </div>
    </div>
  );
}
