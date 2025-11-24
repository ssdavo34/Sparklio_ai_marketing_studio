/**
 * Channel Selector
 *
 * 채널 선택 컴포넌트
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 4.1
 */

'use client';

import { FileText, Instagram, Monitor, Presentation, Video } from 'lucide-react';
import type { ChannelType } from '@/types/brief';

// ============================================================================
// Types
// ============================================================================

export interface ChannelSelectorProps {
  /** 선택된 채널 목록 */
  selectedChannels: ChannelType[];

  /** 채널 선택/해제 핸들러 */
  onToggleChannel: (channel: ChannelType) => void;

  /** 사용 가능한 채널 목록 (선택) */
  availableChannels?: ChannelType[];

  /** 다중 선택 허용 여부 */
  multiple?: boolean;

  /** 클래스명 (선택) */
  className?: string;

  /** 비활성화 여부 */
  disabled?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const CHANNEL_CONFIG: Record<
  ChannelType,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  product_detail: {
    label: '상세 페이지',
    description: '제품/서비스 상세 설명',
    icon: FileText,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-600',
  },
  sns: {
    label: 'SNS',
    description: 'Instagram, Facebook 등',
    icon: Instagram,
    color: 'text-pink-700',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-600',
  },
  banner: {
    label: '배너',
    description: '웹/앱 광고 배너',
    icon: Monitor,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-600',
  },
  deck: {
    label: '발표 자료',
    description: 'PPT, Keynote 등',
    icon: Presentation,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-600',
  },
  video: {
    label: '영상',
    description: '광고 영상, 유튜브 등',
    icon: Video,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-600',
  },
};

// ============================================================================
// Component
// ============================================================================

export function ChannelSelector({
  selectedChannels,
  onToggleChannel,
  availableChannels = ['product_detail', 'sns', 'banner', 'deck', 'video'],
  multiple = true,
  className = '',
  disabled = false,
}: ChannelSelectorProps) {
  const handleChannelClick = (channel: ChannelType) => {
    if (disabled) return;

    if (!multiple && !selectedChannels.includes(channel)) {
      // 단일 선택 모드: 다른 채널을 클릭하면 기존 선택 해제하고 새로운 채널 선택
      onToggleChannel(channel);
    } else {
      // 다중 선택 모드 또는 이미 선택된 채널 클릭
      onToggleChannel(channel);
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">채널 선택</h3>
        <p className="text-xs text-gray-500 mt-1">
          {multiple
            ? '콘텐츠를 생성할 채널을 선택하세요 (복수 선택 가능)'
            : '콘텐츠를 생성할 채널을 선택하세요'}
        </p>
      </div>

      {/* Channel Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {availableChannels.map((channel) => {
          const config = CHANNEL_CONFIG[channel];
          const Icon = config.icon;
          const isSelected = selectedChannels.includes(channel);

          return (
            <button
              key={channel}
              onClick={() => handleChannelClick(channel)}
              disabled={disabled}
              className={`
                relative p-4 rounded-lg border-2 transition-all
                ${
                  isSelected
                    ? `${config.borderColor} ${config.bgColor}`
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 12 12"
                    >
                      <path
                        d="M10 3L4.5 8.5L2 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className="flex justify-center mb-3">
                <Icon
                  className={`w-8 h-8 ${isSelected ? config.color : 'text-gray-400'}`}
                />
              </div>

              {/* Label */}
              <h4
                className={`text-sm font-semibold text-center mb-1 ${
                  isSelected ? 'text-gray-900' : 'text-gray-700'
                }`}
              >
                {config.label}
              </h4>

              {/* Description */}
              <p className="text-xs text-gray-500 text-center">{config.description}</p>
            </button>
          );
        })}
      </div>

      {/* Selection Summary */}
      {selectedChannels.length > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">{selectedChannels.length}개 채널</span> 선택됨:{' '}
            {selectedChannels.map((ch) => CHANNEL_CONFIG[ch].label).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
