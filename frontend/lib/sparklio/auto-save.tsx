/**
 * Auto-Save System
 *
 * Manages automatic document saving with debouncing and conflict resolution
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-21
 */

import type { SparklioDocument } from './document';
import { getDocumentAPI } from '../api/document-api';

// ============================================================================
// Types
// ============================================================================

export interface AutoSaveOptions {
  enabled?: boolean;
  delay?: number; // Debounce delay in milliseconds
  onSave?: (success: boolean, error?: Error) => void;
  onConflict?: (localDoc: SparklioDocument, serverDoc: SparklioDocument) => SparklioDocument;
}

export interface SaveState {
  status: 'idle' | 'pending' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  lastError?: Error;
  pendingChanges: boolean;
}

// ============================================================================
// Auto-Save Manager
// ============================================================================

export class AutoSaveManager {
  private documentId: string;
  private options: Required<AutoSaveOptions>;
  private saveTimer: NodeJS.Timeout | null = null;
  private saveState: SaveState = {
    status: 'idle',
    pendingChanges: false,
  };
  private listeners: Set<(state: SaveState) => void> = new Set();
  private lastSavedVersion: string | null = null;
  private isOnline: boolean = true;
  private offlineQueue: SparklioDocument[] = [];

  constructor(documentId: string, options: AutoSaveOptions = {}) {
    this.documentId = documentId;
    this.options = {
      enabled: options.enabled ?? true,
      delay: options.delay ?? 2000,
      onSave: options.onSave ?? (() => { }),
      onConflict: options.onConflict ?? ((local) => local),
    };

    this.setupOnlineListener();
  }

  /**
   * Queue document for auto-save
   */
  queueSave(document: SparklioDocument): void {
    if (!this.options.enabled) return;

    // Update state to pending
    this.updateState({
      status: 'pending',
      pendingChanges: true,
    });

    // Clear existing timer
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    // Set new timer
    this.saveTimer = setTimeout(() => {
      this.executeSave(document);
    }, this.options.delay);
  }

  /**
   * Force immediate save
   */
  async forceSave(document: SparklioDocument): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }

    await this.executeSave(document);
  }

  /**
   * Execute the save operation
   */
  private async executeSave(document: SparklioDocument): Promise<void> {
    this.updateState({ status: 'saving' });

    try {
      // Check if online
      if (!this.isOnline) {
        console.log('[AutoSave] Offline - queuing for later');
        this.offlineQueue.push(document);
        this.updateState({
          status: 'pending',
          pendingChanges: true,
        });
        return;
      }

      const documentAPI = getDocumentAPI();

      // Check for conflicts
      try {
        const serverDoc = await documentAPI.get(this.documentId);
        if (this.lastSavedVersion && serverDoc.metadata.updatedAt !== this.lastSavedVersion) {
          // Conflict detected
          console.log('[AutoSave] Conflict detected, resolving...');
          const resolved = this.options.onConflict(document, serverDoc);
          document = resolved;
        }
      } catch (error: any) {
        // If document doesn't exist on server, we'll create it
        if (error.status !== 404) {
          throw error;
        }
      }

      // Save document
      const saved = await documentAPI.update(this.documentId, { document });

      // Update last saved version
      this.lastSavedVersion = saved.metadata.updatedAt;

      // Update state
      this.updateState({
        status: 'saved',
        lastSaved: new Date(),
        pendingChanges: false,
        lastError: undefined,
      });

      // Callback
      this.options.onSave(true);

      // Auto-transition to idle after 2 seconds
      setTimeout(() => {
        if (this.saveState.status === 'saved') {
          this.updateState({ status: 'idle' });
        }
      }, 2000);

    } catch (error) {
      console.error('[AutoSave] Save failed:', error);

      // Update state
      this.updateState({
        status: 'error',
        lastError: error as Error,
        pendingChanges: true,
      });

      // Callback
      this.options.onSave(false, error as Error);

      // Queue for offline if network error
      if ((error as any).code === 'NETWORK_ERROR') {
        this.offlineQueue.push(document);
      }
    }
  }

  /**
   * Update save state and notify listeners
   */
  private updateState(updates: Partial<SaveState>): void {
    this.saveState = { ...this.saveState, ...updates };
    this.notifyListeners();
  }

  /**
   * Get current save state
   */
  getState(): SaveState {
    return { ...this.saveState };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: SaveState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.saveState);
    }
  }

  /**
   * Enable/disable auto-save
   */
  setEnabled(enabled: boolean): void {
    this.options.enabled = enabled;

    if (!enabled && this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
      this.updateState({ status: 'idle' });
    }
  }

  /**
   * Set auto-save delay
   */
  setDelay(delay: number): void {
    this.options.delay = delay;
  }

  /**
   * Setup online/offline listener
   */
  private setupOnlineListener(): void {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;

      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processOfflineQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  /**
   * Process queued documents when back online
   */
  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    console.log(`[AutoSave] Processing ${this.offlineQueue.length} queued documents`);

    // Take the most recent document
    const document = this.offlineQueue[this.offlineQueue.length - 1];
    this.offlineQueue = [];

    await this.executeSave(document);
  }

  /**
   * Clean up
   */
  destroy(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.listeners.clear();
  }
}

// ============================================================================
// React Hook
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface UseAutoSaveReturn {
  saveState: SaveState;
  queueSave: (document: SparklioDocument) => void;
  forceSave: () => Promise<void>;
  setEnabled: (enabled: boolean) => void;
}

export function useAutoSave(
  documentId: string,
  document: SparklioDocument | null,
  options: AutoSaveOptions = {}
): UseAutoSaveReturn {
  const [saveState, setSaveState] = useState<SaveState>({
    status: 'idle',
    pendingChanges: false,
  });

  const managerRef = useRef<AutoSaveManager | null>(null);
  const documentRef = useRef<SparklioDocument | null>(null);

  // Keep document ref up to date
  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  // Initialize manager
  useEffect(() => {
    const manager = new AutoSaveManager(documentId, {
      ...options,
      onSave: (success, error) => {
        options.onSave?.(success, error);
      },
    });

    managerRef.current = manager;

    // Subscribe to state changes
    const unsubscribe = manager.subscribe((state) => {
      setSaveState(state);
    });

    return () => {
      unsubscribe();
      manager.destroy();
    };
  }, [documentId]);

  // Queue save
  const queueSave = useCallback((doc: SparklioDocument) => {
    managerRef.current?.queueSave(doc);
  }, []);

  // Force save
  const forceSave = useCallback(async () => {
    if (documentRef.current) {
      await managerRef.current?.forceSave(documentRef.current);
    }
  }, []);

  // Set enabled
  const setEnabled = useCallback((enabled: boolean) => {
    managerRef.current?.setEnabled(enabled);
  }, []);

  return {
    saveState,
    queueSave,
    forceSave,
    setEnabled,
  };
}

// ============================================================================
// Save State Indicator Component
// ============================================================================

export interface SaveStateIndicatorProps {
  state: SaveState;
  className?: string;
}

export const SaveStateIndicator: React.FC<SaveStateIndicatorProps> = ({ state, className = '' }) => {
  const getIndicator = () => {
    switch (state.status) {
      case 'saving':
        return {
          text: '저장 중...',
          color: 'text-blue-600',
          icon: '⏳',
        };
      case 'saved':
        return {
          text: '저장됨',
          color: 'text-green-600',
          icon: '✓',
        };
      case 'error':
        return {
          text: '저장 실패',
          color: 'text-red-600',
          icon: '✗',
        };
      case 'pending':
        return {
          text: '변경사항 있음',
          color: 'text-amber-600',
          icon: '●',
        };
      default:
        return {
          text: '',
          color: 'text-slate-400',
          icon: '',
        };
    }
  };

  const indicator = getIndicator();

  if (!indicator.text) return null;

  return (
    <div className= {`flex items-center gap-2 text-sm ${indicator.color} ${className}`
}>
  <span>{ indicator.icon } </span>
  < span > { indicator.text } </span>
{
  state.lastSaved && (
    <span className="text-xs text-slate-400" >
      ({ formatRelativeTime(state.lastSaved) })
      </span>
      )
}
</div>
  );
};

// ============================================================================
// Utility Functions
// ============================================================================

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return '방금 전';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
  return `${Math.floor(seconds / 86400)}일 전`;
}
