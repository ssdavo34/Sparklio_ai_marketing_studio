/**
 * Collapsible Pages Panel
 *
 * 접이식 페이지 프리뷰 패널
 * - 다중 페이지 썸네일 프리뷰
 * - 페이지 선택/추가/삭제/복제
 * - 드래그앤드롭으로 순서 변경
 * - 멀티 캔버스 지원 (v4.1): activeCanvasType에 따라 해당 캔버스 페이지 표시
 *
 * @author C Team (Frontend Team)
 * @version 4.1 (2025-12-02 멀티캔버스 연동)
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, ChevronUp, Plus, Copy, Trash2, RefreshCw, Loader2, FileText, Layers } from 'lucide-react';
import { useCanvasStore } from '../../stores/useCanvasStore';
import { getCanvasStore } from '../../polotno/polotnoStoreSingleton';
import { CANVAS_CONFIGS } from '../../stores/types';

interface CollapsiblePagesPanelProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface PageItem {
  id: string;
  title: string;
  subtitle?: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

export function CollapsiblePagesPanel({ isCollapsed = false, onToggleCollapse }: CollapsiblePagesPanelProps) {
  // 멀티 캔버스 지원: activeCanvasType에 따라 해당 캔버스 사용
  const activeCanvasType = useCanvasStore((state) => state.activeCanvasType);
  const zustandPolotnoStore = useCanvasStore((state) => state.canvases.get(state.activeCanvasType) || null);
  const currentTemplate = useCanvasStore((state) => state.currentTemplate);
  const currentTheme = useCanvasStore((state) => state.currentTheme);
  const applyThemeToCanvas = useCanvasStore((state) => state.applyThemeToCanvas);

  // 현재 활성 캔버스 타입의 Store 가져오기
  const polotnoStore = getCanvasStore(activeCanvasType) || zustandPolotnoStore;
  const canvasConfig = CANVAS_CONFIGS[activeCanvasType];

  const [pages, setPages] = useState<PageItem[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loadingThumbnails, setLoadingThumbnails] = useState<Set<string>>(new Set());
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const thumbnailGenerationRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 썸네일 생성
  const generateThumbnail = useCallback(async (page: any): Promise<string | null> => {
    if (!page || !page.toDataURL) return null;

    try {
      const dataURL = await page.toDataURL({
        mimeType: 'image/jpeg',
        pixelRatio: 0.2,
      });
      return dataURL;
    } catch (error) {
      console.warn('[CollapsiblePagesPanel] Failed to generate thumbnail:', error);
      return null;
    }
  }, []);

  // 모든 썸네일 생성
  const generateAllThumbnails = useCallback(async () => {
    if (thumbnailGenerationRef.current) return;

    const store = getCanvasStore(activeCanvasType) || zustandPolotnoStore;
    if (!store?.pages?.length) return;

    thumbnailGenerationRef.current = true;
    const newThumbnails: Record<string, string> = {};
    const pageIds = store.pages.map((p: any) => p.id);

    setLoadingThumbnails(new Set(pageIds));

    for (const page of store.pages) {
      const thumbnail = await generateThumbnail(page);
      if (thumbnail) {
        newThumbnails[page.id] = thumbnail;
      }
    }

    setThumbnails((prev) => ({ ...prev, ...newThumbnails }));
    setLoadingThumbnails(new Set());
    thumbnailGenerationRef.current = false;
  }, [activeCanvasType, zustandPolotnoStore, generateThumbnail]);

  // 페이지 목록 업데이트 - activeCanvasType 변경 시 새로운 캔버스의 페이지로 갱신
  useEffect(() => {
    const store = getCanvasStore(activeCanvasType) || zustandPolotnoStore;
    if (!store) return;

    console.log(`[CollapsiblePagesPanel] Canvas type changed to: ${activeCanvasType}`);

    // 캔버스 타입 변경 시 썸네일 초기화
    setThumbnails({});
    setLoadingThumbnails(new Set());
    thumbnailGenerationRef.current = false;

    const updatePages = () => {
      const newPages: PageItem[] =
        store.pages?.map((page: any, idx: number) => ({
          id: page.id,
          title: `페이지 ${idx + 1}`,
          subtitle: `${page.width} × ${page.height}`,
          width: page.width,
          height: page.height,
          thumbnailUrl: page.custom?.thumbnailDataUrl,
        })) || [];

      setPages(newPages);
      setSelectedPageId(store.activePage?.id || newPages[0]?.id || null);
    };

    updatePages();

    // 초기 썸네일 생성
    const initialTimeout = setTimeout(() => {
      generateAllThumbnails();
    }, 800);

    // 변경 감지
    const handleChange = () => {
      updatePages();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        thumbnailGenerationRef.current = false;
        generateAllThumbnails();
      }, 1500);
    };

    const unsubscribe = store.on?.('change', handleChange);

    return () => {
      clearTimeout(initialTimeout);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (unsubscribe) unsubscribe();
    };
  }, [activeCanvasType, zustandPolotnoStore, generateAllThumbnails]);

  // 페이지 선택
  const handleSelectPage = (pageId: string) => {
    setSelectedPageId(pageId);
    if (polotnoStore) {
      polotnoStore.selectPage(pageId);
    }
  };

  // 페이지 추가 - 현재 캔버스 타입의 크기로 추가
  const handleAddPage = () => {
    if (!polotnoStore) return;

    // 현재 캔버스 타입의 기본 크기 사용
    polotnoStore.addPage({
      width: canvasConfig?.width || currentTemplate.width,
      height: canvasConfig?.height || currentTemplate.height,
    });

    setTimeout(() => {
      applyThemeToCanvas(currentTheme);
    }, 100);
  };

  // 페이지 복제
  const handleDuplicatePage = (pageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!polotnoStore) return;

    const page = polotnoStore.pages.find((p: any) => p.id === pageId);
    if (!page) return;

    const pageData = page.toJSON();
    polotnoStore.addPage(pageData);
  };

  // 페이지 삭제
  const handleDeletePage = (pageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!polotnoStore) return;

    if (polotnoStore.pages.length <= 1) {
      return; // 마지막 페이지는 삭제 불가
    }

    const page = polotnoStore.pages.find((p: any) => p.id === pageId);
    if (page) {
      polotnoStore.deletePages([page.id]);
    }
  };

  // 드래그 앤 드롭
  const handleDragStart = (pageId: string, event: React.DragEvent) => {
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
    if (!polotnoStore || !draggedPageId) return;

    const draggedPage = polotnoStore.pages.find((p: any) => p.id === draggedPageId);
    const targetPage = polotnoStore.pages.find((p: any) => p.id === targetPageId);

    if (draggedPage && targetPage && draggedPage !== targetPage) {
      // TODO: Polotno에서 페이지 순서 변경 구현 필요
      // store.movePage()는 존재하지 않음 - 페이지 배열 재정렬 로직 필요
      console.log('[CollapsiblePagesPanel] Page reorder requested but not implemented');
    }

    setDraggedPageId(null);
  };

  const handleDragEnd = () => {
    setDraggedPageId(null);
  };

  // 새 레이아웃: 세로 리스트 (가로 탭 안에서 사용)
  // isCollapsed는 이제 사용하지 않음 (탭으로 전환)
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header - 현재 캔버스 타입 표시 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700">{pages.length}개 페이지</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded">
            {canvasConfig?.name || activeCanvasType}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              thumbnailGenerationRef.current = false;
              generateAllThumbnails();
            }}
            className="p-1 hover:bg-white/50 rounded transition-colors"
            title="썸네일 새로고침"
            disabled={loadingThumbnails.size > 0}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingThumbnails.size > 0 ? 'animate-spin text-gray-400' : 'text-gray-500'}`} />
          </button>
          <button
            onClick={handleAddPage}
            className="p-1 hover:bg-white/50 rounded transition-colors"
            title="페이지 추가"
          >
            <Plus className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Pages List - Vertical */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex flex-col gap-2">
          {pages.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              페이지가 없습니다
            </div>
          ) : (
            pages.map((page, index) => (
              <div
                key={page.id}
                onClick={() => handleSelectPage(page.id)}
                draggable
                onDragStart={(e) => handleDragStart(page.id, e)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(page.id, e)}
                onDragEnd={handleDragEnd}
                className={`
                  group relative cursor-pointer rounded-lg overflow-hidden transition-all
                  ${selectedPageId === page.id
                    ? 'ring-2 ring-indigo-500 ring-offset-1 bg-indigo-50'
                    : 'border border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}
                `}
                style={{
                  opacity: draggedPageId === page.id ? 0.5 : 1,
                }}
              >
                <div className="flex items-center gap-2 p-2">
                  {/* Thumbnail */}
                  <div
                    className="bg-gray-100 flex items-center justify-center overflow-hidden rounded flex-shrink-0"
                    style={{
                      width: '48px',
                      height: '48px',
                    }}
                  >
                    {loadingThumbnails.has(page.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : thumbnails[page.id] || page.thumbnailUrl ? (
                      <img
                        src={thumbnails[page.id] || page.thumbnailUrl}
                        alt={page.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="w-4 h-4 text-gray-300" />
                    )}
                  </div>

                  {/* Page Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800 truncate">
                      페이지 {index + 1}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {page.width} × {page.height}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDuplicatePage(page.id, e)}
                      className="p-1 hover:bg-white rounded"
                      title="복제"
                    >
                      <Copy className="w-3 h-3 text-gray-500" />
                    </button>
                    {pages.length > 1 && (
                      <button
                        onClick={(e) => handleDeletePage(page.id, e)}
                        className="p-1 hover:bg-white rounded"
                        title="삭제"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default CollapsiblePagesPanel;
