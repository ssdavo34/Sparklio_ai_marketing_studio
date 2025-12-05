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
import { Sparkles, Send, Presentation, FileText, Instagram, ChevronDown, ChevronUp, X, Target, MessageSquare, Loader2, Wand2, Check, RefreshCw, Settings2 } from 'lucide-react';
import { ConceptGenerationModal } from './ConceptGenerationModal';
import { useConceptWorkflowStore } from '../../../stores/useConceptWorkflowStore';
import { useCenterViewStore } from '../../../stores/useCenterViewStore';
import { useGeneratedAssetsStore, type GeneratedConcept } from '../../../stores/useGeneratedAssetsStore';
import { useCanvasStore } from '../../../stores/useCanvasStore';
import { useLeftPanelStore } from '../../../stores/useLeftPanelStore';
import { useConceptGenerate } from '../../../hooks/useConceptGenerate';
import { getCanvasStore, getOrCreateCanvasStore } from '../../../polotno/polotnoStoreSingleton';
import { addConceptsToCanvas } from '@/lib/canvas/conceptTemplate';
import { addSlidesToCanvas, type BrandTheme } from '@/lib/canvas/slidesTemplate';
import { addInstagramAdsToCanvas } from '@/lib/canvas/instagramTemplate';
import { addProductDetailToCanvas } from '@/lib/canvas/productDetailTemplate';
import { toast } from '@/components/ui/Toast';
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

  // useConceptGenerate 훅 (실제 API 연동)
  const { generateConcepts, isLoading: isGenerating, error: generateError, clearError } = useConceptGenerate({ useMock: false });

  // Canvas Store - 캔버스 타입 변경
  const setActiveCanvasType = useCanvasStore((state) => state.setActiveCanvasType);

  // CenterView Store - Brand DNA
  const { sharedBrandDNA } = useCenterViewStore();

  // LeftPanel Store - 탭 전환
  const setActiveTab = useLeftPanelStore((state) => state.setActiveTab);

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
  // conceptsV1이 있으면 사용, 없으면 conceptBoardData.concepts 사용 (Meeting에서 전송된 데이터)
  const generatedConcepts = conceptsV1 || [];

  // Meeting에서 전송된 컨셉 데이터 (GeneratedConcept[] 형식)
  const meetingConcepts = conceptBoardData?.concepts || [];

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
          console.log('[ConceptBoardTab] Store 확인:', canvasStore ? 'found' : 'not found');

          if (canvasStore) {
            console.log('[ConceptBoardTab] 렌더링 전 페이지 수:', canvasStore.pages?.length);
            addConceptsToCanvas(canvasStore, response.concepts, true);
            console.log('[ConceptBoardTab] 렌더링 후 페이지 수:', canvasStore.pages?.length);
            console.log('[ConceptBoardTab] 페이지 목록:', canvasStore.pages?.map((p: any) => ({ id: p.id, children: p.children?.length })));
            return true;
          }
          return false;
        };

        // Store가 준비될 때까지 폴링 (최대 2초)
        let attempts = 0;
        const maxAttempts = 20;
        const pollInterval = setInterval(() => {
          attempts++;
          console.log(`[ConceptBoardTab] 폴링 시도 ${attempts}/${maxAttempts}`);
          if (renderConceptsToCanvas()) {
            clearInterval(pollInterval);
            console.log('[ConceptBoardTab] ✅ Canvas 렌더링 완료');
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            console.error('[ConceptBoardTab] ❌ Canvas Store 준비 시간 초과');
          }
        }, 100);
      }
    } catch (e) {
      console.error('[ConceptBoardTab] 컨셉 생성 실패:', e);
    }
  }, [campaignInput, sharedBrandDNA, generateConcepts, clearError, setConceptBoardData, setConceptsV1, setSelectedConceptId, setActiveCanvasType]);

  // 풀셋 생성 핸들러 (영상 제외) - 생성 후 프레젠테이션 캔버스로 이동
  const handleGenerateFullSet = useCallback(async () => {
    if (!selectedConcept) return;

    const generatedConcept = convertConceptV1ToGenerated(selectedConcept, 0);

    try {
      toast.info('풀셋 생성을 시작합니다... (슬라이드, 상세페이지, SNS)');

      // 병렬로 Presentation, Detail, SNS 생성 (영상 제외)
      await Promise.all([
        generateSlidesFromConcept(generatedConcept),
        generateDetailFromConcept(generatedConcept),
        generateInstagramFromConcept(generatedConcept),
      ]);

      // 생성 완료 후 Store에서 데이터 가져오기
      const state = useGeneratedAssetsStore.getState();
      const slidesData = state.slidesData;
      const detailData = state.detailData;
      const instagramData = state.instagramData;

      // 각 캔버스에 렌더링
      const POLOTNO_KEY = 'ng2ylHnHO2NscxqyUEWy';

      // 1. 프레젠테이션 캔버스 렌더링
      if (slidesData?.slides) {
        const presStore = getOrCreateCanvasStore('presentation', POLOTNO_KEY);
        if (presStore) {
          const pageIds = presStore.pages?.map((p: any) => p.id) || [];
          if (pageIds.length > 0) presStore.deletePages(pageIds);
          const theme: BrandTheme = {
            primaryColor: generatedConcept.color_scheme?.primary || '#6366F1',
            secondaryColor: generatedConcept.color_scheme?.secondary || '#8B5CF6',
          };
          addSlidesToCanvas(presStore, slidesData.slides as any, theme);
        }
      }

      // 2. 상세페이지 캔버스 렌더링
      if (detailData?.sections) {
        const detailStore = getOrCreateCanvasStore('detail', POLOTNO_KEY);
        if (detailStore) {
          const pageIds = detailStore.pages?.map((p: any) => p.id) || [];
          if (pageIds.length > 0) detailStore.deletePages(pageIds);
          addProductDetailToCanvas(detailStore, {
            id: detailData.id,
            title: detailData.title,
            sections: detailData.sections as any,
          });
        }
      }

      // 3. SNS 캔버스 렌더링
      if (instagramData?.ads) {
        const snsStore = getOrCreateCanvasStore('sns', POLOTNO_KEY);
        if (snsStore) {
          const pageIds = snsStore.pages?.map((p: any) => p.id) || [];
          if (pageIds.length > 0) snsStore.deletePages(pageIds);
          addInstagramAdsToCanvas(snsStore, instagramData.ads as any);
        }
      }

      // 프레젠테이션 탭으로 이동 (첫 번째 산출물)
      setActiveTab('presentation');
      toast.success('풀셋 생성 완료! 프레젠테이션 → 상세페이지 → SNS 탭에서 확인하세요.');

    } catch (err) {
      console.error('[ConceptBoardTab] 풀셋 생성 실패:', err);
      toast.error('풀셋 생성에 실패했습니다.');
    }
  }, [selectedConcept, generateSlidesFromConcept, generateDetailFromConcept, generateInstagramFromConcept, setActiveTab]);

  // Polotno API Key (환경변수 또는 하드코딩)
  const POLOTNO_API_KEY = 'ng2ylHnHO2NscxqyUEWy';

  // 개별 채널 생성 핸들러 - 캔버스 렌더링까지 수행
  const handleOpenSlides = useCallback(async () => {
    if (!selectedConcept) return;
    const generatedConcept = convertConceptV1ToGenerated(selectedConcept, 0);

    try {
      // 1. 슬라이드 데이터 생성
      await generateSlidesFromConcept(generatedConcept);

      // 2. Store에서 생성된 데이터 가져오기
      const slidesData = useGeneratedAssetsStore.getState().slidesData;
      if (!slidesData || !slidesData.slides) {
        toast.error('슬라이드 데이터 생성에 실패했습니다.');
        return;
      }

      // 3. presentation 캔버스 타입으로 전환 + 렌더링
      setActiveTab('presentation');

      // 4. 캔버스에 렌더링 (폴링으로 Store 준비 대기)
      setTimeout(() => {
        const store = getOrCreateCanvasStore('presentation', POLOTNO_API_KEY);
        if (store) {
          // 기존 페이지 정리
          const pageIds = store.pages?.map((p: any) => p.id) || [];
          if (pageIds.length > 0) {
            store.deletePages(pageIds);
          }
          // 테마 설정
          const theme: BrandTheme = {
            primaryColor: generatedConcept.color_scheme?.primary || '#6366F1',
            secondaryColor: generatedConcept.color_scheme?.secondary || '#8B5CF6',
          };
          addSlidesToCanvas(store, slidesData.slides as any, theme);
          toast.success(`${slidesData.slides.length}장 슬라이드가 생성되었습니다.`);
        }
      }, 300);
    } catch (err) {
      console.error('[ConceptBoardTab] 슬라이드 생성 실패:', err);
      toast.error('슬라이드 생성에 실패했습니다.');
    }
  }, [selectedConcept, generateSlidesFromConcept, setActiveTab]);

  const handleOpenDetail = useCallback(async () => {
    if (!selectedConcept) return;
    const generatedConcept = convertConceptV1ToGenerated(selectedConcept, 0);

    try {
      // 1. 상세페이지 데이터 생성
      await generateDetailFromConcept(generatedConcept);

      // 2. Store에서 생성된 데이터 가져오기
      const detailData = useGeneratedAssetsStore.getState().detailData;
      if (!detailData || !detailData.sections) {
        toast.error('상세페이지 데이터 생성에 실패했습니다.');
        return;
      }

      // 3. detail 캔버스 타입으로 전환 + 렌더링
      setActiveTab('detail');

      // 4. 캔버스에 렌더링
      setTimeout(() => {
        const store = getOrCreateCanvasStore('detail', POLOTNO_API_KEY);
        if (store) {
          const pageIds = store.pages?.map((p: any) => p.id) || [];
          if (pageIds.length > 0) {
            store.deletePages(pageIds);
          }
          addProductDetailToCanvas(store, {
            id: detailData.id,
            title: detailData.title,
            sections: detailData.sections as any,
          });
          toast.success(`${detailData.sections.length}개 섹션이 생성되었습니다.`);
        }
      }, 300);
    } catch (err) {
      console.error('[ConceptBoardTab] 상세페이지 생성 실패:', err);
      toast.error('상세페이지 생성에 실패했습니다.');
    }
  }, [selectedConcept, generateDetailFromConcept, setActiveTab]);

  const handleOpenInstagram = useCallback(async () => {
    if (!selectedConcept) return;
    const generatedConcept = convertConceptV1ToGenerated(selectedConcept, 0);

    try {
      // 1. 인스타그램 데이터 생성
      await generateInstagramFromConcept(generatedConcept);

      // 2. Store에서 생성된 데이터 가져오기
      const instagramData = useGeneratedAssetsStore.getState().instagramData;
      if (!instagramData || !instagramData.ads) {
        toast.error('인스타그램 데이터 생성에 실패했습니다.');
        return;
      }

      // 3. sns 캔버스 타입으로 전환 + 렌더링
      setActiveTab('sns');

      // 4. 캔버스에 렌더링
      setTimeout(() => {
        const store = getOrCreateCanvasStore('sns', POLOTNO_API_KEY);
        if (store) {
          const pageIds = store.pages?.map((p: any) => p.id) || [];
          if (pageIds.length > 0) {
            store.deletePages(pageIds);
          }
          addInstagramAdsToCanvas(store, instagramData.ads as any);
          toast.success(`${instagramData.ads.length}개 광고가 생성되었습니다.`);
        }
      }, 300);
    } catch (err) {
      console.error('[ConceptBoardTab] 인스타그램 생성 실패:', err);
      toast.error('인스타그램 생성에 실패했습니다.');
    }
  }, [selectedConcept, generateInstagramFromConcept, setActiveTab]);

  const isGeneratingFullSet = isGeneratingSlides || isGeneratingDetail || isGeneratingInstagram;

  // 컨셉 워크플로우 모달
  const openWorkflowModal = useConceptWorkflowStore((state) => state.openModal);
  const isModalOpen = useConceptWorkflowStore((state) => state.isOpen);

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h2 className="text-sm font-semibold text-neutral-800">ConceptBoard</h2>
          {generatedConcepts.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-purple-200 text-purple-700 rounded">
              {generatedConcepts.length}개 컨셉
            </span>
          )}
        </div>
        <button
          onClick={() => openWorkflowModal()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
          title="고급 컨셉 생성 워크플로우"
        >
          <Settings2 className="w-3.5 h-3.5" />
          고급 생성
        </button>
      </div>

      {/* 컨셉 생성 모달 */}
      {isModalOpen && <ConceptGenerationModal />}

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

                      // ⭐ 캔버스 페이지도 해당 컨셉으로 전환
                      const canvasStore = getCanvasStore('concept');
                      if (canvasStore && canvasStore.pages) {
                        const targetPage = canvasStore.pages[index];
                        if (targetPage) {
                          canvasStore.selectPage(targetPage.id);
                          console.log(`[ConceptBoardTab] 컨셉 ${index + 1} 선택 → 페이지 ${targetPage.id} 전환`);
                        }
                      }
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

        {/* Meeting에서 전송된 컨셉 표시 */}
        {meetingConcepts.length > 0 && generatedConcepts.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-neutral-700 uppercase">
                  Meeting 분석 컨셉
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                  {conceptBoardData?.campaign_name}
                </span>
              </div>
              <button
                onClick={() => {
                  setConceptBoardData(null);
                }}
                className="text-[10px] text-neutral-400 hover:text-neutral-600 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                초기화
              </button>
            </div>

            {meetingConcepts.map((concept, index) => {
              const isSelected = selectedConceptId === concept.concept_id;
              const isExpanded = expandedCard === concept.concept_id;

              return (
                <div
                  key={concept.concept_id}
                  className={`border rounded-lg bg-white overflow-hidden transition-all ${
                    isSelected
                      ? 'border-green-400 ring-2 ring-green-100'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {/* 카드 헤더 */}
                  <div
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-green-50' : 'hover:bg-neutral-50'
                    }`}
                    onClick={() => {
                      setSelectedConceptId(concept.concept_id);
                      setExpandedCard(isExpanded ? null : concept.concept_id);
                    }}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          isSelected ? 'bg-green-200 text-green-700' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          컨셉 {index + 1}
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-neutral-800 mb-0.5">
                      {concept.concept_name}
                    </h4>
                    <p className="text-xs text-neutral-500 line-clamp-2">
                      {concept.headline}
                    </p>
                  </div>

                  {/* 확장 영역 */}
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-neutral-100 space-y-3">
                      {/* 상세 정보 */}
                      <div className="pt-2 space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          <span className="text-neutral-500 w-16 shrink-0">설명</span>
                          <span className="text-neutral-700 whitespace-pre-wrap">{concept.description}</span>
                        </div>
                        {concept.subheadline && (
                          <div className="flex items-start gap-2">
                            <span className="text-neutral-500 w-16 shrink-0">서브헤드</span>
                            <span className="text-neutral-700">{concept.subheadline}</span>
                          </div>
                        )}
                        {concept.tone && (
                          <div className="flex items-start gap-2">
                            <span className="text-neutral-500 w-16 shrink-0">톤</span>
                            <span className="text-neutral-700">{concept.tone}</span>
                          </div>
                        )}
                      </div>

                      {/* 채널별 산출물 버튼 */}
                      <div>
                        <p className="text-[10px] font-medium text-neutral-500 uppercase mb-2">
                          채널별 생성
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            onClick={() => generateSlidesFromConcept(concept)}
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
                            onClick={() => generateDetailFromConcept(concept)}
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
                            onClick={() => generateInstagramFromConcept(concept)}
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 빈 상태 안내 */}
        {generatedConcepts.length === 0 && meetingConcepts.length === 0 && !isGenerating && (
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
