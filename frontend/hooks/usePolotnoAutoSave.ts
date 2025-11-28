/**
 * usePolotnoAutoSave Hook
 *
 * Polotno Store 변경 감지 및 자동 저장
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 */

import { useEffect, useRef, useCallback } from 'react';
import { reaction } from 'mobx';
import { useAutoSave, type AutoSaveOptions, type SaveState } from '@/lib/sparklio/auto-save';
import type { SparklioDocument } from '@/lib/sparklio/document';

// ============================================================================
// Types
// ============================================================================

interface UsePolotnoAutoSaveOptions extends Omit<AutoSaveOptions, 'delay'> {
  /** Polotno Store 인스턴스 */
  polotnoStore: any;

  /** 문서 ID */
  documentId: string;

  /** 문서 메타데이터 */
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    category?: string;
  };

  /** Debounce 딜레이 (기본: 2000ms) */
  debounceDelay?: number;
}

export interface UsePolotnoAutoSaveReturn {
  /** 저장 상태 */
  saveState: SaveState;

  /** 수동 저장 트리거 */
  forceSave: () => Promise<void>;

  /** Auto-save 활성화/비활성화 */
  setEnabled: (enabled: boolean) => void;
}

// ============================================================================
// Hook
// ============================================================================

export function usePolotnoAutoSave(
  options: UsePolotnoAutoSaveOptions
): UsePolotnoAutoSaveReturn {
  const {
    polotnoStore,
    documentId,
    metadata = {},
    debounceDelay = 2000,
    enabled = true,
    onSave,
    onConflict,
  } = options;

  // Polotno Store JSON을 SparklioDocument로 변환하는 함수
  const convertToDocument = useCallback((): SparklioDocument => {
    if (!polotnoStore) {
      throw new Error('Polotno Store not initialized');
    }

    const canvasJson = polotnoStore.toJSON();

    return {
      id: documentId,
      type: 'canvas_studio',
      metadata: {
        title: metadata.title || 'Untitled Document',
        description: metadata.description || '',
        tags: metadata.tags || [],
        category: metadata.category || 'general',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      content: {
        polotno: canvasJson,
      },
    };
  }, [polotnoStore, documentId, metadata]);

  // useAutoSave hook 사용
  const {
    saveState,
    queueSave,
    forceSave: forceSaveInternal,
    setEnabled,
  } = useAutoSave(documentId, null, {
    enabled,
    delay: debounceDelay,
    onSave,
    onConflict,
  });

  // MobX reaction을 사용하여 Polotno Store 변경 감지
  useEffect(() => {
    if (!polotnoStore || !enabled) return;

    console.log('[usePolotnoAutoSave] Setting up MobX reaction for auto-save');

    // Polotno Store의 JSON이 변경될 때마다 호출
    const dispose = reaction(
      () => polotnoStore.toJSON(),
      (json) => {
        console.log('[usePolotnoAutoSave] Polotno Store changed, queuing save...');

        try {
          const document = convertToDocument();
          queueSave(document);
        } catch (error) {
          console.error('[usePolotnoAutoSave] Failed to convert document:', error);
        }
      },
      {
        // 디바운싱을 reaction에서 직접 처리하지 않음 (AutoSaveManager가 처리)
        // delay 옵션이 없으므로 매 변경마다 호출되지만, AutoSaveManager가 debounce 처리함
      }
    );

    return () => {
      console.log('[usePolotnoAutoSave] Cleaning up MobX reaction');
      dispose();
    };
  }, [polotnoStore, enabled, queueSave, convertToDocument]);

  // Force save 함수 (Document로 변환 후 저장)
  const forceSave = useCallback(async () => {
    try {
      const document = convertToDocument();

      // useAutoSave의 forceSave는 document를 받지 않으므로,
      // 직접 queueSave 후 즉시 실행
      await forceSaveInternal();
    } catch (error) {
      console.error('[usePolotnoAutoSave] Force save failed:', error);
      throw error;
    }
  }, [convertToDocument, forceSaveInternal]);

  return {
    saveState,
    forceSave,
    setEnabled,
  };
}
