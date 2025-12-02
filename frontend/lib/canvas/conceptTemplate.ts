/**
 * Concept Template
 *
 * ConceptV1 데이터를 Polotno Canvas로 변환
 * - 각 컨셉을 별도 페이지로 생성
 * - 컨셉 카드 레이아웃 (제목, 인사이트, 타겟, 톤, 컬러 팔레트)
 * - 편집 가능한 요소로 구성
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-02
 */

import type { ConceptV1 } from '@/types/concept';
import type { StoreType } from 'polotno/model/store';

// ============================================================================
// Types
// ============================================================================

interface ConceptTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontFamily: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * SVG를 안전하게 data URL로 변환 (브라우저 호환)
 */
function svgToDataUrl(svg: string): string {
  // URL 인코딩 방식 사용 (btoa보다 더 안전)
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml,${encoded}`;
}

/**
 * 사각형 SVG 생성
 */
function createRectSvg(
  width: number,
  height: number,
  fill: string,
  cornerRadius: number = 0
): string {
  const rx = cornerRadius > 0 ? `rx="${cornerRadius}" ry="${cornerRadius}"` : '';
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" fill="${fill}" ${rx}/></svg>`;
  return svgToDataUrl(svg);
}

/**
 * 컬러 스와치 SVG 생성 (컬러 팔레트 미리보기)
 */
function createColorSwatchSvg(colors: string[], width: number, height: number): string {
  const swatchWidth = width / colors.length;
  const rects = colors.map((color, i) =>
    `<rect x="${i * swatchWidth}" y="0" width="${swatchWidth}" height="${height}" fill="${color}"/>`
  ).join('');
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
  return svgToDataUrl(svg);
}

// ============================================================================
// Concept Page Generator
// ============================================================================

/**
 * 컨셉을 Polotno 페이지로 변환
 */
export function addConceptToCanvas(
  store: StoreType,
  concept: ConceptV1,
  index: number
): void {
  // 컨셉의 비주얼 월드에서 테마 추출
  const hexColors = concept.visual_world?.hex_colors || ['#6366F1', '#8B5CF6', '#EC4899'];
  const theme: ConceptTheme = {
    primaryColor: hexColors[0] || '#6366F1',
    secondaryColor: hexColors[1] || '#8B5CF6',
    accentColor: hexColors[2] || '#EC4899',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Pretendard',
  };

  // 페이지 크기 (concept canvas config)
  const pageWidth = 1080;
  const pageHeight = 1080;
  const margin = 60;

  // 새 페이지 추가
  const page = store.addPage({
    width: pageWidth,
    height: pageHeight,
  });

  // 1. 배경
  page.addElement({
    type: 'svg',
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    src: createRectSvg(pageWidth, pageHeight, '#FAFAFA', 0),
    selectable: false,
    name: 'background',
  });

  // 2. 상단 컬러 바 (브랜드 컬러)
  page.addElement({
    type: 'svg',
    x: 0,
    y: 0,
    width: pageWidth,
    height: 12,
    src: createRectSvg(pageWidth, 12, theme.primaryColor, 0),
    name: 'color-bar',
  });

  // 3. 컨셉 번호 뱃지
  page.addElement({
    type: 'text',
    x: margin,
    y: 40,
    width: 120,
    height: 36,
    text: `컨셉 ${index + 1}`,
    fontSize: 14,
    fontFamily: theme.fontFamily,
    fontWeight: 'bold',
    fill: theme.primaryColor,
    align: 'center',
    name: 'concept-badge',
  });

  // 4. 컨셉 이름 (메인 타이틀)
  page.addElement({
    type: 'text',
    x: margin,
    y: 90,
    width: pageWidth - margin * 2,
    height: 60,
    text: concept.name || '컨셉 이름',
    fontSize: 36,
    fontFamily: theme.fontFamily,
    fontWeight: 'bold',
    fill: '#1F2937',
    align: 'left',
    name: 'concept-name',
  });

  // 5. 핵심 약속 (Core Promise)
  page.addElement({
    type: 'text',
    x: margin,
    y: 160,
    width: pageWidth - margin * 2,
    height: 50,
    text: concept.core_promise || '',
    fontSize: 20,
    fontFamily: theme.fontFamily,
    fontWeight: 'normal',
    fill: '#6B7280',
    align: 'left',
    name: 'core-promise',
  });

  // 6. 구분선
  page.addElement({
    type: 'svg',
    x: margin,
    y: 230,
    width: pageWidth - margin * 2,
    height: 2,
    src: createRectSvg(pageWidth - margin * 2, 2, '#E5E7EB', 0),
    name: 'divider-1',
  });

  // 7. 고객 인사이트 섹션
  page.addElement({
    type: 'text',
    x: margin,
    y: 260,
    width: 100,
    height: 24,
    text: '고객 인사이트',
    fontSize: 12,
    fontFamily: theme.fontFamily,
    fontWeight: 'bold',
    fill: theme.primaryColor,
    name: 'insight-label',
  });

  page.addElement({
    type: 'text',
    x: margin,
    y: 290,
    width: pageWidth - margin * 2,
    height: 80,
    text: concept.audience_insight || '',
    fontSize: 16,
    fontFamily: theme.fontFamily,
    fill: '#374151',
    align: 'left',
    name: 'insight-content',
  });

  // 8. 타겟 오디언스 섹션
  page.addElement({
    type: 'text',
    x: margin,
    y: 390,
    width: 100,
    height: 24,
    text: '타겟 오디언스',
    fontSize: 12,
    fontFamily: theme.fontFamily,
    fontWeight: 'bold',
    fill: theme.primaryColor,
    name: 'target-label',
  });

  page.addElement({
    type: 'text',
    x: margin,
    y: 420,
    width: pageWidth - margin * 2,
    height: 60,
    text: concept.target_audience || '',
    fontSize: 16,
    fontFamily: theme.fontFamily,
    fill: '#374151',
    align: 'left',
    name: 'target-content',
  });

  // 9. 톤 & 매너 섹션
  page.addElement({
    type: 'text',
    x: margin,
    y: 500,
    width: 100,
    height: 24,
    text: '톤 & 매너',
    fontSize: 12,
    fontFamily: theme.fontFamily,
    fontWeight: 'bold',
    fill: theme.primaryColor,
    name: 'tone-label',
  });

  page.addElement({
    type: 'text',
    x: margin,
    y: 530,
    width: pageWidth - margin * 2,
    height: 60,
    text: concept.tone_and_manner || '',
    fontSize: 16,
    fontFamily: theme.fontFamily,
    fill: '#374151',
    align: 'left',
    name: 'tone-content',
  });

  // 10. 크리에이티브 디바이스 섹션
  page.addElement({
    type: 'text',
    x: margin,
    y: 610,
    width: 120,
    height: 24,
    text: '크리에이티브 디바이스',
    fontSize: 12,
    fontFamily: theme.fontFamily,
    fontWeight: 'bold',
    fill: theme.primaryColor,
    name: 'creative-label',
  });

  page.addElement({
    type: 'text',
    x: margin,
    y: 640,
    width: pageWidth - margin * 2,
    height: 60,
    text: concept.creative_device || '',
    fontSize: 16,
    fontFamily: theme.fontFamily,
    fill: '#374151',
    fontStyle: 'italic',
    align: 'left',
    name: 'creative-content',
  });

  // 11. 훅 패턴 (있으면 표시)
  if (concept.hook_patterns && concept.hook_patterns.length > 0) {
    page.addElement({
      type: 'text',
      x: margin,
      y: 720,
      width: 80,
      height: 24,
      text: '훅 패턴',
      fontSize: 12,
      fontFamily: theme.fontFamily,
      fontWeight: 'bold',
      fill: theme.primaryColor,
      name: 'hook-label',
    });

    page.addElement({
      type: 'text',
      x: margin,
      y: 750,
      width: pageWidth - margin * 2,
      height: 80,
      text: concept.hook_patterns.map(h => `• ${h}`).join('\n'),
      fontSize: 14,
      fontFamily: theme.fontFamily,
      fill: '#6B7280',
      align: 'left',
      name: 'hook-content',
    });
  }

  // 12. 컬러 팔레트 (하단)
  if (hexColors.length > 0) {
    page.addElement({
      type: 'text',
      x: margin,
      y: 860,
      width: 100,
      height: 24,
      text: '컬러 팔레트',
      fontSize: 12,
      fontFamily: theme.fontFamily,
      fontWeight: 'bold',
      fill: theme.primaryColor,
      name: 'color-label',
    });

    // 각 컬러 스와치
    hexColors.slice(0, 5).forEach((color, i) => {
      page.addElement({
        type: 'svg',
        x: margin + i * 70,
        y: 890,
        width: 60,
        height: 60,
        src: createRectSvg(60, 60, color, 8),
        name: `color-swatch-${i}`,
      });

      page.addElement({
        type: 'text',
        x: margin + i * 70,
        y: 956,
        width: 60,
        height: 20,
        text: color,
        fontSize: 10,
        fontFamily: theme.fontFamily,
        fill: '#9CA3AF',
        align: 'center',
        name: `color-code-${i}`,
      });
    });
  }

  // 13. 하단 푸터 (키워드 태그)
  if (concept.keywords && concept.keywords.length > 0) {
    const keywordsText = concept.keywords.slice(0, 5).map(k => `#${k}`).join('  ');
    page.addElement({
      type: 'text',
      x: margin,
      y: pageHeight - 50,
      width: pageWidth - margin * 2,
      height: 30,
      text: keywordsText,
      fontSize: 14,
      fontFamily: theme.fontFamily,
      fill: '#9CA3AF',
      align: 'left',
      name: 'keywords',
    });
  }
}

/**
 * 여러 컨셉을 Polotno Canvas에 추가 (각각 별도 페이지)
 */
export function addConceptsToCanvas(
  store: StoreType,
  concepts: ConceptV1[],
  clearExisting: boolean = true
): void {
  console.log(`[ConceptTemplate] Adding ${concepts.length} concepts to canvas`);

  // 기존 페이지 제거 (옵션)
  if (clearExisting && store.pages && store.pages.length > 0) {
    const pageIds = store.pages.map((p: any) => p.id);
    store.deletePages(pageIds);
  }

  // 각 컨셉을 페이지로 추가
  concepts.forEach((concept, index) => {
    addConceptToCanvas(store, concept, index);
  });

  // 첫 번째 페이지 선택
  if (store.pages && store.pages.length > 0) {
    store.selectPage(store.pages[0].id);
  }

  console.log(`[ConceptTemplate] Added ${concepts.length} concept pages`);
}

/**
 * 기존 페이지에 컨셉 내용 업데이트
 */
export function updateConceptPage(
  store: StoreType,
  pageId: string,
  concept: ConceptV1
): void {
  const page = store.pages?.find((p: any) => p.id === pageId);
  if (!page) {
    console.warn(`[ConceptTemplate] Page ${pageId} not found`);
    return;
  }

  // 요소 이름으로 찾아서 업데이트
  const updateElement = (name: string, text: string) => {
    const element = page.children?.find((el: any) => el.name === name);
    if (element && element.set) {
      element.set({ text });
    }
  };

  updateElement('concept-name', concept.name);
  updateElement('core-promise', concept.core_promise);
  updateElement('insight-content', concept.audience_insight);
  updateElement('target-content', concept.target_audience);
  updateElement('tone-content', concept.tone_and_manner);
  updateElement('creative-content', concept.creative_device);

  if (concept.hook_patterns?.length) {
    updateElement('hook-content', concept.hook_patterns.map(h => `• ${h}`).join('\n'));
  }

  if (concept.keywords?.length) {
    updateElement('keywords', concept.keywords.slice(0, 5).map(k => `#${k}`).join('  '));
  }
}
