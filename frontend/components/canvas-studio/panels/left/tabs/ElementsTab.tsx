'use client';

import { useCanvasStore } from '../../../stores/useCanvasStore';
import { Square, Circle, Triangle, Star } from 'lucide-react';

export function ElementsTab() {
  const polotnoStore = useCanvasStore((state) => state.polotnoStore);

  const addRectangle = () => {
    if (!polotnoStore) return;
    polotnoStore.activePage?.addElement({
      type: 'svg',
      x: 150,
      y: 150,
      width: 200,
      height: 150,
      src: '<svg width="200" height="150"><rect width="200" height="150" fill="#4F46E5"/></svg>',
    });
  };

  const addCircle = () => {
    if (!polotnoStore) return;
    polotnoStore.activePage?.addElement({
      type: 'svg',
      x: 200,
      y: 200,
      width: 150,
      height: 150,
      src: '<svg width="150" height="150"><circle cx="75" cy="75" r="75" fill="#10B981"/></svg>',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Elements</h2>
        <p className="text-xs text-gray-500 mt-1">Add shapes and graphics</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={addRectangle}
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <Square className="w-8 h-8 text-indigo-600 mb-2" />
            <span className="text-xs font-medium">Rectangle</span>
          </button>
          <button
            onClick={addCircle}
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <Circle className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-xs font-medium">Circle</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors opacity-50 cursor-not-allowed">
            <Triangle className="w-8 h-8 text-yellow-600 mb-2" />
            <span className="text-xs font-medium">Triangle</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors opacity-50 cursor-not-allowed">
            <Star className="w-8 h-8 text-pink-600 mb-2" />
            <span className="text-xs font-medium">Star</span>
          </button>
        </div>
      </div>
    </div>
  );
}
