/**
 * Asset Uploader
 *
 * 에셋 업로드 컴포넌트
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 6.1
 */

'use client';

import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, FileText, Image as ImageIcon, Film } from 'lucide-react';
import type { AssetType } from '@/types/asset';

// ============================================================================
// Types
// ============================================================================

export interface AssetUploaderProps {
  /** 업로드 핸들러 */
  onUpload: (files: File[], metadata: AssetMetadata[]) => Promise<void>;

  /** 허용 파일 타입 (선택) */
  acceptedTypes?: AssetType[];

  /** 최대 파일 크기 (MB) */
  maxSizeMB?: number;

  /** 클래스명 (선택) */
  className?: string;

  /** 비활성화 여부 */
  disabled?: boolean;
}

export interface AssetMetadata {
  file: File;
  name: string;
  tags: string[];
  description?: string;
}

interface UploadingFile {
  file: File;
  name: string;
  tags: string[];
  description: string;
  progress: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getFileIcon(file: File) {
  if (file.type.startsWith('image/')) return ImageIcon;
  if (file.type.startsWith('video/')) return Film;
  return FileText;
}

function getAssetType(file: File): AssetType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type === 'application/pdf') return 'document';
  return 'other';
}

// ============================================================================
// Component
// ============================================================================

export function AssetUploader({
  onUpload,
  acceptedTypes = ['image', 'video', 'document', 'other'],
  maxSizeMB = 100,
  className = '',
  disabled = false,
}: AssetUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [currentTagInput, setCurrentTagInput] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==================== File Selection ====================

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const addFiles = (files: File[]) => {
    if (disabled) return;

    // 파일 크기 검증
    const validFiles = files.filter((file) => {
      const sizeMB = file.size / 1024 / 1024;
      if (sizeMB > maxSizeMB) {
        alert(`${file.name}은(는) 최대 크기(${maxSizeMB}MB)를 초과합니다.`);
        return false;
      }
      return true;
    });

    // 타입 검증
    const filteredFiles = validFiles.filter((file) => {
      const type = getAssetType(file);
      if (!acceptedTypes.includes(type)) {
        alert(`${file.name}은(는) 허용되지 않는 파일 형식입니다.`);
        return false;
      }
      return true;
    });

    const newFiles: UploadingFile[] = filteredFiles.map((file) => ({
      file,
      name: file.name,
      tags: [],
      description: '',
      progress: 0,
    }));

    setUploadingFiles((prev) => [...prev, ...newFiles]);
  };

  // ==================== Metadata Update ====================

  const updateFileName = (index: number, name: string) => {
    setUploadingFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, name } : f))
    );
  };

  const updateDescription = (index: number, description: string) => {
    setUploadingFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, description } : f))
    );
  };

  const addTag = (index: number) => {
    const tag = currentTagInput[index]?.trim();
    if (!tag) return;

    setUploadingFiles((prev) =>
      prev.map((f, i) =>
        i === index && !f.tags.includes(tag)
          ? { ...f, tags: [...f.tags, tag] }
          : f
      )
    );

    setCurrentTagInput((prev) => ({ ...prev, [index]: '' }));
  };

  const removeTag = (fileIndex: number, tagIndex: number) => {
    setUploadingFiles((prev) =>
      prev.map((f, i) =>
        i === fileIndex
          ? { ...f, tags: f.tags.filter((_, ti) => ti !== tagIndex) }
          : f
      )
    );
  };

  const removeFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ==================== Upload ====================

  const handleUpload = async () => {
    if (uploadingFiles.length === 0) {
      alert('업로드할 파일을 선택해주세요.');
      return;
    }

    const files = uploadingFiles.map((uf) => uf.file);
    const metadata: AssetMetadata[] = uploadingFiles.map((uf) => ({
      file: uf.file,
      name: uf.name,
      tags: uf.tags,
      description: uf.description || undefined,
    }));

    await onUpload(files, metadata);
    setUploadingFiles([]);
    setCurrentTagInput({});

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ==================== Rendering ====================

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">에셋 업로드</h2>
        <p className="text-sm text-gray-500 mt-1">
          이미지, 영상, 문서 파일을 업로드하세요 (최대 {maxSizeMB}MB)
        </p>
      </div>

      {/* Drop Zone */}
      <div className="p-6">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            disabled
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-purple-500 cursor-pointer'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            파일을 드래그하거나 클릭하여 업로드
          </p>
          <p className="text-xs text-gray-500">
            이미지, 영상, PDF 등 다양한 파일 형식 지원
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
        </div>

        {/* File List */}
        {uploadingFiles.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              업로드 대기 중 ({uploadingFiles.length}개)
            </h3>

            {uploadingFiles.map((uploadingFile, index) => {
              const Icon = getFileIcon(uploadingFile.file);

              return (
                <div
                  key={index}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  {/* File Info */}
                  <div className="flex items-start gap-3 mb-3">
                    <Icon className="w-8 h-8 text-purple-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={uploadingFile.name}
                        onChange={(e) => updateFileName(index, e.target.value)}
                        className="w-full px-3 py-1 text-sm font-medium border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 mb-1"
                        disabled={disabled}
                      />
                      <p className="text-xs text-gray-500">
                        {(uploadingFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                      disabled={disabled}
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  {/* Description */}
                  <textarea
                    value={uploadingFile.description}
                    onChange={(e) => updateDescription(index, e.target.value)}
                    placeholder="파일 설명 (선택)"
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none mb-2"
                    disabled={disabled}
                  />

                  {/* Tags */}
                  <div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {uploadingFile.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(index, tagIndex)}
                            className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                            disabled={disabled}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentTagInput[index] || ''}
                        onChange={(e) =>
                          setCurrentTagInput((prev) => ({
                            ...prev,
                            [index]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && addTag(index)}
                        placeholder="태그 입력 후 Enter"
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={disabled}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {uploadingFiles.length > 0 && (
        <div className="p-6 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            onClick={handleUpload}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-5 h-5" />
            {uploadingFiles.length}개 파일 업로드
          </button>
        </div>
      )}
    </div>
  );
}
