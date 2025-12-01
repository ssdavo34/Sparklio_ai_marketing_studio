/**
 * Brand Identity Canvas Template V2
 *
 * Brand DNA 데이터를 Polotno Canvas 다중 페이지로 변환
 * - Brand DNA V1/V2 지원
 * - 다중 페이지 자동 생성 (Brand Core, Messages, Audience, Guidelines 등)
 * - 브랜드 색상, 폰트, 톤앤매너 자동 적용
 * - 세로 형식(1080x1920) 기본 지원
 *
 * @author C팀 (Frontend Team)
 * @version 2.1
 * @date 2025-12-01
 */

import type { BrandDNA as BrandDNAFromAPI } from '@/lib/api/brand-api';
import type { BrandDNAV2, BrandDNAUnion, isBrandDNAV2 } from '@/types/brand';

// ============================================================================
// Types
// ============================================================================

interface CanvasElement {
  type: 'text' | 'svg';
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fill?: string;
  text?: string;
  align?: 'left' | 'center' | 'right';
  src?: string; // SVG data URL
  [key: string]: any;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 색상 박스 SVG 생성
 */
function createColorBoxSvg(width: number, height: number, color: string, cornerRadius: number = 8): string {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" rx="${cornerRadius}" ry="${cornerRadius}" fill="${color}" />
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * 배경 그라디언트 SVG 생성
 */
function createGradientBackgroundSvg(width: number, height: number, color1: string, color2: string): string {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color1};stop-opacity:0.1" />
        <stop offset="100%" style="stop-color:${color2};stop-opacity:0.1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" />
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * 단색 배경 SVG 생성
 */
function createSolidBackgroundSvg(width: number, height: number, color: string, opacity: number = 1): string {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${color}" fill-opacity="${opacity}" />
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * 둥근 모서리 박스 SVG 생성
 */
function createRoundedBoxSvg(width: number, height: number, color: string, cornerRadius: number = 16, opacity: number = 1): string {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" rx="${cornerRadius}" ry="${cornerRadius}" fill="${color}" fill-opacity="${opacity}" />
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// ============================================================================
// Brand Identity Canvas Generator
// ============================================================================

/**
 * Brand DNA를 Canvas 페이지로 변환 (V1 - BrandDNAOutputV1 스키마 기준)
 * 세로 형식(1080x1920) 기본 지원 - 단일 열 레이아웃
 */
export function createBrandIdentityCanvas(dna: BrandDNAFromAPI, pageWidth: number = 1080, pageHeight: number = 1920): CanvasElement[] {
  const elements: CanvasElement[] = [];

  const margin = 60;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // 브랜드 색상 추출
  const primaryColor = dna.suggested_brand_kit.primary_colors[0] || '#6366F1';
  const secondaryColor = dna.suggested_brand_kit.secondary_colors[0] || '#8B5CF6';

  // 배경 그라디언트 (SVG 사용)
  elements.push({
    type: 'svg',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    src: createGradientBackgroundSvg(pageWidth, pageHeight, primaryColor, secondaryColor),
  });

  // 제목
  elements.push({
    type: 'text',
    x: margin,
    y: currentY,
    width: contentWidth,
    fontSize: 48,
    fontWeight: 'bold',
    fill: primaryColor,
    text: 'Brand Identity Canvas',
    fontFamily: 'Pretendard',
    align: 'center',
  });
  currentY += 80;

  // ========================================
  // Tone & Manner 섹션
  // ========================================
  elements.push({
    type: 'text',
    x: margin,
    y: currentY,
    width: contentWidth,
    fontSize: 28,
    fontWeight: 'bold',
    fill: '#1F2937',
    text: '🎨 Tone & Manner',
  });
  currentY += 45;

  // tone은 string 타입 (BrandDNAOutputV1 기준)
  elements.push({
    type: 'text',
    x: margin + 16,
    y: currentY,
    width: contentWidth - 32,
    fontSize: 18,
    fill: '#4B5563',
    text: dna.tone,
    lineHeight: 1.5,
  });
  currentY += 100;

  // ========================================
  // Key Messages 섹션
  // ========================================
  elements.push({
    type: 'text',
    x: margin,
    y: currentY,
    width: contentWidth,
    fontSize: 28,
    fontWeight: 'bold',
    fill: '#1F2937',
    text: '💬 Key Messages',
  });
  currentY += 45;

  dna.key_messages.slice(0, 4).forEach((msg, idx) => {
    elements.push({
      type: 'text',
      x: margin + 16,
      y: currentY,
      width: contentWidth - 32,
      fontSize: 16,
      fill: '#374151',
      text: `${idx + 1}. ${msg}`,
      lineHeight: 1.4,
    });
    currentY += 40;
  });
  currentY += 30;

  // ========================================
  // Target Audience 섹션
  // ========================================
  elements.push({
    type: 'text',
    x: margin,
    y: currentY,
    width: contentWidth,
    fontSize: 28,
    fontWeight: 'bold',
    fill: '#1F2937',
    text: '👥 Target Audience',
  });
  currentY += 45;

  // target_audience는 string 타입 (BrandDNAOutputV1 기준)
  elements.push({
    type: 'text',
    x: margin + 16,
    y: currentY,
    width: contentWidth - 32,
    fontSize: 18,
    fill: '#374151',
    text: dna.target_audience,
    lineHeight: 1.5,
  });
  currentY += 100;

  // ========================================
  // Do's 섹션
  // ========================================
  // Do's 배경 박스
  const dosBoxHeight = Math.max(180, dna.dos.length * 36 + 60);
  elements.push({
    type: 'svg',
    x: margin,
    y: currentY,
    width: contentWidth,
    height: dosBoxHeight,
    src: createRoundedBoxSvg(contentWidth, dosBoxHeight, '#ECFDF5', 12, 1),
  });

  elements.push({
    type: 'text',
    x: margin + 20,
    y: currentY + 20,
    width: contentWidth - 40,
    fontSize: 24,
    fontWeight: 'bold',
    fill: '#059669',
    text: '✅ Do\'s',
  });

  let doY = currentY + 55;
  dna.dos.slice(0, 5).forEach((item) => {
    elements.push({
      type: 'text',
      x: margin + 24,
      y: doY,
      width: contentWidth - 48,
      fontSize: 15,
      fill: '#047857',
      text: `• ${item}`,
      lineHeight: 1.3,
    });
    doY += 34;
  });
  currentY += dosBoxHeight + 20;

  // ========================================
  // Don'ts 섹션
  // ========================================
  // Don'ts 배경 박스
  const dontsBoxHeight = Math.max(180, dna.donts.length * 36 + 60);
  elements.push({
    type: 'svg',
    x: margin,
    y: currentY,
    width: contentWidth,
    height: dontsBoxHeight,
    src: createRoundedBoxSvg(contentWidth, dontsBoxHeight, '#FEF2F2', 12, 1),
  });

  elements.push({
    type: 'text',
    x: margin + 20,
    y: currentY + 20,
    width: contentWidth - 40,
    fontSize: 24,
    fontWeight: 'bold',
    fill: '#DC2626',
    text: '❌ Don\'ts',
  });

  let dontY = currentY + 55;
  dna.donts.slice(0, 5).forEach((item) => {
    elements.push({
      type: 'text',
      x: margin + 24,
      y: dontY,
      width: contentWidth - 48,
      fontSize: 15,
      fill: '#B91C1C',
      text: `• ${item}`,
      lineHeight: 1.3,
    });
    dontY += 34;
  });
  currentY += dontsBoxHeight + 40;

  // ========================================
  // Brand Colors 섹션
  // ========================================
  elements.push({
    type: 'text',
    x: margin,
    y: currentY,
    width: contentWidth,
    fontSize: 28,
    fontWeight: 'bold',
    fill: '#1F2937',
    text: '🎨 Brand Colors',
  });
  currentY += 50;

  // 색상 박스 크기 계산 (세로 형식에 맞게 조정)
  const allColors = [
    ...dna.suggested_brand_kit.primary_colors,
    ...dna.suggested_brand_kit.secondary_colors,
  ];
  const colorCount = allColors.length;
  const colorGap = 16;
  const maxColorBoxSize = 100;
  const availableWidth = contentWidth - 32;
  const colorBoxSize = Math.min(maxColorBoxSize, (availableWidth - (colorCount - 1) * colorGap) / colorCount);

  // 색상 박스들을 가운데 정렬
  const totalColorWidth = colorCount * colorBoxSize + (colorCount - 1) * colorGap;
  let colorX = margin + (contentWidth - totalColorWidth) / 2;

  // Primary Colors 라벨
  elements.push({
    type: 'text',
    x: margin + 16,
    y: currentY,
    width: contentWidth - 32,
    fontSize: 14,
    fontWeight: 'bold',
    fill: '#6B7280',
    text: 'PRIMARY',
  });
  currentY += 25;

  // Primary Colors
  let primaryColorX = colorX;
  dna.suggested_brand_kit.primary_colors.forEach((color) => {
    // 색상 박스 (SVG 사용)
    elements.push({
      type: 'svg',
      x: primaryColorX,
      y: currentY,
      width: colorBoxSize,
      height: colorBoxSize,
      src: createColorBoxSvg(colorBoxSize, colorBoxSize, color, 10),
    });
    // 색상 코드
    elements.push({
      type: 'text',
      x: primaryColorX,
      y: currentY + colorBoxSize + 8,
      width: colorBoxSize,
      fontSize: 11,
      fill: '#6B7280',
      text: color,
      align: 'center',
    });
    primaryColorX += colorBoxSize + colorGap;
  });

  // Secondary Colors 라벨 및 박스 (Primary 옆에)
  if (dna.suggested_brand_kit.secondary_colors.length > 0) {
    // Secondary 라벨
    elements.push({
      type: 'text',
      x: primaryColorX + 10,
      y: currentY - 25,
      width: 100,
      fontSize: 14,
      fontWeight: 'bold',
      fill: '#6B7280',
      text: 'SECONDARY',
    });

    dna.suggested_brand_kit.secondary_colors.forEach((color) => {
      // 색상 박스 (SVG 사용)
      elements.push({
        type: 'svg',
        x: primaryColorX,
        y: currentY,
        width: colorBoxSize,
        height: colorBoxSize,
        src: createColorBoxSvg(colorBoxSize, colorBoxSize, color, 10),
      });
      // 색상 코드
      elements.push({
        type: 'text',
        x: primaryColorX,
        y: currentY + colorBoxSize + 8,
        width: colorBoxSize,
        fontSize: 11,
        fill: '#6B7280',
        text: color,
        align: 'center',
      });
      primaryColorX += colorBoxSize + colorGap;
    });
  }

  currentY += colorBoxSize + 60;

  // ========================================
  // Footer - Confidence Score
  // ========================================
  elements.push({
    type: 'text',
    x: margin,
    y: pageHeight - margin - 30,
    width: contentWidth,
    fontSize: 14,
    fill: '#9CA3AF',
    text: `Analysis Confidence: ${(dna.confidence_score * 10).toFixed(0)}%${dna.analysis_notes ? ` | ${dna.analysis_notes}` : ''}`,
    align: 'center',
  });

  return elements;
}

/**
 * Brand DNA를 Polotno Store에 추가 (V1 - 단일 페이지)
 * 기본값: 세로 형식(1080x1920)
 */
export function addBrandIdentityToCanvas(
  polotnoStore: any,
  dna: BrandDNAFromAPI,
  pageWidth: number = 1080,
  pageHeight: number = 1920
): void {
  if (!polotnoStore) {
    throw new Error('Polotno store is not initialized');
  }

  // 새 페이지 추가
  polotnoStore.addPage({
    width: pageWidth,
    height: pageHeight,
  });

  const page = polotnoStore.activePage;
  if (!page) {
    throw new Error('Failed to create new page');
  }

  // Canvas 요소 생성
  const elements = createBrandIdentityCanvas(dna, pageWidth, pageHeight);

  // Polotno 페이지에 요소 추가
  elements.forEach((element) => {
    page.addElement(element);
  });

  console.log(`[BrandIdentityTemplate] Added ${elements.length} elements to canvas`);
}

// ============================================================================
// V2: Multi-Page Brand Identity Canvas (Repomix 기준 풍부한 구조)
// ============================================================================

interface PageConfig {
  title: string;
  elements: CanvasElement[];
}

/**
 * Brand DNA V2를 다중 페이지 Canvas로 변환
 *
 * 페이지 구성:
 * 1. Cover Page: 브랜드 한줄정의 + 핵심 메시지
 * 2. Brand Core: Purpose, Promise, Personality
 * 3. Tone & Manner: 톤 요약, 키워드, 보이스 스타일
 * 4. Target Audience: Primary/Secondary 세그먼트
 * 5. Message Pillars: 서브 메시지 기둥들
 * 6. Do's & Don'ts: 가이드라인
 * 7. Visual Direction: 비주얼 방향성 + 컬러 팔레트
 */
export function createBrandIdentityCanvasV2(
  dna: BrandDNAV2,
  pageWidth: number = 1920,
  pageHeight: number = 1080
): PageConfig[] {
  const pages: PageConfig[] = [];

  // 브랜드 색상 추출
  const primaryColor = dna.suggested_brand_kit.primary_colors[0] || '#6366F1';
  const secondaryColor = dna.suggested_brand_kit.secondary_colors[0] || '#8B5CF6';
  const margin = 80;
  const contentWidth = pageWidth - margin * 2;

  // ========================================
  // Page 1: Cover Page (브랜드 핵심)
  // ========================================
  const coverElements: CanvasElement[] = [];
  let y = margin;

  // 배경 (SVG 사용)
  coverElements.push({
    type: 'svg',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    src: createGradientBackgroundSvg(pageWidth, pageHeight, primaryColor, secondaryColor),
  });

  // Brand Identity Canvas 타이틀
  coverElements.push({
    type: 'text',
    x: margin,
    y: y,
    width: contentWidth,
    fontSize: 24,
    fontWeight: 'medium',
    fill: '#6B7280',
    text: 'BRAND IDENTITY CANVAS',
    fontFamily: 'Pretendard',
  });
  y += 50;

  // 브랜드 한줄정의 (One-liner)
  coverElements.push({
    type: 'text',
    x: margin,
    y: y,
    width: contentWidth,
    fontSize: 64,
    fontWeight: 'bold',
    fill: primaryColor,
    text: dna.brand_core.one_liner,
    fontFamily: 'Pretendard',
  });
  y += 120;

  // 메인 메시지
  coverElements.push({
    type: 'text',
    x: margin,
    y: y,
    width: contentWidth,
    fontSize: 36,
    fontWeight: 'medium',
    fill: '#1F2937',
    text: `"${dna.message_structure.main_message}"`,
    fontFamily: 'Pretendard',
  });
  y += 80;

  // Personality 키워드 (칩 형태)
  const chipStartX = margin;
  let chipX = chipStartX;
  const chipY = y + 60;
  dna.brand_core.personality.forEach((keyword, idx) => {
    const chipWidth = keyword.length * 20 + 40;
    coverElements.push({
      type: 'svg',
      x: chipX,
      y: chipY,
      width: chipWidth,
      height: 44,
      src: createRoundedBoxSvg(chipWidth, 44, primaryColor, 22, 0.15),
    });
    coverElements.push({
      type: 'text',
      x: chipX + 20,
      y: chipY + 12,
      width: chipWidth - 40,
      fontSize: 18,
      fill: primaryColor,
      fontWeight: 'medium',
      text: keyword,
    });
    chipX += chipWidth + 16;
  });

  // 신뢰도 점수 (하단)
  coverElements.push({
    type: 'text',
    x: margin,
    y: pageHeight - margin - 40,
    width: contentWidth,
    fontSize: 16,
    fill: '#9CA3AF',
    text: `Analysis Confidence: ${dna.confidence_score.toFixed(1)}/10`,
  });

  pages.push({ title: 'Cover', elements: coverElements });

  // ========================================
  // Page 2: Brand Core (Purpose, Promise)
  // ========================================
  const coreElements: CanvasElement[] = [];
  y = margin;

  // 배경 (SVG 사용)
  coreElements.push({
    type: 'svg',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    src: createSolidBackgroundSvg(pageWidth, pageHeight, '#FAFAFA'),
  });

  // 섹션 타이틀
  coreElements.push({
    type: 'text',
    x: margin,
    y: y,
    width: contentWidth,
    fontSize: 48,
    fontWeight: 'bold',
    fill: primaryColor,
    text: '🎯 Brand Core',
  });
  y += 80;

  // Purpose
  coreElements.push({
    type: 'text',
    x: margin,
    y: y,
    fontSize: 24,
    fontWeight: 'bold',
    fill: '#374151',
    text: 'PURPOSE (Why we exist)',
  });
  y += 40;

  coreElements.push({
    type: 'text',
    x: margin + 20,
    y: y,
    width: contentWidth - 40,
    fontSize: 28,
    fill: '#1F2937',
    text: dna.brand_core.purpose,
  });
  y += 100;

  // Promise
  coreElements.push({
    type: 'text',
    x: margin,
    y: y,
    fontSize: 24,
    fontWeight: 'bold',
    fill: '#374151',
    text: 'PROMISE (What we promise)',
  });
  y += 40;

  coreElements.push({
    type: 'text',
    x: margin + 20,
    y: y,
    width: contentWidth - 40,
    fontSize: 28,
    fill: '#1F2937',
    text: dna.brand_core.promise,
  });

  pages.push({ title: 'Brand Core', elements: coreElements });

  // ========================================
  // Page 3: Tone & Manner
  // ========================================
  const toneElements: CanvasElement[] = [];
  y = margin;

  toneElements.push({
    type: 'svg',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    src: createGradientBackgroundSvg(pageWidth, pageHeight, primaryColor, secondaryColor),
  });

  toneElements.push({
    type: 'text',
    x: margin,
    y: y,
    fontSize: 48,
    fontWeight: 'bold',
    fill: primaryColor,
    text: '🎨 Tone & Manner',
  });
  y += 80;

  // Summary
  toneElements.push({
    type: 'text',
    x: margin,
    y: y,
    width: contentWidth,
    fontSize: 32,
    fontWeight: 'medium',
    fill: '#1F2937',
    text: dna.tone_and_manner.summary,
  });
  y += 100;

  // Voice Style
  toneElements.push({
    type: 'text',
    x: margin,
    y: y,
    fontSize: 20,
    fontWeight: 'bold',
    fill: '#6B7280',
    text: 'VOICE STYLE',
  });
  y += 35;

  toneElements.push({
    type: 'text',
    x: margin + 20,
    y: y,
    width: contentWidth - 40,
    fontSize: 24,
    fill: '#374151',
    text: dna.tone_and_manner.voice_style,
  });
  y += 80;

  // Keywords
  toneElements.push({
    type: 'text',
    x: margin,
    y: y,
    fontSize: 20,
    fontWeight: 'bold',
    fill: '#6B7280',
    text: 'TONE KEYWORDS',
  });
  y += 40;

  chipX = margin;
  dna.tone_and_manner.keywords.forEach((keyword) => {
    const chipWidth = keyword.length * 18 + 36;
    toneElements.push({
      type: 'svg',
      x: chipX,
      y: y,
      width: chipWidth,
      height: 40,
      src: createRoundedBoxSvg(chipWidth, 40, primaryColor, 20, 1),
    });
    toneElements.push({
      type: 'text',
      x: chipX + 18,
      y: y + 10,
      fontSize: 16,
      fill: '#FFFFFF',
      fontWeight: 'medium',
      text: keyword,
    });
    chipX += chipWidth + 12;
  });

  pages.push({ title: 'Tone & Manner', elements: toneElements });

  // ========================================
  // Page 4: Target Audience
  // ========================================
  const audienceElements: CanvasElement[] = [];
  y = margin;

  audienceElements.push({
    type: 'svg',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    src: createSolidBackgroundSvg(pageWidth, pageHeight, '#FFFFFF'),
  });

  audienceElements.push({
    type: 'text',
    x: margin,
    y: y,
    fontSize: 48,
    fontWeight: 'bold',
    fill: primaryColor,
    text: '👥 Target Audience',
  });
  y += 80;

  // Primary Segment
  audienceElements.push({
    type: 'svg',
    x: margin,
    y: y,
    width: contentWidth / 2 - 20,
    height: 400,
    src: createRoundedBoxSvg(contentWidth / 2 - 20, 400, primaryColor, 16, 0.1),
  });

  audienceElements.push({
    type: 'text',
    x: margin + 30,
    y: y + 30,
    fontSize: 14,
    fontWeight: 'bold',
    fill: primaryColor,
    text: 'PRIMARY',
  });

  audienceElements.push({
    type: 'text',
    x: margin + 30,
    y: y + 60,
    width: contentWidth / 2 - 80,
    fontSize: 28,
    fontWeight: 'bold',
    fill: '#1F2937',
    text: dna.target_audience.primary.segment_name,
  });

  audienceElements.push({
    type: 'text',
    x: margin + 30,
    y: y + 110,
    width: contentWidth / 2 - 80,
    fontSize: 18,
    fill: '#4B5563',
    text: dna.target_audience.primary.description,
  });

  let needsY = y + 200;
  audienceElements.push({
    type: 'text',
    x: margin + 30,
    y: needsY,
    fontSize: 14,
    fontWeight: 'bold',
    fill: '#6B7280',
    text: 'NEEDS',
  });
  needsY += 25;

  dna.target_audience.primary.needs.slice(0, 3).forEach((need) => {
    audienceElements.push({
      type: 'text',
      x: margin + 30,
      y: needsY,
      width: contentWidth / 2 - 80,
      fontSize: 16,
      fill: '#374151',
      text: `• ${need}`,
    });
    needsY += 28;
  });

  // Secondary Segment (if exists)
  if (dna.target_audience.secondary) {
    const secondaryX = margin + contentWidth / 2 + 20;

    audienceElements.push({
      type: 'svg',
      x: secondaryX,
      y: y,
      width: contentWidth / 2 - 20,
      height: 400,
      src: createRoundedBoxSvg(contentWidth / 2 - 20, 400, secondaryColor, 16, 0.1),
    });

    audienceElements.push({
      type: 'text',
      x: secondaryX + 30,
      y: y + 30,
      fontSize: 14,
      fontWeight: 'bold',
      fill: secondaryColor,
      text: 'SECONDARY',
    });

    audienceElements.push({
      type: 'text',
      x: secondaryX + 30,
      y: y + 60,
      width: contentWidth / 2 - 80,
      fontSize: 28,
      fontWeight: 'bold',
      fill: '#1F2937',
      text: dna.target_audience.secondary.segment_name,
    });

    audienceElements.push({
      type: 'text',
      x: secondaryX + 30,
      y: y + 110,
      width: contentWidth / 2 - 80,
      fontSize: 18,
      fill: '#4B5563',
      text: dna.target_audience.secondary.description,
    });

    let secNeedsY = y + 200;
    audienceElements.push({
      type: 'text',
      x: secondaryX + 30,
      y: secNeedsY,
      fontSize: 14,
      fontWeight: 'bold',
      fill: '#6B7280',
      text: 'NEEDS',
    });
    secNeedsY += 25;

    dna.target_audience.secondary.needs.slice(0, 3).forEach((need) => {
      audienceElements.push({
        type: 'text',
        x: secondaryX + 30,
        y: secNeedsY,
        width: contentWidth / 2 - 80,
        fontSize: 16,
        fill: '#374151',
        text: `• ${need}`,
      });
      secNeedsY += 28;
    });
  }

  pages.push({ title: 'Target Audience', elements: audienceElements });

  // ========================================
  // Page 5: Message Pillars
  // ========================================
  const pillarsElements: CanvasElement[] = [];
  y = margin;

  pillarsElements.push({
    type: 'svg',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    src: createSolidBackgroundSvg(pageWidth, pageHeight, '#FAFAFA'),
  });

  pillarsElements.push({
    type: 'text',
    x: margin,
    y: y,
    fontSize: 48,
    fontWeight: 'bold',
    fill: primaryColor,
    text: '💬 Message Pillars',
  });
  y += 80;

  // Main Message
  pillarsElements.push({
    type: 'text',
    x: margin,
    y: y,
    width: contentWidth,
    fontSize: 36,
    fontWeight: 'bold',
    fill: '#1F2937',
    text: `"${dna.message_structure.main_message}"`,
  });
  y += 80;

  // Sub Pillars
  const pillarWidth = (contentWidth - 40) / Math.min(dna.message_structure.sub_pillars.length, 3);
  dna.message_structure.sub_pillars.slice(0, 3).forEach((pillar, idx) => {
    const pillarX = margin + idx * (pillarWidth + 20);

    pillarsElements.push({
      type: 'svg',
      x: pillarX,
      y: y,
      width: pillarWidth,
      height: 300,
      src: createRoundedBoxSvg(pillarWidth, 300, '#FFFFFF', 16, 1),
    });

    // Pillar number
    pillarsElements.push({
      type: 'svg',
      x: pillarX + 20,
      y: y + 20,
      width: 40,
      height: 40,
      src: createRoundedBoxSvg(40, 40, primaryColor, 20, 1),
    });
    pillarsElements.push({
      type: 'text',
      x: pillarX + 32,
      y: y + 30,
      fontSize: 18,
      fontWeight: 'bold',
      fill: '#FFFFFF',
      text: `${idx + 1}`,
    });

    pillarsElements.push({
      type: 'text',
      x: pillarX + 20,
      y: y + 80,
      width: pillarWidth - 40,
      fontSize: 24,
      fontWeight: 'bold',
      fill: '#1F2937',
      text: pillar.title,
    });

    pillarsElements.push({
      type: 'text',
      x: pillarX + 20,
      y: y + 130,
      width: pillarWidth - 40,
      fontSize: 16,
      fill: '#4B5563',
      text: pillar.description,
    });
  });

  pages.push({ title: 'Message Pillars', elements: pillarsElements });

  // ========================================
  // Page 6: Do's & Don'ts
  // ========================================
  const guidelinesElements: CanvasElement[] = [];
  y = margin;

  guidelinesElements.push({
    type: 'svg',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    src: createSolidBackgroundSvg(pageWidth, pageHeight, '#FFFFFF'),
  });

  guidelinesElements.push({
    type: 'text',
    x: margin,
    y: y,
    fontSize: 48,
    fontWeight: 'bold',
    fill: primaryColor,
    text: '📋 Brand Guidelines',
  });
  y += 80;

  const halfWidth = (contentWidth - 40) / 2;

  // Do's
  guidelinesElements.push({
    type: 'svg',
    x: margin,
    y: y,
    width: halfWidth,
    height: 500,
    src: createRoundedBoxSvg(halfWidth, 500, '#ECFDF5', 16, 1),
  });

  guidelinesElements.push({
    type: 'text',
    x: margin + 30,
    y: y + 30,
    fontSize: 32,
    fontWeight: 'bold',
    fill: '#059669',
    text: '✅ Do\'s',
  });

  let doY = y + 80;
  dna.dos.slice(0, 6).forEach((item) => {
    guidelinesElements.push({
      type: 'text',
      x: margin + 30,
      y: doY,
      width: halfWidth - 60,
      fontSize: 18,
      fill: '#047857',
      text: `• ${item}`,
    });
    doY += 40;
  });

  // Don'ts
  guidelinesElements.push({
    type: 'svg',
    x: margin + halfWidth + 40,
    y: y,
    width: halfWidth,
    height: 500,
    src: createRoundedBoxSvg(halfWidth, 500, '#FEF2F2', 16, 1),
  });

  guidelinesElements.push({
    type: 'text',
    x: margin + halfWidth + 70,
    y: y + 30,
    fontSize: 32,
    fontWeight: 'bold',
    fill: '#DC2626',
    text: '❌ Don\'ts',
  });

  let dontY = y + 80;
  dna.donts.slice(0, 6).forEach((item) => {
    guidelinesElements.push({
      type: 'text',
      x: margin + halfWidth + 70,
      y: dontY,
      width: halfWidth - 60,
      fontSize: 18,
      fill: '#B91C1C',
      text: `• ${item}`,
    });
    dontY += 40;
  });

  pages.push({ title: 'Do\'s & Don\'ts', elements: guidelinesElements });

  // ========================================
  // Page 7: Visual Direction & Colors
  // ========================================
  const visualElements: CanvasElement[] = [];
  y = margin;

  visualElements.push({
    type: 'svg',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    src: createGradientBackgroundSvg(pageWidth, pageHeight, primaryColor, secondaryColor),
  });

  visualElements.push({
    type: 'text',
    x: margin,
    y: y,
    fontSize: 48,
    fontWeight: 'bold',
    fill: primaryColor,
    text: '🎨 Visual Direction',
  });
  y += 80;

  // Mood
  visualElements.push({
    type: 'text',
    x: margin,
    y: y,
    fontSize: 20,
    fontWeight: 'bold',
    fill: '#6B7280',
    text: 'MOOD',
  });
  y += 35;

  visualElements.push({
    type: 'text',
    x: margin + 20,
    y: y,
    width: contentWidth - 40,
    fontSize: 24,
    fill: '#1F2937',
    text: dna.visual_direction.mood,
  });
  y += 80;

  // Style Keywords
  visualElements.push({
    type: 'text',
    x: margin,
    y: y,
    fontSize: 20,
    fontWeight: 'bold',
    fill: '#6B7280',
    text: 'STYLE KEYWORDS',
  });
  y += 40;

  chipX = margin;
  dna.visual_direction.style_keywords.forEach((keyword) => {
    const chipWidth = keyword.length * 16 + 32;
    visualElements.push({
      type: 'svg',
      x: chipX,
      y: y,
      width: chipWidth,
      height: 36,
      src: createRoundedBoxSvg(chipWidth, 36, '#1F2937', 18, 1),
    });
    visualElements.push({
      type: 'text',
      x: chipX + 16,
      y: y + 9,
      fontSize: 15,
      fill: '#FFFFFF',
      text: keyword,
    });
    chipX += chipWidth + 12;
  });
  y += 80;

  // Color Palette
  visualElements.push({
    type: 'text',
    x: margin,
    y: y,
    fontSize: 20,
    fontWeight: 'bold',
    fill: '#6B7280',
    text: 'COLOR PALETTE',
  });
  y += 50;

  const colorSize = 100;
  let colorX = margin;

  // Primary Colors
  dna.suggested_brand_kit.primary_colors.forEach((color) => {
    visualElements.push({
      type: 'svg',
      x: colorX,
      y: y,
      width: colorSize,
      height: colorSize,
      src: createColorBoxSvg(colorSize, colorSize, color, 12),
    });
    visualElements.push({
      type: 'text',
      x: colorX,
      y: y + colorSize + 15,
      width: colorSize,
      fontSize: 14,
      fill: '#6B7280',
      text: color,
      align: 'center',
    });
    colorX += colorSize + 20;
  });

  // Secondary Colors
  dna.suggested_brand_kit.secondary_colors.forEach((color) => {
    visualElements.push({
      type: 'svg',
      x: colorX,
      y: y,
      width: colorSize,
      height: colorSize,
      src: createColorBoxSvg(colorSize, colorSize, color, 12),
    });
    visualElements.push({
      type: 'text',
      x: colorX,
      y: y + colorSize + 15,
      width: colorSize,
      fontSize: 14,
      fill: '#6B7280',
      text: color,
      align: 'center',
    });
    colorX += colorSize + 20;
  });

  y += colorSize + 60;

  // Avoid
  visualElements.push({
    type: 'text',
    x: margin,
    y: y,
    fontSize: 20,
    fontWeight: 'bold',
    fill: '#EF4444',
    text: 'AVOID',
  });
  y += 40;

  dna.visual_direction.avoid.forEach((item) => {
    visualElements.push({
      type: 'text',
      x: margin + 20,
      y: y,
      fontSize: 18,
      fill: '#B91C1C',
      text: `✕ ${item}`,
    });
    y += 35;
  });

  pages.push({ title: 'Visual Direction', elements: visualElements });

  return pages;
}

/**
 * Brand DNA V2를 Polotno Store에 다중 페이지로 추가
 */
export function addBrandIdentityToCanvasV2(
  polotnoStore: any,
  dna: BrandDNAV2,
  pageWidth: number = 1920,
  pageHeight: number = 1080
): void {
  if (!polotnoStore) {
    throw new Error('Polotno store is not initialized');
  }

  // 다중 페이지 생성
  const pages = createBrandIdentityCanvasV2(dna, pageWidth, pageHeight);

  console.log(`[BrandIdentityTemplate V2] Creating ${pages.length} pages...`);

  pages.forEach((pageConfig, index) => {
    // 새 페이지 추가
    polotnoStore.addPage({
      width: pageWidth,
      height: pageHeight,
    });

    const page = polotnoStore.pages[polotnoStore.pages.length - 1];
    if (!page) {
      throw new Error(`Failed to create page ${index + 1}`);
    }

    // 페이지에 요소 추가
    pageConfig.elements.forEach((element) => {
      page.addElement(element);
    });

    console.log(`[BrandIdentityTemplate V2] Page ${index + 1} (${pageConfig.title}): ${pageConfig.elements.length} elements`);
  });

  console.log(`[BrandIdentityTemplate V2] Complete! Total ${pages.length} pages created.`);
}
