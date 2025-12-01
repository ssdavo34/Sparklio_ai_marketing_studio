'use client';

import { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Sparkles, Loader2, Link as LinkIcon, FileText, Globe, File, Send, ArrowRight } from 'lucide-react';
import { useCanvasStore } from '../../../stores/useCanvasStore';
import { useLeftPanelStore } from '../../../stores/useLeftPanelStore';
import { useBrandStore } from '../../../stores/useBrandStore';
import { toast } from '@/components/ui/Toast';
import type { BrandDNA } from '@/types/brand';

type UploadedFile = {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'pdf' | 'document' | 'webpage';
  size?: number;
  file?: File;
};

export function UploadTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<BrandDNA | null>(null);

  const polotnoStore = useCanvasStore((state) => state.canvases.get(state.activeCanvasType) || null);
  const setActiveTab = useLeftPanelStore((state) => state.setActiveTab);
  const { setSharedBrandDNA } = useBrandStore();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const getFileType = (file: File): UploadedFile['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'pdf';
    return 'document';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum file size is 50MB.`);
        continue;
      }

      // Create object URL
      const url = URL.createObjectURL(file);
      const id = `file-${Date.now()}-${i}`;
      const type = getFileType(file);

      newFiles.push({
        id,
        url,
        name: file.name,
        type,
        size: file.size,
        file,
      });
    }

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const input = fileInputRef.current;
    if (input) {
      const dataTransfer = new DataTransfer();
      for (let i = 0; i < files.length; i++) {
        dataTransfer.items.add(files[i]);
      }
      input.files = dataTransfer.files;
      handleFileChange({ target: input } as any);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const addImageToCanvas = (fileUrl: string) => {
    if (!polotnoStore) {
      console.error('Polotno store not initialized');
      return;
    }

    const page = polotnoStore.activePage;
    if (!page) {
      console.error('No active page');
      return;
    }

    // Add image to canvas
    page.addElement({
      type: 'image',
      src: fileUrl,
      x: 50,
      y: 50,
      width: 200,
      height: 200,
    });
  };

  const removeFile = (id: string, url: string) => {
    // Only revoke if it's a blob URL (not external URL)
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAddFromUrl = async () => {
    if (!urlInput.trim()) {
      alert('URL을 입력해주세요.');
      return;
    }

    setLoadingUrl(true);
    try {
      const url = new URL(urlInput);

      // Determine type from URL
      let type: UploadedFile['type'] = 'webpage';
      const pathname = url.pathname.toLowerCase();

      if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(pathname)) {
        type = 'image';

        // Test if image loads
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'));
          img.src = urlInput;
        });
      } else if (pathname.endsWith('.pdf')) {
        type = 'pdf';
      } else if (/\.(doc|docx|ppt|pptx|xls|xlsx)$/i.test(pathname)) {
        type = 'document';
      }

      const id = `url-${Date.now()}`;
      const name = pathname.split('/').pop() || url.hostname;

      setUploadedFiles((prev) => [
        ...prev,
        {
          id,
          url: urlInput,
          name,
          type,
        },
      ]);

      setUrlInput('');
      alert(`✅ ${type === 'webpage' ? '웹페이지' : '파일'}가 추가되었습니다!`);
    } catch (error) {
      console.error('Failed to add from URL:', error);
      alert('❌ URL을 로드할 수 없습니다. URL을 확인해주세요.');
    } finally {
      setLoadingUrl(false);
    }
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('먼저 파일을 업로드해주세요.');
      return;
    }

    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      // URL 또는 파일에서 컨텐츠 추출
      const webpageFile = uploadedFiles.find(f => f.type === 'webpage');

      let requestBody: any = {};

      if (webpageFile) {
        // URL 기반 분석
        requestBody = {
          url: webpageFile.url,
          brand_name: '', // 익명 분석
        };
      } else {
        // 파일 기반 분석 - 현재는 URL만 지원
        toast.error('현재 URL 기반 분석만 지원됩니다. 웹페이지 URL을 추가해주세요.');
        setAnalyzing(false);
        return;
      }

      // Backend API 호출
      const response = await fetch('http://100.123.51.5:8000/api/v1/brand-analyzer/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.status}`);
      }

      const result = await response.json();
      console.log('[UploadTab] Brand DNA analysis result:', result);

      // 결과 저장 (캔버스에 직접 그리지 않음)
      setAnalysisResult(result);
      toast.success('Brand DNA 분석 완료! 아래에서 결과를 확인하세요.');

    } catch (error: any) {
      console.error('Analysis failed:', error);
      toast.error(error.message || '분석에 실패했습니다.');
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * Brand Kit 탭으로 결과 전송
   */
  const handleSendToBrandKit = () => {
    if (!analysisResult) {
      toast.error('먼저 분석을 실행해주세요.');
      return;
    }

    // Brand Store에 저장
    setSharedBrandDNA(analysisResult);

    // Brand Kit 탭으로 이동 (자동으로 brand-dna 캔버스로 전환됨)
    setActiveTab('brandkit');

    toast.success('Brand Kit으로 이동합니다.');
  };

  /**
   * ConceptBoard 탭으로 결과 전송
   */
  const handleSendToConceptBoard = () => {
    if (!analysisResult) {
      toast.error('먼저 분석을 실행해주세요.');
      return;
    }

    // Brand Store에 저장
    setSharedBrandDNA(analysisResult);

    // ConceptBoard 탭으로 이동
    setActiveTab('conceptboard');

    toast.success('ConceptBoard로 이동합니다.');
  };

  const getFileIcon = (type: UploadedFile['type']) => {
    switch (type) {
      case 'image':
        return ImageIcon;
      case 'pdf':
        return FileText;
      case 'webpage':
        return Globe;
      default:
        return File;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Upload</h2>
        <p className="text-xs text-gray-500 mt-1">Upload files or add from URL</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Upload Area */}
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 hover:bg-purple-50 transition-colors cursor-pointer"
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">Click to upload</p>
          <p className="text-xs text-gray-500 mt-1">Images, PDF, Documents up to 50MB</p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG, PDF, DOC, PPT, XLS</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* URL Input Section */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-gray-300"></div>
            <span className="text-xs text-gray-500">OR</span>
            <div className="h-px flex-1 bg-gray-300"></div>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter URL (image, PDF, document, or webpage)"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddFromUrl();
                }
              }}
            />
            <button
              onClick={handleAddFromUrl}
              disabled={loadingUrl || !urlInput.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loadingUrl ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <LinkIcon className="w-4 h-4" />
                  Add
                </>
              )}
            </button>
          </div>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">
              Uploaded ({uploadedFiles.length})
            </h3>
            <div className="space-y-2">
              {uploadedFiles.map((file) => {
                const Icon = getFileIcon(file.type);
                return (
                  <div
                    key={file.id}
                    className="group relative p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-purple-500 transition-colors cursor-pointer"
                    onClick={() => {
                      if (file.type === 'image') {
                        addImageToCanvas(file.url);
                      } else {
                        alert(`${file.name}이(가) Brand DNA 분석에 포함됩니다.`);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                            {file.type}
                          </span>
                          {file.size && (
                            <span className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id, file.url);
                        }}
                        className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {uploadedFiles.length === 0 && (
          <div className="mt-4 text-xs text-gray-400 text-center">
            <p>Uploaded files will appear here...</p>
            <p className="mt-1">Images, PDFs, documents, or webpage URLs</p>
          </div>
        )}

        {/* Brand DNA Analysis */}
        <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-purple-900 mb-1">
                Brand DNA 분석
              </h3>
              <p className="text-xs text-purple-700 mb-3">
                업로드한 파일(이미지, PDF, 브로셔, 홈페이지 등)을 AI가 자동으로 분석하여 브랜드의 톤앤매너, 핵심 메시지, Do's/Don'ts를 추출합니다.
              </p>
              <button
                onClick={handleAnalyze}
                disabled={analyzing || uploadedFiles.length === 0}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Brand DNA 분석 시작
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Result */}
        {analysisResult && (
          <div className="mt-4 p-4 bg-white border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <h3 className="text-sm font-semibold text-green-800">분석 완료</h3>
            </div>

            {/* 간단한 결과 요약 */}
            <div className="space-y-2 mb-4">
              <div className="text-xs text-gray-600">
                <span className="font-medium">톤앤매너:</span>{' '}
                {'tone' in analysisResult && typeof analysisResult.tone === 'object'
                  ? (analysisResult.tone as any).primary
                  : String(analysisResult.tone || '분석됨')}
              </div>
              <div className="text-xs text-gray-600">
                <span className="font-medium">핵심 메시지:</span>{' '}
                {analysisResult.key_messages?.length || 0}개
              </div>
              <div className="text-xs text-gray-600">
                <span className="font-medium">신뢰도:</span>{' '}
                {((analysisResult.confidence_score || 0) * 100).toFixed(0)}%
              </div>
            </div>

            {/* 전송 버튼들 */}
            <div className="space-y-2">
              <button
                onClick={handleSendToBrandKit}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
                Brand Kit으로 보내기
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={handleSendToConceptBoard}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
                ConceptBoard로 보내기
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
