'use client';

import React, { useEffect, useState } from 'react';
import { useCenterViewStore } from '../stores/useCenterViewStore';
import { useShortsGenerationStore, type ShortsGenerationState } from '../stores/useShortsGenerationStore';
import { useGeneratedAssetsStore } from '../stores/useGeneratedAssetsStore';
import type { ConceptBoardData, ConceptData } from '@/types/demo';

// ============================================
// Concept Card 컴포넌트
// ============================================

interface ConceptCardProps {
  concept: ConceptData;
  isSelected: boolean;
  onSelect: () => void;
  onOpenSlides: () => void;
  onOpenDetail: () => void;
  onOpenInstagram: () => void;
  onOpenShorts: () => void;
  onGenerateShorts: () => void;
  shortsGenerationState: ShortsGenerationState;
}

function ConceptCard({
  concept,
  isSelected,
  onSelect,
  onOpenSlides,
  onOpenDetail,
  onOpenInstagram,
  onOpenShorts,
  onGenerateShorts,
  shortsGenerationState,
}: ConceptCardProps) {
  const isGenerating = shortsGenerationState.status === 'processing';
  const isCompleted = shortsGenerationState.status === 'completed';
  const isFailed = shortsGenerationState.status === 'failed';
  return (
    <div
      onClick={onSelect}
      className={`
        flex-1 min-w-[300px] max-w-[400px]
        bg-white rounded-xl border-2 p-5
        transition-all duration-300 cursor-pointer
        hover:shadow-lg hover:-translate-y-1
        ${isSelected
          ? 'border-purple-500 shadow-lg shadow-purple-100'
          : 'border-gray-200 hover:border-purple-300'
        }
      `}
    >
      {/* 카드 헤더 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
            Concept
          </span>
          {concept.assets.presentation.status === 'completed' && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
              ✓ Ready
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900">
          {concept.concept_name}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {concept.concept_description}
        </p>
      </div>

      {/* 핵심 메시지 */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 mb-4">
        <p className="text-sm font-medium text-purple-900">
          "{concept.key_message}"
        </p>
      </div>

      {/* 타깃 & 톤앤매너 */}
      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-2">
          <span className="text-xs text-gray-500 w-16 shrink-0">타깃</span>
          <span className="text-sm text-gray-700">{concept.target_audience}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-xs text-gray-500 w-16 shrink-0">톤앤매너</span>
          <span className="text-sm text-gray-700">{concept.tone_and_manner}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-xs text-gray-500 w-16 shrink-0">비주얼</span>
          <span className="text-sm text-gray-700">{concept.visual_style}</span>
        </div>
      </div>

      {/* 산출물 버튼 */}
      <div className="border-t pt-4">
        <p className="text-xs text-gray-500 mb-2">산출물 보기</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onOpenSlides(); }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-purple-50 rounded-lg text-sm text-gray-700 hover:text-purple-700 transition-colors"
          >
            <span>📊</span>
            <span>슬라이드</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenDetail(); }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-purple-50 rounded-lg text-sm text-gray-700 hover:text-purple-700 transition-colors"
          >
            <span>📄</span>
            <span>상세페이지</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenInstagram(); }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-purple-50 rounded-lg text-sm text-gray-700 hover:text-purple-700 transition-colors"
          >
            <span>📸</span>
            <span>인스타그램</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenShorts(); }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-purple-50 rounded-lg text-sm text-gray-700 hover:text-purple-700 transition-colors"
          >
            <span>🎬</span>
            <span>쇼츠</span>
          </button>
        </div>

        {/* Shorts 생성 버튼 및 Progress UI */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          {isGenerating ? (
            // 생성 중 Progress UI
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-600 font-medium">
                  {shortsGenerationState.message || '생성 중...'}
                </span>
                <span className="text-gray-500">{shortsGenerationState.progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${shortsGenerationState.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 text-center">
                Shorts 영상을 생성하고 있습니다...
              </p>
            </div>
          ) : isCompleted ? (
            // 완료 상태 - 비디오 보기 & 다운로드
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-green-600">
                <span>✓</span>
                <span>Shorts 생성 완료!</span>
              </div>
              <div className="flex gap-2">
                {shortsGenerationState.videoUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(shortsGenerationState.videoUrl!, '_blank');
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm text-white transition-colors"
                  >
                    <span>▶️</span>
                    <span>재생</span>
                  </button>
                )}
                {shortsGenerationState.downloadUrl && (
                  <a
                    href={shortsGenerationState.downloadUrl}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    <span>⬇️</span>
                    <span>다운로드</span>
                  </a>
                )}
              </div>
            </div>
          ) : isFailed ? (
            // 실패 상태
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-red-600">
                <span>⚠️</span>
                <span>{shortsGenerationState.error || '생성 실패'}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onGenerateShorts(); }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-sm text-red-600 transition-colors"
              >
                <span>🔄</span>
                <span>다시 시도</span>
              </button>
            </div>
          ) : (
            // 기본 상태 - 생성 버튼
            <button
              onClick={(e) => { e.stopPropagation(); onGenerateShorts(); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-sm text-white font-medium transition-all shadow-sm hover:shadow"
            >
              <span>🎬</span>
              <span>Shorts 영상 생성</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Meeting Summary Header 컴포넌트
// ============================================

interface MeetingHeaderProps {
  meetingSummary: ConceptBoardData['meeting_summary'];
  campaignName: string;
}

function MeetingHeader({ meetingSummary, campaignName }: MeetingHeaderProps) {
  return (
    <div className="bg-white border-b px-6 py-4">
      <div className="max-w-6xl mx-auto">
        {/* 캠페인 타이틀 */}
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-xl font-bold text-gray-900">
            {campaignName}
          </h1>
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
            완료됨
          </span>
        </div>

        {/* 회의 정보 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-1">
                📋 {meetingSummary.title}
              </h2>
              <p className="text-sm text-gray-600">
                {meetingSummary.core_message}
              </p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>{meetingSummary.duration_minutes}분</p>
              <p>{meetingSummary.participants.join(', ')}</p>
            </div>
          </div>

          {/* 핵심 포인트 */}
          <div className="mt-3 flex flex-wrap gap-2">
            {meetingSummary.key_points.map((point, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600"
              >
                {point}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ConceptBoardView 메인 컴포넌트
// ============================================

export function ConceptBoardView() {
  const {
    conceptBoardData,
    selectedConceptId,
    setConceptBoardData,
    setConceptId,
    openSlidesPreview,
    openDetailPreview,
    openInstagramPreview,
    openShortsPreview,
    setLoading,
    isLoading,
  } = useCenterViewStore();

  const { startGeneration, getGenerationState } = useShortsGenerationStore();

  const [error, setError] = useState<string | null>(null);

  // Mock 데이터 로드
  useEffect(() => {
    async function loadMockData() {
      if (conceptBoardData) return; // 이미 데이터가 있으면 스킵

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/mock-data/concept-board-sample.json');
        if (!response.ok) {
          throw new Error('Failed to load concept board data');
        }
        const data: ConceptBoardData = await response.json();
        setConceptBoardData(data);
      } catch (err) {
        console.error('Error loading concept board:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadMockData();
  }, [conceptBoardData, setConceptBoardData, setLoading]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Concept Board 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 mb-2">⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 데이터 없음
  if (!conceptBoardData) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Concept Board 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* 헤더 */}
      <MeetingHeader
        meetingSummary={conceptBoardData.meeting_summary}
        campaignName={conceptBoardData.campaign_name}
      />

      {/* Concept Cards 영역 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* 섹션 타이틀 */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              🎨 마케팅 콘셉트 ({conceptBoardData.concepts.length}개)
            </h2>
            <p className="text-sm text-gray-500">
              각 콘셉트를 클릭하여 상세 산출물을 확인하세요
            </p>
          </div>

          {/* 카드 그리드 */}
          <div className="flex flex-wrap gap-5">
            {conceptBoardData.concepts.map((concept) => (
              <ConceptCard
                key={concept.concept_id}
                concept={concept}
                isSelected={selectedConceptId === concept.concept_id}
                onSelect={() => setConceptId(concept.concept_id)}
                onOpenSlides={() => openSlidesPreview(
                  concept.concept_id,
                  concept.assets.presentation.id
                )}
                onOpenDetail={() => openDetailPreview(
                  concept.concept_id,
                  concept.assets.product_detail.id
                )}
                onOpenInstagram={() => openInstagramPreview(
                  concept.concept_id,
                  concept.assets.instagram_ads.id
                )}
                onOpenShorts={() => openShortsPreview(
                  concept.concept_id,
                  concept.assets.shorts_script.id
                )}
                onGenerateShorts={() => startGeneration(concept.concept_id)}
                shortsGenerationState={getGenerationState(concept.concept_id)}
              />
            ))}
          </div>

          {/* 하단 안내 */}
          <div className="mt-8 text-center text-sm text-gray-400">
            <p>💡 콘셉트를 선택하고 산출물 버튼을 클릭하면 상세 내용을 볼 수 있습니다</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConceptBoardView;
