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
  // 생성 로딩 상태
  isGeneratingSlides: boolean;
  isGeneratingDetail: boolean;
  isGeneratingInstagram: boolean;
  isGeneratingShorts: boolean;
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
  isGeneratingSlides,
  isGeneratingDetail,
  isGeneratingInstagram,
  isGeneratingShorts,
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

      {/* 🆕 ConceptV1 고도화 필드 - Audience Insight */}
      {concept.audience_insight && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
          <p className="text-xs font-medium text-amber-900 mb-1">💡 Audience Insight</p>
          <p className="text-sm text-amber-900 italic">
            "{concept.audience_insight}"
          </p>
        </div>
      )}

      {/* 🆕 ConceptV1 고도화 필드 - Core Promise & Brand Role */}
      {(concept.core_promise || concept.brand_role) && (
        <div className="space-y-2 mb-4">
          {concept.core_promise && (
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
              <p className="text-xs font-medium text-purple-900 mb-1">🎯 Core Promise</p>
              <p className="text-sm text-purple-900 font-medium">{concept.core_promise}</p>
            </div>
          )}
          {concept.brand_role && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
              <p className="text-xs font-medium text-indigo-900 mb-1">🏢 Brand Role</p>
              <p className="text-sm text-indigo-900">{concept.brand_role}</p>
            </div>
          )}
        </div>
      )}

      {/* 🆕 ConceptV1 고도화 필드 - Reason to Believe */}
      {concept.reason_to_believe && concept.reason_to_believe.length > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-4">
          <p className="text-xs font-medium text-green-900 mb-2">✅ Reason to Believe</p>
          <ul className="space-y-1">
            {concept.reason_to_believe.map((reason, idx) => (
              <li key={idx} className="text-xs text-green-900 flex items-start gap-1.5">
                <span className="text-green-600">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
        {/* 🆕 Visual World HEX Colors */}
        {concept.visual_world?.hex_colors && concept.visual_world.hex_colors.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-500 w-16 shrink-0">컬러</span>
            <div className="flex gap-1.5 flex-wrap">
              {concept.visual_world.hex_colors.map((hex, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <div
                    className="w-5 h-5 rounded border border-gray-200"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                  <span className="text-xs font-mono text-gray-600">{hex}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 산출물 버튼 */}
      <div className="border-t pt-4">
        <p className="text-xs text-gray-500 mb-2">산출물 생성 및 보기</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onOpenSlides(); }}
            disabled={isGeneratingSlides}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isGeneratingSlides
                ? 'bg-purple-100 text-purple-600 cursor-wait'
                : 'bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700'
            }`}
          >
            {isGeneratingSlides ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>생성중...</span>
              </>
            ) : (
              <>
                <span>📊</span>
                <span>슬라이드</span>
              </>
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenDetail(); }}
            disabled={isGeneratingDetail}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isGeneratingDetail
                ? 'bg-purple-100 text-purple-600 cursor-wait'
                : 'bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700'
            }`}
          >
            {isGeneratingDetail ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>생성중...</span>
              </>
            ) : (
              <>
                <span>📄</span>
                <span>상세페이지</span>
              </>
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenInstagram(); }}
            disabled={isGeneratingInstagram}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isGeneratingInstagram
                ? 'bg-purple-100 text-purple-600 cursor-wait'
                : 'bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700'
            }`}
          >
            {isGeneratingInstagram ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>생성중...</span>
              </>
            ) : (
              <>
                <span>📸</span>
                <span>인스타그램</span>
              </>
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenShorts(); }}
            disabled={isGeneratingShorts}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isGeneratingShorts
                ? 'bg-purple-100 text-purple-600 cursor-wait'
                : 'bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700'
            }`}
          >
            {isGeneratingShorts ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>생성중...</span>
              </>
            ) : (
              <>
                <span>🎬</span>
                <span>쇼츠</span>
              </>
            )}
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

  // AI 생성된 ConceptBoard 데이터 (우선 사용)
  const generatedConceptBoard = useGeneratedAssetsStore((state) => state.conceptBoardData);

  // 생성 함수들과 로딩 상태
  const {
    generateSlidesFromConcept,
    generateDetailFromConcept,
    generateInstagramFromConcept,
    generateShortsFromConcept,
    isGeneratingSlides,
    isGeneratingDetail,
    isGeneratingInstagram,
    isGeneratingShorts,
    slidesData,
    detailData,
    instagramData,
    shortsData,
  } = useGeneratedAssetsStore();

  const [mockData, setMockData] = useState<ConceptBoardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'generated' | 'mock'>('generated');

  // Mock 데이터 로드 (생성된 데이터가 없을 때만)
  useEffect(() => {
    async function loadMockData() {
      // AI 생성 데이터가 있으면 그것을 사용
      if (generatedConceptBoard) {
        setDataSource('generated');
        setLoading(false);
        return;
      }

      // 이미 CenterViewStore에 데이터가 있으면 스킵
      if (conceptBoardData) {
        setDataSource('mock');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/mock-data/concept-board-sample.json');
        if (!response.ok) {
          throw new Error('Failed to load concept board data');
        }
        const data: ConceptBoardData = await response.json();
        setMockData(data);
        setConceptBoardData(data);
        setDataSource('mock');
      } catch (err) {
        console.error('Error loading concept board:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadMockData();
  }, [generatedConceptBoard, conceptBoardData, setConceptBoardData, setLoading]);

  // 표시할 데이터 결정: AI 생성 > CenterViewStore > Mock
  const displayData: ConceptBoardData | null = generatedConceptBoard
    ? {
        campaign_id: generatedConceptBoard.id,
        campaign_name: generatedConceptBoard.campaign_name,
        status: 'completed',
        created_at: generatedConceptBoard.createdAt?.toISOString() || new Date().toISOString(),
        meeting_summary: {
          title: `${generatedConceptBoard.campaign_name} 회의`,
          duration_minutes: 30,
          participants: ['AI Assistant'],
          key_points: generatedConceptBoard.concepts.map(c => c.headline),
          core_message: generatedConceptBoard.concepts[0]?.description || '',
        },
        concepts: generatedConceptBoard.concepts.map((concept) => ({
          concept_id: concept.concept_id,
          concept_name: concept.concept_name,
          concept_description: concept.description,
          target_audience: concept.target_audience || '전체 고객',
          key_message: concept.headline,
          tone_and_manner: concept.tone || '친근하고 전문적인',
          visual_style: concept.color_scheme ? `${concept.color_scheme.primary} 기반` : '모던하고 심플한',
          thumbnail_url: undefined,
          assets: {
            presentation: { id: `pres-${concept.concept_id}`, status: 'pending' as const },
            product_detail: { id: `detail-${concept.concept_id}`, status: 'pending' as const },
            instagram_ads: { id: `ig-${concept.concept_id}`, status: 'pending' as const, count: 0 },
            shorts_script: { id: `shorts-${concept.concept_id}`, status: 'pending' as const, duration_seconds: 30 },
          },
        })),
      }
    : conceptBoardData || mockData;

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
  if (!displayData) {
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
        meetingSummary={displayData.meeting_summary}
        campaignName={displayData.campaign_name}
      />

      {/* AI 생성 데이터 안내 */}
      {dataSource === 'generated' && (
        <div className="bg-green-50 px-6 py-2 border-b">
          <p className="text-sm text-green-700">
            <span className="font-medium">AI 생성</span> - Chat AI가 생성한 Concept Board입니다.
          </p>
        </div>
      )}

      {/* Concept Cards 영역 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* 섹션 타이틀 */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                🎨 마케팅 콘셉트 ({displayData.concepts.length}개)
              </h2>
              {dataSource === 'generated' && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  AI 생성
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              각 콘셉트를 클릭하여 상세 산출물을 확인하세요
            </p>
          </div>

          {/* 카드 그리드 */}
          <div className="flex flex-wrap gap-5">
            {displayData.concepts.map((concept) => {
              // 생성된 컨셉에서 GeneratedConcept 형태로 변환
              const generatedConcept = generatedConceptBoard?.concepts.find(
                c => c.concept_id === concept.concept_id
              ) || {
                concept_id: concept.concept_id,
                concept_name: concept.concept_name,
                description: concept.concept_description,
                headline: concept.key_message,
                target_audience: concept.target_audience,
                tone: concept.tone_and_manner,
              };

              return (
                <ConceptCard
                  key={concept.concept_id}
                  concept={concept}
                  isSelected={selectedConceptId === concept.concept_id}
                  onSelect={() => setConceptId(concept.concept_id)}
                  onOpenSlides={async () => {
                    // 데이터가 없으면 먼저 생성
                    if (!slidesData) {
                      await generateSlidesFromConcept(generatedConcept);
                    }
                    openSlidesPreview(
                      concept.concept_id,
                      concept.assets.presentation.id
                    );
                  }}
                  onOpenDetail={async () => {
                    if (!detailData) {
                      await generateDetailFromConcept(generatedConcept);
                    }
                    openDetailPreview(
                      concept.concept_id,
                      concept.assets.product_detail.id
                    );
                  }}
                  onOpenInstagram={async () => {
                    if (!instagramData) {
                      await generateInstagramFromConcept(generatedConcept);
                    }
                    openInstagramPreview(
                      concept.concept_id,
                      concept.assets.instagram_ads.id
                    );
                  }}
                  onOpenShorts={async () => {
                    if (!shortsData) {
                      await generateShortsFromConcept(generatedConcept);
                    }
                    openShortsPreview(
                      concept.concept_id,
                      concept.assets.shorts_script.id
                    );
                  }}
                  onGenerateShorts={() => startGeneration(concept.concept_id)}
                  shortsGenerationState={getGenerationState(concept.concept_id)}
                  isGeneratingSlides={isGeneratingSlides}
                  isGeneratingDetail={isGeneratingDetail}
                  isGeneratingInstagram={isGeneratingInstagram}
                  isGeneratingShorts={isGeneratingShorts}
                />
              );
            })}
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
