/**
 * Canvas Operations API
 *
 * Chat에서 Canvas를 조작하기 위한 API
 * - 요소 추가/수정/삭제
 * - 선택 요소 조작
 * - 페이지 관리
 * - 이미지 처리
 *
 * @author C Team (Frontend Team)
 * @version 1.0
 */

import { getPolotnoStore } from '../polotno/polotnoStoreSingleton';
import { useStudioContextStore } from '../stores/useStudioContextStore';
import { useCanvasStore } from '../stores/useCanvasStore';

// ============================================================================
// Types
// ============================================================================

export interface AddElementOptions {
  type: 'text' | 'image' | 'svg' | 'figure';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // Text specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fill?: string;
  align?: 'left' | 'center' | 'right';
  // Image specific
  src?: string;
  // SVG specific
  svgContent?: string;
}

export interface UpdateElementOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  // Text specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fill?: string;
  align?: 'left' | 'center' | 'right';
  // Image specific
  src?: string;
}

export interface CanvasOperationResult {
  success: boolean;
  message: string;
  elementId?: string;
  pageId?: string;
}

// ============================================================================
// Canvas Operations
// ============================================================================

/**
 * Polotno Store 가져오기 (null 체크 포함)
 */
function getStore() {
  const store = getPolotnoStore();
  if (!store) {
    console.error('[CanvasOperations] Polotno store not available');
    return null;
  }
  return store;
}

/**
 * 활성 페이지 가져오기
 */
function getActivePage() {
  const store = getStore();
  if (!store) return null;

  const activePage = store.activePage;
  if (!activePage) {
    console.error('[CanvasOperations] No active page');
    return null;
  }
  return activePage;
}

// ============================================================================
// Element Operations
// ============================================================================

/**
 * 요소 추가
 */
export function addElement(options: AddElementOptions): CanvasOperationResult {
  const page = getActivePage();
  if (!page) {
    return { success: false, message: 'Canvas가 준비되지 않았습니다' };
  }

  try {
    const defaults = {
      x: options.x ?? 100,
      y: options.y ?? 100,
      width: options.width ?? 400,
      height: options.height ?? 100,
    };

    let element: any;

    switch (options.type) {
      case 'text':
        element = page.addElement({
          type: 'text',
          ...defaults,
          text: options.text || '텍스트를 입력하세요',
          fontSize: options.fontSize || 32,
          fontFamily: options.fontFamily || 'Pretendard',
          fontWeight: options.fontWeight || 'normal',
          fill: options.fill || '#000000',
          align: options.align || 'left',
        });
        break;

      case 'image':
        if (!options.src) {
          return { success: false, message: '이미지 URL이 필요합니다' };
        }
        element = page.addElement({
          type: 'image',
          ...defaults,
          src: options.src,
        });
        break;

      case 'svg':
        if (!options.svgContent) {
          return { success: false, message: 'SVG 컨텐츠가 필요합니다' };
        }
        // SVG를 data URL로 변환
        const svgDataUrl = `data:image/svg+xml;base64,${btoa(options.svgContent)}`;
        element = page.addElement({
          type: 'svg',
          ...defaults,
          src: svgDataUrl,
        });
        break;

      case 'figure':
        element = page.addElement({
          type: 'figure',
          ...defaults,
          fill: options.fill || '#4F46E5',
        });
        break;

      default:
        return { success: false, message: `지원하지 않는 요소 타입: ${options.type}` };
    }

    console.log('[CanvasOperations] Element added:', element?.id);
    return { success: true, message: '요소가 추가되었습니다', elementId: element?.id };
  } catch (error) {
    console.error('[CanvasOperations] Error adding element:', error);
    return { success: false, message: `요소 추가 실패: ${error}` };
  }
}

/**
 * 선택된 요소 업데이트
 */
export function updateSelectedElements(options: UpdateElementOptions): CanvasOperationResult {
  const store = getStore();
  if (!store) {
    return { success: false, message: 'Canvas가 준비되지 않았습니다' };
  }

  const selectedIds = store.selectedElementsIds || [];
  if (selectedIds.length === 0) {
    return { success: false, message: '선택된 요소가 없습니다' };
  }

  const page = getActivePage();
  if (!page) {
    return { success: false, message: '활성 페이지가 없습니다' };
  }

  try {
    let updatedCount = 0;

    for (const id of selectedIds) {
      const element = page.children?.find((el: any) => el.id === id);
      if (element) {
        // 공통 속성
        if (options.x !== undefined) element.set({ x: options.x });
        if (options.y !== undefined) element.set({ y: options.y });
        if (options.width !== undefined) element.set({ width: options.width });
        if (options.height !== undefined) element.set({ height: options.height });
        if (options.rotation !== undefined) element.set({ rotation: options.rotation });
        if (options.opacity !== undefined) element.set({ opacity: options.opacity });

        // 텍스트 전용 속성
        if (element.type === 'text') {
          if (options.text !== undefined) element.set({ text: options.text });
          if (options.fontSize !== undefined) element.set({ fontSize: options.fontSize });
          if (options.fontFamily !== undefined) element.set({ fontFamily: options.fontFamily });
          if (options.fontWeight !== undefined) element.set({ fontWeight: options.fontWeight });
          if (options.fill !== undefined) element.set({ fill: options.fill });
          if (options.align !== undefined) element.set({ align: options.align });
        }

        // 이미지 전용 속성
        if (element.type === 'image' && options.src !== undefined) {
          element.set({ src: options.src });
        }

        updatedCount++;
      }
    }

    console.log('[CanvasOperations] Updated elements:', updatedCount);
    return { success: true, message: `${updatedCount}개 요소가 업데이트되었습니다` };
  } catch (error) {
    console.error('[CanvasOperations] Error updating elements:', error);
    return { success: false, message: `요소 업데이트 실패: ${error}` };
  }
}

/**
 * 선택된 요소 삭제
 */
export function deleteSelectedElements(): CanvasOperationResult {
  const store = getStore();
  if (!store) {
    return { success: false, message: 'Canvas가 준비되지 않았습니다' };
  }

  const selectedIds = store.selectedElementsIds || [];
  if (selectedIds.length === 0) {
    return { success: false, message: '선택된 요소가 없습니다' };
  }

  try {
    store.deleteElements(selectedIds);
    console.log('[CanvasOperations] Deleted elements:', selectedIds.length);
    return { success: true, message: `${selectedIds.length}개 요소가 삭제되었습니다` };
  } catch (error) {
    console.error('[CanvasOperations] Error deleting elements:', error);
    return { success: false, message: `요소 삭제 실패: ${error}` };
  }
}

/**
 * 요소 복제
 */
export function duplicateSelectedElements(): CanvasOperationResult {
  const store = getStore();
  if (!store) {
    return { success: false, message: 'Canvas가 준비되지 않았습니다' };
  }

  const selectedIds = store.selectedElementsIds || [];
  if (selectedIds.length === 0) {
    return { success: false, message: '선택된 요소가 없습니다' };
  }

  const page = getActivePage();
  if (!page) {
    return { success: false, message: '활성 페이지가 없습니다' };
  }

  try {
    const newIds: string[] = [];

    for (const id of selectedIds) {
      const element = page.children?.find((el: any) => el.id === id);
      if (element) {
        const json = element.toJSON();
        // 위치 오프셋
        json.x = (json.x || 0) + 20;
        json.y = (json.y || 0) + 20;
        delete json.id; // 새 ID 생성

        const newElement = page.addElement(json);
        if (newElement?.id) {
          newIds.push(newElement.id);
        }
      }
    }

    // 새로 생성된 요소 선택
    if (newIds.length > 0) {
      store.selectElements(newIds);
    }

    console.log('[CanvasOperations] Duplicated elements:', newIds.length);
    return { success: true, message: `${newIds.length}개 요소가 복제되었습니다` };
  } catch (error) {
    console.error('[CanvasOperations] Error duplicating elements:', error);
    return { success: false, message: `요소 복제 실패: ${error}` };
  }
}

// ============================================================================
// Text Operations
// ============================================================================

/**
 * 텍스트 추가 (헤드라인)
 */
export function addHeadline(text: string, options?: Partial<AddElementOptions>): CanvasOperationResult {
  const page = getActivePage();
  if (!page) {
    return { success: false, message: 'Canvas가 준비되지 않았습니다' };
  }

  const pageWidth = typeof page.width === 'number' ? page.width : 1080;

  return addElement({
    type: 'text',
    text,
    fontSize: 64,
    fontFamily: 'Pretendard',
    fontWeight: 'bold',
    fill: '#111827',
    align: 'center',
    x: (pageWidth - 800) / 2,
    y: 100,
    width: 800,
    height: 100,
    ...options,
  });
}

/**
 * 텍스트 추가 (본문)
 */
export function addBodyText(text: string, options?: Partial<AddElementOptions>): CanvasOperationResult {
  const page = getActivePage();
  if (!page) {
    return { success: false, message: 'Canvas가 준비되지 않았습니다' };
  }

  const pageWidth = typeof page.width === 'number' ? page.width : 1080;

  return addElement({
    type: 'text',
    text,
    fontSize: 24,
    fontFamily: 'Pretendard',
    fontWeight: 'normal',
    fill: '#374151',
    align: 'left',
    x: 100,
    y: 250,
    width: pageWidth - 200,
    height: 200,
    ...options,
  });
}

// ============================================================================
// Image Operations
// ============================================================================

/**
 * 이미지 추가
 */
export function addImage(src: string, options?: Partial<AddElementOptions>): CanvasOperationResult {
  const page = getActivePage();
  if (!page) {
    return { success: false, message: 'Canvas가 준비되지 않았습니다' };
  }

  const pageWidth = typeof page.width === 'number' ? page.width : 1080;
  const pageHeight = typeof page.height === 'number' ? page.height : 1080;
  const width = options?.width || 400;
  const height = options?.height || 400;

  return addElement({
    type: 'image',
    src,
    x: options?.x ?? (pageWidth - width) / 2,
    y: options?.y ?? (pageHeight - height) / 2,
    width,
    height,
    ...options,
  });
}

/**
 * 선택된 이미지 교체
 */
export function replaceSelectedImage(newSrc: string): CanvasOperationResult {
  const { selectedElements } = useStudioContextStore.getState();
  const imageElements = selectedElements.filter(e => e.type === 'image');

  if (imageElements.length === 0) {
    return { success: false, message: '선택된 이미지가 없습니다' };
  }

  return updateSelectedElements({ src: newSrc });
}

// ============================================================================
// Page Operations
// ============================================================================

/**
 * 새 페이지 추가
 */
export function addPage(options?: { width?: number; height?: number; background?: string }): CanvasOperationResult {
  const store = getStore();
  if (!store) {
    return { success: false, message: 'Canvas가 준비되지 않았습니다' };
  }

  try {
    const { currentTemplate, currentTheme } = useCanvasStore.getState();

    // ColorTheme에서 배경색 추출
    const backgroundColor = options?.background ||
      currentTheme?.solidColor ||
      currentTheme?.startColor ||
      '#FFFFFF';

    const newPage = store.addPage({
      width: options?.width || currentTemplate?.width || 1080,
      height: options?.height || currentTemplate?.height || 1080,
      background: backgroundColor,
    });

    console.log('[CanvasOperations] Page added:', newPage?.id);
    return { success: true, message: '새 페이지가 추가되었습니다', pageId: newPage?.id };
  } catch (error) {
    console.error('[CanvasOperations] Error adding page:', error);
    return { success: false, message: `페이지 추가 실패: ${error}` };
  }
}

/**
 * 페이지 삭제
 */
export function deletePage(pageId?: string): CanvasOperationResult {
  const store = getStore();
  if (!store) {
    return { success: false, message: 'Canvas가 준비되지 않았습니다' };
  }

  const targetPageId = pageId || store.activePage?.id;
  if (!targetPageId) {
    return { success: false, message: '삭제할 페이지가 없습니다' };
  }

  if (store.pages.length <= 1) {
    return { success: false, message: '마지막 페이지는 삭제할 수 없습니다' };
  }

  try {
    const page = store.pages.find((p: any) => p.id === targetPageId);
    if (page) {
      // Polotno page.remove() 대신 store.deletePages 사용
      store.deletePages([page.id]);
      console.log('[CanvasOperations] Page deleted:', targetPageId);
      return { success: true, message: '페이지가 삭제되었습니다' };
    }
    return { success: false, message: '페이지를 찾을 수 없습니다' };
  } catch (error) {
    console.error('[CanvasOperations] Error deleting page:', error);
    return { success: false, message: `페이지 삭제 실패: ${error}` };
  }
}

/**
 * 페이지 선택
 */
export function selectPage(pageIndex: number): CanvasOperationResult {
  const store = getStore();
  if (!store) {
    return { success: false, message: 'Canvas가 준비되지 않았습니다' };
  }

  if (pageIndex < 0 || pageIndex >= store.pages.length) {
    return { success: false, message: '유효하지 않은 페이지 번호입니다' };
  }

  try {
    const page = store.pages[pageIndex];
    store.selectPage(page.id);
    console.log('[CanvasOperations] Page selected:', page.id);
    return { success: true, message: `${pageIndex + 1}번 페이지로 이동했습니다`, pageId: page.id };
  } catch (error) {
    console.error('[CanvasOperations] Error selecting page:', error);
    return { success: false, message: `페이지 선택 실패: ${error}` };
  }
}

// ============================================================================
// History Operations
// ============================================================================

/**
 * 실행 취소
 */
export function undo(): CanvasOperationResult {
  const store = getStore();
  if (!store) {
    return { success: false, message: 'Canvas가 준비되지 않았습니다' };
  }

  try {
    if (store.history.canUndo) {
      store.history.undo();
      return { success: true, message: '실행 취소되었습니다' };
    }
    return { success: false, message: '실행 취소할 작업이 없습니다' };
  } catch (error) {
    console.error('[CanvasOperations] Error undoing:', error);
    return { success: false, message: `실행 취소 실패: ${error}` };
  }
}

/**
 * 다시 실행
 */
export function redo(): CanvasOperationResult {
  const store = getStore();
  if (!store) {
    return { success: false, message: 'Canvas가 준비되지 않았습니다' };
  }

  try {
    if (store.history.canRedo) {
      store.history.redo();
      return { success: true, message: '다시 실행되었습니다' };
    }
    return { success: false, message: '다시 실행할 작업이 없습니다' };
  } catch (error) {
    console.error('[CanvasOperations] Error redoing:', error);
    return { success: false, message: `다시 실행 실패: ${error}` };
  }
}

// ============================================================================
// Batch Operations (Chat에서 여러 작업 한번에 수행)
// ============================================================================

export interface BatchOperation {
  action: 'add' | 'update' | 'delete' | 'duplicate';
  options?: AddElementOptions | UpdateElementOptions;
}

/**
 * 여러 작업 일괄 수행
 */
export function executeBatch(operations: BatchOperation[]): CanvasOperationResult[] {
  const results: CanvasOperationResult[] = [];

  for (const op of operations) {
    switch (op.action) {
      case 'add':
        results.push(addElement(op.options as AddElementOptions));
        break;
      case 'update':
        results.push(updateSelectedElements(op.options as UpdateElementOptions));
        break;
      case 'delete':
        results.push(deleteSelectedElements());
        break;
      case 'duplicate':
        results.push(duplicateSelectedElements());
        break;
      default:
        results.push({ success: false, message: `알 수 없는 작업: ${op.action}` });
    }
  }

  return results;
}

// ============================================================================
// Export all operations
// ============================================================================

export const canvasOperations = {
  // Element
  addElement,
  updateSelectedElements,
  deleteSelectedElements,
  duplicateSelectedElements,
  // Text
  addHeadline,
  addBodyText,
  // Image
  addImage,
  replaceSelectedImage,
  // Page
  addPage,
  deletePage,
  selectPage,
  // History
  undo,
  redo,
  // Batch
  executeBatch,
};

export default canvasOperations;
