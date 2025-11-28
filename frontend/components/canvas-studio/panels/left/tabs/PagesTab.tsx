'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCanvasStore } from '../../../stores/useCanvasStore';
import { useCenterViewStore } from '../../../stores/useCenterViewStore';
import { useGeneratedAssetsStore } from '../../../stores/useGeneratedAssetsStore';
import { getPolotnoStore } from '../../../polotno/polotnoStoreSingleton';
import { Plus, Copy, Trash2, RefreshCw, Loader2, FileText, Image, Film, Layout } from 'lucide-react';

// 페이지 아이템 타입
interface PageItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'concept' | 'slide' | 'detail_section' | 'instagram' | 'shorts_scene' | 'polotno';
  data?: any;
  thumbnail?: string;
  polotnoPage?: any; // Polotno 페이지 참조 (썸네일 포함)
  // ✅ Polotno 페이지 전용 속성
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

export function PagesTab() {
  // Center View Store
  const currentView = useCenterViewStore((state) => state.currentView);
  const selectedConceptId = useCenterViewStore((state) => state.selectedConceptId);
  const setConceptId = useCenterViewStore((state) => state.setConceptId);

  // Generated Assets Store
  const conceptBoardData = useGeneratedAssetsStore((state) => state.conceptBoardData);
  const slidesData = useGeneratedAssetsStore((state) => state.slidesData);
  const detailData = useGeneratedAssetsStore((state) => state.detailData);
  const instagramData = useGeneratedAssetsStore((state) => state.instagramData);
  const shortsData = useGeneratedAssetsStore((state) => state.shortsData);

  // Polotno Store (canvas 뷰용)
  const zustandPolotnoStore = useCanvasStore((state) => state.polotnoStore);
  const currentTemplate = useCanvasStore((state) => state.currentTemplate);
  const currentTheme = useCanvasStore((state) => state.currentTheme);
  const applyThemeToCanvas = useCanvasStore((state) => state.applyThemeToCanvas);

  const [pages, setPages] = useState<PageItem[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [polotnoPages, setPolotnoPages] = useState<any[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loadingThumbnails, setLoadingThumbnails] = useState<Set<string>>(new Set());
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const thumbnailGenerationRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const polotnoStore = getPolotnoStore() || zustandPolotnoStore;

  // Polotno 페이지 썸네일 생성 함수
  const generateThumbnail = useCallback(async (page: any): Promise<string | null> => {
    if (!page || !page.toDataURL) return null;

    try {
      // 페이지의 toDataURL 메서드 사용 (pixelRatio 낮춰서 썸네일 생성)
      const dataURL = await page.toDataURL({
        mimeType: 'image/jpeg',
        pixelRatio: 0.25, // 25% 크기로 썸네일 생성 (작은 사이즈)
      });
      return dataURL;
    } catch (error) {
      console.warn('[PagesTab] Failed to generate thumbnail:', error);
      return null;
    }
  }, []);

  // 모든 Polotno 페이지의 썸네일 생성
  const generateAllThumbnails = useCallback(async () => {
    if (currentView !== 'canvas') return;
    if (thumbnailGenerationRef.current) return; // 중복 실행 방지

    const store = getPolotnoStore() || zustandPolotnoStore;
    if (!store?.pages?.length) return;

    thumbnailGenerationRef.current = true;
    console.log('[PagesTab] Generating thumbnails for', store.pages.length, 'pages');

    const newThumbnails: Record<string, string> = {};
    const pageIds = store.pages.map((p: any) => p.id);

    setLoadingThumbnails(new Set(pageIds));

    for (const page of store.pages) {
      const thumbnail = await generateThumbnail(page);
      if (thumbnail) {
        newThumbnails[page.id] = thumbnail;
      }
    }

    setThumbnails(prev => ({ ...prev, ...newThumbnails }));
    setLoadingThumbnails(new Set());
    thumbnailGenerationRef.current = false;
    console.log('[PagesTab] Thumbnails generated:', Object.keys(newThumbnails).length);
  }, [currentView, zustandPolotnoStore, generateThumbnail]);

  // 캔버스 변경 시 썸네일 재생성 (debounce)
  useEffect(() => {
    if (currentView !== 'canvas') return;

    const store = getPolotnoStore() || zustandPolotnoStore;
    if (!store) return;

    // 초기 썸네일 생성 (지연)
    const initialTimeout = setTimeout(() => {
      generateAllThumbnails();
    }, 800);

    // 변경 감지 시 썸네일 재생성 (debounced)
    const handleChange = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        thumbnailGenerationRef.current = false; // 리셋하여 재생성 허용
        generateAllThumbnails();
      }, 1500); // 1.5초 디바운스
    };

    const unsubscribe = store.on?.('change', handleChange);

    return () => {
      clearTimeout(initialTimeout);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (unsubscribe) unsubscribe();
    };
  }, [currentView, zustandPolotnoStore, generateAllThumbnails]);

  // 현재 뷰에 따라 페이지 목록 생성
  useEffect(() => {
    console.log('[PagesTab] Current view:', currentView);

    let newPages: PageItem[] = [];

    switch (currentView) {
      case 'concept_board':
        // ConceptBoard: 컨셉들을 Polotno 페이지와 매핑하여 표시
        if (conceptBoardData?.concepts && polotnoStore?.pages) {
          newPages = conceptBoardData.concepts.map((concept, idx) => {
            // Polotno 페이지 찾기 (custom.conceptId로 매칭)
            const polotnoPage = polotnoStore.pages.find(
              (p: any) => p.custom?.conceptId === concept.concept_id
            );

            return {
              id: concept.concept_id,
              title: `컨셉 ${idx + 1}`,
              subtitle: concept.concept_name,
              type: 'concept' as const,
              data: concept,
              polotnoPage, // Polotno 페이지 참조 추가
            };
          });
          // 첫 번째 컨셉 자동 선택
          if (newPages.length > 0 && !selectedConceptId) {
            setConceptId(newPages[0].id);
            setSelectedPageId(newPages[0].id);
          }
        }
        break;

      case 'slides_preview':
        // 슬라이드: 각 슬라이드를 페이지로 표시
        if (slidesData?.slides) {
          newPages = slidesData.slides.map((slide, idx) => ({
            id: slide.id || `slide-${idx + 1}`,
            title: `슬라이드 ${idx + 1}`,
            subtitle: slide.title,
            type: 'slide' as const,
            data: slide,
          }));
        }
        break;

      case 'detail_preview':
        // 상세페이지: 각 섹션을 페이지로 표시
        if (detailData?.sections) {
          newPages = detailData.sections.map((section, idx) => ({
            id: `section-${idx + 1}`,
            title: `섹션 ${idx + 1}`,
            subtitle: section.section_type,
            type: 'detail_section' as const,
            data: section,
          }));
        }
        break;

      case 'instagram_preview':
        // 인스타그램: 각 광고를 페이지로 표시
        if (instagramData?.ads) {
          newPages = instagramData.ads.map((ad, idx) => ({
            id: ad.ad_id || `ad-${idx + 1}`,
            title: `광고 ${idx + 1}`,
            subtitle: ad.creative?.headline || ad.ad_type,
            type: 'instagram' as const,
            data: ad,
          }));
        }
        break;

      case 'shorts_preview':
        // 쇼츠: 각 씬을 페이지로 표시
        if (shortsData?.scenes) {
          newPages = shortsData.scenes.map((scene, idx) => ({
            id: `scene-${scene.scene_number || idx + 1}`,
            title: `씬 ${scene.scene_number || idx + 1}`,
            subtitle: scene.duration,
            type: 'shorts_scene' as const,
            data: scene,
          }));
        }
        break;

      case 'canvas':
      default:
        // Canvas: Polotno 페이지 표시
        if (polotnoStore?.pages) {
          newPages = polotnoStore.pages.map((page: any, idx: number) => ({
            id: page.id,
            title: `페이지 ${idx + 1}`,
            subtitle: `${page.width} × ${page.height}`,
            type: 'polotno' as const,
            data: page,
          }));
        }
        break;
    }

    console.log('[PagesTab] Generated pages:', newPages.length);
    setPages(newPages);

    // 첫 페이지 자동 선택
    if (newPages.length > 0 && !selectedPageId) {
      setSelectedPageId(newPages[0].id);
    }
  }, [currentView, conceptBoardData, slidesData, detailData, instagramData, shortsData, polotnoStore?.pages?.length, selectedConceptId]);

  // Polotno 페이지 변경 감지 (canvas 뷰)
  useEffect(() => {
    if (currentView !== 'canvas') return;

    const store = getPolotnoStore() || zustandPolotnoStore;
    if (!store) return;

    const updatePolotnoPages = () => {
      const pages = store.pages?.map((page: any, idx: number) => ({
        id: page.id,
        title: `페이지 ${idx + 1}`,
        subtitle: `${page.width} × ${page.height}`,
        type: 'polotno' as const,
        data: page,
        // ✅ 상태 변경 감지를 위해 썸네일과 크기를 직접 추출
        thumbnailUrl: page.custom?.thumbnailDataUrl,
        width: page.width,
        height: page.height,
      })) || [];
      setPages(pages);
      setSelectedPageId(store.activePage?.id || pages[0]?.id || null);
    };

    updatePolotnoPages();

    // 변경 감지
    const unsubscribe = store.on?.('change', updatePolotnoPages);
    // 폴링 간격 단축 (1000ms -> 500ms)
    const pollInterval = setInterval(updatePolotnoPages, 500);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(pollInterval);
    };
  }, [currentView, zustandPolotnoStore]);

  // 페이지 선택 핸들러
  const handleSelectPage = (pageId: string) => {
    setSelectedPageId(pageId);

    // 뷰에 따라 다른 동작
    if (currentView === 'concept_board') {
      setConceptId(pageId);
    } else if (currentView === 'canvas' && polotnoStore) {
      polotnoStore.selectPage(pageId);
    }
  };

  // 페이지 추가 (canvas 뷰에서만)
  const handleAddPage = () => {
    if (currentView !== 'canvas' || !polotnoStore) return;

    polotnoStore.addPage({
      width: currentTemplate.width,
      height: currentTemplate.height,
    });

    setTimeout(() => {
      applyThemeToCanvas(currentTheme);
    }, 100);
  };

  // 페이지 복제
  const handleDuplicatePage = (pageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (currentView !== 'canvas' || !polotnoStore) return;

    const page = polotnoStore.pages.find((p: any) => p.id === pageId);
    if (!page) return;

    // Polotno의 toJSON으로 페이지 복제
    const pageData = page.toJSON();
    polotnoStore.addPage(pageData);
  };

  // 페이지 삭제
  const handleDeletePage = (pageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (currentView !== 'canvas' || !polotnoStore) return;

    if (polotnoStore.pages.length <= 1) {
      alert('마지막 페이지는 삭제할 수 없습니다.');
      return;
    }

    if (!confirm('이 페이지를 삭제하시겠습니까?')) return;

    const page = polotnoStore.pages.find((p: any) => p.id === pageId);
    if (page) {
      page.remove();
    }
  };

  // Drag & Drop 핸들러
  const handleDragStart = (pageId: string, event: React.DragEvent) => {
    if (currentView !== 'canvas') return;
    setDraggedPageId(pageId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', pageId);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetPageId: string, event: React.DragEvent) => {
    event.preventDefault();
    if (currentView !== 'canvas' || !polotnoStore || !draggedPageId) return;

    const draggedPage = polotnoStore.pages.find((p: any) => p.id === draggedPageId);
    const targetPage = polotnoStore.pages.find((p: any) => p.id === targetPageId);

    if (draggedPage && targetPage && draggedPage !== targetPage) {
      // Polotno의 moveTo 메서드로 페이지 순서 변경
      const targetIndex = polotnoStore.pages.indexOf(targetPage);
      draggedPage.moveTo(targetIndex);
    }

    setDraggedPageId(null);
  };

  const handleDragEnd = () => {
    setDraggedPageId(null);
  };

  // 타입별 아이콘
  const getTypeIcon = (type: PageItem['type']) => {
    switch (type) {
      case 'concept': return <Layout className="w-4 h-4" />;
      case 'slide': return <FileText className="w-4 h-4" />;
      case 'detail_section': return <FileText className="w-4 h-4" />;
      case 'instagram': return <Image className="w-4 h-4" />;
      case 'shorts_scene': return <Film className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // 타입별 배경색
  const getTypeBgColor = (type: PageItem['type'], isSelected: boolean) => {
    if (isSelected) {
      switch (type) {
        case 'concept': return 'bg-purple-100 border-purple-500';
        case 'slide': return 'bg-blue-100 border-blue-500';
        case 'detail_section': return 'bg-green-100 border-green-500';
        case 'instagram': return 'bg-pink-100 border-pink-500';
        case 'shorts_scene': return 'bg-orange-100 border-orange-500';
        default: return 'bg-indigo-100 border-indigo-500';
      }
    }
    return 'bg-gray-50 border-gray-200 hover:border-gray-300';
  };

  // 뷰 타이틀
  const getViewTitle = () => {
    switch (currentView) {
      case 'concept_board': return '컨셉 목록';
      case 'slides_preview': return '슬라이드';
      case 'detail_preview': return '상세페이지';
      case 'instagram_preview': return '인스타그램';
      case 'shorts_preview': return '쇼츠 씬';
      default: return 'Pages';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">{getViewTitle()}</h2>
          <div className="flex items-center gap-1">
            {currentView === 'canvas' && (
              <>
                <button
                  onClick={() => {
                    thumbnailGenerationRef.current = false;
                    generateAllThumbnails();
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="썸네일 새로고침"
                  disabled={loadingThumbnails.size > 0}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingThumbnails.size > 0 ? 'animate-spin text-gray-400' : ''}`} />
                </button>
                <button
                  onClick={handleAddPage}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="Add new page"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
        {/* 뷰 타입 표시 */}
        <div className="mt-1 text-xs text-gray-500">
          {currentView !== 'canvas' && `현재: ${getViewTitle()} 뷰`}
        </div>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-2">
        {pages.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            {currentView === 'canvas'
              ? '페이지가 없습니다.'
              : '콘텐츠가 없습니다. Chat에서 생성해주세요.'
            }
          </div>
        ) : (
          <div className="space-y-3">
            {pages.map((page, index) => (
              <div
                key={page.id}
                onClick={() => handleSelectPage(page.id)}
                className={`
                  group relative border-2 rounded-lg overflow-hidden cursor-pointer
                  transition-all duration-200
                  ${selectedPageId === page.id
                    ? 'border-purple-500 ring-2 ring-purple-200'
                    : 'border-gray-200 hover:border-purple-300'}
                `}
              >
                {/* 컨셉 타입: 실제 Polotno 썸네일 또는 비주얼 프리뷰 카드 */}
                {page.type === 'concept' && page.data && (
                  <div className="relative">
                    {/* 썸네일 이미지 영역 */}
                    {page.polotnoPage?.custom?.thumbnailDataUrl ? (
                      // ✅ Polotno 썸네일이 있으면 실제 이미지 표시
                      <div className="aspect-[16/9] bg-gray-100">
                        <img
                          src={page.polotnoPage.custom.thumbnailDataUrl}
                          alt={page.subtitle}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      // ❌ 썸네일이 없으면 그라디언트 카드 (fallback)
                      <div
                        className="aspect-[4/3] p-3 flex flex-col justify-between"
                        style={{
                          background: `linear-gradient(135deg, ${index === 0 ? '#8B5CF6, #6366F1' :
                            index === 1 ? '#EC4899, #F472B6' :
                              '#F59E0B, #FBBF24'
                            })`
                        }}
                      >
                        {/* 헤드라인 */}
                        <div>
                          <p className="text-white text-xs font-bold line-clamp-2 drop-shadow-sm">
                            {page.data.key_message || page.subtitle}
                          </p>
                          {page.data.concept_description && (
                            <p className="text-white/80 text-[10px] mt-1 line-clamp-2">
                              {page.data.concept_description}
                            </p>
                          )}
                        </div>

                        {/* 타겟 오디언스 미리보기 */}
                        {page.data.target_audience && (
                          <div className="mt-2">
                            <span className="inline-block px-2 py-0.5 bg-white/90 text-gray-800 text-[9px] font-medium rounded">
                              👥 {page.data.target_audience}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 하단 정보 */}
                    <div className="p-2 bg-white">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-purple-500' :
                          index === 1 ? 'bg-pink-500' :
                            'bg-amber-500'
                          }`} />
                        <span className="text-xs font-medium text-gray-700">
                          {page.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                        {page.subtitle}
                      </p>
                    </div>

                    {/* 선택 표시 */}
                    {selectedPageId === page.id && (
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-purple-600 text-white text-[10px] font-medium rounded shadow">
                        선택됨
                      </div>
                    )}
                  </div>
                )}

                {/* 슬라이드 타입: 슬라이드 프리뷰 */}
                {page.type === 'slide' && page.data && (
                  <div className="relative">
                    <div
                      className="aspect-[16/9] p-3 flex flex-col justify-center items-center"
                      style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
                    >
                      <p className="text-white text-xs font-bold text-center line-clamp-2">
                        {page.data.title || page.subtitle}
                      </p>
                      {page.data.content && (
                        <p className="text-white/70 text-[9px] mt-1 text-center line-clamp-2">
                          {page.data.content}
                        </p>
                      )}
                    </div>
                    <div className="p-2 bg-white">
                      <span className="text-xs font-medium text-gray-700">{page.title}</span>
                    </div>
                    {selectedPageId === page.id && (
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-medium rounded">
                        선택됨
                      </div>
                    )}
                  </div>
                )}

                {/* 인스타그램 타입: 정사각형 프리뷰 */}
                {page.type === 'instagram' && page.data && (
                  <div className="relative">
                    <div
                      className="aspect-square p-3 flex flex-col justify-end"
                      style={{ background: 'linear-gradient(135deg, #E11D48, #F472B6)' }}
                    >
                      <p className="text-white text-xs font-bold line-clamp-2">
                        {page.data.creative?.headline || page.subtitle}
                      </p>
                      {page.data.creative?.cta_text && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-white text-pink-600 text-[9px] font-medium rounded w-fit">
                          {page.data.creative.cta_text}
                        </span>
                      )}
                    </div>
                    <div className="p-2 bg-white">
                      <span className="text-xs font-medium text-gray-700">{page.title}</span>
                    </div>
                    {selectedPageId === page.id && (
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-pink-600 text-white text-[10px] font-medium rounded">
                        선택됨
                      </div>
                    )}
                  </div>
                )}

                {/* 쇼츠 타입: 세로형 프리뷰 */}
                {page.type === 'shorts_scene' && page.data && (
                  <div className="relative">
                    <div
                      className="aspect-[9/16] max-h-32 p-2 flex flex-col justify-between"
                      style={{ background: 'linear-gradient(135deg, #F97316, #FBBF24)' }}
                    >
                      <span className="text-white/80 text-[9px]">
                        {page.data.duration}
                      </span>
                      <p className="text-white text-[10px] line-clamp-3">
                        {page.data.narration}
                      </p>
                    </div>
                    <div className="p-2 bg-white">
                      <span className="text-xs font-medium text-gray-700">{page.title}</span>
                    </div>
                    {selectedPageId === page.id && (
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-orange-600 text-white text-[10px] font-medium rounded">
                        선택됨
                      </div>
                    )}
                  </div>
                )}

                {/* 상세페이지 섹션 */}
                {page.type === 'detail_section' && page.data && (
                  <div className="relative">
                    <div
                      className="aspect-[3/2] p-3 flex flex-col justify-center"
                      style={{ background: 'linear-gradient(135deg, #10B981, #34D399)' }}
                    >
                      <p className="text-white text-xs font-bold text-center">
                        {page.data.section_type}
                      </p>
                    </div>
                    <div className="p-2 bg-white">
                      <span className="text-xs font-medium text-gray-700">{page.title}</span>
                    </div>
                    {selectedPageId === page.id && (
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-green-600 text-white text-[10px] font-medium rounded">
                        선택됨
                      </div>
                    )}
                  </div>
                )}

                {/* Polotno 캔버스 페이지: 실제 썸네일 표시 */}
                {page.type === 'polotno' && (
                  <div
                    className="relative"
                    draggable={currentView === 'canvas'}
                    onDragStart={(e) => handleDragStart(page.id, e)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(page.id, e)}
                    onDragEnd={handleDragEnd}
                    style={{
                      opacity: draggedPageId === page.id ? 0.5 : 1,
                      cursor: currentView === 'canvas' ? 'move' : 'pointer',
                    }}
                  >
                    {/* 썸네일 이미지 영역 */}
                    <div className="bg-gray-100 flex items-center justify-center overflow-hidden relative" style={{ aspectRatio: page.width && page.height ? `${page.width}/${page.height}` : 'auto' }}>
                      {loadingThumbnails.has(page.id) ? (
                        // 로딩 중
                        <div className="flex flex-col items-center gap-2 text-gray-400 p-4">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="text-[10px]">생성 중...</span>
                        </div>
                      ) : (thumbnails[page.id] || page.thumbnailUrl) ? (
                        // 실제 썸네일 이미지 (state 또는 custom 속성)
                        <img
                          src={thumbnails[page.id] || page.thumbnailUrl}
                          alt={page.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        // 플레이스홀더
                        <div className="flex flex-col items-center gap-2 text-gray-300 p-4">
                          <FileText className="w-8 h-8" />
                          <span className="text-[10px]">미리보기 없음</span>
                        </div>
                      )}
                    </div>

                    {/* 하단 정보 */}
                    <div className="p-2 bg-white border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">
                          {page.title}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {page.subtitle}
                        </span>
                      </div>
                    </div>

                    {/* 선택 표시 */}
                    {selectedPageId === page.id && (
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-medium rounded shadow">
                        현재
                      </div>
                    )}

                    {/* 호버 시 액션 버튼들 */}
                    <div className="absolute bottom-10 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDuplicatePage(page.id, e)}
                        className="p-1 bg-white/90 hover:bg-white rounded shadow-sm"
                        title="페이지 복제"
                      >
                        <Copy className="w-3 h-3 text-gray-600" />
                      </button>
                      {polotnoStore?.pages?.length > 1 && (
                        <button
                          onClick={(e) => handleDeletePage(page.id, e)}
                          className="p-1 bg-white/90 hover:bg-white rounded shadow-sm"
                          title="페이지 삭제"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          thumbnailGenerationRef.current = false;
                          generateAllThumbnails();
                        }}
                        className="p-1 bg-white/90 hover:bg-white rounded shadow-sm"
                        title="썸네일 새로고침"
                      >
                        <RefreshCw className="w-3 h-3 text-gray-600" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {pages.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            총 {pages.length}개 {getViewTitle()}
          </div>
        </div>
      )}
    </div>
  );
}
