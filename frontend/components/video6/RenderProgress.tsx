'use client';

import React from 'react';
import { VideoStatus } from '@/types/video-pipeline';

interface RenderProgressProps {
  status: VideoStatus;
  progress: number; // 0-100
  estimatedTimeRemaining?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  onRetry?: () => void;
}

const STATUS_CONFIG: Record<VideoStatus, { label: string; color: string; icon: string }> = {
  not_started: { label: '대기 중', color: 'gray', icon: '⏸️' },
  planning: { label: '스크립트 생성 중', color: 'blue', icon: '📝' },
  rendering: { label: '영상 렌더링 중', color: 'purple', icon: '🎬' },
  completed: { label: '완료', color: 'green', icon: '✅' },
  error: { label: '오류 발생', color: 'red', icon: '❌' },
};

export function RenderProgress({
  status,
  progress,
  estimatedTimeRemaining,
  videoUrl,
  thumbnailUrl,
  errorMessage,
  onRetry,
}: RenderProgressProps) {
  const config = STATUS_CONFIG[status];

  // 완료된 경우 비디오 플레이어 표시
  if (status === 'completed' && videoUrl) {
    return (
      <div className="rounded-xl bg-white shadow-lg overflow-hidden">
        {/* 비디오 플레이어 */}
        <div className="aspect-[9/16] max-h-[400px] bg-black">
          <video
            src={videoUrl}
            poster={thumbnailUrl}
            controls
            className="w-full h-full object-contain"
          />
        </div>

        {/* 완료 메시지 */}
        <div className="p-4 bg-green-50 border-t border-green-100">
          <div className="flex items-center gap-2 text-green-700">
            <span className="text-xl">{config.icon}</span>
            <span className="font-medium">{config.label}</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            영상이 성공적으로 생성되었습니다.
          </p>
        </div>
      </div>
    );
  }

  // 에러인 경우
  if (status === 'error') {
    return (
      <div className="rounded-xl bg-white shadow-lg p-6">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <span className="text-2xl">{config.icon}</span>
          <span className="font-medium text-lg">{config.label}</span>
        </div>

        {errorMessage && (
          <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg mb-4">
            {errorMessage}
          </p>
        )}

        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            다시 시도
          </button>
        )}
      </div>
    );
  }

  // 진행 중인 경우
  return (
    <div className="rounded-xl bg-white shadow-lg p-6">
      {/* 상태 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl animate-pulse">{config.icon}</span>
          <span className="font-medium text-gray-800">{config.label}</span>
        </div>
        <span className="text-sm text-gray-500">{progress}%</span>
      </div>

      {/* 프로그레스 바 */}
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${
            config.color === 'blue'
              ? 'bg-blue-500'
              : config.color === 'purple'
              ? 'bg-purple-500'
              : 'bg-gray-400'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 예상 시간 */}
      {estimatedTimeRemaining && status === 'rendering' && (
        <p className="text-sm text-gray-500 text-center">
          예상 남은 시간: {estimatedTimeRemaining}
        </p>
      )}

      {/* 진행 중 안내 */}
      {status === 'planning' && (
        <p className="text-sm text-gray-500 text-center mt-2">
          AI가 영상 스크립트를 작성하고 있습니다...
        </p>
      )}

      {status === 'rendering' && (
        <p className="text-sm text-gray-500 text-center mt-2">
          영상을 렌더링하고 있습니다. 잠시만 기다려주세요...
        </p>
      )}
    </div>
  );
}

export default RenderProgress;
