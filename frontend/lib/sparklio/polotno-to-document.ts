/**
 * Polotno ↔ SparklioDocument 변환 유틸리티
 *
 * Polotno Store와 SparklioDocument 간 양방향 변환
 * - toSparklioDocument: Polotno → Sparklio
 * - fromSparklioDocument: Sparklio → Polotno
 * - 저장/로드 시 사용
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 */

import type { StoreType } from 'polotno/model/store';
import type {
  SparklioDocument,
  SparklioPage,
  SparklioObject,
  DocumentMode,
} from './document';

// ============================================================================
// Polotno → SparklioDocument
// ============================================================================

/**
 * Polotno Store를 SparklioDocument로 변환
 */
export function toSparklioDocument(
  polotnoStore: StoreType,
  documentId?: string,
  title?: string,
  mode?: DocumentMode
): SparklioDocument {
  const pages: SparklioPage[] = polotnoStore.pages.map((page, index) => {
    const objects: SparklioObject[] = page.children.map((element) => {
      // Polotno element → SparklioObject 변환
      const baseObject: Partial<SparklioObject> = {
        id: element.id,
        type: mapPolotnoTypeToSparklio(element.type),
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        rotation: element.rotation || 0,
        opacity: element.opacity !== undefined ? element.opacity : 1,
        visible: element.visible !== undefined ? element.visible : true,
        locked: element.locked || false,
        order: element.order || index,
      };

      // Type-specific properties
      if (element.type === 'text') {
        return {
          ...baseObject,
          type: 'text',
          text: element.text || '',
          fontFamily: element.fontFamily || 'Pretendard',
          fontSize: element.fontSize || 16,
          fontWeight: element.fontWeight || 400,
          fontStyle: element.fontStyle || 'normal',
          textAlign: element.align || 'left',
          lineHeight: element.lineHeight || 1.5,
          letterSpacing: element.letterSpacing || 0,
          color: element.fill || '#000000',
        } as SparklioObject;
      }

      if (element.type === 'image') {
        return {
          ...baseObject,
          type: 'image',
          src: element.src || '',
          cropX: element.cropX || 0,
          cropY: element.cropY || 0,
          cropWidth: element.cropWidth || 1,
          cropHeight: element.cropHeight || 1,
          filters: element.filters || {},
        } as SparklioObject;
      }

      if (element.type === 'svg') {
        return {
          ...baseObject,
          type: 'shape',
          shapeType: 'rectangle',
          fill: element.fill || '#000000',
          stroke: element.stroke,
          strokeWidth: element.strokeWidth || 0,
        } as SparklioObject;
      }

      // Default: return as shape
      return {
        ...baseObject,
        type: 'shape',
        shapeType: 'rectangle',
        fill: element.fill || '#FFFFFF',
      } as SparklioObject;
    });

    const pageWidth = typeof page.width === 'number' ? page.width : 1080;
    const pageHeight = typeof page.height === 'number' ? page.height : 1920;

    return {
      id: page.id,
      name: page.name || `Page ${index + 1}`,
      width: pageWidth,
      height: pageHeight,
      background: page.background || '#FFFFFF',
      objects,
      order: index,
    };
  });

  return {
    id: documentId || `doc_${Date.now()}`,
    title: title || 'Untitled',
    type: 'sparklio-doc',
    version: '2.0',
    pages,
    currentPageId: polotnoStore.activePage?.id,
    mode: mode || 'presentation',
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'polotno',
    },
  };
}

// ============================================================================
// SparklioDocument → Polotno
// ============================================================================

/**
 * SparklioDocument를 Polotno Store에 로드
 */
export function fromSparklioDocument(
  polotnoStore: StoreType,
  document: SparklioDocument
): void {
  // 기존 페이지 모두 제거
  const existingPageIds = polotnoStore.pages.map((p) => p.id);
  if (existingPageIds.length > 0) {
    polotnoStore.deletePages(existingPageIds);
  }

  // 각 페이지 추가
  document.pages.forEach((page) => {
    // 새 페이지 추가
    polotnoStore.addPage({
      id: page.id,
      name: page.name,
      width: page.width,
      height: page.height,
      background: page.background,
    });

    // 페이지 가져오기
    const polotnoPage = polotnoStore.pages.find((p) => p.id === page.id);
    if (!polotnoPage) {
      console.error('[PolotnoConverter] Failed to find page:', page.id);
      return;
    }

    // 각 오브젝트 추가
    page.objects.forEach((obj) => {
      try {
        const elementData = mapSparklioObjectToPolotno(obj);
        polotnoPage.addElement(elementData);
      } catch (error) {
        console.error('[PolotnoConverter] Failed to add element:', obj.id, error);
      }
    });
  });

  // 현재 페이지 설정
  if (document.currentPageId) {
    const targetPage = polotnoStore.pages.find(
      (p) => p.id === document.currentPageId
    );
    if (targetPage) {
      polotnoStore.selectPage(targetPage.id);
    }
  }

  console.log('[PolotnoConverter] Document loaded:', document.id, document.pages.length, 'pages');
}

// ============================================================================
// Type Mapping
// ============================================================================

/**
 * Polotno type → Sparklio type
 */
function mapPolotnoTypeToSparklio(polotnoType: string): SparklioObject['type'] {
  switch (polotnoType) {
    case 'text':
      return 'text';
    case 'image':
      return 'image';
    case 'svg':
    case 'figure':
      return 'shape';
    case 'video':
      return 'video';
    case 'group':
      return 'group';
    default:
      return 'shape';
  }
}

/**
 * SparklioObject → Polotno element data
 */
function mapSparklioObjectToPolotno(obj: SparklioObject): any {
  const baseData = {
    id: obj.id,
    x: obj.x,
    y: obj.y,
    width: obj.width,
    height: obj.height,
    rotation: obj.rotation,
    opacity: obj.opacity,
    visible: obj.visible,
    locked: obj.locked,
  };

  switch (obj.type) {
    case 'text':
      return {
        ...baseData,
        type: 'text',
        text: obj.text,
        fontFamily: obj.fontFamily || 'Pretendard',
        fontSize: obj.fontSize || 16,
        fontWeight: obj.fontWeight || 400,
        fontStyle: obj.fontStyle || 'normal',
        align: obj.textAlign || 'left',
        lineHeight: obj.lineHeight || 1.5,
        letterSpacing: obj.letterSpacing || 0,
        fill: obj.color || '#000000',
      };

    case 'image':
      return {
        ...baseData,
        type: 'image',
        src: obj.src,
        cropX: obj.cropX || 0,
        cropY: obj.cropY || 0,
        cropWidth: obj.cropWidth || 1,
        cropHeight: obj.cropHeight || 1,
        filters: obj.filters || {},
      };

    case 'shape':
      return {
        ...baseData,
        type: 'svg',
        fill: obj.fill || '#000000',
        stroke: obj.stroke,
        strokeWidth: obj.strokeWidth || 0,
      };

    case 'video':
      return {
        ...baseData,
        type: 'video',
        src: obj.src || '',
      };

    case 'group':
      return {
        ...baseData,
        type: 'group',
        children: obj.children || [],
      };

    default:
      return {
        ...baseData,
        type: 'svg',
        fill: '#CCCCCC',
      };
  }
}

// ============================================================================
// Export
// ============================================================================

export default {
  toSparklioDocument,
  fromSparklioDocument,
};
