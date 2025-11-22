'use client';

import { useCanvasStore } from '../../../stores/useCanvasStore';
import { Square, Circle, Triangle, Star } from 'lucide-react';

export function ElementsTab() {
  const polotnoStore = useCanvasStore((state) => state.polotnoStore);

  const addRectangle = () => {
    if (!polotnoStore) return;
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect width="200" height="150" fill="#4F46E5"/></svg>';
    const dataUri = 'data:image/svg+xml;base64,' + btoa(svg);
    polotnoStore.activePage?.addElement({
      type: 'svg',
      name: 'Rectangle',
      x: 150,
      y: 150,
      width: 200,
      height: 150,
      src: dataUri,
    });
  };

  const addCircle = () => {
    if (!polotnoStore) return;
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><circle cx="75" cy="75" r="75" fill="#10B981"/></svg>';
    const dataUri = 'data:image/svg+xml;base64,' + btoa(svg);
    polotnoStore.activePage?.addElement({
      type: 'svg',
      name: 'Circle',
      x: 200,
      y: 200,
      width: 150,
      height: 150,
      src: dataUri,
    });
  };

  const addTriangle = () => {
    if (!polotnoStore) return;
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><polygon points="75,15 135,135 15,135" fill="#EAB308"/></svg>';
    const dataUri = 'data:image/svg+xml;base64,' + btoa(svg);
    polotnoStore.activePage?.addElement({
      type: 'svg',
      name: 'Triangle',
      x: 250,
      y: 250,
      width: 150,
      height: 150,
      src: dataUri,
    });
  };

  const addStar = () => {
    if (!polotnoStore) return;
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><polygon points="75,10 90,55 135,55 100,85 115,130 75,105 35,130 50,85 15,55 60,55" fill="#EC4899"/></svg>';
    const dataUri = 'data:image/svg+xml;base64,' + btoa(svg);
    polotnoStore.activePage?.addElement({
      type: 'svg',
      name: 'Star',
      x: 300,
      y: 300,
      width: 150,
      height: 150,
      src: dataUri,
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
          <button
            onClick={addTriangle}
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <Triangle className="w-8 h-8 text-yellow-600 mb-2" />
            <span className="text-xs font-medium">Triangle</span>
          </button>
          <button
            onClick={addStar}
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <Star className="w-8 h-8 text-pink-600 mb-2" />
            <span className="text-xs font-medium">Star</span>
          </button>
        </div>
      </div>
    </div>
  );
}
