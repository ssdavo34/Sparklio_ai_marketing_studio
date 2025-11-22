'use client';

import { Search, Image } from 'lucide-react';

export function PhotosTab() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Photos</h2>
        <p className="text-xs text-gray-500 mt-1">Search stock photos</p>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search photos..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
            disabled
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-center py-12">
          <Image className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
          <p className="text-sm text-gray-500">Stock photos</p>
          <p className="text-xs text-gray-400 mt-1">Coming in future updates</p>
        </div>
      </div>
    </div>
  );
}
