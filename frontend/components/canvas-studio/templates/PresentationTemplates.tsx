/**
 * Presentation HTML Templates
 *
 * 프레젠테이션 슬라이드 HTML 템플릿 컴포넌트
 * - 표지, 목차, 콘텐츠, CTA 등 다양한 슬라이드 타입
 * - 브랜드 스타일 변수 적용
 * - 이미지 슬롯 지원
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-05
 */

'use client';

import React from 'react';
import type {
  PresentationSlideData,
  PresentationSlideType,
  BrandStyleVars,
  ImageSlot,
} from '@/types/htmlTemplates';
import { createPlaceholderUrl } from '@/types/htmlTemplates';

// =============================================================================
// Slide Container
// =============================================================================

interface SlideContainerProps {
  children: React.ReactNode;
  brandStyle: BrandStyleVars;
  aspectRatio?: '16:9' | '4:3';
  slideNumber?: number;
  totalSlides?: number;
}

export function SlideContainer({
  children,
  brandStyle,
  aspectRatio = '16:9',
  slideNumber,
  totalSlides,
}: SlideContainerProps) {
  const dimensions = aspectRatio === '16:9'
    ? { width: 1920, height: 1080 }
    : { width: 1024, height: 768 };

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: '100%',
        aspectRatio: aspectRatio.replace(':', '/'),
        backgroundColor: brandStyle.backgroundColor,
        color: brandStyle.textColor,
        fontFamily: brandStyle.bodyFont,
        '--primary-color': brandStyle.primaryColor,
        '--secondary-color': brandStyle.secondaryColor || brandStyle.primaryColor,
        '--accent-color': brandStyle.accentColor || brandStyle.primaryColor,
      } as React.CSSProperties}
    >
      {children}

      {/* 슬라이드 번호 */}
      {slideNumber && totalSlides && (
        <div className="absolute bottom-4 right-6 text-sm opacity-50">
          {slideNumber} / {totalSlides}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Image Component with Placeholder
// =============================================================================

interface SlideImageProps {
  slot: ImageSlot;
  brandStyle: BrandStyleVars;
  className?: string;
  objectFit?: 'cover' | 'contain';
}

function SlideImage({ slot, brandStyle, className = '', objectFit = 'cover' }: SlideImageProps) {
  const imageUrl = slot.generatedUrl
    || slot.placeholderUrl
    || createPlaceholderUrl(slot.width, slot.height, brandStyle.primaryColor, brandStyle.secondaryColor);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={imageUrl}
        alt=""
        className="w-full h-full"
        style={{ objectFit }}
      />
      {slot.status === 'generating' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Cover Slide
// =============================================================================

interface CoverSlideProps {
  data: PresentationSlideData;
}

export function CoverSlide({ data }: CoverSlideProps) {
  const heroImage = data.images.find(img => img.position === 'hero' || img.position === 'background');

  return (
    <SlideContainer
      brandStyle={data.brandStyle}
      slideNumber={data.slideNumber}
      totalSlides={data.totalSlides}
    >
      {/* 배경 이미지 */}
      {heroImage && (
        <div className="absolute inset-0">
          <SlideImage slot={heroImage} brandStyle={data.brandStyle} className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="relative z-10 h-full flex flex-col justify-center px-20">
        <h1
          className="text-6xl font-bold mb-6 max-w-3xl leading-tight"
          style={{
            fontFamily: data.brandStyle.headingFont,
            color: heroImage ? '#ffffff' : data.brandStyle.textColor,
          }}
        >
          {data.headline}
        </h1>
        {data.subheadline && (
          <p
            className="text-2xl max-w-2xl opacity-80"
            style={{ color: heroImage ? '#ffffff' : data.brandStyle.textColor }}
          >
            {data.subheadline}
          </p>
        )}

        {/* 브랜드 악센트 라인 */}
        <div
          className="w-24 h-1.5 mt-8 rounded-full"
          style={{ backgroundColor: data.brandStyle.accentColor || data.brandStyle.primaryColor }}
        />
      </div>
    </SlideContainer>
  );
}

// =============================================================================
// Agenda Slide
// =============================================================================

export function AgendaSlide({ data }: CoverSlideProps) {
  return (
    <SlideContainer
      brandStyle={data.brandStyle}
      slideNumber={data.slideNumber}
      totalSlides={data.totalSlides}
    >
      <div className="h-full flex flex-col px-20 py-16">
        <h2
          className="text-4xl font-bold mb-12"
          style={{ fontFamily: data.brandStyle.headingFont }}
        >
          {data.headline || '목차'}
        </h2>

        <div className="flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-8">
            {data.agendaItems?.map((item, idx) => (
              <div key={idx} className="flex items-center gap-6 p-6 rounded-xl bg-gray-50">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white"
                  style={{ backgroundColor: data.brandStyle.primaryColor }}
                >
                  {idx + 1}
                </div>
                <span className="text-xl">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideContainer>
  );
}

// =============================================================================
// Section Title Slide
// =============================================================================

export function SectionTitleSlide({ data }: CoverSlideProps) {
  return (
    <SlideContainer
      brandStyle={data.brandStyle}
      slideNumber={data.slideNumber}
      totalSlides={data.totalSlides}
    >
      <div
        className="h-full flex flex-col items-center justify-center text-center px-20"
        style={{ backgroundColor: data.brandStyle.primaryColor }}
      >
        <div className="text-lg font-medium text-white/70 mb-4 tracking-wider uppercase">
          Section {data.slideNumber}
        </div>
        <h2
          className="text-5xl font-bold text-white max-w-4xl"
          style={{ fontFamily: data.brandStyle.headingFont }}
        >
          {data.headline}
        </h2>
        {data.subheadline && (
          <p className="text-xl text-white/80 mt-6 max-w-2xl">
            {data.subheadline}
          </p>
        )}
      </div>
    </SlideContainer>
  );
}

// =============================================================================
// Content with Image Slide
// =============================================================================

export function ContentImageSlide({ data }: CoverSlideProps) {
  const contentImage = data.images.find(img => img.position === 'inline' || img.position === 'product');
  const isLeftImage = data.layout === 'left_image';

  return (
    <SlideContainer
      brandStyle={data.brandStyle}
      slideNumber={data.slideNumber}
      totalSlides={data.totalSlides}
    >
      <div className={`h-full flex ${isLeftImage ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* 이미지 영역 */}
        <div className="w-1/2 h-full">
          {contentImage ? (
            <SlideImage slot={contentImage} brandStyle={data.brandStyle} className="w-full h-full" />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${data.brandStyle.primaryColor}20, ${data.brandStyle.secondaryColor || data.brandStyle.primaryColor}10)`,
              }}
            />
          )}
        </div>

        {/* 텍스트 영역 */}
        <div className="w-1/2 h-full flex flex-col justify-center px-16">
          <h3
            className="text-4xl font-bold mb-6"
            style={{ fontFamily: data.brandStyle.headingFont }}
          >
            {data.headline}
          </h3>
          {data.subheadline && (
            <p className="text-xl text-gray-600 mb-6">{data.subheadline}</p>
          )}
          {data.body && (
            <p className="text-lg leading-relaxed text-gray-700">{data.body}</p>
          )}

          {/* 불릿 포인트 */}
          {data.bullets && data.bullets.length > 0 && (
            <ul className="mt-6 space-y-3">
              {data.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: data.brandStyle.primaryColor }}
                  />
                  <span className="text-lg">{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SlideContainer>
  );
}

// =============================================================================
// Bullets Slide
// =============================================================================

export function BulletsSlide({ data }: CoverSlideProps) {
  return (
    <SlideContainer
      brandStyle={data.brandStyle}
      slideNumber={data.slideNumber}
      totalSlides={data.totalSlides}
    >
      <div className="h-full flex flex-col px-20 py-16">
        <h3
          className="text-4xl font-bold mb-12"
          style={{ fontFamily: data.brandStyle.headingFont }}
        >
          {data.headline}
        </h3>

        <div className="flex-1 flex items-center">
          <ul className="space-y-6 w-full max-w-4xl">
            {data.bullets?.map((bullet, idx) => (
              <li key={idx} className="flex items-center gap-6 p-6 rounded-xl bg-gray-50">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: data.brandStyle.primaryColor }}
                >
                  {idx + 1}
                </div>
                <span className="text-xl">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SlideContainer>
  );
}

// =============================================================================
// Stats Slide
// =============================================================================

export function StatsSlide({ data }: CoverSlideProps) {
  return (
    <SlideContainer
      brandStyle={data.brandStyle}
      slideNumber={data.slideNumber}
      totalSlides={data.totalSlides}
    >
      <div className="h-full flex flex-col px-20 py-16">
        <h3
          className="text-4xl font-bold mb-12 text-center"
          style={{ fontFamily: data.brandStyle.headingFont }}
        >
          {data.headline}
        </h3>

        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-12">
            {data.stats?.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div
                  className="text-6xl font-bold mb-4"
                  style={{ color: data.brandStyle.primaryColor }}
                >
                  {stat.value}
                </div>
                <div className="text-xl text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideContainer>
  );
}

// =============================================================================
// Quote Slide
// =============================================================================

export function QuoteSlide({ data }: CoverSlideProps) {
  return (
    <SlideContainer
      brandStyle={data.brandStyle}
      slideNumber={data.slideNumber}
      totalSlides={data.totalSlides}
    >
      <div
        className="h-full flex flex-col items-center justify-center px-20 text-center"
        style={{
          background: `linear-gradient(135deg, ${data.brandStyle.primaryColor}10, ${data.brandStyle.secondaryColor || data.brandStyle.primaryColor}05)`,
        }}
      >
        <div
          className="text-8xl mb-8 opacity-30"
          style={{ color: data.brandStyle.primaryColor }}
        >
          "
        </div>
        <blockquote
          className="text-3xl font-medium max-w-4xl leading-relaxed mb-8"
          style={{ fontFamily: data.brandStyle.headingFont }}
        >
          {data.quote?.text}
        </blockquote>
        <cite className="text-xl text-gray-600 not-italic">
          — {data.quote?.author}
        </cite>
      </div>
    </SlideContainer>
  );
}

// =============================================================================
// CTA Slide
// =============================================================================

export function CTASlide({ data }: CoverSlideProps) {
  const heroImage = data.images.find(img => img.position === 'background');

  return (
    <SlideContainer
      brandStyle={data.brandStyle}
      slideNumber={data.slideNumber}
      totalSlides={data.totalSlides}
    >
      {heroImage && (
        <div className="absolute inset-0">
          <SlideImage slot={heroImage} brandStyle={data.brandStyle} className="w-full h-full" />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}

      <div
        className="relative z-10 h-full flex flex-col items-center justify-center text-center px-20"
        style={{ backgroundColor: heroImage ? 'transparent' : data.brandStyle.primaryColor }}
      >
        <h2
          className="text-5xl font-bold text-white mb-6 max-w-3xl"
          style={{ fontFamily: data.brandStyle.headingFont }}
        >
          {data.cta?.headline || data.headline}
        </h2>
        {(data.cta?.text || data.subheadline) && (
          <p className="text-xl text-white/80 mb-10 max-w-2xl">
            {data.cta?.text || data.subheadline}
          </p>
        )}
        <button
          className="px-10 py-4 text-xl font-semibold rounded-full transition-transform hover:scale-105"
          style={{
            backgroundColor: data.brandStyle.accentColor || '#ffffff',
            color: data.brandStyle.primaryColor,
          }}
        >
          {data.cta?.buttonText || '시작하기'}
        </button>
      </div>
    </SlideContainer>
  );
}

// =============================================================================
// Thank You Slide
// =============================================================================

export function ThankYouSlide({ data }: CoverSlideProps) {
  return (
    <SlideContainer
      brandStyle={data.brandStyle}
      slideNumber={data.slideNumber}
      totalSlides={data.totalSlides}
    >
      <div className="h-full flex flex-col items-center justify-center text-center px-20">
        <h2
          className="text-6xl font-bold mb-8"
          style={{
            fontFamily: data.brandStyle.headingFont,
            color: data.brandStyle.primaryColor,
          }}
        >
          {data.headline || '감사합니다'}
        </h2>
        {data.subheadline && (
          <p className="text-2xl text-gray-600 max-w-2xl">{data.subheadline}</p>
        )}

        {/* 장식 요소 */}
        <div className="flex gap-3 mt-12">
          {[...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: data.brandStyle.primaryColor,
                opacity: 1 - idx * 0.25,
              }}
            />
          ))}
        </div>
      </div>
    </SlideContainer>
  );
}

// =============================================================================
// Slide Router
// =============================================================================

interface PresentationSlideProps {
  data: PresentationSlideData;
}

export function PresentationSlide({ data }: PresentationSlideProps) {
  switch (data.slideType) {
    case 'cover':
      return <CoverSlide data={data} />;
    case 'agenda':
      return <AgendaSlide data={data} />;
    case 'section_title':
      return <SectionTitleSlide data={data} />;
    case 'content_image':
      return <ContentImageSlide data={data} />;
    case 'content_bullets':
      return <BulletsSlide data={data} />;
    case 'stats':
      return <StatsSlide data={data} />;
    case 'quote':
      return <QuoteSlide data={data} />;
    case 'cta':
      return <CTASlide data={data} />;
    case 'thank_you':
      return <ThankYouSlide data={data} />;
    default:
      return <ContentImageSlide data={data} />;
  }
}

// =============================================================================
// Full Presentation Renderer
// =============================================================================

interface PresentationRendererProps {
  slides: PresentationSlideData[];
  currentSlide?: number;
  onSlideChange?: (index: number) => void;
}

export function PresentationRenderer({
  slides,
  currentSlide = 0,
  onSlideChange,
}: PresentationRendererProps) {
  return (
    <div className="w-full">
      {/* 현재 슬라이드 */}
      <div className="w-full rounded-lg overflow-hidden shadow-2xl">
        <PresentationSlide data={slides[currentSlide]} />
      </div>

      {/* 슬라이드 네비게이션 */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => onSlideChange?.(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>

          <div className="flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => onSlideChange?.(idx)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  idx === currentSlide ? 'bg-purple-500' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => onSlideChange?.(Math.min(slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === slides.length - 1}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      )}

      {/* 썸네일 스트립 */}
      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
        {slides.map((slide, idx) => (
          <button
            key={idx}
            onClick={() => onSlideChange?.(idx)}
            className={`flex-shrink-0 w-32 rounded-lg overflow-hidden border-2 transition-all ${
              idx === currentSlide ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="transform scale-[0.0667] origin-top-left" style={{ width: 1920, height: 1080 }}>
              <PresentationSlide data={slide} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default PresentationSlide;
