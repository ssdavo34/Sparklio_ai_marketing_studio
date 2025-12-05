/**
 * HTML Template Types
 *
 * HTML 기반 마케팅 산출물 템플릿 타입 정의
 * - 프레젠테이션 슬라이드
 * - 상세페이지 섹션
 * - 인스타그램 광고
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-05
 */

// =============================================================================
// Common Types
// =============================================================================

/**
 * 브랜드 스타일 변수
 */
export interface BrandStyleVars {
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
}

/**
 * 이미지 슬롯 정보
 */
export interface ImageSlot {
  id: string;
  position: 'hero' | 'background' | 'inline' | 'product' | 'lifestyle';
  width: number;
  height: number;
  prompt?: string;
  generatedUrl?: string;
  placeholderUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

/**
 * 템플릿 데이터 기본 인터페이스
 */
export interface BaseTemplateData {
  brandStyle: BrandStyleVars;
  images: ImageSlot[];
}

// =============================================================================
// Presentation Templates
// =============================================================================

/**
 * 프레젠테이션 슬라이드 타입
 */
export type PresentationSlideType =
  | 'cover'           // 표지
  | 'agenda'          // 목차
  | 'section_title'   // 섹션 타이틀
  | 'content_image'   // 이미지 + 텍스트
  | 'content_bullets' // 불릿 포인트
  | 'stats'           // 통계/숫자
  | 'quote'           // 인용문
  | 'comparison'      // 비교
  | 'cta'             // CTA/마무리
  | 'thank_you';      // 감사 페이지

/**
 * 프레젠테이션 슬라이드 데이터
 */
export interface PresentationSlideData extends BaseTemplateData {
  slideType: PresentationSlideType;
  slideNumber: number;
  totalSlides: number;

  // 공통 필드
  headline?: string;
  subheadline?: string;
  body?: string;

  // 슬라이드 타입별 필드
  bullets?: string[];
  stats?: { value: string; label: string }[];
  quote?: { text: string; author: string };
  comparison?: { left: { title: string; points: string[] }; right: { title: string; points: string[] } };
  cta?: { headline?: string; text?: string; buttonText: string };
  agendaItems?: string[];

  // 레이아웃 옵션
  layout: 'left_image' | 'right_image' | 'full_image' | 'no_image' | 'split';
}

/**
 * 프레젠테이션 전체 데이터
 */
export interface PresentationData {
  title: string;
  slides: PresentationSlideData[];
  brandStyle: BrandStyleVars;
  aspectRatio: '16:9' | '4:3';
}

// =============================================================================
// Detail Page Templates
// =============================================================================

/**
 * 상세페이지 섹션 타입
 */
export type DetailPageSectionType =
  | 'hero'            // 히어로 배너
  | 'problem'         // 문제 제기
  | 'solution'        // 솔루션 소개
  | 'features'        // 기능/특징
  | 'benefits'        // 혜택
  | 'how_it_works'    // 사용 방법
  | 'testimonial'     // 고객 후기
  | 'pricing'         // 가격
  | 'faq'             // FAQ
  | 'cta';            // CTA

/**
 * 상세페이지 섹션 데이터
 */
export interface DetailPageSectionData extends BaseTemplateData {
  sectionType: DetailPageSectionType;
  sectionNumber: number;

  // 공통 필드
  headline?: string;
  subheadline?: string;
  body?: string;

  // 섹션 타입별 필드
  features?: { icon?: string; title: string; description: string }[];
  benefits?: { title: string; description: string }[];
  steps?: { number: number; title: string; description: string }[];
  testimonials?: { quote: string; author: string; role?: string; avatar?: string }[];
  faqs?: { question: string; answer: string }[];
  pricing?: { name: string; price: string; features: string[]; cta: string; highlighted?: boolean }[];
  cta?: { headline: string; subheadline?: string; buttonText: string; buttonUrl?: string };

  // 레이아웃 옵션
  layout: 'center' | 'left' | 'right' | 'grid' | 'alternating';
  backgroundColor?: string;
}

/**
 * 상세페이지 전체 데이터
 */
export interface DetailPageData {
  title: string;
  sections: DetailPageSectionData[];
  brandStyle: BrandStyleVars;
}

// =============================================================================
// Instagram Ad Templates
// =============================================================================

/**
 * 인스타그램 광고 타입
 */
export type InstagramAdType =
  | 'single_image'    // 단일 이미지
  | 'carousel'        // 캐러셀
  | 'story';          // 스토리

/**
 * 인스타그램 광고 레이아웃
 */
export type InstagramAdLayout =
  | 'text_overlay'    // 이미지 위에 텍스트
  | 'text_bottom'     // 하단 텍스트 영역
  | 'text_top'        // 상단 텍스트 영역
  | 'minimal'         // 미니멀 (로고 + CTA만)
  | 'bold';           // 대담한 타이포그래피

/**
 * 인스타그램 광고 데이터
 */
export interface InstagramAdData extends BaseTemplateData {
  adType: InstagramAdType;
  format: 'feed' | 'story';  // 1:1 or 9:16

  // 카피
  headline: string;
  subheadline?: string;
  cta: string;
  hashtags?: string[];

  // 브랜드
  logoUrl?: string;
  brandName?: string;

  // 레이아웃
  layout: InstagramAdLayout;
  textPosition: 'top' | 'center' | 'bottom';
  textAlignment: 'left' | 'center' | 'right';

  // 캐러셀용
  carouselIndex?: number;
  totalCarousel?: number;
}

/**
 * 인스타그램 광고 세트 데이터
 */
export interface InstagramAdSetData {
  ads: InstagramAdData[];
  brandStyle: BrandStyleVars;
  format: 'feed' | 'story';
}

// =============================================================================
// Image Prompt Generation
// =============================================================================

/**
 * 이미지 프롬프트 생성 컨텍스트
 */
export interface ImagePromptContext {
  // 컨셉 정보
  conceptName: string;
  headline: string;
  targetAudience: string;
  tone: string;

  // 비주얼 월드
  colorPalette: string[];
  photoStyle: string;
  mood: string;

  // 슬롯 정보
  slotPosition: ImageSlot['position'];
  aspectRatio: string;

  // 채널 정보
  channel: 'presentation' | 'detail_page' | 'instagram';
  channelContext?: string;  // 예: "히어로 섹션", "3번째 슬라이드"
}

/**
 * 생성된 이미지 프롬프트
 */
export interface GeneratedImagePrompt {
  slotId: string;
  prompt: string;
  negativePrompt: string;
  style: 'photorealistic' | 'illustration' | 'minimal' | 'product' | 'lifestyle';
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3';
  seed?: number;
}

// =============================================================================
// Template Registry
// =============================================================================

/**
 * 템플릿 메타데이터
 */
export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: 'presentation' | 'detail_page' | 'instagram';
  thumbnail?: string;
  tags: string[];
}

/**
 * 템플릿 레지스트리
 */
export interface TemplateRegistry {
  presentations: Record<string, TemplateMetadata>;
  detailPages: Record<string, TemplateMetadata>;
  instagram: Record<string, TemplateMetadata>;
}

// =============================================================================
// Render Output
// =============================================================================

/**
 * 렌더링 결과
 */
export interface RenderOutput {
  html: string;
  css: string;
  width: number;
  height: number;
  images: ImageSlot[];
}

/**
 * Export 옵션
 */
export interface ExportOptions {
  format: 'png' | 'jpg' | 'pdf' | 'html';
  quality: 'draft' | 'standard' | 'high';
  scale: number;  // 1 = 원본, 2 = 2배 해상도
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 기본 브랜드 스타일 생성
 */
export function createDefaultBrandStyle(primaryColor: string = '#6366f1'): BrandStyleVars {
  return {
    primaryColor,
    secondaryColor: '#8b5cf6',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    headingFont: 'Pretendard, sans-serif',
    bodyFont: 'Pretendard, sans-serif',
  };
}

/**
 * 이미지 슬롯 생성
 */
export function createImageSlot(
  id: string,
  position: ImageSlot['position'],
  width: number,
  height: number
): ImageSlot {
  return {
    id,
    position,
    width,
    height,
    status: 'pending',
  };
}

/**
 * 플레이스홀더 URL 생성 (그라데이션 SVG)
 */
export function createPlaceholderUrl(
  width: number,
  height: number,
  primaryColor: string,
  secondaryColor: string = '#8b5cf6'
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:0.6" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <text x="50%" y="50%" font-family="sans-serif" font-size="14" fill="white" text-anchor="middle" dy=".3em" opacity="0.7">
        이미지 생성 중...
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
