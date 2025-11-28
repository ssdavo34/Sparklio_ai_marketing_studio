/**
 * Brand Identity Canvas Template
 *
 * Brand DNA 데이터를 Polotno Canvas로 변환
 * - Brand DNA → 시각적 Brand Identity Canvas
 * - 브랜드 색상, 폰트, 톤앤매너 자동 적용
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 */

import type { BrandDNA } from '@/lib/api/brand-api';

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
 * Brand DNA를 Polotno Store에 추가
 */
export function addBrandIdentityToCanvas(
  polotnoStore: any,
  dna: BrandDNA,
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
