/**
 * Base Adapter Interface
 *
 * Defines the contract for all editor adapters
 * Each adapter converts between SparklioDocument and engine-specific formats
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-21
 */

import type {
  SparklioDocument,
  SparklioPage,
  SparklioObject,
  AICommand,
  ExportOptions,
  ImportOptions,
} from '../document';

// ============================================================================
// Adapter Events
// ============================================================================

export type AdapterEventType =
  | 'document:loaded'
  | 'document:saved'
  | 'page:added'
  | 'page:removed'
  | 'page:changed'
  | 'object:added'
  | 'object:removed'
  | 'object:modified'
  | 'selection:changed'
  | 'error'
  | 'warning';

export interface AdapterEvent {
  type: AdapterEventType;
  data?: any;
  timestamp: number;
}

export type AdapterEventListener = (event: AdapterEvent) => void;

// ============================================================================
// Adapter State
// ============================================================================

export interface AdapterState {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  currentDocument: SparklioDocument | null;
  currentPageId: string | null;
  selection: string[];
  history: {
    canUndo: boolean;
    canRedo: boolean;
  };
}

// ============================================================================
// Base Adapter Interface
// ============================================================================

export interface IEditorAdapter {
  // ============================================================================
  // Lifecycle
  // ============================================================================

  /**
   * Initialize the adapter with the editor instance
   */
  initialize(editorInstance: any): Promise<void>;

  /**
   * Clean up resources
   */
  dispose(): void;

  /**
   * Get current adapter state
   */
  getState(): AdapterState;

  // ============================================================================
  // Document Operations
  // ============================================================================

  /**
   * Load a document into the editor
   */
  loadDocument(document: SparklioDocument): Promise<void>;

  /**
   * Get current document from the editor
   */
  getDocument(): SparklioDocument;

  /**
   * Create a new document
   */
  createDocument(options?: {
    title?: string;
    width?: number;
    height?: number;
    pageCount?: number;
  }): Promise<SparklioDocument>;

  /**
   * Save current document
   */
  saveDocument(): Promise<SparklioDocument>;

  // ============================================================================
  // Page Operations
  // ============================================================================

  /**
   * Add a new page
   */
  addPage(page?: Partial<SparklioPage>): Promise<string>;

  /**
   * Remove a page
   */
  removePage(pageId: string): Promise<void>;

  /**
   * Get current page
   */
  getCurrentPage(): SparklioPage | null;

  /**
   * Set current page
   */
  setCurrentPage(pageId: string): Promise<void>;

  /**
   * Update page properties
   */
  updatePage(pageId: string, updates: Partial<SparklioPage>): Promise<void>;

  /**
   * Reorder pages
   */
  reorderPages(pageIds: string[]): Promise<void>;

  // ============================================================================
  // Object Operations
  // ============================================================================

  /**
   * Add an object to current page
   */
  addObject(object: Partial<SparklioObject>): Promise<string>;

  /**
   * Remove an object
   */
  removeObject(objectId: string): Promise<void>;

  /**
   * Update object properties
   */
  updateObject(objectId: string, updates: Partial<SparklioObject>): Promise<void>;

  /**
   * Get object by ID
   */
  getObject(objectId: string): SparklioObject | null;

  /**
   * Get all objects on current page
   */
  getObjects(): SparklioObject[];

  // ============================================================================
  // Selection
  // ============================================================================

  /**
   * Select objects
   */
  selectObjects(objectIds: string[]): void;

  /**
   * Get selected objects
   */
  getSelectedObjects(): SparklioObject[];

  /**
   * Clear selection
   */
  clearSelection(): void;

  // ============================================================================
  // AI Commands
  // ============================================================================

  /**
   * Execute an AI command
   */
  executeAICommand(command: AICommand): Promise<void>;

  /**
   * Get suggested AI commands based on current context
   */
  getSuggestedCommands(): AICommand[];

  // ============================================================================
  // History
  // ============================================================================

  /**
   * Undo last action
   */
  undo(): void;

  /**
   * Redo last undone action
   */
  redo(): void;

  /**
   * Check if can undo
   */
  canUndo(): boolean;

  /**
   * Check if can redo
   */
  canRedo(): boolean;

  // ============================================================================
  // Export/Import
  // ============================================================================

  /**
   * Export document
   */
  export(options: ExportOptions): Promise<Blob | string>;

  /**
   * Import document
   */
  import(data: File | Blob | string, options: ImportOptions): Promise<void>;

  // ============================================================================
  // Events
  // ============================================================================

  /**
   * Subscribe to adapter events
   */
  on(event: AdapterEventType, listener: AdapterEventListener): void;

  /**
   * Unsubscribe from adapter events
   */
  off(event: AdapterEventType, listener: AdapterEventListener): void;

  /**
   * Emit an event
   */
  emit(event: AdapterEventType, data?: any): void;

  // ============================================================================
  // Utility
  // ============================================================================

  /**
   * Get native editor instance
   */
  getEditorInstance(): any;

  /**
   * Convert from native format to Sparklio format
   */
  fromNative(nativeData: any): SparklioDocument;

  /**
   * Convert from Sparklio format to native format
   */
  toNative(document: SparklioDocument): any;
}

// ============================================================================
// Abstract Base Adapter Class
// ============================================================================

export abstract class BaseAdapter implements IEditorAdapter {
  protected editorInstance: any = null;
  protected state: AdapterState = {
    initialized: false,
    loading: false,
    error: null,
    currentDocument: null,
    currentPageId: null,
    selection: [],
    history: {
      canUndo: false,
      canRedo: false,
    },
  };

  private eventListeners: Map<AdapterEventType, Set<AdapterEventListener>> = new Map();

  // ============================================================================
  // Lifecycle
  // ============================================================================

  async initialize(editorInstance: any): Promise<void> {
    this.editorInstance = editorInstance;
    this.state.initialized = true;
    this.emit('document:loaded');
  }

  dispose(): void {
    this.eventListeners.clear();
    this.editorInstance = null;
    this.state.initialized = false;
  }

  getState(): AdapterState {
    return { ...this.state };
  }

  // ============================================================================
  // Events
  // ============================================================================

  on(event: AdapterEventType, listener: AdapterEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off(event: AdapterEventType, listener: AdapterEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  emit(event: AdapterEventType, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const eventData: AdapterEvent = {
        type: event,
        data,
        timestamp: Date.now(),
      };
      listeners.forEach(listener => listener(eventData));
    }
  }

  // ============================================================================
  // Utility
  // ============================================================================

  getEditorInstance(): any {
    return this.editorInstance;
  }

  // ============================================================================
  // Abstract Methods (must be implemented by subclasses)
  // ============================================================================

  abstract loadDocument(document: SparklioDocument): Promise<void>;
  abstract getDocument(): SparklioDocument;
  abstract createDocument(options?: any): Promise<SparklioDocument>;
  abstract saveDocument(): Promise<SparklioDocument>;

  abstract addPage(page?: Partial<SparklioPage>): Promise<string>;
  abstract removePage(pageId: string): Promise<void>;
  abstract getCurrentPage(): SparklioPage | null;
  abstract setCurrentPage(pageId: string): Promise<void>;
  abstract updatePage(pageId: string, updates: Partial<SparklioPage>): Promise<void>;
  abstract reorderPages(pageIds: string[]): Promise<void>;

  abstract addObject(object: Partial<SparklioObject>): Promise<string>;
  abstract removeObject(objectId: string): Promise<void>;
  abstract updateObject(objectId: string, updates: Partial<SparklioObject>): Promise<void>;
  abstract getObject(objectId: string): SparklioObject | null;
  abstract getObjects(): SparklioObject[];

  abstract selectObjects(objectIds: string[]): void;
  abstract getSelectedObjects(): SparklioObject[];
  abstract clearSelection(): void;

  abstract executeAICommand(command: AICommand): Promise<void>;
  abstract getSuggestedCommands(): AICommand[];

  abstract undo(): void;
  abstract redo(): void;
  abstract canUndo(): boolean;
  abstract canRedo(): boolean;

  abstract export(options: ExportOptions): Promise<Blob | string>;
  abstract import(data: File | Blob | string, options: ImportOptions): Promise<void>;

  abstract fromNative(nativeData: any): SparklioDocument;
  abstract toNative(document: SparklioDocument): any;
}

// ============================================================================
// Helper Types
// ============================================================================

export type AdapterFactory = (editorInstance: any) => Promise<IEditorAdapter>;

export interface AdapterRegistry {
  polotno: AdapterFactory;
  layerhub: AdapterFactory;
  konva: AdapterFactory;
}

// ============================================================================
// Adapter Manager
// ============================================================================

export class AdapterManager {
  private static adapters: Map<string, IEditorAdapter> = new Map();
  private static factories: Map<string, AdapterFactory> = new Map();

  /**
   * Register an adapter factory
   */
  static register(name: string, factory: AdapterFactory): void {
    this.factories.set(name, factory);
  }

  /**
   * Create an adapter instance
   */
  static async create(name: string, editorInstance: any): Promise<IEditorAdapter> {
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Adapter '${name}' not registered`);
    }

    const adapter = await factory(editorInstance);
    this.adapters.set(name, adapter);
    return adapter;
  }

  /**
   * Get an existing adapter
   */
  static get(name: string): IEditorAdapter | null {
    return this.adapters.get(name) || null;
  }

  /**
   * Dispose an adapter
   */
  static dispose(name: string): void {
    const adapter = this.adapters.get(name);
    if (adapter) {
      adapter.dispose();
      this.adapters.delete(name);
    }
  }

  /**
   * Dispose all adapters
   */
  static disposeAll(): void {
    this.adapters.forEach(adapter => adapter.dispose());
    this.adapters.clear();
  }
}