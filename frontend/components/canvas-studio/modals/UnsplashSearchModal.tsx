/**
 * Unsplash Search Modal
 *
 * Unsplash API를 통해 이미지를 검색하고 선택하는 모달
 * - 키워드 검색
 * - 그리드 레이아웃으로 결과 표시
 * - 이미지 선택 시 메타데이터와 함께 반환
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { searchPhotos, triggerDownload, type SimplePhoto } from '@/lib/api/unsplash-api';
import { createUnsplashMetadata } from '@/lib/canvas/image-metadata';
import type { ImageMetadata } from '@/lib/canvas/image-metadata';

export interface UnsplashSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string, metadata: ImageMetadata) => void;
  initialQuery?: string;
}

export function UnsplashSearchModal({
  isOpen,
  onClose,
  onSelect,
  initialQuery = '',
}: UnsplashSearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [photos, setPhotos] = useState<SimplePhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<SimplePhoto | null>(null);

  // 초기 쿼리가 있으면 자동 검색
  useEffect(() => {
    if (isOpen && initialQuery) {
      handleSearch(initialQuery);
    }
  }, [isOpen, initialQuery]);

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await searchPhotos({
        query: searchQuery.trim(),
        per_page: 30,
        orientation: 'landscape',
      });

      setPhotos(result.results);

      if (result.results.length === 0) {
        setError('검색 결과가 없습니다. 다른 키워드를 시도해보세요.');
      }
    } catch (err: any) {
      console.error('[UnsplashModal] Search failed:', err);
      setError(err.message || '검색 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPhoto = async (photo: SimplePhoto) => {
    setSelectedPhoto(photo);

    try {
      // Unsplash API 정책: 다운로드 트리거 필수
      await triggerDownload(photo.download_location);

      // 메타데이터 생성
      const metadata = createUnsplashMetadata(
        photo.id,
        photo.user.name,
        photo.user.username,
        photo.download_location
      );

      // 이미지 URL과 메타데이터 반환 (regular size 사용)
      onSelect(photo.urls.regular, metadata);

      // 모달 닫기
      onClose();
    } catch (err) {
      console.error('[UnsplashModal] Download trigger failed:', err);
      // 실패해도 이미지는 선택됨 (다운로드 트리거는 통계용)
      const metadata = createUnsplashMetadata(
        photo.id,
        photo.user.name,
        photo.user.username,
        photo.download_location
      );
      onSelect(photo.urls.regular, metadata);
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Unsplash 이미지 검색</h2>
              <p className="text-xs text-gray-500">무료 고품질 스톡 이미지</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="검색어를 입력하세요 (예: business, laptop, office)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  검색 중...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  검색
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {!error && photos.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-sm">
                검색어를 입력하여 이미지를 찾아보세요
              </p>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          )}

          {!isLoading && photos.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => handleSelectPhoto(photo)}
                  className={`group relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                    selectedPhoto?.id === photo.id
                      ? 'border-purple-600 shadow-lg'
                      : 'border-transparent hover:border-purple-300'
                  }`}
                >
                  <img
                    src={photo.urls.small}
                    alt={photo.alt_description || 'Unsplash photo'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-xs font-medium">
                        Photo by {photo.user.name}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Images provided by{' '}
            <a
              href="https://unsplash.com/?utm_source=sparklio&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline"
            >
              Unsplash
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
