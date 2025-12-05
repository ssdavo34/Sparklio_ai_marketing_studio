/**
 * Instagram Ad HTML Templates
 *
 * 인스타그램 광고 HTML 템플릿 컴포넌트
 * - 피드 (1:1), 스토리 (9:16) 포맷 지원
 * - 다양한 레이아웃 (텍스트 오버레이, 상단/하단 텍스트 등)
 * - 브랜드 스타일 적용
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-05
 */

'use client';

import React from 'react';
import type {
  InstagramAdData,
  InstagramAdLayout,
  BrandStyleVars,
  ImageSlot,
} from '@/types/htmlTemplates';
import { createPlaceholderUrl } from '@/types/htmlTemplates';

// =============================================================================
// Ad Container
// =============================================================================

interface AdContainerProps {
  children: React.ReactNode;
  brandStyle: BrandStyleVars;
  format: 'feed' | 'story';
}

export function AdContainer({ children, brandStyle, format }: AdContainerProps) {
  const dimensions = format === 'feed'
    ? { width: 1080, height: 1080 }
    : { width: 1080, height: 1920 };

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: '100%',
        aspectRatio: format === 'feed' ? '1/1' : '9/16',
        backgroundColor: brandStyle.backgroundColor,
        color: brandStyle.textColor,
        fontFamily: brandStyle.bodyFont,
        '--primary-color': brandStyle.primaryColor,
        '--secondary-color': brandStyle.secondaryColor || brandStyle.primaryColor,
        '--accent-color': brandStyle.accentColor || brandStyle.primaryColor,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Ad Image Component
// =============================================================================

interface AdImageProps {
  slot: ImageSlot;
  brandStyle: BrandStyleVars;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
}

function AdImage({
  slot,
  brandStyle,
  className = '',
  overlay = false,
  overlayOpacity = 0.4,
}: AdImageProps) {
  const imageUrl = slot.generatedUrl
    || slot.placeholderUrl
    || createPlaceholderUrl(slot.width, slot.height, brandStyle.primaryColor, brandStyle.secondaryColor);

  return (
    <div className={`relative ${className}`}>
      <img
        src={imageUrl}
        alt=""
        className="w-full h-full object-cover"
      />
      {overlay && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
        />
      )}
      {slot.status === 'generating' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="animate-spin w-10 h-10 border-3 border-white border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Text Overlay Layout
// =============================================================================

interface LayoutProps {
  data: InstagramAdData;
}

export function TextOverlayLayout({ data }: LayoutProps) {
  const heroImage = data.images.find(img => img.position === 'hero' || img.position === 'background');
  const isStory = data.format === 'story';

  const getTextPosition = () => {
    switch (data.textPosition) {
      case 'top':
        return 'items-start pt-16';
      case 'bottom':
        return 'items-end pb-16';
      default:
        return 'items-center';
    }
  };

  const getTextAlignment = () => {
    switch (data.textAlignment) {
      case 'left':
        return 'text-left items-start';
      case 'right':
        return 'text-right items-end';
      default:
        return 'text-center items-center';
    }
  };

  return (
    <AdContainer brandStyle={data.brandStyle} format={data.format}>
      {/* 배경 이미지 */}
      {heroImage && (
        <AdImage
          slot={heroImage}
          brandStyle={data.brandStyle}
          className="absolute inset-0"
          overlay
          overlayOpacity={0.5}
        />
      )}

      {/* 콘텐츠 */}
      <div className={`relative z-10 h-full flex flex-col ${getTextPosition()} px-8`}>
        <div className={`flex flex-col ${getTextAlignment()} max-w-full`}>
          {/* 로고 */}
          {data.logoUrl && (
            <img
              src={data.logoUrl}
              alt={data.brandName}
              className="w-16 h-16 object-contain mb-6"
            />
          )}

          {/* 헤드라인 */}
          <h1
            className={`font-bold text-white mb-4 leading-tight ${
              isStory ? 'text-4xl' : 'text-3xl'
            }`}
            style={{ fontFamily: data.brandStyle.headingFont }}
          >
            {data.headline}
          </h1>

          {/* 서브헤드라인 */}
          {data.subheadline && (
            <p className={`text-white/90 mb-6 ${isStory ? 'text-xl' : 'text-lg'}`}>
              {data.subheadline}
            </p>
          )}

          {/* CTA 버튼 */}
          <button
            className="px-8 py-3 font-semibold rounded-full transition-transform hover:scale-105"
            style={{
              backgroundColor: data.brandStyle.accentColor || '#ffffff',
              color: data.brandStyle.primaryColor,
            }}
          >
            {data.cta}
          </button>
        </div>
      </div>

      {/* 브랜드명 (하단) */}
      {data.brandName && !data.logoUrl && (
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <span className="text-white/70 text-sm font-medium">{data.brandName}</span>
        </div>
      )}
    </AdContainer>
  );
}

// =============================================================================
// Text Bottom Layout
// =============================================================================

export function TextBottomLayout({ data }: LayoutProps) {
  const heroImage = data.images.find(img => img.position === 'hero' || img.position === 'product');
  const isStory = data.format === 'story';

  return (
    <AdContainer brandStyle={data.brandStyle} format={data.format}>
      <div className="h-full flex flex-col">
        {/* 이미지 영역 (상단 60-70%) */}
        <div className={`relative ${isStory ? 'flex-1' : 'h-2/3'}`}>
          {heroImage ? (
            <AdImage
              slot={heroImage}
              brandStyle={data.brandStyle}
              className="w-full h-full"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${data.brandStyle.primaryColor}40, ${data.brandStyle.secondaryColor || data.brandStyle.primaryColor}20)`,
              }}
            />
          )}

          {/* 로고 (이미지 위) */}
          {data.logoUrl && (
            <div className="absolute top-6 left-6">
              <img
                src={data.logoUrl}
                alt={data.brandName}
                className="w-12 h-12 object-contain"
              />
            </div>
          )}
        </div>

        {/* 텍스트 영역 (하단) */}
        <div
          className={`${isStory ? 'p-8' : 'flex-1 p-6'} flex flex-col justify-center`}
          style={{ backgroundColor: data.brandStyle.backgroundColor }}
        >
          <h2
            className={`font-bold mb-3 ${isStory ? 'text-2xl' : 'text-xl'}`}
            style={{
              fontFamily: data.brandStyle.headingFont,
              color: data.brandStyle.textColor,
            }}
          >
            {data.headline}
          </h2>

          {data.subheadline && (
            <p className="text-gray-600 mb-4 text-sm">{data.subheadline}</p>
          )}

          <button
            className="self-start px-6 py-2.5 text-sm font-semibold rounded-full text-white"
            style={{ backgroundColor: data.brandStyle.primaryColor }}
          >
            {data.cta}
          </button>
        </div>
      </div>
    </AdContainer>
  );
}

// =============================================================================
// Text Top Layout
// =============================================================================

export function TextTopLayout({ data }: LayoutProps) {
  const heroImage = data.images.find(img => img.position === 'hero' || img.position === 'product');
  const isStory = data.format === 'story';

  return (
    <AdContainer brandStyle={data.brandStyle} format={data.format}>
      <div className="h-full flex flex-col">
        {/* 텍스트 영역 (상단) */}
        <div
          className={`${isStory ? 'p-8' : 'p-6'}`}
          style={{ backgroundColor: data.brandStyle.primaryColor }}
        >
          {/* 로고 */}
          {data.logoUrl && (
            <img
              src={data.logoUrl}
              alt={data.brandName}
              className="w-10 h-10 object-contain mb-4"
            />
          )}

          <h2
            className={`font-bold text-white mb-2 ${isStory ? 'text-2xl' : 'text-xl'}`}
            style={{ fontFamily: data.brandStyle.headingFont }}
          >
            {data.headline}
          </h2>

          {data.subheadline && (
            <p className="text-white/80 text-sm">{data.subheadline}</p>
          )}
        </div>

        {/* 이미지 영역 */}
        <div className="flex-1 relative">
          {heroImage ? (
            <AdImage
              slot={heroImage}
              brandStyle={data.brandStyle}
              className="w-full h-full"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(180deg, ${data.brandStyle.primaryColor}20, ${data.brandStyle.backgroundColor})`,
              }}
            />
          )}

          {/* CTA 버튼 (이미지 하단) */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
            <button
              className="px-8 py-3 font-semibold rounded-full shadow-lg"
              style={{
                backgroundColor: data.brandStyle.accentColor || '#ffffff',
                color: data.brandStyle.primaryColor,
              }}
            >
              {data.cta}
            </button>
          </div>
        </div>
      </div>
    </AdContainer>
  );
}

// =============================================================================
// Minimal Layout
// =============================================================================

export function MinimalLayout({ data }: LayoutProps) {
  const heroImage = data.images.find(img => img.position === 'hero' || img.position === 'product');

  return (
    <AdContainer brandStyle={data.brandStyle} format={data.format}>
      {/* 배경 이미지 */}
      {heroImage && (
        <AdImage
          slot={heroImage}
          brandStyle={data.brandStyle}
          className="absolute inset-0"
        />
      )}

      {/* 미니멀 오버레이 */}
      <div className="relative z-10 h-full flex flex-col justify-between p-8">
        {/* 로고 (상단) */}
        {data.logoUrl && (
          <div>
            <img
              src={data.logoUrl}
              alt={data.brandName}
              className="w-14 h-14 object-contain"
            />
          </div>
        )}

        {/* CTA (하단) */}
        <div className="flex justify-end">
          <button
            className="px-6 py-3 font-semibold rounded-full backdrop-blur-sm"
            style={{
              backgroundColor: 'rgba(255,255,255,0.9)',
              color: data.brandStyle.primaryColor,
            }}
          >
            {data.cta}
          </button>
        </div>
      </div>
    </AdContainer>
  );
}

// =============================================================================
// Bold Typography Layout
// =============================================================================

export function BoldLayout({ data }: LayoutProps) {
  const isStory = data.format === 'story';

  return (
    <AdContainer brandStyle={data.brandStyle} format={data.format}>
      <div
        className="h-full flex flex-col items-center justify-center text-center p-8"
        style={{ backgroundColor: data.brandStyle.primaryColor }}
      >
        {/* 로고 */}
        {data.logoUrl && (
          <img
            src={data.logoUrl}
            alt={data.brandName}
            className="w-16 h-16 object-contain mb-8"
          />
        )}

        {/* 대형 헤드라인 */}
        <h1
          className={`font-black text-white leading-none mb-6 ${
            isStory ? 'text-6xl' : 'text-5xl'
          }`}
          style={{ fontFamily: data.brandStyle.headingFont }}
        >
          {data.headline}
        </h1>

        {/* 서브헤드라인 */}
        {data.subheadline && (
          <p className={`text-white/80 mb-8 max-w-xs ${isStory ? 'text-xl' : 'text-lg'}`}>
            {data.subheadline}
          </p>
        )}

        {/* CTA */}
        <button
          className="px-10 py-4 font-bold rounded-full text-lg"
          style={{
            backgroundColor: '#ffffff',
            color: data.brandStyle.primaryColor,
          }}
        >
          {data.cta}
        </button>

        {/* 장식 요소 */}
        <div className="absolute bottom-8 flex gap-2">
          {[...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="w-2 h-2 rounded-full bg-white"
              style={{ opacity: 1 - idx * 0.3 }}
            />
          ))}
        </div>
      </div>
    </AdContainer>
  );
}

// =============================================================================
// Split Layout (이미지 + 컬러 배경)
// =============================================================================

export function SplitLayout({ data }: LayoutProps) {
  const heroImage = data.images.find(img => img.position === 'hero' || img.position === 'product');
  const isStory = data.format === 'story';

  return (
    <AdContainer brandStyle={data.brandStyle} format={data.format}>
      <div className={`h-full flex ${isStory ? 'flex-col' : 'flex-row'}`}>
        {/* 이미지 영역 */}
        <div className={isStory ? 'h-1/2' : 'w-1/2 h-full'}>
          {heroImage ? (
            <AdImage
              slot={heroImage}
              brandStyle={data.brandStyle}
              className="w-full h-full"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${data.brandStyle.primaryColor}30, ${data.brandStyle.secondaryColor || data.brandStyle.primaryColor}15)`,
              }}
            />
          )}
        </div>

        {/* 텍스트 영역 */}
        <div
          className={`${isStory ? 'h-1/2' : 'w-1/2 h-full'} flex flex-col justify-center p-8`}
          style={{ backgroundColor: data.brandStyle.primaryColor }}
        >
          <h2
            className={`font-bold text-white mb-4 ${isStory ? 'text-3xl' : 'text-2xl'}`}
            style={{ fontFamily: data.brandStyle.headingFont }}
          >
            {data.headline}
          </h2>

          {data.subheadline && (
            <p className="text-white/80 mb-6">{data.subheadline}</p>
          )}

          <button
            className="self-start px-6 py-3 font-semibold rounded-full bg-white"
            style={{ color: data.brandStyle.primaryColor }}
          >
            {data.cta}
          </button>
        </div>
      </div>
    </AdContainer>
  );
}

// =============================================================================
// Layout Router
// =============================================================================

interface InstagramAdProps {
  data: InstagramAdData;
}

export function InstagramAd({ data }: InstagramAdProps) {
  switch (data.layout) {
    case 'text_overlay':
      return <TextOverlayLayout data={data} />;
    case 'text_bottom':
      return <TextBottomLayout data={data} />;
    case 'text_top':
      return <TextTopLayout data={data} />;
    case 'minimal':
      return <MinimalLayout data={data} />;
    case 'bold':
      return <BoldLayout data={data} />;
    default:
      return <TextOverlayLayout data={data} />;
  }
}

// =============================================================================
// Instagram Ad Set Renderer
// =============================================================================

interface InstagramAdSetRendererProps {
  ads: InstagramAdData[];
  currentAd?: number;
  onAdChange?: (index: number) => void;
}

export function InstagramAdSetRenderer({
  ads,
  currentAd = 0,
  onAdChange,
}: InstagramAdSetRendererProps) {
  const format = ads[0]?.format || 'feed';
  const maxWidth = format === 'feed' ? 'max-w-md' : 'max-w-xs';

  return (
    <div className="flex flex-col items-center">
      {/* 현재 광고 */}
      <div className={`w-full ${maxWidth} rounded-lg overflow-hidden shadow-2xl`}>
        <InstagramAd data={ads[currentAd]} />
      </div>

      {/* 광고 네비게이션 */}
      {ads.length > 1 && (
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={() => onAdChange?.(Math.max(0, currentAd - 1))}
            disabled={currentAd === 0}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>

          <div className="flex gap-2">
            {ads.map((_, idx) => (
              <button
                key={idx}
                onClick={() => onAdChange?.(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  idx === currentAd ? 'bg-purple-500' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => onAdChange?.(Math.min(ads.length - 1, currentAd + 1))}
            disabled={currentAd === ads.length - 1}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      )}

      {/* 썸네일 스트립 */}
      {ads.length > 1 && (
        <div className="flex gap-3 mt-4">
          {ads.map((ad, idx) => (
            <button
              key={idx}
              onClick={() => onAdChange?.(idx)}
              className={`flex-shrink-0 w-16 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentAd ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div style={{ aspectRatio: format === 'feed' ? '1/1' : '9/16' }}>
                <InstagramAd data={{ ...ad, images: [] }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default InstagramAd;
