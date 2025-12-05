/**
 * Detail Page HTML Templates
 *
 * 상세페이지 섹션 HTML 템플릿 컴포넌트
 * - 히어로, 문제제기, 솔루션, 기능, 혜택, CTA 등
 * - 세로 스크롤 레이아웃
 * - 반응형 디자인
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-05
 */

'use client';

import React from 'react';
import type {
  DetailPageSectionData,
  DetailPageSectionType,
  BrandStyleVars,
  ImageSlot,
} from '@/types/htmlTemplates';
import { createPlaceholderUrl } from '@/types/htmlTemplates';

// =============================================================================
// Section Container
// =============================================================================

interface SectionContainerProps {
  children: React.ReactNode;
  brandStyle: BrandStyleVars;
  backgroundColor?: string;
  fullHeight?: boolean;
}

export function SectionContainer({
  children,
  brandStyle,
  backgroundColor,
  fullHeight = false,
}: SectionContainerProps) {
  return (
    <section
      className={`w-full ${fullHeight ? 'min-h-screen' : ''}`}
      style={{
        backgroundColor: backgroundColor || brandStyle.backgroundColor,
        color: brandStyle.textColor,
        fontFamily: brandStyle.bodyFont,
        '--primary-color': brandStyle.primaryColor,
        '--secondary-color': brandStyle.secondaryColor || brandStyle.primaryColor,
        '--accent-color': brandStyle.accentColor || brandStyle.primaryColor,
      } as React.CSSProperties}
    >
      {children}
    </section>
  );
}

// =============================================================================
// Image Component
// =============================================================================

interface SectionImageProps {
  slot: ImageSlot;
  brandStyle: BrandStyleVars;
  className?: string;
  objectFit?: 'cover' | 'contain';
}

function SectionImage({ slot, brandStyle, className = '', objectFit = 'cover' }: SectionImageProps) {
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
// Hero Section
// =============================================================================

interface SectionProps {
  data: DetailPageSectionData;
}

export function HeroSection({ data }: SectionProps) {
  const heroImage = data.images.find(img => img.position === 'hero' || img.position === 'background');

  return (
    <SectionContainer brandStyle={data.brandStyle} fullHeight>
      <div className="relative min-h-screen flex items-center">
        {/* 배경 이미지 */}
        {heroImage && (
          <div className="absolute inset-0">
            <SectionImage slot={heroImage} brandStyle={data.brandStyle} className="w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <h1
              className="text-5xl md:text-7xl font-bold mb-8 leading-tight"
              style={{
                fontFamily: data.brandStyle.headingFont,
                color: heroImage ? '#ffffff' : data.brandStyle.textColor,
              }}
            >
              {data.headline}
            </h1>
            {data.subheadline && (
              <p
                className="text-xl md:text-2xl mb-10 leading-relaxed"
                style={{ color: heroImage ? 'rgba(255,255,255,0.9)' : data.brandStyle.textColor }}
              >
                {data.subheadline}
              </p>
            )}
            {data.cta && (
              <button
                className="px-8 py-4 text-lg font-semibold rounded-full transition-all hover:scale-105 hover:shadow-lg"
                style={{
                  backgroundColor: data.brandStyle.accentColor || data.brandStyle.primaryColor,
                  color: '#ffffff',
                }}
              >
                {data.cta.buttonText}
              </button>
            )}
          </div>
        </div>

        {/* 스크롤 인디케이터 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 rounded-full border-2 border-white/50 flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/70 rounded-full" />
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}

// =============================================================================
// Problem Section
// =============================================================================

export function ProblemSection({ data }: SectionProps) {
  return (
    <SectionContainer brandStyle={data.brandStyle} backgroundColor="#f9fafb">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span
            className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-6"
            style={{
              backgroundColor: `${data.brandStyle.primaryColor}15`,
              color: data.brandStyle.primaryColor,
            }}
          >
            문제
          </span>
          <h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ fontFamily: data.brandStyle.headingFont }}
          >
            {data.headline}
          </h2>
          {data.subheadline && (
            <p className="text-xl text-gray-600">{data.subheadline}</p>
          )}
        </div>

        {data.body && (
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-700 leading-relaxed text-center">{data.body}</p>
          </div>
        )}

        {/* 문제점 카드 */}
        {data.benefits && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {data.benefits.map((item, idx) => (
              <div key={idx} className="p-8 bg-white rounded-2xl shadow-lg">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-6"
                  style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}
                >
                  ✕
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionContainer>
  );
}

// =============================================================================
// Solution Section
// =============================================================================

export function SolutionSection({ data }: SectionProps) {
  const productImage = data.images.find(img => img.position === 'product' || img.position === 'inline');

  return (
    <SectionContainer brandStyle={data.brandStyle}>
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className={`flex flex-col ${data.layout === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-16`}>
          {/* 이미지 */}
          <div className="w-full md:w-1/2">
            {productImage ? (
              <SectionImage
                slot={productImage}
                brandStyle={data.brandStyle}
                className="w-full aspect-square rounded-3xl shadow-2xl"
              />
            ) : (
              <div
                className="w-full aspect-square rounded-3xl"
                style={{
                  background: `linear-gradient(135deg, ${data.brandStyle.primaryColor}20, ${data.brandStyle.secondaryColor || data.brandStyle.primaryColor}10)`,
                }}
              />
            )}
          </div>

          {/* 텍스트 */}
          <div className="w-full md:w-1/2">
            <span
              className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-6"
              style={{
                backgroundColor: `${data.brandStyle.primaryColor}15`,
                color: data.brandStyle.primaryColor,
              }}
            >
              솔루션
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: data.brandStyle.headingFont }}
            >
              {data.headline}
            </h2>
            {data.subheadline && (
              <p className="text-xl text-gray-600 mb-8">{data.subheadline}</p>
            )}
            {data.body && (
              <p className="text-lg text-gray-700 leading-relaxed">{data.body}</p>
            )}
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}

// =============================================================================
// Features Section
// =============================================================================

export function FeaturesSection({ data }: SectionProps) {
  return (
    <SectionContainer brandStyle={data.brandStyle} backgroundColor="#f9fafb">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span
            className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-6"
            style={{
              backgroundColor: `${data.brandStyle.primaryColor}15`,
              color: data.brandStyle.primaryColor,
            }}
          >
            주요 기능
          </span>
          <h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ fontFamily: data.brandStyle.headingFont }}
          >
            {data.headline}
          </h2>
          {data.subheadline && (
            <p className="text-xl text-gray-600">{data.subheadline}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.features?.map((feature, idx) => (
            <div
              key={idx}
              className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6"
                style={{
                  backgroundColor: `${data.brandStyle.primaryColor}15`,
                  color: data.brandStyle.primaryColor,
                }}
              >
                {feature.icon || '✦'}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}

// =============================================================================
// Benefits Section
// =============================================================================

export function BenefitsSection({ data }: SectionProps) {
  return (
    <SectionContainer brandStyle={data.brandStyle}>
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ fontFamily: data.brandStyle.headingFont }}
          >
            {data.headline}
          </h2>
          {data.subheadline && (
            <p className="text-xl text-gray-600">{data.subheadline}</p>
          )}
        </div>

        <div className="space-y-8">
          {data.benefits?.map((benefit, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 p-8 rounded-3xl`}
              style={{ backgroundColor: idx % 2 === 0 ? '#f9fafb' : 'transparent' }}
            >
              <div className="w-full md:w-1/2">
                <div
                  className="text-6xl font-bold opacity-20 mb-4"
                  style={{ color: data.brandStyle.primaryColor }}
                >
                  0{idx + 1}
                </div>
                <h3 className="text-2xl font-bold mb-4">{benefit.title}</h3>
                <p className="text-lg text-gray-600">{benefit.description}</p>
              </div>
              <div className="w-full md:w-1/2">
                {data.images[idx] ? (
                  <SectionImage
                    slot={data.images[idx]}
                    brandStyle={data.brandStyle}
                    className="w-full aspect-video rounded-2xl"
                  />
                ) : (
                  <div
                    className="w-full aspect-video rounded-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${data.brandStyle.primaryColor}15, ${data.brandStyle.secondaryColor || data.brandStyle.primaryColor}08)`,
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}

// =============================================================================
// How It Works Section
// =============================================================================

export function HowItWorksSection({ data }: SectionProps) {
  return (
    <SectionContainer brandStyle={data.brandStyle} backgroundColor="#f9fafb">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span
            className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-6"
            style={{
              backgroundColor: `${data.brandStyle.primaryColor}15`,
              color: data.brandStyle.primaryColor,
            }}
          >
            사용 방법
          </span>
          <h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ fontFamily: data.brandStyle.headingFont }}
          >
            {data.headline}
          </h2>
        </div>

        <div className="relative">
          {/* 연결선 */}
          <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-gray-200" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {data.steps?.map((step, idx) => (
              <div key={idx} className="relative text-center">
                <div
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold text-white mb-6 relative z-10"
                  style={{ backgroundColor: data.brandStyle.primaryColor }}
                >
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}

// =============================================================================
// Testimonial Section
// =============================================================================

export function TestimonialSection({ data }: SectionProps) {
  return (
    <SectionContainer brandStyle={data.brandStyle}>
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ fontFamily: data.brandStyle.headingFont }}
          >
            {data.headline || '고객 후기'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.testimonials?.map((testimonial, idx) => (
            <div key={idx} className="p-8 bg-gray-50 rounded-2xl">
              <div
                className="text-4xl mb-4 opacity-30"
                style={{ color: data.brandStyle.primaryColor }}
              >
                "
              </div>
              <p className="text-lg text-gray-700 mb-6">{testimonial.quote}</p>
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: data.brandStyle.primaryColor }}
                >
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  {testimonial.role && (
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}

// =============================================================================
// CTA Section
// =============================================================================

export function CTASection({ data }: SectionProps) {
  const bgImage = data.images.find(img => img.position === 'background');

  return (
    <SectionContainer brandStyle={data.brandStyle}>
      <div className="relative py-24">
        {bgImage ? (
          <>
            <div className="absolute inset-0">
              <SectionImage slot={bgImage} brandStyle={data.brandStyle} className="w-full h-full" />
              <div className="absolute inset-0 bg-black/60" />
            </div>
            <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
              <h2
                className="text-4xl md:text-5xl font-bold mb-6 text-white"
                style={{ fontFamily: data.brandStyle.headingFont }}
              >
                {data.cta?.headline || data.headline}
              </h2>
              {data.cta?.subheadline && (
                <p className="text-xl text-white/80 mb-10">{data.cta.subheadline}</p>
              )}
              <button
                className="px-10 py-5 text-lg font-semibold rounded-full transition-all hover:scale-105"
                style={{
                  backgroundColor: data.brandStyle.accentColor || '#ffffff',
                  color: data.brandStyle.primaryColor,
                }}
              >
                {data.cta?.buttonText || '시작하기'}
              </button>
            </div>
          </>
        ) : (
          <div
            className="max-w-4xl mx-auto text-center px-6 py-16 rounded-3xl"
            style={{ backgroundColor: data.brandStyle.primaryColor }}
          >
            <h2
              className="text-4xl md:text-5xl font-bold mb-6 text-white"
              style={{ fontFamily: data.brandStyle.headingFont }}
            >
              {data.cta?.headline || data.headline}
            </h2>
            {data.cta?.subheadline && (
              <p className="text-xl text-white/80 mb-10">{data.cta.subheadline}</p>
            )}
            <button
              className="px-10 py-5 text-lg font-semibold rounded-full bg-white transition-all hover:scale-105"
              style={{ color: data.brandStyle.primaryColor }}
            >
              {data.cta?.buttonText || '시작하기'}
            </button>
          </div>
        )}
      </div>
    </SectionContainer>
  );
}

// =============================================================================
// Section Router
// =============================================================================

interface DetailPageSectionProps {
  data: DetailPageSectionData;
}

export function DetailPageSection({ data }: DetailPageSectionProps) {
  switch (data.sectionType) {
    case 'hero':
      return <HeroSection data={data} />;
    case 'problem':
      return <ProblemSection data={data} />;
    case 'solution':
      return <SolutionSection data={data} />;
    case 'features':
      return <FeaturesSection data={data} />;
    case 'benefits':
      return <BenefitsSection data={data} />;
    case 'how_it_works':
      return <HowItWorksSection data={data} />;
    case 'testimonial':
      return <TestimonialSection data={data} />;
    case 'cta':
      return <CTASection data={data} />;
    default:
      return <FeaturesSection data={data} />;
  }
}

// =============================================================================
// Full Detail Page Renderer
// =============================================================================

interface DetailPageRendererProps {
  sections: DetailPageSectionData[];
}

export function DetailPageRenderer({ sections }: DetailPageRendererProps) {
  return (
    <div className="w-full">
      {sections.map((section, idx) => (
        <DetailPageSection key={idx} data={section} />
      ))}
    </div>
  );
}

export default DetailPageSection;
