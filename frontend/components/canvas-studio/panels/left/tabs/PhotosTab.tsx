/**
 * Photos Tab
 *
 * Unsplash 이미지 검색 및 Canvas 삽입
 * - 검색 기능
 * - 무한 스크롤
 * - 이미지 미리보기
 * - Canvas 배경/요소로 삽입
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-11-28
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import {
  searchPhotos,
  listPhotos,
  triggerDownload,
  convertSearchResults,
} from '@/lib/api/unsplash-api';
import type { SimplePhoto } from '@/lib/api/unsplash-types';
import { useCanvasStore } from '../../../stores/useCanvasStore';

// ============================================================================
// Types
// ============================================================================

interface PhotosTabProps {
  onPhotoInsert?: (photo: SimplePhoto, mode: 'background' | 'image') => void;
}

// ============================================================================
// Component
// ============================================================================

export function PhotosTab({ onPhotoInsert }: PhotosTabProps = {}) {
  const [photos, setPhotos] = useState<SimplePhoto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const polotnoStore = useCanvasStore((state) => state.polotnoStore);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastPhotoRef = useRef<HTMLDivElement | null>(null);

  /**
   * 초기 인기 사진 로드
   */
  useEffect(() => {
    loadPopularPhotos();
  }, []);

  /**
   * 무한 스크롤 설정
   */
  useEffect(() => {
    if (isLoading || !hasMore) return;

    // Intersection Observer 생성
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMorePhotos();
        }
      },
      { threshold: 0.5 }
    );

    // 마지막 사진 요소 관찰
    if (lastPhotoRef.current) {
      observerRef.current.observe(lastPhotoRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [photos, hasMore, isLoading]);

  /**
   * 인기 사진 로드
   */
  const loadPopularPhotos = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listPhotos({ per_page: 30, order_by: 'popular' });
      const simplePhotos = result.map((photo) => ({
        id: photo.id,
        width: photo.width,
        height: photo.height,
        color: photo.color,
        urls: photo.urls,
        user: {
          name: photo.user.name,
          username: photo.user.username,
          profile_image: photo.user.profile_image.medium,
        },
        alt_description: photo.alt_description,
        download_location: photo.links.download_location,
      }));

      setPhotos(simplePhotos);
      setPage(1);
      setHasMore(true);
    } catch (err) {
      console.error('[PhotosTab] Failed to load popular photos:', err);
      setError('인기 사진을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 사진 검색
   */
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      loadPopularPhotos();
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchQuery(query);
    setPage(1);

    try {
      const result = await searchPhotos({
        query: query.trim(),
        page: 1,
        per_page: 30,
        orientation: 'landscape',
      });

      const simplePhotos = convertSearchResults(result);
      setPhotos(simplePhotos);
      setHasMore(result.total_pages > 1);
    } catch (err) {
      console.error('[PhotosTab] Search failed:', err);
      setError('검색에 실패했습니다. 다시 시도해주세요.');
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 더 많은 사진 로드 (무한 스크롤)
   */
  const loadMorePhotos = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const nextPage = page + 1;

    try {
      if (searchQuery) {
        // 검색 결과 더 로드
        const result = await searchPhotos({
          query: searchQuery,
          page: nextPage,
          per_page: 30,
          orientation: 'landscape',
        });

        const simplePhotos = convertSearchResults(result);
        setPhotos((prev) => [...prev, ...simplePhotos]);
        setHasMore(nextPage < result.total_pages);
      } else {
        // 인기 사진 더 로드
        const result = await listPhotos({
          page: nextPage,
          per_page: 30,
          order_by: 'popular',
        });

        const simplePhotos = result.map((photo) => ({
          id: photo.id,
          width: photo.width,
          height: photo.height,
          color: photo.color,
          urls: photo.urls,
          user: {
            name: photo.user.name,
            username: photo.user.username,
            profile_image: photo.user.profile_image.medium,
          },
          alt_description: photo.alt_description,
          download_location: photo.links.download_location,
        }));

        setPhotos((prev) => [...prev, ...simplePhotos]);
        setHasMore(result.length === 30);
      }

      setPage(nextPage);
    } catch (err) {
      console.error('[PhotosTab] Failed to load more photos:', err);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 사진을 Canvas에 삽입
   */
  const handlePhotoClick = async (photo: SimplePhoto, mode: 'background' | 'image' = 'image') => {
    if (!polotnoStore || !polotnoStore.activePage) {
      console.error('[PhotosTab] No active page');
      return;
    }

    try {
      // Unsplash 다운로드 트리거 (필수)
      await triggerDownload(photo.download_location);

      // Canvas에 삽입
      if (mode === 'background') {
        // 배경으로 설정
        polotnoStore.activePage.set({
          background: photo.urls.regular,
        });
      } else {
        // 이미지 요소로 추가
        const pageWidth = typeof polotnoStore.activePage.width === 'number'
          ? polotnoStore.activePage.width
          : 1080;
        const pageHeight = typeof polotnoStore.activePage.height === 'number'
          ? polotnoStore.activePage.height
          : 1920;

        // 이미지 크기 계산 (페이지의 80% 크기로)
        const targetWidth = pageWidth * 0.8;
        const aspectRatio = photo.height / photo.width;
        const targetHeight = targetWidth * aspectRatio;

        // 중앙 위치 계산
        const x = (pageWidth - targetWidth) / 2;
        const y = (pageHeight - targetHeight) / 2;

        polotnoStore.activePage.addElement({
          type: 'image',
          src: photo.urls.regular,
          x,
          y,
          width: targetWidth,
          height: targetHeight,
        });
      }

      // 콜백 호출
      onPhotoInsert?.(photo, mode);

      console.log('[PhotosTab] Photo inserted:', photo.id, mode);
    } catch (err) {
      console.error('[PhotosTab] Failed to insert photo:', err);
      setError('사진을 삽입하는데 실패했습니다.');
    }
  };

  /**
   * 검색 입력 핸들러
   */
  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  }, []);

  /**
   * 검색 제출 핸들러
   */
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSearch(searchQuery);
    },
    [searchQuery]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="이미지 검색..."
              value={searchQuery}
              onChange={handleSearchInput}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          Powered by <a href="https://unsplash.com/?utm_source=sparklio&utm_medium=referral" target="_blank" rel="noopener noreferrer" className="underline">Unsplash</a>
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Photos Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {photos.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ImageIcon className="w-12 h-12 mb-4" />
            <p className="text-sm">검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                ref={index === photos.length - 1 ? lastPhotoRef : null}
                className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-100 hover:ring-2 hover:ring-indigo-500 transition-all"
                onClick={() => handlePhotoClick(photo, 'image')}
                title={`Photo by ${photo.user.name}`}
              >
                {/* Thumbnail */}
                <img
                  src={photo.urls.thumb}
                  alt={photo.alt_description || 'Unsplash photo'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-end p-2">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity w-full">
                    {/* User Info */}
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={photo.user.profile_image}
                        alt={photo.user.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-white text-xs font-medium truncate">
                        {photo.user.name}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePhotoClick(photo, 'image');
                        }}
                        className="flex-1 px-2 py-1 bg-white text-gray-900 text-xs rounded hover:bg-gray-100 transition-colors"
                      >
                        요소로 추가
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePhotoClick(photo, 'background');
                        }}
                        className="flex-1 px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors"
                      >
                        배경으로
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
