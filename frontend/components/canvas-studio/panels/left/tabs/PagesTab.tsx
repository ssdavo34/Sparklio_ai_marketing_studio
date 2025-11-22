'use client';

import { useCanvasStore } from '../../../stores/useCanvasStore';
import { Plus, Copy, Trash2 } from 'lucide-react';

export function PagesTab() {
  const polotnoStore = useCanvasStore((state) => state.polotnoStore);
  const pages = polotnoStore?.pages || [];
  const activePage = polotnoStore?.activePage;

  const handleAddPage = () => {
    if (!polotnoStore) return;
    polotnoStore.addPage();
  };

  const handleSelectPage = (page: any) => {
    if (!polotnoStore) return;
    polotnoStore.selectPage(page.id);
  };

  const handleDuplicatePage = (page: any) => {
    if (!polotnoStore) return;
    const index = pages.indexOf(page);
    polotnoStore.addPage({ ...page }, index + 1);
  };

  const handleDeletePage = (page: any) => {
    if (!polotnoStore) return;
    if (pages.length === 1) {
      alert('Cannot delete the last page');
      return;
    }
    polotnoStore.deletePage(page.id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Pages</h2>
          <button
            onClick={handleAddPage}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Add new page"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-2">
        {pages.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No pages yet. Click + to add a page.
          </div>
        ) : (
          <div className="space-y-2">
            {pages.map((page: any, index: number) => (
              <div
                key={page.id}
                onClick={() => handleSelectPage(page)}
                className={`
                  group relative border rounded-lg overflow-hidden cursor-pointer
                  transition-all duration-200
                  ${activePage?.id === page.id
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }
                `}
              >
                {/* Page Thumbnail */}
                <div className="aspect-video bg-white relative">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <span className="text-xs">Page {index + 1}</span>
                  </div>
                </div>

                {/* Page Info */}
                <div className="p-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">
                    Page {index + 1}
                  </span>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicatePage(page);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Duplicate page"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(page);
                      }}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                      title="Delete page"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
