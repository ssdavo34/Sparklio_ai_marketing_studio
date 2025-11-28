/**
 * Image Generation Panel
 *
 * Canvas의 플레이스홀더 이미지를 AI로 자동 생성하는 패널
 * - 현재 페이지의 이미지 플레이스홀더 감지
 * - 일괄 생성 버튼
 * - 진행 상태 표시
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 */

'use client';

import { useState, useEffect } from 'react';
import { Wand2, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useCanvasStore } from '../stores/useCanvasStore';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { getImageMetadata, isPlaceholder } from '@/lib/canvas/image-metadata';

export function ImageGenerationPanel() {
  const polotnoStore = useCanvasStore((state) => state.polotnoStore);
  const { isGenerating, progress, results, error, generateImages, reset } = useImageGeneration();
  const [placeholderCount, setPlaceholderCount] = useState(0);

  // 현재 페이지의 플레이스홀더 개수 감지
  useEffect(() => {
    if (!polotnoStore) return;

    const updatePlaceholderCount = () => {
      const activePage = polotnoStore.activePage;
      if (!activePage) {
        setPlaceholderCount(0);
        return;
      }

      const imageElements = activePage.children.filter((el: any) => el.type === 'image');
      const placeholders = imageElements.filter((el: any) => {
        const metadata = getImageMetadata(el);
        return isPlaceholder(metadata) && metadata?.originalPrompt;
      });

      setPlaceholderCount(placeholders.length);
    };

    updatePlaceholderCount();

    // Poll for changes
    const interval = setInterval(updatePlaceholderCount, 1000);
    return () => clearInterval(interval);
  }, [polotnoStore]);

  const handleGenerateAll = async () => {
    if (!polotnoStore) return;

    const activePage = polotnoStore.activePage;
    if (!activePage) return;

    // 플레이스홀더 이미지 찾기
    const imageElements = activePage.children.filter((el: any) => el.type === 'image');
    const placeholders = imageElements.filter((el: any) => {
      const metadata = getImageMetadata(el);
      return isPlaceholder(metadata) && metadata?.originalPrompt;
    });

    if (placeholders.length === 0) {
      alert('생성할 이미지 플레이스홀더가 없습니다.');
      return;
    }

    // 생성 요청 준비
    const requests = placeholders.map((el: any) => {
      const metadata = getImageMetadata(el);
      return {
        prompt: metadata!.originalPrompt!,
        style: (metadata?.style as any) || 'realistic',
        element: el,
      };
    });

    // 배치 생성 시작
    await generateImages(requests);
  };

  if (placeholderCount === 0 && !isGenerating && results.length === 0) {
    return null; // 플레이스홀더가 없으면 패널 숨김
  }

  return (
    <div className="border-t border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="text-sm font-semibold text-purple-900">AI 이미지 생성</h3>
            <p className="text-xs text-purple-600">
              {placeholderCount}개의 플레이스홀더 감지됨
            </p>
          </div>
        </div>

        {!isGenerating && results.length === 0 && (
          <button
            onClick={handleGenerateAll}
            disabled={placeholderCount === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Wand2 className="w-4 h-4" />
            전체 생성
          </button>
        )}

        {isGenerating && (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium text-purple-700">
                {progress}% 완료
              </span>
              <span className="text-xs text-purple-500">
                {results.length}/{placeholderCount}
              </span>
            </div>
            <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
          </div>
        )}

        {!isGenerating && results.length > 0 && (
          <button
            onClick={reset}
            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium"
          >
            초기화
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="mt-2 bg-white rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Results Summary */}
      {!isGenerating && results.length > 0 && (
        <div className="mt-2 p-2 bg-white rounded-lg">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>{results.filter((r) => r.success).length}개 성공</span>
            </div>
            {results.some((r) => !r.success) && (
              <div className="flex items-center gap-1 text-red-600">
                <XCircle className="w-4 h-4" />
                <span>{results.filter((r) => !r.success).length}개 실패</span>
              </div>
            )}
          </div>
          {error && (
            <div className="mt-2 flex items-start gap-2 text-xs text-amber-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
