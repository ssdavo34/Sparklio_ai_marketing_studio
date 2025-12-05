/**
 * Output Preview Component
 *
 * 생성된 산출물 프리뷰 컴포넌트
 * - 프레젠테이션, 상세페이지, 인스타그램 광고 통합 뷰
 * - 채널별 탭 네비게이션
 * - 이미지 생성 진행 상태 표시
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-05
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Presentation,
  LayoutList,
  Instagram,
  Loader2,
  Image as ImageIcon,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
} from 'lucide-react';
import { PresentationSlide, PresentationRenderer } from './PresentationTemplates';
import { DetailPageSection, DetailPageRenderer } from './DetailPageTemplates';
import { InstagramAd, InstagramAdSetRenderer } from './InstagramTemplates';
import type {
  PresentationSlideData,
  DetailPageSectionData,
  InstagramAdData,
  ImageSlot,
} from '@/types/htmlTemplates';
import type { GeneratedConceptExtended, OutputTargets } from '@/types/conceptGeneration';
import { generateAllOutputs, type GeneratedOutputs } from './templateGenerator';
import {
  generateImagesForSlots,
  checkZImageHealth,
  type BatchGenerationProgress,
} from '@/lib/image-generation';

// =============================================================================
// Types
// =============================================================================

type OutputTab = 'presentation' | 'detailPage' | 'instagram';

interface OutputPreviewProps {
  concept: GeneratedConceptExtended;
  targets: OutputTargets;
  onGenerateImages?: () => void;
  onExport?: (tab: OutputTab, format: 'png' | 'pdf') => void;
}

interface ImageGenerationState {
  isGenerating: boolean;
  progress: number;
  currentSlot: string;
  completed: number;
  total: number;
  error: string | null;
}

// =============================================================================
// Tab Button Component
// =============================================================================

interface TabButtonProps {
  tab: OutputTab;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  isEnabled: boolean;
  onClick: () => void;
}

function TabButton({ tab, label, icon, isActive, isEnabled, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={!isEnabled}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
        isActive
          ? 'bg-purple-500 text-white shadow-lg'
          : isEnabled
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// =============================================================================
// Image Generation Status
// =============================================================================

interface ImageStatusProps {
  state: ImageGenerationState;
  onRetry: () => void;
}

function ImageGenerationStatus({ state, onRetry }: ImageStatusProps) {
  if (!state.isGenerating && state.completed === 0 && state.total > 0) {
    return (
      <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-center gap-3">
          <ImageIcon className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">이미지 생성 대기 중</p>
            <p className="text-sm text-yellow-600">{state.total}개의 이미지를 생성할 수 있습니다</p>
          </div>
        </div>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
        >
          <ImageIcon className="w-4 h-4" />
          이미지 생성 시작
        </button>
      </div>
    );
  }

  if (state.isGenerating) {
    return (
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-center gap-3 mb-3">
          <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
          <div>
            <p className="font-medium text-purple-800">이미지 생성 중...</p>
            <p className="text-sm text-purple-600">
              {state.completed} / {state.total} 완료
            </p>
          </div>
        </div>
        <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${state.progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-medium text-red-800">이미지 생성 실패</p>
            <p className="text-sm text-red-600">{state.error}</p>
          </div>
        </div>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          다시 시도
        </button>
      </div>
    );
  }

  if (state.completed === state.total && state.total > 0) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
        <Check className="w-5 h-5 text-green-600" />
        <div>
          <p className="font-medium text-green-800">이미지 생성 완료</p>
          <p className="text-sm text-green-600">{state.total}개의 이미지가 생성되었습니다</p>
        </div>
      </div>
    );
  }

  return null;
}

// =============================================================================
// Main Component
// =============================================================================

export function OutputPreview({ concept, targets, onExport }: OutputPreviewProps) {
  // State
  const [activeTab, setActiveTab] = useState<OutputTab>('presentation');
  const [outputs, setOutputs] = useState<GeneratedOutputs | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [imageState, setImageState] = useState<ImageGenerationState>({
    isGenerating: false,
    progress: 0,
    currentSlot: '',
    completed: 0,
    total: 0,
    error: null,
  });

  // 산출물 데이터 생성
  useEffect(() => {
    const generatedOutputs = generateAllOutputs(concept, targets);
    setOutputs(generatedOutputs);
    setImageState(prev => ({
      ...prev,
      total: generatedOutputs.allImageSlots.length,
    }));

    // 첫 번째 활성 탭 선택
    if (targets.presentation.enabled) {
      setActiveTab('presentation');
    } else if (targets.detailPage.enabled) {
      setActiveTab('detailPage');
    } else if (targets.instagram.enabled) {
      setActiveTab('instagram');
    }
  }, [concept, targets]);

  // 이미지 생성 핸들러
  const handleGenerateImages = async () => {
    if (!outputs) return;

    setImageState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
      progress: 0,
      completed: 0,
    }));

    // Z-Image 서버 상태 확인
    const isHealthy = await checkZImageHealth();
    if (!isHealthy) {
      setImageState(prev => ({
        ...prev,
        isGenerating: false,
        error: 'GPU 서버에 연결할 수 없습니다. 네트워크를 확인해주세요.',
      }));
      return;
    }

    // 이미지 생성
    const progressCallback = (progress: BatchGenerationProgress) => {
      setImageState(prev => ({
        ...prev,
        completed: progress.completed,
        currentSlot: progress.current,
        progress: (progress.completed / progress.total) * 100,
      }));
    };

    try {
      await generateImagesForSlots(outputs.allImageSlots, progressCallback, true);

      // 상태 업데이트를 위해 outputs 재설정
      setOutputs({ ...outputs });

      setImageState(prev => ({
        ...prev,
        isGenerating: false,
        completed: outputs.allImageSlots.length,
        progress: 100,
      }));
    } catch (error) {
      setImageState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : '이미지 생성 중 오류가 발생했습니다.',
      }));
    }
  };

  if (!outputs) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <div className="flex items-center gap-3">
        <TabButton
          tab="presentation"
          label="프레젠테이션"
          icon={<Presentation className="w-4 h-4" />}
          isActive={activeTab === 'presentation'}
          isEnabled={targets.presentation.enabled}
          onClick={() => setActiveTab('presentation')}
        />
        <TabButton
          tab="detailPage"
          label="상세페이지"
          icon={<LayoutList className="w-4 h-4" />}
          isActive={activeTab === 'detailPage'}
          isEnabled={targets.detailPage.enabled}
          onClick={() => setActiveTab('detailPage')}
        />
        <TabButton
          tab="instagram"
          label="인스타그램"
          icon={<Instagram className="w-4 h-4" />}
          isActive={activeTab === 'instagram'}
          isEnabled={targets.instagram.enabled}
          onClick={() => setActiveTab('instagram')}
        />
      </div>

      {/* 이미지 생성 상태 */}
      <ImageGenerationStatus state={imageState} onRetry={handleGenerateImages} />

      {/* 프리뷰 영역 */}
      <div className="bg-gray-50 rounded-xl p-6">
        {/* 프레젠테이션 */}
        {activeTab === 'presentation' && outputs.presentation && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                슬라이드 {currentSlideIndex + 1} / {outputs.presentation.length}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                  disabled={currentSlideIndex === 0}
                  className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentSlideIndex(Math.min(outputs.presentation!.length - 1, currentSlideIndex + 1))}
                  disabled={currentSlideIndex === outputs.presentation.length - 1}
                  className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <PresentationSlide data={outputs.presentation[currentSlideIndex]} />
            </div>

            {/* 썸네일 */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {outputs.presentation.map((slide, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`flex-shrink-0 w-24 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentSlideIndex
                      ? 'border-purple-500 ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-video bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                    {idx + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 상세페이지 */}
        {activeTab === 'detailPage' && outputs.detailPage && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">
              상세페이지 프리뷰 ({outputs.detailPage.length}개 섹션)
            </h3>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden max-h-[600px] overflow-y-auto">
              <DetailPageRenderer sections={outputs.detailPage} />
            </div>
          </div>
        )}

        {/* 인스타그램 */}
        {activeTab === 'instagram' && outputs.instagram && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                인스타그램 광고 {currentAdIndex + 1} / {outputs.instagram.length}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentAdIndex(Math.max(0, currentAdIndex - 1))}
                  disabled={currentAdIndex === 0}
                  className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentAdIndex(Math.min(outputs.instagram!.length - 1, currentAdIndex + 1))}
                  disabled={currentAdIndex === outputs.instagram.length - 1}
                  className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <div className={`${targets.instagram.format === 'story' ? 'max-w-xs' : 'max-w-md'} w-full`}>
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <InstagramAd data={outputs.instagram[currentAdIndex]} />
                </div>
              </div>
            </div>

            {/* 썸네일 */}
            <div className="flex justify-center gap-3">
              {outputs.instagram.map((ad, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentAdIndex(idx)}
                  className={`flex-shrink-0 w-16 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentAdIndex
                      ? 'border-purple-500 ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className="bg-gray-100 flex items-center justify-center text-xs text-gray-500"
                    style={{ aspectRatio: targets.instagram.format === 'story' ? '9/16' : '1/1' }}
                  >
                    {idx + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={handleGenerateImages}
          disabled={imageState.isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {imageState.isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
          이미지 생성
        </button>
        <button
          onClick={() => onExport?.(activeTab, 'png')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          내보내기
        </button>
      </div>
    </div>
  );
}

export default OutputPreview;
