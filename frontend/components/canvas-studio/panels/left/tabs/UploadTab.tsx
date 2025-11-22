'use client';

import { Upload } from 'lucide-react';

export function UploadTab() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Upload</h2>
        <p className="text-xs text-gray-500 mt-1">Upload images and videos</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Upload className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">Upload functionality</p>
          <p className="text-xs text-gray-400 mt-1">Coming in Block 7</p>
        </div>
      </div>
    </div>
  );
}
