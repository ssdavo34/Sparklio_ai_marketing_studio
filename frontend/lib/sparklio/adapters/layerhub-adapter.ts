/**
 * LayerHub Adapter
 *
 * Converts between SparklioDocument and LayerHub format
 * Handles all LayerHub-specific operations
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-21
 */

import { BaseAdapter } from './base-adapter';
import type {
  SparklioDocument,
  SparklioPage,
  SparklioObject,
  TextObject,
  ImageObject,
  ShapeObject,
  AICommand,
  ExportOptions,
  ImportOptions,
  isTextObject,
  isImageObject,
  isShapeObject,
  createDocument,
  createPage,
  createTextObject,
} from '../document';

// Type definitions for LayerHub
interface LayerHubEditor {
  scene: {
    objects: any[];
    activeObject?: any;
    selectedObjects?: any[];
  };
  history: {
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
  };
  canvas: {
    width: number;
    height: number;
    backgroundColor?: string;
  };
  toJSON: () => any;
  loadJSON: (json: any) => void;
  addObject: (object: any) => void;
  removeObject: (id: string) => void;
  updateObject: (id: string, updates: any) => void;
  getObjectById: (id: string) => any;
  setActiveObject: (id: string) => void;
  export: (options: any) => Promise<Blob>;
}

// ============================================================================
// LayerHub Adapter Implementation
// ============================================================================

export class LayerHubAdapter extends BaseAdapter {
  private editor: LayerHubEditor | null = null;

  // ============================================================================
  // Lifecycle
  // ============================================================================

  async initialize(editorInstance: any): Promise<void> {
    await super.initialize(editorInstance);
    this.editor = editorInstance as LayerHubEditor;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.editor) return;

    // TODO: Set up LayerHub event listeners
    // editor.on('change', () => this.handleEditorChange());
    // editor.on('selection:change', () => this.handleSelectionChange());
  }

  // ============================================================================
  // Document Operations
  // ============================================================================

  async loadDocument(document: SparklioDocument): Promise<void> {
    if (!this.editor) throw new Error('Adapter not initialized');

    this.state.loading = true;
    try {
      const layerHubData = this.toNative(document);
      this.editor.loadJSON(layerHubData);
      this.state.currentDocument = document;
      this.state.currentPageId = document.pages[0]?.id || null;
      this.emit('document:loaded', document);
    } catch (error) {
      this.state.error = (error as Error).message;
      this.emit('error', error);
      throw error;
    } finally {
      this.state.loading = false;
    }
  }

  getDocument(): SparklioDocument {
    if (!this.editor) throw new Error('Adapter not initialized');

    const layerHubData = this.editor.toJSON();
    return this.fromNative(layerHubData);
  }

  async createDocument(options?: any): Promise<SparklioDocument> {
    const doc = createDocument({
      title: options?.title || 'New Document',
      pages: [
        createPage({
          width: options?.width || 1920,
          height: options?.height || 1080,
        }),
      ],
    });

    await this.loadDocument(doc);
    return doc;
  }

  async saveDocument(): Promise<SparklioDocument> {
    const doc = this.getDocument();
    // TODO: Implement actual save logic
    this.emit('document:saved', doc);
    return doc;
  }

  // ============================================================================
  // Page Operations
  // ============================================================================

  async addPage(page?: Partial<SparklioPage>): Promise<string> {
    // LayerHub typically works with single canvas
    // Multi-page support would need custom implementation
    const newPage = createPage(page);
    this.emit('page:added', newPage);
    return newPage.id;
  }

  async removePage(pageId: string): Promise<void> {
    // TODO: Implement multi-page support
    this.emit('page:removed', pageId);
  }

  getCurrentPage(): SparklioPage | null {
    if (!this.editor) return null;

    return createPage({
      id: 'main',
      name: 'Main Canvas',
      width: this.editor.canvas.width,
      height: this.editor.canvas.height,
      backgroundColor: this.editor.canvas.backgroundColor,
      objects: this.getObjects(),
    });
  }

  async setCurrentPage(pageId: string): Promise<void> {
    // TODO: Implement multi-page support
    this.state.currentPageId = pageId;
    this.emit('page:changed', pageId);
  }

  async updatePage(pageId: string, updates: Partial<SparklioPage>): Promise<void> {
    if (!this.editor) return;

    if (updates.width !== undefined) {
      this.editor.canvas.width = updates.width;
    }
    if (updates.height !== undefined) {
      this.editor.canvas.height = updates.height;
    }
    if (updates.backgroundColor !== undefined) {
      this.editor.canvas.backgroundColor = updates.backgroundColor;
    }

    this.emit('page:changed', pageId);
  }

  async reorderPages(pageIds: string[]): Promise<void> {
    // TODO: Implement multi-page support
  }

  // ============================================================================
  // Object Operations
  // ============================================================================

  async addObject(object: Partial<SparklioObject>): Promise<string> {
    if (!this.editor) throw new Error('Adapter not initialized');

    const fullObject = this.createFullObject(object);
    const layerHubObject = this.objectToLayerHub(fullObject);

    this.editor.addObject(layerHubObject);
    this.emit('object:added', fullObject);

    return fullObject.id;
  }

  async removeObject(objectId: string): Promise<void> {
    if (!this.editor) throw new Error('Adapter not initialized');

    this.editor.removeObject(objectId);
    this.emit('object:removed', objectId);
  }

  async updateObject(objectId: string, updates: Partial<SparklioObject>): Promise<void> {
    if (!this.editor) throw new Error('Adapter not initialized');

    const layerHubUpdates = this.objectToLayerHub(updates as SparklioObject);
    this.editor.updateObject(objectId, layerHubUpdates);
    this.emit('object:modified', { id: objectId, updates });
  }

  getObject(objectId: string): SparklioObject | null {
    if (!this.editor) return null;

    const object = this.editor.getObjectById(objectId);
    return object ? this.objectFromLayerHub(object) : null;
  }

  getObjects(): SparklioObject[] {
    if (!this.editor) return [];

    return this.editor.scene.objects.map((obj: any) =>
      this.objectFromLayerHub(obj)
    );
  }

  // ============================================================================
  // Selection
  // ============================================================================

  selectObjects(objectIds: string[]): void {
    if (!this.editor) return;

    // LayerHub typically supports single selection
    if (objectIds.length > 0) {
      this.editor.setActiveObject(objectIds[0]);
    }

    this.state.selection = objectIds;
    this.emit('selection:changed', objectIds);
  }

  getSelectedObjects(): SparklioObject[] {
    if (!this.editor) return [];

    const selected = this.editor.scene.activeObject;
    return selected ? [this.objectFromLayerHub(selected)] : [];
  }

  clearSelection(): void {
    this.selectObjects([]);
  }

  // ============================================================================
  // AI Commands
  // ============================================================================

  async executeAICommand(command: AICommand): Promise<void> {
    switch (command.type) {
      case 'create':
        await this.executeCreateCommand(command);
        break;
      case 'modify':
        await this.executeModifyCommand(command);
        break;
      case 'delete':
        await this.executeDeleteCommand(command);
        break;
      case 'analyze':
        await this.executeAnalyzeCommand(command);
        break;
      default:
        throw new Error(`Unknown command type: ${command.type}`);
    }
  }

  private async executeCreateCommand(command: AICommand): Promise<void> {
    const { parameters } = command;
    if (!parameters) return;

    if (parameters.objectType === 'text' && parameters.content) {
      await this.addObject(createTextObject(parameters.content, {
        ...parameters.properties,
        x: parameters.position?.x,
        y: parameters.position?.y,
        width: parameters.size?.width,
        height: parameters.size?.height,
      }));
    }
    // TODO: Handle other object types
  }

  private async executeModifyCommand(command: AICommand): Promise<void> {
    const { context, parameters } = command;
    if (!context?.objectId || !parameters) return;

    await this.updateObject(context.objectId, parameters.properties || {});
  }

  private async executeDeleteCommand(command: AICommand): Promise<void> {
    const { context } = command;
    if (!context?.objectId) return;

    await this.removeObject(context.objectId);
  }

  private async executeAnalyzeCommand(command: AICommand): Promise<void> {
    // TODO: Implement analyze logic
  }

  getSuggestedCommands(): AICommand[] {
    return [
      {
        type: 'create',
        target: 'object',
        action: 'add-text',
        description: 'Add text to canvas',
        parameters: {
          objectType: 'text',
        },
      },
      {
        type: 'create',
        target: 'object',
        action: 'add-image',
        description: 'Add image to canvas',
        parameters: {
          objectType: 'image',
        },
      },
    ];
  }

  // ============================================================================
  // History
  // ============================================================================

  undo(): void {
    if (!this.editor?.history) return;
    this.editor.history.undo();
  }

  redo(): void {
    if (!this.editor?.history) return;
    this.editor.history.redo();
  }

  canUndo(): boolean {
    return this.editor?.history?.canUndo() || false;
  }

  canRedo(): boolean {
    return this.editor?.history?.canRedo() || false;
  }

  // ============================================================================
  // Export/Import
  // ============================================================================

  async export(options: ExportOptions): Promise<Blob | string> {
    if (!this.editor) throw new Error('Adapter not initialized');

    switch (options.format) {
      case 'json':
        return JSON.stringify(this.getDocument());

      case 'png':
      case 'jpg':
        return await this.editor.export({
          format: options.format,
          quality: options.quality,
          scale: options.scale,
        });

      default:
        throw new Error(`Export format '${options.format}' not supported`);
    }
  }

  async import(data: File | Blob | string, options: ImportOptions): Promise<void> {
    // TODO: Implement import logic
  }

  // ============================================================================
  // Conversion Helpers
  // ============================================================================

  fromNative(layerHubData: any): SparklioDocument {
    return createDocument({
      pages: [
        createPage({
          id: 'main',
          name: 'Main Canvas',
          width: layerHubData.width || 1920,
          height: layerHubData.height || 1080,
          backgroundColor: layerHubData.background,
          objects: layerHubData.objects?.map((obj: any) =>
            this.objectFromLayerHub(obj)
          ) || [],
        }),
      ],
    });
  }

  toNative(document: SparklioDocument): any {
    const page = document.pages[0];
    if (!page) return {};

    return {
      width: page.width,
      height: page.height,
      background: page.backgroundColor,
      objects: page.objects.map(obj => this.objectToLayerHub(obj)),
    };
  }

  private objectFromLayerHub(layerHubObject: any): SparklioObject {
    const base = {
      id: layerHubObject.id,
      x: layerHubObject.left || 0,
      y: layerHubObject.top || 0,
      width: layerHubObject.width || 100,
      height: layerHubObject.height || 100,
      transform: {
        rotation: layerHubObject.angle || 0,
        scaleX: layerHubObject.scaleX || 1,
        scaleY: layerHubObject.scaleY || 1,
      },
      opacity: layerHubObject.opacity,
      visible: layerHubObject.visible !== false,
      locked: layerHubObject.locked || false,
    };

    switch (layerHubObject.type) {
      case 'StaticText':
      case 'DynamicText':
        return {
          ...base,
          type: 'text',
          text: layerHubObject.text || '',
          fontSize: layerHubObject.fontSize,
          fontFamily: layerHubObject.fontFamily,
          color: layerHubObject.fill,
          textAlign: layerHubObject.textAlign,
        } as TextObject;

      case 'StaticImage':
      case 'DynamicImage':
        return {
          ...base,
          type: 'image',
          src: layerHubObject.src || '',
        } as ImageObject;

      case 'StaticPath':
      case 'DynamicPath':
        return {
          ...base,
          type: 'shape',
          shapeType: 'polygon',
          fill: layerHubObject.fill,
          stroke: layerHubObject.stroke,
          strokeWidth: layerHubObject.strokeWidth,
        } as ShapeObject;

      default:
        return {
          ...base,
          type: 'shape',
          shapeType: 'rectangle',
          fill: layerHubObject.fill,
        } as ShapeObject;
    }
  }

  private objectToLayerHub(object: SparklioObject): any {
    const base = {
      id: object.id,
      left: object.x,
      top: object.y,
      width: object.width,
      height: object.height,
      angle: object.transform?.rotation || 0,
      scaleX: object.transform?.scaleX || 1,
      scaleY: object.transform?.scaleY || 1,
      opacity: object.opacity,
      visible: object.visible,
      locked: object.locked,
    };

    if (isTextObject(object)) {
      return {
        ...base,
        type: 'StaticText',
        text: object.text,
        fontSize: object.fontSize,
        fontFamily: object.fontFamily,
        fill: object.color,
        textAlign: object.textAlign,
      };
    }

    if (isImageObject(object)) {
      return {
        ...base,
        type: 'StaticImage',
        src: object.src,
      };
    }

    if (isShapeObject(object)) {
      return {
        ...base,
        type: 'StaticPath',
        fill: object.fill,
        stroke: object.stroke,
        strokeWidth: object.strokeWidth,
      };
    }

    return base;
  }

  private createFullObject(partial: Partial<SparklioObject>): SparklioObject {
    const type = partial.type || 'text';

    switch (type) {
      case 'text':
        return createTextObject((partial as any).text || 'New Text', partial);

      // TODO: Add other object types
      default:
        return createTextObject('New Object', partial);
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export async function createLayerHubAdapter(editorInstance: any): Promise<LayerHubAdapter> {
  const adapter = new LayerHubAdapter();
  await adapter.initialize(editorInstance);
  return adapter;
}