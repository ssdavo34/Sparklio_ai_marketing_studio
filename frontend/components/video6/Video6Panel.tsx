/**
 * Video6 Panel - Video Pipeline V2 통합 컴포넌트
 *
 * 전체 비디오 생성 플로우를 관리하는 메인 패널
 *
 * 플로우 단계:
 * 1. MODE_SELECT - 모드 선택 (REUSE/HYBRID/CREATIVE)
 * 2. ASSET_SELECT - 에셋 선택 (REUSE/HYBRID)
 * 3. TOPIC_INPUT - 주제 입력
 * 4. PLAN_REVIEW - 플랜 검토 및 수정
 * 5. RENDERING - 렌더링 진행
 * 6. COMPLETE - 완료 (비디오 플레이어)
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-29
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Video, Sparkles, AlertCircle } from 'lucide-react';
import { useVideo6 } from '@/hooks/useVideo6';
import { ModeSelector } from './ModeSelector';
import { AssetPoolGrid } from './AssetPoolGrid';
import { PlanReview } from './PlanReview';
import { RenderProgress } from './RenderProgress';
import type { VideoGenerationMode } from '@/types/video-pipeline';

// ============================================================================
// Types
// ============================================================================

type FlowStep =
  | 'MODE_SELECT'
  | 'ASSET_SELECT'
  | 'TOPIC_INPUT'
  | 'PLAN_REVIEW'
  | 'RENDERING'
  | 'COMPLETE';

interface Video6PanelProps {
  onClose?: () => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function Video6Panel({ onClose, className = '' }: Video6PanelProps) {
  const [state, actions] = useVideo6();
  const [step, setStep] = useState<FlowStep>('MODE_SELECT');
  const [topicInput, setTopicInput] = useState('');

  // 상태 변화에 따른 단계 자동 전환
  useEffect(() => {
    if (state.renderProgress.status === 'completed' && state.videoUrl) {
      setStep('COMPLETE');
    } else if (state.renderProgress.status === 'rendering') {
      setStep('RENDERING');
    }
  }, [state.renderProgress.status, state.videoUrl]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleModeSelect = (mode: VideoGenerationMode) => {
    actions.selectMode(mode);
    if (mode === 'creative') {
      setStep('TOPIC_INPUT');
    } else {
      setStep('ASSET_SELECT');
    }
  };

  const handleAssetSelectNext = () => {
    if (state.selectedAssetIds.length === 0 && state.mode === 'reuse') {
      // REUSE 모드는 최소 1개 에셋 필요
      return;
    }
    setStep('TOPIC_INPUT');
  };

  const handleTopicSubmit = async () => {
    if (!topicInput.trim()) return;

    actions.setTopic(topicInput);

    // 프로젝트 생성 및 플랜 실행
    const projectId = await actions.createProject();
    if (projectId) {
      await actions.executePlan();
      setStep('PLAN_REVIEW');
    }
  };

  const handleApproveAndRender = async () => {
    await actions.startRender();
    setStep('RENDERING');
  };

  const handleBack = () => {
    switch (step) {
      case 'ASSET_SELECT':
        setStep('MODE_SELECT');
        break;
      case 'TOPIC_INPUT':
        if (state.mode === 'creative') {
          setStep('MODE_SELECT');
        } else {
          setStep('ASSET_SELECT');
        }
        break;
      case 'PLAN_REVIEW':
        setStep('TOPIC_INPUT');
        break;
      default:
        break;
    }
  };

  const handleReset = () => {
    actions.reset();
    setTopicInput('');
    setStep('MODE_SELECT');
  };

  // ============================================================================
  // Step Title
  // ============================================================================

  const getStepTitle = (): string => {
    switch (step) {
      case 'MODE_SELECT':
        return '비디오 생성 모드 선택';
      case 'ASSET_SELECT':
        return '사용할 이미지 선택';
      case 'TOPIC_INPUT':
        return '비디오 주제 입력';
      case 'PLAN_REVIEW':
        return '영상 플랜 검토';
      case 'RENDERING':
        return '영상 생성 중...';
      case 'COMPLETE':
        return '영상 완성!';
      default:
        return '';
    }
  };

  const getStepNumber = (): number => {
    switch (step) {
      case 'MODE_SELECT':
        return 1;
      case 'ASSET_SELECT':
        return 2;
      case 'TOPIC_INPUT':
        return state.mode === 'creative' ? 2 : 3;
      case 'PLAN_REVIEW':
        return state.mode === 'creative' ? 3 : 4;
      case 'RENDERING':
      case 'COMPLETE':
        return state.mode === 'creative' ? 4 : 5;
      default:
        return 1;
    }
  };

  const getTotalSteps = (): number => {
    return state.mode === 'creative' ? 4 : 5;
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {step !== 'MODE_SELECT' && step !== 'RENDERING' && step !== 'COMPLETE' && (
            <button
              onClick={handleBack}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900">{getStepTitle()}</h2>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>
            {getStepNumber()} / {getTotalSteps()}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Error display */}
      {state.error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">{state.error}</p>
            <button
              onClick={() => handleReset()}
              className="text-xs text-red-600 underline mt-1"
            >
              처음부터 다시 시작
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Step 1: Mode Select */}
        {step === 'MODE_SELECT' && (
          <ModeSelector
            selectedMode={state.mode}
            onSelectMode={handleModeSelect}
            disabled={state.isLoading}
          />
        )}

        {/* Step 2: Asset Select (REUSE/HYBRID only) */}
        {step === 'ASSET_SELECT' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {state.mode === 'reuse'
                ? '비디오에 사용할 이미지를 선택하세요. 최소 1개 이상 선택해야 합니다.'
                : '비디오에 사용할 이미지를 선택하세요. 선택하지 않으면 AI가 모든 이미지를 생성합니다.'}
            </p>

            <AssetPoolGrid
              assets={state.availableAssets}
              selectedIds={state.selectedAssetIds}
              onSelect={actions.selectAsset}
              onDeselect={actions.deselectAsset}
              disabled={state.isLoading}
            />

            <button
              onClick={handleAssetSelectNext}
              disabled={state.mode === 'reuse' && state.selectedAssetIds.length === 0}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              다음 단계로
            </button>
          </div>
        )}

        {/* Step 3: Topic Input */}
        {step === 'TOPIC_INPUT' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                어떤 영상을 만들까요?
              </label>
              <textarea
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="예: 핸드크림 제품 홍보 영상, 겨울 시즌 할인 안내 등"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                disabled={state.isLoading}
              />
            </div>

            {state.mode !== 'creative' && state.selectedAssetIds.length > 0 && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-700">
                  선택된 이미지 {state.selectedAssetIds.length}개가 영상에 포함됩니다.
                </p>
              </div>
            )}

            <button
              onClick={handleTopicSubmit}
              disabled={!topicInput.trim() || state.isLoading}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {state.isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  플랜 생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI 플랜 생성
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 4: Plan Review */}
        {step === 'PLAN_REVIEW' && state.planDraft && (
          <PlanReview
            plan={state.planDraft}
            onUpdateScene={actions.updateScene}
            onDeleteScene={actions.deleteScene}
            onReorderScene={actions.reorderScenes}
            onApprove={handleApproveAndRender}
            onRegenerate={actions.regeneratePlan}
            isLoading={state.isLoading}
            disabled={state.isLoading}
          />
        )}

        {/* Step 5: Rendering */}
        {step === 'RENDERING' && (
          <RenderProgress
            status={state.renderProgress.status}
            progress={state.renderProgress.progress}
            currentStep={state.renderProgress.currentStep}
            estimatedTimeRemaining={state.renderProgress.estimatedTimeRemaining}
          />
        )}

        {/* Step 6: Complete */}
        {step === 'COMPLETE' && state.videoUrl && (
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={state.videoUrl}
                controls
                className="w-full h-full"
                poster={state.thumbnailUrl || undefined}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.open(state.videoUrl!, '_blank')}
                className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                다운로드
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                새 영상 만들기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Video6Panel;
