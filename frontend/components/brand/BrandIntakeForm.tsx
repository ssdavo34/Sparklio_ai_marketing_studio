/**
 * Brand Intake Form
 *
 * 브랜드 정보 수집 폼 (URL, 파일, 텍스트)
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 2.1
 */

'use client';

import { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, FileText, Loader2, X, CheckCircle } from 'lucide-react';
import type { BrandIntakeSource } from '@/types/brand';

// ============================================================================
// Types
// ============================================================================

export interface BrandIntakeFormProps {
  /** 분석 시작 핸들러 */
  onAnalyze: (data: BrandIntakeFormData) => Promise<void>;

  /** 로딩 상태 */
  isLoading?: boolean;

  /** 클래스명 (선택) */
  className?: string;
}

export interface BrandIntakeFormData {
  source: BrandIntakeSource;
  url?: string;
  text?: string;
  files?: File[];
}

// ============================================================================
// Component
// ============================================================================

export function BrandIntakeForm({ onAnalyze, isLoading = false, className = '' }: BrandIntakeFormProps) {
  const [activeTab, setActiveTab] = useState<BrandIntakeSource>('url');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==================== 파일 업로드 핸들러 ====================

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadedFiles((prev) => [...prev, ...files]);
      // 진행률 시뮬레이션 (실제로는 서버 업로드 시 사용)
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadedFiles((prev) => [...prev, ...files]);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ==================== 분석 시작 핸들러 ====================

  const handleSubmit = async () => {
    const data: BrandIntakeFormData = { source: activeTab };

    if (activeTab === 'url') {
      if (!urlInput.trim()) {
        alert('URL을 입력해주세요.');
        return;
      }
      data.url = urlInput.trim();
    } else if (activeTab === 'text') {
      if (!textInput.trim()) {
        alert('브랜드 정보를 입력해주세요.');
        return;
      }
      data.text = textInput.trim();
    } else if (activeTab === 'file') {
      if (uploadedFiles.length === 0) {
        alert('파일을 업로드해주세요.');
        return;
      }
      data.files = uploadedFiles;
    }

    await onAnalyze(data);
  };

  // ==================== 렌더링 ====================

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">브랜드 정보 입력</h2>
        <p className="text-sm text-gray-500 mt-1">
          브랜드를 분석할 정보를 입력해주세요. URL, 파일, 또는 직접 입력이 가능합니다.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'url'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <LinkIcon className="w-4 h-4 inline mr-2" />
            URL 입력
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'file'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            파일 업로드
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'text'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            직접 입력
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* URL Tab */}
        {activeTab === 'url' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                브랜드 웹사이트 URL
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-2">
                회사 홈페이지, 제품 페이지, 또는 소개 자료 URL을 입력하세요.
              </p>
            </div>
          </div>
        )}

        {/* File Tab */}
        {activeTab === 'file' && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
            >
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                파일을 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-xs text-gray-500">
                PDF, 이미지, 문서 파일 지원 (최대 100MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,image/*,.doc,.docx,.ppt,.pptx"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isLoading}
              />
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && (
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-900">업로드 중...</span>
                  <span className="text-sm text-purple-700">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  업로드된 파일 ({uploadedFiles.length}개)
                </p>
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Text Tab */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                브랜드 정보
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="브랜드 소개, 비전, 가치, 타겟 고객 등 브랜드와 관련된 정보를 자유롭게 입력하세요..."
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-2">
                브랜드 가이드라인, 미션 & 비전, 고객 타겟팅 정보 등을 입력하세요.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              분석 중...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Brand DNA 분석 시작
            </>
          )}
        </button>
      </div>
    </div>
  );
}
