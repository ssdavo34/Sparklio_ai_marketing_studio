/**
 * ConceptBoard Tab
 *
 * 콘셉트 보드 관리 탭
 * - 캠페인 목표 입력 → AI가 3개 컨셉 생성
 * - Brand DNA 활용 (BrandKitTab에서 전송)
 * - 컨셉 선택 → 풀셋 생성 (Presentation, Detail, SNS)
 * - 영상은 제외 (Video6는 별도 관리)
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-12-02
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Sparkles, Send, Presentation, FileText, Instagram, ChevronDown, ChevronUp, X, Target, MessageSquare, Loader2, Wand2, Check, RefreshCw } from 'lucide-react';
import { useCenterViewStore } from '../../../stores/useCenterViewStore';
import { useGeneratedAssetsStore, type GeneratedConcept } from '../../../stores/useGeneratedAssetsStore';
import { useCanvasStore } from '../../../stores/useCanvasStore';
import { useConceptGenerate } from '../../../hooks/useConceptGenerate';
import { getCanvasStore } from '../../../polotno/polotnoStoreSingleton';
import { addConceptsToCanvas } from '@/lib/canvas/conceptTemplate';
import type { ConceptV1 } from '@/types/concept';

// ConceptV1 → GeneratedConcept 변환 헬퍼
function convertConceptV1ToGenerated(concept: ConceptV1, index: number): GeneratedConcept {
  return {
    concept_id: concept.id || `concept-${index + 1}`,
    concept_name: concept.name,
    description: concept.audience_insight || '',
    headline: concept.core_promise,
    subheadline: concept.creative_device,
    cta: concept.hook_patterns?.[0] || '자세히 알아보기',
    color_scheme: concept.visual_world?.hex_colors ? {
      primary: concept.visual_world.hex_colors[0] || '#6366F1',
      secondary: concept.visual_world.hex_colors[1] || '#EC4899',
      accent: concept.visual_world.hex_colors[2],
    } : undefined,
    target_audience: concept.target_audience,
    tone: concept.tone_and_manner,
  };
}

export function ConceptBoardTab() {
  // 캠페인 입력 상태
  const [campaignInput, setCampaignInput] = useState('');
  const [showBrandDNA, setShowBrandDNA] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // useConceptGenerate 훅 (Mock 모드 - 실제 API로 전환 시 false로 변경)
  const { generateConcepts, isLoading: isGenerating, error: generateError, clearError } = useConceptGenerate({ useMock: true });

  // Canvas Store - 캔버스 타입 변경
  const setActiveCanvasType = useCanvasStore((state) => state.setActiveCanvasType);

  // CenterView Store - Brand DNA
  const {
    openSlidesPreview,
    openDetailPreview,
    openInstagramPreview,
    sharedBrandDNA,
    setSharedBrandDNA,
    setView,
  } = useCenterViewStore();

  // Generated Assets Store - 컨셉 데이터 영속화 + 풀셋 생성 함수들
  const {
    conceptBoardData,
    setConceptBoardData,
    conceptsV1,              // ConceptV1[] - 영속 저장
    setConceptsV1,           // ConceptV1[] 저장 함수
    selectedConceptId,       // 선택된 컨셉 ID
    setSelectedConceptId,    // 선택된 컨셉 ID 설정
    generateSlidesFromConcept,
    generateDetailFromConcept,
    generateInstagramFromConcept,
    isGeneratingSlides,
    isGeneratingDetail,
    isGeneratingInstagram,
  } = useGeneratedAssetsStore();

  // 생성된 컨셉 목록 (Store에서 가져옴 - 영속화)
  const generatedConcepts = conceptsV1 || [];

  // 선택된 컨셉
  const selectedConcept = generatedConcepts.find(c => c.id === selectedConceptId) || null;

  // 확장된 카드 초기화 (첫 번째 컨셉으로)
  useEffect(() => {
    if (generatedConcepts.length > 0 && !expandedCard) {
      setExpandedCard(generatedConcepts[0].id);
    }
  }, [generatedConcepts, expandedCard]);

  // 컨셉 생성 핸들러
  const handleGenerateConcepts = useCallback(async () => {
    if (!campaignInput.trim() || campaignInput.length < 5) {
      alert('캠페인 목표를 5자 이상 입력해주세요.');
      return;
    }

    clearError();

    // Brand DNA를 컨텍스트로 활용
    const brandContext = sharedBrandDNA ?
      `브랜드 톤앤매너: ${sharedBrandDNA.tone || ''}\n타겟: ${sharedBrandDNA.target_audience || ''}` :
      undefined;

    try {
      const response = await generateConcepts(campaignInput, 3, brandContext);

      if (response.concepts && response.concepts.length > 0) {
        // Store에 컨셉 저장 (영속화)
        setConceptsV1(response.concepts);
        setSelectedConceptId(response.concepts[0].id);
        setExpandedCard(response.concepts[0].id);

        // GeneratedAssetsStore에도 저장 (다른 뷰와 연동)
        setConceptBoardData({
          id: `campaign-${Date.now()}`,
          campaign_name: campaignInput,
          concepts: response.concepts.map((c, i) => convertConceptV1ToGenerated(c, i)),
          createdAt: new Date(),
          sourceMessage: campaignInput,
        });

        // Canvas 타입을 concept로 변경 (PolotnoWorkspace가 Store를 생성/관리함)
        setActiveCanvasType('concept');

        // PolotnoWorkspace가 Store를 생성한 후 컨셉을 렌더링
        // PolotnoWorkspace는 activeCanvasType 변경 시 자동으로 Store를 생성하고 Zustand에 등록
        // 따라서 약간의 지연 후 Store에 컨셉을 렌더링
        const renderConceptsToCanvas = () => {
          const canvasStore = getCanvasStore('concept');
          if (canvasStore) {
            addConceptsToCanvas(canvasStore, response.concepts, true);
            console.log('[ConceptBoardTab] 컨셉 Canvas에 렌더링 완료:', response.concepts.length, '페이지');
            console.log('[ConceptBoardTab] 현재 페이지 수:', canvasStore.pages?.length);
            return true;
          }
          return false;
        };

        // Store가 준비될 때까지 폴링 (최대 2초)
        let attempts = 0;
        const maxAttempts = 20;
        const pollInterval = setInterval(() => {
          attempts++;
          if (renderConceptsToCanvas()) {
            clearInterval(pollInterval);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            console.error('[ConceptBoardTab] Canvas Store 준비 시간 초과');
          }
        }, 100);
      }
    } catch (e) {
      console.error('[ConceptBoardTab] 컨셉 생성 실패:', e);
    }
  }, [campaignInput, sharedBrandDNA, generateConcepts, clearError, setConceptBoardData, setConceptsV1, setSelectedConceptId, setActiveCanvasType]);

  // 풀셋 생성 핸들러 (영상 제외)
  const handleGenerateFullSet = useCallback(async () => {
    if (!selectedConcept) return;

    const generatedConcept = convertConceptV1ToGenerated(selectedConcept, 0);

    // 병렬로 Presentation, Detail, SNS 생성 (영상 제외)
    await Promise.all([
      generateSlidesFromConcept(generatedConcept),
      generateDetailFromConcept(generatedConcept),
      generateInstagramFromConcept(generatedConcept),
    ]);
  }, [selectedConcept, generateSlidesFromConcept, generateDetailFromConcept, generateInstagramFromConcept]);

  // 개별 채널 생성 핸들러
  const handleOpenSlides = useCallback(async () => {
    if (!selectedConcept) return;
    const generatedConcept = convertConceptV1ToGenerated(selectedConcept, 0);
    await generateSlidesFromConcept(generatedConcept);
    openSlidesPreview(selectedConcept.id, `pres-${selectedConcept.id}`);
  }, [selectedConcept, generateSlidesFromConcept, openSlidesPreview]);

  const handleOpenDetail = useCallback(async () => {
    if (!selectedConcept) return;
    const generatedConcept = convertConceptV1ToGenerated(selectedConcept, 0);
    await generateDetailFromConcept(generatedConcept);
    openDetailPreview(selectedConcept.id, `detail-${selectedConcept.id}`);
  }, [selectedConcept, generateDetailFromConcept, openDetailPreview]);

  const handleOpenInstagram = useCallback(async () => {
    if (!selectedConcept) return;
    const generatedConcept = convertConceptV1ToGenerated(selectedConcept, 0);
    await generateInstagramFromConcept(generatedConcept);
    openInstagramPreview(selectedConcept.id, `insta-${selectedConcept.id}`);
  }, [selectedConcept, generateInstagramFromConcept, openInstagramPreview]);

  const isGeneratingFullSet = isGeneratingSlides || isGeneratingDetail || isGeneratingInstagram;

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 bg-gradient-to-r from-purple-50 to-indigo-50">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h2 className="text-sm font-semibold text-neutral-800">ConceptBoard</h2>
        {generatedConcepts.length > 0 && (
          <span className="text-xs px-1.5 py-0.5 bg-purple-200 text-purple-700 rounded">
            {generatedConcepts.length}개 컨셉
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Brand DNA 표시 섹션 */}
        {sharedBrandDNA && showBrandDNA && (
          <div className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-purple-900">Brand DNA 연동됨</span>
              </div>
              <button
                onClick={() => setShowBrandDNA(false)}
                className="p-1 hover:bg-purple-100 rounded transition-colors"
                title="접기"
              >
                <X className="w-3 h-3 text-purple-600" />
              </button>
            </div>
            <div className="space-y-1 text-[11px]">
              {sharedBrandDNA.tone && (
                <div className="flex items-start gap-1">
                  <MessageSquare className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span className="text-purple-700 truncate">
                    {typeof sharedBrandDNA.tone === 'string' ? sharedBrandDNA.tone.slice(0, 60) : ''}
                  </span>
                </div>
              )}
              {sharedBrandDNA.target_audience && (
                <div className="flex items-start gap-1">
                  <Target className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span className="text-purple-700 truncate">
                    {typeof sharedBrandDNA.target_audience === 'string' ? sharedBrandDNA.target_audience.slice(0, 60) : ''}
                  </span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-purple-500 mt-2">
              ✓ 컨셉 생성 시 Brand DNA가 자동 적용됩니다
            </p>
          </div>
        )}

        {/* 캠페인 입력 폼 */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              캠페인 목표
            </label>
            <textarea
              value={campaignInput}
              onChange={(e) => setCampaignInput(e.target.value)}
              placeholder="예: 블랙프라이데이 특가 할인으로 신규 고객 유치"
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={2}
              disabled={isGenerating}
            />
          </div>

          {/* 컨셉 생성 버튼 */}
          <button
            onClick={handleGenerateConcepts}
            disabled={isGenerating || !campaignInput.trim()}
            className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              isGenerating || !campaignInput.trim()
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-sm hover:shadow'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI가 컨셉 생성 중...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                3개 컨셉 생성하기
              </>
            )}
          </button>

          {/* 에러 표시 */}
          {generateError && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600">{generateError}</p>
            </div>
          )}
        </div>

        {/* 생성된 컨셉 카드 목록 */}
        {generatedConcepts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-neutral-700 uppercase">
                생성된 컨셉
              </h3>
              <button
                onClick={() => {
                  setConceptsV1(null);
                  setSelectedConceptId(null);
                  // Canvas도 초기화
                  const canvasStore = getCanvasStore('concept');
                  if (canvasStore) {
                    // 모든 페이지 삭제 후 빈 페이지 추가
                    const pageIds = canvasStore.pages?.map((p: any) => p.id) || [];
                    if (pageIds.length > 0) {
                      canvasStore.deletePages(pageIds);
                    }
                    canvasStore.addPage({ width: 1080, height: 1080 });
                  }
                }}
                className="text-[10px] text-neutral-400 hover:text-neutral-600 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                초기화
              </button>
            </div>

            {generatedConcepts.map((concept, index) => {
              const isSelected = selectedConceptId === concept.id;
              const isExpanded = expandedCard === concept.id;

              return (
                <div
                  key={concept.id}
                  className={`border rounded-lg bg-white overflow-hidden transition-all ${
                    isSelected
                      ? 'border-purple-400 ring-2 ring-purple-100'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {/* 카드 헤더 */}
                  <div
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-purple-50' : 'hover:bg-neutral-50'
                    }`}
                    onClick={() => {
                      setSelectedConceptId(concept.id);
                      setExpandedCard(isExpanded ? null : concept.id);
                    }}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          isSelected ? 'bg-purple-200 text-purple-700' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          컨셉 {index + 1}
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-purple-600" />
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-neutral-800 mb-0.5">
                      {concept.name}
                    </h4>
                    <p className="text-xs text-neutral-500 line-clamp-2">
                      {concept.core_promise}
                    </p>

                    {/* 컬러 미리보기 */}
                    {concept.visual_world?.hex_colors && (
                      <div className="flex gap-1 mt-2">
                        {concept.visual_world.hex_colors.slice(0, 4).map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-sm border border-neutral-200"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 확장 영역 */}
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-neutral-100 space-y-3">
                      {/* 상세 정보 */}
                      <div className="pt-2 space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          <span className="text-neutral-500 w-12 shrink-0">인사이트</span>
                          <span className="text-neutral-700">{concept.audience_insight}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-neutral-500 w-12 shrink-0">타겟</span>
                          <span className="text-neutral-700">{concept.target_audience}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-neutral-500 w-12 shrink-0">톤</span>
                          <span className="text-neutral-700">{concept.tone_and_manner}</span>
                        </div>
                      </div>

                      {/* 채널별 산출물 버튼 (영상 제외) */}
                      <div>
                        <p className="text-[10px] font-medium text-neutral-500 uppercase mb-2">
                          채널별 생성
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            onClick={handleOpenSlides}
                            disabled={isGeneratingSlides}
                            className="flex flex-col items-center gap-1 p-2 border border-neutral-200 rounded hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
                          >
                            {isGeneratingSlides ? (
                              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                            ) : (
                              <Presentation className="w-4 h-4 text-blue-500" />
                            )}
                            <span className="text-[10px] text-neutral-600">슬라이드</span>
                          </button>

                          <button
                            onClick={handleOpenDetail}
                            disabled={isGeneratingDetail}
                            className="flex flex-col items-center gap-1 p-2 border border-neutral-200 rounded hover:border-green-300 hover:bg-green-50 transition-colors disabled:opacity-50"
                          >
                            {isGeneratingDetail ? (
                              <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4 text-green-500" />
                            )}
                            <span className="text-[10px] text-neutral-600">상세페이지</span>
                          </button>

                          <button
                            onClick={handleOpenInstagram}
                            disabled={isGeneratingInstagram}
                            className="flex flex-col items-center gap-1 p-2 border border-neutral-200 rounded hover:border-pink-300 hover:bg-pink-50 transition-colors disabled:opacity-50"
                          >
                            {isGeneratingInstagram ? (
                              <Loader2 className="w-4 h-4 text-pink-500 animate-spin" />
                            ) : (
                              <Instagram className="w-4 h-4 text-pink-500" />
                            )}
                            <span className="text-[10px] text-neutral-600">SNS</span>
                          </button>
                        </div>
                      </div>

                      {/* 풀셋 생성 버튼 */}
                      <button
                        onClick={handleGenerateFullSet}
                        disabled={isGeneratingFullSet}
                        className={`w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                          isGeneratingFullSet
                            ? 'bg-neutral-100 text-neutral-400'
                            : 'bg-purple-500 text-white hover:bg-purple-600'
                        }`}
                      >
                        {isGeneratingFullSet ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            생성 중...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            풀셋 생성 (슬라이드+상세+SNS)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 빈 상태 안내 */}
        {generatedConcepts.length === 0 && !isGenerating && (
          <div className="text-center py-8 text-neutral-400">
            <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">캠페인 목표를 입력하고</p>
            <p className="text-sm">AI 컨셉을 생성해보세요</p>
          </div>
        )}
      </div>

      {/* 하단 안내 */}
      <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50">
        <p className="text-[10px] text-neutral-500">
          💡 영상은 Video 탭에서 별도로 생성합니다
        </p>
      </div>
    </div>
  );
}
