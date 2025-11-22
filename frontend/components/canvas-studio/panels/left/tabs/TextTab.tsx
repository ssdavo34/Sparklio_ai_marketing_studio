'use client';

import { useCanvasStore } from '../../../stores/useCanvasStore';
import { Type } from 'lucide-react';

export function TextTab() {
  const polotnoStore = useCanvasStore((state) => state.polotnoStore);

  const addText = () => {
    if (!polotnoStore) return;
    polotnoStore.activePage?.addElement({
      type: 'text',
      name: 'Text',
      x: 100,
      y: 100,
      text: 'Text',
      fontSize: 32,
      fill: '#000000',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Text</h2>
        <p className="text-xs text-gray-500 mt-1">Add text to your design</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <button
          onClick={addText}
          className="w-full flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
        >
          <Type className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-medium">Add a text box</span>
        </button>

        <div className="mt-4 text-xs text-gray-400">
          <p>More text templates coming soon...</p>
        </div>
      </div>
    </div>
  );
}
