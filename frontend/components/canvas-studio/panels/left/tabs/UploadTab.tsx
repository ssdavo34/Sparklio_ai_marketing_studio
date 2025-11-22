'use client';

import { Upload } from 'lucide-react';

export function UploadTab() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Upload</h2>
        <p className="text-xs text-gray-500 mt-1">Upload your images</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 hover:bg-purple-50 transition-colors cursor-pointer">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">Click to upload</p>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG up to 10MB</p>
        </div>

        <div className="mt-4 text-xs text-gray-400">
          <p>Uploaded images will appear here...</p>
        </div>
      </div>
    </div>
  );
}
