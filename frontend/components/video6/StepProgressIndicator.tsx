/**
 * Step Progress Indicator - 4단계 확인 플로우 진행 상황 표시
 *
 * B팀 요청서 기반 UI:
 * [✓] 스크립트  →  [○] 이미지  →  [ ] 모션  →  [ ] 렌더
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-01
 */

'use client';

import React from 'react';
import { Check, Circle, Loader2 } from 'lucide-react';
import type { VideoFlowStep, VideoProjectStatusV2 } from '@/types/video-pipeline-v2';
import {
  VIDEO_FLOW_STEPS,
  getFlowStepFromStatus,
  getCompletedSteps,
  isStepGenerating,
} from '@/types/video-pipeline-v2';

interface StepProgressIndicatorProps {
  status: VideoProjectStatusV2;
  className?: string;
}

/**
 * 개별 스텝 아이콘 컴포넌트
 */
function StepIcon({
  step,
  isCompleted,
  isCurrent,
  isGenerating,
}: {
  step: VideoFlowStep;
  isCompleted: boolean;
  isCurrent: boolean;
  isGenerating: boolean;
}) {
  if (isCompleted) {
    return (
      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
        <Check className="w-5 h-5 text-white" />
      </div>
    );
  }

  if (isCurrent && isGenerating) {
    return (
      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-white animate-spin" />
      </div>
    );
  }

  if (isCurrent) {
    return (
      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
        <Circle className="w-4 h-4 text-white fill-white" />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center">
      <Circle className="w-4 h-4 text-gray-300" />
    </div>
  );
}

/**
 * 스텝 간 연결선
 */
function StepConnector({ isCompleted }: { isCompleted: boolean }) {
  return (
    <div
      className={`flex-1 h-0.5 mx-2 ${
        isCompleted ? 'bg-green-500' : 'bg-gray-300'
      }`}
    />
  );
}

export function StepProgressIndicator({
  status,
  className = '',
}: StepProgressIndicatorProps) {
  const currentStep = getFlowStepFromStatus(status);
  const completedSteps = getCompletedSteps(status);
  const generating = isStepGenerating(status);

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {VIDEO_FLOW_STEPS.map((stepInfo, index) => {
        const isCompleted = completedSteps.includes(stepInfo.step);
        const isCurrent = currentStep === stepInfo.step;
        const isLast = index === VIDEO_FLOW_STEPS.length - 1;

        // 이전 스텝이 완료되었는지 (연결선 색상 결정용)
        const prevStepCompleted = index > 0 && completedSteps.includes(VIDEO_FLOW_STEPS[index - 1].step);

        return (
          <React.Fragment key={stepInfo.step}>
            <div className="flex flex-col items-center">
              <StepIcon
                step={stepInfo.step}
                isCompleted={isCompleted}
                isCurrent={isCurrent}
                isGenerating={generating && isCurrent}
              />
              <span
                className={`mt-2 text-xs font-medium ${
                  isCompleted
                    ? 'text-green-600'
                    : isCurrent
                    ? 'text-purple-600'
                    : 'text-gray-400'
                }`}
              >
                {stepInfo.label}
              </span>
            </div>
            {!isLast && <StepConnector isCompleted={isCompleted} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * 컴팩트 버전 (작은 공간용)
 */
export function StepProgressIndicatorCompact({
  status,
  className = '',
}: StepProgressIndicatorProps) {
  const currentStep = getFlowStepFromStatus(status);
  const completedSteps = getCompletedSteps(status);
  const currentIndex = VIDEO_FLOW_STEPS.findIndex((s) => s.step === currentStep);
  const totalSteps = VIDEO_FLOW_STEPS.length;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        {VIDEO_FLOW_STEPS.map((stepInfo, index) => {
          const isCompleted = completedSteps.includes(stepInfo.step);
          const isCurrent = currentStep === stepInfo.step;

          return (
            <div
              key={stepInfo.step}
              className={`w-2 h-2 rounded-full ${
                isCompleted
                  ? 'bg-green-500'
                  : isCurrent
                  ? 'bg-purple-500'
                  : 'bg-gray-300'
              }`}
              title={stepInfo.label}
            />
          );
        })}
      </div>
      <span className="text-xs text-gray-500">
        {currentIndex + 1} / {totalSteps}
      </span>
    </div>
  );
}

/**
 * 상태 메시지 표시 컴포넌트
 */
export function StepStatusMessage({
  status,
  className = '',
}: StepProgressIndicatorProps) {
  const getMessage = (): string => {
    switch (status) {
      case 'not_started':
        return '비디오 생성을 시작해주세요.';
      case 'planning':
        return '플랜 생성 중...';
      case 'script_ready':
        return '스크립트를 확인하고 승인해주세요.';
      case 'script_approved':
        return '스크립트가 승인되었습니다.';
      case 'generating_images':
        return '이미지 생성 중...';
      case 'images_ready':
        return '이미지를 확인하고 승인해주세요.';
      case 'images_approved':
        return '이미지가 승인되었습니다.';
      case 'generating_motion':
        return '모션 프롬프트 생성 중...';
      case 'motion_ready':
        return '모션 프롬프트를 확인하고 승인해주세요.';
      case 'motion_approved':
        return '모션이 승인되었습니다.';
      case 'render_queued':
        return '렌더링 대기 중...';
      case 'rendering':
        return '영상 렌더링 중...';
      case 'completed':
        return '영상 생성이 완료되었습니다!';
      case 'failed':
        return '오류가 발생했습니다.';
      default:
        return '';
    }
  };

  const getColor = (): string => {
    if (status === 'completed') return 'text-green-600';
    if (status === 'failed') return 'text-red-600';
    if (isStepGenerating(status)) return 'text-purple-600';
    return 'text-gray-600';
  };

  return (
    <p className={`text-sm ${getColor()} ${className}`}>
      {getMessage()}
    </p>
  );
}

export default StepProgressIndicator;
