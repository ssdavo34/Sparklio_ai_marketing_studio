/**
 * Images Section
 *
 * 이미지 추가 섹션
 *
 * @author C Team (Frontend Team)
 * @version 1.0
 */

'use client';

import { useCallback, useState } from 'react';
import { ChevronDown, ChevronRight, Image as ImageIcon, Upload, Link, Search, Loader2 } from 'lucide-react';

interface ImagesSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  onAddImage: (src: string, name?: string) => void;
  onUploadImage: () => void;
}

export function ImagesSection({ isExpanded, onToggle, onAddImage, onUploadImage }: ImagesSectionProps) {
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URL로 이미지 추가
  const handleAddFromUrl = useCallback(async () => {
    if (!urlInput.trim()) {
      setError('URL을 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // URL 유효성 검사
      const url = new URL(urlInput.trim());

      // 이미지 로드 테스트
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다'));
        img.src = url.href;
      });

      onAddImage(url.href, 'URL Image');
      setUrlInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '유효하지 않은 URL입니다');
    } finally {
      setIsLoading(false);
    }
  }, [urlInput, onAddImage]);

  // 드래그 앤 드롭 처리
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('image/'));

      if (files.length === 0) {
        setError('이미지 파일만 업로드 가능합니다');
        return;
      }

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            onAddImage(dataUrl, file.name);
          }
        };
        reader.readAsDataURL(file);
      });
    },
    [onAddImage]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="border-b border-gray-200">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-sm font-medium text-gray-800">이미지</span>
        </div>
        <ImageIcon className="w-4 h-4 text-gray-400" />
      </button>

      {/* Section Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer"
            onClick={onUploadImage}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">클릭 또는 드래그로 업로드</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF, SVG</p>
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500">URL로 추가</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setError(null);
                }}
                placeholder="이미지 URL 입력"
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddFromUrl();
                  }
                }}
              />
              <button
                onClick={handleAddFromUrl}
                disabled={isLoading || !urlInput.trim()}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-sm rounded-lg transition-colors"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '추가'}
              </button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          {/* Stock Photo Search (Placeholder) */}
          <div className="pt-2 border-t border-gray-100">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => {
                // TODO: Unsplash 모달 열기
                console.log('[ImagesSection] Open stock photo search');
              }}
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">스톡 이미지 검색</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImagesSection;
