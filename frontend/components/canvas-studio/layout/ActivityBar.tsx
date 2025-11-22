/**
 * Activity Bar
 *
 * Element creation toolbar
 * - Width: 56px (fixed)
 * - Background: Dark
 * - Add text, shapes, images to canvas
 *
 * @author C Team (Frontend Team)
 * @version 3.1
 */

'use client';

import { useCanvasStore } from '../stores/useCanvasStore';
import { Type, Square, Circle, Image } from 'lucide-react';

export function ActivityBar() {
  const polotnoStore = useCanvasStore((state) => state.polotnoStore);

  const addText = () => {
    if (!polotnoStore) return;
    polotnoStore.activePage?.addElement({
      type: 'text',
      x: 100,
      y: 100,
      text: 'Double click to edit',
      fontSize: 32,
      fill: '#000000',
    });
  };

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

  const addImage = () => {
    if (!polotnoStore) return;
    polotnoStore.activePage?.addElement({
      type: 'image',
      x: 50,
      y: 50,
      width: 300,
      height: 200,
      src: 'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Sample+Image',
    });
  };

  return (
    <nav className="flex w-14 flex-col border-r border-neutral-800 bg-neutral-950 text-neutral-100">
      {/* Add Text */}
      <button
        onClick={addText}
        className="flex h-12 items-center justify-center text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-100 border-l-2 border-transparent hover:border-blue-500"
        title="Add Text (T)"
      >
        <Type className="w-5 h-5" />
      </button>

      {/* Add Rectangle */}
      <button
        onClick={addRectangle}
        className="flex h-12 items-center justify-center text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-100 border-l-2 border-transparent hover:border-blue-500"
        title="Add Rectangle (R)"
      >
        <Square className="w-5 h-5" />
      </button>

      {/* Add Circle */}
      <button
        onClick={addCircle}
        className="flex h-12 items-center justify-center text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-100 border-l-2 border-transparent hover:border-blue-500"
        title="Add Circle (C)"
      >
        <Circle className="w-5 h-5" />
      </button>

      {/* Add Image */}
      <button
        onClick={addImage}
        className="flex h-12 items-center justify-center text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-100 border-l-2 border-transparent hover:border-blue-500"
        title="Add Image (I)"
      >
        <Image className="w-5 h-5" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />
    </nav>
  );
}

