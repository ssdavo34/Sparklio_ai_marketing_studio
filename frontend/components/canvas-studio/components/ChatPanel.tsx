/**
 * Chat Panel
 *
 * AI와 대화하여 콘텐츠를 생성하는 패널
 *
 * 기능:
 * - Kind 선택 (product_detail, sns, brand_kit)
 * - 프롬프트 입력
 * - Generate API 호출
 * - Canvas에 결과 반영
 * - AI 응답 자동 감지 및 렌더링 (ContentPlan, AdCopy 등)
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-11-23
 */

'use client';

import { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Paperclip, X, FileText, FileSpreadsheet, Image as ImageIcon, Video, Music } from 'lucide-react';
import type { GenerateKind } from '@/lib/api/types';
import { useGenerate } from '../hooks/useGenerate';
import { applyGenerateResponseToCanvas } from '../adapters/response-to-fabric';
import { useCanvas } from '../context';
import { AIResponseRenderer } from './AIResponseRenderer';

type UploadedFile = {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
};

export function ChatPanel() {
  const { fabricCanvas } = useCanvas();
  const { generate, isLoading, error, clearError } = useGenerate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [kind, setKind] = useState<GenerateKind>('product_detail');
  const [prompt, setPrompt] = useState('');
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // File Upload Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newFiles.push({
        id: `file-${Date.now()}-${i}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('pdf')) return FileText;
    if (type.includes('sheet') || type.includes('excel')) return FileSpreadsheet;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim() && uploadedFiles.length === 0) {
      alert('메시지를 입력하거나 파일을 업로드해주세요');
      return;
    }

    if (!fabricCanvas) {
      alert('Canvas가 초기화되지 않았습니다');
      return;
    }

    clearError();

    try {
      console.log('[ChatPanel] Generating:', { kind, prompt, files: uploadedFiles.length });

      // TODO: 파일이 있으면 multipart/form-data로 전송
      // 지금은 기존 방식으로만 처리
      const response = await generate(kind, prompt);

      console.log('[ChatPanel] Generate response:', response);

      // 응답 저장 (AIResponseRenderer에서 자동 감지)
      setLastResponse(response);

      // Canvas에 결과 반영 (기존 로직 유지)
      await applyGenerateResponseToCanvas(fabricCanvas, response);

      console.log('[ChatPanel] Canvas updated successfully');

      // 성공 시 초기화
      setPrompt('');
      setUploadedFiles([]);
    } catch (e: any) {
      console.error('[ChatPanel] Generation failed:', e);
      // error는 useGenerate에서 이미 설정되어 있음
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-neutral-200 p-4">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl">💬</span>
            <h3 className="ml-2 text-sm font-semibold text-neutral-800">
              Spark Chat
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            {isSettingsOpen ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>설정 접기</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>설정 펼치기</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-neutral-500">
          AI와 대화하여 콘텐츠를 생성하세요
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Settings Section (Collapsible) */}
          {isSettingsOpen && (
            <div className="space-y-4 pb-4 border-b border-neutral-200">
              {/* Kind 선택 */}
              <div>
                <label
                  htmlFor="kind"
                  className="mb-2 block text-xs font-medium text-neutral-700"
                >
                  콘텐츠 타입
                </label>
                <select
                  id="kind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as GenerateKind)}
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="product_detail">상품 상세</option>
                  <option value="sns">SNS 콘텐츠</option>
                  <option value="brand_kit">브랜드킷</option>
                  <option value="presentation">프레젠테이션</option>
                </select>
              </div>
            </div>
          )}

          {/* File Upload Area */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((file) => {
                const Icon = getFileIcon(file.type);
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 rounded border border-neutral-200 bg-neutral-50 p-2"
                  >
                    <Icon className="w-4 h-4 text-neutral-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-800 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="p-1 rounded hover:bg-neutral-200 transition-colors"
                    >
                      <X className="w-4 h-4 text-neutral-600" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 프롬프트 입력 */}
          <div>
            <label
              htmlFor="prompt"
              className="mb-2 block text-xs font-medium text-neutral-700"
            >
              무엇을 만들까요?
            </label>
            <div className="relative">
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="예: 고급 스킨케어 제품 상세 페이지를 만들어줘"
                className="w-full rounded border border-neutral-300 px-3 py-2 pr-12 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={4}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 p-2 rounded hover:bg-neutral-100 transition-colors"
                title="파일 첨부"
              >
                <Paperclip className="w-4 h-4 text-neutral-600" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* 에러 표시 */}
          {error && (
            <div className="rounded bg-red-50 p-3 text-xs text-red-700">
              <strong>에러:</strong> {error}
            </div>
          )}

          {/* 생성 버튼 */}
          <button
            type="submit"
            disabled={isLoading || (!prompt.trim() && uploadedFiles.length === 0)}
            className="w-full rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {isLoading ? '생성 중...' : uploadedFiles.length > 0 ? `생성하기 (${uploadedFiles.length}개 파일 포함)` : '생성하기'}
          </button>
        </form>

        {/* 안내 메시지 */}
        {!isLoading && !error && !lastResponse && (
          <div className="mt-6 rounded bg-blue-50 p-3 text-xs text-blue-700">
            <strong>💡 Tip:</strong> 구체적으로 설명할수록 더 좋은 결과를
            얻을 수 있습니다.
          </div>
        )}

        {/* AI 응답 자동 렌더링 */}
        {lastResponse && !isLoading && (
          <div className="mt-6">
            <AIResponseRenderer
              response={lastResponse}
              responseId={`chat-${Date.now()}`}
              editable={true}
              showFeedback={true}
              showQualityScore={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
