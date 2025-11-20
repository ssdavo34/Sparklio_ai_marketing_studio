/**
 * EditorAPI Interface
 *
 * Common API interface for all editor implementations
 * Provides a unified way to interact with different editor engines
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 */

import type {
    SparklioDocument,
    SparklioPage,
    SparklioObject,
    AICommand,
    AIResponse,
    ExportOptions,
    ImportOptions,
} from '@/models/SparklioDocument';

// ============================================================================
// Editor Events
// ============================================================================

export interface EditorEvents {
    onReady: () => void;
    onDocumentChange: (document: SparklioDocument) => void;
    onPageChange: (pageId: string) => void;
    onSelectionChange: (selectedIds: string[]) => void;
    onObjectAdd: (object: SparklioObject) => void;
    onObjectUpdate: (object: SparklioObject) => void;
    onObjectDelete: (objectId: string) => void;
    onError: (error: Error) => void;
    onSave: (document: SparklioDocument) => void;
    onExport: (data: Blob, format: string) => void;
}

// ============================================================================
// Editor State
// ============================================================================

export interface EditorState {
    document: SparklioDocument | null;
    currentPageId: string | null;
    selectedObjectIds: string[];
    isLoading: boolean;
    isSaving: boolean;
    hasUnsavedChanges: boolean;
    zoom: number;
    viewport: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

// ============================================================================
// Editor Capabilities
// ============================================================================

export interface EditorCapabilities {
    supportsMultiPage: boolean;
    supportsAnimation: boolean;
    supportsVideo: boolean;
    supportsCharts: boolean;
    supportsTables: boolean;
    supportsCollaboration: boolean;
    supportsVersioning: boolean;
    supportsPlugins: boolean;
    maxPageSize: { width: number; height: number };
    supportedExportFormats: string[];
    supportedImportFormats: string[];
}

// ============================================================================
// Main Editor API
// ============================================================================

export interface EditorAPI {
    // ========================================
    // Initialization
    // ========================================

    /**
     * Initialize the editor with optional configuration
     */
    initialize(config?: EditorConfig): Promise<void>;

    /**
     * Destroy the editor and clean up resources
     */
    destroy(): void;

    /**
     * Get editor capabilities
     */
    getCapabilities(): EditorCapabilities;

    // ========================================
    // Document Management
    // ========================================

    /**
     * Load a document into the editor
     */
    loadDocument(document: SparklioDocument): Promise<void>;

    /**
     * Get the current document
     */
    getDocument(): SparklioDocument | null;

    /**
     * Create a new document
     */
    newDocument(options?: {
        mode?: SparklioDocument['mode'];
        width?: number;
        height?: number;
    }): Promise<void>;

    /**
     * Save the current document
     */
    saveDocument(): Promise<SparklioDocument>;

    /**
     * Export document in specified format
     */
    exportDocument(options: ExportOptions): Promise<Blob>;

    /**
     * Import document from file
     */
    importDocument(file: File, options?: ImportOptions): Promise<void>;

    // ========================================
    // Page Management
    // ========================================

    /**
     * Add a new page
     */
    addPage(page?: Partial<SparklioPage>): void;

    /**
     * Update page properties
     */
    updatePage(pageId: string, updates: Partial<SparklioPage>): void;

    /**
     * Delete a page
     */
    deletePage(pageId: string): void;

    /**
     * Duplicate a page
     */
    duplicatePage(pageId: string): void;

    /**
     * Navigate to a specific page
     */
    navigateToPage(pageId: string): void;

    /**
     * Reorder pages
     */
    reorderPages(pageIds: string[]): void;

    // ========================================
    // Object Management
    // ========================================

    /**
     * Add an object to the current page
     */
    addObject(object: Partial<SparklioObject>): void;

    /**
     * Update object properties
     */
    updateObject(objectId: string, updates: Partial<SparklioObject>): void;

    /**
     * Delete object(s)
     */
    deleteObjects(objectIds: string[]): void;

    /**
     * Duplicate object(s)
     */
    duplicateObjects(objectIds: string[]): void;

    /**
     * Group objects
     */
    groupObjects(objectIds: string[]): void;

    /**
     * Ungroup objects
     */
    ungroupObjects(groupId: string): void;

    // ========================================
    // Selection
    // ========================================

    /**
     * Select objects
     */
    selectObjects(objectIds: string[]): void;

    /**
     * Select all objects on current page
     */
    selectAll(): void;

    /**
     * Clear selection
     */
    clearSelection(): void;

    /**
     * Get selected objects
     */
    getSelectedObjects(): SparklioObject[];

    // ========================================
    // Viewport & Navigation
    // ========================================

    /**
     * Set zoom level
     */
    setZoom(zoom: number): void;

    /**
     * Fit content to viewport
     */
    fitToScreen(): void;

    /**
     * Pan to specific position
     */
    panTo(x: number, y: number): void;

    /**
     * Center specific object(s)
     */
    centerObjects(objectIds?: string[]): void;

    // ========================================
    // History
    // ========================================

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

    /**
     * Clear history
     */
    clearHistory(): void;

    // ========================================
    // AI Integration
    // ========================================

    /**
     * Execute AI command
     */
    executeAICommand(command: AICommand): Promise<AIResponse>;

    /**
     * Get AI suggestions based on context
     */
    getAISuggestions(context?: {
        pageId?: string;
        objectIds?: string[];
    }): Promise<AICommand[]>;

    // ========================================
    // Brand Kit
    // ========================================

    /**
     * Apply brand kit to document
     */
    applyBrandKit(brandKit: SparklioDocument['brandKit']): void;

    /**
     * Extract brand kit from document
     */
    extractBrandKit(): SparklioDocument['brandKit'];

    // ========================================
    // State & Events
    // ========================================

    /**
     * Get current editor state
     */
    getState(): EditorState;

    /**
     * Subscribe to editor events
     */
    on<K extends keyof EditorEvents>(
        event: K,
        handler: EditorEvents[K]
    ): void;

    /**
     * Unsubscribe from editor events
     */
    off<K extends keyof EditorEvents>(
        event: K,
        handler: EditorEvents[K]
    ): void;

    /**
     * Emit event
     */
    emit<K extends keyof EditorEvents>(
        event: K,
        ...args: Parameters<EditorEvents[K]>
    ): void;
}

// ============================================================================
// Editor Configuration
// ============================================================================

export interface EditorConfig {
    apiKey?: string;
    theme?: 'light' | 'dark' | 'auto';
    locale?: string;
    features?: {
        aiAssistant?: boolean;
        brandKit?: boolean;
        collaboration?: boolean;
        autoSave?: boolean;
        versionControl?: boolean;
    };
    customTools?: any[]; // Engine-specific custom tools
    plugins?: any[];     // Engine-specific plugins
}

// ============================================================================
// Editor Factory
// ============================================================================

export type EditorEngine = 'polotno' | 'konva' | 'layerhub';

export interface EditorFactory {
    /**
     * Create an editor instance for the specified engine
     */
    createEditor(engine: EditorEngine, container: HTMLElement): EditorAPI;

    /**
     * Check if engine is available
     */
    isEngineAvailable(engine: EditorEngine): boolean;

    /**
     * Get default configuration for engine
     */
    getDefaultConfig(engine: EditorEngine): EditorConfig;
}