/**
 * Layout API Renderer
 *
 * DocumentLayoutAgent의 응답을 Polotno Canvas로 렌더링하는 유틸리티
 * - Layout API 응답 → Polotno 요소 변환
 * - 다양한 문서 유형 지원 (meeting_summary, sns_ad, product_detail, brief 등)
 *
 * @author B팀 (Backend Team)
 * @version 1.0
 * @date 2025-12-04
 */

import {
  layoutApi,
  type DocumentLayout,
  type LayoutElement,
  type PageLayout,
  type MeetingLayoutRequest,
  type SNSLayoutRequest,
  type ProductLayoutRequest,
} from '@/lib/api/layout-api';

// ============================================================================
// Types
// ============================================================================

export interface RenderOptions {
  polotnoStore: any;
  clearExisting?: boolean;
}

// ============================================================================
// Core Renderer
// ============================================================================

/**
 * LayoutElement를 Polotno 요소로 변환하여 페이지에 추가
 */
export function addLayoutElementToPage(page: any, element: LayoutElement): void {
  const props = element.properties || {};

  switch (element.type) {
    case 'heading':
    case 'text':
    case 'paragraph':
      page.addElement({
        type: 'text',
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        text: element.content || '',
        fontSize: props.fontSize || 24,
        fontWeight: props.fontWeight || 'normal',
        fill: props.color || '#000000',
        align: props.textAlign || 'left',
      });
      break;

    case 'list':
      const items = props.items || [];
      const listStyle = props.listStyle || 'bullet';
      const prefix = listStyle === 'bullet' ? '• ' : listStyle === 'check' ? '✓ ' : '';
      const listText = items
        .map((item: string, i: number) =>
          listStyle === 'number' ? `${i + 1}. ${item}` : `${prefix}${item}`
        )
        .join('\n');

      page.addElement({
        type: 'text',
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        text: listText,
        fontSize: props.fontSize || 14,
        fill: props.color || '#333333',
        align: 'left',
        lineHeight: 1.6,
      });
      break;

    case 'card':
      // 카드 배경
      page.addElement({
        type: 'figure',
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        fill: props.backgroundColor || '#ffffff',
        cornerRadius: props.borderRadius || 8,
        stroke: props.borderColor || '#e0e0e0',
        strokeWidth: 1,
      });

      // 카드 내용
      if (element.content) {
        page.addElement({
          type: 'text',
          x: element.x + (props.padding || 16),
          y: element.y + (props.padding || 16),
          width: element.width - (props.padding || 16) * 2,
          text: element.content,
          fontSize: props.fontSize || 14,
          fill: props.color || '#333333',
        });
      }
      break;

    case 'divider':
      page.addElement({
        type: 'figure',
        x: element.x,
        y: element.y,
        width: element.width,
        height: 2,
        fill: props.color || '#e0e0e0',
      });
      break;

    case 'badge':
      const variantColors: Record<string, string> = {
        primary: '#3b82f6',
        secondary: '#6b7280',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      };
      const badgeColor = variantColors[props.variant || 'primary'] || '#3b82f6';

      page.addElement({
        type: 'figure',
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        fill: badgeColor,
        cornerRadius: props.borderRadius || 4,
      });

      page.addElement({
        type: 'text',
        x: element.x + 8,
        y: element.y + (element.height - (props.fontSize || 12)) / 2,
        width: element.width - 16,
        text: element.content || '',
        fontSize: props.fontSize || 12,
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'center',
      });
      break;

    case 'image':
      page.addElement({
        type: 'image',
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        src: element.content || props.placeholder || 'https://via.placeholder.com/400x300',
      });
      break;

    case 'cta_button':
      page.addElement({
        type: 'figure',
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        fill: props.backgroundColor || '#3b82f6',
        cornerRadius: props.borderRadius || 8,
      });

      page.addElement({
        type: 'text',
        x: element.x,
        y: element.y + (element.height - (props.fontSize || 16)) / 2,
        width: element.width,
        text: element.content || 'Click Here',
        fontSize: props.fontSize || 16,
        fill: props.color || '#ffffff',
        fontWeight: 'bold',
        align: 'center',
      });
      break;

    default:
      // 기본: 텍스트로 처리
      if (element.content) {
        page.addElement({
          type: 'text',
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          text: element.content,
          fontSize: props.fontSize || 14,
          fill: props.color || '#000000',
        });
      }
  }
}

/**
 * DocumentLayout을 Polotno Store에 렌더링
 */
export function renderLayoutToCanvas(
  layout: DocumentLayout,
  options: RenderOptions
): void {
  const { polotnoStore, clearExisting = true } = options;

  if (!polotnoStore) {
    throw new Error('Polotno store is not initialized');
  }

  // 기존 페이지 정리
  if (clearExisting) {
    const pageIds = polotnoStore.pages?.map((p: any) => p.id) || [];
    if (pageIds.length > 0) {
      polotnoStore.deletePages(pageIds);
    }
  }

  const pageWidth = layout.page_width;
  const pageHeight = layout.page_height;

  // 각 페이지 렌더링
  layout.pages.forEach((pageLayout: PageLayout, pageIndex: number) => {
    // 새 페이지 추가
    polotnoStore.addPage({
      width: pageWidth,
      height: pageHeight,
    });

    const targetPage = polotnoStore.pages[polotnoStore.pages.length - 1];

    // 각 요소를 페이지에 추가
    pageLayout.elements.forEach((element: LayoutElement) => {
      addLayoutElementToPage(targetPage, element);
    });

    // 페이지 Footer 추가
    targetPage.addElement({
      type: 'text',
      x: 60,
      y: pageHeight - 45,
      width: pageWidth - 120,
      fontSize: 10,
      fill: '#9CA3AF',
      text: `Page ${pageIndex + 1} of ${layout.total_pages} • Generated by Sparklio AI • ${new Date().toLocaleDateString('ko-KR')}`,
      align: 'center',
    });
  });

  console.log(`[LayoutRenderer] Rendered ${layout.total_pages} pages to canvas`);
}

// ============================================================================
// High-Level API Functions
// ============================================================================

/**
 * Meeting Summary 레이아웃을 생성하고 캔버스에 렌더링
 */
export async function renderMeetingLayoutToCanvas(
  request: MeetingLayoutRequest,
  options: RenderOptions
): Promise<DocumentLayout> {
  const response = await layoutApi.generateMeetingLayout(request);
  renderLayoutToCanvas(response.layout, options);
  return response.layout;
}

/**
 * SNS 광고 레이아웃을 생성하고 캔버스에 렌더링
 */
export async function renderSNSLayoutToCanvas(
  request: SNSLayoutRequest,
  options: RenderOptions
): Promise<DocumentLayout> {
  const response = await layoutApi.generateSNSLayout(request);
  renderLayoutToCanvas(response.layout, options);
  return response.layout;
}

/**
 * 상세페이지 레이아웃을 생성하고 캔버스에 렌더링
 */
export async function renderProductLayoutToCanvas(
  request: ProductLayoutRequest,
  options: RenderOptions
): Promise<DocumentLayout> {
  const response = await layoutApi.generateProductLayout(request);
  renderLayoutToCanvas(response.layout, options);
  return response.layout;
}

/**
 * 범용 레이아웃 생성 및 렌더링
 */
export async function renderGeneratedLayoutToCanvas(
  documentType: string,
  content: Record<string, unknown>,
  options: RenderOptions & {
    pageWidth?: number;
    pageHeight?: number;
    style?: 'modern' | 'classic' | 'minimal';
    platform?: string;
  }
): Promise<DocumentLayout> {
  const response = await layoutApi.generate({
    document_type: documentType as any,
    content,
    options: {
      page_width: options.pageWidth,
      page_height: options.pageHeight,
      style: options.style,
      platform: options.platform,
    },
  });

  renderLayoutToCanvas(response.layout, options);
  return response.layout;
}

export default {
  addLayoutElementToPage,
  renderLayoutToCanvas,
  renderMeetingLayoutToCanvas,
  renderSNSLayoutToCanvas,
  renderProductLayoutToCanvas,
  renderGeneratedLayoutToCanvas,
};
