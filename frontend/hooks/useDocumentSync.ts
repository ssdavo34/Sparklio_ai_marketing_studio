/**
 * Document Sync Hook
 *
 * Polotno Store와 Backend Document API 동기화
 * - 자동 저장 (Auto-save)
 * - 수동 저장
 * - 문서 로드
 * - 저장 상태 표시
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { StoreType } from 'polotno/model/store';
import type { SparklioDocument } from '@/lib/sparklio/document';
import { toSparklioDocument, fromSparklioDocument } from '@/lib/sparklio/polotno-to-document';
import { getDocumentAPI } from '@/lib/api/document-api';

// ============================================================================
// Types
// ============================================================================

export interface DocumentSyncOptions {
  documentId: string;
  polotnoStore: StoreType | null;
  autoSaveEnabled?: boolean;
  autoSaveDelay?: number; // milliseconds
  onSaveSuccess?: (document: SparklioDocument) => void;
  onSaveError?: (error: Error) => void;
  onLoadSuccess?: (document: SparklioDocument) => void;
  onLoadError?: (error: Error) => void;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface DocumentSyncState {
  status: SaveStatus;
  lastSaved: Date | null;
  lastError: Error | null;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
}

export interface UseDocumentSyncReturn {
  state: DocumentSyncState;
  save: () => Promise<void>;
  load: () => Promise<void>;
  setAutoSave: (enabled: boolean) => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useDocumentSync(
  options: DocumentSyncOptions
): UseDocumentSyncReturn {
  const {
    documentId,
    polotnoStore,
    autoSaveEnabled = true,
    autoSaveDelay = 2000,
    onSaveSuccess,
    onSaveError,
    onLoadSuccess,
    onLoadError,
  } = options;

  // State
  const [state, setState] = useState<DocumentSyncState>({
    status: 'idle',
    lastSaved: null,
    lastError: null,
    isLoading: false,
    hasUnsavedChanges: false,
  });

  // Refs
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoSaveEnabledRef = useRef(autoSaveEnabled);
  const lastSaveContentRef = useRef<string | null>(null);

  // Document API
  const documentAPI = getDocumentAPI();

  /**
   * 저장 실행
   */
  const save = useCallback(async () => {
    if (!polotnoStore) {
      console.warn('[DocumentSync] No Polotno store available');
      return;
    }

    setState((prev) => ({ ...prev, status: 'saving' }));

    try {
      // Polotno → SparklioDocument 변환
      const document = toSparklioDocument(
        polotnoStore,
        documentId,
        'Untitled Document', // TODO: Get from UI
        'presentation'
      );

      // Backend에 저장
      await documentAPI.update(documentId, { document });

      // 저장 성공
      const now = new Date();
      setState({
        status: 'saved',
        lastSaved: now,
        lastError: null,
        isLoading: false,
        hasUnsavedChanges: false,
      });

      // 저장된 콘텐츠 기록
      lastSaveContentRef.current = JSON.stringify(polotnoStore.toJSON());

      // 콜백 호출
      onSaveSuccess?.(document);

      // 2초 후 idle로 전환
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          status: prev.status === 'saved' ? 'idle' : prev.status,
        }));
      }, 2000);

      console.log('[DocumentSync] Document saved:', documentId);
    } catch (error) {
      console.error('[DocumentSync] Save failed:', error);

      setState((prev) => ({
        ...prev,
        status: 'error',
        lastError: error as Error,
        hasUnsavedChanges: true,
      }));

      onSaveError?.(error as Error);
    }
  }, [polotnoStore, documentId, documentAPI, onSaveSuccess, onSaveError]);

  /**
   * 문서 로드
   */
  const load = useCallback(async () => {
    if (!polotnoStore) {
      console.warn('[DocumentSync] No Polotno store available');
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, lastError: null }));

    try {
      // Backend에서 문서 가져오기
      const document = await documentAPI.get(documentId);

      // SparklioDocument → Polotno 변환
      fromSparklioDocument(polotnoStore, document);

      // 로드 성공
      setState({
        status: 'idle',
        lastSaved: document.metadata.updatedAt ? new Date(document.metadata.updatedAt) : null,
        lastError: null,
        isLoading: false,
        hasUnsavedChanges: false,
      });

      // 로드된 콘텐츠 기록
      lastSaveContentRef.current = JSON.stringify(polotnoStore.toJSON());

      // 콜백 호출
      onLoadSuccess?.(document);

      console.log('[DocumentSync] Document loaded:', documentId);
    } catch (error) {
      console.error('[DocumentSync] Load failed:', error);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        lastError: error as Error,
      }));

      onLoadError?.(error as Error);
    }
  }, [polotnoStore, documentId, documentAPI, onLoadSuccess, onLoadError]);

  /**
   * Auto-save 활성화/비활성화
   */
  const setAutoSave = useCallback((enabled: boolean) => {
    isAutoSaveEnabledRef.current = enabled;
    console.log('[DocumentSync] Auto-save', enabled ? 'enabled' : 'disabled');
  }, []);

  /**
   * Polotno Store 변경 감지 및 Auto-save
   */
  useEffect(() => {
    if (!polotnoStore || !isAutoSaveEnabledRef.current) return;

    // Store 변경 이벤트 리스너
    const handleStoreChange = () => {
      // 현재 상태 직렬화
      const currentContent = JSON.stringify(polotnoStore.toJSON());

      // 이전 저장과 비교
      if (currentContent === lastSaveContentRef.current) {
        return; // 변경 없음
      }

      // 변경 감지
      setState((prev) => ({ ...prev, hasUnsavedChanges: true }));

      // Auto-save 타이머 설정
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        save();
      }, autoSaveDelay);
    };

    // MobX reaction으로 Store 변경 감지
    const disposer = polotnoStore.on('change', handleStoreChange);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      disposer();
    };
  }, [polotnoStore, autoSaveDelay, save]);

  /**
   * 초기 로드
   */
  useEffect(() => {
    if (polotnoStore && documentId) {
      load();
    }
  }, [polotnoStore, documentId]); // load는 deps에 포함하지 않음 (무한 루프 방지)

  return {
    state,
    save,
    load,
    setAutoSave,
  };
}
