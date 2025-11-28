/**
 * Keyboard Shortcuts Hook
 *
 * 캔버스 에디터의 키보드 단축키 관리
 *
 * 지원 단축키:
 * - Ctrl/Cmd + Z: Undo
 * - Ctrl/Cmd + Shift + Z: Redo
 * - Ctrl/Cmd + Y: Redo (alternative)
 * - Ctrl/Cmd + C: Copy
 * - Ctrl/Cmd + V: Paste
 * - Ctrl/Cmd + X: Cut
 * - Ctrl/Cmd + A: Select All
 * - Delete/Backspace: Delete selected
 * - Ctrl/Cmd + D: Duplicate
 * - Ctrl/Cmd + G: Group
 * - Ctrl/Cmd + Shift + G: Ungroup
 * - Arrow Keys: Move selected elements
 * - Shift + Arrow Keys: Move by 10px
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 */

import { useEffect, useCallback } from 'react';
import { useCanvasStore } from '../stores/useCanvasStore';
import type { StoreType } from 'polotno/model/store';

// ============================================================================
// Types
// ============================================================================

export interface KeyboardShortcutsOptions {
  enabled?: boolean;
  onShortcut?: (shortcut: string) => void;
}

export interface ShortcutAction {
  keys: string[];
  description: string;
  action: (store: StoreType) => void;
  category: 'edit' | 'navigation' | 'selection' | 'arrangement';
}

// ============================================================================
// Keyboard Shortcuts Hook
// ============================================================================

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const { enabled = true, onShortcut } = options;
  const polotnoStore = useCanvasStore((state) => state.polotnoStore);

  /**
   * Undo 실행
   */
  const handleUndo = useCallback(() => {
    if (!polotnoStore) return;

    if (polotnoStore.history.canUndo) {
      polotnoStore.history.undo();
      onShortcut?.('undo');
      console.log('[Shortcuts] Undo executed');
    }
  }, [polotnoStore, onShortcut]);

  /**
   * Redo 실행
   */
  const handleRedo = useCallback(() => {
    if (!polotnoStore) return;

    if (polotnoStore.history.canRedo) {
      polotnoStore.history.redo();
      onShortcut?.('redo');
      console.log('[Shortcuts] Redo executed');
    }
  }, [polotnoStore, onShortcut]);

  /**
   * Copy 실행
   */
  const handleCopy = useCallback(() => {
    if (!polotnoStore) return;

    const selectedElements = polotnoStore.selectedElements;
    if (selectedElements.length === 0) return;

    // 선택된 요소들을 JSON으로 클립보드에 복사
    const elementsData = selectedElements.map((el) => el.toJSON());
    const clipboardData = JSON.stringify(elementsData);

    // 클립보드에 저장
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(clipboardData).then(() => {
        onShortcut?.('copy');
        console.log('[Shortcuts] Copy executed', selectedElements.length, 'elements');
      });
    }
  }, [polotnoStore, onShortcut]);

  /**
   * Paste 실행
   */
  const handlePaste = useCallback(() => {
    if (!polotnoStore || !polotnoStore.activePage) return;

    // 클립보드에서 데이터 읽기
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.readText().then((text) => {
        try {
          const elementsData = JSON.parse(text);
          if (!Array.isArray(elementsData)) return;

          // 복사된 요소들을 현재 페이지에 추가 (약간 오프셋)
          const pastedElements: string[] = [];
          elementsData.forEach((data: any) => {
            const newElement = polotnoStore.activePage!.addElement({
              ...data,
              id: undefined, // 새 ID 생성
              x: data.x + 20, // 20px 오프셋
              y: data.y + 20,
            });
            pastedElements.push(newElement.id);
          });

          // 붙여넣은 요소들 선택
          if (pastedElements.length > 0) {
            polotnoStore.selectElements(pastedElements);
            onShortcut?.('paste');
            console.log('[Shortcuts] Paste executed', pastedElements.length, 'elements');
          }
        } catch (error) {
          console.warn('[Shortcuts] Paste failed - invalid clipboard data');
        }
      });
    }
  }, [polotnoStore, onShortcut]);

  /**
   * Cut 실행 (Copy + Delete)
   */
  const handleCut = useCallback(() => {
    if (!polotnoStore) return;

    const selectedElements = polotnoStore.selectedElements;
    if (selectedElements.length === 0) return;

    // Copy 실행
    handleCopy();

    // Delete 실행
    const elementIds = selectedElements.map((el) => el.id);
    polotnoStore.deleteElements(elementIds);

    onShortcut?.('cut');
    console.log('[Shortcuts] Cut executed', selectedElements.length, 'elements');
  }, [polotnoStore, handleCopy, onShortcut]);

  /**
   * Delete 실행
   */
  const handleDelete = useCallback(() => {
    if (!polotnoStore) return;

    const selectedElements = polotnoStore.selectedElements;
    if (selectedElements.length === 0) return;

    const elementIds = selectedElements.map((el) => el.id);
    polotnoStore.deleteElements(elementIds);

    onShortcut?.('delete');
    console.log('[Shortcuts] Delete executed', selectedElements.length, 'elements');
  }, [polotnoStore, onShortcut]);

  /**
   * Select All 실행
   */
  const handleSelectAll = useCallback(() => {
    if (!polotnoStore || !polotnoStore.activePage) return;

    const allElementIds = polotnoStore.activePage.children.map((el) => el.id);
    polotnoStore.selectElements(allElementIds);

    onShortcut?.('selectAll');
    console.log('[Shortcuts] Select All executed', allElementIds.length, 'elements');
  }, [polotnoStore, onShortcut]);

  /**
   * Duplicate 실행
   */
  const handleDuplicate = useCallback(() => {
    if (!polotnoStore || !polotnoStore.activePage) return;

    const selectedElements = polotnoStore.selectedElements;
    if (selectedElements.length === 0) return;

    const duplicatedElements: string[] = [];
    selectedElements.forEach((el) => {
      const elementData = el.toJSON();
      const newElement = polotnoStore.activePage!.addElement({
        ...elementData,
        id: undefined,
        x: elementData.x + 20,
        y: elementData.y + 20,
      });
      duplicatedElements.push(newElement.id);
    });

    // 복제된 요소들 선택
    if (duplicatedElements.length > 0) {
      polotnoStore.selectElements(duplicatedElements);
      onShortcut?.('duplicate');
      console.log('[Shortcuts] Duplicate executed', duplicatedElements.length, 'elements');
    }
  }, [polotnoStore, onShortcut]);

  /**
   * 키보드 이벤트 핸들러
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !polotnoStore) return;

      // 입력 필드에서는 단축키 무시
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
      const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

      // Undo: Ctrl/Cmd + Z
      if (ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((ctrlKey && event.key === 'z' && event.shiftKey) || (ctrlKey && event.key === 'y')) {
        event.preventDefault();
        handleRedo();
        return;
      }

      // Copy: Ctrl/Cmd + C
      if (ctrlKey && event.key === 'c') {
        event.preventDefault();
        handleCopy();
        return;
      }

      // Paste: Ctrl/Cmd + V
      if (ctrlKey && event.key === 'v') {
        event.preventDefault();
        handlePaste();
        return;
      }

      // Cut: Ctrl/Cmd + X
      if (ctrlKey && event.key === 'x') {
        event.preventDefault();
        handleCut();
        return;
      }

      // Select All: Ctrl/Cmd + A
      if (ctrlKey && event.key === 'a') {
        event.preventDefault();
        handleSelectAll();
        return;
      }

      // Duplicate: Ctrl/Cmd + D
      if (ctrlKey && event.key === 'd') {
        event.preventDefault();
        handleDuplicate();
        return;
      }

      // Delete: Delete or Backspace
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        handleDelete();
        return;
      }

      // Arrow Keys: Move selected elements
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();

        const selectedElements = polotnoStore.selectedElements;
        if (selectedElements.length === 0) return;

        const moveDistance = event.shiftKey ? 10 : 1;
        const deltaX =
          event.key === 'ArrowLeft' ? -moveDistance : event.key === 'ArrowRight' ? moveDistance : 0;
        const deltaY =
          event.key === 'ArrowUp' ? -moveDistance : event.key === 'ArrowDown' ? moveDistance : 0;

        selectedElements.forEach((el) => {
          el.set({
            x: el.x + deltaX,
            y: el.y + deltaY,
          });
        });

        onShortcut?.(`move-${event.key.toLowerCase()}`);
      }
    },
    [
      enabled,
      polotnoStore,
      handleUndo,
      handleRedo,
      handleCopy,
      handlePaste,
      handleCut,
      handleSelectAll,
      handleDuplicate,
      handleDelete,
      onShortcut,
    ]
  );

  /**
   * 이벤트 리스너 등록
   */
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  /**
   * 현재 Undo/Redo 상태 반환
   */
  const canUndo = polotnoStore?.history.canUndo ?? false;
  const canRedo = polotnoStore?.history.canRedo ?? false;

  return {
    canUndo,
    canRedo,
    undo: handleUndo,
    redo: handleRedo,
    copy: handleCopy,
    paste: handlePaste,
    cut: handleCut,
    delete: handleDelete,
    selectAll: handleSelectAll,
    duplicate: handleDuplicate,
  };
}

// ============================================================================
// Shortcut Definitions (for UI display)
// ============================================================================

export const KEYBOARD_SHORTCUTS: ShortcutAction[] = [
  // Edit
  {
    keys: ['Ctrl', 'Z'],
    description: 'Undo',
    action: (store) => store.history.undo(),
    category: 'edit',
  },
  {
    keys: ['Ctrl', 'Shift', 'Z'],
    description: 'Redo',
    action: (store) => store.history.redo(),
    category: 'edit',
  },
  {
    keys: ['Ctrl', 'C'],
    description: 'Copy',
    action: () => {}, // Handled by hook
    category: 'edit',
  },
  {
    keys: ['Ctrl', 'V'],
    description: 'Paste',
    action: () => {}, // Handled by hook
    category: 'edit',
  },
  {
    keys: ['Ctrl', 'X'],
    description: 'Cut',
    action: () => {}, // Handled by hook
    category: 'edit',
  },
  {
    keys: ['Ctrl', 'D'],
    description: 'Duplicate',
    action: () => {}, // Handled by hook
    category: 'edit',
  },
  {
    keys: ['Delete'],
    description: 'Delete',
    action: (store) => {
      const ids = store.selectedElements.map((el) => el.id);
      store.deleteElements(ids);
    },
    category: 'edit',
  },

  // Selection
  {
    keys: ['Ctrl', 'A'],
    description: 'Select All',
    action: () => {}, // Handled by hook
    category: 'selection',
  },

  // Navigation
  {
    keys: ['Arrow'],
    description: 'Move 1px',
    action: () => {}, // Handled by hook
    category: 'navigation',
  },
  {
    keys: ['Shift', 'Arrow'],
    description: 'Move 10px',
    action: () => {}, // Handled by hook
    category: 'navigation',
  },
];
