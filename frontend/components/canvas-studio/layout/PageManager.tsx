/**
 * Page Manager Component
 *
 * 다중 페이지 관리 UI
 * - 페이지 추가/삭제/복제
 * - 페이지 미리보기
 * - 드래그&드롭 순서 변경 (향후 구현)
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 */

'use client';

import { useState, useEffect } from 'react';
import { useCanvasStore } from '../stores/useCanvasStore';
import { Plus, Copy, Trash2, File } from 'lucide-react';

export function PageManager() {
  const polotnoStore = useCanvasStore((state) => state.polotnoStore);
  const currentTemplate = useCanvasStore((state) => state.currentTemplate);
  const currentTheme = useCanvasStore((state) => state.currentTheme);
  const applyThemeToCanvas = useCanvasStore((state) => state.applyThemeToCanvas);
  const [pages, setPages] = useState<any[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);

  // Update pages list when polotno store changes
  useEffect(() => {
    if (!polotnoStore) return;

    const updatePages = () => {
      try {
        setPages([...polotnoStore.pages]);
        setActivePageId(polotnoStore.activePage?.id || null);
      } catch (error) {
        console.error('[PageManager] Error updating pages:', error);
      }
    };

    // Initial update
    updatePages();

    // Listen to page changes
    try {
      const unsubscribe = polotnoStore.on('change', updatePages);
      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (error) {
      console.error('[PageManager] Error setting up listener:', error);
    }
  }, [polotnoStore]);

  // Add new page
  const handleAddPage = () => {
    if (!polotnoStore) return;

    polotnoStore.addPage({
      width: currentTemplate.width,
      height: currentTemplate.height,
    });

    // Apply current theme to new page
    setTimeout(() => {
      applyThemeToCanvas(currentTheme);
    }, 100);
  };

  // Duplicate page
  const handleDuplicatePage = (pageId: string) => {
    if (!polotnoStore) return;

    const page = polotnoStore.pages.find((p: any) => p.id === pageId);
    if (!page) return;

    // Create new page with same size
    polotnoStore.addPage({
      width: page.width,
      height: page.height,
    });

    // Copy all elements from original page
    const newPage = polotnoStore.pages[polotnoStore.pages.length - 1];
    page.children.forEach((element: any) => {
      newPage.addElement(element.toJSON());
    });
  };

  // Delete page
  const handleDeletePage = (pageId: string) => {
    if (!polotnoStore || polotnoStore.pages.length <= 1) {
      alert('최소 1개의 페이지가 필요합니다.');
      return;
    }

    const page = polotnoStore.pages.find((p: any) => p.id === pageId);
    if (page) {
      page.remove();
    }
  };

  // Select page
  const handleSelectPage = (pageId: string) => {
    if (!polotnoStore) return;

    const page = polotnoStore.pages.find((p: any) => p.id === pageId);
    if (page) {
      polotnoStore.selectPage(page.id);
    }
  };

  if (!polotnoStore) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">페이지</h3>
        <button
          onClick={handleAddPage}
          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
          title="새 페이지 추가"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {pages.map((page, index) => (
          <div
            key={page.id}
            onClick={() => handleSelectPage(page.id)}
            className={`group relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
              activePageId === page.id
                ? 'border-indigo-500 ring-2 ring-indigo-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Page Preview */}
            <div className="aspect-square bg-gray-50 flex items-center justify-center p-2">
              <div
                className="w-full h-full bg-white border border-gray-200 rounded flex items-center justify-center"
                style={{
                  aspectRatio: `${page.width} / ${page.height}`,
                }}
              >
                <File className="w-8 h-8 text-gray-300" />
              </div>
            </div>

            {/* Page Info */}
            <div className="p-2 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                  페이지 {index + 1}
                </span>
                <span className="text-xs text-gray-500">
                  {page.width} × {page.height}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicatePage(page.id);
                }}
                className="p-1 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 transition-colors"
                title="페이지 복제"
              >
                <Copy className="w-3 h-3 text-gray-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePage(page.id);
                }}
                className="p-1 bg-white border border-gray-200 rounded shadow-sm hover:bg-red-50 transition-colors"
                title="페이지 삭제"
                disabled={pages.length <= 1}
              >
                <Trash2
                  className={`w-3 h-3 ${pages.length <= 1 ? 'text-gray-300' : 'text-red-600'}`}
                />
              </button>
            </div>

            {/* Active Indicator */}
            {activePageId === page.id && (
              <div className="absolute top-1 left-1 px-2 py-0.5 bg-indigo-600 text-white text-xs font-medium rounded">
                현재
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          총 {pages.length}개 페이지
        </div>
      </div>
    </div>
  );
}
