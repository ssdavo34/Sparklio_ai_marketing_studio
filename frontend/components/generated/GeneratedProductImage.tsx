/**
 * Generated Product Image Component
 *
 * AI 생성 이미지 표시 컴포넌트
 * - Base64 및 URL 형식 모두 지원
 * - 에러 처리 및 fallback UI
 * - 로딩 상태 표시
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-22
 */

'use client';

import { useState } from 'react';
import type { GeneratedImage } from '@/types/generator';
import { getImageDataUrl } from '@/types/generator';

// ============================================================================
// Types
// ============================================================================

export interface GeneratedProductImageProps {
  /** 생성된 이미지 데이터 */
  image?: GeneratedImage | null;

  /** 대체 텍스트 */
  alt?: string;

  /** 추가 CSS 클래스 */
  className?: string;

  /** 로딩 중 표시할 컴포넌트 */
  loadingComponent?: React.ReactNode;

  /** 에러 시 표시할 컴포넌트 */
  errorComponent?: React.ReactNode;

  /** 이미지 없을 때 표시할 컴포넌트 */
  emptyComponent?: React.ReactNode;

  /** 이미지 로딩 완료 콜백 */
  onLoad?: () => void;

  /** 이미지 로딩 에러 콜백 */
  onError?: (error: Error) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * AI 생성 이미지 표시 컴포넌트
 *
 * @example
 * ```tsx
 * // Base64 이미지
 * <GeneratedProductImage
 *   image={{
 *     type: 'base64',
 *     format: 'png',
 *     data: 'iVBORw0KG...',
 *   }}
 *   alt="Generated product"
 *   className="w-full h-auto"
 * />
 *
 * // URL 이미지
 * <GeneratedProductImage
 *   image={{
 *     type: 'url',
 *     url: 'https://cdn.example.com/image.png',
 *   }}
 *   alt="Product image"
 * />
 * ```
 */
export function GeneratedProductImage({
  image,
  alt = 'Generated product image',
  className = '',
  loadingComponent,
  errorComponent,
  emptyComponent,
  onLoad,
  onError,
}: GeneratedProductImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 이미지 데이터가 없는 경우
  if (!image) {
    if (emptyComponent) {
      return <>{emptyComponent}</>;
    }
    return null;
  }

  // 이미지 URL 생성
  const imageUrl = getImageDataUrl(image);

  // URL 생성 실패 (유효하지 않은 이미지 데이터)
  if (!imageUrl) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[GeneratedProductImage] Invalid image data:', image);
    }

    if (errorComponent) {
      return <>{errorComponent}</>;
    }

    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg p-4 ${className}`}>
        <p className="text-sm text-gray-500">이미지를 불러올 수 없습니다</p>
      </div>
    );
  }

  // 이미지 로딩 핸들러
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  // 이미지 에러 핸들러
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);

    const error = new Error(`Failed to load image: ${imageUrl.substring(0, 50)}...`);
    onError?.(error);

    if (process.env.NODE_ENV === 'development') {
      console.error('[GeneratedProductImage] Image load error:', error);
    }
  };

  // 로딩 중
  if (isLoading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  // 에러 발생
  if (hasError) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }

    return (
      <div className={`flex items-center justify-center bg-red-50 rounded-lg p-4 ${className}`}>
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto mb-2 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-red-600">이미지를 불러올 수 없습니다</p>
        </div>
      </div>
    );
  }

  // 이미지 렌더링
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={`w-full h-full object-contain rounded-lg ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

// ============================================================================
// Skeleton Component
// ============================================================================

/**
 * 이미지 로딩 중 스켈레톤
 */
export function ImageSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`}>
      <div className="flex items-center justify-center h-full">
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    </div>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

/**
 * 이미지 없음 상태
 */
export function ImageEmptyState({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
      <div className="text-center p-4">
        <svg
          className="w-12 h-12 mx-auto mb-2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm text-gray-500">이미지 없음</p>
      </div>
    </div>
  );
}
