/**
 * Generation Progress
 *
 * 콘텐츠 생성 진행 상태 표시 컴포넌트
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 4.2
 */

'use client';

import { CheckCircle2, Loader2, Clock, AlertCircle } from 'lucide-react';
import type { ChannelType } from '@/types/brief';

// ============================================================================
// Types
// ============================================================================

export type GenerationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface ChannelGenerationProgress {
  channel: ChannelType;
  status: GenerationStatus;
  progress?: number;
  message?: string;
  error?: string;
}

export interface GenerationProgressProps {
  /** 채널별 진행 상태 */
  channels: ChannelGenerationProgress[];

  /** 전체 진행률 (선택, 자동 계산됨) */
  overallProgress?: number;

  /** 클래스명 (선택) */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const CHANNEL_LABELS: Record<ChannelType, string> = {
  product_detail: '상세 페이지',
  sns: 'SNS',
  banner: '배너',
  deck: '발표 자료',
  video: '영상',
};

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    label: '대기 중',
  },
  in_progress: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: '생성 중',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: '완료',
  },
  failed: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: '실패',
  },
};

// ============================================================================
// Component
// ============================================================================

export function GenerationProgress({
  channels,
  overallProgress: providedOverallProgress,
  className = '',
}: GenerationProgressProps) {
  // 전체 진행률 계산
  const overallProgress =
    providedOverallProgress ??
    Math.round(
      channels.reduce((acc, ch) => {
        if (ch.status === 'completed') return acc + 100;
        if (ch.status === 'in_progress' && ch.progress) return acc + ch.progress;
        return acc;
      }, 0) / channels.length
    );

  const completedCount = channels.filter((ch) => ch.status === 'completed').length;
  const failedCount = channels.filter((ch) => ch.status === 'failed').length;
  const inProgressCount = channels.filter((ch) => ch.status === 'in_progress').length;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">콘텐츠 생성 진행 중</h3>
            <p className="text-sm text-gray-500 mt-1">
              {completedCount}/{channels.length} 채널 완료
              {failedCount > 0 && ` · ${failedCount}개 실패`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-600">{overallProgress}%</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300 rounded-full"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Channel List */}
      <div className="p-6 space-y-4">
        {channels.map((channelProgress) => {
          const { channel, status, progress, message, error } = channelProgress;
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;

          return (
            <div
              key={channel}
              className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              {/* Icon */}
              <div className={`flex-shrink-0 w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                <Icon
                  className={`w-5 h-5 ${config.color} ${status === 'in_progress' ? 'animate-spin' : ''}`}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Channel Name & Status */}
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {CHANNEL_LABELS[channel]}
                  </h4>
                  <span className={`text-xs font-medium ${config.color}`}>
                    {config.label}
                  </span>
                </div>

                {/* Message */}
                {message && (
                  <p className="text-sm text-gray-600 mb-2">{message}</p>
                )}

                {/* Error */}
                {error && (
                  <p className="text-sm text-red-600 mb-2">오류: {error}</p>
                )}

                {/* Progress Bar (for in_progress status) */}
                {status === 'in_progress' && progress !== undefined && (
                  <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Summary */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-xs text-gray-600 mt-1">완료</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
            <div className="text-xs text-gray-600 mt-1">진행 중</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            <div className="text-xs text-gray-600 mt-1">실패</div>
          </div>
        </div>
      </div>
    </div>
  );
}
