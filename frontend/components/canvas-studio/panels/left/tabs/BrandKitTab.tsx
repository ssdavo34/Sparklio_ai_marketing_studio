'use client';

import { Palette, Type, Image } from 'lucide-react';

export function BrandKitTab() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Brand Kit</h2>
        <p className="text-xs text-gray-500 mt-1">Your brand assets</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Colors */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-700">Brand Colors</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {['#4F46E5', '#10B981', '#EAB308', '#EC4899'].map((color) => (
              <div
                key={color}
                className="aspect-square rounded-lg border border-gray-200 cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Click to add to canvas</p>
        </div>

        {/* Fonts */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Type className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-700">Brand Fonts</h3>
          </div>
          <div className="text-xs text-gray-400">
            <p>Coming in future updates</p>
          </div>
        </div>

        {/* Logos */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Image className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-700">Logos</h3>
          </div>
          <div className="text-xs text-gray-400">
            <p>Coming in future updates</p>
          </div>
        </div>
      </div>
    </div>
  );
}
