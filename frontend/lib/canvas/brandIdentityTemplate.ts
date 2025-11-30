/**
 * Brand Identity Canvas Template V2
 *
 * Brand DNA 데이터를 Polotno Canvas 다중 페이지로 변환
 * - Brand DNA V1/V2 지원
 * - 다중 페이지 자동 생성 (Brand Core, Messages, Audience, Guidelines 등)
 * - 브랜드 색상, 폰트, 톤앤매너 자동 적용
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-11-30
 */

import type { BrandDNA as BrandDNAFromAPI } from '@/lib/api/brand-api';
import type { BrandDNAV2, BrandDNAUnion, isBrandDNAV2 } from '@/types/brand';

// ============================================================================
// Types
// ============================================================================

interface CanvasElement {
  type: 'text' | 'rect' | 'svg';
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
  [key: string]: any;
}

// ============================================================================
// Brand Identity Canvas Generator
// ============================================================================

/**
 * Brand DNA를 Canvas 페이지로 변환
 */
export function createBrandIdentityCanvas(dna: BrandDNA, pageWidth: number = 1920, pageHeight: number = 1080): CanvasElement[] {
  const elements: CanvasElement[] = [];

  const margin = 60;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // 브랜드 색상 추출
  const primaryColor = dna.suggested_brand_kit.primary_colors[0] || '#6366F1';
  const secondaryColor = dna.suggested_brand_kit.secondary_colors[0] || '#8B5CF6';

  // 배경 그라디언트
  elements.push({
    type: 'rect',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    fill: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)`,
  });

  // 제목
  elements.push({
    type: 'text',
    x: margin,
    y: currentY,
    width: contentWidth,
    fontSize: 72,
    fontWeight: 'bold',
    fill: primaryColor,
    text: 'Brand Identity Canvas',
    fontFamily: 'Pretendard',
  });
  currentY += 100;

  // Tone & Manner 섹션
  elements.push({
    type: 'text',
    x: margin,
    y: currentY,
    width: contentWidth,
    fontSize: 32,
    fontWeight: 'bold',
    fill: '#1F2937',
    text: '🎨 Tone & Manner',
  });
  currentY += 50;

  elements.push({
    type: 'text',
    x: margin + 20,
    y: currentY,
    width: contentWidth - 40,
    fontSize: 24,
    fill: primaryColor,
    text: dna.tone.primary,
    fontWeight: 'bold',
  });
  currentY += 40;

  elements.push({
    type: 'text',
    x: margin + 20,
    y: currentY,
    width: contentWidth - 40,
    fontSize: 18,
    fill: '#4B5563',
    text: dna.tone.description,
  });
  currentY += 60;

  // Key Messages 섹션 (2열 레이아웃)
  const columnWidth = (contentWidth - 40) / 2;
  const leftX = margin;
  const rightX = margin + columnWidth + 40;

  // 왼쪽: Key Messages
  let leftY = currentY;
  elements.push({
    type: 'text',
    x: leftX,
    y: leftY,
    width: columnWidth,
    fontSize: 28,
    fontWeight: 'bold',
    fill: '#1F2937',
    text: '💬 Key Messages',
  });
  leftY += 45;

  dna.key_messages.slice(0, 3).forEach((msg, idx) => {
    elements.push({
      type: 'text',
      x: leftX + 20,
      y: leftY,
      width: columnWidth - 40,
      fontSize: 16,
      fill: '#374151',
      text: `${idx + 1}. ${msg}`,
    });
    leftY += 35;
  });

  // 오른쪽: Target Audience
  let rightY = currentY;
  elements.push({
    type: 'text',
    x: rightX,
    y: rightY,
    width: columnWidth,
    fontSize: 28,
    fontWeight: 'bold',
    fill: '#1F2937',
    text: '👥 Target Audience',
  });
  rightY += 45;

  elements.push({
    type: 'text',
    x: rightX + 20,
    y: rightY,
    width: columnWidth - 40,
    fontSize: 16,
    fill: '#374151',
    text: `Demographics: ${dna.target_audience.demographics}`,
  });
  rightY += 35;

  elements.push({
    type: 'text',
    x: rightX + 20,
    y: rightY,
    width: columnWidth - 40,
    fontSize: 16,
    fill: '#374151',
    text: `Psychographics: ${dna.target_audience.psychographics}`,
  });
  rightY += 60;

  currentY = Math.max(leftY, rightY) + 40;

  // Do's & Don'ts 섹션
  leftY = currentY;
  rightY = currentY;

  // 왼쪽: Do's
  elements.push({
    type: 'text',
    x: leftX,
    y: leftY,
    width: columnWidth,
    fontSize: 28,
    fontWeight: 'bold',
    fill: '#059669',
    text: '✅ Do\'s',
  });
  leftY += 45;

  dna.dos.slice(0, 4).forEach((item) => {
    elements.push({
      type: 'text',
      x: leftX + 20,
      y: leftY,
      width: columnWidth - 40,
      fontSize: 16,
      fill: '#047857',
      text: `• ${item}`,
    });
    leftY += 32;
  });

  // 오른쪽: Don'ts
  elements.push({
    type: 'text',
    x: rightX,
    y: rightY,
    width: columnWidth,
    fontSize: 28,
    fontWeight: 'bold',
    fill: '#DC2626',
    text: '❌ Don\'ts',
  });
  rightY += 45;

  dna.donts.slice(0, 4).forEach((item) => {
    elements.push({
      type: 'text',
      x: rightX + 20,
      y: rightY,
      width: columnWidth - 40,
      fontSize: 16,
      fill: '#B91C1C',
      text: `• ${item}`,
    });
    rightY += 32;
  });

  currentY = Math.max(leftY, rightY) + 40;

  // Brand Colors 섹션
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

  const colorBoxSize = 80;
  const colorGap = 20;
  let colorX = margin + 20;

  // Primary Colors
  dna.suggested_brand_kit.primary_colors.forEach((color) => {
    elements.push({
      type: 'rect',
      x: colorX,
      y: currentY,
      width: colorBoxSize,
      height: colorBoxSize,
      fill: color,
      cornerRadius: 8,
    });
    elements.push({
      type: 'text',
      x: colorX,
      y: currentY + colorBoxSize + 10,
      width: colorBoxSize,
      fontSize: 12,
      fill: '#6B7280',
      text: color,
      align: 'center',
    });
    colorX += colorBoxSize + colorGap;
  });

  // Secondary Colors
  dna.suggested_brand_kit.secondary_colors.forEach((color) => {
    elements.push({
      type: 'rect',
      x: colorX,
      y: currentY,
      width: colorBoxSize,
      height: colorBoxSize,
      fill: color,
      cornerRadius: 8,
    });
    elements.push({
      type: 'text',
      x: colorX,
      y: currentY + colorBoxSize + 10,
      width: colorBoxSize,
      fontSize: 12,
      fill: '#6B7280',
      text: color,
      align: 'center',
    });
    colorX += colorBoxSize + colorGap;
  });

  currentY += colorBoxSize + 50;

  // Footer - Confidence Score
  elements.push({
    type: 'text',
    x: margin,
    y: pageHeight - margin - 30,
    width: contentWidth,
    fontSize: 14,
    fill: '#9CA3AF',
    text: `Analysis Confidence: ${(dna.confidence_score * 100).toFixed(0)}% | ${dna.analysis_notes}`,
  });

  return elements;
}

/**
 * Brand DNA를 Polotno Store에 추가 (V1 - 단일 페이지)
 */
export function addBrandIdentityToCanvas(
  polotnoStore: any,
  dna: BrandDNAFromAPI,
  pageWidth: number = 1920,
  pageHeight: number = 1080
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

  // 배경
  coverElements.push({
    type: 'rect',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    fill: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)`,
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
      type: 'rect',
      x: chipX,
      y: chipY,
      width: chipWidth,
      height: 44,
      fill: `${primaryColor}15`,
      cornerRadius: 22,
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

  // 배경
  coreElements.push({
    type: 'rect',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    fill: '#FAFAFA',
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
    type: 'rect',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    fill: `linear-gradient(180deg, ${primaryColor}08, ${secondaryColor}08)`,
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
      type: 'rect',
      x: chipX,
      y: y,
      width: chipWidth,
      height: 40,
      fill: primaryColor,
      cornerRadius: 20,
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
    type: 'rect',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    fill: '#FFFFFF',
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
    type: 'rect',
    x: margin,
    y: y,
    width: contentWidth / 2 - 20,
    height: 400,
    fill: `${primaryColor}10`,
    cornerRadius: 16,
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
      type: 'rect',
      x: secondaryX,
      y: y,
      width: contentWidth / 2 - 20,
      height: 400,
      fill: `${secondaryColor}10`,
      cornerRadius: 16,
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
    type: 'rect',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    fill: '#FAFAFA',
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
      type: 'rect',
      x: pillarX,
      y: y,
      width: pillarWidth,
      height: 300,
      fill: '#FFFFFF',
      cornerRadius: 16,
    });

    // Pillar number
    pillarsElements.push({
      type: 'rect',
      x: pillarX + 20,
      y: y + 20,
      width: 40,
      height: 40,
      fill: primaryColor,
      cornerRadius: 20,
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
    type: 'rect',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    fill: '#FFFFFF',
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
    type: 'rect',
    x: margin,
    y: y,
    width: halfWidth,
    height: 500,
    fill: '#ECFDF5',
    cornerRadius: 16,
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
    type: 'rect',
    x: margin + halfWidth + 40,
    y: y,
    width: halfWidth,
    height: 500,
    fill: '#FEF2F2',
    cornerRadius: 16,
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
    type: 'rect',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    fill: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)`,
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
      type: 'rect',
      x: chipX,
      y: y,
      width: chipWidth,
      height: 36,
      fill: '#1F2937',
      cornerRadius: 18,
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
      type: 'rect',
      x: colorX,
      y: y,
      width: colorSize,
      height: colorSize,
      fill: color,
      cornerRadius: 12,
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
      type: 'rect',
      x: colorX,
      y: y,
      width: colorSize,
      height: colorSize,
      fill: color,
      cornerRadius: 12,
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
