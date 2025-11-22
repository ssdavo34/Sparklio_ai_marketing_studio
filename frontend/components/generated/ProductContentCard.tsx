/**
 * Product Content Card Component
 *
 * 생성된 제품 콘텐츠를 표시하는 카드 컴포넌트
 * - 헤드라인, 본문, CTA, 이미지 포함
 * - 목업 데이터로 테스트 가능
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-22
 */

'use client';

import type { ProductContentResponse } from '@/types/generator';
import { GeneratedProductImage, ImageSkeleton } from './GeneratedProductImage';

export interface ProductContentCardProps {
  /** 생성된 콘텐츠 데이터 */
  content: ProductContentResponse;

  /** 추가 CSS 클래스 */
  className?: string;

  /** CTA 클릭 핸들러 */
  onCtaClick?: () => void;

  /** 카드 클릭 핸들러 */
  onClick?: () => void;

  /** 로딩 상태 */
  isLoading?: boolean;
}

/**
 * 제품 콘텐츠 카드 컴포넌트
 */
export function ProductContentCard({
  content,
  className = '',
  onCtaClick,
  onClick,
  isLoading = false,
}: ProductContentCardProps) {
  if (isLoading) {
    return <ProductContentCardSkeleton className={className} />;
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* 이미지 영역 */}
      {content.image && (
        <div className="aspect-video w-full">
          <GeneratedProductImage
            image={content.image}
            alt={content.headline}
            className="w-full h-full"
            loadingComponent={<ImageSkeleton className="w-full h-full" />}
          />
        </div>
      )}

      {/* 콘텐츠 영역 */}
      <div className="p-6">
        {/* 헤드라인 */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{content.headline}</h3>

        {/* 서브헤드라인 */}
        {content.subheadline && (
          <p className="text-lg text-gray-600 mb-4">{content.subheadline}</p>
        )}

        {/* 본문 */}
        <p className="text-gray-700 mb-4">{content.body}</p>

        {/* 불릿 포인트 */}
        {content.bullets && content.bullets.length > 0 && (
          <ul className="space-y-2 mb-6">
            {content.bullets.map((bullet, index) => (
              <li key={index} className="flex items-start">
                <svg
                  className="w-5 h-5 text-indigo-600 mt-0.5 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-700">{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA 버튼 */}
        {content.cta && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCtaClick?.();
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {content.cta}
          </button>
        )}

        {/* 메타데이터 (개발 모드에서만) */}
        {process.env.NODE_ENV === 'development' && content.usage && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Tokens: {content.usage.tokens}</span>
              <span>Cost: ${content.usage.cost?.toFixed(4)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 카드 스켈레톤 (로딩 상태)
 */
export function ProductContentCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* 이미지 스켈레톤 */}
      <div className="aspect-video w-full bg-gray-200 animate-pulse" />

      {/* 콘텐츠 스켈레톤 */}
      <div className="p-6 space-y-4">
        {/* 헤드라인 */}
        <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />

        {/* 서브헤드라인 */}
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />

        {/* 본문 */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
        </div>

        {/* 불릿 포인트 */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* CTA 버튼 */}
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
