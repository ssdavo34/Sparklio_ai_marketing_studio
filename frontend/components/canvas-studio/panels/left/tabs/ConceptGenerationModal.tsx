/**
 * Concept Generation Modal
 *
 * 4단계 컨셉 생성 워크플로우 모달
 * 1. 소스 데이터 확인 (BrandKit, Meeting AI, Brief, Chat)
 * 2. 산출물 대상 설정 (프레젠테이션, 인스타그램, 상세페이지 등)
 * 3. 컨셉 생성 및 편집 (카피, 이미지 프롬프트)
 * 4. 최종 확인 및 생성
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-05
 */

'use client';

import React, { useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  FileText,
  Target,
  Image,
  Presentation,
  Instagram,
  LayoutList,
  Video,
  Square,
  Edit3,
  RefreshCw,
  Loader2,
  AlertCircle,
  Briefcase,
  MessageSquare,
  Users,
  Palette,
} from 'lucide-react';
import { useConceptWorkflowStore } from '../../../stores/useConceptWorkflowStore';
import type {
  WorkflowStep,
  DataSourceType,
  OutputChannelType,
  GeneratedConceptExtended,
  ImagePromptConfig,
} from '@/types/conceptGeneration';

// =============================================================================
// Step Indicator Component
// =============================================================================

interface StepIndicatorProps {
  currentStep: WorkflowStep;
  onStepClick: (step: WorkflowStep) => void;
}

function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  const steps = [
    { step: 1, label: '소스 데이터', icon: FileText },
    { step: 2, label: '산출물 설정', icon: Target },
    { step: 3, label: '컨셉 생성', icon: Sparkles },
    { step: 4, label: '최종 확인', icon: Check },
  ] as const;

  return (
    <div className="flex items-center justify-center gap-2 px-6 py-4 border-b border-gray-100">
      {steps.map(({ step, label, icon: Icon }, idx) => (
        <div key={step} className="flex items-center">
          <button
            onClick={() => step <= currentStep && onStepClick(step as WorkflowStep)}
            disabled={step > currentStep}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              step === currentStep
                ? 'bg-purple-100 text-purple-700'
                : step < currentStep
                ? 'bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step === currentStep
                  ? 'bg-purple-500 text-white'
                  : step < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step < currentStep ? <Check className="w-3.5 h-3.5" /> : step}
            </div>
            <span className="text-sm font-medium hidden sm:inline">{label}</span>
          </button>
          {idx < steps.length - 1 && (
            <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Step 1: Source Data
// =============================================================================

function Step1SourceData() {
  const { sourceData, addSource, removeSource } = useConceptWorkflowStore();

  const sourceTypes: { type: DataSourceType; label: string; icon: any; color: string }[] = [
    { type: 'brandKit', label: 'Brand Kit', icon: Palette, color: 'purple' },
    { type: 'meeting', label: 'Meeting AI', icon: Users, color: 'blue' },
    { type: 'brief', label: 'Brief', icon: Briefcase, color: 'green' },
    { type: 'chat', label: 'Chat', icon: MessageSquare, color: 'orange' },
  ];

  const getSourceSummary = (type: DataSourceType) => {
    switch (type) {
      case 'brandKit':
        return sourceData.brandKit
          ? `${sourceData.brandKit.brandName} - ${sourceData.brandKit.category || '카테고리 없음'}`
          : null;
      case 'meeting':
        return sourceData.meeting
          ? `${sourceData.meeting.meetingTitle} - ${sourceData.meeting.campaignIdeas.length}개 아이디어`
          : null;
      case 'brief':
        return sourceData.brief
          ? `${sourceData.brief.goal.substring(0, 50)}...`
          : null;
      case 'chat':
        return sourceData.chat
          ? sourceData.chat.userPrompt.substring(0, 50) + '...'
          : null;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">소스 데이터 확인</h3>
        <p className="text-sm text-gray-500">
          컨셉 생성에 사용할 데이터 소스를 확인하세요. 활성화된 소스의 정보가 통합되어 컨셉이 생성됩니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sourceTypes.map(({ type, label, icon: Icon, color }) => {
          const isActive = sourceData.activeSources.includes(type);
          const summary = getSourceSummary(type);

          return (
            <div
              key={type}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                isActive
                  ? `border-${color}-300 bg-${color}-50`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isActive ? `bg-${color}-100` : 'bg-gray-100'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? `text-${color}-600` : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{label}</h4>
                    {isActive && summary ? (
                      <p className="text-xs text-gray-500 mt-0.5">{summary}</p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5">데이터 없음</p>
                    )}
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isActive
                      ? `border-${color}-500 bg-${color}-500`
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {isActive && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>

              {isActive && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {type === 'brandKit' && sourceData.brandKit && (
                    <div className="space-y-1 text-xs text-gray-600">
                      <p>톤: {sourceData.brandKit.tone?.summary || '-'}</p>
                      <p>키워드: {sourceData.brandKit.keywords?.slice(0, 3).join(', ') || '-'}</p>
                    </div>
                  )}
                  {type === 'meeting' && sourceData.meeting && (
                    <div className="space-y-1 text-xs text-gray-600">
                      <p>요약: {sourceData.meeting.summary.substring(0, 80)}...</p>
                      <p>키워드: {sourceData.meeting.keywords.slice(0, 3).join(', ')}</p>
                    </div>
                  )}
                  {type === 'brief' && sourceData.brief && (
                    <div className="space-y-1 text-xs text-gray-600">
                      <p>타겟: {sourceData.brief.target}</p>
                      <p>메시지: {sourceData.brief.keyMessages.slice(0, 2).join(', ')}</p>
                    </div>
                  )}
                  {type === 'chat' && sourceData.chat && (
                    <div className="text-xs text-gray-600">
                      <p>{sourceData.chat.userPrompt}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sourceData.activeSources.length === 0 && (
        <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-sm text-yellow-700">
            활성화된 소스가 없습니다. 컨셉을 생성하려면 최소 하나의 소스 데이터가 필요합니다.
          </p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Step 2: Output Targets
// =============================================================================

function Step2OutputTargets() {
  const { outputTargets, toggleChannel, updateChannelConfig } = useConceptWorkflowStore();

  const channels: {
    key: OutputChannelType;
    storeKey: keyof typeof outputTargets;
    label: string;
    icon: any;
    description: string;
  }[] = [
    {
      key: 'presentation',
      storeKey: 'presentation',
      label: '프레젠테이션',
      icon: Presentation,
      description: '슬라이드 형식의 발표 자료',
    },
    {
      key: 'instagram',
      storeKey: 'instagram',
      label: '인스타그램 광고',
      icon: Instagram,
      description: '피드/스토리 광고 이미지',
    },
    {
      key: 'detail_page',
      storeKey: 'detailPage',
      label: '상세페이지',
      icon: LayoutList,
      description: '제품/서비스 상세 설명 페이지',
    },
    {
      key: 'shorts',
      storeKey: 'shorts',
      label: '쇼츠 스크립트',
      icon: Video,
      description: '30초 숏폼 영상 대본',
    },
    {
      key: 'banner',
      storeKey: 'banner',
      label: '배너 광고',
      icon: Square,
      description: '웹/앱 디스플레이 배너',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">산출물 대상 설정</h3>
        <p className="text-sm text-gray-500">
          생성할 마케팅 산출물을 선택하고 세부 설정을 조정하세요.
        </p>
      </div>

      <div className="space-y-3">
        {channels.map(({ key, storeKey, label, icon: Icon, description }) => {
          const config = outputTargets[storeKey];

          return (
            <div
              key={key}
              className={`p-4 rounded-xl border-2 transition-all ${
                config.enabled
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      config.enabled ? 'bg-purple-100' : 'bg-gray-100'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        config.enabled ? 'text-purple-600' : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{label}</h4>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleChannel(key, !config.enabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    config.enabled ? 'bg-purple-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      config.enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {config.enabled && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-4">
                  {key === 'presentation' && 'pageCount' in config && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">슬라이드 수:</label>
                      <input
                        type="number"
                        min={3}
                        max={20}
                        value={config.pageCount}
                        onChange={(e) =>
                          updateChannelConfig(key, { pageCount: parseInt(e.target.value) || 10 })
                        }
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-400"
                      />
                    </div>
                  )}

                  {key === 'instagram' && 'adCount' in config && (
                    <>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600">광고 수:</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={config.adCount}
                          onChange={(e) =>
                            updateChannelConfig(key, { adCount: parseInt(e.target.value) || 3 })
                          }
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-400"
                        />
                      </div>
                      {'format' in config && (
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600">포맷:</label>
                          <select
                            value={(config as any).format}
                            onChange={(e) => {
                              const formatConfig = { format: e.target.value as 'feed' | 'story' | 'both' };
                              updateChannelConfig(key, formatConfig as any);
                            }}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-400"
                          >
                            <option value="feed">피드</option>
                            <option value="story">스토리</option>
                            <option value="both">둘 다</option>
                          </select>
                        </div>
                      )}
                    </>
                  )}

                  {key === 'detail_page' && 'sectionCount' in config && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">섹션 수:</label>
                      <input
                        type="number"
                        min={3}
                        max={12}
                        value={config.sectionCount}
                        onChange={(e) =>
                          updateChannelConfig(key, { sectionCount: parseInt(e.target.value) || 6 })
                        }
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-400"
                      />
                    </div>
                  )}

                  {key === 'shorts' && 'duration' in config && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">길이 (초):</label>
                      <select
                        value={config.duration}
                        onChange={(e) =>
                          updateChannelConfig(key, { duration: parseInt(e.target.value) })
                        }
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-400"
                      >
                        <option value={15}>15초</option>
                        <option value={30}>30초</option>
                        <option value={60}>60초</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Step 3: Concept Generation & Edit
// =============================================================================

function Step3ConceptEdit() {
  const {
    generatedConcepts,
    selectedConceptId,
    progress,
    generateConcepts,
    generateImagePrompts,
    selectConcept,
    updateConcept,
    updateImagePrompt,
  } = useConceptWorkflowStore();

  const isGenerating = progress.channels.concepts.status === 'generating';
  const hasFailed = progress.channels.concepts.status === 'failed';
  const selectedConcept = generatedConcepts.find((c) => c.conceptId === selectedConceptId);

  // 컨셉이 없고, 생성 중이 아니고, 실패하지 않았을 때만 자동 생성
  // (실패 후 무한 루프 방지)
  useEffect(() => {
    if (generatedConcepts.length === 0 && !isGenerating && !hasFailed) {
      generateConcepts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-gray-800">컨셉 생성 중...</h3>
        <p className="text-sm text-gray-500 mt-2">AI가 최적의 마케팅 컨셉을 생성하고 있습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">컨셉 선택 및 편집</h3>
          <p className="text-sm text-gray-500">
            생성된 컨셉 중 하나를 선택하고 필요시 수정하세요
          </p>
        </div>
        <button
          onClick={generateConcepts}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          다시 생성
        </button>
      </div>

      {/* 컨셉 카드 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {generatedConcepts.map((concept) => (
          <div
            key={concept.conceptId}
            onClick={() => selectConcept(concept.conceptId)}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              concept.isSelected
                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-gray-800">{concept.conceptName}</h4>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  concept.isSelected
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-gray-300'
                }`}
              >
                {concept.isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{concept.headline}</p>
            <div className="flex flex-wrap gap-1">
              {concept.taglines.slice(0, 2).map((tagline, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                >
                  {tagline}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 선택된 컨셉 상세 편집 */}
      {selectedConcept && (
        <div className="border-t border-gray-200 pt-6 space-y-6">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            컨셉 상세 편집
          </h4>

          {/* 카피 편집 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                헤드라인
              </label>
              <input
                type="text"
                value={selectedConcept.headline}
                onChange={(e) =>
                  updateConcept(selectedConcept.conceptId, { headline: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                서브헤드라인
              </label>
              <input
                type="text"
                value={selectedConcept.subheadline}
                onChange={(e) =>
                  updateConcept(selectedConcept.conceptId, { subheadline: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CTA</label>
              <input
                type="text"
                value={selectedConcept.cta}
                onChange={(e) =>
                  updateConcept(selectedConcept.conceptId, { cta: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                타겟 오디언스
              </label>
              <input
                type="text"
                value={selectedConcept.targetAudience}
                onChange={(e) =>
                  updateConcept(selectedConcept.conceptId, { targetAudience: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          {/* 이미지 프롬프트 편집 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                <Image className="w-4 h-4 inline mr-1" />
                메인 이미지 프롬프트
              </label>
              <button
                onClick={() => generateImagePrompts(selectedConcept.conceptId)}
                className="text-xs text-purple-600 hover:text-purple-700"
              >
                AI 프롬프트 생성
              </button>
            </div>
            <textarea
              value={selectedConcept.imagePrompts.main.prompt}
              onChange={(e) =>
                updateImagePrompt(selectedConcept.conceptId, 'main', 0, {
                  prompt: e.target.value,
                })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
              placeholder="이미지 생성을 위한 프롬프트를 입력하세요..."
            />
            <div className="mt-2">
              <label className="block text-xs text-gray-500 mb-1">네거티브 프롬프트</label>
              <input
                type="text"
                value={selectedConcept.imagePrompts.main.negativePrompt}
                onChange={(e) =>
                  updateImagePrompt(selectedConcept.conceptId, 'main', 0, {
                    negativePrompt: e.target.value,
                  })
                }
                className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
            </div>
            <div className="flex gap-4 mt-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">스타일</label>
                <select
                  value={selectedConcept.imagePrompts.main.style}
                  onChange={(e) =>
                    updateImagePrompt(selectedConcept.conceptId, 'main', 0, {
                      style: e.target.value as ImagePromptConfig['style'],
                    })
                  }
                  className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-400"
                >
                  <option value="photorealistic">사실적</option>
                  <option value="illustration">일러스트</option>
                  <option value="minimal">미니멀</option>
                  <option value="product">제품</option>
                  <option value="lifestyle">라이프스타일</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">종횡비</label>
                <select
                  value={selectedConcept.imagePrompts.main.aspectRatio}
                  onChange={(e) =>
                    updateImagePrompt(selectedConcept.conceptId, 'main', 0, {
                      aspectRatio: e.target.value as ImagePromptConfig['aspectRatio'],
                    })
                  }
                  className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-400"
                >
                  <option value="1:1">1:1 (정방형)</option>
                  <option value="16:9">16:9 (가로)</option>
                  <option value="9:16">9:16 (세로)</option>
                  <option value="4:3">4:3</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Step 4: Final Confirmation & Preview
// =============================================================================

function Step4Confirmation() {
  const {
    generatedConcepts,
    selectedConceptId,
    outputTargets,
    generatedContent,
    progress,
    closeModal,
    generateContent,
  } = useConceptWorkflowStore();

  const selectedConcept = generatedConcepts.find((c) => c.conceptId === selectedConceptId);
  const isGeneratingContent = progress.overallStatus === 'generating';
  const hasContentFailed = progress.overallStatus === 'failed';

  // 산출물 프리뷰 컴포넌트를 동적 import (OutputPreview)
  const OutputPreview = React.lazy(() =>
    import('../../../templates/OutputPreview').then((mod) => ({ default: mod.OutputPreview }))
  );

  // Step4에 진입하면 자동으로 콘텐츠 생성 시작
  // (실패 후 무한 루프 방지: hasContentFailed 체크)
  useEffect(() => {
    if (selectedConceptId && !generatedContent && !isGeneratingContent && !hasContentFailed) {
      generateContent(selectedConceptId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConceptId]);

  if (!selectedConcept) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800">컨셉을 선택해주세요</h3>
        <p className="text-sm text-gray-500 mt-2">
          3단계에서 컨셉을 선택한 후 진행하세요
        </p>
      </div>
    );
  }

  // 콘텐츠 생성 핸들러
  const handleGenerateContent = () => {
    if (selectedConceptId) {
      generateContent(selectedConceptId);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">산출물 프리뷰</h3>
        <p className="text-sm text-gray-500">
          선택한 컨셉으로 LLM이 풍부한 콘텐츠를 생성합니다. 생성 후 이미지를 추가할 수 있습니다.
        </p>
      </div>

      {/* 선택된 컨셉 요약 */}
      <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-purple-800">{selectedConcept.conceptName}</h4>
            <p className="text-sm text-gray-600 mt-1">{selectedConcept.headline}</p>
          </div>
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
            선택됨
          </span>
        </div>
      </div>

      {/* 산출물 프리뷰 */}
      <React.Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        }
      >
        <OutputPreview
          concept={selectedConcept}
          targets={outputTargets}
          generatedContent={generatedContent}
          isGeneratingContent={isGeneratingContent}
          onGenerateContent={handleGenerateContent}
          onExport={(tab, format) => {
            console.log(`Export ${tab} as ${format}`);
            // TODO: Export 기능 구현
          }}
        />
      </React.Suspense>

      {/* 완료 버튼 */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={closeModal}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all"
        >
          완료
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Main Modal Component
// =============================================================================

export function ConceptGenerationModal() {
  const { isOpen, currentStep, error, closeModal, goToStep, nextStep, prevStep, clearError } =
    useConceptWorkflowStore();

  if (!isOpen) return null;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1SourceData />;
      case 2:
        return <Step2OutputTargets />;
      case 3:
        return <Step3ConceptEdit />;
      case 4:
        return <Step4Confirmation />;
      default:
        return null;
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return true; // 소스가 없어도 진행 가능 (경고 표시)
      case 2:
        return true; // 최소 하나의 채널 활성화 권장
      case 3:
        return useConceptWorkflowStore.getState().selectedConceptId !== null;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/50" onClick={closeModal} />

      {/* 모달 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">컨셉 생성 워크플로우</h2>
              <p className="text-xs text-gray-500">통합 마케팅 컨셉 및 산출물 생성</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 단계 인디케이터 */}
        <StepIndicator currentStep={currentStep} onStepClick={goToStep} />

        {/* 에러 메시지 */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button onClick={clearError} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">{renderStep()}</div>

        {/* 푸터 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            >
              취소
            </button>
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                disabled={!canGoNext()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConceptGenerationModal;
